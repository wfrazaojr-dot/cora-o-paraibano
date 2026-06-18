import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Redirecionamento automático baseado no perfil do usuário
export default function PainelInicial() {
  const navigate = useNavigate();
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (!user || isLoading) return;

    // Acesso temporário: todo usuário autenticado entra direto, sem cadastro/aprovação.
    // Marca a sessão para evitar o loop de redirect do Layout.
    const perfil = user.perfil || user.equipe;
    sessionStorage.setItem("perfil_selecionado_sessao", perfil || user.role || "user");

    const equipesRegulacao = [
      "cerh", "asscardio", "transporte", "hemodinamica",
      "CERH", "ASSCARDIO", "TRANSPORTE", "HEMODINAMICA",
    ];

    if (equipesRegulacao.includes(perfil)) {
      navigate(createPageUrl("Dashboard"), { replace: true });
    } else {
      // unidade de saúde, admin, dev e demais → Painel Assistencial
      navigate(createPageUrl("Historico"), { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 text-sm">Redirecionando...</p>
      </div>
    </div>
  );
}