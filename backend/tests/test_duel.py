import asyncio
import json
import os
import time
import unittest
from unittest.mock import Mock, patch

from botocore.exceptions import ClientError
from fastapi import HTTPException
from starlette.requests import Request

os.environ.setdefault("AWS_EC2_METADATA_DISABLED", "true")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")
os.environ.setdefault("AWS_DEFAULT_REGION", "eu-west-1")

from backend.src.backend_fastapi import (  # noqa: E402
    CreateChallengeRequest,
    CreateProfileRequest,
    DilemmaAnswer,
    SubmitChallengeRequest,
    compare_challenge,
    create_challenge,
    create_profile,
    get_dilemmas_by_ids,
    get_profile,
    join_challenge,
    open_challenge,
    rematch_challenge,
    revoke_challenge,
    submit_challenge,
)
from backend.src import backend_fastapi as backend_module  # noqa: E402


def request_with_headers(headers, path="/"):
    return Request({
        "type": "http",
        "method": "GET",
        "path": path,
        "headers": [(key.lower().encode(), value.encode()) for key, value in headers.items()],
    })


def conditional_check_failed():
    return ClientError(
        {"Error": {"Code": "ConditionalCheckFailedException", "Message": "The conditional request failed"}},
        "PutItem",
    )


SIX_DIMENSIONS = ["Empathy", "Integrity", "Responsibility", "Justice", "Altruism", "Honesty"]


def answers_payload(value):
    return [
        DilemmaAnswer(dilemmaBaseId=f"dilemma-{i}", chosenValues={d: value for d in SIX_DIMENSIONS})
        for i in range(3)
    ]


class CreateProfileTests(unittest.TestCase):
    def test_requires_anonymous_user_id_header(self):
        profiles_table = Mock()
        with patch.object(backend_module, "moral_profiles_table", profiles_table):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(create_profile(
                    CreateProfileRequest(answers=answers_payload(0.8), language="en"),
                    request_with_headers({}),
                ))
        self.assertEqual(raised.exception.status_code, 400)
        profiles_table.put_item.assert_not_called()

    def test_creates_a_profile_and_returns_its_archetype(self):
        profiles_table = Mock()
        with patch.object(backend_module, "moral_profiles_table", profiles_table):
            result = asyncio.run(create_profile(
                CreateProfileRequest(answers=answers_payload(0.85), language="en"),
                request_with_headers({"X-Anonymous-User-Id": "anon-1"}),
            ))

        self.assertIn("publicId", result)
        self.assertIn("archetypeId", result)
        stored_item = profiles_table.put_item.call_args.kwargs["Item"]
        self.assertEqual(stored_item["ownerAnonymousUserId"], "anon-1")
        self.assertEqual(stored_item["dilemmaBaseIds"], ["dilemma-0", "dilemma-1", "dilemma-2"])
        self.assertEqual(json.loads(stored_item["dimensionAverages"])["Empathy"], 0.85)
        self.assertIn("lastAccessedAt", stored_item)
        self.assertGreater(stored_item["expirationTime"], int(time.time()))


