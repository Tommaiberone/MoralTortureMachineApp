from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from mangum import Mangum
from pydantic import BaseModel, Field, field_validator
import boto3
from botocore.exceptions import ClientError
import jwt
from jwt import InvalidTokenError, PyJWKClient
import requests
import os
import logging
import time
import hmac
import hashlib
import re
import secrets
import random
import html
from collections import Counter, defaultdict, deque
from datetime import datetime, timedelta, timezone
from math import ceil
from threading import Lock
from typing import Optional, Dict, Any
from decimal import Decimal
import json
from urllib.parse import urlparse

# archetype_engine.py is deployed as a flat sibling of this file (see
# .github/workflows/deploy.yml), so the same import must resolve whether this
# module is loaded as a bare top-level module (Lambda), as `src.backend_fastapi`
# (local uvicorn), or as `backend.src.backend_fastapi` (unit tests).
try:
    from src.archetype_engine import assign_archetype, compute_dimension_averages
    from src.compatibility_engine import compute_compatibility
    from src.party_awards import compute_party_room_awards
except ImportError:
    try:
        from .archetype_engine import assign_archetype, compute_dimension_averages
        from .compatibility_engine import compute_compatibility
        from .party_awards import compute_party_room_awards
    except ImportError:
        from archetype_engine import assign_archetype, compute_dimension_averages
        from compatibility_engine import compute_compatibility
        from party_awards import compute_party_room_awards

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize FastAPI app
app = FastAPI(title="Moral Torture Machine API")

CORS_ALLOWED_ORIGINS = [
    "https://moraltorturemachine.com",
    "https://www.moraltorturemachine.com",
    "https://tommaiberone.github.io",
    "https://d1vklv6uo7wyz2.cloudfront.net",  # legacy
    "https://d2l4ckgwzkl5t3.cloudfront.net",
    "http://localhost:3000",
    "http://localhost:5173",
    "https://localhost",  # Capacitor Android/iOS app
    "capacitor://localhost",  # Capacitor fallback
]

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Accept",
        "X-Session-Id",
        "X-Anonymous-User-Id",
        "X-Install-Id",
        "X-Client-Platform",
        "X-App-Version",
        "X-Client-Language",
        "X-Time-Zone",
        "Authorization",
    ],
    expose_headers=["Content-Type"],
)

# Environment variables
DYNAMODB_TABLE = os.getenv("DYNAMODB_TABLE", "moral-torture-machine-dilemmas")
ANALYTICS_TABLE = os.getenv("ANALYTICS_TABLE", "moral-torture-machine-user-analytics")
STORY_FLOWS_TABLE = os.getenv("STORY_FLOWS_TABLE", "moral-torture-machine-story-flows")
PRODUCT_EVENTS_TABLE = os.getenv("PRODUCT_EVENTS_TABLE", "prod-moral-torture-machine-product-events")
USERS_TABLE = os.getenv("USERS_TABLE", "moral-torture-machine-users")
MORAL_PROFILES_TABLE = os.getenv("MORAL_PROFILES_TABLE", "moral-torture-machine-moral-profiles")
CHALLENGES_TABLE = os.getenv("CHALLENGES_TABLE", "moral-torture-machine-challenges")
CHALLENGE_PARTICIPANTS_TABLE = os.getenv("CHALLENGE_PARTICIPANTS_TABLE", "moral-torture-machine-challenge-participants")
PARTY_ROOMS_TABLE = os.getenv("PARTY_ROOMS_TABLE", "moral-torture-machine-party-rooms")
PARTY_PARTICIPANTS_TABLE = os.getenv("PARTY_PARTICIPANTS_TABLE", "moral-torture-machine-party-participants")
OPS_ERROR_ALERTS_TABLE = os.getenv("OPS_ERROR_ALERTS_TABLE", "moral-torture-machine-ops-error-alerts")
# TASK-30/113: same bucket the frontend deploy already syncs to (frontend/terraform),
# just a dedicated prefix within it for bot-only pre-rendered profile previews.
FRONTEND_BUCKET_NAME = os.getenv("FRONTEND_BUCKET_NAME", "prod-moral-torture-machine-frontend")
AWS_REGION = os.getenv("AWS_REGION", "eu-west-1")
GROQ_API_KEY_SSM_NAME = os.getenv("GROQ_API_KEY_SSM_NAME", "")
ANALYTICS_FINGERPRINT_SECRET_SSM_NAME = os.getenv(
    "ANALYTICS_FINGERPRINT_SECRET_SSM_NAME",
    "",
)
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "")
COGNITO_APP_CLIENT_ID = os.getenv("COGNITO_APP_CLIENT_ID", "")
COGNITO_APP_CLIENT_IDS = tuple(
    client_id.strip()
    for client_id in os.getenv("COGNITO_APP_CLIENT_IDS", COGNITO_APP_CLIENT_ID).split(",")
    if client_id.strip()
)


def _env_positive_int(name: str, default: int) -> int:
    try:
        value = int(os.getenv(name, str(default)))
        return value if value > 0 else default
    except ValueError:
        return default


ABUSE_BURST_GUARD_ENABLED = os.getenv("ABUSE_BURST_GUARD_ENABLED", "true").lower() == "true"
ABUSE_GLOBAL_REQUESTS_PER_MINUTE = _env_positive_int("ABUSE_GLOBAL_REQUESTS_PER_MINUTE", 120)
ABUSE_AI_REQUESTS_PER_MINUTE = _env_positive_int("ABUSE_AI_REQUESTS_PER_MINUTE", 12)
ABUSE_ANALYTICS_BATCHES_PER_MINUTE = _env_positive_int(
    "ABUSE_ANALYTICS_BATCHES_PER_MINUTE",
    30,
)
ABUSE_AUTH_WRITE_REQUESTS_PER_MINUTE = _env_positive_int(
    "ABUSE_AUTH_WRITE_REQUESTS_PER_MINUTE",
    10,
)
ABUSE_DUEL_WRITE_REQUESTS_PER_MINUTE = _env_positive_int(
    "ABUSE_DUEL_WRITE_REQUESTS_PER_MINUTE",
    15,
)
# TASK-67: public, unauthenticated reads (profiles, challenge teasers/compare,
# batch dilemma lookup) had no bucket of their own beyond the "global" one,
# even though they are the endpoints someone probing non-enumerable tokens
# would hit hardest. Separate and slightly tighter than "global" so scraping
# these specifically is throttled without touching unrelated traffic.
ABUSE_PUBLIC_READ_REQUESTS_PER_MINUTE = _env_positive_int(
    "ABUSE_PUBLIC_READ_REQUESTS_PER_MINUTE",
    60,
)
# TASK-46/47: Party Room is polled by every participant every 1-2s while a
# room is active (ADR-050), so it needs a much higher ceiling per source than
# the occasional "public_read" checks elsewhere - 60/min would be exhausted
# by a single actively-polling participant alone.
ABUSE_PARTY_ROOM_POLL_REQUESTS_PER_MINUTE = _env_positive_int(
    "ABUSE_PARTY_ROOM_POLL_REQUESTS_PER_MINUTE",
    90,
)

# TASK-104: email every 4xx/5xx via the existing ops_alerts SNS topic
# (ADR-031). Coalesced per (status_code, path) rather than per request, so a
# burst of the same ordinary client error (e.g. a repeated 409/404 during
# normal Duel usage) does not flood the owner's inbox; each distinct
# (status_code, path) signature can notify at most once per cooldown window.
OPS_ALERTS_TOPIC_ARN = os.getenv("OPS_ALERTS_TOPIC_ARN", "")
OPS_ERROR_NOTIFICATIONS_ENABLED = os.getenv("OPS_ERROR_NOTIFICATIONS_ENABLED", "true").lower() == "true"
OPS_ERROR_NOTIFICATION_COOLDOWN_SECONDS = _env_positive_int(
    "OPS_ERROR_NOTIFICATION_COOLDOWN_SECONDS",
    600,
)
# TASK-129: how long a persisted ops error alert row survives before TTL
# cleanup - a recent-history audit trail for triage (see the
# ops-alerts-sweep skill), not permanent storage.
OPS_ERROR_ALERT_TTL_SECONDS = 30 * 24 * 60 * 60

# TASK-34: abandoned challenges (never joined/completed) expire via TTL.
CHALLENGE_TTL_SECONDS = 30 * 24 * 60 * 60

# TASK-64: accounts and shareable profiles expire after twelve months without
# activity. Shorter domain-specific limits (analytics, challenges, Party Room,
# and operational alerts) remain defined separately below/above.
ACCOUNT_RETENTION_SECONDS = 365 * 24 * 60 * 60
PROFILE_RETENTION_SECONDS = 365 * 24 * 60 * 60
# Refreshing an activity timestamp at most once a day is sufficient for a
# twelve-month lifecycle while avoiding one DynamoDB write per authenticated
# request/poll.
ACTIVITY_REFRESH_INTERVAL_SECONDS = 24 * 60 * 60

# TASK-46/47: Party Room (ADR-050 - HTTP polling, not WebSocket). Rooms are a
# short-lived, same-session activity, so a much shorter TTL than Duel
# challenges is appropriate. The room code is short/typeable (for QR fallback
# and verbal sharing) rather than a long opaque token like Duel's; that's
# safe because a room carries no private data and expires quickly.
PARTY_ROOM_TTL_SECONDS = 6 * 60 * 60
PARTY_ROOM_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"  # no 0/O/1/I/L
PARTY_ROOM_CODE_LENGTH = 6
PARTY_ROOM_MIN_DILEMMAS = 3
PARTY_ROOM_MAX_DILEMMAS = 12
PARTY_ROOM_DEFAULT_DILEMMAS = 6
PARTY_ROOM_MAX_PARTICIPANTS = 20
PARTY_ROOM_MIN_PARTICIPANTS_TO_START = 2
# TASK-123, at the user's explicit request: this is a game meant for
# discussion, not a race against a clock. Voting has no time limit (a round
# only ends once everyone has voted) and the reveal only ends when the host
# explicitly advances - see _advance_party_room_if_due. This is a pure
# abandoned-room safety net, never a visible countdown.
PARTY_ROOM_SAFETY_TIMEOUT_MS = 10 * 60 * 1000

# Model fallback strategy - ordered by capability, highest first. Refreshed
# 2026-08-05 (TASK-162) against GroqCloud's Supported Models page: models no
# longer listed there (qwen/qwen3-32b, both llama-4 variants, both
# moonshotai/kimi-k2 variants, llama-guard-4-12b, allam-2-7b) were dropped
# rather than left to silently fail; qwen/qwen3.6-27b is new. Rate limits
# below are the Developer plan TPM/RPM shown on that page (it no longer
# publishes TPD). The two prompt-guard classifier models (not general chat
# models) were dropped at the user's explicit request (TASK-163) - they were
# unlikely to ever produce a usable completion for this app's prompts.
MODEL_FALLBACK_CHAIN = [
    "llama-3.3-70b-versatile",             # 300K TPM, 1K RPM - High capability
    "openai/gpt-oss-120b",                 # 250K TPM, 1K RPM - High capability
    "qwen/qwen3.6-27b",                    # 250K TPM, 1K RPM - High capability
    "llama-3.1-8b-instant",                # 250K TPM, 1K RPM - Medium capability
    "openai/gpt-oss-20b",                  # 250K TPM, 1K RPM - Medium capability
    "groq/compound",                       # 200K TPM, 200 RPM - agentic system, last resort
    "groq/compound-mini",                  # 200K TPM, 200 RPM - agentic system, last resort
]

# Initialize AWS clients
s3_client = boto3.client('s3', region_name=AWS_REGION)
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
table = dynamodb.Table(DYNAMODB_TABLE)
analytics_table = dynamodb.Table(ANALYTICS_TABLE)
story_flows_table = dynamodb.Table(STORY_FLOWS_TABLE)
product_events_table = dynamodb.Table(PRODUCT_EVENTS_TABLE)
users_table = dynamodb.Table(USERS_TABLE)
moral_profiles_table = dynamodb.Table(MORAL_PROFILES_TABLE)
challenges_table = dynamodb.Table(CHALLENGES_TABLE)
challenge_participants_table = dynamodb.Table(CHALLENGE_PARTICIPANTS_TABLE)
party_rooms_table = dynamodb.Table(PARTY_ROOMS_TABLE)
party_participants_table = dynamodb.Table(PARTY_PARTICIPANTS_TABLE)
ops_error_alerts_table = dynamodb.Table(OPS_ERROR_ALERTS_TABLE)
ssm_client = boto3.client('ssm', region_name=AWS_REGION)
sns_client = boto3.client('sns', region_name=AWS_REGION)
cognito_idp_client = boto3.client('cognito-idp', region_name=AWS_REGION)

# Cache for API key (retrieved once at cold start)
_api_key_cache = None
_analytics_fingerprint_secret_cache = None
_analytics_overview_cache = {}
_cognito_jwks_client = None
_burst_windows = defaultdict(deque)
_burst_lock = Lock()
_burst_request_count = 0
_ops_notification_last_sent: Dict[str, float] = {}
_ops_notification_lock = Lock()

def get_groq_api_key() -> str:
    """Retrieve Groq API key from AWS SSM Parameter Store with caching"""
    global _api_key_cache

    if _api_key_cache is not None:
        return _api_key_cache

    # Fallback to environment variable for local development
    local_api_key = os.getenv("API_KEY")
    if local_api_key:
        logger.info("Using API key from environment variable (local development)")
        _api_key_cache = local_api_key
        return _api_key_cache

    if not GROQ_API_KEY_SSM_NAME:
        raise ValueError("GROQ_API_KEY_SSM_NAME not configured")

    try:
        logger.info(f"Retrieving API key from SSM Parameter Store: {GROQ_API_KEY_SSM_NAME}")
        response = ssm_client.get_parameter(Name=GROQ_API_KEY_SSM_NAME, WithDecryption=True)
        _api_key_cache = response['Parameter']['Value']
        logger.info("Successfully retrieved API key from SSM Parameter Store")
        return _api_key_cache
    except Exception as e:
        logger.error(f"Failed to retrieve API key from SSM Parameter Store: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="API key configuration error"
        )

def get_analytics_fingerprint_secret() -> str:
    """Load the private pepper used only for analytics network pseudonyms."""
    global _analytics_fingerprint_secret_cache

    if _analytics_fingerprint_secret_cache is not None:
        return _analytics_fingerprint_secret_cache

    local_secret = os.getenv("ANALYTICS_FINGERPRINT_SECRET")
    if local_secret and local_secret != "SET_THIS_LATER":
        _analytics_fingerprint_secret_cache = local_secret
        return _analytics_fingerprint_secret_cache

    if not ANALYTICS_FINGERPRINT_SECRET_SSM_NAME:
        raise HTTPException(status_code=503, detail="Analytics fingerprinting is not configured")

    try:
        response = ssm_client.get_parameter(
            Name=ANALYTICS_FINGERPRINT_SECRET_SSM_NAME,
            WithDecryption=True,
        )
        secret = response["Parameter"]["Value"]
        if not secret or secret == "SET_THIS_LATER":
            raise ValueError("Analytics fingerprint secret has not been initialized")
        _analytics_fingerprint_secret_cache = secret
        return _analytics_fingerprint_secret_cache
    except HTTPException:
        raise
    except Exception as error:
        logger.error("Failed to retrieve analytics fingerprint secret: %s", str(error))
        raise HTTPException(status_code=503, detail="Analytics fingerprinting is not configured")

def _extract_bearer_token(request: Request) -> Optional[str]:
    authorization = request.headers.get("Authorization", "")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    return token.strip()

def verify_cognito_id_token(token: str) -> Dict[str, Any]:
    """Verify signature, issuer, audience, expiry, and token use."""
    global _cognito_jwks_client

    if not COGNITO_USER_POOL_ID or not COGNITO_APP_CLIENT_IDS:
        raise HTTPException(status_code=503, detail="Authentication is not configured")

    issuer = f"https://cognito-idp.{AWS_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}"
    if _cognito_jwks_client is None:
        _cognito_jwks_client = PyJWKClient(f"{issuer}/.well-known/jwks.json", cache_keys=True)

    try:
        signing_key = _cognito_jwks_client.get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=list(COGNITO_APP_CLIENT_IDS),
            issuer=issuer,
            options={"require": ["exp", "iat", "sub"]},
        )
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token")
    except Exception as error:
        logger.warning("Unable to verify Cognito token: %s", type(error).__name__)
        raise HTTPException(status_code=401, detail="Unable to verify authentication token")

    if claims.get("token_use") != "id":
        raise HTTPException(status_code=401, detail="An ID token is required")
    return claims

def require_authenticated_user(request: Request) -> Dict[str, Any]:
    token = _extract_bearer_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    claims = verify_cognito_id_token(token)
    claims = require_active_cognito_user(claims)
    _touch_existing_account_activity(claims)
    return claims


def require_active_cognito_user(claims: Dict[str, Any]) -> Dict[str, Any]:
    """Reject a locally valid JWT once its Cognito identity was deleted.

    Signature verification alone deliberately has no network call, but a
    deleted/revoked user can otherwise keep an unexpired ID token for up to
    its normal lifetime. Authenticated routes must not recreate an account
    record during that interval after an account-deletion request.
    """
    if not COGNITO_USER_POOL_ID:
        # Local unit tests patch token verification without provisioning
        # Cognito. Production always sets the pool id through Terraform.
        return claims

    cognito_username = claims.get("cognito:username")
    if not isinstance(cognito_username, str) or not cognito_username:
        raise HTTPException(status_code=401, detail="Invalid authenticated user")

    try:
        cognito_idp_client.admin_get_user(
            UserPoolId=COGNITO_USER_POOL_ID,
            Username=cognito_username,
        )
    except ClientError as error:
        code = error.response.get("Error", {}).get("Code")
        if code == "UserNotFoundException":
            raise HTTPException(status_code=401, detail="Account no longer exists")
        logger.warning("Unable to verify active Cognito user: %s", code or type(error).__name__)
        raise HTTPException(status_code=503, detail="Authentication service unavailable")
    return claims

def _claims_are_admin(claims: Dict[str, Any]) -> bool:
    groups = claims.get("cognito:groups", [])
    if isinstance(groups, str):
        groups = [groups]
    return "admins" in groups

def require_analytics_admin(request: Request) -> None:
    """Authorize the analytics workspace exclusively through Cognito admins."""
    bearer_token = _extract_bearer_token(request)
    if not bearer_token:
        raise HTTPException(status_code=401, detail="Administrator authentication required")
    claims = require_active_cognito_user(verify_cognito_id_token(bearer_token))
    _touch_existing_account_activity(claims)
    if not _claims_are_admin(claims):
        raise HTTPException(status_code=403, detail="Administrator role required")

def get_optional_user(request: Request) -> Optional[Dict[str, Any]]:
    """Verify a bearer token if present; anonymous requests keep working with None."""
    token = _extract_bearer_token(request)
    if not token:
        return None
    try:
        claims = require_active_cognito_user(verify_cognito_id_token(token))
        _touch_existing_account_activity(claims)
        return claims
    except HTTPException:
        return None

def upsert_user_record(sub: str, claims: Dict[str, Any]) -> None:
    """Idempotently persist a user record keyed by the immutable Cognito sub."""
    now = int(time.time() * 1000)
    expiration_time = int(time.time()) + ACCOUNT_RETENTION_SECONDS
    users_table.update_item(
        Key={"sub": sub},
        UpdateExpression=(
            "SET createdAt = if_not_exists(createdAt, :now), "
            "updatedAt = :now, "
            "lastActiveAt = :now, "
            "email = :email, "
            "cognitoUsername = :cognito_username, "
            "expirationTime = :expiration_time"
        ),
        ExpressionAttributeValues={
            ":now": now,
            ":email": claims.get("email"),
            ":cognito_username": claims.get("cognito:username"),
            ":expiration_time": expiration_time,
        },
    )


