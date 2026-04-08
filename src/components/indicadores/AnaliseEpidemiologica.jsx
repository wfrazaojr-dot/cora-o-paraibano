import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { MapPin, Building2, Users, Activity, Calendar } from "lucide-react";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from "date-fns";

const CORES_MACRO = { "Macro 1": "#2563EB", "Macro 2": "#16A34A", "Macro 3": "#DC2626" };
const CORES_SCA = { SCACESST: "#DC2626", SCASESST_COM_TROPONINA: "#EA580C", SCASESST_SEM_TROPONINA: "#CA8A04" };
const LABELS_SCA = {
  SCACESST: "SCACESST",
  SCASESST_COM_TROPONINA: "SCASESST c/ Troponina",
  SCASESST_SEM_TROPONINA: "SCASESST s/ Troponina"
};

function top(arr, key, n = 10) {
  const contagem = {};
  arr.forEach(p => { const v = p[key]; if (v) contagem[v] = (contagem[v] || 0) + 1; });
  return Object.entries(contagem)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, value]) => ({ name, value }));
}

function topPorSCA(arr, campo) {
  const tipos = ["SCACESST", "SCASESST_COM_TROPONINA", "SCASESST_SEM_TROPONINA"];
  const contagem = {};
  arr.forEach(p => {
    const unidade = p[campo];
    const sca = p.triagem_medica?.tipo_sca;
    if (!unidade || !sca) return;
    if (!contagem[unidade]) contagem[unidade] = { name: unidade, SCACESST: 0, SCASESST_COM_TROPONINA: 0, SCASESST_SEM_TROPONINA: 0, total: 0 };
    contagem[unidade][sca] = (contagem[unidade][sca] || 0) + 1;
    contagem[unidade].total += 1;
  });
  return Object.values(contagem).sort((a, b) => b.total - a.total).slice(0, 8);
}

function faixaEtaria(idade) {
  if (!idade) return "Não informado";
  if (idade < 40) return "< 40 anos";
  if (idade < 50) return "40-49 anos";
  if (idade < 60) return "50-59 anos";
  if (idade < 70) return "60-69 anos";
  if (idade < 80) return "70-79 anos";
  return "≥ 80 anos";
}