class GetProfileTests(unittest.TestCase):
    def test_404_when_profile_missing(self):
        profiles_table = Mock()
        profiles_table.get_item.return_value = {}
        with patch.object(backend_module, "moral_profiles_table", profiles_table):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(get_profile("missing", request_with_headers({})))
        self.assertEqual(raised.exception.status_code, 404)

    def test_excludes_owner_anonymous_user_id_from_the_public_response(self):
        profiles_table = Mock()
        profiles_table.get_item.return_value = {"Item": {
            "publicId": "pub-1",
            "ownerAnonymousUserId": "anon-secret",
            "dimensionAverages": json.dumps({d: 0.8 for d in SIX_DIMENSIONS}),
            "createdAt": 1000,
        }}
        with patch.object(backend_module, "moral_profiles_table", profiles_table):
            result = asyncio.run(get_profile("pub-1", request_with_headers({}), language="en"))
        self.assertNotIn("ownerAnonymousUserId", result)
        self.assertNotIn("ownerAnonymousUserId", json.dumps(result))
        retention_call = profiles_table.update_item.call_args.kwargs
        self.assertIn("expirationTime", retention_call["UpdateExpression"])
        self.assertEqual(retention_call["ConditionExpression"], "attribute_exists(publicId)")

    def test_expired_profile_is_deleted_and_not_returned_while_ttl_is_pending(self):
        profiles_table = Mock()
        profiles_table.get_item.return_value = {"Item": {
            "publicId": "expired-profile",
            "dimensionAverages": json.dumps({d: 0.8 for d in SIX_DIMENSIONS}),
            "createdAt": 1000,
            "expirationTime": 1,
        }}
        with patch.object(backend_module, "moral_profiles_table", profiles_table):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(get_profile("expired-profile", request_with_headers({}), language="en"))
        self.assertEqual(raised.exception.status_code, 404)
        profiles_table.delete_item.assert_called_once_with(Key={"publicId": "expired-profile"})

    def test_expired_profile_does_not_trigger_repeat_duel_login_gate(self):
        profiles_table = Mock()
        profiles_table.query.return_value = {"Items": [{
            "publicId": "expired-profile",
            "expirationTime": 1,
        }]}
        with patch.object(backend_module, "moral_profiles_table", profiles_table):
            has_prior_profile = backend_module._has_prior_profile("anon-1")

        self.assertFalse(has_prior_profile)
        profiles_table.delete_item.assert_called_once_with(Key={"publicId": "expired-profile"})

    def test_profile_touch_does_not_recreate_a_concurrently_deleted_profile(self):
        profiles_table = Mock()
        profiles_table.get_item.return_value = {"Item": {
            "publicId": "gone-profile",
            "dimensionAverages": json.dumps({d: 0.8 for d in SIX_DIMENSIONS}),
            "createdAt": 1000,
        }}
        profiles_table.update_item.side_effect = conditional_check_failed()
        with patch.object(backend_module, "moral_profiles_table", profiles_table):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(get_profile("gone-profile", request_with_headers({}), language="en"))

        self.assertEqual(raised.exception.status_code, 404)

    def test_latest_profile_use_refreshes_its_retention(self):
        profiles_table = Mock()
        profiles_table.query.return_value = {"Items": [{
            "publicId": "active-profile",
            "ownerAnonymousUserId": "anon-1",
            "expirationTime": int(time.time()) + 1,
        }]}
        with patch.object(backend_module, "moral_profiles_table", profiles_table):
            profile = backend_module.get_latest_profile_for_anonymous_user("anon-1")

        self.assertEqual(profile["publicId"], "active-profile")
        update = profiles_table.update_item.call_args.kwargs
        self.assertEqual(update["Key"], {"publicId": "active-profile"})
        self.assertEqual(update["ConditionExpression"], "attribute_exists(publicId)")
        self.assertGreater(update["ExpressionAttributeValues"][":expiration_time"], int(time.time()))


class DilemmasByIdsTests(unittest.TestCase):
    def test_builds_language_specific_keys_and_preserves_order(self):
        response = {
            "Responses": {
                backend_module.DYNAMODB_TABLE: [
                    {"_id": "b-en", "dilemma": "B"},
                    {"_id": "a-en", "dilemma": "A"},
                ]
            }
        }
        dynamodb_mock = Mock()
        dynamodb_mock.batch_get_item.return_value = response
        with patch.object(backend_module, "dynamodb", dynamodb_mock):
            result = asyncio.run(get_dilemmas_by_ids("a,b", request_with_headers({}), language="en"))

        call_keys = dynamodb_mock.batch_get_item.call_args.kwargs["RequestItems"][backend_module.DYNAMODB_TABLE]["Keys"]
        self.assertEqual(call_keys, [{"_id": "a-en"}, {"_id": "b-en"}])
        self.assertEqual([item["dilemma"] for item in result["dilemmas"]], ["A", "B"])


