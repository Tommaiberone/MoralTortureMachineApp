// App.jsx
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import Error Boundary (critical, not lazy loaded)
import ErrorBoundary from './components/ErrorBoundary';

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
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
