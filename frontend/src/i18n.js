import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';

// TASK-101: Italian is temporarily hidden app-wide (product decision, not a
// removal). To revert: restore `.use(LanguageDetector)`, `supportedLngs: ['en', 'it']`,
// the `detection` block below, and re-enable LanguageSelector in HomeScreen.
//
// detection: {
//   order: ['path', 'cookie', 'htmlTag', 'localStorage', 'subdomain'],
//   caches: ['cookie'],
// },
i18n
  .use(HttpApi)
  .use(initReactI18next)
  .init({
    lng: 'en',
    supportedLngs: ['en'],
    fallbackLng: 'en',
    backend: {
      loadPath: '/locales/{{lng}}.json',
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
