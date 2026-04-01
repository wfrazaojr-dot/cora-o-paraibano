import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, AlertTriangle, CheckCircle, Clock, Activity, ArrowLeft, RefreshCw } from "lucide-react";
import { differenceInMinutes, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AlertasTransporte from "@/components/dashboard/AlertasTransporte";
import CartaoTransporte from "@/components/transporte/CartaoTransporte";
import HistoricoTransportes from "@/components/transporte/HistoricoTransportes";

const LIMITES_MINUTOS = { 0: 60, 1: 120, 2: 180 };

const calcularPrioridade = (p) => {
  const t = p.triagem_medica?.tipo_sca;
  if (t === "SCACESST") return 0;
  if (t === "SCASESST_COM_TROPONINA") return 1;
  if (t === "SCASESST_SEM_TROPONINA") return 2;
  return 3;
};

export default function MonitorTransportes() {
  const navigate = useNavigate();
  const [aba, setAba] = useState("monitor"); // monitor | historico
  const [filtro, setFiltro] = useState("todos");
  const [agora, setAgora] = useState(new Date());

  // Atualiza relógio a cada 30s para recalcular tempos
  useEffect(() => {
    const interval = setInterval(() => setAgora(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const { data: pacientesRaw = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["transportes-monitor"],
    queryFn: () => base44.entities.Paciente.list("-created_date"),
    refetchInterval: 30000,
  });

  const pacientes = pacientesRaw
    .filter(p => p.transporte?.data_hora_inicio || p.status === "Em Transporte" || p.status === "Aguardando Transporte")
    .map(p => ({ ...p, prioridade: calcularPrioridade(p) }))
    .sort((a, b) => a.prioridade - b.prioridade);

  const emTransporte = pacientes.filter(p => p.status === "Em Transporte" && !p.transporte?.data_hora_chegada_destino);
  const concluidos = pacientes.filter(p => p.transporte?.data_hora_chegada_destino);
  const aguardando = pacientes.filter(p => p.status === "Aguardando Transporte" && !p.transporte?.data_hora_inicio);
  const atrasados = emTransporte.filter(p => {
    const mins = differenceInMinutes(agora, new Date(p.transporte.data_hora_inicio));
    return mins > (LIMITES_MINUTOS[p.prioridade] ?? 180);
  });

  const filtrados = filtro === "ativos" ? emTransporte :
    filtro === "aguardando" ? aguardando :
    filtro === "concluidos" ? concluidos : pacientes;

  const pacientesComPrioridade = pacientes.map(p => {
    if (p.status !== "Em Transporte" || !p.transporte?.data_hora_inicio) return p;
    const mins = differenceInMinutes(agora, new Date(p.transporte.data_hora_inicio));
    return { ...p, _minutos: mins };
  });

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate(createPageUrl("Dashboard"))}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Truck className="w-8 h-8 text-yellow-600" />
                Monitor de Transportes
              </h1>
              <p className="text-gray-500 text-sm">
                Atualizado: {format(agora, "HH:mm:ss", { locale: ptBR })} · Auto-refresh a cada 30s
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Abas */}
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setAba("monitor")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${aba === "monitor" ? "bg-yellow-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                <Truck className="w-4 h-4 inline mr-1" />
                Tempo Real
              </button>
              <button
                onClick={() => setAba("historico")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${aba === "historico" ? "bg-gray-700 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                <Clock className="w-4 h-4 inline mr-1" />
                Histórico
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Histórico */}
        {aba === "historico" && (
          <HistoricoTransportes pacientes={pacientesRaw.map(p => ({ ...p, prioridade: calcularPrioridade(p) }))} />
        )}

        {aba === "monitor" && (
        <div className="space-y-0">

        {/* Alertas */}
        <AlertasTransporte pacientes={pacientesComPrioridade} />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="cursor-pointer border-yellow-300" onClick={() => setFiltro(filtro === "ativos" ? "todos" : "ativos")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Truck className="w-5 h-5 text-yellow-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-700">{emTransporte.length}</p>
                <p className="text-xs text-gray-500">Em Transporte</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer border-red-300" onClick={() => setFiltro("ativos")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700">{atrasados.length}</p>
                <p className="text-xs text-gray-500">Com Atraso</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer border-blue-300" onClick={() => setFiltro(filtro === "aguardando" ? "todos" : "aguardando")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Clock className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{aguardando.length}</p>
                <p className="text-xs text-gray-500">Aguardando</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer border-green-300" onClick={() => setFiltro(filtro === "concluidos" ? "todos" : "concluidos")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{concluidos.length}</p>
                <p className="text-xs text-gray-500">Concluídos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: "ativos", label: `Em Transporte (${emTransporte.length})`, color: "bg-yellow-600 hover:bg-yellow-700" },
            { key: "aguardando", label: `Aguardando (${aguardando.length})`, color: "bg-blue-600 hover:bg-blue-700" },
            { key: "concluidos", label: `Concluídos (${concluidos.length})`, color: "bg-green-600 hover:bg-green-700" },
            { key: "todos", label: `Todos (${pacientes.length})`, color: "bg-gray-600 hover:bg-gray-700" },
          ].map(f => (
            <Button
              key={f.key}
              size="sm"
              className={filtro === f.key ? `${f.color} text-white` : ""}
              variant={filtro === f.key ? "default" : "outline"}
              onClick={() => setFiltro(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Grid de Cartões */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Activity className="w-10 h-10 text-yellow-600 animate-spin" />
          </div>
        ) : filtrados.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-gray-500">
              <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium">Nenhum transporte encontrado</p>
              <p className="text-sm mt-1">Ajuste o filtro ou aguarde novos transportes</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtrados.map(p => (
              <CartaoTransporte key={p.id} paciente={p} />
            ))}
          </div>
        )}

        </div>
        )}
      </div>
    </div>
  );

}