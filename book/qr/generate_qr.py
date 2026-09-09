"""Generates every QR PNG the gamebook needs.

With no arguments, reads book/chapters/registry.json (the single source of
truth for chapter -> solo/party slugs) plus any fixed non-chapter slugs
(EXTRA_SLUGS below, e.g. the closing page's return link) and (re)generates
all of them. Pass specific slugs to regenerate only those.

Usage:
    book/.venv/Scripts/python.exe book/qr/generate_qr.py
    book/.venv/Scripts/python.exe book/qr/generate_qr.py c1-solo

Each slug becomes book/qr/<slug>.png, referenced by book/typst/*.typ via
`qr-slug`. QR content is a placeholder URL (moraltorturemachine.com/book/<slug>)
until the real landing route exists - swap BASE_URL once it does (TASK-291).
"""

import json
import sys
from pathlib import Path

import segno

BASE_URL = "https://moraltorturemachine.com/book/"
QR_DIR = Path(__file__).parent
REGISTRY_PATH = QR_DIR.parent / "chapters" / "registry.json"

# Slugs that aren't tied to a chapter in the registry.
EXTRA_SLUGS = ["closing"]


def registry_slugs() -> list[str]:
    registry = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    slugs = []
    for chapter in registry.values():
        slugs.append(chapter["soloSlug"])
        slugs.append(chapter["partySlug"])
    return slugs


def generate(slug: str) -> Path:
    qr = segno.make(BASE_URL + slug, error="q")
    out_path = QR_DIR / f"{slug}.png"
    qr.save(out_path, scale=8, border=2, dark="#000000", light="#ffffff")
    return out_path


if __name__ == "__main__":
    requested = sys.argv[1:]
    slugs = requested if requested else [*registry_slugs(), *EXTRA_SLUGS]
    for slug in slugs:
        path = generate(slug)
        print(f"wrote {path}")
