# Migration Guide: quick-deploy.sh to Terraform

This document explains how the Terraform configuration replaces the `quick-deploy.sh` bash script.

## Feature Comparison

| Feature | quick-deploy.sh | Terraform |
|---------|----------------|-----------|
| DynamoDB Table | ✅ Creates with AWS CLI | ✅ `aws_dynamodb_table.dilemmas` |
| IAM Role | ✅ Creates manually | ✅ `aws_iam_role.lambda_role` |
| Lambda Policies | ✅ Attaches policies | ✅ `aws_iam_role_policy` |
| Lambda Package Build | ✅ Bash script | ✅ `null_resource.lambda_package` |
| Lambda Function | ✅ Creates/updates | ✅ `aws_lambda_function.api` |
| API Gateway | ✅ HTTP API | ✅ `aws_apigatewayv2_api.api` |
| CORS Config | ✅ Configured | ✅ In API Gateway config |
| DB Population | ✅ Python script | ✅ `null_resource.populate_dynamodb` |
| State Management | ❌ Manual checks | ✅ Automatic via tfstate |
| Rollback Support | ❌ Manual | ✅ Built-in |
| Change Preview | ❌ No | ✅ `terraform plan` |
| CloudWatch Logs | ❌ Auto-created | ✅ Explicit resources |
| Tags | ❌ No | ✅ Consistent tagging |

## Resource Mapping

### Bash Script → Terraform Resource

```
quick-deploy.sh Step 1 (DynamoDB)
└─> aws_dynamodb_table.dilemmas

quick-deploy.sh Step 2 (IAM)
├─> aws_iam_role.lambda_role
├─> aws_iam_role_policy_attachment.lambda_basic
└─> aws_iam_role_policy.dynamodb_policy

quick-deploy.sh Step 3 (Lambda Package)
├─> null_resource.lambda_package
└─> data.archive_file.lambda_zip

quick-deploy.sh Step 4 (Lambda Function)
├─> aws_lambda_function.api
└─> aws_cloudwatch_log_group.lambda_logs

quick-deploy.sh Step 5 (API Gateway)
├─> aws_apigatewayv2_api.api
├─> aws_apigatewayv2_integration.lambda
├─> aws_apigatewayv2_route.default
├─> aws_apigatewayv2_stage.default
├─> aws_cloudwatch_log_group.api_logs
└─> aws_lambda_permission.api_gateway

quick-deploy.sh Step 6 (Populate DB)
└─> null_resource.populate_dynamodb
```

## Migration Steps

### Option 1: Fresh Deployment (Recommended)

1. **Destroy old infrastructure**:
   ```bash
   # Delete Lambda
   aws lambda delete-function --function-name moral-torture-machine-api

   # Delete API Gateway (get API ID first)
   API_ID=$(aws apigatewayv2 get-apis --query "Items[?Name=='moral-torture-machine-api'].ApiId" --output text)
   aws apigatewayv2 delete-api --api-id $API_ID

   # Delete IAM role policies
   aws iam detach-role-policy --role-name moral-torture-machine-lambda-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
   aws iam delete-role-policy --role-name moral-torture-machine-lambda-role --policy-name dynamodb-access
   aws iam delete-role --role-name moral-torture-machine-lambda-role

   # Optional: Delete DynamoDB table (WARNING: loses all data!)
   # aws dynamodb delete-table --table-name moral-torture-machine-dilemmas
   ```

2. **Deploy with Terraform**:
   ```bash
   cd shared/terraform
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your API key
   terraform init
   terraform apply
   ```

### Option 2: Import Existing Resources

If you want to keep your existing resources and manage them with Terraform:

1. **Initialize Terraform**:
   ```bash
   cd shared/terraform
   cp terraform.tfvars.example terraform.tfvars
   terraform init
   ```

2. **Import existing resources**:
   ```bash
   # Get your AWS account ID and region
   ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
   REGION="us-east-1"

   # Import DynamoDB table
   terraform import aws_dynamodb_table.dilemmas moral-torture-machine-dilemmas

   # Import IAM role
   terraform import aws_iam_role.lambda_role moral-torture-machine-lambda-role

   # Import IAM role policy attachment
   terraform import aws_iam_role_policy_attachment.lambda_basic moral-torture-machine-lambda-role/arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

   # Import IAM role policy
   terraform import aws_iam_role_policy.dynamodb_policy moral-torture-machine-lambda-role:dynamodb-access

   # Import Lambda function
   terraform import aws_lambda_function.api moral-torture-machine-api

   # Import API Gateway
   API_ID=$(aws apigatewayv2 get-apis --query "Items[?Name=='moral-torture-machine-api'].ApiId" --output text --region $REGION)
   terraform import aws_apigatewayv2_api.api $API_ID

   # Import API Gateway integration
   INTEGRATION_ID=$(aws apigatewayv2 get-integrations --api-id $API_ID --query "Items[0].IntegrationId" --output text --region $REGION)
   terraform import aws_apigatewayv2_integration.lambda $API_ID/$INTEGRATION_ID

   # Import API Gateway route
   ROUTE_ID=$(aws apigatewayv2 get-routes --api-id $API_ID --query "Items[?RouteKey=='\$default'].RouteId" --output text --region $REGION)
   terraform import aws_apigatewayv2_route.default $API_ID/$ROUTE_ID

   # Import API Gateway stage
   terraform import aws_apigatewayv2_stage.default $API_ID/\$default

   # Note: CloudWatch log groups will be created by Terraform if they don't exist
   # Lambda permission will need to be recreated
   ```

