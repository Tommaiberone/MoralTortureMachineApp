import { API_ENDPOINTS } from '../config/api';
import {
  getApiHeaders,
  getAppLanguage,
  getIdentityContext,
  getTimeZone,
} from './session';

const QUEUE_KEY = 'mtm_analytics_queue_v1';
const SCHEMA_VERSION = 1;
const MAX_QUEUE_SIZE = 100;
const BATCH_SIZE = 25;
const FLUSH_INTERVAL_MS = 5000;
const FORBIDDEN_PROPERTY_KEYS = /(^|_)(email|password|token|secret|ip|analysis|dilemma_text|answer_text)($|_)/i;
const IDENTIFYING_PROPERTY_KEYS = new Set([
  'anonymous_user_id',
  'install_id',
  'session_id',
  'public_id',
  'profile_id',
  'room_code',
  'previous_room_code',
]);
const SAFE_ATTRIBUTION_VALUE = /^[A-Za-z0-9._+-]{1,120}$/;

let queue = [];
let flushTimer;
let flushInProgress = false;
let initialized = false;

const loadQueue = () => {
  try {
    const storedQueue = sessionStorage.getItem(QUEUE_KEY);
    queue = storedQueue ? JSON.parse(storedQueue) : [];
    if (!Array.isArray(queue)) queue = [];
  } catch {
    queue = [];
  }
};

const persistQueue = () => {
  try {
    sessionStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE_SIZE)));
  } catch {
    // Analytics storage is best-effort and must not affect gameplay.
  }
};

const sanitizeProperties = (properties = {}) => Object.fromEntries(
  Object.entries(properties)
    .filter(([key, value]) => (
      !FORBIDDEN_PROPERTY_KEYS.test(key)
      && !IDENTIFYING_PROPERTY_KEYS.has(key.toLowerCase())
      && ['string', 'number', 'boolean'].includes(typeof value)
    ))
    .slice(0, 20)
    .map(([key, value]) => [
      key.slice(0, 64),
      typeof value === 'string' ? value.slice(0, 200) : value,
    ])
);

const getAttribution = () => {
  const params = new URLSearchParams(window.location.search);
  let referrer;
  if (document.referrer) {
    try {
      const referrerUrl = new URL(document.referrer);
      // Keep campaign attribution without retaining share/profile/room paths
      // that can contain unlisted identifiers.
      referrer = referrerUrl.origin;
    } catch {
      referrer = undefined;
    }
  }

  return {
    referrer,
    utm: Object.fromEntries(
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
        .map((key) => [key, params.get(key)])
        .filter(([, value]) => value && SAFE_ATTRIBUTION_VALUE.test(value))
    ),
  };
};

export const flushAnalytics = async () => {
  if (flushInProgress || queue.length === 0) return;

  flushInProgress = true;
  const events = queue.splice(0, BATCH_SIZE);
  persistQueue();

  try {
    const response = await fetch(API_ENDPOINTS.analyticsEvents, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({ events }),
      keepalive: true,
    });

    if (!response.ok) throw new Error(`Analytics request failed: ${response.status}`);
  } catch {
    queue = [...events, ...queue].slice(0, MAX_QUEUE_SIZE);
    persistQueue();
  } finally {
    flushInProgress = false;
  }

  if (queue.length >= BATCH_SIZE) void flushAnalytics();
};

export const trackEvent = (eventName, properties = {}) => {
  try {
    const identity = getIdentityContext();
    const attribution = getAttribution();
    const event = {
      eventId: crypto.randomUUID(),
      eventName,
      occurredAt: Date.now(),
      schemaVersion: SCHEMA_VERSION,
      anonymousUserId: identity.anonymousUserId,
      sessionId: identity.sessionId,
      installId: identity.installId,
      platform: identity.platform,
      appVersion: identity.appVersion,
      language: getAppLanguage(),
      timeZone: getTimeZone(),
      referrer: attribution.referrer,
      utm: attribution.utm,
      properties: sanitizeProperties(properties),
    };

    queue.push(event);
    queue = queue.slice(-MAX_QUEUE_SIZE);
    persistQueue();

    if (queue.length >= BATCH_SIZE) void flushAnalytics();
  } catch {
    // Tracking is intentionally non-blocking.
  }
};

export const initializeAnalytics = () => {
  if (initialized) return;
  initialized = true;
  loadQueue();

  flushTimer = window.setInterval(() => void flushAnalytics(), FLUSH_INTERVAL_MS);
  window.addEventListener('pagehide', flushAnalytics);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flushAnalytics();
  });

  if (queue.length > 0) void flushAnalytics();
};

export const stopAnalytics = () => {
  if (flushTimer) window.clearInterval(flushTimer);
  initialized = false;
};

export const clearAnalyticsQueue = () => {
  queue = [];
  try {
    sessionStorage.removeItem(QUEUE_KEY);
  } catch {
    // Local cleanup should never block an already-successful server deletion.
  }
};
