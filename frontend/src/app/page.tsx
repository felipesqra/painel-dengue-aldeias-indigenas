"use client";

import { useEffect, useState } from "react";
import { fetchDashboardData, DSEIData } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, Droplet, Map, RefreshCcw, Sparkles, Trash2, Users } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function Dashboard() {
  const [dataByYear, setDataByYear] = useState<Record<string, DSEIData[]>>({});
  const [selectedYear, setSelectedYear] = useState<string>("2024");
  const [selectedDsei, setSelectedDsei] = useState<string>("");
  const [loading, setLoading] = useState(true);

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
                <div className="text-2xl font-bold text-slate-800 mb-1 truncate" title={currentData.dsei}>
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

            {/* Bloco 2: Situação da dengue (Atualizado para gráfico diário) */}
            <Card className="shadow-sm border-slate-200 bg-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-500" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Situação da Dengue
                  </span>
                  <Badge 
                    variant={trend === "Aumento" ? "destructive" : "default"} 
                    className="font-normal shadow-sm"
                  >
                    {trend === "Aumento" ? "Prioridade: Alta" : "Prioridade: Normal"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold text-slate-800">
                      {currentData.dengue_cases}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">casos no período</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold flex items-center gap-1 justify-end ${trend === 'Aumento' ? 'text-red-600' : trend === 'Queda' ? 'text-green-600' : 'text-slate-600'}`}>
                      {trend} {trend !== 'Estável' && <Activity className="w-3 h-3" />}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Incidência: {currentData.dengue_incidence?.toFixed(1) || 0}
                    </div>
                  </div>
                </div>
                
                {/* Minigráfico de série temporal */}
                {currentData.dengue_daily && currentData.dengue_daily.length > 0 && (
                  <div className="h-16 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={currentData.dengue_daily}>
                        <Tooltip 
                          contentStyle={{ fontSize: '12px', borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          labelStyle={{ color: '#64748b' }}
                          formatter={(value: number) => [value, 'Casos']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="cases" 
                          stroke={trend === "Aumento" ? "#ef4444" : "#3b82f6"} 
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
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

            {/* Bloco 4: Recomendação gerada por IA (Backend) */}
            <Card className="shadow-md border-indigo-200 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 xl:col-span-4 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-indigo-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Estratégia Recomendada por IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed py-2">
                  {currentData.ai_recommendation ? (
                    <p className="text-base sm:text-lg text-slate-800 font-medium">
                      {currentData.ai_recommendation}
                    </p>
                  ) : (
                    <p className="text-slate-500 italic">Nenhuma recomendação processada pelo servidor central para este território.</p>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-lg border border-slate-200 text-slate-500">
            Nenhum dado encontrado para o período selecionado.
          </div>
        )}
      </div>
    </div>
  );
}
