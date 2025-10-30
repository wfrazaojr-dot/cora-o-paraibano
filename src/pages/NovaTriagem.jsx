import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

import Etapa1DadosPaciente from "../components/triagem/Etapa1DadosPaciente";
import Etapa2TriagemCardiologica from "../components/triagem/Etapa2TriagemCardiologica";
import Etapa3DadosVitais from "../components/triagem/Etapa3DadosVitais";
import Etapa4ClassificacaoRisco from "../components/triagem/Etapa4ClassificacaoRisco";
import Etapa5ECGEnfermeiro from "../components/triagem/Etapa5ECGEnfermeiro";
import Etapa6AvaliacaoMedica from "../components/triagem/Etapa5AvaliacaoMedica";
import Etapa7Prescricao from "../components/triagem/Etapa6Prescricao";
import Etapa8Exames from "../components/triagem/Etapa7Exames";
import Etapa9Relatorio from "../components/triagem/Etapa8Relatorio";
import { format } from "date-fns";

const etapas = [
  { numero: 1, titulo: "Dados do Paciente", componente: Etapa1DadosPaciente },
  { numero: 2, titulo: "Triagem Cardiológica", componente: Etapa2TriagemCardiologica },
  { numero: 3, titulo: "Dados Vitais", componente: Etapa3DadosVitais },
  { numero: 4, titulo: "Classificação de Risco", componente: Etapa4ClassificacaoRisco },
  { numero: 5, titulo: "ECG e Identificação", componente: Etapa5ECGEnfermeiro },
  { numero: 6, titulo: "Avaliação Médica", componente: Etapa6AvaliacaoMedica },
  { numero: 7, titulo: "Prescrição", componente: Etapa7Prescricao },
  { numero: 8, titulo: "Exames", componente: Etapa8Exames },
  { numero: 9, titulo: "Relatório", componente: Etapa9Relatorio },
];

export default function NovaTriagem() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [dadosPaciente, setDadosPaciente] = useState({});
  const [pacienteId, setPacienteId] = useState(null);
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
        setEtapaAtual(6);
      } else if (paciente.status === "Em Atendimento") {
        if (paciente.avaliacao_medica) {
          if (paciente.prescricao_medicamentos && paciente.prescricao_medicamentos.length > 0) {
            if (paciente.exames_solicitados && paciente.exames_solicitados.length > 0) {
              setEtapaAtual(9);
            } else {
              setEtapaAtual(8);
            }
          } else {
            setEtapaAtual(7);
          }
        } else {
          setEtapaAtual(6);
        }
      } else if (paciente.enfermeiro_nome && paciente.ecg_files) {
        setEtapaAtual(5);
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
    
    await salvarMutation.mutateAsync(dadosAtualizados);
    
    if (etapaAtual === 5 && !isRetriagem) {
      alert("✅ Triagem de Enfermagem Concluída!\n\nPaciente está AGUARDANDO MÉDICO.\n\nPara continuar o atendimento:\n1. Vá no Dashboard ou Histórico\n2. Clique em 'Ver Detalhes' no paciente\n3. O sistema abrirá automaticamente na Etapa 6 (Avaliação Médica)");
      navigate(createPageUrl("Dashboard"));
      return;
    }
    
    if (etapaAtual < 9) {
      setEtapaAtual(etapaAtual + 1);
    }
  };

  const handleEtapaAnterior = () => {
    if (etapaAtual > (isRetriagem ? 2 : 1)) {
      setEtapaAtual(etapaAtual - 1);
    }
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

  const EtapaComponente = etapas[etapaAtual - 1].componente;
  const progresso = (etapaAtual / 9) * 100;

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
              Etapa {etapaAtual} de 9
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

        {dadosPaciente.status === "Aguardando Médico" && etapaAtual === 6 && (
          <Alert className="mb-6 border-green-500 bg-green-50">
            <AlertDescription className="text-green-800">
              <strong>Avaliação Médica</strong> - Paciente aguardando avaliação. Continue o atendimento a partir da Etapa 6.
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