// Identity and session management for analytics and progressive authentication.

import { getPreference, setPreference } from './storage';
import { getPlatform, isNativePlatform } from './platform';

const ANONYMOUS_USER_KEY = 'mtm_anonymous_user_id';
const INSTALL_KEY = 'mtm_install_id';
const SESSION_KEY = 'mtm_session_id';
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.5.0';

let anonymousUserId;
let installId;

const createId = () => crypto.randomUUID();

/**
 * Initialize persistent identity before the React tree starts making requests.
 * Capacitor Preferences is used on native platforms; web uses localStorage via
 * the shared storage wrapper.
 */
export const initializeIdentity = async () => {
  try {
    anonymousUserId = await getPreference(ANONYMOUS_USER_KEY);
    if (!anonymousUserId) {
      anonymousUserId = createId();
      await setPreference(ANONYMOUS_USER_KEY, anonymousUserId);
    }

    installId = await getPreference(INSTALL_KEY);
    if (!installId) {
      installId = createId();
      await setPreference(INSTALL_KEY, installId);
    }
  } catch (error) {
    // A storage failure must never prevent gameplay. Keep an in-memory identity
    // for the current page as a privacy-safe fallback.
    console.warn('Persistent identity unavailable; using ephemeral identity.', error);
    anonymousUserId ||= createId();
    installId ||= createId();
  }

  return getIdentityContext();
};

/**
 * Get or create a unique session ID for analytics tracking
 * @returns {string} Session ID (UUID v4)
 */
export const getSessionId = () => {
  // Try to get existing session ID from sessionStorage (per-tab)
  let sessionId = sessionStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    // Generate new UUID v4
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
};

/**
 * Return the persistent anonymous user ID. initializeIdentity should run before
 * this function; the fallback keeps requests safe during unusual bootstrap errors.
 */
export const getAnonymousUserId = () => {
  if (!anonymousUserId) {
    anonymousUserId = localStorage.getItem(ANONYMOUS_USER_KEY) || createId();
    localStorage.setItem(ANONYMOUS_USER_KEY, anonymousUserId);
  }

  return anonymousUserId;
};

export const getInstallId = () => {
  if (!installId) {
    installId = localStorage.getItem(INSTALL_KEY) || createId();
    localStorage.setItem(INSTALL_KEY, installId);
  }

  return installId;
};

export const getIdentityContext = () => ({
  anonymousUserId: getAnonymousUserId(),
  sessionId: getSessionId(),
  installId: getInstallId(),
  platform: getPlatform(),
  isNative: isNativePlatform(),
  appVersion: APP_VERSION,
});

export const getTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
};

export const getAppLanguage = () => (
  document.documentElement.lang || navigator.language?.split('-')[0] || 'en'
);

/**
 * Get headers for API requests including session tracking
 * @returns {Object} Headers object with session ID
 */
export const getApiHeaders = () => {
  const identity = getIdentityContext();
  const timeZone = getTimeZone();
  const appLanguage = getAppLanguage();

  return {
    'Content-Type': 'application/json',
    'X-Session-Id': identity.sessionId,
    'X-Anonymous-User-Id': identity.anonymousUserId,
    'X-Install-Id': identity.installId,
    'X-Client-Platform': identity.platform,
    'X-App-Version': identity.appVersion,
    'X-Client-Language': appLanguage,
    ...(timeZone ? { 'X-Time-Zone': timeZone } : {}),
  };
};

/**
 * Get headers for an authenticated API request, on top of the usual
 * anonymous/session identity headers. `idToken` comes from
 * `getValidAuthSession()` / `useAuth().session.idToken` — the backend
 * expects a Cognito ID token, not an access token.
 * @param {string} idToken
 * @returns {Object} Headers object including Authorization: Bearer
 */
export const getAuthenticatedApiHeaders = (idToken) => ({
  ...getApiHeaders(),
  Authorization: `Bearer ${idToken}`,
});

/**
 * Clear the current session (useful for testing or logout)
 */
export const clearSession = () => {
  sessionStorage.removeItem(SESSION_KEY);
};