def _touch_existing_account_activity(claims: Dict[str, Any]) -> None:
    """Refresh a known app account's lifecycle without write amplification.

    The client heartbeats `/auth/me` after session restoration, while optional
    authenticated social routes also call this helper. The condition keeps the
    normal path to at most one retention write per account per day. New app
    records are created by the explicit auth/claim routes, not by an optional
    bearer token encountered on a public endpoint.
    """
    if not COGNITO_USER_POOL_ID:
        # Keep local unit tests and standalone local development free of a
        # DynamoDB dependency; deployed environments always configure a pool.
        return
    account_sub = claims.get("sub")
    if not isinstance(account_sub, str) or not account_sub:
        return
    now_ms = int(time.time() * 1000)
    try:
        users_table.update_item(
            Key={"sub": account_sub},
            UpdateExpression="SET updatedAt = :now, lastActiveAt = :now, expirationTime = :expiration_time",
            ConditionExpression=(
                "attribute_exists(#sub) AND "
                "(attribute_not_exists(lastActiveAt) OR lastActiveAt < :refresh_before)"
            ),
            ExpressionAttributeNames={"#sub": "sub"},
            ExpressionAttributeValues={
                ":now": now_ms,
                ":refresh_before": now_ms - (ACTIVITY_REFRESH_INTERVAL_SECONDS * 1000),
                ":expiration_time": int(time.time()) + ACCOUNT_RETENTION_SECONDS,
            },
        )
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") != "ConditionalCheckFailedException":
            logger.warning("Unable to refresh account retention: %s", type(error).__name__)
    except Exception:
        # Activity refresh is a lifecycle enhancement, never a reason to make
        # a successfully authenticated game request unavailable.
        logger.exception("Unable to refresh account retention")

def claim_anonymous_user_id(owner_sub: str, anonymous_user_id: str) -> None:
    """Atomically link an anonymous_user_id to a user; reject a conflicting owner.

    A single-table claim-lock item (sub = "anon#<id>") makes the link
    idempotent for the same owner and safely rejects a device/account that
    already claimed the same anonymous activity under a different account.
    """
    claim_key = f"anon#{anonymous_user_id}"
    now = int(time.time() * 1000)
    expiration_time = int(time.time()) + ACCOUNT_RETENTION_SECONDS
    try:
        users_table.put_item(
            Item={"sub": claim_key, "ownerSub": owner_sub, "claimedAt": now},
            ConditionExpression="attribute_not_exists(#sub) OR ownerSub = :owner",
            ExpressionAttributeNames={"#sub": "sub"},
            ExpressionAttributeValues={":owner": owner_sub},
        )
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
            raise HTTPException(
                status_code=409,
                detail="This anonymous activity is already linked to a different account",
            )
        raise
    users_table.update_item(
        Key={"sub": owner_sub},
        UpdateExpression=(
            "ADD claimedAnonymousUserIds :ids "
            "SET updatedAt = :now, lastActiveAt = :now, expirationTime = :expiration_time"
        ),
        ExpressionAttributeValues={
            ":ids": {anonymous_user_id},
            ":now": now,
            ":expiration_time": expiration_time,
        },
    )


def require_anonymous_user_id(request: Request) -> str:
    """Every Moral Duel endpoint works without login; it only needs the
    existing anonymous identity header, never an auth token."""
    anonymous_user_id = request.headers.get("X-Anonymous-User-Id")
    if not anonymous_user_id:
        raise HTTPException(status_code=400, detail="X-Anonymous-User-Id header is required")
    return anonymous_user_id


def generate_public_token(byte_length: int = 16) -> str:
    """Cryptographically random, non-enumerable, URL-safe token."""
    return secrets.token_urlsafe(byte_length)


def _build_profile_og_html(public_id: str, archetype: Dict[str, Any], language: str) -> str:
    """Static, bot-only HTML snapshot for /p/:publicId (TASK-30/113).

    Mirrors the meta tags PublicProfileScreen/SEO.jsx render client-side, so
    link-preview bots that never execute JS (WhatsApp/Facebook/Twitter/etc.)
    see the same personalized title/description a real visitor eventually
    would. CloudFront only routes known bot user agents here
    (frontend/terraform/functions/og-bot-router.js); everyone else gets the
    normal SPA and this file is never seen.
    """
    name = html.escape(archetype.get("name", "Moral Torture Machine"))
    share_phrase = html.escape(archetype.get("sharePhrase", ""))
    title = f"{name} - Moral Torture Machine"
    full_title = html.escape(f"{title} | Moral Torture Machine")
    profile_url = f"https://moraltorturemachine.com/p/{public_id}"
    locale = "it_IT" if language == "it" else "en_US"
    alt_locale = "en_US" if language == "it" else "it_IT"
    lang_attr = "it" if language == "it" else "en"
    og_image = "https://moraltorturemachine.com/og-image.png"

    return f"""<!DOCTYPE html>
<html lang="{lang_attr}">
<head>
<meta charset="UTF-8">
<title>{full_title}</title>
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="{profile_url}">
<meta property="og:type" content="website">
<meta property="og:url" content="{profile_url}">
<meta property="og:title" content="{full_title}">
<meta property="og:description" content="{share_phrase}">
<meta property="og:image" content="{og_image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{html.escape(title)}">
<meta property="og:site_name" content="Moral Torture Machine">
<meta property="og:locale" content="{locale}">
<meta property="og:locale:alternate" content="{alt_locale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:url" content="{profile_url}">
<meta name="twitter:title" content="{full_title}">
<meta name="twitter:description" content="{share_phrase}">
<meta name="twitter:image" content="{og_image}">
<meta http-equiv="refresh" content="0; url={profile_url}">
</head>
<body>
<p>{name}</p>
<p>{share_phrase}</p>
<p><a href="{profile_url}">{profile_url}</a></p>
</body>
</html>"""


def _write_profile_og_html(public_id: str, archetype: Dict[str, Any], language: str) -> None:
    """Best-effort: a failed write here must never break profile creation."""
    try:
        body = _build_profile_og_html(public_id, archetype, language)
        s3_client.put_object(
            Bucket=FRONTEND_BUCKET_NAME,
            Key=f"og/profiles/{public_id}.html",
            Body=body.encode("utf-8"),
            ContentType="text/html; charset=utf-8",
            CacheControl="public, max-age=300",
        )
    except Exception:
        logger.exception("Unable to write bot-preview OG HTML for profile %s", public_id)


def create_moral_profile(anonymous_user_id: str, answers: list, language: str) -> Dict[str, Any]:
    """Persist a shareable moral profile (TASK-28) from a completed test.

    Reuses the same deterministic archetype engine as /analyze-results.
    Archetypes/compatibility never depend on AI, so this never calls Groq.
    """
    dimension_answers = [answer.chosenValues for answer in answers]
    averages = compute_dimension_averages(dimension_answers)
    archetype = assign_archetype(averages, language=language)
    dilemma_base_ids = [answer.dilemmaBaseId for answer in answers]

    public_id = generate_public_token()
    now = int(time.time() * 1000)
    expiration_time = int(time.time()) + PROFILE_RETENTION_SECONDS
    moral_profiles_table.put_item(Item={
        "publicId": public_id,
        "ownerAnonymousUserId": anonymous_user_id,
        "dimensionAverages": json.dumps(averages, separators=(",", ":")),
        "archetypeId": archetype["archetypeId"],
        "archetypesVersion": archetype["archetypesVersion"],
        "dilemmaBaseIds": dilemma_base_ids,
        "language": language,
        "createdAt": now,
        "lastAccessedAt": now,
        "expirationTime": expiration_time,
    })
    _write_profile_og_html(public_id, archetype, language)
    return {
        "publicId": public_id,
        "averages": averages,
        "dilemmaBaseIds": dilemma_base_ids,
        "language": language,
        **archetype,
    }


def get_profile_or_404(public_id: str) -> Dict[str, Any]:
    response = moral_profiles_table.get_item(Key={"publicId": public_id})
    item = response.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Profile not found")
    expiration_time = item.get("expirationTime")
    if expiration_time is not None and int(expiration_time) <= int(time.time()):
        # DynamoDB TTL is asynchronous. Enforce the retention boundary in the
        # read path so an expired profile is never served while its TTL delete
        # is still pending.
        try:
            moral_profiles_table.delete_item(Key={"publicId": public_id})
        except Exception:
            logger.exception("Unable to immediately remove expired moral profile")
        raise HTTPException(status_code=404, detail="Profile not found")
    if not _touch_profile_activity(public_id):
        # A concurrent TTL/sweep/delete can remove a profile after GetItem.
        # Never recreate a partial record just because someone followed an old
        # unlisted link.
        raise HTTPException(status_code=404, detail="Profile not found")
    return item


def _touch_profile_activity(public_id: str) -> bool:
    """Refresh retention for a successfully used profile without recreating it.

    A profile participates in social flow reads as well as its own public
    route. DynamoDB TTL is asynchronous, so require the existing primary key
    on the touch to avoid reintroducing data after a concurrent deletion.
    """
    try:
        now_ms = int(time.time() * 1000)
        moral_profiles_table.update_item(
            Key={"publicId": public_id},
            UpdateExpression="SET lastAccessedAt = :now, expirationTime = :expiration_time",
            ConditionExpression="attribute_exists(publicId)",
            ExpressionAttributeValues={
                ":now": now_ms,
                ":expiration_time": int(time.time()) + PROFILE_RETENTION_SECONDS,
            },
        )
        return True
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
            return False
        logger.warning("Unable to refresh profile retention: %s", type(error).__name__)
    except Exception:
        # A transient refresh failure must not make a still-live shared result
        # unavailable. The next successful use or daily sweep will retry.
        logger.exception("Unable to refresh profile retention")
    return True


def get_latest_profile_for_anonymous_user(anonymous_user_id: str) -> Optional[Dict[str, Any]]:
    items = _query_all(
        moral_profiles_table,
        IndexName="OwnerIndex",
        KeyConditionExpression="ownerAnonymousUserId = :owner",
        ExpressionAttributeValues={":owner": anonymous_user_id},
        ScanIndexForward=False,
    )
    now_seconds = int(time.time())
    for item in items:
        expiration_time = item.get("expirationTime")
        if expiration_time is None or int(expiration_time) > now_seconds:
            if _touch_profile_activity(item["publicId"]):
                return item
            continue
        try:
            moral_profiles_table.delete_item(Key={"publicId": item["publicId"]})
        except Exception:
            logger.exception("Unable to immediately remove expired moral profile")
    return None


def _has_prior_profile(anonymous_user_id: str, exclude_public_id: Optional[str] = None) -> bool:
    """TASK-136: true if this anon id already owns a moral profile other than
    exclude_public_id - the signal used to detect a second-or-later Moral
    Duel interaction. Reuses the existing OwnerIndex GSI (no new table/index,
    no Scan): a profile is only ever created by the 'challenge a friend'
    action or by an invitee's submit, so owning any profile besides the one
    just made for the current action means this is not the caller's first
    Duel interaction."""
    response = moral_profiles_table.query(
        IndexName="OwnerIndex",
        KeyConditionExpression="ownerAnonymousUserId = :owner",
        ExpressionAttributeValues={":owner": anonymous_user_id},
        ProjectionExpression="publicId, expirationTime",
        Limit=5,
    )
    now_seconds = int(time.time())
    for item in response.get("Items", []):
        if item.get("publicId") == exclude_public_id:
            continue
        expiration_time = item.get("expirationTime")
        if expiration_time is not None and int(expiration_time) <= now_seconds:
            # Do not let a TTL lag turn an expired profile into a repeat-duel
            # login requirement. The daily retention sweep remains the
            # backstop; this removes it promptly when encountered.
            try:
                moral_profiles_table.delete_item(Key={"publicId": item["publicId"]})
            except Exception:
                logger.exception("Unable to immediately remove expired moral profile")
            continue
        return True
    return False


def _raise_login_required(request: Request) -> None:
    """The TASK-136/ADR-063 mandatory-login gate: a known, UI-handled 401
    (ChallengeCompareScreen.jsx and friends render a login CTA for it, never
    a generic error), not an operational error - flag the request so
    notify_ops_of_errors (TASK-104/ADR-045) skips its ops alert for this one
    specific expected outcome instead of emailing/persisting it every time
    (TASK-140)."""
    request.state.expected_business_error = True
    raise HTTPException(status_code=401, detail="login_required")


def require_authenticated_for_repeat_duel(request: Request, anonymous_user_id: str, exclude_public_id: Optional[str] = None) -> None:
    """TASK-136: the first Moral Duel challenge/join stays fully anonymous
    (doc-2 social MVP definition of done, TASK-14 AC1); from the second one
    on, continuing requires an account - the concrete, higher-pressure login
    gate that a dismissible prompt alone couldn't provide.

    Implemented at the user's explicit request despite an open risk: Android
    native login (TASK-18/TASK-86) is code-complete but was never verified
    end-to-end on a device in the backlog, and the CI pipeline that builds
    the distributed Android APK was found to omit the Cognito env vars
    entirely (fixed in this same change, see deploy.yml) - so no Android
    build before this fix could have shown a working login button at all.
    Until an Android device confirms sign-in actually completes there,
    an Android player who reaches their second Duel interaction may be
    unable to authenticate and therefore unable to continue - a real
    product regression on that platform, not merely a hypothetical one.
    Kept as a single choke point so the gate can be disabled or scoped to
    web-only in one place if device verification surfaces a problem."""
    if not _has_prior_profile(anonymous_user_id, exclude_public_id=exclude_public_id):
        return
    if get_optional_user(request) is None:
        _raise_login_required(request)


def get_challenge_or_404(token: str) -> Dict[str, Any]:
    response = challenges_table.get_item(Key={"challengeToken": token})
    item = response.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return item


def ensure_challenge_is_actionable(challenge: Dict[str, Any]) -> None:
    """Distinguish revoked/expired from other errors, per TASK-35 AC2."""
    if challenge["status"] == "revoked":
        raise HTTPException(status_code=410, detail="This challenge has been revoked")
    expiration = challenge.get("expirationTime")
    if expiration and int(time.time()) > int(expiration):
        raise HTTPException(status_code=410, detail="This challenge has expired")


def get_participant(token: str, role: str) -> Optional[Dict[str, Any]]:
    response = challenge_participants_table.get_item(Key={"challengeToken": token, "role": role})
    return response.get("Item")


