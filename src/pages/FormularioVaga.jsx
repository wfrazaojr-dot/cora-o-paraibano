import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUp, Send, Download, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function FormularioVaga() {
  const navigate = useNavigate();
  const formRef = useRef(null);
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
      // Se já existe um formulário salvo, carrega todos os dados dele
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
        // Novo formulário: preenche apenas os dados básicos do paciente
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
    try {
      const results = await Promise.all(files.map(file => base44.integrations.Core.UploadFile({ file })));
      const fileUrls = results.map((r, i) => ({ url: r.file_url, nome: files[i].name }));
      setFormData(prev => ({ ...prev, documentos: [...prev.documentos, ...fileUrls] }));
      toast.success(`${files.length} arquivo(s) enviado(s) com sucesso!`);
    } catch (error) {
      toast.error("Erro ao enviar arquivos: " + error.message);
    } finally {
      setUploadingFiles(false);
    }
  };

  const removerDocumento = (index) => {
    setFormData(prev => ({ ...prev, documentos: prev.documentos.filter((_, i) => i !== index) }));
    toast.success("Documento removido");
  };

  const gerarPDF = async () => {
    if (!formRef.current) return;
    setGerandoPDF(true);
    try {
      const canvas = await html2canvas(formRef.current, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
      const imgX = (pdfWidth - canvas.width * ratio) / 2;
      pdf.addImage(imgData, 'PNG', imgX, 0, canvas.width * ratio, canvas.height * ratio);
      pdf.save(`Formulario_Vaga_${formData.nome_completo}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF baixado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar PDF: " + error.message);
    } finally {
      setGerandoPDF(false);
    }
  };

  const enviarSolicitacao = useMutation({
    mutationFn: async () => {
      const emailBody = `
FORMULÁRIO DE SOLICITAÇÃO DE VAGA
Data da Solicitação: ${new Date(formData.data_solicitacao).toLocaleDateString('pt-BR')}

ESPECIALIDADE SOLICITADA: ${formData.especialidade_solicitada}

===== DADOS PESSOAIS =====
Nome Completo: ${formData.nome_completo}
Data de Nascimento: ${formData.data_nascimento ? new Date(formData.data_nascimento).toLocaleDateString('pt-BR') : ''}
Idade: ${formData.idade} anos
Sexo: ${formData.sexo}
Nome da Mãe: ${formData.nome_mae}
Local de Nascimento: ${formData.local_nascimento}
RG: ${formData.rg} - UF: ${formData.uf_rg}
CPF: ${formData.cpf}
CNS: ${formData.cns}
Endereço: ${formData.endereco}
Telefone do Responsável: ${formData.telefone_responsavel}

===== DADOS DA UNIDADE =====
Unidade Solicitante: ${formData.unidade_solicitante}
Data e Horário da Admissão: ${formData.data_hora_admissao ? new Date(formData.data_hora_admissao).toLocaleString('pt-BR') : ''}

===== DADOS CLÍNICOS =====
Hipótese Diagnóstica: ${formData.hipotese_diagnostica}
Alergia: ${formData.alergia === 'Nega' ? 'Nega' : 'Sim - ' + formData.alergia_descricao}
Medicações de Uso Contínuo: ${formData.medicacoes_uso_continuo === 'NÃO SABE INFORMAR' ? 'NÃO SABE INFORMAR' : formData.medicacoes_descricao}
Comorbidades: ${formData.comorbidades.join(', ')}${formData.comorbidades_outras ? ', Outras: ' + formData.comorbidades_outras : ''}

===== SOLICITAÇÃO =====
Solicita Leito de: ${formData.solicita_leito}

Médico Solicitante: ${formData.medico_solicitante}
CRM: ${formData.crm_solicitante}

Total de Documentos Anexados: ${formData.documentos.length}

---
Enviado através do Sistema Coração Paraibano
Solicitante: ${user?.full_name} (${user?.email})
`;
      await base44.integrations.Core.SendEmail({
        to: user?.email || "ses@saude.pb.gov.br",
        subject: `[FORMULÁRIO/VAGA] ${formData.nome_completo} - ${formData.unidade_solicitante}`,
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
      toast.success("✅ Solicitação enviada com sucesso! Aguarde retorno da SES por e-mail.");
      setTimeout(() => {
        navigate(createPageUrl("Historico"));
      }, 2000);
    },
    onError: (error) => {
      toast.error("Erro ao enviar solicitação: " + error.message);
    }
  });

  const getEmailCERH = () => {
    const macro = paciente?.macrorregiao || formData.macrorregiao || "";
    if (macro === "Macro 1") return "cerh.pb@regulacao.com";
    if (macro === "Macro 2") return "regulacao@saude.pb.gov.br";
    if (macro === "Macro 3") return "cerhpb3macro@saude.pb.gov.br";
    return "cerh.pb@regulacao.com"; // padrão Macro 1
  };

  const abrirEmailCliente = () => {
    const emailCERH = getEmailCERH();
    const assunto = encodeURIComponent(`[FORMULÁRIO/VAGA] ${formData.nome_completo} - ${formData.unidade_solicitante || paciente?.unidade_saude || ""}`);
    const corpo = encodeURIComponent(
      `Prezados,\n\nSegue em anexo o Formulário de Solicitação de Vaga do paciente ${formData.nome_completo}.\n\nMacrorregião: ${paciente?.macrorregiao || ""}\nUnidade Solicitante: ${formData.unidade_solicitante || paciente?.unidade_saude || ""}\nEspecialidade: ${formData.especialidade_solicitada}\nHipótese Diagnóstica: ${formData.hipotese_diagnostica}\n\nAtenciosamente,\n${user?.full_name || ""}\n${formData.unidade_solicitante || paciente?.unidade_saude || ""}`
    );
    window.location.href = `mailto:${emailCERH}?subject=${assunto}&body=${corpo}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome_completo || !formData.especialidade_solicitada ||
        !formData.unidade_solicitante || !formData.medico_solicitante) {
      toast.error("Por favor, preencha todos os campos obrigatórios!");
      return;
    }

    // 1. Gera e baixa o PDF
    if (formRef.current) {
      setGerandoPDF(true);
      try {
        const canvas = await html2canvas(formRef.current, { scale: 2, useCORS: true, logging: false });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
        const imgX = (pdfWidth - canvas.width * ratio) / 2;
        pdf.addImage(imgData, 'PNG', imgX, 0, canvas.width * ratio, canvas.height * ratio);
        pdf.save(`Formulario_Vaga_${formData.nome_completo}_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success("📄 PDF gerado! Agora anexe-o ao e-mail que será aberto.");
      } catch (error) {
        toast.error("Erro ao gerar PDF: " + error.message);
        setGerandoPDF(false);
        return;
      } finally {
        setGerandoPDF(false);
      }
    }

    // 2. Envia dados pelo sistema
    enviarSolicitacao.mutate();

    // 3. Abre cliente de e-mail após pequeno delay para o PDF terminar de baixar
    setTimeout(() => {
      abrirEmailCliente();
    }, 1500);
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 to-green-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
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
        </div>

        <div ref={formRef} className="bg-white p-8 rounded-lg shadow-lg mb-6">
          {/* Cabeçalho com logos */}
          <div className="mb-6 pb-4 border-b-2 border-gray-300">
            <div className="flex items-center justify-between gap-4 w-full mb-3">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/8e093c8da_logoSecretariadeEstadodaSade.png" alt="SES" className="h-12 md:h-16 w-auto object-contain" crossOrigin="anonymous" />
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/fa5f3a17e_LOGOCORAAOPARAIBANO.png" alt="Coração Paraibano" className="h-12 md:h-16 w-auto object-contain" crossOrigin="anonymous" />
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/006e0d9aa_LogoComplexoregulador.jpg" alt="Complexo Regulador" className="h-12 md:h-16 w-auto object-contain" crossOrigin="anonymous" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold">FORMULÁRIO DE SOLICITAÇÃO DE VAGA</h2>
              <p className="text-sm mt-2">Data da Solicitação: {new Date(formData.data_solicitacao).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Especialidade */}
            <div>
              <h3 className="text-base font-bold mb-3 border-b pb-2">ESPECIALIDADE SOLICITADA *</h3>
              <Select value={formData.especialidade_solicitada} onValueChange={(v) => setFormData({...formData, especialidade_solicitada: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione a especialidade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CARDIOLOGIA">CARDIOLOGIA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dados Pessoais */}
            <div>
              <h3 className="text-base font-bold mb-3 border-b pb-2">DADOS PESSOAIS</h3>
              {paciente && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 grid md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
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
                      <Label>Idade *</Label>
                      <Input type="number" value={formData.idade} onChange={(e) => setFormData({...formData, idade: e.target.value})} required />
                    </div>
                    <div>
                      <Label>Sexo *</Label>
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
              <h3 className="text-base font-bold mb-3 border-b pb-2">DADOS DA UNIDADE</h3>
              {paciente ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 grid md:grid-cols-3 gap-3">
                  <div>
                    <span className="text-xs text-blue-600 font-semibold uppercase">Unidade Solicitante</span>
                    <p className="font-bold text-gray-900">{paciente.unidade_saude || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-blue-600 font-semibold uppercase">Macrorregião de Saúde</span>
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
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Médico Solicitante: *</Label>
                  <Input value={formData.medico_solicitante} onChange={(e) => setFormData({...formData, medico_solicitante: e.target.value})} required />
                </div>
                <div>
                  <Label>CRM: *</Label>
                  <Input value={formData.crm_solicitante} onChange={(e) => setFormData({...formData, crm_solicitante: e.target.value})} required />
                </div>
              </div>
            </div>

            {/* Upload de Documentos */}
            <div>
              <h3 className="text-base font-bold mb-3 border-b pb-2">DOCUMENTOS DO PACIENTE (máx. 4 arquivos)</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors mb-4">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.gif,.png"
                  disabled={formData.documentos.length >= 4}
                />
                <label htmlFor="file-upload" className={`cursor-pointer ${formData.documentos.length >= 4 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <FileUp className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-1">
                    {formData.documentos.length >= 4 ? 'Limite de 4 arquivos atingido' : 'Clique para adicionar documentos'}
                  </p>
                  <p className="text-xs text-gray-500">PDF, GIF, JPEG (múltiplos arquivos permitidos)</p>
                </label>
              </div>

              {formData.documentos.length > 0 && (
                <div className="mb-4 space-y-2">
                  {formData.documentos.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                      <span className="text-sm text-green-900 font-medium truncate flex-1">{doc.nome || `Documento ${idx + 1}`}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removerDocumento(idx)} className="text-red-600 hover:text-red-800 hover:bg-red-50">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {uploadingFiles && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center mb-4">
                  <p className="text-blue-700">Enviando arquivos...</p>
                </div>
              )}

              {formData.documentos.length > 0 && (
                <div className="mb-4 space-y-3">
                  {formData.documentos.map((doc, idx) => (
                    <div key={idx} className="border border-gray-300 rounded-lg p-2">
                      <p className="text-xs font-semibold mb-2">{doc.nome || `Documento ${idx + 1}`}</p>
                      {!doc.url.toLowerCase().endsWith('.pdf') ? (
                        <img src={doc.url} alt={doc.nome || `Documento ${idx + 1}`} className="w-full h-auto object-contain bg-gray-50 rounded" crossOrigin="anonymous" />
                      ) : (
                        <div className="p-4 bg-gray-100 text-xs text-center rounded">
                          📄 Documento PDF anexado - {doc.nome}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={enviarSolicitacao.isPending || uploadingFiles} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Send className="w-5 h-5 mr-2" />
                {enviarSolicitacao.isPending ? "Enviando..." : "FINALIZAR E ENVIAR"}
              </Button>
            </div>

            {/* Alerta Informativo */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-yellow-900">Importante:</p>
                  <p className="text-sm text-yellow-800 mt-1">
                    Ao clicar em "FINALIZAR E ENVIAR": o formulário PDF será baixado automaticamente e o seu cliente de e-mail será aberto com o endereço da CERH correspondente à macrorregião já preenchido. <strong>Anexe o PDF baixado ao e-mail antes de enviar.</strong> Aguarde retorno da CERH com a atualização do caso e/ou senha para internação.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}