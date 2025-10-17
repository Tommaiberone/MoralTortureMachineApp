# Google AdSense - Guida alla Configurazione

## 1. Configurazione Account AdSense

### Registrazione
1. Vai su [Google AdSense](https://www.google.com/adsense/)
2. Accedi con il tuo account Google
3. Inserisci i dettagli del tuo sito web
4. Completa la verifica del sito

### Ottenere il Publisher ID
1. Accedi al tuo account AdSense
2. Vai su **Account** → **Informazioni account**
3. Copia il tuo **Publisher ID** (formato: `ca-pub-XXXXXXXXXXXXXXXX`)

## 2. Configurazione dell'Applicazione

### Variabili d'ambiente
1. Crea un file `.env` nella cartella `/web/` copiando `.env.example`:
   ```bash
   cp web/.env.example web/.env
   ```

2. Modifica il file `.env` e sostituisci i valori:
   ```env
   VITE_ADSENSE_CLIENT=ca-pub-TUOPUBLISHERID
   VITE_ADSENSE_SLOT_HOME=1234567890
   VITE_ADSENSE_SLOT_TUTORIAL=0987654321
   VITE_ADSENSE_SLOT_RESULTS=1122334455
   ```

### Aggiornare l'index.html
Modifica il file `/web/index.html` e sostituisci `ca-pub-XXXXXXXXXXXXXXXX` con il tuo Publisher ID:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-TUOPUBLISHERID"
     crossorigin="anonymous"></script>
```

## 3. Creare Slot Pubblicitari

### Nel pannello AdSense
1. Vai su **Annunci** → **Panoramica**
2. Clicca su **Per sito**
3. Crea nuovi annunci per ogni posizione:
   - **Home Banner**: Annuncio responsive display
   - **Tutorial Banner**: Annuncio responsive display
   - **Results Banner**: Annuncio responsive display

4. Per ogni annuncio creato, copia l'**Ad slot ID** (numero di 10 cifre)
5. Inserisci gli ID nel file `.env`

### Tipi di annunci consigliati
- **Display Ads**: Formato automatico, si adatta al contenitore
- **In-feed Ads**: Per contenuti dinamici
- **In-article Ads**: Per articoli/contenuti lunghi
- **Matched Content**: Per suggerimenti di contenuti correlati

## 4. Posizionamento degli Annunci

### Posizioni attuali
Gli annunci sono stati integrati nelle seguenti schermate:

1. **HomeScreen** ([HomeScreen.jsx:65-69](web/src/screens/HomeScreen.jsx#L65-L69))
   - Banner inferiore dopo il footer warning
   - Formato: responsive auto

2. **ResultsScreen** ([ResultsScreen.jsx:173-178](web/src/screens/ResultsScreen.jsx#L173-L178))
   - Banner inferiore dopo i pulsanti di condivisione
   - Formato: responsive auto

### Aggiungere annunci ad altre schermate
Per aggiungere annunci ad altre schermate:

```jsx
import AdSense from '../components/AdSense';

// Nel componente
<AdSense
  slot="1234567890"  // Sostituisci con il tuo slot ID
  format="auto"
  responsive={true}
/>
```

## 5. Privacy e GDPR

### Conformità GDPR (Obbligatorio per utenti UE)

Se hai utenti nell'Unione Europea, **devi implementare un sistema di consenso ai cookie**.

#### Opzione 1: Usare Google Consent Mode v2
```bash
npm install @consent-mode/core
```

Aggiungi in `index.html` prima dello script AdSense:
```html
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}

  // Default consent to 'denied' as a placeholder
  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied'
  });
</script>
```

#### Opzione 2: Usare una libreria di cookie banner
Librerie consigliate:
- [CookieConsent](https://github.com/orestbida/cookieconsent)
- [react-cookie-consent](https://www.npmjs.com/package/react-cookie-consent)
- [cookiebot](https://www.cookiebot.com/)

Esempio con `react-cookie-consent`:
```bash
npm install react-cookie-consent
```

In `App.jsx`:
```jsx
import CookieConsent from "react-cookie-consent";

<CookieConsent
  location="bottom"
  buttonText="Accetto"
  cookieName="moralTortureMachineCookie"
  style={{ background: "#2B373B" }}
  buttonStyle={{ color: "#4e503b", fontSize: "13px" }}
  expires={150}
>
  Questo sito utilizza cookie per migliorare l'esperienza utente e mostrare annunci personalizzati.
