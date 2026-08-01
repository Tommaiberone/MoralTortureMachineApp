import os
import unittest
from unittest.mock import Mock, patch

os.environ.setdefault("AWS_EC2_METADATA_DISABLED", "true")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")
os.environ.setdefault("AWS_DEFAULT_REGION", "eu-west-1")

from backend.src import backend_fastapi as backend_module  # noqa: E402


class ShouldNotifyOpsTests(unittest.TestCase):
    """TASK-104: one SNS email per (status_code, path) per cooldown window,
    not one per request, so an ordinary burst of the same client error can't
    flood the owner's inbox."""

    def setUp(self):
        backend_module._ops_notification_last_sent.clear()

    def test_first_occurrence_notifies(self):
        self.assertTrue(backend_module._should_notify_ops(404, "/profiles/x", now_seconds=1000.0))

    def test_repeat_within_cooldown_is_suppressed(self):
        backend_module._should_notify_ops(404, "/profiles/x", now_seconds=1000.0)
        self.assertFalse(backend_module._should_notify_ops(404, "/profiles/x", now_seconds=1005.0))

    def test_repeat_after_cooldown_notifies_again(self):
        backend_module._should_notify_ops(404, "/profiles/x", now_seconds=1000.0)
        after_cooldown = 1000.0 + backend_module.OPS_ERROR_NOTIFICATION_COOLDOWN_SECONDS + 1
        self.assertTrue(backend_module._should_notify_ops(404, "/profiles/x", now_seconds=after_cooldown))

    def test_different_status_or_path_notifies_independently(self):
        backend_module._should_notify_ops(404, "/profiles/x", now_seconds=1000.0)
        self.assertTrue(backend_module._should_notify_ops(500, "/profiles/x", now_seconds=1000.0))
        self.assertTrue(backend_module._should_notify_ops(404, "/profiles/y", now_seconds=1000.0))


class NotifyOpsOfErrorTests(unittest.TestCase):
    def setUp(self):
        backend_module._ops_notification_last_sent.clear()

    def _fake_request(self, path="/profiles/x", method="GET"):
        request = Mock()
        request.url.path = path
        request.method = method
        return request

    def test_no_topic_arn_never_calls_sns(self):
        with (
            patch.object(backend_module, "OPS_ALERTS_TOPIC_ARN", ""),
            patch.object(backend_module, "sns_client") as sns_client,
        ):
            backend_module._notify_ops_of_error(self._fake_request(), 500, "boom")
        sns_client.publish.assert_not_called()

    def test_disabled_never_calls_sns(self):
        with (
            patch.object(backend_module, "OPS_ALERTS_TOPIC_ARN", "arn:aws:sns:eu-west-1:123:topic"),
            patch.object(backend_module, "OPS_ERROR_NOTIFICATIONS_ENABLED", False),
            patch.object(backend_module, "sns_client") as sns_client,
        ):
            backend_module._notify_ops_of_error(self._fake_request(), 500, "boom")
        sns_client.publish.assert_not_called()

    def test_publishes_once_when_configured(self):
        with (
            patch.object(backend_module, "OPS_ALERTS_TOPIC_ARN", "arn:aws:sns:eu-west-1:123:topic"),
            patch.object(backend_module, "OPS_ERROR_NOTIFICATIONS_ENABLED", True),
            patch.object(backend_module, "sns_client") as sns_client,
        ):
            backend_module._notify_ops_of_error(self._fake_request(), 500, "boom")
        sns_client.publish.assert_called_once()
        kwargs = sns_client.publish.call_args.kwargs
        self.assertEqual(kwargs["TopicArn"], "arn:aws:sns:eu-west-1:123:topic")
        self.assertIn("500", kwargs["Subject"])

    def test_sns_failure_is_swallowed(self):
        with (
            patch.object(backend_module, "OPS_ALERTS_TOPIC_ARN", "arn:aws:sns:eu-west-1:123:topic"),
            patch.object(backend_module, "OPS_ERROR_NOTIFICATIONS_ENABLED", True),
            patch.object(backend_module, "sns_client") as sns_client,
        ):
            sns_client.publish.side_effect = RuntimeError("network down")
            # Must not raise: a notification failure can never break the response it describes.
            backend_module._notify_ops_of_error(self._fake_request(), 500, "boom")


if __name__ == "__main__":
    unittest.main()
