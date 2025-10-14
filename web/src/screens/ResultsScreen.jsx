// screens/ResultsScreen.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import './ResultsScreen.css';

const ResultsScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { answers } = location.state || { answers: [] };

  if (!answers || answers.length === 0) {
    return (
      <div className="results-gradient-background">
        <div className="results-container">
          <h1 className="results-title">[ NO RESULTS ]</h1>
          <button
            className="results-back-button"
            onClick={() => navigate('/')}
          >
            [ HOME ]
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

  return (
    <div className="results-scroll-container">
        <button
          className="results-go-back-button"
          onClick={() => navigate(-1)}
        >
          <span className="arrow">←</span>
          <span>[ BACK ]</span>
        </button>

        <h1 className="results-title">[ YOUR RESULTS ]</h1>

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
                name="MORAL PROFILE"
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
    </div>
  );
};

export default ResultsScreen;
