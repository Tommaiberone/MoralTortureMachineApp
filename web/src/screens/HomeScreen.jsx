// screens/HomeScreen.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeScreen.css';

const HomeScreen = () => {
  const navigate = useNavigate();

  const handleNavigation = (mode, route) => {
    // Check if tutorial has been completed for this mode
    const tutorialCompleted = localStorage.getItem(`tutorial_completed_${mode}`);

    if (tutorialCompleted === 'true') {
      // Go directly to the mode
      navigate(route);
    } else {
      // Go to tutorial first
      navigate('/tutorial', { state: { mode } });
    }
  };

  return (
    <div className="home-container">
      <h1 className="home-title">
        MORAL<br />TORTURE<br />MACHINE
      </h1>

        <p className="home-subtitle">Enter if you dare...</p>

        {/* Recommended Button */}
        <button
          className="home-button recommended-button"
          onClick={() => handleNavigation('evaluation', '/evaluation-dilemmas')}
        >
          <div className="badge-container">
            <span className="badge-text">⚠ WARNING ⚠</span>
          </div>
          <div className="button-text">🩸 Test Your Morality 🩸</div>
          <div className="button-description">
            Face a series of disturbing moral dilemmas. Your conscience will be judged.
          </div>
        </button>

        {/* Arcade Button */}
        <button
          className="home-button arcade-button"
          onClick={() => handleNavigation('infinite', '/infinite-dilemmas')}
        >
          <div className="button-text">💀 Endless Torment Mode 💀</div>
          <div className="button-description">
            An infinite stream of ethical nightmares. There is no escape.
          </div>
        </button>

        <p className="home-warning">
          ⚠ This machine will expose your darkest moral boundaries ⚠
        </p>
      </div>
  );
};

export default HomeScreen;
