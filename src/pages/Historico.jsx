import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, ExternalLink, RefreshCw, Filter, Plus, Loader2, AlertTriangle } from "lucide-react";
import ExportarDados from "@/components/common/ExportarDados";
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
  "Aguardando Assessoria": "bg-purple-100 text-purple-800 border-purple-300",
  "Aguardando Regulação": "bg-orange-100 text-orange-800 border-orange-300",
  "Aguardando Transporte": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Em Transporte": "bg-blue-100 text-blue-800 border-blue-300",
  "Aguardando Hemodinâmica": "bg-pink-100 text-pink-800 border-pink-300",
  "Em Procedimento": "bg-indigo-100 text-indigo-800 border-indigo-300",
  "Concluído": "bg-green-100 text-green-800 border-green-300"
};

export default function Historico() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroUnidade, setFiltroUnidade] = useState("todas");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const verificarAcessoPaciente = (paciente) => {
    if (!paciente) return false;
    // Admin tem acesso a tudo
    if (user?.role === 'admin') {
      return true;
    }
    
    // Unidade de saúde só acessa pacientes que criou
    if (user?.equipe === 'unidade_saude') {
      return paciente.created_by === user.email;
    }
    
    // CERH e ASSCARDIO têm acesso a todos
    return true;
  };

  const verificarProfissional = (url) => {
    // Admin e Unidade de Saúde têm acesso direto sem verificação de profissional
    if (user?.role === 'admin' || user?.equipe === 'unidade_saude') {
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
    const paciente = pacientes.find(p => p.id === pacienteId);
    if (!verificarAcessoPaciente(paciente)) {
      alert("Você não tem permissão para acessar este paciente.");
      return;
    }
    
    const url = `${createPageUrl("NovaTriagem")}?id=${pacienteId}`;
    if (verificarProfissional(url)) {
      navigate(url);
    }
  };

  const handleRetriagem = (pacienteId) => {
    const paciente = pacientes.find(p => p.id === pacienteId);
    if (!verificarAcessoPaciente(paciente)) {
      alert("Você não tem permissão para acessar este paciente.");
      return;
    }
    
    const url = `${createPageUrl("NovaTriagem")}?id=${pacienteId}&retriagem=true`;
    if (verificarProfissional(url)) {
      navigate(url);
    }
  };

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pacientes = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['pacientes', user?.email, user?.equipe],
    queryFn: async () => {
      const equipe = user?.equipe || 'unidade_saude';
      if (user?.role === 'admin') return base44.entities.Paciente.list("-created_date");
      if (equipe === 'unidade_saude') return base44.entities.Paciente.filter({ created_by: user.email }, "-created_date");
      return base44.entities.Paciente.list("-created_date");
    },
    enabled: !!user,
    initialData: [],
    staleTime: 20000,
    refetchInterval: 30000,
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
    "Em Triagem": pacientes.filter(p => p.status === "Em Triagem").length,
    "Aguardando Assessoria": pacientes.filter(p => p.status === "Aguardando Assessoria").length,
    "Aguardando Regulação": pacientes.filter(p => p.status === "Aguardando Regulação").length,
    "Aguardando Transporte": pacientes.filter(p => p.status === "Aguardando Transporte").length,
    "Em Transporte": pacientes.filter(p => p.status === "Em Transporte").length,
    "Aguardando Hemodinâmica": pacientes.filter(p => p.status === "Aguardando Hemodinâmica").length,
    "Em Procedimento": pacientes.filter(p => p.status === "Em Procedimento").length,
    "Concluído": pacientes.filter(p => p.status === "Concluído").length,
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel Assistencial</h1>
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
          <div className="flex items-center gap-3 flex-wrap">
            <ExportarDados
              dados={pacientesFiltrados}
              titulo="Painel Assistencial — Coração Paraibano"
              nomeArquivo="historico_pacientes"
              colunas={[
                { header: "Paciente", key: "nome_completo" },
                { header: "Idade", key: "idade" },
                { header: "Sexo", key: "sexo" },
                { header: "Status", key: "status" },
                { header: "Unidade", key: "unidade_saude" },
                { header: "Macrorregião", key: "macrorregiao" },
                { header: "Chegada", key: "data_hora_chegada", format: (v) => v ? format(new Date(v), "dd/MM/yyyy HH:mm") : "-" },
                { header: "Criado por", key: "created_by" },
              ]}
            />
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Atualizar
            </Button>
            {(user?.equipe === 'unidade_saude' || user?.role === 'admin') && (
            <Link to={createPageUrl("NovaTriagem")}>
              <Button className="bg-red-600 hover:bg-red-700 shadow-lg">
                <Plus className="w-5 h-5 mr-2" />
                Novo Paciente
              </Button>
            </Link>
            )}
          </div>
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
                   <SelectItem value="Em Triagem">
                     ⚪ Em Triagem ({contadores["Em Triagem"]})
                   </SelectItem>
                   <SelectItem value="Aguardando Assessoria">
                     🟣 Aguardando Assessoria ({contadores["Aguardando Assessoria"]})
                   </SelectItem>
                   <SelectItem value="Aguardando Regulação">
                     🟠 Aguardando Regulação ({contadores["Aguardando Regulação"]})
                   </SelectItem>
                   <SelectItem value="Aguardando Transporte">
                     🟡 Aguardando Transporte ({contadores["Aguardando Transporte"]})
                   </SelectItem>
                   <SelectItem value="Em Transporte">
                     🔵 Em Transporte ({contadores["Em Transporte"]})
                   </SelectItem>
                   <SelectItem value="Aguardando Hemodinâmica">
                     🩷 Aguardando Hemodinâmica ({contadores["Aguardando Hemodinâmica"]})
                   </SelectItem>
                   <SelectItem value="Em Procedimento">
                     🟤 Em Procedimento ({contadores["Em Procedimento"]})
                   </SelectItem>
                   <SelectItem value="Concluído">
                     🟢 Concluído ({contadores["Concluído"]})
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
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-red-500 mr-3" />
                <p className="text-gray-500">Carregando pacientes...</p>
              </div>
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
                       {paciente.alerta_formulario_vaga && !paciente.formulario_vaga?.data_envio && (
                         <div className="mb-3 bg-yellow-100 border-l-4 border-yellow-500 p-3 rounded">
                           <p className="text-sm font-bold text-yellow-900 flex items-center gap-2">
                             🚨 ENVIE FORMULÁRIO/VAGA
                           </p>
                         </div>
                       )}
                       {paciente.formulario_vaga?.data_envio && (
                         <div className="mb-3 bg-green-100 border-l-4 border-green-500 p-3 rounded">
                           <p className="text-sm font-bold text-green-900 flex items-center gap-2">
                             ✅ FORMULÁRIO DE VAGA ENVIADO em {new Date(paciente.formulario_vaga.data_envio).toLocaleString('pt-BR')}
                           </p>
                           {paciente.formulario_vaga.enviado_por && (
                             <p className="text-xs text-green-700">Por: {paciente.formulario_vaga.enviado_por}</p>
                           )}
                         </div>
                       )}
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
                                     Etapa {etapa.etapa}: {etapa.medico_nome} ({etapa.data_hora ? format(new Date(etapa.data_hora), "dd/MM HH:mm", { locale: ptBR }) : '—'})
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
                              {paciente.data_hora_chegada ? format(new Date(paciente.data_hora_chegada), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '—'}
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

                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {paciente.alerta_formulario_vaga && !paciente.formulario_vaga?.data_envio && (
                          <Button
                            size="sm"
                            onClick={() => navigate(createPageUrl("FormularioVaga") + `?id=${paciente.id}`)}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white"
                          >
                            📋 ENVIAR FORMULÁRIO/VAGA
                          </Button>
                        )}
                        {paciente.formulario_vaga?.data_envio && (
                          <Button
                            size="sm"
                            onClick={() => navigate(createPageUrl("FormularioVaga") + `?id=${paciente.id}`)}
                            variant="outline"
                            className="border-green-500 text-green-700 hover:bg-green-50"
                          >
                            📋 Ver/Reenviar Formulário
                          </Button>
                        )}
                        {/* Botão Atualizar Info de Transporte - Unidade de Saúde */}
                        {user?.equipe === 'unidade_saude' && (() => {
                          const it = paciente.avaliacao_clinica?.info_transporte || {};
                          const contraIndicado = [
                            'doenca_renal_cronica','anemia_grave','ic_descompensada','arritmias_nao_controladas',
                            'infeccao_respiratoria','fragilidade_clinica','idade_comorbidades','dificuldade_acesso_vascular'
                          ].some(k => it[k] === true);
                          const statusAvancado = ['Aguardando Transporte','Em Transporte','Aguardando Hemodinâmica'].includes(paciente.status);
                          if (contraIndicado && statusAvancado) {
                            return (
                              <Button
                                size="sm"
                                onClick={() => navigate(`${createPageUrl('NovaTriagem')}?id=${paciente.id}`)}
                                className="bg-red-700 hover:bg-red-800 text-white"
                              >
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                Atualizar Inf. Transporte
                              </Button>
                            );
                          }
                          return null;
                        })()}
                        {paciente.relatorio_agendamento_hemo_url && (
                          <Button
                            size="sm"
                            onClick={() => window.open(paciente.relatorio_agendamento_hemo_url, '_blank')}
                            className="bg-pink-600 hover:bg-pink-700 text-white"
                          >
                            📅 AGENDAMENTO HEMO
                          </Button>
                        )}
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