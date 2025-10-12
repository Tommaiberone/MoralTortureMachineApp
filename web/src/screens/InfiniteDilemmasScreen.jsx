// screens/InfiniteDilemmasScreen.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./InfiniteDilemmasScreen.css";

const InfiniteDilemmasScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dilemmaGenerated, setDilemmaGenerated] = useState(false);
  const [answers, setAnswers] = useState({
    firstAnswer: "Yes",
    secondAnswer: "No",
  });
  const [teases, setTeases] = useState({
    teaseOption1: "",
    teaseOption2: "",
  });
  const [selectedTease, setSelectedTease] = useState("");
  const [choiceMade, setChoiceMade] = useState(false);

  const backendUrl = "https://wxe53u88o8.execute-api.eu-west-1.amazonaws.com/generate-dilemma";

  const fetchDilemmaData = async () => {
    let response;
    let retries = 5;
    while (retries > 0) {
      try {
        response = await fetch(backendUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const content = JSON.parse(result.choices[0].message.content);
        return content;
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
    setDilemmaGenerated(false);
    setGeneratedText("");
    setSelectedTease("");
    setChoiceMade(false);

    try {
      const content = await fetchDilemmaData();
      setGeneratedText(content.dilemma.trim());
      setAnswers({
        firstAnswer: content.firstAnswer,
        secondAnswer: content.secondAnswer,
      });
      setTeases({
        teaseOption1: content.teaseOption1,
        teaseOption2: content.teaseOption2,
      });
      setDilemmaGenerated(true);
    } catch (error) {
      console.error("Error during backend call:", error);
      setGeneratedText("Failed to fetch the generated text. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = (choice) => {
    setSelectedTease(
      choice === "first" ? teases.teaseOption1 : teases.teaseOption2
    );
    setChoiceMade(true);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const colors = {
    background: isDarkMode ? "#1E1E2E" : "#F0F4FF",
    gradientBackground: isDarkMode
      ? "linear-gradient(135deg, #2C2C3E, #1E1E2E)"
      : "linear-gradient(135deg, #6C71FF, #A29BFF)",
    title: isDarkMode ? "#E0E0E0" : "#333333",
    buttonBackground: isDarkMode ? "#3A3A5A" : "#6C71FF",
    generateNewButtonBackground: isDarkMode ? "#3A3A5A" : "#FFB86C",
    buttonText: "#FFFFFF",
    generatedTextLabel: isDarkMode ? "#E0E0E0" : "#333333",
    generatedTextBackground: isDarkMode ? "#2C2C3E" : "#FFFFFF",
    generatedTextColor: isDarkMode ? "#CCCCCC" : "#333333",
    teaseTextBackground: isDarkMode ? "#6C71FF" : "#A29BFF",
    teaseTextColor: isDarkMode ? "#FFFFFF" : "#1E1E2E",
    yesButtonBackground: "#6C71FF",
    noButtonBackground: "#FFB86C",
    toggleText: isDarkMode ? "#E0E0E0" : "#333333",
  };

  return (
    <div
      className="infinite-gradient-background"
      style={{ background: colors.gradientBackground }}
    >
      <div
        className="infinite-scroll-container"
        style={{ backgroundColor: colors.background }}
      >
        <button
          className="infinite-go-back-button"
          style={{ backgroundColor: colors.teaseTextBackground }}
          onClick={() => navigate(-1)}
        >
          <span className="arrow">←</span>
          <span>Go Back</span>
        </button>

        <div className="infinite-header">
          <div className="infinite-toggle-container">
            <span className="toggle-icon" style={{ color: colors.toggleText }}>
              {isDarkMode ? "🌙" : "☀️"}
            </span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={isDarkMode}
                onChange={toggleDarkMode}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <h1 className="infinite-title" style={{ color: colors.title }}>
            Moral Torture Machine
          </h1>
        </div>

        <div
          className="infinite-card"
          style={{
            backgroundColor: colors.generatedTextBackground,
            boxShadow: isDarkMode
              ? "0 8px 20px rgba(0, 0, 0, 0.5)"
              : "0 8px 20px rgba(0, 0, 0, 0.2)",
          }}
        >
          {!dilemmaGenerated ? (
            <div className="infinite-button-container">
              <button
                onClick={fetchDilemma}
                disabled={loading}
                className="infinite-button"
                style={{
                  backgroundColor: loading ? "#CCCCCC" : colors.buttonBackground,
                }}
              >
                {loading ? "🔄 Loading..." : "✨ Generate Dilemma"}
              </button>
              {loading && <div className="spinner"></div>}
            </div>
          ) : (
            <div>
              <p
                className="infinite-generated-text-label"
                style={{ color: colors.generatedTextLabel }}
              >
                🧠 Generated Ethical Dilemma:
              </p>
              <p
                className="infinite-generated-text"
                style={{
                  backgroundColor: colors.generatedTextBackground,
                  color: colors.generatedTextColor,
                }}
              >
                {generatedText}
              </p>

              {!choiceMade ? (
                <div className="infinite-response-buttons">
                  <button
                    className="infinite-yes-button"
                    style={{ backgroundColor: colors.yesButtonBackground }}
                    onClick={() => handleChoice("first")}
                  >
                    {answers.firstAnswer}
                  </button>
                  <button
                    className="infinite-no-button"
                    style={{ backgroundColor: colors.noButtonBackground }}
                    onClick={() => handleChoice("second")}
                  >
                    {answers.secondAnswer}
                  </button>
                </div>
              ) : (
                <div>
                  <p
                    className="infinite-tease-text"
                    style={{
                      backgroundColor: colors.teaseTextBackground,
                      color: colors.teaseTextColor,
                    }}
                  >
                    {selectedTease}
                  </p>
                  <button
                    onClick={fetchDilemma}
                    disabled={loading}
                    className="infinite-button infinite-generate-new-button"
                    style={{
                      backgroundColor: loading
                        ? "#CCCCCC"
                        : colors.generateNewButtonBackground,
                    }}
                  >
                    {loading ? "🔄 Loading..." : "🔁 Generate New Dilemma"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfiniteDilemmasScreen;