def _network_fingerprint(ip_address: Optional[str]) -> Optional[str]:
    """Create a stable, non-reversible network pseudonym without storing the IP."""
    if not ip_address:
        return None
    try:
        pepper = get_analytics_fingerprint_secret()
    except HTTPException:
        # Analytics must keep working locally even when the production SSM secret
        # is intentionally absent. In that case no network-derived value is stored.
        return None
    return hmac.new(
        pepper.encode("utf-8"),
        ip_address.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()[:24]


TIME_ZONE_PATTERN = re.compile(r"^[A-Za-z0-9_+/-]{1,64}$")


def _normalize_time_zone(value: Optional[str]) -> Optional[str]:
    """Accept only a bounded IANA-style timezone; never infer it from an IP."""
    if not value:
        return None
    normalized = value.strip()
    return normalized if TIME_ZONE_PATTERN.fullmatch(normalized) else None

def track_analytics_event(
    session_id: str,
    action_type: str,
    action_data: Optional[Dict] = None,
    language: str = "en",
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None,
    anonymous_user_id: Optional[str] = None,
    install_id: Optional[str] = None,
    platform: Optional[str] = None,
    app_version: Optional[str] = None,
    client_language: Optional[str] = None,
    time_zone: Optional[str] = None,
) -> None:
    """
    Track user analytics event to DynamoDB

    Args:
        session_id: Unique session identifier (from client or generated)
        action_type: Type of action (e.g., 'dilemma_fetched', 'vote_cast', 'results_analyzed')
        action_data: Additional data about the action
        language: User's selected language
        user_agent: User's browser/client information
        ip_address: User's IP address (hashed for privacy)
    """
    try:
        timestamp = int(time.time() * 1000)  # Milliseconds since epoch

        # TTL: 90 days from now (in seconds)
        expiration_time = int(time.time()) + (90 * 24 * 60 * 60)

        network_fingerprint = _network_fingerprint(ip_address)

        normalized_client_language = (client_language or "").strip().lower()
        resolved_language = (
            normalized_client_language
            if normalized_client_language.isalpha() and len(normalized_client_language) <= 10
            else language.lower()
        )
        event_data = {
            'sessionId': session_id,
            'timestamp': timestamp,
            'actionType': action_type,
            'language': resolved_language,
            'expirationTime': expiration_time
        }

        # Add optional fields
        if action_data:
            event_data['actionData'] = json.dumps(action_data)

        if user_agent:
            event_data['userAgent'] = user_agent[:200]  # Limit length

        if network_fingerprint:
            event_data['networkFingerprint'] = network_fingerprint

        if anonymous_user_id:
            event_data['anonymousUserId'] = anonymous_user_id[:100]

        if install_id:
            event_data['installId'] = install_id[:100]

        if platform in {"web", "android", "ios", "unknown"}:
            event_data['platform'] = platform

        if app_version:
            event_data['appVersion'] = app_version[:30]

        normalized_time_zone = _normalize_time_zone(time_zone)
        if normalized_time_zone:
            event_data['timeZone'] = normalized_time_zone

        # Write to DynamoDB asynchronously (fire and forget)
        analytics_table.put_item(Item=event_data)

        logger.info(f"Analytics event tracked: {action_type} for session {session_id[:8]}...")

    except Exception as e:
        # Don't fail the request if analytics tracking fails
        logger.error(f"Failed to track analytics event: {str(e)}")

def extract_session_id(request: Request) -> str:
    """
    Extract or generate session ID from request headers
    """
    import uuid

    # Try to get session ID from custom header
    session_id = request.headers.get("X-Session-Id")

    if not session_id:
        # Generate a new session ID based on user characteristics
        # This is a fallback and won't track across requests
        user_agent = request.headers.get("User-Agent", "")
        client_ip = request.client.host if request.client else ""
        session_id = str(uuid.uuid4())

    return session_id

def extract_client_analytics_context(request: Request) -> Dict[str, Optional[str]]:
    """Shared web/native metadata for legacy server-side events."""
    return {
        "anonymous_user_id": request.headers.get("X-Anonymous-User-Id"),
        "install_id": request.headers.get("X-Install-Id"),
        "platform": request.headers.get("X-Client-Platform"),
        "app_version": request.headers.get("X-App-Version"),
        "client_language": request.headers.get("X-Client-Language"),
        "time_zone": request.headers.get("X-Time-Zone"),
    }

# Pydantic models with input validation
class VoteRequest(BaseModel):
    id: str = Field(..., alias="_id", description="Dilemma ID", min_length=1, max_length=100, pattern=r'^[a-zA-Z0-9_-]+$')
    vote: str = Field(..., description="Vote type: 'yes' or 'no'", pattern=r'^(yes|no)$')

    model_config = {
        "populate_by_name": True
    }

class DilemmaResponse(BaseModel):
    id: str = Field(..., alias="_id")
    baseId: Optional[str] = None
    dilemma: str
    firstAnswer: str
    secondAnswer: str
    teaseOption1: str
    teaseOption2: str
    firstAnswerEmpathy: float
    firstAnswerIntegrity: float
    firstAnswerResponsibility: float
    firstAnswerJustice: float
    firstAnswerAltruism: float
    firstAnswerHonesty: float
    secondAnswerEmpathy: float
    secondAnswerIntegrity: float
    secondAnswerResponsibility: float
    secondAnswerJustice: float
    secondAnswerAltruism: float
    secondAnswerHonesty: float
    yesCount: int = 0
    noCount: int = 0

    model_config = {
        "populate_by_name": True,
        "by_alias": True
    }

class DilemmaWithChoice(BaseModel):
    dilemma: str = Field(..., description="The dilemma text")
    firstAnswer: str = Field(..., description="First answer option")
    secondAnswer: str = Field(..., description="Second answer option")
    chosenAnswer: str = Field(..., description="The answer the user chose")
    chosenValues: Dict[str, float] = Field(..., description="Moral values of the chosen answer")

class AnalyzeResultsRequest(BaseModel):
    answers: list[Dict[str, float]] = Field(..., description="List of moral category scores from user's answers")
    dilemmasWithChoices: Optional[list[DilemmaWithChoice]] = Field(default=[], description="List of dilemmas with user's choices")

class ClaimAnonymousDataRequest(BaseModel):
    anonymousUserId: str = Field(..., min_length=1, max_length=100)

class DilemmaAnswer(BaseModel):
    dilemmaBaseId: str = Field(..., min_length=1, max_length=100)
    chosenValues: Dict[str, float] = Field(..., max_length=12)

class CreateProfileRequest(BaseModel):
    answers: list[DilemmaAnswer] = Field(..., min_length=1, max_length=20)
    language: str = Field(default="en", min_length=2, max_length=10, pattern=r'^[a-zA-Z]+$')

class CreateChallengeRequest(BaseModel):
    profilePublicId: Optional[str] = Field(default=None, min_length=1, max_length=64)

class SubmitChallengeRequest(BaseModel):
    answers: list[DilemmaAnswer] = Field(..., min_length=1, max_length=20)

class CreatePartyRoomRequest(BaseModel):
    displayName: str = Field(..., min_length=1, max_length=40)
    language: str = Field(default="en", min_length=2, max_length=10, pattern=r'^[a-zA-Z]+$')
    dilemmaCount: int = Field(
        default=PARTY_ROOM_DEFAULT_DILEMMAS,
        ge=PARTY_ROOM_MIN_DILEMMAS,
        le=PARTY_ROOM_MAX_DILEMMAS,
    )

class JoinPartyRoomRequest(BaseModel):
    displayName: str = Field(..., min_length=1, max_length=40)

class SubmitPartyVoteRequest(BaseModel):
    choice: str = Field(..., pattern=r'^(first|second)$')
    chosenValues: Dict[str, float] = Field(..., max_length=12)

class StoryNodeVoteRequest(BaseModel):
    flowId: str = Field(..., description="Story flow ID", min_length=1, max_length=100)
    nodeId: str = Field(..., description="Current node ID", min_length=1, max_length=20)
    vote: str = Field(..., description="Vote: 'first' or 'second'", pattern=r'^(first|second)$')

# TASK-65: value-level PII guard for analytics properties, independent of
# the property key name (see validate_properties below).
_EMAIL_LIKE_PATTERN = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
_JWT_LIKE_PATTERN = re.compile(r'^[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}$')
_ATTRIBUTION_VALUE_PATTERN = re.compile(r'^[A-Za-z0-9._+-]{1,120}$')
_IDENTIFYING_ANALYTICS_PROPERTY_KEYS = {
    "anonymous_user_id",
    "install_id",
    "session_id",
    "public_id",
    "profile_id",
    "room_code",
    "previous_room_code",
}


class AnalyticsEvent(BaseModel):
    eventId: str = Field(
        ...,
        min_length=36,
        max_length=36,
        pattern=r'^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    )
    eventName: str = Field(..., min_length=2, max_length=64, pattern=r'^[a-z][a-z0-9_]+$')
    occurredAt: int = Field(..., ge=1577836800000, le=4102444800000)
    schemaVersion: int = Field(default=1, ge=1, le=10)
    anonymousUserId: str = Field(..., min_length=1, max_length=100)
    sessionId: str = Field(..., min_length=1, max_length=100)
    installId: Optional[str] = Field(default=None, max_length=100)
    platform: str = Field(default="unknown", pattern=r'^(web|android|ios|unknown)$')
    appVersion: str = Field(default="unknown", min_length=1, max_length=32)
    language: str = Field(default="en", min_length=2, max_length=10, pattern=r'^[a-zA-Z]+$')
    timeZone: Optional[str] = Field(
        default=None,
        max_length=64,
        pattern=r'^[A-Za-z0-9_+/-]+$',
    )
    referrer: Optional[str] = Field(default=None, max_length=500)
    utm: Dict[str, str] = Field(default_factory=dict)
    properties: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("utm")
    @classmethod
    def validate_utm(cls, value: Dict[str, str]) -> Dict[str, str]:
        allowed_keys = {"utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"}
        if len(value) > len(allowed_keys):
            raise ValueError("Too many UTM parameters")
        for key, item in value.items():
            if (
                key not in allowed_keys
                or not isinstance(item, str)
                or not _ATTRIBUTION_VALUE_PATTERN.fullmatch(item)
            ):
                raise ValueError("Invalid UTM parameter")
        return value

    @field_validator("referrer")
    @classmethod
    def validate_referrer(cls, value: Optional[str]) -> Optional[str]:
        """Keep attribution at origin granularity, never a link path/query."""
        if value is None:
            return value
        parsed = urlparse(value)
        if (
            parsed.scheme not in {"http", "https"}
            or not parsed.netloc
            or parsed.path not in {"", "/"}
            or parsed.params
            or parsed.query
            or parsed.fragment
            or parsed.username
            or parsed.password
        ):
            raise ValueError("Referrer must be an origin without a path or query")
        return f"{parsed.scheme}://{parsed.netloc}"

    @field_validator("properties")
    @classmethod
    def validate_properties(cls, value: Dict[str, Any]) -> Dict[str, Any]:
        forbidden_tokens = {"email", "password", "token", "secret", "ip", "analysis"}
        forbidden_keys = {
            "dilemma_text",
            "answer_text",
            "ip_address",
            "hashed_ip",
            *_IDENTIFYING_ANALYTICS_PROPERTY_KEYS,
        }
        if len(value) > 20:
            raise ValueError("Too many analytics properties")

        for key, item in value.items():
            normalized_key = key.lower()
            key_tokens = set(normalized_key.split("_"))
            if (
                len(key) > 64
                or normalized_key in forbidden_keys
                or key_tokens.intersection(forbidden_tokens)
            ):
                raise ValueError("Forbidden analytics property")
            if not isinstance(item, (str, int, float, bool)) or isinstance(item, (dict, list)):
                raise ValueError("Analytics properties must be scalar values")
            if isinstance(item, str):
                if len(item) > 200:
                    raise ValueError("Analytics property is too long")
                # TASK-65 defense in depth: the key-name check above only
                # catches a property named e.g. "email"; this also rejects
                # an innocuously-named property (e.g. "note") whose *value*
                # is an email address or a JWT/bearer-token-shaped string,
                # so an accidental frontend bug can't leak PII into the
                # event store just because the field name looked safe.
                if _EMAIL_LIKE_PATTERN.match(item) or _JWT_LIKE_PATTERN.match(item):
                    raise ValueError("Analytics property value looks like PII or a token")

        if len(json.dumps(value)) > 4096:
            raise ValueError("Analytics properties payload is too large")
        return value

class AnalyticsBatchRequest(BaseModel):
    events: list[AnalyticsEvent] = Field(..., min_length=1, max_length=25)

# Helper function to call Groq API with model fallback
def call_groq_api_with_fallback(payload: dict, api_key: str, operation: str = "API call") -> dict:
    """
    Call Groq API with automatic model fallback on rate limits.
    Tries each model in MODEL_FALLBACK_CHAIN until one succeeds.

    Args:
        payload: The API request payload (will be modified with different models)
        api_key: Groq API key
        operation: Description of the operation for logging

    Returns:
        API response JSON

    Raises:
        HTTPException: If all models fail
    """
    api_url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    errors = []

    for model_index, model_name in enumerate(MODEL_FALLBACK_CHAIN):
        payload["model"] = model_name

        try:
            logger.info(f"{operation}: Trying model {model_index + 1}/{len(MODEL_FALLBACK_CHAIN)}: {model_name}")
            response = requests.post(api_url, headers=headers, json=payload, timeout=30)

            # Success - return immediately
            if response.status_code == 200:
                logger.info(f"{operation}: Success with model {model_name}")
                return response.json()

            # Rate limit - try next model
            if response.status_code == 429:
                try:
                    error_data = response.json()
                    error_msg = error_data.get('error', {}).get('message', 'Rate limit exceeded')
                    logger.warning(f"{operation}: Rate limit on {model_name}: {error_msg}")
                    errors.append(f"{model_name}: {error_msg[:100]}")
                except:
                    logger.warning(f"{operation}: Rate limit on {model_name}")
                    errors.append(f"{model_name}: Rate limit exceeded")
                continue

            # Other error - try next model
            logger.warning(f"{operation}: Model {model_name} failed with status {response.status_code}")
            errors.append(f"{model_name}: HTTP {response.status_code}")
            continue

        except requests.exceptions.Timeout:
            logger.warning(f"{operation}: Timeout on model {model_name}")
            errors.append(f"{model_name}: Timeout")
            continue
        except Exception as e:
            logger.warning(f"{operation}: Exception on model {model_name}: {str(e)}")
            errors.append(f"{model_name}: {str(e)[:50]}")
            continue

    # All models failed
    logger.error(f"{operation}: All {len(MODEL_FALLBACK_CHAIN)} models failed")
    error_summary = "; ".join(errors[:5])  # Show first 5 errors
    raise HTTPException(
        status_code=429,
        detail=f"All AI models are currently rate-limited. Please try again in a few minutes. ({error_summary})"
    )

# Helper function to convert Decimal to native types
def decimal_to_native(obj):
    """Convert DynamoDB Decimal types to native Python types"""
    if isinstance(obj, list):
        return [decimal_to_native(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: decimal_to_native(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        else:
            return float(obj)
    else:
        return obj

# Middleware for security headers
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Middleware for request logging with PII filtering
@app.middleware("http")
async def log_requests(request: Request, call_next):
    response = await call_next(request)
    logger.info(
        "Request completed: %s %s -> %s",
        request.method,
        _request_path_signature(request, response.status_code),
        response.status_code,
    )
    return response


def _consume_burst_window(
    bucket_key: str,
    limit: int,
    now_seconds: Optional[float] = None,
) -> tuple[bool, int]:
    """Consume one slot in a per-container sliding window."""
    global _burst_request_count

    now_seconds = time.time() if now_seconds is None else now_seconds
    cutoff = now_seconds - 60
    with _burst_lock:
        window = _burst_windows[bucket_key]
        while window and window[0] <= cutoff:
            window.popleft()

        if len(window) >= limit:
            retry_after = max(1, ceil(window[0] + 60 - now_seconds))
            return False, retry_after

        window.append(now_seconds)
        _burst_request_count += 1

        # Lambda containers are reused. Periodically remove inactive identities so
        # a distributed scan cannot grow process memory indefinitely.
        if _burst_request_count % 1000 == 0:
            stale_keys = [
                key for key, values in _burst_windows.items()
                if not values or values[-1] <= cutoff
            ]
            for key in stale_keys:
                _burst_windows.pop(key, None)

        return True, 0


def _rate_limit_rules_for_request(method: str, path: str) -> list[tuple[str, int]]:
    """Return applicable zero-cost guard rules, ordered broadest to narrowest."""
    if not ABUSE_BURST_GUARD_ENABLED or method.upper() == "OPTIONS":
        return []

    rules = [("global", ABUSE_GLOBAL_REQUESTS_PER_MINUTE)]
    if path in {"/generate-dilemma", "/analyze-results"}:
        rules.append(("ai", ABUSE_AI_REQUESTS_PER_MINUTE))
    elif path == "/analytics/events":
        rules.append(("analytics_ingest", ABUSE_ANALYTICS_BATCHES_PER_MINUTE))
    elif path in {"/users/claim-anonymous-data", "/users/me", "/auth/me"}:
        rules.append(("auth_write", ABUSE_AUTH_WRITE_REQUESTS_PER_MINUTE))
    elif method.upper() == "POST" and (path == "/profiles" or path.startswith("/challenges")):
        rules.append(("duel_write", ABUSE_DUEL_WRITE_REQUESTS_PER_MINUTE))
    elif method.upper() == "GET" and (
        path.startswith(("/profiles/", "/challenges/")) or path == "/dilemmas/by-ids"
    ):
        rules.append(("public_read", ABUSE_PUBLIC_READ_REQUESTS_PER_MINUTE))
    elif path == "/party-rooms" or path.startswith("/party-rooms/"):
        if method.upper() == "GET":
            rules.append(("party_room_poll", ABUSE_PARTY_ROOM_POLL_REQUESTS_PER_MINUTE))
        else:
            rules.append(("duel_write", ABUSE_DUEL_WRITE_REQUESTS_PER_MINUTE))
    return rules


def _rate_limit_source(request: Request) -> str:
    """Hash the transient source used by the limiter; it is never logged or stored."""
    source = request.client.host if request.client else None
    if not source:
        source = (
            request.headers.get("X-Anonymous-User-Id")
            or request.headers.get("X-Session-Id")
            or "unknown"
        )
    return hashlib.sha256(source.encode("utf-8")).hexdigest()


def _rate_limit_participant_source(request: Request) -> str:
    """TASK-132/ADR-069: Party Room poll key, adding the per-installation
    anonymous_user_id on top of the IP. Party Room is played by multiple
    people in the same room, often on the same WiFi/NAT, so the IP-only
    source makes them share one bucket and false-429 each other well below
    PARTY_ROOM_MAX_PARTICIPANTS. The IP is still part of the key (this is
    additive, not a replacement), so it does not on its own let a single
    network bypass rate limiting; every other rule keeps the IP-only source
    as its abuse backstop."""
    ip = request.client.host if request.client else "unknown"
    anonymous_user_id = request.headers.get("X-Anonymous-User-Id") or "unknown"
    return hashlib.sha256(f"{ip}:{anonymous_user_id}".encode("utf-8")).hexdigest()


def _rate_limit_cors_headers(request: Request) -> Dict[str, str]:
    origin = request.headers.get("Origin")
    if not origin or origin not in CORS_ALLOWED_ORIGINS:
        return {}
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Vary": "Origin",
    }


@app.middleware("http")
async def enforce_zero_cost_burst_guard(request: Request, call_next):
    """Best-effort abuse guard scoped to each warm Lambda container."""
    rules = _rate_limit_rules_for_request(request.method, request.url.path)
    if not rules:
        return await call_next(request)

    # TASK-132/ADR-069: a Party Room poll is the one traffic pattern where
    # several distinct, legitimate participants (same room, often same
    # WiFi/NAT) are expected to share an IP, so both rules that fire for it
    # ("global" and "party_room_poll") use the per-participant key instead
    # of the IP-only one; every other request keeps the IP-only source.
    is_party_room_poll = any(rule_name == "party_room_poll" for rule_name, _ in rules)
    source = (
        _rate_limit_participant_source(request)
        if is_party_room_poll
        else _rate_limit_source(request)
    )
    for rule_name, limit in rules:
        allowed, retry_after = _consume_burst_window(f"{rule_name}:{source}", limit)
        if not allowed:
            logger.warning(
                "Burst guard rejected request: route=%s rule=%s retry_after=%s",
                _request_path_signature(request, 429),
                rule_name,
                retry_after,
            )
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests. Please retry shortly.",
                    "rule": rule_name,
                },
                headers={
                    "Retry-After": str(retry_after),
                    **_rate_limit_cors_headers(request),
                },
            )

    return await call_next(request)


def _should_notify_ops(status_code: int, path: str, now_seconds: Optional[float] = None) -> bool:
    """One notification per (status_code, path) per cooldown window, per warm
    container - avoids flooding the owner's inbox from an ordinary burst of
    the same client error."""
    now_seconds = time.time() if now_seconds is None else now_seconds
    key = f"{status_code}:{path}"
    with _ops_notification_lock:
        last_sent = _ops_notification_last_sent.get(key)
        if last_sent is not None and now_seconds - last_sent < OPS_ERROR_NOTIFICATION_COOLDOWN_SECONDS:
            return False
        _ops_notification_last_sent[key] = now_seconds
        return True


def _request_path_signature(request: Request, status_code: Optional[int] = None) -> str:
    """TASK-129: the matched route template (e.g. '/party-rooms/{room_code}')
    when the router resolved one, so distinct instances of the same endpoint
    (different room codes, profile ids, challenge tokens...) coalesce into one
    alert/email signature instead of one per literal path - otherwise the
    per-(status, path) cooldown from ADR-045 barely coalesces anything on
    parameterized routes. A 429 from enforce_zero_cost_burst_guard never
    reaches the router (it short-circuits before routing), so scope['route']
    is never set for it; fall back to the same rule name the burst guard
    itself used (e.g. 'party_room_poll'), which is already
    parameter-independent. A genuinely unmapped route is intentionally
    grouped as 'unmatched' rather than storing an arbitrary literal path,
    which may itself contain a user-supplied identifier."""
    route = request.scope.get("route")
    path_template = getattr(route, "path", None)
    if path_template:
        return path_template
    if status_code == 429:
        rules = _rate_limit_rules_for_request(request.method, request.url.path)
        if rules:
            return f"rate_limit:{rules[-1][0]}"
    return "unmatched"


def _record_ops_error_alert(method: str, status_code: int, path: str, path_signature: str, detail: str) -> None:
    """TASK-129: persist each alerted error to DynamoDB so past alerts can be
    found and triaged later (see the ops-alerts-sweep skill) instead of only
    ever existing as an email in the owner's inbox. Best-effort like the SNS
    publish below - a write failure here must never affect the response."""
    try:
        now = int(time.time())
        ops_error_alerts_table.put_item(Item={
            "alertId": secrets.token_hex(16),
            "statusCode": status_code,
            "method": method,
            "path": path,
            "pathSignature": path_signature,
            "detail": detail[:500],
            "occurredAt": datetime.now(timezone.utc).isoformat(),
            "expirationTime": now + OPS_ERROR_ALERT_TTL_SECONDS,
        })
    except Exception:
        logger.exception("Failed to persist ops error alert to DynamoDB")


def _notify_ops_of_error(request: Request, status_code: int, detail: str) -> None:
    """Best-effort SNS email + DynamoDB record for a 4xx/5xx response
    (TASK-104/TASK-129). Reuses the existing ops_alerts topic
    (ADR-031/backend/terraform/observability.tf); a failure here must never
    affect the response already produced."""
    signature = _request_path_signature(request, status_code)
    if not _should_notify_ops(status_code, signature):
        return
    _record_ops_error_alert(request.method, status_code, signature, signature, detail)
    if not OPS_ERROR_NOTIFICATIONS_ENABLED or not OPS_ALERTS_TOPIC_ARN:
        return
    try:
        sns_client.publish(
            TopicArn=OPS_ALERTS_TOPIC_ARN,
            Subject=f"[Moral Torture Machine] {status_code} on {signature}"[:100],
            Message=(
                f"{request.method} {signature} returned {status_code}.\n\n"
                f"Detail: {detail}\n\n"
                "This alert is coalesced: at most one email per (status code, route) "
                f"every {OPS_ERROR_NOTIFICATION_COOLDOWN_SECONDS}s per warm Lambda container."
            ),
        )
    except Exception:
        logger.exception("Failed to publish ops error notification to SNS")


@app.middleware("http")
async def notify_ops_of_errors(request: Request, call_next):
    """TASK-104: email any 4xx/5xx through SNS, including uncaught exceptions
    (which Starlette would otherwise turn into a bare 500 further up the
    stack). Registered after the burst guard so it also observes its 429s.
    ADR-045 deliberately keeps this broad (most 4xx here are expected
    business outcomes, not bugs) - `request.state.expected_business_error`
    (TASK-140) is a narrow, explicit opt-out for the rare case where a route
    already knows for certain, at the point it happens, that a given
    response is not just expected but not worth an ops alert at all (e.g.
    the TASK-136 login-required gate, which the frontend already handles
    with its own UI); it is not a general-purpose escape hatch for ordinary
    404/409/403s, which stay covered by the cooldown + later sweep."""
    try:
        response = await call_next(request)
    except Exception as exc:
        _notify_ops_of_error(request, 500, f"Unhandled exception: {exc}")
        raise
    if response.status_code >= 400 and not getattr(request.state, "expected_business_error", False):
        _notify_ops_of_error(request, response.status_code, "See CloudWatch logs for the request detail.")
    return response

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "Moral Torture Machine API"}

@app.get("/robots.txt", response_class=PlainTextResponse)
async def robots_txt():
    """TASK-131: this is the API domain, not the indexable frontend (which
    already serves its own robots.txt via CloudFront/S3) - scanners probing
    it directly used to get a real 404, which kept triggering ops error
    alerts for harmless bot noise. A disallow-all is both accurate (nothing
    here is meant to be crawled) and stops the noise at the source."""
    return "User-agent: *\nDisallow: /\n"

@app.get("/auth/me")
async def authenticated_profile(request: Request):
    """Return the verified caller profile without trusting client-side claims."""
    claims = require_authenticated_user(request)
    upsert_user_record(claims["sub"], claims)
    groups = claims.get("cognito:groups", [])
    if isinstance(groups, str):
        groups = [groups]
    return {
        "sub": claims["sub"],
        "email": claims.get("email"),
        "name": claims.get("name"),
        "emailVerified": bool(claims.get("email_verified", False)),
        "groups": groups,
        "isAdmin": "admins" in groups,
    }

@app.post("/users/claim-anonymous-data")
async def claim_anonymous_data(claim_request: ClaimAnonymousDataRequest, request: Request):
    """Link the caller's anonymous activity to their authenticated account.

    Repeating the claim from the same account is a safe no-op. Claiming an
    anonymous_user_id already linked to a different account is rejected with
    409 rather than silently reassigning ownership.
    """
    claims = require_authenticated_user(request)
    upsert_user_record(claims["sub"], claims)
    claim_anonymous_user_id(claims["sub"], claim_request.anonymousUserId)
    return {"claimed": True, "anonymousUserId": claim_request.anonymousUserId}


def _query_all(dynamodb_table, **query_kwargs) -> list[Dict[str, Any]]:
    """Return every page of a DynamoDB query without exposing pagination to
    account export/deletion callers."""
    items = []
    while True:
        response = dynamodb_table.query(**query_kwargs)
        items.extend(response.get("Items", []))
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            return items
        query_kwargs["ExclusiveStartKey"] = last_key


def _scan_all(dynamodb_table, **scan_kwargs) -> list[Dict[str, Any]]:
    """Return every page of a narrowly filtered DynamoDB scan."""
    items = []
    while True:
        response = dynamodb_table.scan(**scan_kwargs)
        items.extend(response.get("Items", []))
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            return items
        scan_kwargs["ExclusiveStartKey"] = last_key


def _claimed_anonymous_ids(account_sub: str) -> tuple[list[str], list[Dict[str, Any]]]:
    """Use claim-lock rows as the authoritative account-to-device mapping.

    The duplicated set on the user record is useful for display, but an
    account deletion must not trust a stale value that could theoretically be
    claimed by a different account after a partial historic cleanup.
    """
    claim_locks = _scan_all(
        users_table,
        FilterExpression="ownerSub = :owner",
        ExpressionAttributeValues={":owner": account_sub},
    )
    anonymous_ids = sorted({
        str(lock["sub"])[len("anon#"):]
        for lock in claim_locks
        if str(lock.get("sub", "")).startswith("anon#")
    })
    return anonymous_ids, claim_locks


def _scan_for_anonymous_ids(
    dynamodb_table,
    attribute_name: str,
    anonymous_ids: list[str],
) -> list[Dict[str, Any]]:
    """Scan an unindexed anonymous-id attribute once per claimed identity.

    These domains are currently small and have bounded retention. The profile
    and product-events paths use their existing GSIs instead; adding broad new
    GSIs only for an infrequent privacy request would add persistent cost.
    """
    items = []
    for anonymous_id in anonymous_ids:
        items.extend(_scan_all(
            dynamodb_table,
            FilterExpression="#anonymous_id = :anonymous_id",
            ExpressionAttributeNames={"#anonymous_id": attribute_name},
            ExpressionAttributeValues={":anonymous_id": anonymous_id},
        ))
    return items


def _profiles_for_anonymous_ids(anonymous_ids: list[str]) -> list[Dict[str, Any]]:
    profiles = []
    for anonymous_id in anonymous_ids:
        profiles.extend(_query_all(
            moral_profiles_table,
            IndexName="OwnerIndex",
            KeyConditionExpression="ownerAnonymousUserId = :owner",
            ExpressionAttributeValues={":owner": anonymous_id},
        ))
    return profiles


def _product_events_for_anonymous_ids(anonymous_ids: list[str]) -> list[Dict[str, Any]]:
    events = []
    for anonymous_id in anonymous_ids:
        events.extend(_query_all(
            product_events_table,
            IndexName="AnonymousUserIndex",
            KeyConditionExpression="anonymousUserId = :owner",
            ExpressionAttributeValues={":owner": anonymous_id},
        ))
    return events


def _collect_account_data(account_sub: str) -> Dict[str, Any]:
    """Build one complete, repeatable data plan for export or deletion."""
    account = users_table.get_item(Key={"sub": account_sub}).get("Item", {})
    anonymous_ids, claim_locks = _claimed_anonymous_ids(account_sub)
    return {
        "account": account,
        "anonymousIds": anonymous_ids,
        "claimLocks": claim_locks,
        "profiles": _profiles_for_anonymous_ids(anonymous_ids),
        "duelParticipations": _scan_for_anonymous_ids(
            challenge_participants_table,
            "anonymousUserId",
            anonymous_ids,
        ),
        "partyParticipations": _scan_for_anonymous_ids(
            party_participants_table,
            "participantId",
            anonymous_ids,
        ),
        "productEvents": _product_events_for_anonymous_ids(anonymous_ids),
        "legacyEvents": _scan_for_anonymous_ids(
            analytics_table,
            "anonymousUserId",
            anonymous_ids,
        ),
    }


def _portable_value(value: Any) -> Any:
    """Convert DynamoDB values into JSON-safe portable export values."""
    if isinstance(value, Decimal):
        return decimal_to_native(value)
    if isinstance(value, set):
        return sorted(_portable_value(item) for item in value)
    if isinstance(value, list):
        return [_portable_value(item) for item in value]
    if isinstance(value, dict):
        return {key: _portable_value(item) for key, item in value.items()}
    return value


def _portable_profile(profile: Dict[str, Any]) -> Dict[str, Any]:
    result = _portable_value(profile)
    averages = result.get("dimensionAverages")
    if isinstance(averages, str):
        try:
            result["dimensionAverages"] = json.loads(averages)
        except json.JSONDecodeError:
            # Existing rows should always contain valid JSON. Preserve an
            # unexpected historic value rather than making export fail.
            pass
    return result


def _portable_duel_participation(participation: Dict[str, Any]) -> Dict[str, Any]:
    return _portable_value({
        key: participation[key]
        for key in ("challengeToken", "role", "profilePublicId", "joinedAt", "submittedAt")
        if key in participation
    })


def _portable_party_participation(participation: Dict[str, Any]) -> Dict[str, Any]:
    return _portable_value({
        key: participation[key]
        for key in ("roomCode", "displayName", "isHost", "joinedAt", "votes", "completedAt")
        if key in participation
    })


@app.get("/users/export")
async def export_user_data(request: Request):
    """Return every current data domain linked to the caller's account."""
    claims = require_authenticated_user(request)
    data = _collect_account_data(claims["sub"])
    account = data["account"]
    return {
        "schemaVersion": 2,
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "account": _portable_value({
            "sub": claims["sub"],
            "email": account.get("email"),
            "createdAt": account.get("createdAt"),
            "updatedAt": account.get("updatedAt"),
            "lastActiveAt": account.get("lastActiveAt"),
        }),
        "claimedAnonymousUserIds": data["anonymousIds"],
        "moralProfiles": [_portable_profile(profile) for profile in data["profiles"]],
        "duelParticipations": [
            _portable_duel_participation(participation)
            for participation in data["duelParticipations"]
        ],
        "partyParticipations": [
            _portable_party_participation(participation)
            for participation in data["partyParticipations"]
        ],
        "analytics": {
            "productEvents": _portable_value(data["productEvents"]),
            "legacyEvents": _portable_value(data["legacyEvents"]),
        },
    }


def _delete_records(dynamodb_table, keys: list[Dict[str, Any]]) -> int:
    deleted = 0
    seen = set()
    for key in keys:
        marker = tuple(sorted(key.items()))
        if marker in seen:
            continue
        seen.add(marker)
        dynamodb_table.delete_item(Key=key)
        deleted += 1
    return deleted


def _remove_rematch_references(deleted_tokens: set[str]) -> None:
    for token in deleted_tokens:
        for challenge in _scan_all(
            challenges_table,
            FilterExpression="rematchOfToken = :token",
            ExpressionAttributeValues={":token": token},
        ):
            challenges_table.update_item(
                Key={"challengeToken": challenge["challengeToken"]},
                UpdateExpression="REMOVE rematchOfToken",
            )


def _delete_duel_data(participations: list[Dict[str, Any]]) -> int:
    tokens = {str(item["challengeToken"]) for item in participations if item.get("challengeToken")}
    for token in tokens:
        all_participants = _query_all(
            challenge_participants_table,
            KeyConditionExpression="challengeToken = :token",
            ExpressionAttributeValues={":token": token},
        )
        _delete_records(
            challenge_participants_table,
            [
                {"challengeToken": item["challengeToken"], "role": item["role"]}
                for item in all_participants
            ],
        )
        challenges_table.delete_item(Key={"challengeToken": token})
    _remove_rematch_references(tokens)
    return len(tokens)


def _delete_party_data(participations: list[Dict[str, Any]]) -> int:
    room_codes = {str(item["roomCode"]) for item in participations if item.get("roomCode")}
    for room_code in room_codes:
        all_participants = _query_all(
            party_participants_table,
            KeyConditionExpression="roomCode = :room",
            ExpressionAttributeValues={":room": room_code},
        )
        _delete_records(
            party_participants_table,
            [
                {"roomCode": item["roomCode"], "participantId": item["participantId"]}
                for item in all_participants
            ],
        )
        party_rooms_table.delete_item(Key={"roomCode": room_code})
    return len(room_codes)


def _delete_linked_account_data(data: Dict[str, Any]) -> Dict[str, int]:
    """Delete raw user-linked domains while preserving only aggregates.

    This deliberately removes an entire shared Duel/Party object when the
    caller contributed to it: derived scores, archetypes and pair insights
    would otherwise still retain information about the deleted participant.
    """
    counts = {
        "moralProfiles": _delete_records(
            moral_profiles_table,
            [{"publicId": profile["publicId"]} for profile in data["profiles"]],
        ),
        "challenges": _delete_duel_data(data["duelParticipations"]),
        "partyRooms": _delete_party_data(data["partyParticipations"]),
        "productEvents": _delete_records(
            product_events_table,
            [{"eventId": item["eventId"]} for item in data["productEvents"]],
        ),
        "legacyEvents": _delete_records(
            analytics_table,
            [
                {"sessionId": item["sessionId"], "timestamp": item["timestamp"]}
                for item in data["legacyEvents"]
            ],
        ),
    }
    _analytics_overview_cache.clear()
    return counts


def _resolve_cognito_username(cognito_username: Optional[str], account_sub: str) -> Optional[str]:
    """Find a legacy federated username only when it was never persisted.

    New account records retain ``cognito:username``. Historic rows may
    predate that field and a Cognito federated username is not safely inferred
    from an email address, so the retention job looks up the immutable sub.
    """
    if cognito_username or not COGNITO_USER_POOL_ID:
        return cognito_username
    safe_sub = account_sub.replace('"', '')
    try:
        response = cognito_idp_client.list_users(
            UserPoolId=COGNITO_USER_POOL_ID,
            Filter=f'sub = "{safe_sub}"',
            Limit=1,
        )
    except ClientError as error:
        code = error.response.get("Error", {}).get("Code")
        logger.warning("Unable to find Cognito user for retention: %s", code or type(error).__name__)
        raise HTTPException(status_code=503, detail="Account identity lookup unavailable")
    users = response.get("Users", [])
    return users[0].get("Username") if users else None


def _delete_cognito_user(cognito_username: Optional[str], account_sub: str) -> None:
    if not COGNITO_USER_POOL_ID:
        # Unit tests intentionally run without an external Cognito pool.
        return
    cognito_username = _resolve_cognito_username(cognito_username, account_sub)
    if not cognito_username:
        # A retention retry can reach a row whose Cognito identity has already
        # been removed by a prior partial request. Treat that as success.
        return
    try:
        cognito_idp_client.admin_delete_user(
            UserPoolId=COGNITO_USER_POOL_ID,
            Username=cognito_username,
        )
    except ClientError as error:
        code = error.response.get("Error", {}).get("Code")
        if code != "UserNotFoundException":
            logger.warning("Unable to delete Cognito user: %s", code or type(error).__name__)
            raise HTTPException(status_code=503, detail="Account deletion service unavailable")


def _delete_account_by_sub(account_sub: str, cognito_username: Optional[str]) -> Dict[str, int]:
    """Idempotently cascade app data first, then remove the sign-in identity."""
    data = _collect_account_data(account_sub)
    counts = _delete_linked_account_data(data)
    _delete_cognito_user(cognito_username, account_sub)
    _delete_records(
        users_table,
        [{"sub": lock["sub"]} for lock in data["claimLocks"]],
    )
    users_table.delete_item(Key={"sub": account_sub})
    return counts


def _retention_expiration_from_activity(item: Dict[str, Any], retention_seconds: int) -> int:
    """Derive a seconds-based expiry from the millisecond activity fields."""
    for field in ("lastActiveAt", "lastAccessedAt", "updatedAt", "createdAt"):
        value = item.get(field)
        if value is None:
            continue
        try:
            return int(int(value) / 1000) + retention_seconds
        except (TypeError, ValueError):
            continue
    return int(time.time()) + retention_seconds


def _sweep_expired_profiles(now_seconds: int) -> int:
    deleted = 0
    for profile in _scan_all(moral_profiles_table):
        expiration_time = profile.get("expirationTime")
        if expiration_time is None:
            expiration_time = _retention_expiration_from_activity(profile, PROFILE_RETENTION_SECONDS)
            moral_profiles_table.update_item(
                Key={"publicId": profile["publicId"]},
                UpdateExpression="SET expirationTime = :expiration_time",
                ExpressionAttributeValues={":expiration_time": expiration_time},
            )
        if int(expiration_time) <= now_seconds:
            moral_profiles_table.delete_item(Key={"publicId": profile["publicId"]})
            deleted += 1
    return deleted


def _sweep_expired_accounts(now_seconds: int) -> int:
    deleted = 0
    for account in _scan_all(users_table):
        # Claim-lock rows are handled by their owning account's cascade.
        if not account.get("createdAt") or str(account.get("sub", "")).startswith("anon#"):
            continue
        expiration_time = account.get("expirationTime")
        if expiration_time is None:
            expiration_time = _retention_expiration_from_activity(account, ACCOUNT_RETENTION_SECONDS)
            users_table.update_item(
                Key={"sub": account["sub"]},
                UpdateExpression="SET expirationTime = :expiration_time",
                ExpressionAttributeValues={":expiration_time": expiration_time},
            )
        if int(expiration_time) > now_seconds:
            continue
        try:
            _delete_account_by_sub(
                account["sub"],
                account.get("cognitoUsername"),
            )
            deleted += 1
        except Exception:
            # Preserve the account/claim locks when Cognito is temporarily
            # unavailable. The next daily run retries the idempotent cascade.
            logger.exception("Retention sweep failed for expired account")
    return deleted


def retention_sweep_handler(_event, _context):
    """Daily retention job for twelve-month profiles and authenticated users.

    DynamoDB TTL alone cannot delete a Cognito identity or cascade through
    shared Duel/Party records, so EventBridge invokes this handler once per
    day. Short-lived raw analytics and social-session tables keep their own
    native TTLs.
    """
    now_seconds = int(time.time())
    deleted_profiles = _sweep_expired_profiles(now_seconds)
    deleted_accounts = _sweep_expired_accounts(now_seconds)
    _analytics_overview_cache.clear()
    result = {
        "deletedProfiles": deleted_profiles,
        "deletedAccounts": deleted_accounts,
    }
    logger.info("Retention sweep completed: %s", result)
    return result


@app.delete("/users/me")
async def delete_user_account(request: Request):
    """Delete the caller's account, linked app data, and Cognito identity."""
    claims = require_authenticated_user(request)
    counts = _delete_account_by_sub(claims["sub"], claims.get("cognito:username"))
    return {"deleted": True, "deletedData": counts}

def _track_duel_event(request: Request, action_type: str, action_data: Optional[Dict[str, Any]] = None) -> None:
    session_id = extract_session_id(request)
    track_analytics_event(
        session_id=session_id,
        action_type=action_type,
        action_data=action_data or {},
        user_agent=request.headers.get("User-Agent"),
        ip_address=request.client.host if request.client else None,
        **extract_client_analytics_context(request),
    )

@app.post("/profiles")
async def create_profile(profile_request: CreateProfileRequest, request: Request):
    """Create a persistent, shareable moral profile (TASK-28).

    Reuses the same deterministic archetype computation as /analyze-results;
    this never depends on Groq. Anonymous-first: only the existing
    X-Anonymous-User-Id identity is required, matching every other endpoint.
    """
    anonymous_user_id = require_anonymous_user_id(request)
    result = create_moral_profile(anonymous_user_id, profile_request.answers, profile_request.language)
    _track_duel_event(request, "profile_created", {
        "archetype_id": result["archetypeId"],
        "archetypes_version": result["archetypesVersion"],
    })
    return result

@app.get("/profiles/{public_id}")
async def get_profile(public_id: str, request: Request, language: str = "en"):
    """Public, unlisted profile read (TASK-28/29). Excludes the owning
    anonymous_user_id and any other private attribute; publicId is a random,
    non-enumerable token so this is not a listing."""
    item = get_profile_or_404(public_id)
    averages = json.loads(item["dimensionAverages"])
    archetype = assign_archetype(averages, language=language)
    return {
        "publicId": public_id,
        "averages": averages,
        "createdAt": item["createdAt"],
        **archetype,
    }

@app.get("/dilemmas/by-ids")
async def get_dilemmas_by_ids(ids: str, request: Request, language: str = "en"):
    """Fetch specific dilemmas by their language-neutral baseId, in order.

    Used to serve a Duel invitee the exact same dilemmas the creator
    answered, in the invitee's own language (dilemmas share one baseId
    across languages; see scripts/populate_dynamodb_multilang.py).
    """
    if not language or len(language) > 10 or not language.isalpha():
        raise HTTPException(status_code=400, detail="Invalid language parameter")
    base_ids = [item.strip() for item in ids.split(",") if item.strip()][:20]
    if not base_ids:
        raise HTTPException(status_code=400, detail="No dilemma ids provided")

    keys = [{"_id": f"{base_id}-{language}"} for base_id in base_ids]
    response = dynamodb.batch_get_item(RequestItems={DYNAMODB_TABLE: {"Keys": keys}})
    items_by_key = {
        item["_id"]: decimal_to_native(item)
        for item in response.get("Responses", {}).get(DYNAMODB_TABLE, [])
    }
    ordered = [
        items_by_key[f"{base_id}-{language}"]
        for base_id in base_ids
        if f"{base_id}-{language}" in items_by_key
    ]
    return {"dilemmas": ordered}

@app.post("/challenges")
async def create_challenge(challenge_request: CreateChallengeRequest, request: Request):
    """Create a Moral Duel challenge from the caller's moral profile (TASK-34/35)."""
    anonymous_user_id = require_anonymous_user_id(request)

    if challenge_request.profilePublicId:
        profile = get_profile_or_404(challenge_request.profilePublicId)
        if profile.get("ownerAnonymousUserId") != anonymous_user_id:
            raise HTTPException(status_code=404, detail="Profile not found")
    else:
        profile = get_latest_profile_for_anonymous_user(anonymous_user_id)
        if not profile:
            raise HTTPException(status_code=400, detail="Complete a moral profile before creating a challenge")

    require_authenticated_for_repeat_duel(request, anonymous_user_id, exclude_public_id=profile["publicId"])

    token = generate_public_token()
    now = int(time.time() * 1000)
    expires_at = int(time.time()) + CHALLENGE_TTL_SECONDS
    challenges_table.put_item(Item={
        "challengeToken": token,
        "creatorProfileId": profile["publicId"],
        "dilemmaBaseIds": profile["dilemmaBaseIds"],
        "language": profile["language"],
        "status": "open",
        "createdAt": now,
        "expirationTime": expires_at,
    })
    challenge_participants_table.put_item(Item={
        "challengeToken": token,
        "role": "creator",
        "anonymousUserId": anonymous_user_id,
        "profilePublicId": profile["publicId"],
        "submittedAt": now,
        "expirationTime": expires_at,
    })
    _track_duel_event(request, "challenge_created", {"dilemma_count": len(profile["dilemmaBaseIds"])})
    return {"challengeToken": token, "status": "open", "dilemmaCount": len(profile["dilemmaBaseIds"])}

@app.get("/challenges/{token}")
async def open_challenge(token: str, request: Request, language: str = "en"):
    """Open a challenge link (TASK-35/38): a teaser only, never the creator's
    private answers or dimension averages before the invitee unlocks it
    (TASK-34 AC3)."""
    anonymous_user_id = require_anonymous_user_id(request)
    challenge = get_challenge_or_404(token)
    ensure_challenge_is_actionable(challenge)

    creator_participant = get_participant(token, "creator")
    creator_profile = get_profile_or_404(creator_participant["profilePublicId"])
    creator_averages = json.loads(creator_profile["dimensionAverages"])
    creator_archetype = assign_archetype(creator_averages, language=language)

    invitee_participant = get_participant(token, "invitee")
    is_own_challenge = creator_participant["anonymousUserId"] == anonymous_user_id

    _track_duel_event(request, "challenge_opened", {"status": challenge["status"]})
    return {
        "challengeToken": token,
        "status": challenge["status"],
        "dilemmaCount": len(challenge["dilemmaBaseIds"]),
        "language": challenge["language"],
        "creatorArchetype": {
            "name": creator_archetype["name"],
            "visual": creator_archetype["visual"],
            "sharePhrase": creator_archetype["sharePhrase"],
        },
        "alreadyJoined": bool(invitee_participant),
        "isOwnChallenge": is_own_challenge,
    }

@app.post("/challenges/{token}/join")
async def join_challenge(token: str, request: Request):
    """Invitee joins a challenge (TASK-35/36): idempotent for the same
    identity, rejected for a second distinct invitee."""
    anonymous_user_id = require_anonymous_user_id(request)
    challenge = get_challenge_or_404(token)
    ensure_challenge_is_actionable(challenge)

    creator_participant = get_participant(token, "creator")
    if creator_participant and creator_participant["anonymousUserId"] == anonymous_user_id:
        raise HTTPException(status_code=400, detail="You cannot join your own challenge")

    require_authenticated_for_repeat_duel(request, anonymous_user_id)

    now = int(time.time() * 1000)
    try:
        challenge_participants_table.put_item(
            Item={
                "challengeToken": token,
                "role": "invitee",
                "anonymousUserId": anonymous_user_id,
                "joinedAt": now,
                "expirationTime": challenge.get("expirationTime"),
            },
            ConditionExpression="attribute_not_exists(challengeToken) OR anonymousUserId = :who",
            ExpressionAttributeValues={":who": anonymous_user_id},
        )
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
            raise HTTPException(status_code=409, detail="This challenge already has a different invitee")
        raise

    if challenge["status"] == "open":
        try:
            challenges_table.update_item(
                Key={"challengeToken": token},
                UpdateExpression="SET #status = :joined",
                ConditionExpression="#status = :open",
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues={":joined": "joined", ":open": "open"},
            )
        except ClientError as error:
            if error.response.get("Error", {}).get("Code") != "ConditionalCheckFailedException":
                raise  # Someone else already advanced the status; joining is still valid.

    _track_duel_event(request, "challenge_joined")
    return {
        "challengeToken": token,
        "dilemmaBaseIds": challenge["dilemmaBaseIds"],
        "language": challenge["language"],
    }

@app.post("/challenges/{token}/submit")
async def submit_challenge(token: str, submit_request: SubmitChallengeRequest, request: Request):
    """Invitee submits their answers (TASK-35/36): completes the challenge and
    creates the invitee's own persistent profile too, so both participants
    receive an archetype from the same loop. Immutable once submitted."""
    anonymous_user_id = require_anonymous_user_id(request)
    challenge = get_challenge_or_404(token)
    ensure_challenge_is_actionable(challenge)
    if challenge["status"] == "completed":
        raise HTTPException(status_code=409, detail="This challenge is already completed")

    invitee_participant = get_participant(token, "invitee")
    if not invitee_participant or invitee_participant["anonymousUserId"] != anonymous_user_id:
        raise HTTPException(status_code=403, detail="Join this challenge before submitting")

    profile_result = create_moral_profile(anonymous_user_id, submit_request.answers, challenge["language"])
    now = int(time.time() * 1000)
    try:
        challenge_participants_table.update_item(
            Key={"challengeToken": token, "role": "invitee"},
            UpdateExpression="SET submittedAt = :now, profilePublicId = :pid",
            ConditionExpression="attribute_not_exists(submittedAt)",
            ExpressionAttributeValues={":now": now, ":pid": profile_result["publicId"]},
        )
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
            raise HTTPException(status_code=409, detail="You already submitted your answers")
        raise

    challenges_table.update_item(
        Key={"challengeToken": token},
        UpdateExpression="SET #status = :completed",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={":completed": "completed"},
    )
    _track_duel_event(request, "challenge_completed", {"archetype_id": profile_result["archetypeId"]})
    return {"challengeToken": token, "status": "completed", "profilePublicId": profile_result["publicId"]}

def _fallback_duel_pair_insight(creator_name: str, invitee_name: str, overall_pct: int, language: str) -> str:
    """Always-available, no-AI insight (core flow must work without Groq)."""
    if language == "it":
        return f"{creator_name} e {invitee_name} sono allineati al {overall_pct}%: due modi diversi di guardare allo stesso dilemma."
    return f"{creator_name} and {invitee_name} agree {overall_pct}% of the time: two different lenses on the same dilemma."


def _generate_duel_pair_insight(
    creator_name: str, invitee_name: str, compatibility: Dict[str, Any], language: str,
) -> str:
    """TASK-135: one short AI-enriched line about what this specific pairing
    means, generated once and cached on the challenge record (never
    regenerated on every /compare call, per the cost rule) - enrichment only,
    same 'persist and reuse AI output' pattern as the Party Room group
    verdict (_generate_party_group_verdict) and the main Results screen's
    verdict (TASK-121). The prompt receives only archetype names and
    aggregate percentages, never per-dilemma answers/choices - TASK-39
    deliberately never exposes those, even to the two participants
    themselves. Falls back to a plain, factual sentence if Groq is
    unavailable or fails."""
    overall_pct = compatibility.get("overallAgreementPct", 0)
    try:
        api_key = get_groq_api_key()
        if language == "it":
            prompt_content = (
                f'Due persone hanno appena completato un Moral Duel: {creator_name} contro {invitee_name}. '
                f'Sono allineati al {overall_pct}% complessivo. La dimensione dove concordano di piu\' e\' '
                f'"{compatibility.get("mostAlignedDimension")}", quella dove divergono di piu\' e\' '
                f'"{compatibility.get("mostDivergentDimension")}". '
                f'Scrivi UNA sola frase breve e incisiva (massimo 30 parole) su cosa dice questo abbinamento della loro relazione morale, '
                f'nel tono "Moral Torture Machine" - leggermente oscuro, arguto, perspicace. '
                f'Non inventare fatti su di loro, non nominare risposte specifiche. Restituisci solo la frase, senza virgolette ne\' JSON.'
            )
        else:
            prompt_content = (
                f'Two people just completed a Moral Duel: {creator_name} versus {invitee_name}. '
                f'They agree {overall_pct}% overall. The dimension where they align most is '
                f'"{compatibility.get("mostAlignedDimension")}", the one where they diverge most is '
                f'"{compatibility.get("mostDivergentDimension")}". '
                f'Write ONE short, punchy sentence (max 30 words) about what this pairing says about their moral relationship, '
                f'in the "Moral Torture Machine" tone - slightly dark, wry, insightful. '
                f'Do not invent facts about them, do not name specific answers. Return only the sentence, no quotes, no JSON.'
            )
        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [{"role": "user", "content": prompt_content}],
        }
        result = call_groq_api_with_fallback(payload=payload, api_key=api_key, operation="Duel pair insight")
        text = result['choices'][0]['message']['content'].strip()
        return text or _fallback_duel_pair_insight(creator_name, invitee_name, overall_pct, language)
    except Exception:
        logger.exception("Failed to generate duel pair insight, using fallback")
        return _fallback_duel_pair_insight(creator_name, invitee_name, overall_pct, language)


