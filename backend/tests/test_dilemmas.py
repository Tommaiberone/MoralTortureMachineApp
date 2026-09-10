import asyncio
import os
import unittest
from unittest.mock import Mock, patch

os.environ.setdefault("AWS_EC2_METADATA_DISABLED", "true")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")
os.environ.setdefault("AWS_DEFAULT_REGION", "eu-west-1")

from fastapi import HTTPException
from starlette.requests import Request

from backend.src.backend_fastapi import (  # noqa: E402
    _pick_random_dilemma_base_ids,
    get_dilemma,
)
from backend.src import backend_fastapi as backend_module  # noqa: E402


def request_with_headers(headers=None):
    headers = headers or {}
    return Request({
        "type": "http",
        "method": "GET",
        "path": "/get-dilemma",
        "headers": [(key.lower().encode(), value.encode()) for key, value in headers.items()],
        "client": ("127.0.0.1", 1234),
    })


def dilemma_item(suffix, language="en"):
    return {
        "_id": f"d{suffix}-{language}",
        "language": language,
        "dilemma": f"Dilemma {suffix}?",
        "firstAnswer": "A",
        "secondAnswer": "B",
        "yesCount": 0,
        "noCount": 0,
    }


class GetDilemmaTests(unittest.TestCase):
    """TASK-302/ADR-137: get_dilemma used to read a language's whole pool
    via a single, unpaginated table.scan() - both wasteful on the app's
    most-called endpoint and silently truncated at ~1MB with no error. It
    must now Query LanguageIndex, fully paginated."""

    def test_queries_the_language_index_instead_of_scanning(self):
        dilemmas_table = Mock()
        dilemmas_table.query.return_value = {"Items": [dilemma_item(1)]}
        with (
            patch.object(backend_module, "table", dilemmas_table),
            patch.object(backend_module, "analytics_table", Mock()),
            patch.object(backend_module, "analytics_daily_aggregates_table", Mock()),
            patch.object(backend_module, "_network_fingerprint", return_value=None),
        ):
            result = asyncio.run(get_dilemma(request_with_headers(), language="en"))

        dilemmas_table.scan.assert_not_called()
        dilemmas_table.query.assert_called_once()
        call_kwargs = dilemmas_table.query.call_args.kwargs
        self.assertEqual(call_kwargs["IndexName"], "LanguageIndex")
        self.assertEqual(call_kwargs["ExpressionAttributeValues"], {":language": "en"})
        self.assertEqual(result["_id"], "d1-en")

    def test_paginates_across_multiple_query_pages(self):
        dilemmas_table = Mock()
        dilemmas_table.query.side_effect = [
            {"Items": [dilemma_item(1)], "LastEvaluatedKey": {"_id": "d1-en"}},
            {"Items": [dilemma_item(2)]},
        ]
        with (
            patch.object(backend_module, "table", dilemmas_table),
            patch.object(backend_module, "analytics_table", Mock()),
            patch.object(backend_module, "analytics_daily_aggregates_table", Mock()),
            patch.object(backend_module, "_network_fingerprint", return_value=None),
        ):
            # Exclude d2 so the only way the response can be d2 is if the
            # second (paginated) page was actually read.
            result = asyncio.run(get_dilemma(request_with_headers(), language="en", exclude="d1-en"))

        self.assertEqual(dilemmas_table.query.call_count, 2)
        self.assertEqual(result["_id"], "d2-en")

    def test_resets_the_pool_when_every_dilemma_is_excluded(self):
        dilemmas_table = Mock()
        dilemmas_table.query.return_value = {"Items": [dilemma_item(1)]}
        with (
            patch.object(backend_module, "table", dilemmas_table),
            patch.object(backend_module, "analytics_table", Mock()),
            patch.object(backend_module, "analytics_daily_aggregates_table", Mock()),
            patch.object(backend_module, "_network_fingerprint", return_value=None),
        ):
            result = asyncio.run(get_dilemma(request_with_headers(), language="en", exclude="d1-en"))

        self.assertEqual(result["_id"], "d1-en")

    def test_raises_404_when_the_language_has_no_dilemmas(self):
        dilemmas_table = Mock()
        dilemmas_table.query.return_value = {"Items": []}
        with patch.object(backend_module, "table", dilemmas_table):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(get_dilemma(request_with_headers(), language="fr"))
        self.assertEqual(raised.exception.status_code, 404)


class PickRandomDilemmaBaseIdsTests(unittest.TestCase):
    """TASK-302/ADR-137: same Query-instead-of-Scan fix for Party Room's
    dilemma sampling."""

    def test_queries_the_language_index_instead_of_scanning(self):
        dilemmas_table = Mock()
        dilemmas_table.query.return_value = {
            "Items": [dilemma_item(1), dilemma_item(2), dilemma_item(3)],
        }
        with patch.object(backend_module, "table", dilemmas_table):
            base_ids = _pick_random_dilemma_base_ids("en", 2)

        dilemmas_table.scan.assert_not_called()
        dilemmas_table.query.assert_called_once()
        self.assertEqual(dilemmas_table.query.call_args.kwargs["IndexName"], "LanguageIndex")
        self.assertEqual(len(base_ids), 2)
        self.assertTrue(set(base_ids).issubset({"d1", "d2", "d3"}))

    def test_paginates_across_multiple_query_pages(self):
        dilemmas_table = Mock()
        dilemmas_table.query.side_effect = [
            {"Items": [dilemma_item(1)], "LastEvaluatedKey": {"_id": "d1-en"}},
            {"Items": [dilemma_item(2)]},
        ]
        with patch.object(backend_module, "table", dilemmas_table):
            base_ids = _pick_random_dilemma_base_ids("en", 5)

        self.assertEqual(dilemmas_table.query.call_count, 2)
        self.assertEqual(sorted(base_ids), ["d1", "d2"])

    def test_raises_404_when_the_language_has_no_dilemmas(self):
        dilemmas_table = Mock()
        dilemmas_table.query.return_value = {"Items": []}
        with patch.object(backend_module, "table", dilemmas_table):
            with self.assertRaises(HTTPException) as raised:
                _pick_random_dilemma_base_ids("fr", 5)
        self.assertEqual(raised.exception.status_code, 404)


if __name__ == "__main__":
    unittest.main()
