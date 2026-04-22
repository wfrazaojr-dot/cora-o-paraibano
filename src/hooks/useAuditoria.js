import { useCallback } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Hook utilitário que registra automaticamente ações na entidade LogAuditoria.
 * Use nos handlers de criar, editar e excluir de qualquer entidade.
 */
export function useAuditoria(user) {
  const registrar = useCallback(
    async ({ acao, entidade, entidade_id, descricao, dados_anteriores, dados_novos, campos_alterados, severidade = "info" }) => {
      if (!user?.email) return;
      try {
        await base44.entities.LogAuditoria.create({
          usuario_email: user.email,
          usuario_nome: user.full_name || user.email,
          acao,
          entidade,
          entidade_id: entidade_id ? String(entidade_id) : undefined,
          descricao,
          dados_anteriores: dados_anteriores || undefined,
          dados_novos: dados_novos || undefined,
          campos_alterados: campos_alterados || undefined,
          severidade,
        });
      } catch (e) {
        // Silencia erros de auditoria para não bloquear o fluxo principal
        console.warn("[Auditoria] Erro ao registrar log:", e?.message);
      }
    },
    [user]
  );

  return { registrar };
}