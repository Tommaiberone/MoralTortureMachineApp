# 📱 Moral Torture Machine - Android App Guide

Guida completa per sviluppare, testare e pubblicare l'app Android di Moral Torture Machine.

## 🏗️ Architettura

L'app Android è costruita con **Capacitor**, che permette di:
- ✅ Riutilizzare il 100% del codice React web
- ✅ Accedere a funzionalità native Android quando necessario
- ✅ Mantenere un'unica codebase per web e mobile
- ✅ Deploy automatico via GitHub Actions

```
┌─────────────────────────────────┐
│    React App (Vite + React)     │
│    Single Source of Truth       │
├─────────────────────────────────┤
│   Capacitor Native Bridge       │
├──────────────┬──────────────────┤
│   Web (PWA)  │   Android (APK)  │
│   CloudFront │   Play Store     │
└──────────────┴──────────────────┘
```

---

## 📋 Prerequisiti

### Software Necessario

1. **Node.js** v20 LTS
   ```bash
   node --version  # deve essere v20.x
   ```

2. **pnpm** (package manager)
   ```bash
   npm install -g pnpm
   pnpm --version
   ```

3. **Java JDK 17** (per build Android)
   ```bash
   java --version  # deve essere 17.x
   ```
   - Download: https://adoptium.net/

4. **Android Studio**
   - Download: https://developer.android.com/studio
   - Durante l'installazione, installa anche:
     - Android SDK
     - Android SDK Platform-Tools
     - Android SDK Build-Tools
     - Android Emulator (opzionale, per testing)

5. **Gradle** (installato automaticamente con Android Studio)

---

## 🚀 Setup Iniziale

### 1. Installa le dipendenze

```bash
cd frontend
pnpm install
```

### 2. Verifica la configurazione Capacitor

Il file `capacitor.config.ts` è già configurato:

```typescript
{
  appId: 'com.moraltorturemachine.app',
  appName: 'Moral Torture Machine',
  webDir: 'dist',
  // ...
}
```

### 3. Configura Android Studio

```bash
# Apri Android Studio e configura il progetto
pnpm android:open
```

**Primo avvio:**
1. Android Studio chiederà di installare Gradle wrapper → Accetta
2. Sincronizza il progetto (Sync Now)
3. Installa eventuali SDK mancanti (Android Studio ti guiderà)

---

## 🛠️ Sviluppo

### Build Web + Sync Android

```bash
# Build completo web → Android
pnpm android:build

# Solo sync (dopo modifiche al codice)
pnpm android:sync
```

### Sviluppo Live (Hot Reload)

**Opzione 1: Browser Desktop (consigliata per sviluppo rapido)**
```bash
pnpm dev
# Apri http://localhost:5173
```

**Opzione 2: Live Reload su dispositivo Android**

1. Trova il tuo IP locale:
   ```bash
   # Linux/Mac
   ip addr show | grep "inet " | grep -v 127.0.0.1
   
   # Output esempio: 192.168.1.100
   ```

2. Modifica `capacitor.config.ts`:
   ```typescript
   server: {
     url: 'http://192.168.1.100:5173',  // Usa il tuo IP
     cleartext: true
   }
   ```

3. Avvia dev server:
   ```bash
   pnpm dev
   ```

4. Sync e avvia Android:
   ```bash
   pnpm android:sync
   pnpm android:open
   ```

5. Run su emulatore o dispositivo fisico da Android Studio

⚠️ **Importante:** Ricorda di commentare `server.url` prima di fare il build release!

---

## 📦 Build APK

### Debug APK (per testing)

```bash
# Build web + sync + build APK debug
pnpm android:build
cd android
./gradlew assembleDebug

# APK sarà in:
# android/app/build/outputs/apk/debug/app-debug.apk
```

### Release APK (per Play Store)

#### 1. Crea Keystore (solo prima volta)

```bash
# Genera keystore per firmare l'APK
keytool -genkey -v -keystore release-key.jks \
  -alias moraltorturemachine \
  -keyalg RSA -keysize 2048 -validity 10000

# Ti chiederà:
# - Password keystore (SALVALA IN SICURO!)
# - Informazioni organizzazione
# - Password alias (può essere uguale)
```

