import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from growth_intelligence import (
    add_error,
    build_recommendations,
    demand_radar_candidates,
    markdown_report,
    optional_keyword_planner_rows,
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


if __name__ == "__main__":
    unittest.main()
