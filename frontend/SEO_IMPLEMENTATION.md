# SEO Implementation Guide - Moral Torture Machine

## Overview
This document outlines the comprehensive SEO optimization implemented for the Moral Torture Machine web application.

---

## Implementation Summary

### 1. Meta Tag Management
- **Package**: `react-helmet-async` (installed with `--legacy-peer-deps` for React 19 compatibility)
- **Component**: `src/components/SEO.jsx`
- **Provider**: Added `HelmetProvider` wrapper in `src/main.jsx`

### 2. Global SEO (index.html)
Enhanced the base HTML template with:
- Comprehensive meta descriptions
- Open Graph tags for social sharing
- Twitter Card tags
- Language alternates (hreflang)
- Canonical URL
- Structured data (Schema.org JSON-LD)
- Enhanced PWA meta tags

### 3. Route-Specific SEO
Each screen component now includes customized SEO:

| Route | Component | Title | Indexable |
|-------|-----------|-------|-----------|
| `/` | HomeScreen | "Moral Torture Machine - Explore Your Moral Framework" | Yes |
| `/tutorial` | TutorialScreen | "Tutorial - Learn How to Navigate Ethical Dilemmas" | No (noindex) |
| `/pass-the-phone` | PassThePhoneScreen | "Arcade Mode - Infinite Ethical Dilemmas" | Yes |
| `/evaluation-dilemmas` | EvaluationDilemmasScreen | "Moral Evaluation - Discover Your Ethical Framework" | Yes |
| `/results` | ResultsScreen | "Your Moral Profile - AI Analysis Results" | No (noindex) |

### 4. Structured Data (Schema.org)
Added JSON-LD structured data in `index.html`:
- Type: `WebApplication`
- Category: `GameApplication`
- Languages: English (en), Italian (it)
- Price: Free
- Organization details

### 5. Sitemap & Robots.txt

#### robots.txt (`/public/robots.txt`)
- Allows crawling of main pages
- Blocks `/results` and `/tutorial` from indexing
- Includes sitemap reference
- Sets crawl delays for aggressive bots
- Optimized for Google, Bing crawlers

#### sitemap.xml (`/public/sitemap.xml`)
- Includes 3 main indexable pages:
  - Home page (priority 1.0)
  - Evaluation Dilemmas (priority 0.9)
  - Pass The Phone (priority 0.8)
- Includes hreflang alternates for multilingual support
- Updates: Set to weekly for home, monthly for other pages

### 6. Multilingual SEO
- Language alternates (hreflang) for EN and IT
- x-default alternate for non-language-specific users
- Dynamic language detection with i18next
- Meta tags adjust based on current language

---

## Files Modified

### Created
- `/frontend/src/components/SEO.jsx` - Reusable SEO component
- `/frontend/public/robots.txt` - Search engine crawler instructions
- `/frontend/public/sitemap.xml` - Sitemap for search engines

### Modified
- `/frontend/src/main.jsx` - Added HelmetProvider
- `/frontend/index.html` - Enhanced with comprehensive meta tags
- `/frontend/src/screens/HomeScreen.jsx` - Added SEO component
- `/frontend/src/screens/TutorialScreen.jsx` - Added SEO component
- `/frontend/src/screens/PassThePhoneScreen.jsx` - Added SEO component
- `/frontend/src/screens/EvaluationDilemmasScreen.jsx` - Added SEO component
- `/frontend/src/screens/ResultsScreen.jsx` - Added SEO component
- `/frontend/package.json` - Added react-helmet-async dependency

---

## SEO Features Implemented

### Meta Tags
- Title tags (static + dynamic per route)
- Meta descriptions (unique per page)
- Keywords (targeted per page)
- Canonical URLs
- Robots directives
- Author/application metadata

### Social Media Optimization
- Open Graph (Facebook, LinkedIn)
  - og:type, og:url, og:title, og:description
  - og:image (1200x630 recommended)
  - og:locale with alternates
- Twitter Cards
  - summary_large_image format
  - Complete metadata

### Technical SEO
- Language alternates (hreflang)
- Structured data (JSON-LD)
- Robots.txt
- Sitemap.xml
- PWA optimization
- Mobile-friendly meta tags

### Performance Optimizations (Already Implemented)
- Code splitting (Vite configuration)
- Lazy loading (React.lazy, Suspense)
- Optimized bundle chunks
- CloudFront CDN distribution

---

## Action Required: Open Graph Image

### Missing Asset
The SEO implementation references an Open Graph image:
```
https://moraltorturemachine.com/og-image.png
```

**Status**: This file does not currently exist in `/frontend/public/`

### Recommendations
Create an Open Graph image with these specifications:

**Dimensions**: 1200 x 630 pixels (Facebook/LinkedIn recommended)
**Format**: PNG or JPG
**File size**: Under 1MB (aim for 300-500KB)
**Location**: `/frontend/public/og-image.png`

