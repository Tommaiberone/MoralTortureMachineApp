# Frontend Infrastructure - Terraform

Configurazione Terraform per l'hosting del frontend su AWS S3 con CloudFront CDN.

## Quick Links

- **[CloudFront Configuration Guide](CLOUDFRONT_CONFIGURATION_GUIDE.md)** - Comprehensive guide for CloudFront setup, SSL/TLS configuration, and Cloudflare integration
- **[Validation Script](validate-cloudfront.sh)** - Automated validation tool for checking deployment health

## Architettura

- **S3 Bucket**: Storage per i file statici del frontend
- **CloudFront**: CDN per la distribuzione globale con HTTPS
- **Origin Access Control (OAC)**: Accesso sicuro al bucket S3
- **ACM Certificate**: SSL/TLS certificate (when using custom domain)
- **Cloudflare Integration**: DNS and additional CDN layer (optional)

## Setup Iniziale

### 1. Inizializza Terraform

```bash
cd web/terraform
terraform init
```

### 2. Rivedi il Piano

```bash
terraform plan
```

### 3. Applica la Configurazione

```bash
terraform apply
```

Terraform creerà:
- Un bucket S3 per il frontend
- Una distribuzione CloudFront
- Le policy e i permessi necessari

### 4. Ottieni gli Output

```bash
# URL del frontend
terraform output frontend_url

# ID della distribuzione CloudFront
terraform output cloudfront_distribution_id

# Nome del bucket S3
terraform output s3_bucket_name

# Riepilogo completo
terraform output deployment_summary
```

## Deploy del Frontend

### Metodo 1: Script Automatico (Raccomandato)

```bash
cd web
pnpm deploy
```

Lo script farà automaticamente:
1. Build del frontend
2. Upload su S3
3. Invalidazione della cache CloudFront

### Metodo 2: Manuale

```bash
# Build
cd web
pnpm build

# Upload su S3
aws s3 sync dist/ s3://moral-torture-machine-frontend/ --delete

# Invalida cache CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## Configurazione CORS del Backend

Dopo aver creato il frontend, aggiorna la configurazione CORS del backend:

1. Ottieni il dominio CloudFront:
   ```bash
   cd web/terraform
   terraform output -raw cloudfront_domain_name
   ```

2. Aggiorna il backend:
   ```bash
   cd backend/terraform
   terraform apply -var="cloudfront_domain=YOUR_CLOUDFRONT_DOMAIN"
   ```

## Variabili Terraform

| Variabile | Descrizione | Default |
|-----------|-------------|---------|
| `aws_region` | Regione AWS | `eu-west-1` |
| `stack_name` | Nome dello stack | `moral-torture-machine` |
| `bucket_name` | Nome del bucket S3 | `moral-torture-machine-frontend` |
| `environment` | Environment name | `production` |
| `domain_name` | Dominio personalizzato (es. moraltorturemachine.com) | `""` |
| `use_custom_domain` | Abilita dominio personalizzato con SSL | `false` |

### Personalizzare le Variabili

Crea un file `terraform.tfvars`:

```hcl
aws_region         = "eu-west-1"
bucket_name        = "my-custom-frontend-bucket"
environment        = "production"
domain_name        = "moraltorturemachine.com"
use_custom_domain  = true
```

Oppure passa le variabili da CLI:

```bash
terraform apply -var="bucket_name=my-custom-bucket"
```

## Dominio Personalizzato

### Setup del Dominio con Cloudflare (Recommended)

Per usare un dominio personalizzato (es. moraltorturemachine.com) con Cloudflare:

**IMPORTANT:** See [CLOUDFRONT_CONFIGURATION_GUIDE.md](CLOUDFRONT_CONFIGURATION_GUIDE.md) for complete setup instructions, including:
- SSL/TLS configuration (must use "Full (Strict)" mode)
- DNS CNAME setup
- Certificate validation
- Troubleshooting common issues

#### Quick Setup Steps

#### 1. Abilita il Dominio in Terraform

Crea `terraform.tfvars`:
```hcl
domain_name       = "moraltorturemachine.com"
use_custom_domain = true
```

Oppure usa la CLI:
```bash
terraform apply \
  -var="domain_name=moraltorturemachine.com" \
  -var="use_custom_domain=true"
```

#### 2. Applica la Configurazione

```bash
terraform apply
```

Terraform creerà automaticamente:
- ✅ Certificato SSL/TLS in AWS Certificate Manager (us-east-1)
- ✅ CloudFront distribution with custom domain aliases
- ✅ S3 bucket and origin access control

#### 3. Configure Cloudflare DNS

After running `terraform apply`:

1. **Add Certificate Validation Records**:
   ```bash
   terraform output certificate_validation_records
   ```
   Add the CNAME records shown to Cloudflare DNS (DNS only, grey cloud)

2. **Set SSL/TLS Mode**:
   - Go to Cloudflare Dashboard → SSL/TLS → Overview
   - Set mode to: **Full (Strict)**
   - ⚠️ NEVER use "Flexible" - it will cause redirect loops!

3. **Add Domain CNAME Records** (after certificate validation):
   ```bash
   terraform output cloudfront_url_for_cloudflare
   ```
   Add to Cloudflare DNS:
   - `@` → CNAME → (CloudFront domain) - DNS only
   - `www` → CNAME → (CloudFront domain) - DNS only

#### 4. Validate Deployment

Run the validation script:
```bash
./validate-cloudfront.sh
```

Or manually verify:
```bash
# Check certificate status
aws acm list-certificates --region us-east-1

