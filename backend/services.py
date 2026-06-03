import httpx
from datetime import datetime
from constants import DSEI_IBGE_MAPPING
import json
import os
import logging

# Configure logger
logger = logging.getLogger("uvicorn.error")

# URLs das APIs baseadas no APIS.md
URL_ESGOTO = "https://apidadosabertos.saude.gov.br/saude-indigena/sasisus-esgotamento-sanitario"
URL_RESIDUOS = "https://apidadosabertos.saude.gov.br/saude-indigena/sasi-sus-gerenciamento-de-residuos-solidos"
URL_AGUA = "https://apidadosabertos.saude.gov.br/saude-indigena/planilha-de-fornecimento-e-monitoramento-da-qualidade-da-agua-acesso-a-agua"
URL_DENGUE = "https://apidadosabertos.saude.gov.br/arboviroses/dengue"

async def fetch_json(client: httpx.AsyncClient, url: str) -> dict:
    try:
        logger.info(f"[fetch_json] Realizando chamada GET para: {url}")
        response = await client.get(url, timeout=15.0)
        logger.info(f"[fetch_json] Resposta recebida de {url}: Status {response.status_code}")
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"[fetch_json] Falha na chamada para {url}: {e}")
        return {}

async def fetch_agua(client: httpx.AsyncClient, dsei: str) -> dict:
    data = await fetch_json(client, URL_AGUA)
    rows = data.get("fornecimento_monitoramento_qualidade_acesso_agua", [])
    logger.info(f"[fetch_agua] DSEI: {dsei} | Itens recebidos da API: {len(rows)}")
    for item in rows:
        if item.get("dsei") == dsei:
            return item
    
    logger.warning(f"[fetch_agua] DSEI: {dsei} | Dados não encontrados na API. Tentando arquivo de fallback.")
    try:
        if not data:
            with open("planilha-de-fornecimento-e-monitoramento-da-qualidade-da-agua-acesso-a-agua-exemplo.json", "r") as f:
                local_data = json.load(f)
                for item in local_data.get("fornecimento_monitoramento_qualidade_acesso_agua", []):
                    if item.get("dsei") == dsei:
                        return item
    except:
        pass
    return {}

async def fetch_residuos(client: httpx.AsyncClient, dsei: str) -> dict:
    data = await fetch_json(client, URL_RESIDUOS)
    rows = data.get("gerenciamento_residuos_solidos", [])
    logger.info(f"[fetch_residuos] DSEI: {dsei} | Itens recebidos da API: {len(rows)}")
    for item in rows:
        if item.get("distrito_sanitario_especial_indigena_dsei") == dsei:
            return item
            
    logger.warning(f"[fetch_residuos] DSEI: {dsei} | Dados não encontrados na API. Tentando fallback.")
    try:
        if not data:
            with open("sasi-sus-gerenciamento-de-residuos-solidos_exemplo.json", "r") as f:
                local_data = json.load(f)
                for item in local_data.get("gerenciamento_residuos_solidos", []):
                    if item.get("distrito_sanitario_especial_indigena_dsei") == dsei:
                        return item
    except:
        pass
    return {}

async def fetch_esgoto(client: httpx.AsyncClient, dsei: str) -> dict:
    data = await fetch_json(client, URL_ESGOTO)
    rows = data.get("esgotamento_sanitario", [])
    logger.info(f"[fetch_esgoto] DSEI: {dsei} | Itens recebidos da API: {len(rows)}")
    for item in rows:
        if item.get("distrito_sanitario_especial_indigena") == dsei:
            return item
            
    logger.warning(f"[fetch_esgoto] DSEI: {dsei} | Dados não encontrados na API. Tentando fallback.")
    try:
        if not data:
            with open("sasisus-esgotamento-sanitario_exemplo.json", "r") as f:
                local_data = json.load(f)
                for item in local_data.get("esgotamento_sanitario", []):
                    if item.get("distrito_sanitario_especial_indigena") == dsei:
                        return item
    except:
        pass
    return {}

import csv

DENGUE_CACHE = None

def load_dengue_csv():
    global DENGUE_CACHE
    if DENGUE_CACHE is not None:
        return DENGUE_CACHE
        
    csv_path = os.path.join(os.path.dirname(__file__), "..", "DENGBR26.csv")
    if not os.path.exists(csv_path):
        logger.error(f"[load_dengue_csv] Arquivo CSV não encontrado: {csv_path}")
        return []
        
    cache = []
    logger.info(f"[load_dengue_csv] Carregando {csv_path} para a memória (uma vez)...")
    try:
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                cache.append({
                    "DT_NOTIFIC": row.get("DT_NOTIFIC", ""),
                    "ID_MUNICIP": row.get("ID_MUNICIP", ""),
                    "CS_RACA": row.get("CS_RACA", "")
                })
        DENGUE_CACHE = cache
        logger.info(f"[load_dengue_csv] Carregamento concluído. {len(cache)} linhas na memória.")
    except Exception as e:
        logger.error(f"[load_dengue_csv] Erro ao ler CSV: {e}")
        
    return DENGUE_CACHE or []

