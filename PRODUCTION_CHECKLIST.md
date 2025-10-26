# Production Deployment Checklist 🚀

Checklist completa prima di andare in produzione con Moral Torture Machine.

## ✅ Sicurezza

### Backend Security
- [x] **CORS configurato** - Solo domini autorizzati ([backend_fastapi.py:21-34](backend/backend_fastapi.py#L21-L34))
- [x] **Security Headers** attivi (X-Content-Type-Options, X-Frame-Options, CSP, etc.)
- [x] **Input Validation** su tutti gli endpoint (Pydantic models)
- [x] **Rate Limiting** - 50 req/sec, 100 burst ([main.tf:288-291](backend/terraform/main.tf#L288-L291))
- [x] **API Key in Secrets Manager** - Non hardcoded nel codice
- [x] **IP Hashing** per privacy negli analytics
- [x] **HTTPS enforced** - Strict-Transport-Security header
- [ ] **Verifica domini CORS** - Assicurati che siano corretti per produzione

### Infrastructure Security
- [x] **IAM Roles** - Permissions minime necessarie
- [x] **No hardcoded credentials** - Tutto tramite IAM roles
- [x] **Secrets rotation** disponibile via Secrets Manager
- [ ] **Verifica AWS credentials** - Non committate nel repo

## ✅ Database & Storage

### DynamoDB Tables
- [x] **Tabella Dilemmas** configurata ([main.tf:27-48](backend/terraform/main.tf#L27-L48))
- [x] **Tabella Analytics** configurata ([main.tf:50-97](backend/terraform/main.tf#L50-L97))
- [x] **Point-in-Time Recovery** abilitato su entrambe le tabelle
- [x] **TTL configurato** su analytics table (90 giorni)
- [x] **Pay-per-request billing** - Cost-effective
- [ ] **Verifica dilemmas popolati** - Controlla che la tabella abbia contenuti

### Backup Strategy
```bash
# Verifica PITR è attivo
aws dynamodb describe-continuous-backups \
  --table-name moral-torture-machine-dilemmas \
  --region eu-west-1

# Crea backup manuale prima del deploy
aws dynamodb create-backup \
  --table-name moral-torture-machine-dilemmas \
  --backup-name "pre-production-$(date +%Y%m%d)" \
  --region eu-west-1
```

## ✅ Analytics & Monitoring

### Analytics Implementation
- [x] **Session tracking** implementato nel frontend ([session.js](frontend/src/utils/session.js))
- [x] **Tutti gli eventi tracciati** (dilemma_fetched, vote_cast, results_analyzed, dilemma_generated)
- [x] **Privacy-compliant** - IP hashing, TTL, no PII
- [x] **Documentation** completa ([ANALYTICS_GUIDE.md](ANALYTICS_GUIDE.md))

### Monitoring Setup
- [x] **CloudWatch Logs** configurati per Lambda e API Gateway
- [x] **Health check endpoint** - `/health` con dependency checks
- [ ] **Configura CloudWatch Alarms** per errori critici:

```bash
# Alarm per errori Lambda
aws cloudwatch put-metric-alarm \
  --alarm-name mtm-lambda-errors \
  --alarm-description "Alert on Lambda errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=FunctionName,Value=moral-torture-machine-api
```

## ✅ Frontend

### Production Build
- [x] **Error Boundary** implementato ([ErrorBoundary.jsx](frontend/src/components/ErrorBoundary.jsx))
- [x] **Session tracking** integrato in tutte le chiamate API
- [x] **Environment variables** configurate (VITE_API_URL)
- [ ] **Build di produzione** testato localmente:

```bash
cd frontend
npm run build
npm run preview  # Test della build
```

### Performance
- [ ] **Test Lighthouse** - Punteggio >90 su Performance
- [ ] **Test su mobile** - Responsive design verificato
- [ ] **Test cross-browser** - Chrome, Firefox, Safari

### UX Protection
- [x] **Back button prevention** su schermate critiche
- [x] **Loading states** su tutte le chiamate async
- [x] **Error handling** con messaggi user-friendly

## ✅ API & Backend

### Endpoints Testing
Testa tutti gli endpoint prima del deploy:

```bash
API_URL="https://your-api-url.amazonaws.com"

# Health check
curl $API_URL/health

# Get dilemma
curl "$API_URL/get-dilemma?language=it"

# Vote (requires valid dilemma ID)
curl -X POST $API_URL/vote \
  -H "Content-Type: application/json" \
  -H "X-Session-Id: test-session-123" \
  -d '{"_id":"dilemma-id","vote":"yes"}'

# Generate dilemma
curl -X POST "$API_URL/generate-dilemma?language=it" \
  -H "X-Session-Id: test-session-123"

# Analyze results
curl -X POST "$API_URL/analyze-results?language=it" \
  -H "Content-Type: application/json" \
  -H "X-Session-Id: test-session-123" \
  -d '{"answers":[{"Empathy":5}],"dilemmasWithChoices":[]}'
```

### Lambda Configuration
- [x] **Timeout**: 30 secondi (sufficiente per Groq API)
- [x] **Memory**: 512 MB
- [x] **Environment variables** configurate
- [x] **Dependencies** nel layer Lambda

## ✅ Infrastructure as Code

### Terraform
- [x] **Backend S3** configurato per state
- [x] **State locking** via DynamoDB
- [x] **Variables** parametrizzate
- [ ] **Terraform plan** eseguito senza errori:

```bash
cd backend/terraform
terraform init
terraform plan
```

### CI/CD Pipeline
- [ ] **GitHub Actions** configurato ([deploy.yml](.github/workflows/deploy.yml))
- [ ] **Secrets** configurati in GitHub:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `GROQ_API_KEY`
- [ ] **Test workflow** eseguito con successo

## ✅ Costi & Budget

### Stima Costi Mensili
- **Lambda**: ~$0-2/mese (free tier covers most usage)
- **API Gateway**: ~$1-3/mese (1M requests = $1)
- **DynamoDB**: ~$0.50-2/mese (on-demand pricing)
- **CloudWatch Logs**: ~$0.50/mese (7 days retention)
- **S3 (Terraform state)**: ~$0.10/mese
- **CloudFront** (se usato): ~$1-5/mese

**TOTALE STIMATO**: $3-15/mese per traffico moderato

### Budget Alert
```bash
# Configura budget alert AWS
aws budgets create-budget \
  --account-id YOUR_ACCOUNT_ID \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

## ✅ DNS & Dominio

- [ ] **Dominio configurato** - moraltorturemachine.com
- [ ] **SSL Certificate** - ACM certificate attivo
- [ ] **DNS Records** puntano a CloudFront/API Gateway
- [ ] **HTTPS redirect** configurato

## ✅ Privacy & GDPR

### Compliance
- [x] **IP Anonymization** - SHA-256 hashing implementato
- [x] **Data Retention** - 90 giorni TTL su analytics
- [x] **No PII storage** - Solo session IDs anonimi
- [ ] **Privacy Policy** pubblicata sul sito
- [ ] **Cookie Banner** (se necessario per GDPR)

### Data Deletion
Script per GDPR right to erasure pronto:
```bash
# Vedi ANALYTICS_GUIDE.md per procedura completa
```

## ✅ Testing

### Load Testing
```bash
# Test con ab (Apache Bench)
ab -n 1000 -c 10 https://your-api/get-dilemma?language=it

# Test con wrk
wrk -t4 -c100 -d30s https://your-api/get-dilemma?language=it
```

### Chaos Testing
- [ ] **Test con API Gateway offline** - Gestione errori frontend
- [ ] **Test con DynamoDB throttling** - Retry logic funziona
- [ ] **Test con Groq API down** - Fallback corretto

## ✅ Documentation

- [x] **README.md** aggiornato
- [x] **ANALYTICS_GUIDE.md** completo
- [x] **DEPLOYMENT_GUIDE.md** disponibile
- [x] **API Documentation** (FastAPI auto-docs at `/docs`)
- [ ] **Runbook** per incident response

## ✅ Rollback Plan

### In caso di problemi

1. **Rollback Terraform**:
```bash
cd backend/terraform
terraform apply -target=aws_lambda_function.api \
  -var="force_rebuild=true"
```

2. **Restore Database**:
```bash
# Point-in-Time Recovery
aws dynamodb restore-table-to-point-in-time \
  --source-table-name moral-torture-machine-dilemmas \
  --target-table-name moral-torture-machine-dilemmas-restored \
  --restore-date-time 2024-01-15T12:00:00Z
```

3. **Rollback Frontend** (GitHub Pages):
```bash
git revert HEAD
git push origin main
```

## ✅ Launch Day

### Pre-Launch (T-1 hour)
- [ ] **Final smoke test** di tutti gli endpoint
- [ ] **Verifica analytics** funzionante
- [ ] **Verifica SSL certificate** valido
- [ ] **Check DNS propagation**
- [ ] **Backup manuale** di tutte le tabelle
- [ ] **Team disponibile** per monitoring

### Launch (T-0)
- [ ] **Deploy via CI/CD pipeline**
- [ ] **Monitor CloudWatch Logs** per errori
- [ ] **Test end-to-end** da produzione
- [ ] **Verifica analytics data** in arrivo

### Post-Launch (T+1 hour)
- [ ] **Monitor errori** per prime 24h
- [ ] **Check costi AWS** - No sorprese
- [ ] **User feedback** - Bug reports
- [ ] **Analytics review** - Usage patterns

## 🚨 Emergency Contacts

- **AWS Support**: [Link AWS Console]
- **Groq API Status**: https://status.groq.com
- **GitHub Status**: https://www.githubstatus.com

## 📊 Success Metrics

### Week 1 Targets
- Uptime >99.5%
- API P95 latency <500ms
- Zero critical errors
- >100 unique sessions
- Analytics data collection >95%

### Monitor These Dashboards
```bash
# CloudWatch Dashboard URL
echo "https://console.aws.amazon.com/cloudwatch/home?region=eu-west-1#dashboards:"

# DynamoDB Metrics
aws cloudwatch get-dashboard --dashboard-name MTM-Production
```

---

## 🎯 Final Check

Prima di premere "Deploy":

1. [ ] Ho letto tutta questa checklist
2. [ ] Ho testato tutto in ambiente di sviluppo
3. [ ] Ho un piano di rollback chiaro
4. [ ] Ho configurato monitoring e alerts
5. [ ] Il team è disponibile per monitoring
6. [ ] Ho fatto un backup di tutti i dati
7. [ ] **SONO PRONTO PER LA PRODUZIONE!** 🚀

---

**Data Deploy Prevista**: _________________

**Deploy eseguito da**: _________________

**Note finali**: _________________

