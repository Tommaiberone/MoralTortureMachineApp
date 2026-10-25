import asyncio
import os
import re
import unittest
from datetime import datetime, timezone
from unittest.mock import ANY, patch

from botocore.exceptions import ClientError

from fastapi import HTTPException
from starlette.requests import Request

os.environ.setdefault("AWS_EC2_METADATA_DISABLED", "true")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")
os.environ.setdefault("AWS_DEFAULT_REGION", "eu-west-1")

from backend.src.backend_fastapi import (  # noqa: E402
    PUSH_AUTO_SILENCE_AFTER,
    PushDeliveryError,
    PushOpenedRequest,
    PushStatusRequest,
    PushSubscribeRequest,
    PushUnsubscribeRequest,
    get_push_status,
    get_push_vapid_public_key,
    get_vapid_public_key,
    push_notification_opened,
    send_push_notification,
    subscribe_to_push,
    unsubscribe_from_push,
)
from backend.src import backend_fastapi as backend_module  # noqa: E402

# A real, throwaway P-256 scalar (generated for this test file only, never
# used anywhere real) so get_vapid_private_key()'s local-env fallback path
# can run without SSM.
TEST_VAPID_PRIVATE_KEY = "6ZHSBJIMkBlj1zauKREKWJpMHqMmiR4XpLa2oZh7lJA"


def request_with_headers(headers, path="/push/subscribe"):
    return Request({
        "type": "http",
        "method": "POST",
        "path": path,
        "headers": [(key.lower().encode(), value.encode()) for key, value in headers.items()],
    })


def _conditional_check_failed():
    return ClientError(
        {"Error": {"Code": "ConditionalCheckFailedException", "Message": "The conditional request failed"}},
        "UpdateItem",
    )


class _FakePushSubscriptionsTable:
    """In-memory double keyed like the real table: PK anonymousUserId, SK
    subscriptionId. update_item understands exactly the SET / if_not_exists /
    ADD shapes the backend uses, plus the two conditions it relies on."""

    def __init__(self):
        self.items = {}

    def put_item(self, Item):
        self.items[(Item["anonymousUserId"], Item["subscriptionId"])] = dict(Item)

    def get_item(self, Key):
        item = self.items.get((Key["anonymousUserId"], Key["subscriptionId"]))
        return {"Item": dict(item)} if item is not None else {}

    def delete_item(self, Key):
        self.items.pop((Key["anonymousUserId"], Key["subscriptionId"]), None)

    def query(self, KeyConditionExpression, ExpressionAttributeValues):
        uid = ExpressionAttributeValues[":uid"]
        return {"Items": [dict(item) for (owner, _sid), item in self.items.items() if owner == uid]}

    def scan(self, FilterExpression=None, ExpressionAttributeValues=None, **_kwargs):
        topic = (ExpressionAttributeValues or {}).get(":daily")
        return {"Items": [
            dict(item) for item in self.items.values()
            if topic is None or topic in item.get("topics", set())
        ]}

    def update_item(self, Key, UpdateExpression, ExpressionAttributeValues=None,
                    ExpressionAttributeNames=None, ConditionExpression=None):
        key = (Key["anonymousUserId"], Key["subscriptionId"])
        values = ExpressionAttributeValues or {}
        names = ExpressionAttributeNames or {}
        existing = self.items.get(key)
        if ConditionExpression:
            if "attribute_exists(anonymousUserId)" in ConditionExpression and existing is None:
                raise _conditional_check_failed()
            if "lastDailyDayKey <> :day" in ConditionExpression and existing and existing.get("lastDailyDayKey") == values[":day"]:
                raise _conditional_check_failed()
        item = existing if existing is not None else dict(Key)
        resolve = lambda token: names.get(token, token)  # noqa: E731

        for target, fallback_target, fallback_value, plain_value in re.findall(
            r"(#?\w+) = (?:if_not_exists\((#?\w+), (:\w+)\)|(:\w+))", UpdateExpression.split(" ADD ")[0]
        ):
            if fallback_target:
                item.setdefault(resolve(target), values[fallback_value])
            else:
                item[resolve(target)] = values[plain_value]
        if "ADD " in UpdateExpression:
            for target, value_token in re.findall(r"ADD (#?\w+) (:\w+)", UpdateExpression):
                attribute, value = resolve(target), values[value_token]
                if isinstance(value, set):
                    item[attribute] = set(item.get(attribute, set())) | value
                else:
                    item[attribute] = item.get(attribute, 0) + value
        self.items[key] = item


