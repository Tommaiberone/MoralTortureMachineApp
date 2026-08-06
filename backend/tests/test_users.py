import asyncio
import os
import time
import unittest
from contextlib import ExitStack
from unittest.mock import Mock, patch

from botocore.exceptions import ClientError
from fastapi import HTTPException
from starlette.requests import Request

os.environ.setdefault("AWS_EC2_METADATA_DISABLED", "true")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")
os.environ.setdefault("AWS_DEFAULT_REGION", "eu-west-1")

from backend.src.backend_fastapi import (  # noqa: E402
    claim_anonymous_user_id,
    delete_user_account,
    export_user_data,
    get_optional_user,
    require_active_cognito_user,
    require_authenticated_user,
    retention_sweep_handler,
    upsert_user_record,
)
from backend.src import backend_fastapi as backend_module  # noqa: E402


def conditional_check_failed():
    return ClientError(
        {"Error": {"Code": "ConditionalCheckFailedException", "Message": "The conditional request failed"}},
        "PutItem",
    )


def request_with_headers(headers):
    return Request({
        "type": "http",
        "method": "GET",
        "path": "/auth/me",
        "headers": [(key.lower().encode(), value.encode()) for key, value in headers.items()],
    })


class OptionalUserDependencyTests(unittest.TestCase):
    def test_returns_none_without_a_token(self):
        self.assertIsNone(get_optional_user(request_with_headers({})))

    def test_returns_claims_for_a_valid_token(self):
        with patch.object(backend_module, "verify_cognito_id_token", return_value={"sub": "user-sub"}):
            user = get_optional_user(request_with_headers({"Authorization": "Bearer token"}))
        self.assertEqual(user, {"sub": "user-sub"})

    def test_valid_optional_user_refreshes_existing_account_activity(self):
        claims = {"sub": "user-sub"}
        with (
            patch.object(backend_module, "verify_cognito_id_token", return_value=claims),
            patch.object(backend_module, "_touch_existing_account_activity") as touch,
        ):
            user = get_optional_user(request_with_headers({"Authorization": "Bearer token"}))

        self.assertEqual(user, claims)
        touch.assert_called_once_with(claims)

    def test_returns_none_instead_of_raising_for_an_invalid_token(self):
        with patch.object(
            backend_module,
            "verify_cognito_id_token",
            side_effect=HTTPException(status_code=401, detail="Invalid or expired authentication token"),
        ):
            user = get_optional_user(request_with_headers({"Authorization": "Bearer bad-token"}))
        self.assertIsNone(user)


class UpsertUserRecordTests(unittest.TestCase):
    def test_upsert_is_idempotent_and_keeps_the_original_created_at(self):
        table = Mock()
        with patch.object(backend_module, "users_table", table):
            upsert_user_record("user-sub", {"email": "user@example.com"})

        table.update_item.assert_called_once()
        call = table.update_item.call_args
        self.assertEqual(call.kwargs["Key"], {"sub": "user-sub"})
        self.assertIn("if_not_exists(createdAt, :now)", call.kwargs["UpdateExpression"])
        self.assertEqual(call.kwargs["ExpressionAttributeValues"][":email"], "user@example.com")
        self.assertEqual(call.kwargs["ExpressionAttributeValues"][":cognito_username"], None)
        self.assertIn(":expiration_time", call.kwargs["ExpressionAttributeValues"])


