
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, Copy, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import Etapa1DadosPaciente from "../components/triagem/Etapa1DadosPaciente";
import Etapa2TriagemCardiologica from "../components/triagem/Etapa2TriagemCardiologica";
import Etapa3DadosVitais from "../components/triagem/Etapa3DadosVitais";
import Etapa4ClassificacaoRisco from "../components/triagem/Etapa4ClassificacaoRisco";
import Etapa5AvaliacaoMedica from "../components/triagem/Etapa5AvaliacaoMedica";
import Etapa6Prescricao from "../components/triagem/Etapa6Prescricao";
import Etapa7Exames from "../components/triagem/Etapa7Exames";
import Etapa8Relatorio from "../components/triagem/Etapa8Relatorio";
import { format } from "date-fns";

const etapas = [
  { numero: 1, titulo: "Dados do Paciente", componente: Etapa1DadosPaciente },
  { numero: 2, titulo: "Triagem Cardiológica", componente: Etapa2TriagemCardiologica },
  { numero: 3, titulo: "Dados Vitais e ECG", componente: Etapa3DadosVitais },
  { numero: 4, titulo: "Classificação de Risco", componente: Etapa4ClassificacaoRisco },
  { numero: 5, titulo: "Avaliação Médica", componente: Etapa5AvaliacaoMedica },
  { numero: 6, titulo: "Prescrição", componente: Etapa6Prescricao },
  { numero: 7, titulo: "Exames", componente: Etapa7Exames },
  { numero: 8, titulo: "Relatório", componente: Etapa8Relatorio },
];

