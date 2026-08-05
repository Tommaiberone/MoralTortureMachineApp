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

export const isGoogleAuthAvailable = () => (
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

// A fast double-tap on any "Sign in with Google" button (AuthButton,
// ChallengeLandingScreen, AccountDeleteScreen all call this indirectly) used
// to fire two overlapping sign-ins: each generates its own PKCE state/
// verifier and writes them to the same storage keys, so the second call
// clobbers the first's before its browser tab returns. Whichever callback
// comes back then fails completeGoogleSignIn's state check with "Invalid
// authentication callback", even though nothing was actually wrong. This
// module-level flag makes a re-entrant call while one is already in flight
// a harmless no-op instead.
let googleSignInInFlight = false;

export const beginGoogleSignIn = async (returnTo = window.location.pathname) => {
  if (!isGoogleAuthAvailable()) throw new Error('Google authentication is not configured');
  if (googleSignInInFlight) return;
  googleSignInInFlight = true;

  try {
    const state = randomUrlSafeValue();
    const verifier = randomUrlSafeValue(64);
    const challenge = await createCodeChallenge(verifier);
    await Promise.all([
      setAuthStorageItem(OAUTH_STATE_KEY, state),
      setAuthStorageItem(PKCE_VERIFIER_KEY, verifier),
      setAuthStorageItem(RETURN_TO_KEY, safeReturnPath(returnTo)),
    ]);
    trackEvent('auth_started', { provider: 'google' });

    const query = new URLSearchParams({
      response_type: 'code',
      client_id: getCognitoClientId(),
      redirect_uri: getRedirectUri(),
      scope: 'openid email profile',
      state,
      code_challenge_method: 'S256',
      code_challenge: challenge,
      identity_provider: 'Google',
    });
    const authorizationUrl = `${cognitoDomain}/oauth2/authorize?${query.toString()}`;

    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url: authorizationUrl, toolbarColor: '#1a1a1a' });
      return;
    }
    window.location.assign(authorizationUrl);
  } finally {
    googleSignInInFlight = false;
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

export const completeGoogleSignIn = async (callbackUrl) => {
  if (!isGoogleAuthAvailable()) throw new Error('Google authentication is not configured');
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
  trackEvent('auth_completed', { provider: 'google' });
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
  if (!session.refreshToken || !isGoogleAuthAvailable()) {
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

export const signOut = async () => {
  await Promise.all([clearAuthSession(), clearPendingSignIn()]);
  trackEvent('auth_logout', { provider: 'google' });
  if (!isGoogleAuthAvailable()) return;

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
