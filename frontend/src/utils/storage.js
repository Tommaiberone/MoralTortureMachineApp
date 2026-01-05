/**
 * Mobile Preferences Storage
 * Wrapper per Capacitor Preferences che funziona anche sul web (fallback a localStorage)
 */

import { Preferences } from '@capacitor/preferences';
import { isNativePlatform } from './platform';

/**
 * Salva un valore nelle preferences
 */
export const setPreference = async (key, value) => {
  if (isNativePlatform()) {
    await Preferences.set({
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
    });
  } else {
    // Fallback a localStorage per web
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
};

/**
 * Recupera un valore dalle preferences
 */
export const getPreference = async (key) => {
  if (isNativePlatform()) {
    const { value } = await Preferences.get({ key });
    return value;
  } else {
    // Fallback a localStorage per web
    return localStorage.getItem(key);
  }
};

/**
 * Rimuovi un valore dalle preferences
 */
export const removePreference = async (key) => {
  if (isNativePlatform()) {
    await Preferences.remove({ key });
  } else {
    localStorage.removeItem(key);
  }
};

/**
 * Pulisci tutte le preferences
 */
export const clearPreferences = async () => {
  if (isNativePlatform()) {
    await Preferences.clear();
  } else {
    localStorage.clear();
  }
};

/**
 * Ottieni tutte le chiavi salvate
 */
export const getAllPreferenceKeys = async () => {
  if (isNativePlatform()) {
    const { keys } = await Preferences.keys();
    return keys;
  } else {
    return Object.keys(localStorage);
  }
};

// Utility per salvare/recuperare oggetti JSON
export const setJSONPreference = async (key, object) => {
  await setPreference(key, JSON.stringify(object));
};

export const getJSONPreference = async (key) => {
  const value = await getPreference(key);
  if (!value) return null;
  
  try {
    return JSON.parse(value);
  } catch (e) {
    console.error('Error parsing JSON from preferences:', e);
    return null;
  }
};
