import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, ExternalLink, RefreshCw, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const corClassificacao = {
  "Vermelha": "bg-red-100 text-red-800 border-red-300",
  "Laranja": "bg-orange-100 text-orange-800 border-orange-300",
  "Amarela": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Verde": "bg-green-100 text-green-800 border-green-300",
  "Azul": "bg-blue-100 text-blue-800 border-blue-300"
};

const statusColors = {
  "Em Triagem": "bg-gray-100 text-gray-800 border-gray-300",
  "Aguardando Médico": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Em Atendimento": "bg-blue-100 text-blue-800 border-blue-300",
  "Aguardando Regulação": "bg-orange-100 text-orange-800 border-orange-300",
  "Transferido": "bg-purple-100 text-purple-800 border-purple-300",
  "Alta": "bg-green-100 text-green-800 border-green-300",
  "Óbito": "bg-red-100 text-red-800 border-red-300"
};

export default function Historico() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroUnidade, setFiltroUnidade] = useState("todas");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const verificarProfissional = (url) => {
    // Admin tem acesso direto sem verificação de profissional
    if (user?.role === 'admin') {
      return true;
    }
    
    const profissionalLogado = sessionStorage.getItem("profissional_logado");
    if (!profissionalLogado) {
      sessionStorage.setItem("redirect_after_pin", url);
      navigate(createPageUrl("AcessoProfissional"));
      return false;
    }
    return true;
  };

  const handleVerDetalhes = (pacienteId) => {
    const url = `${createPageUrl("NovaTriagem")}?id=${pacienteId}`;
    if (verificarProfissional(url)) {
      navigate(url);
    }
  };

  const handleRetriagem = (pacienteId) => {
    const url = `${createPageUrl("NovaTriagem")}?id=${pacienteId}&retriagem=true`;
    if (verificarProfissional(url)) {
      navigate(url);
    }
  };

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pacientes = [], isLoading } = useQuery({
    queryKey: ['pacientes', user?.email, user?.equipe],
    queryFn: async () => {
      const equipe = user?.equipe || 'unidade_saude';

      // Admin vê todos
      if (user?.role === 'admin') {
        return base44.entities.Paciente.list("-created_date");
      }

      // Usuário de unidade de saúde: vê apenas pacientes da sua unidade
      if (equipe === 'unidade_saude') {
        return base44.entities.Paciente.filter({ unidade_saude: user?.unidade_saude }, "-created_date");
      }

      // CERH e ASSCARDIO: veem todos (consolidado)
      return base44.entities.Paciente.list("-created_date");
    },
    enabled: !!user,
    initialData: [],
  });

  const unidadesDisponiveis = Array.from(new Set(pacientes.map(p => p.unidade_saude).filter(Boolean))).sort();

  const pacientesFiltrados = pacientes.filter(p => {
    // Filtro de busca por nome
    const termoBusca = busca.toLowerCase().trim();
    const matchBusca = !termoBusca || p.nome_completo?.toLowerCase().includes(termoBusca);

    // Filtro de status
    const matchStatus = filtroStatus === "todos" || p.status === filtroStatus;

    // Filtro de unidade
    const matchUnidade = filtroUnidade === "todas" || p.unidade_saude === filtroUnidade;

    // Filtro de data
    let matchData = true;
    if (dataInicio || dataFim) {
      const dataPaciente = new Date(p.data_hora_chegada);
      if (dataInicio) {
        matchData = matchData && dataPaciente >= new Date(dataInicio);
      }
      if (dataFim) {
        const dataFimAjustada = new Date(dataFim);
        dataFimAjustada.setHours(23, 59, 59, 999);
        matchData = matchData && dataPaciente <= dataFimAjustada;
      }
    }

    return matchBusca && matchStatus && matchUnidade && matchData;
  });

  // Contadores por status
  const contadores = {
    todos: pacientes.length,
    "Em Atendimento": pacientes.filter(p => p.status === "Em Atendimento").length,
    "Aguardando Médico": pacientes.filter(p => p.status === "Aguardando Médico").length,
    "Aguardando Regulação": pacientes.filter(p => p.status === "Aguardando Regulação").length,
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {user?.equipe === 'cerh' && 'Histórico CERH'}
            {user?.equipe === 'asscardio' && 'Histórico ASSCARDIO'}
            {user?.equipe === 'unidade_saude' && 'Histórico de Atendimentos'}
            {user?.role === 'admin' && 'Histórico Completo do Sistema'}
          </h1>
          <p className="text-gray-600">
            {user?.equipe === 'unidade_saude' && 'Registro de atendimentos da sua unidade'}
            {user?.equipe === 'cerh' && 'Registro consolidado de pacientes com assessoria cardiológica'}
            {user?.equipe === 'asscardio' && 'Registro consolidado de pacientes com regulação central'}
            {user?.role === 'admin' && 'Registro completo de todos os pacientes atendidos no sistema'}
          </p>
          <p className="text-sm text-blue-600 mt-1">
            👤 {user.full_name} • {user.email}
            {user?.equipe === 'cerh' && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">CERH</span>}
            {user?.equipe === 'asscardio' && <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">ASSCARDIO</span>}
            {user?.equipe === 'unidade_saude' && <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">UNIDADE DE SAÚDE</span>}
            {user?.role === 'admin' && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">ADMINISTRADOR</span>}
          </p>
        </div>

        {/* Filtros */}
         <Card className="shadow-md mb-6">
           <CardContent className="p-6 space-y-4">
             {/* Busca por nome */}
             <div>
               <Label htmlFor="busca" className="mb-2 block text-sm font-medium">Buscar por nome do paciente</Label>
               <div className="relative">
                 <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                 <Input
                   id="busca"
                   placeholder="Digite o nome do paciente..."
                   value={busca}
                   onChange={(e) => setBusca(e.target.value)}
                   className="pl-10"
                 />
               </div>
             </div>

             {/* Filtro de Unidade */}
             <div>
               <Label htmlFor="filtro-unidade" className="mb-2 block text-sm font-medium flex items-center gap-2">
                 <Filter className="w-4 h-4" />
                 Filtrar por Unidade de Saúde
               </Label>
               <Select value={filtroUnidade} onValueChange={setFiltroUnidade}>
                 <SelectTrigger id="filtro-unidade">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="todas">Todas as Unidades</SelectItem>
                   {unidadesDisponiveis.map(unidade => (
                     <SelectItem key={unidade} value={unidade}>
                       {unidade}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>

             {/* Filtro de Data */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="data-inicio" className="mb-2 block text-sm font-medium">Data Inicial</Label>
                 <Input
                   id="data-inicio"
                   type="date"
                   value={dataInicio}
                   onChange={(e) => setDataInicio(e.target.value)}
                 />
               </div>
               <div>
                 <Label htmlFor="data-fim" className="mb-2 block text-sm font-medium">Data Final</Label>
                 <Input
                   id="data-fim"
                   type="date"
                   value={dataFim}
                   onChange={(e) => setDataFim(e.target.value)}
                 />
               </div>
             </div>

             {/* Filtro de Status */}
             <div>
               <Label htmlFor="filtro-status" className="mb-2 block text-sm font-medium flex items-center gap-2">
                 <Filter className="w-4 h-4" />
                 Filtrar por Status
               </Label>
               <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                 <SelectTrigger id="filtro-status">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="todos">
                     📊 Todos os Status ({contadores.todos})
                   </SelectItem>
                   <SelectItem value="Em Atendimento">
                     🔵 Em Atendimento ({contadores["Em Atendimento"]})
                   </SelectItem>
                   <SelectItem value="Aguardando Médico">
                     🟡 Aguardando Médico ({contadores["Aguardando Médico"]})
                   </SelectItem>
                   <SelectItem value="Aguardando Regulação">
                     🟠 Aguardando Regulação ({contadores["Aguardando Regulação"]})
                   </SelectItem>
                   <SelectItem value="Em Triagem">
                     ⚪ Em Triagem
                   </SelectItem>
                   <SelectItem value="Transferido">
                     🟣 Transferido
                   </SelectItem>
                   <SelectItem value="Alta">
                     🟢 Alta
                   </SelectItem>
                   <SelectItem value="Óbito">
                     🔴 Óbito
                   </SelectItem>
                 </SelectContent>
               </Select>
             </div>

             {/* Resumo dos filtros */}
             {(busca || filtroStatus !== "todos" || filtroUnidade !== "todas" || dataInicio || dataFim) && (
               <div className="pt-2 border-t">
                 <p className="text-sm text-gray-600">
                   {pacientesFiltrados.length === 0 ? (
                     <span className="text-red-600 font-medium">
                       Nenhum paciente encontrado com os filtros aplicados
                     </span>
                   ) : (
                     <span className="text-green-600 font-medium">
                       Mostrando {pacientesFiltrados.length} de {pacientes.length} paciente(s)
                     </span>
                   )}
                 </p>
                 <Button
                   onClick={() => {
                     setBusca("");
                     setFiltroStatus("todos");
                     setFiltroUnidade("todas");
                     setDataInicio("");
                     setDataFim("");
                   }}
                   variant="link"
                   size="sm"
                   className="text-blue-600 px-0 mt-1"
                 >
                   Limpar filtros
                 </Button>
               </div>
             )}
           </CardContent>
         </Card>

        {/* Lista de Pacientes */}
        <Card className="shadow-md">
          <CardHeader className="border-b">
            <CardTitle>Pacientes ({pacientesFiltrados.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Carregando...</div>
            ) : pacientesFiltrados.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {busca || filtroStatus !== "todos" ? (
                  <>
                    <Search className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Nenhum paciente encontrado com os filtros aplicados</p>
                  </>
                ) : (
                  <>
                    <p>Nenhum paciente cadastrado</p>
                  </>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {pacientesFiltrados.map((paciente) => (
                  <div key={paciente.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{paciente.nome_completo}</h3>
                            <p className="text-sm text-gray-600">
                              {paciente.idade} anos • {paciente.sexo} • Pront. {paciente.prontuario}
                            </p>
                            <p className="text-xs text-gray-500 font-mono mt-1">
                              ID: {paciente.id}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                               👤 Criado por: {paciente.created_by}
                             </p>
                             {paciente.historico_etapas && paciente.historico_etapas.length > 0 && (
                               <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                                 <p className="font-semibold mb-1">Etapas preenchidas:</p>
                                 {paciente.historico_etapas.map((etapa, idx) => (
                                   <div key={idx} className="text-xs">
                                     Etapa {etapa.etapa}: {etapa.medico_nome} ({format(new Date(etapa.data_hora), "dd/MM HH:mm", { locale: ptBR })})
                                   </div>
                                 ))}
                               </div>
                             )}
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            {paciente.classificacao_risco?.cor && (
                              <Badge className={`${corClassificacao[paciente.classificacao_risco.cor]} border font-semibold`}>
                                {paciente.classificacao_risco.cor}
                              </Badge>
                            )}
                            <Badge className={`${statusColors[paciente.status]} border font-semibold`}>
                              {paciente.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3 mt-4">
                          <div className="text-sm">
                            <span className="text-gray-600">Chegada:</span>{" "}
                            <span className="font-medium">
                              {format(new Date(paciente.data_hora_chegada), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          {paciente.tempo_triagem_ecg_minutos && (
                            <div className="text-sm">
                              <span className="text-gray-600">Tempo Triagem-ECG:</span>{" "}
                              <span className={`font-medium ${paciente.tempo_triagem_ecg_minutos <= 10 ? "text-green-600" : "text-orange-600"}`}>
                                {paciente.tempo_triagem_ecg_minutos} min
                              </span>
                            </div>
                          )}
                          {paciente.tempo_total_minutos && (
                            <div className="text-sm">
                              <span className="text-gray-600">Tempo Total:</span>{" "}
                              <span className="font-medium">{paciente.tempo_total_minutos} min</span>
                            </div>
                          )}
                          {paciente.avaliacao_medica?.diagnostico_confirmado && (
                            <div className="text-sm md:col-span-2">
                              <span className="text-gray-600">Diagnóstico:</span>{" "}
                              <span className="font-medium">{paciente.avaliacao_medica.diagnostico_confirmado}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => handleVerDetalhes(paciente.id)}
                          variant="outline" 
                          size="sm"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </Button>
                        <Button 
                          onClick={() => handleRetriagem(paciente.id)}
                          variant="outline" 
                          size="sm" 
                          className="bg-blue-50 hover:bg-blue-100"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retriagem
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}