import { isWeb } from './platform';

const COOKIE = 'mtm_web_analytics_consent';
const ID = import.meta.env.VITE_GA4_MEASUREMENT_ID?.trim();

const removeCookie = (name) => {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
};

export const consent = () => document.cookie
  .split('; ')
  .find((entry) => entry.startsWith(`${COOKIE}=`))
  ?.split('=')[1];

export const saveConsent = (value) => {
  document.cookie = `${COOKIE}=${value}; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
};

const gtag = (...args) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
};

export const loadGoogleAnalytics = () => {
  if (!isWeb() || !ID || document.getElementById('mtm-ga4')) return;
  const denied = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' };
  gtag('consent', 'default', denied);
  gtag('consent', 'update', { ...denied, analytics_storage: 'granted' });
  const script = document.createElement('script');
  script.id = 'mtm-ga4';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ID)}`;
  document.head.appendChild(script);
  gtag('js', new Date());
  gtag('config', ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
};

export const initializeGoogleAnalytics = () => {
  if (consent() === 'granted') loadGoogleAnalytics();
};

export const revokeGoogleAnalytics = () => {
  saveConsent('denied');
  document.cookie.split(';').forEach((entry) => {
    const name = entry.trim().split('=')[0];
    if (name.startsWith('_ga')) removeCookie(name);
  });
  window.location.reload();
};

export const resetGoogleAnalyticsConsent = () => {
  removeCookie(COOKIE);
  window.location.reload();
};
