/**
 * Mobile Status Bar & Splash Screen Manager
 * Gestisce status bar e splash screen per l'app mobile
 */

import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { isNativePlatform, isAndroid } from './platform';

/**
 * Configura la status bar al caricamento dell'app
 */
export const setupStatusBar = async () => {
  if (!isNativePlatform()) return;

  try {
    // Imposta stile dark (testo bianco)
    await StatusBar.setStyle({ style: Style.Dark });
    
    // Imposta colore di sfondo
    await StatusBar.setBackgroundColor({ color: '#1a1a1a' });
    
    // Mostra la status bar
    await StatusBar.show();
  } catch (e) {
    console.warn('StatusBar setup failed:', e);
  }
};

/**
 * Cambia stile della status bar (light/dark)
 */
export const setStatusBarStyle = async (isDark = true) => {
  if (!isNativePlatform()) return;

  try {
    await StatusBar.setStyle({ 
      style: isDark ? Style.Dark : Style.Light 
    });
  } catch (e) {
    console.warn('StatusBar style change failed:', e);
  }
};

/**
 * Nascondi splash screen
 */
export const hideSplashScreen = async () => {
  if (!isNativePlatform()) return;

  try {
    await SplashScreen.hide();
  } catch (e) {
    console.warn('SplashScreen hide failed:', e);
  }
};

/**
 * Mostra splash screen
 */
export const showSplashScreen = async () => {
  if (!isNativePlatform()) return;

  try {
    await SplashScreen.show({
      showDuration: 2000,
      autoHide: true,
    });
  } catch (e) {
    console.warn('SplashScreen show failed:', e);
  }
};

/**
 * Setup iniziale completo per mobile
 */
export const initializeMobileFeatures = async () => {
  if (!isNativePlatform()) return;

  console.log('Initializing mobile features...');
  
  // Setup status bar
  await setupStatusBar();
  
  // Nascondi splash screen dopo un piccolo delay
  setTimeout(async () => {
    await hideSplashScreen();
  }, 1000);
  
  console.log('Mobile features initialized');
};
