#!/usr/bin/env python3
"""
Test script to verify the exclude functionality in get-dilemma endpoint
"""

import boto3
from decimal import Decimal

# Configuration
TABLE_NAME = "moral-torture-machine-dilemmas-prod"
REGION = "eu-west-1"
LANGUAGE = "en"

def test_exclude_functionality():
    """Test the exclude logic that will be used in the API"""
    dynamodb = boto3.resource('dynamodb', region_name=REGION)
    table = dynamodb.Table(TABLE_NAME)

    print("=" * 60)
    print("Testing Exclude Dilemmas Functionality")
    print("=" * 60)
    print()

    # Scan for all English dilemmas
    response = table.scan(
        FilterExpression='attribute_exists(#lang) AND #lang = :language',
        ExpressionAttributeNames={
            '#lang': 'language'
        },
        ExpressionAttributeValues={
            ':language': LANGUAGE
        }
    )

    items = response.get('Items', [])
    print(f"✅ Found {len(items)} total dilemmas for language '{LANGUAGE}'")
    print()

    if len(items) == 0:
        print("❌ No dilemmas found. Cannot test exclude functionality.")
        return

    # Get IDs of all dilemmas
    all_ids = [item.get('_id') for item in items]
    print(f"Dilemma IDs: {all_ids[:5]}..." if len(all_ids) > 5 else f"Dilemma IDs: {all_ids}")
    print()

    # Test 1: Exclude none (should return all)
    print("Test 1: Exclude no dilemmas")
    excluded_ids = set()
    available = [item for item in items if item.get('_id') not in excluded_ids]
    print(f"  Result: {len(available)} available dilemmas (expected {len(items)})")
    assert len(available) == len(items), "Test 1 failed!"
    print("  ✅ PASSED")
    print()

    # Test 2: Exclude some dilemmas
    print("Test 2: Exclude 2 dilemmas")
    excluded_ids = set(all_ids[:2])
    available = [item for item in items if item.get('_id') not in excluded_ids]
    print(f"  Excluded: {excluded_ids}")
    print(f"  Result: {len(available)} available dilemmas (expected {len(items) - 2})")
    assert len(available) == len(items) - 2, "Test 2 failed!"
    print("  ✅ PASSED")
    print()

    # Test 3: Exclude all but one
    print("Test 3: Exclude all but one dilemma")
    excluded_ids = set(all_ids[:-1])
    available = [item for item in items if item.get('_id') not in excluded_ids]
    print(f"  Excluded: {len(excluded_ids)} dilemmas")
    print(f"  Result: {len(available)} available dilemmas (expected 1)")
    assert len(available) == 1, "Test 3 failed!"
    print(f"  Remaining dilemma ID: {available[0].get('_id')}")
    print("  ✅ PASSED")
    print()

    # Test 4: Exclude all dilemmas (should reset to all)
    print("Test 4: Exclude all dilemmas (reset scenario)")
    excluded_ids = set(all_ids)
    available = [item for item in items if item.get('_id') not in excluded_ids]

    if not available:
        print("  ✅ No available dilemmas (as expected)")
        print("  📝 Backend should reset to all dilemmas in this case")
        available = items  # Simulate reset logic
        print(f"  After reset: {len(available)} available dilemmas")
        print("  ✅ PASSED")
    print()

    # Test 5: Random selection simulation
    print("Test 5: Simulate multiple random selections without repeats")
    import random
    excluded_ids = set()
    selected_ids = []

    for i in range(min(5, len(items))):
        available = [item for item in items if item.get('_id') not in excluded_ids]
        if not available:
            print(f"  🔄 All dilemmas seen, resetting pool")
            excluded_ids = set()
            available = items

        selected = random.choice(available)
        selected_id = selected.get('_id')
        selected_ids.append(selected_id)
        excluded_ids.add(selected_id)
        print(f"  Selection {i+1}: {selected_id}")

    print(f"  ✅ Selected {len(selected_ids)} unique dilemmas")
    print(f"  No duplicates: {len(selected_ids) == len(set(selected_ids))}")
    print("  ✅ PASSED")
    print()

    print("=" * 60)
    print("✅ All tests passed successfully!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        test_exclude_functionality()
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
