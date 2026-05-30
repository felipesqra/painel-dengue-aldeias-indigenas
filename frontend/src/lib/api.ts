// Client API module for fetching data from FastAPI and generating AI recommendations.

export interface DSEIData {
  dsei: string;
  population: number;
  dengue_cases: number;
  dengue_incidence: number;
  sanitation_no_bathroom: number;
  solid_waste_no_collection: number;
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
        }));
      }
      return parsedData;
    }
    
    return {};
  }
}

export async function generateAIRecommendation(dseiData: any): Promise<string> {
  try {
    const response = await fetch('/api/recommendation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dseiData)
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.recommendation;
    }
    return "Não foi possível carregar a recomendação.";
  } catch (error) {
    console.error(error);
    return "Erro ao comunicar com o servidor da IA.";
  }
}
