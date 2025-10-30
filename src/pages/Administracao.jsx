import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Shield, Trash2, Database, Users, Activity, AlertTriangle, UserCog, Eye, Stethoscope, ClipboardList, TrendingUp, TrendingDown, Clock, Building2, Award, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const ROLES_INFO = {
  admin: {
    label: "Administrador",
    description: "Acesso total ao sistema, gestão de usuários e dados",
    color: "bg-red-100 text-red-800 border-red-300",
    icon: Shield,
    permissions: ["Criar/editar/deletar tudo", "Gerenciar usuários", "Limpar histórico", "Ver todos os dados"]
  },
  medical_staff: {
    label: "Equipe Médica",
    description: "Pode fazer avaliação médica, prescrever e solicitar exames",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    icon: Stethoscope,
    permissions: ["Ver triagens", "Avaliação médica", "Prescrever medicamentos", "Solicitar exames", "Gerar relatórios"]
  },
  triager: {
    label: "Triador/Enfermeiro",
    description: "Pode realizar triagem e classificação de risco",
    color: "bg-green-100 text-green-800 border-green-300",
    icon: ClipboardList,
    permissions: ["Cadastrar pacientes", "Triagem cardiológica", "Dados vitais e ECG", "Classificação de risco"]
  },
  viewer: {
    label: "Visualizador",
    description: "Apenas visualização de dados, sem edição",
    color: "bg-gray-100 text-gray-800 border-gray-300",
    icon: Eye,
    permissions: ["Ver dashboard", "Ver histórico (somente leitura)", "Ver indicadores", "Ver protocolos"]
  }
};

