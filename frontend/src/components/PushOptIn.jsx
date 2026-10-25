import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { trackEvent } from '../utils/analytics';
import {
  disableWebPush,
  enableWebPush,
  getPushPermission,
  getWebPushTopics,
  isWebPushSupported,
} from '../utils/webPush';
import './PushOptIn.css';

// A declined prompt stays quiet for a week rather than nagging on every visit.
const DISMISS_QUIET_MS = 7 * 24 * 60 * 60 * 1000;
const dismissKey = (topic) => `mtm_push_prompt_dismissed_at_${topic}`;

const wasRecentlyDismissed = (topic) => {
  try {
    const dismissedAt = Number(localStorage.getItem(dismissKey(topic)));
    return Number.isFinite(dismissedAt) && dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_QUIET_MS;
  } catch {
    return false;
  }
};

const rememberDismissal = (topic) => {
  try {
    localStorage.setItem(dismissKey(topic), String(Date.now()));
  } catch {
    // The preference is a convenience; losing it only means asking again.
  }
};

/**
 * Notification opt-in for one topic (TASK-275, TASK-375): 'duel' (a Duel
 * finished, a rematch was asked) or 'daily' (the Daily Moral Crime verdict and
 * new case).
 *
 * `prompt` is the one-time ask shown at a moment the user has shown they care
 * (right after creating a challenge, after viewing a comparison, after voting
 * on the Daily); `setting` is the permanent on/off row for the account page.
 * Renders nothing where Web Push cannot work (the Android app, iOS Safari
 * outside the Home Screen), so those users never see a prompt that cannot
 * succeed.
 */
const PushOptIn = ({ topic, surface, variant = 'prompt', context = '' }) => {
  const { t } = useTranslation();
  const [supported] = useState(isWebPushSupported);
  const [topics, setTopics] = useState(null);
  const [permission, setPermission] = useState(getPushPermission);
  const [dismissed, setDismissed] = useState(() => wasRecentlyDismissed(topic));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const shownTracked = useRef(false);

  useEffect(() => {
    if (!supported) return undefined;
    let cancelled = false;
    void getWebPushTopics().then((followed) => {
      if (!cancelled) setTopics(followed);
    });
    return () => { cancelled = true; };
  }, [supported]);

  const subscribed = topics?.includes(topic) ?? false;
  const isPrompt = variant === 'prompt';
  const promptVisible = isPrompt && supported && topics !== null && !subscribed
    && permission !== 'denied' && !dismissed;

  useEffect(() => {
    if (!promptVisible || shownTracked.current) return;
    shownTracked.current = true;
    trackEvent('push_prompt_shown', { surface, topic });
  }, [promptVisible, surface, topic]);

  if (!supported || topics === null) return null;

  const handleEnable = async () => {
    setBusy(true);
    setError('');
    const result = await enableWebPush(topic);
    setPermission(getPushPermission());
    if (result === 'subscribed') {
      setTopics((current) => [...new Set([...(current || []), topic])]);
    } else if (result === 'denied') {
      trackEvent('push_permission_denied', { surface, topic });
    } else if (result === 'dismissed') {
      trackEvent('push_prompt_dismissed', { surface, topic, method: 'browser_dialog' });
      if (isPrompt) {
        rememberDismissal(topic);
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
    if (await disableWebPush(topic)) {
      setTopics((current) => (current || []).filter((followed) => followed !== topic));
    } else {
      setError(t('push.error'));
    }
    setBusy(false);
  };

  const handleNotNow = () => {
    trackEvent('push_prompt_dismissed', { surface, topic, method: 'not_now' });
    rememberDismissal(topic);
    setDismissed(true);
  };

  if (!isPrompt) {
    // A browser-level block can only be undone in the browser's own settings.
    const blocked = !subscribed && permission === 'denied';
    return (
      <div className="push-optin push-optin--setting">
        <div className="push-optin-setting-text">
          <span className="push-optin-setting-label">{t(`push.${topic}.setting_label`)}</span>
          <span className="push-optin-setting-status">
            {blocked ? t('push.setting_blocked') : t(subscribed ? `push.${topic}.setting_on` : 'push.setting_off')}
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
        <p className="push-optin-text">{t(`push.${topic}.confirmed`)}</p>
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
      <p className="push-optin-text">{t(`push.${topic}.prompt_text${context ? `_${context}` : ''}`)}</p>
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