class SubscribeTests(unittest.TestCase):
    def test_requires_anonymous_user_id_header(self):
        req = PushSubscribeRequest(channel="fcm", fcmToken="token-a")
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(subscribe_to_push(req, request_with_headers({})))
        self.assertEqual(ctx.exception.status_code, 400)

    def test_web_push_requires_endpoint_and_keys(self):
        req = PushSubscribeRequest(channel="web_push", endpoint="https://push.example/ep1")
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(subscribe_to_push(req, request_with_headers({"X-Anonymous-User-Id": "anon-1"})))
        self.assertEqual(ctx.exception.status_code, 400)

    def test_fcm_requires_token(self):
        req = PushSubscribeRequest(channel="fcm")
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(subscribe_to_push(req, request_with_headers({"X-Anonymous-User-Id": "anon-1"})))
        self.assertEqual(ctx.exception.status_code, 400)

    def test_stores_web_push_subscription(self):
        table = _FakePushSubscriptionsTable()
        req = PushSubscribeRequest(
            channel="web_push",
            endpoint="https://push.example/ep1",
            p256dh="p256dh-value",
            auth="auth-value",
        )
        with (
            patch.object(backend_module, "push_subscriptions_table", table),
            patch.object(backend_module, "_track_duel_event") as mock_track,
        ):
            result = asyncio.run(subscribe_to_push(req, request_with_headers({"X-Anonymous-User-Id": "anon-1"})))

        self.assertEqual(result, {"subscribed": True, "channel": "web_push", "topics": ["duel"]})
        self.assertEqual(len(table.items), 1)
        stored = next(iter(table.items.values()))
        self.assertEqual(stored["anonymousUserId"], "anon-1")
        self.assertEqual(stored["channel"], "web_push")
        self.assertEqual(stored["endpoint"], "https://push.example/ep1")
        self.assertIn("expirationTime", stored)
        self.assertEqual(stored["topics"], {"duel"})
        mock_track.assert_called_once_with(ANY, "push_subscribed", {"channel": "web_push", "topic": "duel"})

    def test_resubscribing_the_same_device_overwrites_not_duplicates(self):
        table = _FakePushSubscriptionsTable()
        req = PushSubscribeRequest(channel="fcm", fcmToken="device-token-a")
        with patch.object(backend_module, "push_subscriptions_table", table):
            asyncio.run(subscribe_to_push(req, request_with_headers({"X-Anonymous-User-Id": "anon-1"})))
            asyncio.run(subscribe_to_push(req, request_with_headers({"X-Anonymous-User-Id": "anon-1"})))

        self.assertEqual(len(table.items), 1)

    def test_two_devices_for_the_same_identity_both_kept(self):
        table = _FakePushSubscriptionsTable()
        with patch.object(backend_module, "push_subscriptions_table", table):
            asyncio.run(subscribe_to_push(
                PushSubscribeRequest(channel="fcm", fcmToken="device-a"),
                request_with_headers({"X-Anonymous-User-Id": "anon-1"}),
            ))
            asyncio.run(subscribe_to_push(
                PushSubscribeRequest(channel="fcm", fcmToken="device-b"),
                request_with_headers({"X-Anonymous-User-Id": "anon-1"}),
            ))

        self.assertEqual(len(table.items), 2)


