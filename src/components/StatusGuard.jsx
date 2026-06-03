import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * StatusGuard — verifica se o usuário autenticado via GOV.BR
 * possui status_acesso = "ATIVO" antes de permitir acesso às rotas protegidas.
 * 
 * Regras:
 * - Se não tiver cadastro_completo → redireciona para /CadastroPerfil
 * - Se status_acesso for PENDENTE, INATIVO ou BLOQUEADO → redireciona para /AcessoPendente
 * - Se status_acesso for ATIVO → permite acesso
 * - Desenvolvedor (email hardcoded) e role 'admin' → acesso irrestrito
 */
export default function StatusGuard({ children }) {
  const location = useLocation();

  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  const isDev = user.email?.toLowerCase() === "wfrazaojr@gmail.com";
  const isAdmin = user.role === "admin";

  // Desenvolvedor e admin legado têm acesso irrestrito
  if (isDev || isAdmin) return <>{children}</>;

  // Usuário sem cadastro completo → vai para cadastro
  if (!user.cadastro_completo) {
    return <Navigate to="/CadastroPerfil" replace />;
  }

  // Usuário com cadastro mas sem acesso ATIVO → vai para tela de acesso pendente
  const statusAtivo = user.status_acesso === "ATIVO";
  if (!statusAtivo) {
    return <Navigate to="/AcessoPendente" replace />;
  }

  return <>{children}</>;
}