// screens/TutorialScreen.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './TutorialScreen.css';

const TutorialScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const mode = location.state?.mode || 'evaluation'; // 'evaluation' or 'infinite'
  const [currentStep, setCurrentStep] = useState(0);

  const evaluationTutorialSteps = [
    {
      title: t('tutorial.evaluation_step1_title'),
      description: t('tutorial.evaluation_step1_desc'),
      icon: "[X]",
    },
    {
      title: t('tutorial.evaluation_step2_title'),
      description: t('tutorial.evaluation_step2_desc'),
      icon: "[ ]",
    },
    {
      title: t('tutorial.evaluation_step3_title'),
      description: t('tutorial.evaluation_step3_desc'),
      icon: "[=]",
    },
    {
      title: t('tutorial.evaluation_step4_title'),
      description: t('tutorial.evaluation_step4_desc'),
      icon: "[!]",
    },
  ];

  const infiniteTutorialSteps = [
    {
      title: t('tutorial.infinite_step1_title'),
      description: t('tutorial.infinite_step1_desc'),
      icon: "[∞]",
    },
    {
      title: t('tutorial.infinite_step2_title'),
      description: t('tutorial.infinite_step2_desc'),
      icon: "[+]",
    },
    {
      title: t('tutorial.infinite_step3_title'),
      description: t('tutorial.infinite_step3_desc'),
      icon: "[?]",
    },
    {
      title: t('tutorial.infinite_step4_title'),
      description: t('tutorial.infinite_step4_desc'),
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
                {t('tutorial.previous')}
              </button>
            )}
            <button className="tutorial-button tutorial-button-skip" onClick={handleSkip}>
              {t('tutorial.skip')}
            </button>
            <button className="tutorial-button tutorial-button-primary" onClick={handleNext}>
              {currentStep === tutorialSteps.length - 1 ? t('tutorial.start') : t('tutorial.next')}
            </button>
          </div>

          <button className="tutorial-home-button" onClick={() => navigate('/')}>
            {t('tutorial.back_to_home')}
          </button>
        </div>
    </div>
  );
};

export default TutorialScreen;