class UnsubscribeTests(unittest.TestCase):
    def test_removes_matching_subscription(self):
        table = _FakePushSubscriptionsTable()
        with (
            patch.object(backend_module, "push_subscriptions_table", table),
            patch.object(backend_module, "_track_duel_event") as mock_track,
        ):
            asyncio.run(subscribe_to_push(
                PushSubscribeRequest(channel="fcm", fcmToken="device-a"),
                request_with_headers({"X-Anonymous-User-Id": "anon-1"}),
            ))
            self.assertEqual(len(table.items), 1)

            result = asyncio.run(unsubscribe_from_push(
                PushUnsubscribeRequest(channel="fcm", fcmToken="device-a"),
                request_with_headers({"X-Anonymous-User-Id": "anon-1"}),
            ))
        mock_track.assert_any_call(ANY, "push_unsubscribed", {"channel": "fcm", "topic": "all"})

        self.assertEqual(result, {"subscribed": False, "topics": []})
        self.assertEqual(len(table.items), 0)

    def test_idempotent_when_nothing_to_remove(self):
        table = _FakePushSubscriptionsTable()
        with patch.object(backend_module, "push_subscriptions_table", table):
            result = asyncio.run(unsubscribe_from_push(
                PushUnsubscribeRequest(channel="fcm", fcmToken="never-subscribed"),
                request_with_headers({"X-Anonymous-User-Id": "anon-1"}),
            ))
        self.assertEqual(result, {"subscribed": False, "topics": []})


def _subscribe(table, topic="duel", token="device-a", anon="anon-1", headers=None):
    with patch.object(backend_module, "push_subscriptions_table", table), \
            patch.object(backend_module, "_track_duel_event"):
        return asyncio.run(subscribe_to_push(
            PushSubscribeRequest(channel="fcm", fcmToken=token, topic=topic, utcOffsetMinutes=120),
            request_with_headers({"X-Anonymous-User-Id": anon, **(headers or {})}),
        ))


def _unsubscribe(table, topic=None, token="device-a", anon="anon-1"):
    with patch.object(backend_module, "push_subscriptions_table", table), \
            patch.object(backend_module, "_track_duel_event"):
        return asyncio.run(unsubscribe_from_push(
            PushUnsubscribeRequest(channel="fcm", fcmToken=token, topic=topic),
            request_with_headers({"X-Anonymous-User-Id": anon}),
        ))


