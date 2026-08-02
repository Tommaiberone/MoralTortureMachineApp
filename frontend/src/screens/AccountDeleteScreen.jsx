import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import useAuth from '../auth/useAuth';
import { signOut } from '../auth/authClient';
import { getAuthenticatedApiHeaders } from '../utils/session';
import { trackEvent } from '../utils/analytics';
import { PrivacyFooter } from '../components/AnalyticsConsent';

const API_URL = import.meta.env.VITE_API_URL;

const AccountDeleteScreen = () => {
  const { t } = useTranslation();
  const { isAuthenticated, loading, user, session, login } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [deleted, setDeleted] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/users/export`, {
        headers: getAuthenticatedApiHeaders(session.idToken),
      });
      if (!response.ok) throw new Error('export failed');
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'moral-torture-machine-account-data.json';
      link.click();
      URL.revokeObjectURL(url);
      trackEvent('account_data_exported', {});
    } catch {
      setError(t('account.exportError'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/users/me`, {
        method: 'DELETE',
        headers: getAuthenticatedApiHeaders(session.idToken),
      });
      if (!response.ok) throw new Error('delete failed');
      trackEvent('account_deleted', {});
      setDeleted(true);
      await signOut();
    } catch {
      setError(t('account.deleteError'));
      setBusy(false);
    }
  };

  if (loading) {
    return <main className="legal-screen"><p>{t('account.loading')}</p></main>;
  }

  if (deleted) {
    return (
      <main className="legal-screen">
        <article>
          <h1>{t('account.title')}</h1>
          <p>{t('account.deleteSuccess')}</p>
          <PrivacyFooter />
          <a href="/">← {t('common.backToHome')}</a>
        </article>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="legal-screen">
        <article>
          <h1>{t('account.title')}</h1>
          <p>{t('account.notLoggedIn')}</p>
          <button type="button" className="btn-primary" onClick={() => login(window.location.pathname)}>
            {t('auth.loginGoogle')}
          </button>
          <PrivacyFooter />
          <p><a href="/">← {t('common.backToHome')}</a></p>
        </article>
      </main>
    );
  }

  return (
    <main className="legal-screen">
      <article>
        <h1>{t('account.title')}</h1>
        <p>{t('account.loggedInAs', { email: user?.email || user?.sub })}</p>

        {error && <p role="alert">{error}</p>}

        <p>
          <button type="button" className="btn-primary" onClick={handleExport} disabled={busy}>
            {t('account.exportButton')}
          </button>
        </p>

        {!confirming && (
          <p>
            <button type="button" className="btn-primary" onClick={() => setConfirming(true)} disabled={busy}>
              {t('account.deleteButton')}
            </button>
          </p>
        )}

        {confirming && (
          <div>
            <p>{t('account.deleteConfirmPrompt')}</p>
            <button type="button" onClick={handleDelete} disabled={busy}>
              {t('account.deleteConfirmButton')}
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={busy}>
              {t('account.deleteCancelButton')}
            </button>
          </div>
        )}

        <PrivacyFooter />
        <p><a href="/">← {t('common.backToHome')}</a></p>
      </article>
    </main>
  );
};

export default AccountDeleteScreen;
