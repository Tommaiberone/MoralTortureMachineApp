import json
import os
import unittest

from backend.src.archetype_engine import (
    assign_archetype,
    compute_dimension_averages,
    get_archetypes_version,
)

_ARCHETYPES_JSON = os.path.join(
    os.path.dirname(__file__), "..", "data", "archetypes.json"
)


def _load_reference_data():
    with open(_ARCHETYPES_JSON, "r", encoding="utf-8") as f:
        return json.load(f)


class ArchetypeEngineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.reference = _load_reference_data()
        cls.archetypes_by_id = {a["id"]: a for a in cls.reference["archetypes"]}

    def test_every_archetype_is_recovered_exactly_at_its_own_centroid(self):
        for archetype_id, archetype in self.archetypes_by_id.items():
            result = assign_archetype(archetype["centroid"], language="en")
            self.assertEqual(result["archetypeId"], archetype_id)
            self.assertEqual(result["distance"], 0)

    def test_result_carries_the_content_version(self):
        result = assign_archetype(
            self.archetypes_by_id["saintly_martyr"]["centroid"], language="en"
        )
        self.assertEqual(result["archetypesVersion"], get_archetypes_version())
        self.assertEqual(result["archetypesVersion"], self.reference["version"])

    def test_same_input_and_version_always_produce_the_same_archetype(self):
        averages = {
            "Empathy": 0.63,
            "Integrity": 0.41,
            "Responsibility": 0.77,
            "Justice": 0.55,
            "Altruism": 0.3,
            "Honesty": 0.48,
        }
        first = assign_archetype(averages, language="en")
        second = assign_archetype(averages, language="en")
        self.assertEqual(first, second)

    def test_boundary_tie_is_broken_deterministically_by_lowest_id(self):
        # Exact midpoint between self_preservationist and bleak_nihilist centroids:
        # equidistant from both and strictly closer to them than any other
        # archetype, so this is a genuine tie, not an approximation.
        a = self.archetypes_by_id["self_preservationist"]["centroid"]
        b = self.archetypes_by_id["bleak_nihilist"]["centroid"]
        midpoint = {dim: (a[dim] + b[dim]) / 2 for dim in a}

        result = assign_archetype(midpoint, language="en")

        self.assertEqual(result["archetypeId"], "bleak_nihilist")
        # Re-running must not flip the tie-break to the other archetype.
        self.assertEqual(assign_archetype(midpoint, language="en")["archetypeId"], "bleak_nihilist")

    def test_missing_dimension_falls_back_to_neutral_without_crashing(self):
        incomplete_averages = {
            "Empathy": 0.85,
            "Integrity": 0.85,
            "Responsibility": 0.85,
            "Justice": 0.85,
            "Altruism": 0.85,
            # Honesty intentionally omitted
        }
        result = assign_archetype(incomplete_averages, language="en")
        self.assertIn(result["archetypeId"], self.archetypes_by_id)

    def test_localized_copy_matches_language(self):
        centroid = self.archetypes_by_id["bleak_nihilist"]["centroid"]

        en_result = assign_archetype(centroid, language="en")
        it_result = assign_archetype(centroid, language="it")

        self.assertEqual(en_result["name"], "The Bleak Nihilist")
        self.assertEqual(it_result["name"], "Il Nichilista Cupo")
        self.assertEqual(en_result["visual"], it_result["visual"])

    def test_unrecognized_language_defaults_to_english(self):
        centroid = self.archetypes_by_id["saintly_martyr"]["centroid"]
        result = assign_archetype(centroid, language="fr")
        self.assertEqual(result["name"], "The Moral Idealist")

    def test_compute_dimension_averages_matches_manual_mean(self):
        answers = [
            {"Empathy": 1.0, "Integrity": 0.5},
            {"Empathy": 0.5, "Integrity": 1.0},
        ]
        averages = compute_dimension_averages(answers)
        self.assertEqual(averages, {"Empathy": 0.75, "Integrity": 0.75})

    def test_compute_dimension_averages_handles_empty_answers(self):
        self.assertEqual(compute_dimension_averages([]), {})


if __name__ == "__main__":
    unittest.main()