@app.get("/challenges/{token}/compare")
async def compare_challenge(token: str, request: Request, language: str = "en"):
    """Symmetric, deterministic comparison (TASK-37/39), unlocked only once
    both participants have submitted. Never exposes raw per-dilemma answers,
    only archetypes and aggregate dimension compatibility."""
    challenge = get_challenge_or_404(token)
    if challenge["status"] != "completed":
        raise HTTPException(status_code=409, detail="This challenge is not completed yet")

    creator_participant = get_participant(token, "creator")
    invitee_participant = get_participant(token, "invitee")
    creator_profile = get_profile_or_404(creator_participant["profilePublicId"])
    invitee_profile = get_profile_or_404(invitee_participant["profilePublicId"])

    creator_averages = json.loads(creator_profile["dimensionAverages"])
    invitee_averages = json.loads(invitee_profile["dimensionAverages"])
    creator_archetype = assign_archetype(creator_averages, language=language)
    invitee_archetype = assign_archetype(invitee_averages, language=language)
    compatibility = compute_compatibility(creator_averages, invitee_averages)

    _track_duel_event(request, "challenge_compared", {"overall_agreement_pct": compatibility["overallAgreementPct"]})
    response = {
        "challengeToken": token,
        "creator": {"archetype": creator_archetype},
        "invitee": {"archetype": invitee_archetype},
        "compatibility": compatibility,
        "pairInsightUnlocked": False,
    }

    # TASK-135/TASK-14: the pair insight is the login incentive - unlocked
    # only for an authenticated caller, generated once and cached on the
    # challenge record itself. Anonymous callers keep the full aggregate
    # comparison above for free (do not regress the existing completion
    # rate); they just don't get this one extra sentence.
    if get_optional_user(request) is not None:
        pair_insight = challenge.get("pairInsight")
        if not pair_insight:
            pair_insight = _generate_duel_pair_insight(
                creator_archetype["name"], invitee_archetype["name"], compatibility, language,
            )
            try:
                challenges_table.update_item(
                    Key={"challengeToken": token},
                    UpdateExpression="SET pairInsight = :insight",
                    ConditionExpression="attribute_not_exists(pairInsight)",
                    ExpressionAttributeValues={":insight": pair_insight},
                )
            except ClientError as error:
                if error.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
                    pair_insight = get_challenge_or_404(token).get("pairInsight", pair_insight)
                else:
                    raise
        response["pairInsight"] = pair_insight
        response["pairInsightUnlocked"] = True

    return response

