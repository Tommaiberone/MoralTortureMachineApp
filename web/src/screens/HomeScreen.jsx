// screens/HomeScreen.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './HomeScreen.css';

const HomeScreen = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
        <span className="glitch-text">{t('home.title_moral')}</span><br />
        <span className="glitch-text">{t('home.title_torture')}</span><br />
        <span className="glitch-text">{t('home.title_machine')}</span>
      </h1>

        <p className="home-subtitle">{t('home.subtitle')}</p>

        <button
          className="home-button recommended-button"
          onClick={() => handleNavigation('evaluation', '/evaluation-dilemmas')}
        >
          <div className="badge-container">
            <span className="badge-text">{t('home.warning_badge')}</span>
          </div>
          <div className="button-text">{t('home.eval_button')}</div>
          <div className="button-description">
            {t('home.eval_description')}
          </div>
        </button>

        <button
          className="home-button arcade-button"
          onClick={() => handleNavigation('infinite', '/infinite-dilemmas')}
        >
          <div className="button-text">{t('home.infinite_button')}</div>
          <div className="button-description">
            {t('home.infinite_description')}
          </div>
        </button>

        <p className="home-warning">
          {t('home.warning_footer')}
        </p>
      </div>
  );
};

export default HomeScreen;
