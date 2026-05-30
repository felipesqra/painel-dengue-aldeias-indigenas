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
  dengue_daily: DailyCase[];
  ai_recommendation: string;
}

export async function fetchDashboardData(): Promise<Record<string, DSEIData[]>> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  
  try {
    const response = await fetch(`${apiUrl}/api/dashboard`, {
      next: { revalidate: 3600 }
    });
    
    if (response.ok) {
      return await response.json();
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

