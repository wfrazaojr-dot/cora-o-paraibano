/**
 * Utilitário de Assinatura Digital para documentos do CARDIOPB.
 * Gera um código de confirmação único e registra no banco para auditoria.
 */

function hexAleatorio(tamanho = 4) {
  const chars = '0123456789ABCDEF';
  let result = '';
  for (let i = 0; i < tamanho; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Gera um código de confirmação no formato: TIPO-XXXX-XXXX
 * Ex: TRI-A3F7-9B2C, TRA-D4E1-7F3A, TRO-8C2B-1A6D
 */
export function gerarCodigoConfirmacao(documentoTipo) {
  const prefixo = documentoTipo.substring(0, 3).toUpperCase();
  return `${prefixo}-${hexAleatorio(4)}-${hexAleatorio(4)}`;
}

/**
 * Registra uma assinatura digital e retorna o código de confirmação.
 * @param {object} base44 - Instância do SDK
 * @param {object} params
 * @param {string} params.documentoTipo - Tipo do documento (triagem, transporte, trombolise, etc.)
 * @param {string} params.documentoId - ID do registro relacionado
 * @param {object} params.usuario - Objeto do usuário {id, full_name, email}
 * @param {string} [params.pacienteNome] - Nome do paciente (opcional)
 * @param {object} [params.metadata] - Metadados extras (opcional)
 * @returns {Promise<string>} Código de confirmação gerado
 */
export async function registrarAssinatura(base44, { documentoTipo, documentoId, usuario, pacienteNome, metadata }) {
  const codigo = gerarCodigoConfirmacao(documentoTipo);
  
  await base44.entities.AssinaturaDigital.create({
    documento_tipo: documentoTipo,
    documento_id: documentoId || '',
    hash_confirmacao: codigo,
    usuario_nome: usuario.full_name || usuario.email || 'Sistema',
    usuario_email: usuario.email || '',
    usuario_id: usuario.id || '',
    paciente_nome: pacienteNome || '',
    metadata: metadata || {},
  });

  return codigo;
}

/**
 * Renderiza o rodapé de assinatura digital em um PDF jsPDF.
 * @param {jsPDF} doc - Instância do jsPDF
 * @param {number} pageWidth - Largura da página
 * @param {number} pageHeight - Altura da página
 * @param {number} margin - Margem lateral
 * @param {string} codigo - Código de confirmação
 */
export function renderizarRodapeAssinatura(doc, pageWidth, pageHeight, margin, codigo) {
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cardiopb.base44.app';
  doc.setDrawColor(76, 175, 80);
  doc.setLineWidth(0.3);
  doc.line(margin, pageHeight - 22, pageWidth - margin, pageHeight - 22);
  
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSINATURA DIGITAL CARDIOPB', pageWidth / 2, pageHeight - 17, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text(`Código de Confirmação: ${codigo}`, pageWidth / 2, pageHeight - 12, { align: 'center' });
  
  doc.setFontSize(6);
  doc.setTextColor(120, 120, 120);
  doc.text(`Verifique a autenticidade em: ${appUrl}/verificar?codigo=${codigo}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
}