// screens/TutorialScreen.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './TutorialScreen.css';

const TutorialScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode || 'evaluation'; // 'evaluation' or 'infinite'
  const [currentStep, setCurrentStep] = useState(0);

  const evaluationTutorialSteps = [
    {
      title: "[ TEST YOUR MORALITY ]",
      description: "FACE 5 MORAL DILEMMAS. EVALUATION ACROSS 6 VALUES: EMPATHY, INTEGRITY, RESPONSIBILITY, JUSTICE, ALTRUISM, HONESTY.",
      icon: "[X]",
    },
    {
      title: "[ MAKE CHOICES ]",
      description: "READ EACH DILEMMA. CHOOSE BETWEEN TWO OPTIONS. NO RIGHT ANSWERS. ONLY REFLECTIONS OF YOUR MORAL VALUES.",
      icon: "[ ]",
    },
    {
      title: "[ SEE OTHERS ]",
      description: "AFTER YOUR CHOICE, SEE HOW OTHERS RESPONDED. COMPARE YOUR MORAL REASONING WITH THE COMMUNITY.",
      icon: "[=]",
    },
    {
      title: "[ DISCOVER PROFILE ]",
      description: "AFTER 5 DILEMMAS, VIEW YOUR MORAL PROFILE. SEE WHICH VALUES GUIDE YOUR DECISION-MAKING.",
      icon: "[!]",
    },
  ];

  const infiniteTutorialSteps = [
    {
      title: "[ ENDLESS MODE ]",
      description: "ENDLESS AI-GENERATED MORAL DILEMMAS. EACH ONE UNIQUE. CHALLENGES YOUR ETHICS IN COMPLEX SITUATIONS.",
      icon: "[∞]",
    },
    {
      title: "[ GENERATE ]",
      description: "SUMMON NEW ETHICAL SCENARIOS POWERED BY AI. EACH ONE DIFFERENT. EACH ONE DARKER.",
      icon: "[+]",
    },
    {
      title: "[ CHOOSE PATH ]",
      description: "SELECT BETWEEN TWO MORALLY CHALLENGING OPTIONS. RECEIVE RESPONSE THAT REFLECTS ON YOUR DECISION.",
      icon: "[?]",
    },
    {
      title: "[ NO LIMIT ]",
      description: "KEEP GENERATING DILEMMAS. EXPLORE ETHICAL PERSPECTIVES. AS LONG AS YOU CAN ENDURE.",
      icon: "[∞]",
    },
  ];

  const tutorialSteps = mode === 'evaluation' ? evaluationTutorialSteps : infiniteTutorialSteps;
  const targetRoute = mode === 'evaluation' ? '/evaluation-dilemmas' : '/infinite-dilemmas';

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleStart();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleStart();
  };

  const handleStart = () => {
    // Mark tutorial as completed for this mode
    localStorage.setItem(`tutorial_completed_${mode}`, 'true');
    navigate(targetRoute);
  };

  const currentTutorial = tutorialSteps[currentStep];

  return (
    <div className="tutorial-container">
        <div className="tutorial-card">
          <div className="tutorial-icon">{currentTutorial.icon}</div>
          <h1 className="tutorial-title">{currentTutorial.title}</h1>
          <p className="tutorial-description">{currentTutorial.description}</p>

          <div className="tutorial-progress">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`tutorial-progress-dot ${
                  index === currentStep ? 'active' : ''
                } ${index < currentStep ? 'completed' : ''}`}
              />
            ))}
          </div>

          <div className="tutorial-buttons">
            {currentStep > 0 && (
              <button className="tutorial-button tutorial-button-secondary" onClick={handlePrevious}>
                Previous
              </button>
            )}
            <button className="tutorial-button tutorial-button-skip" onClick={handleSkip}>
              Skip
            </button>
            <button className="tutorial-button tutorial-button-primary" onClick={handleNext}>
              {currentStep === tutorialSteps.length - 1 ? "Let's Start!" : 'Next'}
            </button>
          </div>

          <button className="tutorial-home-button" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
        </div>
    </div>
  );
};

export default TutorialScreen;
