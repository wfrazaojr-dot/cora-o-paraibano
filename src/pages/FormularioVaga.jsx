import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUp, Send, Download, X, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

export default function FormularioVaga() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const pacienteId = urlParams.get('id');

  const [formData, setFormData] = useState({
    data_solicitacao: new Date().toISOString().split('T')[0],
    especialidade_solicitada: "",
    nome_completo: "",
    data_nascimento: "",
    idade: "",
    sexo: "",
    nome_mae: "",
    local_nascimento: "",
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

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: paciente } = useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: () => base44.entities.Paciente.list().then(list => list.find(p => p.id === pacienteId)),
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
    const fileUrls = results.map((r, i) => ({ url: r.file_url, nome: files[i].name }));
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
    let y = 20;

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

    // Cabeçalho
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

    // Documentos
    titulo("DOCUMENTOS ANEXADOS");
    if (formData.documentos.length > 0) {
      formData.documentos.forEach((doc, i) => {
        addRow([[`Documento ${i + 1}`, doc.nome || doc.url]]);
      });
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
      const emailCERH = getEmailCERH();
      const urlFormulario = pdfUrl ? `\n\n🔗 Link do Formulário PDF:\n${pdfUrl}` : "";

      const emailBody = `FORMULÁRIO DE SOLICITAÇÃO DE VAGA
Data: ${new Date(formData.data_solicitacao).toLocaleDateString('pt-BR')}
Macrorregião: ${getMacro()}

ESPECIALIDADE: ${formData.especialidade_solicitada}

PACIENTE: ${getNomePaciente()}
Nascimento: ${formData.data_nascimento ? new Date(formData.data_nascimento + 'T12:00:00').toLocaleDateString('pt-BR') : ""}  |  Idade: ${formData.idade || paciente?.idade || ""} anos  |  Sexo: ${formData.sexo || paciente?.sexo || ""}
Nome da Mãe: ${formData.nome_mae}
RG: ${formData.rg} ${formData.uf_rg}  |  CPF: ${formData.cpf}  |  CNS: ${formData.cns}
Endereço: ${formData.endereco}
Tel. Responsável: ${formData.telefone_responsavel}

UNIDADE SOLICITANTE: ${getUnidade()}
Admissão: ${formData.data_hora_admissao ? new Date(formData.data_hora_admissao).toLocaleString('pt-BR') : ""}

HIPÓTESE DIAGNÓSTICA: ${formData.hipotese_diagnostica}
Alergia: ${formData.alergia === 'Nega' ? 'Nega' : 'Sim - ' + formData.alergia_descricao}
Medicações: ${formData.medicacoes_uso_continuo === 'NÃO SABE INFORMAR' ? 'NÃO SABE INFORMAR' : formData.medicacoes_descricao}
Comorbidades: ${[...formData.comorbidades, formData.comorbidades_outras].filter(Boolean).join(', ') || "Nenhuma"}

SOLICITA LEITO DE: ${formData.solicita_leito}
Médico Solicitante: ${formData.medico_solicitante}  |  CRM: ${formData.crm_solicitante}
${urlFormulario}
---
Enviado via Sistema Coração Paraibano
Solicitante: ${user?.full_name} (${user?.email})`;

      await base44.integrations.Core.SendEmail({
        to: emailCERH,
        subject: `[FORMULÁRIO/VAGA] ${getNomePaciente()} - ${getUnidade()}`,
        body: emailBody
      });

      if (pacienteId && paciente) {
        await base44.entities.Paciente.update(pacienteId, {
          alerta_formulario_vaga: false,
          formulario_vaga: {
            ...formData,
            data_envio: new Date().toISOString(),
            enviado_por: user?.full_name || user?.email
          }
        });
      }
    },
    onSuccess: () => {
      toast.success(`✅ Solicitação enviada com sucesso para ${getEmailCERH()}!`);
      setTimeout(() => navigate(createPageUrl("Historico")), 2000);
    },
    onError: (error) => {
      toast.error("Erro ao enviar: " + error.message);
    }
  });

  const abrirEmailCliente = () => {
    const emailCERH = getEmailCERH();
    const assunto = encodeURIComponent(`[FORMULÁRIO/VAGA] ${getNomePaciente()} - ${getUnidade()}`);
    const linkPDF = pdfUrl ? `\n\n🔗 Link do Formulário PDF (para download):\n${pdfUrl}\n` : "\n\n⚠️ Gere e baixe o PDF antes de enviar e o anexe neste e-mail.\n";
    const corpo = encodeURIComponent(
      `Prezados,\n\nSegue solicitação de vaga do paciente ${getNomePaciente()}.\n\nMacrorregião: ${getMacro()}\nUnidade: ${getUnidade()}\nEspecialidade: ${formData.especialidade_solicitada}\nHipótese Diagnóstica: ${formData.hipotese_diagnostica}${linkPDF}\nAtenciosamente,\n${user?.full_name || ""}\n${getUnidade()}`
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

  return (
    <div className="bg-gradient-to-br from-blue-50 to-green-50 min-h-screen">
      {/* Cabeçalho com logomarcas */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-center gap-6 md:gap-10 flex-wrap">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/8e093c8da_logoSecretariadeEstadodaSade.png"
            alt="Secretaria de Estado da Saúde"
            className="h-12 md:h-16 w-auto object-contain"
          />
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/fa5f3a17e_LOGOCORAAOPARAIBANO.png"
            alt="Coração Paraibano"
            className="h-12 md:h-16 w-auto object-contain"
          />
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/873a4a563_logo.png"
            alt="PBSAÚDE"
            className="h-12 md:h-16 w-auto object-contain"
          />
        </div>
      </div>

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
                <p className="text-sm font-bold text-amber-900">📧 Destinatário CERH ({getMacro()}):</p>
                <p className="text-base font-bold text-blue-700">{getEmailCERH()}</p>
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
              <h3 className="text-base font-bold mb-3 border-b pb-2 text-blue-900">ESPECIALIDADE SOLICITADA *</h3>
              <Select value={formData.especialidade_solicitada} onValueChange={(v) => setFormData({...formData, especialidade_solicitada: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione a especialidade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CARDIOLOGIA">CARDIOLOGIA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dados Pessoais */}
            <div>
              <h3 className="text-base font-bold mb-3 border-b pb-2 text-blue-900">DADOS PESSOAIS</h3>
              {paciente && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 grid md:grid-cols-3 gap-3">
                  <div className="md:col-span-3">
                    <span className="text-xs text-blue-600 font-semibold uppercase">Nome Completo</span>
                    <p className="font-bold text-gray-900">{paciente.nome_completo}</p>
                  </div>
                  <div>
                    <span className="text-xs text-blue-600 font-semibold uppercase">Data de Nascimento</span>
                    <p className="text-gray-900">{paciente.data_nascimento ? new Date(paciente.data_nascimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-blue-600 font-semibold uppercase">Idade</span>
                    <p className="text-gray-900">{paciente.idade ? `${paciente.idade} anos` : '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-blue-600 font-semibold uppercase">Sexo</span>
                    <p className="text-gray-900">{paciente.sexo || '—'}</p>
                  </div>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                {!paciente && (
                  <>
                    <div className="md:col-span-2">
                      <Label>Nome Completo *</Label>
                      <Input value={formData.nome_completo} onChange={(e) => setFormData({...formData, nome_completo: e.target.value})} required />
                    </div>
                    <div>
                      <Label>Data de Nascimento</Label>
                      <Input type="date" value={formData.data_nascimento} onChange={(e) => {
                        const novaData = e.target.value;
                        setFormData({...formData, data_nascimento: novaData, idade: calcularIdade(novaData)});
                      }} />
                    </div>
                    <div>
                      <Label>Idade</Label>
                      <Input type="number" value={formData.idade} onChange={(e) => setFormData({...formData, idade: e.target.value})} />
                    </div>
                    <div>
                      <Label>Sexo</Label>
                      <Select value={formData.sexo} onValueChange={(v) => setFormData({...formData, sexo: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Masculino">Masculino</SelectItem>
                          <SelectItem value="Feminino">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <div>
                  <Label>Nome da Mãe</Label>
                  <Input value={formData.nome_mae} onChange={(e) => setFormData({...formData, nome_mae: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <Label>Local de Nascimento</Label>
                  <Input value={formData.local_nascimento} onChange={(e) => setFormData({...formData, local_nascimento: e.target.value})} />
                </div>
                <div>
                  <Label>RG nº</Label>
                  <Input value={formData.rg} onChange={(e) => setFormData({...formData, rg: e.target.value})} />
                </div>
                <div>
                  <Label>UF</Label>
                  <Input value={formData.uf_rg} onChange={(e) => setFormData({...formData, uf_rg: e.target.value})} maxLength={2} />
                </div>
                <div>
                  <Label>CPF nº</Label>
                  <Input value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: formatarCPF(e.target.value)})} maxLength={14} />
                </div>
                <div>
                  <Label>CNS nº</Label>
                  <Input value={formData.cns} onChange={(e) => setFormData({...formData, cns: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <Label>Endereço Completo</Label>
                  <Input value={formData.endereco} onChange={(e) => setFormData({...formData, endereco: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <Label>Telefone de Contato do Responsável</Label>
                  <Input value={formData.telefone_responsavel} onChange={(e) => setFormData({...formData, telefone_responsavel: formatarTelefone(e.target.value)})} maxLength={14} placeholder="83 98877-3344" />
                </div>
              </div>
            </div>

            {/* Dados da Unidade */}
            <div>
              <h3 className="text-base font-bold mb-3 border-b pb-2 text-blue-900">DADOS DA UNIDADE</h3>
              {paciente ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 grid md:grid-cols-3 gap-3">
                  <div>
                    <span className="text-xs text-blue-600 font-semibold uppercase">Unidade Solicitante</span>
                    <p className="font-bold text-gray-900">{paciente.unidade_saude || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-blue-600 font-semibold uppercase">Macrorregião</span>
                    <p className="font-bold text-gray-900">{paciente.macrorregiao || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-blue-600 font-semibold uppercase">Data e Horário da Admissão</span>
                    <p className="text-gray-900">{paciente.data_hora_chegada ? new Date(paciente.data_hora_chegada).toLocaleString('pt-BR') : '—'}</p>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Unidade Solicitante *</Label>
                    <Input value={formData.unidade_solicitante} onChange={(e) => setFormData({...formData, unidade_solicitante: e.target.value})} required />
                  </div>
                  <div>
                    <Label>Data e Horário da Admissão</Label>
                    <Input type="datetime-local" value={formData.data_hora_admissao} onChange={(e) => setFormData({...formData, data_hora_admissao: e.target.value})} />
                  </div>
                </div>
              )}
            </div>

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
            <div>
              <h3 className="text-base font-bold mb-3 border-b pb-2 text-blue-900">DOCUMENTOS DO PACIENTE (máx. 4 arquivos)</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors mb-4">
                <input type="file" id="file-upload" multiple onChange={handleFileUpload} className="hidden" accept=".pdf,.jpg,.jpeg,.gif,.png" disabled={formData.documentos.length >= 4} />
                <label htmlFor="file-upload" className={`cursor-pointer ${formData.documentos.length >= 4 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <FileUp className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">{formData.documentos.length >= 4 ? 'Limite atingido' : 'Clique para adicionar documentos'}</p>
                  <p className="text-xs text-gray-500">PDF, JPG, PNG</p>
                </label>
              </div>
              {uploadingFiles && <p className="text-blue-600 text-sm text-center mb-2">Enviando arquivos...</p>}
              {formData.documentos.length > 0 && (
                <div className="space-y-2">
                  {formData.documentos.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                      <span className="text-sm text-green-900 font-medium truncate flex-1">{doc.nome || `Documento ${idx + 1}`}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removerDocumento(idx)} className="text-red-600 hover:text-red-800">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

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