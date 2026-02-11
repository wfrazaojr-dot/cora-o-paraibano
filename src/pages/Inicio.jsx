import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Heart, Radio, Truck, Activity } from "lucide-react";

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
  }
];

export default function Inicio() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const selecionarPerfilMutation = useMutation({
    mutationFn: async (equipe) => {
      return await base44.auth.updateMe({ equipe });
    },
    onSuccess: (data, equipe) => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      
      // Redirecionar baseado no perfil escolhido
      if (equipe === 'unidade_saude') {
        navigate(createPageUrl("Historico"));
      } else if (equipe === 'cerh' || equipe === 'asscardio') {
        navigate(createPageUrl("Dashboard"));
      } else if (equipe === 'transporte' || equipe === 'hemodinamica') {
        navigate(createPageUrl("Dashboard"));
      }
    },
  });

  const handleSelecionarPerfil = (perfilId) => {
    selecionarPerfilMutation.mutate(perfilId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50">
      {/* Header com as 3 logos */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between gap-4 w-full max-w-7xl mx-auto">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/8e093c8da_logoSecretariadeEstadodaSade.png" 
            alt="Secretaria de Estado da Saúde" 
            className="h-16 md:h-20 w-auto object-contain"
          />
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/fa5f3a17e_LOGOCORAAOPARAIBANO.png" 
            alt="Coração Paraibano" 
            className="h-16 md:h-20 w-auto object-contain"
          />
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/873a4a563_logo.png" 
            alt="PBSAÚDE" 
            className="h-16 md:h-20 w-auto object-contain"
          />
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
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
    </div>
  );
}