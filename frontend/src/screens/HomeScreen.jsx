// screens/HomeScreen.jsx
import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import AuthButton from '../components/AuthButton';
import { combineSchemas, getWebApplicationSchema, getFAQSchema, getHowToSchema } from '../utils/structuredData';
import { trackEvent } from '../utils/analytics';
import './HomeScreen.css';

const HomeScreen = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const landingTracked = useRef(false);

  useEffect(() => {
    if (landingTracked.current) return;
    landingTracked.current = true;
    trackEvent('landing_viewed');
  }, []);

  // Rich structured data for SEO (combines multiple schemas for rich snippets)
  const structuredData = combineSchemas(
    getWebApplicationSchema(),
    getFAQSchema(),
    getHowToSchema()
  );

  const handleNavigation = (mode, route) => {
    trackEvent('mode_selected', { mode });

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

  const seoPaths = i18n.language === 'it'
    ? {
      test: '/it/test-dilemmi-morali',
      ethical: '/it/dilemmi-etici',
      game: '/it/gioco-dilemmi-morali',
    }
    : {
      test: '/moral-dilemma-test',
      ethical: '/ethical-dilemmas',
      game: '/moral-dilemma-game',
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
      <AuthButton />
      {/* TASK-120: profile/account entry point, homepage only - not a global nav element. */}
      <Link
        to="/account"
        className="home-profile-button"
        aria-label={t('home.profile_icon_label')}
        title={t('home.profile_icon_label')}
        onClick={() => trackEvent('profile_icon_clicked')}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="8" r="4" fill="currentColor" />
          <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" fill="currentColor" />
        </svg>
      </Link>
      {/* TASK-101: LanguageSelector hidden while Italian is temporarily disabled app-wide. */}
      <h1 className="screen-title-large home-title">
        <span className="glitch-text">{t('home.title_moral')}</span><br />
        <span className="glitch-text">{t('home.title_torture')}</span><br />
        <span className="glitch-text">{t('home.title_machine')}</span>
      </h1>

        <p className="home-subtitle">{t('home.subtitle')}</p>

        {/* Unobtrusive internal links for SEO crawlability only (ADR-020); not a user-facing content section. */}
        <nav className="home-seo-resource-links" aria-label={t('home.seo_resource_nav_label')}>
          <Link to={seoPaths.test}>{t('home.seo_resource_test')}</Link>
          <Link to={seoPaths.ethical}>{t('home.seo_resource_ethical')}</Link>
          <Link to={seoPaths.game}>{t('home.seo_resource_game')}</Link>
        </nav>

        <button
          className="home-button recommended-button"
          onClick={() => handleNavigation('evaluation', '/evaluation-dilemmas')}
        >
          <div className="button-text">{t('home.eval_button')}</div>
          <div className="button-description">
            {t('home.eval_description')}
          </div>
        </button>

        <button
          className="home-button daily-button"
          onClick={() => {
            trackEvent('mode_selected', { mode: 'daily' });
            trackEvent('daily_moral_crime_entry_clicked', { surface: 'home' });
            navigate('/daily');
          }}
        >
          <div className="button-text">{t('home.daily_button')}</div>
          <div className="button-description">
            {t('home.daily_description')}
          </div>
        </button>

        <button
          className="home-button arcade-button"
          onClick={() => {
            trackEvent('mode_selected', { mode: 'party' });
            navigate('/party');
          }}
        >
          <div className="button-text">{t('home.party_button')}</div>
          <div className="button-description">
            {t('home.party_description')}
          </div>
        </button>

        <p className="home-warning">
          {t('home.warning_footer')}
        </p>
      </div>
  );
};

export default HomeScreen;
