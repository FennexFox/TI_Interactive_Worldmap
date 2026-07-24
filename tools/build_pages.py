#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
# SPDX-License-Identifier: MIT

"""Build the static GitHub Pages site from generated map data and src assets."""
from __future__ import annotations

import argparse
import base64
import gzip
import io
import json
import shutil
from pathlib import Path
from typing import Any

from build_manifest import deployment_source_mappings
from build_scenario_bundle import SCHEMA_VERSION, scenario_entry
from catalog_utils import sanitize_data_value
from input_contracts import load_required_json
from scenario_config import DEFAULT_SCENARIO

ROOT = Path(__file__).resolve().parents[1]
DATA_BUNDLE_SPDX_HEADER = """// SPDX-License-Identifier: LicenseRef-Terra-Invicta-Data
"""


def load_json(path: Path) -> Any:
    return sanitize_data_value(load_required_json(path))


def write_compact_json(path: Path, value: Any) -> None:
    write_text(path, json.dumps(value, ensure_ascii=False, separators=(",", ":")))


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def sync_static_assets(root: Path = ROOT) -> None:
    """Copy manifest assets and remove stale deployed browser modules."""
    mappings = deployment_source_mappings(root)
    expected_js = {
        (root / destination).resolve()
        for _, destination in mappings
        if destination.suffix == ".js"
    }
    assets = root / "docs/assets"
    if assets.exists():
        for existing in assets.rglob("*.js"):
            if existing.name == "data.generated.js":
                continue
            if existing.resolve() not in expected_js:
                existing.unlink()
        for directory in sorted(assets.rglob("*"), reverse=True):
            if directory.is_dir() and not any(directory.iterdir()):
                directory.rmdir()
    for source, destination in mappings:
        output = root / destination
        output.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(root / source, output)


def deterministic_gzip(data: bytes, compresslevel: int = 9) -> bytes:
    buffer = io.BytesIO()
    with gzip.GzipFile(filename="", mode="wb", fileobj=buffer, compresslevel=compresslevel, mtime=0) as stream:
        stream.write(data)
    return buffer.getvalue()


def default_scenario_bundle(
    region_map: dict[str, Any],
    claim_map: dict[str, Any],
    nation_catalog: dict[str, Any],
    research_catalog: dict[str, Any],
) -> dict[str, Any]:
    scenario = str(region_map.get("summary", {}).get("scenarioYear") or DEFAULT_SCENARIO)
    return {
        "schemaVersion": SCHEMA_VERSION,
        "defaultScenario": scenario,
        "scenarios": {
            scenario: scenario_entry(
                scenario,
                region_map=region_map,
                claim_map=claim_map,
                nation_catalog=nation_catalog,
                research_catalog=research_catalog,
            ),
        },
    }


def load_pages_inputs(root: Path = ROOT) -> dict[str, dict[str, Any]]:
    generated = root / "data" / "generated"
    region_map = load_json(generated / "region_map.generated.json")
    claim_map = load_json(generated / "claim_map.generated.json")
    nation_catalog = load_json(generated / "nations.catalog.json")
    research_catalog = load_json(generated / "research.catalog.json")
    scenario_bundle_path = generated / "scenario_bundle.generated.json"
    scenario_bundle = (
        load_json(scenario_bundle_path)
        if scenario_bundle_path.exists()
        else default_scenario_bundle(region_map, claim_map, nation_catalog, research_catalog)
    )
    return {
        "regionMap": region_map,
        "claimMap": claim_map,
        "nationCatalog": nation_catalog,
        "researchCatalog": research_catalog,
        "scenarioBundle": scenario_bundle,
    }


def assemble_runtime_bundle(inputs: dict[str, dict[str, Any]]) -> dict[str, Any]:
    region_map = inputs["regionMap"]
    scenario_bundle = inputs["scenarioBundle"]
    return {
        "schemaVersion": scenario_bundle.get("schemaVersion", SCHEMA_VERSION),
        "defaultScenario": scenario_bundle.get("defaultScenario")
        or str(region_map.get("summary", {}).get("scenarioYear") or DEFAULT_SCENARIO),
        "scenarios": scenario_bundle.get("scenarios") or {},
        "regionMap": region_map,
        "claimMap": inputs["claimMap"],
        "catalogs": {
            "nations": inputs["nationCatalog"],
            "research": inputs["researchCatalog"],
        },
    }


def encode_runtime_bundle(packed: dict[str, Any], *, chunk_size: int = 12_000) -> str:
    payload = json.dumps(packed, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    encoded = base64.b64encode(deterministic_gzip(payload, compresslevel=9)).decode("ascii")
    chunks = [encoded[index : index + chunk_size] for index in range(0, len(encoded), chunk_size)]
    return DATA_BUNDLE_SPDX_HEADER + """
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


def write_pages_outputs(root: Path, inputs: dict[str, dict[str, Any]], data_js: str) -> None:
    docs = root / "docs"
    (docs / "assets").mkdir(parents=True, exist_ok=True)
    (docs / "data").mkdir(parents=True, exist_ok=True)
    (docs / "data" / "generated").mkdir(parents=True, exist_ok=True)

    sync_static_assets(root)
    shutil.copyfile(
        root / "data/generated/nations.catalog.json",
        docs / "data/generated/nations.catalog.json",
    )
    shutil.copyfile(
        root / "data/generated/research.catalog.json",
        docs / "data/generated/research.catalog.json",
    )
    write_compact_json(docs / "data/region_map.generated.json", inputs["regionMap"])
    write_compact_json(docs / "data/claim_map.generated.json", inputs["claimMap"])
    write_compact_json(docs / "data/scenario_bundle.generated.json", inputs["scenarioBundle"])
    write_text(docs / "assets" / "data.generated.js", data_js)


def build_pages(root: Path = ROOT) -> None:
    inputs = load_pages_inputs(root)
    packed = assemble_runtime_bundle(inputs)
    write_pages_outputs(root, inputs, encode_runtime_bundle(packed))
    print("Wrote docs/index.html and generated assets")


def parse_args() -> argparse.Namespace:
    return argparse.ArgumentParser(description=__doc__).parse_args()


def main() -> int:
    parse_args()
    build_pages()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
