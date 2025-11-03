// screens/StoryModeScreen.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { getApiHeaders } from '../utils/session';
import SEO from '../components/SEO';
import "./StoryModeScreen.css";

const StoryModeScreen = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [flow, setFlow] = useState(null);
  const [currentNode, setCurrentNode] = useState(null);
  const [nodeHistory, setNodeHistory] = useState([]);
  const [choiceMade, setChoiceMade] = useState(false);
  const [selectedTease, setSelectedTease] = useState("");
  const [voting, setVoting] = useState(false);
  const [storyComplete, setStoryComplete] = useState(false);
  const [answers, setAnswers] = useState([]);

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

  useEffect(() => {
    fetchStoryFlow();
  }, [i18n.language]);

  const API_URL = import.meta.env.VITE_API_URL;
  const getFlowUrl = `${API_URL}/get-story-flow`;
  const voteUrl = `${API_URL}/story-node-vote`;

  const fetchStoryFlow = async () => {
    setLoading(true);
    const currentLanguage = i18n.language;

    try {
      const response = await fetch(`${getFlowUrl}?language=${currentLanguage}`, {
        method: "GET",
        headers: getApiHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setFlow(result);

      // Start with the first node (always "1")
      const firstNode = result.nodes["1"];
      setCurrentNode(firstNode);
      setNodeHistory([{ nodeId: "1", node: firstNode }]);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching story flow:", error);
      alert(t('storyMode.errorFetchingFlow', 'Error loading story. Please try again.'));
      navigate('/');
    }
  };

  const handleChoice = async (choice) => {
    if (choiceMade || voting || !currentNode) return;

    setVoting(true);
    setChoiceMade(true);

    // Get the tease and moral values
    const tease = choice === 'first' ? currentNode.teaseOption1 : currentNode.teaseOption2;
    setSelectedTease(tease);

    // Collect moral values for the chosen answer
    const chosenValues = {
      Empathy: choice === 'first' ? currentNode.firstAnswerEmpathy : currentNode.secondAnswerEmpathy,
      Integrity: choice === 'first' ? currentNode.firstAnswerIntegrity : currentNode.secondAnswerIntegrity,
      Responsibility: choice === 'first' ? currentNode.firstAnswerResponsibility : currentNode.secondAnswerResponsibility,
      Justice: choice === 'first' ? currentNode.firstAnswerJustice : currentNode.secondAnswerJustice,
      Altruism: choice === 'first' ? currentNode.firstAnswerAltruism : currentNode.secondAnswerAltruism,
      Honesty: choice === 'first' ? currentNode.firstAnswerHonesty : currentNode.secondAnswerHonesty,
    };

    // Save answer
    setAnswers([...answers, chosenValues]);

    try {
      // Get current node ID from history
      const currentNodeId = nodeHistory[nodeHistory.length - 1].nodeId;

      // Vote and get next node
      const response = await fetch(voteUrl, {
        method: "POST",
        headers: {
          ...getApiHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flowId: flow._id,
          nodeId: currentNodeId,
          vote: choice,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.isComplete) {
        // Story is complete
        setStoryComplete(true);
      }

      setVoting(false);
    } catch (error) {
      console.error("Error voting on node:", error);
      setVoting(false);
      alert(t('storyMode.errorVoting', 'Error processing your choice. Please try again.'));
    }
  };

  const handleContinue = async () => {
    if (storyComplete) {
      // Navigate to results with the collected answers
      navigate("/results", {
        state: {
          answers: answers,
          dilemmasWithChoices: nodeHistory.map((item, index) => ({
            dilemma: item.node.dilemma,
            firstAnswer: item.node.firstAnswer,
            secondAnswer: item.node.secondAnswer,
            chosenAnswer: answers[index] ?
              (answers[index].Empathy === item.node.firstAnswerEmpathy ? item.node.firstAnswer : item.node.secondAnswer) :
              item.node.firstAnswer,
            chosenValues: answers[index] || {},
          })),
          mode: 'story'
        },
      });
      return;
    }

    // Get the next node
    const currentNodeId = nodeHistory[nodeHistory.length - 1].nodeId;
    const currentNodeData = flow.nodes[currentNodeId];

    // Determine which answer was chosen
    const lastAnswer = answers[answers.length - 1];
    const wasFirst = lastAnswer.Empathy === currentNodeData.firstAnswerEmpathy;
    const nextNodeId = wasFirst ? currentNodeData.nextNodeOnFirst : currentNodeData.nextNodeOnSecond;

    if (nextNodeId && flow.nodes[nextNodeId]) {
      const nextNode = flow.nodes[nextNodeId];
      setCurrentNode(nextNode);
      setNodeHistory([...nodeHistory, { nodeId: nextNodeId, node: nextNode }]);
      setChoiceMade(false);
      setSelectedTease("");
    } else {
      // No next node, story is complete
      setStoryComplete(true);
    }
  };

  const renderProgressIndicator = () => {
    if (!currentNode) return null;

    const depth = currentNode.depth || 1;
    const maxDepth = 5;

    return (
      <div className="progress-indicator">
        <span className="progress-text">
          {t('storyMode.chapter', 'Chapter')} {depth} / {maxDepth}
        </span>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(depth / maxDepth) * 100}%` }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="story-mode-screen">
        <SEO
          title={t('storyMode.seoTitle', 'Story Mode')}
          description={t('storyMode.seoDescription', 'Navigate through a branching story of moral dilemmas')}
          noindex={true}
        />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('storyMode.loading', 'Loading your story...')}</p>
        </div>
      </div>
    );
  }

  if (!flow || !currentNode) {
    return (
      <div className="story-mode-screen">
        <div className="error-container">
          <p>{t('storyMode.errorLoading', 'Error loading story')}</p>
          <button onClick={() => navigate('/')}>{t('common.backToHome', 'Back to Home')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="story-mode-screen">
      <SEO
        title={t('storyMode.seoTitle', 'Story Mode')}
        description={t('storyMode.seoDescription', 'Navigate through a branching story of moral dilemmas')}
        noindex={true}
      />

      <div className="story-container">
        {/* Story Title */}
        <div className="story-header">
          <h1 className="story-title">{flow.title}</h1>
          <p className="story-description">{flow.description}</p>
        </div>

        {/* Progress Indicator */}
        {renderProgressIndicator()}

        {/* Current Dilemma */}
        <div className={`dilemma-card ${choiceMade ? 'choice-made' : ''}`}>
          <p className="dilemma-text">{currentNode.dilemma}</p>

          {!choiceMade && (
            <div className="choices-container">
              <button
                className="choice-button choice-first"
                onClick={() => handleChoice('first')}
                disabled={voting}
              >
                {currentNode.firstAnswer}
              </button>
              <button
                className="choice-button choice-second"
                onClick={() => handleChoice('second')}
                disabled={voting}
              >
                {currentNode.secondAnswer}
              </button>
            </div>
          )}

          {choiceMade && (
            <div className="tease-container">
              <p className="tease-text">{selectedTease}</p>
              {!storyComplete && (
                <button
                  className="continue-button"
                  onClick={handleContinue}
                  disabled={voting}
                >
                  {t('storyMode.continue', 'Continue...')}
                </button>
              )}
              {storyComplete && (
                <button
                  className="finish-button"
                  onClick={handleContinue}
                >
                  {t('storyMode.viewResults', 'View Your Results')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryModeScreen;
