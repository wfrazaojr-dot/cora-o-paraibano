import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Building2, Heart, Radio, Truck, Activity, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const perfis = [
  {
    id: "unidade_saude",
    titulo: "UNIDADES DE SAÚDE",
    descricao: "Acesso para profissionais das Unidades de Saúde - Triagem e atendimento de pacientes",
    icon: Building2,
    cor: "bg-blue-600 hover:bg-blue-700"
  },
  {
    id: "asscardio",
    titulo: "ASSCARDIO",
    descricao: "Assessoria Cardiológica - Suporte especializado e pareceres técnicos",
    icon: Heart,
    cor: "bg-green-600 hover:bg-green-700"
  },
  {
    id: "cerh",
    titulo: "CERH",
    descricao: "Central Estadual de Regulação em Hemodinâmica - Regulação e encaminhamento",
    icon: Radio,
    cor: "bg-purple-600 hover:bg-purple-700"
  },
  {
    id: "transporte",
    titulo: "TRANSPORTE",
    descricao: "Gestão e coordenação de transporte de pacientes",
    icon: Truck,
    cor: "bg-orange-600 hover:bg-orange-700"
  },
  {
    id: "hemodinamica",
    titulo: "HEMODINÂMICA",
    descricao: "Unidades de Hemodinâmica - Recebimento e tratamento de pacientes",
    icon: Activity,
    cor: "bg-red-600 hover:bg-red-700"
  },
  {
    id: "admin",
    titulo: "ADMINISTRADOR",
    descricao: "Acesso administrativo completo - Gestão e configuração do sistema",
    icon: Shield,
    cor: "bg-gray-800 hover:bg-gray-900"
  }
];

export default function PainelInicial() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const handleSelecionarPerfil = async (perfilId) => {
    await base44.auth.updateMe({ equipe: perfilId });
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Boas-vindas */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Bem-vindo ao App Coração Paraibano
          </h1>
          <p className="text-xl text-gray-700 mb-2">
            Olá, <span className="font-semibold text-red-600">{user?.full_name}</span>
          </p>
          <p className="text-lg text-gray-600">
            Selecione seu perfil de acesso para continuar
          </p>
        </div>

        {/* Grid de perfis */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {perfis.map((perfil) => {
            const Icon = perfil.icon;
            return (
              <Card 
                key={perfil.id}
                className="hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border-2 hover:border-gray-300"
                onClick={() => handleSelecionarPerfil(perfil.id)}
              >
                <CardContent className="p-6">
                  <div className={`${perfil.cor} w-16 h-16 rounded-lg flex items-center justify-center mb-4 transition-colors`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {perfil.titulo}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {perfil.descricao}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Informações do usuário */}
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
          <p className="text-sm text-gray-600 text-center">
            <span className="font-semibold">Email:</span> {user?.email}
          </p>
          {user?.role === 'admin' && (
            <p className="text-sm text-center mt-2">
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-semibold">
                ADMINISTRADOR
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}