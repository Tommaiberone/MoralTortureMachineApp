import asyncio
import os
import unittest
from unittest.mock import ANY, patch

from fastapi import HTTPException
from starlette.requests import Request

os.environ.setdefault("AWS_EC2_METADATA_DISABLED", "true")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")
os.environ.setdefault("AWS_DEFAULT_REGION", "eu-west-1")

from backend.src.backend_fastapi import (  # noqa: E402
    PushDeliveryError,
    PushSubscribeRequest,
    PushUnsubscribeRequest,
    get_push_vapid_public_key,
    get_vapid_public_key,
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


class _FakePushSubscriptionsTable:
    """In-memory double keyed like the real table: PK anonymousUserId, SK
    subscriptionId."""

    def __init__(self):
        self.items = {}

    def put_item(self, Item):
        self.items[(Item["anonymousUserId"], Item["subscriptionId"])] = dict(Item)

    def delete_item(self, Key):
        self.items.pop((Key["anonymousUserId"], Key["subscriptionId"]), None)

    def query(self, KeyConditionExpression, ExpressionAttributeValues):
        uid = ExpressionAttributeValues[":uid"]
        return {"Items": [item for (owner, _sid), item in self.items.items() if owner == uid]}


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

        self.assertEqual(result, {"subscribed": True, "channel": "web_push"})
        self.assertEqual(len(table.items), 1)
        stored = next(iter(table.items.values()))
        self.assertEqual(stored["anonymousUserId"], "anon-1")
        self.assertEqual(stored["channel"], "web_push")
        self.assertEqual(stored["endpoint"], "https://push.example/ep1")
        self.assertIn("expirationTime", stored)
        mock_track.assert_called_once_with(ANY, "push_subscribed", {"channel": "web_push"})

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
        mock_track.assert_any_call(ANY, "push_unsubscribed", {"channel": "fcm"})

        self.assertEqual(result, {"subscribed": False})
        self.assertEqual(len(table.items), 0)

    def test_idempotent_when_nothing_to_remove(self):
        table = _FakePushSubscriptionsTable()
        with patch.object(backend_module, "push_subscriptions_table", table):
            result = asyncio.run(unsubscribe_from_push(
                PushUnsubscribeRequest(channel="fcm", fcmToken="never-subscribed"),
                request_with_headers({"X-Anonymous-User-Id": "anon-1"}),
            ))
        self.assertEqual(result, {"subscribed": False})


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
            patch.object(backend_module, "_track_duel_event", side_effect=lambda req, name, data: tracked.append((name, data))),
        ):
            summary = send_push_notification(
                request_with_headers({}), "anon-1", "Someone answered", "Go look"
            )

        self.assertEqual(summary, {"delivered": 2, "failed": 0, "pruned": 0})
        mock_web_push.assert_called_once()
        mock_fcm.assert_called_once()
        self.assertEqual(
            sorted(name for name, _ in tracked),
            ["push_delivery_succeeded", "push_delivery_succeeded"],
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
