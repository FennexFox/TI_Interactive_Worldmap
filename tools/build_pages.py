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

ROOT = Path(__file__).resolve().parents[1]


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def build_pages() -> None:
    docs = ROOT / "docs"
    (docs / "assets").mkdir(parents=True, exist_ok=True)
    (docs / "data").mkdir(parents=True, exist_ok=True)

    shutil.copyfile(ROOT / "src" / "index.html", docs / "index.html")
    shutil.copyfile(ROOT / "src" / "styles.css", docs / "assets" / "styles.css")
    shutil.copyfile(ROOT / "src" / "app.js", docs / "assets" / "app.js")

    region_map = load_json(ROOT / "data" / "generated" / "region_map.generated.json")
    claim_map = load_json(ROOT / "data" / "generated" / "claim_map.generated.json")
    nation_catalog = load_json(ROOT / "data" / "nations.catalog.json")
    research_catalog = load_json(ROOT / "data" / "research.catalog.json")
    shutil.copyfile(ROOT / "data" / "nations.catalog.json", docs / "data" / "nations.catalog.json")
    shutil.copyfile(ROOT / "data" / "research.catalog.json", docs / "data" / "research.catalog.json")
    shutil.copyfile(ROOT / "data" / "generated" / "region_map.generated.json", docs / "data" / "region_map.generated.json")
    shutil.copyfile(ROOT / "data" / "generated" / "claim_map.generated.json", docs / "data" / "claim_map.generated.json")

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
