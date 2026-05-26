import React from 'react';
import { base44 } from '@/api/base44Client';
import { UserPlus, LogIn, Heart, Shield } from 'lucide-react';

const UserNotRegisteredError = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logos */}
        <div className="flex justify-center gap-6 mb-8">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/8e093c8da_logoSecretariadeEstadodaSade.png"
            alt="SES-PB"
            className="h-12 w-auto object-contain"
          />
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/fa5f3a17e_LOGOCORAAOPARAIBANO.png"
            alt="Coração Paraibano"
            className="h-12 w-auto object-contain"
          />
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/873a4a563_logo.png"
            alt="PBSAÚDE"
            className="h-12 w-auto object-contain"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-red-600 px-8 py-6 text-center">
            <div className="flex justify-center mb-3">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Coração Paraibano</h1>
            <p className="text-red-100 text-sm mt-1">Sistema de Regulação de Hemodinâmica</p>
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            <div className="text-center mb-8">
              <p className="text-gray-700 text-base leading-relaxed">
                Seu acesso pelo <strong>GOV.BR</strong> foi autenticado com sucesso.
              </p>
              <p className="text-gray-600 text-sm mt-2">
                Para continuar, selecione uma das opções abaixo:
              </p>
            </div>

            <div className="space-y-4">
              {/* Opção A: Novo Usuário */}
              <a
                href="/CadastroPerfil"
                className="flex items-start gap-4 p-5 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-all cursor-pointer group"
              >
                <div className="bg-blue-600 rounded-full p-2 mt-0.5 group-hover:bg-blue-700 transition-colors flex-shrink-0">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-blue-900 text-base">Opção A — Novo Usuário</p>
                  <p className="text-blue-700 text-sm mt-0.5">
                    Primeiro acesso ao sistema. Preencha o formulário de cadastro e aguarde a aprovação do Administrador.
                  </p>
                </div>
              </a>

              {/* Opção B: Usuário Autorizado */}
              <div
                onClick={() => base44.auth.redirectToLogin(window.location.href)}
                className="flex items-start gap-4 p-5 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-400 transition-all cursor-pointer group"
              >
                <div className="bg-green-600 rounded-full p-2 mt-0.5 group-hover:bg-green-700 transition-colors flex-shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-green-900 text-base">Opção B — Usuário Autorizado</p>
                  <p className="text-green-700 text-sm mt-0.5">
                    Já possui cadastro aprovado. Clique aqui para autenticar novamente pelo GOV.BR e acessar o sistema.
                  </p>
                </div>
              </div>
            </div>

            {/* Nota de segurança */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-600 text-xs">
                <LogIn className="w-4 h-4 flex-shrink-0" />
                <span>
                  O acesso ao sistema é <strong>exclusivo para profissionais autorizados</strong> da Rede Coração Paraibano. 
                  Todo acesso é registrado e monitorado.
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2025-2026 Secretaria de Estado de Saúde da Paraíba
        </p>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;