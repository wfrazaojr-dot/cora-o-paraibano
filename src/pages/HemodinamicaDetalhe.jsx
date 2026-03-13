import React, { useState, useRef } from "react";
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
import { ArrowLeft, Activity, FileText, Save, Download, Clock, Calendar, CheckCircle, XCircle, AlertTriangle, ArrowRightLeft } from "lucide-react";
import DadosPaciente from "@/components/regulacao/DadosPaciente";
import LinhaTempo from "@/components/regulacao/LinhaTempo";
import MonitorTransporte from "@/components/regulacao/MonitorTransporte";
import { Badge } from "@/components/ui/badge";
import DialogoTransferencia from "@/components/hemodinamica/DialogoTransferencia";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const TIPO_ICP_LABELS = {
  imediata: "ICP Imediata",
  ate_24h: "Estratégia 2: Estratégia Invasiva Precoce",
  ate_72h: "Estratégia 3: Estratégia Invasiva Durante o Internamento"
};

export default function HemodinamicaDetalhe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const relatorioRef = useRef(null);
  const urlParams = new URLSearchParams(window.location.search);
  const pacienteId = urlParams.get('id');

  const agendamentoRelRef = useRef(null);
  const transferenciaRelRef = useRef(null);
  const [tipoIcpSelecionado, setTipoIcpSelecionado] = useState("");
  const [agendamento, setAgendamento] = useState({ data: "", hora: "" });
  const [formData, setFormData] = useState({
    procedimento_realizado: "",
    icp_realizada: false,
    reperfusao_efetiva: false,
    intercorrencias: "",
    desfecho: "Sucesso",
    observacoes: ""
  });
  const [comparecimento, setComparecimento] = useState("");
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [dialogoTransferenciaAberto, setDialogoTransferenciaAberto] = useState(false);
  const [dadosTransferenciaTemp, setDadosTransferenciaTemp] = useState(null);

  const { data: paciente, isLoading } = useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: () => base44.entities.Paciente.list().then(list => list.find(p => p.id === pacienteId)),
    enabled: !!pacienteId
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const tipoIcp = paciente?.hemodinamica?.tipo_icp || tipoIcpSelecionado;
  const agendamentoSalvo = paciente?.hemodinamica?.data_hora_agendamento_icp;

  const isAgendamentoAtivo = () => {
    if (!agendamentoSalvo) return false;
    return new Date() >= new Date(agendamentoSalvo);
  };

  const podeRegistrarChegada = tipoIcp === "imediata" || isAgendamentoAtivo();

  const gerarPDF = async (pacienteData) => {
    if (!relatorioRef.current) return null;
    try {
      const canvas = await html2canvas(relatorioRef.current, {
        scale: 1.8, logging: false, useCORS: true, allowTaint: false,
        backgroundColor: '#ffffff', imageTimeout: 15000
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
      const nome = (pacienteData?.nome_completo || 'Paciente').replace(/\s+/g, '_');
      const arquivo = new File([pdfBlob], `Relatorio_Hemodinamica_${nome}_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`, { type: 'application/pdf' });
      const result = await base44.integrations.Core.UploadFile({ file: arquivo });
      return result.file_url;
    } catch (err) {
      console.error("Erro PDF:", err);
      throw err;
    }
  };

  const gerarPDFAgendamento = async (dadosHemo) => {
    if (!agendamentoRelRef.current) return null;
    try {
      const canvas = await html2canvas(agendamentoRelRef.current, {
        scale: 1.8, logging: false, useCORS: true, allowTaint: false,
        backgroundColor: '#ffffff', imageTimeout: 15000
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
      const nome = (paciente?.nome_completo || 'Paciente').replace(/\s+/g, '_');
      const arquivo = new File([pdfBlob], `Agendamento_Hemo_${nome}_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`, { type: 'application/pdf' });
      const result = await base44.integrations.Core.UploadFile({ file: arquivo });
      return result.file_url;
    } catch (err) {
      console.error("Erro PDF agendamento:", err);
      throw err;
    }
  };

  const gerarPDFTransferencia = async (dadosTransf) => {
    if (!transferenciaRelRef.current) return null;
    try {
      const canvas = await html2canvas(transferenciaRelRef.current, {
        scale: 1.8, logging: false, useCORS: true, allowTaint: false,
        backgroundColor: '#ffffff', imageTimeout: 15000
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
      const nome = (paciente?.nome_completo || 'Paciente').replace(/\s+/g, '_');
      const arquivo = new File([pdfBlob], `Transferencia_Hemo_${nome}_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`, { type: 'application/pdf' });
      const result = await base44.integrations.Core.UploadFile({ file: arquivo });
      return result.file_url;
    } catch (err) {
      console.error("Erro PDF transferência:", err);
      throw err;
    }
  };

  const confirmarTipoIcp = useMutation({
    mutationFn: async () => {
      const dadosHemo = { ...paciente?.hemodinamica, tipo_icp: tipoIcpSelecionado };
      if (tipoIcpSelecionado !== "imediata" && agendamento.data && agendamento.hora) {
        dadosHemo.data_hora_agendamento_icp = new Date(`${agendamento.data}T${agendamento.hora}`).toISOString();
      }
      await base44.entities.Paciente.update(pacienteId, { hemodinamica: dadosHemo });
      // Gera PDF do agendamento para estratégias não imediatas
      if (tipoIcpSelecionado !== "imediata") {
        await new Promise(r => setTimeout(r, 500));
        const file_url = await gerarPDFAgendamento(dadosHemo);
        if (file_url) {
          await base44.entities.Paciente.update(pacienteId, { relatorio_agendamento_hemo_url: file_url });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['paciente', pacienteId]);
      if (tipoIcpSelecionado !== "imediata") {
        alert("Estratégia confirmada! Relatório de agendamento gerado e disponível na CERH e no Painel Assistencial.");
      }
    }
  });

  const registrarChegada = useMutation({
    mutationFn: async () => {
      await base44.entities.Paciente.update(pacienteId, {
        hemodinamica: { ...paciente.hemodinamica, data_hora_chegada: new Date().toISOString() },
        status: "Aguardando Hemodinâmica"
      });
    },
    onSuccess: () => { queryClient.invalidateQueries(['paciente', pacienteId]); alert("Chegada registrada!"); }
  });

  const iniciarProcedimento = useMutation({
    mutationFn: async () => {
      await base44.entities.Paciente.update(pacienteId, {
        hemodinamica: { ...paciente.hemodinamica, data_hora_inicio_procedimento: new Date().toISOString() },
        status: "Em Procedimento"
      });
    },
    onSuccess: () => { queryClient.invalidateQueries(['paciente', pacienteId]); alert("Procedimento iniciado!"); }
  });

  const iniciarICP = useMutation({
    mutationFn: async () => {
      await base44.entities.Paciente.update(pacienteId, {
        hemodinamica: { ...paciente.hemodinamica, data_hora_inicio_icp: new Date().toISOString() }
      });
    },
    onSuccess: () => { queryClient.invalidateQueries(['paciente', pacienteId]); alert("Início da ICP registrado!"); }
  });

  const registrarComparecimento = useMutation({
    mutationFn: async () => {
      await base44.entities.Paciente.update(pacienteId, {
        hemodinamica: { ...paciente.hemodinamica, comparecimento_paciente: comparecimento }
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['paciente', pacienteId])
  });

  const finalizarCaso = useMutation({
    mutationFn: async () => {
      setGerandoPDF(true);
      const dataHoraFim = new Date();
      const dadosHemo = {
        ...paciente.hemodinamica,
        ...formData,
        data_hora_fim_procedimento: dataHoraFim.toISOString()
      };
      if (paciente.hemodinamica?.data_hora_inicio_procedimento) {
        dadosHemo.porta_balao_minutos = Math.round((dataHoraFim - new Date(paciente.hemodinamica.data_hora_inicio_procedimento)) / 60000);
      }
      await base44.entities.Paciente.update(pacienteId, { hemodinamica: dadosHemo, status: "Concluído" });
      await new Promise(r => setTimeout(r, 600));
      const file_url = await gerarPDF(paciente);
      if (file_url) {
        await base44.entities.Paciente.update(pacienteId, { relatorio_hemodinamica_url: file_url });
      }
      setGerandoPDF(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['paciente', pacienteId]);
      alert("Caso finalizado! Relatório PDF gerado.");
      navigate(createPageUrl("Dashboard"));
    },
    onError: () => setGerandoPDF(false)
  });

  const transferirPaciente = useMutation({
    mutationFn: async ({ macroDestino, motivo }) => {
      const macroAtual = paciente?.hemodinamica_macro_responsavel || paciente?.macrorregiao;
      const historico = paciente?.historico_transferencias_hemo || [];
      
      const novaTransferencia = {
        data_hora: new Date().toISOString(),
        macro_origem: macroAtual,
        macro_destino: macroDestino,
        motivo: motivo,
        usuario: user?.full_name || user?.email || "Sistema"
      };

      // Armazena os dados para gerar o PDF
      setDadosTransferenciaTemp(novaTransferencia);

      // Atualiza o paciente
      await base44.entities.Paciente.update(pacienteId, {
        hemodinamica_macro_responsavel: macroDestino,
        historico_transferencias_hemo: [...historico, novaTransferencia],
        status: "Aguardando Hemodinâmica"
      });

      // Gera o PDF de transferência
      await new Promise(r => setTimeout(r, 500));
      const pdfUrl = await gerarPDFTransferencia(novaTransferencia);

      // Envia e-mail para a Unidade de Saúde
      if (pdfUrl) {
        const emailUnidade = paciente?.formulario_vaga?.email_unidade_solicitante || "";
        const emailBody = `
TRANSFERÊNCIA DE HEMODINÂMICA - NOTIFICAÇÃO

Prezada Unidade de Saúde ${paciente?.unidade_saude || ""},

Informamos que o paciente ${paciente?.nome_completo || ""} foi transferido da Hemodinâmica ${macroAtual} para a Hemodinâmica ${macroDestino}.

MOTIVO DA TRANSFERÊNCIA:
${motivo}

É NECESSÁRIO PROVIDENCIAR O TRANSPORTE do paciente para a nova unidade de destino conforme orientação da regulação.

Relatório completo em anexo (link): ${pdfUrl}

Data/Hora da Transferência: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
Responsável: ${user?.full_name || user?.email || "CERH"}

Atenciosamente,
Central Estadual de Regulação Hospitalar - CERH
Programa Coração Paraibano
        `;

        try {
          if (emailUnidade) {
            await base44.integrations.Core.SendEmail({
              from_name: "CERH - Coração Paraibano",
              to: emailUnidade,
              subject: `URGENTE - Transferência de Hemodinâmica: ${paciente?.nome_completo}`,
              body: emailBody
            });
          }
        } catch (emailError) {
          console.error("Erro ao enviar e-mail:", emailError);
        }
      }

      setDadosTransferenciaTemp(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['paciente', pacienteId]);
      queryClient.invalidateQueries(['pacientes']);
      setDialogoTransferenciaAberto(false);
      alert("Paciente transferido com sucesso! PDF gerado e e-mail enviado à Unidade de Saúde.");
      navigate(createPageUrl("Dashboard"));
    }
  });

  if (isLoading) return <div className="p-8">Carregando...</div>;
  if (!paciente) return <div className="p-8">Paciente não encontrado</div>;

  const tipoIcpDefinido = !!paciente?.hemodinamica?.tipo_icp;
  const estaEmStandby = tipoIcp && tipoIcp !== "imediata" && agendamentoSalvo && !isAgendamentoAtivo();

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">

      {/* Template oculto - Relatório de Transferência */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={transferenciaRelRef} className="bg-white p-8" style={{ width: '210mm', minHeight: '297mm' }}>
          <div className="mb-6 pb-4 border-b-2 border-gray-300">
            <div className="flex items-center justify-between gap-4 w-full mb-3">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/8e093c8da_logoSecretariadeEstadodaSade.png" alt="Governo da Paraíba" className="h-12 w-auto object-contain" crossOrigin="anonymous" />
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/fa5f3a17e_LOGOCORAAOPARAIBANO.png" alt="Coração Paraibano" className="h-12 w-auto object-contain" crossOrigin="anonymous" />
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/006e0d9aa_LogoComplexoregulador.jpg" alt="Complexo Regulador" className="h-12 w-auto object-contain" crossOrigin="anonymous" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-orange-700">RELATÓRIO DE TRANSFERÊNCIA - HEMODINÂMICA</h1>
              <p className="text-sm text-gray-600 mt-1">Emitido em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            </div>
          </div>

          <div className="mb-4 p-4 bg-orange-50 border-2 border-orange-300 rounded">
            <h2 className="text-base font-bold text-orange-800 mb-2">⚠️ ATENÇÃO - TRANSFERÊNCIA DE PACIENTE</h2>
            <p className="text-sm text-orange-900">Este documento notifica a transferência de hemodinâmica. A Unidade de Saúde deve providenciar o transporte do paciente conforme orientação da regulação.</p>
          </div>

          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">DADOS DO PACIENTE</h2>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div><span className="font-semibold">Nome:</span> {paciente?.nome_completo}</div>
              <div><span className="font-semibold">Idade:</span> {paciente?.idade} anos | <span className="font-semibold">Sexo:</span> {paciente?.sexo}</div>
              <div><span className="font-semibold">Unidade de Origem:</span> {paciente?.unidade_saude}</div>
              <div><span className="font-semibold">Macrorregião de Origem:</span> {paciente?.macrorregiao}</div>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">DADOS DA TRANSFERÊNCIA</h2>
            <div className="text-sm space-y-2 p-3 bg-blue-50 border border-blue-200 rounded">
              <p><span className="font-semibold">Data/Hora:</span> {dadosTransferenciaTemp ? format(new Date(dadosTransferenciaTemp.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : ""}</p>
              <p><span className="font-semibold">Hemodinâmica Origem:</span> {dadosTransferenciaTemp?.macro_origem || ""}</p>
              <p><span className="font-semibold">Hemodinâmica Destino:</span> {dadosTransferenciaTemp?.macro_destino || ""}</p>
              <p><span className="font-semibold">Responsável pela Transferência:</span> {dadosTransferenciaTemp?.usuario || ""}</p>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">MOTIVO DA TRANSFERÊNCIA</h2>
            <div className="text-sm p-3 bg-yellow-50 border border-yellow-300 rounded">
              <p className="whitespace-pre-wrap">{dadosTransferenciaTemp?.motivo || ""}</p>
            </div>
          </div>

          <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded">
            <h2 className="text-base font-bold text-red-800 mb-2">AÇÃO NECESSÁRIA</h2>
            <p className="text-sm text-red-900 font-semibold">A Unidade de Saúde deve PROVIDENCIAR O TRANSPORTE do paciente para a nova unidade de hemodinâmica conforme orientação da Central de Regulação.</p>
          </div>

          <div className="mt-8 pt-4 border-t-2 border-gray-300 text-xs text-gray-600">
            <p className="font-semibold">Central Estadual de Regulação Hospitalar - CERH</p>
            <p className="font-semibold">Sistema de Triagem de Dor Torácica - Coração Paraibano</p>
            <p>Desenvolvedor: Walber Alves Frazão Júnior - COREN 110.238</p>
            <p>Gerado em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
          </div>
        </div>
      </div>

      {/* Template oculto - Relatório de Agendamento */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={agendamentoRelRef} className="bg-white p-8" style={{ width: '210mm', minHeight: '297mm' }}>
          <div className="mb-6 pb-4 border-b-2 border-gray-300">
            <div className="flex items-center justify-between gap-4 w-full mb-3">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/8e093c8da_logoSecretariadeEstadodaSade.png" alt="Governo da Paraíba" className="h-12 w-auto object-contain" crossOrigin="anonymous" />
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/fa5f3a17e_LOGOCORAAOPARAIBANO.png" alt="Coração Paraibano" className="h-12 w-auto object-contain" crossOrigin="anonymous" />
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/006e0d9aa_LogoComplexoregulador.jpg" alt="Complexo Regulador" className="h-12 w-auto object-contain" crossOrigin="anonymous" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-pink-700">RELATÓRIO DE AGENDAMENTO - HEMODINÂMICA {paciente?.hemodinamica_macro_responsavel || paciente?.macrorregiao || ''}</h1>
              <p className="text-sm text-gray-600 mt-1">Emitido em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">DADOS DO PACIENTE</h2>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div><span className="font-semibold">Nome:</span> {paciente?.nome_completo}</div>
              <div><span className="font-semibold">Idade:</span> {paciente?.idade} anos | <span className="font-semibold">Sexo:</span> {paciente?.sexo}</div>
              <div><span className="font-semibold">Unidade de Origem:</span> {paciente?.unidade_saude}</div>
              <div><span className="font-semibold">Macrorregião:</span> {paciente?.macrorregiao}</div>
              {paciente?.formulario_vaga?.email_unidade_solicitante && (
                <div className="col-span-2"><span className="font-semibold">E-mail da Unidade:</span> {paciente.formulario_vaga.email_unidade_solicitante}</div>
              )}
            </div>
          </div>

          {paciente?.triagem_medica && (
            <div className="mb-4">
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">SINAIS VITAIS</h2>
              <div className="grid grid-cols-4 gap-1 text-xs">
                {(() => {
                  const pa = paciente.triagem_medica.pa_braco_esquerdo || "";
                  const parts = pa.split('/');
                  const pas = parts[0]?.trim();
                  const pad = parts[1]?.trim();
                  return (<>
                    {pas && <div><span className="font-semibold">PAS (mm Hg):</span> {pas}</div>}
                    {pad && <div><span className="font-semibold">PAD (mm Hg):</span> {pad}</div>}
                  </>);
                })()}
                {paciente.triagem_medica.frequencia_cardiaca && <div><span className="font-semibold">FC:</span> {paciente.triagem_medica.frequencia_cardiaca} bpm</div>}
                {paciente.triagem_medica.spo2 && <div><span className="font-semibold">SpO2:</span> {paciente.triagem_medica.spo2}%</div>}
                {paciente.triagem_medica.glicemia_capilar && <div><span className="font-semibold">Glicemia:</span> {paciente.triagem_medica.glicemia_capilar} mg/dL</div>}
              </div>
            </div>
          )}

          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">CONDUTA DO CARDIOLOGISTA</h2>
            <div className="text-sm space-y-2 p-3 bg-pink-50 border border-pink-200 rounded">
              <p><span className="font-semibold">Estratégia Definida:</span> {TIPO_ICP_LABELS[tipoIcpSelecionado] || ""}</p>
              {agendamento.data && agendamento.hora && (
                <p><span className="font-semibold">Data/Hora Agendada:</span> {format(new Date(`${agendamento.data}T${agendamento.hora}`), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              )}
            </div>
          </div>

          {paciente?.assessoria_cardiologia && (
            <div className="mb-4">
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">PARECER ASSCARDIO</h2>
              <div className="text-xs space-y-1">
                {paciente.assessoria_cardiologia.cardiologista_nome && (
                  <p><span className="font-semibold">Cardiologista:</span> {paciente.assessoria_cardiologia.cardiologista_nome} - CRM {paciente.assessoria_cardiologia.cardiologista_crm}{paciente.assessoria_cardiologia.cardiologista_rqe ? ` | RQE: ${paciente.assessoria_cardiologia.cardiologista_rqe}` : ''}</p>
                )}
                {paciente.assessoria_cardiologia.diagnostico_estrategia && (
                  <p><span className="font-semibold">Diagnóstico + Estratégia:</span> {paciente.assessoria_cardiologia.diagnostico_estrategia}</p>
                )}
                {paciente.assessoria_cardiologia.parecer_cardiologista && (
                  <p className="whitespace-pre-wrap"><span className="font-semibold">Parecer:</span> {paciente.assessoria_cardiologia.parecer_cardiologista}</p>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 pt-4 border-t-2 border-gray-300 text-xs text-gray-600">
            <p className="font-semibold">Sistema de Triagem de Dor Torácica - Coração Paraibano</p>
            <p>Desenvolvedor: Walber Alves Frazão Júnior - COREN 110.238</p>
            <p>Gerado em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
          </div>
        </div>
      </div>

      {/* Template oculto para PDF */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={relatorioRef} className="bg-white p-8" style={{ width: '210mm', minHeight: '297mm' }}>
          <div className="mb-6 pb-4 border-b-2 border-gray-300">
            <div className="flex items-center justify-between gap-4 w-full mb-3">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/8e093c8da_logoSecretariadeEstadodaSade.png" alt="Governo da Paraíba" className="h-12 w-auto object-contain" crossOrigin="anonymous" />
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/fa5f3a17e_LOGOCORAAOPARAIBANO.png" alt="Coração Paraibano" className="h-12 w-auto object-contain" crossOrigin="anonymous" />
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/006e0d9aa_LogoComplexoregulador.jpg" alt="Complexo Regulador" className="h-12 w-auto object-contain" crossOrigin="anonymous" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-pink-700">RELATÓRIO HEMODINÂMICA</h1>
              <p className="text-sm text-gray-600 mt-1">Data: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">DADOS DO PACIENTE</h2>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div><span className="font-semibold">Nome:</span> {paciente?.nome_completo}</div>
              <div><span className="font-semibold">Idade:</span> {paciente?.idade} anos | <span className="font-semibold">Sexo:</span> {paciente?.sexo}</div>
              <div><span className="font-semibold">Unidade:</span> {paciente?.unidade_saude}</div>
              <div><span className="font-semibold">Macrorregiâo:</span> {paciente?.macrorregiao}</div>
              {paciente?.formulario_vaga?.email_unidade_solicitante && (
                <div className="col-span-2"><span className="font-semibold">E-mail da Unidade:</span> {paciente.formulario_vaga.email_unidade_solicitante}</div>
              )}
            </div>
          </div>

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

          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">TIPO DE ICP</h2>
            <p className="text-sm font-semibold">{TIPO_ICP_LABELS[paciente?.hemodinamica?.tipo_icp] || "-"}</p>
            {paciente?.hemodinamica?.data_hora_agendamento_icp && (
              <p className="text-xs text-gray-600 mt-1">Agendamento: {format(new Date(paciente.hemodinamica.data_hora_agendamento_icp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            )}
          </div>

          {paciente?.hemodinamica?.comparecimento_paciente && (
            <div className="mb-4">
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">COMPARECIMENTO</h2>
              <p className="text-sm">{paciente.hemodinamica.comparecimento_paciente === "compareceu" ? "✓ Paciente compareceu" : "✗ Paciente não compareceu"}</p>
            </div>
          )}

          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">CONTROLE DE PROCEDIMENTO</h2>
            <div className="text-xs space-y-1">
              {paciente?.hemodinamica?.data_hora_chegada && <p><span className="font-semibold">Chegada:</span> {format(new Date(paciente.hemodinamica.data_hora_chegada), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>}
              {paciente?.hemodinamica?.data_hora_inicio_procedimento && <p><span className="font-semibold">Início Procedimento:</span> {format(new Date(paciente.hemodinamica.data_hora_inicio_procedimento), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>}
              {paciente?.hemodinamica?.data_hora_inicio_icp && <p><span className="font-semibold">Início ICP:</span> {format(new Date(paciente.hemodinamica.data_hora_inicio_icp), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>}
            </div>
          </div>

          {formData.procedimento_realizado && (
            <div className="mb-4">
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">PROCEDIMENTO REALIZADO</h2>
              <p className="text-xs whitespace-pre-wrap">{formData.procedimento_realizado}</p>
            </div>
          )}

          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">DESFECHO</h2>
            <div className="text-xs space-y-1">
              <p><span className="font-semibold">ICP Realizada:</span> {formData.icp_realizada ? "Sim" : "Não"}</p>
              {formData.icp_realizada && <p><span className="font-semibold">Reperfusão Efetiva:</span> {formData.reperfusao_efetiva ? "Sim" : "Não"}</p>}
              <p><span className="font-semibold">Desfecho:</span> {formData.desfecho}</p>
              {formData.intercorrencias && <p><span className="font-semibold">Intercorrências:</span> {formData.intercorrencias}</p>}
            </div>
          </div>

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
            <ArrowLeft className="w-4 h-4 mr-2" />Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-8 h-8 text-pink-600" />
              HEMODINÂMICA - Procedimento
            </h1>
            <p className="text-gray-600">Registro de procedimento e desfecho</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <DadosPaciente paciente={paciente} />
            <MonitorTransporte paciente={paciente} />
            <LinhaTempo paciente={paciente} />
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* Relatório da Unidade */}
            {paciente.relatorio_triagem_url && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />Relatório da Unidade de Saúde
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => window.open(paciente.relatorio_triagem_url, '_blank')} className="w-full">
                    <FileText className="w-4 h-4 mr-2" />Visualizar Relatório
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Parecer ASSCARDIO */}
            {paciente.relatorio_asscardio_url && (
              <Card className="border-2 border-red-300 bg-red-50">
                <CardHeader className="bg-red-100">
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <FileText className="w-5 h-5 text-red-600" />
                    Parecer Cardiológico - ASSCARDIO
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => window.open(paciente.relatorio_asscardio_url, '_blank')}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    ABRIR PARECER COMPLETO ASSCARDIO
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* ETAPA 1: Definir Tipo de ICP */}
            {!tipoIcpDefinido && (
              <Card className="border-2 border-pink-300">
                <CardHeader className="bg-pink-50">
                  <CardTitle className="flex items-center gap-2 text-pink-800">
                    <Activity className="w-5 h-5" />
                    Definição do Tipo de ICP
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div>
                    <Label className="text-base font-semibold">Qual é a estratégia definida?</Label>
                    <Select value={tipoIcpSelecionado} onValueChange={setTipoIcpSelecionado}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="imediata">ICP Imediata</SelectItem>
                        <SelectItem value="ate_24h">Regulado para: Estratégia 2 – Estratégia Invasiva Precoce</SelectItem>
                        <SelectItem value="ate_72h">Regulado para: Estratégia 3 – Estratégia Invasiva Durante o Internamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {tipoIcpSelecionado && tipoIcpSelecionado !== "imediata" && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
                      <div className="flex items-center gap-2 text-yellow-800 font-semibold">
                        <Calendar className="w-4 h-4" />
                        Agendamento do Procedimento
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Data</Label>
                          <Input type="date" value={agendamento.data} onChange={e => setAgendamento({ ...agendamento, data: e.target.value })} />
                        </div>
                        <div>
                          <Label>Hora</Label>
                          <Input type="time" value={agendamento.hora} onChange={e => setAgendamento({ ...agendamento, hora: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  )}

                  {tipoIcpSelecionado && (
                    <Button
                      onClick={() => confirmarTipoIcp.mutate()}
                      disabled={confirmarTipoIcp.isPending || (tipoIcpSelecionado !== "imediata" && (!agendamento.data || !agendamento.hora))}
                      className="w-full bg-pink-600 hover:bg-pink-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {confirmarTipoIcp.isPending ? "Salvando..." : "Confirmar Estratégia"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Informação de tipo de ICP já definido */}
            {tipoIcpDefinido && (
              <Card className="border-pink-200 bg-pink-50">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-pink-600" />
                      <div>
                        <p className="font-semibold text-pink-800">Estratégia Definida</p>
                        <p className="text-sm text-pink-700">{TIPO_ICP_LABELS[paciente.hemodinamica.tipo_icp]}</p>
                        {agendamentoSalvo && (
                          <p className="text-xs text-gray-600 mt-1">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            Agendado para: {format(new Date(agendamentoSalvo), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                    {!paciente.hemodinamica?.data_hora_inicio_procedimento && (
                      <Button
                        onClick={() => setDialogoTransferenciaAberto(true)}
                        variant="outline"
                        className="border-orange-400 text-orange-700 hover:bg-orange-50"
                        size="sm"
                      >
                        <ArrowRightLeft className="w-4 h-4 mr-2" />
                        Transferir
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STANDBY */}
            {estaEmStandby && (
              <Card className="border-2 border-yellow-400 bg-yellow-50">
                <CardContent className="pt-6 pb-6 text-center">
                  <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-yellow-800">Sistema em STANDBY</h3>
                  <p className="text-yellow-700 mt-2">Aguardando data do agendamento</p>
                  <p className="text-lg font-semibold text-yellow-900 mt-2">
                    {format(new Date(agendamentoSalvo), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                  <p className="text-sm text-yellow-600 mt-3">
                    Os botões de Registrar Chegada e Iniciar Procedimento serão habilitados na data/hora agendada.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Controle de Procedimento */}
            {tipoIcpDefinido && (
              <Card>
                <CardHeader>
                  <CardTitle>Controle de Procedimento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!paciente.hemodinamica?.data_hora_chegada && (
                    <>
                      {!podeRegistrarChegada && (
                        <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 p-3 rounded-lg text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          Botões habilitados somente na data/hora agendada.
                        </div>
                      )}
                      <Button
                        onClick={() => registrarChegada.mutate()}
                        disabled={registrarChegada.isPending || !podeRegistrarChegada}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {registrarChegada.isPending ? "Registrando..." : "Registrar Chegada"}
                      </Button>
                    </>
                  )}

                  {paciente.hemodinamica?.data_hora_chegada && !paciente.hemodinamica?.data_hora_inicio_procedimento && (
                    <Button
                      onClick={() => iniciarProcedimento.mutate()}
                      disabled={iniciarProcedimento.isPending}
                      className="w-full bg-pink-600 hover:bg-pink-700"
                    >
                      {iniciarProcedimento.isPending ? "Iniciando..." : "Iniciar Procedimento"}
                    </Button>
                  )}

                  {paciente.hemodinamica?.data_hora_inicio_procedimento && !paciente.hemodinamica?.data_hora_inicio_icp && (
                    <Button
                      onClick={() => iniciarICP.mutate()}
                      disabled={iniciarICP.isPending}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {iniciarICP.isPending ? "Registrando..." : "Hora do Início da ICP"}
                    </Button>
                  )}

                  {paciente.hemodinamica?.data_hora_chegada && (
                    <div className="pt-3 border-t space-y-2">
                      <Badge className="bg-blue-600">Chegada: {new Date(paciente.hemodinamica.data_hora_chegada).toLocaleString('pt-BR')}</Badge>
                      {paciente.hemodinamica?.data_hora_inicio_procedimento && (
                        <div><Badge className="bg-pink-600">Início: {new Date(paciente.hemodinamica.data_hora_inicio_procedimento).toLocaleString('pt-BR')}</Badge></div>
                      )}
                      {paciente.hemodinamica?.data_hora_inicio_icp && (
                        <div><Badge className="bg-purple-600">Início ICP: {new Date(paciente.hemodinamica.data_hora_inicio_icp).toLocaleString('pt-BR')}</Badge></div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Confirmação de Comparecimento (para ICP agendada) */}
            {tipoIcpDefinido && tipoIcp !== "imediata" && paciente.hemodinamica?.data_hora_inicio_procedimento && !paciente.hemodinamica?.comparecimento_paciente && (
              <Card className="border-2 border-blue-300">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-blue-800">Confirmação de Comparecimento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  <p className="text-sm text-gray-700">O paciente compareceu à Hemodinâmica na data/hora agendada?</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={comparecimento === "compareceu" ? "default" : "outline"}
                      onClick={() => setComparecimento("compareceu")}
                      className={comparecimento === "compareceu" ? "bg-green-600 hover:bg-green-700" : "border-green-400 text-green-700"}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />Compareceu
                    </Button>
                    <Button
                      variant={comparecimento === "nao_compareceu" ? "default" : "outline"}
                      onClick={() => setComparecimento("nao_compareceu")}
                      className={comparecimento === "nao_compareceu" ? "bg-red-600 hover:bg-red-700" : "border-red-400 text-red-700"}
                    >
                      <XCircle className="w-4 h-4 mr-2" />Não Compareceu
                    </Button>
                  </div>
                  {comparecimento && (
                    <Button onClick={() => registrarComparecimento.mutate()} disabled={registrarComparecimento.isPending} className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      {registrarComparecimento.isPending ? "Salvando..." : "Confirmar"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Comparecimento já registrado */}
            {paciente.hemodinamica?.comparecimento_paciente && (
              <Card className={paciente.hemodinamica.comparecimento_paciente === "compareceu" ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}>
                <CardContent className="pt-4 flex items-center gap-3">
                  {paciente.hemodinamica.comparecimento_paciente === "compareceu"
                    ? <CheckCircle className="w-6 h-6 text-green-600" />
                    : <XCircle className="w-6 h-6 text-red-600" />}
                  <p className={`font-semibold ${paciente.hemodinamica.comparecimento_paciente === "compareceu" ? "text-green-800" : "text-red-800"}`}>
                    {paciente.hemodinamica.comparecimento_paciente === "compareceu" ? "Paciente compareceu à hemodinâmica" : "Paciente não compareceu à hemodinâmica"}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Formulário de Finalização */}
            {paciente.hemodinamica?.data_hora_inicio_procedimento && !paciente.hemodinamica?.data_hora_fim_procedimento && (
              <Card>
                <CardHeader><CardTitle>Finalização do Caso</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Procedimento Realizado</Label>
                    <Textarea value={formData.procedimento_realizado} onChange={(e) => setFormData({...formData, procedimento_realizado: e.target.value})} placeholder="Descreva o procedimento realizado..." rows={4} />
                  </div>
                  <div>
                    <Label>Intercorrências</Label>
                    <Textarea value={formData.intercorrencias} onChange={(e) => setFormData({...formData, intercorrencias: e.target.value})} placeholder="Registre intercorrências..." rows={3} />
                  </div>
                  <div>
                    <Label>ICP Realizada?</Label>
                    <Select value={formData.icp_realizada ? "sim" : "nao"} onValueChange={(v) => setFormData({...formData, icp_realizada: v === "sim"})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.icp_realizada && (
                    <div>
                      <Label>Reperfusão Efetiva?</Label>
                      <Select value={formData.reperfusao_efetiva ? "sim" : "nao"} onValueChange={(v) => setFormData({...formData, reperfusao_efetiva: v === "sim"})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sim">Sim</SelectItem>
                          <SelectItem value="nao">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label>Desfecho</Label>
                    <Select value={formData.desfecho} onValueChange={(v) => setFormData({...formData, desfecho: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sucesso">Sucesso</SelectItem>
                        <SelectItem value="Complicações">Complicações</SelectItem>
                        <SelectItem value="Óbito">Óbito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Observações</Label>
                    <Textarea value={formData.observacoes} onChange={(e) => setFormData({...formData, observacoes: e.target.value})} placeholder="Observações adicionais..." rows={3} />
                  </div>
                  <Button onClick={() => finalizarCaso.mutate()} disabled={finalizarCaso.isPending || gerandoPDF} className="w-full bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    {gerandoPDF ? "Gerando PDF..." : finalizarCaso.isPending ? "Finalizando..." : "Finalizar Caso e Gerar PDF"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Relatório PDF */}
            {paciente.relatorio_hemodinamica_url && (
              <Card className="border-pink-200">
                <CardHeader className="bg-pink-50">
                  <CardTitle className="flex items-center gap-2 text-pink-700">
                    <FileText className="w-5 h-5" />Relatório Hemodinâmica
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => window.open(paciente.relatorio_hemodinamica_url, '_blank')} className="w-full bg-pink-600 hover:bg-pink-700">
                    <Download className="w-4 h-4 mr-2" />Baixar Relatório PDF
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <DialogoTransferencia
        open={dialogoTransferenciaAberto}
        onClose={() => setDialogoTransferenciaAberto(false)}
        paciente={paciente}
        onConfirmar={(dados) => transferirPaciente.mutate(dados)}
        isLoading={transferirPaciente.isPending}
      />
    </div>
  );
}