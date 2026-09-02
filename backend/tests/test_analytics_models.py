import asyncio
import os
import time
import unittest
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import Mock, patch

from fastapi import HTTPException
from pydantic import ValidationError
from starlette.requests import Request


os.environ.setdefault("AWS_EC2_METADATA_DISABLED", "true")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")
os.environ.setdefault("AWS_DEFAULT_REGION", "eu-west-1")

from backend.src.backend_fastapi import (  # noqa: E402
    AnalyticsBatchRequest,
    AnalyticsEvent,
    _consume_burst_window,
    _network_fingerprint,
    _rate_limit_participant_source,
    _rate_limit_rules_for_request,
    _rate_limit_source,
    build_analytics_overview,
    enforce_zero_cost_burst_guard,
    infer_platform,
    normalize_analytics_event,
    require_analytics_admin,
    track_analytics_event,
    verify_cognito_id_token,
)
from backend.src import backend_fastapi as backend_module  # noqa: E402


def valid_event(**overrides):
    data = {
        "eventId": str(uuid.uuid4()),
        "eventName": "test_started",
        "occurredAt": 1785369600000,
        "schemaVersion": 1,
        "anonymousUserId": str(uuid.uuid4()),
        "sessionId": str(uuid.uuid4()),
        "installId": str(uuid.uuid4()),
        "platform": "web",
        "appVersion": "1.1.2",
        "language": "it",
        "timeZone": "Europe/Rome",
        "utm": {"utm_source": "test"},
        "properties": {"mode": "evaluation", "planned_dilemmas": 7},
    }
    data.update(overrides)
    return data


class AnalyticsModelTests(unittest.TestCase):
    def test_accepts_privacy_safe_event(self):
        event = AnalyticsEvent(**valid_event())

        self.assertEqual(event.eventName, "test_started")
        self.assertEqual(event.properties["planned_dilemmas"], 7)
        self.assertEqual(event.timeZone, "Europe/Rome")

    def test_normalizes_invalid_time_zone_to_none(self):
        # TASK-230: an invalid timeZone (e.g. an offset-style string instead
        # of an IANA name) no longer fails the whole request - it silently
        # becomes None, since it's optional attribution data and previously
        # dropped the entire batch of up to 25 events along with it.
        event = AnalyticsEvent(**valid_event(timeZone="Europe Rome!"))
        self.assertIsNone(event.timeZone)

        event = AnalyticsEvent(**valid_event(timeZone="GMT+03:00"))
        self.assertIsNone(event.timeZone)

    def test_legacy_events_use_the_selected_client_language_and_timezone(self):
        analytics_table = Mock()
        with (
            patch.object(backend_module, "analytics_table", analytics_table),
            patch.object(backend_module, "_network_fingerprint", return_value=None),
        ):
            track_analytics_event(
                session_id="session-1",
                action_type="vote_cast",
                language="en",
                client_language="it",
                time_zone="Europe/Rome",
            )

        stored = analytics_table.put_item.call_args.kwargs["Item"]
        self.assertEqual(stored["language"], "it")
        self.assertEqual(stored["timeZone"], "Europe/Rome")

    def test_rejects_sensitive_property_name(self):
        with self.assertRaises(ValidationError):
            AnalyticsEvent(**valid_event(properties={"email": "person@example.com"}))

    def test_rejects_unlisted_social_identifiers_in_properties(self):
        for key in ("public_id", "room_code", "previous_room_code"):
            with self.subTest(key=key):
                with self.assertRaises(ValidationError):
                    AnalyticsEvent(**valid_event(properties={key: "private-link-value"}))

    def test_accepts_only_origin_granularity_for_referrer(self):
        event = AnalyticsEvent(**valid_event(referrer="https://example.com"))
        self.assertEqual(event.referrer, "https://example.com")

        # TASK-230: a referrer with a path/query/non-http(s) scheme no longer
        # fails the whole request - it silently becomes None instead, since
        # it's optional attribution data and previously dropped the entire
        # batch of up to 25 events along with it.
        event = AnalyticsEvent(**valid_event(referrer="https://example.com/challenge/private-token"))
        self.assertIsNone(event.referrer)

        event = AnalyticsEvent(**valid_event(referrer="android-app://com.example.app"))
        self.assertIsNone(event.referrer)

    def test_rejects_unsafe_utm_value(self):
        with self.assertRaises(ValidationError):
            AnalyticsEvent(**valid_event(utm={"utm_campaign": "person@example.com"}))

    def test_rejects_nested_properties(self):
        with self.assertRaises(ValidationError):
            AnalyticsEvent(**valid_event(properties={"unsafe": {"nested": True}}))

    def test_does_not_reject_safe_words_containing_ip(self):
        event = AnalyticsEvent(**valid_event(properties={"relationship_type": "friend"}))

        self.assertEqual(event.properties["relationship_type"], "friend")

    def test_rejects_email_shaped_value_even_with_a_safe_key_name(self):
        # TASK-65: the key "note" doesn't contain any forbidden token, so
        # this must be caught by the property *value* looking like PII.
        with self.assertRaises(ValidationError):
            AnalyticsEvent(**valid_event(properties={"note": "person@example.com"}))

    def test_rejects_jwt_shaped_value_even_with_a_safe_key_name(self):
        fake_jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dGhpc2lzYWZha2VzaWduYXR1cmU"
        with self.assertRaises(ValidationError):
            AnalyticsEvent(**valid_event(properties={"note": fake_jwt}))

    def test_accepts_ordinary_string_value_with_a_dot(self):
        event = AnalyticsEvent(**valid_event(properties={"note": "v1.2.3-beta"}))

        self.assertEqual(event.properties["note"], "v1.2.3-beta")

    def test_rejects_oversized_batch(self):
        with self.assertRaises(ValidationError):
            AnalyticsBatchRequest(events=[valid_event() for _ in range(26)])

    def test_accepts_maximum_batch(self):
        batch = AnalyticsBatchRequest(events=[valid_event() for _ in range(25)])

        self.assertEqual(len(batch.events), 25)

    def test_malformed_referrer_or_timezone_no_longer_drops_the_whole_batch(self):
        # TASK-230: before this fix, either bad field on a single event
        # raised ValidationError for the whole AnalyticsBatchRequest,
        # discarding every other, otherwise-valid event in the same batch.
        batch = AnalyticsBatchRequest(events=[
            valid_event(),
            valid_event(referrer="https://example.com/some/path"),
            valid_event(timeZone="GMT+03:00"),
        ])

        self.assertEqual(len(batch.events), 3)
        self.assertEqual(batch.events[0].timeZone, "Europe/Rome")
        self.assertIsNone(batch.events[1].referrer)
        self.assertIsNone(batch.events[2].timeZone)


