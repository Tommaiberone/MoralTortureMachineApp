import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

import SEO from '../components/SEO';
import { getApiHeaders, getAuthenticatedApiHeaders } from '../utils/session';
import { trackEvent } from '../utils/analytics';
import useAuth from '../auth/useAuth';
import './ChallengeLandingScreen.css';

const STEP = {
  LOADING: 'loading',
  ERROR: 'error',
  LOGIN_REQUIRED: 'login_required',
  TEASER: 'teaser',
  ANSWERING: 'answering',
  SUBMITTING: 'submitting',
};

// TASK-124: same fix as EvaluationDilemmasScreen - render the pie label text
// ourselves so it's always readable, instead of Recharts' unstyled default.
const RADIAN = Math.PI / 180;
const renderPieLabel = ({ cx, cy, midAngle, outerRadius, percent }) => {
  const radius = outerRadius + 18;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="var(--text-highlight)"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={14}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const ChallengeLandingScreen = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const auth = useAuth();
  const [step, setStep] = useState(STEP.LOADING);
  const [error, setError] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [dilemmas, setDilemmas] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [collectedAnswers, setCollectedAnswers] = useState([]);
  const [voting, setVoting] = useState(false);
  const [choiceMade, setChoiceMade] = useState(false);
  const [selectedTease, setSelectedTease] = useState('');
  const [choiceCounts, setChoiceCounts] = useState({ first: 0, second: 0 });
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
      const headers = auth.session?.idToken
        ? getAuthenticatedApiHeaders(auth.session.idToken)
        : getApiHeaders();
      const joinResponse = await fetch(`${API_URL}/challenges/${token}/join`, {
        method: 'POST',
        headers,
      });
      if (joinResponse.status === 401) throw new Error('login_required');
      if (joinResponse.status === 400) throw new Error('own_challenge');
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
      if (acceptError.message === 'login_required') {
        trackEvent('auth_prompt_shown', { surface: 'challenge_join', challenge_token: token });
        setStep(STEP.LOGIN_REQUIRED);
        return;
      }
      console.error('Error accepting challenge:', acceptError);
      setError(acceptError.message === 'own_challenge' ? 'own_challenge' : 'unknown');
      setStep(STEP.ERROR);
    }
  };

  const handleChoice = async (choice) => {
    const dilemma = dilemmas[currentIndex];
    if (!dilemma || voting) return;

    setVoting(true);
    setSelectedTease(choice === 'first' ? dilemma.teaseOption1 : dilemma.teaseOption2);

    try {
      const response = await fetch(`${API_URL}/vote`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ _id: dilemma._id, vote: choice === 'first' ? 'yes' : 'no' }),
      });
      if (!response.ok) throw new Error(`vote failed: ${response.status}`);
    } catch (voteError) {
      console.error('Error during voting:', voteError);
      alert(t('evaluation.failed_vote'));
      setVoting(false);
      return;
    }

    setChoiceCounts((prevCounts) => ({ ...prevCounts, [choice]: prevCounts[choice] + 1 }));

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
    setCollectedAnswers([...collectedAnswers, answer]);

    trackEvent('challenge_answer_selected', { question_number: currentIndex + 1, challenge_token: token });

    setChoiceMade(true);
    setVoting(false);
  };

  const handleNext = async () => {
    if (currentIndex + 1 < dilemmas.length) {
      setCurrentIndex(currentIndex + 1);
      setChoiceMade(false);
      setSelectedTease('');
      setChoiceCounts({ first: 0, second: 0 });
      return;
    }

    setStep(STEP.SUBMITTING);
    try {
      const response = await fetch(`${API_URL}/challenges/${token}/submit`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ answers: collectedAnswers }),
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

  if (step === STEP.LOGIN_REQUIRED) {
    return (
      <main className="challenge-screen">
        <h1>{t('challenge.login_required_title')}</h1>
        <p>{t('challenge.login_required_text')}</p>
        <button
          type="button"
          className="btn-primary challenge-accept-button"
          onClick={() => {
            trackEvent('auth_prompt_clicked', { surface: 'challenge_join', challenge_token: token });
            void auth.login(window.location.pathname);
          }}
        >
          {t('challenge.login_required_button')}
        </button>
        <a href="/">← {t('common.backToHome')}</a>
      </main>
    );
  }

  if (step === STEP.TEASER) {
    const shareUrl = `${window.location.origin}/challenge/${token}`;
    return (
      <main className="challenge-screen">
        <SEO title="Moral Duel Challenge" description={t('challenge.seo_description')} url={`/challenge/${token}`} noindex />
        <div className="challenge-teaser-card">
          <p className="challenge-teaser-emoji">{challenge.creatorArchetype.visual?.emoji}</p>
          <h1 className="challenge-teaser-title">{t('challenge.teaser_title', { name: challenge.creatorArchetype.name })}</h1>
          <p className="challenge-teaser-phrase">&ldquo;{challenge.creatorArchetype.sharePhrase}&rdquo;</p>
          <p className="challenge-teaser-intro">{t('challenge.teaser_intro', { count: challenge.dilemmaCount })}</p>
        </div>
        {challenge.isOwnChallenge ? (
          <div className="challenge-own-notice">
            <p className="challenge-own-notice-text">{t('challenge.own_challenge_notice')}</p>
            <div className="challenge-share-link">
              <input
                className="challenge-share-url"
                type="text"
                readOnly
                value={shareUrl}
                onFocus={(event) => event.target.select()}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  trackEvent('share_clicked', { channel: 'whatsapp', object_type: 'challenge' });
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareUrl)}`);
                }}
              >
                WhatsApp
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  trackEvent('share_clicked', { channel: 'copy_link', object_type: 'challenge' });
                  navigator.clipboard.writeText(shareUrl);
                  alert(t('challenge.link_copied'));
                }}
              >
                {t('challenge.copy_link')}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn-primary challenge-accept-button" onClick={handleAccept}>
            {t('challenge.accept_button')}
          </button>
        )}
      </main>
    );
  }

  const currentDilemma = dilemmas[currentIndex];
  if (!currentDilemma) return null;

  // TASK-110: /dilemmas/by-ids returns the raw stored item with no
  // setdefault (unlike /get-dilemma), so yesCount/noCount can be absent on
  // older dilemma documents.
  const pieChartData = [
    { name: currentDilemma.firstAnswer, value: (currentDilemma.yesCount || 0) + choiceCounts.first, color: '#7a4a4a' },
    { name: currentDilemma.secondAnswer, value: (currentDilemma.noCount || 0) + choiceCounts.second, color: '#2a3a2a' },
  ];
  const isLastDilemma = currentIndex + 1 >= dilemmas.length;

  return (
    <main className="challenge-screen">
      <p className="challenge-progress">{currentIndex + 1} / {dilemmas.length}</p>
      <div className="card-default challenge-dilemma-card">
        <p className="text-box-default challenge-dilemma-text">{currentDilemma.dilemma}</p>
        {!choiceMade ? (
          <div className="evaluation-response-buttons">
            <button className="btn-yes" onClick={() => handleChoice('first')} disabled={voting}>{currentDilemma.firstAnswer}</button>
            <button className="btn-no" onClick={() => handleChoice('second')} disabled={voting}>{currentDilemma.secondAnswer}</button>
            {voting && <div className="spinner" style={{ marginTop: '10px' }}></div>}
          </div>
        ) : (
          <div>
            <p className="challenge-tease-text">{selectedTease}</p>
            <div className="challenge-chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderPieLabel}
                    outerRadius={window.innerWidth < 480 ? 60 : 80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: window.innerWidth < 480 ? '12px' : '14px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <button type="button" className="btn-primary challenge-next-button" onClick={handleNext}>
              {isLastDilemma ? t('challenge.view_comparison_button') : t('challenge.next_dilemma_button')}
            </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default ChallengeLandingScreen;
