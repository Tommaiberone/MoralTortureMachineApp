from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel, Field
import boto3
import requests
import os
import logging
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

class DilemmaWithChoice(BaseModel):
    dilemma: str = Field(..., description="The dilemma text")
    firstAnswer: str = Field(..., description="First answer option")
    secondAnswer: str = Field(..., description="Second answer option")
    chosenAnswer: str = Field(..., description="The answer the user chose")
    chosenValues: Dict[str, float] = Field(..., description="Moral values of the chosen answer")

class AnalyzeResultsRequest(BaseModel):
    answers: list[Dict[str, float]] = Field(..., description="List of moral category scores from user's answers")
    dilemmasWithChoices: Optional[list[DilemmaWithChoice]] = Field(default=[], description="List of dilemmas with user's choices")

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
async def get_dilemma(language: str = "en"):
    """
    Get a random dilemma from DynamoDB

    Returns a random dilemma with all its attributes in the specified language
    """
    try:
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

        # Select a random dilemma
        import random
        dilemma = random.choice(items)

        # Convert Decimal types to native Python types
        dilemma = decimal_to_native(dilemma)

        # Ensure all required fields have default values
        dilemma.setdefault('yesCount', 0)
        dilemma.setdefault('noCount', 0)

        logger.info(f"Retrieved dilemma: {dilemma.get('_id')} in language: {language}")

        return dilemma

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /get-dilemma: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/generate-dilemma")
async def generate_dilemma(language: str = "en"):
    """
    Generate a new dilemma using Groq AI API, inspired by existing dilemmas from DynamoDB

    Returns a newly generated ethical dilemma in the specified language
    """
    try:
        if not API_KEY:
            raise HTTPException(
                status_code=500,
                detail="API_KEY not configured"
            )

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
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {
                    "role": "user",
                    "content": prompt_content
                }
            ],
        }

        api_url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        }

        logger.info("Sending request to Groq API")
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

@app.post("/analyze-results")
async def analyze_results(request: AnalyzeResultsRequest, language: str = "en"):
    """
    Analyze user's moral profile and generate a summary using Groq AI API

    Returns an AI-generated analysis of the user's moral choices in the specified language
    """
    try:
        if not API_KEY:
            raise HTTPException(
                status_code=500,
                detail="API_KEY not configured"
            )

        # Aggregate the answers to compute average values
        aggregated = {}
        for answer in request.answers:
            for key, value in answer.items():
                aggregated[key] = aggregated.get(key, 0) + value

        # Calculate averages
        num_answers = len(request.answers)
        averages = {key: round(value / num_answers, 2) for key, value in aggregated.items()}

        # Create a summary of the moral profile
        profile_summary = ", ".join([f"{key}: {value}" for key, value in averages.items()])

        # Create detailed summary of dilemmas and choices if available
        if language == "it":
            dilemmas_summary = ""
            if request.dilemmasWithChoices and len(request.dilemmasWithChoices) > 0:
                dilemmas_summary = "\n\nEcco i dilemmi specifici che hanno affrontato e le loro scelte:\n"
                for i, d in enumerate(request.dilemmasWithChoices, 1):
                    dilemmas_summary += f"\n{i}. Dilemma: {d.dilemma}\n"
                    dilemmas_summary += f"   Opzioni: '{d.firstAnswer}' oppure '{d.secondAnswer}'\n"
                    dilemmas_summary += f"   Hanno scelto: '{d.chosenAnswer}'\n"

            prompt_content = (
                f'Stai analizzando il profilo morale di una persona basandoti sulle sue risposte a dilemmi etici. '
                f'Ecco i loro punteggi medi attraverso diverse categorie morali: {profile_summary}.'
                f'{dilemmas_summary}'
                f'\nGenera un\'analisi ponderata, leggermente oscura e inquietante (100-150 parole) che: '
                f'1) Fa riferimento alle loro scelte SPECIFICHE nei dilemmi che hanno affrontato '
                f'2) Identifica i loro tratti morali dominanti basandosi sulle loro decisioni effettive '
                f'3) Spiega cosa rivelano le loro scelte sul loro carattere e priorità '
                f'4) Fornisce intuizioni su potenziali punti ciechi morali o punti di forza '
                f'5) Usa un tono che si adatta al tema "Moral Torture Machine" - misterioso, leggermente inquietante, ma perspicace '
                f'Scrivi in seconda persona (rivolgendoti a "tu") e mantieni un tono inquietante e filosofico. '
                f'IMPORTANTE: Basa la tua analisi sulle scelte EFFETTIVE che hanno fatto, non solo sui punteggi numerici. '
                f'Non usare il formato JSON, restituisci solo il testo dell\'analisi direttamente.'
            )
        else:
            dilemmas_summary = ""
            if request.dilemmasWithChoices and len(request.dilemmasWithChoices) > 0:
                dilemmas_summary = "\n\nHere are the specific dilemmas they faced and their choices:\n"
                for i, d in enumerate(request.dilemmasWithChoices, 1):
                    dilemmas_summary += f"\n{i}. Dilemma: {d.dilemma}\n"
                    dilemmas_summary += f"   Options: '{d.firstAnswer}' or '{d.secondAnswer}'\n"
                    dilemmas_summary += f"   They chose: '{d.chosenAnswer}'\n"

            prompt_content = (
                f'You are analyzing a person\'s moral profile based on their responses to ethical dilemmas. '
                f'Here are their average scores across different moral categories: {profile_summary}.'
                f'{dilemmas_summary}'
                f'\nGenerate a thoughtful, slightly dark and creepy analysis (100-150 words) that: '
                f'1) References their SPECIFIC choices in the dilemmas they faced '
                f'2) Identifies their dominant moral traits based on their actual decisions '
                f'3) Explains what their choices reveal about their character and priorities '
                f'4) Provides insight into potential moral blind spots or strengths '
                f'5) Uses a tone that fits the "Moral Torture Machine" theme - mysterious, slightly unsettling, but insightful '
                f'Write in second person (addressing "you") and maintain a haunting, philosophical tone. '
                f'IMPORTANT: Base your analysis on the ACTUAL choices they made, not just the numerical scores. '
                f'Do not use JSON format, just return the analysis text directly.'
            )

        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {
                    "role": "user",
                    "content": prompt_content
                }
            ],
        }

        api_url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        }

        logger.info("Sending request to Groq API for results analysis")
        response = requests.post(api_url, headers=headers, json=payload, timeout=30)

        if response.status_code != 200:
            logger.error(f"Groq API error: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error from external API: {response.status_code}"
            )

        result = response.json()
        analysis_text = result['choices'][0]['message']['content']

        logger.info("Successfully generated analysis from Groq API")
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

# Lambda handler
handler = Mangum(app, lifespan="off")

# For local development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