@app.post("/challenges/{token}/revoke")
async def revoke_challenge(token: str, request: Request):
    """Let the creator revoke their own not-yet-completed challenge (TASK-34
    AC1). Revoking a completed challenge would retroactively hide an unlocked
    comparison from the invitee, so it is not allowed."""
    anonymous_user_id = require_anonymous_user_id(request)
    challenge = get_challenge_or_404(token)
    if challenge["status"] == "completed":
        raise HTTPException(status_code=409, detail="A completed challenge cannot be revoked")

    creator_participant = get_participant(token, "creator")
    if not creator_participant or creator_participant["anonymousUserId"] != anonymous_user_id:
        raise HTTPException(status_code=403, detail="Only the creator can revoke this challenge")

    challenges_table.update_item(
        Key={"challengeToken": token},
        UpdateExpression="SET #status = :revoked",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={":revoked": "revoked"},
    )
    _track_duel_event(request, "challenge_revoked")
    return {"challengeToken": token, "status": "revoked"}

@app.post("/challenges/{token}/rematch")
async def rematch_challenge(token: str, request: Request):
    """Create a new challenge attributed to a completed one (TASK-39 AC2).
    Whichever participant calls this becomes the new challenge's creator.
    TASK-136: a rematch is by definition a repeat Duel interaction (it only
    exists after completing a full first challenge), so it always requires
    authentication - no profile-count check needed, unlike create/join."""
    anonymous_user_id = require_anonymous_user_id(request)
    challenge = get_challenge_or_404(token)
    if challenge["status"] != "completed":
        raise HTTPException(status_code=409, detail="Only a completed challenge can be rematched")

    participant = get_participant(token, "creator")
    if not participant or participant["anonymousUserId"] != anonymous_user_id:
        participant = get_participant(token, "invitee")
        if not participant or participant["anonymousUserId"] != anonymous_user_id:
            raise HTTPException(status_code=403, detail="You were not part of this challenge")

    # Checked last, after confirming the challenge is completed and the
    # caller genuinely was a participant: a 409/403 on the resource itself
    # is more useful feedback than a login prompt for a request that would
    # have failed anyway.
    if get_optional_user(request) is None:
        _raise_login_required(request)

    new_token = generate_public_token()
    now = int(time.time() * 1000)
    expires_at = int(time.time()) + CHALLENGE_TTL_SECONDS
    challenges_table.put_item(Item={
        "challengeToken": new_token,
        "creatorProfileId": participant["profilePublicId"],
        "dilemmaBaseIds": challenge["dilemmaBaseIds"],
        "language": challenge["language"],
        "status": "open",
        "createdAt": now,
        "expirationTime": expires_at,
        "rematchOfToken": token,
    })
    challenge_participants_table.put_item(Item={
        "challengeToken": new_token,
        "role": "creator",
        "anonymousUserId": anonymous_user_id,
        "profilePublicId": participant["profilePublicId"],
        "submittedAt": now,
        "expirationTime": expires_at,
    })
    _track_duel_event(request, "challenge_rematch_created", {"rematch_of_token": token})
    return {"challengeToken": new_token, "status": "open"}


# ===== Party Room (TASK-46/47, ADR-050: HTTP polling, no WebSocket) =====
#
# Rooms advance lazily: there is no dedicated "advance to next round" call.
# Every read (GET room state) or write (join/vote) first runs
# _advance_party_room_if_due(), which moves lobby -> question -> reveal ->
# question... -> completed purely from stored timestamps and vote counts, so
# no single client (in particular not the host's) needs to stay foregrounded
# for the room to progress. A conditional DynamoDB update makes a concurrent
# double-advance from multiple simultaneous pollers a no-op rather than a bug.

def _generate_room_code() -> str:
    return "".join(secrets.choice(PARTY_ROOM_CODE_ALPHABET) for _ in range(PARTY_ROOM_CODE_LENGTH))


def _pick_random_dilemma_base_ids(language: str, count: int) -> list[str]:
    """Sample `count` distinct dilemma base ids once, up front, so every
    participant in the room answers the identical set (unlike Duel, where
    dilemmas come from whichever profile the creator already completed)."""
    response = table.scan(
        FilterExpression='attribute_exists(#lang) AND #lang = :language',
        ExpressionAttributeNames={'#lang': 'language'},
        ExpressionAttributeValues={':language': language},
    )
    suffix = f"-{language}"
    base_ids = sorted({
        item['_id'][:-len(suffix)] for item in response.get('Items', [])
        if item.get('_id', '').endswith(suffix)
    })
    if not base_ids:
        raise HTTPException(status_code=404, detail=f"No dilemmas found for language: {language}")
    if len(base_ids) <= count:
        return base_ids
    return random.sample(base_ids, count)


def get_room_or_404(room_code: str) -> Dict[str, Any]:
    """Normalizes DynamoDB Decimal fields (currentRoundIndex, phaseEndsAt, ...)
    to native int/float here, once, so every caller can use them directly -
    e.g. as a list index - without re-converting."""
    response = party_rooms_table.get_item(Key={"roomCode": room_code})
    item = response.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Room not found")
    expiration = item.get("expirationTime")
    if expiration and int(time.time()) > int(expiration):
        raise HTTPException(status_code=410, detail="This room has expired")
    return decimal_to_native(item)


def _list_party_participants(room_code: str) -> list[Dict[str, Any]]:
    response = party_participants_table.query(
        KeyConditionExpression="roomCode = :room",
        ExpressionAttributeValues={":room": room_code},
    )
    return [decimal_to_native(item) for item in response.get("Items", [])]


def _advance_party_room_if_due(room: Dict[str, Any]) -> Dict[str, Any]:
    """Move the room to its next phase if it's actually due. TASK-123: no
    visible timer drives this - "question" only ends once everyone has
    voted, and "reveal" only ends when the host explicitly requests it
    (see advance_party_room below). PARTY_ROOM_SAFETY_TIMEOUT_MS is purely a
    fallback so an abandoned room (someone never votes, the host never
    returns) doesn't stay open forever; it is never shown as a countdown.
    Safe to call from every read and write."""
    if room["status"] not in ("question", "reveal"):
        return room

    now_ms = int(time.time() * 1000)
    phase_ends_at = int(room["phaseEndsAt"])
    due = now_ms >= phase_ends_at

    if room["status"] == "question" and not due:
        participants = _list_party_participants(room["roomCode"])
        round_key = str(room["currentRoundIndex"])
        voted = sum(1 for p in participants if round_key in p.get("votes", {}))
        due = len(participants) > 0 and voted >= len(participants)

    if room["status"] == "reveal" and not due:
        due = bool(room.get("hostAdvanceRequested"))

    if not due:
        return room

    expected_status = room["status"]
    if room["status"] == "question":
        update_expression = "SET #status = :newStatus, phaseEndsAt = :ends, hostAdvanceRequested = :false"
        expression_values = {
            ":newStatus": "reveal",
            ":ends": now_ms + PARTY_ROOM_SAFETY_TIMEOUT_MS,
            ":false": False,
        }
    else:
        next_index = room["currentRoundIndex"] + 1
        if next_index < len(room["dilemmaBaseIds"]):
            update_expression = (
                "SET #status = :newStatus, currentRoundIndex = :idx, "
                "phaseEndsAt = :ends, hostAdvanceRequested = :false"
            )
            expression_values = {
                ":newStatus": "question",
                ":idx": next_index,
                ":ends": now_ms + PARTY_ROOM_SAFETY_TIMEOUT_MS,
                ":false": False,
            }
        else:
            update_expression = "SET #status = :newStatus"
            expression_values = {":newStatus": "completed"}

    try:
        response = party_rooms_table.update_item(
            Key={"roomCode": room["roomCode"]},
            UpdateExpression=update_expression,
            ConditionExpression="#status = :expectedStatus",
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={
                **expression_values,
                ":expectedStatus": expected_status,
            },
            ReturnValues="ALL_NEW",
        )
        return decimal_to_native(response["Attributes"])
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
            # Another concurrent poller already advanced it; re-read instead of
            # trusting our stale in-memory copy.
            return get_room_or_404(room["roomCode"])
        raise


