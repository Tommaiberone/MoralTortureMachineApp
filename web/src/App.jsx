// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import your screens
import HomeScreen from './screens/HomeScreen';
import InfiniteDilemmasScreen from './screens/InfiniteDilemmasScreen';
import EvaluationDilemmasScreen from './screens/EvaluationDilemmasScreen';
import ResultsScreen from './screens/ResultsScreen';
import TutorialScreen from './screens/TutorialScreen';

import './App.css';

import LanguageSelector from './components/LanguageSelector';

const App = () => {
  return (
    <Router>
      <LanguageSelector />
      <Routes>
        {/* Home Screen */}
        <Route path="/" element={<HomeScreen />} />

        {/* Tutorial Screen */}
        <Route path="/tutorial" element={<TutorialScreen />} />

        {/* Existing Generate Dilemma Screen */}
        <Route path="/infinite-dilemmas" element={<InfiniteDilemmasScreen />} />

        {/* New Get Dilemma Screen */}
        <Route path="/evaluation-dilemmas" element={<EvaluationDilemmasScreen />} />

        {/* Results Screen */}
        <Route path="/results" element={<ResultsScreen />} />
      </Routes>
    </Router>
  );
};

export default App;
