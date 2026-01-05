# 🚀 Quick Deployment Checklist - Android

Checklist rapida per deployare l'app Android su Play Store.

## ✅ Pre-Deployment

### Codice
- [ ] Build web funziona: `pnpm build`
- [ ] Nessun `console.log` o codice debug
- [ ] API endpoint production configurato
- [ ] `capacitor.config.ts` NON ha `server.url` attivo
- [ ] Tutti i plugin Capacitor funzionano

### Android
- [ ] `versionCode` incrementato in `android/app/build.gradle`
- [ ] `versionName` aggiornato (es. "1.1.0")
- [ ] Keystore creato e configurato
- [ ] `android/key.properties` configurato (NON committato!)
- [ ] Build release funziona: `./gradlew bundleRelease`

### Testing
- [ ] App si avvia senza crash
- [ ] Tutte le schermate funzionano
- [ ] Haptic feedback funziona
- [ ] API backend risponde
- [ ] Navigazione back button Android OK
- [ ] Safe area (notch) gestita correttamente
- [ ] Splash screen + status bar OK

## 📦 Build

```bash
# 1. Build web
cd frontend
pnpm build

# 2. Sync Capacitor
pnpm android:sync

# 3. Build AAB (preferito da Google)
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

## 🏪 Play Store

### Account Setup
- [ ] Google Play Console account attivo ($25)
- [ ] App creata su Play Console
- [ ] Store listing completato (descrizioni, screenshot)
- [ ] Privacy Policy pubblicata e accessibile
- [ ] Content rating completato (IARC)
- [ ] Data safety compilato
- [ ] Target audience selezionato

### Assets
- [ ] App icon 512x512 PNG
- [ ] Feature graphic 1024x500
- [ ] Screenshot (min 2, max 8)
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)

### Upload
- [ ] AAB caricato
- [ ] Release notes scritte
- [ ] Countries/regions selezionati
- [ ] Pricing = Free
- [ ] Submit for review

## ⏱️ Timeline

- Setup iniziale: **2-3 ore**
- Build + testing: **1 giorno**
- Play Store assets: **2-4 ore**
- Google review: **1-7 giorni** (tipicamente 24-48h)
- **TOTALE: ~1-2 settimane**

## 🆘 Common Issues

**Build fails:**
- Pulisci: `./gradlew clean`
- Verifica Java 17: `java --version`
- Reinstalla dependencies: `pnpm install`

**APK non firmato:**
- Controlla `key.properties`
- Verifica path `storeFile`
- Password corrette?

**Play Store rejection:**
- Privacy Policy inaccessibile → Verifica URL
- Content rating sbagliato → Ricompila
- Screenshots mancanti → Upload minimo 2
- App crash → Test completo prima upload

## 🎉 Post-Launch

- [ ] Monitor crash reports (Play Console)
- [ ] Leggi recensioni utenti
- [ ] Pianifica aggiornamenti
- [ ] Setup analytics tracking
- [ ] Considera iOS version (Capacitor già pronto!)

---

**Quick Links:**
- [Full Android Guide](../ANDROID_GUIDE.md)
- [Capacitor Docs](../frontend/CAPACITOR_README.md)
- [Play Console](https://play.google.com/console)

Made with ❤️ and Capacitor
