import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

import { API_BASE_URL } from '../config/api';
import { trackEvent } from '../utils/analytics';
import { getAnonymousUserId, getAuthenticatedApiHeaders } from '../utils/session';
import {
  getAuthStorageItem,
  removeAuthStorageItem,
  setAuthStorageItem,
} from './authStorage';

const AUTH_SESSION_KEY = 'mtm_auth_session';
const OAUTH_STATE_KEY = 'mtm_oauth_state';
const PKCE_VERIFIER_KEY = 'mtm_pkce_verifier';
const RETURN_TO_KEY = 'mtm_auth_return_to';

export const NATIVE_AUTH_CALLBACK_URI = 'moraltorturemachine://auth/callback';
export const NATIVE_AUTH_LOGOUT_URI = 'moraltorturemachine://auth/logout';

const cognitoDomain = (import.meta.env.VITE_COGNITO_DOMAIN || '').replace(/\/$/, '');
const cognitoWebClientId = import.meta.env.VITE_COGNITO_CLIENT_ID || '';
const cognitoNativeClientId = import.meta.env.VITE_COGNITO_NATIVE_CLIENT_ID || '';

const isConfiguredValue = (value) => Boolean(
  value && !value.startsWith('your-') && !value.startsWith('SET_'),
);

const getCognitoClientId = () => (
  Capacitor.isNativePlatform() ? cognitoNativeClientId : cognitoWebClientId
);

export const isAuthAvailable = () => (
  isConfiguredValue(cognitoDomain) && isConfiguredValue(getCognitoClientId())
);

const base64UrlEncode = (bytes) => btoa(String.fromCharCode(...bytes))
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');

const randomUrlSafeValue = (byteLength = 32) => {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
};

const createCodeChallenge = async (verifier) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
};

const getRedirectUri = () => (
  Capacitor.isNativePlatform()
    ? NATIVE_AUTH_CALLBACK_URI
    : `${window.location.origin}/auth/callback`
);

const getLogoutUri = () => (
  Capacitor.isNativePlatform()
    ? NATIVE_AUTH_LOGOUT_URI
    : `${window.location.origin}/`
);

const safeReturnPath = (value) => (
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : '/'
);

const parseAuthUrl = (value) => {
  if (typeof value !== 'string') return null;
  try {
    return value.startsWith('?')
      ? new URL(`${window.location.origin}/auth/callback${value}`)
      : new URL(value, window.location.origin);
  } catch {
    return null;
  }
};

export const isNativeAuthUrl = (value) => {
  const url = parseAuthUrl(value);
  return url?.protocol === 'moraltorturemachine:' && url.hostname === 'auth';
};

export const isNativeAuthCallbackUrl = (value) => {
  const url = parseAuthUrl(value);
  return isNativeAuthUrl(value) && url.pathname === '/callback';
};

export const isNativeAuthLogoutUrl = (value) => {
  const url = parseAuthUrl(value);
  return isNativeAuthUrl(value) && url.pathname === '/logout';
};

const decodeJwtPayload = (token) => {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
};

// Federated sign-ins (Google, ...) carry an `identities` claim naming the IdP;
// a native Cognito email+password account has none, so it falls back to 'email'.
const resolveAuthProvider = (idClaims) => (
  Array.isArray(idClaims.identities) && idClaims.identities[0]?.providerName
    ? idClaims.identities[0].providerName.toLowerCase()
    : 'email'
);

const persistSession = async (tokens, previousRefreshToken = null) => {
  const idClaims = decodeJwtPayload(tokens.id_token);
  if (!idClaims?.sub || !idClaims?.exp) throw new Error('Invalid identity token');

  const session = {
    idToken: tokens.id_token,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || previousRefreshToken,
    expiresAt: idClaims.exp * 1000,
    user: {
      sub: idClaims.sub,
      email: idClaims.email || null,
      name: idClaims.name || null,
      provider: resolveAuthProvider(idClaims),
      groups: Array.isArray(idClaims['cognito:groups']) ? idClaims['cognito:groups'] : [],
      isAdmin: Array.isArray(idClaims['cognito:groups']) && idClaims['cognito:groups'].includes('admins'),
    },
  };
  await setAuthStorageItem(AUTH_SESSION_KEY, JSON.stringify(session));
  return session;
};

