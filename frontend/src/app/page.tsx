"use client";

import { useEffect, useState } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { Droplets, Activity, MapPin, AlertTriangle, Search, ShieldAlert } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetch('/dashboard_data.json?t=' + new Date().getTime())
      .then(res => res.json())
      .then(json => {
        setData(json.dseis.sort((a: any, b: any) => b.incidence - a.incidence));
      })
      .catch(err => console.error("Error fetching data:", err));
  }, []);

  if (data.length === 0) {
    return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-900">Carregando dados...</div>;
  }

  const totalDengue = data.reduce((acc, curr) => acc + curr.dengue_cases, 0);
  const avgVuln = data.reduce((acc, curr) => acc + curr.vulnerability_score, 0) / data.length;
  const worstDsei = [...data].sort((a, b) => b.vulnerability_score - a.vulnerability_score)[0];
  const highestIncidence = [...data].sort((a, b) => b.incidence - a.incidence).slice(0, 5);
  const filteredData = data.filter(d => d.dsei.toLowerCase().includes(searchTerm.toLowerCase()));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold">{d.dsei}</CardTitle>
            <CardDescription className="text-xs">População: {d.populacao.toLocaleString('pt-BR')} hab.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-sm space-y-1">
            <p className="text-blue-600 font-medium">Precariedade Hídrica: {d.vulnerability_score}%</p>
            <p className="text-rose-600 font-medium">Casos de Dengue: {d.dengue_cases}</p>
            <p className="text-rose-700 font-bold">Incidência (10k hab): {d.incidence}</p>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 p-6 border-r bg-white md:sticky md:top-0 md:h-screen z-10 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Droplets className="text-blue-600" size={24} />
          </div>
          <h1 className="font-extrabold text-blue-700 text-xl uppercase tracking-wider">SASI</h1>
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          <a href="#" className="p-3 rounded-lg bg-blue-50 text-blue-700 font-semibold flex items-center gap-3 transition">
            <Activity size={18} /> Dashboard Geral
          </a>
          <a href="#dseis" className="p-3 rounded-lg hover:bg-slate-100 text-slate-600 font-medium flex items-center gap-3 transition">
            <MapPin size={18} /> Dados por DSEI
          </a>
        </nav>
        <div className="mt-auto pt-6 border-t border-slate-100 text-xs text-slate-500">
          <p className="font-medium">Hackathon Prototype</p>
          <p>Base: SIASI/SESAI e SINAN</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 flex flex-col gap-8 max-w-7xl mx-auto">
        
        <header>
          <h2 className="text-3xl font-extrabold mb-2 text-slate-900 tracking-tight">Vulnerabilidade Hídrica e Dengue</h2>
          <p className="text-slate-500 text-lg">Análise da incidência ajustada de Dengue nas terras indígenas demarcadas, cruzada com a precariedade sanitária.</p>
        </header>

        {/* Summary Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-rose-100 rounded-xl">
                <Activity className="text-rose-600" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Casos (Regiões)</p>
                <h3 className="text-3xl font-bold text-slate-900">{totalDengue.toLocaleString('pt-BR')}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-blue-100 rounded-xl">
                <Droplets className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Precariedade Média</p>
                <h3 className="text-3xl font-bold text-slate-900">{avgVuln.toFixed(1)}%</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-rose-200">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-rose-50 rounded-xl">
                <ShieldAlert className="text-rose-600" size={24} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500 mb-1">Maior Risco Hídrico</p>
                <h3 className="text-xl font-bold text-rose-600 truncate">{worstDsei.dsei}</h3>
                <p className="text-xs text-slate-400 mt-1">Score Proxy: {worstDsei.vulnerability_score}%</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <Card>
            <CardHeader>
              <CardTitle>Precariedade vs Incidência (10k)</CardTitle>
              <CardDescription>DSEIs com maior precariedade apresentam mais dengue?</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    type="number" 
                    dataKey="vulnerability_score" 
                    name="Precariedade" 
                    unit="%" 
                    stroke="#94a3b8"
                    fontSize={12}
                    label={{ value: "Score de Precariedade Hídrica (%)", position: "bottom", fill: "#64748b", dy: 10, fontSize: 12 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="incidence" 
                    name="Incidência" 
                    stroke="#94a3b8"
                    fontSize={12}
                    label={{ value: "Incidência Dengue", angle: -90, position: "insideLeft", fill: "#64748b", dx: -10, fontSize: 12 }}
                  />
                  <RechartsTooltip cursor={{strokeDasharray: '3 3'}} content={<CustomTooltip />} />
                  <Scatter name="DSEIs" data={data}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.vulnerability_score > 50 ? '#e11d48' : '#0284c7'} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 5 Incidência de Dengue</CardTitle>
              <CardDescription>Taxa de casos por 10.000 habitantes.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={highestIncidence} margin={{ top: 20, right: 30, left: -20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="dsei" 
                    stroke="#94a3b8" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70}
                    tick={{fontSize: 10, fontWeight: 500}}
                  />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} content={<CustomTooltip />} />
                  <Bar dataKey="incidence" radius={[6, 6, 0, 0]}>
                    {highestIncidence.map((entry, index) => (
                      <Cell key={`cell-bar-${index}`} fill={index === 0 ? '#e11d48' : '#0ea5e9'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        {/* Data Table */}
        <Card id="dseis" className="overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
            <div>
              <CardTitle>Detalhamento por DSEI</CardTitle>
              <CardDescription>Visualização tabular completa dos indicadores cruzados.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input 
                type="text" 
                placeholder="Buscar DSEI..." 
                className="pl-9 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <div className="overflow-x-auto border-t border-slate-100">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold text-slate-700">DSEI</TableHead>
                  <TableHead className="text-right">População Indígena</TableHead>
                  <TableHead className="text-right">Casos</TableHead>
                  <TableHead className="text-right font-semibold">Incidência (10k)</TableHead>
                  <TableHead className="text-right">Sem Tratamento Esgoto</TableHead>
                  <TableHead className="text-right">Sem Estrutura</TableHead>
                  <TableHead className="text-right">Risco Proxy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Nenhum DSEI encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map(d => (
                    <TableRow key={d.dsei} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-slate-900">{d.dsei}</TableCell>
                      <TableCell className="text-right text-slate-600">{d.populacao.toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="text-right text-rose-600 font-medium">{d.dengue_cases}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={d.incidence > 10 ? 'destructive' : 'secondary'}>
                          {d.incidence}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-slate-600">{d.ceu_aberto}%</TableCell>
                      <TableCell className="text-right text-slate-600">{d.sem_fossa}%</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={d.vulnerability_score > 50 ? 'outline' : 'default'} className={d.vulnerability_score > 50 ? 'text-rose-600 border-rose-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}>
                          {d.vulnerability_score}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

      </main>
    </div>
  );
}
