# Deployment Guide - Moral Torture Machine

Guida completa per il deployment dell'applicazione su AWS.

## Architettura

### Backend
- **Lambda Function**: Esegue l'API FastAPI
- **API Gateway**: Endpoint HTTP per le chiamate API
- **DynamoDB**: Database per i dilemmi
- **CloudWatch**: Logging e monitoring

### Frontend
- **S3**: Storage per i file statici
- **CloudFront**: CDN per la distribuzione globale con HTTPS
- **Origin Access Control**: Accesso sicuro al bucket S3

## Prerequisiti

1. **AWS CLI** configurato con le credenziali
   ```bash
   aws configure
   ```

2. **Terraform** installato (v1.0+)
   ```bash
   terraform version
   ```

3. **Node.js e pnpm** per il frontend
   ```bash
   node --version
   pnpm --version
   ```

4. **Python 3.11** per il backend
   ```bash
   python3 --version
   ```

## Deploy Completo

### Passo 1: Deploy del Backend

```bash
# Entra nella directory backend
cd backend/terraform

# Inizializza Terraform
terraform init

# Verifica il piano
terraform plan

# Applica la configurazione
terraform apply

# Ottieni l'endpoint API
terraform output api_endpoint
```

Salva l'endpoint API che verrà usato dal frontend.

### Passo 2: Configura l'API Key (opzionale)

Se vuoi usare la funzione di generazione dilemmi con Groq:

```bash
cd backend/terraform
terraform apply -var="groq_api_key=la-tua-api-key"
```

### Passo 3: Popola il Database

```bash
cd backend
python3 populate_dynamodb_multilang.py moral-torture-machine-dilemmas dilemmas_it.json
```

### Passo 4: Deploy del Frontend

```bash
# Entra nella directory frontend
cd web/terraform

# Inizializza Terraform
terraform init

# Applica la configurazione
terraform apply

# Ottieni il dominio CloudFront
terraform output cloudfront_domain_name
```

### Passo 5: Aggiorna CORS nel Backend

Dopo aver ottenuto il dominio CloudFront, aggiorna la configurazione CORS:

```bash
cd backend/terraform
CLOUDFRONT_DOMAIN=$(cd ../../web/terraform && terraform output -raw cloudfront_domain_name)
terraform apply -var="cloudfront_domain=$CLOUDFRONT_DOMAIN"
```

### Passo 6: Build e Deploy del Frontend

```bash
cd web
pnpm install
pnpm build
pnpm deploy
```

Oppure manualmente:

```bash
cd web
pnpm build
aws s3 sync dist/ s3://moral-torture-machine-frontend/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## Verifica del Deployment

### Test Backend

```bash
# Health check
curl https://your-api-endpoint.execute-api.eu-west-1.amazonaws.com/

# Get dilemma
curl https://your-api-endpoint.execute-api.eu-west-1.amazonaws.com/get-dilemma

