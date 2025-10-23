import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, FileText, CheckCircle, AlertCircle, Mail } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Etapa8Relatorio({ dadosPaciente, onAnterior, pacienteId }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [checklistConcluido, setChecklistConcluido] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);

  const finalizarMutation = useMutation({
    mutationFn: async (dados) => {
      return await base44.entities.Paciente.update(pacienteId, dados);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      navigate(createPageUrl("Dashboard"));
    },
  });

  const gerarRelatorioPDF = () => {
    const conteudo = `
=================================================================
           RELATÓRIO DE ATENDIMENTO - DOR TORÁCICA
=================================================================

DADOS DO PACIENTE
-----------------------------------------------------------------
Nome: ${dadosPaciente.nome_completo}
Idade: ${dadosPaciente.idade} anos | Sexo: ${dadosPaciente.sexo}
Prontuário: ${dadosPaciente.prontuario}
Data/Hora Chegada: ${format(new Date(dadosPaciente.data_hora_chegada), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
Início dos Sintomas: ${format(new Date(dadosPaciente.data_hora_inicio_sintomas), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}

CLASSIFICAÇÃO DE RISCO
-----------------------------------------------------------------
Cor: ${dadosPaciente.classificacao_risco?.cor}
Tempo Máximo: ${dadosPaciente.classificacao_risco?.tempo_atendimento_max}
Discriminadores: ${dadosPaciente.classificacao_risco?.discriminadores?.join(", ")}

TRIAGEM CARDIOLÓGICA
-----------------------------------------------------------------
${dadosPaciente.triagem_cardiologica?.alerta_iam ? "⚠️ ALERTA DE PROVÁVEL IAM DETECTADO" : "Sem alerta de IAM"}

DADOS VITAIS
-----------------------------------------------------------------
PA Esquerdo: ${dadosPaciente.dados_vitais?.pa_braco_esquerdo || "-"}
PA Direito: ${dadosPaciente.dados_vitais?.pa_braco_direito || "-"}
FC: ${dadosPaciente.dados_vitais?.frequencia_cardiaca || "-"} bpm
FR: ${dadosPaciente.dados_vitais?.frequencia_respiratoria || "-"} irpm
Temperatura: ${dadosPaciente.dados_vitais?.temperatura || "-"} °C
SpO2: ${dadosPaciente.dados_vitais?.spo2 || "-"} %
Glicemia: ${dadosPaciente.dados_vitais?.glicemia_capilar || "-"} mg/dL
Diabetes: ${dadosPaciente.dados_vitais?.diabetes ? "Sim" : "Não"}
DPOC: ${dadosPaciente.dados_vitais?.dpoc ? "Sim" : "Não"}

ELETROCARDIOGRAMA
-----------------------------------------------------------------
Tempo Triagem-ECG: ${dadosPaciente.tempo_triagem_ecg_minutos || "-"} minutos
${dadosPaciente.tempo_triagem_ecg_minutos <= 10 ? "✓ Dentro da meta de 10 minutos" : "⚠️ Acima da meta de 10 minutos"}

ANÁLISE DE ECG (IA):
${dadosPaciente.analise_ecg_ia || "Não disponível"}

AVALIAÇÃO MÉDICA
-----------------------------------------------------------------
Data/Hora: ${dadosPaciente.avaliacao_medica?.data_hora_avaliacao ? format(new Date(dadosPaciente.avaliacao_medica.data_hora_avaliacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "-"}

Antecedentes:
${dadosPaciente.avaliacao_medica?.antecedentes || "Não informado"}

Quadro Atual:
${dadosPaciente.avaliacao_medica?.quadro_atual || "Não informado"}

Hipóteses Diagnósticas:
${dadosPaciente.avaliacao_medica?.hipoteses_diagnosticas || "Não informado"}

Diagnóstico Confirmado:
${dadosPaciente.avaliacao_medica?.diagnostico_confirmado || "Não informado"}

Observações:
${dadosPaciente.avaliacao_medica?.observacoes || "Não informado"}

PRESCRIÇÃO MEDICAMENTOSA
-----------------------------------------------------------------
${dadosPaciente.prescricao_medicamentos?.length > 0 
  ? dadosPaciente.prescricao_medicamentos.map((m, i) => 
      `${i+1}. ${m.medicamento} - ${m.dose} (${m.via}) ${m.administrado ? "✓ Administrado" : "⚠️ Não administrado"}`
    ).join("\n")
  : "Nenhum medicamento prescrito"}

EXAMES SOLICITADOS
-----------------------------------------------------------------
${dadosPaciente.exames_solicitados?.length > 0 
  ? dadosPaciente.exames_solicitados.map((e, i) => `${i+1}. ${e}`).join("\n")
  : "Nenhum exame solicitado"}

=================================================================
Sistema de Triagem de Dor Torácica
Autor: Walber Alves Frazão Júnior - COREN 110.238
Protocolos: Diretriz Brasileira de Atendimento à Dor Torácica 
na Unidade de Emergência – 2025 / Sistema Manchester
=================================================================
`;

    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_${dadosPaciente.nome_completo.replace(/ /g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const enviarPorEmail = async () => {
    const email = prompt("Digite o email da Central de Regulação:");
    if (!email) return;

    setEnviandoEmail(true);
    try {
      const conteudo = `
RELATÓRIO DE ATENDIMENTO - DOR TORÁCICA

PACIENTE: ${dadosPaciente.nome_completo}
IDADE: ${dadosPaciente.idade} anos | SEXO: ${dadosPaciente.sexo}
PRONTUÁRIO: ${dadosPaciente.prontuario}

CLASSIFICAÇÃO DE RISCO: ${dadosPaciente.classificacao_risco?.cor}
${dadosPaciente.triagem_cardiologica?.alerta_iam ? "⚠️ ALERTA DE PROVÁVEL IAM" : ""}

DIAGNÓSTICO: ${dadosPaciente.avaliacao_medica?.diagnostico_confirmado || "Em investigação"}

TEMPO TRIAGEM-ECG: ${dadosPaciente.tempo_triagem_ecg_minutos} minutos

Para relatório completo, acesse o sistema.

---
Gerado pelo Sistema de Triagem de Dor Torácica
`;

      await base44.integrations.Core.SendEmail({
        to: email,
        subject: `[URGENTE] Relatório - ${dadosPaciente.nome_completo} - ${dadosPaciente.classificacao_risco?.cor}`,
        body: conteudo,
        from_name: "Sistema Triagem Dor Torácica"
      });

      alert("Email enviado com sucesso!");
    } catch (error) {
      alert("Erro ao enviar email. Tente novamente.");
    }
    setEnviandoEmail(false);
  };

  const handleFinalizar = async () => {
    const tempoTotal = differenceInMinutes(
      new Date(),
      new Date(dadosPaciente.data_hora_chegada)
    );

    await finalizarMutation.mutateAsync({
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
          Clique abaixo para gerar o relatório e enviar para a Central de Regulação.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-4">
        <Button
          onClick={gerarRelatorioPDF}
          variant="outline"
          className="w-full"
          type="button"
        >
          <FileText className="w-4 h-4 mr-2" />
          Baixar Relatório (TXT)
        </Button>

        <Button
          onClick={enviarPorEmail}
          variant="outline"
          className="w-full"
          disabled={enviandoEmail}
          type="button"
        >
          {enviandoEmail ? (
            <>Enviando...</>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Enviar por Email
            </>
          )}
        </Button>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onAnterior}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button
          onClick={handleFinalizar}
          className="bg-green-600 hover:bg-green-700"
          disabled={!checklistConcluido || finalizarMutation.isPending}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {finalizarMutation.isPending ? "Finalizando..." : "Finalizar Atendimento"}
        </Button>
      </div>
    </div>
  );
}