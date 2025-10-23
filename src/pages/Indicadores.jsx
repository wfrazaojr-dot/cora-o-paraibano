import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Clock, Activity, AlertTriangle, CheckCircle } from "lucide-react";
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

  const { data: pacientes = [], isLoading } = useQuery({
    queryKey: ['pacientes'],
    queryFn: () => base44.entities.Paciente.list("-created_date"),
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

  // Indicador 1: Tempo chegada → triagem
  const tempoChegadaTriagem = useMemo(() => {
    const tempos = pacientesFiltrados
      .filter(p => p.data_hora_chegada && p.data_hora_inicio_triagem)
      .map(p => differenceInMinutes(new Date(p.data_hora_inicio_triagem), new Date(p.data_hora_chegada)));
    
    if (tempos.length === 0) return { media: 0, min: 0, max: 0, dentroMeta: 0, foraMeta: 0 };
    
    return {
      media: Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length),
      min: Math.min(...tempos),
      max: Math.max(...tempos),
      dentroMeta: tempos.filter(t => t <= 15).length,
      foraMeta: tempos.filter(t => t > 15).length
    };
  }, [pacientesFiltrados]);

  // Indicador 2: Tempo triagem → ECG
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

  // Indicador 3: Tempo total triagem + classificação
  const tempoTriagemClassificacao = useMemo(() => {
    const tempos = pacientesFiltrados
      .filter(p => p.data_hora_inicio_triagem && p.classificacao_risco)
      .map(p => {
        // Assumindo que classificação foi feita próximo ao horário do ECG
        if (p.data_hora_ecg) {
          return differenceInMinutes(new Date(p.data_hora_ecg), new Date(p.data_hora_inicio_triagem));
        }
        return null;
      })
      .filter(t => t !== null);
    
    if (tempos.length === 0) return { media: 0, min: 0, max: 0 };
    
    return {
      media: Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length),
      min: Math.min(...tempos),
      max: Math.max(...tempos)
    };
  }, [pacientesFiltrados]);

  // Indicador 4: Tempo avaliação médica → relatório para regulação
  const tempoAvaliacaoRelatorio = useMemo(() => {
    const tempos = pacientesFiltrados
      .filter(p => p.avaliacao_medica?.data_hora_avaliacao && p.data_hora_encerramento)
      .map(p => differenceInMinutes(new Date(p.data_hora_encerramento), new Date(p.avaliacao_medica.data_hora_avaliacao)));
    
    if (tempos.length === 0) return { media: 0, min: 0, max: 0, dentroMeta: 0, foraMeta: 0 };
    
    return {
      media: Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length),
      min: Math.min(...tempos),
      max: Math.max(...tempos),
      dentroMeta: tempos.filter(t => t <= 30).length,
      foraMeta: tempos.filter(t => t > 30).length
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

  if (isLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Indicadores de Desempenho</h1>
          <p className="text-gray-600">Análise de tempos e métricas do atendimento</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-md border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Chegada → Triagem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gray-900">{tempoChegadaTriagem.media} min</p>
                <p className="text-xs text-gray-600">
                  Mín: {tempoChegadaTriagem.min} | Máx: {tempoChegadaTriagem.max}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{tempoChegadaTriagem.dentroMeta} dentro da meta (≤15min)</span>
                </div>
                {tempoChegadaTriagem.foraMeta > 0 && (
                  <div className="flex items-center gap-2 text-xs text-orange-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{tempoChegadaTriagem.foraMeta} fora da meta</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Triagem → ECG
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

          <Card className="shadow-md border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Triagem + Classificação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gray-900">{tempoTriagemClassificacao.media} min</p>
                <p className="text-xs text-gray-600">
                  Mín: {tempoTriagemClassificacao.min} | Máx: {tempoTriagemClassificacao.max}
                </p>
                <p className="text-xs text-gray-500">Tempo total do processo de enfermagem</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Avaliação → Regulação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gray-900">{tempoAvaliacaoRelatorio.media} min</p>
                <p className="text-xs text-gray-600">
                  Mín: {tempoAvaliacaoRelatorio.min} | Máx: {tempoAvaliacaoRelatorio.max}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{tempoAvaliacaoRelatorio.dentroMeta} dentro da meta (≤30min)</span>
                </div>
                {tempoAvaliacaoRelatorio.foraMeta > 0 && (
                  <div className="flex items-center gap-2 text-xs text-orange-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{tempoAvaliacaoRelatorio.foraMeta} fora da meta</span>
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
              <CardTitle>Comparação de Tempos Médios</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: "Chegada → Triagem", tempo: tempoChegadaTriagem.media, meta: 15 },
                  { name: "Triagem → ECG", tempo: tempoTriagemEcg.media, meta: 10 },
                  { name: "Triagem + Class.", tempo: tempoTriagemClassificacao.media, meta: null },
                  { name: "Aval. → Regulação", tempo: tempoAvaliacaoRelatorio.media, meta: 30 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-15} textAnchor="end" height={100} />
                  <YAxis label={{ value: 'Minutos', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tempo" fill="#2563EB" name="Tempo Médio" />
                  <Bar dataKey="meta" fill="#16A34A" name="Meta" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Distribuição por Classificação de Risco</CardTitle>
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
                  Nenhum dado disponível para o período selecionado
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabela Detalhada */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Detalhamento por Indicador</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="text-left p-3 font-semibold text-gray-700">Indicador</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Média</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Mínimo</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Máximo</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Meta</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Conformidade</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3">Tempo Chegada → Triagem</td>
                    <td className="text-center p-3 font-medium">{tempoChegadaTriagem.media} min</td>
                    <td className="text-center p-3">{tempoChegadaTriagem.min} min</td>
                    <td className="text-center p-3">{tempoChegadaTriagem.max} min</td>
                    <td className="text-center p-3">≤ 15 min</td>
                    <td className="text-center p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        tempoChegadaTriagem.media <= 15 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {tempoChegadaTriagem.media <= 15 ? '✓ Dentro da meta' : '⚠ Acima da meta'}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3">Tempo Triagem → ECG</td>
                    <td className="text-center p-3 font-medium">{tempoTriagemEcg.media} min</td>
                    <td className="text-center p-3">{tempoTriagemEcg.min} min</td>
                    <td className="text-center p-3">{tempoTriagemEcg.max} min</td>
                    <td className="text-center p-3">≤ 10 min</td>
                    <td className="text-center p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        tempoTriagemEcg.media <= 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {tempoTriagemEcg.media <= 10 ? '✓ Dentro da meta' : '✗ Acima da meta'}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3">Tempo Triagem + Classificação</td>
                    <td className="text-center p-3 font-medium">{tempoTriagemClassificacao.media} min</td>
                    <td className="text-center p-3">{tempoTriagemClassificacao.min} min</td>
                    <td className="text-center p-3">{tempoTriagemClassificacao.max} min</td>
                    <td className="text-center p-3">-</td>
                    <td className="text-center p-3">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                        Monitoramento
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3">Tempo Avaliação → Regulação</td>
                    <td className="text-center p-3 font-medium">{tempoAvaliacaoRelatorio.media} min</td>
                    <td className="text-center p-3">{tempoAvaliacaoRelatorio.min} min</td>
                    <td className="text-center p-3">{tempoAvaliacaoRelatorio.max} min</td>
                    <td className="text-center p-3">≤ 30 min</td>
                    <td className="text-center p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        tempoAvaliacaoRelatorio.media <= 30 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {tempoAvaliacaoRelatorio.media <= 30 ? '✓ Dentro da meta' : '⚠ Acima da meta'}
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
            <h3 className="font-semibold text-gray-900 mb-3">📊 Sobre as Metas de Tempo</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Meta Triagem → ECG (≤ 10 minutos):</strong> Baseada na Diretriz SBC 2025 para pacientes com suspeita de SCA</p>
              <p><strong>Meta Avaliação → Regulação (≤ 30 minutos):</strong> Tempo ideal para casos que necessitam regulação</p>
              <p><strong>Meta Chegada → Triagem (≤ 15 minutos):</strong> Tempo recomendado para início da avaliação inicial</p>
              <p className="text-xs text-gray-500 mt-3">* As metas podem ser ajustadas conforme protocolo institucional</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}