class ClaimAnonymousUserIdTests(unittest.TestCase):
    def test_first_claim_links_the_anonymous_id_to_the_owner(self):
        table = Mock()
        with patch.object(backend_module, "users_table", table):
            claim_anonymous_user_id("user-sub", "anon-123")

        put_call = table.put_item.call_args
        self.assertEqual(put_call.kwargs["Item"]["sub"], "anon#anon-123")
        self.assertEqual(put_call.kwargs["Item"]["ownerSub"], "user-sub")

        update_call = table.update_item.call_args
        self.assertEqual(update_call.kwargs["Key"], {"sub": "user-sub"})
        self.assertEqual(update_call.kwargs["ExpressionAttributeValues"][":ids"], {"anon-123"})

    def test_condition_expression_never_references_the_reserved_word_sub_directly(self):
        # DynamoDB rejects a ConditionExpression that names the reserved
        # keyword "sub" outside of an ExpressionAttributeNames placeholder
        # (ValidationException: "Attribute name is a reserved keyword").
        # This does not exercise real DynamoDB validation (this test suite
        # mocks the table like the rest of this file), but it pins the
        # placeholder substitution so a regression to the bare literal fails
        # here instead of in production.
        table = Mock()
        with patch.object(backend_module, "users_table", table):
            claim_anonymous_user_id("user-sub", "anon-123")

        put_call = table.put_item.call_args
        condition_expression = put_call.kwargs["ConditionExpression"]
        attribute_names = put_call.kwargs.get("ExpressionAttributeNames", {})
        self.assertNotIn("attribute_not_exists(sub)", condition_expression)
        self.assertIn("sub", attribute_names.values())
        placeholder = next(key for key, value in attribute_names.items() if value == "sub")
        self.assertIn(f"attribute_not_exists({placeholder})", condition_expression)

    def test_repeating_the_claim_by_the_same_owner_is_a_safe_no_op(self):
        table = Mock()
        with patch.object(backend_module, "users_table", table):
            claim_anonymous_user_id("user-sub", "anon-123")
            claim_anonymous_user_id("user-sub", "anon-123")

        self.assertEqual(table.put_item.call_count, 2)
        self.assertEqual(table.update_item.call_count, 2)

    def test_claiming_an_id_already_owned_by_another_account_is_rejected(self):
        table = Mock()
        table.put_item.side_effect = conditional_check_failed()
        with patch.object(backend_module, "users_table", table):
            with self.assertRaises(HTTPException) as raised:
                claim_anonymous_user_id("second-user-sub", "anon-123")

        self.assertEqual(raised.exception.status_code, 409)
        table.update_item.assert_not_called()


