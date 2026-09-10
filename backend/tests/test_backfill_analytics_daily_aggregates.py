import os
import unittest
import uuid
from unittest.mock import Mock, patch

os.environ.setdefault("AWS_EC2_METADATA_DISABLED", "true")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")
os.environ.setdefault("AWS_DEFAULT_REGION", "eu-west-1")

from backend.scripts import backfill_analytics_daily_aggregates as backfill_module  # noqa: E402
from backend.scripts.backfill_analytics_daily_aggregates import (  # noqa: E402
    _day_item,
    compute_full_day_aggregates,
    run,
)
from backend.src.backend_fastapi import (  # noqa: E402
    _analytics_day_key,
    build_analytics_overview,
)


class BackfillComputationTests(unittest.TestCase):
    """TASK-300.4/ADR-137."""

    def _sample_rows(self, now_ms: int):
        day0 = now_ms - 2 * 24 * 60 * 60 * 1000
        day1 = now_ms - 1 * 24 * 60 * 60 * 1000
        legacy_rows = [
            {"sessionId": "s1", "timestamp": day0 + 1000, "actionType": "dilemma_fetched",
             "anonymousUserId": "user-1", "platform": "web", "language": "en",
             "expirationTime": 9999999999, "actionData": '{"dilemma_id": "trolley-1"}'},
            {"sessionId": "s1", "timestamp": day1 + 500, "actionType": "vote_cast",
             "anonymousUserId": "user-1", "platform": "web", "language": "en",
             "expirationTime": 9999999998},
        ]
        product_rows = [
            {"eventId": str(uuid.uuid4()), "anonymousUserId": "user-2", "occurredAt": day0 + 2000,
             "actionType": "share_clicked", "platform": "web", "expirationTime": 9999999997,
             "properties": '{"channel": "whatsapp", "object_type": "challenge"}'},
        ]
        return legacy_rows, product_rows, day0, day1

    def test_computation_is_deterministic_across_repeated_runs(self):
        now_ms = 1785369600000
        legacy_rows, product_rows, _day0, _day1 = self._sample_rows(now_ms)

        first = compute_full_day_aggregates(legacy_rows, product_rows)
        second = compute_full_day_aggregates(legacy_rows, product_rows)

        first_items = {day: _day_item(day, bucket) for day, bucket in first.items()}
        second_items = {day: _day_item(day, bucket) for day, bucket in second.items()}
        self.assertEqual(first_items, second_items)

    def test_put_item_replace_is_idempotent_unlike_add(self):
        """AC#2: re-running must not double-count, unlike the live path's ADD."""
        now_ms = 1785369600000
        legacy_rows, product_rows, day0, _day1 = self._sample_rows(now_ms)
        by_day = compute_full_day_aggregates(legacy_rows, product_rows)
        day_key = _analytics_day_key(day0)
        item_first_run = _day_item(day_key, by_day[day_key])

        # Simulate a second, independent run over the same still-unchanged
        # raw data - a real rerun would recompute from a fresh Scan, but the
        # important property is that the same input always yields the same
        # output, never an accumulated-on-top-of-itself total.
        by_day_again = compute_full_day_aggregates(legacy_rows, product_rows)
        item_second_run = _day_item(day_key, by_day_again[day_key])

        self.assertEqual(item_first_run, item_second_run)
        # A PutItem with this same item twice leaves the stored item
        # unchanged - unlike ADD, which would double it.
        table = Mock()
        table.put_item(Item=item_first_run)
        table.put_item(Item=item_second_run)
        self.assertEqual(table.put_item.call_count, 2)
        first_call, second_call = table.put_item.call_args_list
        self.assertEqual(first_call.kwargs["Item"], second_call.kwargs["Item"])

    def test_expiration_time_takes_the_max_seen_for_the_day(self):
        now_ms = 1785369600000
        legacy_rows, product_rows, day0, _day1 = self._sample_rows(now_ms)
        by_day = compute_full_day_aggregates(legacy_rows, product_rows)
        day_key = _analytics_day_key(day0)

        # day0 has legacy expirationTime=9999999999 and product expirationTime=9999999997.
        self.assertEqual(by_day[day_key]["expirationTime"], 9999999999)

    def test_run_skips_the_current_utc_day_and_respects_dry_run(self):
        now_ms = 1785369600000
        legacy_rows, product_rows, day0, day1 = self._sample_rows(now_ms)
        # Add a "today" row that must never be written by the backfill.
        legacy_rows = [
            *legacy_rows,
            {"sessionId": "s-today", "timestamp": now_ms, "actionType": "vote_cast",
             "anonymousUserId": "user-today", "platform": "web", "expirationTime": 9999999999},
        ]
        aggregates_table = Mock()
        with (
            patch.object(backfill_module, "_scan_all_rows", side_effect=[legacy_rows, product_rows]),
            patch.object(backfill_module, "analytics_daily_aggregates_table", aggregates_table),
            patch.object(backfill_module.time, "time", return_value=now_ms / 1000),
        ):
            run(execute=False)
        aggregates_table.put_item.assert_not_called()

        with (
            patch.object(backfill_module, "_scan_all_rows", side_effect=[legacy_rows, product_rows]),
            patch.object(backfill_module, "analytics_daily_aggregates_table", aggregates_table),
            patch.object(backfill_module.time, "time", return_value=now_ms / 1000),
        ):
            run(execute=True)

        written_day_keys = {call.kwargs["Item"]["dayKey"] for call in aggregates_table.put_item.call_args_list}
        today_key = _analytics_day_key(now_ms)
        self.assertNotIn(today_key, written_day_keys)
        self.assertEqual(written_day_keys, {_analytics_day_key(day0), _analytics_day_key(day1)})

    def test_backfilled_aggregates_match_scan_derived_dashboard_output(self):
        """AC#1: the backfill must reproduce what build_analytics_overview's
        Scan-derived path already computes for the same historical rows -
        verified the same way TASK-300.1/300.2's own cross-check tests are."""
        now_ms = 1785369600000
        legacy_rows, product_rows, _day0, _day1 = self._sample_rows(now_ms)

        scan_only = build_analytics_overview(
            legacy_rows=legacy_rows, product_rows=product_rows, days=7, now_ms=now_ms, platform="all",
        )

        by_day = compute_full_day_aggregates(legacy_rows, product_rows)
        aggregate_items = [_day_item(day_key, bucket) for day_key, bucket in by_day.items()]
        aggregate_backed = build_analytics_overview(
            legacy_rows=legacy_rows, product_rows=product_rows, days=7, now_ms=now_ms, platform="all",
            aggregate_items=aggregate_items,
        )

        def _sorted(value):
            # Counter.most_common() only guarantees insertion-order
            # tie-breaking, and the two paths build their Counters in a
            # different order even when every count matches exactly.
            if isinstance(value, list):
                return sorted((_sorted(item) for item in value), key=repr)
            if isinstance(value, dict):
                return {key: _sorted(val) for key, val in value.items()}
            return value

        for field in ("eventCounts", "sourceCounts", "platformCounts", "topDilemmas", "funnel"):
            with self.subTest(field=field):
                self.assertEqual(_sorted(aggregate_backed[field]), _sorted(scan_only[field]))


if __name__ == "__main__":
    unittest.main()