class AnalyticsOverviewTests(unittest.TestCase):
    def test_infers_android_only_for_native_webview(self):
        native_user_agent = "Mozilla/5.0 (Linux; Android 15; Pixel Build/ABC; wv) Chrome/130"
        browser_user_agent = "Mozilla/5.0 (Linux; Android 15; Pixel) Chrome/130 Mobile Safari"

        self.assertEqual(infer_platform(native_user_agent), "android")
        self.assertEqual(infer_platform(browser_user_agent), "web")

    def test_explicit_platform_wins_over_historical_inference(self):
        normalized = normalize_analytics_event(
            {
                "sessionId": "session-1",
                "timestamp": 1785369599000,
                "actionType": "vote_cast",
                "platform": "android",
                "userAgent": "desktop browser",
            },
            "legacy",
        )

        self.assertEqual(normalized["platform"], "android")
        self.assertEqual(normalized["platformResolution"], "exact")

    def test_combines_generations_without_exposing_raw_identity(self):
        now_ms = 1785369600000
        overview = build_analytics_overview(
            legacy_rows=[{
                "sessionId": "legacy-session",
                "timestamp": now_ms - 1000,
                "actionType": "dilemma_fetched",
                "userAgent": "Mozilla/5.0 (Linux; Android 15; Device; wv)",
                "actionData": '{"dilemma_id":"dilemma-1"}',
            }],
            product_rows=[{
                "eventId": str(uuid.uuid4()),
                "anonymousUserId": "anonymous-user",
                "sessionId": "product-session",
                "occurredAt": now_ms - 500,
                "actionType": "test_started",
                "platform": "web",
                "timeZone": "Europe/Rome",
                "properties": "{}",
            }],
            days=7,
            now_ms=now_ms,
        )

        self.assertEqual(overview["summary"]["totalEvents"], 2)
        self.assertEqual(overview["dataQuality"]["exactPlatformCoveragePct"], 50.0)
        self.assertEqual(overview["platformCounts"], {"android": 1, "web": 1})
        self.assertEqual(overview["timeZoneCounts"], {"unknown": 1, "Europe/Rome": 1})
        self.assertEqual(overview["dataQuality"]["timeZoneCoveragePct"], 50.0)
        self.assertNotEqual(overview["recentEvents"][0]["identity"], "anonymous-user")
        self.assertEqual(overview["topDilemmas"][0]["dilemmaId"], "dilemma-1")
        self.assertEqual(overview["abuseMonitoring"]["summary"]["suspicious"], 0)

    def test_daily_panel_combines_filtered_funnel_with_global_aggregate_only(self):
        now_ms = int(datetime(2026, 8, 10, 10, tzinfo=timezone.utc).timestamp() * 1000)
        anonymous_id = "daily-anonymous-user"
        product_rows = [
            {
                "eventId": str(uuid.uuid4()),
                "anonymousUserId": anonymous_id,
                "sessionId": "daily-session",
                "occurredAt": now_ms - 4000,
                "actionType": "daily_moral_crime_viewed",
                "platform": "web",
                "properties": "{}",
            },
            {
                "eventId": str(uuid.uuid4()),
                "anonymousUserId": anonymous_id,
                "sessionId": "daily-session",
                "occurredAt": now_ms - 3000,
                "actionType": "daily_moral_crime_vote_cast",
                "platform": "web",
                "properties": "{}",
            },
            {
                "eventId": str(uuid.uuid4()),
                "anonymousUserId": anonymous_id,
                "sessionId": "daily-session",
                "occurredAt": now_ms - 2000,
                "actionType": "daily_moral_crime_revealed",
                "platform": "web",
                "properties": "{}",
            },
            {
                "eventId": str(uuid.uuid4()),
                "anonymousUserId": anonymous_id,
                "sessionId": "daily-session",
                "occurredAt": now_ms - 1000,
                "actionType": "daily_moral_crime_audience_shared",
                "platform": "web",
                "properties": "{}",
            },
        ]

        overview = build_analytics_overview(
            legacy_rows=[],
            product_rows=product_rows,
            days=7,
            now_ms=now_ms,
            platform="web",
            daily_moral_crime_aggregates=[{
                "dayKey": "2026-08-10",
                "entryKey": "aggregate",
                "firstVotes": 7,
                "secondVotes": 3,
                "dilemmaBaseId": "must-not-leave-the-server",
            }],
        )

        daily = overview["dailyMoralCrime"]
        self.assertEqual(
            daily["eventFunnel"],
            [
                {"stage": "viewed", "identities": 1, "fromPreviousPct": None},
                {"stage": "voted", "identities": 1, "fromPreviousPct": 100.0},
                {"stage": "revealed", "identities": 1, "fromPreviousPct": 100.0},
                {"stage": "shared", "identities": 1, "fromPreviousPct": 100.0},
            ],
        )
        self.assertEqual(daily["currentAggregate"], {
            "available": True,
            "dayKey": "2026-08-10",
            "scope": "all_platforms",
            "firstVotes": 7,
            "secondVotes": 3,
            "totalVotes": 10,
            "firstPct": 70,
            "secondPct": 30,
        })
        self.assertNotIn(anonymous_id, str(daily))
        self.assertNotIn("must-not-leave-the-server", str(daily))

    def test_daily_aggregate_lookup_reads_only_the_current_aggregate_key(self):
        daily_votes_table = Mock()
        daily_votes_table.get_item.return_value = {"Item": {
            "dayKey": "2026-08-10",
            "entryKey": "aggregate",
            "firstVotes": 2,
            "secondVotes": 1,
        }}

        with (
            patch.object(backend_module, "daily_moral_crime_votes_table", daily_votes_table),
            patch.object(backend_module, "_daily_moral_crime_window", return_value={"dayKey": "2026-08-10"}),
        ):
            aggregates = backend_module._get_daily_moral_crime_current_aggregate()

        self.assertEqual(aggregates, [daily_votes_table.get_item.return_value["Item"]])
        daily_votes_table.get_item.assert_called_once_with(
            Key={"dayKey": "2026-08-10", "entryKey": "aggregate"},
            ProjectionExpression="dayKey, entryKey, firstVotes, secondVotes",
        )
        daily_votes_table.scan.assert_not_called()

    def test_party_room_panel_separates_participant_funnel_from_host_actions(self):
        now_ms = 1785369600000
        host_id = "party-host"
        joiner_id = "party-joiner"
        product_rows = [
            {"eventId": str(uuid.uuid4()), "anonymousUserId": host_id, "occurredAt": now_ms - 6000,
             "actionType": "party_room_create_clicked", "platform": "web", "properties": "{}"},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": host_id, "occurredAt": now_ms - 5000,
             "actionType": "party_room_entered", "platform": "web", "properties": "{}"},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": joiner_id, "occurredAt": now_ms - 4500,
             "actionType": "party_room_entered", "platform": "web", "properties": "{}"},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": host_id, "occurredAt": now_ms - 4000,
             "actionType": "party_room_started_ui", "platform": "web", "properties": "{}"},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": host_id, "occurredAt": now_ms - 3000,
             "actionType": "party_room_vote_submitted", "platform": "web", "properties": "{}"},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": joiner_id, "occurredAt": now_ms - 2500,
             "actionType": "party_room_vote_submitted", "platform": "web", "properties": "{}"},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": host_id, "occurredAt": now_ms - 2000,
             "actionType": "party_room_advanced_ui", "platform": "web", "properties": "{}"},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": host_id, "occurredAt": now_ms - 1000,
             "actionType": "party_room_recap_shared", "platform": "web", "properties": "{}"},
            # Outside the 7-day window and on a filtered-out platform - must not count anywhere below.
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "stale-user", "occurredAt": now_ms - (30 * 24 * 60 * 60 * 1000),
             "actionType": "party_room_entered", "platform": "web", "properties": "{}"},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "android-user", "occurredAt": now_ms - 500,
             "actionType": "party_room_entered", "platform": "android", "properties": "{}"},
        ]

        overview = build_analytics_overview(
            legacy_rows=[], product_rows=product_rows, days=7, now_ms=now_ms, platform="web",
        )
        party_room = overview["partyRoom"]

        self.assertEqual(party_room["eventFunnel"], [
            {"stage": "entered", "identities": 2, "fromPreviousPct": None},
            {"stage": "voted", "identities": 2, "fromPreviousPct": 100.0},
            {"stage": "shared", "identities": 1, "fromPreviousPct": 50.0},
        ])
        self.assertEqual(party_room["hostActions"], {
            "createClicked": 1, "started": 1, "advanced": 1, "rematchCreated": 0,
        })

    def test_moral_duel_panel_counts_distinct_identities_across_both_sides(self):
        now_ms = 1785369600000
        creator_id = "duel-creator"
        invitee_id = "duel-invitee"
        product_rows = [
            {"eventId": str(uuid.uuid4()), "anonymousUserId": creator_id, "occurredAt": now_ms - 5000,
             "actionType": "challenge_share_ready", "platform": "web", "properties": "{}"},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": invitee_id, "occurredAt": now_ms - 4000,
             "actionType": "challenge_landing_viewed", "platform": "web", "properties": "{}"},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": invitee_id, "occurredAt": now_ms - 3000,
             "actionType": "challenge_joined_client", "platform": "web", "properties": "{}"},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": invitee_id, "occurredAt": now_ms - 2000,
             "actionType": "challenge_completed_client", "platform": "web", "properties": "{}"},
        ]

        overview = build_analytics_overview(
            legacy_rows=[], product_rows=product_rows, days=7, now_ms=now_ms, platform="web",
        )

        self.assertEqual(overview["moralDuel"]["eventFunnel"], [
            {"stage": "challengeCreated", "identities": 1, "fromPreviousPct": None},
            {"stage": "landingViewed", "identities": 1, "fromPreviousPct": 100.0},
            {"stage": "joined", "identities": 1, "fromPreviousPct": 100.0},
            {"stage": "completed", "identities": 1, "fromPreviousPct": 100.0},
            {"stage": "compared", "identities": 0, "fromPreviousPct": 0.0},
        ])

    def test_interaction_breakdowns_cover_mode_share_and_login_ctr(self):
        now_ms = 1785369600000
        product_rows = [
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "user-1", "occurredAt": now_ms - 9000,
             "actionType": "mode_selected", "platform": "web", "properties": '{"mode": "evaluation"}'},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "user-2", "occurredAt": now_ms - 8000,
             "actionType": "mode_selected", "platform": "web", "properties": '{"mode": "evaluation"}'},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "user-3", "occurredAt": now_ms - 7000,
             "actionType": "mode_selected", "platform": "web", "properties": '{"mode": "party"}'},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "user-1", "occurredAt": now_ms - 6000,
             "actionType": "share_clicked", "platform": "web",
             "properties": '{"channel": "whatsapp", "object_type": "challenge"}'},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "user-2", "occurredAt": now_ms - 5000,
             "actionType": "share_clicked", "platform": "web",
             "properties": '{"channel": "whatsapp", "object_type": "challenge"}'},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "user-3", "occurredAt": now_ms - 4000,
             "actionType": "share_clicked", "platform": "web",
             "properties": '{"channel": "copy_link", "object_type": "result"}'},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "user-1", "occurredAt": now_ms - 3000,
             "actionType": "auth_prompt_shown", "platform": "web", "properties": '{"surface": "results_challenge"}'},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "user-2", "occurredAt": now_ms - 2000,
             "actionType": "auth_prompt_shown", "platform": "web", "properties": '{"surface": "results_challenge"}'},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "user-3", "occurredAt": now_ms - 1000,
             "actionType": "auth_prompt_shown", "platform": "web", "properties": '{"surface": "results_challenge"}'},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "user-1", "occurredAt": now_ms - 500,
             "actionType": "auth_prompt_clicked", "platform": "web", "properties": '{"surface": "results_challenge"}'},
        ]

        overview = build_analytics_overview(
            legacy_rows=[], product_rows=product_rows, days=7, now_ms=now_ms, platform="web",
        )
        breakdowns = overview["interactionBreakdowns"]

        self.assertEqual(breakdowns["modeSelected"], [
            {"mode": "evaluation", "count": 2},
            {"mode": "party", "count": 1},
        ])
        self.assertEqual(breakdowns["shareClicked"], [
            {"channel": "whatsapp", "objectType": "challenge", "count": 2},
            {"channel": "copy_link", "objectType": "result", "count": 1},
        ])
        self.assertEqual(breakdowns["authPromptCtr"], [
            {"surface": "results_challenge", "shown": 3, "clicked": 1, "clickThroughPct": 33.3},
        ])

    def test_viral_coefficient_joins_completions_to_channel_via_utm_not_token(self):
        now_ms = 1785369600000
        product_rows = [
            # 3 whatsapp share attempts, 2 copy_link attempts.
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "sharer-1", "occurredAt": now_ms - 9000,
             "actionType": "share_clicked", "platform": "web", "properties": '{"channel": "whatsapp"}'},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "sharer-2", "occurredAt": now_ms - 8000,
             "actionType": "share_clicked", "platform": "web", "properties": '{"channel": "whatsapp"}'},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "sharer-3", "occurredAt": now_ms - 7000,
             "actionType": "share_clicked", "platform": "web", "properties": '{"channel": "whatsapp"}'},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "sharer-4", "occurredAt": now_ms - 6000,
             "actionType": "share_clicked", "platform": "web", "properties": '{"channel": "copy_link"}'},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "sharer-5", "occurredAt": now_ms - 5000,
             "actionType": "share_clicked", "platform": "web", "properties": '{"channel": "copy_link"}'},
            # 2 completions arrived via a whatsapp-tagged link, 0 via copy_link,
            # 1 with no utm at all (must land in "untagged", never dropped).
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "invitee-1", "occurredAt": now_ms - 4000,
             "actionType": "challenge_completed_client", "platform": "web",
             "utm": '{"utm_source": "whatsapp", "utm_medium": "share", "utm_campaign": "duel_challenge"}'},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "invitee-2", "occurredAt": now_ms - 3000,
             "actionType": "challenge_completed_client", "platform": "web",
             "utm": '{"utm_source": "whatsapp", "utm_medium": "share", "utm_campaign": "duel_challenge"}'},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "invitee-3", "occurredAt": now_ms - 2000,
             "actionType": "challenge_completed_client", "platform": "web"},
        ]

        overview = build_analytics_overview(
            legacy_rows=[], product_rows=product_rows, days=7, now_ms=now_ms, platform="web",
        )

        self.assertEqual(overview["viralCoefficient"], [
            {"channel": "copy_link", "shareAttempts": 2, "completedReferrals": 0, "viralCoefficient": 0.0},
            {"channel": "untagged", "shareAttempts": 0, "completedReferrals": 1, "viralCoefficient": None},
            {"channel": "whatsapp", "shareAttempts": 3, "completedReferrals": 2, "viralCoefficient": round(2 / 3, 3)},
        ])

    def test_copy_experiments_compute_same_identity_exposure_to_conversion(self):
        now_ms = 1785369600000
        product_rows = []
        # "value": 32 shown (>= the 30-sample floor), 8 of them clicked.
        for index in range(32):
            product_rows.append({
                "eventId": str(uuid.uuid4()), "anonymousUserId": f"value-user-{index}", "occurredAt": now_ms - 20000,
                "actionType": "auth_prompt_shown", "platform": "web",
                "properties": '{"surface": "results_challenge", "variant": "value"}',
            })
            if index < 8:
                product_rows.append({
                    "eventId": str(uuid.uuid4()), "anonymousUserId": f"value-user-{index}", "occurredAt": now_ms - 19000,
                    "actionType": "auth_prompt_clicked", "platform": "web",
                    "properties": '{"surface": "results_challenge", "variant": "value"}',
                })
        # "urgency": only 2 shown, both clicked - below the sample floor, so
        # the rate must be withheld even though it looks like a clean 100%.
        for index in range(2):
            product_rows.append({
                "eventId": str(uuid.uuid4()), "anonymousUserId": f"urgency-user-{index}", "occurredAt": now_ms - 18000,
                "actionType": "auth_prompt_shown", "platform": "web",
                "properties": '{"surface": "challenge_rematch", "variant": "urgency"}',
            })
            product_rows.append({
                "eventId": str(uuid.uuid4()), "anonymousUserId": f"urgency-user-{index}", "occurredAt": now_ms - 17000,
                "actionType": "auth_prompt_clicked", "platform": "web",
                "properties": '{"surface": "challenge_rematch", "variant": "urgency"}',
            })

        overview = build_analytics_overview(
            legacy_rows=[], product_rows=product_rows, days=7, now_ms=now_ms, platform="web",
        )
        auth_prompt_copy = overview["copyExperiments"]["authPromptCopy"]

        self.assertEqual(auth_prompt_copy, [
            {"variant": "urgency", "exposed": 2, "converted": 2, "conversionRatePct": None, "insufficientSample": True},
            {"variant": "value", "exposed": 32, "converted": 8, "conversionRatePct": 25.0, "insufficientSample": False},
        ])
        # Every registered experiment must be present even with zero data,
        # never silently missing from the response.
        self.assertEqual(set(overview["copyExperiments"].keys()), {
            "authPromptCopy", "homeModeCopy", "challengeButtonCopy", "partyCreateCopy",
        })
        self.assertEqual(overview["copyExperiments"]["homeModeCopy"], [])

    def test_creative_variant_breakdown_joins_completions_via_utm_content(self):
        now_ms = 1785369600000
        product_rows = [
            # 3 "archetype" invites created, 2 "provocative".
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "sharer-1", "occurredAt": now_ms - 9000,
             "actionType": "challenge_share_ready", "platform": "web",
             "properties": '{"object_type": "result", "variant": "archetype"}'},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "sharer-2", "occurredAt": now_ms - 8000,
             "actionType": "challenge_share_ready", "platform": "web",
             "properties": '{"object_type": "result", "variant": "archetype"}'},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "sharer-3", "occurredAt": now_ms - 7000,
             "actionType": "challenge_share_ready", "platform": "web",
             "properties": '{"object_type": "result", "variant": "archetype"}'},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "sharer-4", "occurredAt": now_ms - 6000,
             "actionType": "challenge_share_ready", "platform": "web",
             "properties": '{"object_type": "result", "variant": "provocative"}'},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "sharer-5", "occurredAt": now_ms - 5000,
             "actionType": "challenge_share_ready", "platform": "web",
             "properties": '{"object_type": "result", "variant": "provocative"}'},
            # 1 completion tagged archetype, 2 tagged provocative, 1 with no tag at all.
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "invitee-1", "occurredAt": now_ms - 4000,
             "actionType": "challenge_completed_client", "platform": "web",
             "utm": '{"utm_source": "whatsapp", "utm_content": "archetype"}'},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "invitee-2", "occurredAt": now_ms - 3000,
             "actionType": "challenge_completed_client", "platform": "web",
             "utm": '{"utm_source": "whatsapp", "utm_content": "provocative"}'},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "invitee-3", "occurredAt": now_ms - 2000,
             "actionType": "challenge_completed_client", "platform": "web",
             "utm": '{"utm_source": "whatsapp", "utm_content": "provocative"}'},
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "invitee-4", "occurredAt": now_ms - 1000,
             "actionType": "challenge_completed_client", "platform": "web"},
        ]

        overview = build_analytics_overview(
            legacy_rows=[], product_rows=product_rows, days=7, now_ms=now_ms, platform="web",
        )

        self.assertEqual(overview["creativeVariants"], [
            {"variant": "archetype", "shareAttempts": 3, "completedReferrals": 1, "conversionRatePct": round(1 / 3 * 100, 1)},
            {"variant": "provocative", "shareAttempts": 2, "completedReferrals": 2, "conversionRatePct": 100.0},
            {"variant": "untagged", "shareAttempts": 0, "completedReferrals": 1, "conversionRatePct": None},
        ])

    def test_retention_cohorts_pool_d1_d7_across_a_documented_active_definition(self):
        day0 = datetime(2026, 8, 1, 12, 0, 0, tzinfo=timezone.utc)
        day0_ms = int(day0.timestamp() * 1000)
        day1_ms = int((day0 + timedelta(days=1)).timestamp() * 1000)
        day7_ms = int((day0 + timedelta(days=7)).timestamp() * 1000)
        now_ms = int((day0 + timedelta(days=10)).timestamp() * 1000)

        product_rows = []
        for index in range(40):
            product_rows.append({
                "eventId": str(uuid.uuid4()), "anonymousUserId": f"cohort-user-{index}",
                "occurredAt": day0_ms, "actionType": "landing_viewed", "platform": "web", "properties": "{}",
            })
            if index < 24:  # 24/40 return the next day
                product_rows.append({
                    "eventId": str(uuid.uuid4()), "anonymousUserId": f"cohort-user-{index}",
                    "occurredAt": day1_ms, "actionType": "landing_viewed", "platform": "web", "properties": "{}",
                })
            if index < 12:  # 12/40 return a week later
                product_rows.append({
                    "eventId": str(uuid.uuid4()), "anonymousUserId": f"cohort-user-{index}",
                    "occurredAt": day7_ms, "actionType": "landing_viewed", "platform": "web", "properties": "{}",
                })

        overview = build_analytics_overview(
            legacy_rows=[], product_rows=product_rows, days=14, now_ms=now_ms, platform="web",
        )
        retention = overview["retentionCohorts"]

        self.assertEqual(
            retention["activeUserDefinition"],
            "An identity with at least one analytics event on a given UTC calendar day.",
        )
        self.assertTrue(retention["windowLeftCensored"])
        self.assertEqual(retention["d1"], {
            "cohortSize": 40, "retainedCount": 24, "retentionPct": 60.0, "insufficientSample": False,
        })
        self.assertEqual(retention["d7"], {
            "cohortSize": 40, "retainedCount": 12, "retentionPct": 30.0, "insufficientSample": False,
        })

    def test_retention_cohorts_withholds_rate_below_minimum_sample(self):
        day0 = datetime(2026, 8, 1, 12, 0, 0, tzinfo=timezone.utc)
        day0_ms = int(day0.timestamp() * 1000)
        day1_ms = int((day0 + timedelta(days=1)).timestamp() * 1000)
        now_ms = int((day0 + timedelta(days=10)).timestamp() * 1000)

        product_rows = []
        for index in range(10):  # below RETENTION_MIN_COHORT_SAMPLE (30)
            product_rows.append({
                "eventId": str(uuid.uuid4()), "anonymousUserId": f"small-cohort-{index}",
                "occurredAt": day0_ms, "actionType": "landing_viewed", "platform": "web", "properties": "{}",
            })
            if index < 5:
                product_rows.append({
                    "eventId": str(uuid.uuid4()), "anonymousUserId": f"small-cohort-{index}",
                    "occurredAt": day1_ms, "actionType": "landing_viewed", "platform": "web", "properties": "{}",
                })

        overview = build_analytics_overview(
            legacy_rows=[], product_rows=product_rows, days=14, now_ms=now_ms, platform="web",
        )
        d1 = overview["retentionCohorts"]["d1"]

        self.assertEqual(d1["cohortSize"], 10)
        self.assertEqual(d1["retainedCount"], 5)
        self.assertIsNone(d1["retentionPct"])
        self.assertTrue(d1["insufficientSample"])

    def test_flags_rapid_replay_without_exposing_source_identity(self):
        now_ms = 1785369600000
        raw_network_hash = "legacy-network-value"
        rows = []
        for index in range(68):
            occurred_at = now_ms - (19 * 60 * 1000) + (index * 16000)
            rows.extend([
                {
                    "sessionId": "fast-session",
                    "timestamp": occurred_at,
                    "actionType": "dilemma_fetched",
                    "hashedIp": raw_network_hash,
                    "userAgent": "Mozilla/5.0 Mobile Safari",
                },
                {
                    "sessionId": "fast-session",
                    "timestamp": occurred_at + 500,
                    "actionType": "vote_cast",
                    "hashedIp": raw_network_hash,
                    "userAgent": "Mozilla/5.0 Mobile Safari",
                },
            ])
        rows.append({
            "sessionId": "fast-session",
            "timestamp": now_ms - 1000,
            "actionType": "results_analyzed",
            "hashedIp": raw_network_hash,
            "userAgent": "Mozilla/5.0 Mobile Safari",
        })

        overview = build_analytics_overview(rows, [], days=7, now_ms=now_ms)
        abuse = overview["abuseMonitoring"]

        self.assertEqual(abuse["summary"]["suspicious"], 1)
        self.assertEqual(abuse["anomalies"][0]["risk"], "suspicious")
        self.assertIn("rapid_replay_without_results", abuse["anomalies"][0]["reasons"])
        self.assertNotIn(raw_network_hash, str(abuse))
        self.assertNotIn("Mozilla", str(abuse))


