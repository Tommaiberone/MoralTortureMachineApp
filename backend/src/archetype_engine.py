"""Deterministic, versioned moral archetype assignment (TASK-26).

Archetype content and centroids live in backend/data/archetypes.json (TASK-25).
Assignment is pure nearest-centroid matching over the six moral dimensions
already scored per dilemma answer (Empathy, Integrity, Responsibility,
Justice, Altruism, Honesty) — no AI involved, so the same averages and the
same archetypesVersion always produce the same archetype.
"""

import json
import math
import os
from functools import lru_cache
from typing import Any, Dict

# The Lambda deployment package copies this module and archetypes.json as
# flat siblings (see .github/workflows/deploy.yml), while the repository keeps
# the human-editable content in backend/data/ next to backend/src/. Both
# layouts are checked so the same code works locally, in tests, and deployed.
_ARCHETYPES_PATH_CANDIDATES = [
    os.path.join(os.path.dirname(__file__), "archetypes.json"),
    os.path.join(os.path.dirname(__file__), "..", "data", "archetypes.json"),
]

# Used when an expected dimension is absent from the caller's averages;
# the midpoint of the observed dilemma weight range ([0.1, 1]) keeps a
# missing dimension neutral instead of skewing the match toward "low".
_NEUTRAL_DIMENSION_VALUE = 0.55


@lru_cache(maxsize=1)
def _load_archetype_data() -> Dict[str, Any]:
    for path in _ARCHETYPES_PATH_CANDIDATES:
        if os.path.isfile(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
    raise FileNotFoundError(
        f"archetypes.json not found in any of: {_ARCHETYPES_PATH_CANDIDATES}"
    )


def get_archetypes_version() -> int:
    return _load_archetype_data()["version"]


def compute_dimension_averages(answers: list) -> Dict[str, float]:
    """Average each dimension across a list of {dimension: value} answer dicts."""
    aggregated: Dict[str, float] = {}
    for answer in answers:
        for key, value in answer.items():
            aggregated[key] = aggregated.get(key, 0) + value
    count = len(answers)
    if count == 0:
        return {}
    return {key: round(value / count, 2) for key, value in aggregated.items()}


def assign_archetype(averages: Dict[str, float], language: str = "en") -> Dict[str, Any]:
    """Deterministically assign the nearest archetype to a set of dimension averages.

    Returns the archetype id, the algorithm/content version it was matched
    against, the localized copy for `language`, and the shared visual identity.
    """
    data = _load_archetype_data()
    dimensions = data["dimensions"]
    archetypes = data["archetypes"]
    lang_key = "it" if language == "it" else "en"

    vector = {dim: averages.get(dim, _NEUTRAL_DIMENSION_VALUE) for dim in dimensions}

    def squared_distance(archetype: Dict[str, Any]) -> float:
        centroid = archetype["centroid"]
        return sum((vector[dim] - centroid[dim]) ** 2 for dim in dimensions)

    # Sorting by (distance, id) before picking argmin makes a tie between
    # equidistant archetypes resolve to the same one every time.
    best = min(archetypes, key=lambda a: (squared_distance(a), a["id"]))
    copy = best[lang_key]

    return {
        "archetypeId": best["id"],
        "archetypesVersion": data["version"],
        "distance": round(math.sqrt(squared_distance(best)), 4),
        "visual": best["visual"],
        **copy,
    }
