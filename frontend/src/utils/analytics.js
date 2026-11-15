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
// After a failed send, wait before the next attempt, doubling up to the cap.
// Without this a failing batch was retried immediately and forever: on
// 2026-11-12/15 one client sent ~10 `OPTIONS /analytics/events` per second
// for hours (~500k requests, the account's whole monthly budget).
const RETRY_BASE_MS = 5000;
const RETRY_MAX_MS = 5 * 60 * 1000;
// TASK-200: the `token` match here also (deliberately) catches
// challenge_token, not just auth/access/jwt tokens - a Duel invite token is
// a shareable-but-non-enumerable identifier, same privacy class as
// room_code/public_id below, so it must never appear in analytics
// properties either. Decided 2026-09-02: stays excluded, not promoted to an
// allowed key.
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
let retryDelayMs = 0;
let nextAttemptAt = 0;

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

// `keepalive` only when the page is going away: it is what lets that last
// request outlive the page, and everywhere else it only adds the browser's
// 64 KB in-flight body limit as one more way for a send to fail.
export const flushAnalytics = async ({ keepalive = false } = {}) => {
  if (flushInProgress || queue.length === 0) return;
  if (Date.now() < nextAttemptAt) return;

  flushInProgress = true;
  const events = queue.splice(0, BATCH_SIZE);
  persistQueue();
  let sent = false;

  try {
    const response = await fetch(API_ENDPOINTS.analyticsEvents, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({ events }),
      keepalive,
    });

    // A 4xx other than 429 is a rejection (e.g. schema validation) that will
    // never succeed on retry - requeueing it would block every later event
    // in this session behind a batch that can never be flushed. Only retry
    // what retrying can plausibly fix: rate limiting and transient/server
    // failures (thrown below, caught alongside network errors).
    if (!response.ok && (response.status === 429 || response.status >= 500)) {
      throw new Error(`Analytics request failed: ${response.status}`);
    }
    sent = true;
    retryDelayMs = 0;
    nextAttemptAt = 0;
  } catch {
    queue = [...events, ...queue].slice(0, MAX_QUEUE_SIZE);
    persistQueue();
    retryDelayMs = retryDelayMs ? Math.min(retryDelayMs * 2, RETRY_MAX_MS) : RETRY_BASE_MS;
    nextAttemptAt = Date.now() + retryDelayMs;
  } finally {
    flushInProgress = false;
  }

  // Drain a backlog right away only while sends succeed; after a failure the
  // next attempt waits for the backoff window above.
  if (sent && queue.length >= BATCH_SIZE) void flushAnalytics({ keepalive });
};

const flushOnLeave = () => void flushAnalytics({ keepalive: true });

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
  window.addEventListener('pagehide', flushOnLeave);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushOnLeave();
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
