/**
 * Mobile Platform Utilities
 * Rileva se l'app sta girando su mobile (Capacitor) o web
 */

import { Capacitor } from '@capacitor/core';

/**
 * Verifica se l'app sta girando su una piattaforma nativa
 */
export const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

/**
 * Verifica se l'app sta girando su Android
 */
export const isAndroid = () => {
  return Capacitor.getPlatform() === 'android';
};

/**
 * Verifica se l'app sta girando su iOS
 */
export const isIOS = () => {
  return Capacitor.getPlatform() === 'ios';
};

/**
 * Verifica se l'app sta girando sul web
 */
export const isWeb = () => {
  return Capacitor.getPlatform() === 'web';
};

/**
 * Ottieni il nome della piattaforma corrente
 */
export const getPlatform = () => {
  return Capacitor.getPlatform();
};

/**
 * Verifica se un plugin Capacitor è disponibile
 */
export const isPluginAvailable = (pluginName) => {
  return Capacitor.isPluginAvailable(pluginName);
};

/**
 * Ottieni informazioni sulla piattaforma per analytics
 */
export const getPlatformInfo = () => {
  return {
    platform: getPlatform(),
    isNative: isNativePlatform(),
    isAndroid: isAndroid(),
    isIOS: isIOS(),
    isWeb: isWeb(),
  };
};
