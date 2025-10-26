# User Analytics Guide

## Overview

The Moral Torture Machine application now tracks comprehensive user behavior analytics to gain insights into how users interact with the application. All analytics data is stored in a DynamoDB table with automatic data expiration after 90 days for privacy compliance.

## Analytics Table Schema

### Table Name
`moral-torture-machine-user-analytics`

### Primary Keys
- **Hash Key (Partition Key)**: `sessionId` (String) - Unique session identifier
- **Range Key (Sort Key)**: `timestamp` (Number) - Milliseconds since epoch

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `sessionId` | String | Unique session identifier (UUID or client-provided) |
| `timestamp` | Number | Event timestamp in milliseconds since epoch |
| `actionType` | String | Type of action (see Action Types below) |
| `language` | String | User's selected language (e.g., "en", "it") |
| `actionData` | String (JSON) | Additional data specific to the action |
| `userAgent` | String | Browser/client information (max 200 chars) |
| `hashedIp` | String | SHA-256 hashed IP address (first 16 chars for privacy) |
| `expirationTime` | Number | TTL timestamp - data auto-deletes after 90 days |

### Global Secondary Index

**ActionTypeIndex**
- **Hash Key**: `actionType`
- **Range Key**: `timestamp`
- **Projection**: ALL

This index allows efficient queries by action type across all sessions.

## Tracked Events

### Action Types

| Action Type | Description | Action Data |
|------------|-------------|-------------|
| `dilemma_fetched` | User retrieved a dilemma from database | `{"dilemma_id": "...", "source": "database"}` |
| `dilemma_generated` | User generated a new AI dilemma | `{"source": "ai_generated", "model": "..."}` |
| `vote_cast` | User voted on a dilemma | `{"dilemma_id": "...", "vote_type": "yes\|no"}` |
| `results_analyzed` | User viewed their results | `{"num_dilemmas": N, "averages": {...}}` |

## Querying Analytics Data

### Prerequisites

Ensure you have AWS CLI configured with appropriate credentials:

```bash
aws configure
```

### Query Examples

#### 1. Get all events for a specific session

```bash
aws dynamodb query \
  --table-name moral-torture-machine-user-analytics \
  --key-condition-expression "sessionId = :sid" \
  --expression-attribute-values '{":sid":{"S":"your-session-id"}}' \
  --region eu-west-1
```

#### 2. Count events by action type

```bash
aws dynamodb scan \
  --table-name moral-torture-machine-user-analytics \
  --select COUNT \
  --filter-expression "actionType = :type" \
  --expression-attribute-values '{":type":{"S":"vote_cast"}}' \
  --region eu-west-1
```

#### 3. Get all vote events (using GSI)

```bash
aws dynamodb query \
  --table-name moral-torture-machine-user-analytics \
  --index-name ActionTypeIndex \
  --key-condition-expression "actionType = :type" \
  --expression-attribute-values '{":type":{"S":"vote_cast"}}' \
  --region eu-west-1
```

#### 4. Get events within a time range

```bash
# Get events for a session in the last hour
CURRENT_TIME=$(date +%s)
ONE_HOUR_AGO=$((($CURRENT_TIME - 3600) * 1000))

aws dynamodb query \
  --table-name moral-torture-machine-user-analytics \
  --key-condition-expression "sessionId = :sid AND #ts > :start" \
  --expression-attribute-names '{"#ts":"timestamp"}' \
  --expression-attribute-values "{\":sid\":{\"S\":\"your-session-id\"},\":start\":{\"N\":\"$ONE_HOUR_AGO\"}}" \
  --region eu-west-1
```

#### 5. Export all analytics data to JSON

```bash
aws dynamodb scan \
  --table-name moral-torture-machine-user-analytics \
  --region eu-west-1 \
  --output json > analytics_export.json
```

## Analytics Insights with Python

### Setup

```bash
pip install boto3 pandas
```

### Example Script: Analyze User Behavior

```python
import boto3
import json
from datetime import datetime
from collections import Counter
import pandas as pd

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name='eu-west-1')
table = dynamodb.Table('moral-torture-machine-user-analytics')

# Scan all events
response = table.scan()
events = response['Items']

# Continue scanning if there are more items
while 'LastEvaluatedKey' in response:
    response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
    events.extend(response['Items'])

# Convert to DataFrame
df = pd.DataFrame(events)
df['timestamp'] = pd.to_datetime(df['timestamp'].astype(float), unit='ms')
df['date'] = df['timestamp'].dt.date

# Insights

# 1. Total events by type
print("\n=== Events by Action Type ===")
print(df['actionType'].value_counts())

# 2. Daily active sessions
print("\n=== Daily Active Sessions ===")
daily_sessions = df.groupby('date')['sessionId'].nunique()
print(daily_sessions)

# 3. Most popular language
print("\n=== Language Distribution ===")
print(df['language'].value_counts())

# 4. Average votes per session
votes_per_session = df[df['actionType'] == 'vote_cast'].groupby('sessionId').size()
print(f"\n=== Average Votes Per Session ===")
print(f"Mean: {votes_per_session.mean():.2f}")
print(f"Median: {votes_per_session.median():.2f}")

# 5. User journey funnel
print("\n=== User Journey Funnel ===")
sessions_with_fetch = df[df['actionType'] == 'dilemma_fetched']['sessionId'].nunique()
sessions_with_vote = df[df['actionType'] == 'vote_cast']['sessionId'].nunique()
sessions_with_results = df[df['actionType'] == 'results_analyzed']['sessionId'].nunique()

print(f"Sessions that fetched dilemmas: {sessions_with_fetch}")
print(f"Sessions that voted: {sessions_with_vote} ({sessions_with_vote/sessions_with_fetch*100:.1f}%)")
print(f"Sessions that viewed results: {sessions_with_results} ({sessions_with_results/sessions_with_fetch*100:.1f}%)")

# 6. Most voted dilemmas
vote_events = df[df['actionType'] == 'vote_cast']
if not vote_events.empty:
    vote_events['dilemma_id'] = vote_events['actionData'].apply(
        lambda x: json.loads(x).get('dilemma_id') if pd.notna(x) else None
    )
    print("\n=== Top 10 Most Voted Dilemmas ===")
    print(vote_events['dilemma_id'].value_counts().head(10))

# 7. Peak usage times
print("\n=== Peak Usage Hours (UTC) ===")
df['hour'] = df['timestamp'].dt.hour
print(df['hour'].value_counts().sort_index())
```

