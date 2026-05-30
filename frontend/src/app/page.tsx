"use client";

import { useEffect, useState } from "react";
import { fetchDashboardData, generateAIRecommendation, DSEIData } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, AlertTriangle, Droplet, Map, RefreshCcw, Sparkles, Trash2, Users } from "lucide-react";

export default function Dashboard() {
  const [dataByYear, setDataByYear] = useState<Record<string, DSEIData[]>>({});
  const [selectedYear, setSelectedYear] = useState<string>("2024");
  const [selectedDsei, setSelectedDsei] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [aiRecommendation, setAiRecommendation] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    async function loadData() {
      const result = await fetchDashboardData();
      setDataByYear(result);
      
      const years = Object.keys(result).sort((a, b) => Number(b) - Number(a));
      if (years.length > 0) {
        const defaultYear = years.includes("2024") ? "2024" : years[0];
        setSelectedYear(defaultYear);
        if (result[defaultYear] && result[defaultYear].length > 0) {
          setSelectedDsei(result[defaultYear][0].dsei);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const currentData = dataByYear[selectedYear]?.find((d) => d.dsei === selectedDsei);
  
  // Calcular tendência se houver ano anterior
  let trend = "Estável";
  let previousCases = 0;
  if (selectedYear === "2024" && dataByYear["2023"]) {
    const prevData = dataByYear["2023"].find(d => d.dsei === selectedDsei);
    if (prevData) {
      previousCases = prevData.dengue_cases;
      if (currentData && currentData.dengue_cases > previousCases) trend = "Aumento";
      if (currentData && currentData.dengue_cases < previousCases) trend = "Queda";
    }
  }

  useEffect(() => {
    async function fetchAi() {
      if (!currentData) return;
      setLoadingAi(true);
      
      const promptData = {
        dsei: currentData.dsei,
        casos: currentData.dengue_cases,
        sem_banheiro: currentData.sanitation_no_bathroom,
        sem_coleta_lixo: currentData.solid_waste_no_collection,
        esgoto_resumo: `${currentData.sanitation_no_bathroom}% sem banheiro.`
      };
      
      const text = await generateAIRecommendation(promptData);
      setAiRecommendation(text);
      setLoadingAi(false);
    }
    fetchAi();
  }, [currentData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin text-primary">
          <RefreshCcw size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header e Filtros */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Painel SasiSUS & SINAN</h1>
            <p className="text-slate-500">Monitoramento de Dengue e Saneamento em Aldeias Indígenas</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <select 
              value={selectedDsei}
              onChange={(e) => setSelectedDsei(e.target.value)}
              className="flex h-10 w-full md:w-64 items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            >
              {(dataByYear[selectedYear] || []).map((d) => (
                <option key={d.dsei} value={d.dsei}>
                  DSEI {d.dsei}
                </option>
              ))}
            </select>
            
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="flex h-10 w-full md:w-32 items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            >
              {Object.keys(dataByYear).sort((a,b) => Number(b) - Number(a)).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </header>

        {currentData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            
            {/* Bloco 1: Resumo do território */}
            <Card className="shadow-sm border-slate-200 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <Map className="w-4 h-4" />
                  Resumo do Território
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800 mb-1 truncate">
                  {currentData.dsei}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 mt-4">
                  <Users className="w-4 h-4 text-primary" />
                  <span>População Estimada: <span className="font-semibold">{currentData.population?.toLocaleString('pt-BR') || 'N/A'}</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 mt-2">
                  <Map className="w-4 h-4 text-primary" />
                  <span>Nível de análise: Regional (DSEI)</span>
                </div>
              </CardContent>
            </Card>

            {/* Bloco 2: Situação da dengue */}
            <Card className="shadow-sm border-slate-200 bg-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-500" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Situação da Dengue
                  </span>
                  <Badge variant={currentData.dengue_incidence > 50 ? "destructive" : "default"} className="font-normal shadow-sm">
                    {currentData.dengue_incidence > 50 ? "Prioridade: Alta" : "Prioridade: Normal"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-800">
                  {currentData.dengue_cases} <span className="text-sm font-normal text-slate-500">casos prováveis</span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Tendência ({selectedYear})</span>
                    <span className={`font-medium flex items-center gap-1 ${trend === 'Aumento' ? 'text-red-600' : trend === 'Queda' ? 'text-green-600' : 'text-slate-600'}`}>
                      {trend} <Activity className="w-3 h-3" />
                    </span>
                  </div>
                  {selectedYear === "2024" && previousCases > 0 && (
                     <div className="flex justify-between text-xs mt-1">
                       <span className="text-slate-400">Casos no ano passado</span>
                       <span className="text-slate-500">{previousCases}</span>
                     </div>
                  )}
                  <div className="flex justify-between text-sm pt-2">
                    <span className="text-slate-500">Incidência (por 10k)</span>
                    <span className="font-medium text-slate-700">{currentData.dengue_incidence?.toFixed(1) || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bloco 3: Vulnerabilidades estruturais */}
            <Card className="shadow-sm border-slate-200 bg-white xl:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Vulnerabilidades Estruturais
                </CardTitle>
                <CardDescription>
                  Média de infraestrutura sanitária nas aldeias do DSEI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="p-4 rounded-lg bg-orange-50/50 border border-orange-100 flex items-start gap-4 hover:shadow-md transition-shadow">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-md">
                      <Droplet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-900">{currentData.sanitation_no_bathroom?.toFixed(1)}%</div>
                      <div className="text-sm text-orange-700 leading-tight mt-1">das aldeias não possuem estrutura adequada de esgoto/banheiro</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-100 flex items-start gap-4 hover:shadow-md transition-shadow">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-md">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-900">{currentData.solid_waste_no_collection?.toFixed(1)}%</div>
                      <div className="text-sm text-blue-700 leading-tight mt-1">sem informação ou sem coleta pública de resíduos sólidos</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bloco 4: Recomendação gerada por IA */}
            <Card className="shadow-md border-indigo-200 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 xl:col-span-4 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-indigo-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                  Estratégia Recomendada por IA (Gemini)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAi ? (
                  <div className="flex items-center gap-3 text-indigo-400 py-6">
                    <RefreshCcw className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">Analisando contexto epidemiológico e sanitário...</span>
                  </div>
                ) : (
                  <div className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed py-2">
                    {aiRecommendation ? (
                      <p className="text-base sm:text-lg text-slate-800 font-medium">
                        {aiRecommendation}
                      </p>
                    ) : (
                      <p>Nenhuma recomendação disponível para este território.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-lg border border-slate-200 text-slate-500">
            Nenhum dado encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
