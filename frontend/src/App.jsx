// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import your screens
import HomeScreen from './screens/HomeScreen';
import PassThePhoneScreen from './screens/PassThePhoneScreen';
import EvaluationDilemmasScreen from './screens/EvaluationDilemmasScreen';
import ResultsScreen from './screens/ResultsScreen';
import TutorialScreen from './screens/TutorialScreen';

import './App.css';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Home Screen */}
        <Route path="/" element={<HomeScreen />} />

        {/* Tutorial Screen */}
        <Route path="/tutorial" element={<TutorialScreen />} />

        {/* Pass The Phone Screen */}
        <Route path="/pass-the-phone" element={<PassThePhoneScreen />} />

        {/* New Get Dilemma Screen */}
        <Route path="/evaluation-dilemmas" element={<EvaluationDilemmasScreen />} />

        {/* Results Screen */}
        <Route path="/results" element={<ResultsScreen />} />
      </Routes>
    </Router>
  );
};

export default App;