class ExportAndDeleteAccountTests(unittest.TestCase):
    def _linked_tables(self):
        users_table = Mock()
        users_table.get_item.return_value = {"Item": {
            "email": "user@example.com",
            "createdAt": 1000,
            "updatedAt": 2000,
            "lastActiveAt": 2000,
            "claimedAnonymousUserIds": {"anon-1"},
        }}
        users_table.scan.return_value = {"Items": [{
            "sub": "anon#anon-1",
            "ownerSub": "user-sub",
            "claimedAt": 1500,
        }]}

        profiles_table = Mock()
        profiles_table.query.return_value = {"Items": [{
            "publicId": "profile-1",
            "ownerAnonymousUserId": "anon-1",
            "dimensionAverages": '{"empathy":0.8}',
            "archetypeId": "moral_idealist",
            "createdAt": 3000,
        }]}

        product_events_table = Mock()
        product_events_table.query.return_value = {"Items": [{
            "eventId": "event-1",
            "anonymousUserId": "anon-1",
            "sessionId": "session-1",
            "actionType": "profile_created",
        }]}

        analytics_table = Mock()
        analytics_table.scan.return_value = {"Items": [{
            "sessionId": "session-1",
            "timestamp": 4000,
            "anonymousUserId": "anon-1",
            "actionType": "profile_created",
        }]}

        challenge_participants_table = Mock()
        challenge_participants_table.scan.return_value = {"Items": [{
            "challengeToken": "challenge-1",
            "role": "creator",
            "anonymousUserId": "anon-1",
            "profilePublicId": "profile-1",
            "submittedAt": 5000,
        }]}
        challenge_participants_table.query.return_value = {"Items": [
            {
                "challengeToken": "challenge-1",
                "role": "creator",
                "anonymousUserId": "anon-1",
                "profilePublicId": "profile-1",
            },
            {
                "challengeToken": "challenge-1",
                "role": "invitee",
                "anonymousUserId": "other-anon",
                "profilePublicId": "other-profile",
            },
        ]}

        party_participants_table = Mock()
        party_participants_table.scan.return_value = {"Items": [{
            "roomCode": "ROOM1",
            "participantId": "anon-1",
            "displayName": "Me",
            "isHost": False,
            "joinedAt": 6000,
            "votes": {"0": {"choice": "first"}},
        }]}
        party_participants_table.query.return_value = {"Items": [
            {
                "roomCode": "ROOM1",
                "participantId": "anon-1",
                "displayName": "Me",
            },
            {
                "roomCode": "ROOM1",
                "participantId": "other-anon",
                "displayName": "Other",
            },
        ]}

        challenges_table = Mock()
        challenges_table.scan.return_value = {"Items": []}
        party_rooms_table = Mock()
        return {
            "users_table": users_table,
            "moral_profiles_table": profiles_table,
            "product_events_table": product_events_table,
            "analytics_table": analytics_table,
            "challenge_participants_table": challenge_participants_table,
            "challenges_table": challenges_table,
            "party_participants_table": party_participants_table,
            "party_rooms_table": party_rooms_table,
        }

    def _patch_linked_tables(self, tables):
        stack = ExitStack()
        for name, value in tables.items():
            stack.enter_context(patch.object(backend_module, name, value))
        return stack

    def test_export_returns_every_linked_domain_without_counterparty_data(self):
        tables = self._linked_tables()
        with (
            self._patch_linked_tables(tables),
            patch.object(backend_module, "require_authenticated_user", return_value={"sub": "user-sub"}),
        ):
            result = asyncio.run(export_user_data(request_with_headers({"Authorization": "Bearer token"})))

        self.assertEqual(result["schemaVersion"], 2)
        self.assertEqual(result["account"]["sub"], "user-sub")
        self.assertEqual(result["account"]["email"], "user@example.com")
        self.assertEqual(result["claimedAnonymousUserIds"], ["anon-1"])
        self.assertEqual(result["moralProfiles"][0]["publicId"], "profile-1")
        self.assertEqual(result["duelParticipations"], [{
            "challengeToken": "challenge-1",
            "role": "creator",
            "profilePublicId": "profile-1",
            "submittedAt": 5000,
        }])
        self.assertEqual(result["partyParticipations"][0]["displayName"], "Me")
        self.assertNotIn("Other", str(result))
        self.assertEqual(result["analytics"]["productEvents"][0]["eventId"], "event-1")
        self.assertEqual(result["analytics"]["legacyEvents"][0]["timestamp"], 4000)

    def test_delete_cascades_all_linked_data_then_removes_cognito_identity(self):
        tables = self._linked_tables()
        cognito_client = Mock()
        with (
            self._patch_linked_tables(tables),
            patch.object(
                backend_module,
                "require_authenticated_user",
                return_value={"sub": "user-sub", "cognito:username": "Google_user"},
            ),
            patch.object(backend_module, "COGNITO_USER_POOL_ID", "pool-id"),
            patch.object(backend_module, "cognito_idp_client", cognito_client),
        ):
            result = asyncio.run(delete_user_account(request_with_headers({"Authorization": "Bearer token"})))

        self.assertEqual(result, {"deleted": True, "deletedData": {
            "moralProfiles": 1,
            "challenges": 1,
            "partyRooms": 1,
            "productEvents": 1,
            "legacyEvents": 1,
        }})
        cognito_client.admin_delete_user.assert_called_once_with(
            UserPoolId="pool-id",
            Username="Google_user",
        )
        deleted_keys = [call.kwargs["Key"] for call in tables["users_table"].delete_item.call_args_list]
        self.assertIn({"sub": "user-sub"}, deleted_keys)
        self.assertIn({"sub": "anon#anon-1"}, deleted_keys)
        tables["moral_profiles_table"].delete_item.assert_called_once_with(Key={"publicId": "profile-1"})
        tables["product_events_table"].delete_item.assert_called_once_with(Key={"eventId": "event-1"})
        tables["analytics_table"].delete_item.assert_called_once_with(
            Key={"sessionId": "session-1", "timestamp": 4000},
        )
        self.assertEqual(
            tables["challenge_participants_table"].delete_item.call_count,
            2,
        )
        tables["challenges_table"].delete_item.assert_called_once_with(Key={"challengeToken": "challenge-1"})
        self.assertEqual(tables["party_participants_table"].delete_item.call_count, 2)
        tables["party_rooms_table"].delete_item.assert_called_once_with(Key={"roomCode": "ROOM1"})


