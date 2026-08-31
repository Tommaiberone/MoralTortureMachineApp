// screens/EvaluationDilemmasScreen.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import { getApiHeaders } from '../utils/session';
import { getSeenDilemmas, markDilemmaAsSeen } from '../utils/seenDilemmas';
import SEO from '../components/SEO';
import { trackEvent } from '../utils/analytics';
import "./EvaluationDilemmasScreen.css";

// TASK-203: fixed length for every user, superseding TASK-23's 3/5/7
// length experiment (see ADR-090/decision-1 for why the experiment was
// retired instead of measured to completion).
const MAX_DILEMMAS = 5;

// TASK-124: Recharts' default pie label text has no explicit fill, which
// reads poorly against this theme's dark background. Rendering the <text>
// ourselves guarantees a readable color regardless of what's behind it.
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

const EvaluationDilemmasScreen = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [dilemma, setDilemma] = useState(null);

  const [choiceMade, setChoiceMade] = useState(false);
  const [selectedTease, setSelectedTease] = useState("");
  const [currentDilemmaCount, setCurrentDilemmaCount] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [dilemmasWithChoices, setDilemmasWithChoices] = useState([]);
  const [currentChoice, setChoiceCounts] = useState({ first: 0, second: 0 });
  const [voting, setVoting] = useState(false);
  const [evaluationComplete, setEvaluationComplete] = useState(false);
  const testStarted = useRef(false);
  const prefetchInFlight = useRef(false);
  // Prefetched next dilemma. A ref (not state) is enough: nothing renders
  // from it directly, fetchDilemma only reads it synchronously on click.
  const nextDilemmaRef = useRef(null);

  // TASK-22: no separate click is needed to get the first dilemma.
  useEffect(() => {
    fetchDilemma();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentDilemmaCount >= MAX_DILEMMAS) {
      setEvaluationComplete(true);
    }
  }, [currentDilemmaCount]);

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

  const API_URL = import.meta.env.VITE_API_URL;
  const backendUrl = `${API_URL}/get-dilemma`;
  const voteUrl = `${API_URL}/vote`;

  const fetchDilemmaData = async () => {
    let response;
    let retries = 5;
    const currentLanguage = i18n.language;

    // Get list of already seen dilemmas for this language
    const seenDilemmas = getSeenDilemmas(currentLanguage);
    const excludeParam = seenDilemmas.length > 0 ? `&exclude=${seenDilemmas.join(',')}` : '';

    while (retries > 0) {
      try {
        response = await fetch(`${backendUrl}?language=${currentLanguage}${excludeParam}`, {
          method: "GET",
          headers: getApiHeaders(),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Mark this dilemma as seen
        markDilemmaAsSeen(result._id, currentLanguage);

        return result;
      } catch (error) {
        console.error("Error during fetch or parsing:", error);
        retries -= 1;

        if (retries === 0) {
          throw new Error("Max retries reached. Failed to fetch valid data.");
        }
      }
    }
  };

  const fetchDilemma = async () => {
    if (!testStarted.current) {
      testStarted.current = true;
      trackEvent('test_started', {
        mode: 'evaluation',
        planned_dilemmas: MAX_DILEMMAS,
      });
    }

    // Don't clear dilemma immediately - keep it visible during loading
    setChoiceMade(false);
    setSelectedTease("");
    setChoiceCounts({ first: 0, second: 0 });

    // TASK-22: the next dilemma was already prefetched in the background
    // while the previous reveal was on screen, so this is instant.
    if (nextDilemmaRef.current) {
      setDilemma(nextDilemmaRef.current);
      nextDilemmaRef.current = null;
      return;
    }

    setLoading(true);
    try {
      const fetchedDilemma = await fetchDilemmaData();
      setDilemma(fetchedDilemma);
    } catch (error) {
      console.error("Error during backend call:", error);
      alert(t('evaluation.failed_fetch'));
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = async (choice) => {
    if (!dilemma || voting) return;

    setVoting(true);

    const tease =
      choice === "first" ? dilemma.teaseOption1 : dilemma.teaseOption2;

    setSelectedTease(tease);

    const voteType = choice === "first" ? "yes" : "no";

    const votePayload = {
      _id: dilemma._id,
      vote: voteType,
    };

    try {
      const response = await fetch(voteUrl, {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify(votePayload),
      });

      if (!response.ok) {
        throw new Error(`Vote failed with status: ${response.status}`);
      }

      await response.json();

      setDilemma((prevDilemma) => ({
        ...prevDilemma,
        yesCount:
          voteType === "yes" ? prevDilemma.yesCount + 1 : prevDilemma.yesCount,
        noCount:
          voteType === "no" ? prevDilemma.noCount + 1 : prevDilemma.noCount,
      }));
    } catch (error) {
      console.error("Error during voting:", error);
      alert(t('evaluation.failed_vote'));
      setVoting(false);
      return;
    }

    setChoiceCounts((prevCounts) => ({
      ...prevCounts,
      [choice]: prevCounts[choice] + 1,
    }));

    const answerValues =
      choice === "first"
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

    setSelectedAnswers([...selectedAnswers, answerValues]);

    // Store the complete dilemma with the user's choice
    const dilemmaWithChoice = {
      dilemma: dilemma.dilemma,
      firstAnswer: dilemma.firstAnswer,
      secondAnswer: dilemma.secondAnswer,
      chosenAnswer: choice === "first" ? dilemma.firstAnswer : dilemma.secondAnswer,
      chosenValues: answerValues,
      // baseId is language-neutral (shared across en/it) so a Moral Duel
      // invitee can be served the exact same dilemma in their own language.
      dilemmaBaseId: dilemma.baseId || dilemma._id,
    };
    setDilemmasWithChoices([...dilemmasWithChoices, dilemmaWithChoice]);

    const nextDilemmaCount = currentDilemmaCount + 1;
    trackEvent('answer_selected', {
      mode: 'evaluation',
      dilemma_id: dilemma._id,
      choice,
      question_number: nextDilemmaCount,
    });
    if (nextDilemmaCount >= MAX_DILEMMAS) {
      trackEvent('test_completed', {
        mode: 'evaluation',
        completed_dilemmas: nextDilemmaCount,
      });
    }

    setCurrentDilemmaCount(nextDilemmaCount);
    setChoiceMade(true);
    setVoting(false);

    // TASK-22: prefetch the next dilemma in the background while the
    // reveal/tease for this one is on screen, so advancing feels instant.
    if (nextDilemmaCount < MAX_DILEMMAS && !prefetchInFlight.current) {
      prefetchInFlight.current = true;
      fetchDilemmaData()
        .then((prefetched) => { nextDilemmaRef.current = prefetched; })
        .catch(() => {
          // Best-effort: the next-dilemma click still fetches on demand.
        })
        .finally(() => {
          prefetchInFlight.current = false;
        });
    }
  };

  const handleSpreadTheGuilt = async () => {
    trackEvent('dilemma_audience_share_clicked', {
      mode: 'evaluation',
      dilemma_id: dilemma._id,
      question_number: currentDilemmaCount,
    });

    const shareText = t('evaluation.audience_share_text');
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText, url: window.location.origin });
        return;
      }
    } catch (error) {
      // AbortError means the user dismissed the share sheet - not a failure,
      // don't fall back to also copying in that case.
      if (error?.name === 'AbortError') return;
      console.warn('Native share failed, falling back to clipboard:', error);
    }

    try {
      await navigator.clipboard.writeText(`${shareText} ${window.location.origin}`);
      alert(t('evaluation.audience_share_copied'));
    } catch (error) {
      console.warn('Clipboard copy failed:', error);
    }
  };

  const pieChartData = [
    {
      name: dilemma ? dilemma.firstAnswer : "Option 1",
      value: (dilemma ? dilemma.yesCount : 0) + currentChoice.first,
      color: "var(--choice-a)",
    },
    {
      name: dilemma ? dilemma.secondAnswer : "Option 2",
      value: (dilemma ? dilemma.noCount : 0) + currentChoice.second,
      color: "var(--choice-b)",
    },
  ];

  return (
    <div className="evaluation-scroll-container">
      <SEO
        title="Moral Evaluation - Discover Your Ethical Framework"
        description="Take a moral evaluation through 5 carefully selected ethical dilemmas. Receive AI-powered analysis of your moral compass and philosophical framework based on your decisions."
        keywords="moral evaluation, ethical assessment, moral compass test, philosophy test, trolley problem, moral framework analysis, AI ethics analysis, personality test, moral reasoning test"
        url="/evaluation-dilemmas"
      />
      <button
        className="nav-back-button evaluation-go-back-button"
        onClick={() => navigate('/')}
      >
        <span className="arrow">←</span>
        <span>{t('evaluation.back_button')}</span>
      </button>

      <div className="evaluation-header">
        <h1 className="screen-title evaluation-title">
          {t('evaluation.title')}
        </h1>
        <p className="screen-subtitle evaluation-subtitle">
          {currentDilemmaCount} / {MAX_DILEMMAS}
        </p>
      </div>

      <div className={`card-default evaluation-card ${loading && dilemma ? 'loading' : ''}`}>
        {!dilemma ? (
          <div className="evaluation-button-container">
            <button
              onClick={fetchDilemma}
              disabled={loading}
              className="btn-primary evaluation-button"
            >
              {loading ? t('evaluation.loading') : t('evaluation.get_dilemma')}
            </button>
            {loading && <div className="spinner"></div>}
          </div>
        ) : (
          <div>
            <p className="text-box-default evaluation-generated-text">
              {dilemma.dilemma}
            </p>
            {!choiceMade ? (
              <div className="evaluation-response-buttons">
                <button
                  className="btn-yes evaluation-yes-button"
                  onClick={() => handleChoice("first")}
                  disabled={voting}
                >
                  {dilemma.firstAnswer}
                </button>
                <button
                  className="btn-no evaluation-no-button"
                  onClick={() => handleChoice("second")}
                  disabled={voting}
                >
                  {dilemma.secondAnswer}
                </button>
                {voting && <div className="spinner" style={{ marginTop: "10px" }}></div>}
              </div>
            ) : (
              <div>
                <p className="tease-text">
                  {selectedTease}
                </p>
                <div className="evaluation-chart-container">
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
                <button
                  type="button"
                  className="btn-secondary evaluation-audience-button"
                  onClick={handleSpreadTheGuilt}
                >
                  {t('evaluation.audience_cta_button')}
                </button>
                <p className="evaluation-audience-microcopy">
                  {t('evaluation.audience_cta_microcopy')}
                </p>
                {evaluationComplete ? (
                  <button
                    onClick={() =>
                      navigate("/results", {
                        state: {
                          answers: selectedAnswers,
                          dilemmasWithChoices: dilemmasWithChoices
                        },
                      })
                    }
                    className="btn-primary evaluation-button evaluation-generate-new-button"
                  >
                    {t('evaluation.view_results')}
                  </button>
                ) : (
                  <button
                    onClick={fetchDilemma}
                    disabled={loading}
                    className="btn-primary evaluation-button evaluation-generate-new-button"
                  >
                    {loading ? t('evaluation.loading') : t('evaluation.get_new_dilemma')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationDilemmasScreen;
