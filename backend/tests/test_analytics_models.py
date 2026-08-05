import asyncio
import os
import unittest
import uuid
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

    def test_rejects_invalid_time_zone(self):
        with self.assertRaises(ValidationError):
            AnalyticsEvent(**valid_event(timeZone="Europe Rome!"))

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


if __name__ == "__main__":
    unittest.main()
