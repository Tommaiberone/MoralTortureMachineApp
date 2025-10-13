from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel, Field
import boto3
from boto3.dynamodb.conditions import Key
import requests
import os
import logging
from typing import Optional, Dict, Any
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
        "https://tommaiberone.github.io",
        "https://d1vklv6uo7wyz2.cloudfront.net",
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment variables
API_KEY = os.getenv("API_KEY", "")
DYNAMODB_TABLE = os.getenv("DYNAMODB_TABLE", "moral-torture-machine-dilemmas")
AWS_REGION = os.getenv("AWS_REGION", "eu-west-1")

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
table = dynamodb.Table(DYNAMODB_TABLE)

# Pydantic models
class VoteRequest(BaseModel):
    id: str = Field(..., alias="_id", description="Dilemma ID")
    vote: str = Field(..., description="Vote type: 'yes' or 'no'")

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

# Middleware for request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "Moral Torture Machine API"}

@app.post("/vote")
async def vote(vote_request: VoteRequest):
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

        return {
            "message": f"Successfully recorded your '{vote_type}' vote.",
            "updated": decimal_to_native(response.get('Attributes', {}))
        }

    except Exception as e:
        logger.error(f"Error in /vote: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/get-dilemma", response_model=DilemmaResponse, response_model_by_alias=True)
async def get_dilemma():
    """
    Get a random dilemma from the database

    Returns a random dilemma with all its attributes
    """
    try:
        # Scan the table to get all items (for small datasets)
        # For larger datasets, consider using a different approach with random selection
        response = table.scan()
        items = response.get('Items', [])

        if not items:
            raise HTTPException(status_code=404, detail="No dilemmas found")

        # Select a random dilemma
        import random
        dilemma = random.choice(items)

        # Convert Decimal types to native types
        dilemma = decimal_to_native(dilemma)

        # Ensure all required fields have default values
        dilemma.setdefault('yesCount', 0)
        dilemma.setdefault('noCount', 0)

        logger.info(f"Retrieved dilemma: {dilemma.get('_id')}")

        return dilemma

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /get-dilemma: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/generate-dilemma")
async def generate_dilemma():
    """
    Generate a new dilemma using Groq AI API

    Returns a newly generated ethical dilemma
    """
    try:
        if not API_KEY:
            raise HTTPException(
                status_code=500,
                detail="API_KEY not configured"
            )

        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {
                    "role": "user",
                    "content": (
                        'Generate a concise ethical dilemma (40-80 words) with two challenging options. '
                        'Each option should present a valid but contrasting viewpoint, encouraging reflection. '
                        'Add a light tease for each option to make the dilemma more engaging. '
                        'Ensure balance and complexity, avoiding oversimplified choices. '
                        'Respond strictly in JSON format with the following structure: '
                        '{"dilemma": "...", "firstAnswer": "...", "secondAnswer": "...", '
                        '"teaseOption1": "...", "teaseOption2": "..."} '
                        'Here is an example of a good answer (just the json, with the correct structure): '
                        '{"dilemma": "A community leader must decide whether to allocate limited resources to rebuilding homes after a natural disaster or invest in long-term educational programs to prevent future vulnerabilities. Allocating resources to immediate rebuilding could restore lives quickly but might neglect future preparedness. On the other hand, investing in education could strengthen the community\'s resilience but delay immediate relief efforts.", '
                        '"firstAnswer": "Rebuild homes", '
                        '"secondAnswer": "Invest in education", '
                        '"teaseOption1": "Prioritizing now over later? Interesting choice!", '
                        '"teaseOption2": "Planning for the future, but at what cost?"}'
                        'FORMAT THE ANSWER STRICTLY IN THE JSON I PROVIDED! NOTHING BUT THE JSON SHOULD BE IN YOUR ANSWER'
                    )
                }
            ],
        }

        api_url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        }

        logger.info(f"Sending request to Groq API")
        response = requests.post(api_url, headers=headers, json=payload, timeout=30)

        if response.status_code != 200:
            logger.error(f"Groq API error: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error from external API: {response.status_code}"
            )

        logger.info("Successfully generated dilemma from Groq API")
        return response.json()

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

# Lambda handler
handler = Mangum(app, lifespan="off")

# For local development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