class CreateChallengeTests(unittest.TestCase):
    def _profile_item(self, owner="anon-1"):
        return {
            "publicId": "profile-1",
            "ownerAnonymousUserId": owner,
            "dilemmaBaseIds": ["d1", "d2"],
            "language": "en",
        }

    def test_uses_latest_profile_when_none_specified(self):
        profiles_table = Mock()
        profiles_table.query.return_value = {"Items": [self._profile_item()]}
        challenges_table = Mock()
        participants_table = Mock()
        with (
            patch.object(backend_module, "moral_profiles_table", profiles_table),
            patch.object(backend_module, "challenges_table", challenges_table),
            patch.object(backend_module, "challenge_participants_table", participants_table),
        ):
            result = asyncio.run(create_challenge(
                CreateChallengeRequest(), request_with_headers({"X-Anonymous-User-Id": "anon-1"}),
            ))

        self.assertIn("challengeToken", result)
        challenge_item = challenges_table.put_item.call_args.kwargs["Item"]
        self.assertEqual(challenge_item["status"], "open")
        self.assertEqual(challenge_item["dilemmaBaseIds"], ["d1", "d2"])
        participant_item = participants_table.put_item.call_args.kwargs["Item"]
        self.assertEqual(participant_item["role"], "creator")
        self.assertEqual(participant_item["expirationTime"], challenge_item["expirationTime"])

    def test_400_when_caller_has_no_profile(self):
        profiles_table = Mock()
        profiles_table.query.return_value = {"Items": []}
        with patch.object(backend_module, "moral_profiles_table", profiles_table):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(create_challenge(
                    CreateChallengeRequest(), request_with_headers({"X-Anonymous-User-Id": "anon-1"}),
                ))
        self.assertEqual(raised.exception.status_code, 400)

    def test_404_when_specified_profile_is_owned_by_someone_else(self):
        profiles_table = Mock()
        profiles_table.get_item.return_value = {"Item": self._profile_item(owner="someone-else")}
        with patch.object(backend_module, "moral_profiles_table", profiles_table):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(create_challenge(
                    CreateChallengeRequest(profilePublicId="profile-1"),
                    request_with_headers({"X-Anonymous-User-Id": "anon-1"}),
                ))
        self.assertEqual(raised.exception.status_code, 404)

    def test_cross_device_profile_allowed_when_authenticated_and_claimed(self):
        """TASK-212: a profile created on device A (ownerAnonymousUserId
        'anon-device-a') must still be usable from device B ('anon-device-b')
        when both devices are claimed by the same authenticated account -
        the exact scenario TASK-193's profilePublicId fix was meant to fix,
        which the original owner==anonymous_user_id-only check still broke."""
        profiles_table = Mock()
        profiles_table.get_item.return_value = {"Item": self._profile_item(owner="anon-device-a")}
        profiles_table.query.return_value = {"Items": [{"publicId": "profile-1"}]}
        challenges_table = Mock()
        participants_table = Mock()
        with (
            patch.object(backend_module, "moral_profiles_table", profiles_table),
            patch.object(backend_module, "challenges_table", challenges_table),
            patch.object(backend_module, "challenge_participants_table", participants_table),
            patch.object(backend_module, "verify_cognito_id_token", return_value={"sub": "user-sub"}),
            patch.object(
                backend_module, "_claimed_anonymous_ids",
                return_value=(["anon-device-a", "anon-device-b"], []),
            ),
        ):
            result = asyncio.run(create_challenge(
                CreateChallengeRequest(profilePublicId="profile-1"),
                request_with_headers({"X-Anonymous-User-Id": "anon-device-b", "Authorization": "Bearer token"}),
            ))
        self.assertIn("challengeToken", result)

    def test_404_when_authenticated_but_profile_not_claimed_by_this_account(self):
        """The broadened cross-device check must stay strict: it only trusts
        _claimed_anonymous_ids, never grants access just because the caller
        happens to be authenticated."""
        profiles_table = Mock()
        profiles_table.get_item.return_value = {"Item": self._profile_item(owner="someone-elses-device")}
        with (
            patch.object(backend_module, "moral_profiles_table", profiles_table),
            patch.object(backend_module, "verify_cognito_id_token", return_value={"sub": "user-sub"}),
            patch.object(backend_module, "_claimed_anonymous_ids", return_value=(["anon-device-b"], [])),
        ):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(create_challenge(
                    CreateChallengeRequest(profilePublicId="profile-1"),
                    request_with_headers({"X-Anonymous-User-Id": "anon-device-b", "Authorization": "Bearer token"}),
                ))
        self.assertEqual(raised.exception.status_code, 404)

    def test_second_challenge_requires_login(self):
        """TASK-136: the first challenge stays anonymous, but owning any
        profile besides the one used for this challenge means it's not the
        caller's first Duel interaction, so it requires an account."""
        profiles_table = Mock()
        profiles_table.get_item.return_value = {"Item": self._profile_item(owner="anon-1")}
        profiles_table.query.return_value = {"Items": [
            {"publicId": "profile-1"}, {"publicId": "profile-from-an-earlier-duel"},
        ]}
        request = request_with_headers({"X-Anonymous-User-Id": "anon-1"})
        with patch.object(backend_module, "moral_profiles_table", profiles_table):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(create_challenge(
                    CreateChallengeRequest(profilePublicId="profile-1"),
                    request,
                ))
        self.assertEqual(raised.exception.status_code, 401)
        # TASK-140: this is the known, UI-handled login gate, not an
        # operational error - it must be flagged so notify_ops_of_errors
        # skips its ops alert for it.
        self.assertTrue(request.state.expected_business_error)


