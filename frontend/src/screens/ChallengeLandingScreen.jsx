import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import SEO from '../components/SEO';
import { getApiHeaders } from '../utils/session';
import { trackEvent } from '../utils/analytics';
import './ChallengeLandingScreen.css';

const STEP = {
  LOADING: 'loading',
  ERROR: 'error',
  TEASER: 'teaser',
  ANSWERING: 'answering',
  SUBMITTING: 'submitting',
};

const ChallengeLandingScreen = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(STEP.LOADING);
  const [error, setError] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [dilemmas, setDilemmas] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [collectedAnswers, setCollectedAnswers] = useState([]);
  const openTracked = useRef(false);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    let cancelled = false;
    const openChallenge = async () => {
      setStep(STEP.LOADING);
      setError('');
      try {
        const response = await fetch(`${API_URL}/challenges/${token}?language=${i18n.language}`, {
          headers: getApiHeaders(),
        });
        if (response.status === 404) throw new Error('not_found');
        if (response.status === 410) throw new Error('expired');
        if (!response.ok) throw new Error('unknown');
        const data = await response.json();
        if (cancelled) return;

        if (!openTracked.current) {
          openTracked.current = true;
          trackEvent('challenge_landing_viewed', { status: data.status, challenge_token: token });
        }

        if (data.status === 'completed') {
          navigate(`/challenge/${token}/compare`, { replace: true });
          return;
        }
        setChallenge(data);
        setStep(STEP.TEASER);
      } catch (openError) {
        if (cancelled) return;
        setError(openError.message === 'not_found' || openError.message === 'expired' ? openError.message : 'unknown');
        setStep(STEP.ERROR);
      }
    };
    void openChallenge();
    return () => { cancelled = true; };
    // A deep link and a page refresh must both resolve the exact same challenge.
  }, [token, i18n.language, navigate, API_URL]);

  const handleAccept = async () => {
    setStep(STEP.LOADING);
    try {
      const joinResponse = await fetch(`${API_URL}/challenges/${token}/join`, {
        method: 'POST',
        headers: getApiHeaders(),
      });
      if (!joinResponse.ok) throw new Error(`join failed: ${joinResponse.status}`);
      const joinData = await joinResponse.json();
      trackEvent('challenge_joined_client', { challenge_token: token });

      const idsParam = joinData.dilemmaBaseIds.join(',');
      const dilemmasResponse = await fetch(
        `${API_URL}/dilemmas/by-ids?ids=${encodeURIComponent(idsParam)}&language=${joinData.language}`,
        { headers: getApiHeaders() },
      );
      if (!dilemmasResponse.ok) throw new Error(`dilemmas fetch failed: ${dilemmasResponse.status}`);
      const dilemmasData = await dilemmasResponse.json();

      setDilemmas(dilemmasData.dilemmas);
      setCurrentIndex(0);
      setCollectedAnswers([]);
      setStep(STEP.ANSWERING);
    } catch (acceptError) {
      console.error('Error accepting challenge:', acceptError);
      setError('unknown');
      setStep(STEP.ERROR);
    }
  };

  const handleChoice = async (choice) => {
    const dilemma = dilemmas[currentIndex];
    const chosenValues = choice === 'first'
      ? {
          Empathy: dilemma.firstAnswerEmpathy,
          Integrity: dilemma.firstAnswerIntegrity,
          Responsibility: dilemma.firstAnswerResponsibility,
          Justice: dilemma.firstAnswerJustice,
          Altruism: dilemma.firstAnswerAltruism,
          Honesty: dilemma.firstAnswerHonesty,
        }
      : {
          Empathy: dilemma.secondAnswerEmpathy,
          Integrity: dilemma.secondAnswerIntegrity,
          Responsibility: dilemma.secondAnswerResponsibility,
          Justice: dilemma.secondAnswerJustice,
          Altruism: dilemma.secondAnswerAltruism,
          Honesty: dilemma.secondAnswerHonesty,
        };
    const answer = { dilemmaBaseId: dilemma.baseId || dilemma._id, chosenValues };
    const nextAnswers = [...collectedAnswers, answer];

    trackEvent('challenge_answer_selected', { question_number: currentIndex + 1, challenge_token: token });

    if (currentIndex + 1 < dilemmas.length) {
      setCollectedAnswers(nextAnswers);
      setCurrentIndex(currentIndex + 1);
      return;
    }

    setStep(STEP.SUBMITTING);
    try {
      const response = await fetch(`${API_URL}/challenges/${token}/submit`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ answers: nextAnswers }),
      });
      if (!response.ok) throw new Error(`submit failed: ${response.status}`);
      trackEvent('challenge_completed_client', { challenge_token: token });
      navigate(`/challenge/${token}/compare`);
    } catch (submitError) {
      console.error('Error submitting challenge answers:', submitError);
      setError('unknown');
      setStep(STEP.ERROR);
    }
  };

  if (step === STEP.LOADING || step === STEP.SUBMITTING) {
    return (
      <main className="challenge-screen">
        <div className="spinner" />
        <p>{step === STEP.SUBMITTING ? t('challenge.submitting') : t('challenge.loading')}</p>
      </main>
    );
  }

  if (step === STEP.ERROR) {
    return (
      <main className="challenge-screen">
        <h1>{t('challenge.error_title')}</h1>
        <p>{t(`challenge.error_${error}`, t('challenge.error_unknown'))}</p>
        <a href="/">← {t('common.backToHome')}</a>
      </main>
    );
  }

  if (step === STEP.TEASER) {
    return (
      <main className="challenge-screen">
        <SEO title="Moral Duel Challenge" description={t('challenge.seo_description')} url={`/challenge/${token}`} noindex />
        <div className="challenge-teaser-card">
          <p className="challenge-teaser-emoji">{challenge.creatorArchetype.visual?.emoji}</p>
          <h1 className="challenge-teaser-title">{t('challenge.teaser_title', { name: challenge.creatorArchetype.name })}</h1>
          <p className="challenge-teaser-phrase">&ldquo;{challenge.creatorArchetype.sharePhrase}&rdquo;</p>
          <p className="challenge-teaser-intro">{t('challenge.teaser_intro', { count: challenge.dilemmaCount })}</p>
        </div>
        <button type="button" className="btn-primary challenge-accept-button" onClick={handleAccept}>
          {t('challenge.accept_button')}
        </button>
      </main>
    );
  }

  const currentDilemma = dilemmas[currentIndex];
  if (!currentDilemma) return null;

  return (
    <main className="challenge-screen">
      <p className="challenge-progress">{currentIndex + 1} / {dilemmas.length}</p>
      <div className="card-default challenge-dilemma-card">
        <p className="text-box-default challenge-dilemma-text">{currentDilemma.dilemma}</p>
        <div className="evaluation-response-buttons">
          <button className="btn-yes" onClick={() => handleChoice('first')}>{currentDilemma.firstAnswer}</button>
          <button className="btn-no" onClick={() => handleChoice('second')}>{currentDilemma.secondAnswer}</button>
        </div>
      </div>
    </main>
  );
};

export default ChallengeLandingScreen;
