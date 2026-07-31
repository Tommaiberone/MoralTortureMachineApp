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

const copy = {
  en: { title: 'Your privacy choices', body: 'Essential browser storage runs the game. With permission, Google Analytics measures aggregate web use only. No advertising, profiling or personalised ads are used.', accept: 'Accept analytics', reject: 'Reject analytics', prefs: 'Privacy preferences', privacy: 'Privacy', cookies: 'Cookies' },
  it: { title: 'Le tue scelte privacy', body: 'Lo storage essenziale del browser fa funzionare il gioco. Con il tuo consenso, Google Analytics misura solo l’uso aggregato del sito. Non usiamo advertising, profilazione o annunci personalizzati.', accept: 'Accetta analytics', reject: 'Rifiuta analytics', prefs: 'Preferenze privacy', privacy: 'Privacy', cookies: 'Cookie' },
};

export const AnalyticsConsent = () => {
  const { i18n } = useTranslation();
  const [choice, setChoice] = useState(consent());
  if (!isWeb() || choice) return null;
  const text = copy[i18n.resolvedLanguage === 'it' ? 'it' : 'en'];
  const set = (value) => {
    saveConsent(value);
    setChoice(value);
    if (value === 'granted') loadGoogleAnalytics();
  };

  return (
    <div className="consent-overlay">
      <section className="consent-card" role="dialog" aria-modal="true" aria-labelledby="consent-title">
        <h2 id="consent-title">{text.title}</h2>
        <p>{text.body}</p>
        <p>
          <a href="/privacy" onClick={() => set('denied')}>{text.privacy}</a>
          {' · '}
          <a href="/cookies" onClick={() => set('denied')}>{text.cookies}</a>
        </p>
        <div className="consent-actions">
          <button type="button" onClick={() => set('denied')}>{text.reject}</button>
          <button type="button" className="consent-accept" onClick={() => set('granted')}>{text.accept}</button>
        </div>
      </section>
    </div>
  );
};

export const PrivacyFooter = () => {
  const { i18n } = useTranslation();
  if (!isWeb()) return null;
  const text = copy[i18n.resolvedLanguage === 'it' ? 'it' : 'en'];
  const updatePreferences = consent() === 'granted'
    ? revokeGoogleAnalytics
    : resetGoogleAnalyticsConsent;

  return (
    <footer className="privacy-footer">
      <a href="/privacy">{text.privacy}</a>
      <a href="/cookies">{text.cookies}</a>
      <button type="button" onClick={updatePreferences}>{text.prefs}</button>
    </footer>
  );
};