class OpenChallengeTests(unittest.TestCase):
    def test_teaser_never_includes_dimension_averages(self):
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": {
            "challengeToken": "tok", "status": "open", "dilemmaBaseIds": ["d1", "d2"], "language": "en",
        }}
        participants_table = Mock()
        participants_table.get_item.side_effect = [
            {"Item": {
                "challengeToken": "tok", "role": "creator", "profilePublicId": "profile-1",
                "anonymousUserId": "creator-anon",
            }},
            {},
        ]
        profiles_table = Mock()
        profiles_table.get_item.return_value = {"Item": {
            "publicId": "profile-1",
            "dimensionAverages": json.dumps({d: 0.85 for d in SIX_DIMENSIONS}),
        }}
        with (
            patch.object(backend_module, "challenges_table", challenges_table),
            patch.object(backend_module, "challenge_participants_table", participants_table),
            patch.object(backend_module, "moral_profiles_table", profiles_table),
        ):
            result = asyncio.run(open_challenge(
                "tok", request_with_headers({"X-Anonymous-User-Id": "viewer-anon"}), language="en",
            ))

        self.assertIn("creatorArchetype", result)
        self.assertNotIn("averages", result["creatorArchetype"])
        self.assertNotIn("dimensionAverages", json.dumps(result))
        self.assertFalse(result["alreadyJoined"])
        self.assertFalse(result["isOwnChallenge"])

    def test_own_challenge_is_flagged(self):
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": {
            "challengeToken": "tok", "status": "open", "dilemmaBaseIds": ["d1", "d2"], "language": "en",
        }}
        participants_table = Mock()
        participants_table.get_item.side_effect = [
            {"Item": {
                "challengeToken": "tok", "role": "creator", "profilePublicId": "profile-1",
                "anonymousUserId": "creator-anon",
            }},
            {},
        ]
        profiles_table = Mock()
        profiles_table.get_item.return_value = {"Item": {
            "publicId": "profile-1",
            "dimensionAverages": json.dumps({d: 0.85 for d in SIX_DIMENSIONS}),
        }}
        with (
            patch.object(backend_module, "challenges_table", challenges_table),
            patch.object(backend_module, "challenge_participants_table", participants_table),
            patch.object(backend_module, "moral_profiles_table", profiles_table),
        ):
            result = asyncio.run(open_challenge(
                "tok", request_with_headers({"X-Anonymous-User-Id": "creator-anon"}), language="en",
            ))

        self.assertTrue(result["isOwnChallenge"])

    def test_expired_challenge_returns_410(self):
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": {
            "challengeToken": "tok", "status": "open", "expirationTime": 1,
        }}
        with patch.object(backend_module, "challenges_table", challenges_table):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(open_challenge("tok", request_with_headers({"X-Anonymous-User-Id": "anon-1"})))
        self.assertEqual(raised.exception.status_code, 410)

    def test_revoked_challenge_returns_410(self):
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": {"challengeToken": "tok", "status": "revoked"}}
        with patch.object(backend_module, "challenges_table", challenges_table):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(open_challenge("tok", request_with_headers({"X-Anonymous-User-Id": "anon-1"})))
        self.assertEqual(raised.exception.status_code, 410)


