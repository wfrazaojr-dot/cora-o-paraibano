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
    queryKey: ['pacientes', user?.email, user?.equipe],
    queryFn: async () => {
      const equipe = user?.equipe || 'unidade_saude';
      
      // Admin: mostra todos os pacientes
      if (user?.role === 'admin') {
        return base44.entities.Paciente.list("-created_date");
      }

      // Usuário de unidade de saúde: mostra apenas pacientes da sua unidade
      if (equipe === 'unidade_saude') {
        return base44.entities.Paciente.filter({ unidade_saude: user?.unidade_saude }, "-created_date");
      }

      // CERH e ASSCARDIO: mostra todos os pacientes (consolidado)
      return base44.entities.Paciente.list("-created_date");
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

  const casosCriticos = pacientes.filter(p => 
    p.triagem_medica?.tipo_sca === "SCACESST"
  );

  const casosAmarelosPrioridade = pacientes.filter(p => 
    p.triagem_medica?.tipo_sca === "SCASESST_COM_TROPONINA" || 
    p.triagem_medica?.tipo_sca === "SCASESST_SEM_TROPONINA"
  );

  const alertasCriticos = casosCriticos.length > 5 ? casosCriticos : [];
  
  const alertasAtivos = pacientesEmAtendimento.filter(p => 
    p.triagem_medica?.tipo_sca === "SCACESST" && 
    !p.regulacao_central?.medico_regulador_nome
  );

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
            <h1 className="text-3xl font-bold text-gray-900">
              {user?.equipe === 'cerh' && 'Painel de Regulação - CERH'}
              {user?.equipe === 'asscardio' && 'Painel de Regulação - ASSCARDIO'}
              {user?.equipe === 'unidade_saude' && 'Painel de Controle'}
              {user?.role === 'admin' && 'Painel de Regulação'}
            </h1>
            <p className="text-gray-600 mt-1">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              👤 {user.full_name} • {user.email}
              {user?.equipe === 'cerh' && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">CERH</span>}
              {user?.equipe === 'asscardio' && <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">ASSCARDIO</span>}
              {user?.equipe === 'unidade_saude' && <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">UNIDADE DE SAÚDE</span>}
              {user?.role === 'admin' && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">ADMINISTRADOR</span>}
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
            value={casosCriticos.length}
            icon={AlertTriangle}
            color="red"
            subtitle="SCACESST"
          />
          <StatsCard
            title="Prioridade Amarela"
            value={casosAmarelosPrioridade.length}
            icon={Clock}
            color="yellow"
            subtitle="SCASESST"
          />
          <StatsCard
            title="Alertas Ativos"
            value={alertasAtivos.length}
            icon={Activity}
            color="orange"
            subtitle="Aguardando CERH"
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
            {alertasCriticos.length > 0 && (
              <AlertasCriticos pacientes={alertasCriticos} />
            )}
            <GraficoClassificacao pacientes={pacientesHoje} />
          </div>
        </div>
      </div>
    </div>
  );
}