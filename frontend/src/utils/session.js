// Session management utility for analytics tracking

/**
 * Get or create a unique session ID for analytics tracking
 * @returns {string} Session ID (UUID v4)
 */
export const getSessionId = () => {
  const SESSION_KEY = 'mtm_session_id';

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
 * Get headers for API requests including session tracking
 * @returns {Object} Headers object with session ID
 */
export const getApiHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'X-Session-Id': getSessionId()
  };
};

/**
 * Clear the current session (useful for testing or logout)
 */
export const clearSession = () => {
  sessionStorage.removeItem('mtm_session_id');
};
