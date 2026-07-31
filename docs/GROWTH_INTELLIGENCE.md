# SEO and ASO intelligence

This repository contains a weekly, read-only report in
`scripts/growth_intelligence.py`. It combines aggregate web-search and Google
Play signals into review proposals. It has no endpoint for publishing content,
modifying a Play listing, uploading assets, or releasing an Android bundle.

## Sources and roles

| Source | Used for | Not used for |
|---|---|---|
| Google Search Console | Query/page aggregate for decisions; query/page/device/country drill-down for diagnosis | User behaviour after a click |
| GA4 | Organic landing sessions and post-click conversion | Search-query ranking decisions |
| PageSpeed Insights | Mobile/desktop page experience for home and each configured discovery landing | Product funnel identity |
| Google Play acquisition CSV | Organic Play search keyword, listing visitors and visitor-to-installer conversion | Live keyword rank scraping |
| Google Play Developer Reporting API | Crash and ANR signals | Publishing releases or listings |
| First-party analytics | Product funnel, web/Android comparison | Raw search query collection |
| Google autocomplete | Wording and adjacent intent discovery from a small configured seed set | Search volume, keyword rank, or proof of demand |
| Keyword Planner CSV (optional) | Human-supplied monthly-volume and competition signal for exact queries | Automated Google Ads access, campaign management, or account changes |

Search Console exposes aggregate/top rows, so an absent row must never be
treated as proof of zero demand. Google Play acquisition reports are produced
with a delay; configure the URI of an available monthly CSV rather than
assuming a particular month exists.

## One-time owner setup

These are the only external actions required from the account owner:

1. Verify `https://moraltorturemachine.com/` in Google Search Console.
   For this repository's **Domain property**, keep `site_url` in
   `.github/growth-intelligence.json` as the exact API identifier
   `sc-domain:moraltorturemachine.com`, not the URL-prefix form. The report
   queries the property identifier, while `page_url` remains the normal web URL
   for PageSpeed.
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
8. To quantify the demand radar, export the selected keyword ideas from Google
   Keyword Planner and save a reviewed CSV as
   `growth-intelligence/keyword-planner.csv`, using the headers shown in
   `keyword-planner.example.csv`. Include the market (`US` or `IT`) when it is
   available. The file contains no user data or credentials. This is optional:
   without it, the report correctly labels discoveries as directional rather
   than pretending they have a monthly volume.

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

## Demand radar

The configured EN/IT seeds represent both current product intents (reflection
and pass-the-phone conversation) and explicitly marked future-fit intents
(couples compatibility). The weekly report expands those seeds through a small,
read-only autocomplete request and marks every candidate as:

- **Directional** — phrasing discovered from a configured seed or autocomplete;
  it has no quantitative demand claim.
- **Observed** — the exact phrase also has Search Console impressions; this is
  evidence that the site has encountered it, not a market-size estimate.
- **Quantified** — a matching, human-exported Keyword Planner CSV row contains
  monthly searches and competition.

The report separates a currently covered phrase from a gap and labels product
fit as `current` or `future`. A future-fit gap is a roadmap signal, not a reason
to promise an unavailable feature or publish a page. The job remains read-only
and a scheduled run cannot change a site, campaign, store listing, asset, or
release.

Candidates are shown separately for each market so that one language cannot
hide the other behind a global top-N limit. Configured risk terms mark phrases
such as psychology/diagnosis or minors-oriented wording as `policy review
required`; those rows are research signals only and cannot justify a product,
medical, psychological, or age-related claim.

## Recommendation and history rules

The report has three intentionally different outputs: an evidence-backed review
for measured Search Console/GA4/PageSpeed/Play thresholds; up to two
**validation briefs per market** for current-fit radar gaps confirmed by
autocomplete; and a watch list. A validation brief is not a recommendation to
publish: it first requires a Keyword Planner check and a review of the existing
landing promise. Future-fit and policy-review candidates cannot generate one.

The workflow downloads only recent private report artifacts using the
read-only `GITHUB_TOKEN` Actions permission, summarizes their aggregate query
metrics, and compares the current report with the latest prior one. New report
artifacts are retained for 90 days, still without AWS storage. A missing or
unavailable history artifact is shown as a non-fatal data-status condition and
never blocks the current collection. Trend recommendations require at least ten
impressions in both comparable reports and a material absolute and relative
change; branded queries are excluded.

Play Vitals retries only transient HTTP 429/5xx responses with bounded backoff.
An exhausted retry remains a visible non-fatal source error rather than a
reason to retry indefinitely or alter Play Console data.
