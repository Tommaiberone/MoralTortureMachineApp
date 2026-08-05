import asyncio
import os
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
    claim_anonymous_user_id,
    delete_user_account,
    export_user_data,
    get_optional_user,
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
    def test_export_returns_only_the_callers_own_data(self):
        table = Mock()
        table.get_item.return_value = {"Item": {
            "email": "user@example.com",
            "createdAt": 1000,
            "updatedAt": 2000,
            "claimedAnonymousUserIds": {"anon-1", "anon-2"},
        }}
        with (
            patch.object(backend_module, "users_table", table),
            patch.object(backend_module, "require_authenticated_user", return_value={"sub": "user-sub"}),
        ):
            result = asyncio.run(export_user_data(request_with_headers({"Authorization": "Bearer token"})))

        table.get_item.assert_called_once_with(Key={"sub": "user-sub"})
        self.assertEqual(result["sub"], "user-sub")
        self.assertEqual(result["email"], "user@example.com")
        self.assertEqual(result["claimedAnonymousUserIds"], ["anon-1", "anon-2"])

    def test_delete_removes_the_user_record_and_releases_claimed_anonymous_ids(self):
        table = Mock()
        table.get_item.return_value = {"Item": {"claimedAnonymousUserIds": {"anon-1", "anon-2"}}}
        with (
            patch.object(backend_module, "users_table", table),
            patch.object(backend_module, "require_authenticated_user", return_value={"sub": "user-sub"}),
        ):
            result = asyncio.run(delete_user_account(request_with_headers({"Authorization": "Bearer token"})))

        self.assertEqual(result, {"deleted": True})
        deleted_keys = [call.kwargs["Key"] for call in table.delete_item.call_args_list]
        self.assertIn({"sub": "user-sub"}, deleted_keys)
        self.assertIn({"sub": "anon#anon-1"}, deleted_keys)
        self.assertIn({"sub": "anon#anon-2"}, deleted_keys)


if __name__ == "__main__":
    unittest.main()
