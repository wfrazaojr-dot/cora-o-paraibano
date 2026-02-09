import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Heart, Building2, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const perfis = [
  {
    id: "unidade_saude",
    titulo: "Usuário de Unidade de Saúde",
    descricao: "Acesso ao triage de pacientes e protocolos da unidade",
    icone: Building2,
    cor: "bg-blue-50 border-blue-300 hover:bg-blue-100"
  },
  {
    id: "cerh",
    titulo: "Usuário CERH",
    descricao: "Acesso ao painel de assessoria cardiológica",
    icone: Heart,
    cor: "bg-red-50 border-red-300 hover:bg-red-100"
  },
  {
    id: "asscardio",
    titulo: "Usuário ASSCARDIO",
    descricao: "Acesso ao painel de regulação central",
    icone: Shield,
    cor: "bg-green-50 border-green-300 hover:bg-green-100"
  },
  {
    id: "admin",
    titulo: "Usuário Administrador",
    descricao: "Acesso total ao sistema com funções administrativas",
    icone: Users,
    cor: "bg-purple-50 border-purple-300 hover:bg-purple-100"
  }
];

export default function PerfilSelection() {
  const navigate = useNavigate();
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const handleSelectPerfil = async (perfilId) => {
    if (perfilId === "unidade_saude") {
      navigate(createPageUrl("CoracaoParaibano"));
    } else if (perfilId === "admin") {
      // Admin vai direto para o Dashboard
      navigate(createPageUrl("Dashboard"));
    } else {
      // Atualizar o perfil do usuário (CERH ou ASSCARDIO)
      await base44.auth.updateMe({ equipe: perfilId });
      navigate(createPageUrl("Dashboard"));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header com logos */}
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

      {/* Conteúdo principal */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Bem-vindo!</h1>
            <p className="text-lg text-gray-600">
              {user?.full_name}, escolha seu perfil de acesso
            </p>
          </div>

          {/* Grid de perfis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {perfis.map((perfil) => {
              const Icon = perfil.icone;
              return (
                <button
                  key={perfil.id}
                  onClick={() => handleSelectPerfil(perfil.id)}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-lg ${perfil.cor}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-lg">
                      <Icon className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {perfil.titulo}
                      </h3>
                      <p className="text-sm text-gray-700 mt-1">
                        {perfil.descricao}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer com informações do usuário */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-2">Usuário</p>
            <p className="font-semibold text-gray-900">{user?.email}</p>
            {user?.role === 'admin' && (
              <p className="text-xs text-red-600 font-bold mt-2">ADMINISTRADOR DO SISTEMA</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}