// screens/EvaluationDilemmasScreen.jsx
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
        className="evaluation-scroll-container"
      >        <button
          className="evaluation-go-back-button"
          onClick={() => navigate(-1)}
        >
          <span className="arrow">←</span>
          <span>ESCAPE</span>
        </button>

        <div className="evaluation-header">
          <h1 className="evaluation-title">
            💀 EVALUATION 💀
          </h1>
          <p className="evaluation-subtitle">
            {currentDilemmaCount} / {MAX_DILEMMAS}
          </p>
        </div>

        <div
          className="evaluation-card"
        >
          {!dilemma ? (
            <div className="evaluation-button-container">
              <button
                onClick={fetchDilemma}
                disabled={loading}
                className="evaluation-button"
              >
                {loading ? "⏳ Loading..." : "🩸 Get Dilemma"}
              </button>
              {loading && <div className="spinner"></div>}
            </div>
          ) : (
            <div>
              <p
                className="evaluation-generated-text-label"
              >
                🧠 Retrieved Ethical Dilemma:
              </p>
              <p
                className="evaluation-generated-text"
              >
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
                  <p
                    className="evaluation-tease-text"
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
                    >
                      View Results
                    </button>
                  ) : (
                    <button
                      onClick={fetchDilemma}
                      disabled={loading}
                      className="evaluation-button evaluation-generate-new-button"
                    >
                      {loading ? "⏳ Loading..." : "🔁 Get New Dilemma"}
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
