import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import './i18n';
import App from './App.jsx'
import { initializeMobileFeatures } from './utils/mobileInit'

// Inizializza feature mobile (status bar, splash screen, etc.)
initializeMobileFeatures();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <Suspense fallback="loading...">
        <App />
      </Suspense>
    </HelmetProvider>
  </StrictMode>,
)
