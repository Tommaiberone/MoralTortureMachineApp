import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

import AuthContext from './authContext';
import {
  beginSignIn,
  completeSignIn,
  getValidAuthSession,
  isNativeAuthCallbackUrl,
  isNativeAuthLogoutUrl,
  isAuthAvailable,
  refreshAccountActivity,
  signOut,
} from './authClient';
import { trackEvent } from '../utils/analytics';

const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const handledNativeUrls = useRef(new Set());

  const refreshSession = useCallback(async () => {
    setLoading(true);
    const nextSession = await getValidAuthSession();
    setSession(nextSession);
    if (nextSession?.idToken) void refreshAccountActivity(nextSession.idToken);
    setLoading(false);
    return nextSession;
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    let cancelled = false;
    let urlListener;

    const handleNativeUrl = async (url) => {
      if (!url || handledNativeUrls.current.has(url)) return;
      if (!isNativeAuthCallbackUrl(url) && !isNativeAuthLogoutUrl(url)) return;
      handledNativeUrls.current.add(url);

      if (isNativeAuthLogoutUrl(url)) return;
      setLoading(true);
      setError('');
      try {
        const result = await completeSignIn(url);
        if (cancelled) return;
        setSession(result.session);
        void refreshAccountActivity(result.session.idToken);
        window.history.replaceState({}, '', result.returnTo);
        window.dispatchEvent(new PopStateEvent('popstate'));
      } catch (callbackError) {
        console.error('Native authentication callback failed', callbackError);
        trackEvent('auth_failed', { reason: 'native_callback' });
        if (!cancelled) setError('callback');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const registerNativeListener = async () => {
      urlListener = await CapacitorApp.addListener('appUrlOpen', ({ url }) => {
        void handleNativeUrl(url);
      });
      if (cancelled) {
        await urlListener.remove();
        return;
      }
      const launch = await CapacitorApp.getLaunchUrl();
      if (launch?.url) await handleNativeUrl(launch.url);
    };

    void registerNativeListener();
    return () => {
      cancelled = true;
      if (urlListener) void urlListener.remove();
    };
  }, []);

  const login = useCallback(async (returnTo) => {
    setError('');
    try {
      await beginSignIn(returnTo);
    } catch (loginError) {
      console.error('Authentication could not be started', loginError);
      trackEvent('auth_failed', { reason: 'start' });
      setError('start');
    }
  }, []);

  const logout = useCallback(async () => {
    setError('');
    setSession(null);
    try {
      await signOut();
    } catch (logoutError) {
      console.error('Authentication logout failed', logoutError);
      setError('logout');
    }
  }, []);

  const clearError = useCallback(() => setError(''), []);

  const value = useMemo(() => ({
    available: isAuthAvailable(),
    clearError,
    error,
    isAuthenticated: Boolean(session),
    isAdmin: Boolean(session?.user?.isAdmin),
    loading,
    session,
    user: session?.user || null,
    login,
    logout,
    refreshSession,
  }), [clearError, error, loading, login, logout, refreshSession, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = { children: PropTypes.node.isRequired };

export default AuthProvider;