class AbuseGuardTests(unittest.TestCase):
    def test_sliding_window_rejects_then_recovers(self):
        key = f"test:{uuid.uuid4()}"

        self.assertEqual(_consume_burst_window(key, 2, now_seconds=100), (True, 0))
        self.assertEqual(_consume_burst_window(key, 2, now_seconds=101), (True, 0))
        self.assertEqual(_consume_burst_window(key, 2, now_seconds=102), (False, 58))
        self.assertEqual(_consume_burst_window(key, 2, now_seconds=161), (True, 0))

    def test_options_is_exempt_and_ai_endpoint_gets_specific_rule(self):
        self.assertEqual(_rate_limit_rules_for_request("OPTIONS", "/generate-dilemma"), [])
        rules = _rate_limit_rules_for_request("POST", "/generate-dilemma")

        self.assertEqual([name for name, _ in rules], ["global", "ai"])

    def test_authenticated_write_endpoints_get_the_auth_write_rule(self):
        for path in ("/users/claim-anonymous-data", "/users/me", "/auth/me"):
            rules = _rate_limit_rules_for_request("POST", path)
            self.assertEqual([name for name, _ in rules], ["global", "auth_write"])

    def test_public_reads_get_their_own_rule(self):
        # TASK-67: profile/challenge reads and batch dilemma lookup are
        # unauthenticated and abuse-prone, so they get a dedicated bucket
        # rather than only the broad "global" one.
        for path in ("/profiles/abc123", "/challenges/abc123", "/challenges/abc123/compare", "/dilemmas/by-ids"):
            rules = _rate_limit_rules_for_request("GET", path)
            self.assertEqual([name for name, _ in rules], ["global", "public_read"])

    def test_writing_a_challenge_still_uses_duel_write_not_public_read(self):
        rules = _rate_limit_rules_for_request("POST", "/challenges/abc123/join")
        self.assertEqual([name for name, _ in rules], ["global", "duel_write"])

    def test_network_fingerprint_is_stable_and_peppered(self):
        with patch.object(backend_module, "get_analytics_fingerprint_secret", return_value="private-pepper"):
            first = _network_fingerprint("203.0.113.10")
            second = _network_fingerprint("203.0.113.10")
            other = _network_fingerprint("203.0.113.11")

        self.assertEqual(first, second)
        self.assertNotEqual(first, other)
        self.assertNotIn("203.0.113.10", first)


