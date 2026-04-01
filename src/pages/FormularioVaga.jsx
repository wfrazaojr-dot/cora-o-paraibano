import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Download, Send } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import SecaoDadosPessoais from "@/components/formularioVaga/SecaoDadosPessoais";
import SecaoDadosUnidade from "@/components/formularioVaga/SecaoDadosUnidade";
import SecaoDocumentos from "@/components/formularioVaga/SecaoDocumentos";

export default function FormularioVaga() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const pacienteId = urlParams.get('id');

  const [formData, setFormData] = useState({
    data_solicitacao: new Date().toISOString().split('T')[0],
    especialidade_solicitada: "CARDIOLOGIA",
    nome_completo: "",
    data_nascimento: "",
    idade: "",
    sexo: "",
    nome_mae: "",
    local_nascimento: "",
    local_nascimento_uf: "",
    local_nascimento_cidade: "",
    rg: "",
    uf_rg: "",
    cpf: "",
    cns: "",
    endereco: "",
    telefone_responsavel: "",
    unidade_solicitante: "",
    data_hora_admissao: "",
    hipotese_diagnostica: "",
    alergia: "Nega",
    alergia_descricao: "",
    medicacoes_uso_continuo: "NÃO SABE INFORMAR",
    medicacoes_descricao: "",
    comorbidades: [],
    comorbidades_outras: "",
    solicita_leito: "",
    medico_solicitante: "",
    crm_solicitante: "",
    documentos: []
  });

  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [pdfGerado, setPdfGerado] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  // Chave única para rascunho no localStorage
  const rascunhoKey = `formulario_vaga_rascunho_${pacienteId || 'novo'}`;

  // Restaurar rascunho do localStorage ao montar (apenas campos livres, não os do paciente)
  useEffect(() => {
    const rascunho = localStorage.getItem(rascunhoKey);
    if (rascunho) {
      try {
        const dados = JSON.parse(rascunho);
        setFormData(prev => ({ ...prev, ...dados }));
      } catch {}
    }
  }, [rascunhoKey]);

  // Salvar rascunho automaticamente a cada mudança no formData
  useEffect(() => {
    // Não salvar documentos no localStorage (URLs já estão no servidor)
    const { documentos, ...dadosSemDocs } = formData;
    localStorage.setItem(rascunhoKey, JSON.stringify(dadosSemDocs));
  }, [formData, rascunhoKey]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: paciente, isLoading: loadingPaciente } = useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: () => base44.entities.Paciente.filter({ id: pacienteId }).then(list => list[0]),
    enabled: !!pacienteId,
  });

  useEffect(() => {
    if (paciente) {
      if (paciente.formulario_vaga?.data_envio) {
        const fv = paciente.formulario_vaga;
        setFormData(prev => ({
          ...prev,
          especialidade_solicitada: fv.especialidade_solicitada || "",
          nome_completo: fv.nome_completo || paciente.nome_completo || "",
          data_nascimento: fv.data_nascimento || paciente.data_nascimento || "",
          idade: fv.idade || paciente.idade?.toString() || "",
          sexo: fv.sexo || paciente.sexo || "",
          nome_mae: fv.nome_mae || "",
          local_nascimento: fv.local_nascimento || "",
          local_nascimento_uf: fv.local_nascimento_uf || "",
          local_nascimento_cidade: fv.local_nascimento_cidade || "",
          rg: fv.rg || "",
          uf_rg: fv.uf_rg || "",
          cpf: fv.cpf || "",
          cns: fv.cns || "",
          endereco: fv.endereco || "",
          telefone_responsavel: fv.telefone_responsavel || "",
          unidade_solicitante: fv.unidade_solicitante || paciente.unidade_saude || "",
          data_hora_admissao: fv.data_hora_admissao || paciente.data_hora_chegada || "",
          hipotese_diagnostica: fv.hipotese_diagnostica || paciente.avaliacao_clinica?.hipotese_diagnostica || "",
          alergia: fv.alergia || "Nega",
          alergia_descricao: fv.alergia_descricao || "",
          medicacoes_uso_continuo: fv.medicacoes_uso_continuo || "NÃO SABE INFORMAR",
          medicacoes_descricao: fv.medicacoes_descricao || "",
          comorbidades: fv.comorbidades || [],
          comorbidades_outras: fv.comorbidades_outras || "",
          medico_solicitante: fv.medico_solicitante || "",
          crm_solicitante: fv.crm_solicitante || "",
          documentos: fv.documentos || [],
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          nome_completo: paciente.nome_completo || "",
          data_nascimento: paciente.data_nascimento || "",
          idade: paciente.idade?.toString() || "",
          sexo: paciente.sexo || "",
          unidade_solicitante: paciente.unidade_saude || "",
          data_hora_admissao: paciente.data_hora_chegada || "",
          hipotese_diagnostica: paciente.avaliacao_clinica?.hipotese_diagnostica || "",
        }));
      }
    }
  }, [paciente]);

  const calcularIdade = (dataNascimento) => {
    if (!dataNascimento) return "";
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) idade--;
    return idade.toString();
  };

  const formatarCPF = (valor) => {
    const n = valor.replace(/\D/g, '');
    if (n.length <= 3) return n;
    if (n.length <= 6) return `${n.slice(0,3)}.${n.slice(3)}`;
    if (n.length <= 9) return `${n.slice(0,3)}.${n.slice(3,6)}.${n.slice(6)}`;
    return `${n.slice(0,3)}.${n.slice(3,6)}.${n.slice(6,9)}-${n.slice(9,11)}`;
  };

  const formatarTelefone = (valor) => {
    const n = valor.replace(/\D/g, '');
    if (n.length <= 2) return n;
    if (n.length <= 7) return `${n.slice(0,2)} ${n.slice(2)}`;
    if (n.length <= 11) return `${n.slice(0,2)} ${n.slice(2,7)}-${n.slice(7)}`;
    return `${n.slice(0,2)} ${n.slice(2,7)}-${n.slice(7,11)}`;
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (formData.documentos.length + files.length > 4) {
      toast.error("Você pode adicionar no máximo 4 arquivos!");
      return;
    }
    setUploadingFiles(true);
    const results = await Promise.all(files.map(file => base44.integrations.Core.UploadFile({ file })));
    const fileUrls = results.map((r, i) => ({ file_url: r.file_url, nome: files[i].name }));
    setFormData(prev => ({ ...prev, documentos: [...prev.documentos, ...fileUrls] }));
    toast.success(`${files.length} arquivo(s) enviado(s) com sucesso!`);
    setUploadingFiles(false);
  };

  const removerDocumento = (index) => {
    setFormData(prev => ({ ...prev, documentos: prev.documentos.filter((_, i) => i !== index) }));
  };

  const getEmailCERH = () => {
    const macro = paciente?.macrorregiao || "";
    if (macro === "Macro 1") return "cerh.pb@regulacaopb.com";
    if (macro === "Macro 2") return "regulacao@saude.pb.gov.br";
    if (macro === "Macro 3") return "cerhpb3macro@saude.pb.gov.br";
    return "cerh.pb@regulacaopb.com";
  };

  const getNomePaciente = () => formData.nome_completo || paciente?.nome_completo || "Paciente";
  const getUnidade = () => formData.unidade_solicitante || paciente?.unidade_saude || "";
  const getMacro = () => paciente?.macrorregiao || "Não definida";

  // Gera PDF com jsPDF puro (texto estruturado, sem html2canvas)
  const gerarPDFDoc = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = pdf.internal.pageSize.getWidth();
    const margin = 15;
    const contentW = pageW - margin * 2;
    let y = 10;

    const linha = () => {
      pdf.setDrawColor(180, 180, 180);
      pdf.line(margin, y, pageW - margin, y);
      y += 4;
    };

    const titulo = (texto) => {
      pdf.setFillColor(220, 230, 245);
      pdf.rect(margin, y - 1, contentW, 8, 'F');
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(30, 50, 100);
      pdf.text(texto, margin + 2, y + 5);
      pdf.setTextColor(0, 0, 0);
      y += 11;
    };

    const campo = (label, valor, col = 0, totalCols = 1) => {
      const colW = contentW / totalCols;
      const x = margin + col * colW;
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'bold');
      pdf.text(label + ":", x, y);
      pdf.setFont(undefined, 'normal');
      const texto = valor || "—";
      const lines = pdf.splitTextToSize(texto, colW - 5);
      pdf.text(lines, x, y + 4);
      return lines.length * 4 + 6;
    };

    const addRow = (items) => {
      let maxH = 0;
      items.forEach(([label, valor], i) => {
        const h = campo(label, valor, i, items.length);
        if (h > maxH) maxH = h;
      });
      y += maxH;
      if (y > 270) { pdf.addPage(); y = 20; }
    };

    // Cabeçalho com logomarcas (como imagem base64 via URL)
    const logoGov = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/8e093c8da_logoSecretariadeEstadodaSade.png";
    const logoCoracao = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/fa5f3a17e_LOGOCORAAOPARAIBANO.png";
    const logoComplexo = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/006e0d9aa_LogoComplexoregulador.jpg";

    // Tenta adicionar logos (pode falhar em alguns ambientes por CORS, então captura o erro)
    try {
      pdf.addImage(logoGov, 'PNG', margin, y, 45, 16);
      pdf.addImage(logoCoracao, 'PNG', (pageW / 2) - 20, y, 40, 16);
      pdf.addImage(logoComplexo, 'JPG', pageW - margin - 45, y, 45, 16);
      y += 20;
    } catch {
      y += 4;
    }

    linha();
    pdf.setFontSize(13);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(30, 50, 100);
    pdf.text("FORMULÁRIO DE SOLICITAÇÃO DE VAGA", pageW / 2, y, { align: 'center' });
    y += 6;
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(80, 80, 80);
    pdf.text("Governo da Paraíba | Coração Paraibano | Complexo Regulador", pageW / 2, y, { align: 'center' });
    y += 4;
    pdf.text(`Data da Solicitação: ${new Date(formData.data_solicitacao).toLocaleDateString('pt-BR')}`, pageW / 2, y, { align: 'center' });
    y += 6;
    linha();

    // Especialidade
    titulo("ESPECIALIDADE SOLICITADA");
    addRow([["Especialidade", formData.especialidade_solicitada]]);
    y += 2;

    // Dados Pessoais
    titulo("DADOS PESSOAIS");
    addRow([["Nome Completo", getNomePaciente()]]);
    addRow([
      ["Data de Nascimento", formData.data_nascimento ? new Date(formData.data_nascimento + 'T12:00:00').toLocaleDateString('pt-BR') : paciente?.data_nascimento ? new Date(paciente.data_nascimento + 'T12:00:00').toLocaleDateString('pt-BR') : ""],
      ["Idade", (formData.idade || paciente?.idade?.toString() || "") + " anos"],
      ["Sexo", formData.sexo || paciente?.sexo || ""]
    ]);
    addRow([["Nome da Mãe", formData.nome_mae], ["Local de Nascimento", formData.local_nascimento]]);
    addRow([["RG nº", formData.rg], ["UF", formData.uf_rg], ["CPF", formData.cpf]]);
    addRow([["CNS nº", formData.cns], ["Telefone do Responsável", formData.telefone_responsavel]]);
    addRow([["Endereço Completo", formData.endereco]]);
    y += 2;

    // Dados da Unidade
    titulo("DADOS DA UNIDADE");
    addRow([
      ["Unidade Solicitante", getUnidade()],
      ["Macrorregião", getMacro()]
    ]);
    addRow([["Data e Horário da Admissão", formData.data_hora_admissao ? new Date(formData.data_hora_admissao).toLocaleString('pt-BR') : paciente?.data_hora_chegada ? new Date(paciente.data_hora_chegada).toLocaleString('pt-BR') : ""]]);
    y += 2;

    // Dados Clínicos
    titulo("DADOS CLÍNICOS");
    addRow([["Hipótese Diagnóstica", formData.hipotese_diagnostica]]);
    addRow([
      ["Alergia", formData.alergia === 'Nega' ? 'Nega' : `Sim: ${formData.alergia_descricao}`],
      ["Medicações de Uso Contínuo", formData.medicacoes_uso_continuo === 'NÃO SABE INFORMAR' ? 'NÃO SABE INFORMAR' : formData.medicacoes_descricao]
    ]);
    addRow([["Comorbidades", [...formData.comorbidades, formData.comorbidades_outras].filter(Boolean).join(', ') || "Nenhuma"]]);
    y += 2;

    // Solicitação
    titulo("SOLICITAÇÃO");
    addRow([["Solicita Leito de", formData.solicita_leito]]);
    addRow([["Médico Solicitante", formData.medico_solicitante], ["CRM", formData.crm_solicitante]]);
    y += 2;

    // Documentos (com imagens se disponíveis)
    titulo("DOCUMENTOS ANEXADOS");
    if (formData.documentos.length > 0) {
      for (let i = 0; i < formData.documentos.length; i++) {
        const doc = formData.documentos[i];
        const isImage = doc.file_url && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(doc.file_url);
        
        addRow([[`Documento ${i + 1}`, doc.nome || `Arquivo ${i + 1}`]]);
        
        if (isImage && doc.file_url) {
          try {
            // Adiciona imagem ao PDF
            if (y > 200) { pdf.addPage(); y = 20; }
            const imgWidth = contentW;
            const imgHeight = 80; // Altura máxima da imagem
            pdf.addImage(doc.file_url, 'JPEG', margin, y, imgWidth, imgHeight, undefined, 'FAST');
            y += imgHeight + 4;
            if (y > 270) { pdf.addPage(); y = 20; }
          } catch (err) {
            // Se falhar ao adicionar imagem, apenas mostra o link
            addRow([[`Link`, doc.file_url]]);
          }
        } else {
          addRow([[`Link`, doc.file_url]]);
        }
      }
    } else {
      addRow([["Documentos", "Nenhum documento anexado"]]);
    }
    y += 4;

    // Rodapé
    linha();
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont(undefined, 'italic');
    pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')} | Solicitante: ${user?.full_name || ""} (${user?.email || ""})`, margin, y);
    pdf.text(`CERH Destinatária (${getMacro()}): ${getEmailCERH()}`, margin, y + 5);

    return pdf;
  };

  const handleDownloadPDF = async () => {
    setGerandoPDF(true);
    const pdf = gerarPDFDoc();
    const nomeArquivo = `Formulario_Vaga_${getNomePaciente().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Upload para nuvem e salva URL
    const pdfBlob = pdf.output('blob');
    const file = new File([pdfBlob], nomeArquivo, { type: 'application/pdf' });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPdfUrl(file_url);
    setPdfGerado(true);

    // Download local
    pdf.save(nomeArquivo);
    toast.success("📄 PDF gerado e baixado com sucesso!");
    setGerandoPDF(false);
  };

  const enviarSolicitacao = useMutation({
    mutationFn: async () => {
      const dadosFormulario = {
        ...formData,
        nome_completo: formData.nome_completo || paciente?.nome_completo || "",
        data_nascimento: formData.data_nascimento || paciente?.data_nascimento || "",
        idade: formData.idade || paciente?.idade?.toString() || "",
        sexo: formData.sexo || paciente?.sexo || "",
        unidade_solicitante: formData.unidade_solicitante || paciente?.unidade_saude || "",
        data_envio: new Date().toISOString(),
        enviado_por: user?.full_name || user?.email,
        pdf_url: pdfUrl || ""
      };

      // 1. SALVA NO BANCO PRIMEIRO — independente do email
      if (pacienteId && paciente) {
        await base44.entities.Paciente.update(pacienteId, {
          alerta_formulario_vaga: true,
          formulario_vaga: dadosFormulario
        });
      }

      // 2. Tenta enviar email interno (pode falhar se destinatário for externo)
      try {
        const emailCERH = getEmailCERH();
        const classificacaoSCA = paciente?.triagem_medica?.tipo_sca === "SCACESST"
          ? "SCACESST (PRIORIDADE 0 - CRÍTICO)"
          : paciente?.triagem_medica?.tipo_sca === "SCASESST_COM_TROPONINA"
          ? "SCASESST c/ Troponina (Prioridade 1)"
          : paciente?.triagem_medica?.tipo_sca === "SCASESST_SEM_TROPONINA"
          ? "SCASESST s/ Troponina (Prioridade 2)"
          : "Não classificado";
        const urlFormulario = pdfUrl ? `\n\n🔗 Link do Formulário PDF:\n${pdfUrl}` : "";
        const statusAtual = paciente?.status || "Aguardando Regulação";
        const idPaciente = pacienteId || "Sem ID";

        const documentosLinks = formData.documentos.length > 0
          ? "\n\n📎 DOCUMENTOS ANEXADOS:\n" + formData.documentos.map((doc, idx) => `${idx + 1}. ${doc.nome || `Documento ${idx + 1}`}\n   🔗 ${doc.file_url}`).join("\n")
          : "";

        const emailBody = `FORMULÁRIO DE SOLICITAÇÃO DE VAGA - Sistema Coração Paraibano
Data/Hora: ${new Date().toLocaleString('pt-BR')} | Macrorregião: ${getMacro()} | ID: ${idPaciente}

PACIENTE: ${getNomePaciente()} | Idade: ${dadosFormulario.idade} anos | Sexo: ${dadosFormulario.sexo}
Nome da Mãe: ${formData.nome_mae || "—"} | RG: ${formData.rg || "—"} | CPF: ${formData.cpf || "—"} | CNS: ${formData.cns || "—"}
Endereço: ${formData.endereco || "—"} | Tel.: ${formData.telefone_responsavel || "—"}

UNIDADE: ${getUnidade()} | Admissão: ${formData.data_hora_admissao ? new Date(formData.data_hora_admissao).toLocaleString('pt-BR') : "—"}

CLÍNICO: ${classificacaoSCA} | Hipótese: ${formData.hipotese_diagnostica || "—"}
Alergia: ${formData.alergia === 'Nega' ? 'Nega' : 'Sim - ' + (formData.alergia_descricao || "")}
Medicações: ${formData.medicacoes_uso_continuo === 'NÃO SABE INFORMAR' ? 'NÃO SABE INFORMAR' : (formData.medicacoes_descricao || "—")}
Comorbidades: ${[...formData.comorbidades, formData.comorbidades_outras].filter(Boolean).join(', ') || "Nenhuma"}

SOLICITAÇÃO: Leito de ${formData.solicita_leito || "—"} | Médico: ${formData.medico_solicitante || "—"} CRM ${formData.crm_solicitante || "—"}
${urlFormulario}${documentosLinks}

Enviado por: ${user?.full_name} (${user?.email}) em ${new Date().toLocaleString('pt-BR')}`;

        await base44.integrations.Core.SendEmail({
          to: emailCERH,
          subject: `[VAGA] ${getNomePaciente()} | ${classificacaoSCA.split(" ")[0]} | ${statusAtual} | ${getUnidade()}`,
          body: emailBody
        });
      } catch (emailErr) {
        // Email falhou (destinatário externo), mas dados já foram salvos
        console.warn("Email não enviado pelo sistema (destinatário externo). Use o cliente de email.", emailErr.message);
      }
    },
    onSuccess: () => {
      // Limpar rascunho ao enviar com sucesso
      localStorage.removeItem(rascunhoKey);
      alert(`✅ Formulário registrado no sistema com sucesso!\n\nPaciente: ${getNomePaciente()}\nDestinatário CERH: ${getEmailCERH()}\n\nO cliente de e-mail será aberto para você enviar o formulário manualmente com o PDF anexado.`);
      navigate(createPageUrl("Historico"));
    },
    onError: (error) => {
      const msgTraduzida = error.message?.includes('Network') ? 'Erro de conexão. Verifique sua internet e tente novamente.'
        : error.message?.includes('permission') ? 'Você não tem permissão para realizar esta ação.'
        : error.message?.includes('not found') ? 'Paciente não encontrado no sistema.'
        : 'Não foi possível salvar o formulário. Tente novamente.';
      toast.error(msgTraduzida);
    }
  });

  const abrirEmailCliente = () => {
    const emailCERH = getEmailCERH();
    const classificacaoLocal = paciente?.triagem_medica?.tipo_sca === "SCACESST"
      ? "SCACESST"
      : paciente?.triagem_medica?.tipo_sca === "SCASESST_COM_TROPONINA"
      ? "SCASESST c/Troponina"
      : paciente?.triagem_medica?.tipo_sca === "SCASESST_SEM_TROPONINA"
      ? "SCASESST s/Troponina"
      : "SCA";
    const assunto = encodeURIComponent(`[VAGA] ${getNomePaciente()} | ${classificacaoLocal} | ${paciente?.status || "Aguardando Regulação"} | ${getUnidade()}`);
    const linkPDF = pdfUrl ? `\n\n🔗 Link do Formulário PDF (para download):\n${pdfUrl}\n` : "\n\n⚠️ Gere e baixe o PDF antes de enviar e o anexe neste e-mail.\n";
    const documentosLinksEmail = formData.documentos.length > 0
      ? "\n\n📎 DOCUMENTOS ANEXADOS:\n" + formData.documentos.map((doc, idx) => `${idx + 1}. ${doc.nome || `Documento ${idx + 1}`}\n   🔗 ${doc.file_url}`).join("\n")
      : "";
    const corpo = encodeURIComponent(
      `Prezados,\n\nSegue solicitação de vaga do paciente ${getNomePaciente()}.\n\nID no Sistema: ${pacienteId || "Sem ID"}\nStatus Atual: ${paciente?.status || "Aguardando Regulação"}\nClassificação: ${classificacaoLocal}\nMacrorregião: ${getMacro()}\nUnidade: ${getUnidade()}\nEspecialidade: ${formData.especialidade_solicitada}\nHipótese Diagnóstica: ${formData.hipotese_diagnostica}${linkPDF}${documentosLinksEmail}\n\nAtenciosamente,\n${user?.full_name || ""}\n${getUnidade()}`
    );
    window.open(`mailto:${emailCERH}?subject=${assunto}&body=${corpo}`, '_blank');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome_completo && !paciente?.nome_completo) {
      toast.error("Nome do paciente é obrigatório!");
      return;
    }
    if (!formData.especialidade_solicitada) {
      toast.error("Selecione a especialidade solicitada!");
      return;
    }
    if (!formData.medico_solicitante || !formData.crm_solicitante) {
      toast.error("Informe o médico solicitante e CRM!");
      return;
    }

    // Envia dados pelo sistema
    enviarSolicitacao.mutate();

    // Abre cliente de e-mail
    setTimeout(() => abrirEmailCliente(), 800);
  };

  if (pacienteId && loadingPaciente) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-blue-700 font-medium">Carregando dados do paciente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-green-50 min-h-screen">
      <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            📋 FORMULÁRIO DE SOLICITAÇÃO DE VAGA
          </h1>
          {paciente && (
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-900 font-semibold text-center">
                ⚠️ Preenchendo formulário para: <span className="font-bold">{paciente.nome_completo}</span>
              </p>
            </div>
          )}
          {/* Alerta com e-mail destino */}
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-900">📧 Destinatário CERH:</p>
                <p className="text-base font-bold text-blue-700">{getEmailCERH()}</p>
                <p className="text-xs text-amber-800 mt-1">
                  📍 <strong>Macrorregião:</strong>{" "}
                  {paciente?.macrorregiao === "Macro 1" && <span>Macro 1 — CERH Central (João Pessoa)</span>}
                  {paciente?.macrorregiao === "Macro 2" && <span>Macro 2 — CERH Campina Grande</span>}
                  {paciente?.macrorregiao === "Macro 3" && <span>Macro 3 — CERH Patos / Sousa</span>}
                  {!paciente?.macrorregiao && <span className="text-red-700">Não definida — verifique o cadastro do paciente</span>}
                </p>
                <ol className="text-xs text-amber-800 mt-2 space-y-1 list-decimal list-inside">
                  <li>Preencha o formulário abaixo</li>
                  <li>Clique em <strong>"📥 Baixar PDF"</strong> para gerar e salvar o formulário</li>
                  <li>Clique em <strong>"📨 Finalizar e Enviar"</strong> — o e-mail será aberto com o destinatário já preenchido</li>
                  <li><strong>Anexe o PDF baixado</strong> ao e-mail antes de enviar</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Especialidade */}
            <div>
              <h3 className="text-base font-bold mb-3 border-b pb-2 text-blue-900">ESPECIALIDADE SOLICITADA</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <p className="font-bold text-blue-900">CARDIOLOGIA</p>
              </div>
            </div>

            {/* Dados Pessoais */}
            <SecaoDadosPessoais
              formData={formData}
              setFormData={setFormData}
              paciente={paciente}
              calcularIdade={calcularIdade}
              formatarCPF={formatarCPF}
              formatarTelefone={formatarTelefone}
            />

            {/* Dados da Unidade */}
            <SecaoDadosUnidade formData={formData} setFormData={setFormData} paciente={paciente} />

            {/* Solicitação */}
            <div>
              <h3 className="text-base font-bold mb-3 border-b pb-2 text-blue-900">SOLICITAÇÃO</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Médico Solicitante *</Label>
                  <Input value={formData.medico_solicitante} onChange={(e) => setFormData({...formData, medico_solicitante: e.target.value})} required />
                </div>
                <div>
                  <Label>CRM *</Label>
                  <Input value={formData.crm_solicitante} onChange={(e) => setFormData({...formData, crm_solicitante: e.target.value})} required />
                </div>
              </div>
            </div>

            {/* Upload de Documentos */}
            <SecaoDocumentos
              formData={formData}
              handleFileUpload={handleFileUpload}
              removerDocumento={removerDocumento}
              uploadingFiles={uploadingFiles}
            />

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                onClick={handleDownloadPDF}
                disabled={gerandoPDF}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {gerandoPDF ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                {gerandoPDF ? "Gerando PDF..." : "📥 Baixar PDF do Formulário"}
              </Button>
              <Button
                type="submit"
                disabled={enviarSolicitacao.isPending || uploadingFiles}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {enviarSolicitacao.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                {enviarSolicitacao.isPending ? "Enviando..." : "📨 Finalizar e Enviar"}
              </Button>
            </div>

            {pdfGerado && pdfUrl && (
              <div className="bg-green-50 border border-green-300 rounded-lg p-3 text-center">
                <p className="text-sm text-green-800 font-semibold">✅ PDF gerado! Link salvo e incluído no e-mail.</p>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline break-all">{pdfUrl}</a>
              </div>
            )}

          </form>
        </div>
      </div>
      </div>
    </div>
  );
}