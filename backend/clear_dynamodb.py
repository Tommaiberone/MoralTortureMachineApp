import boto3
import os

def clear_dynamodb(table_name='moral-torture-machine-dilemmas'):
    """
    Clear all items from DynamoDB table

    Args:
        table_name: Name of the DynamoDB table to clear
    """
    # Initialize DynamoDB
    dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION', 'eu-west-1'))
    table = dynamodb.Table(table_name)

    print(f"Clearing all items from DynamoDB table '{table_name}'...")

    # Scan and delete all items
    scan = table.scan()
    items = scan.get('Items', [])

    if not items:
        print("Table is already empty!")
        return

    print(f"Found {len(items)} items to delete...")

    # Delete items in batches
    with table.batch_writer() as batch:
        for item in items:
            batch.delete_item(Key={'_id': item['_id']})
            print(f"Deleted item: {item['_id']}")

    # Handle pagination if there are more items
    while 'LastEvaluatedKey' in scan:
        scan = table.scan(ExclusiveStartKey=scan['LastEvaluatedKey'])
        items = scan.get('Items', [])

        with table.batch_writer() as batch:
            for item in items:
                batch.delete_item(Key={'_id': item['_id']})
                print(f"Deleted item: {item['_id']}")

    print(f"\nSuccessfully cleared DynamoDB table '{table_name}'!")

if __name__ == '__main__':
    import sys

    table_name = sys.argv[1] if len(sys.argv) > 1 else 'moral-torture-machine-dilemmas'

    try:
        clear_dynamodb(table_name)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
