// screens/EvaluationDilemmasScreen.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import "./EvaluationDilemmasScreen.css";

const MAX_DILEMMAS = 5;

const EvaluationDilemmasScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dilemma, setDilemma] = useState(null);

  const [choiceMade, setChoiceMade] = useState(false);
  const [selectedTease, setSelectedTease] = useState("");
  const [currentDilemmaCount, setCurrentDilemmaCount] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [currentChoice, setChoiceCounts] = useState({ first: 0, second: 0 });
  const [voting, setVoting] = useState(false);
  const [evaluationComplete, setEvaluationComplete] = useState(false);

  useEffect(() => {
    if (currentDilemmaCount >= MAX_DILEMMAS) {
      setEvaluationComplete(true);
    }
  }, [currentDilemmaCount]);

  const backendUrl = "https://wxe53u88o8.execute-api.eu-west-1.amazonaws.com/get-dilemma";
  const voteUrl = "https://wxe53u88o8.execute-api.eu-west-1.amazonaws.com/vote";

  const fetchDilemmaData = async () => {
    let response;
    let retries = 5;
    while (retries > 0) {
      try {
        response = await fetch(backendUrl, {
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
    setChoiceMade(false);
    setSelectedTease("");
    setChoiceCounts({ first: 0, second: 0 });

    try {
      const fetchedDilemma = await fetchDilemmaData();
      setDilemma(fetchedDilemma);
    } catch (error) {
      console.error("Error during backend call:", error);
      alert("Failed to fetch the dilemma. Please try again.");
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
      alert("Failed to record your vote. Please try again.");
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
    setCurrentDilemmaCount(currentDilemmaCount + 1);
    setChoiceMade(true);
    setVoting(false);
  };

  const colors = {
    background: "#1E1E2E",
    gradientBackground: "linear-gradient(135deg, #2C2C3E, #1E1E2E)",
    title: "#E0E0E0",
    buttonBackground: "#3A3A5A",
    generateNewButtonBackground: "#3A3A5A",
    buttonText: "#FFFFFF",
    generatedTextLabel: "#E0E0E0",
    generatedTextBackground: "#2C2C3E",
    generatedTextColor: "#CCCCCC",
    teaseTextBackground: "#6C71FF",
    teaseTextColor: "#FFFFFF",
    yesButtonBackground: "#6C71FF",
    noButtonBackground: "#FFB86C",
    toggleText: "#E0E0E0",
  };

  const pieChartData = [
    {
      name: dilemma ? dilemma.firstAnswer : "Option 1",
      value: (dilemma ? dilemma.yesCount : 0) + currentChoice.first,
      color: "#6C71FF",
    },
    {
      name: dilemma ? dilemma.secondAnswer : "Option 2",
      value: (dilemma ? dilemma.noCount : 0) + currentChoice.second,
      color: "#FFB86C",
    },
  ];

  return (
    <div
      className="evaluation-gradient-background"
      style={{ background: colors.gradientBackground }}
    >
      <div
        className="evaluation-scroll-container"
        style={{ backgroundColor: colors.background }}
      >
        <button
          className="evaluation-go-back-button"
          style={{ backgroundColor: colors.teaseTextBackground }}
          onClick={() => navigate(-1)}
        >
          <span className="arrow">←</span>
          <span>Go Back</span>
        </button>

        <div className="evaluation-header">
          <h1 className="evaluation-title" style={{ color: colors.title }}>
            Ethical Dilemmas
          </h1>
          <p className="evaluation-subtitle" style={{ color: colors.title }}>
            {currentDilemmaCount} / {MAX_DILEMMAS}
          </p>
        </div>

        <div
          className="evaluation-card"
          style={{
            backgroundColor: colors.generatedTextBackground,
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.5)",
          }}
        >
          {!dilemma ? (
            <div className="evaluation-button-container">
              <button
                onClick={fetchDilemma}
                disabled={loading}
                className="evaluation-button"
                style={{
                  backgroundColor: loading ? "#CCCCCC" : colors.buttonBackground,
                }}
              >
                {loading ? "🔄 Loading..." : "✨ Get Dilemma"}
              </button>
              {loading && <div className="spinner"></div>}
            </div>
          ) : (
            <div>
              <p
                className="evaluation-generated-text-label"
                style={{ color: colors.generatedTextLabel }}
              >
                🧠 Retrieved Ethical Dilemma:
              </p>
              <p
                className="evaluation-generated-text"
                style={{
                  backgroundColor: colors.generatedTextBackground,
                  color: colors.generatedTextColor,
                }}
              >
                {dilemma.dilemma}
              </p>
              {!choiceMade ? (
                <div className="evaluation-response-buttons">
                  <button
                    className="evaluation-yes-button"
                    style={{ backgroundColor: colors.yesButtonBackground }}
                    onClick={() => handleChoice("first")}
                    disabled={voting}
                  >
                    {dilemma.firstAnswer}
                  </button>
                  <button
                    className="evaluation-no-button"
                    style={{ backgroundColor: colors.noButtonBackground }}
                    onClick={() => handleChoice("second")}
                    disabled={voting}
                  >
                    {dilemma.secondAnswer}
                  </button>
                  {voting && <div className="spinner" style={{ marginTop: "10px" }}></div>}
                </div>
              ) : (
                <div>
                  <p
                    className="evaluation-tease-text"
                    style={{
                      backgroundColor: colors.teaseTextBackground,
                      color: colors.teaseTextColor,
                    }}
                  >
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
                          label={({ name, percent }) =>
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
                  {evaluationComplete ? (
                    <button
                      onClick={() =>
                        navigate("/results", {
                          state: { answers: selectedAnswers },
                        })
                      }
                      className="evaluation-button evaluation-generate-new-button"
                      style={{ backgroundColor: colors.generateNewButtonBackground }}
                    >
                      View Results
                    </button>
                  ) : (
                    <button
                      onClick={fetchDilemma}
                      disabled={loading}
                      className="evaluation-button evaluation-generate-new-button"
                      style={{
                        backgroundColor: loading
                          ? "#CCCCCC"
                          : colors.generateNewButtonBackground,
                      }}
                    >
                      {loading ? "🔄 Loading..." : "🔁 Get New Dilemma"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvaluationDilemmasScreen;
