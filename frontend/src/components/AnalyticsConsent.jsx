import { useState } from 'react';
import { isWeb } from '../utils/platform';
import {
  consent,
  loadGoogleAnalytics,
  resetGoogleAnalyticsConsent,
  revokeGoogleAnalytics,
  saveConsent,
} from '../utils/googleAnalytics';

const copy = {
  title: 'Your privacy choices',
  body: 'Essential browser storage runs the game. With permission, Google Analytics measures aggregate web use only. We do not sell data, run advertising, personalise ads, or create cross-site advertising profiles; game results are processed to provide the feature itself.',
  accept: 'Accept analytics',
  reject: 'Reject analytics',
  prefs: 'Privacy preferences',
  privacy: 'Privacy',
  cookies: 'Cookies',
  terms: 'Terms',
};

export const AnalyticsConsent = () => {
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
        <h2 id="consent-title">{copy.title}</h2>
        <p>{copy.body}</p>
        <p>
          <a href="/privacy" onClick={() => set('denied')}>{copy.privacy}</a>
          {' · '}
          <a href="/cookies" onClick={() => set('denied')}>{copy.cookies}</a>
          {' · '}
          <a href="/terms" onClick={() => set('denied')}>{copy.terms}</a>
        </p>
        <div className="consent-actions">
          <button type="button" onClick={() => set('denied')}>{copy.reject}</button>
          <button type="button" className="consent-accept" onClick={() => set('granted')}>{copy.accept}</button>
        </div>
      </section>
    </div>
  );
};

export const PrivacyFooter = () => {
  if (!isWeb()) return null;
  const updatePreferences = consent() === 'granted'
    ? revokeGoogleAnalytics
    : resetGoogleAnalyticsConsent;

  return (
    <footer className="privacy-footer">
      <a href="/privacy">{copy.privacy}</a>
      <a href="/cookies">{copy.cookies}</a>
      <a href="/terms">{copy.terms}</a>
      <button type="button" onClick={updatePreferences}>{copy.prefs}</button>
    </footer>
  );
};