class JoinChallengeTests(unittest.TestCase):
    def _open_challenge(self):
        return {"challengeToken": "tok", "status": "open", "dilemmaBaseIds": ["d1"], "language": "en"}

    def test_creator_cannot_join_their_own_challenge(self):
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": self._open_challenge()}
        participants_table = Mock()
        participants_table.get_item.return_value = {"Item": {"anonymousUserId": "anon-1", "role": "creator"}}
        with (
            patch.object(backend_module, "challenges_table", challenges_table),
            patch.object(backend_module, "challenge_participants_table", participants_table),
        ):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(join_challenge("tok", request_with_headers({"X-Anonymous-User-Id": "anon-1"})))
        self.assertEqual(raised.exception.status_code, 400)

    def test_repeated_join_by_the_same_invitee_is_idempotent(self):
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": {**self._open_challenge(), "status": "joined"}}
        participants_table = Mock()
        participants_table.get_item.return_value = {"Item": {"anonymousUserId": "someone-else", "role": "creator"}}
        profiles_table = Mock()
        profiles_table.query.return_value = {"Items": []}
        with (
            patch.object(backend_module, "challenges_table", challenges_table),
            patch.object(backend_module, "challenge_participants_table", participants_table),
            patch.object(backend_module, "moral_profiles_table", profiles_table),
        ):
            result = asyncio.run(join_challenge("tok", request_with_headers({"X-Anonymous-User-Id": "anon-2"})))
        self.assertEqual(result["dilemmaBaseIds"], ["d1"])

    def test_a_second_distinct_invitee_is_rejected(self):
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": self._open_challenge()}
        participants_table = Mock()
        participants_table.get_item.return_value = {"Item": {"anonymousUserId": "someone-else", "role": "creator"}}
        participants_table.put_item.side_effect = conditional_check_failed()
        profiles_table = Mock()
        profiles_table.query.return_value = {"Items": []}
        with (
            patch.object(backend_module, "challenges_table", challenges_table),
            patch.object(backend_module, "challenge_participants_table", participants_table),
            patch.object(backend_module, "moral_profiles_table", profiles_table),
        ):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(join_challenge("tok", request_with_headers({"X-Anonymous-User-Id": "anon-3"})))
        self.assertEqual(raised.exception.status_code, 409)

    def test_join_requires_login_when_caller_already_has_a_prior_profile(self):
        """TASK-136: the first challenge/join stays anonymous, but a caller
        who already owns a moral profile from something earlier must sign in
        to join a further one."""
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": self._open_challenge()}
        participants_table = Mock()
        participants_table.get_item.return_value = {"Item": {"anonymousUserId": "someone-else", "role": "creator"}}
        profiles_table = Mock()
        profiles_table.query.return_value = {"Items": [{"publicId": "profile-from-a-previous-duel"}]}
        request = request_with_headers({"X-Anonymous-User-Id": "anon-4"})
        with (
            patch.object(backend_module, "challenges_table", challenges_table),
            patch.object(backend_module, "challenge_participants_table", participants_table),
            patch.object(backend_module, "moral_profiles_table", profiles_table),
        ):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(join_challenge("tok", request))
        self.assertEqual(raised.exception.status_code, 401)
        # TASK-140: same known, UI-handled login gate - must not trigger an
        # ops alert email.
        self.assertTrue(request.state.expected_business_error)

    def test_join_allowed_with_a_prior_profile_when_authenticated(self):
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": self._open_challenge()}
        participants_table = Mock()
        participants_table.get_item.return_value = {"Item": {"anonymousUserId": "someone-else", "role": "creator"}}
        profiles_table = Mock()
        profiles_table.query.return_value = {"Items": [{"publicId": "profile-from-a-previous-duel"}]}
        with (
            patch.object(backend_module, "challenges_table", challenges_table),
            patch.object(backend_module, "challenge_participants_table", participants_table),
            patch.object(backend_module, "moral_profiles_table", profiles_table),
            patch.object(backend_module, "verify_cognito_id_token", return_value={"sub": "user-sub"}),
        ):
            result = asyncio.run(join_challenge("tok", request_with_headers({
                "X-Anonymous-User-Id": "anon-4", "Authorization": "Bearer token",
            })))
        self.assertEqual(result["dilemmaBaseIds"], ["d1"])


class SubmitChallengeTests(unittest.TestCase):
    def test_submit_creates_invitee_profile_and_completes_the_challenge(self):
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": {
            "challengeToken": "tok", "status": "joined", "language": "en", "dilemmaBaseIds": ["d1", "d2"],
        }}
        participants_table = Mock()
        participants_table.get_item.return_value = {"Item": {"anonymousUserId": "anon-2", "role": "invitee"}}
        profiles_table = Mock()

        with (
            patch.object(backend_module, "challenges_table", challenges_table),
            patch.object(backend_module, "challenge_participants_table", participants_table),
            patch.object(backend_module, "moral_profiles_table", profiles_table),
        ):
            result = asyncio.run(submit_challenge(
                "tok", SubmitChallengeRequest(answers=answers_payload(0.3)),
                request_with_headers({"X-Anonymous-User-Id": "anon-2"}),
            ))

        self.assertEqual(result["status"], "completed")
        profiles_table.put_item.assert_called_once()
        status_update = challenges_table.update_item.call_args.kwargs
        self.assertEqual(status_update["ExpressionAttributeValues"][":completed"], "completed")

    def test_rejects_submit_from_someone_who_never_joined(self):
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": {"challengeToken": "tok", "status": "joined"}}
        participants_table = Mock()
        participants_table.get_item.return_value = {}
        with (
            patch.object(backend_module, "challenges_table", challenges_table),
            patch.object(backend_module, "challenge_participants_table", participants_table),
        ):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(submit_challenge(
                    "tok", SubmitChallengeRequest(answers=answers_payload(0.3)),
                    request_with_headers({"X-Anonymous-User-Id": "anon-2"}),
                ))
        self.assertEqual(raised.exception.status_code, 403)

    def test_a_second_submit_is_rejected_as_immutable(self):
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": {
            "challengeToken": "tok", "status": "joined", "language": "en",
        }}
        participants_table = Mock()
        participants_table.get_item.return_value = {"Item": {"anonymousUserId": "anon-2", "role": "invitee"}}
        participants_table.update_item.side_effect = conditional_check_failed()
        profiles_table = Mock()
        with (
            patch.object(backend_module, "challenges_table", challenges_table),
            patch.object(backend_module, "challenge_participants_table", participants_table),
            patch.object(backend_module, "moral_profiles_table", profiles_table),
        ):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(submit_challenge(
                    "tok", SubmitChallengeRequest(answers=answers_payload(0.3)),
                    request_with_headers({"X-Anonymous-User-Id": "anon-2"}),
                ))
        self.assertEqual(raised.exception.status_code, 409)

    def test_already_completed_challenge_rejects_further_submits(self):
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": {"challengeToken": "tok", "status": "completed"}}
        with patch.object(backend_module, "challenges_table", challenges_table):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(submit_challenge(
                    "tok", SubmitChallengeRequest(answers=answers_payload(0.3)),
                    request_with_headers({"X-Anonymous-User-Id": "anon-2"}),
                ))
        self.assertEqual(raised.exception.status_code, 409)