@app.post("/party-rooms")
async def create_party_room(create_request: CreatePartyRoomRequest, request: Request):
    """Host creates a room (TASK-46). Anonymous-first, like every other core
    endpoint: only the existing X-Anonymous-User-Id identity is required."""
    anonymous_user_id = require_anonymous_user_id(request)
    dilemma_base_ids = _pick_random_dilemma_base_ids(create_request.language, create_request.dilemmaCount)

    now = int(time.time() * 1000)
    expiration_time = int(time.time()) + PARTY_ROOM_TTL_SECONDS
    room_code = None
    for _ in range(10):
        candidate = _generate_room_code()
        try:
            party_rooms_table.put_item(
                Item={
                    "roomCode": candidate,
                    "hostParticipantId": anonymous_user_id,
                    "status": "lobby",
                    "language": create_request.language,
                    "dilemmaBaseIds": dilemma_base_ids,
                    "currentRoundIndex": 0,
                    "phaseEndsAt": 0,
                    "hostAdvanceRequested": False,
                    "createdAt": now,
                    "expirationTime": expiration_time,
                },
                ConditionExpression="attribute_not_exists(roomCode)",
            )
            room_code = candidate
            break
        except ClientError as error:
            if error.response.get("Error", {}).get("Code") != "ConditionalCheckFailedException":
                raise
    if not room_code:
        raise HTTPException(status_code=503, detail="Could not allocate a room code, please retry")

    party_participants_table.put_item(Item={
        "roomCode": room_code,
        "participantId": anonymous_user_id,
        "displayName": create_request.displayName,
        "isHost": True,
        "joinedAt": now,
        "votes": {},
        "expirationTime": expiration_time,
    })
    _track_duel_event(request, "party_room_created", {"dilemma_count": len(dilemma_base_ids)})
    return {"roomCode": room_code, "participantId": anonymous_user_id, "status": "lobby"}


@app.post("/party-rooms/{room_code}/join")
async def join_party_room(room_code: str, join_request: JoinPartyRoomRequest, request: Request):
    """Idempotent for the same identity (a rejoin/refresh is a no-op); rejects
    once the room has started or is full, mirroring Duel's join guards."""
    anonymous_user_id = require_anonymous_user_id(request)
    room = get_room_or_404(room_code)
    existing = party_participants_table.get_item(
        Key={"roomCode": room_code, "participantId": anonymous_user_id}
    ).get("Item")
    if existing:
        return {"roomCode": room_code, "participantId": anonymous_user_id, "status": room["status"]}

    if room["status"] != "lobby":
        raise HTTPException(status_code=409, detail="This room has already started")

    participants = _list_party_participants(room_code)
    if len(participants) >= PARTY_ROOM_MAX_PARTICIPANTS:
        raise HTTPException(status_code=409, detail="This room is full")

    party_participants_table.put_item(Item={
        "roomCode": room_code,
        "participantId": anonymous_user_id,
        "displayName": join_request.displayName,
        "isHost": False,
        "joinedAt": int(time.time() * 1000),
        "votes": {},
        "expirationTime": room["expirationTime"],
    })
    _track_duel_event(request, "party_room_joined", {"room_code": room_code})
    return {"roomCode": room_code, "participantId": anonymous_user_id, "status": "lobby"}


@app.post("/party-rooms/{room_code}/start")
async def start_party_room(room_code: str, request: Request):
    """Host-only. Requires the minimum participant count (TASK-47)."""
    anonymous_user_id = require_anonymous_user_id(request)
    room = get_room_or_404(room_code)
    if room["hostParticipantId"] != anonymous_user_id:
        raise HTTPException(status_code=403, detail="Only the host can start this room")
    if room["status"] != "lobby":
        raise HTTPException(status_code=409, detail="This room has already started")

    participants = _list_party_participants(room_code)
    if len(participants) < PARTY_ROOM_MIN_PARTICIPANTS_TO_START:
        raise HTTPException(
            status_code=400,
            detail=f"At least {PARTY_ROOM_MIN_PARTICIPANTS_TO_START} participants are required to start",
        )

    now_ms = int(time.time() * 1000)
    try:
        party_rooms_table.update_item(
            Key={"roomCode": room_code},
            UpdateExpression="SET #status = :question, phaseEndsAt = :ends",
            ConditionExpression="#status = :lobby",
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={
                ":question": "question",
                ":lobby": "lobby",
                ":ends": now_ms + PARTY_ROOM_SAFETY_TIMEOUT_MS,
            },
        )
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
            raise HTTPException(status_code=409, detail="This room has already started")
        raise
    _track_duel_event(request, "party_room_started", {"room_code": room_code, "participant_count": len(participants)})
    return {"roomCode": room_code, "status": "question"}


@app.post("/party-rooms/{room_code}/advance")
async def advance_party_room(room_code: str, request: Request):
    """Host-only (TASK-123): the reveal phase has no timer, so this is the
    only way it ends under normal play - the safety-net timeout in
    _advance_party_room_if_due only exists for an abandoned room."""
    anonymous_user_id = require_anonymous_user_id(request)
    room = get_room_or_404(room_code)
    if room["hostParticipantId"] != anonymous_user_id:
        raise HTTPException(status_code=403, detail="Only the host can advance to the next round")
    if room["status"] != "reveal":
        raise HTTPException(status_code=409, detail="Can only advance during the reveal phase")

    try:
        party_rooms_table.update_item(
            Key={"roomCode": room_code},
            UpdateExpression="SET hostAdvanceRequested = :true",
            ConditionExpression="#status = :reveal",
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={":true": True, ":reveal": "reveal"},
        )
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
            raise HTTPException(status_code=409, detail="Can only advance during the reveal phase")
        raise

    room = _advance_party_room_if_due(get_room_or_404(room_code))
    _track_duel_event(request, "party_room_advanced", {"room_code": room_code})
    return {"roomCode": room_code, "status": room["status"], "currentRoundIndex": room["currentRoundIndex"]}


@app.post("/party-rooms/{room_code}/vote")
async def submit_party_vote(room_code: str, vote_request: SubmitPartyVoteRequest, request: Request):
    """Immutable once cast per round, enforced by DynamoDB (not just app
    logic), mirroring Duel's submit guard (ADR-038)."""
    anonymous_user_id = require_anonymous_user_id(request)
    room = get_room_or_404(room_code)
    room = _advance_party_room_if_due(room)
    if room["status"] != "question":
        raise HTTPException(status_code=409, detail="Voting is not open for this room right now")

    participant = party_participants_table.get_item(
        Key={"roomCode": room_code, "participantId": anonymous_user_id}
    ).get("Item")
    if not participant:
        raise HTTPException(status_code=403, detail="Join this room before voting")

    round_key = str(room["currentRoundIndex"])
    try:
        party_participants_table.update_item(
            Key={"roomCode": room_code, "participantId": anonymous_user_id},
            UpdateExpression="SET votes.#round = :vote",
            ConditionExpression="attribute_not_exists(votes.#round)",
            ExpressionAttributeNames={"#round": round_key},
            ExpressionAttributeValues={
                # chosenValues is stored as a JSON string, not a native Map -
                # boto3's resource API rejects raw Python floats in DynamoDB
                # attributes (they'd need converting to Decimal), and this
                # matches the same json.dumps pattern already used for
                # dimensionAverages on moral_profiles_table.
                ":vote": {
                    "choice": vote_request.choice,
                    "chosenValues": json.dumps(vote_request.chosenValues, separators=(",", ":")),
                },
            },
        )
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
            raise HTTPException(status_code=409, detail="You already voted this round")
        raise

    room = _advance_party_room_if_due(get_room_or_404(room_code))
    _track_duel_event(request, "party_room_vote_cast", {"room_code": room_code, "round_index": room["currentRoundIndex"]})
    return {"roomCode": room_code, "status": room["status"], "currentRoundIndex": room["currentRoundIndex"]}


