#!/usr/bin/env python3
"""Build the static GitHub Pages site from generated map data and src assets."""
from __future__ import annotations

import argparse
import base64
import gzip
import json
import shutil
from pathlib import Path
from typing import Any

from catalog_utils import sanitize_data_value

ROOT = Path(__file__).resolve().parents[1]


def load_json(path: Path) -> Any:
    return sanitize_data_value(json.loads(path.read_text(encoding="utf-8")))


def write_compact_json(path: Path, value: Any) -> None:
    write_text(path, json.dumps(value, ensure_ascii=False, separators=(",", ":")))


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def copy_js_modules(src_dir: Path, dest_dir: Path) -> None:
    if not src_dir.exists():
        return
    dest_dir.mkdir(parents=True, exist_ok=True)
    for existing in dest_dir.glob("*.js"):
        existing.unlink()
    for source in src_dir.glob("*.js"):
        shutil.copyfile(source, dest_dir / source.name)


def build_pages() -> None:
    docs = ROOT / "docs"
    (docs / "assets").mkdir(parents=True, exist_ok=True)
    (docs / "data").mkdir(parents=True, exist_ok=True)
    (docs / "data" / "generated").mkdir(parents=True, exist_ok=True)

    shutil.copyfile(ROOT / "src" / "index.html", docs / "index.html")
    shutil.copyfile(ROOT / "src" / "styles.css", docs / "assets" / "styles.css")
    shutil.copyfile(ROOT / "src" / "app.js", docs / "assets" / "app.js")
    copy_js_modules(ROOT / "src" / "state", docs / "assets" / "state")
    copy_js_modules(ROOT / "src" / "data", docs / "assets" / "data")
    copy_js_modules(ROOT / "src" / "render", docs / "assets" / "render")

    region_map = load_json(ROOT / "data" / "generated" / "region_map.generated.json")
    claim_map = load_json(ROOT / "data" / "generated" / "claim_map.generated.json")
    nation_catalog = load_json(ROOT / "data" / "generated" / "nations.catalog.json")
    research_catalog = load_json(ROOT / "data" / "generated" / "research.catalog.json")
    write_compact_json(ROOT / "data" / "generated" / "region_map.generated.json", region_map)
    write_compact_json(ROOT / "data" / "generated" / "claim_map.generated.json", claim_map)
    shutil.copyfile(ROOT / "data" / "generated" / "nations.catalog.json", docs / "data" / "generated" / "nations.catalog.json")
    shutil.copyfile(ROOT / "data" / "generated" / "research.catalog.json", docs / "data" / "generated" / "research.catalog.json")
    write_compact_json(docs / "data" / "region_map.generated.json", region_map)
    write_compact_json(docs / "data" / "claim_map.generated.json", claim_map)

    packed = {"regionMap": region_map, "claimMap": claim_map, "catalogs": {"nations": nation_catalog, "research": research_catalog}}
    payload = json.dumps(packed, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    encoded = base64.b64encode(gzip.compress(payload, compresslevel=9)).decode("ascii")
    chunks = [encoded[i : i + 12000] for i in range(0, len(encoded), 12000)]
    data_js = """
async function decodeGzipBase64(base64Text) {
  const binary = atob(base64Text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  if (!("DecompressionStream" in window)) {
    throw new Error("This browser does not support DecompressionStream, which is required for the compressed map data asset.");
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}
window.TI_DATA_PROMISE = (async () => {
  const compressed = [
""" + ",\n".join(json.dumps(chunk) for chunk in chunks) + """
  ].join("");
  return JSON.parse(await decodeGzipBase64(compressed));
})();
""".lstrip()
    write_text(docs / "assets" / "data.generated.js", data_js)
    print("Wrote docs/index.html and generated assets")


def parse_args() -> argparse.Namespace:
    return argparse.ArgumentParser(description=__doc__).parse_args()


def main() -> int:
    parse_args()
    build_pages()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
