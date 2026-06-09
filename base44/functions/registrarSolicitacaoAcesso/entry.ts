import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { email, nome_completo, cpf, telefone, perfil, funcao,
            registro_profissional_tipo, registro_profissional_numero,
            matricula, unidade_saude, equipe } = body;

    if (!email || !nome_completo || !perfil || !funcao) {
      return Response.json({ error: 'Campos obrigatórios: email, nome_completo, perfil, funcao' }, { status: 400 });
    }

    // ⚠️ POLÍTICA CRÍTICA: nome_completo vem do formulário, NUNCA do email
    // Exemplo: email "walberjp@gov.br" → nome_completo deve ser "Walber Alves Frazão Júnior" (digitado pelo usuário)
    // O prefixo do email "walberjp" é descartado completamente

    // Verificar se já existe solicitação pendente para este e-mail
    const existentes = await base44.asServiceRole.entities.SolicitacaoAcesso.filter({ email, status: "PENDENTE" });
    if (existentes && existentes.length > 0) {
      return Response.json({ success: true, ja_existe: true, message: 'Solicitação já registrada anteriormente.' });
    }

    // 1. CRIAR SolicitacaoAcesso com TODOS os dados EXATAMENTE como recebidos do formulário
    const solicitacao = await base44.asServiceRole.entities.SolicitacaoAcesso.create({
      email,
      nome_completo, // EXATAMENTE como o usuário digitou
      cpf: cpf || null,
      telefone: telefone || null,
      perfil,
      funcao,
      registro_profissional_tipo: registro_profissional_tipo || null,
      registro_profissional_numero: registro_profissional_numero || null,
      matricula: matricula || null,
      unidade_saude: unidade_saude || null,
      status: "PENDENTE",
    });

    // 2. SINCRONIZAR com User APENAS se existir e usar EXATAMENTE o nome_completo recebido
    try {
      const userFiltered = await base44.asServiceRole.entities.User.filter({ email: email.toLowerCase() });
      if (userFiltered && userFiltered.length > 0) {
        const existingUser = userFiltered[0]; // Pegar o primeiro resultado com match exato
        // ⚠️ CRÍTICO: SEMPRE atualizar full_name com nome_completo do formulário
        // Isso sobrescreve qualquer nome anterior que tenha sido extraído do email
        await base44.asServiceRole.entities.User.update(existingUser.id, {
          full_name: nome_completo, // Sobrescrever com o REAL nome completo do usuário
          cpf: cpf || null,
          telefone: telefone || null,
          perfil: perfil || null,
          funcao: funcao || null,
          equipe: equipe || "unidade_saude",
          unidade_saude: unidade_saude || null,
          registro_profissional_tipo: registro_profissional_tipo || null,
          registro_profissional_numero: registro_profissional_numero || null,
          matricula: matricula || null,
          status_acesso: "PENDENTE",
          cadastro_completo: true,
        });
      }
    } catch (userError) {
      // Se falhar atualizar User, continua mesmo assim - SolicitacaoAcesso já foi criada
      console.log("Aviso: Não foi possível atualizar User, mas SolicitacaoAcesso foi criada com sucesso");
    }

    // Notificar administradores por e-mail
    const PERFIL_LABELS = {
      UNIDADE_SAUDE: "Unidade de Saúde", CERH: "CERH", ASSCARDIO: "ASSCARDIO",
      TRANSPORTE: "Transporte", HEMODINAMICA: "Hemodinâmica",
      ADMINISTRADOR_MANAGER: "Adm. Manager", ADMINISTRADOR_CERH: "Adm. CERH",
      ADMINISTRADOR_CARDIOLOGIA: "Adm. Cardiologia", ADMINISTRADOR_TRANSPORTE: "Adm. Transporte",
    };

    // Buscar admins para notificar
    const admins = await base44.asServiceRole.entities.User.filter({ status_acesso: "ATIVO" });
    const adminsParaNotificar = admins.filter(u =>
      u.role === "ADMINISTRADOR_MANAGER" || u.role === "admin" || u.email?.toLowerCase() === "wfrazaojr@gmail.com"
    );

    for (const admin of adminsParaNotificar) {
      const emailAdmin = admin.email_cadastro || admin.email;
      if (emailAdmin) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: emailAdmin,
          subject: "🔔 Nova Solicitação de Acesso — Coração Paraibano",
          body: `Olá, ${admin.full_name || "Administrador"}!\n\nUma nova solicitação de acesso foi recebida:\n\nNome: ${nome_completo}\nE-mail: ${email}\nCPF: ${cpf || "não informado"}\nPerfil Solicitado: ${PERFIL_LABELS[perfil] || perfil}\nFunção: ${funcao}\n\nAcesse o sistema para aprovar ou rejeitar:\nhttps://coracaoparaibano.base44.app/GerenciarAcessos\n\nAtenciosamente,\nSistema Coração Paraibano`,
        });
      }
    }

    return Response.json({ success: true, id: solicitacao.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});