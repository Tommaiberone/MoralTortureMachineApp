import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { completeSignIn } from '../auth/authClient';
import useAuth from '../auth/useAuth';
import { trackEvent } from '../utils/analytics';

const AuthCallbackScreen = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const started = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const complete = async () => {
      try {
        const { returnTo } = await completeSignIn(window.location.search);
        await refreshSession();
        navigate(returnTo, { replace: true });
      } catch (callbackError) {
        console.error('Authentication callback failed', callbackError);
        trackEvent('auth_failed', { reason: 'callback' });
        setError(t('auth.callbackError'));
      }
    };

    void complete();
  }, [navigate, refreshSession, t]);

  return (
    <main className="loading-container">
      <div className="spinner" aria-hidden="true" />
      <p className="loading-text">{error || t('auth.completing')}</p>
      {error && <button type="button" onClick={() => navigate('/', { replace: true })}>{t('common.backToHome')}</button>}
    </main>
  );
};

export default AuthCallbackScreen;