class TopicTests(unittest.TestCase):
    def test_a_second_topic_is_added_not_replaced(self):
        table = _FakePushSubscriptionsTable()
        _subscribe(table, "duel")
        result = _subscribe(table, "daily")

        self.assertEqual(result["topics"], ["daily", "duel"])
        self.assertEqual(len(table.items), 1)
        stored = next(iter(table.items.values()))
        self.assertEqual(stored["topics"], {"duel", "daily"})
        self.assertEqual(stored["utcOffsetMinutes"], 120)

    def test_a_row_from_before_topics_existed_keeps_meaning_duel(self):
        table = _FakePushSubscriptionsTable()
        _subscribe(table, "duel")
        legacy_key = next(iter(table.items))
        del table.items[legacy_key]["topics"]

        result = _subscribe(table, "daily")

        self.assertEqual(result["topics"], ["daily", "duel"])

    def test_unsubscribing_one_topic_keeps_the_other_and_the_row(self):
        table = _FakePushSubscriptionsTable()
        _subscribe(table, "duel")
        _subscribe(table, "daily")

        result = _unsubscribe(table, topic="daily")

        self.assertEqual(result, {"subscribed": True, "topics": ["duel"]})
        self.assertEqual(next(iter(table.items.values()))["topics"], {"duel"})

    def test_unsubscribing_the_last_topic_deletes_the_row(self):
        table = _FakePushSubscriptionsTable()
        _subscribe(table, "daily")

        result = _unsubscribe(table, topic="daily")

        self.assertEqual(result, {"subscribed": False, "topics": []})
        self.assertEqual(len(table.items), 0)

    def test_unsubscribing_a_legacy_row_from_duel_deletes_it(self):
        table = _FakePushSubscriptionsTable()
        _subscribe(table, "duel")
        del next(iter(table.items.values()))["topics"]

        result = _unsubscribe(table, topic="duel")

        self.assertEqual(result["topics"], [])
        self.assertEqual(len(table.items), 0)

    def test_status_reports_topics_and_refreshes_the_offset(self):
        table = _FakePushSubscriptionsTable()
        _subscribe(table, "duel")
        _subscribe(table, "daily")

        with patch.object(backend_module, "push_subscriptions_table", table):
            status = asyncio.run(get_push_status(
                PushStatusRequest(channel="fcm", fcmToken="device-a", utcOffsetMinutes=60),
                request_with_headers({"X-Anonymous-User-Id": "anon-1"}),
            ))
            unknown = asyncio.run(get_push_status(
                PushStatusRequest(channel="fcm", fcmToken="other-device"),
                request_with_headers({"X-Anonymous-User-Id": "anon-1"}),
            ))

        self.assertEqual(status, {"topics": ["daily", "duel"]})
        self.assertEqual(next(iter(table.items.values()))["utcOffsetMinutes"], 60)
        self.assertEqual(unknown, {"topics": []})

    def test_a_push_for_one_topic_skips_a_device_that_only_follows_the_other(self):
        table = _FakePushSubscriptionsTable()
        _subscribe(table, "daily")

        with (
            patch.object(backend_module, "push_subscriptions_table", table),
            patch.object(backend_module, "_send_fcm") as send,
            patch.object(backend_module, "_track_duel_event"),
        ):
            duel = send_push_notification(request_with_headers({}), "anon-1", "T", "B", topic="duel")
            daily = send_push_notification(request_with_headers({}), "anon-1", "T", "B", topic="daily")

        self.assertEqual(duel, {"delivered": 0, "failed": 0, "pruned": 0})
        self.assertEqual(daily["delivered"], 1)
        send.assert_called_once()


class AutoSilenceTests(unittest.TestCase):
    def _send(self, table, tracked=None):
        with (
            patch.object(backend_module, "push_subscriptions_table", table),
            patch.object(backend_module, "_send_fcm") as send,
            patch.object(
                backend_module, "_track_duel_event",
                side_effect=lambda req, name, data=None, **who: (tracked if tracked is not None else []).append(name),
            ),
        ):
            summary = send_push_notification(request_with_headers({}), "anon-1", "T", "B", topic="daily")
        return summary, send

    def test_a_device_that_ignores_three_in_a_row_is_switched_off_for_that_topic(self):
        table = _FakePushSubscriptionsTable()
        _subscribe(table, "duel")
        _subscribe(table, "daily")

        for _ in range(PUSH_AUTO_SILENCE_AFTER):
            summary, _ = self._send(table)
            self.assertEqual(summary["delivered"], 1)
        tracked = []
        summary, send = self._send(table, tracked)

        self.assertEqual(summary["delivered"], 0)
        send.assert_not_called()
        self.assertIn("push_topic_auto_silenced", tracked)
        # Only the ignored topic goes; the other one stays.
        self.assertEqual(next(iter(table.items.values()))["topics"], {"duel"})

    def test_opening_a_notification_clears_the_streak(self):
        table = _FakePushSubscriptionsTable()
        _subscribe(table, "daily")
        for _ in range(PUSH_AUTO_SILENCE_AFTER - 1):
            self._send(table)

        with patch.object(backend_module, "push_subscriptions_table", table):
            result = asyncio.run(push_notification_opened(
                PushOpenedRequest(campaign="daily_digest"),
                request_with_headers({"X-Anonymous-User-Id": "anon-1"}),
            ))
        self.assertEqual(result, {"reset": 1})
        self.assertEqual(next(iter(table.items.values()))["unopened_daily"], 0)

        for _ in range(PUSH_AUTO_SILENCE_AFTER):
            summary, _ = self._send(table)
            self.assertEqual(summary["delivered"], 1)

    def test_an_unknown_campaign_resets_nothing(self):
        table = _FakePushSubscriptionsTable()
        with patch.object(backend_module, "push_subscriptions_table", table):
            result = asyncio.run(push_notification_opened(
                PushOpenedRequest(campaign="something_else"),
                request_with_headers({"X-Anonymous-User-Id": "anon-1"}),
            ))
        self.assertEqual(result, {"reset": 0})

    def test_subscribing_again_starts_a_clean_slate(self):
        table = _FakePushSubscriptionsTable()
        _subscribe(table, "daily")
        for _ in range(PUSH_AUTO_SILENCE_AFTER - 1):
            self._send(table)

        _subscribe(table, "daily")

        self.assertEqual(next(iter(table.items.values()))["unopened_daily"], 0)


