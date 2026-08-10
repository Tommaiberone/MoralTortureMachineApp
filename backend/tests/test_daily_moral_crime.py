import asyncio
import os
import unittest
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import Mock, patch

from botocore.exceptions import ClientError
from starlette.requests import Request

os.environ.setdefault("AWS_EC2_METADATA_DISABLED", "true")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")
os.environ.setdefault("AWS_DEFAULT_REGION", "eu-west-1")

from backend.src.backend_fastapi import (  # noqa: E402
    DailyMoralCrimeVoteRequest,
    _daily_moral_crime_base_id,
    _daily_moral_crime_window,
    get_daily_moral_crime,
    vote_daily_moral_crime,
)
from backend.src import backend_fastapi as backend_module  # noqa: E402


def request_with_headers(headers, path="/daily-moral-crime"):
    return Request({
        "type": "http",
        "method": "GET",
        "path": path,
        "headers": [(key.lower().encode(), value.encode()) for key, value in headers.items()],
    })


def _transaction_cancelled():
    return ClientError(
        {"Error": {"Code": "TransactionCanceledException", "Message": "Transaction cancelled"}},
        "TransactWriteItems",
    )


class _FakeDailyVotesTable:
    """In-memory double that exercises the two-row transaction semantics.

    It deliberately understands just the serialized expressions used by the
    Daily endpoint, including the duplicate-vote cancellation path.
    """

    def __init__(self):
        self.items = {}
        self.transactions = []
        self.meta = SimpleNamespace(client=SimpleNamespace(transact_write_items=self.transact_write_items))

    @staticmethod
    def _value(attribute):
        if "S" in attribute:
            return attribute["S"]
        if "N" in attribute:
            return int(attribute["N"])
        if "BOOL" in attribute:
            return attribute["BOOL"]
        raise AssertionError(f"Unsupported DynamoDB attribute: {attribute}")

    def get_item(self, Key):
        item = self.items.get((Key["dayKey"], Key["entryKey"]))
        return {"Item": dict(item)} if item else {}

    def transact_write_items(self, TransactItems):
        self.transactions.append(TransactItems)
        put = TransactItems[0]["Put"]
        put_item = {key: self._value(value) for key, value in put["Item"].items()}
        key = (put_item["dayKey"], put_item["entryKey"])
        if key in self.items:
            raise _transaction_cancelled()
        self.items[key] = put_item

        update = TransactItems[1]["Update"]
        aggregate_key = tuple(self._value(update["Key"][key]) for key in ("dayKey", "entryKey"))
        aggregate = self.items.setdefault(aggregate_key, {
            "dayKey": aggregate_key[0],
            "entryKey": aggregate_key[1],
        })
        values = {key: self._value(value) for key, value in update["ExpressionAttributeValues"].items()}
        aggregate["dilemmaBaseId"] = values[":base_id"]
        aggregate["updatedAt"] = values[":now"]
        aggregate["expirationTime"] = values[":expires"]
        vote_field = update["ExpressionAttributeNames"]["#votes"]
        aggregate[vote_field] = aggregate.get(vote_field, 0) + values[":increment"]


class DailyMoralCrimeTests(unittest.TestCase):
    def setUp(self):
        self.daily_votes = _FakeDailyVotesTable()
        self.dilemmas = Mock()
        self.dilemmas.get_item.return_value = {"Item": {
            "_id": "daily-base-en",
            "baseId": "daily-base",
            "dilemma": "A difficult choice.",
            "firstAnswer": "Choose first",
            "secondAnswer": "Choose second",
            "teaseOption1": "First reflection.",
            "teaseOption2": "Second reflection.",
        }}
        self.patches = [
            patch.object(backend_module, "daily_moral_crime_votes_table", self.daily_votes),
            patch.object(backend_module, "table", self.dilemmas),
            patch.object(backend_module, "dynamodb", SimpleNamespace(meta=self.daily_votes.meta)),
        ]
        for current_patch in self.patches:
            current_patch.start()
            self.addCleanup(current_patch.stop)

    def test_global_window_changes_at_0900_utc_not_local_midnight(self):
        before = _daily_moral_crime_window(datetime(2026, 8, 11, 8, 59, tzinfo=timezone.utc))
        after = _daily_moral_crime_window(datetime(2026, 8, 11, 9, 0, tzinfo=timezone.utc))

        self.assertEqual(before["dayKey"], "2026-08-10")
        self.assertEqual(after["dayKey"], "2026-08-11")
        self.assertEqual(after["releaseAt"].hour, 9)
        self.assertEqual(after["nextReleaseAt"].hour, 9)

    def test_catalog_selection_is_deterministic_and_cycles_after_the_deck(self):
        catalog = {
            "version": "test-v1",
            "startDate": datetime(2026, 8, 10, tzinfo=timezone.utc).date(),
            "baseIds": ("a", "b", "c"),
        }
        with patch.object(backend_module, "_daily_moral_crime_catalog_cache", catalog):
            self.assertEqual(_daily_moral_crime_base_id("2026-08-10"), ("a", "test-v1"))
            self.assertEqual(_daily_moral_crime_base_id("2026-08-12"), ("c", "test-v1"))
            self.assertEqual(_daily_moral_crime_base_id("2026-08-13"), ("a", "test-v1"))

    def test_aggregates_are_hidden_before_vote_then_revealed_afterwards(self):
        response = asyncio.run(get_daily_moral_crime(
            request_with_headers({"X-Anonymous-User-Id": "anon-1"}),
        ))

        self.assertFalse(response["hasVoted"])
        self.assertNotIn("results", response)
        self.assertNotIn("reflection", response)
        self.assertEqual(response["dilemma"]["firstAnswer"], "Choose first")

        response = asyncio.run(vote_daily_moral_crime(
            DailyMoralCrimeVoteRequest(dayKey=response["dayKey"], choice="first"),
            request_with_headers({"X-Anonymous-User-Id": "anon-1"}, "/daily-moral-crime/vote"),
        ))

        self.assertTrue(response["hasVoted"])
        self.assertEqual(response["choice"], "first")
        self.assertEqual(response["reflection"], "First reflection.")
        self.assertEqual(response["results"], {
            "firstVotes": 1,
            "secondVotes": 0,
            "totalVotes": 1,
            "firstPct": 100,
            "secondPct": 0,
        })

    def test_retry_returns_the_original_vote_without_double_counting(self):
        day_key = _daily_moral_crime_window()["dayKey"]
        first = asyncio.run(vote_daily_moral_crime(
            DailyMoralCrimeVoteRequest(dayKey=day_key, choice="first"),
            request_with_headers({"X-Anonymous-User-Id": "anon-1"}, "/daily-moral-crime/vote"),
        ))
        retry = asyncio.run(vote_daily_moral_crime(
            DailyMoralCrimeVoteRequest(dayKey=day_key, choice="second"),
            request_with_headers({"X-Anonymous-User-Id": "anon-1"}, "/daily-moral-crime/vote"),
        ))

        self.assertEqual(len(self.daily_votes.transactions), 2)
        self.assertEqual(first["results"]["totalVotes"], 1)
        self.assertEqual(retry["choice"], "first")
        self.assertEqual(retry["results"], first["results"])
