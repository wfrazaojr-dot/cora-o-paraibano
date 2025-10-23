import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default function Etapa5AvaliacaoMedica({ dadosPaciente, onProxima, onAnterior }) {
  const [avaliacao, setAvaliacao] = useState(dadosPaciente.avaliacao_medica || {
    data_hora_avaliacao: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    antecedentes: "",
    quadro_atual: "",
    hipoteses_diagnosticas: "",
    diagnostico_confirmado: "",
    observacoes: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onProxima({ 
      avaliacao_medica: avaliacao,
      status: "Em Atendimento"
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Avaliação Médica</h2>
        <p className="text-gray-600">Registro da avaliação clínica e diagnósticos</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="data_avaliacao">Data e Hora da Avaliação</Label>
        <Input
          id="data_avaliacao"
          type="datetime-local"
          value={avaliacao.data_hora_avaliacao}
          onChange={(e) => setAvaliacao({...avaliacao, data_hora_avaliacao: e.target.value})}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="antecedentes">Antecedentes Clínicos</Label>
        <Textarea
          id="antecedentes"
          placeholder="Histórico de doenças prévias, cirurgias, medicações em uso, alergias..."
          value={avaliacao.antecedentes}
          onChange={(e) => setAvaliacao({...avaliacao, antecedentes: e.target.value})}
          rows={4}
          className="resize-y"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="quadro_atual">Quadro Clínico Atual</Label>
        <Textarea
          id="quadro_atual"
          placeholder="Características da dor torácica, dispneia, sintomas associados..."
          value={avaliacao.quadro_atual}
          onChange={(e) => setAvaliacao({...avaliacao, quadro_atual: e.target.value})}
          rows={5}
          className="resize-y"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="hipoteses">Hipóteses Diagnósticas</Label>
        <Textarea
          id="hipoteses"
          placeholder="Diagnósticos diferenciais considerados (IAM, angina, dissecção de aorta, pericardite, TEP, etc.)"
          value={avaliacao.hipoteses_diagnosticas}
          onChange={(e) => setAvaliacao({...avaliacao, hipoteses_diagnosticas: e.target.value})}
          rows={4}
          className="resize-y"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="diagnostico">Diagnóstico Confirmado/Principal</Label>
        <Input
          id="diagnostico"
          placeholder="Ex: IAMCSST, Angina Instável, SCA sem supra de ST..."
          value={avaliacao.diagnostico_confirmado}
          onChange={(e) => setAvaliacao({...avaliacao, diagnostico_confirmado: e.target.value})}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações Adicionais</Label>
        <Textarea
          id="observacoes"
          placeholder="Outras informações relevantes, achados no exame físico, complicações..."
          value={avaliacao.observacoes}
          onChange={(e) => setAvaliacao({...avaliacao, observacoes: e.target.value})}
          rows={3}
          className="resize-y"
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onAnterior}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button type="submit" className="bg-red-600 hover:bg-red-700">
          Próxima Etapa
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}