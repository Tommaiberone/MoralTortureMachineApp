/**
 * Web Push (TASK-275): browser-side subscribe/unsubscribe against the shared
 * push backend (TASK-274). Browser-only on purpose - the Android app is a
 * Capacitor WebView, where a service worker push would be the wrong channel
 * (native Android is TASK-45), so every entry point reports "unsupported"
 * there instead of prompting.
 */

import { Capacitor } from '@capacitor/core';

import { API_BASE_URL } from '../config/api';
import { getApiHeaders } from './session';

const SERVICE_WORKER_URL = '/sw.js';

const isStandalone = () => (
  window.navigator.standalone === true
  || (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches)
);

// iPadOS 13+ reports itself as a Mac, hence the touch-points check.
const isIos = () => (
  /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
);

/**
 * iOS Safari only delivers Web Push to a PWA added to the Home Screen
 * (iOS 16.4+). Anywhere else a prompt would be a dead end, so we do not show it.
 */
export const isWebPushSupported = () => {
  try {
    if (Capacitor.isNativePlatform()) return false;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return false;
    if (isIos() && !isStandalone()) return false;
    return true;
  } catch {
    return false;
  }
};

export const getPushPermission = () => {
  try {
    return Notification.permission;
  } catch {
    return 'denied';
  }
};

const urlBase64ToUint8Array = (value) => {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const raw = atob((value + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
};

const getExistingSubscription = async () => {
  const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL);
  return registration ? registration.pushManager.getSubscription() : null;
};

/** True when this browser currently holds a push subscription. Never throws. */
export const hasWebPushSubscription = async () => {
  try {
    return Boolean(await getExistingSubscription());
  } catch {
    return false;
  }
};

/**
 * Ask for permission and subscribe this browser. Must be called from a click
 * handler (browsers ignore a permission request that is not user-initiated).
 * Resolves to 'subscribed' | 'denied' | 'dismissed' | 'unsupported' | 'error'.
 */
export const enableWebPush = async () => {
  if (!isWebPushSupported()) return 'unsupported';

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'denied') return 'denied';
    if (permission !== 'granted') return 'dismissed';

    await navigator.serviceWorker.register(SERVICE_WORKER_URL);
    const registration = await navigator.serviceWorker.ready;

    const keyResponse = await fetch(`${API_BASE_URL}/push/vapid-public-key`, { headers: getApiHeaders() });
    if (!keyResponse.ok) return 'error';
    const { key } = await keyResponse.json();

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });
    const { endpoint, keys } = subscription.toJSON();

    const response = await fetch(`${API_BASE_URL}/push/subscribe`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({ channel: 'web_push', endpoint, p256dh: keys?.p256dh, auth: keys?.auth }),
    });
    if (!response.ok) {
      // Do not keep a browser subscription the backend does not know about.
      await subscription.unsubscribe().catch(() => {});
      return 'error';
    }
    return 'subscribed';
  } catch (error) {
    console.error('Error enabling web push:', error);
    return 'error';
  }
};

/** Remove this browser's subscription, server side first. Resolves to a boolean. */
export const disableWebPush = async () => {
  try {
    const subscription = await getExistingSubscription();
    if (!subscription) return true;

    const response = await fetch(`${API_BASE_URL}/push/unsubscribe`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({ channel: 'web_push', endpoint: subscription.endpoint }),
    });
    if (!response.ok) return false;
    await subscription.unsubscribe();
    return true;
  } catch (error) {
    console.error('Error disabling web push:', error);
    return false;
  }
};