const requestTokens = async (parameters) => {
  const response = await fetch(`${cognitoDomain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(parameters),
  });
  if (!response.ok) throw new Error('Cognito token exchange failed');
  return response.json();
};

const clearPendingSignIn = async () => {
  await Promise.all([
    removeAuthStorageItem(OAUTH_STATE_KEY),
    removeAuthStorageItem(PKCE_VERIFIER_KEY),
    removeAuthStorageItem(RETURN_TO_KEY),
  ]);
};

// A fast double-tap on any sign-in button (AuthButton, ChallengeLandingScreen,
// AccountDeleteScreen all call this indirectly) used to fire two overlapping
// sign-ins: each generates its own PKCE state/verifier and writes them to the
// same storage keys, so the second call clobbers the first's before its
// browser tab returns. Whichever callback comes back then fails
// completeSignIn's state check with "Invalid authentication callback", even
// though nothing was actually wrong. This module-level flag makes a
// re-entrant call while one is already in flight a harmless no-op instead.
let signInInFlight = false;

// No identity_provider param: Cognito's own managed login page shows the
// email+password form and the Google button together (both are supported
// identity providers on the app client, TASK-227), so the app needs only one
// generic "Sign in" entry point instead of a per-provider button/flow.
export const beginSignIn = async (returnTo = window.location.pathname) => {
  if (!isAuthAvailable()) throw new Error('Authentication is not configured');
  if (signInInFlight) return;
  signInInFlight = true;

  try {
    const state = randomUrlSafeValue();
    const verifier = randomUrlSafeValue(64);
    const challenge = await createCodeChallenge(verifier);
    await Promise.all([
      setAuthStorageItem(OAUTH_STATE_KEY, state),
      setAuthStorageItem(PKCE_VERIFIER_KEY, verifier),
      setAuthStorageItem(RETURN_TO_KEY, safeReturnPath(returnTo)),
    ]);
    trackEvent('auth_started');

    const query = new URLSearchParams({
      response_type: 'code',
      client_id: getCognitoClientId(),
      redirect_uri: getRedirectUri(),
      scope: 'openid email profile',
      state,
      code_challenge_method: 'S256',
      code_challenge: challenge,
    });
    const authorizationUrl = `${cognitoDomain}/oauth2/authorize?${query.toString()}`;

    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url: authorizationUrl, toolbarColor: '#1a1a1a' });
      return;
    }
    window.location.assign(authorizationUrl);
  } finally {
    signInInFlight = false;
  }
};

// Links pre-login anonymous activity (moral_profiles, Duel history) to the
// account. Fire-and-forget: idempotent server-side (TASK-13), and a failure
// here must never block sign-in or surface as a login error to the user.
const claimAnonymousData = async (idToken) => {
  try {
    await fetch(`${API_BASE_URL}/users/claim-anonymous-data`, {
      method: 'POST',
      headers: getAuthenticatedApiHeaders(idToken),
      body: JSON.stringify({ anonymousUserId: getAnonymousUserId() }),
    });
  } catch (claimError) {
    console.warn('Claiming anonymous data failed; continuing without it.', claimError);
  }
};

export const refreshAccountActivity = async (idToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthenticatedApiHeaders(idToken),
    });
    if (!response.ok) {
      console.warn('Account activity refresh failed; it will retry on the next app session.');
    }
  } catch (refreshError) {
    // Session restoration must remain available during a temporary backend or
    // network outage. The server also refreshes activity on authenticated
    // social flows, and this heartbeat retries when the app is opened again.
    console.warn('Account activity refresh failed; it will retry on the next app session.', refreshError);
  }
};

export const completeSignIn = async (callbackUrl) => {
  if (!isAuthAvailable()) throw new Error('Authentication is not configured');
  const url = parseAuthUrl(callbackUrl);
  if (!url) throw new Error('Invalid authentication callback');

  const [expectedState, verifier, storedReturnTo] = await Promise.all([
    getAuthStorageItem(OAUTH_STATE_KEY),
    getAuthStorageItem(PKCE_VERIFIER_KEY),
    getAuthStorageItem(RETURN_TO_KEY),
  ]);
  await clearPendingSignIn();

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const returnTo = safeReturnPath(storedReturnTo);

  if (error) throw new Error(url.searchParams.get('error_description') || error);
  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    throw new Error('Invalid authentication callback');
  }

  const tokens = await requestTokens({
    grant_type: 'authorization_code',
    client_id: getCognitoClientId(),
    code,
    redirect_uri: getRedirectUri(),
    code_verifier: verifier,
  });
  const session = await persistSession(tokens);
  void claimAnonymousData(session.idToken);
  trackEvent('auth_completed', { provider: session.user.provider });
  return { session, returnTo };
};

export const getStoredAuthSession = async () => {
  try {
    const session = JSON.parse(await getAuthStorageItem(AUTH_SESSION_KEY));
    return session?.idToken && session?.user?.sub ? session : null;
  } catch {
    return null;
  }
};

export const getValidAuthSession = async () => {
  const session = await getStoredAuthSession();
  if (!session) return null;
  if (session.expiresAt > Date.now() + 60_000) return session;
  if (!session.refreshToken || !isAuthAvailable()) {
    await removeAuthStorageItem(AUTH_SESSION_KEY);
    return null;
  }

  try {
    const tokens = await requestTokens({
      grant_type: 'refresh_token',
      client_id: getCognitoClientId(),
      refresh_token: session.refreshToken,
    });
    return persistSession(tokens, session.refreshToken);
  } catch {
    await removeAuthStorageItem(AUTH_SESSION_KEY);
    return null;
  }
};

export const clearAuthSession = () => removeAuthStorageItem(AUTH_SESSION_KEY);

export const signOut = async ({ track = true } = {}) => {
  const priorSession = track ? await getStoredAuthSession() : null;
  await Promise.all([clearAuthSession(), clearPendingSignIn()]);
  if (track) trackEvent('auth_logout', { provider: priorSession?.user?.provider || 'unknown' });
  if (!isAuthAvailable()) return;

  const query = new URLSearchParams({
    client_id: getCognitoClientId(),
    logout_uri: getLogoutUri(),
  });
  const logoutUrl = `${cognitoDomain}/logout?${query.toString()}`;
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url: logoutUrl, toolbarColor: '#1a1a1a' });
    return;
  }
  window.location.assign(logoutUrl);
};