class PartyRoomPollRateLimitKeyTests(unittest.TestCase):
    """TASK-132/ADR-069: Party Room participants sharing a WiFi/NAT share an
    IP, so an IP-only bucket makes them false-429 each other well below
    PARTY_ROOM_MAX_PARTICIPANTS. Party Room polling keys its rules by
    IP + anonymous_user_id instead so each participant gets their own
    budget; every other endpoint must stay IP-only."""

    def _fake_request(self, path, method="GET", ip="203.0.113.5", anonymous_user_id="alice"):
        request = Mock()
        request.url.path = path
        request.method = method
        request.client = Mock(host=ip)
        request.headers = {"X-Anonymous-User-Id": anonymous_user_id}
        return request

    async def _call_next(self, _request):
        return Mock(status_code=200)

    def test_participant_source_differs_by_anonymous_user_id_on_the_same_ip(self):
        alice = self._fake_request("/party-rooms/ROOM1", anonymous_user_id="alice")
        bob = self._fake_request("/party-rooms/ROOM1", anonymous_user_id="bob")

        self.assertNotEqual(
            _rate_limit_participant_source(alice),
            _rate_limit_participant_source(bob),
        )

    def test_participant_source_is_deterministic(self):
        request = self._fake_request("/party-rooms/ROOM1", anonymous_user_id="alice")

        self.assertEqual(
            _rate_limit_participant_source(request),
            _rate_limit_participant_source(request),
        )

    def test_plain_ip_source_ignores_anonymous_user_id(self):
        # Control: every rule other than party_room_poll must stay IP-only,
        # so it keeps acting as the abuse backstop regardless of a
        # client-supplied anonymous_user_id.
        alice = self._fake_request("/profiles", method="POST", anonymous_user_id="alice")
        bob = self._fake_request("/profiles", method="POST", anonymous_user_id="bob")

        self.assertEqual(_rate_limit_source(alice), _rate_limit_source(bob))

    def test_party_room_poll_request_consumes_both_rules_with_the_participant_key(self):
        request = self._fake_request("/party-rooms/ROOM1")
        expected_key = _rate_limit_participant_source(request)

        with patch.object(backend_module, "_consume_burst_window", return_value=(True, 0)) as consume:
            asyncio.run(enforce_zero_cost_burst_guard(request, self._call_next))

        called_keys = [call.args[0] for call in consume.call_args_list]
        self.assertEqual(called_keys, [f"global:{expected_key}", f"party_room_poll:{expected_key}"])

    def test_non_party_room_request_consumes_rules_with_the_ip_only_key(self):
        request = self._fake_request("/profiles/abc123", method="GET")
        expected_key = _rate_limit_source(request)

        with patch.object(backend_module, "_consume_burst_window", return_value=(True, 0)) as consume:
            asyncio.run(enforce_zero_cost_burst_guard(request, self._call_next))

        called_keys = [call.args[0] for call in consume.call_args_list]
        self.assertEqual(called_keys, [f"global:{expected_key}", f"public_read:{expected_key}"])

    def test_rate_limit_log_uses_a_route_signature_not_the_private_path(self):
        request = self._fake_request("/profiles/private-profile-token")
        request.scope = {}
        with (
            patch.object(backend_module, "_consume_burst_window", return_value=(False, 7)),
            patch.object(backend_module.logger, "warning") as warning,
        ):
            response = asyncio.run(enforce_zero_cost_burst_guard(request, self._call_next))

        self.assertEqual(response.status_code, 429)
        self.assertEqual(warning.call_args.args[1], "rate_limit:public_read")
        self.assertNotIn("private-profile-token", str(warning.call_args))

    def test_two_participants_on_the_same_ip_do_not_share_a_party_room_poll_bucket(self):
        # End-to-end regression for the reported false-positive: same IP,
        # different participants, a poll limit of 1 each - both must be
        # allowed instead of the second tripping a shared bucket.
        alice = self._fake_request("/party-rooms/ROOM1", anonymous_user_id="alice")
        bob = self._fake_request("/party-rooms/ROOM1", anonymous_user_id="bob")

        with (
            patch.object(backend_module, "ABUSE_GLOBAL_REQUESTS_PER_MINUTE", 100),
            patch.object(backend_module, "ABUSE_PARTY_ROOM_POLL_REQUESTS_PER_MINUTE", 1),
        ):
            alice_response = asyncio.run(enforce_zero_cost_burst_guard(alice, self._call_next))
            bob_response = asyncio.run(enforce_zero_cost_burst_guard(bob, self._call_next))

        self.assertEqual(alice_response.status_code, 200)
        self.assertEqual(bob_response.status_code, 200)


