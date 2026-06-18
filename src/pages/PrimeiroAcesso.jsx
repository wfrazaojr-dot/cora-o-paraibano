import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, UserPlus, Shield, Clock } from "lucide-react";

export default function PrimeiroAcesso() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="flex items-center justify-center gap-6 max-w-4xl mx-auto">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/8e093c8da_logoSecretariadeEstadodaSade.png"
            alt="Secretaria de Saúde"
            className="h-12 w-auto object-contain"
          />
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/9ba212c7d_LOGOCARDIOPB.jpg"
            alt="CARDIOPB"
            className="h-12 w-auto object-contain"
          />
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/873a4a563_logo.png"
            alt="PBSAÚDE"
            className="h-12 w-auto object-contain"
          />
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-8 text-center">

          {/* Ícone e título */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-red-600 p-5 rounded-full shadow-lg">
                <Heart className="w-14 h-14 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Bem-vindo ao <span className="text-red-600">CARDIOPB</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Sistema integrado de regulação e controle para doenças cardiovasculares do Estado da Paraíba.
            </p>
          </div>

          {/* Cards informativos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-5 pb-5 text-center">
                <UserPlus className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-800">Primeiro Acesso</p>
                <p className="text-xs text-gray-600 mt-1">Registre seus dados e solicite seu perfil de acesso</p>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-5 pb-5 text-center">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-800">Aguarde Aprovação</p>
                <p className="text-xs text-gray-600 mt-1">Um administrador irá revisar sua solicitação</p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-5 pb-5 text-center">
                <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-800">Acesso Liberado</p>
                <p className="text-xs text-gray-600 mt-1">Após aprovação, você poderá acessar o sistema</p>
              </CardContent>
            </Card>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white text-base px-10 py-6 rounded-xl shadow-md font-bold gap-2"
              onClick={() => navigate("/SolicitarAcesso")}
            >
              <UserPlus className="w-5 h-5" />
              PRIMEIRO ACESSO
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-gray-400 text-gray-700 text-base px-10 py-6 rounded-xl font-semibold gap-2"
              onClick={() => window.location.href = "/"}
            >
              <Shield className="w-5 h-5" />
              JÁ TENHO CADASTRO — ENTRAR
            </Button>
          </div>

          <p className="text-xs text-gray-400">
            Ao acessar o sistema, você concorda com os termos de uso e políticas de privacidade do Estado da Paraíba.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 text-center">
        <p className="text-xs text-gray-500">© 2025 CARDIOPB — Secretaria de Estado da Saúde da Paraíba</p>
      </footer>
    </div>
  );
}