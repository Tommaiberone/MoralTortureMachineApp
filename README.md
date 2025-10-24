# Moral Torture Machine

A full-stack application that presents users with ethical dilemmas and analyzes their moral compass through interactive questionnaires. Available in both **React Native (Mobile)** and **React (Web)** versions.

## Project Structure

```
MoralTortureMachineApp/
├── mobile/                 # React Native application (iOS/Android)
│   ├── assets/            # Images and static assets
│   ├── screens/           # Screen components
│   ├── App.js             # Main navigation component
│   ├── app.json           # Expo configuration
│   ├── package.json       # Mobile dependencies
│   └── index.js           # Entry point
│
├── web/                   # React web application
│   ├── src/
│   │   ├── screens/       # Screen components
│   │   ├── assets/        # Images and static assets
│   │   ├── App.jsx        # Main routing component
│   │   └── App.css        # Global styles
│   ├── package.json       # Web dependencies
│   └── index.html         # HTML entry point
│
├── shared/                # Shared backend files
│   ├── backend.py         # Backend API server
│   ├── dilemmas.json      # Dilemma database
│   └── populateDB.py      # Database population script
│
├── package.json           # Root package.json with workspace scripts
└── README.md              # This file
```

## Features

- **Home Screen**: Choose between arcade mode and evaluation mode
- **Infinite Dilemmas (Arcade Mode)**: Generate endless ethical dilemmas with AI
- **Evaluation Dilemmas**: Complete a structured test with 5 dilemmas
- **Results Visualization**: View your moral profile with radar charts
- **Dark/Light Mode**: Toggle between themes
- **Responsive Design**: Works on all screen sizes

## Tech Stack

### Mobile (React Native)
- React Native with Expo
- React Navigation for routing
- Expo Linear Gradient
- React Native Gifted Charts for visualizations
- Google Fonts (Poppins)

### Web (React)
- React 19
- Vite for build tooling
- React Router DOM for routing
- Recharts for data visualization
- CSS3 with Google Fonts

### Backend
- FastAPI (Python 3.11+)
- AWS Lambda (serverless)
- DynamoDB for dilemma storage
- API Gateway for HTTPS endpoints
- Automated deployment via GitHub Actions

## Prerequisites

- **Node.js** (v18 or v20 LTS recommended)
  - **Important:** Node.js v23+ has compatibility issues with Expo SDK 52. Use Node.js v20 LTS for mobile development.
- **pnpm** (package manager)
- For mobile: Expo CLI (`pnpm add -g expo-cli`)
- For iOS: Xcode (Mac only)
- For Android: Android Studio

## Installation

### Install All Dependencies

From the root directory:

```bash
pnpm install:all
```

Or install separately:

```bash
# Install mobile dependencies
cd mobile
pnpm install

# Install web dependencies
cd ../web
pnpm install
```

**Note:** This project uses pnpm with a hoisted node_modules structure (configured in `.npmrc`) for compatibility with React Native/Expo. The mobile and web directories maintain separate dependency installations.

## Running the Applications

### Mobile Version

From the root directory:

```bash
# Start Expo development server
pnpm mobile

# Run on Android
pnpm mobile:android

# Run on iOS (Mac only)
pnpm mobile:ios
```

Or from the mobile directory:

```bash
cd mobile
pnpm start         # Start Expo
pnpm android       # Run on Android
pnpm ios           # Run on iOS
```

### Web Version

From the root directory:

```bash
# Start development server
pnpm web

# Build for production
pnpm web:build

# Preview production build
pnpm web:preview
```

Or from the web directory:

```bash
cd web
pnpm dev           # Start development server
pnpm build         # Build for production
pnpm preview       # Preview production build
```

The web app will be available at `http://localhost:5173`

## Screens

### 1. Home Screen
- Entry point for the application
- Choose between two modes:
  - **Test Your Morality** (Recommended): Structured evaluation with 5 dilemmas
  - **Arcade: Infinite Dilemmas**: Endless stream of ethical challenges

### 2. Infinite Dilemmas Screen
- Generate AI-powered ethical dilemmas on demand
- Choose between two options
- Receive feedback on your choices
- Generate new dilemmas infinitely
- Toggle dark/light mode

