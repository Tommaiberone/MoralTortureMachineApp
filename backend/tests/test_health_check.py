import asyncio
import json
import os
import unittest
from unittest.mock import Mock, patch

os.environ.setdefault("AWS_EC2_METADATA_DISABLED", "true")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")
os.environ.setdefault("AWS_DEFAULT_REGION", "eu-west-1")

from backend.src.backend_fastapi import (  # noqa: E402
    health_check,
    _rate_limit_rules_for_request,
)
from backend.src import backend_fastapi as backend_module  # noqa: E402


def _healthy_table():
    fake = Mock()
    fake.meta.client.describe_table.return_value = {}
    return fake


class HealthCheckTestCase(unittest.TestCase):
    def setUp(self):
        # health_check() talks to real module-level table/ssm_client globals
        # directly - patch every dependency it checks so each test controls
        # exactly which ones succeed or fail, rather than hitting real AWS
        # with the fake credentials this test suite sets.
        self.patches = [
            patch.object(backend_module, "table", _healthy_table()),
            patch.object(backend_module, "analytics_table", _healthy_table()),
            patch.object(backend_module, "product_events_table", _healthy_table()),
            patch.object(backend_module, "daily_moral_crime_votes_table", _healthy_table()),
            patch.object(backend_module, "ssm_client", Mock()),
        ]
        for p in self.patches:
            p.start()
            self.addCleanup(p.stop)

    def test_dependency_failure_never_leaks_raw_exception_text(self):
        # TASK-246: /health is public and unauthenticated - a failing
        # dependency check must report only "error", never the real
        # exception string (which can name specific AWS resources/IAM
        # permissions).
        failing_table = Mock()
        failing_table.meta.client.describe_table.side_effect = Exception(
            "AccessDenied: user arn:aws:iam::123456789012:user/secret-role is not authorized"
        )
        with patch.object(backend_module, "table", failing_table):
            result = asyncio.run(health_check())

        body = json.loads(result.body)
        self.assertEqual(body["checks"]["dynamodb_dilemmas"], "error")
        raw_body_text = result.body.decode()
        self.assertNotIn("AccessDenied", raw_body_text)
        self.assertNotIn("arn:aws:iam", raw_body_text)
        self.assertEqual(result.status_code, 503)

    def test_all_dependencies_healthy_returns_200(self):
        result = asyncio.run(health_check())
        body = json.loads(result.body)
        self.assertEqual(result.status_code, 200)
        self.assertEqual(body["status"], "healthy")
        self.assertTrue(all(v == "ok" for v in body["checks"].values()))

    def test_health_has_its_own_dedicated_rate_limit_bucket(self):
        # Previously fell through to the generic "global" bucket (120/min)
        # despite doing five DynamoDB DescribeTable calls plus one SSM
        # GetParameter per hit.
        rules = _rate_limit_rules_for_request("GET", "/health")
        rule_names = [name for name, _ in rules]
        self.assertIn("health_check", rule_names)


if __name__ == "__main__":
    unittest.main()
