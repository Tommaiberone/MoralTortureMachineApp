terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Provider aggiuntivo per CloudFront (deve essere us-east-1)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# S3 Bucket per il frontend
resource "aws_s3_bucket" "frontend" {
  bucket = var.bucket_name

  tags = {
    Name        = "Moral Torture Machine Frontend"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Configurazione del sito web statico
resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# Blocco accesso pubblico (disabilitato perché CloudFront accederà al bucket)
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = false
  ignore_public_acls      = true
  restrict_public_buckets = false
}

# Policy del bucket per permettere a CloudFront di leggere
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontAccess"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.frontend.arn
          }
        }
      }
    ]
  })

  depends_on = [
    aws_s3_bucket_public_access_block.frontend,
    aws_cloudfront_distribution.frontend
  ]
}

# Origin Access Control per CloudFront
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${var.stack_name}-oac"
  description                       = "OAC for Moral Torture Machine Frontend"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # Solo Nord America ed Europa
  comment             = "Moral Torture Machine Frontend Distribution"

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.frontend.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.frontend.id}"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  # Cache behavior per i file statici (più lungo cache)
  ordered_cache_behavior {
    path_pattern     = "/assets/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.frontend.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 31536000  # 1 anno
    max_ttl                = 31536000
    compress               = true
  }

  # Gestione degli errori - reindirizza a index.html per il routing SPA
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  tags = {
    Name        = "Moral Torture Machine Frontend Distribution"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Output del dominio CloudFront
output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.frontend.id
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.frontend.id
}

output "frontend_url" {
  description = "Frontend URL"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "deployment_summary" {
  description = "Summary of the frontend deployment"
  value = <<-EOT

    ==========================================
    Frontend Deployment Complete!
    ==========================================

    Frontend URL: https://${aws_cloudfront_distribution.frontend.domain_name}
    S3 Bucket: ${aws_s3_bucket.frontend.id}
    CloudFront Distribution: ${aws_cloudfront_distribution.frontend.id}
    Region: ${var.aws_region}

    Deploy your frontend:
      cd web
      pnpm build
      aws s3 sync dist/ s3://${aws_s3_bucket.frontend.id}/ --delete
      aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.frontend.id} --paths "/*"

    IMPORTANT: Update your backend CORS settings to include:
      https://${aws_cloudfront_distribution.frontend.domain_name}

  EOT
}
