"""Generates one QR PNG per case slug for the gamebook interior.

Usage:
    book/.venv/Scripts/python.exe book/qr/generate_qr.py c001 [c002 ...]

Each slug becomes book/qr/<slug>.png, referenced by book/cases/*.typ via
`qr-slug`. QR content is a placeholder URL (moraltorturemachine.com/book/<slug>)
until the real landing route exists - swap BASE_URL once it does.
"""

import sys
from pathlib import Path

import segno

BASE_URL = "https://moraltorturemachine.com/book/"
OUT_DIR = Path(__file__).parent


def generate(slug: str) -> Path:
    qr = segno.make(BASE_URL + slug, error="q")
    out_path = OUT_DIR / f"{slug}.png"
    qr.save(out_path, scale=8, border=2, dark="#000000", light="#ffffff")
    return out_path


if __name__ == "__main__":
    slugs = sys.argv[1:]
    if not slugs:
        print("usage: generate_qr.py <slug> [slug ...]", file=sys.stderr)
        raise SystemExit(1)
    for slug in slugs:
        path = generate(slug)
        print(f"wrote {path}")
