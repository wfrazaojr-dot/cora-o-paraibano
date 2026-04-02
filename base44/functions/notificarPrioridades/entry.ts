import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Buscar todos os pacientes ativos (não concluídos)
  const todosPacientes = await base44.asServiceRole.entities.Paciente.list();
  const pacientesAtivos = todosPacientes.filter(p => p.status !== "Concluído");

  // Calcular prioridade
  const getPrioridade = (p) => {
    if (p.triagem_medica?.tipo_sca === "SCACESST") return 0;
    if (p.triagem_medica?.tipo_sca === "SCASESST_COM_TROPONINA") return 1;
    if (p.triagem_medica?.tipo_sca === "SCASESST_SEM_TROPONINA") return 2;
    return null;
  };

  // Verificar se ASSCARDIO concluiu avaliação do paciente
  const asscardioPendente = (p) => !p.assessoria_cardiologia?.cardiologista_nome;
  // Verificar se CERH concluiu regulação do paciente
  const cerhPendente = (p) => !p.regulacao_central?.medico_regulador_nome;

  // Buscar usuários CERH e ASSCARDIO
  const todosUsuarios = await base44.asServiceRole.entities.User.list();
  const usuariosCERH = todosUsuarios.filter(u => u.equipe === 'cerh');
  const usuariosASSCARDIO = todosUsuarios.filter(u => u.equipe === 'asscardio');

  const macros = ["Macro 1", "Macro 2", "Macro 3"];
  const notificacoesEnviadas = [];

  for (const macro of macros) {
    const pacientesMacro = pacientesAtivos.filter(p => p.macrorregiao === macro);

    // P0 pendentes para ASSCARDIO nesta macro
    const p0PendentesAsscardio = pacientesMacro.filter(p => getPrioridade(p) === 0 && asscardioPendente(p));
    // P0 pendentes para CERH nesta macro
    const p0PendentesCerh = pacientesMacro.filter(p => getPrioridade(p) === 0 && cerhPendente(p));

    // P1 e P2 pendentes para cada equipe
    const p1p2PendentesAsscardio = pacientesMacro.filter(p => [1,2].includes(getPrioridade(p)) && asscardioPendente(p));
    const p1p2PendentesCerh = pacientesMacro.filter(p => [1,2].includes(getPrioridade(p)) && cerhPendente(p));

    // Notificar ASSCARDIO: se não há P0 pendentes mas há P1/P2
    if (p0PendentesAsscardio.length === 0 && p1p2PendentesAsscardio.length > 0) {
      const usuariosMacro = usuariosASSCARDIO.filter(u => !u.macrorregiao || u.macrorregiao === macro);

      const p1 = p1p2PendentesAsscardio.filter(p => getPrioridade(p) === 1);
      const p2 = p1p2PendentesAsscardio.filter(p => getPrioridade(p) === 2);

      for (const usuario of usuariosMacro) {
        if (!usuario.email) continue;
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: usuario.email,
          subject: `[${macro}] ✅ P0 concluídos — ${p1p2PendentesAsscardio.length} paciente(s) P1/P2 aguardam ASSCARDIO`,
          body: `
Olá, ${usuario.full_name || 'Equipe ASSCARDIO'}!

Todos os pacientes de Prioridade 0 (SCACESST) da ${macro} tiveram a assessoria cardiológica concluída.

Agora há pacientes de menor prioridade aguardando avaliação:
• Prioridade 1 (SCASESST c/ Troponina): ${p1.length} paciente(s)
• Prioridade 2 (SCASESST s/ Troponina): ${p2.length} paciente(s)

Por favor, acesse o sistema Coração Paraibano para dar continuidade às avaliações.

Este é um aviso automático do sistema.
          `.trim()
        });
        notificacoesEnviadas.push({ equipe: 'asscardio', macro, email: usuario.email });
      }
    }

    // Notificar CERH: se não há P0 pendentes mas há P1/P2
    if (p0PendentesCerh.length === 0 && p1p2PendentesCerh.length > 0) {
      const usuariosMacro = usuariosCERH.filter(u => !u.macrorregiao || u.macrorregiao === macro);

      const p1 = p1p2PendentesCerh.filter(p => getPrioridade(p) === 1);
      const p2 = p1p2PendentesCerh.filter(p => getPrioridade(p) === 2);

      for (const usuario of usuariosMacro) {
        if (!usuario.email) continue;
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: usuario.email,
          subject: `[${macro}] ✅ P0 concluídos — ${p1p2PendentesCerh.length} paciente(s) P1/P2 aguardam CERH`,
          body: `
Olá, ${usuario.full_name || 'Equipe CERH'}!

Todos os pacientes de Prioridade 0 (SCACESST) da ${macro} tiveram a regulação central concluída.

Agora há pacientes de menor prioridade aguardando regulação:
• Prioridade 1 (SCASESST c/ Troponina): ${p1.length} paciente(s)
• Prioridade 2 (SCASESST s/ Troponina): ${p2.length} paciente(s)

Por favor, acesse o sistema Coração Paraibano para dar continuidade às regulações.

Este é um aviso automático do sistema.
          `.trim()
        });
        notificacoesEnviadas.push({ equipe: 'cerh', macro, email: usuario.email });
      }
    }
  }

  return Response.json({
    ok: true,
    notificacoes_enviadas: notificacoesEnviadas.length,
    detalhes: notificacoesEnviadas
  });
});