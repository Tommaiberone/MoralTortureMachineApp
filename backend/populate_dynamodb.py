import boto3
import json
import os
from decimal import Decimal

def convert_to_decimal(obj):
    """Convert float values to Decimal for DynamoDB"""
    if isinstance(obj, list):
        return [convert_to_decimal(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_to_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, float):
        return Decimal(str(obj))
    else:
        return obj

def populate_dynamodb(table_name='moral-torture-machine-dilemmas', json_file='dilemmas.json'):
    """
    Populate DynamoDB table with dilemmas from JSON file

    Args:
        table_name: Name of the DynamoDB table
        json_file: Path to the JSON file containing dilemmas
    """
    # Initialize DynamoDB
    dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION', 'us-east-1'))
    table = dynamodb.Table(table_name)

    # Load dilemmas from JSON file
    with open(json_file, 'r', encoding='utf-8') as f:
        dilemmas = json.load(f)

    print(f"Loading {len(dilemmas)} dilemmas into DynamoDB table '{table_name}'...")

    # Batch write items
    with table.batch_writer() as batch:
        for dilemma in dilemmas:
            # Add default vote counts if not present
            if 'yesCount' not in dilemma:
                dilemma['yesCount'] = 0
            if 'noCount' not in dilemma:
                dilemma['noCount'] = 0

            # Convert floats to Decimal
            dilemma = convert_to_decimal(dilemma)

            # Write to DynamoDB
            batch.put_item(Item=dilemma)
            print(f"Added dilemma: {dilemma['_id']}")

    print(f"\nSuccessfully loaded {len(dilemmas)} dilemmas into DynamoDB!")

if __name__ == '__main__':
    import sys

    table_name = sys.argv[1] if len(sys.argv) > 1 else 'moral-torture-machine-dilemmas'
    json_file = sys.argv[2] if len(sys.argv) > 2 else 'dilemmas.json'

    try:
        populate_dynamodb(table_name, json_file)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
