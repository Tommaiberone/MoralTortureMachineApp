#!/usr/bin/env python3
"""
Populate DynamoDB with multilingual story flows

This script loads story flows from both story_flows_en.json (English) and story_flows_it.json (Italian)
and stores them in DynamoDB with language-specific IDs.
"""

import boto3
import json
import os
from decimal import Decimal

def clear_dynamodb_table(table_name):
    """
    Clear all items from the specified DynamoDB table.

    Args:
        table_name: Name of the DynamoDB table
    """
    dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION', 'eu-west-1'))
    table = dynamodb.Table(table_name)

    print(f"\n{'='*60}")
    print(f"⚠️  Clearing all items from table '{table_name}'...")
    print(f"{'='*60}")

    # Scan and delete all items
    scan = table.scan()
    with table.batch_writer() as batch:
        for item in scan['Items']:
            batch.delete_item(Key={'_id': item['_id']})
            print(f"  ✗ Deleted: {item['_id']}")

    print(f"\n✅ Successfully cleared table '{table_name}'.")


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

def populate_story_flows(table_name='moral-torture-machine-story-flows'):
    """
    Populate DynamoDB table with story flows from both language files

    Args:
        table_name: Name of the DynamoDB table
    """
    # Initialize DynamoDB
    dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION', 'eu-west-1'))
    table = dynamodb.Table(table_name)

    # Get the script directory and construct paths to data files
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(os.path.dirname(script_dir), 'data')
    
    languages = {
        'en': os.path.join(data_dir, 'story_flows_en.json'),
        'it': os.path.join(data_dir, 'story_flows_it.json')
    }

    total_loaded = 0

    for lang, json_file in languages.items():
        print(f"\n{'='*60}")
        print(f"Loading {lang.upper()} story flows from {json_file}...")
        print(f"{'='*60}")

        # Load story flows from JSON file
        with open(json_file, 'r', encoding='utf-8') as f:
            flows = json.load(f)

        print(f"Found {len(flows)} story flows for language: {lang}")

        # Batch write items
        with table.batch_writer() as batch:
            for flow in flows:
                # Get the base ID
                base_id = flow['_id']

                # Create language-specific ID
                language_specific_id = f"{base_id}-{lang}"
                flow['_id'] = language_specific_id

                # Language and baseId should already be in the JSON
                # but we ensure they're correct
                flow['language'] = lang
                flow['baseId'] = base_id

                # Convert floats to Decimal (important for DynamoDB)
                flow = convert_to_decimal(flow)

                # Write to DynamoDB
                batch.put_item(Item=flow)
                print(f"  ✓ Added: {language_specific_id} - {flow.get('title', 'Untitled')}")
                total_loaded += 1

    print(f"\n{'='*60}")
    print(f"✅ Successfully loaded {total_loaded} story flows into DynamoDB!")
    print(f"{'='*60}")

if __name__ == '__main__':
    import sys

    # Parse arguments
    auto_confirm = '--auto-confirm' in sys.argv
    if auto_confirm:
        sys.argv.remove('--auto-confirm')

    table_name = sys.argv[1] if len(sys.argv) > 1 else 'moral-torture-machine-story-flows'

    try:
        # Confirm before proceeding (unless auto-confirm is set)
        print(f"⚠️  This will populate table '{table_name}' with multilingual story flows.")
        print("   Existing items will be deleted.")

        if not auto_confirm:
            response = input("\n⚠️⚠️⚠️ Are you sure you want to proceed? (yes/no): ").strip().lower()
            if response != 'yes':
                print("Aborted.")
                sys.exit(0)
        else:
            print("\n✅ Auto-confirm enabled, proceeding...")

        clear_dynamodb_table(table_name)
        populate_story_flows(table_name)
    except FileNotFoundError as e:
        print(f"❌ Error: Required JSON file not found - {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
