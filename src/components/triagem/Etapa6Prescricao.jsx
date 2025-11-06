import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const medicamentosComuns = [
  { medicamento: "AAS", dose: "200-300 mg", via: "VO (mastigado)" },
  { medicamento: "Clopidogrel", dose: "300-600 mg", via: "VO" },
  { medicamento: "Ticagrelor", dose: "180 mg", via: "VO" },
  { medicamento: "Enoxaparina", dose: "1 mg/kg", via: "SC" },
  { medicamento: "Atorvastatina", dose: "40-80 mg", via: "VO" },
  { medicamento: "Rosuvastatina", dose: "20-40 mg", via: "VO" },
  { medicamento: "Metoprolol", dose: "25-50 mg", via: "VO" },
  { medicamento: "Captopril", dose: "25-50 mg", via: "VO" },
  { medicamento: "Enalapril", dose: "2,5-5 mg", via: "VO" },
  { medicamento: "Morfina", dose: "2-4 mg", via: "EV" },
  { medicamento: "Fentanil", dose: "25-50 mcg", via: "EV" },
  { medicamento: "Nitroglicerina", dose: "50 mg/250 ml (diluir)", via: "EV" },
  { medicamento: "Nitrato (Dinitrato de Isossorbida)", dose: "5 mg", via: "SL" },
  { medicamento: "Nitrato (Mononitrato de Isossorbida)", dose: "5 mg", via: "SL" },
];

export default function Etapa6Prescricao({ dadosPaciente, onProxima, onAnterior }) {
  const [medicamentos, setMedicamentos] = useState(
    dadosPaciente.prescricao_medicamentos || []
  );

  const adicionarMedicamento = () => {
    setMedicamentos([
      ...medicamentos,
      { medicamento: "", dose: "", via: "", administrado: false }
    ]);
  };

  const removerMedicamento = (index) => {
    setMedicamentos(medicamentos.filter((_, i) => i !== index));
  };

  const atualizarMedicamento = (index, campo, valor) => {
    const novosMedicamentos = [...medicamentos];
    novosMedicamentos[index] = {
      ...novosMedicamentos[index],
      [campo]: valor
    };
    setMedicamentos(novosMedicamentos);
  };

  const adicionarMedicamentoComum = (med) => {
    setMedicamentos([
      ...medicamentos,
      { ...med, administrado: false }
    ]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onProxima({ prescricao_medicamentos: medicamentos });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Prescrição Medicamentosa</h2>
        <p className="text-gray-600">Registro de medicamentos administrados na SCA</p>
      </div>

      <Alert className="border-blue-500 bg-blue-50">
        <AlertDescription className="text-blue-800">
          <strong>Protocolo SCA (adultos/idosos):</strong> DAPT (AAS + P2Y12), Betabloqueadores, IECA/BRA, Estatinas de alta potência
        </AlertDescription>
      </Alert>

      <Alert className="border-red-500 bg-red-50">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>⚠️ ALERTA - NITRATOS:</strong> Evite nos casos de:
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>PAS {'<'} 90 mmHg</li>
            <li>Suspeita de IAM de Ventrículo Direito (VD)</li>
            <li>Uso de Inibidor da Fosfodiesterase nas últimas 24-48h (Sildenafil, Tadalafil, Vardenafil)</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="font-semibold mb-3">Medicamentos Comuns (clique para adicionar):</h3>
        <div className="flex flex-wrap gap-2">
          {medicamentosComuns.map((med, i) => (
            <Button
              key={i}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => adicionarMedicamentoComum(med)}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              {med.medicamento}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Medicamentos Prescritos:</h3>
          <Button type="button" onClick={adicionarMedicamento} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Medicamento
          </Button>
        </div>

        {medicamentos.length === 0 ? (
          <p className="text-center text-gray-500 py-4">Nenhum medicamento prescrito ainda</p>
        ) : (
          <div className="space-y-4">
            {medicamentos.map((med, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Medicamento</Label>
                    <Input
                      value={med.medicamento}
                      onChange={(e) => atualizarMedicamento(index, "medicamento", e.target.value)}
                      placeholder="Nome do medicamento"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dose</Label>
                    <Input
                      value={med.dose}
                      onChange={(e) => atualizarMedicamento(index, "dose", e.target.value)}
                      placeholder="Ex: 200 mg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Via</Label>
                    <Input
                      value={med.via}
                      onChange={(e) => atualizarMedicamento(index, "via", e.target.value)}
                      placeholder="Ex: VO, EV, SC, SL"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`admin-${index}`}
                        checked={med.administrado}
                        onCheckedChange={(checked) => atualizarMedicamento(index, "administrado", checked)}
                      />
                      <Label htmlFor={`admin-${index}`} className="text-sm">
                        Administrado
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removerMedicamento(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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