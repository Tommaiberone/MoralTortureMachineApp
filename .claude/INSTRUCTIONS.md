# Claude Code Instructions for This Project

## Code Modification Guidelines

When making ANY code changes in this project, always provide:

1. **What Changed**: Clear description of the specific modifications
2. **Why It Changed**: The problem or requirement driving the change
3. **Why This Approach**: Justification for the chosen solution
4. **Alternative Approaches**: Other methods considered and why they weren't selected
5. **Learning Path**: Steps the user can follow to make similar changes independently

## Goal
Enable the developer to understand each change deeply enough to replicate it independently in the future.

## Example Format

```
## What I Changed
Modified the CORS configuration in backend_fastapi.py

## Why I Made This Change
The frontend was getting CORS errors because the CloudFront domain wasn't whitelisted

## Why This Approach
Using FastAPI's CORSMiddleware with explicit domain whitelisting is the standard, secure approach

## Alternative Approaches Considered
- Using allow_origins=["*"] - rejected due to security concerns
- Configuring CORS at API Gateway level - rejected because it's less flexible

## How to Do This Yourself
1. Open the FastAPI app file
2. Find the CORSMiddleware configuration
3. Add your new domain to the allow_origins list
4. Redeploy the Lambda function
```
