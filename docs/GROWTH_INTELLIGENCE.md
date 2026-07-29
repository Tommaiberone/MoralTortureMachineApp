# SEO and ASO intelligence

This repository contains a weekly, read-only report in
`scripts/growth_intelligence.py`. It combines aggregate web-search and Google
Play signals into review proposals. It has no endpoint for publishing content,
modifying a Play listing, uploading assets, or releasing an Android bundle.

## Sources and roles

| Source | Used for | Not used for |
|---|---|---|
| Google Search Console | Query, page, device, country, impressions, CTR, position | User behaviour after a click |
| GA4 | Organic landing sessions and post-click conversion | Search-query ranking decisions |
| PageSpeed Insights | Mobile/desktop page experience | Product funnel identity |
| Google Play acquisition CSV | Organic Play search keyword, listing visitors and visitor-to-installer conversion | Live keyword rank scraping |
| Google Play Developer Reporting API | Crash and ANR signals | Publishing releases or listings |
| First-party analytics | Product funnel, web/Android comparison | Raw search query collection |

Search Console exposes aggregate/top rows, so an absent row must never be
treated as proof of zero demand. Google Play acquisition reports are produced
with a delay; configure the URI of an available monthly CSV rather than
assuming a particular month exists.

## One-time owner setup

These are the only external actions required from the account owner:

1. Verify the Domain property `sc-domain:moraltorturemachine.com` in Google
   Search Console and grant the reporting service account access to that same
   property.
2. Create a GA4 property and web data stream, then configure consent and the
   privacy notice before enabling the GA4 browser tag. Do not send email,
   Cognito subject, answer text, tokens, or custom user IDs.
3. Add the dedicated service account
   `growth-intelligence@moraltorturemachine.iam.gserviceaccount.com` as a
   restricted user to Search Console and a Viewer at GA4 property level. In
   Play Console give it only **View app quality information (read only)** and
   **View app information and download bulk reports (read only)** for this
   app; do not give release or store-presence edit permission.
4. The Google APIs and GitHub OIDC workload identity federation are already
   configured in the `moraltorturemachine` project. No service-account JSON
   key or GitHub credential secret is needed.
5. Set repository variables `GA4_PROPERTY_ID`, `GOOGLE_PLAY_PACKAGE_NAME`, and
   `GOOGLE_PLAY_ACQUISITION_REPORT_URI`. The last accepts either the exact
   `gs://..._play_search.csv` URI or a `gs://bucket/prefix/`: with a prefix the
   job selects the newest organic-search CSV automatically. The monthly report
   download page in Play Console shows the developer bucket and available
   files.
6. Copy the current Italian and English Play title, short description and full
   description into `growth-intelligence/play-listings.json`. This is a
   deliberately manual snapshot: the read-only Play Reporting API does not
   grant the store-listing edit scope needed to obtain it through an edit.
7. Optionally add `PAGESPEED_API_KEY` as a GitHub secret to use an allocated
   PageSpeed quota.

GitHub exchanges its own short-lived OIDC token for the configured Google
service account; no static Google credential is stored in the repository or
GitHub secrets. The workflow stores the
aggregate report as a private GitHub Actions artifact for 14 days. A scheduled
run never creates an issue; the `create_issue` manual-dispatch option creates
only a review issue and still cannot publish any product change.

## Human review gate

Each recommendation is a hypothesis, not an instruction. A human must verify
that the proposed page or listing reflects the real product, respects policy,
and has original value before creating a PR or a Play Console experiment. Do
not generate scaled keyword pages. For Play listings, the report checks the
current fixed limits: title 30 characters, short description 80, full
description 4,000.

The later `TASK-79` remains responsible for actually revising the Play listing
after the social MVP is stable. Its publication must remain explicitly manual.
