import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = "triagem.upas@gmail.com";

    // Buscar User
    const todosUsers = await base44.asServiceRole.entities.User.list();
    const userExistente = todosUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());

    // Buscar SolicitacaoAcesso
    const todasSolic = await base44.asServiceRole.entities.SolicitacaoAcesso.list();
    const solic = todasSolic.find(s => s.email?.toLowerCase() === email.toLowerCase());

    console.log(`[VERIFICAÇÃO] Email: ${email}`);
    console.log(`[VERIFICAÇÃO] User encontrado:`, userExistente ? "SIM" : "NÃO");
    console.log(`[VERIFICAÇÃO] SolicitacaoAcesso encontrada:`, solic ? "SIM" : "NÃO");

    // Se foi deletado, recriar
    if (!userExistente && !solic) {
      const novoUser = await base44.asServiceRole.entities.User.create({
        full_name: "Unidade Pronto Atendimento",
        email: email,
        funcao: "administrativo",
        equipe: "unidade_saude",
        perfil: "UNIDADE_SAUDE",
        cpf: "",
        telefone: "",
        registro_profissional_tipo: "",
        registro_profissional_numero: "",
        matricula: "",
        macrorregiao: "Macro 1",
        motivo_bloqueio: "",
        status_acesso: "ATIVO",
        cadastro_completo: true
      });
      
      console.log(`[RECRIADO] User criado: ${novoUser.id}`);
      return Response.json({ 
        message: "Usuário foi deletado e recriado", 
        user: novoUser
      });
    }

    return Response.json({ 
      message: "Usuário encontrado",
      user: userExistente,
      solicitacao: solic
    });

  } catch (error) {
    console.error("[ERRO]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});