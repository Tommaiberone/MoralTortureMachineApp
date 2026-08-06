/**
 * Structured Data (Schema.org JSON-LD) utilities for SEO
 * Generates rich snippets for Google Search
 */

/**
 * Main WebApplication Schema - Enhanced
 */
export const getWebApplicationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Moral Torture Machine",
  "alternateName": "MTM",
  "url": "https://moraltorturemachine.com",
  "description": "An interactive ethical-dilemma game with deterministic scoring and optional AI-written commentary for reflection and discussion.",
  "applicationCategory": "GameApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "inLanguage": "en",
  "browserRequirements": "Requires JavaScript. Requires HTML5.",
  "featureList": [
    "Deterministic moral-dilemma game scoring",
    "Optional AI-written result commentary",
    "Interactive ethical dilemmas",
    "Multiplayer pass-the-phone mode",
    "Detailed results visualization",
    "Moral Duel and Party Room comparison"
  ],
  "screenshot": "https://moraltorturemachine.com/og-image.png",
  "author": {
    "@type": "Organization",
    "name": "Moral Torture Machine",
    "url": "https://moraltorturemachine.com"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Moral Torture Machine",
    "url": "https://moraltorturemachine.com"
  }
});

/**
 * FAQ Page Schema - For Home and Tutorial pages
 */
export const getFAQSchema = () => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the Moral Torture Machine?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The Moral Torture Machine is an interactive moral-dilemma game. It uses deterministic scoring to create an in-game archetype from fictional ethical choices, with optional AI-written commentary for reflection and discussion."
      }
    },
    {
      "@type": "Question",
      "name": "How does the moral analysis work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A versioned deterministic score groups the game's choices into six value dimensions and an archetype. Optional AI text explains the result but does not set the score. The game is not a psychological or clinical assessment."
      }
    },
    {
      "@type": "Question",
      "name": "Is the Moral Torture Machine free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, the Moral Torture Machine is free to use. You can explore ethical dilemmas, receive an in-game result with optional AI-written commentary, and choose whether to share a result."
      }
    },
    {
      "@type": "Question",
      "name": "What ethical dilemmas are included?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The app includes various moral scenarios including the classic trolley problem, medical ethics dilemmas, justice and fairness scenarios, personal sacrifice situations, and many more thought-provoking ethical questions designed to challenge your moral reasoning."
      }
    },
    {
      "@type": "Question",
      "name": "Can I play with friends?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Pass-the-Phone, Moral Duel, and Party Room flows let people compare game results or discuss the same dilemmas. Shared links and room codes should only be sent to people you intend to invite."
      }
    },
    {
      "@type": "Question",
      "name": "Do you store my responses?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The service retains different data for different periods: raw first-party analytics for 90 days, Moral Duels for 30 days, Party Rooms for 6 hours, and accounts/profiles for up to 12 months of inactivity. Signed-in users can export or delete data linked to anonymous IDs they have claimed; the Privacy notice explains the full scope."
      }
    }
  ]
});

/**
 * HowTo Schema - Tutorial/Guide for using the app
 */
export const getHowToSchema = () => ({
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Play Moral Torture Machine",
  "description": "A short guide to playing interactive ethical dilemmas for reflection and discussion.",
  "image": "https://moraltorturemachine.com/og-image.png",
  "totalTime": "PT10M",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Choose a way to play",
      "text": "Choose solo play, Pass-the-Phone, or a Party Room with people you know.",
      "url": "https://moraltorturemachine.com/",
      "image": "https://moraltorturemachine.com/og-image.png"
    },
    {
      "@type": "HowToStep",
      "name": "Answer Ethical Dilemmas",
      "text": "Read each moral scenario carefully and make your choice. Each dilemma presents a unique ethical challenge designed to reveal your moral reasoning patterns.",
      "url": "https://moraltorturemachine.com/evaluation-dilemmas"
    },
    {
      "@type": "HowToStep",
      "name": "Review the game result",
      "text": "See the deterministic in-game result and optional AI-written commentary. It is for entertainment and reflection, not a diagnosis.",
      "url": "https://moraltorturemachine.com/results"
    },
    {
      "@type": "HowToStep",
      "name": "Share and compare if you choose",
      "text": "Use an unlisted link, a Moral Duel, or Pass-the-Phone to discuss different perspectives with people you choose.",
      "url": "https://moraltorturemachine.com/pass-the-phone"
    }
  ]
});

/**
 * BreadcrumbList Schema - For navigation
 */
export const getBreadcrumbSchema = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": `https://moraltorturemachine.com${item.path}`
  }))
});

/**
 * WebPage schema for the editorial, intent-led discovery pages. These pages
 * deliberately describe the experience without claiming diagnostic outcomes.
 */
export const getSeoLandingSchema = ({ title, description, path, locale }) => ({
  "@type": "WebPage",
  "name": title,
  "description": description,
  "url": `https://moraltorturemachine.com${path}`,
  "inLanguage": locale,
  "isPartOf": {
    "@type": "WebSite",
    "name": "Moral Torture Machine",
    "url": "https://moraltorturemachine.com"
  }
});

/**
 * FAQ schema mirrors visible editorial FAQs. It must never be used for
 * hidden or automatically generated questions.
 */
export const getFAQSchemaFromItems = (items) => ({
  "@type": "FAQPage",
  "mainEntity": items.map(([question, answer]) => ({
    "@type": "Question",
    "name": question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": answer
    }
  }))
});

/**
 * Article Schema - For blog posts and content pages
 */
export const getArticleSchema = ({ title, description, datePublished, dateModified, image, url }) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": title,
  "description": description,
  "image": image || "https://moraltorturemachine.com/og-image.png",
  "datePublished": datePublished,
  "dateModified": dateModified || datePublished,
  "author": {
    "@type": "Organization",
    "name": "Moral Torture Machine",
    "url": "https://moraltorturemachine.com"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Moral Torture Machine",
    "url": "https://moraltorturemachine.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://moraltorturemachine.com/favicon.svg"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": url
  }
});

/**
 * Organization Schema - For about/contact pages
 */
export const getOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Moral Torture Machine",
  "url": "https://moraltorturemachine.com",
  "logo": "https://moraltorturemachine.com/favicon.svg",
  "description": "Interactive ethical-dilemma game with deterministic scoring and optional AI-written commentary.",
  "sameAs": [
    // Add social media profiles here when available
    // "https://twitter.com/moraltorturemachine",
    // "https://facebook.com/moraltorturemachine"
  ]
});

/**
 * Combine multiple schemas for a page
 */
export const combineSchemas = (...schemas) => ({
  "@context": "https://schema.org",
  "@graph": schemas
});
