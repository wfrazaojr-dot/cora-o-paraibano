import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const formRef = useRef(null);
  const urlParams = new URLSearchParams(window.location.search);
  const pacienteId = urlParams.get('id');
  
  const [formData, setFormData] = useState({
    data_solicitacao: new Date().toISOString().split('T')[0],
    especialidade_solicitada: "",
    // Dados Pessoais
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
    // Dados da Unidade
    unidade_solicitante: "",
    data_admissao: "",
    // Dados Clínicos
    hipotese_diagnostica: "",
    alergia: "Nega",
    alergia_descricao: "",
    medicacoes_uso_continuo: "NÃO SABE INFORMAR",
    medicacoes_descricao: "",
    comorbidades: [],
    comorbidades_outras: "",
    // Admissão Médica
    data_admissao_medica: "",
    // Exame Físico
    acv: "",
    ar: "",
    abd: "",
    extremidades: "",
    tec: "<3s",
    neuro: "",
    pupilas: [],
    // Sinais Vitais
    pas: "",
    pad: "",
    spo2: "",
    ventilacao: "AR AMBIENTE",
    fc: "",
    hgt: "",
    tax: "",
    fr: "",
    // Gasometria
    data_gasometria: "",
    ph: "",
    pco2: "",
    po2: "",
    hco3: "",
    lact: "",
    // Conduta
    febre_ultimos_7dias: "Não",
    febre_tempo: "",
    dispneia: "Não",
    dispneia_data_inicio: "",
    vmi: "Não",
    dispositivo_o2: "Não",
    dispositivo_o2_qual: "",
    sedado: "Não",
    nivel_consciencia: "",
    drogas_sedativas: "",
    drogas_vasoativas: "Não",
    drogas_vasoativas_quais: "",
    // Solicitação
    solicita_leito: "",
    medico_solicitante: "",
    crm_solicitante: "",
    // Documentos
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
    onSuccess: (data) => {
      if (data) {
        // Preencher dados do paciente automaticamente
        setFormData(prev => ({
          ...prev,
          nome_completo: data.nome_completo || "",
          idade: data.idade?.toString() || "",
          sexo: data.sexo || "",
          unidade_solicitante: data.unidade_saude || "",
          hipotese_diagnostica: data.avaliacao_clinica?.hipotese_diagnostica || "",
          pas: data.triagem_medica?.pa_braco_esquerdo?.split('/')[0] || "",
          pad: data.triagem_medica?.pa_braco_esquerdo?.split('/')[1] || "",
          fc: data.triagem_medica?.frequencia_cardiaca?.toString() || "",
          fr: data.triagem_medica?.frequencia_respiratoria?.toString() || "",
          spo2: data.triagem_medica?.spo2?.toString() || "",
          tax: data.triagem_medica?.temperatura?.toString() || "",
          hgt: data.triagem_medica?.glicemia_capilar?.toString() || "",
        }));
      }
    }
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const totalFiles = formData.documentos.length + files.length;
    if (totalFiles > 4) {
      toast.error("Você pode adicionar no máximo 4 arquivos!");
      return;
    }

    setUploadingFiles(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      
      const results = await Promise.all(uploadPromises);
      const fileUrls = results.map(r => ({url: r.file_url, nome: files[results.indexOf(r)].name}));
      
      setFormData(prev => ({
        ...prev,
        documentos: [...prev.documentos, ...fileUrls]
      }));
      
      toast.success(`${files.length} arquivo(s) enviado(s) com sucesso!`);
    } catch (error) {
      toast.error("Erro ao enviar arquivos: " + error.message);
    } finally {
      setUploadingFiles(false);
    }
  };

  const removerDocumento = (index) => {
    setFormData(prev => ({
      ...prev,
      documentos: prev.documentos.filter((_, i) => i !== index)
    }));
    toast.success("Documento removido");
  };

  const gerarPDF = async () => {
    if (!formRef.current) return;

    setGerandoPDF(true);
    try {
      const canvas = await html2canvas(formRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
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
Data de Admissão: ${formData.data_admissao ? new Date(formData.data_admissao).toLocaleDateString('pt-BR') : ''}

===== DADOS CLÍNICOS =====
Hipótese Diagnóstica: ${formData.hipotese_diagnostica}
Alergia: ${formData.alergia === 'Nega' ? 'Nega' : 'Sim - ' + formData.alergia_descricao}
Medicações de Uso Contínuo: ${formData.medicacoes_uso_continuo === 'NÃO SABE INFORMAR' ? 'NÃO SABE INFORMAR' : formData.medicacoes_descricao}
Comorbidades: ${formData.comorbidades.join(', ')}${formData.comorbidades_outras ? ', Outras: ' + formData.comorbidades_outras : ''}

===== ADMISSÃO MÉDICA =====
Data: ${formData.data_admissao_medica ? new Date(formData.data_admissao_medica).toLocaleDateString('pt-BR') : ''}

Exame Físico:
ACV: ${formData.acv}
AR: ${formData.ar}
ABD: ${formData.abd}
Extremidades: ${formData.extremidades}
TEC: ${formData.tec}
Neuro: ${formData.neuro}
Pupilas: ${formData.pupilas.join(', ')}

Sinais Vitais:
PAS: ${formData.pas} mmHg | PAD: ${formData.pad} mmHg
SpO2: ${formData.spo2}% (${formData.ventilacao})
FC: ${formData.fc} bpm | FR: ${formData.fr} irpm
HGT: ${formData.hgt} mg/dL | TAX: ${formData.tax}°C

Gasometria Arterial (${formData.data_gasometria ? new Date(formData.data_gasometria).toLocaleDateString('pt-BR') : ''}):
pH: ${formData.ph} | PCO2: ${formData.pco2} | PO2: ${formData.po2}
HCO3: ${formData.hco3} | Lactato: ${formData.lact}

===== CONDUTA =====
Febre nos últimos 7 dias: ${formData.febre_ultimos_7dias}${formData.febre_tempo ? ' - Há ' + formData.febre_tempo : ''}
Dispneia/Desconforto Respiratório: ${formData.dispneia}${formData.dispneia_data_inicio ? ' - Início: ' + new Date(formData.dispneia_data_inicio).toLocaleDateString('pt-BR') : ''}
Ventilação Mecânica Invasiva: ${formData.vmi}
Dispositivo de O2: ${formData.dispositivo_o2}${formData.dispositivo_o2_qual ? ' - ' + formData.dispositivo_o2_qual : ''}
Sedado: ${formData.sedado}
Nível de Consciência: ${formData.nivel_consciencia}
Drogas Sedativas: ${formData.drogas_sedativas}
Drogas Vasoativas: ${formData.drogas_vasoativas}${formData.drogas_vasoativas_quais ? ' - ' + formData.drogas_vasoativas_quais : ''}

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

      // Atualizar paciente se vier de um paciente específico
      if (pacienteId && paciente) {
        await base44.entities.Paciente.update(pacienteId, {
          alerta_formulario_vaga: false
        });
      }
    },
    onSuccess: () => {
      toast.success("✅ Solicitação enviada com sucesso! Aguarde retorno da SES por e-mail.");
    },
    onError: (error) => {
      toast.error("Erro ao enviar solicitação: " + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.nome_completo || !formData.especialidade_solicitada || 
        !formData.unidade_solicitante || !formData.medico_solicitante) {
      toast.error("Por favor, preencha todos os campos obrigatórios!");
      return;
    }

    enviarSolicitacao.mutate();
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

        {/* Formulário para PDF */}
        <div ref={formRef} className="bg-white p-8 rounded-lg shadow-lg mb-6">
          {/* Cabeçalho com as 3 logos */}
          <div className="mb-6 pb-4 border-b-2 border-gray-300">
            <div className="flex items-center justify-between gap-4 w-full mb-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/8e093c8da_logoSecretariadeEstadodaSade.png" 
                alt="Secretaria de Estado da Saúde" 
                className="h-12 md:h-16 w-auto object-contain"
                crossOrigin="anonymous"
              />
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/fa5f3a17e_LOGOCORAAOPARAIBANO.png" 
                alt="Coração Paraibano" 
                className="h-12 md:h-16 w-auto object-contain"
                crossOrigin="anonymous"
              />
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/006e0d9aa_LogoComplexoregulador.jpg" 
                alt="Complexo Regulador" 
                className="h-12 md:h-16 w-auto object-contain"
                crossOrigin="anonymous"
              />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold">FORMULÁRIO DE SOLICITAÇÃO DE VAGA</h2>
              <p className="text-sm mt-2">Data da Solicitação: {new Date(formData.data_solicitacao).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Especialidade Solicitada */}
            <div>
              <h3 className="text-base font-bold mb-3 border-b pb-2">ESPECIALIDADE SOLICITADA *</h3>
              <Select value={formData.especialidade_solicitada} onValueChange={(v) => setFormData({...formData, especialidade_solicitada: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a especialidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTI CARDIO">UTI CARDIO</SelectItem>
                  <SelectItem value="HEMODINÂMICA">HEMODINÂMICA</SelectItem>
                  <SelectItem value="CARDIOLOGIA">CARDIOLOGIA</SelectItem>
                  <SelectItem value="OUTRA">OUTRA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dados Pessoais */}
            <div>
              <h3 className="text-base font-bold mb-3 border-b pb-2">DADOS PESSOAIS</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Nome Completo *</Label>
                  <Input value={formData.nome_completo} onChange={(e) => setFormData({...formData, nome_completo: e.target.value})} required />
                </div>
                <div>
                  <Label>Data de Nascimento</Label>
                  <Input type="date" value={formData.data_nascimento} onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})} />
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
                  <Input value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: e.target.value})} />
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
                  <Input value={formData.telefone_responsavel} onChange={(e) => setFormData({...formData, telefone_responsavel: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Dados da Unidade */}
            <div>
              <h3 className="text-base font-bold mb-3 border-b pb-2">DADOS DA UNIDADE</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Unidade Solicitante *</Label>
                  <Input value={formData.unidade_solicitante} onChange={(e) => setFormData({...formData, unidade_solicitante: e.target.value})} required />
                </div>
                <div>
                  <Label>Data de Admissão</Label>
                  <Input type="date" value={formData.data_admissao} onChange={(e) => setFormData({...formData, data_admissao: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Dados Clínicos */}
            <div>
              <h3 className="text-base font-bold mb-3 border-b pb-2">DADOS CLÍNICOS</h3>
              <div className="space-y-4">
                <div>
                  <Label>Hipótese Diagnóstica</Label>
                  <Textarea value={formData.hipotese_diagnostica} onChange={(e) => setFormData({...formData, hipotese_diagnostica: e.target.value})} rows={2} />
                </div>
                <div>
                  <Label>Alergia</Label>
                  <div className="space-y-2">
                    <Select value={formData.alergia} onValueChange={(v) => setFormData({...formData, alergia: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nega">Nega</SelectItem>
                        <SelectItem value="Sim">Alérgico a:</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.alergia === "Sim" && (
                      <Input placeholder="Descrever alergias" value={formData.alergia_descricao} onChange={(e) => setFormData({...formData, alergia_descricao: e.target.value})} />
                    )}
                  </div>
                </div>
                <div>
                  <Label>Medicações de Uso Contínuo</Label>
                  <div className="space-y-2">
                    <Select value={formData.medicacoes_uso_continuo} onValueChange={(v) => setFormData({...formData, medicacoes_uso_continuo: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NÃO SABE INFORMAR">NÃO SABE INFORMAR</SelectItem>
                        <SelectItem value="Sim">Medicamentos:</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.medicacoes_uso_continuo === "Sim" && (
                      <Textarea placeholder="Listar medicamentos" value={formData.medicacoes_descricao} onChange={(e) => setFormData({...formData, medicacoes_descricao: e.target.value})} rows={2} />
                    )}
                  </div>
                </div>
                <div>
                  <Label>Comorbidades</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['HAS', 'DM Tipo I', 'DM Tipo II'].map(comorb => (
                      <div key={comorb} className="flex items-center space-x-2">
                        <Checkbox 
                          id={comorb}
                          checked={formData.comorbidades.includes(comorb)}
                          onCheckedChange={(checked) => {
                            const newComorbidades = checked 
                              ? [...formData.comorbidades, comorb]
                              : formData.comorbidades.filter(c => c !== comorb);
                            setFormData({...formData, comorbidades: newComorbidades});
                          }}
                        />
                        <Label htmlFor={comorb} className="font-normal cursor-pointer">{comorb}</Label>
                      </div>
                    ))}
                  </div>
                  <Input placeholder="Outras comorbidades" className="mt-2" value={formData.comorbidades_outras} onChange={(e) => setFormData({...formData, comorbidades_outras: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Admissão Médica */}
            <div>
              <h3 className="text-base font-bold mb-3 border-b pb-2">ADMISSÃO MÉDICA</h3>
              <div className="space-y-4">
                <div>
                  <Label>Data</Label>
                  <Input type="date" value={formData.data_admissao_medica} onChange={(e) => setFormData({...formData, data_admissao_medica: e.target.value})} />
                </div>
                <div>
                  <Label className="font-semibold">EXAME FÍSICO</Label>
                  <div className="grid md:grid-cols-2 gap-3 mt-2">
                    <div><Label>ACV:</Label><Input value={formData.acv} onChange={(e) => setFormData({...formData, acv: e.target.value})} /></div>
                    <div><Label>AR:</Label><Input value={formData.ar} onChange={(e) => setFormData({...formData, ar: e.target.value})} /></div>
                    <div><Label>ABD:</Label><Input value={formData.abd} onChange={(e) => setFormData({...formData, abd: e.target.value})} /></div>
                    <div><Label>Extremidades:</Label><Input value={formData.extremidades} onChange={(e) => setFormData({...formData, extremidades: e.target.value})} /></div>
                    <div>
                      <Label>TEC:</Label>
                      <Select value={formData.tec} onValueChange={(v) => setFormData({...formData, tec: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="<3s">&lt;3s</SelectItem>
                          <SelectItem value=">3s">&gt;3s</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Neuro:</Label><Input value={formData.neuro} onChange={(e) => setFormData({...formData, neuro: e.target.value})} /></div>
                  </div>
                  <div className="mt-3">
                    <Label>Pupilas:</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {['ISOCÓRICAS', 'ANISOCÓRICAS', 'MIDRÍASE', 'MIOSE', 'FOTORREAGENTES', 'NÃO FOTORREAGENTES'].map(pup => (
                        <div key={pup} className="flex items-center space-x-2">
                          <Checkbox 
                            id={pup}
                            checked={formData.pupilas.includes(pup)}
                            onCheckedChange={(checked) => {
                              const newPupilas = checked 
                                ? [...formData.pupilas, pup]
                                : formData.pupilas.filter(p => p !== pup);
                              setFormData({...formData, pupilas: newPupilas});
                            }}
                          />
                          <Label htmlFor={pup} className="font-normal cursor-pointer text-xs">{pup}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="font-semibold">SINAIS VITAIS</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    <div><Label>PAS (mmHg):</Label><Input type="number" value={formData.pas} onChange={(e) => setFormData({...formData, pas: e.target.value})} /></div>
                    <div><Label>PAD (mmHg):</Label><Input type="number" value={formData.pad} onChange={(e) => setFormData({...formData, pad: e.target.value})} /></div>
                    <div><Label>SpO2 (%):</Label><Input type="number" value={formData.spo2} onChange={(e) => setFormData({...formData, spo2: e.target.value})} /></div>
                    <div>
                      <Label>Ventilação:</Label>
                      <Select value={formData.ventilacao} onValueChange={(v) => setFormData({...formData, ventilacao: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AR AMBIENTE">AR AMBIENTE</SelectItem>
                          <SelectItem value="VMI">VMI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>FC (bpm):</Label><Input type="number" value={formData.fc} onChange={(e) => setFormData({...formData, fc: e.target.value})} /></div>
                    <div><Label>HGT (mg/dL):</Label><Input type="number" value={formData.hgt} onChange={(e) => setFormData({...formData, hgt: e.target.value})} /></div>
                    <div><Label>TAX (ºC):</Label><Input type="number" step="0.1" value={formData.tax} onChange={(e) => setFormData({...formData, tax: e.target.value})} /></div>
                    <div><Label>FR (irpm):</Label><Input type="number" value={formData.fr} onChange={(e) => setFormData({...formData, fr: e.target.value})} /></div>
                  </div>
                </div>

                <div>
                  <Label className="font-semibold">GASOMETRIA ARTERIAL</Label>
                  <div className="grid md:grid-cols-3 gap-3 mt-2">
                    <div className="md:col-span-3"><Label>Data:</Label><Input type="date" value={formData.data_gasometria} onChange={(e) => setFormData({...formData, data_gasometria: e.target.value})} /></div>
                    <div><Label>pH:</Label><Input value={formData.ph} onChange={(e) => setFormData({...formData, ph: e.target.value})} /></div>
                    <div><Label>PCO2:</Label><Input value={formData.pco2} onChange={(e) => setFormData({...formData, pco2: e.target.value})} /></div>
                    <div><Label>PO2:</Label><Input value={formData.po2} onChange={(e) => setFormData({...formData, po2: e.target.value})} /></div>
                    <div><Label>HCO3:</Label><Input value={formData.hco3} onChange={(e) => setFormData({...formData, hco3: e.target.value})} /></div>
                    <div><Label>Lactato:</Label><Input value={formData.lact} onChange={(e) => setFormData({...formData, lact: e.target.value})} /></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conduta */}
            <div>
              <h3 className="text-base font-bold mb-3 border-b pb-2">CONDUTA</h3>
              <div className="space-y-3">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Febre nos últimos 7 dias?</Label>
                    <Select value={formData.febre_ultimos_7dias} onValueChange={(v) => setFormData({...formData, febre_ultimos_7dias: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Não">Não</SelectItem>
                        <SelectItem value="Sim">Sim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.febre_ultimos_7dias === "Sim" && (
                    <div><Label>Há quanto tempo?</Label><Input value={formData.febre_tempo} onChange={(e) => setFormData({...formData, febre_tempo: e.target.value})} /></div>
                  )}
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Dispneia ou desconforto respiratório?</Label>
                    <Select value={formData.dispneia} onValueChange={(v) => setFormData({...formData, dispneia: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Não">Não</SelectItem>
                        <SelectItem value="Sim">Sim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.dispneia === "Sim" && (
                    <div><Label>Data do início:</Label><Input type="date" value={formData.dispneia_data_inicio} onChange={(e) => setFormData({...formData, dispneia_data_inicio: e.target.value})} /></div>
                  )}
                </div>

                <div>
                  <Label>Em Ventilação Mecânica Invasiva?</Label>
                  <Select value={formData.vmi} onValueChange={(v) => setFormData({...formData, vmi: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Não">Não</SelectItem>
                      <SelectItem value="Sim">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Em uso de algum dispositivo de O2?</Label>
                    <Select value={formData.dispositivo_o2} onValueChange={(v) => setFormData({...formData, dispositivo_o2: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Não">Não</SelectItem>
                        <SelectItem value="Sim">Sim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.dispositivo_o2 === "Sim" && (
                    <div><Label>Qual?</Label><Input value={formData.dispositivo_o2_qual} onChange={(e) => setFormData({...formData, dispositivo_o2_qual: e.target.value})} /></div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Sedado:</Label>
                    <Select value={formData.sedado} onValueChange={(v) => setFormData({...formData, sedado: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Não">Não</SelectItem>
                        <SelectItem value="Sim">Sim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Nível de consciência:</Label><Input value={formData.nivel_consciencia} onChange={(e) => setFormData({...formData, nivel_consciencia: e.target.value})} /></div>
                </div>

                <div>
                  <Label>Drogas sedativas e doses:</Label>
                  <Textarea value={formData.drogas_sedativas} onChange={(e) => setFormData({...formData, drogas_sedativas: e.target.value})} rows={2} />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Em uso de drogas vasoativas?</Label>
                    <Select value={formData.drogas_vasoativas} onValueChange={(v) => setFormData({...formData, drogas_vasoativas: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Não">Não</SelectItem>
                        <SelectItem value="Sim">Sim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.drogas_vasoativas === "Sim" && (
                    <div><Label>Qual(is) e em qual(is) doses?</Label><Textarea value={formData.drogas_vasoativas_quais} onChange={(e) => setFormData({...formData, drogas_vasoativas_quais: e.target.value})} rows={2} /></div>
                  )}
                </div>
              </div>
            </div>

            {/* Solicitação */}
            <div>
              <h3 className="text-base font-bold mb-3 border-b pb-2">SOLICITA</h3>
              <div className="space-y-4">
                <div>
                  <Label>Leito de: *</Label>
                  <Select value={formData.solicita_leito} onValueChange={(v) => setFormData({...formData, solicita_leito: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ENFERMARIA">ENFERMARIA</SelectItem>
                      <SelectItem value="UTI">UTI</SelectItem>
                      <SelectItem value="AVALIAÇÃO E CONDUTA">AVALIAÇÃO E CONDUTA</SelectItem>
                      <SelectItem value="HEMODINÂMICA">HEMODINÂMICA</SelectItem>
                      <SelectItem value="UTI CARDIO">UTI CARDIO</SelectItem>
                      <SelectItem value="OUTRO">OUTRO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><Label>Nome do Médico Solicitante: *</Label><Input value={formData.medico_solicitante} onChange={(e) => setFormData({...formData, medico_solicitante: e.target.value})} required /></div>
                  <div><Label>CRM: *</Label><Input value={formData.crm_solicitante} onChange={(e) => setFormData({...formData, crm_solicitante: e.target.value})} required /></div>
                </div>
              </div>
            </div>

            {/* Upload de Documentos */}
            <div>
              <h3 className="text-base font-bold mb-3 border-b pb-2">DOCUMENTOS DO PACIENTE (máx. 4 arquivos)</h3>
              
              {/* Visualização das imagens dos documentos para o PDF */}
              {formData.documentos.length > 0 && (
                <div className="mb-4 space-y-3">
                  {formData.documentos.map((doc, idx) => (
                    <div key={idx} className="border border-gray-300 rounded-lg p-2">
                      <p className="text-xs font-semibold mb-2">{doc.nome || `Documento ${idx + 1}`}</p>
                      {!doc.url.toLowerCase().endsWith('.pdf') ? (
                        <img
                          src={doc.url}
                          alt={doc.nome || `Documento ${idx + 1}`}
                          className="w-full h-auto object-contain bg-gray-50 rounded"
                          crossOrigin="anonymous"
                        />
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
              <Button
                type="button"
                onClick={gerarPDF}
                disabled={gerandoPDF}
                variant="outline"
                className="flex-1"
              >
                <Download className="w-5 h-5 mr-2" />
                {gerandoPDF ? "Gerando PDF..." : "BAIXAR FORMULÁRIO EM PDF"}
              </Button>
              <Button
                type="submit"
                disabled={enviarSolicitacao.isPending || uploadingFiles}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
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
                    Após o envio, aguarde retorno da SES por e-mail com a atualização do caso 
                    e/ou senha para internação.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Área de Upload - Fora do formRef para não aparecer no PDF */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-base font-bold mb-3">Upload de Documentos (máx. 4 arquivos)</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
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
              <p className="text-xs text-gray-500">
                PDF, GIF, JPEG (múltiplos arquivos permitidos)
              </p>
            </label>
          </div>

          {formData.documentos.length > 0 && (
            <div className="mt-4 space-y-2">
              {formData.documentos.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                  <span className="text-sm text-green-900 font-medium truncate flex-1">{doc.nome || `Documento ${idx + 1}`}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removerDocumento(idx)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {uploadingFiles && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center mt-4">
              <p className="text-blue-700">Enviando arquivos...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}