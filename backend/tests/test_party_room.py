import asyncio
import json
import os
import unittest
from unittest.mock import Mock, patch

from botocore.exceptions import ClientError
from starlette.requests import Request

os.environ.setdefault("AWS_EC2_METADATA_DISABLED", "true")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")
os.environ.setdefault("AWS_DEFAULT_REGION", "eu-west-1")

from backend.src.backend_fastapi import (  # noqa: E402
    CreatePartyRoomRequest,
    JoinPartyRoomRequest,
    SubmitPartyVoteRequest,
    _delete_party_data,
    advance_party_room,
    create_party_room,
    get_party_room,
    join_party_room,
    start_party_room,
    submit_party_vote,
)
from backend.src import backend_fastapi as backend_module  # noqa: E402


def request_with_headers(headers, path="/"):
    return Request({
        "type": "http",
        "method": "GET",
        "path": path,
        "headers": [(key.lower().encode(), value.encode()) for key, value in headers.items()],
    })


def _conditional_check_failed():
    return ClientError(
        {"Error": {"Code": "ConditionalCheckFailedException", "Message": "The conditional request failed"}},
        "PutItem",
    )


class _FakeTable:
    """In-memory double for just the DynamoDB Table operations Party Room
    uses, with real conditional-write semantics - this exercises the actual
    advance-lazily state machine and immutability guards, not just a
    scripted sequence of mock return values."""

    def __init__(self, key_names):
        self._key_names = key_names
        self._items = {}

    def _key(self, mapping):
        return tuple(mapping[name] for name in self._key_names)

    def get_item(self, Key):
        item = self._items.get(self._key(Key))
        return {"Item": dict(item)} if item is not None else {}

    def put_item(self, Item, ConditionExpression=None):
        key = self._key(Item)
        exists = key in self._items
        if ConditionExpression and "attribute_not_exists" in ConditionExpression and exists:
            raise _conditional_check_failed()
        self._items[key] = dict(Item)
        return {}

    def query(self, KeyConditionExpression, ExpressionAttributeValues):
        room_code = ExpressionAttributeValues[":room"]
        items = [dict(v) for k, v in self._items.items() if k[0] == room_code]
        return {"Items": items}

    def delete_item(self, Key):
        self._items.pop(self._key(Key), None)
        return {}

    def update_item(
        self, Key, UpdateExpression, ExpressionAttributeValues,
        ConditionExpression=None, ExpressionAttributeNames=None, ReturnValues=None,
    ):
        key = self._key(Key)
        item = self._items.get(key)
        names = ExpressionAttributeNames or {}

        def resolve_path(path):
            parts = path.strip().split(".")
            return [names.get(p, p) for p in parts]

        if ConditionExpression:
            if not self._check_condition(item, ConditionExpression, names, ExpressionAttributeValues):
                raise _conditional_check_failed()

        if item is None:
            item = dict(Key)
            self._items[key] = item

        assignments = UpdateExpression[len("SET "):].split(", ")
        for assignment in assignments:
            path_str, _, value_token = assignment.partition("=")
            path = resolve_path(path_str)
            value = ExpressionAttributeValues[value_token.strip()]
            target = item
            for part in path[:-1]:
                target = target.setdefault(part, {})
            target[path[-1]] = value

        return {"Attributes": dict(item)}

    def _check_condition(self, item, condition, names, values):
        if condition.startswith("attribute_not_exists("):
            path = condition[len("attribute_not_exists("):-1]
            parts = [names.get(p, p) for p in path.strip().split(".")]
            target = item or {}
            for part in parts[:-1]:
                target = target.get(part, {})
            return parts[-1] not in target
        if "=" in condition:
            field, _, value_token = condition.partition("=")
            field = names.get(field.strip(), field.strip())
            expected = values[value_token.strip()]
            return bool(item) and item.get(field) == expected
        raise NotImplementedError(condition)


