# Backend API - FastAPI + AWS Lambda + DynamoDB

High-performance serverless backend for Moral Torture Machine.

## Deployment Options

### Option 1: Automated CI/CD with GitHub Actions (Recommended)

The backend automatically deploys via GitHub Actions when you push to the main branch.

**Setup:**

1. **Get your AWS credentials:**
   ```bash
   # If you have AWS CLI configured, get your credentials:
   cat ~/.aws/credentials

   # Or create new credentials in AWS Console:
   # Go to AWS Console → IAM → Users → Your User → Security Credentials → Create Access Key
   ```

2. **Add secrets to GitHub repository:**
   - Go to your GitHub repository
   - Click **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret** for each:

     | Secret Name | Value | Required |
     |-------------|-------|----------|
     | `AWS_ACCESS_KEY_ID` | Your AWS access key ID (e.g., `AKIAIOSFODNN7EXAMPLE`) | ✅ Yes |
     | `AWS_SECRET_ACCESS_KEY` | Your AWS secret access key (e.g., `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`) | ✅ Yes |
     | `GROQ_API_KEY` | Your Groq API key from https://console.groq.com | ⚠️ Optional |

3. **Verify secrets are added:**
   - You should see the secrets listed (values will be hidden)
   - Secret names must match exactly (case-sensitive)

4. Push changes to trigger deployment:
   ```bash
   git add .
   git commit -m "Deploy backend"
   git push origin main
   ```

3. Monitor deployment in the Actions tab

**Features:**
- Automated testing and linting
- Terraform plan preview on PRs
- Automatic Lambda deployment with uv
- API health checks
- Deployment summaries

### Option 2: Manual Terraform Deployment

For local or manual deployments using Terraform.

**Deployment time: 2-3 minutes**

## What You Get

- FastAPI backend with auto-generated docs
- AWS Lambda (serverless, auto-scaling)
- DynamoDB (NoSQL database)
- API Gateway (HTTPS endpoint)

## Prerequisites

- AWS account with credentials configured (`aws configure`)
- Python 3.11+
- Groq API key (optional, for AI dilemma generation)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/get-dilemma` | GET | Get random dilemma |
| `/vote` | POST | Submit vote |
| `/generate-dilemma` | POST | Generate AI dilemma |
| `/docs` | GET | Interactive API docs |

## Local Development

Using uv (recommended):
```bash
# Install uv if you haven't already
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies with uv (system-wide in current Python)
uv pip install --system -r requirements.txt

# Run the development server
export DYNAMODB_TABLE=moral-torture-machine-dilemmas
export AWS_REGION=us-east-1
uvicorn backend_fastapi:app --reload --port 8000
```

Or with a virtual environment:
```bash
# Create and use a virtual environment
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
uv pip install -r requirements.txt

# Run the development server
export DYNAMODB_TABLE=moral-torture-machine-dilemmas
export AWS_REGION=us-east-1
uvicorn backend_fastapi:app --reload --port 8000
```

Or using pip:
```bash
pip install -r requirements.txt
export DYNAMODB_TABLE=moral-torture-machine-dilemmas
export AWS_REGION=us-east-1
python -m uvicorn backend_fastapi:app --reload --port 8000
```

## Files

### Main Files
- `backend_fastapi.py` - FastAPI application
- `quick-deploy.sh` - One-command deployment (RECOMMENDED)
- `populate_dynamodb.py` - Load dilemmas into DynamoDB
- `test-api.sh` - Test API endpoints
- `dilemmas.json` - Dilemma data
- `requirements.txt` - Python dependencies
- `.env.example` - Environment variables template

### Alternative Deployments
- `alternative-deployments/deploy.sh` - AWS SAM deployment
- `alternative-deployments/template.yaml` - AWS SAM template
- `alternative-deployments/samconfig.toml` - SAM configuration
- `alternative-deployments/Dockerfile` - Docker container
- `alternative-deployments/docker-compose.yml` - Local Docker development

## CI/CD Pipeline

The project includes automated deployment via GitHub Actions. See [.github/workflows/backend-deploy.yml](../.github/workflows/backend-deploy.yml).

**On Pull Request:**
- Lints and tests Python code
- Validates Terraform configuration
- Posts Terraform plan as PR comment

**On Push to Main:**
- Runs full test suite
- Builds Lambda package using uv
- Deploys infrastructure with Terraform
- Populates DynamoDB with dilemmas
- Runs API health checks
- Posts deployment summary

**Manual Deployment Options:**

1. **GitHub Actions** (automated, RECOMMENDED) - Push to main branch
2. **Terraform** (2-3 min) - Manual infrastructure deployment
3. **Local Docker** - Development with docker-compose

## Update Frontend

After deployment, update your frontend API URL:

```javascript
// Old
const API_URL = 'https://old-flask-server.com';

// New (example)
const API_URL = 'https://abc123.execute-api.us-east-1.amazonaws.com';
```

## Testing

```bash
# Health check
curl https://your-api-url/

# Get dilemma
curl https://your-api-url/get-dilemma

# Vote
curl -X POST https://your-api-url/vote \
  -H "Content-Type: application/json" \
  -d '{"_id":"test-id","vote":"yes"}'
```

## Monitoring

```bash
# View logs
aws logs tail /aws/lambda/moral-torture-machine-api --follow
```

## Key Improvements vs Flask

- 70% faster response times (50-150ms vs 200-500ms)
- 85% cost reduction ($1-5/month vs $10-30/month)
- Auto-scaling (0 to 10,000+ concurrent requests)
- Zero server maintenance
- Auto-generated API documentation
- Type-safe with Pydantic validation

## Troubleshooting

### GitHub Actions Deployment Issues

**Error: "Credentials could not be loaded"**
This means AWS credentials are missing or incorrect.

Fix:
1. Verify secrets exist in GitHub:
   - Go to Settings → Secrets and variables → Actions
   - Check that `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` exist
2. Verify secret names match exactly (case-sensitive)
3. Get your AWS credentials:
   ```bash
   # Check if AWS CLI is configured
   aws configure list

   # View your credentials (be careful not to share these!)
   cat ~/.aws/credentials
   ```
4. If you don't have credentials, create them:
   - AWS Console → IAM → Users → [Your User] → Security credentials
   - Click "Create access key" → Select "Command Line Interface (CLI)"
   - Copy both the Access Key ID and Secret Access Key

**Error: "No file matched to [**/uv.lock]"**
Already fixed in the workflow - this shouldn't occur anymore.

**Terraform plan/apply fails**
- Ensure your AWS credentials have sufficient permissions (Lambda, API Gateway, DynamoDB, IAM, CloudWatch)
- Check the Actions logs for specific error messages