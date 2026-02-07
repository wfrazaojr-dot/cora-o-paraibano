import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, FileText, Download, CheckCircle, AlertCircle, Heart, Activity } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function Etapa4Relatorio({ dadosPaciente, onAnterior, pacienteId }) {
  const navigate = useNavigate();
  const relatorioRef = useRef(null);
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [medico, setMedico] = useState({
    nome: dadosPaciente.medico_nome || "",
    crm: dadosPaciente.medico_crm || ""
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
        useCORS: true
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

  const handleFinalizar = () => {
    if (!medico.nome || !medico.crm) {
      alert("Por favor, preencha o nome e CRM do médico");
      return;
    }
    alert("Atendimento finalizado com sucesso!");
    navigate(createPageUrl("Dashboard"));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Relatório Final</h2>
        <p className="text-gray-600">Revisão completa do atendimento</p>
      </div>

      {/* Identificação do Médico */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-lg mb-4">Identificação do Médico Responsável</h3>
        <div className="grid md:grid-cols-2 gap-4">
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
        </div>
      </div>

      {/* Relatório Visual */}
      <div 
        ref={relatorioRef} 
        className="bg-white border-2 border-gray-300 rounded-lg p-8 shadow-lg"
        style={{ minHeight: "800px" }}
      >
        {/* Cabeçalho */}
        <div className="text-center mb-8 pb-4 border-b-4 border-red-600">
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

        {/* Tempo de Dor - DESTAQUE */}
        {tempoDorMinutos !== null && (
          <div className="mb-8 bg-red-50 border-4 border-red-500 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-8 h-8 text-red-600" />
              <h2 className="text-2xl font-bold text-red-900">JANELA TERAPÊUTICA</h2>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold text-red-600 mb-4">
                {tempoDorHoras}h {tempoDorMin}min
              </p>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Início dos sintomas:</strong> {format(new Date(dadosPaciente.data_hora_inicio_sintomas), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                <p><strong>Relatório gerado em:</strong> {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              </div>
              {tempoDorMinutos > 180 ? (
                <div className="mt-4 bg-red-200 border-2 border-red-700 rounded p-3">
                  <p className="font-bold text-red-900">⚠️ ATENÇÃO: Tempo superior a 3 horas</p>
                </div>
              ) : (
                <div className="mt-4 bg-green-200 border-2 border-green-700 rounded p-3">
                  <p className="font-bold text-green-900">✓ Dentro da janela ideal</p>
                </div>
              )}
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
          <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4">
            <p className="text-lg"><span className="font-semibold">Tipo de SCA:</span> {dadosPaciente.triagem_medica?.tipo_sca || "-"}</p>
            <p className="text-lg"><span className="font-semibold">Prioridade:</span> {dadosPaciente.classificacao_prioridade || "-"}</p>
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
            <div className="text-sm">
              <p className="font-semibold mb-2">Alterações:</p>
              <ul className="list-disc pl-5">
                {dadosPaciente.triagem_medica.alteracoes_ecg.map((alt, i) => (
                  <li key={i}>{alt}</li>
                ))}
              </ul>
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
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2 text-left">Medicamento</th>
                  <th className="border p-2 text-left">Dose</th>
                  <th className="border p-2 text-left">Via</th>
                </tr>
              </thead>
              <tbody>
                {dadosPaciente.avaliacao_clinica.prescricao_medicamentos.map((med, i) => (
                  <tr key={i}>
                    <td className="border p-2">{med.medicamento || med.nome}</td>
                    <td className="border p-2">{med.dose}</td>
                    <td className="border p-2">{med.via}</td>
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
          disabled={gerandoPDF || !medico.nome || !medico.crm}
        >
          <Download className="w-4 h-4 mr-2" />
          {gerandoPDF ? "Gerando PDF..." : "Baixar Relatório em PDF"}
        </Button>

        {!medico.nome || !medico.crm ? (
          <Alert className="border-orange-500 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Preencha os dados do médico para gerar o PDF e finalizar o atendimento
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
          disabled={!medico.nome || !medico.crm}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Finalizar Atendimento
        </Button>
      </div>
    </div>
  );
}