def _party_room_participant_summary(
    participant: Dict[str, Any], caller_anonymous_user_id: str, archetype: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Never returns the raw anonymous_user_id to other participants (it's an
    internal identifier, same rule as everywhere else in the product) - only
    whether this entry is the caller themselves."""
    summary = {
        "isCaller": participant["participantId"] == caller_anonymous_user_id,
        "displayName": participant["displayName"],
        "isHost": participant.get("isHost", False),
    }
    if archetype:
        summary["archetype"] = archetype
    return summary


def _party_room_votes_by_round(participants: list, dilemma_count: int) -> list:
    tallies = []
    for round_index in range(dilemma_count):
        round_key = str(round_index)
        first = sum(1 for p in participants if p.get("votes", {}).get(round_key, {}).get("choice") == "first")
        second = sum(1 for p in participants if p.get("votes", {}).get(round_key, {}).get("choice") == "second")
        tallies.append({"first": first, "second": second})
    return tallies


def _fallback_party_group_verdict(archetype_names: list, language: str) -> str:
    """Always-available, no-AI verdict (core flow must work without Groq)."""
    unique_count = len(set(archetype_names))
    if language == "it":
        return f"{len(archetype_names)} persone, {unique_count} archetipi morali diversi nella stessa stanza."
    return f"{len(archetype_names)} people, {unique_count} different moral archetypes in the same room."


def _generate_party_group_verdict(archetype_names: list, language: str) -> str:
    """TASK-123: one short AI-enriched line about the group as a whole,
    generated once and cached on the room record (never regenerated on every
    poll, per the cost rule) - enrichment only, the archetypes themselves
    stay entirely deterministic (ADR-003/025). Falls back to a plain,
    factual sentence if Groq is unavailable or fails."""
    if not archetype_names:
        return _fallback_party_group_verdict(archetype_names, language)
    try:
        api_key = get_groq_api_key()
        archetype_list = ", ".join(archetype_names)
        if language == "it":
            prompt_content = (
                f'Un gruppo di {len(archetype_names)} persone ha appena giocato insieme a un party game di dilemmi morali. '
                f'A ciascuno e\' stato assegnato uno di questi archetipi morali, in base alle risposte date: {archetype_list}. '
                f'Scrivi UNA sola frase breve e incisiva (massimo 25 parole) che catturi il carattere morale collettivo di questo gruppo, '
                f'nel tono "Moral Torture Machine" - leggermente oscuro, arguto, perspicace. '
                f'Non nominare nessuno individualmente, non inventare nomi. Restituisci solo la frase, senza virgolette ne\' JSON.'
            )
        else:
            prompt_content = (
                f'A group of {len(archetype_names)} people just played a moral-dilemma party game together. '
                f'Each was assigned one of these moral archetypes based on their answers: {archetype_list}. '
                f'Write ONE short, punchy sentence (max 25 words) capturing this group\'s collective moral character, '
                f'in the "Moral Torture Machine" tone - slightly dark, wry, insightful. '
                f'Do not name anyone individually, do not invent names. Return only the sentence, no quotes, no JSON.'
            )
        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [{"role": "user", "content": prompt_content}],
        }
        result = call_groq_api_with_fallback(payload=payload, api_key=api_key, operation="Party group verdict")
        text = result['choices'][0]['message']['content'].strip()
        return text or _fallback_party_group_verdict(archetype_names, language)
    except Exception:
        logger.exception("Failed to generate party group verdict, using fallback")
        return _fallback_party_group_verdict(archetype_names, language)


@app.get("/party-rooms/{room_code}")
async def get_party_room(room_code: str, request: Request, language: str = "en"):
    """Polled repeatedly by every client in the room (lobby, each round, and
    the final screen) - this single endpoint carries the room's entire
    visible state so the frontend never needs a second call to stay in sync."""
    anonymous_user_id = require_anonymous_user_id(request)
    room = get_room_or_404(room_code)
    room = _advance_party_room_if_due(room)
    participants = _list_party_participants(room_code)
    caller = next((p for p in participants if p["participantId"] == anonymous_user_id), None)
    is_completed = room["status"] == "completed"

    # TASK-48/123: participant-index keys, never the raw anonymous_user_id,
    # both for the awards computation and for referencing "which participant"
    # from the response - consistent with never exposing internal IDs.
    participant_averages_by_index: Dict[int, Dict[str, float]] = {}
    participant_choices_by_index: Dict[int, Dict[int, str]] = {}
    archetypes_by_index: Dict[int, Dict[str, Any]] = {}
    if is_completed:
        for index, participant in enumerate(participants):
            votes = participant.get("votes", {})
            answers = [json.loads(vote["chosenValues"]) for vote in votes.values()]
            if answers:
                averages = compute_dimension_averages(answers)
                participant_averages_by_index[index] = averages
                archetypes_by_index[index] = assign_archetype(averages, language=language)
            participant_choices_by_index[index] = {
                int(round_key): vote["choice"] for round_key, vote in votes.items()
            }

    response = {
        "roomCode": room_code,
        "status": room["status"],
        "language": room["language"],
        "isHost": bool(caller and caller.get("isHost")),
        "hasJoined": caller is not None,
        "participantCount": len(participants),
        "dilemmaCount": len(room["dilemmaBaseIds"]),
        "currentRoundIndex": room["currentRoundIndex"],
        "phaseEndsAt": room["phaseEndsAt"] or None,
        "participants": [
            _party_room_participant_summary(p, anonymous_user_id, archetypes_by_index.get(index))
            for index, p in enumerate(participants)
        ],
    }

    if room["status"] in ("question", "reveal") and caller:
        round_key = str(room["currentRoundIndex"])
        current_base_id = room["dilemmaBaseIds"][room["currentRoundIndex"]]
        dilemma_key = f"{current_base_id}-{language}"
        dilemma_item = decimal_to_native(table.get_item(Key={"_id": dilemma_key}).get("Item") or {})
        response["currentDilemma"] = dilemma_item or None
        response["hasVotedThisRound"] = round_key in caller.get("votes", {})
        if room["status"] == "reveal":
            first_votes = sum(1 for p in participants if p.get("votes", {}).get(round_key, {}).get("choice") == "first")
            second_votes = sum(1 for p in participants if p.get("votes", {}).get(round_key, {}).get("choice") == "second")
            response["roundResult"] = {"firstVotes": first_votes, "secondVotes": second_votes}
            # TASK-123: show who voted what, not just the aggregate split -
            # people in the same room, more fun to see individually. Never
            # the raw participantId, same rule as everywhere else.
            response["roundVotes"] = [
                {
                    "displayName": p["displayName"],
                    "isCaller": p["participantId"] == anonymous_user_id,
                    "choice": p["votes"][round_key]["choice"],
                }
                for p in participants
                if round_key in p.get("votes", {})
            ]

    if is_completed:
        votes_by_round = _party_room_votes_by_round(participants, len(room["dilemmaBaseIds"]))
        awards = compute_party_room_awards(participant_averages_by_index, votes_by_round, participant_choices_by_index)
        controversial_index = awards["mostControversialRoundIndex"]
        if controversial_index is not None:
            base_id = room["dilemmaBaseIds"][controversial_index]
            dilemma_item = decimal_to_native(
                table.get_item(Key={"_id": f"{base_id}-{language}"}).get("Item") or {}
            )
            round_tally = votes_by_round[controversial_index]
            awards["mostControversialDilemma"] = {
                "roundIndex": controversial_index,
                "dilemma": dilemma_item.get("dilemma"),
                "firstAnswer": dilemma_item.get("firstAnswer"),
                "secondAnswer": dilemma_item.get("secondAnswer"),
                # Same naming as the live "reveal" phase's roundResult.
                "firstVotes": round_tally["first"],
                "secondVotes": round_tally["second"],
            }
        response["awards"] = awards

        # TASK-123 AC9: generate once, cache on the room, never regenerate.
        group_verdict = room.get("groupVerdict")
        if not group_verdict:
            group_verdict = _generate_party_group_verdict(
                [a["name"] for a in archetypes_by_index.values()], language,
            )
            try:
                party_rooms_table.update_item(
                    Key={"roomCode": room_code},
                    UpdateExpression="SET groupVerdict = :verdict",
                    ConditionExpression="attribute_not_exists(groupVerdict)",
                    ExpressionAttributeValues={":verdict": group_verdict},
                )
            except ClientError as error:
                if error.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
                    # Another concurrent request already cached one first;
                    # use that instead of two different verdicts flip-flopping.
                    group_verdict = get_room_or_404(room_code).get("groupVerdict", group_verdict)
                else:
                    raise
        response["groupVerdict"] = group_verdict

    return response


@app.get("/health")
async def health_check():
    """
    Comprehensive health check endpoint
    Verifies connectivity to critical dependencies
    """
    health_status = {
        "status": "healthy",
        "timestamp": int(time.time()),
        "checks": {}
    }

    # Check DynamoDB connectivity
    try:
        table.meta.client.describe_table(TableName=DYNAMODB_TABLE)
        health_status["checks"]["dynamodb_dilemmas"] = "ok"
    except Exception as e:
        health_status["checks"]["dynamodb_dilemmas"] = f"error: {str(e)}"
        health_status["status"] = "unhealthy"

    # Check Analytics Table connectivity
    try:
        analytics_table.meta.client.describe_table(TableName=ANALYTICS_TABLE)
        health_status["checks"]["dynamodb_analytics"] = "ok"
    except Exception as e:
        health_status["checks"]["dynamodb_analytics"] = f"error: {str(e)}"
        health_status["status"] = "degraded"

    # Check idempotent product event table connectivity
    try:
        product_events_table.meta.client.describe_table(TableName=PRODUCT_EVENTS_TABLE)
        health_status["checks"]["dynamodb_product_events"] = "ok"
    except Exception as e:
        health_status["checks"]["dynamodb_product_events"] = f"error: {str(e)}"
        health_status["status"] = "degraded"

    # Check SSM Parameter Store connectivity
    try:
        ssm_client.get_parameter(Name=GROQ_API_KEY_SSM_NAME, WithDecryption=True)
        health_status["checks"]["ssm_parameter"] = "ok"
    except Exception as e:
        health_status["checks"]["ssm_parameter"] = f"error: {str(e)}"
        health_status["status"] = "degraded"

    # Set appropriate HTTP status code
    status_code = 200 if health_status["status"] == "healthy" else 503

    return health_status

@app.post("/analytics/events", status_code=202)
async def ingest_analytics_events(batch: AnalyticsBatchRequest, request: Request):
    """Store a bounded batch of privacy-safe, idempotent product events."""
    header_anonymous_id = request.headers.get("X-Anonymous-User-Id")

    if header_anonymous_id and any(
        event.anonymousUserId != header_anonymous_id for event in batch.events
    ):
        raise HTTPException(status_code=400, detail="Anonymous identity mismatch")

    expiration_time = int(time.time()) + (90 * 24 * 60 * 60)
    user_agent = request.headers.get("User-Agent", "")[:200]
    network_fingerprint = _network_fingerprint(request.client.host if request.client else None)

    try:
        # eventId is the table key, so retries overwrite the same item instead of
        # inflating funnel counts. batch_writer also retries unprocessed writes.
        with product_events_table.batch_writer(overwrite_by_pkeys=["eventId"]) as writer:
            for event in batch.events:
                item = {
                    "eventId": event.eventId,
                    "actionType": event.eventName,
                    "occurredAt": event.occurredAt,
                    "anonymousUserId": event.anonymousUserId,
                    "sessionId": event.sessionId,
                    "schemaVersion": event.schemaVersion,
                    "platform": event.platform,
                    "appVersion": event.appVersion,
                    "language": event.language.lower(),
                    "timeZone": event.timeZone,
                    "expirationTime": expiration_time,
                    "properties": json.dumps(event.properties, separators=(",", ":")),
                }
                if not event.timeZone:
                    item.pop("timeZone")
                if event.installId:
                    item["installId"] = event.installId
                if event.referrer:
                    item["referrer"] = event.referrer
                if event.utm:
                    item["utm"] = json.dumps(event.utm, separators=(",", ":"))
                if user_agent:
                    item["userAgent"] = user_agent
                if network_fingerprint:
                    item["networkFingerprint"] = network_fingerprint
                writer.put_item(Item=item)

        return {"accepted": len(batch.events)}
    except Exception as e:
        logger.error(f"Failed to ingest analytics batch: {str(e)}")
        raise HTTPException(status_code=503, detail="Analytics ingestion unavailable")

def infer_platform(user_agent: str) -> str:
    """Best-effort source for historical rows that predate explicit platform data."""
    normalized = (user_agent or "").lower()
    if not normalized:
        return "unknown"
    if "android" in normalized and ("; wv" in normalized or "capacitor" in normalized):
        return "android"
    # Android/iOS browsers still belong to the web product surface.
    return "web"


KNOWN_AUTOMATION_SIGNATURES = (
    "bot",
    "spider",
    "crawler",
    "curl/",
    "wget/",
    "python-requests",
    "aiohttp",
    "httpx/",
    "headlesschrome",
    "phantomjs",
    "selenium",
    "playwright",
    "puppeteer",
)


def _has_known_automation_signature(user_agent: str) -> bool:
    normalized = (user_agent or "").lower()
    return any(signature in normalized for signature in KNOWN_AUTOMATION_SIGNATURES)

def _parse_event_properties(value: Any) -> Dict[str, Any]:
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except (TypeError, json.JSONDecodeError):
            return {}
    if not isinstance(value, dict):
        return {}
    # The dashboard intentionally excludes nested values and identifiers that may
    # accidentally contain personal data. The raw rows remain in DynamoDB.
    safe_properties = {}
    blocked_tokens = {"email", "phone", "name", "address", "token", "secret", "password", "ip"}
    blocked_keys = {"dilemma_text", "answer_text", "ip_address", "hashed_ip", "user_agent"}
    for key, property_value in value.items():
        normalized_key = str(key).lower()
        if normalized_key in blocked_keys or set(normalized_key.split("_")).intersection(blocked_tokens):
            continue
        if isinstance(property_value, (str, int, float, bool)) or property_value is None:
            safe_properties[str(key)[:64]] = (
                property_value[:160] if isinstance(property_value, str) else property_value
            )
    return safe_properties

def normalize_analytics_event(item: Dict[str, Any], source: str) -> Dict[str, Any]:
    """Normalize both DynamoDB event generations into one dashboard contract."""
    is_product_event = source == "product"
    occurred_at = int(item.get("occurredAt" if is_product_event else "timestamp", 0) or 0)
    stored_platform = str(item.get("platform", "unknown")).lower()
    if stored_platform in {"web", "android", "ios"}:
        platform = stored_platform
        platform_resolution = "exact"
    elif is_product_event:
        platform = "unknown"
        platform_resolution = "unknown"
    else:
        platform = infer_platform(str(item.get("userAgent", "")))
        platform_resolution = "inferred" if platform != "unknown" else "unknown"

    session_id = str(item.get("sessionId", "unknown"))
    anonymous_user_id = str(item.get("anonymousUserId", ""))
    time_zone = _normalize_time_zone(str(item.get("timeZone", ""))) or "unknown"
    identity = anonymous_user_id or f"legacy-session:{session_id}"
    network_fingerprint = str(item.get("networkFingerprint", ""))
    legacy_network_hash = str(item.get("hashedIp", ""))
    if network_fingerprint:
        risk_identity = f"network:{network_fingerprint}"
        risk_identity_source = "network"
    elif legacy_network_hash:
        risk_identity = f"legacy-network:{legacy_network_hash}"
        risk_identity_source = "legacy_network"
    elif anonymous_user_id:
        risk_identity = f"anonymous:{anonymous_user_id}"
        risk_identity_source = "anonymous"
    else:
        risk_identity = f"session:{session_id}"
        risk_identity_source = "session"

    return {
        "source": source,
        "eventName": str(item.get("actionType", "unknown")),
        "occurredAt": occurred_at,
        "anonymousUserId": anonymous_user_id,
        "sessionId": session_id,
        "identity": identity,
        "riskIdentity": risk_identity,
        "riskIdentitySource": risk_identity_source,
        "knownAutomationSignature": _has_known_automation_signature(
            str(item.get("userAgent", ""))
        ),
        "platform": platform,
        "platformResolution": platform_resolution,
        "language": str(item.get("language", "unknown")).lower(),
        "timeZone": time_zone,
        "appVersion": str(item.get("appVersion", "unknown")),
        "properties": _parse_event_properties(
            item.get("properties") if is_product_event else item.get("actionData")
        ),
    }

def _scan_all_rows(dynamodb_table) -> list[Dict[str, Any]]:
    rows = []
    scan_kwargs = {}
    while True:
        response = dynamodb_table.scan(**scan_kwargs)
        rows.extend(response.get("Items", []))
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break
        scan_kwargs["ExclusiveStartKey"] = last_key
    return rows

def _masked_identity(identity: str) -> str:
    return hashlib.sha256(identity.encode("utf-8")).hexdigest()[:10]

def _count_registered_users() -> int:
    """Count real user records in users_table, excluding anon# claim-lock rows."""
    total = 0
    scan_kwargs = {
        "Select": "COUNT",
        "FilterExpression": "attribute_exists(createdAt) AND attribute_not_exists(claimedAt)",
    }
    while True:
        response = users_table.scan(**scan_kwargs)
        total += response.get("Count", 0)
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break
        scan_kwargs["ExclusiveStartKey"] = last_key
    return total


ABUSE_MONITORING_THRESHOLDS = {
    "watchPeakEventsPerMinute": 15,
    "suspiciousPeakEventsPerMinute": 30,
    "watchEventsPerPeriod": 100,
    "watchEventsPerDay": 250,
    "suspiciousEventsPerDay": 500,
    "rapidReplayDilemmas": 50,
    "rapidReplayMaxResults": 1,
    "rapidReplayMaxMinutes": 30,
}


def build_abuse_monitoring(events: list[Dict[str, Any]]) -> Dict[str, Any]:
    """Flag anomalous patterns without returning IPs, user agents, or stable IDs."""
    grouped = defaultdict(list)
    for event in events:
        grouped[event["riskIdentity"]].append(event)

    rows = []
    for risk_identity, identity_events in grouped.items():
        event_counts = Counter(event["eventName"] for event in identity_events)
        minute_counts = Counter(event["occurredAt"] // 60000 for event in identity_events)
        day_counts = Counter(
            datetime.fromtimestamp(event["occurredAt"] / 1000, tz=timezone.utc).date().isoformat()
            for event in identity_events
        )
        timestamps = [event["occurredAt"] for event in identity_events]
        peak_per_minute = max(minute_counts.values(), default=0)
        peak_per_day = max(day_counts.values(), default=0)
        span_minutes = round((max(timestamps) - min(timestamps)) / 60000, 1) if timestamps else 0
        total_events = len(identity_events)
        reasons = []

        if any(event["knownAutomationSignature"] for event in identity_events):
            reasons.append("known_automation_signature")
        if peak_per_minute >= ABUSE_MONITORING_THRESHOLDS["suspiciousPeakEventsPerMinute"]:
            reasons.append("high_burst")
        elif peak_per_minute >= ABUSE_MONITORING_THRESHOLDS["watchPeakEventsPerMinute"]:
            reasons.append("elevated_burst")
        if peak_per_day >= ABUSE_MONITORING_THRESHOLDS["suspiciousEventsPerDay"]:
            reasons.append("high_daily_volume")
        elif peak_per_day >= ABUSE_MONITORING_THRESHOLDS["watchEventsPerDay"]:
            reasons.append("elevated_daily_volume")
        if (
            event_counts["dilemma_fetched"] >= ABUSE_MONITORING_THRESHOLDS["rapidReplayDilemmas"]
            and event_counts["results_analyzed"] <= ABUSE_MONITORING_THRESHOLDS["rapidReplayMaxResults"]
            and span_minutes <= ABUSE_MONITORING_THRESHOLDS["rapidReplayMaxMinutes"]
        ):
            reasons.append("rapid_replay_without_results")
        if total_events >= ABUSE_MONITORING_THRESHOLDS["watchEventsPerPeriod"]:
            reasons.append("high_period_volume")

        suspicious_reasons = {
            "known_automation_signature",
            "high_burst",
            "high_daily_volume",
            "rapid_replay_without_results",
        }
        if suspicious_reasons.intersection(reasons):
            risk = "suspicious"
        elif reasons:
            risk = "watch"
        else:
            risk = "normal"

        rows.append({
            "identity": _masked_identity(risk_identity),
            "identitySource": identity_events[0]["riskIdentitySource"],
            "risk": risk,
            "reasons": reasons,
            "events": total_events,
            "peakEventsPerMinute": peak_per_minute,
            "peakEventsPerDay": peak_per_day,
            "activeMinutes": span_minutes,
            "sessions": len({event["sessionId"] for event in identity_events}),
            "platform": Counter(event["platform"] for event in identity_events).most_common(1)[0][0],
            "dilemmasFetched": event_counts["dilemma_fetched"],
            "votesCast": event_counts["vote_cast"],
            "resultsAnalyzed": event_counts["results_analyzed"],
            "lastSeen": max(timestamps, default=0),
        })

    anomalies = [row for row in rows if row["risk"] != "normal"]
    risk_order = {"suspicious": 2, "watch": 1, "normal": 0}
    anomalies.sort(
        key=lambda row: (risk_order[row["risk"]], row["peakEventsPerMinute"], row["events"]),
        reverse=True,
    )
    return {
        "summary": {
            "observedIdentities": len(rows),
            "watch": sum(row["risk"] == "watch" for row in rows),
            "suspicious": sum(row["risk"] == "suspicious" for row in rows),
            "maxPeakEventsPerMinute": max(
                (row["peakEventsPerMinute"] for row in rows),
                default=0,
            ),
        },
        "thresholds": ABUSE_MONITORING_THRESHOLDS,
        "anomalies": anomalies[:25],
        "assessment": "Signals require human review and are not proof of automation.",
    }

def build_analytics_overview(
    legacy_rows: list[Dict[str, Any]],
    product_rows: list[Dict[str, Any]],
    days: int,
    now_ms: Optional[int] = None,
    platform: str = "all",
    registered_users: Optional[int] = None,
) -> Dict[str, Any]:
    """Build privacy-safe aggregates used by both the web and Android dashboard."""
    now_ms = now_ms or int(time.time() * 1000)
    end_date = datetime.fromtimestamp(now_ms / 1000, tz=timezone.utc).date()
    start_date = end_date - timedelta(days=days - 1)
    cutoff_ms = int(datetime(
        start_date.year,
        start_date.month,
        start_date.day,
        tzinfo=timezone.utc,
    ).timestamp() * 1000)
    events = [
        normalize_analytics_event(row, source)
        for source, rows in (("legacy", legacy_rows), ("product", product_rows))
        for row in rows
    ]
    events = [event for event in events if cutoff_ms <= event["occurredAt"] <= now_ms]
    if platform != "all":
        events = [event for event in events if event["platform"] == platform]

    event_counts = Counter(event["eventName"] for event in events)
    source_counts = Counter(event["source"] for event in events)
    language_counts = Counter(event["language"] for event in events)
    time_zone_counts = Counter(event["timeZone"] for event in events)
    app_version_counts = Counter(event["appVersion"] for event in events)
    platform_counts = Counter(event["platform"] for event in events)
    platform_resolution_counts = Counter(event["platformResolution"] for event in events)
    sessions = {event["sessionId"] for event in events if event["sessionId"] != "unknown"}
    identities = {event["identity"] for event in events}
    anonymous_users = {event["anonymousUserId"] for event in events if event["anonymousUserId"]}

    daily = {}
    for offset in range(days):
        date_key = (start_date + timedelta(days=offset)).isoformat()
        daily[date_key] = {
            "date": date_key,
            "events": 0,
            "sessions": set(),
            "users": set(),
            "web": 0,
            "android": 0,
            "ios": 0,
            "unknown": 0,
        }

    platform_details = defaultdict(lambda: Counter({"total": 0, "exact": 0, "inferred": 0, "unknown": 0}))
    dilemma_counts = Counter()
    funnel_definitions = [
        ("test_started", {"test_started", "dilemma_fetched"}),
        ("answered", {"answer_selected", "vote_cast"}),
        ("test_completed", {"test_completed", "results_analyzed"}),
        ("result_viewed", {"result_viewed", "results_analyzed"}),
        ("shared", {"share_clicked"}),
    ]
    funnel_identities = {key: set() for key, _ in funnel_definitions}

    for event in events:
        day_key = datetime.fromtimestamp(event["occurredAt"] / 1000, tz=timezone.utc).date().isoformat()
        if day_key in daily:
            daily[day_key]["events"] += 1
            daily[day_key]["sessions"].add(event["sessionId"])
            daily[day_key]["users"].add(event["identity"])
            daily[day_key][event["platform"]] += 1

        details = platform_details[event["platform"]]
        details["total"] += 1
        details[event["platformResolution"]] += 1

        dilemma_id = event["properties"].get("dilemma_id")
        if dilemma_id:
            dilemma_counts[str(dilemma_id)] += 1

        for stage_key, event_names in funnel_definitions:
            if event["eventName"] in event_names:
                funnel_identities[stage_key].add(event["identity"])

    daily_rows = []
    for value in daily.values():
        daily_rows.append({
            **value,
            "sessions": len(value["sessions"]),
            "users": len(value["users"]),
        })

    funnel = []
    previous_count = None
    for stage_key, _ in funnel_definitions:
        count = len(funnel_identities[stage_key])
        funnel.append({
            "stage": stage_key,
            "users": count,
            "fromPreviousPct": (
                round((count / previous_count) * 100, 1) if previous_count else None
            ),
        })
        previous_count = count

    total_events = len(events)
    exact_events = platform_resolution_counts["exact"]
    anonymous_events = sum(1 for event in events if event["anonymousUserId"])
    time_zone_events = sum(1 for event in events if event["timeZone"] != "unknown")
    recent_events = []
    for event in sorted(events, key=lambda row: row["occurredAt"], reverse=True)[:60]:
        recent_events.append({
            "occurredAt": event["occurredAt"],
            "eventName": event["eventName"],
            "source": event["source"],
            "platform": event["platform"],
            "platformResolution": event["platformResolution"],
            "language": event["language"],
            "appVersion": event["appVersion"],
            "identity": _masked_identity(event["identity"]),
            "properties": event["properties"],
        })
    abuse_monitoring = build_abuse_monitoring(events)

    return {
        "generatedAt": now_ms,
        "period": {"days": days, "from": cutoff_ms, "to": now_ms, "platform": platform},
        "summary": {
            "totalEvents": total_events,
            "activeIdentities": len(identities),
            "knownAnonymousUsers": len(anonymous_users),
            "uniqueSessions": len(sessions),
            "registeredUsers": registered_users,
        },
        "sourceCounts": dict(source_counts),
        "platformCounts": dict(platform_counts),
        "platformBreakdown": [
            {"platform": platform, **dict(platform_details[platform])}
            for platform in ("web", "android", "ios", "unknown")
        ],
        "languageCounts": dict(language_counts),
        "timeZoneCounts": dict(time_zone_counts),
        "appVersionCounts": dict(app_version_counts),
        "eventCounts": [
            {"eventName": name, "count": count}
            for name, count in event_counts.most_common()
        ],
        "daily": daily_rows,
        "funnel": funnel,
        "topDilemmas": [
            {"dilemmaId": dilemma_id, "events": count}
            for dilemma_id, count in dilemma_counts.most_common(12)
        ],
        "recentEvents": recent_events,
        "abuseMonitoring": abuse_monitoring,
        "dataQuality": {
            "exactPlatformCoveragePct": round((exact_events / total_events) * 100, 1) if total_events else 0,
            "anonymousIdentityCoveragePct": round((anonymous_events / total_events) * 100, 1) if total_events else 0,
            "timeZoneCoveragePct": round((time_zone_events / total_events) * 100, 1) if total_events else 0,
            "platformResolution": dict(platform_resolution_counts),
            "historicalPlatformIsEstimated": platform_resolution_counts["inferred"] > 0,
        },
    }

@app.get("/admin/analytics/overview")
async def analytics_overview(
    request: Request,
    days: int = Query(default=30, ge=1, le=90),
    platform: str = Query(default="all", pattern=r"^(all|web|android|ios|unknown)$"),
):
    """Aggregate legacy and product analytics without returning raw identifiers."""
    require_analytics_admin(request)

    cache_key = (days, platform)
    cached = _analytics_overview_cache.get(cache_key)
    if cached and (time.time() - cached["createdAt"]) < 60:
        return cached["value"]

    try:
        legacy_rows = _scan_all_rows(analytics_table)
        try:
            product_rows = _scan_all_rows(product_events_table)
        except ClientError as error:
            if error.response.get("Error", {}).get("Code") != "ResourceNotFoundException":
                raise
            logger.warning("Product events table is not deployed yet; showing legacy analytics only")
            product_rows = []

        try:
            registered_users = _count_registered_users()
        except ClientError as error:
            logger.warning("Unable to count registered users: %s", str(error))
            registered_users = None

        overview = build_analytics_overview(
            legacy_rows, product_rows, days, platform=platform, registered_users=registered_users,
        )
        _analytics_overview_cache[cache_key] = {"createdAt": time.time(), "value": overview}
        return overview
    except ClientError as error:
        logger.error("Unable to aggregate analytics: %s", str(error))
        raise HTTPException(status_code=503, detail="Analytics data is temporarily unavailable")

@app.post("/vote")
async def vote(vote_request: VoteRequest, request: Request):
    """
    Record a vote for a dilemma

    - **_id**: The dilemma ID
    - **vote**: Either 'yes' or 'no'
    """
    try:
        dilemma_id = vote_request.id
        vote_type = vote_request.vote.lower()

        # Validate vote type
        if vote_type not in ['yes', 'no']:
            raise HTTPException(
                status_code=400,
                detail="Invalid vote type. Must be 'yes' or 'no'."
            )

        # Determine which count to increment
        count_attribute = 'yesCount' if vote_type == 'yes' else 'noCount'

        # Update the vote count in DynamoDB
        response = table.update_item(
            Key={'_id': dilemma_id},
            UpdateExpression=f'SET {count_attribute} = if_not_exists({count_attribute}, :start) + :inc',
            ExpressionAttributeValues={
                ':inc': 1,
                ':start': 0
            },
            ReturnValues='UPDATED_NEW'
        )

        logger.info(f"Successfully incremented {count_attribute} for dilemma_id: {dilemma_id}")

        # Track analytics event
        session_id = extract_session_id(request)
        track_analytics_event(
            session_id=session_id,
            action_type="vote_cast",
            action_data={
                "dilemma_id": dilemma_id,
                "vote_type": vote_type
            },
            user_agent=request.headers.get("User-Agent"),
            ip_address=request.client.host if request.client else None,
            **extract_client_analytics_context(request),
        )

        return {
            "message": f"Successfully recorded your '{vote_type}' vote.",
            "updated": decimal_to_native(response.get('Attributes', {}))
        }

    except Exception as e:
        logger.error(f"Error in /vote: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/get-dilemma", response_model=DilemmaResponse, response_model_by_alias=True)
async def get_dilemma(request: Request, language: str = "en", exclude: str = ""):
    """
    Get a random dilemma from DynamoDB, excluding already seen dilemmas

    Returns a random dilemma with all its attributes in the specified language.

    - **language**: Language code (e.g., 'en', 'it')
    - **exclude**: Comma-separated list of dilemma IDs to exclude (e.g., 'id1,id2,id3')
    """
    try:
        # Validate language parameter
        if not language or len(language) > 10 or not language.isalpha():
            raise HTTPException(status_code=400, detail="Invalid language parameter")

        # Parse excluded IDs
        excluded_ids = set()
        if exclude:
            # Split by comma and clean up
            excluded_ids = set(id.strip() for id in exclude.split(',') if id.strip())
            # Limit to prevent abuse
            if len(excluded_ids) > 1000:
                raise HTTPException(status_code=400, detail="Too many excluded IDs")

        # Scan DynamoDB for all items with the specified language
        response = table.scan(
            FilterExpression='attribute_exists(#lang) AND #lang = :language',
            ExpressionAttributeNames={
                '#lang': 'language'
            },
            ExpressionAttributeValues={
                ':language': language
            }
        )

        items = response.get('Items', [])

        if not items:
            logger.warning(f"No dilemmas found for language: {language}")
            raise HTTPException(status_code=404, detail=f"No dilemmas found for language: {language}")

        # Filter out excluded dilemmas
        available_items = [item for item in items if item.get('_id') not in excluded_ids]

        # If all dilemmas have been seen, reset and use all dilemmas
        if not available_items:
            logger.info(f"All dilemmas seen for language {language}, resetting pool")
            available_items = items

        # Select a random dilemma
        import random
        dilemma = random.choice(available_items)

        # Convert Decimal types to native Python types
        dilemma = decimal_to_native(dilemma)

        # Ensure all required fields have default values
        dilemma.setdefault('yesCount', 0)
        dilemma.setdefault('noCount', 0)

        logger.info(f"Retrieved dilemma: {dilemma.get('_id')} in language: {language}")

        # Track analytics event
        session_id = extract_session_id(request)
        track_analytics_event(
            session_id=session_id,
            action_type="dilemma_fetched",
            action_data={
                "dilemma_id": dilemma.get('_id'),
                "source": "database"
            },
            language=language,
            user_agent=request.headers.get("User-Agent"),
            ip_address=request.client.host if request.client else None,
            **extract_client_analytics_context(request),
        )

        return dilemma

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /get-dilemma: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/generate-dilemma")
async def generate_dilemma(request: Request, language: str = "en"):
    """
    Generate a new dilemma using Groq AI API, inspired by existing dilemmas from DynamoDB

    Returns a newly generated ethical dilemma in the specified language
    """
    try:
        # Validate language parameter
        if not language or len(language) > 10 or not language.isalpha():
            raise HTTPException(status_code=400, detail="Invalid language parameter")

        api_key = get_groq_api_key()

        # Fetch sample dilemmas from DynamoDB to use as style/context examples
        sample_dilemmas = []
        try:
            response = table.scan(
                FilterExpression='attribute_exists(#lang) AND #lang = :language',
                ExpressionAttributeNames={
                    '#lang': 'language'
                },
                ExpressionAttributeValues={
                    ':language': language
                },
                Limit=5  # Get up to 5 sample dilemmas
            )
            
            sample_items = response.get('Items', [])
            sample_dilemmas = [decimal_to_native(item) for item in sample_items]
            logger.info(f"Retrieved {len(sample_dilemmas)} sample dilemmas for language: {language}")
        except Exception as e:
            logger.warning(f"Could not fetch sample dilemmas: {str(e)}")
            sample_dilemmas = []

        # Build the examples string from database dilemmas
        examples_text = ""
        if sample_dilemmas:
            examples_text = "\n\nHere are some examples of the style and complexity I'm looking for:\n"
            for i, dilemma in enumerate(sample_dilemmas[:3], 1):
                examples_text += f"\nExample {i}:\n"
                examples_text += f'{{"dilemma": "{dilemma.get("dilemma", "")[:100]}...", '
                examples_text += f'"firstAnswer": "{dilemma.get("firstAnswer", "")}", '
                examples_text += f'"secondAnswer": "{dilemma.get("secondAnswer", "")}", '
                examples_text += f'"teaseOption1": "{dilemma.get("teaseOption1", "")}", '
                examples_text += f'"teaseOption2": "{dilemma.get("teaseOption2", "")}"}}\n'

        # Define prompts for different languages
        if language == "it":
            prompt_content = (
                'Genera un NUOVO e UNICO dilemma etico (40-80 parole) con due opzioni difficili. '
                'IMPORTANTE: Crea un dilemma completamente nuovo e diverso da quelli che hai visto. '
                'Non copiare o modificare gli esempi forniti - crea qualcosa di originale. '
                'Ogni opzione dovrebbe presentare un punto di vista valido ma contrastante, incoraggiando la riflessione. '
                'Aggiungi una leggera presa in giro per ogni opzione per rendere il dilemma più coinvolgente. '
                'Assicurati equilibrio e complessità, evitando scelte semplificate. '
                'Rispondi rigorosamente in formato JSON con la seguente struttura: '
                '{"dilemma": "...", "firstAnswer": "...", "secondAnswer": "...", '
                '"teaseOption1": "...", "teaseOption2": "..."} '
                f'{examples_text}'
                'FORMATTA LA RISPOSTA RIGOROSAMENTE NEL JSON CHE HO FORNITO! NIENT\'ALTRO CHE IL JSON DOVREBBE ESSERE NELLA TUA RISPOSTA. '
                'ASSICURATI CHE IL DILEMMA SIA COMPLETAMENTE NUOVO E NON UNA VARIAZIONE DEGLI ESEMPI!'
            )
        else:
            prompt_content = (
                'Generate a NEW and UNIQUE ethical dilemma (40-80 words) with two challenging options. '
                'IMPORTANT: Create a completely new and different dilemma from the ones you\'ve seen. '
                'Do not copy or modify the provided examples - create something original. '
                'Each option should present a valid but contrasting viewpoint, encouraging reflection. '
                'Add a light tease for each option to make the dilemma more engaging. '
                'Ensure balance and complexity, avoiding oversimplified choices. '
                'Respond strictly in JSON format with the following structure: '
                '{"dilemma": "...", "firstAnswer": "...", "secondAnswer": "...", '
                '"teaseOption1": "...", "teaseOption2": "..."} '
                f'{examples_text}'
                'FORMAT THE ANSWER STRICTLY IN THE JSON I PROVIDED! NOTHING BUT THE JSON SHOULD BE IN YOUR ANSWER. '
                'ENSURE THE DILEMMA IS COMPLETELY NEW AND NOT A VARIATION OF THE EXAMPLES!'
            )

        payload = {
            "model": "llama-3.1-8b-instant",  # Will be overridden by fallback function
            "messages": [
                {
                    "role": "user",
                    "content": prompt_content
                }
            ],
        }

        logger.info("Sending request to Groq API with fallback chain")
        api_response_json = call_groq_api_with_fallback(
            payload=payload,
            api_key=api_key,
            operation="Generate dilemma"
        )

        logger.info("Successfully generated dilemma from Groq API")

        # Track analytics event
        session_id = extract_session_id(request)
        track_analytics_event(
            session_id=session_id,
            action_type="dilemma_generated",
            action_data={
                "source": "ai_generated",
                "model": api_response_json.get("model", "unknown")
            },
            language=language,
            user_agent=request.headers.get("User-Agent"),
            ip_address=request.client.host if request.client else None,
            **extract_client_analytics_context(request),
        )

        return api_response_json

    except requests.exceptions.RequestException as e:
        logger.error(f"Request error in /generate-dilemma: {str(e)}")
        raise HTTPException(status_code=502, detail="Failed to connect to external API")
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error in /generate-dilemma: {str(e)}")
        raise HTTPException(status_code=500, detail="Invalid JSON response from external API")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /generate-dilemma: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/analyze-results")
async def analyze_results(analyze_request: AnalyzeResultsRequest, request: Request, language: str = "en"):
    """
    Analyze user's moral profile and generate a summary using Groq AI API

    Returns an AI-generated analysis of the user's moral choices in the specified language
    """
    try:
        # Validate language parameter
        if not language or len(language) > 10 or not language.isalpha():
            raise HTTPException(status_code=400, detail="Invalid language parameter")

        # Validate request data
        if not analyze_request.answers or len(analyze_request.answers) == 0:
            raise HTTPException(status_code=400, detail="No answers provided")
        if len(analyze_request.answers) > 100:
            raise HTTPException(status_code=400, detail="Too many answers provided")

        api_key = get_groq_api_key()

        # Calculate averages and the deterministic archetype match. This never
        # depends on Groq: archetype assignment must hold even when the AI
        # analysis below fails or is unavailable.
        averages = compute_dimension_averages(analyze_request.answers)
        archetype = assign_archetype(averages, language=language)

        # Create a summary of the moral profile
        profile_summary = ", ".join([f"{key}: {value}" for key, value in averages.items()])

        # Create detailed summary of dilemmas and choices if available
        if language == "it":
            dilemmas_summary = ""
            if analyze_request.dilemmasWithChoices and len(analyze_request.dilemmasWithChoices) > 0:
                dilemmas_summary = "\n\nEcco i dilemmi specifici che hanno affrontato e le loro scelte:\n"
                for i, d in enumerate(analyze_request.dilemmasWithChoices, 1):
                    dilemmas_summary += f"\n{i}. Dilemma: {d.dilemma}\n"
                    dilemmas_summary += f"   Opzioni: '{d.firstAnswer}' oppure '{d.secondAnswer}'\n"
                    dilemmas_summary += f"   Hanno scelto: '{d.chosenAnswer}'\n"

            prompt_content = (
                f'Stai analizzando il profilo morale di una persona basandoti sulle sue risposte a dilemmi etici. '
                f'Ecco i loro punteggi medi attraverso diverse categorie morali: {profile_summary}.'
                f'{dilemmas_summary}'
                f'\nUn motore deterministico separato ha gia\' assegnato loro l\'archetipo morale '
                f'"{archetype["name"]}", descritto cosi\': {archetype["description"]}'
                f'\nGenera un\'analisi ponderata, leggermente oscura e inquietante che: '
                f'1) Fa riferimento alle loro scelte SPECIFICHE nei dilemmi che hanno affrontato '
                f'2) Identifica i loro tratti morali dominanti basandosi sulle loro decisioni effettive '
                f'3) Spiega cosa rivelano le loro scelte sul loro carattere e priorità '
                f'4) Fornisce intuizioni su potenziali punti ciechi morali o punti di forza '
                f'5) Usa un tono che si adatta al tema "Moral Torture Machine" - misterioso, leggermente inquietante, ma perspicace '
                f'6) Si legge come un\'elaborazione naturale dell\'archetipo "{archetype["name"]}" gia\' assegnato: '
                f'questo testo verra\' mostrato come descrizione direttamente sotto il nome dell\'archetipo, quindi deve essere coerente con esso, non contraddirlo ne\' ripeterne semplicemente la descrizione parola per parola '
                f'Scrivi in seconda persona (rivolgendoti a "tu") e mantieni un tono inquietante e filosofico. '
                f'IMPORTANTE: Basa la tua analisi sulle scelte EFFETTIVE che hanno fatto, non solo sui punteggi numerici. '
                f'VINCOLO CRUCIALE: L\'analisi deve essere di MASSIMO 170 parole. Sii conciso e incisivo. '
                f'Non usare il formato JSON, restituisci solo il testo dell\'analisi direttamente.'
            )
        else:
            dilemmas_summary = ""
            if analyze_request.dilemmasWithChoices and len(analyze_request.dilemmasWithChoices) > 0:
                dilemmas_summary = "\n\nHere are the specific dilemmas they faced and their choices:\n"
                for i, d in enumerate(analyze_request.dilemmasWithChoices, 1):
                    dilemmas_summary += f"\n{i}. Dilemma: {d.dilemma}\n"
                    dilemmas_summary += f"   Options: '{d.firstAnswer}' or '{d.secondAnswer}'\n"
                    dilemmas_summary += f"   They chose: '{d.chosenAnswer}'\n"

            prompt_content = (
                f'You are analyzing a person\'s moral profile based on their responses to ethical dilemmas. '
                f'Here are their average scores across different moral categories: {profile_summary}.'
                f'{dilemmas_summary}'
                f'\nA separate deterministic engine has already assigned them the moral archetype '
                f'"{archetype["name"]}", described like this: {archetype["description"]}'
                f'\nGenerate a thoughtful, slightly dark and creepy analysis that: '
                f'1) References their SPECIFIC choices in the dilemmas they faced '
                f'2) Identifies their dominant moral traits based on their actual decisions '
                f'3) Explains what their choices reveal about their character and priorities '
                f'4) Provides insight into potential moral blind spots or strengths '
                f'5) Uses a tone that fits the "Moral Torture Machine" theme - mysterious, slightly unsettling, but insightful '
                f'6) Reads as a natural elaboration of the already-assigned "{archetype["name"]}" archetype: '
                f'this text will be shown as the description directly under the archetype\'s name, so it must stay '
                f'consistent with it rather than contradicting it or simply repeating its description verbatim '
                f'Write in second person (addressing "you") and maintain a haunting, philosophical tone. '
                f'IMPORTANT: Base your analysis on the ACTUAL choices they made, not just the numerical scores. '
                f'CRITICAL CONSTRAINT: The analysis must be MAXIMUM 170 words. Be concise and impactful. '
                f'Do not use JSON format, just return the analysis text directly.'
            )

        payload = {
            "model": "llama-3.1-8b-instant",  # Will be overridden by fallback function
            "messages": [
                {
                    "role": "user",
                    "content": prompt_content
                }
            ],
        }

        # The AI text is an enrichment, never the source of the archetype
        # (ADR-003/ADR-025): any failure past this point must still return the
        # already-computed archetype/averages in the body, not just an empty
        # error, so the frontend's core growth loop (Challenge CTA, share
        # cards) never depends on Groq being reachable (TASK-143).
        try:
            logger.info("Sending request to Groq API for results analysis with fallback chain")
            result = call_groq_api_with_fallback(
                payload=payload,
                api_key=api_key,
                operation="Analyze results"
            )
            analysis_text = result['choices'][0]['message']['content']
            logger.info("Successfully generated analysis from Groq API")
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error in /analyze-results: {str(e)}")
            return JSONResponse(
                status_code=502,
                content={
                    "analysis": None,
                    "averages": averages,
                    "archetype": archetype,
                    "aiUnavailable": True,
                    "error": "Failed to connect to external API",
                },
            )
        except HTTPException as e:
            logger.error(f"AI analysis failed in /analyze-results: {e.detail}")
            return JSONResponse(
                status_code=e.status_code,
                content={
                    "analysis": None,
                    "averages": averages,
                    "archetype": archetype,
                    "aiUnavailable": True,
                    "error": str(e.detail),
                },
            )
        except (json.JSONDecodeError, KeyError, IndexError) as e:
            logger.error(f"Invalid AI response in /analyze-results: {str(e)}")
            return JSONResponse(
                status_code=502,
                content={
                    "analysis": None,
                    "averages": averages,
                    "archetype": archetype,
                    "aiUnavailable": True,
                    "error": "Invalid response from external API",
                },
            )

        # Track analytics event
        session_id = extract_session_id(request)
        track_analytics_event(
            session_id=session_id,
            action_type="results_analyzed",
            action_data={
                "num_dilemmas": len(analyze_request.answers),
                "averages": averages,
                "archetype_id": archetype["archetypeId"],
                "archetypes_version": archetype["archetypesVersion"],
            },
            language=language,
            user_agent=request.headers.get("User-Agent"),
            ip_address=request.client.host if request.client else None,
            **extract_client_analytics_context(request),
        )

        return {
            "analysis": analysis_text,
            "averages": averages,
            "archetype": archetype,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /analyze-results: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/get-story-flow")
async def get_story_flow(request: Request, language: str = "en", flowId: Optional[str] = None):
    """
    Get a story flow by ID or return a random one for the specified language

    Args:
        language: Language code (default: "en")
        flowId: Optional specific flow ID (without language suffix)

    Returns:
        Complete story flow with all nodes
    """
    try:
        session_id = extract_session_id(request)

        if flowId:
            # Get specific flow
            flow_id_with_lang = f"{flowId}-{language}"
            response = story_flows_table.get_item(Key={"_id": flow_id_with_lang})

            if "Item" not in response:
                logger.warning(f"Story flow not found: {flow_id_with_lang}")
                raise HTTPException(status_code=404, detail="Story flow not found")

            flow = response["Item"]
        else:
            # Get random flow for language
            response = story_flows_table.scan(
                FilterExpression="#lang = :lang",
                ExpressionAttributeNames={"#lang": "language"},
                ExpressionAttributeValues={":lang": language}
            )

            flows = response.get("Items", [])

            if not flows:
                logger.warning(f"No story flows found for language: {language}")
                raise HTTPException(status_code=404, detail="No story flows available")

            # Select random flow
            import random
            flow = random.choice(flows)

        # Track analytics
        track_analytics_event(
            session_id=session_id,
            action_type="story_flow_fetched",
            action_data={
                "flow_id": flow["_id"],
                "flow_title": flow.get("title", ""),
                "language": language
            },
            language=language,
            user_agent=request.headers.get("User-Agent"),
            ip_address=request.client.host if request.client else None,
            **extract_client_analytics_context(request),
        )

        # Convert Decimal to float for JSON serialization
        def decimal_to_float(obj):
            if isinstance(obj, list):
                return [decimal_to_float(i) for i in obj]
            elif isinstance(obj, dict):
                return {k: decimal_to_float(v) for k, v in obj.items()}
            elif isinstance(obj, Decimal):
                return float(obj)
            else:
                return obj

        flow = decimal_to_float(flow)

        logger.info(f"Returning story flow: {flow['_id']}")
        return flow

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /get-story-flow: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/story-node-vote")
async def story_node_vote(vote_request: StoryNodeVoteRequest, request: Request):
    """
    Process a vote on a story node and return the next node

    Args:
        vote_request: Contains flowId, nodeId, and vote (first/second)

    Returns:
        Next node data or completion indicator
    """
    try:
        session_id = extract_session_id(request)

        # Get the flow
        response = story_flows_table.get_item(Key={"_id": vote_request.flowId})

        if "Item" not in response:
            logger.warning(f"Story flow not found: {vote_request.flowId}")
            raise HTTPException(status_code=404, detail="Story flow not found")

        flow = response["Item"]
        nodes = flow.get("nodes", {})

        # Get current node
        current_node = nodes.get(vote_request.nodeId)
        if not current_node:
            logger.warning(f"Node not found: {vote_request.nodeId} in flow {vote_request.flowId}")
            raise HTTPException(status_code=404, detail="Node not found")

        # Determine next node based on vote
        next_node_id = None
        if vote_request.vote == "first":
            next_node_id = current_node.get("nextNodeOnFirst")
        else:  # second
            next_node_id = current_node.get("nextNodeOnSecond")

        # Check if current node is a leaf (end of story)
        is_leaf = current_node.get("isLeaf", False)

        # Get next node data if exists
        next_node = None
        if next_node_id and next_node_id in nodes:
            next_node = nodes[next_node_id]

        # Track analytics
        track_analytics_event(
            session_id=session_id,
            action_type="story_node_vote",
            action_data={
                "flow_id": vote_request.flowId,
                "node_id": vote_request.nodeId,
                "vote": vote_request.vote,
                "next_node_id": next_node_id,
                "is_leaf": is_leaf
            },
            user_agent=request.headers.get("User-Agent"),
            ip_address=request.client.host if request.client else None,
            **extract_client_analytics_context(request),
        )

        # Convert Decimal to float for JSON serialization
        def decimal_to_float(obj):
            if isinstance(obj, list):
                return [decimal_to_float(i) for i in obj]
            elif isinstance(obj, dict):
                return {k: decimal_to_float(v) for k, v in obj.items()}
            elif isinstance(obj, Decimal):
                return float(obj)
            else:
                return obj

        result = {
            "currentNode": decimal_to_float(current_node),
            "nextNodeId": next_node_id,
            "nextNode": decimal_to_float(next_node) if next_node else None,
            "isComplete": is_leaf or next_node is None
        }

        logger.info(f"Processed vote for node {vote_request.nodeId}, next: {next_node_id}")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /story-node-vote: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

# Lambda handler
handler = Mangum(app, lifespan="off")

# For local development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
