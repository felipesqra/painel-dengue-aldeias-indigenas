import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        recommendation: "Erro: Chave da API do Gemini (GEMINI_API_KEY) não configurada no servidor." 
      }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
Você é um especialista em saúde pública e epidemiologia, focado em populações indígenas no Brasil.
Seu objetivo é analisar os dados de um Distrito Sanitário Especial Indígena (DSEI) e fornecer uma recomendação estratégica concisa e acionável.

Dados do DSEI:
- Nome: ${data.dsei}
- Casos de Dengue: ${data.casos}
- Saneamento (% sem estrutura adequada): ${data.sem_banheiro}%
- Resíduos (% sem coleta pública): ${data.sem_coleta_lixo}%
- Água e Esgoto (Resumo): ${data.esgoto_resumo}

Gere uma "Estratégia Recomendada" em um único parágrafo claro, direto e focado em ações práticas (mobilização, vigilância, controle de vetores e comunicação).
Não use saudações. Vá direto ao ponto.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ recommendation: text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ recommendation: "Erro ao gerar recomendação. Verifique os logs do servidor." }, { status: 500 });
  }
}