class CognitoAuthenticationTests(unittest.TestCase):
    def setUp(self):
        backend_module._cognito_jwks_client = None

    def test_verifies_id_token_with_expected_issuer_and_web_or_android_audience(self):
        signing_key = Mock(key="public-key")
        jwks_client = Mock()
        jwks_client.get_signing_key_from_jwt.return_value = signing_key
        claims = {
            "sub": "user-sub",
            "iat": 1785369000,
            "exp": 1785372600,
            "token_use": "id",
            "cognito:groups": ["admins"],
        }

        with (
            patch.object(backend_module, "COGNITO_USER_POOL_ID", "eu-west-1_example"),
            patch.object(backend_module, "COGNITO_APP_CLIENT_IDS", ("web-client-id", "android-client-id")),
            patch.object(backend_module, "_cognito_jwks_client", jwks_client),
            patch.object(backend_module.jwt, "decode", return_value=claims) as decode,
        ):
            verified = verify_cognito_id_token("signed-token")

        self.assertEqual(verified["sub"], "user-sub")
        decode.assert_called_once_with(
            "signed-token",
            "public-key",
            algorithms=["RS256"],
            audience=["web-client-id", "android-client-id"],
            issuer="https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_example",
            options={"require": ["exp", "iat", "sub"]},
        )

    def test_rejects_access_token_where_id_token_is_required(self):
        jwks_client = Mock()
        jwks_client.get_signing_key_from_jwt.return_value = Mock(key="public-key")

        with (
            patch.object(backend_module, "COGNITO_USER_POOL_ID", "eu-west-1_example"),
            patch.object(backend_module, "COGNITO_APP_CLIENT_IDS", ("web-client-id", "android-client-id")),
            patch.object(backend_module, "_cognito_jwks_client", jwks_client),
            patch.object(backend_module.jwt, "decode", return_value={
                "sub": "user-sub",
                "iat": 1785369000,
                "exp": 1785372600,
                "token_use": "access",
            }),
        ):
            with self.assertRaises(HTTPException) as raised:
                verify_cognito_id_token("access-token")

        self.assertEqual(raised.exception.status_code, 401)

    def test_analytics_access_requires_a_cognito_admin_token(self):
        def request_with_headers(headers):
            return Request({
                "type": "http",
                "method": "GET",
                "path": "/admin/analytics/overview",
                "headers": [(key.lower().encode(), value.encode()) for key, value in headers.items()],
            })

        with self.assertRaises(HTTPException) as unauthenticated:
            require_analytics_admin(request_with_headers({"X-Admin-Key": "no-longer-valid"}))
        self.assertEqual(unauthenticated.exception.status_code, 401)

        with patch.object(backend_module, "verify_cognito_id_token", return_value={"cognito:groups": []}):
            with self.assertRaises(HTTPException) as non_admin:
                require_analytics_admin(request_with_headers({"Authorization": "Bearer token"}))
        self.assertEqual(non_admin.exception.status_code, 403)

        with patch.object(backend_module, "verify_cognito_id_token", return_value={"cognito:groups": ["admins"]}):
            require_analytics_admin(request_with_headers({"Authorization": "Bearer token"}))


