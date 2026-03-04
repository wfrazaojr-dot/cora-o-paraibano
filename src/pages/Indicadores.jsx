import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Clock, Activity, AlertTriangle, CheckCircle, Target, Heart } from "lucide-react";
import { format, differenceInMinutes, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import ExportarRelatorio from "@/components/indicadores/ExportarRelatorio";

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
  const [macrorregiao, setMacrorregiao] = useState("todas");
  const [tipoScaFiltro, setTipoScaFiltro] = useState("todos");

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



  // 1. Porta-ECG (≤10min) - Classificação de Risco até ECG
  const portaEcg = useMemo(() => {
    const tempos = pacientesFiltrados
      .filter(p => p.triagem_enfermagem?.data_hora_classificacao_risco && p.triagem_enfermagem?.data_hora_ecg)
      .map(p => differenceInMinutes(
        new Date(p.triagem_enfermagem.data_hora_ecg), 
        new Date(p.triagem_enfermagem.data_hora_classificacao_risco)
      ));
    
    if (tempos.length === 0) return { media: 0, min: 0, max: 0, dentroMeta: 0, foraMeta: 0 };
    
    return {
      media: Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length),
      min: Math.min(...tempos),
      max: Math.max(...tempos),
      dentroMeta: tempos.filter(t => t <= 10).length,
      foraMeta: tempos.filter(t => t > 10).length
    };
  }, [pacientesFiltrados]);

  // 2. Porta Decisão (≤20min) - Início Triagem até envio relatório etapa 4
  const portaDecisao = useMemo(() => {
    const tempos = pacientesFiltrados
      .filter(p => p.data_hora_inicio_triagem && p.relatorio_triagem_url)
      .map(p => {
        const etapa4 = p.historico_etapas?.find(e => e.etapa === 4);
        if (!etapa4?.data_hora) return null;
        return differenceInMinutes(new Date(etapa4.data_hora), new Date(p.data_hora_inicio_triagem));
      })
      .filter(t => t !== null);
    
    if (tempos.length === 0) return { media: 0, min: 0, max: 0, dentroMeta: 0, foraMeta: 0 };
    
    return {
      media: Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length),
      min: Math.min(...tempos),
      max: Math.max(...tempos),
      dentroMeta: tempos.filter(t => t <= 20).length,
      foraMeta: tempos.filter(t => t > 20).length
    };
  }, [pacientesFiltrados]);

  // 3. Regulação (≤15min) - Envio relatório etapa 4 até regulação CERH
  const regulacao = useMemo(() => {
    const tempos = pacientesFiltrados
      .filter(p => p.regulacao_central?.data_hora)
      .map(p => {
        const etapa4 = p.historico_etapas?.find(e => e.etapa === 4);
        if (!etapa4?.data_hora) return null;
        return differenceInMinutes(new Date(p.regulacao_central.data_hora), new Date(etapa4.data_hora));
      })
      .filter(t => t !== null);
    
    if (tempos.length === 0) return { media: 0, min: 0, max: 0, dentroMeta: 0, foraMeta: 0 };
    
    return {
      media: Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length),
      min: Math.min(...tempos),
      max: Math.max(...tempos),
      dentroMeta: tempos.filter(t => t <= 15).length,
      foraMeta: tempos.filter(t => t > 15).length
    };
  }, [pacientesFiltrados]);

  // 4. Porta-Telecardio (≤15min) - Envio relatório etapa 4 até parecer cardiologista
  const portaTelecardio = useMemo(() => {
    const tempos = pacientesFiltrados
      .filter(p => p.assessoria_cardiologia?.data_hora)
      .map(p => {
        const etapa4 = p.historico_etapas?.find(e => e.etapa === 4);
        if (!etapa4?.data_hora) return null;
        return differenceInMinutes(new Date(p.assessoria_cardiologia.data_hora), new Date(etapa4.data_hora));
      })
      .filter(t => t !== null);
    
    if (tempos.length === 0) return { media: 0, min: 0, max: 0, dentroMeta: 0, foraMeta: 0 };
    
    return {
      media: Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length),
      min: Math.min(...tempos),
      max: Math.max(...tempos),
      dentroMeta: tempos.filter(t => t <= 15).length,
      foraMeta: tempos.filter(t => t > 15).length
    };
  }, [pacientesFiltrados]);

  // 5. Transporte (≤90min) - Início transporte até destino
  const transporte = useMemo(() => {
    const tempos = pacientesFiltrados
      .filter(p => p.transporte?.data_hora_inicio && p.transporte?.data_hora_chegada_destino)
      .map(p => differenceInMinutes(
        new Date(p.transporte.data_hora_chegada_destino), 
        new Date(p.transporte.data_hora_inicio)
      ));
    
    if (tempos.length === 0) return { media: 0, min: 0, max: 0, dentroMeta: 0, foraMeta: 0 };
    
    return {
      media: Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length),
      min: Math.min(...tempos),
      max: Math.max(...tempos),
      dentroMeta: tempos.filter(t => t <= 90).length,
      foraMeta: tempos.filter(t => t > 90).length
    };
  }, [pacientesFiltrados]);

  // 6. ICP-Hemodinâmica (≤15min) - Chegada até início ICP
  const icpHemodinamica = useMemo(() => {
    const tempos = pacientesFiltrados
      .filter(p => p.hemodinamica?.data_hora_chegada && p.hemodinamica?.data_hora_inicio_procedimento)
      .map(p => differenceInMinutes(
        new Date(p.hemodinamica.data_hora_inicio_procedimento), 
        new Date(p.hemodinamica.data_hora_chegada)
      ));
    
    if (tempos.length === 0) return { media: 0, min: 0, max: 0, dentroMeta: 0, foraMeta: 0 };
    
    return {
      media: Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length),
      min: Math.min(...tempos),
      max: Math.max(...tempos),
      dentroMeta: tempos.filter(t => t <= 15).length,
      foraMeta: tempos.filter(t => t > 15).length
    };
  }, [pacientesFiltrados]);

  // Novos indicadores ICP por tipo e macrorregião
  const icpPorTipo = useMemo(() => {
    const todos = pacientesFiltrados.filter(p => p.hemodinamica?.tipo_icp);
    const macrorregioes = ["Macro 1", "Macro 2", "Macro 3"];
    const totais = {
      imediata: todos.filter(p => p.hemodinamica.tipo_icp === "imediata").length,
      ate_24h: todos.filter(p => p.hemodinamica.tipo_icp === "ate_24h").length,
      ate_72h: todos.filter(p => p.hemodinamica.tipo_icp === "ate_72h").length,
      total: todos.length
    };
    const porMacro = macrorregioes.map(macro => ({
      name: macro,
      imediata: todos.filter(p => p.macrorregiao === macro && p.hemodinamica.tipo_icp === "imediata").length,
      ate_24h: todos.filter(p => p.macrorregiao === macro && p.hemodinamica.tipo_icp === "ate_24h").length,
      ate_72h: todos.filter(p => p.macrorregiao === macro && p.hemodinamica.tipo_icp === "ate_72h").length,
    }));
    const comparecimento = {
      compareceu: todos.filter(p => p.hemodinamica.comparecimento_paciente === "compareceu").length,
      nao_compareceu: todos.filter(p => p.hemodinamica.comparecimento_paciente === "nao_compareceu").length,
    };
    return { totais, porMacro, comparecimento };
  }, [pacientesFiltrados]);

  // 7. FMC-to-device (≤120min) - Início triagem até chegada hemodinâmica
  const fmcToDevice = useMemo(() => {
    const tempos = pacientesFiltrados
      .filter(p => p.data_hora_inicio_triagem && p.hemodinamica?.data_hora_chegada)
      .map(p => differenceInMinutes(
        new Date(p.hemodinamica.data_hora_chegada), 
        new Date(p.data_hora_inicio_triagem)
      ));
    
    if (tempos.length === 0) return { media: 0, min: 0, max: 0, dentroMeta: 0, foraMeta: 0 };
    
    return {
      media: Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length),
      min: Math.min(...tempos),
      max: Math.max(...tempos),
      dentroMeta: tempos.filter(t => t <= 120).length,
      foraMeta: tempos.filter(t => t > 120).length
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-md border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Porta-ECG
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gray-900">{portaEcg.media} min</p>
                <p className="text-xs text-gray-600">
                  Mín: {portaEcg.min} | Máx: {portaEcg.max}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{portaEcg.dentroMeta} dentro da meta (≤10min)</span>
                </div>
                {portaEcg.foraMeta > 0 && (
                  <div className="flex items-center gap-2 text-xs text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{portaEcg.foraMeta} fora da meta</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Porta Decisão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gray-900">{portaDecisao.media} min</p>
                <p className="text-xs text-gray-600">
                  Mín: {portaDecisao.min} | Máx: {portaDecisao.max}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{portaDecisao.dentroMeta} dentro da meta (≤20min)</span>
                </div>
                {portaDecisao.foraMeta > 0 && (
                  <div className="flex items-center gap-2 text-xs text-orange-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{portaDecisao.foraMeta} fora da meta</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Regulação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gray-900">{regulacao.media} min</p>
                <p className="text-xs text-gray-600">
                  Mín: {regulacao.min} | Máx: {regulacao.max}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{regulacao.dentroMeta} dentro da meta (≤15min)</span>
                </div>
                {regulacao.foraMeta > 0 && (
                  <div className="flex items-center gap-2 text-xs text-orange-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{regulacao.foraMeta} fora da meta</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Porta-Telecardio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gray-900">{portaTelecardio.media} min</p>
                <p className="text-xs text-gray-600">
                  Mín: {portaTelecardio.min} | Máx: {portaTelecardio.max}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{portaTelecardio.dentroMeta} dentro da meta (≤15min)</span>
                </div>
                {portaTelecardio.foraMeta > 0 && (
                  <div className="flex items-center gap-2 text-xs text-orange-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{portaTelecardio.foraMeta} fora da meta</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Transporte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gray-900">{transporte.media} min</p>
                <p className="text-xs text-gray-600">
                  Mín: {transporte.min} | Máx: {transporte.max}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{transporte.dentroMeta} dentro da meta (≤90min)</span>
                </div>
                {transporte.foraMeta > 0 && (
                  <div className="flex items-center gap-2 text-xs text-orange-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{transporte.foraMeta} fora da meta</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-l-pink-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                ICP-Hemodinâmica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gray-900">{icpHemodinamica.media} min</p>
                <p className="text-xs text-gray-600">
                  Mín: {icpHemodinamica.min} | Máx: {icpHemodinamica.max}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{icpHemodinamica.dentroMeta} dentro da meta (≤15min)</span>
                </div>
                {icpHemodinamica.foraMeta > 0 && (
                  <div className="flex items-center gap-2 text-xs text-orange-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{icpHemodinamica.foraMeta} fora da meta</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-l-indigo-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Target className="w-4 h-4" />
                FMC-to-device
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gray-900">{fmcToDevice.media} min</p>
                <p className="text-xs text-gray-600">
                  Mín: {fmcToDevice.min} | Máx: {fmcToDevice.max}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{fmcToDevice.dentroMeta} dentro da meta (≤120min)</span>
                </div>
                {fmcToDevice.foraMeta > 0 && (
                  <div className="flex items-center gap-2 text-xs text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{fmcToDevice.foraMeta} fora da meta</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico */}
        <div className="mb-8">
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
                    <td className="p-3">Porta-ECG</td>
                    <td className="text-center p-3 font-medium">{portaEcg.media} min</td>
                    <td className="text-center p-3">≤ 10 min</td>
                    <td className="text-center p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        portaEcg.media <= 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {portaEcg.media <= 10 ? '✓ Cumprida' : '✗ Não cumprida'}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3">Porta Decisão</td>
                    <td className="text-center p-3 font-medium">{portaDecisao.media} min</td>
                    <td className="text-center p-3">≤ 20 min</td>
                    <td className="text-center p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        portaDecisao.media <= 20 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {portaDecisao.media <= 20 ? '✓ Cumprida' : '⚠ Não cumprida'}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3">Regulação</td>
                    <td className="text-center p-3 font-medium">{regulacao.media} min</td>
                    <td className="text-center p-3">≤ 15 min</td>
                    <td className="text-center p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        regulacao.media <= 15 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {regulacao.media <= 15 ? '✓ Cumprida' : '⚠ Não cumprida'}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3">Porta-Telecardio</td>
                    <td className="text-center p-3 font-medium">{portaTelecardio.media} min</td>
                    <td className="text-center p-3">≤ 15 min</td>
                    <td className="text-center p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        portaTelecardio.media <= 15 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {portaTelecardio.media <= 15 ? '✓ Cumprida' : '⚠ Não cumprida'}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3">Transporte</td>
                    <td className="text-center p-3 font-medium">{transporte.media} min</td>
                    <td className="text-center p-3">≤ 90 min</td>
                    <td className="text-center p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        transporte.media <= 90 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {transporte.media <= 90 ? '✓ Cumprida' : '⚠ Não cumprida'}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3">ICP-Hemodinâmica</td>
                    <td className="text-center p-3 font-medium">{icpHemodinamica.media} min</td>
                    <td className="text-center p-3">≤ 15 min</td>
                    <td className="text-center p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        icpHemodinamica.media <= 15 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {icpHemodinamica.media <= 15 ? '✓ Cumprida' : '⚠ Não cumprida'}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3">FMC-to-device</td>
                    <td className="text-center p-3 font-medium">{fmcToDevice.media} min</td>
                    <td className="text-center p-3">≤ 120 min</td>
                    <td className="text-center p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        fmcToDevice.media <= 120 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {fmcToDevice.media <= 120 ? '✓ Cumprida' : '✗ Não cumprida'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Indicadores de ICP por Tipo e Macrorregião */}
        <Card className="shadow-md mt-6 border-l-4 border-l-pink-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-600" />
              ICP – Distribuição por Tipo e Macrorregião
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Totais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-pink-50 rounded-lg p-4 text-center border border-pink-200">
                <p className="text-xs text-gray-600 font-medium">Total ICP</p>
                <p className="text-3xl font-bold text-pink-700">{icpPorTipo.totais.total}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
                <p className="text-xs text-gray-600 font-medium">ICP Imediata</p>
                <p className="text-3xl font-bold text-red-700">{icpPorTipo.totais.imediata}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-200">
                <p className="text-xs text-gray-600 font-medium">ICP ≤ 24h</p>
                <p className="text-3xl font-bold text-orange-700">{icpPorTipo.totais.ate_24h}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center border border-yellow-200">
                <p className="text-xs text-gray-600 font-medium">ICP ≤ 72h</p>
                <p className="text-3xl font-bold text-yellow-700">{icpPorTipo.totais.ate_72h}</p>
              </div>
            </div>

            {/* Comparecimento */}
            {(icpPorTipo.comparecimento.compareceu > 0 || icpPorTipo.comparecimento.nao_compareceu > 0) && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                  <p className="text-xs text-gray-600 font-medium">Compareceram (≤24h/72h)</p>
                  <p className="text-3xl font-bold text-green-700">{icpPorTipo.comparecimento.compareceu}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                  <p className="text-xs text-gray-600 font-medium">Não Compareceram</p>
                  <p className="text-3xl font-bold text-gray-700">{icpPorTipo.comparecimento.nao_compareceu}</p>
                </div>
              </div>
            )}

            {/* Gráfico por Macrorregião */}
            {icpPorTipo.totais.total > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Distribuição por Macrorregião</p>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={icpPorTipo.porMacro}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="imediata" name="ICP Imediata" fill="#DC2626" />
                    <Bar dataKey="ate_24h" name="ICP ≤ 24h" fill="#EA580C" />
                    <Bar dataKey="ate_72h" name="ICP ≤ 72h" fill="#CA8A04" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {icpPorTipo.totais.total === 0 && (
              <div className="text-center text-gray-500 py-6">Nenhuma ICP registrada neste período.</div>
            )}
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
              <p><strong>• Porta-ECG (≤10min):</strong> Classificação de Risco até realização do ECG</p>
              <p><strong>• Porta Decisão (≤20min):</strong> Início da triagem até envio do relatório (Etapa 4)</p>
              <p><strong>• Regulação (≤15min):</strong> Envio do relatório até regulação da vaga pelo CERH</p>
              <p><strong>• Porta-Telecardio (≤15min):</strong> Envio do relatório até parecer do cardiologista</p>
              <p><strong>• Transporte (≤90min):</strong> Início do transporte até chegada ao destino</p>
              <p><strong>• ICP-Hemodinâmica (≤15min):</strong> Chegada na hemodinâmica até início da ICP</p>
              <p><strong>• FMC-to-device (≤120min):</strong> Início da triagem até chegada na hemodinâmica</p>
              <p><strong>• ICP Imediata:</strong> Estratégia 1 – ICP realizada imediatamente (IAMCEST ou alto risco imediato)</p>
              <p><strong>• ICP ≤ 24h:</strong> Estratégia 2 – Invasiva em até 24 horas (SCASESST alto risco)</p>
              <p><strong>• ICP ≤ 72h:</strong> Estratégia 3 – Invasiva em até 72 horas (SCASESST risco intermediário)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}