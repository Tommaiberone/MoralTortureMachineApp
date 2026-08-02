"""Deterministic Party Room group awards (TASK-48).

Computed once, at completion, from every participant's accumulated per-round
votes. No AI, no randomness: the same set of participant votes always
produces the same awards, with a stable tie-break (lowest participant/round
key) instead of depending on dict/iteration order - the same discipline as
archetype_engine.py and compatibility_engine.py.
"""

from typing import Any, Dict, List, Optional

try:
    from src.compatibility_engine import compute_compatibility
except ImportError:
    try:
        from .compatibility_engine import compute_compatibility
    except ImportError:
        from compatibility_engine import compute_compatibility


def compute_most_controversial_round(votes_by_round: List[Dict[str, int]]) -> Optional[int]:
    """Index of the round whose first/second split was closest to even (the
    "most controversial" dilemma), or None if no round has any votes yet.
    Ties resolve to the earliest round for reproducibility."""
    scored = []
    for round_index, counts in enumerate(votes_by_round):
        total = counts.get("first", 0) + counts.get("second", 0)
        if total == 0:
            continue
        imbalance = abs(counts.get("first", 0) - counts.get("second", 0))
        scored.append((imbalance, round_index))
    if not scored:
        return None
    scored.sort(key=lambda item: (item[0], item[1]))
    return scored[0][1]


def compute_closest_pair(participant_averages: Dict[int, Dict[str, float]]) -> Optional[Dict[str, Any]]:
    """The two participants (by index key) with the highest pairwise
    agreement. Needs at least 2 participants."""
    keys = sorted(participant_averages.keys())
    if len(keys) < 2:
        return None
    best = None
    for i, key_a in enumerate(keys):
        for key_b in keys[i + 1:]:
            result = compute_compatibility(participant_averages[key_a], participant_averages[key_b])
            candidate = (result["overallAgreementPct"], key_a, key_b)
            if best is None or candidate[0] > best[0]:
                best = candidate
    return {"participantKeys": [best[1], best[2]], "agreementPct": best[0]}


def compute_moral_minority(participant_averages: Dict[int, Dict[str, float]]) -> Optional[Dict[str, Any]]:
    """The participant least aligned with the rest of the group on average.
    Needs at least 3 participants: with exactly 2, neither is a "minority"
    relative to the other, they are just different from one person."""
    keys = sorted(participant_averages.keys())
    if len(keys) < 3:
        return None
    average_agreement = {}
    for key in keys:
        others = [k for k in keys if k != key]
        scores = [
            compute_compatibility(participant_averages[key], participant_averages[other])["overallAgreementPct"]
            for other in others
        ]
        average_agreement[key] = sum(scores) / len(scores)
    least_aligned_key = min(keys, key=lambda k: (average_agreement[k], k))
    return {
        "participantKey": least_aligned_key,
        "averageAgreementPct": round(average_agreement[least_aligned_key], 1),
    }


def compute_party_room_awards(
    participant_averages: Dict[int, Dict[str, float]],
    votes_by_round: List[Dict[str, int]],
) -> Dict[str, Any]:
    """One entry point bundling all three awards, each independently omitted
    (None) rather than fabricated when the group is too small to support it."""
    return {
        "closestPair": compute_closest_pair(participant_averages),
        "moralMinority": compute_moral_minority(participant_averages),
        "mostControversialRoundIndex": compute_most_controversial_round(votes_by_round),
    }
