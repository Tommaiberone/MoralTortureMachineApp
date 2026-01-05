/**
 * Mobile Lifecycle Hook
 * Hook React per gestire eventi del ciclo di vita dell'app mobile
 */

import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { Keyboard } from '@capacitor/keyboard';
import { isNativePlatform } from '../utils/platform';

/**
 * Hook per gestire il ciclo di vita dell'app mobile
 */
export const useMobileLifecycle = (callbacks = {}) => {
  useEffect(() => {
    if (!isNativePlatform()) return;

    const listeners = [];

    // App state changes (background/foreground)
    if (callbacks.onAppStateChange) {
      const stateListener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        callbacks.onAppStateChange(isActive);
      });
      listeners.push(stateListener);
    }

    // Back button (Android)
    if (callbacks.onBackButton) {
      const backListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        callbacks.onBackButton(canGoBack);
      });
      listeners.push(backListener);
    }

    // Deep links / URL opening
    if (callbacks.onAppUrlOpen) {
      const urlListener = CapacitorApp.addListener('appUrlOpen', (data) => {
        callbacks.onAppUrlOpen(data.url);
      });
      listeners.push(urlListener);
    }

    // Network status changes
    if (callbacks.onNetworkChange) {
      const networkListener = Network.addListener('networkStatusChange', (status) => {
        callbacks.onNetworkChange(status.connected, status.connectionType);
      });
      listeners.push(networkListener);
    }

    // Keyboard events
    if (callbacks.onKeyboardShow) {
      const keyboardShowListener = Keyboard.addListener('keyboardWillShow', (info) => {
        callbacks.onKeyboardShow(info.keyboardHeight);
      });
      listeners.push(keyboardShowListener);
    }

    if (callbacks.onKeyboardHide) {
      const keyboardHideListener = Keyboard.addListener('keyboardWillHide', () => {
        callbacks.onKeyboardHide();
      });
      listeners.push(keyboardHideListener);
    }

    // Cleanup
    return () => {
      listeners.forEach(listener => {
        listener.remove();
      });
    };
  }, [callbacks]);
};

/**
 * Hook per gestire il back button di Android
 */
export const useAndroidBackButton = (handler) => {
  useEffect(() => {
    if (!isNativePlatform()) return;

    const listener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (handler) {
        handler(canGoBack);
      }
    });

    return () => {
      listener.remove();
    };
  }, [handler]);
};

/**
 * Hook per rilevare quando l'app torna in foreground
 */
export const useAppResume = (callback) => {
  useEffect(() => {
    if (!isNativePlatform()) return;

    const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive && callback) {
        callback();
      }
    });

    return () => {
      listener.remove();
    };
  }, [callback]);
};

/**
 * Hook per rilevare lo stato della connessione
 */
export const useNetworkStatus = (callback) => {
  useEffect(() => {
    if (!isNativePlatform()) return;

    // Check initial status
    Network.getStatus().then(status => {
      if (callback) {
        callback(status.connected, status.connectionType);
      }
    });

    // Listen to changes
    const listener = Network.addListener('networkStatusChange', (status) => {
      if (callback) {
        callback(status.connected, status.connectionType);
      }
    });

    return () => {
      listener.remove();
    };
  }, [callback]);
};
