// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import your screens
import HomeScreen from './screens/HomeScreen';
import InfiniteDilemmasScreen from './screens/InfiniteDilemmasScreen';
import EvaluationDilemmasScreen from './screens/EvaluationDilemmasScreen';
import ResultsScreen from './screens/ResultsScreen';

import './App.css';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Home Screen */}
        <Route path="/" element={<HomeScreen />} />

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
