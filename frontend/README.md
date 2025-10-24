# Moral Torture Machine - Web Application

React-based web application for the Moral Torture Machine, built with Vite.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- pnpm
- AWS CLI (per il deploy)

### Installation

```bash
pnpm install
```

### Running Locally

Start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
pnpm build
```

The production build will be created in the `dist` directory.

### Preview Production Build

```bash
pnpm preview
```

## Deployment

Questo frontend è hostato su AWS S3 con CloudFront CDN.

### Setup Iniziale (una tantum)

1. **Crea l'infrastruttura AWS**:
   ```bash
   cd terraform
   terraform init
   terraform apply
   ```

2. **Ottieni l'URL del frontend**:
   ```bash
   terraform output frontend_url
   ```

3. **Configura CORS nel backend**:
   ```bash
   cd ../../backend/terraform
   CLOUDFRONT_DOMAIN=$(cd ../../web/terraform && terraform output -raw cloudfront_domain_name)
   terraform apply -var="cloudfront_domain=$CLOUDFRONT_DOMAIN"
   ```

### Deploy del Frontend

Dopo le modifiche al codice:

```bash
pnpm deploy
```

Questo comando eseguirà automaticamente:
1. Build del frontend
2. Upload su S3
3. Invalidazione della cache CloudFront

Per maggiori dettagli sulla configurazione Terraform, vedi [terraform/README.md](terraform/README.md).

## Development

This project uses:
- React + Vite for fast development
- ESLint for code quality
- Hot Module Replacement (HMR) for instant feedback during development
- AWS S3 + CloudFront for production hosting
