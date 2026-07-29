import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import './i18n';
import App from './App.jsx'
import { initializeMobileFeatures } from './utils/mobileInit'
import { initializeIdentity } from './utils/session'
import { initializeAnalytics } from './utils/analytics'
import AuthProvider from './auth/AuthProvider'

// Inizializza feature mobile (status bar, splash screen, etc.)
initializeMobileFeatures();

const bootstrap = async () => {
  await initializeIdentity();
  initializeAnalytics();

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <HelmetProvider>
        <AuthProvider>
          <Suspense fallback="loading...">
            <App />
          </Suspense>
        </AuthProvider>
      </HelmetProvider>
    </StrictMode>,
  )
};

void bootstrap();
