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

export async function fetchDashboardData(): Promise<Record<string, DSEIData[]>> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  
  const dseis = [
    "ALTO RIO NEGRO", "KAIAPÓ DO MATO GROSSO", "KAIAPÓ DO PARÁ", 
    "VALE DO JAVARI", "XINGU", "YANOMAMI"
  ];

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
      // Pedido do usuário: apenas o intervalo do início ao fim de maio de 2026
      const dataInitAno = `2026-05-01`;
      const dataEndAno = `2026-05-31`;

      for (const dsei of dseis) {
        const dseiUrl = encodeURIComponent(dsei);
        
        // 1. Dados principais filtrados para Maio de 2026
        const pAnnual = fetch(`${apiUrl}/api/dashboard?dsei=${dseiUrl}&data_init=${dataInitAno}&data_end=${dataEndAno}`, { cache: 'no-store' }).then(r => r.json());
        
        // 2. Últimos 30 dias (para tendência)
        const p30 = fetch(`${apiUrl}/api/dashboard?dsei=${dseiUrl}&data_init=${str30DaysAgo}&data_end=${todayStr}`, { cache: 'no-store' }).then(r => r.json());
        
        // 3. 30 a 60 dias atrás (para tendência)
        const p60 = fetch(`${apiUrl}/api/dashboard?dsei=${dseiUrl}&data_init=${str60DaysAgo}&data_end=${str30DaysAgo}`, { cache: 'no-store' }).then(r => r.json());

        promises.push(
          Promise.all([pAnnual, p30, p60]).then(([annual, data30, data60]) => {
            return { year, annual, data30, data60 };
          })
        );
      }
    }

    const responses = await Promise.allSettled(promises);
    const parsedData: Record<string, DSEIData[]> = { "2026": [] };
    
    for (const result of responses) {
      if (result.status === "fulfilled") {
        const { year, annual, data30, data60 } = result.value;
        
        const casos30 = data30.casos_dengue || 0;
        const casos60 = data60.casos_dengue || 0;
        
        let trendValue = "";
        if (casos30 > casos60) {
          trendValue = "Aumento";
        } else if (casos30 < casos60) {
          trendValue = "Queda";
        } else {
          trendValue = "Estabilidade";
        }

        parsedData[year].push({
          dsei: annual.dsei,
          population: parseInt(annual.qualidade_agua?.populacao_total) || 0,
          dengue_cases: annual.casos_dengue || 0,
          dengue_incidence: 0, 
          sanitation_no_bathroom: parseFloat(annual.esgotamento_sanitario?.exist_estrut_perc_ald_sem_estrutura?.replace('%','')) || 0,
          solid_waste_no_collection: parseFloat(annual.residuos?.pratica_de_queima_de_residuos_pela_comunidade_percentual_de_aldeias_que_possuem_a_pratica_de_queima_dos_residuos?.replace('%','')) || 0,
          dengue_monthly: annual.casos_dengue_mensal || [],
          ai_recommendation: "",
          trend: trendValue,
        });
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
      const jsonData = await fallbackResponse.json();
      const parsedData: Record<string, DSEIData[]> = {};
      
      for (const year of Object.keys(jsonData)) {
        parsedData[year] = jsonData[year].map((item: any) => ({
          dsei: item.dsei,
          population: item.populacao || 0,
          dengue_cases: item.dengue_cases || 0,
          dengue_incidence: item.incidence || 0,
          sanitation_no_bathroom: item.sem_fossa || 0,
          solid_waste_no_collection: item.queima_lixo || 0,
          dengue_daily: item.dengue_daily || [],
          ai_recommendation: item.ai_recommendation || "",
        }));
      }
      return parsedData;
    }
    
    return {};
  }
}

