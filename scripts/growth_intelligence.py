#!/usr/bin/env python3
"""Read-only SEO and ASO opportunity report.

The collector deliberately has no Google Play publishing endpoints and never
changes a site, a store listing, or a GitHub branch.  It normalizes aggregate
Google reports into a small JSON document and turns that document into a
reviewable Markdown report.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import os
from datetime import date, timedelta
from pathlib import Path
from typing import Any
from urllib.parse import quote


SEARCH_CONSOLE_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"
GA4_SCOPE = "https://www.googleapis.com/auth/analytics.readonly"
PLAY_REPORTING_SCOPE = "https://www.googleapis.com/auth/playdeveloperreporting"
STORAGE_READ_SCOPE = "https://www.googleapis.com/auth/devstorage.read_only"


def number(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def percentage(value: Any) -> float:
    value = number(value)
    return value / 100 if value > 1 else value


def empty_data() -> dict[str, Any]:
    return {
        "generated_at": date.today().isoformat(),
        "configuration": {"missing": []},
        "search_console": {"rows": []},
        "ga4": {"rows": []},
        "pagespeed": {},
        "play": {"acquisition_rows": [], "vitals": {}, "listings": {}},
    }


def add_missing(data: dict[str, Any], value: str) -> None:
    missing = data.setdefault("configuration", {}).setdefault("missing", [])
    if value not in missing:
        missing.append(value)


def add_error(data: dict[str, Any], source: str, error: Exception) -> None:
    errors = data.setdefault("configuration", {}).setdefault("errors", [])
    response = getattr(error, "response", None)
    status_code = getattr(response, "status_code", None)
    detail = f"HTTP {status_code}" if status_code else type(error).__name__
    errors.append(f"{source}: {detail}")


def recommendation(title: str, source: str, evidence: str, action: str, risk: str = "low") -> dict[str, str]:
    return {"title": title, "source": source, "evidence": evidence, "action": action, "risk": risk}


def build_recommendations(data: dict[str, Any]) -> list[dict[str, str]]:
    """Use explicit, conservative thresholds to turn aggregate reports into leads."""
    leads: list[dict[str, str]] = []
    for row in data.get("search_console", {}).get("rows", []):
        keys = row.get("keys", [])
        query = keys[0] if keys else row.get("query", "(query hidden)")
        page = keys[1] if len(keys) > 1 else row.get("page", "(page hidden)")
        impressions, ctr, position = number(row.get("impressions")), number(row.get("ctr")), number(row.get("position"))
        if impressions >= 20 and ctr < 0.03:
            leads.append(recommendation(
                f"Improve search snippet for “{query}”",
                "Google Search Console",
                f"{impressions:.0f} impressions, {ctr:.1%} CTR, average position {position:.1f} for {page}.",
                "Review the page title, meta description and visible promise; retain only claims the product actually fulfils.",
                "medium",
            ))
        if 8 <= position <= 20 and impressions >= 20:
            leads.append(recommendation(
                f"Strengthen content coverage for “{query}”",
                "Google Search Console",
                f"Average position {position:.1f} with {impressions:.0f} impressions for {page}.",
                "Add original, expert-reviewed text or internal links to the existing relevant page instead of creating keyword-only pages.",
                "medium",
            ))

    for row in data.get("ga4", {}).get("rows", []):
        sessions = number(row.get("organic_sessions", row.get("sessions")))
        completions = number(row.get("result_views", row.get("completions")))
        if sessions >= 20 and completions / sessions < 0.60:
            page = row.get("landing_page", "(landing page)")
            leads.append(recommendation(
                f"Investigate organic landing mismatch on {page}",
                "GA4",
                f"{sessions:.0f} organic sessions and {completions / sessions:.1%} result completion.",
                "Compare search intent, above-the-fold copy and the path to the first result; validate a focused variant before changing the page.",
                "medium",
            ))

    for strategy, metrics in data.get("pagespeed", {}).items():
        score = number(metrics.get("performance"))
        lcp = number(metrics.get("lcp_ms"))
        if score and score < 70 or lcp and lcp > 2500:
            leads.append(recommendation(
                f"Fix {strategy} page experience regression",
                "PageSpeed Insights",
                f"Performance {score:.0f}/100, LCP {lcp:.0f} ms.",
                "Inspect the rendered landing page, JavaScript payload and blocking assets before making content changes.",
                "low",
            ))

    for row in data.get("play", {}).get("acquisition_rows", []):
        keyword = row.get("keyword", "(keyword unavailable)")
        visitors = number(row.get("store_listing_visitors", row.get("visitors")))
        conversion = percentage(row.get("visitor_to_installer_conversion_rate", row.get("conversion_rate")))
        if visitors >= 20 and conversion < 0.15:
            leads.append(recommendation(
                f"Improve Play listing conversion for “{keyword}”",
                "Google Play acquisition report",
                f"{visitors:.0f} listing visitors and {conversion:.1%} visitor-to-installer conversion.",
                "Review the matching localized short description, feature graphic and first screenshots. Prepare a Play Console experiment; do not publish automatically.",
                "medium",
            ))

    vitals = data.get("play", {}).get("vitals", {})
    for name, value in vitals.items():
        rate = percentage(value)
        if rate >= 0.01:
            leads.append(recommendation(
                f"Investigate Android {name}",
                "Google Play Android Vitals",
                f"Observed rate {rate:.2%}.",
                "Prioritize the Android reliability issue before investing in listing acquisition; inspect the Play Vitals drill-down by device and Android version.",
                "high",
            ))

    limits = {"title": 30, "short_description": 80, "full_description": 4000}
    for locale, listing in data.get("play", {}).get("listings", {}).items():
        for field, limit in limits.items():
            if field in listing and len(listing[field]) > limit:
                leads.append(recommendation(
                    f"Correct Play {locale} {field}",
                    "Listing snapshot",
                    f"{len(listing[field])} characters; Play limit is {limit}.",
                    "Shorten the draft before any human review or Play Console edit.",
                    "high",
                ))
    return leads


def markdown_report(data: dict[str, Any]) -> str:
    leads = build_recommendations(data)
    lines = [
        "# Growth intelligence report",
        "",
        f"Generated: {data.get('generated_at', 'unknown')}",
        "",
        "> Read-only report. It never changes web content, Google Play listings, assets, releases, or infrastructure.",
        "",
        "## Data status",
        "",
    ]
    missing = data.get("configuration", {}).get("missing", [])
    lines.extend([f"- Missing configuration: {', '.join(missing)}" if missing else "- All configured sources returned data."])
    for error in data.get("configuration", {}).get("errors", []):
        lines.append(f"- Source error (report continues): {error}")
    lines.extend(["", "## Recommended reviews", ""])
    if not leads:
        lines.append("No threshold-based opportunity was found. This is not proof that no improvement exists; review source coverage and sample size.")
    for index, lead in enumerate(leads, 1):
        lines.extend([
            f"### {index}. {lead['title']}",
            f"- Source: {lead['source']}",
            f"- Evidence: {lead['evidence']}",
            f"- Suggested review: {lead['action']}",
            f"- Risk: {lead['risk']}",
            "",
        ])
    lines.extend([
        "## Guardrails",
        "",
        "- Search Console query rows are aggregate/top-row data, not a complete keyword export.",
        "- Treat recommendations as hypotheses and validate one material change at a time.",
        "- Do not create scaled or keyword-only pages. Content must be useful, original and reviewed.",
        "- Store-listing edits and releases require an explicit human action in Play Console or a separately approved manual workflow.",
        "",
    ])
    return "\n".join(lines)


def workload_credentials():
    import google.auth

    credentials, _ = google.auth.default(scopes=[
        SEARCH_CONSOLE_SCOPE, GA4_SCOPE, PLAY_REPORTING_SCOPE, STORAGE_READ_SCOPE,
    ])
    return credentials


def authorized_session(credentials):
    from google.auth.transport.requests import AuthorizedSession

    return AuthorizedSession(credentials)


def collect_search_console(session, site_url: str, start_date: str, end_date: str) -> list[dict[str, Any]]:
    response = session.post(
        f"https://www.googleapis.com/webmasters/v3/sites/{quote(site_url, safe='')}/searchAnalytics/query",
        json={"startDate": start_date, "endDate": end_date, "dimensions": ["query", "page", "device", "country"], "rowLimit": 5000},
        timeout=30,
    )
    response.raise_for_status()
    return response.json().get("rows", [])


def collect_ga4(session, property_id: str, start_date: str, end_date: str) -> list[dict[str, Any]]:
    response = session.post(
        f"https://analyticsdata.googleapis.com/v1beta/properties/{property_id}:runReport",
        json={
            "dateRanges": [{"startDate": start_date, "endDate": end_date}],
            "dimensions": [{"name": "landingPagePlusQueryString"}, {"name": "eventName"}],
            "metrics": [{"name": "sessions"}, {"name": "eventCount"}],
            "dimensionFilter": {"filter": {"fieldName": "sessionDefaultChannelGroup", "stringFilter": {"value": "Organic Search"}}},
            "limit": 1000,
        },
        timeout=30,
    )
    response.raise_for_status()
    payload = response.json()
    headers = [header["name"] for header in payload.get("dimensionHeaders", [])]
    metrics = [header["name"] for header in payload.get("metricHeaders", [])]
    pages: dict[str, dict[str, Any]] = {}
    for row in payload.get("rows", []):
        values = {name: value.get("value") for name, value in zip(headers, row.get("dimensionValues", []))}
        values.update({name: value.get("value") for name, value in zip(metrics, row.get("metricValues", []))})
        page = values.get("landingPagePlusQueryString", "(not set)")
        aggregate = pages.setdefault(page, {"landing_page": page, "organic_sessions": 0, "result_views": 0})
        aggregate["organic_sessions"] = max(number(aggregate["organic_sessions"]), number(values.get("sessions")))
        if values.get("eventName") == "result_viewed":
            aggregate["result_views"] += number(values.get("eventCount"))
    return list(pages.values())


def collect_pagespeed(url: str, api_key: str | None) -> dict[str, Any]:
    import requests

    result = {}
    for strategy in ("mobile", "desktop"):
        params = {"url": url, "strategy": strategy, "category": "performance"}
        if api_key:
            params["key"] = api_key
        response = requests.get("https://www.googleapis.com/pagespeedonline/v5/runPagespeed", params=params, timeout=60)
        response.raise_for_status()
        audits = response.json().get("lighthouseResult", {}).get("audits", {})
        result[strategy] = {
            "performance": number(response.json().get("lighthouseResult", {}).get("categories", {}).get("performance", {}).get("score")) * 100,
            "lcp_ms": number(audits.get("largest-contentful-paint", {}).get("numericValue")),
        }
    return result


def collect_play_report(credentials, uri: str) -> list[dict[str, Any]]:
    """Read a configured CSV or the newest Play organic-search CSV below a prefix."""
    if not uri.startswith("gs://"):
        raise ValueError("GOOGLE_PLAY_ACQUISITION_REPORT_URI must start with gs://")
    from google.cloud import storage

    bucket_name, blob_name = uri[5:].split("/", 1)
    client = storage.Client(credentials=credentials)
    bucket = client.bucket(bucket_name)
    if blob_name.endswith(".csv"):
        blob = bucket.blob(blob_name)
    else:
        candidates = [
            item for item in client.list_blobs(bucket, prefix=blob_name.rstrip("/") + "/")
            if item.name.endswith(".csv") and "play_search" in item.name
        ]
        if not candidates:
            raise ValueError("No Play organic-search acquisition CSV found below configured prefix")
        blob = max(candidates, key=lambda item: item.updated or 0)
    text = blob.download_as_text()
    rows = []
    for row in csv.DictReader(io.StringIO(text)):
        rows.append({
            "keyword": row.get("Keyword", ""),
            "store_listing_visitors": row.get("Store Listing Visitors", 0),
            "installers": row.get("Installers", 0),
            "visitor_to_installer_conversion_rate": row.get("Visitor to Installer conversion rate", 0),
            "country": row.get("Country", ""),
        })
    return rows


def collect_play_vitals(session, package_name: str, start_date: str, end_date: str) -> dict[str, Any]:
    result = {}
    for metric_set, metric in (("crashRateMetricSet", "userPerceivedCrashRate"), ("anrRateMetricSet", "anrRate")):
        response = session.post(
            f"https://playdeveloperreporting.googleapis.com/v1beta1/apps/{package_name}/{metric_set}:query",
            json={"timelineSpec": {"aggregationPeriod": "DAILY", "startTime": {"year": int(start_date[:4]), "month": int(start_date[5:7]), "day": int(start_date[8:])}, "endTime": {"year": int(end_date[:4]), "month": int(end_date[5:7]), "day": int(end_date[8:])}}, "metrics": [metric], "pageSize": 100},
            timeout=30,
        )
        response.raise_for_status()
        values = [number(item.get("decimalValue")) for row in response.json().get("rows", []) for item in row.get("metrics", []) if item.get("metric") == metric]
        if values:
            result[metric] = sum(values) / len(values)
    return result


def collect(config: dict[str, Any]) -> dict[str, Any]:
    data = empty_data()
    end = date.today() - timedelta(days=3)
    start = end - timedelta(days=27)
    credential_file = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    site_url = config.get("site_url") or os.environ.get("SEARCH_CONSOLE_SITE_URL")
    ga4_property_id = config.get("ga4_property_id") or os.environ.get("GA4_PROPERTY_ID")
    page_url = config.get("page_url") or os.environ.get("GROWTH_PAGE_URL")
    play_uri = config.get("play_acquisition_report_uri") or os.environ.get("GOOGLE_PLAY_ACQUISITION_REPORT_URI")
    play_package = config.get("play_package_name") or os.environ.get("GOOGLE_PLAY_PACKAGE_NAME")
    listing_snapshot = config.get("play_listing_snapshot")

    if credential_file:
        try:
            credentials = workload_credentials()
            session = authorized_session(credentials)
        except Exception as error:
            add_error(data, "GitHub OIDC credentials", error)
            session = None
        if session:
            if site_url:
                try:
                    data["search_console"]["rows"] = collect_search_console(session, site_url, start.isoformat(), end.isoformat())
                except Exception as error:  # Report failures should never block the scheduled report.
                    add_error(data, "Search Console", error)
            else:
                add_missing(data, "SEARCH_CONSOLE_SITE_URL")
            if ga4_property_id:
                try:
                    data["ga4"]["rows"] = collect_ga4(session, ga4_property_id, start.isoformat(), end.isoformat())
                except Exception as error:
                    add_error(data, "GA4", error)
            else:
                add_missing(data, "GA4_PROPERTY_ID")
            if play_uri:
                try:
                    data["play"]["acquisition_rows"] = collect_play_report(credentials, play_uri)
                except Exception as error:
                    add_error(data, "Google Play acquisition report", error)
            else:
                add_missing(data, "GOOGLE_PLAY_ACQUISITION_REPORT_URI")
            if play_package:
                try:
                    data["play"]["vitals"] = collect_play_vitals(session, play_package, start.isoformat(), end.isoformat())
                except Exception as error:
                    add_error(data, "Google Play Android Vitals", error)
            else:
                add_missing(data, "GOOGLE_PLAY_PACKAGE_NAME")
    else:
        add_missing(data, "GOOGLE_APPLICATION_CREDENTIALS (GitHub OIDC)")

    if page_url:
        try:
            data["pagespeed"] = collect_pagespeed(page_url, os.environ.get("PAGESPEED_API_KEY"))
        except Exception as error:
            add_error(data, "PageSpeed Insights", error)
    else:
        add_missing(data, "GROWTH_PAGE_URL")
    if listing_snapshot:
        snapshot_path = Path(listing_snapshot)
        if snapshot_path.exists():
            data["play"]["listings"] = json.loads(snapshot_path.read_text())
            if not data["play"]["listings"]:
                add_missing(data, "PLAY_LISTING_SNAPSHOT")
        else:
            add_missing(data, "PLAY_LISTING_SNAPSHOT")
    else:
        add_missing(data, "PLAY_LISTING_SNAPSHOT")
    return data


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    subcommands = parser.add_subparsers(dest="command", required=True)
    collect_parser = subcommands.add_parser("collect")
    collect_parser.add_argument("--config", type=Path, required=True)
    collect_parser.add_argument("--output", type=Path, required=True)
    analyze_parser = subcommands.add_parser("analyze")
    analyze_parser.add_argument("--input", type=Path, required=True)
    analyze_parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()

    if args.command == "collect":
        config = json.loads(args.config.read_text())
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(collect(config), indent=2) + "\n")
        return

    data = json.loads(args.input.read_text())
    args.output_dir.mkdir(parents=True, exist_ok=True)
    (args.output_dir / "growth-intelligence-report.json").write_text(json.dumps(data, indent=2) + "\n")
    (args.output_dir / "growth-intelligence-report.md").write_text(markdown_report(data))


if __name__ == "__main__":
    main()
