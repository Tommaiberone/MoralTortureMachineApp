from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
from collections import Counter, defaultdict, deque
from datetime import datetime, timedelta, timezone
from math import ceil
from threading import Lock
from typing import Optional, Dict, Any
from decimal import Decimal
import json

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
    allow_methods=["GET", "POST", "OPTIONS"],
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

# Model fallback strategy - ordered by rate limits (highest TPD first)
MODEL_FALLBACK_CHAIN = [
    "llama-3.3-70b-versatile",                       # 100K TPD, 12K TPM - High capability
    "openai/gpt-oss-120b",                           # 200K TPD, 8K TPM - High capability
    "qwen/qwen3-32b",                                # 500K TPD, 6K TPM, 60 RPM - High capability
    "meta-llama/llama-4-maverick-17b-128e-instruct", # 500K TPD, 6K TPM - High capability
    "meta-llama/llama-4-scout-17b-16e-instruct",     # 500K TPD, 30K TPM - High capability
    "llama-3.1-8b-instant",                          # 500K TPD, 6K TPM - Medium capability
    "moonshotai/kimi-k2-instruct",                   # 300K TPD, 10K TPM, 60 RPM - Medium capability
    "moonshotai/kimi-k2-instruct-0905",              # 300K TPD, 10K TPM, 60 RPM - Medium capability
    "meta-llama/llama-guard-4-12b",                  # 500K TPD, 15K TPM - Medium capability
    "meta-llama/llama-prompt-guard-2-86m",           # 500K TPD, 15K TPM - Medium capability
    "meta-llama/llama-prompt-guard-2-22m",           # 500K TPD, 15K TPM - Medium capability
    "allam-2-7b",                                    # 500K TPD, 6K TPM - Low capability
    "openai/gpt-oss-20b",                            # 200K TPD, 8K TPM - Low capability
    "groq/compound",                                 # No TPD limit, 70K TPM - Low capability
    "groq/compound-mini",                            # No TPD limit, 70K TPM - Low capability
]

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
table = dynamodb.Table(DYNAMODB_TABLE)
analytics_table = dynamodb.Table(ANALYTICS_TABLE)
story_flows_table = dynamodb.Table(STORY_FLOWS_TABLE)
product_events_table = dynamodb.Table(PRODUCT_EVENTS_TABLE)
ssm_client = boto3.client('ssm', region_name=AWS_REGION)

# Cache for API key (retrieved once at cold start)
_api_key_cache = None
_analytics_fingerprint_secret_cache = None
_analytics_overview_cache = {}
_cognito_jwks_client = None
_burst_windows = defaultdict(deque)
_burst_lock = Lock()
_burst_request_count = 0

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
    return verify_cognito_id_token(token)

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
    claims = verify_cognito_id_token(bearer_token)
    if not _claims_are_admin(claims):
        raise HTTPException(status_code=403, detail="Administrator role required")


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

class StoryNodeVoteRequest(BaseModel):
    flowId: str = Field(..., description="Story flow ID", min_length=1, max_length=100)
    nodeId: str = Field(..., description="Current node ID", min_length=1, max_length=20)
    vote: str = Field(..., description="Vote: 'first' or 'second'", pattern=r'^(first|second)$')

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
            if key not in allowed_keys or not isinstance(item, str) or len(item) > 200:
                raise ValueError("Invalid UTM parameter")
        return value

    @field_validator("properties")
    @classmethod
    def validate_properties(cls, value: Dict[str, Any]) -> Dict[str, Any]:
        forbidden_tokens = {"email", "password", "token", "secret", "ip", "analysis"}
        forbidden_keys = {"dilemma_text", "answer_text", "ip_address", "hashed_ip"}
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
            if isinstance(item, str) and len(item) > 200:
                raise ValueError("Analytics property is too long")

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
    # Sanitize URL by removing query parameters that might contain PII
    sanitized_path = request.url.path
    # Only log safe query parameters (language)
    safe_params = []
    for key, value in request.query_params.items():
        if key in ['language']:
            safe_params.append(f"{key}={value}")
    sanitized_url = f"{sanitized_path}?{'&'.join(safe_params)}" if safe_params else sanitized_path

    logger.info(f"Incoming request: {request.method} {sanitized_url}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
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

    source = _rate_limit_source(request)
    for rule_name, limit in rules:
        allowed, retry_after = _consume_burst_window(f"{rule_name}:{source}", limit)
        if not allowed:
            logger.warning(
                "Burst guard rejected request: path=%s rule=%s retry_after=%s",
                request.url.path,
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

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "Moral Torture Machine API"}

@app.get("/auth/me")
async def authenticated_profile(request: Request):
    """Return the verified caller profile without trusting client-side claims."""
    claims = require_authenticated_user(request)
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

        overview = build_analytics_overview(legacy_rows, product_rows, days, platform=platform)
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

        # Aggregate the answers to compute average values
        aggregated = {}
        for answer in analyze_request.answers:
            for key, value in answer.items():
                aggregated[key] = aggregated.get(key, 0) + value

        # Calculate averages
        num_answers = len(analyze_request.answers)
        averages = {key: round(value / num_answers, 2) for key, value in aggregated.items()}

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
                f'\nGenera un\'analisi ponderata, leggermente oscura e inquietante che: '
                f'1) Fa riferimento alle loro scelte SPECIFICHE nei dilemmi che hanno affrontato '
                f'2) Identifica i loro tratti morali dominanti basandosi sulle loro decisioni effettive '
                f'3) Spiega cosa rivelano le loro scelte sul loro carattere e priorità '
                f'4) Fornisce intuizioni su potenziali punti ciechi morali o punti di forza '
                f'5) Usa un tono che si adatta al tema "Moral Torture Machine" - misterioso, leggermente inquietante, ma perspicace '
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
                f'\nGenerate a thoughtful, slightly dark and creepy analysis that: '
                f'1) References their SPECIFIC choices in the dilemmas they faced '
                f'2) Identifies their dominant moral traits based on their actual decisions '
                f'3) Explains what their choices reveal about their character and priorities '
                f'4) Provides insight into potential moral blind spots or strengths '
                f'5) Uses a tone that fits the "Moral Torture Machine" theme - mysterious, slightly unsettling, but insightful '
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

        logger.info("Sending request to Groq API for results analysis with fallback chain")
        result = call_groq_api_with_fallback(
            payload=payload,
            api_key=api_key,
            operation="Analyze results"
        )

        analysis_text = result['choices'][0]['message']['content']

        logger.info("Successfully generated analysis from Groq API")

        # Track analytics event
        session_id = extract_session_id(request)
        track_analytics_event(
            session_id=session_id,
            action_type="results_analyzed",
            action_data={
                "num_dilemmas": len(analyze_request.answers),
                "averages": averages
            },
            language=language,
            user_agent=request.headers.get("User-Agent"),
            ip_address=request.client.host if request.client else None,
            **extract_client_analytics_context(request),
        )

        return {
            "analysis": analysis_text,
            "averages": averages
        }

    except requests.exceptions.RequestException as e:
        logger.error(f"Request error in /analyze-results: {str(e)}")
        raise HTTPException(status_code=502, detail="Failed to connect to external API")
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error in /analyze-results: {str(e)}")
        raise HTTPException(status_code=500, detail="Invalid JSON response from external API")
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