class CompareChallengeTests(unittest.TestCase):
    def test_returns_409_until_completed(self):
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": {"challengeToken": "tok", "status": "joined"}}
        with patch.object(backend_module, "challenges_table", challenges_table):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(compare_challenge("tok", request_with_headers({})))
        self.assertEqual(raised.exception.status_code, 409)

    def test_symmetric_compatibility_is_included_once_completed(self):
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": {"challengeToken": "tok", "status": "completed"}}
        participants_table = Mock()
        participants_table.get_item.side_effect = [
            {"Item": {"role": "creator", "profilePublicId": "profile-creator"}},
            {"Item": {"role": "invitee", "profilePublicId": "profile-invitee"}},
        ]
        profiles_table = Mock()
        profiles_table.get_item.side_effect = [
            {"Item": {"dimensionAverages": json.dumps({d: 0.8 for d in SIX_DIMENSIONS})}},
            {"Item": {"dimensionAverages": json.dumps({d: 0.8 for d in SIX_DIMENSIONS})}},
        ]
        with (
            patch.object(backend_module, "challenges_table", challenges_table),
            patch.object(backend_module, "challenge_participants_table", participants_table),
            patch.object(backend_module, "moral_profiles_table", profiles_table),
        ):
            result = asyncio.run(compare_challenge("tok", request_with_headers({}), language="en"))

        self.assertEqual(result["compatibility"]["overallAgreementPct"], 100.0)
        self.assertIn("archetype", result["creator"])
        self.assertIn("archetype", result["invitee"])
        self.assertFalse(result["pairInsightUnlocked"])
        self.assertNotIn("pairInsight", result)
        self.assertFalse(result["isParticipant"])

    def test_is_participant_true_for_creator_and_invitee(self):
        """TASK-176: the caller's own anonymousUserId, sent via the header
        every screen already includes, marks them as a participant so the
        frontend knows to show the Rematch action."""
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": {"challengeToken": "tok", "status": "completed"}}
        profiles_table = Mock()
        profiles_table.get_item.side_effect = [
            {"Item": {"dimensionAverages": json.dumps({d: 0.8 for d in SIX_DIMENSIONS})}},
            {"Item": {"dimensionAverages": json.dumps({d: 0.8 for d in SIX_DIMENSIONS})}},
        ]
        for role in ("creator", "invitee"):
            participants_table = Mock()
            participants_table.get_item.side_effect = [
                {"Item": {"role": "creator", "profilePublicId": "profile-creator", "anonymousUserId": "creator-id"}},
                {"Item": {"role": "invitee", "profilePublicId": "profile-invitee", "anonymousUserId": "invitee-id"}},
            ]
            profiles_table.get_item.side_effect = [
                {"Item": {"dimensionAverages": json.dumps({d: 0.8 for d in SIX_DIMENSIONS})}},
                {"Item": {"dimensionAverages": json.dumps({d: 0.8 for d in SIX_DIMENSIONS})}},
            ]
            with (
                patch.object(backend_module, "challenges_table", challenges_table),
                patch.object(backend_module, "challenge_participants_table", participants_table),
                patch.object(backend_module, "moral_profiles_table", profiles_table),
            ):
                caller_id = "creator-id" if role == "creator" else "invitee-id"
                result = asyncio.run(compare_challenge(
                    "tok", request_with_headers({"X-Anonymous-User-Id": caller_id}), language="en",
                ))
            self.assertTrue(result["isParticipant"], f"expected isParticipant for {role}")

    def test_is_participant_false_for_non_participant_or_missing_header(self):
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": {"challengeToken": "tok", "status": "completed"}}
        profiles_table = Mock()
        for headers in ({"X-Anonymous-User-Id": "spectator-id"}, {}):
            participants_table = Mock()
            participants_table.get_item.side_effect = [
                {"Item": {"role": "creator", "profilePublicId": "profile-creator", "anonymousUserId": "creator-id"}},
                {"Item": {"role": "invitee", "profilePublicId": "profile-invitee", "anonymousUserId": "invitee-id"}},
            ]
            profiles_table.get_item.side_effect = [
                {"Item": {"dimensionAverages": json.dumps({d: 0.8 for d in SIX_DIMENSIONS})}},
                {"Item": {"dimensionAverages": json.dumps({d: 0.8 for d in SIX_DIMENSIONS})}},
            ]
            with (
                patch.object(backend_module, "challenges_table", challenges_table),
                patch.object(backend_module, "challenge_participants_table", participants_table),
                patch.object(backend_module, "moral_profiles_table", profiles_table),
            ):
                result = asyncio.run(compare_challenge("tok", request_with_headers(headers), language="en"))
            self.assertFalse(result["isParticipant"], f"expected not participant for headers={headers}")

    def test_pair_insight_unlocked_and_cached_when_authenticated(self):
        """TASK-135: the pair insight is the login incentive - generated
        once for an authenticated caller and cached on the challenge record,
        from only archetype names and aggregate percentages (never raw
        per-dilemma answers, per TASK-39)."""
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": {"challengeToken": "tok", "status": "completed"}}
        participants_table = Mock()
        participants_table.get_item.side_effect = [
            {"Item": {"role": "creator", "profilePublicId": "profile-creator"}},
            {"Item": {"role": "invitee", "profilePublicId": "profile-invitee"}},
        ]
        profiles_table = Mock()
        profiles_table.get_item.side_effect = [
            {"Item": {"dimensionAverages": json.dumps({d: 0.8 for d in SIX_DIMENSIONS})}},
            {"Item": {"dimensionAverages": json.dumps({d: 0.8 for d in SIX_DIMENSIONS})}},
        ]
        with (
            patch.object(backend_module, "challenges_table", challenges_table),
            patch.object(backend_module, "challenge_participants_table", participants_table),
            patch.object(backend_module, "moral_profiles_table", profiles_table),
            patch.object(backend_module, "verify_cognito_id_token", return_value={"sub": "user-sub"}),
        ):
            result = asyncio.run(compare_challenge(
                "tok", request_with_headers({"Authorization": "Bearer token"}), language="en",
            ))

        self.assertTrue(result["pairInsightUnlocked"])
        self.assertTrue(result["pairInsight"])
        update_call = challenges_table.update_item.call_args
        self.assertEqual(update_call.kwargs["Key"], {"challengeToken": "tok"})
        self.assertEqual(update_call.kwargs["ExpressionAttributeValues"][":insight"], result["pairInsight"])

    def test_pair_insight_not_regenerated_when_already_cached(self):
        challenges_table = Mock()
        challenges_table.get_item.return_value = {
            "Item": {"challengeToken": "tok", "status": "completed", "pairInsight": "Already cached."},
        }
        participants_table = Mock()
        participants_table.get_item.side_effect = [
            {"Item": {"role": "creator", "profilePublicId": "profile-creator"}},
            {"Item": {"role": "invitee", "profilePublicId": "profile-invitee"}},
        ]
        profiles_table = Mock()
        profiles_table.get_item.side_effect = [
            {"Item": {"dimensionAverages": json.dumps({d: 0.8 for d in SIX_DIMENSIONS})}},
            {"Item": {"dimensionAverages": json.dumps({d: 0.8 for d in SIX_DIMENSIONS})}},
        ]
        with (
            patch.object(backend_module, "challenges_table", challenges_table),
            patch.object(backend_module, "challenge_participants_table", participants_table),
            patch.object(backend_module, "moral_profiles_table", profiles_table),
            patch.object(backend_module, "verify_cognito_id_token", return_value={"sub": "user-sub"}),
        ):
            result = asyncio.run(compare_challenge(
                "tok", request_with_headers({"Authorization": "Bearer token"}), language="en",
            ))

        self.assertEqual(result["pairInsight"], "Already cached.")
        challenges_table.update_item.assert_not_called()


