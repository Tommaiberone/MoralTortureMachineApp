// screens/ResultsScreen.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import './ResultsScreen.css';

const ResultsScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
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

  useEffect(() => {
    // Block browser back button
    const preventBackNavigation = (e) => {
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
  }, [answers, dilemmasWithChoices, i18n.language]);

  return (
    <div className="results-scroll-container">
        <button
          className="results-go-back-button"
          onClick={() => navigate('/')}
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

        <div className="results-share-container">
          <h2 className="results-share-title">{t('results.share_title')}</h2>
          <div className="results-share-buttons">
            <button
              className="results-share-button whatsapp"
              onClick={() => {
                const shareText = t('results.share_text');
                const shareChallenge = t('results.share_challenge');
                const url = window.location.origin;
                const message = `${shareText}\n\n${aiAnalysis}\n\n${shareChallenge} ${url}`;
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`);
              }}
            >
              WhatsApp
            </button>
            <button
              className="results-share-button facebook"
              onClick={() => {
                const shareText = t('results.share_text');
                const shareChallenge = t('results.share_challenge');
                const url = window.location.origin;
                const message = `${shareText}\n\n${aiAnalysis}\n\n${shareChallenge} ${url}`;
                navigator.clipboard.writeText(message);
                alert(t('results.facebook_share_alert'));
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
              }}
            >
              Facebook
            </button>
          </div>
        </div>
    </div>
  );
};

export default ResultsScreen;
