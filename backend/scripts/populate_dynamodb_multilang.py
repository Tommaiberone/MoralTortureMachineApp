#!/usr/bin/env python3
"""
Populate DynamoDB with multilingual dilemmas

This script loads dilemmas from both dilemmas_en.json (English) and dilemmas_it.json (Italian)
and stores them in DynamoDB with language-specific IDs.
"""

import boto3
import json
import os
from botocore.exceptions import ClientError
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

def populate_multilang_dynamodb(table_name='moral-torture-machine-dilemmas', append_only=False):
    """
    Populate DynamoDB table with dilemmas from both language files

    Args:
        table_name: Name of the DynamoDB table
        append_only: If True, never touches existing items - each item is
            written with a conditional PutItem (attribute_not_exists on _id)
            and silently skipped if it already exists, instead of using
            batch_writer. Safe to re-run any time new dilemmas are added to
            the JSON files without needing a prior clear_dynamodb_table call.
    """
    # Initialize DynamoDB
    dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION', 'eu-west-1'))
    table = dynamodb.Table(table_name)

    # Get the script directory and construct paths to data files
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(os.path.dirname(script_dir), 'data')
    
    languages = {
        'en': os.path.join(data_dir, 'dilemmas_en.json'),
        'it': os.path.join(data_dir, 'dilemmas_it.json')
    }

    total_loaded = 0

    for lang, json_file in languages.items():
        print(f"\n{'='*60}")
        print(f"Loading {lang.upper()} dilemmas from {json_file}...")
        print(f"{'='*60}")

        # Load dilemmas from JSON file
        with open(json_file, 'r', encoding='utf-8') as f:
            dilemmas = json.load(f)

        print(f"Found {len(dilemmas)} dilemmas for language: {lang}")

        def build_item(dilemma):
            # Get the base ID
            base_id = dilemma['_id']

            # Create language-specific ID
            language_specific_id = f"{base_id}-{lang}"
            dilemma['_id'] = language_specific_id

            # Add language attribute
            dilemma['language'] = lang
            dilemma['baseId'] = base_id  # Keep original ID for reference

            # Add default vote counts if not present
            if 'yesCount' not in dilemma:
                dilemma['yesCount'] = 0
            if 'noCount' not in dilemma:
                dilemma['noCount'] = 0

            # Convert floats to Decimal
            return convert_to_decimal(dilemma), language_specific_id

        if append_only:
            # Conditional PutItem per dilemma: never overwrites an existing
            # item, so it is safe to run against a table that already has
            # some or all of these dilemmas (e.g. after adding new entries
            # to the JSON files without touching the ones already loaded).
            added = 0
            skipped = 0
            for dilemma in dilemmas:
                item, language_specific_id = build_item(dilemma)
                try:
                    table.put_item(
                        Item=item,
                        ConditionExpression='attribute_not_exists(#pk)',
                        ExpressionAttributeNames={'#pk': '_id'}
                    )
                    print(f"  ✓ Added: {language_specific_id}")
                    added += 1
                except ClientError as e:
                    if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                        print(f"  ⏭️  Already exists, skipped: {language_specific_id}")
                        skipped += 1
                    else:
                        raise
            print(f"  ({added} added, {skipped} already present for {lang})")
            total_loaded += added
        else:
            # Batch write items (overwrites any existing item with the same _id)
            with table.batch_writer() as batch:
                for dilemma in dilemmas:
                    item, language_specific_id = build_item(dilemma)
                    batch.put_item(Item=item)
                    print(f"  ✓ Added: {language_specific_id}")
                    total_loaded += 1

    print(f"\n{'='*60}")
    print(f"✅ Successfully loaded {total_loaded} dilemmas into DynamoDB!")
    print(f"{'='*60}")

if __name__ == '__main__':
    import sys

    # Parse arguments
    auto_confirm = '--auto-confirm' in sys.argv
    if auto_confirm:
        sys.argv.remove('--auto-confirm')

    append_only = '--append-only' in sys.argv
    if append_only:
        sys.argv.remove('--append-only')

    table_name = sys.argv[1] if len(sys.argv) > 1 else 'moral-torture-machine-dilemmas'

    try:
        # Confirm before proceeding (unless auto-confirm is set)
        if append_only:
            print(f"➕ This will ADD any dilemmas from the JSON files that are")
            print(f"   missing from table '{table_name}'. Existing items are")
            print(f"   never modified or deleted.")
        else:
            print(f"⚠️  This will populate table '{table_name}' with multilingual dilemmas.")
            print("   Existing items will be deleted.")

        if not auto_confirm:
            response = input("\n⚠️⚠️⚠️ Are you sure you want to proceed? (yes/no): ").strip().lower()
            if response != 'yes':
                print("Aborted.")
                sys.exit(0)
        else:
            print("\n✅ Auto-confirm enabled, proceeding...")

        if not append_only:
            clear_dynamodb_table(table_name)
        populate_multilang_dynamodb(table_name, append_only=append_only)
    except FileNotFoundError as e:
        print(f"❌ Error: Required JSON file not found - {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
