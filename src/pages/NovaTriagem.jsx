import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Check } from "lucide-react";
import { format } from "date-fns";

import Etapa1DadosPaciente from "../components/triagem/Etapa1DadosPaciente";
import Etapa2TriagemMedica from "../components/triagem/Etapa2TriagemMedica";
import Etapa3_1_SCACESST from "../components/triagem/Etapa3_1_SCACESST";
import Etapa3_2_SCASESST_ComTroponina from "../components/triagem/Etapa3_2_SCASESST_ComTroponina";
import Etapa3_3_SCASESST_SemTroponina from "../components/triagem/Etapa3_3_SCASESST_SemTroponina";
import Etapa4Relatorio from "../components/triagem/Etapa4Relatorio";

const etapas = [
  { numero: 1, titulo: "Dados do Paciente" },
  { numero: 2, titulo: "Triagem Médica Cardiológica" },
  { numero: 3, titulo: "Avaliação Clínica" },
  { numero: 4, titulo: "Relatório e Regulação" }
];

export default function NovaTriagem() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [dadosPaciente, setDadosPaciente] = useState({});
  const [pacienteId, setPacienteId] = useState(null);
  const [dataHoraInicioTriagem, setDataHoraInicioTriagem] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const idUrl = urlParams.get('id') || urlParams.get('pacienteId');
  const isRetriagem = urlParams.get('retriagem') === 'true';

  // Carregar dados do paciente se ID existir na URL
  useEffect(() => {
    if (idUrl) {
      base44.entities.Paciente.filter({ id: idUrl }).then((pacientes) => {
        if (pacientes && pacientes.length > 0) {
          const paciente = pacientes[0];
          setDadosPaciente(paciente);
          setPacienteId(paciente.id);
        }
      });
    } else {
      // Novo paciente - iniciar contagem de tempo
      setDataHoraInicioTriagem(new Date().toISOString());
    }
  }, [idUrl]);

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

  const handleProximaEtapa = async (dadosEtapa, apenasNavegar = false) => {
    try {
      // Se é apenas navegação (modo leitura), não salva dados
      if (apenasNavegar) {
        if (etapaAtual < 4) {
          setEtapaAtual(etapaAtual + 1);
        }
        return;
      }

      // Caso contrário, salva normalmente
      const dadosAtualizados = { 
        ...dadosPaciente, 
        ...dadosEtapa,
        data_hora_inicio_triagem: dadosPaciente.data_hora_inicio_triagem || dataHoraInicioTriagem
      };
      setDadosPaciente(dadosAtualizados);
      
      const resultado = await salvarMutation.mutateAsync(dadosAtualizados);
      
      if (resultado) {
        if (etapaAtual < 4) {
          setEtapaAtual(etapaAtual + 1);
        }
      }
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
      alert("Erro ao salvar dados. Tente novamente.");
    }
  };

  const handleEtapaAnterior = () => {
    if (etapaAtual > 1) {
      setEtapaAtual(etapaAtual - 1);
    }
  };

  const renderEtapa = () => {
    // Em retriagem: etapa 1 é sempre leitura (dados do paciente não mudam)
    // Em visualização (idUrl sem retriagem): etapas 1 e 2 são leitura
    const etapa1Leitura = !!idUrl; // sempre leitura se há paciente existente
    const etapa2Leitura = idUrl && !isRetriagem;
    
    switch (etapaAtual) {
      case 1:
        return <Etapa1DadosPaciente dadosPaciente={dadosPaciente} onProxima={handleProximaEtapa} onAnterior={handleEtapaAnterior} modoLeitura={etapa1Leitura} permitirNavegacao={true} />;
      case 2:
        return <Etapa2TriagemMedica dadosPaciente={dadosPaciente} onProxima={handleProximaEtapa} onAnterior={handleEtapaAnterior} modoLeitura={etapa2Leitura} permitirNavegacao={true} />;
      case 3:
        const tipoSca = dadosPaciente.triagem_medica?.tipo_sca;
        if (tipoSca === "SCACESST") {
          return <Etapa3_1_SCACESST dadosPaciente={dadosPaciente} onProxima={handleProximaEtapa} onAnterior={handleEtapaAnterior} modoLeitura={false} />;
        } else if (tipoSca === "SCASESST_COM_TROPONINA") {
          return <Etapa3_2_SCASESST_ComTroponina dadosPaciente={dadosPaciente} onProxima={handleProximaEtapa} onAnterior={handleEtapaAnterior} modoLeitura={false} />;
        } else if (tipoSca === "SCASESST_SEM_TROPONINA") {
          return <Etapa3_3_SCASESST_SemTroponina dadosPaciente={dadosPaciente} onProxima={handleProximaEtapa} onAnterior={handleEtapaAnterior} modoLeitura={false} />;
        } else {
          return <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Tipo de SCA não definido</p>
            <div className="flex justify-between">
              <Button onClick={handleEtapaAnterior} variant="outline">
                Voltar
              </Button>
              <Button onClick={() => setEtapaAtual(4)} className="bg-red-600 hover:bg-red-700">
                Ir para Relatório
              </Button>
            </div>
          </div>;
        }
      case 4:
        return <Etapa4Relatorio dadosPaciente={dadosPaciente} onAnterior={handleEtapaAnterior} pacienteId={pacienteId} />;
      default:
        return <div>Etapa não encontrada</div>;
    }
  };

  const progresso = (etapaAtual / 4) * 100;

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={() => navigate(createPageUrl("Dashboard"))}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Painel
            </Button>
            <div className="text-right">
              <p className="text-sm text-gray-600">Etapa {etapaAtual} de 4</p>
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
              {renderEtapa()}
            </CardContent>
          </Card>
        </div>
      </div>
  );
}