# API docs
curl https://your-api-endpoint.execute-api.eu-west-1.amazonaws.com/docs
```

### Test Frontend

Visita l'URL CloudFront nel browser:
```
https://your-distribution.cloudfront.net
```

## Deploy Automatico con GitHub Actions

### Setup Iniziale

1. **Configura AWS OIDC per GitHub Actions**

   Nel tuo account AWS, crea un Identity Provider per GitHub:
   - Provider: `token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`

2. **Crea un ruolo IAM**

   Crea un ruolo con le policy necessarie:
   - `AmazonS3FullAccess` (per S3)
   - `CloudFrontFullAccess` (per CloudFront)
   - `AmazonAPIGatewayInvokeFullAccess` (per API Gateway)
   - `AWSLambda_FullAccess` (per Lambda)
   - Custom policy per DynamoDB

3. **Aggiungi il segreto in GitHub**

   In GitHub repository Settings > Secrets and variables > Actions:
   - Nome: `AWS_ROLE_ARN`
   - Valore: `arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME`

### Deploy Automatico

Dopo il setup, ogni push al branch `main` con modifiche in:
- `backend/**` → Triggera il deploy del backend
- `web/**` → Triggera il deploy del frontend

Puoi anche fare il deploy manuale da GitHub:
- Actions > Deploy Backend/Frontend > Run workflow

## Configurazione Avanzata

### Dominio Personalizzato

Per usare un dominio personalizzato:

1. **Richiedi un certificato in AWS Certificate Manager** (deve essere in `us-east-1`)
   ```bash
   aws acm request-certificate \
     --domain-name example.com \
     --validation-method DNS \
     --region us-east-1
   ```

2. **Aggiorna la configurazione CloudFront**

   Modifica `web/terraform/main.tf`:
   ```hcl
   viewer_certificate {
     acm_certificate_arn = "arn:aws:acm:us-east-1:..."
     ssl_support_method  = "sni-only"
     minimum_protocol_version = "TLSv1.2_2021"
   }

   aliases = ["example.com", "www.example.com"]
   ```

3. **Configura DNS**

   Crea un record CNAME o ALIAS nel tuo provider DNS che punta a:
   ```
   your-distribution.cloudfront.net
   ```

### Monitoring e Logging

#### CloudWatch Logs

```bash
# Log del backend Lambda
aws logs tail /aws/lambda/moral-torture-machine-api --follow

# Log dell'API Gateway
aws logs tail /aws/apigateway/moral-torture-machine-api --follow
```

#### CloudWatch Metrics

Visualizza le metriche su AWS Console:
- Lambda: Invocations, Duration, Errors
- API Gateway: Count, 4xx, 5xx errors
- CloudFront: Requests, Bytes transferred
- DynamoDB: Read/Write capacity

### Costi Stimati

Per traffico moderato (10k richieste/mese):

- **Lambda**: $0 (free tier copre 1M richieste)
- **API Gateway**: $0.01 (HTTP API)
- **DynamoDB**: $0 (on-demand, free tier)
- **S3**: $0.02 (1GB storage + transfer)
- **CloudFront**: $1-5 (dipende dal traffico)
- **CloudWatch**: $0 (free tier copre i log base)

**Totale stimato**: $1-10/mese

## Troubleshooting

### Backend non risponde

```bash
# Controlla i log Lambda
aws logs tail /aws/lambda/moral-torture-machine-api --follow

# Testa Lambda direttamente
aws lambda invoke --function-name moral-torture-machine-api output.json
cat output.json

# Verifica che la tabella DynamoDB esista
aws dynamodb describe-table --table-name moral-torture-machine-dilemmas
```

### Frontend non si carica

```bash
# Verifica che i file siano su S3
aws s3 ls s3://moral-torture-machine-frontend/

# Controlla lo stato di CloudFront
aws cloudfront get-distribution --id YOUR_DIST_ID

# Invalida la cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Errori CORS

```bash
# Verifica la configurazione CORS dell'API Gateway
aws apigatewayv2 get-api --api-id YOUR_API_ID

# Testa con curl
curl -H "Origin: https://your-cloudfront-domain.net" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS \
  https://your-api-endpoint.execute-api.eu-west-1.amazonaws.com/
```

### Terraform errors

```bash
# Refresh dello state
terraform refresh

# Reimporta una risorsa
terraform import aws_s3_bucket.frontend moral-torture-machine-frontend

# Reset completo (ATTENZIONE: elimina tutto)
terraform destroy
terraform apply
```

## Backup e Disaster Recovery

### Backup DynamoDB

```bash
# Esporta i dati
aws dynamodb scan --table-name moral-torture-machine-dilemmas > backup.json

# Ripristina (se necessario)
python3 populate_dynamodb_multilang.py moral-torture-machine-dilemmas backup.json
```

### Backup Terraform State

Lo stato Terraform è salvato su S3 con versioning abilitato:
```bash
# Lista le versioni
aws s3api list-object-versions --bucket moral-torture-machine-terraform-state

# Ripristina una versione precedente
aws s3api get-object --bucket moral-torture-machine-terraform-state \
  --key backend/terraform.tfstate --version-id VERSION_ID \
  terraform.tfstate
```

## Cleanup

Per eliminare tutte le risorse:

```bash
# Frontend
cd web/terraform
terraform destroy

# Backend
cd backend/terraform
terraform destroy

# Bucket dello stato Terraform (manuale)
aws s3 rb s3://moral-torture-machine-terraform-state --force
aws dynamodb delete-table --table-name terraform-lock
```

**ATTENZIONE**: Questo eliminerà TUTTI i dati in modo permanente!

## Supporto

Per problemi o domande:
1. Controlla i log di CloudWatch
2. Verifica la documentazione AWS
3. Consulta i README specifici:
   - [Backend Terraform README](backend/terraform/README.md)
   - [Frontend Terraform README](web/terraform/README.md)
   - [Web README](web/README.md)