</CookieConsent>
```

### Privacy Policy
**IMPORTANTE**: Devi creare una Privacy Policy che includa:
- Uso di Google AdSense e cookie pubblicitari
- Raccolta dati degli utenti
- Diritti degli utenti (GDPR)
- Link alla Privacy Policy di Google

Template Privacy Policy:
- [PrivacyPolicies.com](https://www.privacypolicies.com/)
- [Termly](https://termly.io/products/privacy-policy-generator/)

## 6. Test e Verifica

### Modalità di test AdSense
1. Durante lo sviluppo, gli annunci potrebbero non comparire subito
2. Google richiede alcune ore per approvare il sito
3. Usa Chrome DevTools per verificare che lo script sia caricato

### Verificare l'integrazione
```bash
# Avvia l'app in sviluppo
cd web
npm run dev
```

Apri la Console del browser (F12) e verifica:
- Nessun errore JavaScript
- Script AdSense caricato correttamente
- `window.adsbygoogle` è definito

### Testare con annunci reali
**ATTENZIONE**: Non cliccare mai sui tuoi annunci! Google potrebbe bannarti.

Per testare:
1. Usa la modalità incognito
2. Chiedi a un amico di verificare
3. Usa [Google Publisher Toolbar](https://chrome.google.com/webstore/detail/google-publisher-toolbar/omioeahgfecgfpfldejlnideemfidekk)

## 7. Ottimizzazione

### Best Practices
1. **Posizionamento**: Metti gli annunci dove l'utente li vede naturalmente
2. **Non esagerare**: Max 3 annunci per pagina
3. **Responsive**: Usa sempre annunci responsive
4. **Above the fold**: Evita troppi annunci nella parte superiore
5. **User Experience**: Gli annunci non devono interferire con la navigazione

### Formati consigliati per schermate specifiche
- **HomeScreen**: Banner 728x90 (desktop) o 320x50 (mobile)
- **ResultsScreen**: Large Rectangle 336x280
- **Tutorial**: Inline Rectangle 300x250

### Monitoraggio performance
1. Accedi al pannello AdSense
2. Vai su **Report**
3. Monitora:
   - Impressioni
   - Click-through rate (CTR)
   - Entrate per mille impressioni (RPM)
   - Entrate totali

### A/B Testing
Prova diverse posizioni e formati per massimizzare le entrate:
- Testa annunci in alto vs in basso
- Prova diversi formati (banner, rectangle, etc.)
- Monitora quali schermate generano più revenue

## 8. Risoluzione Problemi

### Gli annunci non compaiono
1. **Verifica il Publisher ID**: Assicurati sia corretto
2. **Controlla la console**: Cerca errori JavaScript
3. **Attendi l'approvazione**: Google può richiedere 24-48 ore
4. **Verifica il sito**: Il dominio deve essere verificato su AdSense
5. **Controlla AdBlock**: Disabilita gli ad blocker durante i test

### Errori comuni
```
Error: adsbygoogle.push() error: No slot size for availableWidth
```
Soluzione: Assicurati che il contenitore dell'annuncio abbia una larghezza definita

```
Error: This site has been marked as a deceptive site
```
Soluzione: Verifica su Google Search Console se ci sono problemi di sicurezza

### Violazioni delle policy
Evita:
- Incoraggiare i click sugli annunci
- Nascondere annunci o renderli clickabili accidentalmente
- Posizionare annunci troppo vicini a pulsanti interattivi
- Contenuti vietati (violenza estrema, contenuti per adulti, etc.)

## 9. Deployment

### Prima del deployment
1. ✅ Verifica che `.env` sia in `.gitignore`
2. ✅ Configura le variabili d'ambiente su Vercel/Netlify
3. ✅ Aggiungi il dominio di produzione su AdSense
4. ✅ Implementa il cookie consent
5. ✅ Crea la Privacy Policy

### Configurazione su Vercel
```bash
vercel env add VITE_ADSENSE_CLIENT
vercel env add VITE_ADSENSE_SLOT_HOME
vercel env add VITE_ADSENSE_SLOT_TUTORIAL
vercel env add VITE_ADSENSE_SLOT_RESULTS
```

### Configurazione su Netlify
Vai su **Site settings** → **Build & deploy** → **Environment** e aggiungi:
- `VITE_ADSENSE_CLIENT`
- `VITE_ADSENSE_SLOT_HOME`
- `VITE_ADSENSE_SLOT_TUTORIAL`
- `VITE_ADSENSE_SLOT_RESULTS`

## 10. Riferimenti

### Documentazione ufficiale
- [Google AdSense Help Center](https://support.google.com/adsense/)
- [AdSense Program Policies](https://support.google.com/adsense/answer/48182)
- [AdSense Implementation Guide](https://support.google.com/adsense/answer/9274019)

### Strumenti utili
- [Google Publisher Toolbar](https://chrome.google.com/webstore/detail/google-publisher-toolbar/omioeahgfecgfpfldejlnideemfidekk)
- [PageSpeed Insights](https://pagespeed.web.dev/) - Verifica impatto performance
- [AdSense Policy Center](https://www.google.com/adsense/new/u/0/pub-0000000000000000/main/policy) - Monitora violazioni

---

## Checklist Finale

Dopo aver completato la configurazione:

- [ ] Publisher ID inserito in `index.html`
- [ ] File `.env` creato con tutti gli slot ID
- [ ] Annunci creati nel pannello AdSense
- [ ] Cookie consent implementato (GDPR)
- [ ] Privacy Policy creata e pubblicata
- [ ] Sito verificato su AdSense
- [ ] Test effettuati in sviluppo
- [ ] Variabili d'ambiente configurate in produzione
- [ ] Deploy effettuato con successo
- [ ] Annunci visibili sul sito live

---

**Nota finale**: Gli annunci AdSense possono richiedere alcuni giorni per iniziare a mostrare annunci rilevanti. Sii paziente e monitora regolarmente il pannello AdSense per statistiche e problemi.
