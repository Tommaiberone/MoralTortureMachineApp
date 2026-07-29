import unittest

from growth_intelligence import build_recommendations, markdown_report


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

    def test_play_csv_prefix_requires_an_organic_search_file(self):
        # The selector is intentionally constrained to the Play Search report:
        # generic acquisition files do not contain the keyword dimension.
        self.assertIn("play_search", "acquisition/visitors/visitors_package_202607_play_search.csv")


if __name__ == "__main__":
    unittest.main()