class CognitoTokenExpiryAndSignatureTests(unittest.TestCase):
    """TASK-16 AC1: exercise real PyJWT expiry/signature checks, not a mocked jwt.decode.

    CognitoAuthenticationTests above mocks jwt.decode itself, which only proves
    verify_cognito_id_token wires its arguments correctly. These tests mock only
    the network-dependent JWKS lookup and let PyJWT's own decode run for real,
    so a regression in the actual expiry/signature enforcement would fail here.
    """

    def setUp(self):
        backend_module._cognito_jwks_client = None
        from cryptography.hazmat.primitives.asymmetric import rsa

        self.private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    def _issue_token(self, private_key, **claim_overrides):
        import jwt as pyjwt

        now = int(time.time())
        claims = {
            "sub": "user-sub",
            "iat": now - 60,
            "exp": now + 3600,
            "token_use": "id",
            "aud": "web-client-id",
            "iss": "https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_example",
        }
        claims.update(claim_overrides)
        return pyjwt.encode(claims, private_key, algorithm="RS256")

    def _verify_with_signing_key(self, token, public_key):
        jwks_client = Mock()
        jwks_client.get_signing_key_from_jwt.return_value = Mock(key=public_key)
        with (
            patch.object(backend_module, "COGNITO_USER_POOL_ID", "eu-west-1_example"),
            patch.object(backend_module, "COGNITO_APP_CLIENT_IDS", ("web-client-id", "android-client-id")),
            patch.object(backend_module, "_cognito_jwks_client", jwks_client),
        ):
            return verify_cognito_id_token(token)

    def test_expired_token_is_rejected(self):
        now = int(time.time())
        token = self._issue_token(self.private_key, iat=now - 7200, exp=now - 3600)

        with self.assertRaises(HTTPException) as raised:
            self._verify_with_signing_key(token, self.private_key.public_key())

        self.assertEqual(raised.exception.status_code, 401)

    def test_token_signed_by_an_unexpected_key_is_rejected(self):
        from cryptography.hazmat.primitives.asymmetric import rsa

        other_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        token = self._issue_token(other_key)

        # Verified against the *legitimate* pool's public key, not the one that
        # actually signed the token - simulates a forged/tampered token.
        with self.assertRaises(HTTPException) as raised:
            self._verify_with_signing_key(token, self.private_key.public_key())

        self.assertEqual(raised.exception.status_code, 401)

    def test_token_missing_required_claims_is_rejected(self):
        import jwt as pyjwt

        now = int(time.time())
        # No "sub" claim at all - options={"require": [...]} must reject this.
        claims = {
            "iat": now - 60,
            "exp": now + 3600,
            "token_use": "id",
            "aud": "web-client-id",
            "iss": "https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_example",
        }
        token = pyjwt.encode(claims, self.private_key, algorithm="RS256")

        with self.assertRaises(HTTPException) as raised:
            self._verify_with_signing_key(token, self.private_key.public_key())

        self.assertEqual(raised.exception.status_code, 401)

    def test_well_formed_unexpired_token_is_accepted(self):
        token = self._issue_token(self.private_key)

        claims = self._verify_with_signing_key(token, self.private_key.public_key())

        self.assertEqual(claims["sub"], "user-sub")


if __name__ == "__main__":
    unittest.main()
