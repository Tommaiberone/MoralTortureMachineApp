import asyncio
import json
import os
import unittest
from unittest.mock import patch

import requests
from fastapi import HTTPException
from starlette.requests import Request

os.environ.setdefault("AWS_EC2_METADATA_DISABLED", "true")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")
os.environ.setdefault("AWS_DEFAULT_REGION", "eu-west-1")

from backend.src.backend_fastapi import (  # noqa: E402
    AnalyzeResultsRequest,
    analyze_results,
)
from backend.src import backend_fastapi as backend_module  # noqa: E402


def request_with_headers(headers=None, path="/analyze-results"):
    headers = headers or {}
    return Request({
        "type": "http",
        "method": "POST",
        "path": path,
        "headers": [(key.lower().encode(), value.encode()) for key, value in headers.items()],
        "client": ("test-client", 123),
    })


SIX_DIMENSIONS = ["Empathy", "Integrity", "Responsibility", "Justice", "Altruism", "Honesty"]


def answers_payload(value=3.0):
    return [{dimension: value for dimension in SIX_DIMENSIONS}]


class AnalyzeResultsAiFailureTests(unittest.TestCase):
    """TASK-143: a failed Groq call must never hide the deterministic archetype."""

    def setUp(self):
        backend_module._api_key_cache = "test-groq-key"

    def tearDown(self):
        backend_module._api_key_cache = None

    def test_rate_limit_exhaustion_still_returns_archetype(self):
        req = AnalyzeResultsRequest(answers=answers_payload())
        with patch.object(
            backend_module,
            "call_groq_api_with_fallback",
            side_effect=HTTPException(status_code=429, detail="All AI models are currently rate-limited."),
        ):
            response = asyncio.run(analyze_results(req, request_with_headers(), language="en"))

        self.assertEqual(response.status_code, 429)
        body = json.loads(response.body)
        self.assertIsNone(body["analysis"])
        self.assertIsNotNone(body["archetype"])
        self.assertIsNotNone(body["averages"])
        self.assertTrue(body["aiUnavailable"])

    def test_connection_error_still_returns_archetype(self):
        req = AnalyzeResultsRequest(answers=answers_payload())
        with patch.object(
            backend_module,
            "call_groq_api_with_fallback",
            side_effect=requests.exceptions.ConnectionError("boom"),
        ):
            response = asyncio.run(analyze_results(req, request_with_headers(), language="en"))

        self.assertEqual(response.status_code, 502)
        body = json.loads(response.body)
        self.assertIsNone(body["analysis"])
        self.assertIsNotNone(body["archetype"])

    def test_malformed_ai_response_still_returns_archetype(self):
        req = AnalyzeResultsRequest(answers=answers_payload())
        with patch.object(
            backend_module,
            "call_groq_api_with_fallback",
            return_value={"unexpected": "shape"},
        ):
            response = asyncio.run(analyze_results(req, request_with_headers(), language="en"))

        self.assertEqual(response.status_code, 502)
        body = json.loads(response.body)
        self.assertIsNone(body["analysis"])
        self.assertIsNotNone(body["archetype"])

    def test_success_path_is_unaffected(self):
        req = AnalyzeResultsRequest(answers=answers_payload())
        with patch.object(
            backend_module,
            "call_groq_api_with_fallback",
            return_value={"choices": [{"message": {"content": "some analysis"}}]},
        ), patch.object(backend_module, "track_analytics_event"):
            result = asyncio.run(analyze_results(req, request_with_headers(), language="en"))

        self.assertEqual(result["analysis"], "some analysis")
        self.assertIsNotNone(result["archetype"])
        self.assertIsNotNone(result["averages"])


if __name__ == "__main__":
    unittest.main()
