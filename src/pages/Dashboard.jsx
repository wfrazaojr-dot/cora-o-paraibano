import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { CIDADES_POR_MACRO } from "@/components/data/cidadesParaiba";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Users, Activity, Eye, FileText, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const navigate = useNavigate();
  const [filtroSelecionado, setFiltroSelecionado] = useState("todos");
  const [busca, setBusca] = useState("");
  const [filtroMacro, setFiltroMacro] = useState("");
  const [filtroCidade, setFiltroCidade] = useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Redirecionar Unidade de Saúde para Painel Inicial
  React.useEffect(() => {
    if (user?.equipe === 'unidade_saude' && user?.role !== 'admin') {
      navigate(createPageUrl("PainelInicial"));
    }
  }, [user, navigate]);

  const { data: pacientes = [], isLoading, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['pacientes-regulacao', user?.email, user?.macrorregiao],
    queryFn: async () => {
      // Admin vê todos
      if (user?.role === 'admin') {
        return base44.entities.Paciente.list("-created_date");
      }
      
      // Unidade de saúde vê apenas seus pacientes
      if (user?.equipe === 'unidade_saude') {
        return base44.entities.Paciente.filter({ created_by: user.email }, "-created_date");
      }

      // Transporte vê todos (cobre as 3 macrorregiões)
      if (user?.equipe === 'transporte') {
        return base44.entities.Paciente.list("-created_date");
      }
      
      // CERH, ASSCARDIO: filtrar por macrorregião se tiver definida
      if ((user?.equipe === 'cerh' || user?.equipe === 'asscardio') && user?.macrorregiao) {
        return base44.entities.Paciente.filter({ macrorregiao: user.macrorregiao }, "-created_date");
      }

      // HEMODINÂMICA: filtrar por hemodinamica_macro_responsavel (se definido) OU macrorregiao (fallback)
      if (user?.equipe === 'hemodinamica' && user?.macrorregiao) {
        const todos = await base44.entities.Paciente.list("-created_date");
        return todos.filter(p => 
          (p.hemodinamica_macro_responsavel || p.macrorregiao) === user.macrorregiao
        );
      }

      // Sem macrorregião definida, vê todos (fallback)
      return base44.entities.Paciente.list("-created_date");
    },
    enabled: !!user,
    initialData: [],
    refetchInterval: 30000,
  });

  // Função para calcular prioridade
  const calcularPrioridade = (paciente) => {
    const tipoSCA = paciente.triagem_medica?.tipo_sca;
    if (tipoSCA === "SCACESST") return 0;
    if (tipoSCA === "SCASESST_COM_TROPONINA") return 1;
    if (tipoSCA === "SCASESST_SEM_TROPONINA") return 2;
    return 3;
  };

  // Função para verificar janela terapêutica
  const calcularJanelaTerapeutica = (paciente) => {
    if (!paciente.data_hora_inicio_sintomas) return null;
    const horasDesdeInicio = differenceInHours(new Date(), new Date(paciente.data_hora_inicio_sintomas));
    return {
      horas: horasDesdeInicio,
      dentroJanela: horasDesdeInicio <= 12
    };
  };

  // Filtrar e ordenar pacientes por prioridade
  const pacientesRegulacao = pacientes
    .map(p => ({
      ...p,
      prioridade: calcularPrioridade(p),
      janelaTerapeutica: calcularJanelaTerapeutica(p)
    }))
    .sort((a, b) => a.prioridade - b.prioridade);

  // Estatísticas
  const prioridade0 = pacientesRegulacao.filter(p => p.prioridade === 0);
  const prioridade1 = pacientesRegulacao.filter(p => p.prioridade === 1);
  const prioridade2 = pacientesRegulacao.filter(p => p.prioridade === 2);
  const aguardandoASSCARDIO = pacientesRegulacao.filter(p => 
    p.status === "Aguardando Assessoria"
  );
  const aguardandoCERH = pacientesRegulacao.filter(p => 
    p.status === "Aguardando Regulação"
  );
  const aguardandoTransporte = pacientesRegulacao.filter(p => 
    p.status === "Aguardando Transporte"
  );
  const aguardandoHemodinamica = pacientesRegulacao.filter(p => 
    p.status === "Aguardando Hemodinâmica"
  );
  const dentroDaJanela = pacientesRegulacao.filter(p => p.janelaTerapeutica?.dentroJanela);

  // Aplicar filtro de status
  let pacientesFiltrados = pacientesRegulacao;
  if (filtroSelecionado === "prioridade0") pacientesFiltrados = prioridade0;
  if (filtroSelecionado === "prioridade1") pacientesFiltrados = prioridade1;
  if (filtroSelecionado === "prioridade2") pacientesFiltrados = prioridade2;
  if (filtroSelecionado === "aguardando_asscardio") pacientesFiltrados = aguardandoASSCARDIO;
  if (filtroSelecionado === "aguardando_cerh") pacientesFiltrados = aguardandoCERH;
  if (filtroSelecionado === "aguardando_transporte") pacientesFiltrados = aguardandoTransporte;
  if (filtroSelecionado === "aguardando_hemodinamica") pacientesFiltrados = aguardandoHemodinamica;
  if (filtroSelecionado === "janela_terapeutica") pacientesFiltrados = dentroDaJanela;

  if (filtroMacro) {
    pacientesFiltrados = pacientesFiltrados.filter(p => p.macrorregiao === filtroMacro);
  }

  if (filtroCidade) {
    pacientesFiltrados = pacientesFiltrados.filter(p => p.cidade === filtroCidade);
  }

  if (busca.trim()) {
    const termo = busca.toLowerCase();
    pacientesFiltrados = pacientesFiltrados.filter(p =>
      p.nome_completo?.toLowerCase().includes(termo) ||
      p.unidade_saude?.toLowerCase().includes(termo)
    );
  }

  // Cidades disponíveis com base na macro selecionada (ou todas presentes nos dados)
  const cidadesDisponiveis = filtroMacro && CIDADES_POR_MACRO[filtroMacro]
    ? CIDADES_POR_MACRO[filtroMacro].filter(c =>
        pacientesRegulacao.some(p => p.cidade === c)
      )
    : [...new Set(pacientesRegulacao.map(p => p.cidade).filter(Boolean))].sort();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Activity className="w-12 h-12 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Painel de Regulação</h1>
          <p className="text-gray-600 mt-1">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          <p className="text-sm text-blue-600 mt-1">
            👤 {user.full_name} • {user.email}
            {user?.equipe === 'cerh' && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">CERH</span>}
            {user?.equipe === 'asscardio' && <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">ASSCARDIO</span>}
            {user?.equipe === 'hemodinamica' && <span className="ml-2 px-2 py-1 bg-pink-100 text-pink-800 rounded text-xs font-semibold">HEMODINÂMICA</span>}
            {user?.equipe === 'transporte' && <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">TRANSPORTE</span>}
            {user?.macrorregiao && <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">{user.macrorregiao}</span>}
            {user?.role === 'admin' && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">ADMINISTRADOR</span>}
            {['cerh','asscardio','hemodinamica'].includes(user?.equipe) && !user?.macrorregiao && (
              <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-semibold">⚠️ Sem macrorregião definida — exibindo todos</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {dataUpdatedAt > 0 && (
            <span className="text-xs text-gray-400">
              Atualizado: {new Date(dataUpdatedAt).toLocaleTimeString('pt-BR')}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <Activity className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <Card 
            className={`cursor-pointer transition-all ${filtroSelecionado === 'prioridade0' ? 'ring-2 ring-red-500' : ''}`}
            onClick={() => setFiltroSelecionado(filtroSelecionado === 'prioridade0' ? 'todos' : 'prioridade0')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Prioridade 0</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{prioridade0.length}</div>
              <p className="text-xs text-gray-500 mt-1">SCACESST</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${filtroSelecionado === 'prioridade1' ? 'ring-2 ring-orange-500' : ''}`}
            onClick={() => setFiltroSelecionado(filtroSelecionado === 'prioridade1' ? 'todos' : 'prioridade1')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Prioridade 1</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{prioridade1.length}</div>
              <p className="text-xs text-gray-500 mt-1">SCASESST c/ Troponina</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${filtroSelecionado === 'prioridade2' ? 'ring-2 ring-yellow-500' : ''}`}
            onClick={() => setFiltroSelecionado(filtroSelecionado === 'prioridade2' ? 'todos' : 'prioridade2')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Prioridade 2</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{prioridade2.length}</div>
              <p className="text-xs text-gray-500 mt-1">SCASESST s/ Troponina</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${filtroSelecionado === 'janela_terapeutica' ? 'ring-2 ring-green-500' : ''}`}
            onClick={() => setFiltroSelecionado(filtroSelecionado === 'janela_terapeutica' ? 'todos' : 'janela_terapeutica')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Janela ≤12h</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{dentroDaJanela.length}</div>
              <p className="text-xs text-gray-500 mt-1">Dentro da janela</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${filtroSelecionado === 'aguardando_asscardio' ? 'ring-2 ring-purple-500' : ''}`}
            onClick={() => setFiltroSelecionado(filtroSelecionado === 'aguardando_asscardio' ? 'todos' : 'aguardando_asscardio')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Aguard. ASSCARDIO</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{aguardandoASSCARDIO.length}</div>
              <p className="text-xs text-gray-500 mt-1">Assessoria pendente</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${filtroSelecionado === 'aguardando_cerh' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setFiltroSelecionado(filtroSelecionado === 'aguardando_cerh' ? 'todos' : 'aguardando_cerh')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Aguard. CERH</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{aguardandoCERH.length}</div>
              <p className="text-xs text-gray-500 mt-1">Regulação pendente</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${filtroSelecionado === 'aguardando_transporte' ? 'ring-2 ring-indigo-500' : ''}`}
            onClick={() => setFiltroSelecionado(filtroSelecionado === 'aguardando_transporte' ? 'todos' : 'aguardando_transporte')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Aguard. Transporte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">{aguardandoTransporte.length}</div>
              <p className="text-xs text-gray-500 mt-1">Transporte pendente</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${filtroSelecionado === 'aguardando_hemodinamica' ? 'ring-2 ring-pink-500' : ''}`}
            onClick={() => setFiltroSelecionado(filtroSelecionado === 'aguardando_hemodinamica' ? 'todos' : 'aguardando_hemodinamica')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Aguard. Hemodinâmica</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-pink-600">{aguardandoHemodinamica.length}</div>
              <p className="text-xs text-gray-500 mt-1">Hemodinâmica pendente</p>
            </CardContent>
          </Card>
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou unidade de saúde..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
            {busca && (
              <button onClick={() => setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Macrorregião</label>
            <select
              value={filtroMacro}
              onChange={(e) => { setFiltroMacro(e.target.value); setFiltroCidade(""); }}
              className="flex h-10 w-44 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todas as Macros</option>
              <option value="Macro 1">Macro 1</option>
              <option value="Macro 2">Macro 2</option>
              <option value="Macro 3">Macro 3</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Cidade</label>
            <select
              value={filtroCidade}
              onChange={(e) => setFiltroCidade(e.target.value)}
              className="flex h-10 w-52 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!filtroMacro}
            >
              <option value="">{filtroMacro ? "Todas as cidades" : "Selecione uma macro primeiro"}</option>
              {cidadesDisponiveis.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {(filtroMacro || filtroCidade || busca) && (
            <button
              onClick={() => { setFiltroMacro(""); setFiltroCidade(""); setBusca(""); }}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 font-medium px-2"
            >
              <X className="w-4 h-4" /> Limpar filtros
            </button>
          )}
        </div>

        {/* Lista de Pacientes */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Pacientes para Regulação 
                {filtroSelecionado !== 'todos' && (
                  <Badge className="ml-2" variant="secondary">
                    {pacientesFiltrados.length} filtrados
                  </Badge>
                )}
              </CardTitle>
              {filtroSelecionado !== 'todos' && (
                <Button variant="outline" size="sm" onClick={() => setFiltroSelecionado('todos')}>
                  Limpar Filtro
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Activity className="w-8 h-8 animate-spin text-red-500 mr-3" />
                  <p className="text-gray-500">Carregando pacientes...</p>
                </div>
              ) : pacientesFiltrados.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhum paciente encontrado</p>
              ) : (
                pacientesFiltrados.map((paciente) => (
                  <div 
                    key={paciente.id} 
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{paciente.nome_completo}</h3>
                          {paciente.prioridade === 0 && (
                            <Badge className="bg-red-600">Prioridade 0</Badge>
                          )}
                          {paciente.prioridade === 1 && (
                            <Badge className="bg-orange-500">Prioridade 1</Badge>
                          )}
                          {paciente.prioridade === 2 && (
                            <Badge className="bg-yellow-500">Prioridade 2</Badge>
                          )}
                          {paciente.janelaTerapeutica?.dentroJanela && (
                            <Badge className="bg-green-600">
                              <Clock className="w-3 h-3 mr-1" />
                              Janela ≤12h
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Unidade:</span>
                            <p className="font-medium">{paciente.unidade_saude}</p>
                            {paciente.cidade && <p className="text-xs text-gray-500">📍 {paciente.cidade}</p>}
                          </div>
                          <div>
                            <span className="text-gray-500">Idade/Sexo:</span>
                            <p className="font-medium">{paciente.idade} anos • {paciente.sexo}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Classificação:</span>
                            <p className="font-medium">
                              {paciente.triagem_medica?.tipo_sca === "SCACESST" && "SCACESST"}
                              {paciente.triagem_medica?.tipo_sca === "SCASESST_COM_TROPONINA" && "SCASESST c/ Troponina"}
                              {paciente.triagem_medica?.tipo_sca === "SCASESST_SEM_TROPONINA" && "SCASESST s/ Troponina"}
                            </p>
                          </div>
                          <div>
                           <span className="text-gray-500">Status:</span>
                           <p className="font-medium">{paciente.status}</p>
                           {paciente.regulacao_central?.unidade_destino && (
                             <p className="text-xs text-blue-600 font-semibold">→ {paciente.regulacao_central.unidade_destino}</p>
                           )}
                           {paciente.hemodinamica_macro_responsavel && paciente.hemodinamica_macro_responsavel !== paciente.macrorregiao && (
                             <p className="text-xs text-orange-600 font-semibold">🔄 Transferido para Hemo {paciente.hemodinamica_macro_responsavel}</p>
                           )}
                          </div>
                        </div>

                        <div className="mt-2 space-y-2">
                          {paciente.janelaTerapeutica && (
                            <Badge variant="outline" className={
                              paciente.janelaTerapeutica.dentroJanela 
                                ? "text-green-700 border-green-300" 
                                : "text-red-700 border-red-300"
                            }>
                              {paciente.janelaTerapeutica.horas.toFixed(1)}h desde início dos sintomas
                            </Badge>
                          )}
                          {paciente.hemodinamica?.data_hora_agendamento_icp && (
                            <Badge className="bg-blue-600 text-white block">
                              📅 ICP Agendada: {format(new Date(paciente.hemodinamica.data_hora_agendamento_icp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {paciente.relatorio_triagem_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const resp = await fetch(paciente.relatorio_triagem_url);
                              const blob = await resp.blob();
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `Relatorio_Triagem_${paciente.nome_completo}.pdf`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="border-green-600 text-green-700 hover:bg-green-50"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Visualizar Relatório
                          </Button>
                        )}

                        {(user?.equipe === 'cerh' || user?.role === 'admin') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(createPageUrl("FormularioVaga") + `?id=${paciente.id}`)}
                            className="border-blue-600 text-blue-700 hover:bg-blue-50"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Form. de Vaga
                          </Button>
                        )}

                        {(user?.equipe === 'asscardio' || user?.role === 'admin') && (
                          <Button
                            size="sm"
                            onClick={() => navigate(createPageUrl("ASSCARDIODetalhe") + `?id=${paciente.id}`)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Acessar Caso
                          </Button>
                        )}

                        {(user?.equipe === 'cerh' || user?.role === 'admin') && (
                          <Button
                            size="sm"
                            onClick={() => navigate(createPageUrl("CERHDetalhe") + `?id=${paciente.id}`)}
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Acessar Caso
                          </Button>
                        )}

                        {(user?.equipe === 'transporte' || user?.role === 'admin') && (
                          <Button
                            size="sm"
                            onClick={() => navigate(createPageUrl("TransporteDetalhe") + `?id=${paciente.id}`)}
                            className="bg-yellow-600 hover:bg-yellow-700"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Acessar Caso
                          </Button>
                        )}

                        {(user?.equipe === 'hemodinamica' || user?.role === 'admin') && (
                          <Button
                            size="sm"
                            onClick={() => navigate(createPageUrl("HemodinamicaDetalhe") + `?id=${paciente.id}`)}
                            className="bg-pink-600 hover:bg-pink-700"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Acessar Caso
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}