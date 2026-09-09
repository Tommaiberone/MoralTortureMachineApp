// components/GamebookWaitlist.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getApiHeaders } from '../utils/session';
import { trackEvent } from '../utils/analytics';
import './GamebookWaitlist.css';

// TASK-281 introduced this as an inline block in ResultsScreen; TASK-296
// extracted it so HomeScreen's floating banner and ResultsScreen's dossier
// card share one email-capture/submit/analytics implementation instead of
// two copies drifting apart (CLAUDE.md "reuse and unify over duplicating").
const GAMEBOOK_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GAMEBOOK_WAITLIST_STORAGE_KEY = 'mtm_gamebook_waitlist_subscribed';
const GAMEBOOK_BANNER_DISMISSED_KEY = 'mtm_gamebook_banner_dismissed';

const readLocalFlag = (key) => {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    // Best-effort - a blocked/unavailable localStorage just falls back to showing the form/banner.
    return false;
  }
};

// `variant` picks the visual shape ('card' for ResultsScreen's full-width
// dossier box, 'banner' for HomeScreen's floating strip); `surface` is an
// analytics dimension so gamebook_teaser_viewed/gamebook_waitlist_signup can
// be split by where the impression/signup came from. `dismissible` banners
// also skip themselves permanently (per device) for anyone already on the
// waitlist, instead of advertising a signup they've already completed.
export const GamebookWaitlist = ({ surface, variant = 'card', dismissible = false }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [status, setStatus] = useState(() => (readLocalFlag(GAMEBOOK_WAITLIST_STORAGE_KEY) ? 'success' : 'idle'));
  const [dismissed, setDismissed] = useState(() => {
    if (!dismissible) return false;
    return readLocalFlag(GAMEBOOK_BANNER_DISMISSED_KEY) || readLocalFlag(GAMEBOOK_WAITLIST_STORAGE_KEY);
  });
  const teaserTracked = useRef(false);

  useEffect(() => {
    if (dismissed || teaserTracked.current) return;
    teaserTracked.current = true;
    trackEvent('gamebook_teaser_viewed', { surface });
  }, [dismissed, surface]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(GAMEBOOK_BANNER_DISMISSED_KEY, 'true');
    } catch {
      // Best-effort - worst case the banner reappears next visit.
    }
    trackEvent('gamebook_teaser_dismissed', { surface });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!GAMEBOOK_EMAIL_PATTERN.test(trimmedEmail)) {
      setEmailError(t('results.gamebook_email_error'));
      return;
    }
    setEmailError('');
    setStatus('submitting');
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_URL}/gamebook-waitlist`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ email: trimmedEmail }),
      });
      if (!response.ok) throw new Error(`gamebook waitlist signup failed: ${response.status}`);
      try {
        localStorage.setItem(GAMEBOOK_WAITLIST_STORAGE_KEY, 'true');
      } catch {
        // Best-effort - the confirmation still shows for this render either way.
      }
      trackEvent('gamebook_waitlist_signup', { surface });
      setStatus('success');
    } catch (error) {
      console.error('Error joining gamebook waitlist:', error);
      setStatus('error');
    }
  };

  if (dismissed) return null;

  return (
    <div className={`gamebook-waitlist gamebook-waitlist-${variant}`}>
      {dismissible && (
        <button
          type="button"
          className="gamebook-waitlist-close"
          aria-label={t('results.gamebook_dismiss')}
          onClick={handleDismiss}
        >
          ×
        </button>
      )}
      <h2 className="gamebook-waitlist-title">{t('results.gamebook_title')}</h2>
      <p className="gamebook-waitlist-intro">{t('results.gamebook_intro')}</p>
      {status === 'success' ? (
        <p className="gamebook-waitlist-success">{t('results.gamebook_success')}</p>
      ) : (
        <form className="gamebook-waitlist-form" onSubmit={handleSubmit} noValidate>
          <input
            type="email"
            className="gamebook-waitlist-input"
            placeholder={t('results.gamebook_email_placeholder')}
            aria-label={t('results.gamebook_email_placeholder')}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (emailError) setEmailError('');
            }}
            disabled={status === 'submitting'}
            required
          />
          <button
            type="submit"
            className="btn-primary gamebook-waitlist-button"
            disabled={status === 'submitting'}
          >
            {status === 'submitting' ? t('results.gamebook_submitting') : t('results.gamebook_cta_button')}
          </button>
          {emailError && <p role="alert" className="gamebook-waitlist-error">{emailError}</p>}
          {status === 'error' && <p role="alert" className="gamebook-waitlist-error">{t('results.gamebook_error')}</p>}
        </form>
      )}
    </div>
  );
};

export default GamebookWaitlist;