**⚠️ IMPORTANTE:**
- Salva `release-key.jks` in un posto sicuro (NON committarlo su Git!)
- Salva le password in un password manager
- Se perdi la keystore, NON potrai più aggiornare l'app su Play Store!

#### 2. Configura Gradle per signing

Crea `android/key.properties`:

```properties
storePassword=TUA_PASSWORD_KEYSTORE
keyPassword=TUA_PASSWORD_KEY
keyAlias=moraltorturemachine
storeFile=../release-key.jks
```

**⚠️ NON committare `key.properties` su Git!**

Aggiungi a `android/.gitignore`:
```
key.properties
release-key.jks
```

#### 3. Modifica `android/app/build.gradle`

Aggiungi prima di `android {`:

```gradle
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Dentro `android { ... }`, aggiungi:

```gradle
signingConfigs {
    release {
        if (keystorePropertiesFile.exists()) {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

#### 4. Build Release APK

```bash
# Assicurati che capacitor.config.ts NON abbia server.url attivo!

# Build
pnpm build
pnpm android:sync
cd android
./gradlew assembleRelease

# APK firmato sarà in:
# android/app/build/outputs/apk/release/app-release.apk
```

#### 5. Verifica firma APK

```bash
# Verifica che l'APK sia firmato correttamente
keytool -printcert -jarfile android/app/build/outputs/apk/release/app-release.apk

# Output dovrebbe mostrare il tuo certificato
```

---

## 🎯 Testing

### Test su Emulatore

1. Apri Android Studio
2. Tools → Device Manager
3. Create Virtual Device
4. Seleziona un dispositivo (es. Pixel 6)
5. Scarica un'immagine sistema (es. Android 13)
6. Run → Run 'app'

### Test su Dispositivo Fisico

1. Abilita Developer Options sul telefono:
   - Settings → About Phone
   - Tap 7 volte su "Build Number"

2. Abilita USB Debugging:
   - Settings → Developer Options → USB Debugging

3. Collega il telefono via USB

4. Verifica connessione:
   ```bash
   adb devices
   # Dovresti vedere il tuo dispositivo
   ```

5. Run da Android Studio o:
   ```bash
   cd android
   ./gradlew installDebug
   ```

### Testing Checklist

- [ ] App si apre senza crash
- [ ] Status bar è configurata correttamente (dark theme)
- [ ] Navigazione tra schermate funziona
- [ ] API backend risponde correttamente
- [ ] Haptic feedback funziona (vibrazione al tap)
- [ ] Bottone back Android funziona
- [ ] App riprende correttamente dopo background
- [ ] Connessione di rete viene rilevata
- [ ] Safe area (notch) è gestita correttamente
- [ ] Rotazione schermo funziona
- [ ] Splash screen si mostra e nasconde correttamente

---

## 📤 Pubblicazione su Google Play Store

### Prerequisiti Play Console

1. **Account Google Play Console**
   - Costo: $25 (una tantum)
   - Registrazione: https://play.google.com/console/signup

2. **Documenti Richiesti**
   - Privacy Policy (URL pubblico)
   - Content rating questionnaire
   - Target audience
   - App category

### Step-by-Step Pubblicazione

#### 1. Crea l'App su Play Console

1. Login su https://play.google.com/console
2. "Create app"
3. Compila:
   - App name: "Moral Torture Machine"
   - Default language: English (UK) / Italian
   - App or game: Game
   - Free or paid: Free

#### 2. Store Listing

**Testi richiesti:**

- **Short description** (80 chars):
  ```
  Explore ethical dilemmas and discover your moral compass through AI-powered scenarios
  ```

- **Full description** (4000 chars):
  ```
  🎭 Moral Torture Machine

  Dive into a dark, thought-provoking experience where you face impossible ethical dilemmas. 
  Each choice reveals a piece of your moral compass.

  ✨ FEATURES:
  • AI-powered infinite dilemmas
  • Story mode with branching narratives
  • Pass-the-phone multiplayer mode
  • Detailed moral profile analysis
  • Dark, atmospheric retro interface
  • Available in English and Italian

  📊 YOUR MORAL PROFILE:
  Discover your scores across six moral dimensions:
  - Empathy
  - Integrity
  - Responsibility
  - Justice
  - Altruism
  - Honesty

  🎮 GAME MODES:
  • Evaluation Mode: Complete structured moral tests
  • Story Mode: Experience interactive ethical narratives
  • Pass the Phone: Multiplayer local mode

  Are you ready to face your choices?

  ⚠️ Contains mature themes and ethical dilemmas
  🌐 Requires internet connection for AI features
  ```

**Screenshot (minimo 2, massimo 8):**
- Dimensioni: 1080x1920 (portrait) o 1920x1080 (landscape)
- Formato: PNG o JPG
- Cattura screenshot da emulatore o dispositivo

**App icon:**
- 512x512 PNG
- 32-bit con alpha

**Feature graphic:**
- 1024x500 PNG/JPG
- Immagine hero per lo store

#### 3. Content Rating

1. Vai a "Content rating"
2. Compila questionario IARC
3. Per Moral Torture Machine:
   - Violence: No
   - Sexual content: No
   - Language: Mild
   - Controlled substances: No
   - Discrimination: Discussed in context
   - Rating previsto: PEGI 12 / ESRB Teen

#### 4. App Content

- **Privacy Policy URL**: 
  ```
  https://moraltorturemachine.com/privacy
  ```
  (Devi creare questa pagina!)

- **Target audience**: 
  - Age: 13+ / Teen

- **Ads**: 
  - No (se non hai ads)

- **Data safety**:
  - Compila quali dati raccogli:
    - Session IDs (per analytics)
    - Scelte dell'utente (anonimizzate)
    - Non raccogli dati personali identificabili

#### 5. Pricing & Distribution

- **Countries**: Tutti (o seleziona specifici)
- **Primarily child-directed**: No
- **Contains ads**: No
- **Content guidelines**: Accetta
- **US export laws**: Accetta

#### 6. Carica APK/AAB

**⚠️ Google preferisce AAB (Android App Bundle) invece di APK**

**Build AAB:**
```bash
cd android
./gradlew bundleRelease

# AAB sarà in:
# android/app/build/outputs/bundle/release/app-release.aab
```

**Carica su Play Console:**
1. Production → Create new release
2. Upload `app-release.aab`
3. Aggiungi release notes:
   ```
   Initial release of Moral Torture Machine
   
   Features:
   - AI-powered ethical dilemmas
   - Story mode with branching narratives
   - Moral profile analysis
   - Multilingual support (EN/IT)
   ```

4. Review release → Start rollout to Production

#### 7. Review

- Google Review: 1-7 giorni (tipicamente 24-48h)
- Riceverai email quando:
  - App è in review
  - App è approved
  - App è published

**Motivi comuni di rifiuto:**
- Privacy Policy mancante/non accessibile
- Content rating non corretto
- Screenshots non rappresentativi
- Descrizione fuorviante
- Crash all'avvio

---

## 🔧 Troubleshooting

### Build Errors

**Errore: "SDK not found"**
```bash
# Apri Android Studio
# Tools → SDK Manager
# Installa Android SDK 33 (o latest)
```

**Errore: "Gradle sync failed"**
```bash
cd android
./gradlew clean
./gradlew build
```

**Errore: "Java version incompatible"**
```bash
# Assicurati di usare Java 17
java --version

# Se diverso, installa Java 17 e imposta JAVA_HOME
export JAVA_HOME=/path/to/java17
```

### Runtime Errors

**App crash all'avvio**
- Controlla logcat in Android Studio
- Verifica che `dist/` sia popolato prima di sync
- Controlla che non ci siano errori nel codice web

**API non raggiungibile**
- Verifica URL API in `capacitor.config.ts`
- Controlla CORS nel backend (aggiungi `capacitor://localhost`)
- Verifica connessione internet del dispositivo

**Splash screen non si nasconde**
- Verifica che `initializeMobileFeatures()` sia chiamato in `main.jsx`
- Controlla console per errori

### GitHub Actions Errors

**APK build fails**
- Verifica che tutti i plugin siano installati
- Controlla versione Java (deve essere 17)
- Verifica che `pnpm build` funzioni localmente

---

## 📊 Monitoraggio

### Analytics

L'app traccia automaticamente eventi tramite il backend esistente:
- `platform: 'android'` viene inviato nelle richieste API
- User agent: contiene "Capacitor"

### Crash Reporting (Opzionale)

Per monitorare crash in produzione, aggiungi:

```bash
pnpm add @capacitor-community/firebase-crashlytics
```

Configurazione in `capacitor.config.ts`:
```typescript
plugins: {
  FirebaseCrashlytics: {
    enabled: true,
  }
}
```

---

## 🔄 Aggiornamenti

### Update Web → Android

1. Modifica codice React
2. Build:
   ```bash
   pnpm build
   pnpm android:sync
   ```
3. Test su emulatore
4. Commit e push → GitHub Actions build automaticamente

### Update Play Store

1. Incrementa versionCode in `android/app/build.gradle`:
   ```gradle
   versionCode 2  // era 1
   versionName "1.1.0"  // era "1.0.0"
   ```

2. Build release AAB
3. Upload su Play Console
4. Submit for review

**Versioning:**
- `versionCode`: intero incrementale (1, 2, 3...)
- `versionName`: semantic versioning (1.0.0, 1.1.0, 2.0.0)

---

## 📱 Best Practices

### Performance

- ✅ Lazy load componenti React
- ✅ Ottimizza immagini (WebP)
- ✅ Minimizza bundle size
- ✅ Cache API responses
- ✅ Use Capacitor Storage per dati persistenti

### UX Mobile

- ✅ Target touch: minimo 44x44px
- ✅ Gestisci safe area (notch)
- ✅ Haptic feedback per interazioni importanti
- ✅ Loading states chiari
- ✅ Offline mode (graceful degradation)
- ✅ Back button Android funzionante

### Security

- ✅ HTTPS only (già configurato in Capacitor)
- ✅ Non salvare dati sensibili in Preferences
- ✅ Valida input utente
- ✅ Proteggi API keys (usa backend come proxy)

---

## 🆘 Support

**Documentazione:**
- Capacitor: https://capacitorjs.com/docs
- Android: https://developer.android.com/docs
- Play Console: https://support.google.com/googleplay/android-developer

**Issues comuni:**
- Check GitHub Actions logs
- Android Studio Logcat
- Browser DevTools (per debugging web)

---

## ✅ Checklist Pre-Release

### Tecnica
- [ ] Build release APK/AAB funziona
- [ ] App è firmata con release keystore
- [ ] versionCode e versionName aggiornati
- [ ] Nessun console.log/debug code
- [ ] API endpoint production configurato
- [ ] Capacitor config NON ha `server.url` attivo
- [ ] Tutti i test passano

### Store
- [ ] Account Play Console attivo
- [ ] Privacy Policy pubblicata e accessibile
- [ ] Screenshot (minimo 2)
- [ ] App icon 512x512
- [ ] Feature graphic 1024x500
- [ ] Descrizioni complete (short + full)
- [ ] Content rating completato
- [ ] Data safety compilato

### Legal
- [ ] Privacy Policy conforme GDPR
- [ ] Terms of Service (se applicabile)
- [ ] Content appropriato (no hate speech, violence, etc.)
- [ ] Copyright cleared per tutti gli asset

---

## 🎉 Prossimi Step

Dopo pubblicazione:
1. Monitor crash reports
2. Raccogli feedback utenti (reviews)
3. Pianifica aggiornamenti
4. Considera iOS version (Capacitor già pronto!)

**Stima tempo totale:**
- Setup iniziale: 2-3 ore
- Testing completo: 1-2 giorni
- Play Store submission: 2-7 giorni (review Google)
- **Totale: ~1-2 settimane** (dalla configurazione alla pubblicazione)

---

Made with ❤️ using Capacitor + React + Vite
