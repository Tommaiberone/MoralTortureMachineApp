# Security Improvements - Moral Torture Machine

## Summary

This document outlines the security enhancements implemented to address vulnerabilities in the application architecture.

## Completed Security Fixes

### Critical Priority

#### 1. ✅ Hardcoded API Endpoint Removed (CRITICAL)
**Issue**: API Gateway endpoint was hardcoded in frontend source code
**Risk**: Exposed API to reconnaissance, DDoS attacks, and abuse
**Fix**:
- Moved endpoint to environment variables (`VITE_API_URL`)
- Updated in:
  - `frontend/src/screens/EvaluationDilemmasScreen.jsx`
  - `frontend/src/screens/InfiniteDilemmasScreen.jsx`
  - `frontend/src/screens/ResultsScreen.jsx`
- Production URL now in `frontend/.env.prod`

**How to update**: Modify `VITE_API_URL` in `.env.prod` instead of code

#### 2. ✅ Groq API Key Migrated to AWS Secrets Manager (CRITICAL)
**Issue**: API key exposed in Lambda environment variables and Terraform state
**Risk**: Unauthorized API usage, financial exposure
**Fix**:
- Created AWS Secrets Manager secret: `moral-torture-machine-{env}-groq-api-key`
- Lambda retrieves key at runtime from Secrets Manager
- Implemented caching to reduce API calls
- GitHub Actions workflow updates secret automatically

**How to rotate key**:
```bash
aws secretsmanager put-secret-value \
  --secret-id moral-torture-machine-prod-groq-api-key \
  --secret-string "your-new-key" \
  --region eu-west-1
```

### High Priority

#### 3. ✅ CORS Configuration Restricted (HIGH)
**Issue**: Overly permissive CORS with `allow_methods=["*"]` and `allow_headers=["*"]`
**Risk**: CSRF attacks, XSS exploitation
**Fix**:
- Restricted methods to: `["GET", "POST"]`
- Restricted headers to: `["Content-Type", "Accept"]`
- Kept specific allowed origins (no wildcards)

**Location**: `backend/backend_fastapi.py` lines 32-33

#### 4. ✅ API Rate Limiting Implemented (HIGH)
**Issue**: No rate limiting on API endpoints
**Risk**: DDoS, cost injection through unlimited Groq API calls
**Fix**:
- API Gateway throttling: 50 requests/second
- Burst limit: 100 concurrent requests
- Applied at stage level

**Location**: `backend/terraform/main.tf` (API Gateway Stage)

#### 5. ✅ PII Filtering in CloudWatch Logs (HIGH)
**Issue**: Full URLs logged without sanitization
**Risk**: Exposure of user data in query parameters
**Fix**:
- Implemented middleware to sanitize logged URLs
- Only whitelisted parameters (e.g., `language`) are logged
- All other query parameters are filtered out

**Location**: `backend/backend_fastapi.py` lines 153-168

### Medium Priority

#### 6. ✅ Input Validation Enhanced (MEDIUM)
**Issue**: Insufficient validation could lead to NoSQL injection
**Risk**: Data manipulation, unauthorized access
**Fix**:
- Added Pydantic validation patterns for vote IDs
- Length and format validation for language parameters
- Request size limits on analyze-results endpoint
- Regex validation for vote types

**Locations**:
- `backend/backend_fastapi.py` (VoteRequest model, endpoint validators)

#### 7. ✅ Security Headers Added (MEDIUM)
**Issue**: Missing HTTP security headers
**Risk**: XSS, clickjacking, MIME sniffing attacks
**Fix**:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy: default-src 'self'`
- `Referrer-Policy: strict-origin-when-cross-origin`

**Location**: `backend/backend_fastapi.py` lines 141-151

#### 8. ✅ Dependencies Updated (MEDIUM)
**Status**: All dependencies verified and up-to-date as of 2025
- fastapi==0.115.5
- boto3==1.35.72
- pydantic==2.10.3
- requests==2.32.3

## Architecture Overview

```
┌─────────────┐     HTTPS      ┌──────────────┐
│   Frontend  │───────────────>│ CloudFront + │
│  (React)    │                 │   S3         │
└─────────────┘                 └──────────────┘
       │
       │ API calls (via env var)
       │
       v
┌──────────────┐
│ API Gateway  │  Rate limiting: 50 req/s
│              │  Throttle burst: 100
└──────┬───────┘
       │
       v
┌──────────────┐     Secrets Manager     ┌─────────────────┐
│   Lambda     │◄────────────────────────│  Groq API Key   │
│  (FastAPI)   │                          │   (encrypted)   │
└──────┬───────┘                          └─────────────────┘
       │
       v
┌──────────────┐
│  DynamoDB    │
└──────────────┘
```

## Security Best Practices

### 1. Secret Rotation
- Rotate Groq API key every 90 days
- Update via AWS Secrets Manager (not Terraform)
- Lambda caches key per cold start (no performance impact)

### 2. Access Control
- IAM roles follow least privilege principle
- Lambda can only read specific Secrets Manager secret
- DynamoDB access limited to required operations

### 3. Monitoring
- CloudWatch logs filtered for PII
- API Gateway access logs enabled
- Review logs regularly for suspicious activity

### 4. Incident Response
If API key is compromised:
1. Immediately rotate in Secrets Manager
2. Check CloudWatch logs for unauthorized usage
3. Review Groq API billing for anomalies
4. Update GitHub Secrets if needed

### 5. Development vs Production
- Development uses `API_KEY` environment variable for local testing
- Production always uses Secrets Manager
- Never commit actual API keys to git

## Remaining Recommendations

### Lower Priority (Optional)

1. **WAF Implementation**: Add AWS WAF for additional protection against common web exploits
2. **API Key Authentication**: Implement API key requirement for frontend clients
3. **Request Size Limits**: Add explicit payload size limits at API Gateway level
4. **DDoS Protection**: Consider AWS Shield Standard (already included) or Shield Advanced
5. **Monitoring Alerts**: Set up CloudWatch alarms for:
   - Unusual API call patterns
   - High error rates
   - Rate limit hits

## Testing Security Fixes

### Test Rate Limiting
```bash
# Should be throttled after 50 requests/second
for i in {1..100}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    https://your-api-gateway-url/get-dilemma &
done
```

### Test Input Validation
```bash
# Should return 400 for invalid input
curl -X POST https://your-api-gateway-url/vote \
  -H "Content-Type: application/json" \
  -d '{"_id": "'; DROP TABLE--", "vote": "yes"}'
```

### Test CORS
```bash
# Should reject requests from unauthorized origins
curl -X POST https://your-api-gateway-url/generate-dilemma \
  -H "Origin: https://evil.com" -v
```

## Cost Impact

Security improvements add minimal cost:
- Secrets Manager: ~$0.40/month per secret
- API Gateway throttling: No additional cost
- CloudWatch logs: ~$0.50-1/month (with retention)

**Total additional cost: ~$1-2/month**

## Compliance

These fixes address:
- OWASP Top 10 vulnerabilities
- AWS Well-Architected Framework Security Pillar
- General data protection best practices

## Questions?

For security concerns, contact the maintainer or open a GitHub issue.

---

**Last Updated**: 2025-01-24
**Security Audit Version**: 1.0
