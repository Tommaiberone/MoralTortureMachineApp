// screens/ResultsScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import { getApiHeaders, getAuthenticatedApiHeaders } from '../utils/session';
import SEO from '../components/SEO';
import { trackEvent } from '../utils/analytics';
import { trackGoogleAnalyticsEvent } from '../utils/googleAnalytics';
import { shareOrDownloadCard } from '../utils/shareCard';
import useAuth from '../auth/useAuth';
import './ResultsScreen.css';

const ResultsScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const auth = useAuth();
  const { answers, dilemmasWithChoices } = location.state || { answers: [], dilemmasWithChoices: [] };
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [archetype, setArchetype] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [challengeUrl, setChallengeUrl] = useState('');
  const [creatingChallenge, setCreatingChallenge] = useState(false);
  const [challengeError, setChallengeError] = useState('');
  const [challengeLoginRequired, setChallengeLoginRequired] = useState(false);
  const resultTracked = useRef(false);
  const hasResults = Boolean(answers && answers.length > 0);

  // Aggregate the answers to compute average values for each category
  const aggregated = (answers || []).reduce((acc, curr) => {
    for (let key in curr) {
      acc[key] = (acc[key] || 0) + curr[key];
    }
    return acc;
  }, {});

  const archetypeShareLine = archetype
    ? `${archetype.visual?.emoji || ''} ${archetype.name}: "${archetype.sharePhrase}"\n\n`
    : '';

  const labels = Object.keys(aggregated);
  const maxAverage = labels.length > 0
    ? Math.max(...Object.values(aggregated).map(v => v / answers.length))
    : 0;
  const data = labels.map(label => ({
    subject: label,
    value: (aggregated[label] / answers.length).toFixed(2),
    fullMark: maxAverage * 1.2,
  }));

  useEffect(() => {
    if (!hasResults || resultTracked.current) return;
    resultTracked.current = true;
    trackEvent('result_viewed', {
      mode: 'evaluation',
      completed_dilemmas: answers.length,
    });
    trackGoogleAnalyticsEvent('result_viewed');
  }, [answers, hasResults]);

  useEffect(() => {
    // Block browser back button
    const preventBackNavigation = (_event) => {
      window.history.pushState(null, '', window.location.href);
    };

    // Add a dummy entry to history
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', preventBackNavigation);

    return () => {
      window.removeEventListener('popstate', preventBackNavigation);
    };
  }, []);

  // Fetch AI analysis when component mounts
  useEffect(() => {
    const fetchAiAnalysis = async () => {
      if (!answers || answers.length === 0) return;

      setLoadingAnalysis(true);
      try {
        const currentLanguage = i18n.language;
        const API_URL = import.meta.env.VITE_API_URL;
        const backendUrl = `${API_URL}/analyze-results`;
        const response = await fetch(`${backendUrl}?language=${currentLanguage}`, {
          method: "POST",
          headers: getApiHeaders(),
          body: JSON.stringify({
            answers,
            dilemmasWithChoices: dilemmasWithChoices || []
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Check if it's a rate limit error
        if (response.status === 429) {
          setAiAnalysis(t('results.rate_limit_error'));
        } else if (!response.ok) {
          setAiAnalysis(t('results.analysis_error'));
        } else {
          setAiAnalysis(result.analysis);
          setArchetype(result.archetype || null);
        }
      } catch (error) {
        console.error("Error fetching AI analysis:", error);
        setAiAnalysis(t('results.analysis_error'));
      } finally {
        setLoadingAnalysis(false);
      }
    };

    fetchAiAnalysis();
  }, [answers, dilemmasWithChoices, i18n.language, t]);

  const handleChallengeAFriend = async () => {
    if (!dilemmasWithChoices || dilemmasWithChoices.length === 0) return;
    setCreatingChallenge(true);
    setChallengeError('');
    setChallengeLoginRequired(false);
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const headers = auth.session?.idToken
        ? getAuthenticatedApiHeaders(auth.session.idToken)
        : getApiHeaders();
      const profileAnswers = dilemmasWithChoices.map((entry) => ({
        dilemmaBaseId: entry.dilemmaBaseId,
        chosenValues: entry.chosenValues,
      }));

      const profileResponse = await fetch(`${API_URL}/profiles`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ answers: profileAnswers, language: i18n.language }),
      });
      if (!profileResponse.ok) throw new Error(`profile creation failed: ${profileResponse.status}`);
      const profile = await profileResponse.json();

      const challengeResponse = await fetch(`${API_URL}/challenges`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ profilePublicId: profile.publicId }),
      });
      if (challengeResponse.status === 401) {
        // TASK-136: this anon id already has a prior Duel profile, so a
        // further challenge requires an account - a concrete, contextual
        // ask, not a generic error.
        trackEvent('auth_prompt_shown', { surface: 'results_challenge', object_type: 'result' });
        setChallengeLoginRequired(true);
        return;
      }
      if (!challengeResponse.ok) throw new Error(`challenge creation failed: ${challengeResponse.status}`);
      const challenge = await challengeResponse.json();

      trackEvent('challenge_share_ready', { object_type: 'result', challenge_token: challenge.challengeToken });
      setChallengeUrl(`${window.location.origin}/challenge/${challenge.challengeToken}`);
    } catch (error) {
      console.error('Error creating challenge:', error);
      setChallengeError(t('results.challenge_error'));
    } finally {
      setCreatingChallenge(false);
    }
  };

  if (!hasResults) {
    return (
      <div className="results-gradient-background">
        <div className="results-container">
          <h1 className="screen-title results-title">{t('results.no_results')}</h1>
          <button
            className="btn-primary results-back-button"
            onClick={() => navigate('/')}
          >
            {t('results.home_button')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="results-scroll-container">
        <SEO
          title="Your Moral Profile - AI Analysis Results"
          description="View your personalized moral profile analysis. Discover your ethical framework through AI-powered insights based on your responses to moral dilemmas and ethical challenges."
          keywords="moral profile, ethical analysis results, AI moral analysis, personality results, moral framework analysis, ethics test results, philosophical profile"
          url="/results"
          noindex={true}
        />
        <button
          className="nav-back-button results-go-back-button"
          onClick={() => navigate('/')}
        >
          <span className="arrow">←</span>
          <span>{t('results.back_button')}</span>
        </button>

        <h1 className="screen-title results-title">{t('results.title')}</h1>

        <div className="results-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 'auto']}
                tick={{ fontSize: 10 }}
              />
              <Radar
                name={t('results.moral_profile')}
                dataKey="value"
                stroke="var(--horror-crimson)"
                fill="var(--horror-blood-red)"
                fillOpacity={0.8}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {(archetype || loadingAnalysis || aiAnalysis) && (
          <div className="results-archetype" style={{ borderColor: archetype?.visual?.color }}>
            {archetype && (
              <h2 className="results-archetype-name">
                <span className="results-archetype-emoji">{archetype.visual?.emoji}</span> {archetype.name}
              </h2>
            )}
            {loadingAnalysis ? (
              <div className="results-ai-loading">
                <div className="spinner"></div>
                <p className="results-ai-loading-text">{t('results.analyzing')}</p>
              </div>
            ) : (
              // If /analyze-results failed entirely, archetype never got set but
              // aiAnalysis still carries a fallback error message (TASK-121 AC3):
              // this keeps the card visible instead of silently disappearing.
              <p className="results-ai-text">{aiAnalysis}</p>
            )}
            {archetype && (
              <>
                <p className="results-archetype-strength">
                  <strong>{t('results.archetype_strength')}:</strong> {archetype.strength}
                </p>
                <p className="results-archetype-blind-spot">
                  <strong>{t('results.archetype_blind_spot')}:</strong> {archetype.blindSpot}
                </p>
              </>
            )}
          </div>
        )}

        <div className="results-share-container">
          <h2 className="results-share-title">{t('results.share_title')}</h2>
          <div className="results-share-buttons">
            <button
              className="results-share-button whatsapp"
              onClick={() => {
                trackEvent('share_clicked', { channel: 'whatsapp', object_type: 'result' });
                const shareText = t('results.share_text');
                const shareChallenge = t('results.share_challenge');
                const url = window.location.origin;
                const message = `${shareText}\n\n${archetypeShareLine}${aiAnalysis}\n\n${shareChallenge} ${url}`;
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`);
              }}
            >
              WhatsApp
            </button>
            <button
              className="results-share-button facebook"
              onClick={() => {
                trackEvent('share_clicked', { channel: 'facebook', object_type: 'result' });
                const shareText = t('results.share_text');
                const shareChallenge = t('results.share_challenge');
                const url = window.location.origin;
                const message = `${shareText}\n\n${archetypeShareLine}${aiAnalysis}\n\n${shareChallenge} ${url}`;
                navigator.clipboard.writeText(message);
                alert(t('results.facebook_share_alert'));
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
              }}
            >
              Facebook
            </button>
            {archetype && (
              <>
                <button
                  className="results-share-button card-download"
                  onClick={async () => {
                    const method = await shareOrDownloadCard(archetype, 'stories', t('results.share_text'), data);
                    trackEvent('share_card_downloaded', { format: 'stories', method });
                  }}
                >
                  {t('results.download_card_stories')}
                </button>
                <button
                  className="results-share-button card-download"
                  onClick={async () => {
                    const method = await shareOrDownloadCard(archetype, 'square', t('results.share_text'), data);
                    trackEvent('share_card_downloaded', { format: 'square', method });
                  }}
                >
                  {t('results.download_card_square')}
                </button>
              </>
            )}
          </div>
        </div>

        {archetype && (
          <div className="results-challenge-container">
            <h2 className="results-challenge-title">{t('results.challenge_title')}</h2>
            <p className="results-challenge-intro">{t('results.challenge_intro')}</p>
            {challengeLoginRequired ? (
              <div className="results-challenge-login">
                <p className="results-challenge-login-text">{t('results.challenge_login_required_text')}</p>
                <button
                  type="button"
                  className="btn-primary results-challenge-button"
                  onClick={() => {
                    trackEvent('auth_prompt_clicked', { surface: 'results_challenge', object_type: 'result' });
                    void auth.login(window.location.pathname);
                  }}
                >
                  {t('results.challenge_login_required_button')}
                </button>
              </div>
            ) : !challengeUrl ? (
              <button
                className="btn-primary results-challenge-button"
                onClick={handleChallengeAFriend}
                disabled={creatingChallenge}
              >
                {creatingChallenge ? t('results.challenge_creating') : t('results.challenge_button')}
              </button>
            ) : (
              <div className="results-challenge-link">
                <input
                  className="results-challenge-url"
                  type="text"
                  readOnly
                  value={challengeUrl}
                  onFocus={(event) => event.target.select()}
                />
                <div className="results-share-buttons">
                  <button
                    className="results-share-button whatsapp"
                    onClick={() => {
                      trackEvent('share_clicked', { channel: 'whatsapp', object_type: 'challenge' });
                      const message = `${t('results.challenge_share_text')}\n\n${challengeUrl}`;
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`);
                    }}
                  >
                    WhatsApp
                  </button>
                  <button
                    className="results-share-button card-download"
                    onClick={() => {
                      trackEvent('share_clicked', { channel: 'copy_link', object_type: 'challenge' });
                      navigator.clipboard.writeText(challengeUrl);
                      alert(t('results.challenge_link_copied'));
                    }}
                  >
                    {t('results.copy_link')}
                  </button>
                </div>
              </div>
            )}
            {challengeError && <p role="alert" className="results-challenge-error">{challengeError}</p>}
          </div>
        )}
    </div>
  );
};

export default ResultsScreen;
