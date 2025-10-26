#!/usr/bin/env python3
"""
Migration script to copy all items from source DynamoDB table to target table.
"""

import boto3
import sys
from botocore.exceptions import ClientError

# Configuration
SOURCE_TABLE = "moral-torture-machine-dilemmas"
TARGET_TABLE = "prod-moral-torture-machine-dilemmas"
REGION = "eu-west-1"

def migrate_dynamodb_data(source_table_name, target_table_name, region='eu-west-1'):
    """
    Copy all items from source table to target table.
    """
    dynamodb = boto3.resource('dynamodb', region_name=region)

    source_table = dynamodb.Table(source_table_name)
    target_table = dynamodb.Table(target_table_name)

    print(f"🔄 Starting migration from '{source_table_name}' to '{target_table_name}'...")

    try:
        # Scan all items from source table
        print("📥 Scanning items from source table...")
        response = source_table.scan()
        items = response['Items']

        # Handle pagination if there are more items
        while 'LastEvaluatedKey' in response:
            response = source_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            items.extend(response['Items'])

        print(f"✅ Found {len(items)} items in source table")

        if len(items) == 0:
            print("⚠️  Source table is empty. Nothing to migrate.")
            return 0

        # Write items to target table in batches
        print("📤 Writing items to target table...")
        with target_table.batch_writer() as batch:
            for i, item in enumerate(items, 1):
                batch.put_item(Item=item)
                if i % 25 == 0:
                    print(f"   Processed {i}/{len(items)} items...")

        print(f"✅ Successfully migrated {len(items)} items!")

        # Verify count in target table
        print("🔍 Verifying target table...")
        response = target_table.scan(Select='COUNT')
        target_count = response['Count']
        print(f"   Target table now has {target_count} items")

        return len(items)

    except ClientError as e:
        print(f"❌ Error: {e.response['Error']['Message']}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        sys.exit(1)

def get_table_item_count(table_name, region='eu-west-1'):
    """Get the number of items in a table."""
    dynamodb = boto3.client('dynamodb', region_name=region)
    try:
        response = dynamodb.describe_table(TableName=table_name)
        return response['Table']['ItemCount']
    except ClientError as e:
        print(f"❌ Error accessing table '{table_name}': {e.response['Error']['Message']}")
        return None

if __name__ == "__main__":
    print("=" * 60)
    print("DynamoDB Data Migration Script")
    print("=" * 60)
    print()

    # Show current state
    print(f"Source: {SOURCE_TABLE}")
    source_count = get_table_item_count(SOURCE_TABLE, REGION)
    if source_count is not None:
        print(f"  Current items: {source_count}")

    print(f"Target: {TARGET_TABLE}")
    target_count = get_table_item_count(TARGET_TABLE, REGION)
    if target_count is not None:
        print(f"  Current items: {target_count}")

    print()

    # Confirm before proceeding
    if target_count and target_count > 0:
        print(f"⚠️  WARNING: Target table has {target_count} existing items!")
        response = input("This operation will ADD items to the target table. Continue? (yes/no): ")
        if response.lower() != 'yes':
            print("Migration cancelled.")
            sys.exit(0)

    print()

    # Perform migration
    items_migrated = migrate_dynamodb_data(SOURCE_TABLE, TARGET_TABLE, REGION)

    print()
    print("=" * 60)
    print(f"✅ Migration completed successfully! ({items_migrated} items)")
    print("=" * 60)
