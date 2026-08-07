import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { SEO_LANDINGS } from '../content/seoLandings';
import { combineSchemas, getBreadcrumbSchema, getFAQSchemaFromItems, getSeoLandingSchema } from '../utils/structuredData';
import { trackEvent } from '../utils/analytics';
import './SeoLandingScreen.css';

const destinationForMode = {
  evaluation: '/evaluation-dilemmas',
};

export default function SeoLandingScreen({ landingId, locale }) {
  const navigate = useNavigate();
  const viewed = useRef(false);
  const landing = SEO_LANDINGS[landingId]?.[locale];

  // TASK-101: this screen renders its own locale-specific content directly
  // (no t()/useTranslation() calls) and must never call i18n.changeLanguage()
  // here — doing so used to leak into the global i18next instance (and its
  // cookie cache), silently switching the rest of the app to Italian after a
  // visit to an /it/... landing page even while Italian is otherwise hidden.

  useEffect(() => {
    if (!landing || viewed.current) return;
    viewed.current = true;
    trackEvent('seo_landing_viewed', { landing: landingId, locale });
  }, [landing, landingId, locale]);

  if (!landing) return null;

  const related = landing.related.map((id) => ({
    id,
    ...SEO_LANDINGS[id][locale],
  }));
  const schemas = combineSchemas(
    getSeoLandingSchema({
      title: landing.title,
      description: landing.description,
      path: landing.path,
      locale,
      faq: landing.faq,
    }),
    getFAQSchemaFromItems(landing.faq),
    getBreadcrumbSchema([
      { name: locale === 'it' ? 'Home' : 'Home', path: '/' },
      { name: landing.title, path: landing.path },
    ])
  );

  const startMode = () => {
    trackEvent('seo_landing_cta_clicked', { landing: landingId, destination: landing.mode });
    const tutorialKey = `tutorial_completed_${landing.mode}`;
    if (localStorage.getItem(tutorialKey) === 'true') {
      navigate(destinationForMode[landing.mode]);
      return;
    }
    navigate('/tutorial', { state: { mode: landing.mode } });
  };

  return (
    <main className="seo-landing">
      <SEO
        title={landing.title}
        description={landing.description}
        keywords={locale === 'it'
          ? 'test dilemmi morali, dilemmi etici, gioco dilemmi morali, filosofia morale, scelte difficili'
          : 'moral dilemma test, ethical dilemmas, moral dilemma game, moral philosophy game, difficult choices'}
        url={landing.path}
        language={locale}
        alternateUrls={{ [locale]: landing.path, [locale === 'en' ? 'it' : 'en']: landing.alternatePath }}
        structuredData={schemas}
      />

      <header className="seo-landing-header">
        <Link className="seo-landing-brand" to="/">MORAL TORTURE MACHINE</Link>
        <nav aria-label={locale === 'it' ? 'Lingua' : 'Language'}>
          <Link to={landing.path} aria-current="page">{locale === 'it' ? 'IT' : 'EN'}</Link>
          <Link to={landing.alternatePath}>{locale === 'it' ? 'EN' : 'IT'}</Link>
        </nav>
      </header>

      <article className="seo-landing-content">
        <p className="seo-landing-eyebrow">{landing.eyebrow}</p>
        <h1>{landing.heading}</h1>
        <p className="seo-landing-lead">{landing.lead}</p>
        <button type="button" className="seo-landing-primary" onClick={startMode}>{landing.primaryCta}</button>

        <section aria-labelledby="examples-heading">
          <h2 id="examples-heading">{locale === 'it' ? 'Tre scelte da cui partire' : 'Three choices to start with'}</h2>
          <div className="seo-landing-grid">
            {landing.examples.map(([title, body]) => (
              <article className="seo-landing-card" key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        {landing.sections.map((section) => (
          <section className="seo-landing-section" key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}

        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading">{locale === 'it' ? 'Domande frequenti' : 'Frequently asked questions'}</h2>
          <div className="seo-landing-faq">
            {landing.faq.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="seo-landing-related" aria-labelledby="related-heading">
          <h2 id="related-heading">{locale === 'it' ? 'Continua a esplorare' : 'Keep exploring'}</h2>
          <div className="seo-landing-grid">
            {related.map((item) => (
              <Link className="seo-landing-card seo-landing-link-card" to={item.path} key={item.id}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
