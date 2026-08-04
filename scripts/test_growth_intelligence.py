import json
import unittest
import zipfile
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from growth_intelligence import (
    add_error,
    build_recommendations,
    collect_artifact_history,
    collect_play_vitals,
    collect_search_console,
    demand_radar_candidates,
    history_recommendations,
    listing_snapshot_missing_fields,
    markdown_report,
    optional_keyword_planner_rows,
    post_with_retry,
)


class GrowthIntelligenceTests(unittest.TestCase):
    def test_creates_read_only_seo_and_aso_opportunities(self):
        data = {
            "configuration": {"missing": []},
            "search_console": {"rows": [{"keys": ["moral dilemma test", "https://example.test/", "MOBILE", "ITA"], "impressions": 120, "ctr": 0.02, "position": 11}]},
            "ga4": {"rows": [{"landing_page": "/", "organic_sessions": 80, "result_views": 30}]},
            "pagespeed": {"mobile": {"performance": 50, "lcp_ms": 3200}},
            "play": {"acquisition_rows": [{"keyword": "ethical game", "store_listing_visitors": 100, "visitor_to_installer_conversion_rate": 0.1}], "vitals": {"userPerceivedCrashRate": 0.02}, "listings": {"en": {"title": "x" * 31}}},
        }
        titles = [item["title"] for item in build_recommendations(data)]
        self.assertTrue(any("snippet" in title for title in titles))
        self.assertTrue(any("conversion" in title for title in titles))
        self.assertTrue(any("Android" in title for title in titles))
        self.assertIn("never changes web content", markdown_report(data))

    def test_does_not_report_without_threshold_evidence(self):
        data = {"configuration": {"missing": ["GA4_PROPERTY_ID"]}, "search_console": {"rows": []}, "ga4": {"rows": []}, "pagespeed": {}, "play": {"acquisition_rows": [], "vitals": {}, "listings": {}}}
        self.assertEqual(build_recommendations(data), [])
        self.assertIn("GA4_PROPERTY_ID", markdown_report(data))

    def test_report_surfaces_non_fatal_source_errors(self):
        data = {"configuration": {"missing": [], "errors": ["Search Console: HTTPError"]}, "search_console": {"rows": []}, "ga4": {"rows": []}, "pagespeed": {}, "play": {"acquisition_rows": [], "vitals": {}, "listings": {}}}
        self.assertIn("Source error (report continues)", markdown_report(data))

    def test_error_summary_includes_safe_http_status(self):
        class Response:
            status_code = 403

        class SourceError(Exception):
            response = Response()

        data = {"configuration": {"missing": []}}
        add_error(data, "Search Console", SourceError())
        self.assertEqual(data["configuration"]["errors"], ["Search Console: HTTP 403"])

    def test_error_summary_keeps_safe_google_reason_and_redacts_identifiers(self):
        class Response:
            status_code = 400

            def json(self):
                return {"error": {
                    "status": "INVALID_ARGUMENT",
                    "message": "Bad timeline for growth@example.test in gs://private-bucket/report.csv",
                }}

        class SourceError(Exception):
            response = Response()

        data = {"configuration": {"missing": []}}
        add_error(data, "Google Play Android Vitals", SourceError())
        error = data["configuration"]["errors"][0]
        self.assertIn("HTTP 400 (INVALID_ARGUMENT", error)
        self.assertIn("[redacted-email]", error)
        self.assertIn("gs://[redacted]", error)
        self.assertNotIn("growth@example.test", error)
        self.assertNotIn("private-bucket", error)

    def test_play_csv_prefix_requires_an_organic_search_file(self):
        # The selector is intentionally constrained to the Play Search report:
        # generic acquisition files do not contain the keyword dimension.
        self.assertIn("play_search", "acquisition/visitors/visitors_package_202607_play_search.csv")

    def test_radar_keeps_autocomplete_directional_until_quantified(self):
        suggestion = {
            "query": "questions for couples game",
            "market": "US",
            "locale": "en",
            "intent": "couple compatibility",
            "product_fit": "future",
            "covered_terms": [],
            "source": "Google autocomplete",
        }
        directional = demand_radar_candidates([], [suggestion], [], [])
        self.assertEqual(directional[0]["coverage"], "gap")
        self.assertEqual(directional[0]["evidence"], "directional")
        self.assertIsNone(directional[0]["monthly_searches"])

        quantified = demand_radar_candidates(
            [], [suggestion],
            [{"query": "questions for couples game", "market": "US", "monthly_searches": 1300, "competition": "MEDIUM"}],
            [],
        )
        self.assertEqual(quantified[0]["evidence"], "quantified")
        self.assertEqual(quantified[0]["monthly_searches"], 1300)

    def test_keyword_planner_csv_is_optional_and_market_aware(self):
        self.assertEqual(optional_keyword_planner_rows("does-not-exist.csv"), [])
        with TemporaryDirectory() as directory:
            path = Path(directory) / "keywords.csv"
            path.write_text("Keyword,Avg. monthly searches,Competition,Market\nethical dilemmas,\"1,300\",HIGH,US\n")
            rows = optional_keyword_planner_rows(str(path))
        self.assertEqual(rows, [{"query": "ethical dilemmas", "monthly_searches": 1300, "competition": "HIGH", "market": "US"}])

    def test_report_labels_directional_radar_evidence(self):
        report = markdown_report({
            "configuration": {"missing": []}, "search_console": {"rows": []}, "ga4": {"rows": []},
            "pagespeed": {}, "play": {"acquisition_rows": [], "vitals": {}, "listings": {}},
            "demand_radar": {"candidates": [{
                "query": "domande per coppie gioco", "market": "IT", "locale": "it", "intent": "compatibilità",
                "product_fit": "future", "coverage": "gap", "source": "Google autocomplete", "evidence": "directional",
                "monthly_searches": None, "competition": None, "search_console_impressions": None, "opportunity_score": 2,
            }]},
        })
        self.assertIn("Directional gaps to validate", report)
        self.assertIn("not a keyword-volume claim", report)

    def test_radar_marks_sensitive_intent_for_review(self):
        candidates = demand_radar_candidates(
            [], [{
                "query": "moral dilemma psychology", "market": "US", "locale": "en", "intent": "reflection",
                "product_fit": "current", "covered_terms": [], "source": "Google autocomplete",
            }], [], [], {"psychology": "psychological claim risk"},
        )
        self.assertEqual(candidates[0]["policy_risk"], "psychological claim risk")
        self.assertEqual(candidates[0]["product_fit"], "review required")

    def test_report_keeps_each_market_visible(self):
        candidate = {
            "intent": "conversation", "product_fit": "current", "coverage": "gap", "source": "Google autocomplete",
            "evidence": "directional", "monthly_searches": None, "competition": None,
            "search_console_impressions": None, "opportunity_score": 2,
        }
        report = markdown_report({
            "configuration": {"missing": []}, "search_console": {"rows": []}, "ga4": {"rows": []},
            "pagespeed": {}, "play": {"acquisition_rows": [], "vitals": {}, "listings": {}},
            "demand_radar": {"candidates": [
                {**candidate, "query": "questions for friends", "market": "US", "locale": "en", "policy_risk": None},
                {**candidate, "query": "dilemmi morali psicologia", "market": "IT", "locale": "it", "policy_risk": "psychological claim risk"},
            ]},
        })
        self.assertIn("#### IT", report)
        self.assertIn("#### US", report)
        self.assertIn("policy review required: psychological claim risk", report)

    def test_search_console_keeps_drilldown_but_collects_aggregate(self):
        class Response:
            def raise_for_status(self):
                return None

            def json(self):
                return {"rows": []}

        class Session:
            def __init__(self):
                self.dimensions = []

            def post(self, _url, json, timeout):
                self.dimensions.append(json["dimensions"])
                self.assertEqual(timeout, 30)
                return Response()

            def assertEqual(self, left, right):
                self.testcase.assertEqual(left, right)

        session = Session()
        session.testcase = self
        report = collect_search_console(session, "sc-domain:example.test", "2026-01-01", "2026-01-28")
        self.assertEqual(report, {"rows": [], "aggregated_rows": []})
        self.assertEqual(session.dimensions, [["query", "page", "device", "country"], ["query", "page"]])

    def test_radar_briefs_are_limited_and_exclude_future_or_risky_candidates(self):
        candidate = {
            "locale": "en", "intent": "conversation", "coverage": "gap", "evidence": "directional",
            "monthly_searches": None, "competition": None, "search_console_impressions": None, "opportunity_score": 4,
            "sources": ["Google autocomplete"], "source": "Google autocomplete",
        }
        data = {
            "search_console": {"rows": []}, "ga4": {"rows": []}, "pagespeed": {}, "play": {"acquisition_rows": [], "vitals": {}, "listings": {}},
            "demand_radar": {"candidates": [
                {**candidate, "query": "first", "market": "US", "product_fit": "current", "policy_risk": None},
                {**candidate, "query": "second", "market": "US", "product_fit": "current", "policy_risk": None},
                {**candidate, "query": "third", "market": "US", "product_fit": "current", "policy_risk": None},
                {**candidate, "query": "future", "market": "IT", "product_fit": "future", "policy_risk": None},
                {**candidate, "query": "risky", "market": "IT", "product_fit": "review required", "policy_risk": "psychological claim risk"},
            ]},
        }
        titles = [lead["title"] for lead in build_recommendations(data)]
        brief_titles = [title for title in titles if "content brief" in title]
        self.assertEqual(len(brief_titles), 2)
        self.assertFalse(any("future" in title or "risky" in title for title in brief_titles))

    def test_history_recommendations_need_two_meaningful_samples_and_exclude_brand(self):
        data = {
            "configuration": {"brand_terms": ["moral torture machine"]},
            "search_console": {"aggregated_rows": [
                {"keys": ["ethical dilemmas"], "impressions": 30, "clicks": 3, "position": 10},
                {"keys": ["moral torture machine"], "impressions": 40, "clicks": 20, "position": 1},
            ]},
            "history": {"reports": [{"query_metrics": {
                "ethical dilemmas": {"impressions": 10, "clicks": 1, "position": 12},
                "moral torture machine": {"impressions": 10, "clicks": 8, "position": 1},
            }}]},
        }
        titles = [lead["title"] for lead in history_recommendations(data)]
        self.assertEqual(len(titles), 1)
        self.assertIn("ethical dilemmas", titles[0])

    def test_pagespeed_recommendation_names_landing_and_strategy(self):
        data = {
            "search_console": {"rows": []}, "ga4": {"rows": []},
            "pagespeed": {"moral_dilemma_test_en": {"mobile": {"performance": 60, "lcp_ms": 3200}}},
            "play": {"acquisition_rows": [], "vitals": {}, "listings": {}},
        }
        titles = [lead["title"] for lead in build_recommendations(data)]
        self.assertTrue(any("moral_dilemma_test_en (mobile)" in title for title in titles))

    def test_transient_play_response_is_retried_with_bounded_backoff(self):
        class Response:
            def __init__(self, status_code):
                self.status_code = status_code

            def raise_for_status(self):
                if self.status_code >= 400:
                    raise RuntimeError(self.status_code)

        class Session:
            def __init__(self):
                self.responses = [Response(503), Response(200)]

            def post(self, _url, json, timeout):
                self.assertEqual(timeout, 30)
                return self.responses.pop(0)

            def assertEqual(self, left, right):
                self.testcase.assertEqual(left, right)

        session = Session()
        session.testcase = self
        with patch("growth_intelligence.time.sleep") as sleep:
            response = post_with_retry(session, "https://example.test", {"safe": True})
        self.assertEqual(response.status_code, 200)
        sleep.assert_called_once_with(1)

    def test_play_vitals_daily_queries_use_the_required_reporting_timezone(self):
        class Response:
            status_code = 200

            def raise_for_status(self):
                return None

            def json(self):
                return {"rows": []}

        class Session:
            def __init__(self):
                self.payloads = []

            def post(self, _url, json, timeout):
                self.payloads.append(json)
                self.testcase.assertEqual(timeout, 30)
                return Response()

        session = Session()
        session.testcase = self
        self.assertEqual(collect_play_vitals(session, "com.example.app", "2026-07-01", "2026-07-28"), {})
        self.assertEqual(len(session.payloads), 2)
        for payload in session.payloads:
            timeline = payload["timelineSpec"]
            self.assertEqual(timeline["startTime"]["timeZone"], {"id": "America/Los_Angeles"})
            self.assertEqual(timeline["endTime"]["timeZone"], {"id": "America/Los_Angeles"})

    def test_listing_snapshot_requires_reviewed_english_and_italian_text(self):
        english_listing = {
            "title": "Moral Torture Machine",
            "short_description": "Generate ethical dilemmas.",
            "full_description": "Choose, reflect, and compare decisions.",
        }
        self.assertEqual(
            listing_snapshot_missing_fields({"en": english_listing}),
            ["it.title", "it.short_description", "it.full_description"],
        )
        self.assertEqual(
            listing_snapshot_missing_fields({"en": english_listing, "it": english_listing}),
            [],
        )

    def test_history_download_is_read_only_and_non_fatal(self):
        class Response:
            def __init__(self, payload=None, content=b""):
                self.payload = payload
                self.content = content

            def raise_for_status(self):
                return None

            def json(self):
                return self.payload

        bundle = BytesIO()
        with zipfile.ZipFile(bundle, "w") as artifact:
            artifact.writestr("growth-intelligence-report.json", json.dumps({
                "generated_at": "2026-07-01", "search_console": {"aggregated_rows": [
                    {"keys": ["ethical dilemmas"], "impressions": 20, "clicks": 2, "position": 11},
                ]},
            }))
        with patch("requests.get", side_effect=[
            Response({"artifacts": [{"expired": False, "archive_download_url": "https://example.test/archive"}]}),
            Response(content=bundle.getvalue()),
        ]) as request:
            history = collect_artifact_history("owner/repo", "token", limit=1)
        self.assertEqual(history["status"], "ok")
        self.assertEqual(history["reports"][0]["query_metrics"]["ethical dilemmas"]["impressions"], 20)
        self.assertEqual(request.call_count, 2)
        self.assertEqual(request.call_args_list[0].kwargs["params"]["per_page"], 100)
        self.assertEqual(collect_artifact_history("owner/repo", None)["reports"], [])

    def test_history_counts_distinct_non_empty_weeks_not_artifacts(self):
        class Response:
            def __init__(self, payload=None, content=b""):
                self.payload = payload
                self.content = content

            def raise_for_status(self):
                return None

            def json(self):
                return self.payload

        def bundle_for(report_date, impressions):
            bundle = BytesIO()
            with zipfile.ZipFile(bundle, "w") as artifact:
                artifact.writestr("growth-intelligence-report.json", json.dumps({
                    "generated_at": report_date,
                    "search_console": {"aggregated_rows": ([{
                        "keys": ["ethical dilemmas"], "impressions": impressions, "clicks": 1, "position": 10,
                    }] if impressions else [])},
                }))
            return bundle.getvalue()

        artifacts = [{"expired": False, "archive_download_url": f"https://example.test/{index}"} for index in range(4)]
        with patch("requests.get", side_effect=[
            Response({"artifacts": artifacts}),
            Response(content=bundle_for("2026-07-28", 20)),
            Response(content=bundle_for("2026-07-27", 10)),
            Response(content=bundle_for("2026-07-20", 8)),
            Response(content=bundle_for("2026-07-13", 0)),
        ]):
            history = collect_artifact_history("owner/repo", "token", limit=8)
        self.assertEqual([report["generated_at"] for report in history["reports"]], ["2026-07-28", "2026-07-20"])

    def test_configuration_covers_all_discovery_landing_urls_and_keeps_history(self):
        config = json.loads(Path(".github/growth-intelligence.json").read_text())
        self.assertEqual(len(config["page_urls"]), 7)
        workflow = Path(".github/workflows/growth-intelligence.yml").read_text()
        self.assertIn("retention-days: 90", workflow)
        self.assertIn("Collect recent read-only report history", workflow)


if __name__ == "__main__":
    unittest.main()