export default function AnaliseEpidemiologica({ pacientes = [] }) {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;
  const diaAtual = new Date().toISOString().split("T")[0];

  const [periodo, setPeriodo] = useState("mensal");
  const [anoSel, setAnoSel] = useState(anoAtual);
  const [mesSel, setMesSel] = useState(mesAtual);
  const [diaSel, setDiaSel] = useState(diaAtual);

  const anos = Array.from({ length: 5 }, (_, i) => anoAtual - 2 + i);
  const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  const filtrados = useMemo(() => {
    let inicio, fim;
    if (periodo === "diario") {
      const d = new Date(diaSel + "T00:00:00");
      inicio = startOfDay(d); fim = endOfDay(d);
    } else if (periodo === "mensal") {
      inicio = startOfMonth(new Date(anoSel, mesSel - 1));
      fim = endOfMonth(new Date(anoSel, mesSel - 1));
    } else {
      inicio = startOfYear(new Date(anoSel, 0));
      fim = endOfYear(new Date(anoSel, 0));
    }
    return pacientes.filter(p => {
      if (!p.data_hora_chegada) return false;
      return isWithinInterval(new Date(p.data_hora_chegada), { start: inicio, end: fim });
    });
  }, [pacientes, periodo, anoSel, mesSel, diaSel]);

  const total = filtrados.length;

  // Distribuição por Macrorregião
  const porMacro = useMemo(() => {
    return ["Macro 1", "Macro 2", "Macro 3"].map(m => ({
      name: m,
      value: filtrados.filter(p => p.macrorregiao === m).length,
      pct: total > 0 ? ((filtrados.filter(p => p.macrorregiao === m).length / total) * 100).toFixed(1) : 0
    }));
  }, [filtrados, total]);

  // Tipos de SCA
  const porSCA = useMemo(() => {
    return Object.keys(LABELS_SCA).map(sca => ({
      name: LABELS_SCA[sca],
      value: filtrados.filter(p => p.triagem_medica?.tipo_sca === sca).length,
      key: sca
    })).filter(x => x.value > 0);
  }, [filtrados]);

  // Top cidades
  const topCidades = useMemo(() => top(filtrados, "cidade", 10), [filtrados]);

  // Top unidades
  const topUnidades = useMemo(() => top(filtrados, "unidade_saude", 10), [filtrados]);

  // Top unidades por SCA
  const unidadesPorSCA = useMemo(() => topPorSCA(filtrados, "unidade_saude"), [filtrados]);

  // Perfil por sexo
  const porSexo = useMemo(() => [
    { name: "Masculino", value: filtrados.filter(p => p.sexo === "Masculino").length },
    { name: "Feminino", value: filtrados.filter(p => p.sexo === "Feminino").length }
  ].filter(x => x.value > 0), [filtrados]);

  // Perfil por faixa etária
  const porIdade = useMemo(() => {
    const faixas = ["< 40 anos", "40-49 anos", "50-59 anos", "60-69 anos", "70-79 anos", "≥ 80 anos", "Não informado"];
    return faixas.map(f => ({
      name: f,
      value: filtrados.filter(p => faixaEtaria(p.idade) === f).length
    })).filter(x => x.value > 0);
  }, [filtrados]);

  // Fatores de risco
  const fatoresRisco = useMemo(() => {
    const contagem = {};
    filtrados.forEach(p => {
      const fatores = p.avaliacao_clinica?.fatores_risco || p.avaliacao_clinica?.avaliacao_gravidade?.fatores_risco || [];
      (Array.isArray(fatores) ? fatores : []).forEach(f => {
        if (f) contagem[f] = (contagem[f] || 0) + 1;
      });
    });
    return Object.entries(contagem).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));
  }, [filtrados]);

  const CORES_PIE = ["#2563EB", "#DC2626", "#16A34A", "#CA8A04", "#7C3AED", "#DB2777"];

  return (
    <div className="space-y-6">
      {/* Filtros de Período */}
      <Card className="shadow-md border-l-4 border-l-teal-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-teal-800">
            <Calendar className="w-5 h-5" />
            Análise Epidemiológica — Filtro de Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Período</label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diario">Diário</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {periodo === "diario" && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Data</label>
                <input
                  type="date"
                  value={diaSel}
                  onChange={e => setDiaSel(e.target.value)}
                  className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            )}

            {(periodo === "mensal") && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Mês</label>
                <Select value={mesSel.toString()} onValueChange={v => setMesSel(parseInt(v))}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map((m, i) => <SelectItem key={i+1} value={(i+1).toString()}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(periodo === "mensal" || periodo === "anual") && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Ano</label>
                <Select value={anoSel.toString()} onValueChange={v => setAnoSel(parseInt(v))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {anos.map(a => <SelectItem key={a} value={a.toString()}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-2 ml-auto">
              <p className="text-xs text-teal-700 font-medium">Total de Atendimentos no Período</p>
              <p className="text-3xl font-bold text-teal-800">{total}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {total === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum atendimento encontrado no período selecionado.</p>
        </div>
      ) : (
        <>
          {/* Distribuição por Macrorregião */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Solicitações por Macrorregião de Saúde
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {porMacro.map(m => (
                  <div key={m.name} className="rounded-lg p-4 text-center border-2" style={{ borderColor: CORES_MACRO[m.name], backgroundColor: CORES_MACRO[m.name] + "10" }}>
                    <p className="text-sm font-semibold text-gray-700">{m.name}</p>
                    <p className="text-4xl font-bold" style={{ color: CORES_MACRO[m.name] }}>{m.value}</p>
                    <p className="text-sm text-gray-500">{m.pct}% do total</p>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={porMacro}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(v, n, p) => [`${v} casos (${p.payload.pct}%)`, p.payload.name]} />
                  <Bar dataKey="value" name="Solicitações">
                    {porMacro.map((m, i) => <Cell key={i} fill={CORES_MACRO[m.name]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tipo de SCA */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-600" />
                Prevalência por Tipo de Ocorrência (SCA)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {Object.keys(LABELS_SCA).map(sca => {
                    const count = filtrados.filter(p => p.triagem_medica?.tipo_sca === sca).length;
                    const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                    return (
                      <div key={sca} className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: CORES_SCA[sca] + "80", backgroundColor: CORES_SCA[sca] + "10" }}>
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: CORES_SCA[sca] }} />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800">{LABELS_SCA[sca]}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="h-2 rounded-full flex-1 bg-gray-200">
                              <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: CORES_SCA[sca] }} />
                            </div>
                            <span className="text-xs font-medium text-gray-600">{pct}%</span>
                          </div>
                        </div>
                        <span className="text-2xl font-bold" style={{ color: CORES_SCA[sca] }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={porSCA} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={e => `${e.value}`}>
                      {porSCA.map((e, i) => <Cell key={i} fill={CORES_SCA[e.key]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Cidades */}
          {topCidades.length > 0 && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Cidades com Maior Número de Solicitações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topCidades} layout="vertical" margin={{ left: 120 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={115} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Solicitações" fill="#16A34A" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Top Unidades de Saúde */}
          {topUnidades.length > 0 && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  Unidades de Saúde com Maior Número de Solicitações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th className="text-left p-3">#</th>
                        <th className="text-left p-3">Unidade de Saúde</th>
                        <th className="text-center p-3">Solicitações</th>
                        <th className="text-center p-3">% do Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topUnidades.map((u, i) => (
                        <tr key={u.name} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-bold text-gray-500">{i + 1}º</td>
                          <td className="p-3 font-medium">{u.name}</td>
                          <td className="p-3 text-center">
                            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">{u.value}</Badge>
                          </td>
                          <td className="p-3 text-center text-gray-600">
                            {total > 0 ? ((u.value / total) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unidades por Tipo de SCA */}
          {unidadesPorSCA.length > 0 && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-red-600" />
                  Solicitações por Unidade de Saúde e Tipo de SCA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={unidadesPorSCA} layout="vertical" margin={{ left: 140 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={135} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="SCACESST" name="SCACESST" fill={CORES_SCA.SCACESST} stackId="a" />
                    <Bar dataKey="SCASESST_COM_TROPONINA" name="SCASESST c/ Troponina" fill={CORES_SCA.SCASESST_COM_TROPONINA} stackId="a" />
                    <Bar dataKey="SCASESST_SEM_TROPONINA" name="SCASESST s/ Troponina" fill={CORES_SCA.SCASESST_SEM_TROPONINA} stackId="a" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Perfil dos Pacientes */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Perfil Epidemiológico dos Pacientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sexo */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Por Sexo</h4>
                  {porSexo.length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={porSexo} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={e => `${e.name}: ${e.value}`}>
                          <Cell fill="#2563EB" />
                          <Cell fill="#DB2777" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p className="text-gray-400 text-sm text-center py-6">Sem dados</p>}
                </div>

                {/* Faixa etária */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Por Faixa Etária</h4>
                  {porIdade.length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={porIdade}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" name="Pacientes" fill="#7C3AED" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <p className="text-gray-400 text-sm text-center py-6">Sem dados</p>}
                </div>
              </div>

              {/* Fatores de Risco */}
              {fatoresRisco.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Fatores de Risco mais Prevalentes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {fatoresRisco.map((f, i) => (
                      <div key={f.name} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border">
                        <span className="text-xs font-bold text-gray-400 w-6">{i + 1}º</span>
                        <span className="text-sm flex-1 text-gray-800">{f.name}</span>
                        <Badge className="bg-purple-100 text-purple-800">{f.value} casos</Badge>
                        <span className="text-xs text-gray-500">{total > 0 ? ((f.value / total) * 100).toFixed(1) : 0}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}