export default function NovaTriagem() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [dadosPaciente, setDadosPaciente] = useState({});
  const [pacienteId, setPacienteId] = useState(null);
  const [aguardandoMedico, setAguardandoMedico] = useState(false);
  const [idPacienteParaMedico, setIdPacienteParaMedico] = useState("");
  const [carregando, setCarregando] = useState(true);

  const urlParams = new URLSearchParams(window.location.search);
  const idUrl = urlParams.get('id');
  const isRetriagem = urlParams.get('retriagem') === 'true';

  const { data: pacienteExistente, isLoading } = useQuery({
    queryKey: ['paciente', idUrl],
    queryFn: async () => {
      if (!idUrl) return null;
      const result = await base44.entities.Paciente.filter({ id: idUrl });
      return result && result.length > 0 ? result[0] : null;
    },
    enabled: !!idUrl,
  });

  useEffect(() => {
    if (isLoading) return;
    
    if (pacienteExistente) {
      const paciente = pacienteExistente;
      setDadosPaciente(paciente);
      setPacienteId(paciente.id);
      
      if (isRetriagem) {
        // Em retriagem, começar na etapa 2 e atualizar data/hora da retriagem
        setEtapaAtual(2);
        setDadosPaciente({
          ...paciente,
          data_hora_inicio_triagem: format(new Date(), "yyyy-MM-dd'T'HH:mm")
        });
      } else if (paciente.status === "Aguardando Médico") {
        // Se está aguardando médico, ir direto para etapa 5 (avaliação médica)
        setEtapaAtual(5);
      } else if (paciente.status === "Em Atendimento") {
        // Se já está em atendimento médico, descobrir em qual etapa está
        if (paciente.avaliacao_medica) {
          if (paciente.prescricao_medicamentos && paciente.prescricao_medicamentos.length > 0) {
            if (paciente.exames_solicitados && paciente.exames_solicitados.length > 0) {
              setEtapaAtual(8); // Relatório
            } else {
              setEtapaAtual(7); // Exames
            }
          } else {
            setEtapaAtual(6); // Prescrição
          }
        } else {
          setEtapaAtual(5); // Avaliação médica
        }
      } else if (paciente.classificacao_risco) {
        // Se tem classificação de risco mas não está aguardando médico
        setEtapaAtual(4);
      } else if (paciente.dados_vitais) {
        setEtapaAtual(3);
      } else if (paciente.triagem_cardiologica) {
        setEtapaAtual(2);
      }
    } else if (!idUrl) {
      // Nova triagem do zero
      setEtapaAtual(1);
    }
    
    setCarregando(false);
  }, [pacienteExistente, isLoading, isRetriagem, idUrl]);

  const salvarMutation = useMutation({
    mutationFn: async (dados) => {
      if (pacienteId) {
        return await base44.entities.Paciente.update(pacienteId, dados);
      } else {
        const resultado = await base44.entities.Paciente.create(dados);
        setPacienteId(resultado.id);
        return resultado;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      queryClient.invalidateQueries({ queryKey: ['paciente', pacienteId] });
    },
  });

  const handleProximaEtapa = async (dadosEtapa) => {
    const dadosAtualizados = { ...dadosPaciente, ...dadosEtapa };
    setDadosPaciente(dadosAtualizados);
    
    const resultado = await salvarMutation.mutateAsync(dadosAtualizados);
    const idPaciente = resultado.id || pacienteId;
    
    if (etapaAtual === 4 && !isRetriagem) {
      setAguardandoMedico(true);
      setIdPacienteParaMedico(idPaciente);
      return;
    }
    
    if (etapaAtual < 8) {
      setEtapaAtual(etapaAtual + 1);
    }
  };

  const handleEtapaAnterior = () => {
    if (etapaAtual > (isRetriagem ? 2 : 1)) {
      setEtapaAtual(etapaAtual - 1);
    }
  };

  const continuarParaMedico = () => {
    setAguardandoMedico(false);
    setEtapaAtual(5);
  };

  const copiarId = () => {
    navigator.clipboard.writeText(idPacienteParaMedico);
    alert("ID copiado! Vá no menu 'Histórico' e cole este ID na busca.");
  };

  const irParaHistorico = () => {
    navigate(createPageUrl("Historico"));
  };

  const enviarPorEmail = () => {
    const assunto = encodeURIComponent(`[URGENTE] Avaliação Médica - ${dadosPaciente.nome_completo} - ${dadosPaciente.classificacao_risco?.cor || 'Classificação Não Definida'}`);
    
    let relatorio = `
═══════════════════════════════════════════════════════════════
  RELATÓRIO DE TRIAGEM - SOLICITAÇÃO DE AVALIAÇÃO MÉDICA
═══════════════════════════════════════════════════════════════

${dadosPaciente.triagem_cardiologica?.alerta_iam ? '⚠️⚠️⚠️ ALERTA DE PROVÁVEL IAM ⚠️⚠️⚠️\n\n' : ''}

═══ ETAPA 1: DADOS DO PACIENTE ═══

Nome Completo: ${dadosPaciente.nome_completo || '-'}
Idade: ${dadosPaciente.idade || '-'} anos
Sexo: ${dadosPaciente.sexo || '-'}
Prontuário: ${dadosPaciente.prontuario || '-'}

Data/Hora de Chegada: ${dadosPaciente.data_hora_chegada ? format(new Date(dadosPaciente.data_hora_chegada), "dd/MM/yyyy 'às' HH:mm") : '-'}
Início dos Sintomas: ${dadosPaciente.data_hora_inicio_sintomas ? format(new Date(dadosPaciente.data_hora_inicio_sintomas), "dd/MM/yyyy 'às' HH:mm") : '-'}
Início da Triagem: ${dadosPaciente.data_hora_inicio_triagem ? format(new Date(dadosPaciente.data_hora_inicio_triagem), "dd/MM/yyyy 'às' HH:mm") : '-'}


═══ ETAPA 2: TRIAGEM CARDIOLÓGICA (SBC 2025) ═══

1. Dor/desconforto no peito (cicatriz umbilical → mandíbula): ${dadosPaciente.triagem_cardiologica?.dor_desconforto_peito ? 'SIM' : 'NÃO'}
2. Duração maior que 10 minutos: ${dadosPaciente.triagem_cardiologica?.duracao_maior_10min ? 'SIM' : 'NÃO'}
3. Irradiação (braços, mandíbula, pescoço): ${dadosPaciente.triagem_cardiologica?.irradiacao ? 'SIM' : 'NÃO'}
4. Dor epigástrica: ${dadosPaciente.triagem_cardiologica?.dor_epigastrica ? 'SIM' : 'NÃO'}
5. Dispneia ou diaforese: ${dadosPaciente.triagem_cardiologica?.dispneia_diaforese ? 'SIM' : 'NÃO'}
6. >50 anos e/ou diabetes/DCV conhecida: ${dadosPaciente.triagem_cardiologica?.idade_fatores_risco ? 'SIM' : 'NÃO'}

${dadosPaciente.triagem_cardiologica?.alerta_iam ? '>>> ALERTA IAM ATIVADO <<<\n' : ''}


═══ ETAPA 3: DADOS VITAIS ═══

Pressão Arterial:
  • Braço Esquerdo: ${dadosPaciente.dados_vitais?.pa_braco_esquerdo || '-'} mmHg
  • Braço Direito: ${dadosPaciente.dados_vitais?.pa_braco_direito || '-'} mmHg

Sinais Vitais:
  • Frequência Cardíaca: ${dadosPaciente.dados_vitais?.frequencia_cardiaca || '-'} bpm
  • Frequência Respiratória: ${dadosPaciente.dados_vitais?.frequencia_respiratoria || '-'} irpm
  • Temperatura: ${dadosPaciente.dados_vitais?.temperatura || '-'} °C
  • SpO2: ${dadosPaciente.dados_vitais?.spo2 || '-'}%

Comorbidades:
  • Diabetes: ${dadosPaciente.dados_vitais?.diabetes ? 'SIM' : 'NÃO'}
  • DPOC: ${dadosPaciente.dados_vitais?.dpoc ? 'SIM' : 'NÃO'}
  • Glicemia Capilar: ${dadosPaciente.dados_vitais?.glicemia_capilar || '-'} mg/dL

ELETROCARDIOGRAMA (ECG):
  • Número de ECGs anexados: ${dadosPaciente.ecg_files?.length || 0}
  • Tempo Triagem → ECG: ${dadosPaciente.tempo_triagem_ecg_minutos || '-'} minutos
  ${dadosPaciente.tempo_triagem_ecg_minutos && dadosPaciente.tempo_triagem_ecg_minutos <= 10 ? '  ✓ DENTRO DA META (≤10 min)' : dadosPaciente.tempo_triagem_ecg_minutos ? '  ⚠️ ACIMA DA META DE 10 MINUTOS' : ''}

${dadosPaciente.ecg_files?.length > 0 ? `
Links dos ECGs:
${dadosPaciente.ecg_files.map((url, i) => `  ${i+1}. ${url}`).join('\n')}
` : ''}

${dadosPaciente.analise_ecg_ia ? `
─────────────────────────────────────────────
ANÁLISE DO ECG POR INTELIGÊNCIA ARTIFICIAL:
─────────────────────────────────────────────

${dadosPaciente.analise_ecg_ia}

─────────────────────────────────────────────
` : ''}


═══ ETAPA 4: CLASSIFICAÇÃO DE RISCO (MANCHESTER) ═══

COR DE CLASSIFICAÇÃO: ${dadosPaciente.classificacao_risco?.cor || '-'}
TEMPO MÁXIMO DE ATENDIMENTO: ${dadosPaciente.classificacao_risco?.tempo_atendimento_max || '-'}

Discriminadores Identificados:
${dadosPaciente.classificacao_risco?.discriminadores?.map(d => `  • ${d}`).join('\n') || '  Nenhum'}

Enfermeiro(a) Responsável: ${dadosPaciente.enfermeiro_nome || '-'} (COREN ${dadosPaciente.enfermeiro_coren || '-'})


═══════════════════════════════════════════════════════════════
  AÇÃO NECESSÁRIA
═══════════════════════════════════════════════════════════════

⚕️ AVALIAÇÃO MÉDICA URGENTE NECESSÁRIA

ID DO PACIENTE PARA CONTINUIDADE DO ATENDIMENTO:
${idPacienteParaMedico}

INSTRUÇÕES PARA O MÉDICO:
1. Copie o ID acima
2. Acesse o menu "Histórico" no sistema
3. Cole o ID no campo de busca
4. Clique em "Ver Detalhes" no paciente encontrado
5. O sistema continuará automaticamente na Etapa 5 (Avaliação Médica)


═══════════════════════════════════════════════════════════════
Sistema de Triagem de Dor Torácica
Autor: Walber Alves Frazão Júnior - COREN 110.238
Enfermeiro Emergencista
Pós-graduado em Cardiologia, Neurologia e Auditoria em Serviços de Saúde
Protocolos: Diretriz SBC 2025 / Sistema Manchester
═══════════════════════════════════════════════════════════════
    `;

    const corpo = encodeURIComponent(relatorio);
    window.location.href = `mailto:?subject=${assunto}&body=${corpo}`;
  };

  if (carregando || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8 flex items-center justify-center">
        <Card className="shadow-xl p-8">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados do paciente...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (aguardandoMedico) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl("Dashboard"))}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Painel
            </Button>
          </div>

          <Card className="shadow-xl">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Triagem de Enfermagem Concluída
                </h2>
                <p className="text-gray-600">
                  Paciente: <strong>{dadosPaciente.nome_completo}</strong>
                </p>
              </div>

              <Alert className="border-orange-500 bg-orange-50 mb-6">
                <AlertDescription className="text-orange-800 text-center">
                  <strong className="block mb-2 text-lg">⚠️ AVALIAÇÃO MÉDICA NECESSÁRIA</strong>
                  <p>Paciente aguardando avaliação médica</p>
                </AlertDescription>
              </Alert>

              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-500">
                  <Label className="text-sm font-medium mb-3 block text-center text-blue-900">
                    ID DO PACIENTE PARA CONTINUIDADE DO ATENDIMENTO:
                  </Label>
                  <div className="bg-white p-5 rounded border-2 border-blue-600 mb-4">
                    <p className="text-4xl font-bold text-center text-blue-900 font-mono tracking-wider">
                      {idPacienteParaMedico}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={copiarId} variant="outline" className="flex-1">
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar ID
                    </Button>
                    <Button onClick={irParaHistorico} className="flex-1 bg-green-600 hover:bg-green-700">
                      Ir para Histórico
                    </Button>
                  </div>
                </div>

                <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                  <p className="text-sm font-bold text-green-900 mb-3 text-center">
                    📋 COMO CONTINUAR O ATENDIMENTO:
                  </p>
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-green-800">
                    <li><strong>Copie o ID</strong> do paciente acima (clique no botão "Copiar ID")</li>
                    <li><strong>Vá para o menu "Histórico"</strong> no menu lateral</li>
                    <li><strong>Cole o ID</strong> no campo de busca</li>
                    <li><strong>Clique em "Ver Detalhes"</strong> no paciente encontrado</li>
                    <li>O sistema abrirá automaticamente na <strong>Etapa 5 (Avaliação Médica)</strong></li>
                  </ol>
                </div>

                <div className="bg-purple-50 border border-purple-300 rounded-lg p-4">
                  <p className="text-sm font-semibold text-purple-900 mb-2">
                    ⚡ ATALHO RÁPIDO:
                  </p>
                  <p className="text-sm text-purple-800 mb-3">
                    Se você é o médico que vai atender, pode continuar diretamente nesta tela:
                  </p>
                  <Button
                    onClick={continuarParaMedico}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    Continuar como Médico (Etapa 5)
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                <Button 
                  onClick={enviarPorEmail}
                  className="w-full"
                  variant="outline"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar Relatório Completo por Email
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Resumo da Triagem:</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>ID:</strong> {idPacienteParaMedico}</p>
                  <p><strong>Classificação:</strong> {dadosPaciente.classificacao_risco?.cor || '-'}</p>
                  <p><strong>Tempo Triagem-ECG:</strong> {dadosPaciente.tempo_triagem_ecg_minutos || '-'} min</p>
                  {dadosPaciente.triagem_cardiologica?.alerta_iam && (
                    <p className="text-red-600 font-bold">⚠️ ALERTA DE PROVÁVEL IAM</p>
                  )}
                  {dadosPaciente.ecg_files?.length > 0 && (
                    <p><strong>ECGs anexados:</strong> {dadosPaciente.ecg_files.length}</p>
                  )}
                  {dadosPaciente.analise_ecg_ia && (
                    <p className="text-green-600 font-semibold">✓ Análise por IA disponível</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => navigate(createPageUrl("Dashboard"))}
                  variant="outline"
                  className="flex-1"
                >
                  Voltar ao Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const EtapaComponente = etapas[etapaAtual - 1].componente;
  const progresso = (etapaAtual / 8) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("Dashboard"))}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Painel
          </Button>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              {isRetriagem && <span className="text-blue-600 font-semibold">RETRIAGEM • </span>}
              Etapa {etapaAtual} de 8
            </p>
            <p className="font-semibold text-gray-900">{etapas[etapaAtual - 1].titulo}</p>
          </div>
        </div>

        {isRetriagem && (
          <Alert className="mb-6 border-blue-500 bg-blue-50">
            <AlertDescription className="text-blue-800">
              <strong>Retriagem em andamento</strong> - Dados do paciente já cadastrados. 
              Atualizando nova triagem com data/hora atual.
            </AlertDescription>
          </Alert>
        )}

        {dadosPaciente.status === "Aguardando Médico" && etapaAtual === 5 && (
          <Alert className="mb-6 border-green-500 bg-green-50">
            <AlertDescription className="text-green-800">
              <strong>Avaliação Médica</strong> - Paciente aguardando avaliação. Continue o atendimento a partir da Etapa 5.
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-xl mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              {etapas.map((etapa) => (
                <div
                  key={etapa.numero}
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm ${
                    etapa.numero < etapaAtual
                      ? "bg-green-500 text-white"
                      : etapa.numero === etapaAtual
                      ? "bg-red-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {etapa.numero < etapaAtual ? <Check className="w-5 h-5" /> : etapa.numero}
                </div>
              ))}
            </div>
            <Progress value={progresso} className="h-2" />
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardContent className="p-8">
            <EtapaComponente
              dadosPaciente={dadosPaciente}
              onProxima={handleProximaEtapa}
              onAnterior={handleEtapaAnterior}
              pacienteId={pacienteId}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
