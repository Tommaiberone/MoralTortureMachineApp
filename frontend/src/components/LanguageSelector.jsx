// components/LanguageSelector.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="language-selector">
      <button onClick={() => changeLanguage('en')} disabled={i18n.language === 'en'}>
        EN
      </button>
      <button onClick={() => changeLanguage('it')} disabled={i18n.language === 'it'}>
        IT
      </button>
    </div>
  );
};

export default LanguageSelector;
