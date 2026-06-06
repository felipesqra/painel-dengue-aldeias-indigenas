// Client API module for fetching data from FastAPI

export interface DailyCase {
  date: string;
  cases: number;
}

export interface DSEIData {
  dsei: string;
  population: number;
  dengue_cases: number;
  dengue_incidence: number;
  sanitation_no_bathroom: number;
  solid_waste_no_collection: number;
  dengue_monthly: {month: string, cases: number}[];
  ai_recommendation: string;
  trend: string;
}

export interface ActionPlanResponse {
  dsei: string;
  data_init: string;
  data_end: string;
  plan_markdown: string;
  proposal: Record<string, unknown>;
  source: string;
  warnings: string[];
}

interface FallbackDashboardItem {
  dsei?: string;
  populacao?: number;
  dengue_cases?: number;
  incidence?: number;
  sem_fossa?: number;
  queima_lixo?: number;
  dengue_daily?: { date: string; cases: number }[];
  dengue_monthly?: { month: string; cases: number }[];
  ai_recommendation?: string;
  trend?: string;
}

export const DASHBOARD_PERIOD = {
  dataInit: "2026-01-01",
  dataEnd: "2026-05-31",
};

const apiBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8000";
  return url.replace(/\/+$/, "");
};

export async function fetchDashboardData(dataInit: string, dataEnd: string): Promise<Record<string, DSEIData[]>> {
  const apiUrl = apiBaseUrl();
  
  try {
    const years = ["2026"];
    const promises = [];
    
    // Helper para formatar YYYY-MM-DD
    const formatYMD = (d: Date) => d.toISOString().split('T')[0];
    
    const now = new Date();
    const todayStr = formatYMD(now);
    
    const date30DaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const str30DaysAgo = formatYMD(date30DaysAgo);
    
    const date60DaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const str60DaysAgo = formatYMD(date60DaysAgo);

    for (const year of years) {

      // 1. Dados principais filtrados para Maio de 2026
      const pAnnual = fetch(`${apiUrl}/api/all_data?data_init=${dataInit}&data_end=${dataEnd}`, { cache: 'no-store' }).then((r) => {
        if (!r.ok) throw new Error(`Dashboard API falhou`);
        return r.json();
      });
      
      // 2. Últimos 30 dias (para tendência)
      const p30 = fetch(`${apiUrl}/api/all_data?data_init=${str30DaysAgo}&data_end=${todayStr}`, { cache: 'no-store' }).then((r) => {
        if (!r.ok) throw new Error(`Dashboard API falhou`);
        return r.json();
      });
      
      // 3. 30 a 60 dias atrás (para tendência)
      const p60 = fetch(`${apiUrl}/api/all_data?data_init=${str60DaysAgo}&data_end=${str30DaysAgo}`, { cache: 'no-store' }).then((r) => {
        if (!r.ok) throw new Error(`Dashboard API falhou}`);
        return r.json();
      });

      promises.push(
        Promise.all([pAnnual, p30, p60]).then(([annual, data30, data60]) => {
          return { year, annual, data30, data60 };
        })
      );
      
    }

    const responses = await Promise.allSettled(promises);
    const parsedData: Record<string, DSEIData[]> = { "2026": [] };
    
    for (const result of responses) {
      if (result.status === "fulfilled") {
        const { year, annual, data30, data60 } = result.value;
        for(const dsei in annual){
          
          const dadosAnuais = annual[dsei];
          const dados30DoDsei = data30[dsei];
          const dados60DoDsei = data60[dsei];
          
          const casos30 = dados30DoDsei?.casos_dengue ?? 0;
          const casos60 = dados60DoDsei?.casos_dengue ?? 0;
          
          let trendValue = "";
          if (casos30 > casos60) {
            trendValue = "Aumento";
          } else if (casos30 < casos60) {
            trendValue = "Queda";
          } else {
            trendValue = "Estabilidade";
          }
  
          parsedData[year].push({
            dsei: dsei,
            population: parseInt(dadosAnuais.population) || 0,
            dengue_cases: dadosAnuais.dengue_cases || 0,
            dengue_incidence: 0, 
            sanitation_no_bathroom: parseFloat(String(dadosAnuais.sanitation_no_bathroom ?? "0").replace('%','').replace(',','.')) || 0,
            solid_waste_no_collection: parseFloat(String(dadosAnuais.solid_waste_no_collection ?? "0").replace('%','').replace(',','.')) || 0,
            dengue_monthly: dadosAnuais.casos_dengue_mensal || [],
            ai_recommendation: "",
            trend: trendValue,
          });
        }
      }
    }

    if (parsedData["2026"].length > 0) {
      return parsedData;
    }
    
    throw new Error("FastAPI falhou. Retornando ao fallback.");
  } catch (error) {
    console.warn("Aviso:", error);
    console.warn("Carregando dados de fallback locais (dashboard_data.json)...");
    
    const fallbackUrl = `/dashboard_data.json?t=${new Date().getTime()}`;
    const fallbackResponse = await fetch(fallbackUrl, {
      cache: 'no-store'
    });
    
    if (fallbackResponse.ok) {
      const jsonData = await fallbackResponse.json() as Record<string, FallbackDashboardItem[]>;
      const parsedData: Record<string, DSEIData[]> = {};
      
      for (const year of Object.keys(jsonData)) {
        parsedData[year] = jsonData[year].map((item) => {
          const dengueMonthly = item.dengue_monthly || item.dengue_daily?.map((point) => ({
            month: point.date,
            cases: point.cases,
          })) || [];

          return {
            dsei: item.dsei || "DSEI não informado",
            population: item.populacao || 0,
            dengue_cases: item.dengue_cases || 0,
            dengue_incidence: item.incidence || 0,
            sanitation_no_bathroom: item.sem_fossa || 0,
            solid_waste_no_collection: item.queima_lixo || 0,
            dengue_monthly: dengueMonthly,
            ai_recommendation: item.ai_recommendation || "",
            trend: item.trend || "Estabilidade",
          };
        });
      }
      return parsedData;
    }
    
    return {};
  }
}

export async function generateActionPlan(
  dsei: string,
  dataInit = DASHBOARD_PERIOD.dataInit,
  dataEnd = DASHBOARD_PERIOD.dataEnd
): Promise<ActionPlanResponse> {
  const apiUrl = apiBaseUrl();
  const response = await fetch(`${apiUrl}/api/action-plan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      dsei,
      data_init: dataInit,
      data_end: dataEnd,
      use_mock: false,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Falha ao gerar o plano de ação.");
  }

  return response.json();
}
