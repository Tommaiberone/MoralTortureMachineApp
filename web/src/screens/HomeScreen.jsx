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
        <span className="glitch-text">MORAL</span><br />
        <span className="glitch-text">TORTURE</span><br />
        <span className="glitch-text">MACHINE</span>
      </h1>

        <p className="home-subtitle">[ ENTER IF YOU DARE ]</p>

        <button
          className="home-button recommended-button"
          onClick={() => handleNavigation('evaluation', '/evaluation-dilemmas')}
        >
          <div className="badge-container">
            <span className="badge-text">! WARNING !</span>
          </div>
          <div className="button-text">TEST YOUR MORALITY</div>
          <div className="button-description">
            FACE MORAL DILEMMAS. YOUR CONSCIENCE WILL BE JUDGED.
          </div>
        </button>

        <button
          className="home-button arcade-button"
          onClick={() => handleNavigation('infinite', '/infinite-dilemmas')}
        >
          <div className="button-text">ENDLESS TORMENT MODE</div>
          <div className="button-description">
            AN INFINITE STREAM OF ETHICAL NIGHTMARES. NO ESCAPE.
          </div>
        </button>

        <p className="home-warning">
          [ THIS WILL EXPOSE YOUR DARKEST BOUNDARIES ]
        </p>
      </div>
  );
};

export default HomeScreen;
