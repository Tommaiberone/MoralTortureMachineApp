// App.jsx
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import Error Boundary (critical, not lazy loaded)
import ErrorBoundary from './components/ErrorBoundary';
import { AnalyticsConsent } from './components/AnalyticsConsent';

// Lazy load screens for better performance and Core Web Vitals
// Home is loaded immediately as it's the first screen users see
import HomeScreen from './screens/HomeScreen';

// All other screens are lazy loaded to reduce initial bundle size
const PassThePhoneScreen = lazy(() => import('./screens/PassThePhoneScreen'));
const EvaluationDilemmasScreen = lazy(() => import('./screens/EvaluationDilemmasScreen'));
// const StoryModeScreen = lazy(() => import('./screens/StoryModeScreen')); // Hidden for now
const ResultsScreen = lazy(() => import('./screens/ResultsScreen'));
const TutorialScreen = lazy(() => import('./screens/TutorialScreen'));
const AboutScreen = lazy(() => import('./screens/AboutScreen'));
const AnalyticsAdminScreen = lazy(() => import('./screens/AnalyticsAdminScreen'));
const AuthCallbackScreen = lazy(() => import('./screens/AuthCallbackScreen'));
const LegalScreen = lazy(() => import('./screens/LegalScreen'));
const AccountDeleteScreen = lazy(() => import('./screens/AccountDeleteScreen'));
const SeoLandingScreen = lazy(() => import('./screens/SeoLandingScreen'));
const PublicProfileScreen = lazy(() => import('./screens/PublicProfileScreen'));
const ChallengeLandingScreen = lazy(() => import('./screens/ChallengeLandingScreen'));
const ChallengeCompareScreen = lazy(() => import('./screens/ChallengeCompareScreen'));
const PartyRoomHomeScreen = lazy(() => import('./screens/PartyRoomHomeScreen'));
const PartyRoomScreen = lazy(() => import('./screens/PartyRoomScreen'));

import './styles/shared.css';
import './App.css';

// Loading component for lazy-loaded routes
const LoadingScreen = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '1.5rem',
    color: '#fff'
  }}>
    Loading...
  </div>
);

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Home Screen - Not lazy loaded for instant first paint */}
            <Route path="/" element={<HomeScreen />} />

            {/* All other screens lazy loaded */}
            <Route path="/tutorial" element={<TutorialScreen />} />
            <Route path="/pass-the-phone" element={<PassThePhoneScreen />} />
            <Route path="/evaluation-dilemmas" element={<EvaluationDilemmasScreen />} />
            {/* <Route path="/story-mode" element={<StoryModeScreen />} /> */}
            <Route path="/results" element={<ResultsScreen />} />
            <Route path="/about" element={<AboutScreen />} />
            <Route path="/moral-dilemma-test" element={<SeoLandingScreen landingId="moralDilemmaTest" locale="en" />} />
            <Route path="/it/test-dilemmi-morali" element={<SeoLandingScreen landingId="moralDilemmaTest" locale="it" />} />
            <Route path="/ethical-dilemmas" element={<SeoLandingScreen landingId="ethicalDilemmas" locale="en" />} />
            <Route path="/it/dilemmi-etici" element={<SeoLandingScreen landingId="ethicalDilemmas" locale="it" />} />
            <Route path="/moral-dilemma-game" element={<SeoLandingScreen landingId="moralDilemmaGame" locale="en" />} />
            <Route path="/it/gioco-dilemmi-morali" element={<SeoLandingScreen landingId="moralDilemmaGame" locale="it" />} />
            {/* Intentionally unlinked: protected by a server-side admin credential. */}
            <Route path="/admin/analytics" element={<AnalyticsAdminScreen />} />
            <Route path="/auth/callback" element={<AuthCallbackScreen />} />
            <Route path="/privacy" element={<LegalScreen type="privacy" />} />
            <Route path="/cookies" element={<LegalScreen type="cookies" />} />
            <Route path="/terms" element={<LegalScreen type="terms" />} />
            <Route path="/account" element={<AccountDeleteScreen />} />
            <Route path="/delete-account" element={<AccountDeleteScreen />} />
            <Route path="/p/:publicId" element={<PublicProfileScreen />} />
            <Route path="/challenge/:token" element={<ChallengeLandingScreen />} />
            <Route path="/challenge/:token/compare" element={<ChallengeCompareScreen />} />
            <Route path="/party" element={<PartyRoomHomeScreen />} />
            <Route path="/party/:roomCode" element={<PartyRoomScreen />} />
          </Routes>
          <AnalyticsConsent />
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