class DailyDigestTests(unittest.TestCase):
    NOW = datetime(2026, 10, 25, 11, 0, tzinfo=timezone.utc)  # window 2026-10-25, released 09:00 UTC

    def _run(self, table, now=None, results=None, vote=None, today_vote=None):
        results = results or {"totalVotes": 20, "firstPct": 62, "secondPct": 38}
        sent = []
        votes_by_day = {"2026-10-24": vote, "2026-10-25": today_vote}
        with (
            patch.object(backend_module, "push_subscriptions_table", table),
            patch.object(backend_module, "_daily_moral_crime_results", return_value=results),
            patch.object(
                backend_module, "_daily_moral_crime_vote",
                side_effect=lambda day_key, owner: votes_by_day.get(day_key),
            ),
            patch.object(backend_module, "_send_fcm", side_effect=lambda sub, title, body, data: sent.append((title, body, data))),
            patch.object(backend_module, "_track_duel_event"),
        ):
            summary = backend_module._run_daily_push_digest(now or self.NOW)
        return summary, sent

    def test_voter_in_the_majority_gets_the_real_verdict(self):
        table = _FakePushSubscriptionsTable()
        _subscribe(table, "daily")

        summary, sent = self._run(table, vote={"choice": "first"})

        self.assertEqual(summary["delivered"], 1)
        self.assertEqual(sent[0][0], "Yesterday's verdict is in")
        self.assertEqual(sent[0][1], "You sided with the 62%. Today's case is waiting.")
        self.assertIn("utm_campaign=daily_digest", sent[0][2]["url"])

    def test_voter_in_the_minority_is_told_so(self):
        table = _FakePushSubscriptionsTable()
        _subscribe(table, "daily")

        _, sent = self._run(table, vote={"choice": "second"})

        self.assertEqual(sent[0][1], "You stood with the 38% minority. Today's case is waiting.")

    def test_non_voter_only_hears_that_the_case_is_up(self):
        table = _FakePushSubscriptionsTable()
        _subscribe(table, "daily")

        _, sent = self._run(table, vote=None)

        self.assertEqual(sent[0][0], "Today's case is up")

    def test_too_few_votes_never_produce_a_percentage(self):
        table = _FakePushSubscriptionsTable()
        _subscribe(table, "daily")

        _, sent = self._run(
            table, results={"totalVotes": 3, "firstPct": 67, "secondPct": 33}, vote={"choice": "first"},
        )

        self.assertEqual(sent[0][0], "Today's case is up")

    def test_the_same_window_is_never_sent_twice(self):
        table = _FakePushSubscriptionsTable()
        _subscribe(table, "daily")

        first, sent_first = self._run(table)
        second, sent_second = self._run(table)

        self.assertEqual(first["delivered"], 1)
        self.assertEqual(second.get("delivered", 0), 0)
        self.assertEqual(second["alreadySent"], 1)
        self.assertEqual(len(sent_first) + len(sent_second), 1)

    def test_nothing_is_sent_at_night_on_the_device(self):
        table = _FakePushSubscriptionsTable()
        _subscribe(table, "daily")  # offset +120 -> 11:00 UTC is 13:00 locally
        night = datetime(2026, 10, 25, 21, 30, tzinfo=timezone.utc)  # 23:30 locally

        summary, sent = self._run(table, now=night)

        self.assertEqual(summary["outsideHours"], 1)
        self.assertEqual(sent, [])

    def test_a_late_run_still_sends_once_the_device_wakes_up(self):
        table = _FakePushSubscriptionsTable()
        _subscribe(table, "daily")  # +120
        before_dawn = datetime(2026, 10, 25, 5, 0, tzinfo=timezone.utc)  # 07:00 locally, before the window opens
        morning = datetime(2026, 10, 25, 9, 10, tzinfo=timezone.utc)  # 11:10 locally, after release

        early, sent_early = self._run(table, now=before_dawn)
        later, sent_later = self._run(table, now=morning)

        self.assertEqual(sent_early, [])
        self.assertEqual(later["delivered"], 1)
        self.assertEqual(len(sent_later), 1)

    def test_someone_who_already_played_today_is_not_told_the_case_is_up(self):
        table = _FakePushSubscriptionsTable()
        _subscribe(table, "daily")

        summary, sent = self._run(table, vote={"choice": "first"}, today_vote={"choice": "second"})

        self.assertEqual(summary["alreadyPlayed"], 1)
        self.assertEqual(sent, [])

    def test_duel_only_devices_are_not_part_of_the_daily_push(self):
        table = _FakePushSubscriptionsTable()
        _subscribe(table, "duel")

        summary, sent = self._run(table)

        self.assertEqual(summary.get("subscriptions", 0), 0)
        self.assertEqual(sent, [])


