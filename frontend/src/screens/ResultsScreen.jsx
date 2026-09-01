// screens/ResultsScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import { getAnonymousUserId, getApiHeaders, getAuthenticatedApiHeaders } from '../utils/session';
import SEO from '../components/SEO';
import { trackEvent } from '../utils/analytics';
import { trackGoogleAnalyticsEvent } from '../utils/googleAnalytics';
import { shareOrDownloadCard } from '../utils/shareCard';
import { getShareCreativeVariant, withShareAttribution } from '../utils/attribution';
import { AUTH_PROMPT_COPY_VARIANTS, getExperimentVariant } from '../utils/experiments';
import useAuth from '../auth/useAuth';
import './ResultsScreen.css';

// TASK-221: which invite CTA copy actually gets a challenge created.
const CHALLENGE_BUTTON_COPY_VARIANTS = ['baseline', 'rival', 'direct'];

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

  // TASK-33: which invite creative this visitor sends is A/B tested,
  // persistently bucketed by their own anonymous identity (see
  // getShareCreativeVariant), and tagged as utm_content on the link so
  // TASK-41's dashboard can show completion rate per variant.
  const shareCreativeVariant = getShareCreativeVariant(getAnonymousUserId());
  const challengeShareText = archetype
    ? t(`results.challenge_share_text_${shareCreativeVariant}`, {
      archetypeName: archetype.name,
      sharePhrase: archetype.sharePhrase,
    })
    : t('results.challenge_share_text');

  // TASK-219: same login-prompt copy experiment as ChallengeLandingScreen/
  // ChallengeCompareScreen, applied here to the results_challenge surface.
  const authPromptVariant = getExperimentVariant('auth_prompt_copy', AUTH_PROMPT_COPY_VARIANTS, getAnonymousUserId());
  // TASK-221: only the "Challenge a friend" button label is tested, not the
  // intro text above it, so the experiment isolates one variable.
  const challengeButtonVariant = getExperimentVariant('challenge_button_copy', CHALLENGE_BUTTON_COPY_VARIANTS, getAnonymousUserId());

  const labels = Object.keys(aggregated);
  const data = labels.map(label => ({
    subject: label,
    value: (aggregated[label] / answers.length).toFixed(2),
  }));

  useEffect(() => {
    if (!hasResults || resultTracked.current) return;
    resultTracked.current = true;
    trackEvent('result_viewed', {
      mode: 'evaluation',
      completed_dilemmas: answers.length,
      // TASK-221: exposure signal for the challenge-button copy experiment -
      // this fires slightly before the archetype (and therefore the button
      // itself) has loaded, so it is a small conservative overcount of
      // "exposed", not an undercount.
      variant: challengeButtonVariant,
    });
    trackGoogleAnalyticsEvent('result_viewed');
  }, [answers, hasResults, challengeButtonVariant]);

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

        const result = await response.json().catch(() => null);

        // The backend always includes the deterministic archetype/averages in
        // the body, even on a non-ok response (TASK-143), so the Challenge CTA
        // and share cards stay available whenever an archetype comes back -
        // regardless of whether the AI text itself succeeded.
        if (result?.archetype) {
          setArchetype(result.archetype);
        }

        if (!response.ok) {
          if (response.status === 429) {
            setAiAnalysis(t('results.rate_limit_error'));
          } else {
            setAiAnalysis(t('results.analysis_error'));
          }
          return;
        }

        setAiAnalysis(result.analysis);
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
        trackEvent('auth_prompt_shown', { surface: 'results_challenge', object_type: 'result', variant: authPromptVariant });
        setChallengeLoginRequired(true);
        return;
      }
      if (!challengeResponse.ok) throw new Error(`challenge creation failed: ${challengeResponse.status}`);
      const challenge = await challengeResponse.json();

      trackEvent('challenge_share_ready', {
        object_type: 'result',
        challenge_token: challenge.challengeToken,
        variant: shareCreativeVariant,
      });
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
                // TASK-105: dimension averages are always within [0, 1]
                // (each raw per-answer score is authored in that range - see
                // backend/data/dilemmas_*.json). A fixed domain instead of
                // 'auto' stops every chart from autoscaling to its own
                // tallest axis, which made every user's radar look equally
                // "full" regardless of their actual scores.
                domain={[0, 1]}
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
              // Even when /analyze-results fails outright, archetype is still set
              // from the response body (TASK-143) and aiAnalysis carries a fallback
              // error message (TASK-121 AC3): the card stays visible either way.
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

        {archetype && (
          <div className="results-challenge-container">
            <h2 className="results-challenge-title">{t('results.challenge_title')}</h2>
            <p className="results-challenge-intro">{t('results.challenge_intro')}</p>
            {challengeLoginRequired ? (
              <div className="results-challenge-login">
                <p className="results-challenge-login-text">{t(`results.challenge_login_required_text_${authPromptVariant}`)}</p>
                <button
                  type="button"
                  className="btn-primary results-challenge-button"
                  onClick={() => {
                    trackEvent('auth_prompt_clicked', { surface: 'results_challenge', object_type: 'result', variant: authPromptVariant });
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
                {creatingChallenge ? t('results.challenge_creating') : t(`results.challenge_button_${challengeButtonVariant}`)}
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
                      trackEvent('share_clicked', { channel: 'whatsapp', object_type: 'challenge', variant: shareCreativeVariant });
                      const taggedUrl = withShareAttribution(challengeUrl, { source: 'whatsapp', campaign: 'duel_challenge', content: shareCreativeVariant });
                      const message = `${challengeShareText}\n\n${taggedUrl}`;
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`);
                    }}
                  >
                    {t('results.whatsapp')}
                  </button>
                  <button
                    className="results-share-button card-download"
                    onClick={() => {
                      trackEvent('share_clicked', { channel: 'copy_link', object_type: 'challenge', variant: shareCreativeVariant });
                      const taggedUrl = withShareAttribution(challengeUrl, { source: 'copy_link', campaign: 'duel_challenge', content: shareCreativeVariant });
                      navigator.clipboard.writeText(taggedUrl);
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

        <div className="results-share-container">
          <h2 className="results-share-title">{t('results.share_title')}</h2>
          {archetype && (
            <button
              type="button"
              className="btn-primary results-share-primary-button"
              onClick={async () => {
                const taggedUrl = withShareAttribution(window.location.origin, { source: 'share_card', campaign: 'result_share' });
                const shareText = `${t('results.share_text')}\n\n${taggedUrl}`;
                const method = await shareOrDownloadCard(archetype, 'stories', shareText, data);
                trackEvent('share_card_downloaded', { format: 'stories', method });
              }}
            >
              {t('results.share_primary_button')}
            </button>
          )}
          <p className="results-share-more-label">{t('results.share_more_ways')}</p>
          <div className="results-share-buttons results-share-buttons--secondary">
            <button
              className="results-share-button whatsapp"
              onClick={() => {
                trackEvent('share_clicked', { channel: 'whatsapp', object_type: 'result' });
                const shareText = t('results.share_text');
                const shareChallenge = t('results.share_challenge');
                const taggedUrl = withShareAttribution(window.location.origin, { source: 'whatsapp', campaign: 'result_share' });
                const message = `${shareText}\n\n${archetypeShareLine}${aiAnalysis}\n\n${shareChallenge} ${taggedUrl}`;
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`);
              }}
            >
              {t('results.whatsapp')}
            </button>
            <button
              className="results-share-button facebook"
              onClick={() => {
                trackEvent('share_clicked', { channel: 'facebook', object_type: 'result' });
                const shareText = t('results.share_text');
                const shareChallenge = t('results.share_challenge');
                const taggedUrl = withShareAttribution(window.location.origin, { source: 'facebook', campaign: 'result_share' });
                const message = `${shareText}\n\n${archetypeShareLine}${aiAnalysis}\n\n${shareChallenge} ${taggedUrl}`;
                navigator.clipboard.writeText(message);
                alert(t('results.facebook_share_alert'));
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(taggedUrl)}`);
              }}
            >
              {t('results.facebook')}
            </button>
            {archetype && (
              <button
                className="results-share-button card-download"
                onClick={async () => {
                  const taggedUrl = withShareAttribution(window.location.origin, { source: 'share_card', campaign: 'result_share' });
                  const shareText = `${t('results.share_text')}\n\n${taggedUrl}`;
                  const method = await shareOrDownloadCard(archetype, 'square', shareText, data);
                  trackEvent('share_card_downloaded', { format: 'square', method });
                }}
              >
                {t('results.download_card_square')}
              </button>
            )}
          </div>
        </div>
    </div>
  );
};

export default ResultsScreen;
