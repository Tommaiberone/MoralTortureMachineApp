import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import useAuth from '../auth/useAuth';
import { signOut } from '../auth/authClient';
import { clearLocalAccountData, getAuthenticatedApiHeaders } from '../utils/session';
import { clearAnalyticsQueue, trackEvent } from '../utils/analytics';
import { PrivacyFooter } from '../components/AnalyticsConsent';
import './AccountDeleteScreen.css';

const API_URL = import.meta.env.VITE_API_URL;

const AccountDeleteScreen = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, loading, user, session, login, logout } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [deleted, setDeleted] = useState(false);

  const [archetype, setArchetype] = useState(null);
  const [archetypeLoading, setArchetypeLoading] = useState(true);
  const [duelStats, setDuelStats] = useState(null);
  const [duelStatsLoading, setDuelStatsLoading] = useState(true);
  const [creatingChallenge, setCreatingChallenge] = useState(false);
  const [challengeError, setChallengeError] = useState('');
  const [rematchingToken, setRematchingToken] = useState('');

  // TASK-177.3/177.5: the results-recap section is authenticated-only by
  // product decision (an extra, concrete activation lever alongside the
  // existing pair-insight login incentive), so these only fetch once we
  // know the caller is signed in.
  useEffect(() => {
    if (!isAuthenticated || !session?.idToken) return;
    let cancelled = false;
    const headers = getAuthenticatedApiHeaders(session.idToken);

    (async () => {
      try {
        const response = await fetch(`${API_URL}/users/me/archetype`, { headers });
        if (!response.ok) throw new Error(`archetype fetch failed: ${response.status}`);
        const data = await response.json();
        if (!cancelled) setArchetype(data.archetype);
      } catch (fetchError) {
        console.error('Error fetching latest archetype:', fetchError);
      } finally {
        if (!cancelled) setArchetypeLoading(false);
      }
    })();

    (async () => {
      try {
        const response = await fetch(`${API_URL}/users/me/duel-stats`, { headers });
        if (!response.ok) throw new Error(`duel stats fetch failed: ${response.status}`);
        const data = await response.json();
        if (!cancelled) setDuelStats(data);
      } catch (fetchError) {
        console.error('Error fetching duel stats:', fetchError);
      } finally {
        if (!cancelled) setDuelStatsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isAuthenticated, session?.idToken]);

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
      clearAnalyticsQueue();
      await clearLocalAccountData();
      setDeleted(true);
      await signOut({ track: false });
    } catch {
      setError(t('account.deleteError'));
      setBusy(false);
    }
  };

  const handleChallengeSomeoneNew = async () => {
    setCreatingChallenge(true);
    setChallengeError('');
    try {
      const response = await fetch(`${API_URL}/challenges`, {
        method: 'POST',
        headers: getAuthenticatedApiHeaders(session.idToken),
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error(`challenge creation failed: ${response.status}`);
      const challenge = await response.json();
      trackEvent('challenge_share_ready', { object_type: 'account', challenge_token: challenge.challengeToken });
      navigate(`/challenge/${challenge.challengeToken}`);
    } catch (createError) {
      console.error('Error creating challenge from account page:', createError);
      setChallengeError(t('account.challengeError'));
    } finally {
      setCreatingChallenge(false);
    }
  };

  const handleRematch = async (token) => {
    setRematchingToken(token);
    setChallengeError('');
    try {
      const response = await fetch(`${API_URL}/challenges/${token}/rematch`, {
        method: 'POST',
        headers: getAuthenticatedApiHeaders(session.idToken),
      });
      if (!response.ok) throw new Error(`rematch failed: ${response.status}`);
      const rematch = await response.json();
      trackEvent('challenge_rematch_created', { rematch_of_token: token, surface: 'account' });
      navigate(`/challenge/${rematch.challengeToken}`);
    } catch (rematchError) {
      console.error('Error creating rematch from account page:', rematchError);
      setChallengeError(t('account.challengeError'));
    } finally {
      setRematchingToken('');
    }
  };

  if (loading) {
    return <main className="account-screen"><p>{t('account.loading')}</p></main>;
  }

  if (deleted) {
    return (
      <main className="account-screen">
        <div className="account-page">
          <h1 className="account-page-title">{t('account.title')}</h1>
          <p>{t('account.deleteSuccess')}</p>
          <PrivacyFooter />
          <a className="account-back-link" href="/">&larr; {t('common.backToHome')}</a>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="account-screen">
        <div className="account-page">
          <h1 className="account-page-title">{t('account.title')}</h1>
          <div className="account-login-card">
            <p>{t('account.notLoggedInBenefits')}</p>
            <p>{t('account.notLoggedIn')}</p>
            <button type="button" className="btn-primary" onClick={() => login(window.location.pathname)}>
              {t('auth.loginGoogle')}
            </button>
          </div>
          <PrivacyFooter />
          <p><a className="account-back-link" href="/">&larr; {t('common.backToHome')}</a></p>
        </div>
      </main>
    );
  }

  const hasArchetype = Boolean(archetype);
  const hasDuels = Boolean(duelStats?.completedDuelsCount);

  return (
    <main className="account-screen">
      <div className="account-page">
        <a className="account-back-link" href="/">&larr; {t('common.backToHome')}</a>
        <h1 className="account-page-title">{t('account.title')}</h1>

        <section className="account-section">
          <div className="account-identity">
            <span className="account-identity-email">
              {user?.email ? t('account.loggedInAs', { email: user.email }) : t('account.loggedInGeneric')}
            </span>
            <button type="button" className="account-logout-button" onClick={() => logout()}>
              {t('auth.logout')}
            </button>
          </div>
        </section>

        {!archetypeLoading && (
          <section className="account-section">
            <p className="account-eyebrow">{t('account.archetypeEyebrow')}</p>
            {hasArchetype ? (
              <>
                <div className="account-archetype-card" style={{ '--archetype-color': archetype.visual?.color }}>
                  <div className="account-archetype-top">
                    <span className="account-archetype-emoji">{archetype.visual?.emoji}</span>
                    <h2 className="account-archetype-name">{archetype.name}</h2>
                  </div>
                  <p className="account-archetype-desc">{archetype.description}</p>
                  <p className="account-archetype-trait"><b>{t('results.archetype_strength')}: </b>{archetype.strength}</p>
                  <p className="account-archetype-trait"><b>{t('results.archetype_blind_spot')}: </b>{archetype.blindSpot}</p>
                </div>
                <button type="button" className="account-cta-secondary" onClick={() => navigate('/tutorial', { state: { mode: 'evaluation' } })}>
                  {t('account.retakeTestButton')}
                </button>
              </>
            ) : (
              <div className="account-empty-card">
                <p>{t('account.noArchetypeYet')}</p>
                <button type="button" className="btn-primary" onClick={() => navigate('/tutorial', { state: { mode: 'evaluation' } })}>
                  {t('account.takeTestButton')}
                </button>
              </div>
            )}
          </section>
        )}

        {!duelStatsLoading && hasDuels && (
          <section className="account-section">
            <p className="account-eyebrow">{t('account.duelStatsEyebrow')}</p>
            <div className="account-stat-row">
              <div className="account-stat-tile">
                <div className="account-stat-value">{duelStats.completedDuelsCount}</div>
                <div className="account-stat-label">{t('account.statDuelsCompleted')}</div>
              </div>
              <div className="account-stat-tile">
                <div className="account-stat-value">{Math.round(duelStats.averageCompatibilityPct)}%</div>
                <div className="account-stat-label">{t('account.statAvgCompatibility')}</div>
              </div>
              <div className="account-stat-tile">
                <div className="account-stat-value">{duelStats.distinctArchetypesMet}</div>
                <div className="account-stat-label">{t('account.statArchetypesMet')}</div>
              </div>
            </div>

            <div className="account-duel-list">
              {duelStats.recentDuels.map((duel) => (
                <div className="account-duel-row" key={duel.challengeToken} style={{ '--duel-color': duel.opponentArchetype.visual?.color }}>
                  <span className="account-duel-emoji">{duel.opponentArchetype.visual?.emoji}</span>
                  <div className="account-duel-info">
                    <div className="account-duel-name">{t('account.duelVs', { name: duel.opponentArchetype.name })}</div>
                  </div>
                  <div className="account-duel-pct">{Math.round(duel.overallAgreementPct)}%</div>
                  <div className="account-duel-actions">
                    <button type="button" className="account-duel-action" onClick={() => navigate(`/challenge/${duel.challengeToken}/compare`)}>
                      {t('account.duelViewAction')}
                    </button>
                    <button
                      type="button"
                      className="account-duel-action"
                      disabled={rematchingToken === duel.challengeToken}
                      onClick={() => handleRematch(duel.challengeToken)}
                    >
                      {rematchingToken === duel.challengeToken ? t('account.duelRematching') : t('account.duelRematchAction')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {hasArchetype && (
          <section className="account-section">
            {challengeError && <p className="account-error" role="alert">{challengeError}</p>}
            <button type="button" className="btn-primary" onClick={handleChallengeSomeoneNew} disabled={creatingChallenge}>
              {creatingChallenge ? t('account.challengeCreating') : t('account.challengeButton')}
            </button>
          </section>
        )}

        <section className="account-section account-settings-block">
          <p className="account-eyebrow">{t('account.settingsEyebrow')}</p>

          {error && <p className="account-error" role="alert">{error}</p>}

          <div className="account-settings-links">
            <button type="button" className="account-settings-link" onClick={handleExport} disabled={busy}>
              {t('account.exportButton')}
            </button>
            {!confirming && (
              <button type="button" className="account-settings-link danger" onClick={() => setConfirming(true)} disabled={busy}>
                {t('account.deleteButton')}
              </button>
            )}
          </div>

          {confirming && (
            <div className="account-delete-confirm">
              <p>{t('account.deleteConfirmPrompt')}</p>
              <div className="account-delete-confirm-actions">
                <button type="button" className="btn-primary" onClick={handleDelete} disabled={busy}>
                  {t('account.deleteConfirmButton')}
                </button>
                <button type="button" className="account-cta-secondary" onClick={() => setConfirming(false)} disabled={busy}>
                  {t('account.deleteCancelButton')}
                </button>
              </div>
            </div>
          )}

          <PrivacyFooter />
        </section>
      </div>
    </main>
  );
};

export default AccountDeleteScreen;
