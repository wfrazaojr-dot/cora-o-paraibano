import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Users, Activity, Eye } from "lucide-react";
import { format, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const navigate = useNavigate();
  const [filtroSelecionado, setFiltroSelecionado] = useState("todos");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Redirecionar Unidade de Saúde
  if (user?.equipe === 'unidade_saude' && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              O Painel de Regulação não está disponível para usuários de Unidade de Saúde.
            </p>
            <Button onClick={() => navigate(createPageUrl("Historico"))} className="w-full">
              Ir para Painel Assistencial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: pacientes = [], isLoading } = useQuery({
    queryKey: ['pacientes-regulacao'],
    queryFn: () => base44.entities.Paciente.list("-created_date"),
    enabled: !!user,
    initialData: [],
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
    p.status === "Aguardando Assessoria" || !p.assessoria_cardiologia?.cardiologista_nome
  );
  const aguardandoCERH = pacientesRegulacao.filter(p => 
    p.status === "Aguardando Regulação" || !p.regulacao_central?.medico_regulador_nome
  );
  const aguardandoTransporte = pacientesRegulacao.filter(p => 
    p.status === "Aguardando Transporte"
  );
  const aguardandoHemodinamica = pacientesRegulacao.filter(p => 
    p.status === "Aguardando Hemodinâmica"
  );
  const dentroDaJanela = pacientesRegulacao.filter(p => p.janelaTerapeutica?.dentroJanela);

  // Aplicar filtro
  let pacientesFiltrados = pacientesRegulacao;
  if (filtroSelecionado === "prioridade0") pacientesFiltrados = prioridade0;
  if (filtroSelecionado === "prioridade1") pacientesFiltrados = prioridade1;
  if (filtroSelecionado === "prioridade2") pacientesFiltrados = prioridade2;
  if (filtroSelecionado === "aguardando_asscardio") pacientesFiltrados = aguardandoASSCARDIO;
  if (filtroSelecionado === "aguardando_cerh") pacientesFiltrados = aguardandoCERH;
  if (filtroSelecionado === "aguardando_transporte") pacientesFiltrados = aguardandoTransporte;
  if (filtroSelecionado === "aguardando_hemodinamica") pacientesFiltrados = aguardandoHemodinamica;
  if (filtroSelecionado === "janela_terapeutica") pacientesFiltrados = dentroDaJanela;

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
            {user?.role === 'admin' && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">ADMINISTRADOR</span>}
          </p>
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
                <p className="text-center text-gray-500 py-8">Carregando...</p>
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
                          </div>
                        </div>

                        {paciente.janelaTerapeutica && (
                          <div className="mt-2">
                            <Badge variant="outline" className={
                              paciente.janelaTerapeutica.dentroJanela 
                                ? "text-green-700 border-green-300" 
                                : "text-red-700 border-red-300"
                            }>
                              {paciente.janelaTerapeutica.horas.toFixed(1)}h desde início dos sintomas
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2 flex-wrap">
                          {/* Botões para ASSCARDIO */}
                          {(user?.equipe === 'asscardio' || user?.role === 'admin') && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(createPageUrl("NovaTriagem") + `?id=${paciente.id}&etapa=5`)}
                              >
                                Cardiologia
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  if (paciente.relatorio_triagem_url) {
                                    window.open(paciente.relatorio_triagem_url, '_blank');
                                  } else {
                                    alert('Relatório de triagem ainda não foi gerado. A Unidade de Saúde precisa finalizar a Etapa 4.');
                                  }
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Visualizar
                              </Button>
                            </>
                          )}

                          {/* Botões para CERH */}
                          {(user?.equipe === 'cerh' || user?.role === 'admin') && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(createPageUrl("NovaTriagem") + `?id=${paciente.id}&etapa=6`)}
                              >
                                Regulação
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  if (paciente.parecer_cerh_url) {
                                    window.open(paciente.parecer_cerh_url, '_blank');
                                  } else {
                                    alert('Parecer CERH ainda não foi gerado');
                                  }
                                }}
                              >
                                CERH
                              </Button>
                            </>
                          )}

                          {/* Botões para TRANSPORTE */}
                          {(user?.equipe === 'transporte' || user?.role === 'admin') && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(createPageUrl("NovaTriagem") + `?id=${paciente.id}&etapa=7`)}
                              >
                                Transporte
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  if (paciente.parecer_transporte_url) {
                                    window.open(paciente.parecer_transporte_url, '_blank');
                                  } else {
                                    alert('Parecer Transporte ainda não foi gerado');
                                  }
                                }}
                              >
                                View Transporte
                              </Button>
                            </>
                          )}

                          {/* Botões para HEMODINÂMICA */}
                          {(user?.equipe === 'hemodinamica' || user?.role === 'admin') && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(createPageUrl("NovaTriagem") + `?id=${paciente.id}&etapa=8`)}
                              >
                                Cardiohemodinâmica
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  if (paciente.parecer_hemodinamica_url) {
                                    window.open(paciente.parecer_hemodinamica_url, '_blank');
                                  } else {
                                    alert('Parecer Hemodinâmica ainda não foi gerado');
                                  }
                                }}
                              >
                                Hemodinâmica
                              </Button>
                            </>
                          )}
                        </div>
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