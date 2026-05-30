// Client API module for fetching data from FastAPI and generating AI recommendations.

export interface DSEIData {
  dsei: string;
  population: number;
  dengue_cases: number;
  dengue_incidence: number;
  sanitation_no_bathroom: number;
  solid_waste_no_collection: number;
}

export async function fetchDashboardData(): Promise<DSEIData[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  
  try {
    // Attempt to fetch from FastAPI with cache revalidation every 3600 seconds (1 hour)
    // as dengue cases update daily.
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
    
    // Fallback to local static JSON if FastAPI is offline
    // Using a dynamic timestamp to bypass aggressive browser caching in dev mode
    const fallbackUrl = `/dashboard_data.json?t=${new Date().getTime()}`;
    const fallbackResponse = await fetch(fallbackUrl, {
      cache: 'no-store'
    });
    
    if (fallbackResponse.ok) {
      return await fallbackResponse.json();
    }
    
    return [];
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
