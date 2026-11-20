#!/usr/bin/env python3
"""Stamp content-hash query strings on CSS/JS references.

GitHub Pages caches HTML for 10 minutes, but unversioned .css/.js files
for 4 hours. A new filename query string (?v=<hash>) makes the browser
request the new file as soon as it sees the new HTML.

Run from the repository root after changing assets/*.css, assets/*.js,
or copying a new Flutter web build into app/:

    python3 scripts/bust-cache.py
"""

from __future__ import annotations

import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# relative path from repo root -> hash
ASSETS = {
    "assets/apple.css": None,
    "assets/nav.js": None,
    "assets/pricing-region.js": None,
    "app/main.dart.js": None,
}

HTML_PAGES = [
    ROOT / "index.html",
    ROOT / "about/index.html",
    ROOT / "contact/index.html",
    ROOT / "features/index.html",
    ROOT / "pricing/index.html",
    ROOT / "privacy/index.html",
    ROOT / "app/index.html",
]


def file_hash(path: Path, length: int = 10) -> str:
    data = path.read_bytes()
    return hashlib.sha256(data).hexdigest()[:length]


def stamp_asset_refs(text: str, filename: str, digest: str) -> str:
    """Replace path/to/filename or path/to/filename?v=old with ?v=digest."""
    escaped = re.escape(filename)
    pattern = re.compile(rf"({escaped})(?:\?v=[0-9a-f]+)?")
    return pattern.sub(rf"\1?v={digest}", text)


def stamp_main_js_path(text: str, digest: str) -> str:
    pattern = re.compile(r'("mainJsPath"\s*:\s*")main\.dart\.js(?:\?v=[0-9a-f]+)?"')
    return pattern.sub(rf'\1main.dart.js?v={digest}"', text)


def main() -> int:
    hashes = {}
    for rel in list(ASSETS):
        path = ROOT / rel
        if not path.is_file():
            print(f"skip missing {rel}", file=sys.stderr)
            continue
        hashes[Path(rel).name] = file_hash(path)
        print(f"{rel}  v={hashes[Path(rel).name]}")

    if "apple.css" not in hashes or "nav.js" not in hashes:
        print("required assets missing", file=sys.stderr)
        return 1

    changed = 0
    for page in HTML_PAGES:
        if not page.is_file():
            print(f"skip missing {page.relative_to(ROOT)}", file=sys.stderr)
            continue
        original = page.read_text(encoding="utf-8")
        text = original
        for name, digest in hashes.items():
            if name == "main.dart.js":
                text = stamp_main_js_path(text, digest)
            else:
                text = stamp_asset_refs(text, name, digest)
        if text != original:
            page.write_text(text, encoding="utf-8")
            changed += 1
            print(f"updated {page.relative_to(ROOT)}")
        else:
            print(f"unchanged {page.relative_to(ROOT)}")

    print(f"done, {changed} file(s) updated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
