/**
 * Web Push (TASK-275, TASK-375): browser-side subscribe/unsubscribe against the
 * shared push backend (TASK-274). Browser-only on purpose - the Android app is
 * a Capacitor WebView, where a service worker push would be the wrong channel
 * (native Android is TASK-45), so every entry point reports "unsupported"
 * there instead of prompting.
 *
 * One browser subscription can follow several topics ('duel', 'daily'); the
 * backend keeps the set, this file only ever adds or removes one at a time.
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

// Minutes ahead of UTC on this device right now. The Daily notification only
// goes out in daytime, and the server needs this to tell what daytime is here.
const getUtcOffsetMinutes = () => -new Date().getTimezoneOffset();

const urlBase64ToUint8Array = (value) => {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const raw = atob((value + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
};

const getExistingSubscription = async () => {
  const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL);
  return registration ? registration.pushManager.getSubscription() : null;
};

const postJson = (path, body) => fetch(`${API_BASE_URL}${path}`, {
  method: 'POST',
  headers: getApiHeaders(),
  body: JSON.stringify(body),
});

/**
 * Topics this browser follows, according to the backend (the source of truth;
 * the browser's own subscription only says a subscription exists). Never
 * throws; any failure reads as "none".
 */
export const getWebPushTopics = async () => {
  try {
    const subscription = await getExistingSubscription();
    if (!subscription) return [];
    const response = await postJson('/push/status', {
      channel: 'web_push',
      endpoint: subscription.endpoint,
      utcOffsetMinutes: getUtcOffsetMinutes(),
    });
    if (!response.ok) return [];
    const { topics } = await response.json();
    return Array.isArray(topics) ? topics : [];
  } catch {
    return [];
  }
};

/**
 * Ask for permission (if needed) and follow `topic` in this browser. Must be
 * called from a click handler (browsers ignore a permission request that is
 * not user-initiated).
 * Resolves to 'subscribed' | 'denied' | 'dismissed' | 'unsupported' | 'error'.
 */
export const enableWebPush = async (topic) => {
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

    // Returns the existing subscription when this browser already has one, so
    // a second topic reuses it instead of creating a second device.
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });
    const { endpoint, keys } = subscription.toJSON();

    const response = await postJson('/push/subscribe', {
      channel: 'web_push',
      endpoint,
      p256dh: keys?.p256dh,
      auth: keys?.auth,
      topic,
      utcOffsetMinutes: getUtcOffsetMinutes(),
    });
    if (!response.ok) {
      // Only drop the browser subscription if it was not already serving
      // another topic.
      const remaining = await getWebPushTopics();
      if (remaining.length === 0) await subscription.unsubscribe().catch(() => {});
      return 'error';
    }
    return 'subscribed';
  } catch (error) {
    console.error('Error enabling web push:', error);
    return 'error';
  }
};

/**
 * Stop following `topic`, server side first. The browser's own push
 * subscription is released only once no topic is left. Resolves to a boolean.
 */
export const disableWebPush = async (topic) => {
  try {
    const subscription = await getExistingSubscription();
    if (!subscription) return true;

    const response = await postJson('/push/unsubscribe', {
      channel: 'web_push',
      endpoint: subscription.endpoint,
      topic,
    });
    if (!response.ok) return false;
    const { topics } = await response.json();
    if (!Array.isArray(topics) || topics.length === 0) await subscription.unsubscribe();
    return true;
  } catch (error) {
    console.error('Error disabling web push:', error);
    return false;
  }
};

/**
 * The person followed a notification: tell the backend so it stops counting
 * the ones they ignored. Best effort; analytics must never get in the way.
 */
export const reportPushOpened = async (campaign) => {
  try {
    await postJson('/push/opened', { campaign });
  } catch {
    // Nothing to do: the next real open resets it.
  }
};
