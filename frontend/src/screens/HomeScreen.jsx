// screens/HomeScreen.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';
import SEO from '../components/SEO';
import { combineSchemas, getWebApplicationSchema, getFAQSchema, getHowToSchema } from '../utils/structuredData';
import './HomeScreen.css';

const HomeScreen = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Rich structured data for SEO (combines multiple schemas for rich snippets)
  const structuredData = combineSchemas(
    getWebApplicationSchema(),
    getFAQSchema(),
    getHowToSchema()
  );

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
    <div className="screen-container home-container">
      <SEO
        title={t('home.title_moral') + ' ' + t('home.title_torture') + ' ' + t('home.title_machine')}
        description={t('home.subtitle')}
        keywords="moral philosophy, ethics, ethical dilemmas, trolley problem, moral compass, AI analysis, philosophy game, moral framework, decision making, ethical test"
        url="/"
        structuredData={structuredData}
      />
      <LanguageSelector />
      <h1 className="screen-title-large home-title">
        <span className="glitch-text">{t('home.title_moral')}</span><br />
        <span className="glitch-text">{t('home.title_torture')}</span><br />
        <span className="glitch-text">{t('home.title_machine')}</span>
      </h1>

        <p className="home-subtitle">{t('home.subtitle')}</p>

        <button
          className="home-button recommended-button"
          onClick={() => handleNavigation('evaluation', '/evaluation-dilemmas')}
        >
          <div className="button-text">{t('home.eval_button')}</div>
          <div className="button-description">
            {t('home.eval_description')}
          </div>
        </button>
{/* 
        <button
          className="home-button story-button"
          onClick={() => handleNavigation('story', '/story-mode')}
        >
          <div className="button-text">{t('home.story_button')}</div>
          <div className="button-description">
            {t('home.story_description')}
          </div>
        </button> */}

        <button
          className="home-button arcade-button"
          onClick={() => handleNavigation('passThePhone', '/pass-the-phone')}
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