### 3. Evaluation Dilemmas Screen
- Complete a structured test with 5 dilemmas
- Each choice is tracked and affects your moral profile
- See real-time voting statistics
- Pie chart showing how others voted
- Progress indicator (X/5 completed)

### 4. Results Screen
- Radar chart visualization of your moral profile
- Six moral dimensions tracked:
  - Empathy
  - Integrity
  - Responsibility
  - Justice
  - Altruism
  - Honesty
- Detailed breakdown of scores

## Backend API

The backend is a serverless FastAPI application deployed on AWS Lambda with automated CI/CD.

### Deployment

**Automated (Recommended):**
- Push to main branch triggers automatic deployment via GitHub Actions
- Includes testing, Terraform validation, and health checks
- See [backend/README.md](backend/README.md) for setup instructions

**Manual:**
- Use Terraform for infrastructure deployment
- See [backend/terraform/README.md](backend/terraform/README.md)

### API Endpoints

- `GET /` - Health check
- `GET /get-dilemma` - Retrieve a random dilemma from the database
- `POST /vote` - Submit a vote for a dilemma
- `POST /generate-dilemma` - Generate a new AI-powered dilemma
- `GET /docs` - Interactive API documentation

## Development

### Adding New Screens

#### Mobile
1. Create a new component in `mobile/screens/`
2. Import and add route in `mobile/App.js`

#### Web
1. Create a new component in `web/src/screens/`
2. Import and add route in `web/src/App.jsx`

### Styling

#### Mobile
- Uses React Native StyleSheet
- Supports responsive design with `Dimensions` API
- Custom fonts via Expo Google Fonts

#### Web
- CSS modules for each component
- Google Fonts via CDN
- Responsive design with CSS media queries

## Building for Production

### Mobile

```bash
cd mobile
# For Android
expo build:android

# For iOS
expo build:ios
```

### Web

```bash
cd web
pnpm build
```

The built files will be in `web/dist/` and can be deployed to any static hosting service (Netlify, Vercel, GitHub Pages, etc.)

## Deployment

### Backend (Automated)
The backend automatically deploys via GitHub Actions on push to main.

**Quick Setup:**
1. **Get AWS credentials** (if not already configured)
2. **Add GitHub secrets:**
   - Go to: Repository → **Settings** → **Secrets and variables** → **Actions**
   - Add these secrets:
     - `AWS_ACCESS_KEY_ID` (required)
     - `AWS_SECRET_ACCESS_KEY` (required)
     - `GROQ_API_KEY` (optional)
3. **Push to trigger deployment:**
   ```bash
   git push origin main
   ```
4. **Monitor** in the Actions tab

See [backend/README.md](backend/README.md) for detailed instructions.

### Mobile
- Use Expo EAS Build for cloud builds
- Submit to App Store and Google Play Store

### Web
- Deploy `web/dist/` to any static hosting service
- Recommended platforms:
  - Vercel
  - Netlify
  - GitHub Pages
  - Firebase Hosting

## CI/CD

The project uses GitHub Actions for automated backend deployment:
- **Workflow:** [.github/workflows/backend-deploy.yml](.github/workflows/backend-deploy.yml)
- **Triggers:** Push to main, PRs affecting backend
- **Features:** Testing, linting, Terraform plan/apply, health checks
- **Package Manager:** Uses `uv` for fast, reliable Python dependency management

## License

This project is licensed under the 0BSD License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Troubleshooting

### Mobile Development Issues

**"Package subpath not exported" errors with Expo:**
- This is caused by Node.js v23+ incompatibility with Expo SDK 52
- **Solution:** Use Node.js v20 LTS
- Switch versions using nvm: `nvm install 20 && nvm use 20`

**Web application works but mobile doesn't:**
- Verify you're using Node.js v20 or lower
- Clear node_modules and reinstall: `cd mobile && rm -rf node_modules pnpm-lock.yaml && pnpm install`

### pnpm Issues

**"workspaces not supported" warning:**
- This is expected. The project doesn't use pnpm workspaces.
- Each directory (mobile, web) has its own dependencies.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

Built with ❤️ using React Native and React
