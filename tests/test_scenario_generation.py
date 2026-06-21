#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
# SPDX-License-Identifier: MIT

import sys
import unittest
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))

import build_scenario_bundle as sb
import scenario_rows as sr


def scenario_fixture(year: str) -> dict[str, object]:
    region_map = {
        "summary": {"scenarioYear": year, "regions": 2},
        "regions": [
            {"regionName": "Alpha", "nationTag": "AAA"},
            {"regionName": "Beta", "nationTag": ""},
        ],
    }
    claim_map = {
        "summary": {"scenarioYear": year},
        "claimStats": {
            "claimRowsNormalized": 3,
            "regionsMatched": 3,
            "regionsUnmatched": 0,
            "hostileClaimRowsNormalized": 1,
            "peacefulClaimRowsNormalized": 2,
            "projectClaimRowsNormalized": 1,
            "noResearchClaimRowsNormalized": 2,
            "gatedClaimRowsNormalized": 0,
            "existingNationCount": 1,
            "formableNationCount": 1,
            "breakawayGatedExistingNationCount": 0,
            "projectCount": 1,
        },
        "projects": {"Project_Test": {"id": "Project_Test"}},
        "claimsByNation": {
            "AAA": {
                "projects": [
                    {"project": "", "regions": ["Alpha"], "claims": {"Alpha": {"currentOwner": "AAA"}}},
                    {"project": "Project_Test", "regions": ["Beta"], "claims": {"Beta": {"currentOwner": ""}}},
                ]
            }
        },
        "nationMeta": {"AAA": {"tag": "AAA"}},
    }
    nation_catalog = {
        "counts": {"total": 2, "existsAtStart": 1},
        "nations": {"AAA": {"tag": "AAA"}, "BBB": {"tag": "BBB"}},
    }
    research_catalog = {
        "counts": {"claimGrantingProjects": 1},
        "nodes": [{"kind": "project", "dataName": "Project_Test"}],
    }
    return {
        "regionMap": region_map,
        "claimMap": claim_map,
        "nationCatalog": nation_catalog,
        "researchCatalog": research_catalog,
    }


class ScenarioGenerationTests(unittest.TestCase):
    def test_filter_prefers_scenario_rows_per_relation_type(self):
        rows = [
            {"dataName": "ClaimACEAceh", "relationType": "Claim", "nation1": "ACE", "region1": "Aceh"},
            {"dataName": "Claim2026_ACE2026_Aceh", "relationType": "Claim", "nation1": "2026_ACE", "region1": "2026_Aceh"},
            {"dataName": "Claim2070_ACE2070_Aceh", "relationType": "Claim", "nation1": "2070_ACE", "region1": "2070_Aceh"},
            {"dataName": "BreakawayACEAAA", "relationType": "Breakaway", "nation1": "ACE", "nation2": "AAA"},
        ]

        rows_2022 = sr.filter_bilateral_rows_for_scenario(rows, "2022", relation_types=("Claim", "Breakaway"))
        rows_2026 = sr.filter_bilateral_rows_for_scenario(rows, "2026", relation_types=("Claim", "Breakaway"))

        self.assertEqual([row["dataName"] for row in rows_2022], ["ClaimACEAceh", "BreakawayACEAAA"])
        self.assertEqual([row["dataName"] for row in rows_2026], ["Claim2026_ACE2026_Aceh", "BreakawayACEAAA"])

    def test_filter_excludes_mismatched_scenario_rows(self):
        rows = [
            {"dataName": "Claim2026_ACE2026_Aceh", "relationType": "Claim", "nation1": "2026_ACE", "region1": "2026_Aceh"},
            {"dataName": "Claim2070_ACE2070_Aceh", "relationType": "Claim", "nation1": "2070_ACE", "region1": "2070_Aceh"},
        ]

        self.assertEqual(
            [row["dataName"] for row in sr.filter_bilateral_rows_for_scenario(rows, "2070", relation_types=("Claim",))],
            ["Claim2070_ACE2070_Aceh"],
        )

    def test_scenario_bundle_records_default_and_summary_counts(self):
        bundle = sb.build_scenario_bundle({year: scenario_fixture(year) for year in sb.SUPPORTED_SCENARIOS})

        self.assertEqual(bundle["schemaVersion"], 2)
        self.assertEqual(bundle["defaultScenario"], "2026")
        self.assertEqual(list(bundle["scenarios"]), ["2022", "2026", "2070"])
        summary = bundle["scenarios"]["2026"]["summary"]
        self.assertEqual(summary["regionCount"], 2)
        self.assertEqual(summary["ownedRegionCount"], 1)
        self.assertEqual(summary["nationCount"], 2)
        self.assertEqual(summary["zeroRegionNationCount"], 1)
        self.assertEqual(summary["claimRowsNormalized"], 3)

    def test_scenario_bundle_rejects_missing_scenarios(self):
        with self.assertRaises(ValueError):
            sb.build_scenario_bundle({"2026": scenario_fixture("2026")})


if __name__ == "__main__":
    unittest.main()
