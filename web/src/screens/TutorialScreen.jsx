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
      title: "Welcome to Test Your Morality",
      description: "Face 5 carefully crafted moral dilemmas that will evaluate your ethical compass across 6 core values: Empathy, Integrity, Responsibility, Justice, Altruism, and Honesty.",
      icon: "🧠",
    },
    {
      title: "Make Your Choices",
      description: "Read each dilemma carefully and choose between two options. There are no right or wrong answers - just honest reflections of your moral values.",
      icon: "⚖️",
    },
    {
      title: "See How Others Voted",
      description: "After making your choice, see how other people responded to the same dilemma. Compare your moral reasoning with the community.",
      icon: "📊",
    },
    {
      title: "Discover Your Moral Profile",
      description: "After completing all 5 dilemmas, view your personalized moral profile showing which values guide your decision-making the most.",
      icon: "🎯",
    },
  ];

  const infiniteTutorialSteps = [
    {
      title: "Welcome to Arcade Mode",
      description: "Experience an endless stream of AI-generated moral dilemmas. Each dilemma is unique and challenges you to think about complex ethical situations.",
      icon: "🎮",
    },
    {
      title: "Generate Dilemmas",
      description: "Click the 'Generate Dilemma' button to create a new ethical scenario powered by artificial intelligence. Each one is different!",
      icon: "✨",
    },
    {
      title: "Choose Your Path",
      description: "Select between two morally challenging options. After your choice, you'll receive a thought-provoking response that reflects on your decision.",
      icon: "🤔",
    },
    {
      title: "Play Endlessly",
      description: "There's no limit! Keep generating new dilemmas and exploring different ethical perspectives for as long as you want.",
      icon: "♾️",
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
