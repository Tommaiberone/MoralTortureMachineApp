import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import "./PassThePhoneScreen.css";

const PassThePhoneScreen = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [dilemma, setDilemma] = useState(null);
  const [choiceMade, setChoiceMade] = useState(false);
  const [selectedTease, setSelectedTease] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;
  const backendUrl = `${API_URL}/get-dilemma`;

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

  const handleChoice = (choice) => {
    if (!dilemma) return;

    const tease = choice === "first" ? dilemma.teaseOption1 : dilemma.teaseOption2;
    setSelectedTease(tease);
    setChoiceMade(true);
  };

  return (
    <div className="passthephone-scroll-container">
        <button
          className="passthephone-go-back-button"
          onClick={() => navigate(-1)}
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
                  >
                    {dilemma.firstAnswer}
                  </button>
                  <button
                    className="passthephone-no-button"
                    onClick={() => handleChoice("second")}
                  >
                    {dilemma.secondAnswer}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="passthephone-tease-text">
                    {selectedTease}
                  </p>
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
