import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const discriminadores = {
  vermelha: [
    "Nível de consciência alterado",
    "Hemorragia ativa",
    "Temperatura > 41°C",
    "Dor severa",
    "PAS ≥ 180 mmHg ou PAD ≥ 120 mmHg",
    "PAS < 100 mmHg",
    "SpO2 < 90%",
    "Diaforese intensa"
  ],
  laranja: [
    "Alerta de provável IAM (triagem cardiológica)",
    "Dispneia aguda",
    "SpO2 < 90%",
    "Pulsos irregulares",
    "Dor intensa",
    "Temperatura ≥ 41°C"
  ],
  amarela: [
    "SpO2 entre 90% e 92% (sem dispneia)",
    "Vômitos persistentes",
    "Paciente cardiopata",
    "Dor pleurítica (ao respirar)",
    "Dor moderada",
    "Temperatura entre 38.5°C e 40.9°C"
  ],
  verde: [
    "Vômito não persistente",
    "Dor leve",
    "Evento recente (< 7 dias)"
  ],
  azul: [
    "Sintomas há mais de 7 dias"
  ]
};

const temposAtendimento = {
  "Vermelha": "Atendimento imediato",
  "Laranja": "Aguardar até 10 minutos",
  "Amarela": "Aguardar até 60 minutos",
  "Verde": "Aguardar até 120 minutos",
  "Azul": "Aguardar até 240 minutos"
};

export default function Etapa4ClassificacaoRisco({ dadosPaciente, onProxima, onAnterior }) {
  const [discriminadoresSelecionados, setDiscriminadoresSelecionados] = useState([]);
  const [classificacao, setClassificacao] = useState(dadosPaciente.classificacao_risco || null);

  useEffect(() => {
    if (discriminadoresSelecionados.length > 0) {
      let cor = "Azul";
      
      if (discriminadoresSelecionados.some(d => discriminadores.vermelha.includes(d))) {
        cor = "Vermelha";
      } else if (discriminadoresSelecionados.some(d => discriminadores.laranja.includes(d))) {
        cor = "Laranja";
      } else if (discriminadoresSelecionados.some(d => discriminadores.amarela.includes(d))) {
        cor = "Amarela";
      } else if (discriminadoresSelecionados.some(d => discriminadores.verde.includes(d))) {
        cor = "Verde";
      }

      if (dadosPaciente.triagem_cardiologica?.alerta_iam) {
        cor = "Laranja";
        if (!discriminadoresSelecionados.includes("Alerta de provável IAM (triagem cardiológica)")) {
          setDiscriminadoresSelecionados([...discriminadoresSelecionados, "Alerta de provável IAM (triagem cardiológica)"]);
        }
      }

      setClassificacao({
        cor,
        tempo_atendimento_max: temposAtendimento[cor],
        discriminadores: discriminadoresSelecionados
      });
    }
  }, [discriminadoresSelecionados]);

  const toggleDiscriminador = (discriminador) => {
    if (discriminadoresSelecionados.includes(discriminador)) {
      setDiscriminadoresSelecionados(discriminadoresSelecionados.filter(d => d !== discriminador));
    } else {
      setDiscriminadoresSelecionados([...discriminadoresSelecionados, discriminador]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onProxima({ 
      classificacao_risco: classificacao,
      status: "Aguardando Médico"
    });
  };

  const corClassificacao = {
    "Vermelha": "bg-red-600",
    "Laranja": "bg-orange-600",
    "Amarela": "bg-yellow-500",
    "Verde": "bg-green-600",
    "Azul": "bg-blue-600"
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Classificação de Risco</h2>
        <p className="text-gray-600">Sistema Manchester - Selecione os discriminadores identificados</p>
      </div>

      {dadosPaciente.triagem_cardiologica?.alerta_iam && (
        <Alert className="border-orange-500 bg-orange-50">
          <AlertDescription className="text-orange-800 font-semibold">
            ⚠️ Paciente com alerta de IAM - Classificação mínima: LARANJA
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <div className="border-l-4 border-l-red-600 bg-red-50 p-4 rounded">
          <h3 className="font-bold text-red-900 mb-3">Discriminadores Vermelhos (Ameaçadores da Vida)</h3>
          <div className="space-y-2">
            {discriminadores.vermelha.map((disc, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Checkbox
                  id={`v-${i}`}
                  checked={discriminadoresSelecionados.includes(disc)}
                  onCheckedChange={() => toggleDiscriminador(disc)}
                />
                <Label htmlFor={`v-${i}`} className="cursor-pointer">{disc}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="border-l-4 border-l-orange-600 bg-orange-50 p-4 rounded">
          <h3 className="font-bold text-orange-900 mb-3">Discriminadores Laranja</h3>
          <div className="space-y-2">
            {discriminadores.laranja.map((disc, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Checkbox
                  id={`l-${i}`}
                  checked={discriminadoresSelecionados.includes(disc)}
                  onCheckedChange={() => toggleDiscriminador(disc)}
                  disabled={disc === "Alerta de provável IAM (triagem cardiológica)" && dadosPaciente.triagem_cardiologica?.alerta_iam}
                />
                <Label htmlFor={`l-${i}`} className="cursor-pointer">{disc}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="border-l-4 border-l-yellow-500 bg-yellow-50 p-4 rounded">
          <h3 className="font-bold text-yellow-900 mb-3">Discriminadores Amarelos</h3>
          <div className="space-y-2">
            {discriminadores.amarela.map((disc, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Checkbox
                  id={`a-${i}`}
                  checked={discriminadoresSelecionados.includes(disc)}
                  onCheckedChange={() => toggleDiscriminador(disc)}
                />
                <Label htmlFor={`a-${i}`} className="cursor-pointer">{disc}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="border-l-4 border-l-green-600 bg-green-50 p-4 rounded">
          <h3 className="font-bold text-green-900 mb-3">Discriminadores Verdes</h3>
          <div className="space-y-2">
            {discriminadores.verde.map((disc, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Checkbox
                  id={`g-${i}`}
                  checked={discriminadoresSelecionados.includes(disc)}
                  onCheckedChange={() => toggleDiscriminador(disc)}
                />
                <Label htmlFor={`g-${i}`} className="cursor-pointer">{disc}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="border-l-4 border-l-blue-600 bg-blue-50 p-4 rounded">
          <h3 className="font-bold text-blue-900 mb-3">Discriminadores Azuis</h3>
          <div className="space-y-2">
            {discriminadores.azul.map((disc, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Checkbox
                  id={`b-${i}`}
                  checked={discriminadoresSelecionados.includes(disc)}
                  onCheckedChange={() => toggleDiscriminador(disc)}
                />
                <Label htmlFor={`b-${i}`} className="cursor-pointer">{disc}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {classificacao && (
        <div className="border-2 border-gray-300 rounded-lg p-6 bg-white">
          <h3 className="font-bold text-lg mb-4">Classificação Determinada:</h3>
          <div className="flex items-center gap-4 mb-4">
            <Badge className={`${corClassificacao[classificacao.cor]} text-white text-lg px-6 py-2`}>
              {classificacao.cor}
            </Badge>
            <span className="font-medium">{classificacao.tempo_atendimento_max}</span>
          </div>
          <p className="text-sm text-gray-600">Discriminadores: {classificacao.discriminadores.join(", ")}</p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onAnterior}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={!classificacao}>
          Próxima Etapa
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}