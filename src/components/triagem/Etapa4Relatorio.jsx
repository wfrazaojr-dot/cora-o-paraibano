import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, FileText, Download, CheckCircle, AlertCircle, Heart, Activity, Truck } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import TempoDor from "./TempoDor";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function Etapa4Relatorio({ dadosPaciente, onAnterior, pacienteId }) {
  const navigate = useNavigate();
  const relatorioRef = useRef(null);
  const queryClient = useQueryClient();
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [medico, setMedico] = useState({
    nome: dadosPaciente.medico_nome || "",
    crm: dadosPaciente.medico_crm || "",
    celular: dadosPaciente.medico_celular || ""
  });
  const [confirmacaoHemodinamica, setConfirmacaoHemodinamica] = useState(null);

  const updatePacienteMutation = useMutation({
    mutationFn: async (dados) => {
      return await base44.entities.Paciente.update(pacienteId, dados);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paciente', pacienteId] });
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
    },
  });

  const tempoDorMinutos = dadosPaciente.data_hora_inicio_sintomas
    ? differenceInMinutes(new Date(), new Date(dadosPaciente.data_hora_inicio_sintomas))
    : null;
  const tempoDorHoras = tempoDorMinutos ? Math.floor(tempoDorMinutos / 60) : 0;
  const tempoDorMin = tempoDorMinutos ? tempoDorMinutos % 60 : 0;

  const gerarPDF = async () => {
    if (!relatorioRef.current) return;

    setGerandoPDF(true);
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
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Relatorio_${dadosPaciente.nome_completo?.replace(/ /g, "_")}_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    }
    setGerandoPDF(false);
  };

  const gerarEUploadPDF = async () => {
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
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const pdfBlob = pdf.output('blob');
      const pdfFile = new File([pdfBlob], `Relatorio_${dadosPaciente.nome_completo?.replace(/ /g, "_")}_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`, { type: 'application/pdf' });

      const uploadResult = await base44.integrations.Core.UploadFile({ file: pdfFile });
      return uploadResult.file_url;
    } catch (error) {
      console.error("Erro ao gerar e fazer upload do PDF:", error);
      throw error;
    }
  };

  const handleFinalizar = async () => {
    if (!medico.nome || !medico.crm || !medico.celular) {
      alert("Por favor, preencha o nome, CRM e celular do médico");
      return;
    }
    if (confirmacaoHemodinamica === null) {
      alert("Por favor, responda se o USA está disponível com chegada na Hemodinâmica < 90 minutos.");
      return;
    }

    setGerandoPDF(true);
    try {
      const pdfUrl = await gerarEUploadPDF();
      
      await updatePacienteMutation.mutateAsync({
        medico_nome: medico.nome,
        medico_crm: medico.crm,
        medico_celular: medico.celular,
        tempo_deslocamento_minutos: confirmacaoHemodinamica ? 60 : 120,
        usa_disponivel_menos_90min: confirmacaoHemodinamica,
        status: "Aguardando Assessoria",
        relatorio_triagem_url: pdfUrl,
      });
      alert("Atendimento finalizado com sucesso!");
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Erro ao finalizar atendimento:", error);
      alert("Erro ao finalizar atendimento. Tente novamente.");
    }
    setGerandoPDF(false);
  };

  return (
    <div className="space-y-6">
      {/* Header com as 3 logos */}
      <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between gap-4 w-full">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/8e093c8da_logoSecretariadeEstadodaSade.png" 
            alt="Secretaria de Estado da Saúde" 
            className="h-16 md:h-20 w-auto object-contain"
          />
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/fa5f3a17e_LOGOCORAAOPARAIBANO.png" 
            alt="Coração Paraibano" 
            className="h-16 md:h-20 w-auto object-contain"
          />
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/873a4a563_logo.png" 
            alt="PBSAÚDE" 
            className="h-16 md:h-20 w-auto object-contain"
          />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Relatório Final</h2>
        <p className="text-gray-600">Revisão completa do atendimento</p>
      </div>

      {/* Tempo de Dor */}
      <TempoDor dataHoraInicioSintomas={dadosPaciente.data_hora_inicio_sintomas} />

      {/* Identificação do Médico */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-lg mb-4">Identificação do Médico Responsável</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="medico_nome">Nome Completo *</Label>
            <Input
              id="medico_nome"
              value={medico.nome}
              onChange={(e) => setMedico({...medico, nome: e.target.value})}
              placeholder="Nome do médico"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="medico_crm">CRM *</Label>
            <Input
              id="medico_crm"
              value={medico.crm}
              onChange={(e) => setMedico({...medico, crm: e.target.value})}
              placeholder="Número do CRM"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="medico_celular">Celular com DDD *</Label>
            <Input
              id="medico_celular"
              value={medico.celular}
              onChange={(e) => setMedico({...medico, celular: e.target.value})}
              placeholder="(83) 99999-9999"
              required
            />
          </div>
        </div>
      </div>

      {/* Disponibilidade de USA */}
      <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Truck className="w-6 h-6 text-orange-600" />
          <h3 className="font-bold text-lg text-orange-900">USA Disponível com chegada na Hemodinâmica &lt; 90 minutos?</h3>
        </div>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Button
              type="button"
              variant={confirmacaoHemodinamica === true ? "default" : "outline"}
              onClick={() => setConfirmacaoHemodinamica(true)}
              className={confirmacaoHemodinamica === true ? "bg-green-600 hover:bg-green-700" : ""}
            >
              Sim
            </Button>
            <Button
              type="button"
              variant={confirmacaoHemodinamica === false ? "default" : "outline"}
              onClick={() => setConfirmacaoHemodinamica(false)}
              className={confirmacaoHemodinamica === false ? "bg-red-600 hover:bg-red-700" : ""}
            >
              Não
            </Button>
          </div>

          {confirmacaoHemodinamica === true && dadosPaciente.data_hora_inicio_triagem && (
            <Alert className="bg-blue-100 border-blue-400">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <AlertDescription className="text-blue-900 font-bold">
                {(() => {
                  const dataInicioTriagem = new Date(dadosPaciente.data_hora_inicio_triagem);
                  const horarioLimite = new Date(dataInicioTriagem.getTime() + 120 * 60 * 1000);
                  return `Horário Limite Estimado para Chegada a Hemodinâmica: ${format(horarioLimite, "dd/MM/yyyy HH:mm", { locale: ptBR })}`;
                })()}
              </AlertDescription>
            </Alert>
          )}

          {confirmacaoHemodinamica === false && (
            <Alert className="bg-red-100 border-red-600 border-2">
              <AlertCircle className="h-6 w-6 text-red-700" />
              <AlertDescription className="text-red-900 font-bold text-base">
                Esteja preparado para possível trombólise, avalie os critérios e as medicações necessárias e aguarde o parecer da cardiologia.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Relatório Visual */}
      <div 
        ref={relatorioRef} 
        className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-lg"
        style={{ maxWidth: "210mm" }}
      >
        {/* Cabeçalho com logos */}
        <div className="mb-4">
          <div className="flex items-center justify-between gap-3 w-full mb-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/8e093c8da_logoSecretariadeEstadodaSade.png" 
              alt="Secretaria de Estado da Saúde" 
              className="h-12 w-auto object-contain"
              crossOrigin="anonymous"
            />
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/fa5f3a17e_LOGOCORAAOPARAIBANO.png" 
              alt="Coração Paraibano" 
              className="h-12 w-auto object-contain"
              crossOrigin="anonymous"
            />
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/873a4a563_logo.png" 
              alt="PBSAÚDE" 
              className="h-12 w-auto object-contain"
              crossOrigin="anonymous"
            />
          </div>
          <div className="text-center pb-2 border-b-2 border-red-600">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Heart className="w-6 h-6 text-red-600" />
              <h1 className="text-xl font-bold text-red-600">RELATÓRIO DE ATENDIMENTO</h1>
            </div>
            <p className="text-sm font-semibold text-gray-700">Dor Torácica - Síndrome Coronariana Aguda</p>
            {dadosPaciente.unidade_saude && (
              <div className="mt-2 bg-blue-100 border border-blue-500 rounded p-1">
                <p className="text-blue-900 font-bold text-sm">{dadosPaciente.unidade_saude}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tempo Restante de Janela Terapêutica */}
        {tempoDorMinutos !== null && (
          <div className="mb-3 bg-red-50 border-2 border-red-500 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-red-600" />
              <h2 className="text-base font-bold text-red-900">TEMPO RESTANTE DE JANELA TERAPÊUTICA</h2>
            </div>
            <div className="text-center">
              {(() => {
                const janelaMaximaMinutos = 720; // 12 horas em minutos
                const tempoRestanteMinutos = janelaMaximaMinutos - tempoDorMinutos;
                const tempoRestanteHoras = Math.floor(Math.abs(tempoRestanteMinutos) / 60);
                const tempoRestanteMin = Math.abs(tempoRestanteMinutos) % 60;
                const foraJanela = tempoRestanteMinutos < 0;

                return (
                  <>
                    <p className={`text-3xl font-bold mb-2 ${foraJanela ? 'text-red-700' : 'text-red-600'}`}>
                      {foraJanela && '-'}{tempoRestanteHoras}h {tempoRestanteMin}min
                    </p>
                    <div className="text-xs text-gray-700 space-y-0.5 mb-2">
                      <p><strong>Tempo de Dor:</strong> {tempoDorHoras}h {tempoDorMin}min</p>
                      <p><strong>Início:</strong> {format(new Date(dadosPaciente.data_hora_inicio_sintomas), "dd/MM/yy HH:mm", { locale: ptBR })}</p>
                      <p><strong>Gerado:</strong> {format(new Date(), "dd/MM/yy HH:mm", { locale: ptBR })}</p>
                    </div>
                    {foraJanela ? (
                      <div className="mt-2 bg-red-200 border border-red-700 rounded p-1">
                        <p className="font-bold text-red-900 text-xs">⚠️ FORA DA JANELA (&gt;12h)</p>
                      </div>
                    ) : tempoRestanteMinutos < 60 ? (
                      <div className="mt-2 bg-yellow-200 border border-yellow-700 rounded p-1">
                        <p className="font-bold text-yellow-900 text-xs">⚠️ ENCERRANDO (&lt;1h)</p>
                      </div>
                    ) : (
                      <div className="mt-2 bg-green-200 border border-green-700 rounded p-1">
                        <p className="font-bold text-green-900 text-xs">✓ Dentro da janela</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Tempo Porta-Agulha */}
            {dadosPaciente.data_hora_inicio_triagem && (
              <div className="mt-2 pt-2 border-t border-red-400">
                <h3 className="text-sm font-bold text-red-900 mb-1">TEMPO PORTA-AGULHA</h3>
                {(() => {
                  const metaMinutos = 30;
                  const tempoPortaAgulhaMinutos = differenceInMinutes(new Date(), new Date(dadosPaciente.data_hora_inicio_triagem));
                  const tempoRestantePortaAgulha = metaMinutos - tempoPortaAgulhaMinutos;
                  const foraMetaPortaAgulha = tempoRestantePortaAgulha < 0;
                  const minutosPortaAgulha = Math.floor(Math.abs(tempoPortaAgulhaMinutos));

                  return (
                    <div className={`rounded p-2 border ${foraMetaPortaAgulha ? 'bg-red-100 border-red-600' : 'bg-green-100 border-green-600'}`}>
                      <div className="text-center">
                        <p className={`text-2xl font-bold mb-1 ${foraMetaPortaAgulha ? 'text-red-700' : 'text-green-700'}`}>
                          {minutosPortaAgulha} min
                        </p>
                        <p className="text-xs font-semibold mb-1">
                          {foraMetaPortaAgulha ? '⚠️ Excedido' : '✓ Restante: ' + Math.abs(tempoRestantePortaAgulha) + ' min'}
                        </p>
                        <p className="text-xs text-gray-600">
                          Meta: {metaMinutos}min | Triagem: {format(new Date(dadosPaciente.data_hora_inicio_triagem), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Dados do Paciente */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-300">DADOS DO PACIENTE</h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="font-semibold">Nome:</span> {dadosPaciente.nome_completo}</div>
            <div><span className="font-semibold">Idade:</span> {dadosPaciente.idade} anos</div>
            <div><span className="font-semibold">Sexo:</span> {dadosPaciente.sexo}</div>
            <div><span className="font-semibold">Chegada:</span> {dadosPaciente.data_hora_chegada ? format(new Date(dadosPaciente.data_hora_chegada), "dd/MM/yy HH:mm", { locale: ptBR }) : "-"}</div>
          </div>
        </div>

        {/* Classificação */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-300">CLASSIFICAÇÃO</h2>
          <div className={`rounded p-2 border ${
            dadosPaciente.triagem_medica?.tipo_sca === 'SCACESST' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'
          }`}>
            <p className="text-xs"><span className="font-semibold">SCA:</span> {dadosPaciente.triagem_medica?.tipo_sca || "-"}</p>
            <p className="text-xs"><span className="font-semibold">Prioridade:</span> {dadosPaciente.triagem_medica?.tipo_sca === 'SCACESST' ? 'Vermelha' : (dadosPaciente.classificacao_prioridade || "-")}</p>
          </div>
        </div>

        {/* Sinais Vitais */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-300">SINAIS VITAIS</h2>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div><span className="font-semibold">PA E:</span> {dadosPaciente.triagem_medica?.pa_braco_esquerdo || "-"}</div>
            <div><span className="font-semibold">PA D:</span> {dadosPaciente.triagem_medica?.pa_braco_direito || "-"}</div>
            <div><span className="font-semibold">FC:</span> {dadosPaciente.triagem_medica?.frequencia_cardiaca || "-"}</div>
            <div><span className="font-semibold">FR:</span> {dadosPaciente.triagem_medica?.frequencia_respiratoria || "-"}</div>
            <div><span className="font-semibold">Temp:</span> {dadosPaciente.triagem_medica?.temperatura || "-"}°C</div>
            <div><span className="font-semibold">SpO2:</span> {dadosPaciente.triagem_medica?.spo2 || "-"}%</div>
            <div><span className="font-semibold">Glic:</span> {dadosPaciente.triagem_medica?.glicemia_capilar || "-"}</div>
            <div><span className="font-semibold">DM/DPOC:</span> {dadosPaciente.triagem_medica?.diabetes ? "Sim" : "Não"}/{dadosPaciente.triagem_medica?.dpoc ? "Sim" : "Não"}</div>
          </div>
        </div>

        {/* ECG */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-300">ECG</h2>
          
          {/* Imagens do ECG */}
          {dadosPaciente.triagem_medica?.ecg_files?.length > 0 && (
            <div className="mb-3">
              <p className="font-semibold text-xs mb-2">Imagens do ECG:</p>
              <div className="grid grid-cols-1 gap-2">
                {dadosPaciente.triagem_medica.ecg_files.map((fileUrl, index) => (
                  <div key={index} className="border border-gray-300 rounded overflow-hidden">
                    {!fileUrl.toLowerCase().endsWith('.pdf') ? (
                      <img
                        src={fileUrl}
                        alt={`ECG ${index + 1}`}
                        className="w-full h-auto object-contain bg-gray-50"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="p-2 bg-gray-100 text-xs text-center">
                        ECG {index + 1} (PDF) - Visualizar arquivo separadamente
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {dadosPaciente.triagem_medica?.alteracoes_ecg?.length > 0 && (
            <div className="text-xs mb-2">
              <p className="font-semibold mb-1">Alterações:</p>
              <ul className="list-disc pl-4">
                {dadosPaciente.triagem_medica.alteracoes_ecg.slice(0, 3).map((alt, i) => (
                  <li key={i}>{alt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Avaliação Clínica */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-300">AVALIAÇÃO CLÍNICA</h2>
          <div className="space-y-2 text-xs">
            <div>
              <p className="font-semibold">Antecedentes:</p>
              <p className="text-gray-700">{dadosPaciente.avaliacao_clinica?.antecedentes || "-"}</p>
            </div>
            <div>
              <p className="font-semibold">Quadro Atual:</p>
              <p className="text-gray-700">{dadosPaciente.avaliacao_clinica?.quadro_atual || "-"}</p>
            </div>
            <div>
              <p className="font-semibold">Hipótese:</p>
              <p className="text-gray-700">{dadosPaciente.avaliacao_clinica?.hipotese_diagnostica || "-"}</p>
            </div>
          </div>
        </div>

        {/* HEART Score */}
        {dadosPaciente.avaliacao_clinica?.heart_score?.total > 0 && (
          <div className="mb-3 bg-blue-50 border border-blue-500 rounded p-2">
            <h3 className="font-bold text-xs">HEART SCORE: {dadosPaciente.avaliacao_clinica.heart_score.total} pontos</h3>
          </div>
        )}

        {/* Prescrição */}
        {dadosPaciente.avaliacao_clinica?.prescricao_medicamentos?.length > 0 && (
          <div className="mb-3">
            <h2 className="text-lg font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-300">PRESCRIÇÃO</h2>
            <table className="w-full text-xs border border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-400 p-1 text-left">Medicamento</th>
                  <th className="border border-gray-400 p-1 text-left">Dose</th>
                  <th className="border border-gray-400 p-1 text-left">Via</th>
                </tr>
              </thead>
              <tbody>
                {dadosPaciente.avaliacao_clinica.prescricao_medicamentos.map((med, i) => (
                  <tr key={i}>
                    <td className="border border-gray-400 p-1">{med.medicamento || med.nome || "-"}</td>
                    <td className="border border-gray-400 p-1">{med.dose || "-"}</td>
                    <td className="border border-gray-400 p-1">{med.via || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Exames Solicitados e Resultados */}
        {dadosPaciente.avaliacao_clinica?.exames_solicitados?.length > 0 && (
          <div className="mb-3">
            <h2 className="text-lg font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-300">EXAMES SOLICITADOS E RESULTADOS</h2>
            <table className="w-full text-xs border border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-400 p-1 text-left">Exame</th>
                  <th className="border border-gray-400 p-1 text-left">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {dadosPaciente.avaliacao_clinica.exames_solicitados.map((exame, i) => (
                  <tr key={i}>
                    <td className="border border-gray-400 p-1">{exame}</td>
                    <td className="border border-gray-400 p-1">{dadosPaciente.avaliacao_clinica?.resultados_exames?.[exame] || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dadosPaciente.avaliacao_clinica?.observacoes_exames && (
              <div className="mt-2 text-xs">
                {dadosPaciente.avaliacao_clinica.observacoes_exames.exames_nao_realizados && (
                  <p>• Exames não Realizados</p>
                )}
                {dadosPaciente.avaliacao_clinica.observacoes_exames.exames_nao_liberados && (
                  <p>• Exames Não Liberados até o Momento</p>
                )}
                {dadosPaciente.avaliacao_clinica.observacoes_exames.outros && (
                  <p>• Outros: {dadosPaciente.avaliacao_clinica.observacoes_exames.outros}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* USA Disponível */}
        {confirmacaoHemodinamica !== null && (
          <div className="mb-3">
            <h2 className="text-lg font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-300">USA DISPONÍVEL</h2>
            <div className={`p-2 rounded border text-xs ${confirmacaoHemodinamica ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
              <p><span className="font-semibold">USA com chegada &lt; 90min:</span> {confirmacaoHemodinamica ? 'Sim' : 'Não'}</p>
              {confirmacaoHemodinamica && dadosPaciente.data_hora_inicio_triagem && (
                <p className="text-blue-700 font-semibold">
                  Limite: {format(new Date(new Date(dadosPaciente.data_hora_inicio_triagem).getTime() + 120 * 60 * 1000), "dd/MM HH:mm", { locale: ptBR })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Médico Responsável */}
        <div className="mt-4 bg-green-50 border border-green-500 rounded p-2">
          <h3 className="font-bold text-xs mb-1">MÉDICO RESPONSÁVEL</h3>
          <div className="text-xs space-y-1">
            <div><span className="font-semibold">Nome:</span> {dadosPaciente.triagem_medica?.medico_nome || medico.nome || "-"}</div>
            <div><span className="font-semibold">CRM:</span> {dadosPaciente.triagem_medica?.medico_crm || medico.crm || "-"}</div>
            <div><span className="font-semibold">Celular:</span> {medico.celular || "-"}</div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-8 pt-4 border-t-2 border-gray-300 text-xs text-gray-600">
          <p className="font-semibold">Sistema de Triagem de Dor Torácica</p>
          <p>Autor: Walber Alves Frazão Júnior - COREN 110.238</p>
          <p>Gerado em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-col gap-4">
        <Button
          onClick={gerarPDF}
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={gerandoPDF || !medico.nome || !medico.crm || !medico.celular}
        >
          <Download className="w-4 h-4 mr-2" />
          {gerandoPDF ? "Gerando PDF..." : "Baixar Relatório em PDF"}
        </Button>

        {!medico.nome || !medico.crm || !medico.celular ? (
          <Alert className="border-orange-500 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Preencha todos os dados do médico (nome, CRM e celular) para gerar o PDF e finalizar o atendimento
            </AlertDescription>
          </Alert>
        ) : null}
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onAnterior}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Etapa Anterior
        </Button>
        <Button
          onClick={handleFinalizar}
          className="bg-green-600 hover:bg-green-700"
          disabled={!medico.nome || !medico.crm || !medico.celular || confirmacaoHemodinamica === null || gerandoPDF}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {gerandoPDF ? "Finalizando..." : "Finalizar Atendimento"}
        </Button>
      </div>
    </div>
  );
}