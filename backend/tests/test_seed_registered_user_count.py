import os
import unittest
from unittest.mock import Mock, patch

os.environ.setdefault("AWS_EC2_METADATA_DISABLED", "true")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")
os.environ.setdefault("AWS_DEFAULT_REGION", "eu-west-1")

from backend.scripts import seed_registered_user_count as seed_module  # noqa: E402
from backend.src.backend_fastapi import REGISTERED_USER_COUNT_SENTINEL_SUB  # noqa: E402


class SeedRegisteredUserCountTests(unittest.TestCase):
    """TASK-300.5/ADR-137."""

    def test_dry_run_does_not_write(self):
        table = Mock()
        with (
            patch.object(seed_module, "_count_registered_users", return_value=42),
            patch.object(seed_module, "users_table", table),
        ):
            seed_module.run(execute=False)
        table.update_item.assert_not_called()

    def test_execute_writes_the_computed_count(self):
        table = Mock()
        with (
            patch.object(seed_module, "_count_registered_users", return_value=42),
            patch.object(seed_module, "users_table", table),
        ):
            seed_module.run(execute=True)

        table.update_item.assert_called_once_with(
            Key={"sub": REGISTERED_USER_COUNT_SENTINEL_SUB},
            UpdateExpression="SET registeredUserCount = :count",
            ExpressionAttributeValues={":count": 42},
        )

    def test_rerunning_resyncs_to_a_freshly_recomputed_count(self):
        table = Mock()
        with patch.object(seed_module, "users_table", table):
            with patch.object(seed_module, "_count_registered_users", return_value=10):
                seed_module.run(execute=True)
            with patch.object(seed_module, "_count_registered_users", return_value=12):
                seed_module.run(execute=True)

        second_call = table.update_item.call_args_list[1]
        self.assertEqual(second_call.kwargs["ExpressionAttributeValues"], {":count": 12})


if __name__ == "__main__":
    unittest.main()
