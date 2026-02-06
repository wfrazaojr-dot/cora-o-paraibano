import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Plus, Users, Clock, AlertTriangle, Activity } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

import StatsCard from "../components/dashboard/StatsCard";
import PacientesEmAtendimento from "../components/dashboard/PacientesEmAtendimento";
import GraficoClassificacao from "../components/dashboard/GraficoClassificacao";
import AlertasCriticos from "../components/dashboard/AlertasCriticos";

export default function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pacientes = [], isLoading } = useQuery({
    queryKey: ['pacientes', user?.email],
    queryFn: async () => {
      // Se for admin, mostra todos os pacientes
      if (user?.role === 'admin') {
        return base44.entities.Paciente.list("-created_date");
      }
      // Se for usuário comum, mostra apenas seus pacientes
      return base44.entities.Paciente.filter({ created_by: user?.email }, "-created_date");
    },
    enabled: !!user,
    initialData: [],
  });

  const pacientesEmAtendimento = pacientes.filter(p => 
    ['Em Triagem', 'Aguardando Médico', 'Em Atendimento'].includes(p.status)
  );

  const pacientesHoje = pacientes.filter(p => {
    const hoje = new Date();
    const dataPaciente = new Date(p.created_date);
    return dataPaciente.toDateString() === hoje.toDateString();
  });

  const pacientesVermelhos = pacientesEmAtendimento.filter(p => 
    p.classificacao_risco?.cor === "Vermelha"
  );

  const tempoMedioTriagem = pacientes
    .filter(p => p.tempo_triagem_ecg_minutos)
    .reduce((acc, p) => acc + p.tempo_triagem_ecg_minutos, 0) / 
    (pacientes.filter(p => p.tempo_triagem_ecg_minutos).length || 1);

  const alertasMeta = pacientesEmAtendimento.filter(p => {
    if (!p.data_hora_inicio_triagem) return false;
    const minutos = differenceInMinutes(new Date(), new Date(p.data_hora_inicio_triagem));
    return (p.classificacao_risco?.cor === "Vermelha" && minutos > 10) ||
           (p.classificacao_risco?.cor === "Laranja" && minutos > 30);
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Painel de Controle</h1>
            <p className="text-gray-600 mt-1">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              👤 {user.full_name} • {user.email}
              {user.role === 'admin' && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">ADMINISTRADOR</span>}
            </p>
          </div>
          <Link to={createPageUrl("NovaTriagem")}>
            <Button className="bg-red-600 hover:bg-red-700 shadow-lg">
              <Plus className="w-5 h-5 mr-2" />
              Novo Paciente
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Em Atendimento"
            value={pacientesEmAtendimento.length}
            icon={Users}
            color="blue"
            subtitle={`${pacientesHoje.length} hoje`}
          />
          <StatsCard
            title="Casos Críticos"
            value={pacientesVermelhos.length}
            icon={AlertTriangle}
            color="red"
            subtitle="Prioridade vermelha"
          />
          <StatsCard
            title="Tempo Médio ECG"
            value={`${Math.round(tempoMedioTriagem)} min`}
            icon={Clock}
            color="green"
            subtitle={tempoMedioTriagem <= 10 ? "Dentro da meta" : "Acima da meta"}
          />
          <StatsCard
            title="Alertas Ativos"
            value={alertasMeta.length}
            icon={Activity}
            color="orange"
            subtitle="Fora do tempo esperado"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <PacientesEmAtendimento 
              pacientes={pacientesEmAtendimento}
              isLoading={isLoading}
            />
          </div>
          <div className="space-y-6">
            <AlertasCriticos pacientes={alertasMeta} />
            <GraficoClassificacao pacientes={pacientesHoje} />
          </div>
        </div>
      </div>
    </div>
  );
}