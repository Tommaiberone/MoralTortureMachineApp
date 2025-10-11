# Terraform Deployment for Moral Torture Machine API

This directory contains Terraform configuration files to deploy the Moral Torture Machine API infrastructure to AWS.

## What This Deploys

This Terraform configuration replaces the `quick-deploy.sh` script and creates:

- **DynamoDB Table**: Stores dilemmas with on-demand billing
- **Lambda Function**: Runs the FastAPI application
- **API Gateway**: HTTP API with CORS configuration
- **IAM Roles & Policies**: Necessary permissions for Lambda to access DynamoDB
- **CloudWatch Log Groups**: For Lambda and API Gateway logs

## Prerequisites

1. **Terraform**: Install Terraform >= 1.0
   ```bash
   # macOS
   brew install terraform

   # Linux
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```

2. **AWS CLI**: Configured with credentials
   ```bash
   aws configure
   ```

3. **Python 3.11**: For building the Lambda package
   ```bash
   python3 --version
   ```

4. **pip**: For installing Python dependencies
   ```bash
   pip3 --version
   ```

## Quick Start

### 1. Configure Variables

Copy the example variables file and edit it:

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set your Groq API key:

```hcl
groq_api_key = "your-actual-groq-api-key"
```

### 2. Initialize Terraform

```bash
terraform init
```

This downloads the required providers (AWS, Archive, Null).

### 3. Review the Plan

```bash
terraform plan
```

This shows you what resources will be created.

### 4. Deploy

```bash
terraform apply
```

Type `yes` when prompted to confirm the deployment.

### 5. Get Your API Endpoint

After successful deployment, Terraform will output your API endpoint and other useful information:

```bash
terraform output api_endpoint
```

## Testing Your Deployment

After deployment completes, test your API:

```bash
# Health check
curl $(terraform output -raw api_endpoint)

# Get API documentation
curl $(terraform output -raw api_endpoint)/docs

# Get a random dilemma
curl $(terraform output -raw api_endpoint)/get-dilemma
```

## Viewing Logs

```bash
# View Lambda logs
aws logs tail $(terraform output -raw lambda_log_group) --follow --region us-east-1

# Or use the command from outputs
terraform output test_commands
```

## Configuration Options

### Variables

Edit `terraform.tfvars` to customize your deployment:

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS region for deployment | `us-east-1` |
| `stack_name` | Prefix for all resource names | `moral-torture-machine` |
| `table_name` | DynamoDB table name | `moral-torture-machine-dilemmas` |
| `environment` | Environment tag | `production` |
| `groq_api_key` | Groq API key for AI generation | `SET_THIS_LATER` |
| `cors_allowed_origins` | CORS allowed origins | See variables.tf |
| `log_retention_days` | CloudWatch log retention | `7` |
| `populate_db` | Auto-populate database | `true` |
| `force_rebuild` | Force Lambda rebuild | `false` |

### Passing Variables via Command Line

Instead of using `terraform.tfvars`, you can pass variables directly:

```bash
terraform apply -var="groq_api_key=your-key" -var="aws_region=eu-west-1"
```

## Updating Your Deployment

### Update Lambda Code

When you modify `backend_fastapi.py`, simply run:

```bash
terraform apply
```

Terraform will detect the change and rebuild/redeploy the Lambda function.

### Update API Key

```bash
terraform apply -var="groq_api_key=new-key"
```

### Force Rebuild

If you need to force a rebuild of the Lambda package:

```bash
terraform apply -var="force_rebuild=true"
```

## Managing Your Infrastructure

### View Current State

```bash
# List all resources
terraform state list

# Show specific resource
terraform state show aws_lambda_function.api
```

### View Outputs

```bash
# All outputs
terraform output

# Specific output
terraform output api_endpoint
terraform output deployment_summary
```

### Destroy Resources

To tear down all infrastructure:

```bash
terraform destroy
```

**Warning**: This will delete all data in the DynamoDB table!

## Comparison with quick-deploy.sh

### Advantages of Terraform

1. **Idempotent**: Run multiple times safely
2. **State Management**: Tracks infrastructure state
3. **Plan Before Apply**: See changes before making them
4. **Dependency Management**: Automatic resource ordering
5. **Rollback**: Easy to revert changes
6. **Version Control**: Infrastructure as code
7. **Modular**: Reusable and maintainable
8. **Multi-Environment**: Easy to create dev/staging/prod

### Migration from Bash Script

If you previously deployed with `quick-deploy.sh`:

1. **Import existing resources** (optional):
   ```bash
   # Import Lambda function
   terraform import aws_lambda_function.api moral-torture-machine-api

   # Import DynamoDB table
   terraform import aws_dynamodb_table.dilemmas moral-torture-machine-dilemmas

   # Import IAM role
   terraform import aws_iam_role.lambda_role moral-torture-machine-lambda-role
   ```

2. **Or start fresh**:
   - Delete old resources manually or via AWS CLI
   - Deploy with Terraform from scratch

## File Structure

```
terraform/
├── main.tf                    # Main infrastructure configuration
├── variables.tf               # Variable definitions
├── outputs.tf                 # Output definitions
├── terraform.tfvars.example   # Example variables file
└── README.md                  # This file
```

## Troubleshooting

### Lambda Package Build Fails

Ensure you're in the correct directory and dependencies are available:

```bash
cd shared/terraform
terraform apply
```

### Permission Denied Errors

Wait 10-15 seconds for IAM roles to propagate:

```bash
terraform apply
# If it fails, wait and retry:
terraform apply
```

### DynamoDB Population Fails

Make sure `populate_dynamodb.py` and `dilemmas.json` exist in the parent directory:

```bash
ls -la ../populate_dynamodb.py ../dilemmas.json
```

### State Lock Errors

If you have concurrent Terraform runs, you might see state lock errors. Wait for other operations to complete.

## Best Practices

1. **Use terraform.tfvars**: Don't commit sensitive data
2. **Remote State**: Consider using S3 backend for team collaboration
3. **Workspaces**: Use Terraform workspaces for multiple environments
4. **Validate**: Run `terraform validate` before applying
5. **Format**: Run `terraform fmt` to format code

## Advanced: Remote State

For team collaboration, configure remote state:

```hcl
# Add to main.tf
terraform {
  backend "s3" {
    bucket = "my-terraform-state-bucket"
    key    = "moral-torture-machine/terraform.tfstate"
    region = "us-east-1"
  }
}
```

## Cost Estimation

Estimated monthly costs for moderate usage:

- **Lambda**: ~$0-2 (1M requests free tier)
- **API Gateway**: ~$0-1 (1M requests free tier)
- **DynamoDB**: ~$0-2 (on-demand pricing)
- **CloudWatch Logs**: ~$0-0.50

**Total**: ~$0-5/month

## Support

For issues or questions:

1. Check Terraform outputs: `terraform output deployment_summary`
2. Review logs: `terraform output test_commands`
3. Validate configuration: `terraform validate`
4. Check AWS Console for resource status

## License

Same as the parent project.
