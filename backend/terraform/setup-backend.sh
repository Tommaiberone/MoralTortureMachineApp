#!/bin/bash
# Setup script for Terraform remote backend
# This creates the S3 bucket and DynamoDB table needed for state management

set -e

REGION="eu-west-1"
BUCKET_NAME="moral-torture-machine-terraform-state"
DYNAMODB_TABLE="moral-torture-machine-terraform-locks"

echo "Setting up Terraform backend infrastructure in ${REGION}..."

# Create S3 bucket for state storage
echo "Creating S3 bucket: ${BUCKET_NAME}..."
if aws s3api head-bucket --bucket "${BUCKET_NAME}" 2>/dev/null; then
    echo "  ✓ Bucket already exists"
else
    aws s3api create-bucket \
        --bucket "${BUCKET_NAME}" \
        --region "${REGION}" \
        --create-bucket-configuration LocationConstraint="${REGION}"

    # Enable versioning
    aws s3api put-bucket-versioning \
        --bucket "${BUCKET_NAME}" \
        --versioning-configuration Status=Enabled

    # Enable encryption
    aws s3api put-bucket-encryption \
        --bucket "${BUCKET_NAME}" \
        --server-side-encryption-configuration '{
            "Rules": [{
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }]
        }'

    # Block public access
    aws s3api put-public-access-block \
        --bucket "${BUCKET_NAME}" \
        --public-access-block-configuration \
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

    echo "  ✓ Bucket created and configured"
fi

# Create DynamoDB table for state locking
echo "Creating DynamoDB table: ${DYNAMODB_TABLE}..."
if aws dynamodb describe-table --table-name "${DYNAMODB_TABLE}" --region "${REGION}" 2>/dev/null >/dev/null; then
    echo "  ✓ Table already exists"
else
    aws dynamodb create-table \
        --table-name "${DYNAMODB_TABLE}" \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region "${REGION}"

    echo "  ✓ Table created"
fi

echo ""
echo "✓ Backend infrastructure ready!"
echo ""
echo "Next steps:"
echo "1. Run 'terraform init -migrate-state' to migrate local state to S3"
echo "2. Commit the backend.tf file to your repository"