export default function Administracao() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmacao, setConfirmacao] = useState("");
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [filtroRole, setFiltroRole] = useState("todos");
  const [unidadeFiltro, setUnidadeFiltro] = useState("todas");
  const [abaAtiva, setAbaAtiva] = useState("usuarios"); // "usuarios" ou "indicadores"

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: todosUsuarios = [] } = useQuery({
    queryKey: ['todosUsuarios'],
    queryFn: () => base44.entities.User.list(),
    enabled: user?.role === 'admin',
  });

  const { data: todosPacientes = [] } = useQuery({
    queryKey: ['todosPacientes'],
    queryFn: () => base44.entities.Paciente.list("-created_date"),
    enabled: user?.role === 'admin',
  });

  const atualizarUsuarioMutation = useMutation({
    mutationFn: async ({ userId, dados }) => {
      return await base44.entities.User.update(userId, dados);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todosUsuarios'] });
      setUsuarioEditando(null);
      alert("✅ Função do usuário atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar usuário:", error);
      alert("❌ Erro ao atualizar usuário. Tente novamente.");
    }
  });

  // Extrair unidades únicas dos pacientes
  const unidadesDisponiveis = useMemo(() => {
    const unidades = new Set();
    todosPacientes.forEach(p => {
      if (p.unidade_saude) {
        unidades.add(p.unidade_saude);
      }
    });
    return Array.from(unidades).sort();
  }, [todosPacientes]);

  // Calcular indicadores por unidade
  const indicadoresPorUnidade = useMemo(() => {
    const resultado = {};

    unidadesDisponiveis.forEach(unidade => {
      const pacientesUnidade = todosPacientes.filter(p => p.unidade_saude === unidade);
      
      // Tempo Triagem → ECG
      const temposECG = pacientesUnidade
        .filter(p => p.tempo_triagem_ecg_minutos !== undefined && p.tempo_triagem_ecg_minutos !== null)
        .map(p => p.tempo_triagem_ecg_minutos);
      
      const tempoMedioECG = temposECG.length > 0 
        ? Math.round(temposECG.reduce((a, b) => a + b, 0) / temposECG.length)
        : 0;
      
      const dentroMetaECG = temposECG.filter(t => t <= 10).length;
      const taxaConformidadeECG = temposECG.length > 0 
        ? Math.round((dentroMetaECG / temposECG.length) * 100)
        : 0;

      // Distribuição de risco
      const distribuicaoRisco = {
        Vermelha: pacientesUnidade.filter(p => p.classificacao_risco?.cor === "Vermelha").length,
        Laranja: pacientesUnidade.filter(p => p.classificacao_risco?.cor === "Laranja").length,
        Amarela: pacientesUnidade.filter(p => p.classificacao_risco?.cor === "Amarela").length,
        Verde: pacientesUnidade.filter(p => p.classificacao_risco?.cor === "Verde").length,
        Azul: pacientesUnidade.filter(p => p.classificacao_risco?.cor === "Azul").length,
      };

      // Tempo total de atendimento
      const temposTotais = pacientesUnidade
        .filter(p => p.tempo_total_minutos)
        .map(p => p.tempo_total_minutos);
      
      const tempoMedioTotal = temposTotais.length > 0
        ? Math.round(temposTotais.reduce((a, b) => a + b, 0) / temposTotais.length)
        : 0;

      resultado[unidade] = {
        totalPacientes: pacientesUnidade.length,
        tempoMedioECG,
        taxaConformidadeECG,
        dentroMetaECG,
        foraMetaECG: temposECG.length - dentroMetaECG,
        distribuicaoRisco,
        tempoMedioTotal,
        pacientesHoje: pacientesUnidade.filter(p => {
          const hoje = new Date();
          const dataPaciente = new Date(p.created_date);
          return dataPaciente.toDateString() === hoje.toDateString();
        }).length
      };
    });

    return resultado;
  }, [todosPacientes, unidadesDisponiveis]);

  // Ranking de unidades por conformidade
  const rankingUnidades = useMemo(() => {
    return Object.entries(indicadoresPorUnidade)
      .map(([unidade, dados]) => ({
        unidade,
        ...dados
      }))
      .sort((a, b) => b.taxaConformidadeECG - a.taxaConformidadeECG);
  }, [indicadoresPorUnidade]);

  // Se não for admin, redireciona
  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <Card className="max-w-md shadow-lg border-red-500">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600 mb-6">
              Esta página é restrita a administradores do sistema.
            </p>
            <Button onClick={() => navigate(createPageUrl("Dashboard"))} className="bg-red-600 hover:bg-red-700">
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Activity className="w-12 h-12 text-red-600 animate-spin" />
      </div>
    );
  }

  const handleLimparHistorico = async () => {
    if (confirmacao !== "LIMPAR TUDO") {
      alert('Por favor, digite exatamente "LIMPAR TUDO" para confirmar');
      return;
    }

    const confirmacaoFinal = window.confirm(
      `⚠️ ATENÇÃO CRÍTICA!\n\n` +
      `Você está prestes a DELETAR PERMANENTEMENTE:\n` +
      `• ${todosPacientes.length} pacientes\n` +
      `• Todos os históricos\n` +
      `• Todos os relatórios\n` +
      `• Todos os dados de triagem\n\n` +
      `ESTA AÇÃO NÃO PODE SER DESFEITA!\n\n` +
      `Tem ABSOLUTA CERTEZA?`
    );

    if (!confirmacaoFinal) {
      return;
    }

    setProcessando(true);
    try {
      const deletarPromises = todosPacientes.map(p => 
        base44.entities.Paciente.delete(p.id)
      );
      await Promise.all(deletarPromises);
      
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      queryClient.invalidateQueries({ queryKey: ['todosPacientes'] });
      
      setMostrarConfirmacao(false);
      setConfirmacao("");
      
      alert("✅ Histórico limpo com sucesso!\n\nTodos os pacientes foram removidos do sistema.");
      
    } catch (error) {
      console.error("Erro ao limpar histórico:", error);
      alert("❌ Erro ao limpar histórico. Tente novamente.");
    }
    setProcessando(false);
  };

  const handleSalvarRole = async (userId, novoRole) => {
    await atualizarUsuarioMutation.mutateAsync({
      userId,
      dados: { custom_role: novoRole }
    });
  };

  const handleToggleAtivo = async (userId, ativoAtual) => {
    const confirmacao = window.confirm(
      ativoAtual 
        ? "Deseja DESATIVAR este usuário? Ele não poderá mais acessar o sistema."
        : "Deseja REATIVAR este usuário?"
    );
    
    if (confirmacao) {
      await atualizarUsuarioMutation.mutateAsync({
        userId,
        dados: { ativo: !ativoAtual }
      });
    }
  };

  const getRoleEffetiva = (usuario) => {
    if (usuario.role === 'admin') return 'admin';
    return usuario.custom_role || 'viewer';
  };

  const usuariosFiltrados = todosUsuarios.filter(u => {
    if (filtroRole === "todos") return true;
    return getRoleEffetiva(u) === filtroRole;
  });

  const pacientesHoje = todosPacientes.filter(p => {
    const hoje = new Date();
    const dataPaciente = new Date(p.created_date);
    return dataPaciente.toDateString() === hoje.toDateString();
  }).length;

  const usuariosAtivos = todosUsuarios.filter(u => u.ativo !== false).length;
  const usuariosPorRole = {
    admin: todosUsuarios.filter(u => u.role === 'admin').length,
    medical_staff: todosUsuarios.filter(u => u.custom_role === 'medical_staff').length,
    triager: todosUsuarios.filter(u => u.custom_role === 'triager').length,
    viewer: todosUsuarios.filter(u => !u.custom_role || u.custom_role === 'viewer').length,
  };

  const COLORS_RISK = {
    "Vermelha": "#DC2626",
    "Laranja": "#EA580C",
    "Amarela": "#CA8A04",
    "Verde": "#16A34A",
    "Azul": "#2563EB"
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">Painel de Administração</h1>
          </div>
          <p className="text-gray-600">Gestão completa do sistema e usuários</p>
          <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2 inline-block">
            <p className="text-sm font-semibold text-red-800">
              🔐 Administrador: {user.full_name} ({user.email})
            </p>
          </div>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-md border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Usuários Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">{usuariosAtivos}</p>
                </div>
                <Users className="w-10 h-10 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Pacientes Hoje</p>
                  <p className="text-2xl font-bold text-gray-900">{pacientesHoje}</p>
                </div>
                <Activity className="w-10 h-10 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Pacientes</p>
                  <p className="text-2xl font-bold text-gray-900">{todosPacientes.length}</p>
                </div>
                <Database className="w-10 h-10 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Unidades</p>
                  <p className="text-2xl font-bold text-gray-900">{unidadesDisponiveis.length}</p>
                </div>
                <Building2 className="w-10 h-10 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Abas */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setAbaAtiva("usuarios")}
            className={`px-6 py-3 font-semibold transition-colors ${
              abaAtiva === "usuarios"
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Gestão de Usuários
          </button>
          <button
            onClick={() => setAbaAtiva("indicadores")}
            className={`px-6 py-3 font-semibold transition-colors ${
              abaAtiva === "indicadores"
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Indicadores por Unidade
          </button>
          <button
            onClick={() => setAbaAtiva("sistema")}
            className={`px-6 py-3 font-semibold transition-colors ${
              abaAtiva === "sistema"
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Database className="w-4 h-4 inline mr-2" />
            Sistema
          </button>
        </div>

        {/* CONTEÚDO DA ABA: INDICADORES POR UNIDADE */}
        {abaAtiva === "indicadores" && (
          <div className="space-y-6">
            
            {/* Filtro por Unidade */}
            <Card className="shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <Label htmlFor="unidade-filtro" className="font-semibold">Filtrar por Unidade:</Label>
                  <Select value={unidadeFiltro} onValueChange={setUnidadeFiltro}>
                    <SelectTrigger className="w-80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">📊 Todas as Unidades (Comparativo)</SelectItem>
                      {unidadesDisponiveis.map(unidade => (
                        <SelectItem key={unidade} value={unidade}>
                          🏥 {unidade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Ranking de Unidades */}
            {unidadeFiltro === "todas" && (
              <>
                <Card className="shadow-lg border-l-4 border-l-green-600">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-6 h-6 text-green-600" />
                      🏆 Ranking de Desempenho - Meta Triagem→ECG (≤10 min)
                    </CardTitle>
                    <CardDescription>
                      Classificação por taxa de conformidade com a meta
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {rankingUnidades.map((dados, index) => (
                        <div key={dados.unidade} className="flex items-center gap-4 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow">
                          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                            index === 0 ? 'bg-yellow-400 text-yellow-900' :
                            index === 1 ? 'bg-gray-300 text-gray-800' :
                            index === 2 ? 'bg-orange-300 text-orange-900' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {index + 1}°
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900">{dados.unidade}</h4>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="text-gray-600">
                                {dados.totalPacientes} pacientes
                              </span>
                              <span className="text-gray-600">
                                Tempo médio: {dados.tempoMedioECG} min
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <div className={`text-2xl font-bold ${
                                dados.taxaConformidadeECG >= 90 ? 'text-green-600' :
                                dados.taxaConformidadeECG >= 70 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {dados.taxaConformidadeECG}%
                              </div>
                              {dados.taxaConformidadeECG >= 90 ? (
                                <TrendingUp className="w-6 h-6 text-green-600" />
                              ) : dados.taxaConformidadeECG < 70 ? (
                                <TrendingDown className="w-6 h-6 text-red-600" />
                              ) : (
                                <Clock className="w-6 h-6 text-yellow-600" />
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {dados.dentroMetaECG}/{dados.dentroMetaECG + dados.foraMetaECG} dentro da meta
                            </p>
                          </div>
                        </div>
                      ))}

                      {rankingUnidades.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Building2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p>Nenhuma unidade com dados disponíveis</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Gráfico Comparativo */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Comparação de Desempenho Entre Unidades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {rankingUnidades.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={rankingUnidades}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="unidade" 
                            angle={-45} 
                            textAnchor="end" 
                            height={120}
                            fontSize={12}
                          />
                          <YAxis label={{ value: 'Taxa de Conformidade (%)', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="taxaConformidadeECG" fill="#16A34A" name="Conformidade ECG (%)" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[400px] flex items-center justify-center text-gray-500">
                        Nenhum dado disponível para comparação
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Detalhes de Unidade Específica */}
            {unidadeFiltro !== "todas" && indicadoresPorUnidade[unidadeFiltro] && (
              <>
                <Card className="shadow-lg border-l-4 border-l-blue-600">
                  <CardHeader className="bg-blue-50 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-6 h-6 text-blue-600" />
                      {unidadeFiltro}
                    </CardTitle>
                    <CardDescription>
                      Indicadores detalhados de desempenho
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-gray-600 mb-1">Total de Pacientes</p>
                        <p className="text-3xl font-bold text-blue-700">
                          {indicadoresPorUnidade[unidadeFiltro].totalPacientes}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-gray-600 mb-1">Pacientes Hoje</p>
                        <p className="text-3xl font-bold text-green-700">
                          {indicadoresPorUnidade[unidadeFiltro].pacientesHoje}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm text-gray-600 mb-1">Tempo Médio Total</p>
                        <p className="text-3xl font-bold text-purple-700">
                          {indicadoresPorUnidade[unidadeFiltro].tempoMedioTotal} min
                        </p>
                      </div>
                    </div>

                    {/* Meta ECG */}
                    <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-300">
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-green-600" />
                        Meta Triagem → ECG (≤10 min)
                      </h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Tempo Médio</p>
                          <p className={`text-2xl font-bold ${
                            indicadoresPorUnidade[unidadeFiltro].tempoMedioECG <= 10 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {indicadoresPorUnidade[unidadeFiltro].tempoMedioECG} min
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Taxa de Conformidade</p>
                          <p className={`text-2xl font-bold ${
                            indicadoresPorUnidade[unidadeFiltro].taxaConformidadeECG >= 90 
                              ? 'text-green-600' 
                              : indicadoresPorUnidade[unidadeFiltro].taxaConformidadeECG >= 70
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}>
                            {indicadoresPorUnidade[unidadeFiltro].taxaConformidadeECG}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Dentro/Fora da Meta</p>
                          <p className="text-xl font-bold text-gray-900">
                            <span className="text-green-600">{indicadoresPorUnidade[unidadeFiltro].dentroMetaECG}</span>
                            {" / "}
                            <span className="text-red-600">{indicadoresPorUnidade[unidadeFiltro].foraMetaECG}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Distribuição de Risco */}
                    <div className="p-6 bg-gray-50 rounded-lg border">
                      <h3 className="font-bold text-lg mb-4">Distribuição por Classificação de Risco</h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {Object.entries(indicadoresPorUnidade[unidadeFiltro].distribuicaoRisco).map(([cor, qtd]) => (
                          <div key={cor} className="text-center p-3 bg-white rounded border">
                            <div 
                              className="w-8 h-8 rounded-full mx-auto mb-2"
                              style={{ backgroundColor: COLORS_RISK[cor] }}
                            />
                            <p className="text-xs text-gray-600 mb-1">{cor}</p>
                            <p className="text-xl font-bold text-gray-900">{qtd}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

          </div>
        )}

        {/* CONTEÚDO DA ABA: GESTÃO DE USUÁRIOS */}
        {abaAtiva === "usuarios" && (
          <div className="space-y-6">
            
            {/* Explicação de Funções */}
            <Card className="shadow-lg border-l-4 border-l-blue-600">
              <CardHeader className="bg-blue-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-blue-600" />
                  Funções e Permissões do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(ROLES_INFO).map(([roleKey, roleData]) => {
                    const IconComponent = roleData.icon;
                    return (
                      <div key={roleKey} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${roleData.color}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900">{roleData.label}</h4>
                            <p className="text-xs text-gray-600 mt-1">{roleData.description}</p>
                          </div>
                        </div>
                        <div className="mt-3 pl-2 border-l-2 border-gray-200">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Permissões:</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {roleData.permissions.map((perm, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span>{perm}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Gestão de Usuários */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-6 h-6 text-blue-600" />
                      Gestão de Usuários ({usuariosFiltrados.length})
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Atribua funções e gerencie permissões de acesso
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="filtro-role" className="text-sm">Filtrar por:</Label>
                    <Select value={filtroRole} onValueChange={setFiltroRole}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="admin">Administradores</SelectItem>
                        <SelectItem value="medical_staff">Equipe Médica</SelectItem>
                        <SelectItem value="triager">Triadores</SelectItem>
                        <SelectItem value="viewer">Visualizadores</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {usuariosFiltrados.map((usuario) => {
                    const roleEfetiva = getRoleEffetiva(usuario);
                    const roleInfo = ROLES_INFO[roleEfetiva];
                    const IconComponent = roleInfo.icon;
                    const isEditando = usuarioEditando === usuario.id;

                    return (
                      <div key={usuario.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${roleInfo.color}`}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-bold text-gray-900">{usuario.full_name}</h4>
                                <p className="text-sm text-gray-600">{usuario.email}</p>
                                {usuario.registro_profissional && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Registro: {usuario.registro_profissional}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`${roleInfo.color} border`}>
                                  {roleInfo.label}
                                </Badge>
                                {usuario.ativo === false && (
                                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                                    Inativo
                                  </Badge>
                                )}
                                {usuario.role === 'admin' && (
                                  <Badge className="bg-red-600 text-white">
                                    Admin do Sistema
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {usuario.unidade_vinculada && (
                              <p className="text-xs text-gray-600 mb-2">
                                🏥 Unidade: {usuario.unidade_vinculada}
                              </p>
                            )}

                            {!isEditando && usuario.id !== user.id && (
                              <div className="flex gap-2 mt-3">
                                <Button
                                  onClick={() => setUsuarioEditando(usuario.id)}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                >
                                  <UserCog className="w-3 h-3 mr-1" />
                                  Alterar Função
                                </Button>
                                <Button
                                  onClick={() => handleToggleAtivo(usuario.id, usuario.ativo !== false)}
                                  size="sm"
                                  variant="outline"
                                  className={`text-xs ${usuario.ativo === false ? 'text-green-600' : 'text-orange-600'}`}
                                >
                                  {usuario.ativo === false ? 'Reativar' : 'Desativar'}
                                </Button>
                              </div>
                            )}

                            {isEditando && (
                              <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                                <Label className="text-sm font-semibold mb-2 block">Selecione a nova função:</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  {Object.entries(ROLES_INFO).filter(([key]) => key !== 'admin').map(([roleKey, roleData]) => (
                                    <Button
                                      key={roleKey}
                                      onClick={() => handleSalvarRole(usuario.id, roleKey)}
                                      size="sm"
                                      variant={getRoleEffetiva(usuario) === roleKey ? "default" : "outline"}
                                      className="text-xs justify-start"
                                      disabled={atualizarUsuarioMutation.isPending}
                                    >
                                      <roleData.icon className="w-3 h-3 mr-2" />
                                      {roleData.label}
                                    </Button>
                                  ))}
                                </div>
                                <Button
                                  onClick={() => setUsuarioEditando(null)}
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs mt-2 w-full"
                                >
                                  Cancelar
                                </Button>
                              </div>
                            )}

                            {usuario.id === user.id && (
                              <p className="text-xs text-blue-600 mt-2 font-medium">
                                👤 Este é você - não pode alterar sua própria função
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {usuariosFiltrados.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>Nenhum usuário encontrado com este filtro</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* CONTEÚDO DA ABA: SISTEMA */}
        {abaAtiva === "sistema" && (
          <div className="space-y-6">
            {/* Limpar Histórico */}
            <Card className="shadow-lg border-2 border-red-300">
              <CardHeader className="bg-red-50 border-b border-red-200">
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <Trash2 className="w-6 h-6" />
                  Limpar Todo o Histórico
                </CardTitle>
                <CardDescription className="text-red-700">
                  Remove PERMANENTEMENTE todos os pacientes e triagens do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                
                {!mostrarConfirmacao ? (
                  <div className="space-y-4">
                    <Alert className="border-orange-500 bg-orange-50">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        <strong>⚠️ ATENÇÃO:</strong> Esta ação é IRREVERSÍVEL e vai deletar:
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          <li><strong>{todosPacientes.length} registros de pacientes</strong></li>
                          <li>Todos os históricos de triagem</li>
                          <li>Todos os relatórios gerados</li>
                          <li>Todos os dados vitais e ECGs</li>
                          <li>Todas as avaliações médicas</li>
                        </ul>
                      </AlertDescription>
                    </Alert>

                    <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Quando usar esta função:</h4>
                      <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                        <li>Ao finalizar testes do sistema</li>
                        <li>Para resetar dados de demonstração</li>
                        <li>Antes de entregar o sistema para uma nova unidade</li>
                        <li>Limpeza de dados antigos (fazer backup antes!)</li>
                      </ul>
                    </div>

                    <Button
                      onClick={() => setMostrarConfirmacao(true)}
                      variant="destructive"
                      className="w-full bg-red-600 hover:bg-red-700"
                      size="lg"
                    >
                      <Trash2 className="w-5 h-5 mr-2" />
                      Iniciar Limpeza do Histórico
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert className="border-red-600 bg-red-100">
                      <AlertTriangle className="h-5 w-5 text-red-700" />
                      <AlertDescription className="text-red-900 font-semibold">
                        🚨 ZONA DE PERIGO - CONFIRMAÇÃO NECESSÁRIA
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label htmlFor="confirmacao" className="text-base font-semibold">
                        Digite exatamente "LIMPAR TUDO" para confirmar:
                      </Label>
                      <Input
                        id="confirmacao"
                        value={confirmacao}
                        onChange={(e) => setConfirmacao(e.target.value)}
                        placeholder="LIMPAR TUDO"
                        className="text-lg font-mono border-2 border-red-400"
                      />
                      <p className="text-xs text-gray-600">
                        Copie e cole: <code className="bg-gray-200 px-2 py-1 rounded">LIMPAR TUDO</code>
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          setMostrarConfirmacao(false);
                          setConfirmacao("");
                        }}
                        variant="outline"
                        className="flex-1"
                        disabled={processando}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleLimparHistorico}
                        variant="destructive"
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        disabled={confirmacao !== "LIMPAR TUDO" || processando}
                      >
                        {processando ? (
                          <>
                            <Activity className="w-4 h-4 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Confirmar e Deletar Tudo
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Rodapé */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Sistema de Triagem de Dor Torácica • Painel de Administração</p>
          <p className="mt-1">Desenvolvido por Walber Alves Frazão Júnior - COREN 110.238</p>
        </div>

      </div>
    </div>
  );
}