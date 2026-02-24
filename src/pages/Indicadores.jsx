import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Clock, Activity, AlertTriangle, CheckCircle, Target } from "lucide-react";
import { format, differenceInMinutes, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = {
  success: "#16A34A",
  warning: "#EA580C",
  danger: "#DC2626",
  info: "#2563EB"
};

export default function Indicadores() {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;
  
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pacientes = [], isLoading } = useQuery({
    queryKey: ['pacientes', user?.email],
    queryFn: async () => {
      if (user?.role === 'admin') {
        return base44.entities.Paciente.list("-created_date");
      }
      return base44.entities.Paciente.filter({ created_by: user?.email }, "-created_date");
    },
    enabled: !!user,
    initialData: [],
  });

  const pacientesFiltrados = useMemo(() => {
    const inicioMes = startOfMonth(new Date(anoSelecionado, mesSelecionado - 1));
    const fimMes = endOfMonth(new Date(anoSelecionado, mesSelecionado - 1));
    
    return pacientes.filter(p => {
      if (!p.data_hora_chegada) return false;
      const dataChegada = new Date(p.data_hora_chegada);
      return isWithinInterval(dataChegada, { start: inicioMes, end: fimMes });
    });
  }, [pacientes, anoSelecionado, mesSelecionado]);

  // 1. Tempo de triagem (≤4min)
  const tempoTriagem = useMemo(() => {
    const tempos = pacientesFiltrados
      .filter(p => p.data_hora_chegada && p.data_hora_inicio_triagem)
      .map(p => differenceInMinutes(new Date(p.data_hora_inicio_triagem), new Date(p.data_hora_chegada)));
    
    if (tempos.length === 0) return { media: 0, min: 0, max: 0, dentroMeta: 0, foraMeta: 0 };
    
    return {
      media: Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length),
      min: Math.min(...tempos),
      max: Math.max(...tempos),
      dentroMeta: tempos.filter(t => t <= 4).length,
      foraMeta: tempos.filter(t => t > 4).length
    };
  }, [pacientesFiltrados]);

  // 2. Tempo de espera (≤15min)
  const tempoEspera = useMemo(() => {
    const tempos = pacientesFiltrados
      .filter(p => p.data_hora_inicio_triagem && p.avaliacao_medica?.data_hora_avaliacao)
      .map(p => differenceInMinutes(new Date(p.avaliacao_medica.data_hora_avaliacao), new Date(p.data_hora_inicio_triagem)));
    
    if (tempos.length === 0) return { media: 0, min: 0, max: 0, dentroMeta: 0, foraMeta: 0 };
    
    return {
      media: Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length),
      min: Math.min(...tempos),
      max: Math.max(...tempos),
      dentroMeta: tempos.filter(t => t <= 15).length,
      foraMeta: tempos.filter(t => t > 15).length
    };
  }, [pacientesFiltrados]);

  // 3. Triagem clínica (≤20min)
  const tempoTriagemClinica = useMemo(() => {
    const tempos = pacientesFiltrados
      .filter(p => p.data_hora_inicio_triagem && p.data_hora_ecg)
      .map(p => differenceInMinutes(new Date(p.data_hora_ecg), new Date(p.data_hora_inicio_triagem)));
    
    if (tempos.length === 0) return { media: 0, min: 0, max: 0, dentroMeta: 0, foraMeta: 0 };
    
    return {
      media: Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length),
      min: Math.min(...tempos),
      max: Math.max(...tempos),
      dentroMeta: tempos.filter(t => t <= 20).length,
      foraMeta: tempos.filter(t => t > 20).length
    };
  }, [pacientesFiltrados]);

  // 4. Tempo triagem → ECG (≤10min)
  const tempoTriagemEcg = useMemo(() => {
    const tempos = pacientesFiltrados
      .filter(p => p.tempo_triagem_ecg_minutos !== undefined && p.tempo_triagem_ecg_minutos !== null)
      .map(p => p.tempo_triagem_ecg_minutos);
    
    if (tempos.length === 0) return { media: 0, min: 0, max: 0, dentroMeta: 0, foraMeta: 0 };
    
    return {
      media: Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length),
      min: Math.min(...tempos),
      max: Math.max(...tempos),
      dentroMeta: tempos.filter(t => t <= 10).length,
      foraMeta: tempos.filter(t => t > 10).length
    };
  }, [pacientesFiltrados]);

  // 5. Taxa de alta complexidade
  const taxaAltaComplexidade = useMemo(() => {
    const total = pacientesFiltrados.length;
    if (total === 0) return { percentual: 0, quantidade: 0, total: 0 };
    
    const altaComplexidade = pacientesFiltrados.filter(p => 
      p.classificacao_risco?.cor === "Vermelha" || p.classificacao_risco?.cor === "Laranja"
    ).length;
    
    return {
      percentual: Math.round((altaComplexidade / total) * 100),
      quantidade: altaComplexidade,
      total
    };
  }, [pacientesFiltrados]);

  // 6. Taxa de resolução
  const taxaResolucao = useMemo(() => {
    const total = pacientesFiltrados.length;
    if (total === 0) return { percentual: 0, quantidade: 0, total: 0 };
    
    const resolvidos = pacientesFiltrados.filter(p => 
      p.status === "Alta" || p.status === "Transferido" || p.status === "Aguardando Regulação"
    ).length;
    
    return {
      percentual: Math.round((resolvidos / total) * 100),
      quantidade: resolvidos,
      total
    };
  }, [pacientesFiltrados]);

  // 7. Taxa de Reperfusão Efetiva
  const taxaReperfusaoEfetiva = useMemo(() => {
    const icpRealizadas = pacientesFiltrados.filter(p => 
      p.hemodinamica?.icp_realizada === true
    );
    
    if (icpRealizadas.length === 0) return { percentual: 0, efetivas: 0, total: 0 };
    
    const efetivas = icpRealizadas.filter(p => 
      p.hemodinamica?.reperfusao_efetiva === true
    ).length;
    
    return {
      percentual: Math.round((efetivas / icpRealizadas.length) * 100),
      efetivas,
      total: icpRealizadas.length
    };
  }, [pacientesFiltrados]);

  // Distribuição por classificação de risco
  const distribuicaoRisco = useMemo(() => {
    const cores = ["Vermelha", "Laranja", "Amarela", "Verde", "Azul"];
    return cores.map(cor => ({
      name: cor,
      value: pacientesFiltrados.filter(p => p.classificacao_risco?.cor === cor).length
    })).filter(item => item.value > 0);
  }, [pacientesFiltrados]);

  const RISK_COLORS = {
    "Vermelha": "#DC2626",
    "Laranja": "#EA580C",
    "Amarela": "#CA8A04",
    "Verde": "#16A34A",
    "Azul": "#2563EB"
  };

  const meses = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" }
  ];

  const anos = Array.from({ length: 5 }, (_, i) => anoAtual - 2 + i);

  if (isLoading || !user) {
    return (
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando indicadores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Indicadores de Qualidade</h1>
          <p className="text-gray-600">Metas e métricas de desempenho do atendimento</p>
          <p className="text-sm text-blue-600 mt-1">
            👤 {user.full_name} • {user.email}
            {user.role === 'admin' && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">ADMINISTRADOR</span>}
          </p>
        </div>

        {/* Filtros */}
        <Card className="shadow-md mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Mês</label>
                <Select value={mesSelecionado.toString()} onValueChange={(v) => setMesSelecionado(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map(mes => (
                      <SelectItem key={mes.value} value={mes.value.toString()}>
                        {mes.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Ano</label>
                <Select value={anoSelecionado.toString()} onValueChange={(v) => setAnoSelecionado(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {anos.map(ano => (
                      <SelectItem key={ano} value={ano.toString()}>
                        {ano}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px] flex items-end">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 w-full">
                  <p className="text-sm text-blue-900 font-medium">Total de Atendimentos</p>
                  <p className="text-2xl font-bold text-blue-700">{pacientesFiltrados.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Indicadores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-md border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Tempo de Triagem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gray-900">{tempoTriagem.media} min</p>
                <p className="text-xs text-gray-600">
                  Mín: {tempoTriagem.min} | Máx: {tempoTriagem.max}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{tempoTriagem.dentroMeta} dentro da meta (≤4min)</span>
                </div>
                {tempoTriagem.foraMeta > 0 && (
                  <div className="flex items-center gap-2 text-xs text-orange-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{tempoTriagem.foraMeta} fora da meta</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Tempo de Espera
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gray-900">{tempoEspera.media} min</p>
                <p className="text-xs text-gray-600">
                  Mín: {tempoEspera.min} | Máx: {tempoEspera.max}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{tempoEspera.dentroMeta} dentro da meta (≤15min)</span>
                </div>
                {tempoEspera.foraMeta > 0 && (
                  <div className="flex items-center gap-2 text-xs text-orange-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{tempoEspera.foraMeta} fora da meta</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Triagem Clínica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gray-900">{tempoTriagemClinica.media} min</p>
                <p className="text-xs text-gray-600">
                  Mín: {tempoTriagemClinica.min} | Máx: {tempoTriagemClinica.max}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{tempoTriagemClinica.dentroMeta} dentro da meta (≤20min)</span>
                </div>
                {tempoTriagemClinica.foraMeta > 0 && (
                  <div className="flex items-center gap-2 text-xs text-orange-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{tempoTriagemClinica.foraMeta} fora da meta</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Porta-ECG
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gray-900">{tempoTriagemEcg.media} min</p>
                <p className="text-xs text-gray-600">
                  Mín: {tempoTriagemEcg.min} | Máx: {tempoTriagemEcg.max}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{tempoTriagemEcg.dentroMeta} dentro da meta (≤10min)</span>
                </div>
                {tempoTriagemEcg.foraMeta > 0 && (
                  <div className="flex items-center gap-2 text-xs text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{tempoTriagemEcg.foraMeta} fora da meta</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Alta Complexidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gray-900">{taxaAltaComplexidade.percentual}%</p>
                <p className="text-xs text-gray-600">
                  {taxaAltaComplexidade.quantidade} de {taxaAltaComplexidade.total} pacientes
                </p>
                <p className="text-xs text-gray-500">Classificação Vermelha ou Laranja</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-l-teal-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Taxa de Resolução
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gray-900">{taxaResolucao.percentual}%</p>
                <p className="text-xs text-gray-600">
                  {taxaResolucao.quantidade} de {taxaResolucao.total} pacientes
                </p>
                <p className="text-xs text-gray-500">Alta, Transferência ou Regulação</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-l-pink-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Taxa Reperfusão Efetiva
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gray-900">{taxaReperfusaoEfetiva.percentual}%</p>
                <p className="text-xs text-gray-600">
                  {taxaReperfusaoEfetiva.efetivas} de {taxaReperfusaoEfetiva.total} ICPs
                </p>
                <p className="text-xs text-gray-500">Meta: &gt;90% de reperfusão efetiva</p>
                {taxaReperfusaoEfetiva.total > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    {taxaReperfusaoEfetiva.percentual >= 90 ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 font-medium">✓ Meta atingida</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <span className="text-orange-600 font-medium">⚠ Abaixo da meta</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Cumprimento das Metas de Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: "Triagem", tempo: tempoTriagem.media, meta: 4 },
                  { name: "Espera", tempo: tempoEspera.media, meta: 15 },
                  { name: "Triagem Clínica", tempo: tempoTriagemClinica.media, meta: 20 },
                  { name: "Porta-ECG", tempo: tempoTriagemEcg.media, meta: 10 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                  <YAxis label={{ value: 'Minutos', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tempo" fill="#2563EB" name="Tempo Real" />
                  <Bar dataKey="meta" fill="#16A34A" name="Meta" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Distribuição por Classificação</CardTitle>
            </CardHeader>
            <CardContent>
              {distribuicaoRisco.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distribuicaoRisco}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {distribuicaoRisco.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabela Detalhada */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Resumo de Todas as Metas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="text-left p-3 font-semibold text-gray-700">Indicador</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Média</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Meta</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3">Tempo de Triagem</td>
                    <td className="text-center p-3 font-medium">{tempoTriagem.media} min</td>
                    <td className="text-center p-3">≤ 4 min</td>
                    <td className="text-center p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        tempoTriagem.media <= 4 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {tempoTriagem.media <= 4 ? '✓ Cumprida' : '⚠ Não cumprida'}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3">Tempo de Espera</td>
                    <td className="text-center p-3 font-medium">{tempoEspera.media} min</td>
                    <td className="text-center p-3">≤ 15 min</td>
                    <td className="text-center p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        tempoEspera.media <= 15 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {tempoEspera.media <= 15 ? '✓ Cumprida' : '⚠ Não cumprida'}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3">Triagem Clínica Completa</td>
                    <td className="text-center p-3 font-medium">{tempoTriagemClinica.media} min</td>
                    <td className="text-center p-3">≤ 20 min</td>
                    <td className="text-center p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        tempoTriagemClinica.media <= 20 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {tempoTriagemClinica.media <= 20 ? '✓ Cumprida' : '⚠ Não cumprida'}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3">Porta-ECG (IAM)</td>
                    <td className="text-center p-3 font-medium">{tempoTriagemEcg.media} min</td>
                    <td className="text-center p-3">≤ 10 min</td>
                    <td className="text-center p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        tempoTriagemEcg.media <= 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {tempoTriagemEcg.media <= 10 ? '✓ Cumprida' : '✗ Não cumprida'}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3">Taxa de Alta Complexidade</td>
                    <td className="text-center p-3 font-medium">{taxaAltaComplexidade.percentual}%</td>
                    <td className="text-center p-3">-</td>
                    <td className="text-center p-3">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                        Monitoramento
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3">Taxa de Resolução</td>
                    <td className="text-center p-3 font-medium">{taxaResolucao.percentual}%</td>
                    <td className="text-center p-3">-</td>
                    <td className="text-center p-3">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                        Monitoramento
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3">Taxa de Reperfusão Efetiva</td>
                    <td className="text-center p-3 font-medium">{taxaReperfusaoEfetiva.percentual}%</td>
                    <td className="text-center p-3">&gt; 90%</td>
                    <td className="text-center p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        taxaReperfusaoEfetiva.percentual >= 90 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {taxaReperfusaoEfetiva.percentual >= 90 ? '✓ Cumprida' : '⚠ Não cumprida'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Nota sobre as Metas */}
        <Card className="shadow-md mt-6 border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Metas de Qualidade Estabelecidas
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>• Tempo de Triagem (≤4min):</strong> Início rápido do atendimento</p>
              <p><strong>• Tempo de Espera (≤15min):</strong> Da triagem até avaliação médica</p>
              <p><strong>• Triagem Clínica (≤20min):</strong> Processo completo de enfermagem</p>
              <p><strong>• Porta-ECG (≤10min):</strong> Meta SBC 2025 para suspeita de SCA</p>
              <p><strong>• Taxa de Alta Complexidade:</strong> % de casos vermelhos/laranjas</p>
              <p><strong>• Taxa de Resolução:</strong> % de casos com desfecho definido</p>
              <p><strong>• Taxa de Reperfusão Efetiva:</strong> % de ICPs com reperfusão efetiva (meta &gt;90%)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}