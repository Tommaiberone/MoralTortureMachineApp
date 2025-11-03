from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel, Field
import boto3
import requests
import os
import logging
import time
from typing import Optional, Dict
from decimal import Decimal
import json

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize FastAPI app
app = FastAPI(title="Moral Torture Machine API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://moraltorturemachine.com",
        "https://www.moraltorturemachine.com",
        "https://tommaiberone.github.io",
        "https://d1vklv6uo7wyz2.cloudfront.net",
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "X-Session-Id"],
)

# Environment variables
DYNAMODB_TABLE = os.getenv("DYNAMODB_TABLE", "moral-torture-machine-dilemmas")
ANALYTICS_TABLE = os.getenv("ANALYTICS_TABLE", "moral-torture-machine-user-analytics")
STORY_FLOWS_TABLE = os.getenv("STORY_FLOWS_TABLE", "moral-torture-machine-story-flows")
AWS_REGION = os.getenv("AWS_REGION", "eu-west-1")
GROQ_API_KEY_SECRET_ID = os.getenv("GROQ_API_KEY_SECRET_ID", "")

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
secrets_client = boto3.client('secretsmanager', region_name=AWS_REGION)

# Cache for API key (retrieved once at cold start)
_api_key_cache = None

def get_groq_api_key() -> str:
    """Retrieve Groq API key from AWS Secrets Manager with caching"""
    global _api_key_cache

    if _api_key_cache is not None:
        return _api_key_cache

    # Fallback to environment variable for local development
    local_api_key = os.getenv("API_KEY")
    if local_api_key:
        logger.info("Using API key from environment variable (local development)")
        _api_key_cache = local_api_key
        return _api_key_cache

    if not GROQ_API_KEY_SECRET_ID:
        raise ValueError("GROQ_API_KEY_SECRET_ID not configured")

    try:
        logger.info(f"Retrieving API key from Secrets Manager: {GROQ_API_KEY_SECRET_ID}")
        response = secrets_client.get_secret_value(SecretId=GROQ_API_KEY_SECRET_ID)
        _api_key_cache = response['SecretString']
        logger.info("Successfully retrieved API key from Secrets Manager")
        return _api_key_cache
    except Exception as e:
        logger.error(f"Failed to retrieve API key from Secrets Manager: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="API key configuration error"
        )

def track_analytics_event(
    session_id: str,
    action_type: str,
    action_data: Optional[Dict] = None,
    language: str = "en",
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None
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
        import time
        import hashlib

        timestamp = int(time.time() * 1000)  # Milliseconds since epoch

        # TTL: 90 days from now (in seconds)
        expiration_time = int(time.time()) + (90 * 24 * 60 * 60)

        # Hash IP address for privacy
        hashed_ip = None
        if ip_address:
            hashed_ip = hashlib.sha256(ip_address.encode()).hexdigest()[:16]

        event_data = {
            'sessionId': session_id,
            'timestamp': timestamp,
            'actionType': action_type,
            'language': language,
            'expirationTime': expiration_time
        }

        # Add optional fields
        if action_data:
            event_data['actionData'] = json.dumps(action_data)

        if user_agent:
            event_data['userAgent'] = user_agent[:200]  # Limit length

        if hashed_ip:
            event_data['hashedIp'] = hashed_ip

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

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "Moral Torture Machine API"}

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

    # Check Secrets Manager connectivity
    try:
        secrets_client.describe_secret(SecretId=GROQ_API_KEY_SECRET_ID)
        health_status["checks"]["secrets_manager"] = "ok"
    except Exception as e:
        health_status["checks"]["secrets_manager"] = f"error: {str(e)}"
        health_status["status"] = "degraded"

    # Set appropriate HTTP status code
    status_code = 200 if health_status["status"] == "healthy" else 503

    return health_status

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
            ip_address=request.client.host if request.client else None
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
            ip_address=request.client.host if request.client else None
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
            ip_address=request.client.host if request.client else None
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
                f'VINCOLO CRUCIALE: L\'analisi deve essere di MASSIMO 100 parole. Sii conciso e incisivo. '
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
                f'CRITICAL CONSTRAINT: The analysis must be MAXIMUM 100 words. Be concise and impactful. '
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
            ip_address=request.client.host if request.client else None
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
            ip_address=request.client.host if request.client else None
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
            ip_address=request.client.host if request.client else None
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
