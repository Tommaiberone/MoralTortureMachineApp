#!/bin/bash

# Script per il deploy del frontend su S3 e invalidazione di CloudFront
# Usage: ./deploy.sh [bucket-name] [distribution-id]

set -e

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Moral Torture Machine - Frontend Deploy ===${NC}\n"

# Controlla se sono stati passati i parametri
if [ $# -eq 0 ]; then
  echo -e "${YELLOW}Recupero informazioni da Terraform...${NC}"

  # Prova a ottenere i valori da Terraform
  cd terraform
  BUCKET_NAME=$(terraform output -raw s3_bucket_name 2>/dev/null || echo "")
  DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null || echo "")
  cd ..

  if [ -z "$BUCKET_NAME" ] || [ -z "$DISTRIBUTION_ID" ]; then
    echo -e "${RED}Errore: Non ho trovato le informazioni necessarie da Terraform.${NC}"
    echo "Usage: ./deploy.sh [bucket-name] [distribution-id]"
    echo ""
    echo "Oppure esegui prima:"
    echo "  cd terraform"
    echo "  terraform init"
    echo "  terraform apply"
    exit 1
  fi
else
  BUCKET_NAME=$1
  DISTRIBUTION_ID=$2
fi

echo -e "Bucket S3: ${GREEN}${BUCKET_NAME}${NC}"
echo -e "CloudFront Distribution: ${GREEN}${DISTRIBUTION_ID}${NC}\n"

# Build del frontend
echo -e "${YELLOW}1. Building frontend...${NC}"
pnpm build

if [ ! -d "dist" ]; then
  echo -e "${RED}Errore: La directory dist non esiste. Il build è fallito.${NC}"
  exit 1
fi

# Sync su S3
echo -e "\n${YELLOW}2. Uploading to S3...${NC}"
aws s3 sync dist/ "s3://${BUCKET_NAME}/" --delete --cache-control "public, max-age=31536000, immutable" --exclude "index.html"

# Upload index.html con cache breve
echo -e "\n${YELLOW}3. Uploading index.html with short cache...${NC}"
aws s3 cp dist/index.html "s3://${BUCKET_NAME}/index.html" --cache-control "public, max-age=0, must-revalidate"

# Invalidazione CloudFront
echo -e "\n${YELLOW}4. Creating CloudFront invalidation...${NC}"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "${DISTRIBUTION_ID}" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)

echo -e "${GREEN}Invalidation created: ${INVALIDATION_ID}${NC}"

# Ottieni l'URL CloudFront
CLOUDFRONT_URL=$(aws cloudfront get-distribution \
  --id "${DISTRIBUTION_ID}" \
  --query 'Distribution.DomainName' \
  --output text)

echo -e "\n${GREEN}=== Deploy Complete! ===${NC}"
echo -e "Frontend URL: ${GREEN}https://${CLOUDFRONT_URL}${NC}"
echo -e "\nNote: CloudFront invalidation might take a few minutes to complete."
echo -e "Check status: aws cloudfront get-invalidation --distribution-id ${DISTRIBUTION_ID} --id ${INVALIDATION_ID}"