async def fetch_dengue(client: httpx.AsyncClient, dsei: str, data_init: str, data_end: str) -> tuple[int, list[dict]]:
    ibge_codes = DSEI_IBGE_MAPPING.get(dsei, [])
    if not ibge_codes:
        return 0, []

    ibge_6digits = [str(code)[:6] for code in ibge_codes]

    casos = 0
    mensal = {str(i).zfill(2): 0 for i in range(1, 13)}
    
    try:
        start_date = datetime.strptime(data_init, "%Y-%m-%d").date()
        end_date = datetime.strptime(data_end, "%Y-%m-%d").date()
        if end_date < start_date:
            raise ValueError("data_end cannot be earlier than data_init")

        rows = load_dengue_csv()
        
        for row in rows:
            dt_case = row.get("DT_NOTIFIC", "")
            try:
                case_date = datetime.strptime(dt_case, "%Y-%m-%d").date()
            except ValueError:
                continue

            if case_date < start_date or case_date > end_date:
                continue

            ibge_resi = str(row.get("ID_MUNICIP", ""))
            if ibge_resi in ibge_6digits and str(row.get("CS_RACA")) == "5":
                casos += 1
                month = f"{case_date.month:02d}"
                if month in mensal:
                    mensal[month] += 1
                
        logger.info(f"[fetch_dengue] Casos totais (indígena + DSEI + datas): {casos}")
        
        casos_mensal = [{"month": k, "cases": v} for k, v in mensal.items()]
                
        if casos == 0:
            logger.info("NAO TEM DADOS")
            return 0, casos_mensal
        else:
            logger.info(f"[fetch_dengue] Dados processados: {casos}")

            
    except Exception as e:
        logger.error(f"[fetch_dengue] Falha ao processar: {e}")
        logger.info("NAO TEM DADOS")
        return 0, []

    return casos, casos_mensal

def format_ai_markdown(data: dict) -> str:
    md = f"### {data.get('title', 'Proposta de Intervenção')}\n\n"
    
    if "executive_summary" in data:
        md += f"**Resumo Executivo:**\n{data['executive_summary']}\n\n"
        
    if "situation_summary" in data:
        md += f"**Situação Atual:**\n{data['situation_summary']}\n\n"
        
    md += "---\n\n"
    
    if "immediate_actions_0_7_days" in data:
        md += "#### Ações Imediatas (0-7 Dias)\n"
        for act in data["immediate_actions_0_7_days"]:
            md += f"- **{act.get('action')}**\n  - *Justificativa:* {act.get('justification')}\n  - *Responsável:* {act.get('responsible_actor')}\n"
        md += "\n"
        
    if "short_term_actions_30_days" in data:
        md += "#### Ações de Curto Prazo (30 Dias)\n"
        for act in data["short_term_actions_30_days"]:
            md += f"- **{act.get('action')}**\n  - *Justificativa:* {act.get('justification')}\n"
        md += "\n"

    if "medium_term_actions_90_days" in data:
        md += "#### Ações de Médio Prazo (90 Dias)\n"
        for act in data["medium_term_actions_90_days"]:
            md += f"- **{act.get('action')}**\n  - *Justificativa:* {act.get('justification')}\n"
        md += "\n"

    if "suggested_responsibilities" in data:
        md += "#### Responsabilidades Sugeridas\n"
        for item in data["suggested_responsibilities"]:
            md += f"- **{item.get('action')}**: {item.get('main_responsible')}\n"
        md += "\n"
        
    if "monitoring_indicators" in data:
        md += "#### Indicadores de Monitoramento\n"
        for ind in data["monitoring_indicators"]:
            md += f"- {ind}\n"
            
    return md

async def fetch_action_plan(client: httpx.AsyncClient, dsei: str, data_init: str, data_end: str, use_mock: bool = False) -> dict:
    payload = {
        "dsei": dsei,
        "data_init": data_init,
        "data_end": data_end,
        "use_mock": use_mock
    }
    url = os.getenv("LLM_API_URL") or os.getenv("AI_API_URL") or "https://rag-painel-indigena-production.up.railway.app/generate-intervention"
    timeout = float(os.getenv("AI_TIMEOUT_SECONDS", "60"))

    response = await client.post(url, json=payload, timeout=timeout)
    response.raise_for_status()
    data = response.json()
    proposal = data.get("intervention_proposal", data)

    return {
        "plan_markdown": format_ai_markdown(proposal),
        "proposal": proposal,
        "source": data.get("source", ""),
        "warnings": data.get("warnings", [])
    }
