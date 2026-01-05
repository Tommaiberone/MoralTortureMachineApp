/**
 * Mobile Native Features
 * Gestisce funzionalità native come haptic feedback, share, etc.
 */

import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { Browser } from '@capacitor/browser';
import { isNativePlatform } from './platform';

/**
 * Vibrazione leggera (tap su bottone)
 */
export const hapticLight = async () => {
  if (isNativePlatform()) {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      console.warn('Haptics not available:', e);
    }
  }
};

/**
 * Vibrazione media (selezione)
 */
export const hapticMedium = async () => {
  if (isNativePlatform()) {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      console.warn('Haptics not available:', e);
    }
  }
};

/**
 * Vibrazione forte (azione importante)
 */
export const hapticHeavy = async () => {
  if (isNativePlatform()) {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {
      console.warn('Haptics not available:', e);
    }
  }
};

/**
 * Vibrazione di notifica (successo/errore)
 */
export const hapticNotification = async (type = 'SUCCESS') => {
  if (isNativePlatform()) {
    try {
      await Haptics.notification({ type });
    } catch (e) {
      console.warn('Haptics not available:', e);
    }
  }
};

/**
 * Condividi contenuto (native share se disponibile)
 */
export const shareContent = async (title, text, url) => {
  if (isNativePlatform()) {
    try {
      await Share.share({
        title,
        text,
        url,
        dialogTitle: 'Share your results',
      });
      return true;
    } catch (e) {
      console.error('Share failed:', e);
      return false;
    }
  } else {
    // Fallback a Web Share API se disponibile
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return true;
      } catch (e) {
        console.log('Web share cancelled or failed:', e);
        return false;
      }
    } else {
      // Fallback: copia negli appunti
      try {
        await navigator.clipboard.writeText(url || text);
        alert('Link copied to clipboard!');
        return true;
      } catch (e) {
        console.error('Clipboard write failed:', e);
        return false;
      }
    }
  }
};

/**
 * Apri URL in browser nativo (in-app browser)
 */
export const openInBrowser = async (url) => {
  if (isNativePlatform()) {
    try {
      await Browser.open({ 
        url,
        presentationStyle: 'popover',
        toolbarColor: '#1a1a1a',
      });
    } catch (e) {
      console.error('Browser open failed:', e);
      // Fallback
      window.open(url, '_blank');
    }
  } else {
    window.open(url, '_blank');
  }
};

/**
 * Chiudi browser in-app
 */
export const closeBrowser = async () => {
  if (isNativePlatform()) {
    try {
      await Browser.close();
    } catch (e) {
      console.warn('Browser close failed:', e);
    }
  }
};
