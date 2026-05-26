import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Clock, LogOut, XCircle, Ban, Mail, CheckCircle2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PERFIL_LABELS = {
  UNIDADE_SAUDE: "Unidade de Saúde",
  CERH: "CERH",
  ASSCARDIO: "ASSCARDIO",
  TRANSPORTE: "Transporte",
  HEMODINAMICA: "Hemodinâmica",
  ADMINISTRADOR_MANAGER: "Administrador Manager",
  ADMINISTRADOR_CERH: "Administrador CERH",
  ADMINISTRADOR_CARDIOLOGIA: "Administrador Cardiologia",
  ADMINISTRADOR_TRANSPORTE: "Administrador Transporte",
};

export default function AcessoPendente() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const statusMsg = {
    PENDENTE: {
      icon: <Clock className="w-16 h-16 text-yellow-500" />,
      title: "Cadastro em Análise",
      desc: "Seu cadastro foi enviado com sucesso e está aguardando aprovação do Administrador Manager.",
      detalhe: "Assim que seu acesso for aprovado, você receberá um e-mail automático de confirmação no endereço cadastrado.",
      color: "border-yellow-400",
      bgColor: "bg-yellow-50",
    },
    INATIVO: {
      icon: <XCircle className="w-16 h-16 text-gray-500" />,
      title: "Acesso Desativado",
      desc: "Seu acesso está temporariamente desativado pelo administrador.",
      detalhe: "Entre em contato com o Administrador Manager para solicitar a reativação.",
      color: "border-gray-400",
      bgColor: "bg-gray-50",
    },
    BLOQUEADO: {
      icon: <Ban className="w-16 h-16 text-red-500" />,
      title: "Acesso Bloqueado",
      desc: "Seu acesso foi bloqueado pelo administrador do sistema.",
      detalhe: "Entre em contato com o Administrador Manager para esclarecimentos.",
      color: "border-red-400",
      bgColor: "bg-red-50",
    },
  };

  const status = user?.status_acesso || "PENDENTE";
  const info = statusMsg[status] || statusMsg["PENDENTE"];

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
        </div>

        <Card className={`border-2 ${info.color} shadow-xl`}>
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex justify-center mb-4">{info.icon}</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{info.title}</h1>
            <p className="text-gray-700 mb-2 leading-relaxed">{info.desc}</p>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">{info.detalhe}</p>

            {/* Dados do cadastro */}
            {user && (
              <div className={`rounded-lg p-4 mb-5 text-left border ${info.bgColor} border-opacity-50`}>
                <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Dados enviados:
                </p>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Nome:</span> {user.full_name || user.nome_completo || "—"}</p>
                  <p><span className="font-medium">E-mail:</span> {user.email_cadastro || user.email}</p>
                  {user.cpf && <p><span className="font-medium">CPF:</span> {user.cpf}</p>}
                  {user.perfil && <p><span className="font-medium">Perfil:</span> {PERFIL_LABELS[user.perfil] || user.perfil?.replace(/_/g, " ")}</p>}
                  {user.funcao && <p><span className="font-medium">Função:</span> {user.funcao?.replace(/_/g, " ")}</p>}
                  {user.telefone && <p><span className="font-medium">Telefone:</span> {user.telefone}</p>}
                </div>
              </div>
            )}

            {/* Aviso de e-mail */}
            {status === "PENDENTE" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5 text-left">
                <div className="flex items-start gap-2 text-blue-800 text-sm">
                  <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Notificação por e-mail</p>
                    <p className="text-blue-700 mt-0.5 text-xs">
                      Você receberá um e-mail automático em <strong>{user?.email_cadastro || user?.email || "seu e-mail"}</strong> quando seu cadastro for aprovado.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bloqueio: mostrar motivo */}
            {status === "BLOQUEADO" && user?.motivo_bloqueio && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5 text-left text-sm text-red-700">
                <p className="font-semibold">Motivo:</p>
                <p>{user.motivo_bloqueio}</p>
              </div>
            )}

            <Button
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50 w-full"
              onClick={() => base44.auth.logout()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair do Sistema
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-4">
          © 2025-2026 Secretaria de Estado de Saúde da Paraíba
        </p>
      </div>
    </div>
  );
}