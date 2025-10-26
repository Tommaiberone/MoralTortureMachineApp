// Utility for tracking seen dilemmas in localStorage

const SEEN_DILEMMAS_KEY = 'mtm_seen_dilemmas';

/**
 * Get the list of seen dilemma IDs for the current language
 * @param {string} language - Language code (e.g., 'en', 'it')
 * @returns {string[]} Array of seen dilemma IDs
 */
export const getSeenDilemmas = (language) => {
  try {
    const data = localStorage.getItem(SEEN_DILEMMAS_KEY);
    if (!data) return [];

    const seenDilemmasMap = JSON.parse(data);
    return seenDilemmasMap[language] || [];
  } catch (error) {
    console.error('Error reading seen dilemmas:', error);
    return [];
  }
};

/**
 * Mark a dilemma as seen for the current language
 * @param {string} dilemmaId - The dilemma ID to mark as seen
 * @param {string} language - Language code (e.g., 'en', 'it')
 */
export const markDilemmaAsSeen = (dilemmaId, language) => {
  try {
    const data = localStorage.getItem(SEEN_DILEMMAS_KEY);
    const seenDilemmasMap = data ? JSON.parse(data) : {};

    if (!seenDilemmasMap[language]) {
      seenDilemmasMap[language] = [];
    }

    // Add to seen list if not already there
    if (!seenDilemmasMap[language].includes(dilemmaId)) {
      seenDilemmasMap[language].push(dilemmaId);
      localStorage.setItem(SEEN_DILEMMAS_KEY, JSON.stringify(seenDilemmasMap));
    }
  } catch (error) {
    console.error('Error marking dilemma as seen:', error);
  }
};

/**
 * Clear seen dilemmas for a specific language or all languages
 * @param {string|null} language - Language code to clear, or null to clear all
 */
export const clearSeenDilemmas = (language = null) => {
  try {
    if (language === null) {
      // Clear all languages
      localStorage.removeItem(SEEN_DILEMMAS_KEY);
    } else {
      // Clear specific language
      const data = localStorage.getItem(SEEN_DILEMMAS_KEY);
      if (data) {
        const seenDilemmasMap = JSON.parse(data);
        delete seenDilemmasMap[language];
        localStorage.setItem(SEEN_DILEMMAS_KEY, JSON.stringify(seenDilemmasMap));
      }
    }
  } catch (error) {
    console.error('Error clearing seen dilemmas:', error);
  }
};

/**
 * Get the count of seen dilemmas for a specific language
 * @param {string} language - Language code (e.g., 'en', 'it')
 * @returns {number} Number of seen dilemmas
 */
export const getSeenDilemmasCount = (language) => {
  return getSeenDilemmas(language).length;
};

/**
 * Check if a dilemma has been seen
 * @param {string} dilemmaId - The dilemma ID to check
 * @param {string} language - Language code (e.g., 'en', 'it')
 * @returns {boolean} True if the dilemma has been seen
 */
export const hasDilemmaBeenSeen = (dilemmaId, language) => {
  const seenDilemmas = getSeenDilemmas(language);
  return seenDilemmas.includes(dilemmaId);
};