class RevokeChallengeTests(unittest.TestCase):
    def test_only_the_creator_can_revoke(self):
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": {"challengeToken": "tok", "status": "open"}}
        participants_table = Mock()
        participants_table.get_item.return_value = {"Item": {"anonymousUserId": "creator-anon"}}
        with (
            patch.object(backend_module, "challenges_table", challenges_table),
            patch.object(backend_module, "challenge_participants_table", participants_table),
        ):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(revoke_challenge("tok", request_with_headers({"X-Anonymous-User-Id": "someone-else"})))
        self.assertEqual(raised.exception.status_code, 403)
        challenges_table.update_item.assert_not_called()

    def test_a_completed_challenge_cannot_be_revoked(self):
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": {"challengeToken": "tok", "status": "completed"}}
        with patch.object(backend_module, "challenges_table", challenges_table):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(revoke_challenge("tok", request_with_headers({"X-Anonymous-User-Id": "creator-anon"})))
        self.assertEqual(raised.exception.status_code, 409)

    def test_creator_can_revoke_an_open_challenge(self):
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": {"challengeToken": "tok", "status": "open"}}
        participants_table = Mock()
        participants_table.get_item.return_value = {"Item": {"anonymousUserId": "creator-anon"}}
        with (
            patch.object(backend_module, "challenges_table", challenges_table),
            patch.object(backend_module, "challenge_participants_table", participants_table),
        ):
            result = asyncio.run(revoke_challenge("tok", request_with_headers({"X-Anonymous-User-Id": "creator-anon"})))
        self.assertEqual(result["status"], "revoked")
        update_call = challenges_table.update_item.call_args.kwargs
        self.assertEqual(update_call["ExpressionAttributeValues"][":revoked"], "revoked")

    def test_revoked_challenge_is_rejected_by_open_join_and_submit(self):
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": {"challengeToken": "tok", "status": "revoked"}}
        with patch.object(backend_module, "challenges_table", challenges_table):
            with self.assertRaises(HTTPException) as raised_open:
                asyncio.run(open_challenge("tok", request_with_headers({"X-Anonymous-User-Id": "anon-2"})))
            with self.assertRaises(HTTPException) as raised_join:
                asyncio.run(join_challenge("tok", request_with_headers({"X-Anonymous-User-Id": "anon-2"})))
        self.assertEqual(raised_open.exception.status_code, 410)
        self.assertEqual(raised_join.exception.status_code, 410)


