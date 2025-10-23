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
  const [linkMedico, setLinkMedico] = useState("");

  const urlParams = new URLSearchParams(window.location.search);
  const idUrl = urlParams.get('id');
  const isRetriagem = urlParams.get('retriagem') === 'true';

  const { data: pacienteExistente } = useQuery({
    queryKey: ['paciente', idUrl],
    queryFn: () => base44.entities.Paciente.filter({ id: idUrl }),
    enabled: !!idUrl,
  });

  useEffect(() => {
    if (pacienteExistente && pacienteExistente[0]) {
      const paciente = pacienteExistente[0];
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
        // Se está aguardando médico, ir direto para etapa 5
        setEtapaAtual(5);
      }
    }
  }, [pacienteExistente, isRetriagem]);

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
    },
  });

  const handleProximaEtapa = async (dadosEtapa) => {
    const dadosAtualizados = { ...dadosPaciente, ...dadosEtapa };
    setDadosPaciente(dadosAtualizados);
    
    await salvarMutation.mutateAsync(dadosAtualizados);
    
    // Se terminou etapa 4, mostrar tela de aguardo para médico
    if (etapaAtual === 4 && !isRetriagem) {
      setAguardandoMedico(true);
      const link = `${window.location.origin}${createPageUrl("NovaTriagem")}?id=${pacienteId}`;
      setLinkMedico(link);
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
    alert("Link copiado para área de transferência!");
  };

  const enviarPorEmail = () => {
    const assunto = encodeURIComponent(`Avaliação Médica - ${dadosPaciente.nome_completo}`);
    const corpo = encodeURIComponent(`
Olá,

O paciente ${dadosPaciente.nome_completo} necessita de avaliação médica.

Classificação de Risco: ${dadosPaciente.classificacao_risco?.cor}
${dadosPaciente.triagem_cardiologica?.alerta_iam ? "⚠️ ALERTA DE PROVÁVEL IAM" : ""}

Acesse o link abaixo para continuar o atendimento:
${linkMedico}

---
Sistema de Triagem de Dor Torácica
    `);
    window.location.href = `mailto:?subject=${assunto}&body=${corpo}`;
  };

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
                  <p>Médico deve fazer login para continuar a assistência</p>
                  <p className="text-sm mt-1">Sistema em stand-by até avaliação médica</p>
                </AlertDescription>
              </Alert>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Label className="text-sm font-medium mb-2 block">Link para o Médico:</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={linkMedico} 
                      readOnly 
                      className="font-mono text-sm"
                    />
                    <Button onClick={copiarLink} variant="outline">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={enviarPorEmail}
                  className="w-full"
                  variant="outline"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar Link por Email
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Resumo da Triagem:</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>Classificação:</strong> {dadosPaciente.classificacao_risco?.cor}</p>
                  <p><strong>Tempo Triagem-ECG:</strong> {dadosPaciente.tempo_triagem_ecg_minutos} min</p>
                  {dadosPaciente.triagem_cardiologica?.alerta_iam && (
                    <p className="text-red-600 font-bold">⚠️ ALERTA DE PROVÁVEL IAM</p>
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
                <Button
                  onClick={continuarParaMedico}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Continuar como Médico
                  <ArrowRight className="w-4 h-4 ml-2" />
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

  // Em retriagem, não mostrar etapa 1
  if (isRetriagem && etapaAtual === 1) {
    setEtapaAtual(2);
    return null;
  }

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