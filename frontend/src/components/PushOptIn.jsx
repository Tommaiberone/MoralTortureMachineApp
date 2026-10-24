import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { trackEvent } from '../utils/analytics';
import {
  disableWebPush,
  enableWebPush,
  getPushPermission,
  hasWebPushSubscription,
  isWebPushSupported,
} from '../utils/webPush';
import './PushOptIn.css';

// A declined prompt stays quiet for a week rather than nagging on every visit.
const DISMISS_STORAGE_KEY = 'mtm_push_prompt_dismissed_at';
const DISMISS_QUIET_MS = 7 * 24 * 60 * 60 * 1000;

const wasRecentlyDismissed = () => {
  try {
    const dismissedAt = Number(localStorage.getItem(DISMISS_STORAGE_KEY));
    return Number.isFinite(dismissedAt) && dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_QUIET_MS;
  } catch {
    return false;
  }
};

const rememberDismissal = () => {
  try {
    localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
  } catch {
    // The preference is a convenience; losing it only means asking again.
  }
};

/**
 * Duel notifications opt-in (TASK-275).
 *
 * `prompt` is the one-time ask shown right after the user creates a challenge
 * (the moment they have shown they care about the answer); `setting` is the
 * permanent on/off row for the account page. Renders nothing where Web Push
 * cannot work (the Android app, iOS Safari outside the Home Screen), so those
 * users never see a prompt that cannot succeed.
 */
const PushOptIn = ({ surface, variant = 'prompt' }) => {
  const { t } = useTranslation();
  const [supported] = useState(isWebPushSupported);
  const [subscribed, setSubscribed] = useState(null);
  const [permission, setPermission] = useState(getPushPermission);
  const [dismissed, setDismissed] = useState(wasRecentlyDismissed);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const shownTracked = useRef(false);

  useEffect(() => {
    if (!supported) return undefined;
    let cancelled = false;
    void hasWebPushSubscription().then((has) => {
      if (!cancelled) setSubscribed(has);
    });
    return () => { cancelled = true; };
  }, [supported]);

  const isPrompt = variant === 'prompt';
  const promptVisible = isPrompt && supported && subscribed === false && permission !== 'denied' && !dismissed;

  useEffect(() => {
    if (!promptVisible || shownTracked.current) return;
    shownTracked.current = true;
    trackEvent('push_prompt_shown', { surface });
  }, [promptVisible, surface]);

  if (!supported || subscribed === null) return null;

  const handleEnable = async () => {
    setBusy(true);
    setError('');
    const result = await enableWebPush();
    setPermission(getPushPermission());
    if (result === 'subscribed') {
      setSubscribed(true);
    } else if (result === 'denied') {
      trackEvent('push_permission_denied', { surface });
    } else if (result === 'dismissed') {
      trackEvent('push_prompt_dismissed', { surface, method: 'browser_dialog' });
      if (isPrompt) {
        rememberDismissal();
        setDismissed(true);
      }
    } else {
      setError(t('push.error'));
    }
    setBusy(false);
  };

  const handleDisable = async () => {
    setBusy(true);
    setError('');
    if (await disableWebPush()) {
      setSubscribed(false);
    } else {
      setError(t('push.error'));
    }
    setBusy(false);
  };

  const handleNotNow = () => {
    trackEvent('push_prompt_dismissed', { surface, method: 'not_now' });
    rememberDismissal();
    setDismissed(true);
  };

  if (!isPrompt) {
    // A browser-level block can only be undone in the browser's own settings.
    const blocked = !subscribed && permission === 'denied';
    return (
      <div className="push-optin push-optin--setting">
        <div className="push-optin-setting-text">
          <span className="push-optin-setting-label">{t('push.setting_label')}</span>
          <span className="push-optin-setting-status">
            {blocked ? t('push.setting_blocked') : t(subscribed ? 'push.setting_on' : 'push.setting_off')}
          </span>
        </div>
        {!blocked && (
          <button
            type="button"
            className="push-optin-link"
            onClick={subscribed ? handleDisable : handleEnable}
            disabled={busy}
          >
            {t(subscribed ? 'push.turn_off' : 'push.turn_on')}
          </button>
        )}
        {error && <p className="push-optin-error" role="alert">{error}</p>}
      </div>
    );
  }

  if (subscribed) {
    return (
      <div className="push-optin push-optin--confirmed">
        <p className="push-optin-text">{t('push.confirmed')}</p>
        <button type="button" className="push-optin-link" onClick={handleDisable} disabled={busy}>
          {t('push.turn_off')}
        </button>
        {error && <p className="push-optin-error" role="alert">{error}</p>}
      </div>
    );
  }

  if (!promptVisible) return null;

  return (
    <div className="push-optin">
      <p className="push-optin-text">{t('push.prompt_text')}</p>
      <div className="push-optin-actions">
        <button type="button" className="btn-primary" onClick={handleEnable} disabled={busy}>
          {t('push.prompt_accept')}
        </button>
        <button type="button" className="push-optin-link" onClick={handleNotNow} disabled={busy}>
          {t('push.prompt_decline')}
        </button>
      </div>
      {error && <p className="push-optin-error" role="alert">{error}</p>}
    </div>
  );
};

export default PushOptIn;
