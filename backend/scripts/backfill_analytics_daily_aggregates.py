#!/usr/bin/env python3
"""TASK-300.4/ADR-137: one-off backfill of analytics_daily_aggregates for
historical rows written before TASK-300.1/300.2 existed.

The write-time aggregates those tasks introduced only populate for events
written from their deploy onward. Without this script, the admin dashboard
would show a hole in every trend/funnel/retention field for every day
before that deploy, for as long as those raw rows remain inside their
90-day TTL.

Reuses the exact same functions the live write path uses
(normalize_analytics_event, _scalar_aggregate_increments,
_set_aggregate_increments) so the backfilled data is guaranteed to match
what TASK-300.1/300.2 would have produced if they had been active since
the beginning - never a second, independently-maintained computation that
could quietly drift from the real one.

Idempotent by construction: for every historical UTC day, this computes
the FULL total (never an incremental delta) from every raw row currently
visible for that day, then PutItem-*replaces* (never ADD-increments) the
corresponding aggregate item. Re-running is a no-op if nothing about the
underlying raw data changed. The current UTC day is deliberately skipped -
it is already being accumulated correctly by the live path since whichever
task deployed first, and replacing it here could race with a concurrent
live ADD and undercount it; only fully-elapsed past days are ever safe to
recompute this way.

Usage (from the repository root, so `backend.src.backend_fastapi` resolves
as a package import exactly like the test suite already relies on):

    python -m backend.scripts.backfill_analytics_daily_aggregates
    python -m backend.scripts.backfill_analytics_daily_aggregates --execute

With no flags this is a dry run: it scans, computes, and prints a per-day
summary without writing anything. --execute is required to actually write
to DynamoDB - per CLAUDE.md's risky-action protocol, only pass --execute
against the production tables after the user has explicitly confirmed.
"""
import argparse
import sys
import time
from collections import defaultdict
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from backend.src.backend_fastapi import (  # noqa: E402
    ANALYTICS_RAW_RETENTION_SECONDS,
    _analytics_day_key,
    _scalar_aggregate_increments,
    _scan_all_rows,
    _set_aggregate_increments,
    analytics_daily_aggregates_table,
    analytics_table,
    normalize_analytics_event,
    product_events_table,
)


def compute_full_day_aggregates(
    legacy_rows: list[dict[str, Any]],
    product_rows: list[dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    """Pure function: {day_key: {"numeric": {...}, "sets": {...}, "expirationTime": int}}.

    Deliberately recomputes each day's FULL total from scratch rather than
    accumulating a delta, which is what makes re-running this script safe.
    """
    by_day: dict[str, dict[str, Any]] = defaultdict(
        lambda: {"numeric": defaultdict(int), "sets": defaultdict(set), "expirationTime": 0}
    )
    for source, rows in (("legacy", legacy_rows), ("product", product_rows)):
        for row in rows:
            normalized = normalize_analytics_event(row, source)
            day_key = _analytics_day_key(normalized["occurredAt"])
            bucket = by_day[day_key]
            for attribute_name, delta in _scalar_aggregate_increments(normalized).items():
                bucket["numeric"][attribute_name] += delta
            for attribute_name, identities in _set_aggregate_increments(normalized).items():
                bucket["sets"][attribute_name] |= identities
            row_expiration = row.get("expirationTime")
            if isinstance(row_expiration, (int, float)) and row_expiration > bucket["expirationTime"]:
                bucket["expirationTime"] = int(row_expiration)
    return by_day


def _day_item(day_key: str, bucket: dict[str, Any]) -> dict[str, Any]:
    item: dict[str, Any] = {
        "dayKey": day_key,
        "expirationTime": bucket["expirationTime"] or (int(time.time()) + ANALYTICS_RAW_RETENTION_SECONDS),
    }
    item.update(bucket["numeric"])
    item.update({name: identities for name, identities in bucket["sets"].items() if identities})
    return item


def run(execute: bool) -> None:
    today_key = _analytics_day_key(int(time.time() * 1000))

    print("Scanning historical raw rows (user_analytics, product_events)...")
    legacy_rows = _scan_all_rows(analytics_table)
    product_rows = _scan_all_rows(product_events_table)
    print(f"Found {len(legacy_rows)} legacy rows and {len(product_rows)} product rows.")

    by_day = compute_full_day_aggregates(legacy_rows, product_rows)
    past_days = sorted(day_key for day_key in by_day if day_key != today_key)
    print(f"Computed aggregates for {len(by_day)} distinct UTC days "
          f"({len(past_days)} of them fully elapsed and eligible for backfill).")
    if today_key in by_day:
        print(f"Skipping {today_key} (today, UTC) - already covered by the live write path.")

    if not execute:
        print("\nDRY RUN - no writes performed. Pass --execute to write to DynamoDB.\n")

    for day_key in past_days:
        item = _day_item(day_key, by_day[day_key])
        attribute_count = len(item) - 2  # exclude dayKey/expirationTime
        if not execute:
            print(f"[dry-run] {day_key}: {attribute_count} attributes")
            continue
        analytics_daily_aggregates_table.put_item(Item=item)
        print(f"[written] {day_key}: {attribute_count} attributes")

    print("Done." if execute else "Dry run complete - re-run with --execute to apply.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Actually write to DynamoDB. Without this flag, only a dry-run summary is printed.",
    )
    args = parser.parse_args()
    run(execute=args.execute)


if __name__ == "__main__":
    main()
