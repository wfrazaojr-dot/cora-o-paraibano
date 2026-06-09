import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ROLES_PERMITIDOS = ['admin', 'ADMINISTRADOR_MANAGER', 'ADMINISTRADOR_CERH', 'ADMINISTRADOR_CARDIOLOGIA', 'ADMINISTRADOR_TRANSPORTE', 'DESENVOLVEDOR'];
    const isDev = user.email?.toLowerCase() === 'wfrazaojr@gmail.com';

    if (!isDev && !ROLES_PERMITIDOS.includes(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Buscar todos os usuários e solicitações
    const allUsers = await base44.asServiceRole.entities.User.list();
    const solicAcessos = await base44.asServiceRole.entities.SolicitacaoAcesso.list();

    // Enriquecer usuários com dados da SolicitacaoAcesso quando disponível
    const usuariosEnriquecidos = allUsers.map(u => {
      const solic = solicAcessos.find(s => s.email?.toLowerCase() === u.email?.toLowerCase());
      return {
        ...u,
        full_name: solic?.nome_completo || u.full_name,
        cpf: solic?.cpf || u.cpf,
        funcao: solic?.funcao || u.funcao,
        perfil: solic?.perfil || u.perfil,
        telefone: solic?.telefone || u.telefone,
      };
    });

    return Response.json({
      solicPendentes: solicAcessos.filter(s => s.status === "PENDENTE") || [],
      todos: usuariosEnriquecidos || [],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});