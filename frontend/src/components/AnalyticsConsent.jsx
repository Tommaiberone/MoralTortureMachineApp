import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isWeb } from '../utils/platform';
import {
  consent,
  loadGoogleAnalytics,
  resetGoogleAnalyticsConsent,
  revokeGoogleAnalytics,
  saveConsent,
} from '../utils/googleAnalytics';

export const AnalyticsConsent = () => {
  const { t } = useTranslation();
  const [choice, setChoice] = useState(consent());
  if (!isWeb() || choice) return null;
  const set = (value) => {
    saveConsent(value);
    setChoice(value);
    if (value === 'granted') loadGoogleAnalytics();
  };

  return (
    <div className="consent-overlay">
      <section className="consent-card" role="dialog" aria-modal="true" aria-labelledby="consent-title">
        <h2 id="consent-title">{t('consent.title')}</h2>
        <p>{t('consent.body')}</p>
        <p>
          <a href="/privacy" onClick={() => set('denied')}>{t('consent.privacy')}</a>
          {' · '}
          <a href="/cookies" onClick={() => set('denied')}>{t('consent.cookies')}</a>
          {' · '}
          <a href="/terms" onClick={() => set('denied')}>{t('consent.terms')}</a>
        </p>
        <div className="consent-actions">
          <button type="button" onClick={() => set('denied')}>{t('consent.reject')}</button>
          <button type="button" className="consent-accept" onClick={() => set('granted')}>{t('consent.accept')}</button>
        </div>
      </section>
    </div>
  );
};

export const PrivacyFooter = () => {
  const { t } = useTranslation();
  if (!isWeb()) return null;
  const updatePreferences = consent() === 'granted'
    ? revokeGoogleAnalytics
    : resetGoogleAnalyticsConsent;

  return (
    <footer className="privacy-footer">
      <a href="/privacy">{t('consent.privacy')}</a>
      <a href="/cookies">{t('consent.cookies')}</a>
      <a href="/terms">{t('consent.terms')}</a>
      <button type="button" onClick={updatePreferences}>{t('consent.prefs')}</button>
    </footer>
  );
};
