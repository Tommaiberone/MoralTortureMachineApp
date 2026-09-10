#!/usr/bin/env python3
"""TASK-300.5/ADR-137: one-off seed of the write-time registered-user
counter (REGISTERED_USER_COUNT_SENTINEL_SUB in users_table).

/admin/analytics/overview no longer calls the full-table Scan
_count_registered_users() used to require - it reads a counter that
upsert_user_record now increments exactly once per brand-new account. That
counter does not exist yet in production, and starting it at 0 would make
the dashboard's "registered users" figure appear to suddenly drop to zero
(then only count new signups from this point on) instead of reflecting the
real existing total. This script runs _count_registered_users() one last
time - the only remaining reason that Scan exists in this codebase - and
writes its result as the counter's starting value.

Idempotent by construction: it always SETs the counter to a freshly
recomputed Scan total (never ADDs), so re-running it simply re-syncs the
counter to the current real count rather than drifting further from it -
though after the first successful run there should be no reason to run it
again, since upsert_user_record keeps the counter accurate from then on.

Usage (from the repository root):
    python -m backend.scripts.seed_registered_user_count
    python -m backend.scripts.seed_registered_user_count --execute

With no flags this is a dry run: it computes and prints the current count
without writing anything. --execute is required to actually write to
DynamoDB - per CLAUDE.md's risky-action protocol, only pass --execute
against the production table after the user has explicitly confirmed.
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from backend.src.backend_fastapi import (  # noqa: E402
    REGISTERED_USER_COUNT_SENTINEL_SUB,
    _count_registered_users,
    users_table,
)


def run(execute: bool) -> None:
    print("Scanning users_table for the current real registered-user count...")
    count = _count_registered_users()
    print(f"Computed count: {count}")

    if not execute:
        print("\nDRY RUN - no write performed. Pass --execute to write to DynamoDB.")
        return

    users_table.update_item(
        Key={"sub": REGISTERED_USER_COUNT_SENTINEL_SUB},
        UpdateExpression="SET registeredUserCount = :count",
        ExpressionAttributeValues={":count": count},
    )
    print(f"Seeded {REGISTERED_USER_COUNT_SENTINEL_SUB} with registeredUserCount = {count}.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Actually write to DynamoDB. Without this flag, only the computed count is printed.",
    )
    args = parser.parse_args()
    run(execute=args.execute)


if __name__ == "__main__":
    main()
