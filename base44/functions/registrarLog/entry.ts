import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      acao,
      entidade,
      entidade_id,
      descricao,
      dados_anteriores,
      dados_novos,
      campos_alterados,
      severidade
    } = body;

    if (!acao || !entidade || !descricao) {
      return Response.json({ error: 'Campos obrigatórios: acao, entidade, descricao' }, { status: 400 });
    }

    // Detectar campos alterados automaticamente se não informados
    let camposAlterados = campos_alterados || [];
    if (!camposAlterados.length && dados_anteriores && dados_novos) {
      camposAlterados = Object.keys(dados_novos).filter(
        key => JSON.stringify(dados_anteriores[key]) !== JSON.stringify(dados_novos[key])
      );
    }

    const log = await base44.asServiceRole.entities.LogAuditoria.create({
      usuario_email: user.email,
      usuario_nome: user.full_name,
      acao,
      entidade,
      entidade_id: entidade_id || null,
      descricao,
      dados_anteriores: dados_anteriores || null,
      dados_novos: dados_novos || null,
      campos_alterados: camposAlterados,
      ip_origem: req.headers.get('x-forwarded-for') || 'desconhecido',
      severidade: severidade || 'info'
    });

    return Response.json({ success: true, log });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});