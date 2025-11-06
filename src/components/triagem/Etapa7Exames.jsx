import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";

const examesComuns = [
  "Troponina Ultrassensível (0h)",
  "Troponina Ultrassensível (1h)",
  "Troponina Ultrassensível (2h)",
  "Troponina Convencional (0h)",
  "Troponina Convencional (3h)",
  "Troponina Convencional (6h)",
  "Hemograma completo",
  "Creatinina e ureia",
  "Eletrólitos (Na, K, Mg)",
  "Glicemia",
  "CPK-MB",
  "Coagulograma (TAP/PTT)",
  "D-dímero",
  "PCR ultrassensível",
  "Gasometria arterial",
  "Radiografia de tórax",
  "Ecocardiograma",
];

export default function Etapa7Exames({ dadosPaciente, onProxima, onAnterior }) {
  const [examesSelecionados, setExamesSelecionados] = useState(
    dadosPaciente.exames_solicitados || []
  );
  const [examePersonalizado, setExamePersonalizado] = useState("");

  const toggleExame = (exame) => {
    if (examesSelecionados.includes(exame)) {
      setExamesSelecionados(examesSelecionados.filter(e => e !== exame));
    } else {
      setExamesSelecionados([...examesSelecionados, exame]);
    }
  };

  const adicionarExamePersonalizado = () => {
    if (examePersonalizado.trim()) {
      setExamesSelecionados([...examesSelecionados, examePersonalizado.trim()]);
      setExamePersonalizado("");
    }
  };

  const removerExame = (exame) => {
    setExamesSelecionados(examesSelecionados.filter(e => e !== exame));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onProxima({ exames_solicitados: examesSelecionados });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitação de Exames</h2>
        <p className="text-gray-600">Protocolo de exames laboratoriais para SCA</p>
      </div>

      <div className="border rounded-lg p-6 bg-gray-50">
        <h3 className="font-semibold mb-4">Exames Disponíveis:</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {examesComuns.map((exame, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Checkbox
                id={`exame-${i}`}
                checked={examesSelecionados.includes(exame)}
                onCheckedChange={() => toggleExame(exame)}
              />
              <Label htmlFor={`exame-${i}`} className="cursor-pointer text-sm">
                {exame}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Adicionar Exame Personalizado:</h3>
        <div className="flex gap-2">
          <Input
            value={examePersonalizado}
            onChange={(e) => setExamePersonalizado(e.target.value)}
            placeholder="Nome do exame..."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarExamePersonalizado())}
          />
          <Button type="button" onClick={adicionarExamePersonalizado} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>

      {examesSelecionados.length > 0 && (
        <div className="border rounded-lg p-4 bg-white">
          <h3 className="font-semibold mb-3">Exames Selecionados ({examesSelecionados.length}):</h3>
          <div className="space-y-2">
            {examesSelecionados.map((exame, i) => (
              <div key={i} className="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-200">
                <span className="text-sm">{exame}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removerExame(exame)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

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