import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import SEO from '../components/SEO';
import { getApiHeaders, getAuthenticatedApiHeaders } from '../utils/session';
import { trackEvent } from '../utils/analytics';
import { shareDuelCard } from '../utils/shareCard';
import useAuth from '../auth/useAuth';
import './ChallengeCompareScreen.css';

const ChallengeCompareScreen = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const auth = useAuth();
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rematchToken, setRematchToken] = useState('');
  const [creatingRematch, setCreatingRematch] = useState(false);
  const [rematchLoginRequired, setRematchLoginRequired] = useState(false);
  const viewTracked = useRef(false);
  const loginPromptTracked = useRef(false);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    let cancelled = false;
    const fetchComparison = async () => {
      setLoading(true);
      setError('');
      try {
        const headers = auth.session?.idToken
          ? getAuthenticatedApiHeaders(auth.session.idToken)
          : getApiHeaders();
        const response = await fetch(`${API_URL}/challenges/${token}/compare?language=${i18n.language}`, {
          headers,
        });
        if (response.status === 409) {
          navigate(`/challenge/${token}`, { replace: true });
          return;
        }
        if (!response.ok) throw new Error(`compare failed: ${response.status}`);
        const data = await response.json();
        if (cancelled) return;
        setComparison(data);
        if (!viewTracked.current) {
          viewTracked.current = true;
          trackEvent('challenge_compare_viewed', { overall_agreement_pct: data.compatibility.overallAgreementPct, challenge_token: token });
        }
        // TASK-14: the login prompt only fires once we know the pair insight
        // is actually still locked, not on every mount/re-fetch.
        if (!data.pairInsightUnlocked && !loginPromptTracked.current) {
          loginPromptTracked.current = true;
          trackEvent('auth_prompt_shown', { surface: 'challenge_compare', challenge_token: token });
        }
      } catch (fetchError) {
        console.error('Error fetching comparison:', fetchError);
        if (!cancelled) setError(t('challengeCompare.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchComparison();
    return () => { cancelled = true; };
  }, [token, i18n.language, navigate, t, API_URL, auth.session?.idToken]);

  const handleRematch = async () => {
    setCreatingRematch(true);
    setRematchLoginRequired(false);
    try {
      const headers = auth.session?.idToken
        ? getAuthenticatedApiHeaders(auth.session.idToken)
        : getApiHeaders();
      const response = await fetch(`${API_URL}/challenges/${token}/rematch`, {
        method: 'POST',
        headers,
      });
      if (response.status === 401) {
        // TASK-136: a rematch is always a repeat Duel interaction, so it
        // always requires an account.
        trackEvent('auth_prompt_shown', { surface: 'challenge_rematch', challenge_token: token });
        setRematchLoginRequired(true);
        return;
      }
      if (!response.ok) throw new Error(`rematch failed: ${response.status}`);
      const data = await response.json();
      trackEvent('challenge_rematch_clicked', { challenge_token: token });
      setRematchToken(data.challengeToken);
    } catch (rematchError) {
      console.error('Error creating rematch:', rematchError);
    } finally {
      setCreatingRematch(false);
    }
  };

  if (loading) {
    return <main className="compare-screen"><div className="spinner" /><p>{t('challengeCompare.loading')}</p></main>;
  }

  if (error || !comparison) {
    return (
      <main className="compare-screen">
        <p>{error || t('challengeCompare.error')}</p>
        <a href="/">← {t('common.backToHome')}</a>
      </main>
    );
  }

  const { creator, invitee, compatibility } = comparison;
  const rematchUrl = rematchToken ? `${window.location.origin}/challenge/${rematchToken}` : '';

  return (
    <main className="compare-screen">
      <SEO title="Moral Duel Comparison" description={t('challengeCompare.seo_description')} url={`/challenge/${token}/compare`} noindex />
      <h1 className="compare-title">{t('challengeCompare.title')}</h1>
      <p className="compare-overall">{t('challengeCompare.overall', { pct: compatibility.overallAgreementPct })}</p>

      <div className="compare-archetypes">
        <div className="compare-archetype-card" style={{ borderColor: creator.archetype.visual?.color }}>
          <p className="compare-archetype-emoji">{creator.archetype.visual?.emoji}</p>
          <p className="compare-archetype-name">{creator.archetype.name}</p>
        </div>
        <div className="compare-vs">{t('challengeCompare.vs')}</div>
        <div className="compare-archetype-card" style={{ borderColor: invitee.archetype.visual?.color }}>
          <p className="compare-archetype-emoji">{invitee.archetype.visual?.emoji}</p>
          <p className="compare-archetype-name">{invitee.archetype.name}</p>
        </div>
      </div>

      <div className="compare-dimensions">
        <p className="compare-dimension-highlight">
          {t('challengeCompare.most_aligned', { dimension: compatibility.mostAlignedDimension })}
        </p>
        <p className="compare-dimension-highlight">
          {t('challengeCompare.most_divergent', { dimension: compatibility.mostDivergentDimension })}
        </p>
        <div className="compare-dimension-list">
          {Object.entries(compatibility.perDimension).map(([dimension, values]) => (
            <div className="compare-dimension-row" key={dimension}>
              <span className="compare-dimension-name">{dimension}</span>
              <span className="compare-dimension-agreement">{values.agreementPct}%</span>
            </div>
          ))}
        </div>
      </div>

      {comparison.pairInsightUnlocked ? (
        <div className="compare-insight">
          <p className="compare-insight-label">{t('challengeCompare.insight_label')}</p>
          <p className="compare-insight-text">{comparison.pairInsight}</p>
        </div>
      ) : (
        <div className="compare-login-cta">
          <p className="compare-login-cta-text">{t('challengeCompare.login_cta_text')}</p>
          <button
            type="button"
            className="compare-login-cta-button"
            onClick={() => {
              trackEvent('auth_prompt_clicked', { surface: 'challenge_compare', challenge_token: token });
              void auth.login(window.location.pathname);
            }}
          >
            {t('challengeCompare.login_cta_button')}
          </button>
        </div>
      )}

      <div className="compare-card-share">
        <button
          type="button"
          className="compare-card-download-button"
          onClick={async () => {
            const method = await shareDuelCard(comparison, t('challengeCompare.share_card_text'));
            trackEvent('share_card_downloaded', { format: 'duel', method });
          }}
        >
          {t('challengeCompare.download_card')}
        </button>
      </div>

      {comparison.isParticipant && (
      <div className="compare-actions">
        {rematchLoginRequired ? (
          <div className="compare-login-cta">
            <p className="compare-login-cta-text">{t('challengeCompare.rematch_login_required_text')}</p>
            <button
              type="button"
              className="compare-login-cta-button"
              onClick={() => {
                trackEvent('auth_prompt_clicked', { surface: 'challenge_rematch', challenge_token: token });
                void auth.login(window.location.pathname);
              }}
            >
              {t('challengeCompare.rematch_login_required_button')}
            </button>
          </div>
        ) : !rematchToken ? (
          <button type="button" className="btn-primary" onClick={handleRematch} disabled={creatingRematch}>
            {creatingRematch ? t('challengeCompare.rematch_creating') : t('challengeCompare.rematch_button')}
          </button>
        ) : (
          <div className="compare-rematch-link">
            <input className="compare-rematch-url" type="text" readOnly value={rematchUrl} onFocus={(e) => e.target.select()} />
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                trackEvent('share_clicked', { channel: 'whatsapp', object_type: 'rematch' });
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(rematchUrl)}`);
              }}
            >
              {t('challengeCompare.share_rematch')}
            </button>
          </div>
        )}
      </div>
      )}

      <a className="compare-home-link" href="/">← {t('common.backToHome')}</a>
    </main>
  );
};

export default ChallengeCompareScreen;
