// screens/ResultsScreen.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import './ResultsScreen.css';

const ResultsScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { answers, dilemmasWithChoices } = location.state || { answers: [], dilemmasWithChoices: [] };
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  if (!answers || answers.length === 0) {
    return (
      <div className="results-gradient-background">
        <div className="results-container">
          <h1 className="results-title">{t('results.no_results')}</h1>
          <button
            className="results-back-button"
            onClick={() => navigate('/')}
          >
            {t('results.home_button')}
          </button>
        </div>
      </div>
    );
  }

  // Aggregate the answers to compute average values for each category
  const aggregated = answers.reduce((acc, curr) => {
    for (let key in curr) {
      acc[key] = (acc[key] || 0) + curr[key];
    }
    return acc;
  }, {});

  const labels = Object.keys(aggregated);
  const data = labels.map(label => ({
    subject: label,
    value: (aggregated[label] / answers.length).toFixed(2),
    fullMark: Math.max(...Object.values(aggregated).map(v => v / answers.length)) * 1.2,
  }));

  // Fetch AI analysis when component mounts
  useEffect(() => {
    const fetchAiAnalysis = async () => {
      if (!answers || answers.length === 0) return;

      setLoadingAnalysis(true);
      try {
        const backendUrl = "https://wxe53u88o8.execute-api.eu-west-1.amazonaws.com/analyze-results";
        const response = await fetch(backendUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers,
            dilemmasWithChoices: dilemmasWithChoices || []
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setAiAnalysis(result.analysis);
      } catch (error) {
        console.error("Error fetching AI analysis:", error);
        setAiAnalysis(t('results.analysis_error'));
      } finally {
        setLoadingAnalysis(false);
      }
    };

    fetchAiAnalysis();
  }, [answers, dilemmasWithChoices]);

  return (
    <div className="results-scroll-container">
        <button
          className="results-go-back-button"
          onClick={() => navigate(-1)}
        >
          <span className="arrow">←</span>
          <span>{t('results.back_button')}</span>
        </button>

        <h1 className="results-title">{t('results.title')}</h1>

        <div className="results-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis
                dataKey="subject"
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 'auto']}
              />
              <Radar
                name={t('results.moral_profile')}
                dataKey="value"
                stroke="var(--horror-crimson)"
                fill="var(--horror-blood-red)"
                fillOpacity={0.8}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="results-summary">
          {labels.map((label, index) => (
            <div key={index} className="results-summary-item">
              <span className="results-summary-label">{label}:</span>
              <span className="results-summary-value">
                {(aggregated[label] / answers.length).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="results-ai-analysis">
          <h2 className="results-ai-title">{t('results.verdict')}</h2>
          {loadingAnalysis ? (
            <div className="results-ai-loading">
              <div className="spinner"></div>
              <p className="results-ai-loading-text">{t('results.analyzing')}</p>
            </div>
          ) : (
            <p className="results-ai-text">{aiAnalysis}</p>
          )}
        </div>
    </div>
  );
};

export default ResultsScreen;