class SendPushNotificationTests(unittest.TestCase):
    def test_noop_when_identity_has_no_subscriptions(self):
        table = _FakePushSubscriptionsTable()
        with patch.object(backend_module, "push_subscriptions_table", table):
            summary = send_push_notification(
                request_with_headers({}), "anon-nobody", "Title", "Body"
            )
        self.assertEqual(summary, {"delivered": 0, "failed": 0, "pruned": 0})

    def test_dispatches_to_web_push_and_fcm_and_tracks_analytics(self):
        table = _FakePushSubscriptionsTable()
        table.put_item({
            "anonymousUserId": "anon-1", "subscriptionId": "s1", "channel": "web_push",
            "endpoint": "https://push.example/ep1", "p256dh": "x", "authSecret": "y",
        })
        table.put_item({
            "anonymousUserId": "anon-1", "subscriptionId": "s2", "channel": "fcm",
            "fcmToken": "device-a",
        })

        tracked = []
        with (
            patch.object(backend_module, "push_subscriptions_table", table),
            patch.object(backend_module, "_send_web_push") as mock_web_push,
            patch.object(backend_module, "_send_fcm") as mock_fcm,
            patch.object(
                backend_module, "_track_duel_event",
                side_effect=lambda req, name, data=None, **who: tracked.append((name, data, who)),
            ),
        ):
            summary = send_push_notification(
                request_with_headers({}), "anon-1", "Someone answered", "Go look", trigger="duel_completed"
            )

        self.assertEqual(summary, {"delivered": 2, "failed": 0, "pruned": 0})
        mock_web_push.assert_called_once()
        mock_fcm.assert_called_once()
        self.assertEqual(
            sorted(name for name, _, _ in tracked),
            ["push_delivery_succeeded", "push_delivery_succeeded"],
        )
        # Attributed to the recipient (not the caller's request), with the
        # platform implied by the channel, so the dashboard can follow them.
        self.assertEqual(
            sorted((data["channel"], data["trigger"], who["recipient_anonymous_user_id"], who["recipient_platform"])
                   for _, data, who in tracked),
            [("fcm", "duel_completed", "anon-1", "android"), ("web_push", "duel_completed", "anon-1", "web")],
        )

    def test_stale_subscription_is_pruned_after_a_failed_send(self):
        table = _FakePushSubscriptionsTable()
        table.put_item({
            "anonymousUserId": "anon-1", "subscriptionId": "s1", "channel": "web_push",
            "endpoint": "https://push.example/ep1", "p256dh": "x", "authSecret": "y",
        })

        with (
            patch.object(backend_module, "push_subscriptions_table", table),
            patch.object(
                backend_module, "_send_web_push",
                side_effect=PushDeliveryError("gone", stale=True),
            ),
        ):
            summary = send_push_notification(request_with_headers({}), "anon-1", "T", "B")

        self.assertEqual(summary, {"delivered": 0, "failed": 1, "pruned": 1})
        self.assertEqual(len(table.items), 0)

    def test_transient_failure_is_not_pruned(self):
        table = _FakePushSubscriptionsTable()
        table.put_item({
            "anonymousUserId": "anon-1", "subscriptionId": "s1", "channel": "web_push",
            "endpoint": "https://push.example/ep1", "p256dh": "x", "authSecret": "y",
        })

        with (
            patch.object(backend_module, "push_subscriptions_table", table),
            patch.object(
                backend_module, "_send_web_push",
                side_effect=PushDeliveryError("network blip", stale=False),
            ),
        ):
            summary = send_push_notification(request_with_headers({}), "anon-1", "T", "B")

        self.assertEqual(summary, {"delivered": 0, "failed": 1, "pruned": 0})
        self.assertEqual(len(table.items), 1)

    def test_unconfigured_channel_does_not_raise(self):
        """FCM has no Firebase project yet (TASK-45 provisions one later);
        a send attempt should degrade to a failed delivery, never a 500."""
        table = _FakePushSubscriptionsTable()
        table.put_item({
            "anonymousUserId": "anon-1", "subscriptionId": "s1", "channel": "fcm",
            "fcmToken": "device-a",
        })

        with patch.object(backend_module, "push_subscriptions_table", table):
            summary = send_push_notification(request_with_headers({}), "anon-1", "T", "B")

        self.assertEqual(summary, {"delivered": 0, "failed": 1, "pruned": 0})


