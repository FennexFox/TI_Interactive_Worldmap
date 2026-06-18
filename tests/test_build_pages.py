import gzip
import sys
import unittest
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))

import build_pages


class BuildPagesTests(unittest.TestCase):
    def test_deterministic_gzip_has_stable_header_and_payload(self):
        payload = b'{"stable":true}'

        first = build_pages.deterministic_gzip(payload)
        second = build_pages.deterministic_gzip(payload)

        self.assertEqual(first, second)
        self.assertEqual(first[4:8], b"\x00\x00\x00\x00")
        self.assertEqual(gzip.decompress(first), payload)


if __name__ == "__main__":
    unittest.main()
