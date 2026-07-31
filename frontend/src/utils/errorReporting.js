// Privacy-safe frontend error reporting (TASK-74).
//
// Every reported event is filtered to a small, fixed set of technical fields
// before it reaches trackEvent()/the analytics pipeline:
//   error_name, error_message, error_stack, component_stack, route
// Each string is truncated to 200 characters (the analytics backend rejects,
// rather than truncates, longer property values). Nothing else is ever
// attached: no PII, auth token, dilemma/answer text, or AI output — those
// never exist in a JS Error/stack in the first place, but this keeps the
// payload deliberately minimal regardless. platform/appVersion/schemaVersion
// are attached automatically by trackEvent(), which is how a reported error
// stays correlatable to a release and platform (TASK-74 AC2).
// Reporting is best-effort: trackEvent() is already fire-and-forget and
// swallows its own errors, so a reporting failure can never affect the UX
// it is trying to describe (TASK-74 AC3).

import { trackEvent } from './analytics';

const MAX_FIELD_LENGTH = 200;

const truncate = (value) => (
  typeof value === 'string' ? value.slice(0, MAX_FIELD_LENGTH) : undefined
);

export const reportError = (error, context = {}) => {
  try {
    trackEvent('frontend_error_reported', {
      error_name: truncate(error?.name || 'Error'),
      error_message: truncate(error?.message || String(error)),
      error_stack: truncate(error?.stack),
      component_stack: truncate(context.componentStack),
      route: truncate(window.location.pathname),
    });
  } catch {
    // Reporting must never throw back into the caller's error path.
  }
};

let initialized = false;

export const initializeErrorReporting = () => {
  if (initialized) return;
  initialized = true;

  window.addEventListener('error', (event) => {
    reportError(event.error || new Error(event.message));
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    reportError(reason instanceof Error ? reason : new Error(String(reason)));
  });
};
