import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Search, RefreshCw, User, Calendar, Activity, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const acaoLabel = {
  criar: { label: "Criação", color: "bg-green-100 text-green-800" },
  atualizar: { label: "Atualização", color: "bg-blue-100 text-blue-800" },
  deletar: { label: "Exclusão", color: "bg-red-100 text-red-800" },
  visualizar: { label: "Visualização", color: "bg-gray-100 text-gray-700" },
  login: { label: "Login", color: "bg-purple-100 text-purple-800" },
  logout: { label: "Logout", color: "bg-orange-100 text-orange-800" },
  gerar_relatorio: { label: "Relatório", color: "bg-yellow-100 text-yellow-800" },
  transferir: { label: "Transferência", color: "bg-indigo-100 text-indigo-800" },
  concluir: { label: "Conclusão", color: "bg-teal-100 text-teal-800" },
};

const severidadeColor = {
  info: "bg-blue-50 border-blue-200",
  aviso: "bg-yellow-50 border-yellow-300",
  critico: "bg-red-50 border-red-300",
};

function LogCard({ log }) {
  const [expandido, setExpandido] = useState(false);
  const acao = acaoLabel[log.acao] || { label: log.acao, color: "bg-gray-100 text-gray-700" };
  const temDetalhes = (log.campos_alterados?.length > 0) || log.dados_anteriores || log.dados_novos;

  return (
    <div className={`border rounded-lg p-4 ${severidadeColor[log.severidade] || "bg-white border-gray-200"}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${acao.color}`}>
            {acao.label}
          </span>
          <span className="text-sm font-medium text-gray-800">{log.descricao}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {log.usuario_nome || log.usuario_email}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {log.created_date
              ? format(new Date(log.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })
              : "-"}
          </span>
          <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{log.entidade}</span>
          {log.severidade === "critico" && (
            <span className="text-red-600 font-bold uppercase text-xs">⚠ Crítico</span>
          )}
        </div>
      </div>

      {temDetalhes && (
        <div className="mt-2">
          <button
            onClick={() => setExpandido(!expandido)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            {expandido ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expandido ? "Ocultar detalhes" : "Ver detalhes"}
          </button>

          {expandido && (
            <div className="mt-3 space-y-2 text-xs text-gray-700">
              {log.campos_alterados?.length > 0 && (
                <div>
                  <p className="font-semibold mb-1">Campos alterados:</p>
                  <div className="flex flex-wrap gap-1">
                    {log.campos_alterados.map((campo, i) => (
                      <span key={i} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{campo}</span>
                    ))}
                  </div>
                </div>
              )}
              {log.dados_anteriores && (
                <div>
                  <p className="font-semibold mb-1">Estado anterior:</p>
                  <pre className="bg-gray-100 rounded p-2 overflow-auto max-h-32 text-xs">
                    {JSON.stringify(log.dados_anteriores, null, 2)}
                  </pre>
                </div>
              )}
              {log.dados_novos && (
                <div>
                  <p className="font-semibold mb-1">Novo estado:</p>
                  <pre className="bg-gray-100 rounded p-2 overflow-auto max-h-32 text-xs">
                    {JSON.stringify(log.dados_novos, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function LogsAuditoria() {
  const [busca, setBusca] = useState("");
  const [filtroAcao, setFiltroAcao] = useState("todos");
  const [filtroEntidade, setFiltroEntidade] = useState("todos");
  const [filtroSeveridade, setFiltroSeveridade] = useState("todos");

  const { data: logs = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["logsAuditoria"],
    queryFn: () => base44.entities.LogAuditoria.list("-created_date", 200),
    refetchInterval: 30000,
  });

  const entidades = [...new Set(logs.map(l => l.entidade).filter(Boolean))];

  const logsFiltrados = logs.filter(log => {
    const matchBusca = !busca ||
      log.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
      log.usuario_email?.toLowerCase().includes(busca.toLowerCase()) ||
      log.usuario_nome?.toLowerCase().includes(busca.toLowerCase()) ||
      log.entidade_id?.toLowerCase().includes(busca.toLowerCase());
    const matchAcao = filtroAcao === "todos" || log.acao === filtroAcao;
    const matchEntidade = filtroEntidade === "todos" || log.entidade === filtroEntidade;
    const matchSeveridade = filtroSeveridade === "todos" || log.severidade === filtroSeveridade;
    return matchBusca && matchAcao && matchEntidade && matchSeveridade;
  });

  const stats = {
    total: logs.length,
    criticos: logs.filter(l => l.severidade === "critico").length,
    hoje: logs.filter(l => {
      if (!l.created_date) return false;
      const d = new Date(l.created_date);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
    usuarios: new Set(logs.map(l => l.usuario_email)).size,
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-600" />
              Logs de Auditoria
            </h1>
            <p className="text-sm text-gray-500 mt-1">Histórico de todas as ações realizadas no sistema</p>
          </div>
          <Button
            onClick={() => refetch()}
            disabled={isFetching}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total de Logs", value: stats.total, icon: Activity, color: "text-blue-600" },
            { label: "Eventos Hoje", value: stats.hoje, icon: Calendar, color: "text-green-600" },
            { label: "Eventos Críticos", value: stats.criticos, icon: Shield, color: "text-red-600" },
            { label: "Usuários Ativos", value: stats.usuarios, icon: User, color: "text-purple-600" },
          ].map((stat) => (
            <Card key={stat.label} className="shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filtros */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por usuário, descrição ou ID..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filtroAcao} onValueChange={setFiltroAcao}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as ações</SelectItem>
                  {Object.entries(acaoLabel).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroEntidade} onValueChange={setFiltroEntidade}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Entidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {entidades.map(e => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroSeveridade} onValueChange={setFiltroSeveridade}>
                <SelectTrigger className="w-full md:w-36">
                  <SelectValue placeholder="Severidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="aviso">Aviso</SelectItem>
                  <SelectItem value="critico">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        <Card className="shadow-sm">
          <CardHeader className="border-b py-3 px-4">
            <CardTitle className="text-sm font-semibold text-gray-700">
              {logsFiltrados.length} registro{logsFiltrados.length !== 1 ? "s" : ""} encontrado{logsFiltrados.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">Carregando logs...</div>
            ) : logsFiltrados.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum log encontrado com os filtros selecionados.</p>
              </div>
            ) : (
              logsFiltrados.map(log => <LogCard key={log.id} log={log} />)
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}