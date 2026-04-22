import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UNIDADES_POR_MACRO_CIDADE } from "@/components/data/unidadesSaude";

const MACRORREGIOES = ["Macro 1", "Macro 2", "Macro 3"];

/**
 * Componente reutilizável para seleção de Unidade de Saúde via Macrorregião → Cidade → Unidade.
 * Props:
 *   macrorregiao, cidade, unidade — valores controlados
 *   onMacroChange, onCidadeChange, onUnidadeChange — callbacks de mudança
 */
export default function SeletorUnidadeSaude({ macrorregiao, cidade, unidade, onMacroChange, onCidadeChange, onUnidadeChange }) {
  const cidades = macrorregiao && UNIDADES_POR_MACRO_CIDADE[macrorregiao]
    ? Object.keys(UNIDADES_POR_MACRO_CIDADE[macrorregiao]).sort()
    : [];

  const unidades = macrorregiao && cidade && UNIDADES_POR_MACRO_CIDADE[macrorregiao]?.[cidade]
    ? UNIDADES_POR_MACRO_CIDADE[macrorregiao][cidade]
    : [];

  const handleMacroChange = (val) => {
    onMacroChange(val);
    onCidadeChange("");
    onUnidadeChange("");
  };

  const handleCidadeChange = (val) => {
    onCidadeChange(val);
    onUnidadeChange("");
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Macrorregião *</Label>
        <Select value={macrorregiao} onValueChange={handleMacroChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a macrorregião" />
          </SelectTrigger>
          <SelectContent>
            {MACRORREGIOES.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Cidade *</Label>
        <Select value={cidade} onValueChange={handleCidadeChange} disabled={!macrorregiao}>
          <SelectTrigger>
            <SelectValue placeholder={macrorregiao ? "Selecione a cidade" : "Selecione a macrorregião primeiro"} />
          </SelectTrigger>
          <SelectContent>
            {cidades.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Unidade de Saúde *</Label>
        <Select value={unidade} onValueChange={onUnidadeChange} disabled={!cidade}>
          <SelectTrigger>
            <SelectValue placeholder={cidade ? "Selecione a unidade" : "Selecione a cidade primeiro"} />
          </SelectTrigger>
          <SelectContent>
            {unidades.map((u) => (
              <SelectItem key={u} value={u}>{u}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}