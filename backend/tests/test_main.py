import unittest
from datetime import date
from unittest.mock import patch

from backend import main


class BackendMainTests(unittest.TestCase):
    def test_normalize_ibge_code_keeps_first_six_digits(self):
        self.assertEqual(main.normalize_ibge_code("3205007"), "320500")
        self.assertEqual(main.normalize_ibge_code("320500"), "320500")

    def test_count_dengue_cases_ignores_unknown_municipality_codes_without_error(self):
        rows = [
            {"CS_RACA": "5", "ID_MUNICIP": "320500", "DT_SIN_PRI": "2026-04-10"},
            {"CS_RACA": "5", "ID_MUNICIP": "130380", "DT_SIN_PRI": "2026-04-12"},
            {"CS_RACA": "1", "ID_MUNICIP": "130380", "DT_SIN_PRI": "2026-04-15"},
        ]

        with patch("backend.main.load_dengue_rows", return_value=rows):
            result = main.count_dengue_cases(
                data_init=date(2026, 4, 1),
                data_end=date(2026, 4, 30),
                municipality_codes={"130380"},
            )

        self.assertEqual(result, 1)


if __name__ == "__main__":
    unittest.main()
