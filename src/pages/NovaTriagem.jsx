import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import Etapa1DadosPaciente from "../components/triagem/Etapa1DadosPaciente";
import Etapa2TriagemCardiologica from "../components/triagem/Etapa2TriagemCardiologica";
import Etapa3DadosVitais from "../components/triagem/Etapa3DadosVitais";
import Etapa4ClassificacaoRisco from "../components/triagem/Etapa4ClassificacaoRisco";
import Etapa5AvaliacaoMedica from "../components/triagem/Etapa5AvaliacaoMedica";
import Etapa6Prescricao from "../components/triagem/Etapa6Prescricao";
import Etapa7Exames from "../components/triagem/Etapa7Exames";
import Etapa8Relatorio from "../components/triagem/Etapa8Relatorio";

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

  const urlParams = new URLSearchParams(window.location.search);
  const idUrl = urlParams.get('id');

  const { data: pacienteExistente } = useQuery({
    queryKey: ['paciente', idUrl],
    queryFn: () => base44.entities.Paciente.filter({ id: idUrl }),
    enabled: !!idUrl,
  });

  useEffect(() => {
    if (pacienteExistente && pacienteExistente[0]) {
      setDadosPaciente(pacienteExistente[0]);
      setPacienteId(pacienteExistente[0].id);
    }
  }, [pacienteExistente]);

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
    
    if (etapaAtual < 8) {
      setEtapaAtual(etapaAtual + 1);
    }
  };

  const handleEtapaAnterior = () => {
    if (etapaAtual > 1) {
      setEtapaAtual(etapaAtual - 1);
    }
  };

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
            <p className="text-sm text-gray-600">Etapa {etapaAtual} de 8</p>
            <p className="font-semibold text-gray-900">{etapas[etapaAtual - 1].titulo}</p>
          </div>
        </div>

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