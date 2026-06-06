from __future__ import annotations

import csv
import json
import logging
from datetime import date, datetime
from functools import lru_cache
from pathlib import Path
from typing import Any

import requests

try:
    from fastapi import FastAPI, HTTPException, Query
except Exception:  # pragma: no cover
    class HTTPException(Exception):
        def __init__(self, status_code: int, detail: str):
            super().__init__(detail)
            self.status_code = status_code
            self.detail = detail

    class FastAPI:  # minimal fallback for local non-web tests
        def __init__(self, *_args: Any, **_kwargs: Any):
            pass

        def get(self, *_args: Any, **_kwargs: Any):
            def decorator(func):
                return func

            return decorator

    def Query(default: Any, **_kwargs: Any) -> Any:
        return default


logger = logging.getLogger(__name__)

app = FastAPI(title="Painel Dengue - Backend")

ROOT_DIR = Path(__file__).resolve().parents[1]
DENGUE_CSV_PATH = ROOT_DIR / "DENGBR26.csv"
MAPPING_PATH = ROOT_DIR / "dsei_municipios_mapping.json"

DATE_COLUMNS = ("DT_SIN_PRI", "DT_NOTIFIC", "DT_SINTO")
SANITATION_ENDPOINTS = {
    "esgotamento_sanitario": "https://apidadosabertos.saude.gov.br/saude-indigena/sasisus-esgotamento-sanitario",
    "residuos_solidos": "https://apidadosabertos.saude.gov.br/saude-indigena/sasi-sus-gerenciamento-de-residuos-solidos",
}


def normalize_ibge_code(value: Any) -> str | None:
    if value is None:
        return None

    raw = str(value).strip()
    if not raw:
        return None

    digits = "".join(ch for ch in raw if ch.isdigit())
    if not digits:
        return None

    return digits[:6] if len(digits) >= 6 else digits.zfill(6)


@lru_cache(maxsize=1)
def load_mapping() -> dict[str, set[str]]:
    with open(MAPPING_PATH, "r", encoding="utf-8") as file:
        mapping = json.load(file)

    normalized: dict[str, set[str]] = {}
    for dsei, municipios in mapping.items():
        normalized[dsei.upper()] = {
            code for code in (normalize_ibge_code(m) for m in municipios) if code
        }

    return normalized


@lru_cache(maxsize=1)
def load_dengue_rows() -> list[dict[str, str]]:
    logger.info("[load_dengue_csv] Carregando %s para a memória (uma vez)...", DENGUE_CSV_PATH)

    rows: list[dict[str, str]] = []
    with open(DENGUE_CSV_PATH, "r", encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file)
        if not reader.fieldnames:
            raise RuntimeError("CSV de dengue sem cabeçalho")

        if "CS_RACA" not in reader.fieldnames or "ID_MUNICIP" not in reader.fieldnames:
            raise RuntimeError("CSV de dengue não contém CS_RACA e ID_MUNICIP")

        for row in reader:
            normalized_code = normalize_ibge_code(row.get("ID_MUNICIP"))
            if normalized_code is None:
                continue
            row["ID_MUNICIP"] = normalized_code
            rows.append(row)

    logger.info("[load_dengue_csv] Carregamento concluído. %s linhas na memória.", len(rows))
    return rows


def parse_possible_date(raw: str | None) -> date | None:
    if raw is None:
        return None

    value = raw.strip()
    if not value:
        return None

    formats = ("%Y-%m-%d", "%Y%m%d", "%d/%m/%Y")
    for fmt in formats:
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue

    return None


def count_dengue_cases(
    data_init: date,
    data_end: date,
    municipality_codes: set[str] | None,
) -> int:
    total = 0
    for row in load_dengue_rows():
        if row.get("CS_RACA") != "5":
            continue

        municipality = row.get("ID_MUNICIP")
        # Critical fix for the observed backend error:
        # unknown municipality codes must be ignored instead of causing KeyError.
        if municipality_codes is not None and municipality not in municipality_codes:
            continue

        row_date: date | None = None
        for col in DATE_COLUMNS:
            row_date = parse_possible_date(row.get(col))
            if row_date is not None:
                break

        if row_date is not None and not (data_init <= row_date <= data_end):
            continue

        total += 1

    return total


def fetch_json(url: str) -> list[dict[str, Any]]:
    logger.info("[fetch_json] Realizando chamada GET para: %s", url)
    response = requests.get(url, timeout=30)
    logger.info("[fetch_json] Resposta recebida de %s: Status %s", url, response.status_code)
    response.raise_for_status()
    data = response.json()
    return data if isinstance(data, list) else []


@app.get("/api/all_data")
def get_all_data(
    data_init: date = Query(..., description="Data inicial no formato YYYY-MM-DD"),
    data_end: date = Query(..., description="Data final no formato YYYY-MM-DD"),
    dsei: str | None = Query(None, description="Nome do DSEI (opcional)"),
) -> dict[str, Any]:
    if data_init > data_end:
        raise HTTPException(status_code=400, detail="data_init não pode ser maior que data_end")

    mapping = load_mapping()

    selected_codes: set[str] | None = None
    if dsei:
        selected_codes = mapping.get(dsei.upper())
        if selected_codes is None:
            raise HTTPException(status_code=404, detail=f"DSEI não encontrado: {dsei}")

    try:
        dengue_cases = count_dengue_cases(data_init, data_end, selected_codes)
    except Exception as exc:
        logger.exception("Falha ao processar dados de dengue")
        raise HTTPException(status_code=500, detail="Falha ao processar dados de dengue") from exc

    sanitation_data: dict[str, list[dict[str, Any]]] = {}
    for key, endpoint in SANITATION_ENDPOINTS.items():
        try:
            sanitation_data[key] = fetch_json(endpoint)
        except Exception:
            logger.exception("Falha ao buscar %s", key)
            sanitation_data[key] = []

    return {
        "data_init": data_init.isoformat(),
        "data_end": data_end.isoformat(),
        "dsei": dsei,
        "dengue_cases": dengue_cases,
        **sanitation_data,
    }