# Test domain
curl -I https://moraltorturemachine.com
```

**For detailed troubleshooting, see [CLOUDFRONT_CONFIGURATION_GUIDE.md](CLOUDFRONT_CONFIGURATION_GUIDE.md)**

### Propagazione DNS

Dopo l'applicazione della configurazione:
- La validazione del certificato richiede **5-30 minuti**
- La propagazione DNS può richiedere fino a **48 ore** (di solito molto meno)
- CloudFront distribuisce il certificato in **10-15 minuti**

### Troubleshooting Dominio

For comprehensive troubleshooting, see [CLOUDFRONT_CONFIGURATION_GUIDE.md](CLOUDFRONT_CONFIGURATION_GUIDE.md)

**Quick Validation:**
```bash
# Run the automated validation script
./validate-cloudfront.sh
```

**Common Issues:**

1. **403 Forbidden Error**: Check that alternate domain names (CNAMEs) are configured in CloudFront
2. **Redirect Loop**: Ensure Cloudflare SSL/TLS mode is set to "Full (Strict)", NOT "Flexible"
3. **Certificate Pending**: Add validation CNAME records to Cloudflare DNS
4. **Domain Not Resolving**: Ensure CNAME records in Cloudflare point to CloudFront domain

**Manual Checks:**
```bash
# Check certificate status
aws acm list-certificates --region us-east-1

# Check CloudFront configuration
aws cloudfront get-distribution --id $(terraform output -raw cloudfront_distribution_id)

# Test DNS resolution
dig moraltorturemachine.com
```

## CloudFront

### Caratteristiche

- **HTTPS obbligatorio**: Tutti i contenuti sono serviti via HTTPS
- **Compressione**: Attivata per ridurre la dimensione dei file
- **Cache ottimizzata**:
  - File in `/assets/`: cache di 1 anno
  - `index.html`: cache di 0 secondi (sempre aggiornato)
- **SPA Support**: Errori 404/403 reindirizzati a `index.html`

### Invalidare la Cache

```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

### Monitorare l'Invalidazione

```bash
aws cloudfront get-invalidation \
  --distribution-id YOUR_DIST_ID \
  --id INVALIDATION_ID
```

## Costi Stimati

- **S3**: ~$0.023/GB al mese
- **CloudFront**:
  - Prime 10TB: $0.085/GB
  - Richieste: $0.0075 per 10,000 richieste
- **Totale stimato**: $1-10/mese per traffico moderato

### Ottimizzazione dei Costi

- ✅ Compressione abilitata (riduce trasferimento dati del 70%)
- ✅ Cache aggressiva per gli asset (riduce richieste a S3)
- ✅ PriceClass_100 (solo Nord America ed Europa)

## Sicurezza

- ✅ Bucket S3 non pubblico (accesso solo via CloudFront)
- ✅ Origin Access Control (OAC) per sicurezza migliorata
- ✅ HTTPS obbligatorio
- ✅ TLS 1.2 minimo

## Risoluzione Problemi

### Il sito non si aggiorna dopo il deploy

```bash
# Invalida la cache CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"

# Aspetta qualche minuto per il completamento
```

### Errori 403/404

- Verifica che il bucket policy sia corretto
- Assicurati che i file siano stati caricati correttamente
- Controlla che CloudFront abbia accesso OAC al bucket

### Problemi CORS

```bash
# Verifica che il dominio CloudFront sia nella lista CORS del backend
cd backend/terraform
terraform output api_endpoint

# Testa le chiamate API dal frontend
curl -H "Origin: https://YOUR_CLOUDFRONT_DOMAIN" YOUR_API_ENDPOINT
```

## Cleanup

Per eliminare tutte le risorse:

```bash
# ATTENZIONE: Questo eliminerà il bucket e tutti i contenuti
terraform destroy
```

## Risorse Create

Dopo `terraform apply`, verranno create:

- `aws_s3_bucket.frontend` - Bucket S3
- `aws_s3_bucket_website_configuration.frontend` - Configurazione sito statico
- `aws_s3_bucket_public_access_block.frontend` - Blocco accesso pubblico
- `aws_s3_bucket_policy.frontend` - Policy del bucket
- `aws_cloudfront_origin_access_control.frontend` - OAC
- `aws_cloudfront_distribution.frontend` - Distribuzione CloudFront

## Next Steps

1. Configura un dominio personalizzato (opzionale)
2. Aggiungi un certificato SSL/TLS (AWS Certificate Manager)
3. Configura GitHub Actions per il deploy automatico
4. Monitora CloudWatch metrics per il traffico
