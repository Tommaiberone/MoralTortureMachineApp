// screens/HomeScreen.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeScreen.css';

const HomeScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="gradient-background">
      <div className="home-container">
        <h1 className="home-title">Moral Torture Machine</h1>

        {/* Recommended Button */}
        <button
          className="home-button recommended-button"
          onClick={() => navigate('/evaluation-dilemmas')}
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
          onClick={() => navigate('/infinite-dilemmas')}
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
