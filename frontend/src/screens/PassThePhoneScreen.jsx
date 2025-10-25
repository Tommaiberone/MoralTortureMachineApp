import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import "./PassThePhoneScreen.css";

const PassThePhoneScreen = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [dilemma, setDilemma] = useState(null);
  const [choiceMade, setChoiceMade] = useState(false);
  const [selectedTease, setSelectedTease] = useState("");
  const [currentChoice, setChoiceCounts] = useState({ first: 0, second: 0 });
  const [voting, setVoting] = useState(false);

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

  const API_URL = import.meta.env.VITE_API_URL;
  const backendUrl = `${API_URL}/get-dilemma`;
  const voteUrl = `${API_URL}/vote`;

  const fetchDilemmaData = async () => {
    let response;
    let retries = 5;
    const currentLanguage = i18n.language;
    while (retries > 0) {
      try {
        response = await fetch(`${backendUrl}?language=${currentLanguage}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
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
    setLoading(true);
    setDilemma(null);
    setSelectedTease("");
    setChoiceMade(false);
    setChoiceCounts({ first: 0, second: 0 });

    try {
      const fetchedDilemma = await fetchDilemmaData();
      setDilemma(fetchedDilemma);
    } catch (error) {
      console.error("Error during backend call:", error);
      setDilemma({
        dilemma: t('passThePhone.malfunction'),
        firstAnswer: "OK",
        secondAnswer: "OK"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = async (choice) => {
    if (!dilemma || voting) return;

    setVoting(true);

    const tease = choice === "first" ? dilemma.teaseOption1 : dilemma.teaseOption2;
    setSelectedTease(tease);

    const voteType = choice === "first" ? "yes" : "no";

    const votePayload = {
      _id: dilemma._id,
      vote: voteType,
    };

    try {
      const response = await fetch(voteUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      // Continue even if voting fails - don't block the user experience
    }

    setChoiceCounts((prevCounts) => ({
      ...prevCounts,
      [choice]: prevCounts[choice] + 1,
    }));

    setChoiceMade(true);
    setVoting(false);
  };

  const pieChartData = [
    {
      name: dilemma ? dilemma.firstAnswer : "Option 1",
      value: (dilemma ? dilemma.yesCount : 0) + currentChoice.first,
      color: "#7a4a4a",
    },
    {
      name: dilemma ? dilemma.secondAnswer : "Option 2",
      value: (dilemma ? dilemma.noCount : 0) + currentChoice.second,
      color: "#2a3a2a",
    },
  ];

  return (
    <div className="passthephone-scroll-container">
        <button
          className="passthephone-go-back-button"
          onClick={() => navigate('/')}
        >
          <span className="arrow">[&lt;]</span>
          <span>{t('passThePhone.escape_button')}</span>
        </button>

        <div className="passthephone-header">
          <h1 className="passthephone-title">
            {t('passThePhone.title')}
          </h1>
          <p className="passthephone-subtitle">
            {t('passThePhone.subtitle')}
          </p>
        </div>

        <div className="passthephone-card">
          {!dilemma ? (
            <div className="passthephone-button-container">
              <button
                onClick={fetchDilemma}
                disabled={loading}
                className="passthephone-button"
              >
                {loading ? t('passThePhone.loading') : t('passThePhone.get_dilemma')}
              </button>
              {loading && (
                <>
                  <div className="spinner"></div>
                </>
              )}
            </div>
          ) : (
            <div>
              <p className="passthephone-generated-text-label">
                {t('passThePhone.your_moral_nightmare')}
              </p>
              <p className="passthephone-generated-text">
                {dilemma.dilemma}
              </p>

              {!choiceMade ? (
                <div className="passthephone-response-buttons">
                  <button
                    className="passthephone-yes-button"
                    onClick={() => handleChoice("first")}
                    disabled={voting}
                  >
                    {dilemma.firstAnswer}
                  </button>
                  <button
                    className="passthephone-no-button"
                    onClick={() => handleChoice("second")}
                    disabled={voting}
                  >
                    {dilemma.secondAnswer}
                  </button>
                  {voting && <div className="spinner" style={{ marginTop: "10px" }}></div>}
                </div>
              ) : (
                <div>
                  <p className="passthephone-tease-text">
                    {selectedTease}
                  </p>
                  <div className="passthephone-chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ percent }) =>
                            `${(percent * 100).toFixed(0)}%`
                          }
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
                    onClick={fetchDilemma}
                    disabled={loading}
                    className="passthephone-button passthephone-generate-new-button"
                  >
                    {loading ? t('passThePhone.loading') : t('passThePhone.get_next')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
    </div>
  );
};

export default PassThePhoneScreen;
