# 🚀 Capacitor Mobile Setup

Quick reference per sviluppare l'app mobile con Capacitor.

## 📦 Scripts NPM Disponibili

### Sviluppo
```bash
pnpm dev              # Dev server web (localhost:5173)
pnpm build            # Build production web
```

### Android
```bash
pnpm android:sync     # Sync web → Android (dopo modifiche)
pnpm android:build    # Build web + sync Android
pnpm android:open     # Apri Android Studio
pnpm android:run      # Build + open (full cycle)
pnpm android:release  # Build APK release
pnpm android:clean    # Pulisci build Android
```

### Capacitor
```bash
pnpm capacitor:update # Aggiorna Capacitor alla latest
```

## 🛠️ Workflow Tipico

### Prima volta
```bash
pnpm install
pnpm android:build    # Build web + sync
pnpm android:open     # Apri Android Studio
# Da Android Studio: Run → Run 'app'
```

### Dopo modifiche al codice
```bash
# Opzione 1: Solo sync (veloce)
pnpm android:sync
# Poi riavvia app in Android Studio

# Opzione 2: Full rebuild
pnpm android:build
```

### Live reload (sviluppo)
```bash
# 1. Avvia dev server
pnpm dev

# 2. In un altro terminale, trova il tuo IP
ip addr show | grep "inet "
# Esempio output: 192.168.1.100

# 3. Modifica capacitor.config.ts:
server: {
  url: 'http://192.168.1.100:5173',
  cleartext: true
}

# 4. Sync e run
pnpm android:sync
pnpm android:open
# Run da Android Studio
```

⚠️ **Ricorda di commentare `server.url` prima del build release!**

## 📱 Componenti e Utilities

### Platform Detection
```javascript
import { isNativePlatform, isAndroid, isWeb } from './utils/platform';

if (isNativePlatform()) {
  // Codice solo per app nativa
}
```

### Storage (cross-platform)
```javascript
import { setPreference, getPreference } from './utils/storage';

// Funziona sia su web (localStorage) che native (Capacitor Preferences)
await setPreference('key', 'value');
const value = await getPreference('key');
```

### Native Features
```javascript
import { 
  hapticLight, 
  hapticMedium, 
  shareContent 
} from './utils/nativeFeatures';

// Haptic feedback (vibrazione)
await hapticLight();

// Native share dialog
await shareContent('Title', 'Text', 'https://url.com');
```

### Mobile Lifecycle Hooks
```javascript
import { 
  useMobileLifecycle,
  useAndroidBackButton 
} from './hooks/useMobileLifecycle';

// Nel tuo componente
useMobileLifecycle({
  onAppStateChange: (isActive) => {
    console.log('App is', isActive ? 'active' : 'background');
  },
  onNetworkChange: (connected, type) => {
    console.log('Network:', connected, type);
  }
});

// Gestisci back button Android
useAndroidBackButton((canGoBack) => {
  if (canGoBack) {
    navigate(-1);
  } else {
    // Esci dall'app
    App.exitApp();
  }
});
```

### Mobile-Aware Button
```javascript
import MobileButton from './components/MobileButton';

// Button con haptic feedback automatico
<MobileButton 
  onClick={handleClick}
  haptic="medium"  // 'light' | 'medium' | 'none'
>
  Click me!
</MobileButton>
```

## 🔧 Configurazione

### capacitor.config.ts
```typescript
{
  appId: 'com.moraltorturemachine.app',  // Package ID Android
  appName: 'Moral Torture Machine',      // Nome app
  webDir: 'dist',                         // Output Vite build
  
  server: {
    androidScheme: 'https',               // Usa HTTPS in production
    // Per dev, decommenta:
    // url: 'http://192.168.1.X:5173',
    // cleartext: true
  },
  
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a1a',
      // ...
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a1a1a',
    }
  }
}
```

### Android Manifest
- Permessi configurati in `android/app/src/main/AndroidManifest.xml`
- Permissions già aggiunte:
  - `INTERNET` (obbligatorio)
  - `ACCESS_NETWORK_STATE`
  - `VIBRATE`

### Backend CORS
Assicurati che il backend accetti richieste da Capacitor:

```python
# backend/backend_fastapi.py
allow_origins=[
    "https://moraltorturemachine.com",
    "capacitor://localhost",  # ← Aggiungi questo!
    "ionic://localhost",
    "file://",
]
```

## 🎨 UI Adaptations

### Safe Area (Notch Support)
CSS già configurato in `index.css`:
```css
:root {
  --safe-area-inset-top: env(safe-area-inset-top, 0px);
  --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
}

body {
  padding-top: var(--safe-area-inset-top);
  padding-bottom: var(--safe-area-inset-bottom);
}
```

### Status Bar
Auto-configurata all'avvio in `main.jsx`:
```javascript
import { initializeMobileFeatures } from './utils/mobileInit';

// Inizializza status bar, splash screen, etc.
initializeMobileFeatures();
```

## 🐛 Debug

### Web Browser DevTools
```bash
# Avvia dev server
pnpm dev
# Apri http://localhost:5173
# F12 per DevTools
```

### Android Studio Logcat
1. Apri Android Studio
2. Bottom panel → Logcat
3. Filtra per package: `com.moraltorturemachine.app`
4. Cerca errori JavaScript e Java

### Chrome Remote Debugging
```bash
# Con dispositivo connesso via USB
chrome://inspect
# Seleziona il tuo dispositivo e "Inspect"
```

## 📦 Build Release

### APK Debug (per testing)
```bash
pnpm android:build
cd android
./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

### APK/AAB Release (per Play Store)
```bash
# 1. Assicurati che capacitor.config.ts NON abbia server.url
# 2. Crea keystore (se prima volta - vedi ANDROID_GUIDE.md)
# 3. Configura android/key.properties
# 4. Build

pnpm build
pnpm android:sync
cd android
./gradlew bundleRelease  # AAB (preferito da Google)
# o
./gradlew assembleRelease  # APK

# Output:
# AAB: android/app/build/outputs/bundle/release/app-release.aab
# APK: android/app/build/outputs/apk/release/app-release.apk
```

## 🔄 GitHub Actions

L'app Android viene builddata automaticamente su ogni push a `main`:
- Job: `android-build`
- Output: APK debug disponibile come artifact
- Download da: Actions → Run → Artifacts

Per build release, devi configurare secrets:
```yaml
# .github/workflows/deploy.yml
# Aggiungi secrets:
# - ANDROID_KEYSTORE_BASE64
# - ANDROID_KEYSTORE_PASSWORD
# - ANDROID_KEY_ALIAS
# - ANDROID_KEY_PASSWORD
```

## 📚 Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Guide completa](../ANDROID_GUIDE.md)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)

## ⚠️ Common Pitfalls

1. **Dimenticare `android:sync` dopo modifiche**
   - Soluzione: Sempre run `pnpm android:sync` dopo modifiche al codice

2. **`server.url` attivo in production**
   - Soluzione: Commenta sempre per build release!

3. **CORS errors**
   - Soluzione: Aggiungi `capacitor://localhost` al backend

4. **Splash screen non si nasconde**
   - Soluzione: Verifica che `initializeMobileFeatures()` sia chiamato

5. **APK non firmato**
   - Soluzione: Configura `key.properties` e keystore

---

Happy mobile development! 📱✨