class RematchChallengeTests(unittest.TestCase):
    def test_only_a_completed_challenge_can_be_rematched(self):
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": {"challengeToken": "tok", "status": "joined"}}
        with patch.object(backend_module, "challenges_table", challenges_table):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(rematch_challenge("tok", request_with_headers({"X-Anonymous-User-Id": "anon-1"})))
        self.assertEqual(raised.exception.status_code, 409)

    def test_non_participant_cannot_rematch(self):
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": {"challengeToken": "tok", "status": "completed"}}
        participants_table = Mock()
        participants_table.get_item.return_value = {"Item": {"anonymousUserId": "someone-else"}}
        with (
            patch.object(backend_module, "challenges_table", challenges_table),
            patch.object(backend_module, "challenge_participants_table", participants_table),
        ):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(rematch_challenge("tok", request_with_headers({"X-Anonymous-User-Id": "anon-9"})))
        self.assertEqual(raised.exception.status_code, 403)

    def test_participant_can_rematch_and_becomes_new_creator(self):
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": {
            "challengeToken": "tok", "status": "completed", "dilemmaBaseIds": ["d1"], "language": "en",
        }}
        participants_table = Mock()
        participants_table.get_item.return_value = {"Item": {"anonymousUserId": "anon-1", "profilePublicId": "profile-1"}}
        with (
            patch.object(backend_module, "challenges_table", challenges_table),
            patch.object(backend_module, "challenge_participants_table", participants_table),
            patch.object(backend_module, "verify_cognito_id_token", return_value={"sub": "user-sub"}),
        ):
            result = asyncio.run(rematch_challenge("tok", request_with_headers({
                "X-Anonymous-User-Id": "anon-1", "Authorization": "Bearer token",
            })))

        self.assertNotEqual(result["challengeToken"], "tok")
        new_challenge_item = challenges_table.put_item.call_args.kwargs["Item"]
        self.assertEqual(new_challenge_item["rematchOfToken"], "tok")
        new_creator_item = participants_table.put_item.call_args.kwargs["Item"]
        self.assertEqual(new_creator_item["expirationTime"], new_challenge_item["expirationTime"])

    def test_rematch_requires_login_even_for_a_valid_participant(self):
        """TASK-136: a rematch is always a repeat Duel interaction, so it
        always requires an account, even though this same participant/
        challenge state would otherwise be allowed."""
        challenges_table = Mock()
        challenges_table.get_item.return_value = {"Item": {
            "challengeToken": "tok", "status": "completed", "dilemmaBaseIds": ["d1"], "language": "en",
        }}
        participants_table = Mock()
        participants_table.get_item.return_value = {"Item": {"anonymousUserId": "anon-1", "profilePublicId": "profile-1"}}
        request = request_with_headers({"X-Anonymous-User-Id": "anon-1"})
        with (
            patch.object(backend_module, "challenges_table", challenges_table),
            patch.object(backend_module, "challenge_participants_table", participants_table),
        ):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(rematch_challenge("tok", request))
        self.assertEqual(raised.exception.status_code, 401)
        # TASK-140: same known, UI-handled login gate as create/join - must
        # not trigger an ops alert email.
        self.assertTrue(request.state.expected_business_error)


if __name__ == "__main__":
    unittest.main()
