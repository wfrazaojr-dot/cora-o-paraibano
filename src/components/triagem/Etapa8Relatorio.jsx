
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, FileText, CheckCircle, AlertCircle, Mail } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Etapa8Relatorio({ dadosPaciente, onAnterior, pacienteId }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [checklistConcluido, setChecklistConcluido] = useState(false);
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [medico, setMedico] = useState({
    nome: dadosPaciente.medico_nome || "",
    crm: dadosPaciente.medico_crm || ""
  });

  const finalizarMutation = useMutation({
    mutationFn: async (dados) => {
      return await base44.entities.Paciente.update(pacienteId, dados);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      navigate(createPageUrl("Dashboard"));
    },
  });

  const gerarRelatorioPDF = async () => {
    setGerandoPDF(true);
    try {
      // Gerar HTML do relatório
      const htmlRelatorio = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório de Atendimento - Dor Torácica</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    h1 { color: #DC2626; text-align: center; border-bottom: 3px solid #DC2626; padding-bottom: 10px; }
    h2 { color: #DC2626; margin-top: 30px; border-bottom: 2px solid #EF4444; padding-bottom: 5px; }
    h3 { color: #374151; margin-top: 20px; }
    .section { margin-bottom: 25px; }
    .info-row { display: flex; margin-bottom: 8px; }
    .label { font-weight: bold; min-width: 200px; }
    .alert { background: #FEE2E2; border-left: 4px solid #DC2626; padding: 10px; margin: 15px 0; }
    .ecg-container { margin: 20px 0; }
    .ecg-img { max-width: 100%; height: auto; border: 1px solid #ccc; margin: 10px 0; }
    .analise { background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 15px; margin: 15px 0; white-space: pre-wrap; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    table, th, td { border: 1px solid #ddd; }
    th, td { padding: 10px; text-align: left; }
    th { background-color: #f3f4f6; font-weight: bold; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #DC2626; font-size: 12px; color: #666; }
    .profissionais { background: #F0FDF4; border: 2px solid #16A34A; padding: 15px; margin: 20px 0; }
    .tempo-ecg { background: #FEF3C7; border: 2px solid #F59E0B; padding: 15px; margin: 15px 0; }
    .unidade-header { background: #DBEAFE; border: 2px solid #3B82F6; padding: 15px; margin-bottom: 20px; text-align: center; }
  </style>
</head>
<body>
  ${dadosPaciente.unidade_saude ? `
  <div class="unidade-header">
    <h2 style="margin: 0; color: #1E40AF; border: none;">${dadosPaciente.unidade_saude}</h2>
    <p style="margin: 5px 0 0 0; color: #1E40AF; font-size: 14px;">Sistema de Triagem de Dor Torácica</p>
  </div>
  ` : ''}

  <h1>RELATÓRIO DE ATENDIMENTO - DOR TORÁCICA</h1>
  
  <div class="section">
    <h2>DADOS DO PACIENTE</h2>
    ${dadosPaciente.unidade_saude ? `<div class="info-row"><span class="label">Unidade de Atendimento:</span> <strong>${dadosPaciente.unidade_saude}</strong></div>` : ''}
    <div class="info-row"><span class="label">Nome:</span> ${dadosPaciente.nome_completo}</div>
    <div class="info-row"><span class="label">Idade:</span> ${dadosPaciente.idade} anos</div>
    <div class="info-row"><span class="label">Sexo:</span> ${dadosPaciente.sexo}</div>
    <div class="info-row"><span class="label">Prontuário:</span> ${dadosPaciente.prontuario}</div>
    <div class="info-row"><span class="label">Data/Hora Chegada:</span> ${format(new Date(dadosPaciente.data_hora_chegada), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
    <div class="info-row"><span class="label">Início dos Sintomas:</span> ${format(new Date(dadosPaciente.data_hora_inicio_sintomas), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
  </div>

  <div class="section">
    <h2>CLASSIFICAÇÃO DE RISCO</h2>
    <div class="info-row"><span class="label">Cor:</span> <strong>${dadosPaciente.classificacao_risco?.cor}</strong></div>
    <div class="info-row"><span class="label">Tempo Máximo:</span> ${dadosPaciente.classificacao_risco?.tempo_atendimento_max}</div>
    <div class="info-row"><span class="label">Discriminadores:</span> ${dadosPaciente.classificacao_risco?.discriminadores?.join(", ")}</div>
  </div>

  ${dadosPaciente.triagem_cardiologica?.alerta_iam ? '<div class="alert">⚠️ ALERTA DE PROVÁVEL IAM DETECTADO</div>' : ''}

  <div class="section">
    <h2>DADOS VITAIS</h2>
    <table>
      <tr><th>Parâmetro</th><th>Valor</th></tr>
      <tr><td>PA Braço Esquerdo</td><td>${dadosPaciente.dados_vitais?.pa_braco_esquerdo || "-"}</td></tr>
      <tr><td>PA Braço Direito</td><td>${dadosPaciente.dados_vitais?.pa_braco_direito || "-"}</td></tr>
      <tr><td>Frequência Cardíaca</td><td>${dadosPaciente.dados_vitais?.frequencia_cardiaca || "-"} bpm</td></tr>
      <tr><td>Frequência Respiratória</td><td>${dadosPaciente.dados_vitais?.frequencia_respiratoria || "-"} irpm</td></tr>
      <tr><td>Temperatura</td><td>${dadosPaciente.dados_vitais?.temperatura || "-"} °C</td></tr>
      <tr><td>SpO2</td><td>${dadosPaciente.dados_vitais?.spo2 || "-"} %</td></tr>
      <tr><td>Glicemia Capilar</td><td>${dadosPaciente.dados_vitais?.glicemia_capilar || "-"} mg/dL</td></tr>
      <tr><td>Diabetes</td><td>${dadosPaciente.dados_vitais?.diabetes ? "Sim" : "Não"}</td></tr>
      <tr><td>DPOC</td><td>${dadosPaciente.dados_vitais?.dpoc ? "Sim" : "Não"}</td></tr>
    </table>
  </div>

  <div class="section">
    <h2>ELETROCARDIOGRAMA (ECG)</h2>
    <div class="tempo-ecg">
      <h3 style="margin-top: 0;">⏱️ TEMPOS DO ECG</h3>
      <div class="info-row"><span class="label">Hora da Triagem:</span> ${dadosPaciente.data_hora_inicio_triagem ? format(new Date(dadosPaciente.data_hora_inicio_triagem), "HH:mm", { locale: ptBR }) : "-"}</div>
      <div class="info-row"><span class="label">Hora do ECG:</span> ${dadosPaciente.data_hora_ecg ? format(new Date(dadosPaciente.data_hora_ecg), "HH:mm", { locale: ptBR }) : "-"}</div>
      <div class="info-row"><span class="label">Tempo Triagem → ECG:</span> <strong>${dadosPaciente.tempo_triagem_ecg_minutos || "-"} minutos</strong> ${dadosPaciente.tempo_triagem_ecg_minutos <= 10 ? "✓ Dentro da meta" : "⚠️ Acima da meta"}</div>
    </div>
    
    ${dadosPaciente.ecg_files && dadosPaciente.ecg_files.length > 0 ? `
    <div class="ecg-container">
      <h3>ECGs Anexados:</h3>
      ${dadosPaciente.ecg_files.map((url, i) => `
        <div>
          <p><strong>ECG ${i+1}:</strong></p>
          <img src="${url}" alt="ECG ${i+1}" class="ecg-img" />
        </div>
      `).join('')}
    </div>
    ` : '<p>Nenhum ECG anexado</p>'}
    
    ${dadosPaciente.analise_ecg_ia ? `
    <div class="analise">
      <h3>Análise de ECG por Inteligência Artificial:</h3>
      ${dadosPaciente.analise_ecg_ia}
    </div>
    ` : ''}
  </div>

  <div class="section">
    <h2>AVALIAÇÃO MÉDICA</h2>
    <div class="info-row"><span class="label">Data/Hora Avaliação:</span> ${dadosPaciente.avaliacao_medica?.data_hora_avaliacao ? format(new Date(dadosPaciente.avaliacao_medica.data_hora_avaliacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "-"}</div>
    
    <h3>Antecedentes:</h3>
    <p>${dadosPaciente.avaliacao_medica?.antecedentes || "Não informado"}</p>
    
    <h3>Quadro Clínico Atual:</h3>
    <p>${dadosPaciente.avaliacao_medica?.quadro_atual || "Não informado"}</p>
    
    <h3>Hipóteses Diagnósticas:</h3>
    <p>${dadosPaciente.avaliacao_medica?.hipoteses_diagnosticas || "Não informado"}</p>
    
    <h3>Diagnóstico Confirmado:</h3>
    <p><strong>${dadosPaciente.avaliacao_medica?.diagnostico_confirmado || "Não informado"}</strong></p>
    
    <h3>Observações:</h3>
    <p>${dadosPaciente.avaliacao_medica?.observacoes || "Não informado"}</p>
  </div>

  <div class="section">
    <h2>PRESCRIÇÃO MEDICAMENTOSA</h2>
    ${dadosPaciente.prescricao_medicamentos?.length > 0 ? `
    <table>
      <tr><th>#</th><th>Medicamento</th><th>Dose</th><th>Via</th><th>Status</th></tr>
      ${dadosPaciente.prescricao_medicamentos.map((m, i) => `
        <tr>
          <td>${i+1}</td>
          <td>${m.medicamento}</td>
          <td>${m.dose}</td>
          <td>${m.via}</td>
          <td>${m.administrado ? "✓ Administrado" : "⚠️ Não administrado"}</td>
        </tr>
      `).join('')}
    </table>
    ` : '<p>Nenhum medicamento prescrito</p>'}
  </div>

  <div class="section">
    <h2>EXAMES SOLICITADOS</h2>
    ${dadosPaciente.exames_solicitados?.length > 0 ? `
    <ul>
      ${dadosPaciente.exames_solicitados.map(e => `<li>${e}</li>`).join('')}
    </ul>
    ` : '<p>Nenhum exame solicitado</p>'}
  </div>

  <div class="profissionais">
    <h2 style="margin-top: 0;">PROFISSIONAIS RESPONSÁVEIS</h2>
    ${dadosPaciente.unidade_saude ? `<div class="info-row"><span class="label">Unidade:</span> <strong>${dadosPaciente.unidade_saude}</strong></div>` : ''}
    <div class="info-row" style="margin-top: 10px;"><span class="label">Enfermeiro(a):</span> ${dadosPaciente.enfermeiro_nome || "-"}</div>
    <div class="info-row"><span class="label">COREN:</span> ${dadosPaciente.enfermeiro_coren || "-"}</div>
    <div class="info-row" style="margin-top: 15px;"><span class="label">Médico(a):</span> ${medico.nome || "-"}</div>
    <div class="info-row"><span class="label">CRM:</span> ${medico.crm || "-"}</div>
  </div>

  <div class="footer">
    <p><strong>Sistema de Triagem de Dor Torácica</strong></p>
    <p>Autor: Walber Alves Frazão Júnior - COREN 110.238</p>
    <p>Enfermeiro Emergencista - Pós-graduado em Cardiologia, Neurologia e Auditoria em Serviços de Saúde</p>
    <p>Protocolos: Diretriz Brasileira de Atendimento à Dor Torácica na Unidade de Emergência – 2025 / Sistema Manchester</p>
    <p>Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
  </div>
</body>
</html>
`;

      const blob = new Blob([htmlRelatorio], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Relatorio_${dadosPaciente.nome_completo.replace(/ /g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Tentar abrir para impressão, mas com verificação de erro
      try {
        const printWindow = window.open(url);
        if (printWindow) {
          setTimeout(() => {
            try {
              printWindow.print();
            } catch (printError) {
              console.log("Não foi possível acionar a impressão automaticamente. Por favor, utilize Ctrl+P (Windows) ou Cmd+P (Mac) na janela do relatório para imprimir. O arquivo HTML já foi baixado.");
            }
          }, 500);
        } else {
          alert("Popup de impressão bloqueado pelo navegador.\n\nO relatório foi baixado com sucesso.\n\nPara imprimir:\n1. Abra o arquivo HTML baixado.\n2. Use Ctrl+P (Windows) ou Cmd+P (Mac) para imprimir.");
        }
      } catch (error) {
        console.log("Erro ao tentar abrir popup para impressão. O relatório foi baixado com sucesso.", error);
        alert("Ocorreu um erro ao tentar abrir a janela de impressão. O relatório foi baixado com sucesso. Por favor, abra o arquivo HTML baixado e imprima manualmente.");
      }

      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar relatório. Tente novamente.");
    }
    setGerandoPDF(false);
  };

  const abrirEmailComRelatorio = () => {
    const assunto = encodeURIComponent(`[REGULAÇÃO] ${dadosPaciente.unidade_saude || "UNIDADE"} - ${dadosPaciente.nome_completo} - ${dadosPaciente.classificacao_risco?.cor}`);
    const corpo = encodeURIComponent(`
SOLICITAÇÃO DE REGULAÇÃO - DOR TORÁCICA

${dadosPaciente.unidade_saude ? `UNIDADE DE ORIGEM: ${dadosPaciente.unidade_saude}` : 'UNIDADE DE ORIGEM: NÃO INFORMADA'}

PACIENTE: ${dadosPaciente.nome_completo}
IDADE: ${dadosPaciente.idade} anos | SEXO: ${dadosPaciente.sexo}
PRONTUÁRIO: ${dadosPaciente.prontuario}

CLASSIFICAÇÃO DE RISCO: ${dadosPaciente.classificacao_risco?.cor}
${dadosPaciente.triagem_cardiologica?.alerta_iam ? "⚠️ ALERTA DE PROVÁVEL IAM" : ""}

DIAGNÓSTICO: ${dadosPaciente.avaliacao_medica?.diagnostico_confirmado || "Em investigação"}

PROFISSIONAIS RESPONSÁVEIS:
Enfermeiro(a): ${dadosPaciente.enfermeiro_nome || "-"} - COREN ${dadosPaciente.enfermeiro_coren || "-"}
Médico(a): ${medico.nome || "-"} - CRM ${medico.crm || "-"}

IMPORTANTE: Relatório completo em anexo (gerar PDF antes de enviar).

Por favor, baixe o relatório em PDF através do botão "Baixar Relatório (PDF)" e anexe neste email.

---
Sistema de Triagem de Dor Torácica
${dadosPaciente.unidade_saude || ""}
    `);

    window.location.href = `mailto:?subject=${assunto}&body=${corpo}`;
  };

  const handleFinalizar = async () => {
    if (!medico.nome || !medico.crm) {
      alert("Por favor, preencha o nome e CRM do médico");
      return;
    }

    const tempoTotal = differenceInMinutes(
      new Date(),
      new Date(dadosPaciente.data_hora_chegada)
    );

    await finalizarMutation.mutateAsync({
      medico_nome: medico.nome,
      medico_crm: medico.crm,
      necessita_regulacao: true,
      data_hora_encerramento: new Date().toISOString(),
      tempo_total_minutos: tempoTotal,
      status: "Aguardando Regulação"
    });
  };

  const tempoTriagemAvaliacao = dadosPaciente.data_hora_inicio_triagem && dadosPaciente.avaliacao_medica?.data_hora_avaliacao
    ? differenceInMinutes(
        new Date(dadosPaciente.avaliacao_medica.data_hora_avaliacao),
        new Date(dadosPaciente.data_hora_inicio_triagem)
      )
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Relatório e Regulação</h2>
        <p className="text-gray-600">Revisão final e envio para central de regulação</p>
      </div>

      {tempoTriagemAvaliacao !== null && (
        <Alert className={tempoTriagemAvaliacao <= 30 ? "border-green-500 bg-green-50" : "border-orange-500 bg-orange-50"}>
          <AlertCircle className={`h-4 w-4 ${tempoTriagemAvaliacao <= 30 ? "text-green-600" : "text-orange-600"}`} />
          <AlertDescription className={tempoTriagemAvaliacao <= 30 ? "text-green-800" : "text-orange-800"}>
            Tempo triagem até avaliação médica: <strong>{tempoTriagemAvaliacao} minutos</strong>
            {tempoTriagemAvaliacao <= 30 ? " ✓ Dentro da meta" : " ⚠️ Acima da meta de 30 minutos"}
          </AlertDescription>
        </Alert>
      )}

      {dadosPaciente.data_hora_inicio_triagem && dadosPaciente.data_hora_ecg && (
        <Alert className="border-blue-500 bg-blue-50">
          <AlertDescription className="text-blue-800">
            <div className="space-y-1">
              <p><strong>⏱️ Tempos do ECG:</strong></p>
              <p>• Hora da Triagem: <strong>{format(new Date(dadosPaciente.data_hora_inicio_triagem), "HH:mm", { locale: ptBR })}</strong></p>
              <p>• Hora do ECG: <strong>{format(new Date(dadosPaciente.data_hora_ecg), "HH:mm", { locale: ptBR })}</strong></p>
              <p>• Tempo Triagem → ECG: <strong>{dadosPaciente.tempo_triagem_ecg_minutos} minutos</strong> {dadosPaciente.tempo_triagem_ecg_minutos <= 10 ? "✓ Dentro da meta" : "⚠️ Acima da meta"}</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="border-t pt-6">
        <h3 className="font-bold text-lg mb-4">Identificação do Médico Responsável</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="medico_nome">Nome Completo do Médico *</Label>
            <Input
              id="medico_nome"
              value={medico.nome}
              onChange={(e) => setMedico({...medico, nome: e.target.value})}
              placeholder="Digite o nome completo"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="medico_crm">Número CRM *</Label>
            <Input
              id="medico_crm"
              value={medico.crm}
              onChange={(e) => setMedico({...medico, crm: e.target.value})}
              placeholder="Ex: 123456"
              required
            />
          </div>
        </div>
      </div>

      <div className="border-l-4 border-l-blue-600 bg-blue-50 p-6 rounded">
        <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Checklist de Conclusão
        </h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="checklist"
              checked={checklistConcluido}
              onCheckedChange={setChecklistConcluido}
            />
            <Label htmlFor="checklist" className="cursor-pointer">
              Confirmo que a avaliação clínica está completa, medicamentos foram prescritos 
              e administrados, exames foram solicitados, e o paciente está pronto para regulação
            </Label>
          </div>
        </div>
      </div>

      <Alert className="border-red-500 bg-red-50">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong className="block mb-2">⚠️ NECESSIDADE DE REGULAÇÃO</strong>
          Este paciente requer transferência para unidade especializada. 
          Gere o relatório em PDF e envie para a Central de Regulação.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-4">
        <Button
          onClick={gerarRelatorioPDF}
          variant="outline"
          className="w-full"
          type="button"
          disabled={gerandoPDF}
        >
          <FileText className="w-4 h-4 mr-2" />
          {gerandoPDF ? "Gerando..." : "Baixar Relatório (PDF)"}
        </Button>

        <Button
          onClick={abrirEmailComRelatorio}
          variant="outline"
          className="w-full"
          type="button"
        >
          <Mail className="w-4 h-4 mr-2" />
          Enviar por Email
        </Button>
      </div>

      <Alert className="border-blue-500 bg-blue-50">
        <AlertDescription className="text-blue-800 text-sm">
          <strong>Instruções:</strong> 
          <ol className="list-decimal pl-5 mt-2 space-y-1">
            <li>Clique em "Baixar Relatório (PDF)" para gerar e baixar o relatório completo</li>
            <li>Imprima como PDF através do navegador (Ctrl+P ou Cmd+P)</li>
            <li>Clique em "Enviar por Email" para abrir seu cliente de email</li>
            <li>Anexe o PDF gerado ao email e envie para a Central de Regulação</li>
          </ol>
        </AlertDescription>
      </Alert>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onAnterior}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button
          onClick={handleFinalizar}
          className="bg-green-600 hover:bg-green-700"
          disabled={!checklistConcluido || finalizarMutation.isPending || !medico.nome || !medico.crm}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {finalizarMutation.isPending ? "Finalizando..." : "Finalizar Atendimento"}
        </Button>
      </div>
    </div>
  );
}
