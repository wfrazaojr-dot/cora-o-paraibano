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
  const [tempoDeslocamento, setTempoDeslocamento] = useState(
    dadosPaciente.tempo_deslocamento_minutos || ""
  );
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [temKitTrombolitico, setTemKitTrombolitico] = useState(null);

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
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
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

  const handleFinalizar = async () => {
    if (!medico.nome || !medico.crm || !medico.celular) {
      alert("Por favor, preencha o nome, CRM e celular do médico");
      return;
    }
    if (tempoDeslocamento === "") {
      alert("Por favor, informe o tempo de deslocamento");
      return;
    }

    try {
      await updatePacienteMutation.mutateAsync({
        medico_nome: medico.nome,
        medico_crm: medico.crm,
        medico_celular: medico.celular,
        tempo_deslocamento_minutos: parseInt(tempoDeslocamento),
        status: "Aguardando Assessoria",
      });
      alert("Atendimento finalizado com sucesso!");
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Erro ao finalizar atendimento:", error);
      alert("Erro ao finalizar atendimento. Tente novamente.");
    }
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

      {/* Tempo de Deslocamento */}
      <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Truck className="w-6 h-6 text-orange-600" />
          <h3 className="font-bold text-lg text-orange-900">Se USA Disponível de Imediato, Informe o Tempo de Deslocamento</h3>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tempo_deslocamento">
            O tempo de deslocamento até a hemodinâmica será de quantos minutos? *
          </Label>
          <Input
            id="tempo_deslocamento"
            type="number"
            value={tempoDeslocamento}
            onChange={(e) => {
              const valor = parseInt(e.target.value) || "";
              setTempoDeslocamento(valor);
              if (valor > 90) {
                setMostrarAlerta(true);
              } else {
                setMostrarAlerta(false);
                setTemKitTrombolitico(null);
              }
            }}
            placeholder="Ex: 30, 60, 90..."
            min="0"
            required
          />
          <p className="text-xs text-gray-600">
            Tempo estimado de transporte do paciente até o centro de hemodinâmica
          </p>
        </div>

        {mostrarAlerta && (
          <div className="mt-4 space-y-4">
            <Alert className="bg-yellow-100 border-yellow-400">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <AlertDescription className="text-yellow-900 font-bold">
                ⚠️ Tempo de deslocamento superior a 90 minutos.
              </AlertDescription>
            </Alert>

            <div className="bg-white border-2 border-orange-500 rounded-lg p-4">
              <Label className="font-bold text-orange-900 mb-3 block">
                Seu serviço tem disponível o KIT Trombolítico de ALTEPLASE 100mg e ENOXAPARINA?
              </Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={temKitTrombolitico === true ? "default" : "outline"}
                  onClick={() => setTemKitTrombolitico(true)}
                  className={temKitTrombolitico === true ? "bg-green-600" : ""}
                >
                  Sim
                </Button>
                <Button
                  type="button"
                  variant={temKitTrombolitico === false ? "default" : "outline"}
                  onClick={() => setTemKitTrombolitico(false)}
                  className={temKitTrombolitico === false ? "bg-red-600" : ""}
                >
                  Não
                </Button>
              </div>
            </div>

            {temKitTrombolitico === true && (
              <Alert className="bg-red-100 border-red-600 border-2">
                <AlertCircle className="h-6 w-6 text-red-700" />
                <AlertDescription className="text-red-900 font-bold text-base">
                  🚨 ALERTA! Fique atento para possível autorização de trombólise. 
                  Abra sua caixa de e-mail e cobre a CERH a resposta da Cardiologia.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>

      {/* Relatório Visual */}
      <div 
        ref={relatorioRef} 
        className="bg-white border-2 border-gray-300 rounded-lg p-8 shadow-lg"
        style={{ minHeight: "800px" }}
      >
        {/* Cabeçalho com logos */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 w-full mb-6">
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
          <div className="text-center pb-4 border-b-4 border-red-600">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Heart className="w-10 h-10 text-red-600" />
              <h1 className="text-3xl font-bold text-red-600">RELATÓRIO DE ATENDIMENTO</h1>
            </div>
            <p className="text-lg font-semibold text-gray-700">Dor Torácica - Síndrome Coronariana Aguda</p>
            {dadosPaciente.unidade_saude && (
              <div className="mt-4 bg-blue-100 border-2 border-blue-500 rounded-lg p-3">
                <p className="text-blue-900 font-bold text-lg">{dadosPaciente.unidade_saude}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tempo Restante de Janela Terapêutica */}
        {tempoDorMinutos !== null && (
          <div className="mb-8 bg-red-50 border-4 border-red-500 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-8 h-8 text-red-600" />
              <h2 className="text-2xl font-bold text-red-900">TEMPO RESTANTE DE JANELA TERAPÊUTICA</h2>
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
                    <p className={`text-5xl font-bold mb-4 ${foraJanela ? 'text-red-700' : 'text-red-600'}`}>
                      {foraJanela && '-'}{tempoRestanteHoras}h {tempoRestanteMin}min
                    </p>
                    <div className="text-sm text-gray-700 space-y-1 mb-4">
                      <p><strong>Tempo de Dor:</strong> {tempoDorHoras}h {tempoDorMin}min</p>
                      <p><strong>Início dos sintomas:</strong> {format(new Date(dadosPaciente.data_hora_inicio_sintomas), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                      <p><strong>Relatório gerado em:</strong> {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                    </div>
                    {foraJanela ? (
                      <div className="mt-4 bg-red-200 border-2 border-red-700 rounded p-3">
                        <p className="font-bold text-red-900">⚠️ FORA DA JANELA TERAPÊUTICA (mais de 12 horas)</p>
                      </div>
                    ) : tempoRestanteMinutos < 60 ? (
                      <div className="mt-4 bg-yellow-200 border-2 border-yellow-700 rounded p-3">
                        <p className="font-bold text-yellow-900">⚠️ JANELA TERAPÊUTICA SE ENCERRANDO (menos de 1 hora restante)</p>
                      </div>
                    ) : (
                      <div className="mt-4 bg-green-200 border-2 border-green-700 rounded p-3">
                        <p className="font-bold text-green-900">✓ Dentro da janela terapêutica</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Dados do Paciente */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">DADOS DO PACIENTE</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="font-semibold">Nome:</span> {dadosPaciente.nome_completo}</div>
            <div><span className="font-semibold">Idade:</span> {dadosPaciente.idade} anos</div>
            <div><span className="font-semibold">Sexo:</span> {dadosPaciente.sexo}</div>
            <div><span className="font-semibold">Data/Hora Chegada:</span> {dadosPaciente.data_hora_chegada ? format(new Date(dadosPaciente.data_hora_chegada), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-"}</div>
          </div>
        </div>

        {/* Classificação */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">CLASSIFICAÇÃO</h2>
          <div className={`rounded-lg p-4 border-2 ${
            dadosPaciente.triagem_medica?.tipo_sca === 'SCACESST' 
              ? 'bg-red-50 border-red-500' 
              : dadosPaciente.classificacao_prioridade === 'Amarela'
                ? 'bg-yellow-50 border-yellow-500'
                : dadosPaciente.classificacao_prioridade === 'Verde'
                  ? 'bg-green-50 border-green-500'
                  : 'bg-yellow-50 border-yellow-500'
          }`}>
            <p className="text-lg"><span className="font-semibold">Tipo de SCA:</span> {dadosPaciente.triagem_medica?.tipo_sca || "-"}</p>
            <p className="text-lg">
              <span className="font-semibold">Prioridade:</span> 
              <span className={`ml-2 font-bold ${
                dadosPaciente.triagem_medica?.tipo_sca === 'SCACESST' ? 'text-red-700' : ''
              }`}>
                {dadosPaciente.triagem_medica?.tipo_sca === 'SCACESST' ? 'Vermelha' : (dadosPaciente.classificacao_prioridade || "-")}
              </span>
            </p>
          </div>
        </div>

        {/* Sinais Vitais */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">SINAIS VITAIS</h2>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div><span className="font-semibold">PA Esquerdo:</span> {dadosPaciente.triagem_medica?.pa_braco_esquerdo || "-"}</div>
            <div><span className="font-semibold">PA Direito:</span> {dadosPaciente.triagem_medica?.pa_braco_direito || "-"}</div>
            <div><span className="font-semibold">FC:</span> {dadosPaciente.triagem_medica?.frequencia_cardiaca || "-"} bpm</div>
            <div><span className="font-semibold">FR:</span> {dadosPaciente.triagem_medica?.frequencia_respiratoria || "-"} irpm</div>
            <div><span className="font-semibold">Temp:</span> {dadosPaciente.triagem_medica?.temperatura || "-"} °C</div>
            <div><span className="font-semibold">SpO2:</span> {dadosPaciente.triagem_medica?.spo2 || "-"} %</div>
            <div><span className="font-semibold">Glicemia:</span> {dadosPaciente.triagem_medica?.glicemia_capilar || "-"} mg/dL</div>
            <div><span className="font-semibold">Diabetes:</span> {dadosPaciente.triagem_medica?.diabetes ? "Sim" : "Não"}</div>
            <div><span className="font-semibold">DPOC:</span> {dadosPaciente.triagem_medica?.dpoc ? "Sim" : "Não"}</div>
          </div>
        </div>

        {/* ECG */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">ELETROCARDIOGRAMA</h2>
          {dadosPaciente.triagem_medica?.data_hora_ecg && (
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 mb-3">
              <p><span className="font-semibold">Tempo Triagem→ECG:</span> {dadosPaciente.triagem_medica?.tempo_entrada_ecg_minutos || "-"} minutos</p>
              <p><span className="font-semibold">Realizado em:</span> {format(new Date(dadosPaciente.triagem_medica.data_hora_ecg), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
            </div>
          )}
          {dadosPaciente.triagem_medica?.alteracoes_ecg?.length > 0 && (
            <div className="text-sm mb-3">
              <p className="font-semibold mb-2">Alterações:</p>
              <ul className="list-disc pl-5">
                {dadosPaciente.triagem_medica.alteracoes_ecg.map((alt, i) => (
                  <li key={i}>{alt}</li>
                ))}
              </ul>
            </div>
          )}
          {dadosPaciente.triagem_medica?.ecg_files?.length > 0 && (
            <div className="space-y-2">
              <p className="font-semibold text-sm mb-2">Imagens do ECG:</p>
              {dadosPaciente.triagem_medica.ecg_files.map((file, i) => (
                <img 
                  key={i} 
                  src={file} 
                  alt={`ECG ${i + 1}`} 
                  className="w-full border-2 border-gray-300 rounded"
                  crossOrigin="anonymous"
                />
              ))}
            </div>
          )}
        </div>

        {/* Avaliação Clínica */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">AVALIAÇÃO CLÍNICA</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">Antecedentes:</p>
              <p className="text-gray-700">{dadosPaciente.avaliacao_clinica?.antecedentes || "-"}</p>
            </div>
            <div>
              <p className="font-semibold">Quadro Atual:</p>
              <p className="text-gray-700">{dadosPaciente.avaliacao_clinica?.quadro_atual || "-"}</p>
            </div>
            <div>
              <p className="font-semibold">Hipótese Diagnóstica:</p>
              <p className="text-gray-700">{dadosPaciente.avaliacao_clinica?.hipotese_diagnostica || "-"}</p>
            </div>
          </div>
        </div>

        {/* HEART Score */}
        {dadosPaciente.avaliacao_clinica?.heart_score?.total > 0 && (
          <div className="mb-6 bg-blue-50 border-2 border-blue-500 rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2">HEART SCORE</h3>
            <p className="text-2xl font-bold text-blue-700 mb-2">{dadosPaciente.avaliacao_clinica.heart_score.total} pontos</p>
            <p className="text-sm">{dadosPaciente.avaliacao_clinica.heart_score.interpretacao}</p>
          </div>
        )}

        {/* Prescrição */}
        {dadosPaciente.avaliacao_clinica?.prescricao_medicamentos?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">PRESCRIÇÃO MEDICAMENTOSA</h2>
            <table className="w-full text-sm border border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-400 p-2 text-left">Medicamento</th>
                  <th className="border border-gray-400 p-2 text-left">Dose</th>
                  <th className="border border-gray-400 p-2 text-left">Via</th>
                </tr>
              </thead>
              <tbody>
                {dadosPaciente.avaliacao_clinica.prescricao_medicamentos.map((med, i) => (
                  <tr key={i}>
                    <td className="border border-gray-400 p-2">{med.medicamento || med.nome || "-"}</td>
                    <td className="border border-gray-400 p-2">{med.dose || "-"}</td>
                    <td className="border border-gray-400 p-2">{med.via || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Exames */}
        {dadosPaciente.avaliacao_clinica?.exames_solicitados?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">EXAMES SOLICITADOS</h2>
            <ul className="list-disc pl-5 text-sm">
              {dadosPaciente.avaliacao_clinica.exames_solicitados.map((exame, i) => (
                <li key={i}>{exame}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Profissionais */}
        <div className="mt-8 bg-green-50 border-2 border-green-500 rounded-lg p-4">
          <h3 className="font-bold text-lg mb-3">PROFISSIONAIS RESPONSÁVEIS</h3>
          <div className="text-sm space-y-2">
            <div><span className="font-semibold">Médico:</span> {medico.nome || "-"}</div>
            <div><span className="font-semibold">CRM:</span> {medico.crm || "-"}</div>
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
          disabled={!medico.nome || !medico.crm || !medico.celular || !tempoDeslocamento}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Finalizar Atendimento
        </Button>
      </div>
    </div>
  );
}