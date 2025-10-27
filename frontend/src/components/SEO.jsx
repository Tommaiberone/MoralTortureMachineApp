import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

/**
 * SEO Component for managing meta tags dynamically
 * Supports Open Graph, Twitter Cards, structured data, and multilingual content
 */
const SEO = ({
  title,
  description,
  keywords,
  image = 'https://moraltorturemachine.com/og-image.png',
  url,
  type = 'website',
  structuredData = null,
  noindex = false,
}) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const baseUrl = 'https://moraltorturemachine.com';
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl;

  // Full title with branding
  const fullTitle = title ? `${title} | Moral Torture Machine` : 'Moral Torture Machine - Explore Your Moral Framework';

  // Default description if none provided
  const finalDescription = description || 'Explore your moral framework through ethical dilemmas. Discover your moral compass with AI-powered analysis and interactive decision-making experiences.';

  // Default keywords
  const finalKeywords = keywords || 'moral philosophy, ethics, ethical dilemmas, trolley problem, moral compass, AI analysis, philosophy game, moral framework, decision making';

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <html lang={currentLang} />
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />

      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* Language alternates for multilingual SEO */}
      <link rel="alternate" hrefLang="en" href={`${baseUrl}${url || '/'}`} />
      <link rel="alternate" hrefLang="it" href={`${baseUrl}${url || '/'}`} />
      <link rel="alternate" hrefLang="x-default" href={`${baseUrl}${url || '/'}`} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title || 'Moral Torture Machine'} />
      <meta property="og:site_name" content="Moral Torture Machine" />
      <meta property="og:locale" content={currentLang === 'it' ? 'it_IT' : 'en_US'} />
      <meta property="og:locale:alternate" content={currentLang === 'it' ? 'en_US' : 'it_IT'} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={title || 'Moral Torture Machine'} />

      {/* Additional Meta Tags */}
      <meta name="author" content="Moral Torture Machine" />
      <meta name="application-name" content="Moral Torture Machine" />
      <meta name="apple-mobile-web-app-title" content="Moral Torture Machine" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="format-detection" content="telephone=no" />

      {/* PWA Tags (already in index.html but reinforced here) */}
      <meta name="mobile-web-app-capable" content="yes" />

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
