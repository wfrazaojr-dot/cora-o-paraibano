import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Activity, FileText, Save, Heart, Download, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import DadosPaciente from "@/components/regulacao/DadosPaciente";
import LinhaTempo from "@/components/regulacao/LinhaTempo";
import MonitorTransporte from "@/components/regulacao/MonitorTransporte";
import { Badge } from "@/components/ui/badge";
import ChatInterno from "@/components/ChatInterno";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CERHDetalhe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const pacienteId = urlParams.get('id');
  const relatorioRef = useRef(null);

  const [formData, setFormData] = useState({
    medico_regulador_nome: "",
    medico_regulador_crm: "",
    conduta_inicial: [],
    conduta_inicial_outros: "",
    conduta_final: "",
    unidade_destino: "",
    unidade_destino_outro: "",
    enfermeiro_nome: "",
    enfermeiro_coren: "",
    senha_ses: "",
    observacoes_regulacao: ""
  });

  const { data: paciente, isLoading } = useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: () => base44.entities.Paciente.list().then(list => list.find(p => p.id === pacienteId)),
    enabled: !!pacienteId
  });

  useEffect(() => {
    if (paciente?.regulacao_central) {
      const r = paciente.regulacao_central;
      const unidades = [
        "Hospital Metropolitano Dom José Maria Pires",
        "Hospital de Emergência e Trauma Dom Luiz Gonzaga Fernandes",
        "Hospital Regional de Patos Deputado Janduhy Carneiro"
      ];
      const isPreset = unidades.includes(r.unidade_destino);
      setFormData({
        medico_regulador_nome: r.medico_regulador_nome || "",
        medico_regulador_crm: r.medico_regulador_crm || "",
        conduta_inicial: r.conduta_inicial || [],
        conduta_inicial_outros: r.conduta_inicial_outros || "",
        conduta_final: r.conduta_final || "",
        unidade_destino: isPreset ? r.unidade_destino : (r.unidade_destino ? "outro" : ""),
        unidade_destino_outro: isPreset ? "" : (r.unidade_destino || ""),
        enfermeiro_nome: r.enfermeiro_regulador_nome || "",
        enfermeiro_coren: r.enfermeiro_regulador_coren || "",
        senha_ses: r.senha_ses || "",
        observacoes_regulacao: r.observacoes_regulacao || ""
      });
    }
  }, [paciente]);

  const gerarRelatorioPDF = async (pacienteData) => {
    if (!relatorioRef.current) return null;
    try {
      const canvas = await html2canvas(relatorioRef.current, {
        scale: 1.8,
        logging: false,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        imageTimeout: 15000,
        removeContainer: true
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      const pdfBlob = pdf.output('blob');
      const nomePaciente = (pacienteData?.nome_completo || 'Paciente').replace(/\s+/g, '_');
      const nomeArquivo = `Relatorio_CERH_${nomePaciente}_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`;
      const pdfFile = new File([pdfBlob], nomeArquivo, { type: 'application/pdf' });
      const uploadResult = await base44.integrations.Core.UploadFile({ file: pdfFile });
      return uploadResult.file_url;
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      throw error;
    }
  };

  const salvarRascunho = useMutation({
    mutationFn: async () => {
      const unidadeDestino = formData.unidade_destino === "outro" ? formData.unidade_destino_outro : formData.unidade_destino;
      const regulacaoData = {
        medico_regulador_nome: formData.medico_regulador_nome,
        medico_regulador_crm: formData.medico_regulador_crm,
        conduta_inicial: formData.conduta_inicial,
        conduta_inicial_outros: formData.conduta_inicial_outros,
        conduta_final: formData.conduta_final,
        unidade_destino: unidadeDestino,
        enfermeiro_regulador_nome: formData.enfermeiro_nome,
        enfermeiro_regulador_coren: formData.enfermeiro_coren,
        senha_ses: formData.senha_ses,
        observacoes_regulacao: formData.observacoes_regulacao,
        data_hora: new Date().toISOString()
      };
      await base44.entities.Paciente.update(pacienteId, {
        regulacao_central: regulacaoData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['paciente', pacienteId]);
      alert("Rascunho salvo com sucesso! Você pode continuar depois.");
    }
  });

  const salvarRegulacao = useMutation({
    mutationFn: async () => {
      const unidadeDestino = formData.unidade_destino === "outro" ? formData.unidade_destino_outro : formData.unidade_destino;
      const regulacaoData = {
        medico_regulador_nome: formData.medico_regulador_nome,
        medico_regulador_crm: formData.medico_regulador_crm,
        conduta_inicial: formData.conduta_inicial,
        conduta_inicial_outros: formData.conduta_inicial_outros,
        conduta_final: formData.conduta_final,
        unidade_destino: unidadeDestino,
        enfermeiro_regulador_nome: formData.enfermeiro_nome,
        enfermeiro_regulador_coren: formData.enfermeiro_coren,
        senha_ses: formData.senha_ses,
        observacoes_regulacao: formData.observacoes_regulacao,
        data_hora: new Date().toISOString()
      };
      // Primeiro salva os dados para que o ref do relatório seja renderizado
      await base44.entities.Paciente.update(pacienteId, {
        regulacao_central: regulacaoData,
        status: "Aguardando Transporte"
      });
      // Aguarda re-render para capturar o relatório
      await new Promise(resolve => setTimeout(resolve, 500));
      const file_url = await gerarRelatorioPDF(paciente);
      if (file_url) {
        await base44.entities.Paciente.update(pacienteId, {
          relatorio_cerh_url: file_url
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['paciente', pacienteId]);
      alert("Regulação CERH registrada com sucesso! Relatório PDF gerado.");
      navigate(createPageUrl("Dashboard"));
    }
  });

  const downloadPDF = async (url, nomeArquivo) => {
    const resp = await fetch(url);
    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = nomeArquivo || 'relatorio.pdf';
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  if (isLoading) {
    return <div className="p-8">Carregando...</div>;
  }

  if (!paciente) {
    return <div className="p-8">Paciente não encontrado</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">

      {/* Template oculto para geração do PDF */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={relatorioRef} className="bg-white p-8" style={{ width: '210mm', minHeight: '297mm' }}>
          {/* Cabeçalho com logos */}
          <div className="mb-6 pb-4 border-b-2 border-gray-300">
            <div className="flex items-center justify-between gap-4 w-full mb-3">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/8e093c8da_logoSecretariadeEstadodaSade.png" alt="Governo da Paraíba" className="h-12 w-auto object-contain" crossOrigin="anonymous" />
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/fa5f3a17e_LOGOCORAAOPARAIBANO.png" alt="Coração Paraibano" className="h-12 w-auto object-contain" crossOrigin="anonymous" />
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/006e0d9aa_LogoComplexoregulador.jpg" alt="Complexo Regulador" className="h-12 w-auto object-contain" crossOrigin="anonymous" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-indigo-700">RELATÓRIO CERH - CENTRAL DE REGULAÇÃO</h1>
              <p className="text-sm text-gray-600 mt-1">Data: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            </div>
          </div>

          {/* Dados do Paciente */}
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">DADOS DO PACIENTE</h2>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div><span className="font-semibold">Nome:</span> {paciente?.nome_completo}</div>
              <div><span className="font-semibold">Idade:</span> {paciente?.idade} anos | <span className="font-semibold">Sexo:</span> {paciente?.sexo}</div>
              <div><span className="font-semibold">Unidade de Origem:</span> {paciente?.unidade_saude}</div>
              <div><span className="font-semibold">Macrorregiâo:</span> {paciente?.macrorregiao}</div>
              {paciente?.formulario_vaga?.email_unidade_solicitante && (
                <div className="col-span-2"><span className="font-semibold">E-mail Unidade Solicitante:</span> {paciente.formulario_vaga.email_unidade_solicitante}</div>
              )}
            </div>
          </div>

          {/* Sinais Vitais */}
          {paciente?.triagem_medica && (
            <div className="mb-4">
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">SINAIS VITAIS</h2>
              <div className="grid grid-cols-4 gap-1 text-xs">
                {(() => {
                  const pa = paciente.triagem_medica.pa_braco_esquerdo || "";
                  const parts = pa.split('/');
                  const pas = parts[0]?.trim();
                  const pad = parts[1]?.trim();
                  return (
                    <>
                      {pas && <div><span className="font-semibold">PAS (mm Hg):</span> {pas}</div>}
                      {pad && <div><span className="font-semibold">PAD (mm Hg):</span> {pad}</div>}
                    </>
                  );
                })()}
                {paciente.triagem_medica.frequencia_cardiaca && <div><span className="font-semibold">FC:</span> {paciente.triagem_medica.frequencia_cardiaca} bpm</div>}
                {paciente.triagem_medica.frequencia_respiratoria && <div><span className="font-semibold">FR:</span> {paciente.triagem_medica.frequencia_respiratoria} irpm</div>}
                {paciente.triagem_medica.temperatura && <div><span className="font-semibold">Temp:</span> {paciente.triagem_medica.temperatura} °C</div>}
                {paciente.triagem_medica.spo2 && <div><span className="font-semibold">SpO2:</span> {paciente.triagem_medica.spo2}%</div>}
                {paciente.triagem_medica.glicemia_capilar && <div><span className="font-semibold">Glicemia:</span> {paciente.triagem_medica.glicemia_capilar} mg/dL</div>}
              </div>
            </div>
          )}

          {/* Conduta Inicial */}
          {formData.conduta_inicial?.length > 0 && (
            <div className="mb-4">
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">CONDUTA INICIAL</h2>
              <div className="text-xs space-y-1">
                {formData.conduta_inicial.map((c, i) => <p key={i}>• {c}</p>)}
                {formData.conduta_inicial_outros && <p>• Outros: {formData.conduta_inicial_outros}</p>}
              </div>
            </div>
          )}

          {/* Conduta Final */}
          {formData.conduta_final && (
            <div className="mb-4">
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">CONDUTA FINAL</h2>
              <p className="text-xs whitespace-pre-wrap">{formData.conduta_final}</p>
            </div>
          )}

          {/* Unidade de Destino */}
          {formData.unidade_destino && (
            <div className="mb-4">
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">UNIDADE DE DESTINO</h2>
              <p className="text-xs font-semibold">{formData.unidade_destino}</p>
            </div>
          )}

          {/* Observações */}
          {formData.observacoes_regulacao && (
            <div className="mb-4">
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">OBSERVAÇÕES</h2>
              <p className="text-xs whitespace-pre-wrap">{formData.observacoes_regulacao}</p>
            </div>
          )}

          {/* Parecer ASSCARDIO resumido */}
          {paciente?.assessoria_cardiologia?.parecer_cardiologista && (
            <div className="mb-4">
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">PARECER ASSCARDIO</h2>
              <div className="text-xs space-y-1">
                <p><span className="font-semibold">Cardiologista:</span> {paciente.assessoria_cardiologia.cardiologista_nome} - CRM {paciente.assessoria_cardiologia.cardiologista_crm}</p>
                {paciente.assessoria_cardiologia.diagnostico && <p><span className="font-semibold">Diagnóstico:</span> {paciente.assessoria_cardiologia.diagnostico}</p>}
                {paciente.assessoria_cardiologia.conduta && <p><span className="font-semibold">Conduta:</span> {paciente.assessoria_cardiologia.conduta}</p>}
              </div>
            </div>
          )}

          {/* Documentos Anexados do Formulário de Vaga */}
          {paciente?.formulario_vaga?.documentos && paciente.formulario_vaga.documentos.length > 0 && (
            <div className="mb-4">
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">DOCUMENTOS ANEXADOS (FORMULÁRIO DE VAGA)</h2>
              <div className="grid grid-cols-2 gap-2">
                {paciente.formulario_vaga.documentos.map((doc, idx) => (
                  <div key={idx} className="border border-gray-300 p-1">
                    {doc.file_url && (
                      <img 
                        src={doc.file_url} 
                        alt={`Documento ${idx + 1}`}
                        className="w-full h-auto object-contain"
                        crossOrigin="anonymous"
                        style={{ maxHeight: '300px' }}
                      />
                    )}
                    {doc.nome && <p className="text-xs text-gray-600 mt-1 text-center">{doc.nome}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Equipe CERH */}
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">EQUIPE CERH</h2>
            <div className="text-xs space-y-1">
              <p><span className="font-semibold">Médico Regulador:</span> {formData.medico_regulador_nome} - CRM {formData.medico_regulador_crm}</p>
              {formData.enfermeiro_nome && <p><span className="font-semibold">Enfermeiro:</span> {formData.enfermeiro_nome} - COREN {formData.enfermeiro_coren}</p>}
              {formData.senha_ses && <p><span className="font-semibold">Senha SES nº:</span> {formData.senha_ses}</p>}
            </div>
          </div>

          {/* Rodapé */}
          <div className="mt-8 pt-4 border-t-2 border-gray-300 text-xs text-gray-600">
            <p className="font-semibold">Sistema de Triagem de Dor Torácica - Coração Paraibano</p>
            <p>Desenvolvedor: Walber Alves Frazão Júnior - COREN 110.238</p>
            <p>Gerado em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate(createPageUrl("Dashboard"))}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-8 h-8 text-indigo-600" />
              CERH - Central de Regulação
            </h1>
            <p className="text-gray-600">Busca de vaga e definição de destino</p>
          </div>
          {paciente.triagem_medica?.tipo_sca === 'SCACESST' && (
            <Badge className="bg-red-600 text-white text-sm px-3 py-1">🔴 PRIORIDADE 0 - SCACESST</Badge>
          )}
          {paciente.triagem_medica?.tipo_sca === 'SCASESST_COM_TROPONINA' && (
            <Badge className="bg-orange-500 text-white text-sm px-3 py-1">🟠 PRIORIDADE 1 - SCASESST c/ Troponina</Badge>
          )}
          {paciente.triagem_medica?.tipo_sca === 'SCASESST_SEM_TROPONINA' && (
            <Badge className="bg-yellow-500 text-white text-sm px-3 py-1">🟡 PRIORIDADE 2 - SCASESST s/ Troponina</Badge>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda */}
          <div className="lg:col-span-1 space-y-6">
            <DadosPaciente paciente={paciente} />
            <MonitorTransporte paciente={paciente} />
            <LinhaTempo paciente={paciente} />
            <ChatInterno pacienteId={pacienteId} />
          </div>

          {/* Coluna Direita */}
          <div className="lg:col-span-2 space-y-6">

            {/* ALERTA: Paciente não compareceu à Hemodinâmica */}
            {paciente.hemodinamica?.comparecimento_paciente === 'nao_compareceu' && (
              <Card className="border-2 border-red-500 bg-red-50">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-7 h-7 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-lg font-bold text-red-800">⚠️ Paciente NÃO compareceu à Hemodinâmica</p>
                      <p className="text-sm text-red-700 mt-1">
                        O paciente não compareceu na data/hora agendada para o procedimento.
                        {paciente.hemodinamica?.data_hora_agendamento_icp && (
                          <> Estava agendado para <strong>{format(new Date(paciente.hemodinamica.data_hora_agendamento_icp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</strong>.</>  
                        )}
                      </p>
                      <p className="text-sm text-red-700 mt-1 font-semibold">Verificar junto à unidade de saúde e reagendar se necessário.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Relatório de Agendamento Hemodinâmica */}
            {paciente.relatorio_agendamento_hemo_url && (
              <Card className="border-2 border-pink-400 bg-pink-50">
                <CardHeader className="bg-pink-100">
                  <CardTitle className="flex items-center gap-2 text-pink-800">
                    <FileText className="w-5 h-5 text-pink-600" />
                    Relatório de Agendamento - Hemodinâmica
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <Button
                    onClick={() => downloadPDF(paciente.relatorio_agendamento_hemo_url, `Agendamento_Hemo_${paciente.nome_completo}.pdf`)}
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                    >
                    <FileText className="w-4 h-4 mr-2" />
                    BAIXAR RELATÓRIO DE AGENDAMENTO
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Card de Agendamento de ICP */}
            {paciente.hemodinamica?.data_hora_agendamento_icp && (
              <Card className="border-blue-300 bg-blue-50">
                <CardHeader className="bg-blue-100">
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    📅 Agendamento de ICP
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 mt-4">
                  <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                    <p className="text-sm font-semibold text-blue-900">Data e Hora Agendada:</p>
                    <p className="text-lg font-bold text-blue-600">{format(new Date(paciente.hemodinamica.data_hora_agendamento_icp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  </div>
                  {paciente.hemodinamica?.tipo_icp && (
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Tipo de ICP:</p>
                      <Badge className="mt-1">
                        {paciente.hemodinamica.tipo_icp === 'imediata' && 'Imediata'}
                        {paciente.hemodinamica.tipo_icp === 'ate_24h' && 'Estratégia Invasiva Precoce'}
                        {paciente.hemodinamica.tipo_icp === 'ate_72h' && 'Estratégia Invasiva Durante o Internamento'}
                      </Badge>
                    </div>
                  )}
                  {paciente.hemodinamica?.comparecimento_paciente && (
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Comparecimento:</p>
                      <Badge variant={paciente.hemodinamica.comparecimento_paciente === 'compareceu' ? 'default' : 'destructive'} className="mt-1">
                        {paciente.hemodinamica.comparecimento_paciente === 'compareceu' ? '✅ Compareceu' : '❌ Não Compareceu'}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Parecer ASSCARDIO */}
            {paciente.assessoria_cardiologia && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <Heart className="w-5 h-5" />
                    Parecer ASSCARDIO
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {paciente.assessoria_cardiologia.data_hora && (
                    <div>
                      <p className="text-sm font-semibold text-red-800">Data/Hora do Parecer</p>
                      <p className="text-sm">{new Date(paciente.assessoria_cardiologia.data_hora).toLocaleString('pt-BR')}</p>
                    </div>
                  )}
                  {paciente.assessoria_cardiologia.cardiologista_nome && (
                    <div>
                      <p className="text-sm font-semibold text-red-800">Cardiologista</p>
                      <p className="text-sm">{paciente.assessoria_cardiologia.cardiologista_nome} - CRM {paciente.assessoria_cardiologia.cardiologista_crm}</p>
                    </div>
                  )}
                  {paciente.assessoria_cardiologia.parecer_cardiologista && (
                    <div>
                      <p className="text-sm font-semibold text-red-800">Parecer do Cardiologista</p>
                      <p className="text-sm whitespace-pre-wrap bg-white p-3 rounded border border-red-100">{paciente.assessoria_cardiologia.parecer_cardiologista}</p>
                    </div>
                  )}
                  {paciente.assessoria_cardiologia.diagnostico_estrategia && (
                    <div>
                      <p className="text-sm font-semibold text-red-800">Diagnóstico + Estratégia</p>
                      <p className="text-sm">
                        {(() => {
                          const map = { "1": "1- IAM supra ST → Estratégia 1: transferência imediata", "2": "2- SCA muito alto risco → Estratégia 1", "3": "3- IAM sem supra/alto risco → Estratégia 2: Invasiva Precoce", "4": "4- SCA intermediário → Estratégia 3: Invasiva no Internamento", "5": "5- Orientação Cardiológica", "6": "6- Trombólise + ICP 2-24h" };
                          const raw = paciente.assessoria_cardiologia.diagnostico_estrategia;
                          const arr = Array.isArray(raw) ? raw : (typeof raw === 'string' ? raw.split(',').filter(Boolean) : []);
                          return arr.map(k => map[k] || k).join(" | ") || raw;
                        })()}
                      </p>
                    </div>
                  )}
                  {paciente.assessoria_cardiologia.enfermeiro_nome && (
                    <div>
                      <p className="text-sm font-semibold text-red-800">Enfermeiro(a)</p>
                      <p className="text-sm">{paciente.assessoria_cardiologia.enfermeiro_nome} - COREN {paciente.assessoria_cardiologia.enfermeiro_coren}</p>
                    </div>
                  )}
                  {paciente.assessoria_cardiologia.parecer_enfermeiro && (
                    <div>
                      <p className="text-sm font-semibold text-red-800">Parecer do Enfermeiro</p>
                      <p className="text-sm whitespace-pre-wrap bg-white p-3 rounded border border-red-100">{paciente.assessoria_cardiologia.parecer_enfermeiro}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {paciente.assessoria_cardiologia.indicacao_hemodinamica && (
                      <Badge className="bg-red-600">Indicação de Hemodinâmica</Badge>
                    )}
                    {paciente.assessoria_cardiologia.urgencia && (
                      <Badge variant="outline" className="border-red-300">
                        Urgência: {paciente.assessoria_cardiologia.urgencia}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-4">
                    {paciente.relatorio_asscardio_url ? (
                      <Button
                        onClick={async () => {
                          const resp = await fetch(paciente.relatorio_asscardio_url);
                          const blob = await resp.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `Parecer_ASSCARDIO_${(paciente.nome_completo || 'Paciente').replace(/\s+/g, '_')}.pdf`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Baixar Parecer Completo ASSCARDIO
                      </Button>
                    ) : (
                      <Button
                        onClick={() => navigate(createPageUrl("ASSCARDIODetalhe") + "?id=" + pacienteId)}
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Ver Detalhes do Parecer ASSCARDIO
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Relatório da Unidade */}
            {paciente.relatorio_triagem_url && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Relatório da Unidade de Saúde
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => downloadPDF(paciente.relatorio_triagem_url, `Relatorio_Triagem_${paciente.nome_completo}.pdf`)}
                    className="w-full"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Baixar Relatório da Unidade
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Formulário de Solicitação de Vaga */}
            {paciente.formulario_vaga?.data_envio && (
              <Card className="border-green-300 bg-green-50">
                <CardHeader className="bg-green-100">
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <FileText className="w-5 h-5" />
                    Formulário de Solicitação de Vaga
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-4">
                  <div className="grid md:grid-cols-2 gap-2 text-sm">
                    <div><span className="font-semibold text-green-900">Enviado em:</span> {new Date(paciente.formulario_vaga.data_envio).toLocaleString('pt-BR')}</div>
                    {paciente.formulario_vaga.enviado_por && <div><span className="font-semibold text-green-900">Por:</span> {paciente.formulario_vaga.enviado_por}</div>}
                    {paciente.formulario_vaga.especialidade_solicitada && <div><span className="font-semibold text-green-900">Especialidade:</span> {paciente.formulario_vaga.especialidade_solicitada}</div>}
                    {paciente.formulario_vaga.solicita_leito && <div><span className="font-semibold text-green-900">Leito:</span> {paciente.formulario_vaga.solicita_leito}</div>}
                    {paciente.formulario_vaga.medico_solicitante && <div><span className="font-semibold text-green-900">Médico Solicitante:</span> {paciente.formulario_vaga.medico_solicitante} - CRM {paciente.formulario_vaga.crm_solicitante}</div>}
                    {paciente.formulario_vaga.hipotese_diagnostica && <div className="md:col-span-2"><span className="font-semibold text-green-900">Hipótese Diagnóstica:</span> {paciente.formulario_vaga.hipotese_diagnostica}</div>}
                  </div>
                  <div className="flex items-start gap-3 mt-3 p-3 bg-yellow-50 border border-yellow-400 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-semibold text-yellow-800">⚠️ Alerta! Verifique o e-mail enviado desta unidade</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Formulário de Regulação */}
            <Card>
              <CardHeader>
                <CardTitle>Regulação e Definição de Vaga</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Médico Regulador</Label>
                    <Input
                      value={formData.medico_regulador_nome}
                      onChange={(e) => setFormData({...formData, medico_regulador_nome: e.target.value})}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <Label>CRM</Label>
                    <Input
                      value={formData.medico_regulador_crm}
                      onChange={(e) => setFormData({...formData, medico_regulador_crm: e.target.value})}
                      placeholder="CRM"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold">Conduta Inicial (selecione as opções aplicáveis)</Label>
                  <div className="space-y-3 mt-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="conduta_asscardio"
                        checked={formData.conduta_inicial.includes("Parecer da ASSCARDIO")}
                        onCheckedChange={(checked) => {
                          const newCondutas = checked 
                            ? [...formData.conduta_inicial, "Parecer da ASSCARDIO"]
                            : formData.conduta_inicial.filter(c => c !== "Parecer da ASSCARDIO");
                          setFormData({...formData, conduta_inicial: newCondutas});
                        }}
                      />
                      <Label htmlFor="conduta_asscardio" className="font-normal cursor-pointer">Parecer da ASSCARDIO</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="conduta_troponina_1h"
                        checked={formData.conduta_inicial.includes("Envio de Resultado de Curva de Troponina US (0h e 1h)")}
                        onCheckedChange={(checked) => {
                          const newCondutas = checked 
                            ? [...formData.conduta_inicial, "Envio de Resultado de Curva de Troponina US (0h e 1h)"]
                            : formData.conduta_inicial.filter(c => c !== "Envio de Resultado de Curva de Troponina US (0h e 1h)");
                          setFormData({...formData, conduta_inicial: newCondutas});
                        }}
                      />
                      <Label htmlFor="conduta_troponina_1h" className="font-normal cursor-pointer">Envio de Resultado de Curva de Troponina US (0h e 1h)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="conduta_troponina_3h"
                        checked={formData.conduta_inicial.includes("Envio de Resultado de Curva de Troponina Convencional (0h-3h)")}
                        onCheckedChange={(checked) => {
                          const newCondutas = checked 
                            ? [...formData.conduta_inicial, "Envio de Resultado de Curva de Troponina Convencional (0h-3h)"]
                            : formData.conduta_inicial.filter(c => c !== "Envio de Resultado de Curva de Troponina Convencional (0h-3h)");
                          setFormData({...formData, conduta_inicial: newCondutas});
                        }}
                      />
                      <Label htmlFor="conduta_troponina_3h" className="font-normal cursor-pointer">Envio de Resultado de Curva de Troponina Convencional (0h-3h)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="conduta_repetir_ecg"
                        checked={formData.conduta_inicial.includes("Repetir ECG de 12 derivações")}
                        onCheckedChange={(checked) => {
                          const newCondutas = checked 
                            ? [...formData.conduta_inicial, "Repetir ECG de 12 derivações"]
                            : formData.conduta_inicial.filter(c => c !== "Repetir ECG de 12 derivações");
                          setFormData({...formData, conduta_inicial: newCondutas});
                        }}
                      />
                      <Label htmlFor="conduta_repetir_ecg" className="font-normal cursor-pointer">Repetir ECG de 12 derivações</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="conduta_ecg_v3v4r"
                        checked={formData.conduta_inicial.includes("Enviar ECG V3R e V4R")}
                        onCheckedChange={(checked) => {
                          const newCondutas = checked 
                            ? [...formData.conduta_inicial, "Enviar ECG V3R e V4R"]
                            : formData.conduta_inicial.filter(c => c !== "Enviar ECG V3R e V4R");
                          setFormData({...formData, conduta_inicial: newCondutas});
                        }}
                      />
                      <Label htmlFor="conduta_ecg_v3v4r" className="font-normal cursor-pointer">Enviar ECG V3R e V4R</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="conduta_ecg_v7v8"
                        checked={formData.conduta_inicial.includes("Enviar ECG V7 e V8")}
                        onCheckedChange={(checked) => {
                          const newCondutas = checked 
                            ? [...formData.conduta_inicial, "Enviar ECG V7 e V8"]
                            : formData.conduta_inicial.filter(c => c !== "Enviar ECG V7 e V8");
                          setFormData({...formData, conduta_inicial: newCondutas});
                        }}
                      />
                      <Label htmlFor="conduta_ecg_v7v8" className="font-normal cursor-pointer">Enviar ECG V7 e V8</Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="conduta_outros">Outros:</Label>
                      <Input
                        id="conduta_outros"
                        value={formData.conduta_inicial_outros}
                        onChange={(e) => setFormData({...formData, conduta_inicial_outros: e.target.value})}
                        placeholder="Descreva outras condutas..."
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Conduta Final</Label>
                  <Textarea
                    value={formData.conduta_final}
                    onChange={(e) => setFormData({...formData, conduta_final: e.target.value})}
                    placeholder="Descreva a conduta final..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unidade de Saúde de Destino</Label>
                  <Select
                    value={formData.unidade_destino}
                    onValueChange={(value) => setFormData({...formData, unidade_destino: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade de destino" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hospital Metropolitano Dom José Maria Pires">
                        Hospital Metropolitano Dom José Maria Pires
                      </SelectItem>
                      <SelectItem value="Hospital de Emergência e Trauma Dom Luiz Gonzaga Fernandes">
                        Hospital de Emergência e Trauma Dom Luiz Gonzaga Fernandes
                      </SelectItem>
                      <SelectItem value="Hospital Regional de Patos Deputado Janduhy Carneiro">
                        Hospital Regional de Patos Deputado Janduhy Carneiro
                      </SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.unidade_destino === "outro" && (
                    <Input
                      value={formData.unidade_destino_outro}
                      onChange={(e) => setFormData({...formData, unidade_destino_outro: e.target.value})}
                      placeholder="Digite o nome da unidade de destino"
                    />
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Enfermeiro</Label>
                    <Input
                      value={formData.enfermeiro_nome}
                      onChange={(e) => setFormData({...formData, enfermeiro_nome: e.target.value})}
                      placeholder="Nome do enfermeiro"
                    />
                  </div>
                  <div>
                    <Label>COREN</Label>
                    <Input
                      value={formData.enfermeiro_coren}
                      onChange={(e) => setFormData({...formData, enfermeiro_coren: e.target.value})}
                      placeholder="COREN"
                    />
                  </div>
                  <div>
                    <Label>Senha SES nº</Label>
                    <Input
                      value={formData.senha_ses}
                      onChange={(e) => setFormData({...formData, senha_ses: e.target.value})}
                      placeholder="Número da senha"
                    />
                  </div>
                </div>

                <div>
                  <Label>Observações da Regulação</Label>
                  <Textarea
                    value={formData.observacoes_regulacao}
                    onChange={(e) => setFormData({...formData, observacoes_regulacao: e.target.value})}
                    placeholder="Observações adicionais..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => salvarRascunho.mutate()}
                    disabled={salvarRascunho.isPending}
                    variant="outline"
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {salvarRascunho.isPending ? "Salvando..." : "Salvar Rascunho"}
                  </Button>
                  <Button
                    onClick={() => salvarRegulacao.mutate()}
                    disabled={salvarRegulacao.isPending}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {salvarRegulacao.isPending ? "Salvando..." : "Confirmar Regulação"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Relatório CERH PDF */}
            {paciente.relatorio_cerh_url && (
              <Card className="border-indigo-200">
                <CardHeader className="bg-indigo-50">
                  <CardTitle className="flex items-center gap-2 text-indigo-700">
                    <FileText className="w-5 h-5" />
                    Relatório CERH
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => downloadPDF(paciente.relatorio_cerh_url, `Relatorio_CERH_${paciente.nome_completo}.pdf`)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Relatório CERH PDF
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );

}