class VapidKeyTests(unittest.TestCase):
    def test_public_key_is_derived_from_configured_private_key(self):
        with patch.dict(os.environ, {"VAPID_PRIVATE_KEY": TEST_VAPID_PRIVATE_KEY}):
            with patch.object(backend_module, "_vapid_private_key_cache", None):
                key = get_vapid_public_key()
        # Raw uncompressed P-256 point, base64url, no padding: 65 bytes -> 87 chars, starts with 'B' (0x04 first byte).
        self.assertTrue(key.startswith("B"))
        self.assertNotIn("=", key)

    def test_endpoint_returns_the_same_key(self):
        with patch.dict(os.environ, {"VAPID_PRIVATE_KEY": TEST_VAPID_PRIVATE_KEY}):
            with patch.object(backend_module, "_vapid_private_key_cache", None):
                result = asyncio.run(get_push_vapid_public_key())
        self.assertIn("key", result)

    def test_missing_configuration_raises_503(self):
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop("VAPID_PRIVATE_KEY", None)
            with (
                patch.object(backend_module, "_vapid_private_key_cache", None),
                patch.object(backend_module, "VAPID_PRIVATE_KEY_SSM_NAME", ""),
            ):
                with self.assertRaises(HTTPException) as ctx:
                    get_vapid_public_key()
        self.assertEqual(ctx.exception.status_code, 503)


if __name__ == "__main__":
    unittest.main()
