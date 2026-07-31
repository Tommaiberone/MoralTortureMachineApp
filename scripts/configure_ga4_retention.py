#!/usr/bin/env python3
"""Set and verify the two-month GA4 retention policy for one property."""

import os
import sys

import google.auth
from google.auth.transport.requests import AuthorizedSession
import requests


ANALYTICS_EDIT_SCOPE = "https://www.googleapis.com/auth/analytics.edit"
RETENTION_VALUE = "TWO_MONTHS"


def settings_url(property_id: str) -> str:
    return (
        "https://analyticsadmin.googleapis.com/v1beta/"
        f"properties/{property_id}/dataRetentionSettings"
    )


def authenticated_session() -> requests.Session:
    access_token = os.environ.get("GA4_ACCESS_TOKEN", "").strip()
    if access_token:
        session = requests.Session()
        session.headers["Authorization"] = f"Bearer {access_token}"
        return session

    credentials, _ = google.auth.default(scopes=[ANALYTICS_EDIT_SCOPE])
    return AuthorizedSession(credentials)


def read_settings(session: requests.Session, url: str) -> dict:
    response = session.get(url, timeout=30)
    if not response.ok:
        print(
            f"GA4 API request failed ({response.status_code}): {response.text[:1000]}",
            file=sys.stderr,
        )
    response.raise_for_status()
    return response.json()


def main() -> int:
    property_id = os.environ.get("GA4_PROPERTY_ID", "").strip()
    if not property_id.isdigit():
        print("GA4_PROPERTY_ID must be a numeric GA4 property ID.", file=sys.stderr)
        return 2

    session = authenticated_session()
    url = settings_url(property_id)
    current = read_settings(session, url)
    current_values = {
        "eventDataRetention": current.get("eventDataRetention"),
        "userDataRetention": current.get("userDataRetention"),
    }
    desired_values = {
        "eventDataRetention": RETENTION_VALUE,
        "userDataRetention": RETENTION_VALUE,
    }

    if current_values != desired_values:
        response = session.patch(
            url,
            params={"updateMask": "event_data_retention,user_data_retention"},
            json={"name": current["name"], **desired_values},
            timeout=30,
        )
        response.raise_for_status()

    verified = read_settings(session, url)
    verified_values = {
        "eventDataRetention": verified.get("eventDataRetention"),
        "userDataRetention": verified.get("userDataRetention"),
    }
    if verified_values != desired_values:
        print("GA4 retention verification failed.", file=sys.stderr)
        return 1

    print("GA4 retention verified: event and user data are set to TWO_MONTHS.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
