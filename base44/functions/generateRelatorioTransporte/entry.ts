import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pacienteId, intercorrencias, motivo_intercorrencia, acoes_tomadas, status_final } = await req.json();

    const pacientes = await base44.asServiceRole.entities.Paciente.list();
    const paciente = pacientes.find(p => p.id === pacienteId);

    if (!paciente) {
      return Response.json({ error: 'Paciente não encontrado' }, { status: 404 });
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 20;

    const addLine = (text, size = 10, bold = false, color = [0,0,0]) => {
      doc.setFontSize(size);
      doc.setTextColor(...color);
      if (bold) doc.setFont(undefined, 'bold');
      else doc.setFont(undefined, 'normal');
      const lines = doc.splitTextToSize(text, pageWidth - 40);
      lines.forEach(line => {
        if (y > pageHeight - 20) { doc.addPage(); y = 20; }
        doc.text(line, 20, y);
        y += size * 0.5;
      });
      y += 2;
    };

    const addSectionTitle = (title) => {
      y += 4;
      doc.setFillColor(220, 38, 38);
      doc.rect(20, y - 5, pageWidth - 40, 8, 'F');
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(title, 22, y);
      y += 8;
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
    };

    const addKeyValue = (key, value) => {
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text(`${key}: `, 22, y);
      const keyWidth = doc.getTextWidth(`${key}: `);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      const valLines = doc.splitTextToSize(value || 'Não informado', pageWidth - 40 - keyWidth);
      doc.text(valLines[0], 22 + keyWidth, y);
      y += 6;
      for (let i = 1; i < valLines.length; i++) {
        doc.text(valLines[i], 22 + keyWidth, y);
        y += 6;
      }
    };

    const fmt = (iso) => {
      if (!iso) return 'Não informado';
      return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    };

    // CABEÇALHO
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text('RELATÓRIO DE TRANSPORTE', pageWidth / 2, y, { align: 'center' });
    y += 7;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Sistema Coração Paraibano', pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.text(`Emitido em: ${fmt(new Date().toISOString())}`, pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Status geral
    const statusFinal = status_final || paciente.transporte?.status_transporte || 'Não informado';
    const isIntercorrencia = statusFinal === "Com Intercorrência";
    doc.setFillColor(isIntercorrencia ? 220 : 34, isIntercorrencia ? 38 : 197, isIntercorrencia ? 38 : 94);
    doc.rect(20, y - 4, pageWidth - 40, 10, 'F');
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`STATUS: ${statusFinal.toUpperCase()}`, pageWidth / 2, y + 2, { align: 'center' });
    y += 14;

    // DADOS DO PACIENTE
    addSectionTitle('DADOS DO PACIENTE');
    addKeyValue('Nome', paciente.nome_completo);
    addKeyValue('Idade', paciente.idade ? `${paciente.idade} anos` : 'Não informado');
    addKeyValue('Sexo', paciente.sexo);
    addKeyValue('Unidade de Saúde', paciente.unidade_saude);
    addKeyValue('Macrorregião', paciente.macrorregiao);

    // DESTINO
    if (paciente.regulacao_central?.unidade_destino) {
      addSectionTitle('DESTINO REGULADO');
      addKeyValue('Unidade de Destino', paciente.regulacao_central.unidade_destino);
      if (paciente.regulacao_central.observacoes_regulacao) {
        addKeyValue('Observações', paciente.regulacao_central.observacoes_regulacao);
      }
    }

    // INFORMAÇÕES DE TRANSPORTE
    addSectionTitle('INFORMAÇÕES DE TRANSPORTE');
    addKeyValue('Central de Transporte', paciente.transporte?.central_transporte);
    addKeyValue('Tipo de Transporte', paciente.transporte?.tipo_transporte);
    addKeyValue('Data/Hora Solicitação', fmt(paciente.transporte?.data_hora_solicitacao));
    addKeyValue('Data/Hora Início', fmt(paciente.transporte?.data_hora_inicio));
    addKeyValue('Data/Hora Chegada ao Destino', fmt(paciente.transporte?.data_hora_chegada_destino || new Date().toISOString()));

    // Calcular tempo de transporte
    if (paciente.transporte?.data_hora_inicio) {
      const inicio = new Date(paciente.transporte.data_hora_inicio);
      const fim = new Date();
      const minutos = Math.round((fim - inicio) / 60000);
      addKeyValue('Tempo Total de Transporte', `${minutos} minutos`);
    }

    // INTERCORRÊNCIAS
    const intercorrenciasTexto = intercorrencias || paciente.transporte?.intercorrencias;
    const motivoTexto = motivo_intercorrencia || paciente.transporte?.motivo_intercorrencia;

    if (motivoTexto) {
      y += 4;
      doc.setFillColor(255, 220, 220);
      doc.rect(20, y - 4, pageWidth - 40, 6, 'F');
      addSectionTitle('⚠ INTERCORRÊNCIA REGISTRADA');
      addKeyValue('Motivo', motivoTexto);
      if (intercorrenciasTexto) addKeyValue('Descrição', intercorrenciasTexto);
      const acoesTexto = acoes_tomadas || paciente.transporte?.acoes_tomadas;
      if (acoesTexto) {
        y += 2;
        doc.setFillColor(220, 255, 220);
        doc.rect(20, y - 4, pageWidth - 40, 6, 'F');
        addSectionTitle('AÇÕES TOMADAS / SOLUÇÃO APLICADA');
        addKeyValue('Ações', acoesTexto);
      }
    } else if (intercorrenciasTexto) {
      addSectionTitle('OBSERVAÇÕES DO TRAJETO');
      addKeyValue('Detalhes', intercorrenciasTexto);
    }

    // SINAIS VITAIS (se disponíveis)
    if (paciente.triagem_medica) {
      addSectionTitle('SINAIS VITAIS NA ORIGEM');
      if (paciente.triagem_medica.pa_braco_esquerdo) addKeyValue('PA', paciente.triagem_medica.pa_braco_esquerdo);
      if (paciente.triagem_medica.frequencia_cardiaca) addKeyValue('FC', `${paciente.triagem_medica.frequencia_cardiaca} bpm`);
      if (paciente.triagem_medica.spo2) addKeyValue('SpO2', `${paciente.triagem_medica.spo2}%`);
      if (paciente.triagem_medica.glicemia_capilar) addKeyValue('Glicemia', `${paciente.triagem_medica.glicemia_capilar} mg/dL`);
    }

    // EQUIPE
    addSectionTitle('OPERADOR DO REGISTRO');
    addKeyValue('Registrado por', user.full_name);
    addKeyValue('Email', user.email);

    // RODAPÉ
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text('Sistema de Triagem de Dor Torácica - Coração Paraibano', 20, pageHeight - 12);
    doc.text('Desenvolvedor: Walber Alves Frazão Júnior - COREN 110.238', 20, pageHeight - 8);
    doc.text(`Gerado em: ${fmt(new Date().toISOString())}`, 20, pageHeight - 4);

    const pdfData = doc.output('arraybuffer');
    const pdfBlob = new Blob([pdfData], { type: 'application/pdf' });

    const uploadResult = await base44.integrations.Core.UploadFile({
      file: pdfBlob
    });

    return Response.json({
      success: true,
      file_url: uploadResult.file_url
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});