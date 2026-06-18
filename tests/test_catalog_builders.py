import json
import sys
import tempfile
import unittest
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))

import build_claim_data as cd
import build_nation_catalog as nc
import build_region_outline_data as ro
import build_research_catalog as rc


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")


def write_text(path: Path, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(value, encoding="utf-8")


class CatalogBuilderTests(unittest.TestCase):
    def test_region_map_uses_scenario_template_display_and_owner_names(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            templates_dir = root / "Templates"
            write_json(
                templates_dir / "TINationTemplate.json",
                [
                    {"dataName": "2026_USA", "friendlyName": "2026_United States of America"},
                    {"dataName": "2026_SAU", "friendlyName": "2026_Saudi Arabia"},
                    {"dataName": "2026_IRL", "friendlyName": "2026_Ireland"},
                    {"dataName": "2026_GTM", "friendlyName": "2026_Guatemala"},
                    {"dataName": "2026_KOR", "friendlyName": "2026_South Korea"},
                    {"dataName": "GUA", "friendlyName": "Liangguang"},
                ],
            )
            write_json(
                templates_dir / "TIRegionTemplate.json",
                [
                    {"dataName": "2026_RockyMountains", "mapRegionName": "map_RockyMountains", "primaryCity": "Denver", "sortNation": "USA"},
                    {"dataName": "2026_SouthKorea", "mapRegionName": "map_SouthKorea", "primaryCity": "Seoul", "sortNation": "SouthKorea"},
                    {"dataName": "2026_Hijaz", "mapRegionName": "map_Hijaz", "primaryCity": "Jeddah", "sortNation": "Saudi Arabia"},
                    {"dataName": "2026_Ireland", "mapRegionName": "map_Ireland", "primaryCity": "Dublin", "sortNation": "Ireland"},
                    {"dataName": "2026_Guatemala", "mapRegionName": "map_Guatemala", "primaryCity": "Guatemala City", "sortNation": "Guatemala"},
                ],
            )
            write_json(
                templates_dir / "TIMapRegionTemplate.json",
                [
                    {"dataName": "map_RockyMountains", "friendlyNationName": "USA"},
                    {"dataName": "map_SouthKorea", "friendlyNationName": "South Korea"},
                    {"dataName": "map_Hijaz", "friendlyNationName": "Saudi Arabia"},
                    {"dataName": "map_Ireland", "friendlyNationName": "Ireland"},
                    {"dataName": "map_Guatemala", "friendlyNationName": "Guatemala"},
                ],
            )
            write_text(
                root / "Localization" / "en" / "TIRegionTemplate.en",
                "\n".join(
                    [
                        "TIRegionTemplate.displayName.RockyMountains=Denver",
                        "TIRegionTemplate.displayName.SouthKorea=Seoul",
                        "TIRegionTemplate.displayName.Hijaz=Jeddah",
                        "TIRegionTemplate.displayName.Ireland=Dublin",
                        "TIRegionTemplate.displayName.Guatemala=Guatemala City",
                    ]
                ),
            )
            raw = {
                "collectionName": "fixture",
                "width": 10,
                "height": 10,
                "regions": [
                    {"regionName": "RockyMountains", "nationTag": "USA", "path": "M 0 0 L 1 0 L 0 1 Z"},
                    {"regionName": "SouthKorea", "nationTag": "KOR", "path": "M 1 0 L 2 0 L 1 1 Z"},
                    {"regionName": "Hijaz", "nationTag": "SEN", "path": "M 2 0 L 3 0 L 2 1 Z"},
                    {"regionName": "Ireland", "nationTag": "EUA", "path": "M 3 0 L 4 0 L 3 1 Z"},
                    {"regionName": "Guatemala", "nationTag": "GUA", "path": "M 4 0 L 5 0 L 4 1 Z"},
                ],
            }

            metadata = ro.load_region_metadata(templates_dir, ["en"], "2026")
            region_map = ro.compact_region_outlines(raw, region_metadata=metadata, scenario_year="2026")
            by_name = {row["regionName"]: row for row in region_map["regions"]}

            self.assertEqual(region_map["summary"]["scenarioYear"], "2026")
            self.assertEqual(by_name["RockyMountains"]["displayName"]["en"], "Denver")
            self.assertEqual(by_name["SouthKorea"]["displayName"]["en"], "Seoul")
            self.assertEqual(by_name["Hijaz"]["nationTag"], "SAU")
            self.assertEqual(by_name["Ireland"]["nationTag"], "IRL")
            self.assertEqual(by_name["Guatemala"]["nationTag"], "GTM")
            self.assertEqual(by_name["Guatemala"]["outlineNationTag"], "GUA")

    def test_region_map_strips_inline_data_comments_from_display_names(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            templates_dir = root / "Templates"
            write_json(
                templates_dir / "TINationTemplate.json",
                [{"dataName": "2026_ETH", "friendlyName": "2026_Ethiopia"}],
            )
            write_json(
                templates_dir / "TIRegionTemplate.json",
                [
                    {
                        "dataName": "2026_DireDiwa",
                        "mapRegionName": "map_DireDiwa",
                        "primaryCity": "Dire Dawa",
                        "sortNation": "Ethiopia",
                    }
                ],
            )
            write_json(
                templates_dir / "TIMapRegionTemplate.json",
                [{"dataName": "map_DireDiwa", "friendlyNationName": "Ethiopia"}],
            )
            write_text(
                root / "Localization" / "en" / "TIRegionTemplate.en",
                "TIRegionTemplate.displayName.DireDiwa=Dire Dawa\t\t// dataname misspelled\n",
            )
            write_text(
                root / "Localization" / "kor" / "TIRegionTemplate.kor",
                "TIRegionTemplate.displayName.DireDiwa=디레다와 // / dataname misspelled\n",
            )
            write_text(
                root / "Localization" / "en" / "TINationTemplate.en",
                "TINationTemplate.displayName.ETH=Ethiopia\n",
            )
            raw = {
                "collectionName": "fixture",
                "width": 10,
                "height": 10,
                "regions": [
                    {
                        "regionName": "DireDiwa",
                        "nationTag": "ETH",
                        "path": "M 0 0 L 1 0 L 0 1 Z",
                        "labels": [{"name": "Dire Dawa  // dataname misspelled", "x": 0.5, "y": 0.5}],
                    }
                ],
            }

            metadata = ro.load_region_metadata(templates_dir, ["kor", "en"], "2026")
            region_map = ro.compact_region_outlines(raw, region_metadata=metadata, scenario_year="2026")
            row = region_map["regions"][0]

            self.assertEqual(row["displayName"]["en"], "Dire Dawa")
            self.assertEqual(row["displayName"]["kor"], "디레다와")
            self.assertEqual(row["name"], "ETH - Dire Dawa")
            self.assertEqual(row["labels"][0]["name"], "Dire Dawa")
            self.assertNotIn("//", json.dumps(row, ensure_ascii=False))

    def test_region_geometry_accepts_unitypy_poly_data_wrappers(self):
        region = {
            "regionName": "FixtureRegion",
            "poly2DList": [
                {
                    "data": [
                        {"anchor": {"x": 0, "y": 0}},
                        {"anchor": {"x": 1, "y": 0}},
                        {"anchor": {"x": 0, "y": 1}},
                    ]
                }
            ],
        }

        paths, points_for_bounds, total_points, labels = ro.compact_region_geometry(region)

        self.assertEqual(
            paths,
            ["M 0.000000 0.000000 L 1.000000 0.000000 L 0.000000 1.000000 Z"],
        )
        self.assertEqual(points_for_bounds, [(0.0, 0.0), (1.0, 0.0), (0.0, 1.0)])
        self.assertEqual(total_points, 3)
        self.assertEqual(labels, [])

    def test_region_geometry_accepts_label_position_fallback_keys(self):
        region = {
            "regionName": "FixtureRegion",
            "poly2DList": [
                [
                    {"anchor": [0, 0]},
                    {"anchor": [1, 0]},
                    {"anchor": [0, 1]},
                ]
            ],
            "labelPositions": [
                {"name": "Legacy", "pos": {"anchor": [0.1, 0.2]}},
                {"labelName": "Council", "labelPosition": {"anchor": {"x": 0.3, "y": 0.4}}},
                {"labelName": "Facility", "position": {"anchor": {"x": 0.5, "y": 0.6}}},
                {"labelName": "Ignored", "labelPosition": {}},
            ],
        }

        _paths, _points_for_bounds, _total_points, labels = ro.compact_region_geometry(region)

        self.assertEqual(
            labels,
            [
                {"name": "Legacy", "x": 0.1, "y": 0.2},
                {"name": "Council", "x": 0.3, "y": 0.4},
                {"name": "Facility", "x": 0.5, "y": 0.6},
            ],
        )

    def test_nation_catalog_uses_template_names_not_region_names(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            templates_dir = root / "Templates"
            write_json(
                templates_dir / "TINationTemplate.json",
                [
                    {"dataName": "2026_CAN", "friendlyName": "2026_Canada"},
                    {"dataName": "CAN", "friendlyName": "Canada"},
                    {"dataName": "SAU", "friendlyName": "Saudi Arabia"},
                ],
            )
            write_text(
                root / "Localization" / "en" / "TINationTemplate.en",
                "\n".join(
                    [
                        "TINationTemplate.displayName.CAN=Canada",
                        "TINationTemplate.displayName.2026_CAN=Canada",
                        "TINationTemplate.displayName.SAU=Saudi Arabia",
                    ]
                ),
            )
            write_text(
                root / "Localization" / "kor" / "TINationTemplate.kor",
                "\n".join(
                    [
                        "TINationTemplate.displayName.CAN=Canada Local",
                        "TINationTemplate.displayName.SAU=Saudi Local",
                    ]
                ),
            )
            region_map = {
                "regions": [
                    {"regionName": "Ontario", "nationTag": "CAN"},
                    {"regionName": "Senegambia", "nationTag": "SEN"},
                ]
            }
            bilateral_rows = [
                {"relationType": "Claim", "nation1": "SAU", "region1": "Senegambia"},
                {"relationType": "Breakaway", "nation1": "SEN", "nation2": "SAU"},
            ]

            catalog = nc.build_catalog(
                templates_dir,
                ["kor", "en"],
                region_map=region_map,
                bilateral_rows=bilateral_rows,
            )

            self.assertEqual(catalog["nations"]["CAN"]["displayName"]["en"], "Canada")
            self.assertNotIn("2026_CAN", catalog["nations"])
            self.assertIn("Canada Local", catalog["nations"]["CAN"]["aliases"])
            self.assertEqual(catalog["nations"]["SEN"]["aliases"], ["SEN"])
            self.assertTrue(catalog["nations"]["SEN"]["existsAtStart"])
            self.assertTrue(catalog["nations"]["SEN"]["isBreakaway"])
            self.assertNotIn("Senegambia", catalog["nations"]["SEN"]["aliases"])

    def test_nation_catalog_preserves_base_and_union_labels(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            templates_dir = root / "Templates"
            write_json(
                templates_dir / "TINationTemplate.json",
                [
                    {"dataName": "INO", "friendlyName": "Java"},
                    {"dataName": "2026_INO", "friendlyName": "2026_Indonesia"},
                ],
            )
            write_text(
                root / "Localization" / "en" / "TINationTemplate.en",
                "\n".join(
                    [
                        "TINationTemplate.displayName.INO=Java",
                        "TINationTemplate.displayName.2026_INO=Indonesia",
                    ]
                ),
            )

            catalog = nc.build_catalog(templates_dir, ["en"], scenario_year="2026")

            self.assertEqual(catalog["nations"]["INO"]["displayName"]["en"], "Indonesia")
            self.assertEqual(catalog["nations"]["INO"]["baseDisplayName"]["en"], "Java")
            self.assertEqual(catalog["nations"]["INO"]["unionDisplayName"], {})
            self.assertIn("Indonesia", catalog["nations"]["INO"]["aliases"])
            self.assertIn("Java", catalog["nations"]["INO"]["aliases"])

    def test_nation_catalog_derives_union_label_from_scenario_template(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            templates_dir = root / "Templates"
            write_json(
                templates_dir / "TINationTemplate.json",
                [
                    {"dataName": "IDN", "friendlyName": "Java"},
                    {"dataName": "2026_IDN", "friendlyName": "2026_Indonesia"},
                ],
            )
            write_text(
                root / "Localization" / "en" / "TINationTemplate.en",
                "TINationTemplate.displayName.IDN=Java\n",
            )

            catalog = nc.build_catalog(templates_dir, ["en"], scenario_year="2026")
            entry = catalog["nations"]["IDN"]

            self.assertEqual(entry["displayName"]["en"], "Java")
            self.assertEqual(entry["baseDisplayName"]["en"], "Java")
            self.assertEqual(entry["unionDisplayName"]["en"], "Indonesia")
            self.assertIn("Java", entry["aliases"])
            self.assertIn("Indonesia", entry["aliases"])
            self.assertNotIn("data/manual/nation_display_overrides.json", entry["source"]["localizationKeys"])

    def test_region_outline_owner_name_prefers_matching_scenario_localization(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            templates_dir = root / "Templates"
            write_json(
                templates_dir / "TINationTemplate.json",
                [
                    {"dataName": "INO", "friendlyName": "Java"},
                    {"dataName": "2026_INO", "friendlyName": "2026_Indonesia"},
                ],
            )
            write_json(
                templates_dir / "TIRegionTemplate.json",
                [
                    {
                        "dataName": "2026_Java",
                        "mapRegionName": "map_Java",
                        "primaryCity": "Jakarta",
                        "sortNation": "Indonesia",
                    }
                ],
            )
            write_json(
                templates_dir / "TIMapRegionTemplate.json",
                [{"dataName": "map_Java", "friendlyNationName": "Indonesia"}],
            )
            write_text(
                root / "Localization" / "en" / "TINationTemplate.en",
                "\n".join(
                    [
                        "TINationTemplate.displayName.INO=Java",
                        "TINationTemplate.displayName.2026_INO=Indonesia",
                    ]
                ),
            )
            write_text(
                root / "Localization" / "en" / "TIRegionTemplate.en",
                "TIRegionTemplate.displayName.Java=Jakarta\n",
            )
            raw = {
                "collectionName": "fixture",
                "width": 10,
                "height": 10,
                "regions": [
                    {"regionName": "Java", "nationTag": "INO", "path": "M 0 0 L 1 0 L 0 1 Z"},
                ],
            }

            metadata = ro.load_region_metadata(templates_dir, ["en"], "2026")
            region_map = ro.compact_region_outlines(raw, region_metadata=metadata, scenario_year="2026")
            row = region_map["regions"][0]

            self.assertEqual(row["nationTag"], "INO")
            self.assertEqual(row["displayName"]["en"], "Jakarta")
            self.assertEqual(row["ownerName"], "Indonesia")

    def test_manual_nation_display_override_is_nonessential_for_union_label(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            templates_dir = root / "Templates"
            write_json(
                templates_dir / "TINationTemplate.json",
                [
                    {"dataName": "IDN", "friendlyName": "Java"},
                    {"dataName": "2026_IDN", "friendlyName": "2026_Indonesia"},
                ],
            )
            write_text(
                root / "Localization" / "en" / "TINationTemplate.en",
                "TINationTemplate.displayName.IDN=Java\n",
            )

            catalog = nc.build_catalog(templates_dir, ["en"], nation_display_overrides={})
            display_names = ro.load_nation_display_names(templates_dir, ["en"], "2026", {})

            self.assertEqual(catalog["nations"]["IDN"]["displayName"]["en"], "Java")
            self.assertEqual(catalog["nations"]["IDN"]["unionDisplayName"]["en"], "Indonesia")
            self.assertEqual(display_names["IDN"], "Indonesia")
            self.assertIn("Indonesia", catalog["nations"]["IDN"]["aliases"])
            self.assertIn("Java", catalog["nations"]["IDN"]["aliases"])

    def test_research_catalog_records_claim_granting_projects(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            templates_dir = root / "Templates"
            write_json(
                templates_dir / "TITechTemplate.json",
                [
                    {"dataName": "Tech_Alpha", "friendlyName": "Alpha", "researchCost": 100},
                    {"dataName": "Tech_Beta", "friendlyName": "Beta", "researchCost": 200},
                ],
            )
            write_json(
                templates_dir / "TIProjectTemplate.json",
                [
                    {
                        "dataName": "Project_TestClaim",
                        "friendlyName": "Test Claim",
                        "researchCost": 500,
                        "techCategory": "SocialScience",
                        "prereqs": ["Tech_Alpha"],
                        "altPrereq0": "Tech_Beta",
                        "requiresNation": "SAU",
                    }
                ],
            )
            write_text(
                root / "Localization" / "en" / "TIProjectTemplate.en",
                "TIProjectTemplate.displayName.Project_TestClaim=Test Claim Project\n",
            )

            catalog = rc.build_catalog(
                templates_dir,
                ["en"],
                bilateral_rows=[
                    {
                        "relationType": "Claim",
                        "nation1": "SAU",
                        "region1": "Raw_Senegambia",
                        "projectUnlockName": "Project_TestClaim",
                    }
                ],
                aliases={"Raw_Senegambia": "Senegambia"},
            )
            node = catalog["nodes"][catalog["byDataName"]["Project_TestClaim"]]

            self.assertEqual(node["displayName"]["en"], "Test Claim Project")
            self.assertEqual(node["claimGrant"]["nations"], ["SAU"])
            self.assertEqual(node["claimGrant"]["regions"], ["Senegambia"])
            self.assertEqual(
                node["requirements"]["all"][0],
                {
                    "any": [
                        {"node": "Tech_Alpha", "kind": "tech"},
                        {"node": "Tech_Beta", "kind": "tech"},
                    ]
                },
            )
            self.assertEqual(node["requirements"]["all"][1], {"nation": "SAU"})

    def test_claim_data_consumes_catalog_metadata(self):
        nation_catalog = {
            "nations": {
                "CAN": {
                    "tag": "CAN",
                    "displayName": {"en": "Canada"},
                    "baseDisplayName": {"en": "Canada"},
                    "unionDisplayName": {"en": "Dominion of Canada"},
                    "friendlyName": "Canada",
                    "aliases": ["CAN", "Canada", "Dominion of Canada"],
                },
                "SEN": {"tag": "SEN", "aliases": ["SEN"]},
            }
        }
        research_catalog = {
            "nodes": [
                {
                    "dataName": "Project_TestClaim",
                    "kind": "project",
                    "displayName": {"en": "Test Claim Project"},
                    "friendlyName": "Test Claim",
                    "researchCost": 500,
                    "category": "SocialScience",
                    "prerequisiteNodes": ["Tech_Alpha"],
                    "requirements": {"all": [{"node": "Tech_Alpha", "kind": "tech"}]},
                }
            ]
        }
        region_map = {
            "summary": {"regions": 2},
            "regions": [
                {"regionName": "Ontario", "nationTag": "CAN"},
                {"regionName": "Senegambia", "nationTag": "SEN"},
            ],
        }

        data = cd.build_claim_data(
            region_map=region_map,
            bilateral_rows=[
                {
                    "relationType": "Claim",
                    "nation1": "CAN",
                    "region1": "Senegambia",
                    "projectUnlockName": "Project_TestClaim",
                }
            ],
            aliases={},
            project_template_meta=cd.project_metadata_from_research_catalog(research_catalog),
            nation_template_meta=cd.catalog_nation_metadata(nation_catalog),
        )

        self.assertEqual(data["nationMeta"]["CAN"]["displayName"]["en"], "Canada")
        self.assertEqual(data["nationMeta"]["CAN"]["unionDisplayName"]["en"], "Dominion of Canada")
        self.assertEqual(data["nationMeta"]["SEN"]["aliases"], ["SEN"])
        self.assertEqual(data["projects"]["Project_TestClaim"]["label"], "Test Claim Project")
        self.assertEqual(data["projects"]["Project_TestClaim"]["prerequisiteNodes"], ["Tech_Alpha"])


if __name__ == "__main__":
    unittest.main()
