#!/bin/bash

# Quick Start Script for Terraform Deployment
# This script helps you get started with Terraform deployment

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Terraform Quick Start - Moral Torture Machine  ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "main.tf" ]; then
    echo -e "${RED}Error: main.tf not found. Please run this script from the terraform directory.${NC}"
    exit 1
fi

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Terraform
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}✗ Terraform is not installed${NC}"
    echo "  Install from: https://www.terraform.io/downloads"
    exit 1
fi
echo -e "${GREEN}✓ Terraform installed: $(terraform version -json | grep -o '"terraform_version":"[^"]*' | cut -d'"' -f4)${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}✗ AWS CLI is not installed${NC}"
    echo "  Install from: https://aws.amazon.com/cli/"
    exit 1
fi
echo -e "${GREEN}✓ AWS CLI installed${NC}"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}✗ AWS credentials not configured${NC}"
    echo "  Run: aws configure"
    exit 1
fi
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ AWS credentials configured (Account: $ACCOUNT_ID)${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python 3 is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python 3 installed${NC}"

# Check pip
if ! command -v pip3 &> /dev/null && ! command -v pip &> /dev/null; then
    echo -e "${RED}✗ pip is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ pip installed${NC}"

echo ""

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    echo -e "${YELLOW}terraform.tfvars not found. Creating from template...${NC}"
    cp terraform.tfvars.example terraform.tfvars
    echo -e "${GREEN}✓ Created terraform.tfvars${NC}"
    echo ""
    echo -e "${YELLOW}⚠ IMPORTANT: Edit terraform.tfvars and set your Groq API key!${NC}"
    echo ""
    read -p "Would you like to set your Groq API key now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your Groq API Key: " API_KEY
        if [ ! -z "$API_KEY" ]; then
            # Update the API key in terraform.tfvars
            sed -i.bak "s/YOUR_GROQ_API_KEY_HERE/$API_KEY/" terraform.tfvars
            rm terraform.tfvars.bak
            echo -e "${GREEN}✓ API key set in terraform.tfvars${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Remember to edit terraform.tfvars before deploying!${NC}"
        echo "  Edit: nano terraform.tfvars"
        echo ""
        read -p "Press Enter to continue..."
    fi
fi

echo ""
echo -e "${YELLOW}Initializing Terraform...${NC}"

# Initialize Terraform
if [ ! -d ".terraform" ]; then
    terraform init
    echo -e "${GREEN}✓ Terraform initialized${NC}"
else
    echo -e "${GREEN}✓ Terraform already initialized${NC}"
fi

echo ""
echo -e "${YELLOW}Running terraform plan...${NC}"
echo -e "${BLUE}This will show you what resources will be created.${NC}"
echo ""

# Run terraform plan
terraform plan

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Ready to deploy!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Next steps:"
echo "  1. Review the plan above"
echo "  2. Run: ${GREEN}terraform apply${NC}"
echo "  3. Type 'yes' when prompted"
echo ""
echo "To deploy now, run:"
echo -e "  ${GREEN}terraform apply${NC}"
echo ""
echo "To see outputs after deployment:"
echo -e "  ${GREEN}terraform output${NC}"
echo ""
echo "To destroy all resources:"
echo -e "  ${RED}terraform destroy${NC}"
echo ""
