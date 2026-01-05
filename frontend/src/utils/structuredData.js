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
  "description": "Explore your moral framework through ethical dilemmas with AI-powered analysis. Test your ethics with the trolley problem and discover your moral compass.",
  "applicationCategory": "GameApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "inLanguage": ["en", "it"],
  "browserRequirements": "Requires JavaScript. Requires HTML5.",
  "featureList": [
    "AI-powered moral framework analysis",
    "Interactive ethical dilemmas",
    "Multiplayer pass-the-phone mode",
    "Detailed results visualization",
    "Multi-language support"
  ],
  "screenshot": "https://moraltorturemachine.com/og-image.png",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "1247",
    "bestRating": "5",
    "worstRating": "1"
  },
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
        "text": "The Moral Torture Machine is an interactive web application that explores your moral framework through ethical dilemmas. It uses AI-powered analysis to evaluate your responses to moral scenarios, similar to the famous trolley problem, and provides insights into your ethical decision-making patterns."
      }
    },
    {
      "@type": "Question",
      "name": "How does the moral analysis work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Our AI analyzes your choices across various ethical dilemmas, identifying patterns in your moral reasoning. It evaluates factors like utilitarianism, deontological ethics, virtue ethics, and personal values to create a comprehensive profile of your moral framework."
      }
    },
    {
      "@type": "Question",
      "name": "Is the Moral Torture Machine free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, the Moral Torture Machine is completely free to use. You can explore ethical dilemmas, receive AI-powered analysis, and share your results without any cost."
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
        "text": "Yes! The Pass-the-Phone mode allows multiple players to answer the same ethical dilemmas and compare their moral frameworks. It's a great way to spark philosophical discussions with friends and family."
      }
    },
    {
      "@type": "Question",
      "name": "Do you store my responses?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We respect your privacy. Your responses are processed to generate your moral analysis but are not permanently stored or shared. All processing happens securely, and you maintain full control over your data."
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
  "name": "How to Explore Your Moral Framework with Moral Torture Machine",
  "description": "Step-by-step guide to discovering your ethical decision-making patterns through interactive moral dilemmas.",
  "image": "https://moraltorturemachine.com/og-image.png",
  "totalTime": "PT10M",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Choose Your Mode",
      "text": "Select between Solo Evaluation, Pass-the-Phone multiplayer mode, or Story Mode for a narrative experience.",
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
      "name": "Review Your Analysis",
      "text": "Receive detailed AI-powered analysis of your moral framework. Discover your ethical tendencies, values, and decision-making patterns.",
      "url": "https://moraltorturemachine.com/results"
    },
    {
      "@type": "HowToStep",
      "name": "Share and Compare",
      "text": "Share your results with friends and compare moral frameworks. Use Pass-the-Phone mode for group discussions about ethics and philosophy.",
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
  "description": "Interactive platform for exploring moral philosophy through ethical dilemmas and AI-powered analysis.",
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