3. **Verify and apply**:
   ```bash
   terraform plan  # Should show minimal changes
   terraform apply
   ```

## Key Improvements in Terraform Version

### 1. **Better State Management**
   - Terraform tracks what exists vs what's defined
   - Prevents duplicate resource creation
   - Detects drift from desired state

### 2. **Automated Dependency Ordering**
   - No need for manual `sleep` or `wait` commands
   - Terraform handles IAM propagation automatically
   - Resources created in correct order

### 3. **Change Preview**
   ```bash
   terraform plan  # See what will change BEFORE applying
   ```

### 4. **Idempotent Operations**
   - Run `terraform apply` multiple times safely
   - Only changes what needs to change

### 5. **Proper Cleanup**
   ```bash
   terraform destroy  # Removes everything correctly
   ```

### 6. **Environment Management**
   ```bash
   # Easy to create multiple environments
   terraform workspace new dev
   terraform workspace new staging
   terraform workspace new prod
   ```

### 7. **Version Control**
   - All infrastructure as code
   - Review changes via Git
   - Rollback by reverting commits

### 8. **Better Error Handling**
   - Automatic rollback on failure
   - Detailed error messages
   - Resource dependency tracking

### 9. **Explicit Logging Resources**
   - CloudWatch log groups created explicitly
   - Configurable retention periods
   - Better cost control

### 10. **Consistent Tagging**
   - All resources tagged with Environment, ManagedBy
   - Better resource organization
   - Easier cost allocation

## What's Different?

### Lambda Package Build

**Bash Script**:
```bash
rm -rf lambda_deployment lambda_function.zip
mkdir lambda_deployment
cp backend_fastapi.py lambda_deployment/
pip install -q -r requirements.txt -t lambda_deployment/
cd lambda_deployment
zip -q -r ../lambda_function.zip .
cd ..
```

**Terraform**:
```hcl
resource "null_resource" "lambda_package" {
  triggers = {
    backend_code = filemd5("../backend_fastapi.py")
    requirements = filemd5("../requirements.txt")
  }

  provisioner "local-exec" {
    command = <<-EOT
      # Same build process, but only runs when files change
    EOT
  }
}
```

### Resource Existence Checks

**Bash Script**:
```bash
if aws dynamodb describe-table --table-name $TABLE_NAME &> /dev/null; then
    echo "Table already exists, skipping..."
else
    # Create table
fi
```

**Terraform**:
```hcl
# Just declare what you want - Terraform handles the rest
resource "aws_dynamodb_table" "dilemmas" {
  name = var.table_name
  # ...
}
```

### API Key Configuration

**Bash Script**:
```bash
read -p "Enter your Groq API Key: " API_KEY
if [ -z "$API_KEY" ]; then
    API_KEY="SET_THIS_LATER"
fi
```

**Terraform**:
```hcl
# In terraform.tfvars
groq_api_key = "your-key"

# Or via command line
terraform apply -var="groq_api_key=your-key"

# Or via environment variable
export TF_VAR_groq_api_key="your-key"
terraform apply
```

## Workflow Comparison

### Bash Script Workflow

1. Run `./quick-deploy.sh`
2. Enter API key when prompted
3. Wait for deployment
4. Copy API endpoint from output
5. To update: Run script again (creates or updates)
6. To destroy: Manual AWS CLI commands

### Terraform Workflow

1. `terraform init` (first time only)
2. `cp terraform.tfvars.example terraform.tfvars`
3. Edit `terraform.tfvars` with your API key
4. `terraform plan` (preview changes)
5. `terraform apply` (deploy)
6. To update: Modify config, `terraform apply`
7. To destroy: `terraform destroy`

## Troubleshooting Common Migration Issues

### Issue: Resources Already Exist

**Error**: "Resource already exists"

**Solution**: Either import existing resources or destroy them first.

### Issue: IAM Role Not Ready

**Bash**: Had to `sleep 10`

**Terraform**: Handles this automatically with `depends_on`

### Issue: Lambda Package Not Found

**Solution**: Make sure you're in the `terraform` directory when running commands.

### Issue: State Lock

**Error**: "Error acquiring the state lock"

**Solution**: Wait for other Terraform operations to complete, or break the lock if stuck:
```bash
terraform force-unlock LOCK_ID
```

## Cost Considerations

Both approaches result in the same infrastructure and costs:
- Lambda: Free tier covers most personal projects
- API Gateway: Free tier for HTTP APIs
- DynamoDB: Pay-per-request is cost-effective for low traffic
- CloudWatch: Minimal costs for log storage

**Estimated**: $0-5/month for moderate usage

## Recommendation

**Use Terraform** for:
- Production deployments
- Team collaboration
- Multiple environments
- Infrastructure as code practices
- Easier updates and rollbacks

**Keep bash script** for:
- Quick one-off deployments
- Learning/experimentation
- CI/CD pipelines that prefer bash

## Next Steps

After migration:

1. Test your API endpoint
2. Verify logs in CloudWatch
3. Test database population
4. Update any deployment documentation
5. Set up remote state for team collaboration
6. Consider creating dev/staging environments

## Support

If you encounter issues during migration:

1. Check `terraform plan` output carefully
2. Review AWS Console for resource states
3. Use `terraform state list` to see what's managed
4. Check CloudWatch logs for Lambda/API Gateway errors
