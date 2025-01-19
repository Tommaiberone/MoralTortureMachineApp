from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import MySQLdb
import json
import os
import logging
from logging.handlers import RotatingFileHandler
import MySQLdb.cursors

app = Flask(__name__)

# Configure CORS
CORS(app, origins=["https://tommaiberone.github.io"], supports_credentials=True)

# Load configuration from environment variables for security
API_KEY = os.getenv("API_KEY", "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")
DB_HOST = os.getenv("DB_HOST", "tommaiberone.mysql.pythonanywhere-services.com")
DB_USER = os.getenv("DB_USER", "tommaiberone")
DB_PASSWORD = os.getenv("DB_PASSWORD", "Tobianca1!")
DB_NAME = os.getenv("DB_NAME", "tommaiberone$MoralTortureMachine")

# Configure Logging
def setup_logging():
    # Remove the default Flask logger handlers to prevent duplicate logs
    del app.logger.handlers[:]
    
    # Create a rotating file handler
    file_handler = RotatingFileHandler('app.log', maxBytes=10*1024*1024, backupCount=5)
    file_handler.setLevel(logging.INFO)
    
    # Create a console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)
    
    # Define log format
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
    )
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    # Add handlers to the app's logger
    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)
    app.logger.setLevel(logging.INFO)

setup_logging()

def connect_to_db():
    try:
        # Connect to the MySQL database
        conn = MySQLdb.connect(
            host=DB_HOST,
            user=DB_USER,
            passwd=DB_PASSWORD,
            db=DB_NAME,
            charset='utf8mb4'  # Ensure proper encoding for JSON and emojis
        )
        app.logger.info("Successfully connected to the database.")
        return conn
    except MySQLdb.Error as e:
        app.logger.error(f"Database connection failed: {e}")
        return None

@app.before_request
def log_request_info():
    app.logger.debug(f"Incoming request: {request.method} {request.url}")
    app.logger.debug(f"Request headers: {dict(request.headers)}")
    if request.method in ['POST', 'PUT', 'PATCH']:
        app.logger.debug(f"Request body: {request.get_data()}")

@app.after_request
def log_response_info(response):
    app.logger.debug(f"Response status: {response.status}")
    app.logger.debug(f"Response headers: {dict(response.headers)}")
    app.logger.debug(f"Response body: {response.get_data()}")
    return response

app = Flask(__name__)

# Database connection function
def connect_to_db():
    try:
        conn = MySQLdb.connect(
            host=os.getenv("DB_HOST", "tommaiberone.mysql.pythonanywhere-services.com"),
            user=os.getenv("DB_USER", "tommaiberone"),
            passwd=os.getenv("DB_PASSWORD", "Tobianca1!"),
            db=os.getenv("DB_NAME", "tommaiberone$MoralTortureMachine"),
            charset='utf8mb4',  # Ensure proper encoding for emojis and special characters
            cursorclass=MySQLdb.cursors.DictCursor  # Use DictCursor for dictionary results
        )
        return conn
    except MySQLdb.Error as e:
        app.logger.error(f"Failed to connect to database: {e}")
        return None
    