**Content suggestions**:
- App logo/branding
- Tagline: "Explore Your Moral Framework"
- Visual representation of ethical dilemmas
- Dark theme (#0a0a0a background) to match app aesthetic
- High contrast text for readability

**Tools**:
- Canva (free templates)
- Figma
- Adobe Photoshop/Illustrator
- Online OG image generators

**Testing**:
- Facebook Debugger: https://developers.facebook.com/tools/debug/
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

---

## Additional SEO Recommendations

### 1. Performance Optimization
- [ ] Enable Brotli/Gzip compression on CloudFront
- [ ] Optimize image assets (use WebP format)
- [ ] Implement lazy loading for images
- [ ] Add service worker for offline support (PWA)
- [ ] Minimize JavaScript bundle size

### 2. Content Optimization
- [ ] Add blog/content section for SEO content marketing
- [ ] Create FAQs page (great for featured snippets)
- [ ] Add About page with team/mission info
- [ ] Create dedicated landing pages for key moral philosophy topics

### 3. Link Building
- [ ] Submit to relevant directories (philosophy sites, educational resources)
- [ ] Create shareable moral dilemma content
- [ ] Reach out to philosophy educators/influencers
- [ ] Guest post on ethics/philosophy blogs

### 4. Analytics & Monitoring
- [ ] Set up Google Search Console
- [ ] Configure Google Analytics 4 (GA4)
- [ ] Monitor Core Web Vitals
- [ ] Track keyword rankings
- [ ] Set up error monitoring (404s, 500s)

### 5. Technical Improvements
- [ ] Consider implementing SSR (Server-Side Rendering) or SSG (Static Site Generation)
  - Options: Next.js migration, Vite SSR plugin, or prerendering
  - Would significantly improve initial SEO and indexability
- [ ] Add breadcrumb structured data
- [ ] Implement Article/BlogPosting schema for content pages
- [ ] Add FAQ schema markup
- [ ] Create XML sitemap index if site grows

### 6. Local SEO (if applicable)
- [ ] Add LocalBusiness structured data
- [ ] Create Google My Business listing
- [ ] Add location-specific keywords

### 7. Accessibility = SEO
- [ ] Ensure WCAG 2.1 AA compliance
- [ ] Add ARIA labels where needed
- [ ] Improve semantic HTML structure
- [ ] Add alt text to all images

---

## Verification Checklist

### Pre-Deployment
- [x] SEO component created and integrated
- [x] Meta tags added to all routes
- [x] robots.txt created
- [x] sitemap.xml created
- [x] Structured data implemented
- [x] Multilingual support (hreflang)
- [ ] Open Graph image created (ACTION REQUIRED)

### Post-Deployment
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Test Open Graph tags (Facebook Debugger)
- [ ] Test Twitter Cards (Twitter Card Validator)
- [ ] Verify robots.txt accessibility (https://moraltorturemachine.com/robots.txt)
- [ ] Verify sitemap accessibility (https://moraltorturemachine.com/sitemap.xml)
- [ ] Test mobile responsiveness (Google Mobile-Friendly Test)
- [ ] Check Core Web Vitals (PageSpeed Insights)
- [ ] Verify structured data (Google Rich Results Test)

---

## SEO Maintenance Schedule

### Weekly
- Monitor search console for errors
- Check for 404 errors
- Review traffic analytics

### Monthly
- Update sitemap lastmod dates if content changes
- Review and refresh meta descriptions
- Analyze keyword rankings
- Check backlink profile

### Quarterly
- Content audit
- Technical SEO audit
- Competitor analysis
- Update structured data as needed

---

## Key SEO Metrics to Track

1. **Organic Traffic**: Google Analytics
2. **Keyword Rankings**: Google Search Console, Ahrefs, SEMrush
3. **Click-Through Rate (CTR)**: Search Console
4. **Core Web Vitals**: PageSpeed Insights, Search Console
5. **Backlinks**: Ahrefs, Moz, SEMrush
6. **Index Coverage**: Google Search Console
7. **Mobile Usability**: Search Console
8. **Social Shares**: Native platform analytics

---

## Target Keywords

### Primary Keywords
- Moral philosophy game
- Ethical dilemmas
- Trolley problem
- Moral compass test
- Ethics decision making

### Secondary Keywords
- Philosophy personality test
- Moral framework analysis
- AI ethics analysis
- Ethical decision game
- Philosophy quiz

### Long-Tail Keywords
- How to test your moral compass
- Interactive ethical dilemmas
- AI-powered moral analysis
- Multiplayer philosophy game
- Trolley problem variations

---

## Resources

### SEO Tools
- Google Search Console: https://search.google.com/search-console
- Google Analytics: https://analytics.google.com
- PageSpeed Insights: https://pagespeed.web.dev
- Schema Markup Validator: https://validator.schema.org
- Rich Results Test: https://search.google.com/test/rich-results

### Learning Resources
- Google SEO Starter Guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Moz Beginner's Guide to SEO: https://moz.com/beginners-guide-to-seo
- Search Engine Journal: https://www.searchenginejournal.com

---

## Notes

- SPA architecture may limit SEO effectiveness for dynamic content
- Consider SSR/SSG for maximum SEO impact
- Regularly update content to maintain search rankings
- Focus on user experience (UX) - Google prioritizes it
- Build quality backlinks for domain authority

---

**Implementation Date**: October 27, 2025
**Status**: Complete (pending OG image)
**Next Review**: January 2026
