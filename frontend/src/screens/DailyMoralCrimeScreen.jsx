import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import SEO from '../components/SEO';
import { API_BASE_URL } from '../config/api';
import { getApiHeaders } from '../utils/session';
import { trackEvent } from '../utils/analytics';
import { shareDailyCard } from '../utils/shareCard';
import { withShareAttribution } from '../utils/attribution';
import './DailyMoralCrimeScreen.css';

const nextRefreshLabel = (isoDate, locale) => {
  if (!isoDate) return '';
  try {
    return new Intl.DateTimeFormat(locale || 'en', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(new Date(isoDate));
  } catch {
    return '';
  }
};

const DailyMoralCrimeScreen = () => {
  const { t, i18n } = useTranslation();
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');
  const [shareStatus, setShareStatus] = useState('');
  const revealTracked = useRef(false);

  const loadDaily = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/daily-moral-crime`, {
        headers: getApiHeaders(),
      });
      if (!response.ok) throw new Error(`Daily fetch failed: ${response.status}`);
      const data = await response.json();
      setDaily(data);
      trackEvent('daily_moral_crime_viewed', { has_voted: Boolean(data.hasVoted) });
    } catch (fetchError) {
      console.error('Unable to load Daily Moral Crime:', fetchError);
      setError(t('daily.load_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadDaily();
  }, [loadDaily]);

  useEffect(() => {
    if (daily?.hasVoted && !revealTracked.current) {
      revealTracked.current = true;
      trackEvent('daily_moral_crime_revealed');
    }
  }, [daily?.hasVoted]);

  const vote = async (choice) => {
    if (!daily || daily.hasVoted || voting) return;
    setVoting(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/daily-moral-crime/vote`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ dayKey: daily.dayKey, choice }),
      });
      if (response.status === 409) {
        await loadDaily();
        setError(t('daily.day_changed'));
        return;
      }
      if (!response.ok) throw new Error(`Daily vote failed: ${response.status}`);
      const data = await response.json();
      setDaily(data);
      trackEvent('daily_moral_crime_vote_cast');
    } catch (voteError) {
      console.error('Unable to save Daily Moral Crime vote:', voteError);
      setError(t('daily.vote_error'));
    } finally {
      setVoting(false);
    }
  };

  const askTheAudience = async () => {
    if (!daily?.results) return;
    const agreementPct = daily.choice === 'first' ? daily.results.firstPct : daily.results.secondPct;
    // TASK-225: the real "chose like you" percentage is the headline of the
    // card itself; the accompanying text carries the same stat plus a
    // UTM-tagged link (TASK-33), matching every other game mode's pattern.
    const taggedUrl = withShareAttribution(new URL('/daily', window.location.origin).toString(), {
      source: 'share_card',
      campaign: 'ask_the_audience',
    });
    const shareText = `${t('daily.share_text', { pct: agreementPct })}\n\n${taggedUrl}`;
    setShareStatus('');

    const method = await shareDailyCard(daily.dilemma, daily.choice, daily.results, shareText);
    trackEvent('daily_moral_crime_audience_shared', { method });
    if (method === 'download') {
      setShareStatus(t('daily.share_card_saved'));
    }
  };

  const results = daily?.results;
  const selectedAnswer = daily?.choice === 'first'
    ? daily?.dilemma?.firstAnswer
    : daily?.dilemma?.secondAnswer;

  return (
    <main className="screen-container daily-screen">
      <SEO
        title={t('daily.seo_title')}
        description={t('daily.seo_description')}
        url="/daily"
      />
      <Link className="nav-back-button" to="/">← {t('daily.back_home')}</Link>

      <header className="daily-header">
        <p className="daily-kicker">{t('daily.kicker')}</p>
        <h1 className="screen-title-large">{t('daily.title')}</h1>
        <p className="screen-subtitle">{t('daily.subtitle')}</p>
      </header>

      {loading && <p className="daily-loading" role="status">{t('daily.loading')}</p>}

      {!loading && error && !daily && (
        <section className="daily-error" role="alert">
          <p>{error}</p>
          <button type="button" className="btn-primary" onClick={() => void loadDaily()}>
            {t('daily.try_again')}
          </button>
        </section>
      )}

      {!loading && daily && (
        <section className="card-default daily-card" aria-busy={voting}>
          <p className="text-box-default daily-prompt">{daily.dilemma?.dilemma}</p>

          {!daily.hasVoted ? (
            <>
              <p className="daily-before-vote">{t('daily.before_vote')}</p>
              <div className="daily-choice-stack">
                <button
                  type="button"
                  className="btn-yes daily-choice"
                  disabled={voting}
                  onClick={() => void vote('first')}
                >
                  {daily.dilemma?.firstAnswer}
                </button>
                <button
                  type="button"
                  className="btn-no daily-choice"
                  disabled={voting}
                  onClick={() => void vote('second')}
                >
                  {daily.dilemma?.secondAnswer}
                </button>
              </div>
              {voting && <p className="daily-loading" role="status">{t('daily.recording_vote')}</p>}
            </>
          ) : (
            <div className="daily-reveal">
              <p className="daily-choice-label">{t('daily.your_choice')}</p>
              <p className="daily-selected-answer">{selectedAnswer}</p>
              {daily.reflection && <p className="tease-text">{daily.reflection}</p>}

              {results && (
                <section className="daily-results" aria-label={t('daily.results_label')}>
                  <h2 className="screen-title">{t('daily.results_title')}</h2>
                  <p className="daily-vote-total">{t('daily.vote_total', { count: results.totalVotes })}</p>
                  <div className="daily-result-row">
                    <span>{daily.dilemma?.firstAnswer}</span>
                    <strong>{results.firstPct}%</strong>
                  </div>
                  <div className="daily-result-bar" aria-hidden="true">
                    <span className="daily-result-first" style={{ width: `${results.firstPct}%` }} />
                  </div>
                  <div className="daily-result-row">
                    <span>{daily.dilemma?.secondAnswer}</span>
                    <strong>{results.secondPct}%</strong>
                  </div>
                  <div className="daily-result-bar" aria-hidden="true">
                    <span className="daily-result-second" style={{ width: `${results.secondPct}%` }} />
                  </div>
                </section>
              )}

              <button type="button" className="btn-primary daily-share-button" onClick={() => void askTheAudience()}>
                {t('daily.ask_audience')}
              </button>
              <p className="daily-share-copy">{t('daily.ask_audience_hint')}</p>
              {shareStatus && <p className="daily-share-status" role="status">{shareStatus}</p>}
            </div>
          )}

          {error && <p className="daily-inline-error" role="alert">{error}</p>}
        </section>
      )}

      {daily?.nextReleaseAt && (
        <p className="daily-next-release">
          {t('daily.next_refresh', { time: nextRefreshLabel(daily.nextReleaseAt, i18n.language) })}
        </p>
      )}
    </main>
  );
};

export default DailyMoralCrimeScreen;
