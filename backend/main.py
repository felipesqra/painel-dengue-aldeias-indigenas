from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from services import fetch_agua, fetch_residuos, fetch_esgoto, fetch_dengue, fetch_action_plan, fecth_all_data
import uvicorn

app = FastAPI(title="SasiSUS Backend Integrator")

# Allow CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

class DashboardResponse(BaseModel):
    dsei: str
    casos_dengue: int
    casos_dengue_mensal: list[dict] = []
    data_init: str
    data_end: str
    qualidade_agua: dict
    residuos: dict
    esgotamento_sanitario: dict
    ai_recommendation: str = ""

class ActionPlanRequest(BaseModel):
    dsei: str
    data_init: str
    data_end: str
    use_mock: bool = False

class ActionPlanResponse(BaseModel):
    dsei: str
    data_init: str
    data_end: str
    plan_markdown: str
    proposal: dict
    source: str = ""
    warnings: list[str] = []

@app.get("/api/all_data")
async def get_all_data(
    data_init: str = Query(..., description="Data de inicio YYYY-MM-DD"),
    data_end: str = Query(..., description="Data de fim YYYY-MM-DD")
):
    async with httpx.AsyncClient() as client:
        try:
            data = await fecth_all_data(client, data_init, data_end)
            return data
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard", response_model=DashboardResponse)
async def get_dashboard_data(
    dsei: str = Query(..., description="Nome do DSEI (ex: YANOMAMI)"),
    data_init: str = Query(..., description="Data de inicio YYYY-MM-DD"),
    data_end: str = Query(..., description="Data de fim YYYY-MM-DD")
):
    """
    Consome as 4 APIs do Governo Federal (Dengue, Agua, Residuos, Esgoto),
    unifica os dados e retorna no formato esperado pelo Dashboard.
    """
    async with httpx.AsyncClient() as client:
        try:
            agua = await fetch_agua(client, dsei)
            residuos = await fetch_residuos(client, dsei)
            esgoto = await fetch_esgoto(client, dsei)
            casos_dengue, casos_mensal = await fetch_dengue(client, dsei, data_init, data_end)
            
            # Formatar a resposta exatamente como em output_example.json
            return DashboardResponse(
                dsei=dsei,
                casos_dengue=casos_dengue,
                casos_dengue_mensal=casos_mensal,
                data_init=data_init,
                data_end=data_end,
                qualidade_agua=agua,
                residuos=residuos,
                esgotamento_sanitario=esgoto,
                ai_recommendation=""
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/action-plan", response_model=ActionPlanResponse)
async def generate_action_plan(request: ActionPlanRequest):
    """
    Encaminha o DSEI selecionado para o serviço RAG/LLM. A LLM busca os dados
    neste próprio backend via API_URL e devolve o plano estruturado.
    """
    async with httpx.AsyncClient() as client:
        try:
            result = await fetch_action_plan(
                client,
                request.dsei,
                request.data_init,
                request.data_end,
                request.use_mock
            )
            return ActionPlanResponse(
                dsei=request.dsei,
                data_init=request.data_init,
                data_end=request.data_end,
                **result
            )
        except httpx.HTTPStatusError as e:
            detail = e.response.text
            raise HTTPException(status_code=502, detail=f"LLM service failed: {detail}")
        except Exception as e:
            raise HTTPException(status_code=502, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
