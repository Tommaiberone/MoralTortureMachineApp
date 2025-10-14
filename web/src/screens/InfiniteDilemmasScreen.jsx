// screens/InfiniteDilemmasScreen.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./InfiniteDilemmasScreen.css";

const creepyMessages = [
  "Extracting moral fibers...",
  "Torturing your conscience...",
  "Summoning ethical dilemmas...",
  "Analyzing your soul...",
  "Preparing psychological torment...",
  "Loading existential dread...",
  "Calculating moral decay...",
  "Harvesting ethical nightmares...",
  "Initializing guilt processor...",
  "Awakening dormant demons...",
];

const getCreepyMessage = () => {
  return creepyMessages[Math.floor(Math.random() * creepyMessages.length)];
};

const InfiniteDilemmasScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
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
  const [creepyMessage, setCreepyMessage] = useState("");

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
    setCreepyMessage(getCreepyMessage());
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
      setGeneratedText("⚠ The machine has malfunctioned. Your soul remains unjudged... for now.");
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

  return (
    <div className="infinite-gradient-background gradient-background">
      <div className="infinite-scroll-container">
        <button
          className="infinite-go-back-button"
          onClick={() => navigate(-1)}
        >
          <span className="arrow">←</span>
          <span>ESCAPE</span>
        </button>

        <div className="infinite-header">
          <h1 className="infinite-title">
            💀 ENDLESS TORMENT 💀
          </h1>
          <p className="infinite-subtitle">
            Your choices have consequences...
          </p>
        </div>

        <div className="infinite-card">
          {!dilemmaGenerated ? (
            <div className="infinite-button-container">
              <button
                onClick={fetchDilemma}
                disabled={loading}
                className="infinite-button"
              >
                {loading ? `⏳ ${creepyMessage}` : "🩸 SUMMON DILEMMA 🩸"}
              </button>
              {loading && (
                <>
                  <div className="spinner"></div>
                  <p className="loading-text">{creepyMessage}</p>
                </>
              )}
            </div>
          ) : (
            <div>
              <p className="infinite-generated-text-label">
                ☠ YOUR MORAL NIGHTMARE ☠
              </p>
              <p className="infinite-generated-text">
                {generatedText}
              </p>

              {!choiceMade ? (
                <div className="infinite-response-buttons">
                  <button
                    className="infinite-yes-button"
                    onClick={() => handleChoice("first")}
                  >
                    🩸 {answers.firstAnswer}
                  </button>
                  <button
                    className="infinite-no-button"
                    onClick={() => handleChoice("second")}
                  >
                    💀 {answers.secondAnswer}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="infinite-tease-text">
                    {selectedTease}
                  </p>
                  <button
                    onClick={fetchDilemma}
                    disabled={loading}
                    className="infinite-button infinite-generate-new-button"
                  >
                    {loading ? `⏳ ${creepyMessage}` : "🔁 SUMMON NEXT NIGHTMARE"}
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
