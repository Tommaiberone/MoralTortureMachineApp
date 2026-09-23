"""Generates every QR PNG the gamebook needs.

With no arguments, first regenerates backend/data/gamebook_chapters.json
from book/chapters/registry.json (see sync_gamebook_chapters below - this
makes registry.json the single real source of truth for chapter slugs and
dilemma order, TASK-291 AC#3, even though the backend can't read
registry.json directly at runtime), then reads registry.json for chapter ->
solo/party slugs, plus any fixed non-chapter slugs (EXTRA_SLUGS below, e.g.
the closing page's return link), and (re)generates all of them. Pass
specific slugs to regenerate only those (the sync still runs first).

Usage:
    book/.venv/Scripts/python.exe book/qr/generate_qr.py
    book/.venv/Scripts/python.exe book/qr/generate_qr.py c1-solo

Each slug becomes book/qr/<slug>.png, referenced by book/typst/*.typ via
`qr-slug`. QR content is a real URL (moraltorturemachine.com/book/<slug>),
resolved by the frontend's /book/:slug route and the backend's
GET /book/chapters/{slug} (TASK-291).
"""

import json
import sys
from pathlib import Path

import segno

BASE_URL = "https://moraltorturemachine.com/book/"
QR_DIR = Path(__file__).parent
REGISTRY_PATH = QR_DIR.parent / "chapters" / "registry.json"
BACKEND_CHAPTERS_PATH = QR_DIR.parent.parent / "backend" / "data" / "gamebook_chapters.json"

# Slugs that aren't tied to a chapter in the registry.
EXTRA_SLUGS = ["closing"]


def load_registry() -> dict:
    return json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))


def sync_gamebook_chapters(registry: dict) -> None:
    """TASK-291 AC#3: book/chapters/registry.json is the single place a
    human edits chapter slugs/dilemma ids (ADR-131) - this regenerates
    backend/data/gamebook_chapters.json from it on every run, rather than
    hand-maintaining two independently-editable copies, since the backend
    can't read registry.json directly at runtime (book/ is never deployed,
    see book/README.md). The two can now only "drift" by someone forgetting
    to re-run this script after editing registry.json and committing
    gamebook_chapters.json stale, exactly like the gitignored QR PNGs this
    same script also regenerates - not by independent hand-edits diverging."""
    derived = {
        key: {
            "number": chapter["number"],
            "soloSlug": chapter["soloSlug"],
            "partySlug": chapter["partySlug"],
            "dilemmaBaseIds": [dilemma["id"] for dilemma in chapter["dilemmas"]],
        }
        for key, chapter in registry.items()
    }
    BACKEND_CHAPTERS_PATH.write_text(
        json.dumps(derived, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


def registry_slugs(registry: dict) -> list[str]:
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
    registry = load_registry()
    sync_gamebook_chapters(registry)
    print(f"wrote {BACKEND_CHAPTERS_PATH}")
    requested = sys.argv[1:]
    slugs = requested if requested else [*registry_slugs(registry), *EXTRA_SLUGS]
    for slug in slugs:
        path = generate(slug)
        print(f"wrote {path}")
