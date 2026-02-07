import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Pill, TestTube } from "lucide-react";

export default function Etapa3_1_SCACESST({ dadosPaciente, onProxima, onAnterior }) {
  const [dados, setDados] = useState({
    antecedentes: dadosPaciente.avaliacao_clinica?.antecedentes || "",
    quadro_atual: dadosPaciente.avaliacao_clinica?.quadro_atual || "",
    hipotese_diagnostica: dadosPaciente.avaliacao_clinica?.hipotese_diagnostica || "",
    prescricao_medicamentos: dadosPaciente.avaliacao_clinica?.prescricao_medicamentos || [],
    exames_solicitados: dadosPaciente.avaliacao_clinica?.exames_solicitados || []
  });

  const [novoMedicamento, setNovoMedicamento] = useState({ medicamento: "", dose: "", via: "" });
  const [novoExame, setNovoExame] = useState("");

  const medicamentosComuns = [
    { nome: "AAS", dose: "200-300mg", via: "VO (mastigado)" },
    { nome: "Clopidogrel", dose: "300-600mg", via: "VO" },
    { nome: "Ticagrelor", dose: "180mg", via: "VO" },
    { nome: "Enoxaparina", dose: "1mg/kg", via: "SC" },
    { nome: "Mononitrato de Isossorbida", dose: "5mg", via: "SL" },
    { nome: "Dinitrato de Isossorbida", dose: "5mg", via: "SL" },
    { nome: "Morfina", dose: "2-4mg", via: "EV" },
    { nome: "Fentanil", dose: "25-50mcg", via: "EV" },
    { nome: "Metoprolol", dose: "25-50mg", via: "VO" },
    { nome: "Atorvastatina", dose: "40-80mg", via: "VO" }
  ];

  const examesComuns = [
    "Troponina (0h e 1h ou 3h)",
    "Troponina convencional",
    "Hemograma completo",
    "Creatinina / Ureia",
    "Eletrólitos (Na, K, Mg)",
    "Glicemia",
    "Coagulograma",
    "CPK-MB",
    "D-dímero",
    "Radiografia de tórax",
    "Ecocardiograma"
  ];

  const adicionarMedicamento = (med) => {
    setDados(prev => ({
      ...prev,
      prescricao_medicamentos: [...prev.prescricao_medicamentos, med]
    }));
  };

  const adicionarMedicamentoManual = () => {
    if (novoMedicamento.medicamento && novoMedicamento.dose) {
      adicionarMedicamento(novoMedicamento);
      setNovoMedicamento({ medicamento: "", dose: "", via: "" });
    }
  };

  const removerMedicamento = (index) => {
    setDados(prev => ({
      ...prev,
      prescricao_medicamentos: prev.prescricao_medicamentos.filter((_, i) => i !== index)
    }));
  };

  const editarDoseMedicamento = (index, novaDose) => {
    setDados(prev => ({
      ...prev,
      prescricao_medicamentos: prev.prescricao_medicamentos.map((med, i) => 
        i === index ? { ...med, dose: novaDose } : med
      )
    }));
  };

  const toggleExame = (exame) => {
    setDados(prev => ({
      ...prev,
      exames_solicitados: prev.exames_solicitados.includes(exame)
        ? prev.exames_solicitados.filter(e => e !== exame)
        : [...prev.exames_solicitados, exame]
    }));
  };

  const adicionarExameManual = () => {
    if (novoExame.trim()) {
      toggleExame(novoExame.trim());
      setNovoExame("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!dados.antecedentes || !dados.quadro_atual || !dados.hipotese_diagnostica) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    onProxima({ avaliacao_clinica: dados });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Avaliação Clínica - SCACESST</h2>
        <p className="text-gray-600">Paciente com Síndrome Coronariana Aguda COM Supra de ST</p>
      </div>

      {/* Prescrição Medicamentosa */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
          <Pill className="w-5 h-5" />
          Prescrição Medicamentosa
        </h3>

        <div className="space-y-3 mb-4">
          <Label>Medicamentos do Protocolo</Label>
          <div className="grid md:grid-cols-2 gap-2">
            {medicamentosComuns.map((med) => (
              <Button
                key={med.nome}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adicionarMedicamento(med)}
                className="justify-start"
              >
                + {med.nome} {med.dose} {med.via}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <Label>Adicionar Medicamento Personalizado</Label>
          <div className="grid md:grid-cols-3 gap-2">
            <Input
              placeholder="Medicamento"
              value={novoMedicamento.medicamento}
              onChange={(e) => setNovoMedicamento(prev => ({...prev, medicamento: e.target.value}))}
            />
            <Input
              placeholder="Dose"
              value={novoMedicamento.dose}
              onChange={(e) => setNovoMedicamento(prev => ({...prev, dose: e.target.value}))}
            />
            <Input
              placeholder="Via"
              value={novoMedicamento.via}
              onChange={(e) => setNovoMedicamento(prev => ({...prev, via: e.target.value}))}
            />
          </div>
          <Button type="button" variant="outline" onClick={adicionarMedicamentoManual}>
            Adicionar
          </Button>
        </div>

        {dados.prescricao_medicamentos.length > 0 && (
          <div>
            <Label className="mb-2 block">Medicamentos Prescritos</Label>
            <div className="space-y-2">
              {dados.prescricao_medicamentos.map((med, index) => (
                <div key={index} className="flex items-center gap-2 bg-white p-3 rounded border">
                  <div className="flex-1">
                    <strong>{med.medicamento || med.nome}</strong> - ({med.via})
                  </div>
                  <Input
                    type="text"
                    value={med.dose}
                    onChange={(e) => editarDoseMedicamento(index, e.target.value)}
                    className="w-32"
                    placeholder="Dose"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removerMedicamento(index)}
                    className="text-red-600"
                  >
                    Remover
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Exames */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Requisição de Exames
        </h3>

        <div className="space-y-2 mb-4">
          {examesComuns.map((exame) => (
            <div key={exame} className="flex items-center gap-3">
              <Checkbox
                checked={dados.exames_solicitados.includes(exame)}
                onCheckedChange={() => toggleExame(exame)}
              />
              <Label className="cursor-pointer">{exame}</Label>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Adicionar exame personalizado"
            value={novoExame}
            onChange={(e) => setNovoExame(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarExameManual())}
          />
          <Button type="button" variant="outline" onClick={adicionarExameManual}>
            Adicionar
          </Button>
        </div>

        {dados.exames_solicitados.length > 0 && (
          <div>
            <Label className="mb-2 block">Exames Adicionados</Label>
            <div className="bg-white p-3 rounded border">
              <ul className="list-disc pl-5 space-y-1">
                {dados.exames_solicitados.map((exame, index) => (
                  <li key={index} className="text-sm">{exame}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Dados Clínicos */}
      <div className="space-y-4">
        <div>
          <Label>3. Antecedentes Clínicos *</Label>
          <p className="text-xs text-gray-500 mb-2">
            Histórico de doenças prévias, alergias, uso de inibidor da 5 fosfodiesterase, medicações em uso
          </p>
          <Textarea
            value={dados.antecedentes}
            onChange={(e) => setDados(prev => ({...prev, antecedentes: e.target.value}))}
            rows={4}
            required
            placeholder="Descreva os antecedentes clínicos do paciente..."
          />
        </div>

        <div>
          <Label>4. Quadro Atual *</Label>
          <p className="text-xs text-gray-500 mb-2">
            Característica da dor torácica, dispneia, sintomas associados, descartado sepse, dissecção aguda de aorta, 
            tamponamento pericárdico, choque cardiogênico, rotura de esôfago e intoxicação por drogas
          </p>
          <Textarea
            value={dados.quadro_atual}
            onChange={(e) => setDados(prev => ({...prev, quadro_atual: e.target.value}))}
            rows={6}
            required
            placeholder="Descreva o quadro clínico atual..."
          />
        </div>

        <div>
          <Label>5. Hipótese Diagnóstica *</Label>
          <Textarea
            value={dados.hipotese_diagnostica}
            onChange={(e) => setDados(prev => ({...prev, hipotese_diagnostica: e.target.value}))}
            rows={3}
            required
            placeholder="Hipótese diagnóstica..."
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onAnterior}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Etapa Anterior
        </Button>
        <Button type="submit" className="bg-red-600 hover:bg-red-700">
          Próxima Etapa
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}