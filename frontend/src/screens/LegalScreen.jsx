const pages = {
  privacy: {
    title: 'Privacy notice',
    updated: 'Last updated: 10 August 2026',
    intro: 'This notice explains how Moral Torture Machine handles data when you use the website or Android app. It is written for the current English-only product experience.',
    sections: [
      {
        heading: 'Controller and contact',
        content: (
          <p>
            The controller is Tommaso Bersani. For privacy questions, data requests, or complaints about this service, contact{' '}
            <a href="mailto:tommasobersani@gmail.com">tommasobersani@gmail.com</a>.
          </p>
        ),
      },
      {
        heading: 'Information we process',
        content: (
          <ul>
            <li><strong>Service and device data:</strong> a persistent anonymous user ID, installation ID, session ID, platform, app version, device language, time zone, referrer origin, filtered campaign parameters, technical request information, and privacy-safe first-party product events. The server never stores a raw IP address in product analytics; it can derive a short HMAC network pseudonym for abuse monitoring.</li>
            <li><strong>Account data:</strong> your Cognito subject, Cognito username, email address, and authentication status when you choose to sign in with Google. The Android app stores its sign-in session and PKCE material with Android Keystore encryption.</li>
            <li><strong>Game, profile, and social data:</strong> dilemma choices needed to run the game, derived value scores and archetype, profile metadata, Moral Duel participation, Party Room participation, and a Party display name if you provide one. A Daily Moral Crime vote is held against your anonymous ID for 90 days; after you vote, the app shows only non-linkable aggregate counts and percentages. Profiles, Duel links, and Party rooms are unlisted rather than publicly indexed: anyone who receives the relevant link or room code can see the information exposed by that shared flow.</li>
            <li><strong>AI request data:</strong> when you request a result analysis, the app sends the relevant scores, dilemma text, options, and your selected choices to Groq to generate explanatory copy. The deterministic scoring and archetype do not depend on Groq. We do not intentionally place dilemma text, answer text, or AI analysis in first-party product analytics. Groq&apos;s published inference retention can be up to 30 days for reliability and abuse monitoring unless its Zero Data Retention control is enabled.</li>
            <li><strong>Operational data:</strong> privacy-redacted route signatures, error type/status, and limited technical diagnostics used to keep the service secure and reliable.</li>
          </ul>
        ),
      },
      {
        heading: 'Why we use it and who processes it',
        content: (
          <p>
            We use this information to run the requested game, generate results and comparisons, protect the service, troubleshoot faults, and understand aggregate product use. AWS provides the backend, database, logs, and Cognito account service; Google provides the optional sign-in and, only on the web after consent, Google Analytics; Groq processes requested AI analysis. A share action is initiated by you: a recipient or external sharing platform then handles the content under its own terms. We do not sell personal data, run advertising, personalise ads, or create cross-site advertising profiles. The game does compute an in-service result/profile in order to provide the feature you asked for.
          </p>
        ),
      },
      {
        heading: 'Retention',
        content: (
          <ul>
            <li>First-party raw product analytics: <strong>90 days</strong>.</li>
            <li>Daily Moral Crime participation rows and aggregate counts: <strong>90 days</strong>.</li>
            <li>Google Analytics web event and user data: <strong>2 months</strong>; the consent choice cookie is retained for <strong>180 days</strong>.</li>
            <li>Accounts and Moral Profiles: deleted after <strong>12 months of inactivity</strong> through a daily lifecycle job. An expired profile is not served while background deletion is pending.</li>
            <li>Moral Duel records and participants: <strong>30 days</strong>.</li>
            <li>Party Rooms and participants: <strong>6 hours</strong>.</li>
            <li>Operational error alerts: <strong>30 days</strong>; CloudWatch/API diagnostic logs: <strong>7 days</strong>.</li>
            <li>Groq AI inference request data: <strong>up to 30 days</strong> under Groq&apos;s published reliability/abuse retention, unless Zero Data Retention is enabled for the provider account.</li>
            <li>Payments and purchases: the current app does not process payments, receipts, or entitlements. A retention/legal-obligation policy must be defined before introducing them.</li>
          </ul>
        ),
      },
      {
        heading: 'Your choices and rights',
        content: (
          <p>
            From <a href="/account">Your account</a>, a signed-in user can export the account data and data linked to anonymous IDs they have claimed. Deletion removes the Cognito identity, account record, claim locks, linked profiles, linked Daily participation rows, linked raw analytics, and shared Duel/Party objects containing that person&apos;s derived data; the updated web/Android client also clears its local identifiers and queued analytics after a successful deletion. Truly aggregated, non-linkable statistics may remain. Short-lived operational records are retained only for the periods above and are designed not to contain account data, answer text, or link tokens. Data that a recipient independently copied or an external provider holds under its own terms cannot be erased by this in-app request.
          </p>
        ),
      },
      {
        heading: 'Optional Google Analytics and browser storage',
        content: (
          <p>
            Google Analytics is web-only and never loads until you choose “Accept analytics.” It receives no email, custom user ID, dilemma answer text, AI analysis, or share token. You can withdraw consent in Privacy preferences or delete browser cookies; withdrawal removes known <code>_ga</code> cookies and reloads the site without the Google tag. Essential first-party storage is still used to run anonymous gameplay and local progress. See the <a href="/cookies">Cookie policy</a> for details.
          </p>
        ),
      },
      {
        heading: 'Legal basis and updates',
        content: (
          <p>
            Where applicable, we process data needed to provide the game you request and pursue legitimate interests in service security and reliability. We rely on consent for optional web Google Analytics. You may ask for access, correction, restriction, objection, portability, or deletion by contacting the controller. We will update this notice before materially changing these practices.
          </p>
        ),
      },
    ],
  },
  cookies: {
    title: 'Cookie and local storage policy',
    updated: 'Last updated: 6 August 2026',
    intro: 'Moral Torture Machine uses necessary first-party browser storage to keep anonymous gameplay working. The Android app uses the equivalent device storage through Capacitor.',
    sections: [
      {
        heading: 'Necessary storage',
        content: (
          <p>
            Anonymous user and installation IDs, a session ID, challenge progress, seen-dilemma state, and technical preferences are stored locally so the game can work across screens and requests. Signing in stores browser session material for the current web session; Android stores sign-in session/PKCE data with Android Keystore encryption. These items are not used for advertising.
          </p>
        ),
      },
      {
        heading: 'Optional analytics cookies',
        content: (
          <p>
            <code>mtm_web_analytics_consent</code> remembers the Google Analytics choice for 180 days. If you accept, Google Analytics may set first-party <code>_ga</code> cookies for aggregate web measurement. Rejecting or withdrawing consent removes known <code>_ga</code> cookies and prevents the Google tag from loading. Google Analytics is not included in the Android app.
          </p>
        ),
      },
      {
        heading: 'First-party product analytics',
        content: (
          <p>
            Separate from Google Analytics, the service records privacy-minimised first-party product events on web and Android to operate and improve the game. These records use anonymous/installation/session identifiers and expire after 90 days. They do not retain unlisted profile IDs, room codes, share-link paths, emails, tokens, dilemma text, answer text, or AI analysis in event properties.
          </p>
        ),
      },
    ],
  },
  terms: {
    title: 'Terms of use',
    updated: 'Last updated: 6 August 2026',
    intro: 'These terms govern use of Moral Torture Machine on the web and Android.',
    sections: [
      {
        heading: 'A game for reflection, not a diagnosis',
        content: (
          <p>
            Moral Torture Machine is an interactive moral-dilemma game for entertainment and personal reflection. Its scores, archetypes, comparisons, and AI-written commentary are not psychological, clinical, medical, legal, or professional advice, and must not be used to assess a person&apos;s mental health, character, worth, or suitability. AI may enrich wording; deterministic game logic determines the scores and archetypes.
          </p>
        ),
      },
      {
        heading: 'Accounts and shared flows',
        content: (
          <p>
            You may play anonymously or choose Google sign-in for account features. Keep any shared profile or Moral Duel link, and any Party Room code, only with people you intend to invite. These are unlisted, not secret vaults: recipients can see the results and comparison information made available by that flow. Do not enter personal, confidential, or sensitive information in a Party display name or share it with people who should not see it.
          </p>
        ),
      },
      {
        heading: 'Fair and lawful use',
        content: (
          <p>
            Do not interfere with the service, bypass access controls or rate limits, use automated abuse, impersonate others, or use the game to harass, discriminate against, or make consequential decisions about another person. You are responsible for any share action you initiate and for complying with the rules of the platform you share to.
          </p>
        ),
      },
      {
        heading: 'Availability and third parties',
        content: (
          <p>
            The service is provided as available and may change, pause, or be withdrawn. Some features depend on AWS, Google, Groq, or an operating-system sharing service; their availability and terms can affect the experience. A deterministic fallback keeps the core result available if the AI service is unavailable, but we do not guarantee uninterrupted or error-free service.
          </p>
        ),
      },
      {
        heading: 'Privacy and contact',
        content: (
          <p>
            Data handling is described in the <a href="/privacy">Privacy notice</a> and <a href="/cookies">Cookie policy</a>. For questions about these terms, contact{' '}
            <a href="mailto:tommasobersani@gmail.com">tommasobersani@gmail.com</a>.
          </p>
        ),
      },
    ],
  },
};

export default function LegalScreen({ type }) {
  const page = pages[type] || pages.privacy;

  return (
    <main className="legal-screen">
      <article className="legal-document">
        <h1>{page.title}</h1>
        <p className="legal-updated">{page.updated}</p>
        <p>{page.intro}</p>
        {page.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.content}
          </section>
        ))}
        <nav className="legal-links" aria-label="Legal links">
          <a href="/privacy">Privacy</a>
          <a href="/cookies">Cookies</a>
          <a href="/terms">Terms</a>
          <a href="/account">Your account</a>
          <a href="/">Home</a>
        </nav>
      </article>
    </main>
  );
}
