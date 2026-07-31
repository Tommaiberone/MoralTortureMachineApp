"""Deterministic, symmetric, versioned Moral Duel compatibility (TASK-37).

Compares two sets of six-dimension averages (the same shape produced by
archetype_engine.compute_dimension_averages) with a pure distance-based
formula. No AI, no randomness: compute_compatibility(A, B) always equals
compute_compatibility(B, A) with the "a"/"b" labels swapped, and the same
inputs at the same COMPATIBILITY_VERSION always produce the same result.
"""

from typing import Any, Dict

COMPATIBILITY_VERSION = 1

DIMENSIONS = ["Empathy", "Integrity", "Responsibility", "Justice", "Altruism", "Honesty"]

# The widest possible gap between two dilemma-weight averages in the observed
# [0.1, 1] range; used to turn a raw distance into a 0-100% agreement score.
_MAX_DIMENSION_DISTANCE = 0.9
_NEUTRAL_DIMENSION_VALUE = 0.55


def _agreement_pct(distance: float) -> float:
    return round(max(0.0, 1 - distance / _MAX_DIMENSION_DISTANCE) * 100, 1)


def compute_compatibility(
    averages_a: Dict[str, float],
    averages_b: Dict[str, float],
) -> Dict[str, Any]:
    """Symmetric compatibility between two participants' dimension averages."""
    per_dimension: Dict[str, Any] = {}
    total_distance = 0.0

    for dimension in DIMENSIONS:
        value_a = averages_a.get(dimension, _NEUTRAL_DIMENSION_VALUE)
        value_b = averages_b.get(dimension, _NEUTRAL_DIMENSION_VALUE)
        distance = abs(value_a - value_b)
        total_distance += distance
        per_dimension[dimension] = {
            "a": value_a,
            "b": value_b,
            "distance": round(distance, 4),
            "agreementPct": _agreement_pct(distance),
        }

    overall_agreement_pct = _agreement_pct(total_distance / len(DIMENSIONS))
    most_divergent_dimension = max(DIMENSIONS, key=lambda d: (per_dimension[d]["distance"], d))
    most_aligned_dimension = min(DIMENSIONS, key=lambda d: (per_dimension[d]["distance"], d))

    return {
        "compatibilityVersion": COMPATIBILITY_VERSION,
        "overallAgreementPct": overall_agreement_pct,
        "perDimension": per_dimension,
        "mostDivergentDimension": most_divergent_dimension,
        "mostAlignedDimension": most_aligned_dimension,
    }