class CognitoAccountStatusTests(unittest.TestCase):
    def test_active_cognito_user_is_required_when_a_pool_is_configured(self):
        client = Mock()
        claims = {"sub": "user-sub", "cognito:username": "Google_user"}
        with (
            patch.object(backend_module, "COGNITO_USER_POOL_ID", "pool-id"),
            patch.object(backend_module, "cognito_idp_client", client),
        ):
            result = require_active_cognito_user(claims)

        self.assertEqual(result, claims)
        client.admin_get_user.assert_called_once_with(UserPoolId="pool-id", Username="Google_user")

    def test_deleted_cognito_user_is_rejected_even_with_a_locally_valid_jwt(self):
        client = Mock()
        client.admin_get_user.side_effect = ClientError(
            {"Error": {"Code": "UserNotFoundException", "Message": "missing"}},
            "AdminGetUser",
        )
        with (
            patch.object(backend_module, "COGNITO_USER_POOL_ID", "pool-id"),
            patch.object(backend_module, "cognito_idp_client", client),
            self.assertRaises(HTTPException) as raised,
        ):
            require_active_cognito_user({"sub": "user-sub", "cognito:username": "Google_user"})
        self.assertEqual(raised.exception.status_code, 401)

    def test_retention_resolves_a_legacy_federated_username_from_the_immutable_sub(self):
        client = Mock()
        client.list_users.return_value = {"Users": [{"Username": "Google_legacy"}]}
        with (
            patch.object(backend_module, "COGNITO_USER_POOL_ID", "pool-id"),
            patch.object(backend_module, "cognito_idp_client", client),
        ):
            username = backend_module._resolve_cognito_username(None, "user-sub")

        self.assertEqual(username, "Google_legacy")
        client.list_users.assert_called_once_with(
            UserPoolId="pool-id",
            Filter='sub = "user-sub"',
            Limit=1,
        )


class AccountActivityRetentionTests(unittest.TestCase):
    def test_authenticated_request_touches_an_existing_account_no_more_than_daily(self):
        table = Mock()
        client = Mock()
        claims = {"sub": "user-sub", "cognito:username": "Google_user"}
        with (
            patch.object(backend_module, "COGNITO_USER_POOL_ID", "pool-id"),
            patch.object(backend_module, "cognito_idp_client", client),
            patch.object(backend_module, "verify_cognito_id_token", return_value=claims),
            patch.object(backend_module, "users_table", table),
        ):
            result = require_authenticated_user(request_with_headers({"Authorization": "Bearer token"}))

        self.assertEqual(result, claims)
        update = table.update_item.call_args.kwargs
        self.assertIn("attribute_exists(#sub)", update["ConditionExpression"])
        self.assertIn("lastActiveAt < :refresh_before", update["ConditionExpression"])
        self.assertGreater(update["ExpressionAttributeValues"][":expiration_time"], int(time.time()))


class RetentionSweepTests(unittest.TestCase):
    def test_sweep_deletes_expired_profiles_and_accounts(self):
        profiles_table = Mock()
        profiles_table.scan.return_value = {"Items": [{
            "publicId": "expired-profile",
            "expirationTime": 1,
        }]}
        users_table = Mock()
        users_table.scan.return_value = {"Items": [{
            "sub": "expired-user",
            "createdAt": 1,
            "expirationTime": 1,
            "cognitoUsername": "Google_expired",
        }]}
        with (
            patch.object(backend_module, "moral_profiles_table", profiles_table),
            patch.object(backend_module, "users_table", users_table),
            patch.object(backend_module, "_delete_account_by_sub", return_value={}) as delete_account,
        ):
            result = retention_sweep_handler({}, None)

        self.assertEqual(result, {"deletedProfiles": 1, "deletedAccounts": 1})
        profiles_table.delete_item.assert_called_once_with(Key={"publicId": "expired-profile"})
        delete_account.assert_called_once_with("expired-user", "Google_expired")

    def test_sweep_keeps_an_account_refreshed_by_recent_authenticated_activity(self):
        now_seconds = int(time.time())
        profiles_table = Mock()
        profiles_table.scan.return_value = {"Items": []}
        users_table = Mock()
        users_table.scan.return_value = {"Items": [{
            "sub": "recent-user",
            "createdAt": (now_seconds - 60) * 1000,
            "lastActiveAt": (now_seconds - 60) * 1000,
            "expirationTime": now_seconds + backend_module.ACCOUNT_RETENTION_SECONDS,
        }]}
        with (
            patch.object(backend_module, "moral_profiles_table", profiles_table),
            patch.object(backend_module, "users_table", users_table),
            patch.object(backend_module, "_delete_account_by_sub") as delete_account,
        ):
            result = retention_sweep_handler({}, None)

        self.assertEqual(result, {"deletedProfiles": 0, "deletedAccounts": 0})
        delete_account.assert_not_called()


if __name__ == "__main__":
    unittest.main()
