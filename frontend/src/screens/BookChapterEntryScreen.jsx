// screens/BookChapterEntryScreen.jsx
//
// TASK-291: lands here from a printed gamebook QR ("/book/:slug"). Resolves
// the slug via GET /book/chapters/:slug, then either plays through that
// chapter's fixed, ordered dilemma set solo (ending at /results, the same
// contract EvaluationDilemmasScreen already uses) or hands off to the
// existing Party Room create flow (PartyRoomHomeScreen, via ?chapterSlug=)
// for "Convene Tribunal".
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

import SEO from '../components/SEO';
import { getApiHeaders } from '../utils/session';
import { trackEvent } from '../utils/analytics';
import './ChallengeLandingScreen.css';

const STEP = {
  LOADING: 'loading',
  ERROR: 'error',
  ANSWERING: 'answering',
};

// TASK-124/ChallengeLandingScreen: render the pie label ourselves so it's
// always readable against this theme's dark background.
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

const BookChapterEntryScreen = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(STEP.LOADING);
  const [error, setError] = useState('');
  const [chapterKey, setChapterKey] = useState(null);
  const [dilemmas, setDilemmas] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [collectedAnswers, setCollectedAnswers] = useState([]);
  const [dilemmasWithChoices, setDilemmasWithChoices] = useState([]);
  const [voting, setVoting] = useState(false);
  const [choiceMade, setChoiceMade] = useState(false);
  const [selectedTease, setSelectedTease] = useState('');
  const [choiceCounts, setChoiceCounts] = useState({ first: 0, second: 0 });
  const openTracked = useRef(false);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    let cancelled = false;
    const openChapter = async () => {
      setStep(STEP.LOADING);
      setError('');
      try {
        const response = await fetch(`${API_URL}/book/chapters/${slug}`, {
          headers: getApiHeaders(),
        });
        if (response.status === 404) throw new Error('not_found');
        if (!response.ok) throw new Error('unknown');
        const data = await response.json();
        if (cancelled) return;

        if (!openTracked.current) {
          openTracked.current = true;
          trackEvent('book_chapter_landing_viewed', { chapter_key: data.chapterKey, mode: data.mode });
        }

        if (data.mode === 'party') {
          // "Convene Tribunal": reuse the existing Party Room create flow
          // rather than duplicating its name-entry form here.
          navigate(`/party?chapterSlug=${encodeURIComponent(slug)}`, { replace: true });
          return;
        }

        const idsParam = data.dilemmaBaseIds.join(',');
        const dilemmasResponse = await fetch(
          `${API_URL}/dilemmas/by-ids?ids=${encodeURIComponent(idsParam)}&language=${i18n.language}`,
          { headers: getApiHeaders() },
        );
        if (!dilemmasResponse.ok) throw new Error('unknown');
        const dilemmasData = await dilemmasResponse.json();
        if (cancelled) return;

        setChapterKey(data.chapterKey);
        setDilemmas(dilemmasData.dilemmas);
        setCurrentIndex(0);
        setCollectedAnswers([]);
        setDilemmasWithChoices([]);
        setStep(STEP.ANSWERING);
      } catch (openError) {
        if (cancelled) return;
        setError(openError.message === 'not_found' ? 'not_found' : 'unknown');
        setStep(STEP.ERROR);
      }
    };
    void openChapter();
    return () => { cancelled = true; };
  }, [slug, i18n.language, navigate, API_URL]);

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
    setCollectedAnswers([...collectedAnswers, chosenValues]);
    setDilemmasWithChoices([...dilemmasWithChoices, {
      dilemma: dilemma.dilemma,
      firstAnswer: dilemma.firstAnswer,
      secondAnswer: dilemma.secondAnswer,
      chosenAnswer: choice === 'first' ? dilemma.firstAnswer : dilemma.secondAnswer,
      chosenValues,
      dilemmaBaseId: dilemma.baseId || dilemma._id,
    }]);

    trackEvent('book_chapter_answer_selected', {
      chapter_key: chapterKey,
      question_number: currentIndex + 1,
    });

    setChoiceMade(true);
    setVoting(false);
  };

  const handleNext = () => {
    if (currentIndex + 1 < dilemmas.length) {
      setCurrentIndex(currentIndex + 1);
      setChoiceMade(false);
      setSelectedTease('');
      setChoiceCounts({ first: 0, second: 0 });
      return;
    }

    trackEvent('book_chapter_solo_completed', {
      chapter_key: chapterKey,
      completed_dilemmas: dilemmasWithChoices.length,
    });
    navigate('/results', { state: { answers: collectedAnswers, dilemmasWithChoices, chapterKey } });
  };

  if (step === STEP.LOADING) {
    return (
      <main className="challenge-screen">
        <div className="spinner" />
        <p>{t('book.loading')}</p>
      </main>
    );
  }

  if (step === STEP.ERROR) {
    return (
      <main className="challenge-screen">
        <h1>{t('book.error_title')}</h1>
        <p>{t(`book.error_${error}`, t('book.error_unknown'))}</p>
        <a href="/">← {t('common.backToHome')}</a>
      </main>
    );
  }

  const currentDilemma = dilemmas[currentIndex];
  if (!currentDilemma) return null;

  const pieChartData = [
    { name: currentDilemma.firstAnswer, value: (currentDilemma.yesCount || 0) + choiceCounts.first, color: '#7a4a4a' },
    { name: currentDilemma.secondAnswer, value: (currentDilemma.noCount || 0) + choiceCounts.second, color: '#2a3a2a' },
  ];
  const isLastDilemma = currentIndex + 1 >= dilemmas.length;

  return (
    <main className="challenge-screen">
      <SEO title="Moral Torture Machine — The Gamebook" noindex />
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
            <p className="tease-text">{selectedTease}</p>
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
              {isLastDilemma ? t('book.view_results_button') : t('challenge.next_dilemma_button')}
            </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default BookChapterEntryScreen;