### Example: Calculate Conversion Rates

```python
import boto3
from collections import defaultdict

dynamodb = boto3.resource('dynamodb', region_name='eu-west-1')
table = dynamodb.Table('moral-torture-machine-user-analytics')

# Scan all events
response = table.scan()
events = response['Items']

while 'LastEvaluatedKey' in response:
    response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
    events.extend(response['Items'])

# Group by session
session_events = defaultdict(list)
for event in events:
    session_events[event['sessionId']].append(event['actionType'])

# Calculate conversions
total_sessions = len(session_events)
sessions_with_votes = sum(1 for events in session_events.values() if 'vote_cast' in events)
sessions_with_results = sum(1 for events in session_events.values() if 'results_analyzed' in events)

print(f"Total Sessions: {total_sessions}")
print(f"Vote Conversion Rate: {sessions_with_votes/total_sessions*100:.1f}%")
print(f"Results Conversion Rate: {sessions_with_results/total_sessions*100:.1f}%")
```

## Privacy & Compliance

### Data Protection Measures

1. **IP Address Hashing**: User IP addresses are SHA-256 hashed and truncated to 16 characters
2. **Automatic Expiration**: All data automatically expires after 90 days via DynamoDB TTL
3. **No PII Storage**: No personally identifiable information is stored directly
4. **Session-based Tracking**: Uses session IDs, not persistent user identifiers

### GDPR Compliance

To delete a user's data manually:

```bash
# Delete all events for a specific session
aws dynamodb query \
  --table-name moral-torture-machine-user-analytics \
  --key-condition-expression "sessionId = :sid" \
  --expression-attribute-values '{":sid":{"S":"session-to-delete"}}' \
  --region eu-west-1 \
  --output json | \
  jq -r '.Items[] | [.sessionId.S, .timestamp.N] | @tsv' | \
  while IFS=$'\t' read -r sid ts; do
    aws dynamodb delete-item \
      --table-name moral-torture-machine-user-analytics \
      --key "{\"sessionId\":{\"S\":\"$sid\"},\"timestamp\":{\"N\":\"$ts\"}}" \
      --region eu-west-1
  done
```

## Monitoring & Costs

### DynamoDB Costs

The table uses **PAY_PER_REQUEST** billing mode:
- **Write**: $1.25 per million write requests
- **Read**: $0.25 per million read requests
- **Storage**: $0.25 per GB-month

**Estimated costs** for moderate usage (1000 sessions/day):
- ~120K writes/month = ~$0.15/month
- Storage (with 90-day retention) = ~$0.10/month
- **Total**: ~$0.25-0.50/month

### CloudWatch Metrics

Monitor table metrics in CloudWatch:

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedWriteCapacityUnits \
  --dimensions Name=TableName,Value=moral-torture-machine-user-analytics \
  --start-time $(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum \
  --region eu-west-1
```

## Frontend Integration

To enable session tracking from the frontend, add a session ID header to all API requests:

```javascript
// Generate session ID once per session
const sessionId = localStorage.getItem('sessionId') ||
                  crypto.randomUUID();
localStorage.setItem('sessionId', sessionId);

// Add to all API requests
fetch('https://your-api/get-dilemma', {
  headers: {
    'X-Session-Id': sessionId,
    'Content-Type': 'application/json'
  }
});
```

## Troubleshooting

### Check if analytics is working

```bash
# Get recent events
aws dynamodb scan \
  --table-name moral-torture-machine-user-analytics \
  --limit 10 \
  --region eu-west-1
```

### View CloudWatch Logs

```bash
aws logs tail /aws/lambda/moral-torture-machine-api --follow --region eu-west-1 | grep "Analytics event tracked"
```

### Test analytics locally

```python
import boto3
import time

dynamodb = boto3.resource('dynamodb', region_name='eu-west-1')
table = dynamodb.Table('moral-torture-machine-user-analytics')

# Insert test event
table.put_item(Item={
    'sessionId': 'test-session-123',
    'timestamp': int(time.time() * 1000),
    'actionType': 'test_event',
    'language': 'en',
    'expirationTime': int(time.time()) + (90 * 24 * 60 * 60)
})

print("Test event inserted!")
```
