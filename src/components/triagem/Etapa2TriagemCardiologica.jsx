import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const perguntas = [
  "Você está sentindo alguma dor ou desconforto na região do peito entre a cicatriz umbilical e a mandíbula?",
  "Essa dor ou desconforto dura mais de 10 minutos?",
  "Você sente dor ou desconforto que irradia para os braços, mandíbula ou pescoço, antes deste atendimento?",
  "Você sente dor ou desconforto epigástrico antes deste atendimento?",
  "Apresenta dispneia ou diaforese (sudorese, pele fria)?",
  "> 50 anos e/ou com histórico de diabetes ou doença cardiovascular conhecida?"
];

export default function Etapa2TriagemCardiologica({ dadosPaciente, onProxima, onAnterior }) {
  const [respostas, setRespostas] = useState(
    dadosPaciente.triagem_cardiologica || {
      dor_desconforto_peito: null,
      duracao_maior_10min: null,
      irradiacao: null,
      dor_epigastrica: null,
      dispneia_diaforese: null,
      idade_fatores_risco: null,
      alerta_iam: false
    }
  );

  const chavesRespostas = [
    "dor_desconforto_peito",
    "duracao_maior_10min",
    "irradiacao",
    "dor_epigastrica",
    "dispneia_diaforese",
    "idade_fatores_risco"
  ];

  const handleResposta = (index, valor) => {
    const chave = chavesRespostas[index];
    const novasRespostas = { ...respostas, [chave]: valor === "sim" };
    
    const algumSim = Object.values(novasRespostas).some((v, i) => 
      i < chavesRespostas.length && v === true
    );
    novasRespostas.alerta_iam = algumSim;
    
    setRespostas(novasRespostas);
  };

  const todasRespondidas = chavesRespostas.every(chave => respostas[chave] !== null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onProxima({ triagem_cardiologica: respostas });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Triagem Cardiológica</h2>
        <p className="text-gray-600">Critérios da Sociedade Brasileira de Cardiologia, 2025</p>
      </div>

      {respostas.alerta_iam && (
        <Alert className="border-red-500 bg-red-50">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800 font-semibold">
            ⚠️ PROVÁVEL IAM - REALIZE ECG EM ATÉ 10 MINUTOS
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {perguntas.map((pergunta, index) => (
          <div key={index} className="p-4 border rounded-lg bg-white">
            <Label className="text-base font-medium mb-3 block">
              {index + 1}. {pergunta}
            </Label>
            <RadioGroup
              value={respostas[chavesRespostas[index]] === true ? "sim" : respostas[chavesRespostas[index]] === false ? "nao" : ""}
              onValueChange={(valor) => handleResposta(index, valor)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id={`sim-${index}`} />
                <Label htmlFor={`sim-${index}`} className="cursor-pointer">SIM</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id={`nao-${index}`} />
                <Label htmlFor={`nao-${index}`} className="cursor-pointer">NÃO</Label>
              </div>
            </RadioGroup>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onAnterior}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={!todasRespondidas}>
          Próxima Etapa
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}