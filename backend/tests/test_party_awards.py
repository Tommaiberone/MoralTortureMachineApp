import unittest

from backend.src.party_awards import (
    compute_closest_pair,
    compute_moral_minority,
    compute_most_controversial_round,
    compute_party_room_awards,
)

SIX_DIMENSIONS = ["Empathy", "Integrity", "Responsibility", "Justice", "Altruism", "Honesty"]


def averages(value):
    return {d: value for d in SIX_DIMENSIONS}


class MostControversialRoundTests(unittest.TestCase):
    def test_picks_the_closest_split(self):
        votes_by_round = [
            {"first": 5, "second": 0},
            {"first": 3, "second": 2},
            {"first": 4, "second": 1},
        ]
        self.assertEqual(compute_most_controversial_round(votes_by_round), 1)

    def test_ties_resolve_to_the_earliest_round(self):
        votes_by_round = [{"first": 2, "second": 2}, {"first": 3, "second": 3}]
        self.assertEqual(compute_most_controversial_round(votes_by_round), 0)

    def test_rounds_with_no_votes_are_ignored(self):
        votes_by_round = [{"first": 0, "second": 0}, {"first": 1, "second": 1}]
        self.assertEqual(compute_most_controversial_round(votes_by_round), 1)

    def test_no_votes_anywhere_returns_none(self):
        self.assertIsNone(compute_most_controversial_round([{"first": 0, "second": 0}]))


class ClosestPairTests(unittest.TestCase):
    def test_fewer_than_two_participants_returns_none(self):
        self.assertIsNone(compute_closest_pair({0: averages(0.5)}))

    def test_picks_the_pair_with_highest_agreement(self):
        participants = {
            0: averages(0.9),
            1: averages(0.1),
            2: averages(0.88),  # closest to participant 0
        }
        result = compute_closest_pair(participants)
        self.assertEqual(set(result["participantKeys"]), {0, 2})

    def test_identical_averages_score_full_agreement(self):
        participants = {0: averages(0.5), 1: averages(0.5)}
        result = compute_closest_pair(participants)
        self.assertEqual(result["agreementPct"], 100.0)


class MoralMinorityTests(unittest.TestCase):
    def test_fewer_than_three_participants_returns_none(self):
        self.assertIsNone(compute_moral_minority({0: averages(0.5), 1: averages(0.9)}))

    def test_picks_the_participant_least_aligned_with_the_group(self):
        participants = {
            0: averages(0.5),
            1: averages(0.52),
            2: averages(0.95),  # the outlier
        }
        result = compute_moral_minority(participants)
        self.assertEqual(result["participantKey"], 2)

    def test_all_identical_ties_resolve_to_the_lowest_key(self):
        participants = {0: averages(0.5), 1: averages(0.5), 2: averages(0.5)}
        result = compute_moral_minority(participants)
        self.assertEqual(result["participantKey"], 0)
        self.assertEqual(result["averageAgreementPct"], 100.0)


class ComputePartyRoomAwardsTests(unittest.TestCase):
    def test_bundles_all_three_and_omits_what_does_not_apply(self):
        participants = {0: averages(0.5), 1: averages(0.9)}
        votes_by_round = [{"first": 1, "second": 1}]
        result = compute_party_room_awards(participants, votes_by_round)
        self.assertIsNotNone(result["closestPair"])
        self.assertIsNone(result["moralMinority"])  # only 2 participants
        self.assertEqual(result["mostControversialRoundIndex"], 0)


if __name__ == "__main__":
    unittest.main()
