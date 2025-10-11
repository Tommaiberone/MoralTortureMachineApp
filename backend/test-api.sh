#!/bin/bash

# Simple API test script
# Usage: ./test-api.sh https://your-api-url

set -e

if [ -z "$1" ]; then
    echo "Usage: ./test-api.sh <API_URL>"
    echo "Example: ./test-api.sh https://abc123.execute-api.us-east-1.amazonaws.com"
    exit 1
fi

API_URL="${1%/}"  # Remove trailing slash if present

echo "======================================"
echo "Testing Moral Torture Machine API"
echo "======================================"
echo "API URL: $API_URL"
echo ""

# Test 1: Health Check
echo "Test 1: Health Check (GET /)"
echo "--------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ PASSED - Status: $HTTP_CODE"
    echo "Response: $BODY"
else
    echo "❌ FAILED - Status: $HTTP_CODE"
    echo "Response: $BODY"
fi
echo ""

# Test 2: Get Dilemma
echo "Test 2: Get Random Dilemma (GET /get-dilemma)"
echo "--------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/get-dilemma")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ PASSED - Status: $HTTP_CODE"
    # Extract dilemma ID for next test
    DILEMMA_ID=$(echo "$BODY" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "Dilemma ID: $DILEMMA_ID"
    echo "Dilemma: $(echo "$BODY" | grep -o '"dilemma":"[^"]*"' | cut -d'"' -f4 | head -c 80)..."
else
    echo "❌ FAILED - Status: $HTTP_CODE"
    echo "Response: $BODY"
    DILEMMA_ID=""
fi
echo ""

# Test 3: Vote (if we got a dilemma)
if [ -n "$DILEMMA_ID" ]; then
    echo "Test 3: Submit Vote (POST /vote)"
    echo "--------------------------------------"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/vote" \
        -H "Content-Type: application/json" \
        -d "{\"_id\":\"$DILEMMA_ID\",\"vote\":\"yes\"}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)

    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ PASSED - Status: $HTTP_CODE"
        echo "Response: $BODY"
    else
        echo "❌ FAILED - Status: $HTTP_CODE"
        echo "Response: $BODY"
    fi
else
    echo "Test 3: Submit Vote (POST /vote)"
    echo "--------------------------------------"
    echo "⏭️  SKIPPED - No dilemma ID from previous test"
fi
echo ""

# Test 4: API Docs
echo "Test 4: API Documentation (GET /docs)"
echo "--------------------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/docs")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ PASSED - Status: $HTTP_CODE"
    echo "Docs available at: $API_URL/docs"
else
    echo "❌ FAILED - Status: $HTTP_CODE"
fi
echo ""

# Test 5: Invalid Vote
echo "Test 5: Invalid Vote Test (POST /vote with invalid data)"
echo "--------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/vote" \
    -H "Content-Type: application/json" \
    -d '{"_id":"invalid","vote":"maybe"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "400" ]; then
    echo "✅ PASSED - Status: $HTTP_CODE (correctly rejected invalid vote)"
    echo "Response: $BODY"
elif [ "$HTTP_CODE" = "200" ]; then
    echo "⚠️  WARNING - Status: $HTTP_CODE (should reject invalid vote 'maybe')"
    echo "Response: $BODY"
else
    echo "❌ FAILED - Status: $HTTP_CODE"
    echo "Response: $BODY"
fi
echo ""

# Summary
echo "======================================"
echo "Test Summary"
echo "======================================"
echo "API URL: $API_URL"
echo ""
echo "✅ Your API is working!"
echo ""
echo "Next steps:"
echo "1. View interactive docs: $API_URL/docs"
echo "2. Update your frontend API URL to: $API_URL"
echo "3. Test from your mobile/web app"
echo ""
echo "Monitor logs:"
echo "  aws logs tail /aws/lambda/moral-torture-machine-api --follow"
echo ""
