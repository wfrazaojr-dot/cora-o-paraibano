import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { differenceInMinutes, format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, AlertTriangle, FileText, Search, Filter, XCircle, Clock, Truck, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

function duracao(inicio, fim) {
  if (!inicio || !fim) return "—";
  const mins = differenceInMinutes(new Date(fim), new Date(inicio));
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}min`;
}

function StatusBadge({ status }) {
  if (!status) return null;
  if (status === "Concluído") return <Badge className="bg-green-600 text-white text-xs">✅ Concluído</Badge>;
  if (status === "Com Intercorrência") return <Badge className="bg-red-600 text-white text-xs">⚠️ Com Intercorrência</Badge>;
  if (status === "Não Iniciado - Intercorrência") return <Badge className="bg-orange-500 text-white text-xs">🚫 Não Iniciado</Badge>;
  return <Badge className="bg-gray-400 text-white text-xs">{status}</Badge>;
}

export default function HistoricoTransportes({ pacientes }) {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroDestino, setFiltroDestino] = useState("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Transportes finalizados: com chegada ao destino, status concluído, com intercorrência ou não iniciado
  const historico = useMemo(() => {
    return pacientes
      .filter(p => {
        const t = p.transporte;
        if (!t) return false;
        return !!t.data_hora_chegada_destino
          || t.status_transporte === "Concluído"
          || t.status_transporte === "Com Intercorrência"
          || t.status_transporte === "Não Iniciado - Intercorrência";
      })
      .sort((a, b) => {
        const dA = a.transporte?.data_hora_chegada_destino || a.transporte?.data_hora_solicitacao || "";
        const dB = b.transporte?.data_hora_chegada_destino || b.transporte?.data_hora_solicitacao || "";
        return dB.localeCompare(dA);
      });
  }, [pacientes]);

  // Lista de destinos únicos para o filtro
  const destinos = useMemo(() => {
    const set = new Set(historico.map(p => p.transporte?.unidade_destino).filter(Boolean));
    return Array.from(set).sort();
  }, [historico]);

  const filtrado = useMemo(() => {
    return historico.filter(p => {
      const t = p.transporte;

      if (busca) {
        const q = busca.toLowerCase();
        if (!p.nome_completo?.toLowerCase().includes(q) && !t?.unidade_destino?.toLowerCase().includes(q)) return false;
      }

      if (filtroStatus !== "todos") {
        if (filtroStatus === "concluido" && t?.status_transporte !== "Concluído") return false;
        if (filtroStatus === "intercorrencia" && t?.status_transporte !== "Com Intercorrência") return false;
        if (filtroStatus === "nao_iniciado" && t?.status_transporte !== "Não Iniciado - Intercorrência") return false;
      }

      if (filtroDestino !== "todos" && t?.unidade_destino !== filtroDestino) return false;

      if (dataInicio || dataFim) {
        const ref = t?.data_hora_chegada_destino || t?.data_hora_solicitacao;
        if (!ref) return false;
        const d = new Date(ref);
        if (dataInicio && d < startOfDay(parseISO(dataInicio))) return false;
        if (dataFim && d > endOfDay(parseISO(dataFim))) return false;
      }

      return true;
    });
  }, [historico, busca, filtroStatus, filtroDestino, dataInicio, dataFim]);

  const limparFiltros = () => {
    setBusca("");
    setFiltroStatus("todos");
    setFiltroDestino("todos");
    setDataInicio("");
    setDataFim("");
  };

  const temFiltros = busca || filtroStatus !== "todos" || filtroDestino !== "todos" || dataInicio || dataFim;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Filter className="w-4 h-4" />
            Filtros
            {temFiltros && (
              <button onClick={limparFiltros} className="ml-auto text-xs text-red-600 hover:underline flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Limpar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Busca por nome/destino */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Paciente ou destino..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>

            {/* Status */}
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="concluido">✅ Concluído</SelectItem>
                <SelectItem value="intercorrencia">⚠️ Com Intercorrência</SelectItem>
                <SelectItem value="nao_iniciado">🚫 Não Iniciado</SelectItem>
              </SelectContent>
            </Select>

            {/* Destino */}
            <Select value={filtroDestino} onValueChange={setFiltroDestino}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Destino" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os destinos</SelectItem>
                {destinos.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Datas */}
            <div className="flex gap-2">
              <Input
                type="date"
                value={dataInicio}
                onChange={e => setDataInicio(e.target.value)}
                className="text-sm"
                title="Data início"
              />
              <Input
                type="date"
                value={dataFim}
                onChange={e => setDataFim(e.target.value)}
                className="text-sm"
                title="Data fim"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultado */}
      <div className="text-sm text-gray-500 px-1">
        {filtrado.length} registro{filtrado.length !== 1 ? "s" : ""} encontrado{filtrado.length !== 1 ? "s" : ""}
      </div>

      {filtrado.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-400">
            <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Nenhum histórico encontrado</p>
            <p className="text-sm mt-1">Ajuste os filtros para ver outros registros</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtrado.map(p => {
            const t = p.transporte;
            const dur = duracao(t?.data_hora_inicio, t?.data_hora_chegada_destino);
            const dataRef = t?.data_hora_chegada_destino || t?.data_hora_solicitacao;

            return (
              <Card key={p.id} className={`border hover:shadow-md transition-shadow ${
                t?.status_transporte === "Com Intercorrência" ? "border-red-200 bg-red-50/40" :
                t?.status_transporte === "Não Iniciado - Intercorrência" ? "border-orange-200 bg-orange-50/40" :
                "border-green-200 bg-green-50/30"
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    {/* Info principal */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900">{p.nome_completo}</p>
                        <StatusBadge status={t?.status_transporte} />
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                        {t?.unidade_destino && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-indigo-500" />
                            <span className="font-medium text-indigo-700">{t.unidade_destino}</span>
                          </span>
                        )}
                        {t?.tipo_transporte && (
                          <span className="flex items-center gap-1">
                            <Truck className="w-3 h-3" />{t.tipo_transporte}
                          </span>
                        )}
                        {t?.data_hora_inicio && t?.data_hora_chegada_destino && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />Duração: <strong>{dur}</strong>
                          </span>
                        )}
                        {dataRef && (
                          <span className="text-gray-400">
                            {format(new Date(dataRef), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        )}
                      </div>

                      {t?.motivo_intercorrencia && (
                        <p className="text-xs text-red-700 mt-1">
                          <span className="font-semibold">Motivo:</span> {t.motivo_intercorrencia}
                        </p>
                      )}
                      {t?.motivo_nao_iniciado && (
                        <p className="text-xs text-orange-700 mt-1">
                          <span className="font-semibold">Impedimento:</span> {t.motivo_nao_iniciado}
                        </p>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2 shrink-0">
                      {p.relatorio_transporte_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-yellow-400 text-yellow-700 hover:bg-yellow-50"
                          onClick={() => window.open(p.relatorio_transporte_url, "_blank")}
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Relatório PDF
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => navigate(createPageUrl("TransporteDetalhe") + `?id=${p.id}`)}
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}