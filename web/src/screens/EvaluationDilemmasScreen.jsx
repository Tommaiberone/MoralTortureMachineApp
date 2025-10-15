// screens/EvaluationDilemmasScreen.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import "./EvaluationDilemmasScreen.css";

const MAX_DILEMMAS = 7;

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
    <div className="evaluation-scroll-container">
      <button
        className="evaluation-go-back-button"
        onClick={() => navigate(-1)}
      >
        <span className="arrow">←</span>
        <span>[ BACK ]</span>
      </button>

      <div className="evaluation-header">
        <h1 className="evaluation-title">
          [ ETHICAL DILEMMAS ]
        </h1>
        <p className="evaluation-subtitle">
          {currentDilemmaCount} / {MAX_DILEMMAS}
        </p>
      </div>

      <div className="evaluation-card">
        {!dilemma ? (
          <div className="evaluation-button-container">
            <button
              onClick={fetchDilemma}
              disabled={loading}
              className="evaluation-button"
            >
              {loading ? "[ LOADING ]" : "[ GET DILEMMA ]"}
            </button>
            {loading && <div className="spinner"></div>}
          </div>
        ) : (
          <div>
            <p className="evaluation-generated-text-label">
              [ RETRIEVED DILEMMA ]
            </p>
            <p className="evaluation-generated-text">
              {dilemma.dilemma}
            </p>
            {!choiceMade ? (
              <div className="evaluation-response-buttons">
                <button
                  className="evaluation-yes-button"
                  onClick={() => handleChoice("first")}
                  disabled={voting}
                >
                  {dilemma.firstAnswer}
                </button>
                <button
                  className="evaluation-no-button"
                  onClick={() => handleChoice("second")}
                  disabled={voting}
                >
                  {dilemma.secondAnswer}
                </button>
                {voting && <div className="spinner" style={{ marginTop: "10px" }}></div>}
              </div>
            ) : (
              <div>
                <p className="evaluation-tease-text">
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
                          `${name}: ${(percent * 100).toFixed(0)}%`
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
                  >
                    [ VIEW RESULTS ]
                  </button>
                ) : (
                  <button
                    onClick={fetchDilemma}
                    disabled={loading}
                    className="evaluation-button evaluation-generate-new-button"
                  >
                    {loading ? "[ LOADING ]" : "[ GET NEW DILEMMA ]"}
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
