import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, Copy, Mail, ExternalLink } from "lucide-react";
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
  const [linkMedico, setLinkMedico] = useState("");
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
        setEtapaAtual(2);
        setDadosPaciente({
          ...paciente,
          data_hora_inicio_triagem: format(new Date(), "yyyy-MM-dd'T'HH:mm")
        });
      } else if (paciente.status === "Aguardando Médico") {
        setEtapaAtual(5);
      } else if (paciente.status === "Em Atendimento") {
        if (paciente.avaliacao_medica) {
          if (paciente.prescricao_medicamentos && paciente.prescricao_medicamentos.length > 0) {
            if (paciente.exames_solicitados && paciente.exames_solicitados.length > 0) {
              setEtapaAtual(8);
            } else {
              setEtapaAtual(7);
            }
          } else {
            setEtapaAtual(6);
          }
        } else {
          setEtapaAtual(5);
        }
      } else if (paciente.classificacao_risco) {
        setEtapaAtual(4);
      } else if (paciente.dados_vitais) {
        setEtapaAtual(3);
      } else if (paciente.triagem_cardiologica) {
        setEtapaAtual(2);
      }
    } else if (!idUrl) {
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
      // Construir URL absoluta completa
      const urlBase = window.location.href.split('?')[0];
      const linkCompleto = `${urlBase}?id=${idPaciente}`;
      setLinkMedico(linkCompleto);
      console.log("=== LINK GERADO ===");
      console.log("URL Base:", urlBase);
      console.log("ID Paciente:", idPaciente);
      console.log("Link Completo:", linkCompleto);
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

  const copiarLink = () => {
    navigator.clipboard.writeText(linkMedico);
    alert("✅ Link copiado!\n\nCole no navegador (Ctrl+V ou Cmd+V) e pressione Enter.");
  };

  const abrirNovaAba = () => {
    const novaAba = window.open(linkMedico, '_blank');
    if (!novaAba) {
      alert("⚠️ Pop-up bloqueado!\n\nPermita pop-ups para este site ou copie o link e cole em uma nova aba.");
    }
  };

  const enviarPorEmail = () => {
    const assunto = encodeURIComponent(`[URGENTE] Avaliação Médica - ${dadosPaciente.nome_completo} - ${dadosPaciente.classificacao_risco?.cor}`);
    
    const corpo = encodeURIComponent(`
SOLICITAÇÃO DE AVALIAÇÃO MÉDICA - DOR TORÁCICA

PACIENTE: ${dadosPaciente.nome_completo}
CLASSIFICAÇÃO: ${dadosPaciente.classificacao_risco?.cor}
${dadosPaciente.triagem_cardiologica?.alerta_iam ? '\n⚠️⚠️⚠️ ALERTA DE PROVÁVEL IAM ⚠️⚠️⚠️\n' : ''}

═══════════════════════════════════════════

LINK PARA CONTINUIDADE DO ATENDIMENTO:

${linkMedico}

INSTRUÇÕES:
1. Copie o link acima
2. Cole em uma nova aba do navegador
3. Pressione Enter
4. O sistema abrirá na Etapa 5 (Avaliação Médica)

═══════════════════════════════════════════

Enfermeiro(a): ${dadosPaciente.enfermeiro_nome} - COREN ${dadosPaciente.enfermeiro_coren}
Tempo Triagem-ECG: ${dadosPaciente.tempo_triagem_ecg_minutos} minutos

Sistema de Triagem de Dor Torácica
    `);

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
                  <p>Compartilhe o link abaixo para continuidade do atendimento</p>
                </AlertDescription>
              </Alert>

              <div className="space-y-4 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border-2 border-blue-600 shadow-md">
                  <Label className="text-sm font-bold mb-3 block text-center text-blue-900 uppercase tracking-wide">
                    🔗 Link de Acesso Médico
                  </Label>
                  <div className="bg-white p-4 rounded-lg border-2 border-blue-700 mb-4 shadow-inner">
                    <Input
                      value={linkMedico}
                      readOnly
                      className="text-center font-mono text-sm text-blue-900 font-semibold border-0 focus:ring-0"
                      onClick={(e) => e.target.select()}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={copiarLink} 
                      variant="outline" 
                      className="w-full border-2 border-blue-600 hover:bg-blue-50 font-semibold"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Link
                    </Button>
                    <Button 
                      onClick={abrirNovaAba} 
                      className="w-full bg-green-600 hover:bg-green-700 font-semibold shadow-md"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir em Nova Aba
                    </Button>
                  </div>
                </div>

                <div className="bg-green-50 border-2 border-green-600 rounded-lg p-5 shadow-sm">
                  <p className="text-sm font-bold text-green-900 mb-3 text-center uppercase">
                    ✅ Como Usar o Link
                  </p>
                  <ol className="list-decimal pl-6 space-y-2 text-sm text-green-900">
                    <li><strong>Opção 1:</strong> Clique em <strong>"Abrir em Nova Aba"</strong> - o link abrirá automaticamente</li>
                    <li><strong>Opção 2:</strong> Clique em <strong>"Copiar Link"</strong>, cole no navegador (Ctrl+V) e pressione Enter</li>
                    <li>O sistema carregará automaticamente na <strong>Etapa 5 - Avaliação Médica</strong></li>
                  </ol>
                </div>

                <div className="bg-purple-50 border-2 border-purple-500 rounded-lg p-5 shadow-sm">
                  <p className="text-sm font-bold text-purple-900 mb-2 text-center">
                    ⚡ Atalho Direto (Mesma Sessão)
                  </p>
                  <p className="text-sm text-purple-800 mb-3 text-center">
                    Se você é o médico que vai atender este paciente agora:
                  </p>
                  <Button
                    onClick={continuarParaMedico}
                    className="w-full bg-red-600 hover:bg-red-700 font-bold shadow-lg"
                    size="lg"
                  >
                    Continuar como Médico (Ir para Etapa 5)
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>

                <Button 
                  onClick={enviarPorEmail}
                  className="w-full"
                  variant="outline"
                  size="lg"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar Link por Email
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">📋 Resumo da Triagem:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                  <div><strong>Classificação:</strong> {dadosPaciente.classificacao_risco?.cor}</div>
                  <div><strong>Tempo ECG:</strong> {dadosPaciente.tempo_triagem_ecg_minutos} min</div>
                  <div><strong>ECGs:</strong> {dadosPaciente.ecg_files?.length || 0} arquivo(s)</div>
                  <div><strong>Análise IA:</strong> {dadosPaciente.analise_ecg_ia ? '✓ Sim' : '✗ Não'}</div>
                </div>
                {dadosPaciente.triagem_cardiologica?.alerta_iam && (
                  <div className="mt-3 p-2 bg-red-100 border-2 border-red-500 rounded text-center">
                    <p className="text-red-800 font-bold">⚠️ ALERTA DE PROVÁVEL IAM</p>
                  </div>
                )}
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