# CloudFront Configuration Guide - Terraform Implementation

This guide translates CloudFront configuration best practices into Terraform code and provides troubleshooting steps for common issues.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Terraform Configuration](#terraform-configuration)
3. [Alternate Domain Names (CNAMEs)](#alternate-domain-names-cnames)
4. [SSL/TLS Certificate Configuration](#ssltls-certificate-configuration)
5. [Cloudflare Integration](#cloudflare-integration)
6. [Deployment and Validation](#deployment-and-validation)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:
- AWS CLI configured with appropriate credentials
- Terraform v1.0 or higher installed
- A domain registered and managed in Cloudflare (if using custom domain)
- Access to Cloudflare DNS settings

---

## Terraform Configuration

### Step 1: Configure Variables

Edit `terraform.tfvars` or pass variables via command line:

```hcl
# terraform.tfvars
aws_region         = "eu-west-1"
stack_name         = "moral-torture-machine"
bucket_name        = "moral-torture-machine-frontend"
environment        = "production"

# Custom Domain Configuration
use_custom_domain  = true
domain_name        = "moraltorturemachine.com"  # Change to your domain
```

**Important Notes:**
- `domain_name` should be your root domain (e.g., `example.com`)
- The configuration automatically includes `www.example.com` as an alternate name
- Set `use_custom_domain = false` if you want to use only the CloudFront domain

---

## Alternate Domain Names (CNAMEs)

### Configuration in Terraform

The CloudFront distribution is configured with alternate domain names (aliases) in `main.tf`:

```hcl
resource "aws_cloudfront_distribution" "frontend" {
  # ... other configuration ...

  # THIS IS CRITICAL - Must match your domain exactly
  aliases = var.use_custom_domain && var.domain_name != "" ? [
    var.domain_name,              # e.g., moraltorturemachine.com
    "www.${var.domain_name}"      # e.g., www.moraltorturemachine.com
  ] : []

  # ... rest of configuration ...
}
```

### What This Does

1. **Enables Custom Domain**: Tells CloudFront to accept requests for your domain name
2. **Includes www Subdomain**: Automatically adds both root and www versions
3. **Prevents 403 Errors**: Without this, CloudFront rejects requests with 403 Forbidden

### Common Mistake

**ERROR**: Leaving `aliases` empty or not matching the domain in your DNS
**RESULT**: HTTP 403 Forbidden error when accessing your domain
**FIX**: Ensure `domain_name` variable matches your actual domain exactly

### Validation

After deployment, verify in AWS Console:
1. Go to CloudFront → Your Distribution
2. Under "General" tab, check "Alternate domain names (CNAMEs)"
3. Should show both `yourdomain.com` and `www.yourdomain.com`

---

## SSL/TLS Certificate Configuration

### Terraform Configuration

The ACM certificate is automatically created in `us-east-1` (required for CloudFront):

```hcl
# ACM Certificate - MUST be in us-east-1 for CloudFront
resource "aws_acm_certificate" "frontend" {
  count                     = var.use_custom_domain ? 1 : 0
  provider                  = aws.us_east_1  # Critical: CloudFront requires us-east-1
  domain_name               = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# CloudFront viewer certificate configuration
resource "aws_cloudfront_distribution" "frontend" {
  # ... other configuration ...

  viewer_certificate {
    cloudfront_default_certificate = var.use_custom_domain ? false : true
    acm_certificate_arn            = var.use_custom_domain ? aws_acm_certificate.frontend[0].arn : null
    ssl_support_method             = var.use_custom_domain ? "sni-only" : null
    minimum_protocol_version       = "TLSv1.2_2021"  # Secure TLS version
  }
}
```

### Key Points

1. **us-east-1 Requirement**: CloudFront ONLY works with certificates in `us-east-1`
2. **DNS Validation**: Certificate must be validated via DNS (requires Cloudflare CNAME records)
3. **SNI Support**: Uses Server Name Indication (no additional cost)
4. **TLS 1.2+**: Enforces modern, secure TLS protocol

### Certificate Validation Process

After running `terraform apply`:

1. **Get Validation Records**:
   ```bash
   terraform output certificate_validation_records
   ```

2. **Add to Cloudflare DNS**:
   - Go to Cloudflare Dashboard → DNS
   - Add CNAME records from the output
   - Example:
     ```
     Type: CNAME
     Name: _abc123.moraltorturemachine.com
     Target: _xyz789.acm-validations.aws.
     Proxy: DNS only (grey cloud)
     ```

3. **Wait for Validation**:
   - Check AWS ACM Console (us-east-1 region)
   - Status should change from "Pending validation" to "Issued"
   - Usually takes 5-10 minutes

---

## Cloudflare Integration

### SSL/TLS Encryption Mode

**CRITICAL CONFIGURATION**: This is the #1 cause of redirect loops and SSL errors.

#### Access Cloudflare Settings

1. Log in to Cloudflare Dashboard
2. Select your domain
3. Go to **SSL/TLS** → **Overview**

#### Recommended Configuration

| Mode | Cloudflare → User | Cloudflare → CloudFront | Recommended? |
|------|------------------|------------------------|--------------|
| **Flexible** | Encrypted | **NOT Encrypted (HTTP)** | ❌ **NO** - Causes redirect loops |
| **Full** | Encrypted | Encrypted (no verification) | ⚠️ **Maybe** - Works but less secure |
| **Full (Strict)** | Encrypted | Encrypted + Verified | ✅ **YES** - Most secure and reliable |

#### Why Full (Strict) is Required

1. CloudFront has a valid AWS SSL certificate
2. Cloudflare can verify this certificate
3. The entire chain is encrypted and verified
4. Prevents redirect loops caused by HTTP → HTTPS redirects

#### Terraform Configuration for HTTPS

The Terraform configuration enforces HTTPS:

```hcl
resource "aws_cloudfront_distribution" "frontend" {
  # ... other configuration ...

  default_cache_behavior {
    viewer_protocol_policy = "redirect-to-https"  # Enforces HTTPS
    # ... other settings ...
  }
}
```

### DNS Configuration in Cloudflare

After CloudFront is deployed and certificate is validated:

1. **Get CloudFront Domain**:
   ```bash
   terraform output cloudfront_url_for_cloudflare
   ```
   Example output: `d111111abcdef8.cloudfront.net`

2. **Add CNAME Records in Cloudflare**:

   **Root Domain (@)**:
   - Type: `CNAME`
   - Name: `@` (or your domain name)
   - Target: `d111111abcdef8.cloudfront.net` (from terraform output)
   - Proxy status: **DNS only** (grey cloud) ⚠️ Important
   - TTL: Auto

   **www Subdomain**:
   - Type: `CNAME`
   - Name: `www`
   - Target: `d111111abcdef8.cloudfront.net` (same as above)
   - Proxy status: **DNS only** (grey cloud) ⚠️ Important
   - TTL: Auto

#### Proxy Status: DNS Only vs Proxied

**Use DNS Only (Grey Cloud)** when:
- ✅ You want CloudFront to handle SSL/TLS
- ✅ You want to use CloudFront caching
- ✅ You've configured custom domain in CloudFront

**Use Proxied (Orange Cloud)** when:
- Only if you need Cloudflare-specific features (WAF, DDoS, etc.)
- **Must** use Full (Strict) SSL mode
- May add latency (double proxy: Cloudflare → CloudFront → S3)

---

## Deployment and Validation

### Step 1: Initialize Terraform

```bash
cd web/terraform
terraform init
```

### Step 2: Plan Deployment

```bash
terraform plan -var="use_custom_domain=true" -var="domain_name=moraltorturemachine.com"
```

Review the plan to ensure:
- Certificate will be created in us-east-1
- CloudFront distribution includes your domain aliases
- S3 bucket policy allows CloudFront access

### Step 3: Apply Configuration

```bash
terraform apply -var="use_custom_domain=true" -var="domain_name=moraltorturemachine.com"
```

### Step 4: Validate Certificate

1. Get validation records:
   ```bash
   terraform output certificate_validation_records
   ```

2. Add CNAME records to Cloudflare DNS

3. Wait for validation (check AWS ACM Console in us-east-1)

### Step 5: Configure DNS

1. Get CloudFront domain:
   ```bash
   terraform output cloudfront_url_for_cloudflare
   ```

2. Add CNAME records in Cloudflare (see [DNS Configuration](#dns-configuration-in-cloudflare))

3. Set SSL/TLS mode to **Full (Strict)**

### Step 6: Deploy Frontend

```bash
cd ../  # Go to web directory
pnpm build
aws s3 sync dist/ s3://moral-torture-machine-frontend/ --delete
aws cloudfront create-invalidation --distribution-id $(terraform -chdir=terraform output -raw cloudfront_distribution_id) --paths "/*"
```

### Step 7: Verify Deployment

1. **Check Distribution Status**:
   - Go to AWS Console → CloudFront
   - Ensure Status is "Enabled"
   - Ensure State is "Deployed" (not "In Progress")

2. **Test Domain Access**:
   ```bash
   curl -I https://moraltorturemachine.com
   curl -I https://www.moraltorturemachine.com
   ```
   Should return `200 OK`

3. **Verify SSL**:
   ```bash
   openssl s_client -connect moraltorturemachine.com:443 -servername moraltorturemachine.com
   ```
   Should show valid certificate

---

## Troubleshooting

### Issue 1: HTTP 403 Forbidden Error

**Symptoms**: Accessing your domain returns 403 Forbidden

**Causes & Solutions**:

1. **Missing Alternate Domain Names (CNAMEs)**
   ```bash
   # Check CloudFront configuration
   aws cloudfront get-distribution --id $(terraform output -raw cloudfront_distribution_id) | jq '.Distribution.DistributionConfig.Aliases'
   ```
   **Fix**: Verify `domain_name` variable is set correctly and run `terraform apply`

2. **Distribution Not Deployed**
   ```bash
   # Check distribution status
   aws cloudfront get-distribution --id $(terraform output -raw cloudfront_distribution_id) | jq '.Distribution.Status'
   ```
   **Fix**: Wait for status to change from "InProgress" to "Deployed"

3. **Certificate Not Validated**
   - Go to ACM Console (us-east-1 region)
   - Check certificate status
   **Fix**: Add validation CNAME records to Cloudflare

### Issue 2: Redirect Loop (Too Many Redirects)

**Symptoms**: Browser shows "ERR_TOO_MANY_REDIRECTS"

**Cause**: Cloudflare SSL/TLS mode set to "Flexible"

**Solution**:
1. Go to Cloudflare → SSL/TLS → Overview
2. Change mode from "Flexible" to **"Full (Strict)"**
3. Wait 1-2 minutes for settings to propagate
4. Clear browser cache and try again

### Issue 3: Certificate Validation Stuck

**Symptoms**: ACM certificate shows "Pending validation" for more than 30 minutes

**Solutions**:

1. **Verify CNAME Records in Cloudflare**:
   ```bash
   # Get the validation record from Terraform
   terraform output certificate_validation_records

   # Check if it's in Cloudflare DNS
   dig _abc123.moraltorturemachine.com CNAME
   ```

2. **Check for Duplicate Records**:
   - Remove any duplicate validation records in Cloudflare
   - Keep only the CNAME records from Terraform output

3. **Ensure Proxy is Disabled**:
   - Validation CNAME records must be "DNS only" (grey cloud)
   - Orange cloud will prevent validation

### Issue 4: Domain Not Resolving

**Symptoms**: `nslookup` or `dig` doesn't return CloudFront IP

**Solutions**:

1. **Check DNS Records**:
   ```bash
   dig moraltorturemachine.com
   dig www.moraltorturemachine.com
   ```
   Should return CNAME pointing to CloudFront

2. **Verify CNAME Target**:
   ```bash
   terraform output cloudfront_url_for_cloudflare
   ```
   Should match the CNAME target in Cloudflare

3. **Wait for DNS Propagation**:
   - Can take up to 48 hours (usually 5-30 minutes)
   - Check with: `https://www.whatsmydns.net/`

### Issue 5: HTTPS Not Working

**Symptoms**: HTTP works but HTTPS shows certificate error

**Solutions**:

1. **Verify Certificate ARN in CloudFront**:
   ```bash
   aws cloudfront get-distribution --id $(terraform output -raw cloudfront_distribution_id) | jq '.Distribution.DistributionConfig.ViewerCertificate'
   ```

2. **Check Certificate Validation Status**:
   ```bash
   aws acm list-certificates --region us-east-1 | jq '.CertificateSummaryList[] | select(.DomainName=="moraltorturemachine.com")'
   ```
   Status must be "ISSUED"

3. **Re-deploy Distribution**:
   ```bash
   terraform taint aws_cloudfront_distribution.frontend
   terraform apply
   ```

### Issue 6: Changes Not Reflected

**Symptoms**: Updated frontend not showing

**Solutions**:

1. **Create CloudFront Invalidation**:
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id $(terraform output -raw cloudfront_distribution_id) \
     --paths "/*"
   ```

2. **Clear Browser Cache**:
   - Hard refresh: Ctrl+Shift+R (Chrome/Firefox)
   - Or use incognito/private mode

3. **Check S3 Sync**:
   ```bash
   aws s3 ls s3://moral-torture-machine-frontend/
   ```
   Verify files are uploaded

---

## Validation Checklist

Use this checklist after deployment:

- [ ] Terraform apply completed successfully
- [ ] ACM certificate status is "Issued" (in us-east-1)
- [ ] CloudFront distribution status is "Deployed"
- [ ] Alternate domain names (CNAMEs) include both root and www
- [ ] SSL certificate is attached to CloudFront distribution
- [ ] Cloudflare DNS has CNAME records pointing to CloudFront
- [ ] Cloudflare SSL/TLS mode is set to "Full (Strict)"
- [ ] CNAME records in Cloudflare are "DNS only" (grey cloud)
- [ ] `https://yourdomain.com` returns 200 OK
- [ ] `https://www.yourdomain.com` returns 200 OK
- [ ] No redirect loops occur
- [ ] Frontend files are uploaded to S3
- [ ] CloudFront invalidation completed (if needed)

---

## Quick Reference Commands

### Get Terraform Outputs
```bash
cd web/terraform
terraform output                              # All outputs
terraform output cloudfront_domain_name       # CloudFront domain
terraform output certificate_validation_records  # ACM validation records
terraform output deployment_summary           # Full summary
```

### Deploy Frontend
```bash
cd web
pnpm build
aws s3 sync dist/ s3://$(terraform -chdir=terraform output -raw s3_bucket_name)/ --delete
aws cloudfront create-invalidation --distribution-id $(terraform -chdir=terraform output -raw cloudfront_distribution_id) --paths "/*"
```

### Check Distribution Status
```bash
aws cloudfront get-distribution --id $(terraform -chdir=terraform output -raw cloudfront_distribution_id) | jq '.Distribution | {Status, DomainName, Aliases: .DistributionConfig.Aliases}'
```

### Check Certificate Status
```bash
aws acm list-certificates --region us-east-1 | jq '.CertificateSummaryList[] | select(.DomainName=="moraltorturemachine.com")'
```

---

## Additional Resources

- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [AWS ACM Documentation](https://docs.aws.amazon.com/acm/)
- [Cloudflare SSL/TLS Documentation](https://developers.cloudflare.com/ssl/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

---

**Last Updated**: 2025-10-17
