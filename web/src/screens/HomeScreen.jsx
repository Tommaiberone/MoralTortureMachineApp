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
    <div className="gradient-background">
      <div className="home-container">
        <h1 className="home-title">Moral Torture Machine</h1>

        {/* Recommended Button */}
        <button
          className="home-button recommended-button"
          onClick={() => handleNavigation('evaluation', '/evaluation-dilemmas')}
        >
          <div className="badge-container">
            <span className="badge-text">Recommended</span>
          </div>
          <div className="button-text">Test your morality</div>
          <div className="button-description">
            Start the morality test and face a series of moral dilemmas to evaluate your moral compass.
          </div>
        </button>

        {/* Other Buttons */}
        <button
          className="home-button"
          onClick={() => handleNavigation('infinite', '/infinite-dilemmas')}
        >
          <div className="button-text">Arcade: Infinite Dilemmas</div>
          <div className="button-description">
            Enter the arcade mode with an infinite stream of moral dilemmas for endless fun and ethical challenges.
          </div>
        </button>
      </div>
    </div>
  );
};

export default HomeScreen;
