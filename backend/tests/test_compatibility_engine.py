import unittest

from backend.src.compatibility_engine import (
    COMPATIBILITY_VERSION,
    DIMENSIONS,
    compute_compatibility,
)


class CompatibilityEngineTests(unittest.TestCase):
    def test_identical_profiles_are_fully_compatible(self):
        averages = {d: 0.7 for d in DIMENSIONS}
        result = compute_compatibility(averages, averages)
        self.assertEqual(result["overallAgreementPct"], 100.0)
        for dimension in DIMENSIONS:
            self.assertEqual(result["perDimension"][dimension]["distance"], 0)
            self.assertEqual(result["perDimension"][dimension]["agreementPct"], 100.0)

    def test_maximally_opposite_profiles_are_zero_percent(self):
        low = {d: 0.1 for d in DIMENSIONS}
        high = {d: 1.0 for d in DIMENSIONS}
        result = compute_compatibility(low, high)
        self.assertEqual(result["overallAgreementPct"], 0.0)

    def test_compatibility_is_symmetric(self):
        a = {"Empathy": 0.9, "Integrity": 0.2, "Responsibility": 0.5, "Justice": 0.85, "Altruism": 0.3, "Honesty": 0.6}
        b = {"Empathy": 0.2, "Integrity": 0.85, "Responsibility": 0.5, "Justice": 0.2, "Altruism": 0.9, "Honesty": 0.4}

        forward = compute_compatibility(a, b)
        backward = compute_compatibility(b, a)

        self.assertEqual(forward["overallAgreementPct"], backward["overallAgreementPct"])
        self.assertEqual(forward["mostDivergentDimension"], backward["mostDivergentDimension"])
        self.assertEqual(forward["mostAlignedDimension"], backward["mostAlignedDimension"])
        for dimension in DIMENSIONS:
            self.assertEqual(
                forward["perDimension"][dimension]["distance"],
                backward["perDimension"][dimension]["distance"],
            )
            self.assertEqual(
                forward["perDimension"][dimension]["a"],
                backward["perDimension"][dimension]["b"],
            )

    def test_version_is_included_in_every_result(self):
        averages = {d: 0.5 for d in DIMENSIONS}
        result = compute_compatibility(averages, averages)
        self.assertEqual(result["compatibilityVersion"], COMPATIBILITY_VERSION)

    def test_most_divergent_and_aligned_dimensions_are_identified(self):
        a = {"Empathy": 0.9, "Integrity": 0.5, "Responsibility": 0.5, "Justice": 0.5, "Altruism": 0.5, "Honesty": 0.5}
        b = {"Empathy": 0.1, "Integrity": 0.5, "Responsibility": 0.5, "Justice": 0.5, "Altruism": 0.5, "Honesty": 0.5}
        result = compute_compatibility(a, b)
        self.assertEqual(result["mostDivergentDimension"], "Empathy")
        # All other dimensions tie at distance 0; the tie-break must be deterministic.
        self.assertEqual(result["mostAlignedDimension"], "Altruism")

    def test_missing_dimension_falls_back_to_neutral_without_crashing(self):
        a = {"Empathy": 0.8}
        b = {"Empathy": 0.8}
        result = compute_compatibility(a, b)
        self.assertEqual(result["overallAgreementPct"], 100.0)


if __name__ == "__main__":
    unittest.main()