class PartyRoomTestCase(unittest.TestCase):
    def setUp(self):
        self.rooms = _FakeTable(("roomCode",))
        self.participants = _FakeTable(("roomCode", "participantId"))
        self.dilemmas_table = Mock()
        self.dilemmas_table.scan.return_value = {
            "Items": [
                {"_id": f"d{i}-en", "language": "en"} for i in range(10)
            ]
        }
        self.dilemmas_table.get_item.return_value = {
            "Item": {
                "_id": "d0-en",
                "dilemma": "Sample?",
                "firstAnswer": "A",
                "secondAnswer": "B",
            }
        }
        self.patches = [
            patch.object(backend_module, "party_rooms_table", self.rooms),
            patch.object(backend_module, "party_participants_table", self.participants),
            patch.object(backend_module, "table", self.dilemmas_table),
        ]
        for p in self.patches:
            p.start()
            self.addCleanup(p.stop)

    def _create_room(self, host="host-1", count=3):
        return asyncio.run(create_party_room(
            CreatePartyRoomRequest(displayName="Host", dilemmaCount=count),
            request_with_headers({"X-Anonymous-User-Id": host}),
        ))

    def _join(self, room_code, participant="guest-1", name="Guest"):
        return asyncio.run(join_party_room(
            room_code,
            JoinPartyRoomRequest(displayName=name),
            request_with_headers({"X-Anonymous-User-Id": participant}),
        ))

    def _start(self, room_code, host="host-1"):
        return asyncio.run(start_party_room(room_code, request_with_headers({"X-Anonymous-User-Id": host})))

    def _get_state(self, room_code, participant):
        return asyncio.run(get_party_room(room_code, request_with_headers({"X-Anonymous-User-Id": participant})))

    def _vote(self, room_code, participant, choice, values=None):
        values = values or {"Empathy": 1.0}
        return asyncio.run(submit_party_vote(
            room_code,
            SubmitPartyVoteRequest(choice=choice, chosenValues=values),
            request_with_headers({"X-Anonymous-User-Id": participant}),
        ))

    def _advance(self, room_code, participant="host-1"):
        return asyncio.run(advance_party_room(room_code, request_with_headers({"X-Anonymous-User-Id": participant})))

    def test_create_room_makes_host_the_first_participant(self):
        result = self._create_room()
        self.assertEqual(result["status"], "lobby")
        self.assertEqual(len(result["roomCode"]), backend_module.PARTY_ROOM_CODE_LENGTH)

        state = self._get_state(result["roomCode"], "host-1")
        self.assertTrue(state["isHost"])
        self.assertEqual(state["participantCount"], 1)

    def test_join_is_idempotent_for_the_same_participant(self):
        room = self._create_room()
        self._join(room["roomCode"], "guest-1")
        self._join(room["roomCode"], "guest-1")  # repeat join, same identity

        state = self._get_state(room["roomCode"], "host-1")
        self.assertEqual(state["participantCount"], 2)

    def test_join_after_start_is_rejected(self):
        room = self._create_room()
        self._join(room["roomCode"], "guest-1")
        self._start(room["roomCode"])

        with self.assertRaises(Exception) as raised:
            self._join(room["roomCode"], "guest-2")
        self.assertEqual(raised.exception.status_code, 409)

    def test_room_full_rejects_a_new_participant(self):
        room = self._create_room()
        with patch.object(backend_module, "PARTY_ROOM_MAX_PARTICIPANTS", 2):
            self._join(room["roomCode"], "guest-1")  # host + guest-1 = 2, at cap
            with self.assertRaises(Exception) as raised:
                self._join(room["roomCode"], "guest-2")
        self.assertEqual(raised.exception.status_code, 409)

    def test_only_host_can_start(self):
        room = self._create_room()
        self._join(room["roomCode"], "guest-1")
        with self.assertRaises(Exception) as raised:
            self._start(room["roomCode"], host="guest-1")
        self.assertEqual(raised.exception.status_code, 403)

    def test_start_requires_minimum_participants(self):
        room = self._create_room()
        with self.assertRaises(Exception) as raised:
            self._start(room["roomCode"])
        self.assertEqual(raised.exception.status_code, 400)

    def test_vote_is_immutable_once_cast(self):
        room = self._create_room()
        self._join(room["roomCode"], "guest-1")
        self._start(room["roomCode"])

        self._vote(room["roomCode"], "host-1", "first")
        with self.assertRaises(Exception) as raised:
            self._vote(room["roomCode"], "host-1", "second")
        self.assertEqual(raised.exception.status_code, 409)

    def test_everyone_voting_advances_straight_to_reveal(self):
        room = self._create_room()
        self._join(room["roomCode"], "guest-1")
        self._start(room["roomCode"])

        self._vote(room["roomCode"], "host-1", "first")
        result = self._vote(room["roomCode"], "guest-1", "second")

        self.assertEqual(result["status"], "reveal")
        state = self._get_state(room["roomCode"], "host-1")
        self.assertEqual(state["roundResult"], {"firstVotes": 1, "secondVotes": 1})

    def test_safety_net_timeout_advances_an_abandoned_round(self):
        # TASK-123: there is no visible per-round timer any more - only a
        # long safety net so a round nobody ever finishes voting doesn't
        # hang the room forever.
        room = self._create_room()
        self._join(room["roomCode"], "guest-1")
        self._start(room["roomCode"])
        self._vote(room["roomCode"], "host-1", "first")

        # Force the safety-net deadline into the past instead of sleeping.
        self.rooms._items[(room["roomCode"],)]["phaseEndsAt"] = 0

        state = self._get_state(room["roomCode"], "host-1")
        self.assertEqual(state["status"], "reveal")
        self.assertEqual(state["roundResult"], {"firstVotes": 1, "secondVotes": 0})

    def test_reveal_does_not_auto_advance_without_the_host(self):
        room = self._create_room()
        self._join(room["roomCode"], "guest-1")
        self._start(room["roomCode"])
        self._vote(room["roomCode"], "host-1", "first")
        self._vote(room["roomCode"], "guest-1", "second")

        for _ in range(3):
            state = self._get_state(room["roomCode"], "host-1")
            self.assertEqual(state["status"], "reveal")

    def test_reveal_exposes_who_voted_what_without_raw_ids(self):
        room = self._create_room()
        self._join(room["roomCode"], "guest-1")
        self._start(room["roomCode"])
        self._vote(room["roomCode"], "host-1", "first")
        self._vote(room["roomCode"], "guest-1", "second")

        state = self._get_state(room["roomCode"], "host-1")
        votes_by_choice = {v["choice"] for v in state["roundVotes"]}
        self.assertEqual(votes_by_choice, {"first", "second"})
        for vote in state["roundVotes"]:
            self.assertNotIn("participantId", vote)
        self.assertTrue(any(v["isCaller"] for v in state["roundVotes"]))

    def test_only_host_can_advance(self):
        room = self._create_room()
        self._join(room["roomCode"], "guest-1")
        self._start(room["roomCode"])
        self._vote(room["roomCode"], "host-1", "first")
        self._vote(room["roomCode"], "guest-1", "second")

        with self.assertRaises(Exception) as raised:
            self._advance(room["roomCode"], participant="guest-1")
        self.assertEqual(raised.exception.status_code, 403)

    def test_advance_is_rejected_outside_the_reveal_phase(self):
        room = self._create_room()
        self._join(room["roomCode"], "guest-1")
        self._start(room["roomCode"])  # still "question", nobody voted yet

        with self.assertRaises(Exception) as raised:
            self._advance(room["roomCode"])
        self.assertEqual(raised.exception.status_code, 409)

    def test_host_advance_moves_to_the_next_round(self):
        room = self._create_room(count=backend_module.PARTY_ROOM_MIN_DILEMMAS)
        self._join(room["roomCode"], "guest-1")
        self._start(room["roomCode"])
        self._vote(room["roomCode"], "host-1", "first")
        self._vote(room["roomCode"], "guest-1", "second")

        result = self._advance(room["roomCode"])
        self.assertEqual(result["status"], "question")
        self.assertEqual(result["currentRoundIndex"], 1)

        state = self._get_state(room["roomCode"], "host-1")
        self.assertFalse(state["hasVotedThisRound"])  # fresh round, no votes yet

    def test_full_room_reaches_completed_and_returns_archetypes(self):
        room = self._create_room(count=backend_module.PARTY_ROOM_MIN_DILEMMAS)
        self._join(room["roomCode"], "guest-1")
        self._start(room["roomCode"])

        for _ in range(backend_module.PARTY_ROOM_MIN_DILEMMAS):
            self._vote(room["roomCode"], "host-1", "first", {"Empathy": 1.0})
            self._vote(room["roomCode"], "guest-1", "second", {"Empathy": 0.1})
            # Voting both sides advances straight to reveal; force the reveal
            # window shut too so the loop reaches the next question/completed.
            self.rooms._items[(room["roomCode"],)]["phaseEndsAt"] = 0
            self._get_state(room["roomCode"], "host-1")

        state = self._get_state(room["roomCode"], "host-1")
        self.assertEqual(state["status"], "completed")
        self.assertEqual(len(state["participants"]), 2)
        for participant in state["participants"]:
            self.assertIn("archetype", participant)
            # TASK-46 AC: never expose another participant's internal ID.
            self.assertNotIn("participantId", participant)

    def test_completed_room_includes_group_awards(self):
        # TASK-48: 3 participants so moral_minority is also computable. Create
        # with the minimum allowed dilemma count, then trim the stored room
        # to a single round so one vote per participant reaches "completed".
        room = self._create_room(count=backend_module.PARTY_ROOM_MIN_DILEMMAS)
        self.rooms._items[(room["roomCode"],)]["dilemmaBaseIds"] = \
            self.rooms._items[(room["roomCode"],)]["dilemmaBaseIds"][:1]
        self._join(room["roomCode"], "guest-1")
        self._join(room["roomCode"], "guest-2")
        self._start(room["roomCode"])

        self._vote(room["roomCode"], "host-1", "first", {"Empathy": 0.9})
        self._vote(room["roomCode"], "guest-1", "first", {"Empathy": 0.88})
        self._vote(room["roomCode"], "guest-2", "second", {"Empathy": 0.1})
        self.rooms._items[(room["roomCode"],)]["phaseEndsAt"] = 0

        state = self._get_state(room["roomCode"], "host-1")
        self.assertEqual(state["status"], "completed")
        awards = state["awards"]
        self.assertIsNotNone(awards["closestPair"])
        self.assertIsNotNone(awards["moralMinority"])
        self.assertIsNotNone(awards["mostAlignedWithGroup"])
        self.assertIsNotNone(awards["contrarian"])
        self.assertEqual(awards["mostControversialDilemma"]["roundIndex"], 0)
        self.assertEqual(
            (awards["mostControversialDilemma"]["firstVotes"], awards["mostControversialDilemma"]["secondVotes"]),
            (2, 1),
        )
        # TASK-123 AC9: always present, even without Groq configured in tests
        # (falls back to a deterministic sentence).
        self.assertIsInstance(state["groupVerdict"], str)
        self.assertTrue(state["groupVerdict"])

    def test_completed_room_includes_group_archetype(self):
        # TASK-210: an explicit archetype for the room as a whole, computed
        # from the mean of every participant's own dimension averages through
        # the same deterministic assign_archetype() used per individual.
        room = self._create_room(count=backend_module.PARTY_ROOM_MIN_DILEMMAS)
        self.rooms._items[(room["roomCode"],)]["dilemmaBaseIds"] = \
            self.rooms._items[(room["roomCode"],)]["dilemmaBaseIds"][:1]
        self._join(room["roomCode"], "guest-1")
        self._start(room["roomCode"])
        self._vote(room["roomCode"], "host-1", "first", {"Empathy": 0.9})
        self._vote(room["roomCode"], "guest-1", "second", {"Empathy": 0.1})
        self.rooms._items[(room["roomCode"],)]["phaseEndsAt"] = 0

        state = self._get_state(room["roomCode"], "host-1")
        self.assertEqual(state["status"], "completed")
        group_archetype = state["groupArchetype"]
        self.assertIsNotNone(group_archetype)
        for field in ("archetypeId", "archetypesVersion", "name", "description", "strength", "blindSpot", "visual"):
            self.assertIn(field, group_archetype)

        # Same shape/value as feeding assign_archetype() the mean of both
        # participants' own averages directly (0.9 and 0.1 -> 0.5).
        expected = backend_module.assign_archetype({"Empathy": 0.5}, language="en")
        self.assertEqual(group_archetype["archetypeId"], expected["archetypeId"])

    def test_group_verdict_is_generated_once_and_cached(self):
        room = self._create_room(count=backend_module.PARTY_ROOM_MIN_DILEMMAS)
        self.rooms._items[(room["roomCode"],)]["dilemmaBaseIds"] = \
            self.rooms._items[(room["roomCode"],)]["dilemmaBaseIds"][:1]
        self._join(room["roomCode"], "guest-1")
        self._start(room["roomCode"])
        self._vote(room["roomCode"], "host-1", "first")
        self._vote(room["roomCode"], "guest-1", "second")
        self.rooms._items[(room["roomCode"],)]["phaseEndsAt"] = 0

        first = self._get_state(room["roomCode"], "host-1")
        second = self._get_state(room["roomCode"], "host-1")
        self.assertEqual(first["groupVerdict"], second["groupVerdict"])
        self.assertEqual(self.rooms._items[(room["roomCode"],)]["groupVerdict"], first["groupVerdict"])

    def test_caller_entry_includes_own_averages_never_others(self):
        # TASK-211 AC1: the six dimension averages (and the personal AI
        # verdict) must appear only on the caller's own entry, never on any
        # other participant's - checked from both participants' points of
        # view in the same completed room.
        room = self._create_room(count=backend_module.PARTY_ROOM_MIN_DILEMMAS)
        self.rooms._items[(room["roomCode"],)]["dilemmaBaseIds"] = \
            self.rooms._items[(room["roomCode"],)]["dilemmaBaseIds"][:1]
        self._join(room["roomCode"], "guest-1")
        self._start(room["roomCode"])
        self._vote(room["roomCode"], "host-1", "first", {"Empathy": 0.9})
        self._vote(room["roomCode"], "guest-1", "second", {"Empathy": 0.1})
        self.rooms._items[(room["roomCode"],)]["phaseEndsAt"] = 0

        host_view = self._get_state(room["roomCode"], "host-1")
        host_self = next(p for p in host_view["participants"] if p["isCaller"])
        host_other = next(p for p in host_view["participants"] if not p["isCaller"])
        self.assertIn("averages", host_self)
        self.assertIn("personalVerdict", host_self)
        self.assertEqual(host_self["averages"], {"Empathy": 0.9})
        self.assertNotIn("averages", host_other)
        self.assertNotIn("personalVerdict", host_other)

        guest_view = self._get_state(room["roomCode"], "guest-1")
        guest_self = next(p for p in guest_view["participants"] if p["isCaller"])
        guest_other = next(p for p in guest_view["participants"] if not p["isCaller"])
        self.assertIn("averages", guest_self)
        self.assertEqual(guest_self["averages"], {"Empathy": 0.1})
        self.assertNotIn("averages", guest_other)
        self.assertNotIn("personalVerdict", guest_other)

    def test_personal_verdict_generated_once_and_cached(self):
        room = self._create_room(count=backend_module.PARTY_ROOM_MIN_DILEMMAS)
        self.rooms._items[(room["roomCode"],)]["dilemmaBaseIds"] = \
            self.rooms._items[(room["roomCode"],)]["dilemmaBaseIds"][:1]
        self._join(room["roomCode"], "guest-1")
        self._start(room["roomCode"])
        self._vote(room["roomCode"], "host-1", "first")
        self._vote(room["roomCode"], "guest-1", "second")
        self.rooms._items[(room["roomCode"],)]["phaseEndsAt"] = 0

        first = self._get_state(room["roomCode"], "host-1")
        second = self._get_state(room["roomCode"], "host-1")
        first_self = next(p for p in first["participants"] if p["isCaller"])
        second_self = next(p for p in second["participants"] if p["isCaller"])
        self.assertEqual(first_self["personalVerdict"], second_self["personalVerdict"])
        self.assertEqual(
            self.participants._items[(room["roomCode"], "host-1")]["personalVerdict"],
            first_self["personalVerdict"],
        )

    def test_participant_summary_never_includes_raw_ids(self):
        room = self._create_room()
        self._join(room["roomCode"], "guest-1")
        state = self._get_state(room["roomCode"], "guest-1")
        for participant in state["participants"]:
            self.assertNotIn("participantId", participant)
        self.assertTrue(any(p["isCaller"] for p in state["participants"]))

    def test_account_deletion_leaves_a_tombstone_not_a_hard_delete(self):
        # TASK-199: a participant deleting their account still must remove
        # every participant's data (ADR-073 - no lingering votes/derived
        # data for either side), but the room row itself becomes a minimal
        # tombstone instead of disappearing outright, so a still-open,
        # still-polling co-participant's client gets an explanation instead
        # of an unexplained 404.
        room = self._create_room()
        self._join(room["roomCode"], "guest-1")
        room_code = room["roomCode"]

        deleted_count = _delete_party_data([{"roomCode": room_code}])

        self.assertEqual(deleted_count, 1)
        self.assertEqual(self.participants.query(
            KeyConditionExpression="roomCode = :room",
            ExpressionAttributeValues={":room": room_code},
        )["Items"], [])
        tombstone = self.rooms._items[(room_code,)]
        self.assertEqual(tombstone["status"], "participant_left")
        self.assertNotIn("dilemmaBaseIds", tombstone)
        self.assertNotIn("hostId", tombstone)

    def test_polling_a_tombstoned_room_gets_410_not_a_bare_404(self):
        room = self._create_room()
        self._join(room["roomCode"], "guest-1")
        room_code = room["roomCode"]
        _delete_party_data([{"roomCode": room_code}])

        with self.assertRaises(Exception) as raised:
            self._get_state(room_code, "guest-1")

        self.assertEqual(raised.exception.status_code, 410)
        self.assertIn("participant left", raised.exception.detail)


if __name__ == "__main__":
    unittest.main()