@app.route('/vote', methods=['POST'])
def vote():
    app.logger.info("Received request to /vote")
    try:
        data = request.get_json()
        app.logger.debug(f"Request payload: {data}")

        # Validate input
        if not data or '_id' not in data or 'vote' not in data:
            app.logger.warning("Invalid payload: Missing '_id' or 'vote'")
            return jsonify({"error": "Missing '_id' or 'vote' in request body"}), 400

        dilemma_id = data['_id']
        vote_type = data['vote'].lower()

        if vote_type not in ['yes', 'no']:
            app.logger.warning(f"Invalid vote type: {vote_type}")
            return jsonify({"error": "Invalid vote type. Must be 'yes' or 'no'."}), 400

        # Determine which column to increment
        count_column = 'yesCount' if vote_type == 'yes' else 'noCount'

        conn = None
        cur = None
        try:
            conn = connect_to_db()
            if conn is None:
                raise Exception("Database connection failed")

            cur = conn.cursor()

            # Prepare the UPDATE query using parameterized statements
            update_query = f"UPDATE dilemmas SET {count_column} = {count_column} + 1 WHERE _id = %s"
            app.logger.debug(f"Executing query: {update_query} with _id={dilemma_id}")
            cur.execute(update_query, (dilemma_id,))
            conn.commit()

            if cur.rowcount == 0:
                app.logger.warning(f"No dilemma found with _id: {dilemma_id}")
                return jsonify({"error": "Dilemma not found"}), 404

            app.logger.info(f"Successfully incremented {count_column} for dilemma_id: {dilemma_id}")
            return jsonify({"message": f"Successfully recorded your '{vote_type}' vote."}), 200

        except MySQLdb.Error as db_err:
            app.logger.error(f"MySQL Error in /vote: {db_err}")
            return jsonify({"error": "Database error occurred."}), 500
        except Exception as e:
            app.logger.error(f"Error in /vote: {e}")
            return jsonify({"error": "An unexpected error occurred."}), 500
        finally:
            if cur:
                cur.close()
                app.logger.debug("Database cursor closed.")
            if conn:
                conn.close()
                app.logger.debug("Database connection closed.")

    except Exception as e:
        app.logger.error(f"Unhandled exception in /vote: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500

@app.route('/get-dilemma', methods=['GET'])
def get_dilemma():
    app.logger.info("Received request to /get-dilemma")
    conn = None
    cur = None
    try:
        conn = connect_to_db()
        if conn is None:
            raise Exception("Database connection failed")

        cur = conn.cursor()

        # Updated query to select all relevant columns
        select_query = """
            SELECT 
                _id, dilemma, firstAnswer, secondAnswer, teaseOption1, teaseOption2,
                firstAnswerEmpathy, firstAnswerIntegrity, firstAnswerResponsibility,
                firstAnswerJustice, firstAnswerAltruism, firstAnswerHonesty,
                secondAnswerEmpathy, secondAnswerIntegrity, secondAnswerResponsibility,
                secondAnswerJustice, secondAnswerAltruism, secondAnswerHonesty,
                yesCount, noCount
            FROM dilemmas
            ORDER BY RAND()
            LIMIT 1;
        """
        app.logger.debug(f"Executing query: {select_query}")
        cur.execute(select_query)
        result = cur.fetchone()
        
        if result:
            # Construct the dilemma dictionary from the fetched row
            dilemma = {
                "_id": result.get("_id"),
                "dilemma": result.get("dilemma"),
                "firstAnswer": result.get("firstAnswer"),
                "secondAnswer": result.get("secondAnswer"),
                "teaseOption1": result.get("teaseOption1"),
                "teaseOption2": result.get("teaseOption2"),
                "firstAnswerEmpathy": result.get("firstAnswerEmpathy"),
                "firstAnswerIntegrity": result.get("firstAnswerIntegrity"),
                "firstAnswerResponsibility": result.get("firstAnswerResponsibility"),
                "firstAnswerJustice": result.get("firstAnswerJustice"),
                "firstAnswerAltruism": result.get("firstAnswerAltruism"),
                "firstAnswerHonesty": result.get("firstAnswerHonesty"),
                "secondAnswerEmpathy": result.get("secondAnswerEmpathy"),
                "secondAnswerIntegrity": result.get("secondAnswerIntegrity"),
                "secondAnswerResponsibility": result.get("secondAnswerResponsibility"),
                "secondAnswerJustice": result.get("secondAnswerJustice"),
                "secondAnswerAltruism": result.get("secondAnswerAltruism"),
                "secondAnswerHonesty": result.get("secondAnswerHonesty"),
                "yesCount": result.get("yesCount", 0),
                "noCount": result.get("noCount", 0)
            }
            app.logger.info(f"Retrieved dilemma from the database: {dilemma}")
            return jsonify(dilemma), 200
        else:
            app.logger.warning("No dilemmas found in the database.")
            return jsonify({"error": "No dilemmas found"}), 404

    except Exception as e:
        app.logger.error(f"Error in /get-dilemma: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cur:
            cur.close()
            app.logger.debug("Database cursor closed.")
        if conn:
            conn.close()
            app.logger.debug("Database connection closed.")


@app.route('/generate-dilemma', methods=['POST'])
def generate_dilemma():
    app.logger.info("Received request to /generate-dilemma")
    try:
        # Updated payload for the external API
        payload = {
            "model": "llama3-70b-8192",
            "messages": [
                {
                    "role": "user",
                    "content": (
                        'Generate a concise ethical dilemma (40-80 words) with two challenging options. '
                        'Each option should present a valid but contrasting viewpoint, encouraging reflection. '
                        'Add a light tease for each option to make the dilemma more engaging. '
                        'Ensure balance and complexity, avoiding oversimplified choices. '
                        'Respond strictly in JSON format with the following structure: '
                        "{\"dilemma\": \"...\", \"firstAnswer\": \"...\", \"secondAnswer\": \"...\", "
                        "\"teaseOption1\": \"...\", \"teaseOption2\": \"...\"} "
                        'Here is an example of a good answer (just the json, with the correct structure): '
                        "{\"dilemma\": \"A community leader must decide whether to allocate limited resources to rebuilding homes after a natural disaster or invest in long-term educational programs to prevent future vulnerabilities. Allocating resources to immediate rebuilding could restore lives quickly but might neglect future preparedness. On the other hand, investing in education could strengthen the community\"\"s resilience but delay immediate relief efforts.\", "
                        "\"firstAnswer\": \"Rebuild homes\", "
                        "\"secondAnswer\": \"Invest in education\", "
                        "\"teaseOption1\": \"Prioritizing now over later? Interesting choice! 🤔\", "
                        "\"teaseOption2\": \"Planning for the future, but at what cost? 🤨\"}"
                        'FORMAT THE ANSWER STRICTLY IN THE JSON I PROVIDED! NOTHING BUT THE JSON SHOULD BE IN YOUR ANSWER'
                    )
                },
            ],
        }

        app.logger.debug(f"Prepared payload for external API: {payload}")

        api_url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        }

        app.logger.info(f"Sending request to external API: {api_url}")
        response = requests.post(api_url, headers=headers, json=payload)
        app.logger.info(f"Received response from external API: {response.status_code}")

        if response.status_code != 200:
            app.logger.error(f"External API error: {response.status_code} - {response.text}")
            return jsonify({"error": f"Error from external API: {response.status_code}"}), response.status_code

        app.logger.info("Successfully generated dilemma from external API.")
        return jsonify(response.json()), 200
    except requests.exceptions.RequestException as req_err:
        app.logger.error(f"RequestException in /generate-dilemma: {req_err}")
        return jsonify({"error": "Failed to connect to external API."}), 502
    except json.JSONDecodeError as json_err:
        app.logger.error(f"JSONDecodeError in /generate-dilemma: {json_err}")
        return jsonify({"error": "Invalid JSON response from external API."}), 500
    except Exception as e:
        app.logger.error(f"Error in /generate-dilemma: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # It's generally not recommended to run Flask with debug=True in production
    app.run(debug=False, host='0.0.0.0', port=int(os.getenv("PORT", 5000)))
