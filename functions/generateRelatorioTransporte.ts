import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pacienteId, motivo } = await req.json();

    // Buscar dados do paciente
    const pacientes = await base44.entities.Paciente.list();
    const paciente = pacientes.find(p => p.id === pacienteId);

    if (!paciente) {
      return Response.json({ error: 'Paciente não encontrado' }, { status: 404 });
    }

    // Criar PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Cabeçalho
    doc.setFontSize(16);
    doc.setTextColor(220, 38, 38);
    doc.text('RELATÓRIO DE TRANSPORTE', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 15;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, yPosition);

    yPosition += 15;
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text('DADOS DO PACIENTE', 20, yPosition);

    yPosition += 8;
    doc.setFontSize(10);
    const dadosPaciente = [
      `Nome: ${paciente.nome_completo}`,
      `Sexo: ${paciente.sexo}`,
      `Idade: ${paciente.idade} anos`,
      `Unidade de Saúde: ${paciente.unidade_saude}`,
      `Macrorregião: ${paciente.macrorregiao}`
    ];

    dadosPaciente.forEach(dado => {
      doc.text(dado, 20, yPosition);
      yPosition += 6;
    });

    yPosition += 5;
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text('INFORMAÇÕES DE TRANSPORTE', 20, yPosition);

    yPosition += 8;
    doc.setFontSize(10);
    const dadosTransporte = [
      `Central de Transporte: ${paciente.transporte?.central_transporte || 'Não informado'}`,
      `Tipo de Transporte: ${paciente.transporte?.tipo_transporte || 'Não informado'}`,
      `Data/Hora Solicitação: ${paciente.transporte?.data_hora_solicitacao ? new Date(paciente.transporte.data_hora_solicitacao).toLocaleString('pt-BR') : 'Não informado'}`,
      `Data/Hora Início: ${paciente.transporte?.data_hora_inicio ? new Date(paciente.transporte.data_hora_inicio).toLocaleString('pt-BR') : 'Não informado'}`,
      `Status: ${paciente.transporte?.status_transporte || 'Não informado'}`
    ];

    dadosTransporte.forEach(dado => {
      doc.text(dado, 20, yPosition);
      yPosition += 6;
    });

    if (paciente.transporte?.data_hora_chegada_destino) {
      doc.text(`Data/Hora Chegada Destino: ${new Date(paciente.transporte.data_hora_chegada_destino).toLocaleString('pt-BR')}`, 20, yPosition);
      yPosition += 6;
    }

    if (motivo) {
      yPosition += 5;
      doc.setFontSize(12);
      doc.setTextColor(220, 38, 38);
      doc.text('MOTIVO DA NÃO FINALIZAÇÃO', 20, yPosition);
      yPosition += 8;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      const motivoTexto = {
        'óbito_transporte': 'Óbito no Transporte',
        'sinistro_transito': 'Sinistro de Trânsito Impediu Deslocamento',
        'paciente_nao_sera_encaminhado': 'Paciente Não Será Mais Encaminhado',
        'outro': 'Outro'
      };
      
      doc.text(`Motivo: ${motivoTexto[motivo] || motivo}`, 20, yPosition);
    }

    if (paciente.transporte?.intercorrencias) {
      yPosition += 10;
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      doc.text('INTERCORRÊNCIAS', 20, yPosition);
      yPosition += 8;
      doc.setFontSize(10);
      const linhas = doc.splitTextToSize(paciente.transporte.intercorrencias, 170);
      doc.text(linhas, 20, yPosition);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, pageHeight - 10);
    doc.text(`Profissional: ${user.full_name}`, 20, pageHeight - 5);

    // Converter para base64
    const pdfData = doc.output('arraybuffer');
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfData)));

    // Fazer upload do arquivo
    const uploadResult = await base44.integrations.Core.UploadFile({
      file: `data:application/pdf;base64,${pdfBase64}`
    });

    return Response.json({ 
      success: true,
      file_url: uploadResult.file_url
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});