import React, { useState } from "react";
import { AlertTriangle, X, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const GRAVIDADE_CORES = {
  Leve: "bg-yellow-100 border-yellow-400 text-yellow-900",
  Moderada: "bg-orange-100 border-orange-400 text-orange-900",
  Grave: "bg-red-100 border-red-500 text-red-900",
  Crítica: "bg-red-200 border-red-700 text-red-950",
};

const GRAVIDADE_BADGE = {
  Leve: "bg-yellow-500",
  Moderada: "bg-orange-500",
  Grave: "bg-red-600",
  Crítica: "bg-red-800",
};

export default function AlertaIntercorrencias({ registros }) {
  const [expandido, setExpandido] = useState(true);

  const comIntercorrencia = registros.filter((r) => r.tem_intercorrencia);

  if (comIntercorrencia.length === 0) return null;

  const criticas = comIntercorrencia.filter((r) => r.intercorrencia_gravidade === "Crítica").length;
  const graves = comIntercorrencia.filter((r) => r.intercorrencia_gravidade === "Grave").length;

  return (
    <div className={`mb-6 border-2 rounded-xl shadow-lg ${criticas > 0 ? "border-red-700 bg-red-50" : graves > 0 ? "border-red-500 bg-red-50" : "border-orange-400 bg-orange-50"}`}>
      {/* Cabeçalho do alerta */}
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setExpandido(!expandido)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${criticas > 0 ? "bg-red-700" : graves > 0 ? "bg-red-600" : "bg-orange-500"} animate-pulse`}>
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className={`font-bold text-lg ${criticas > 0 ? "text-red-900" : graves > 0 ? "text-red-800" : "text-orange-900"}`}>
              ⚠️ Alerta de Intercorrências Trombólise
            </p>
            <p className="text-sm text-gray-600">
              {comIntercorrencia.length} {comIntercorrencia.length === 1 ? "registro com intercorrência" : "registros com intercorrências"} registrada{comIntercorrencia.length > 1 ? "s" : ""}
              {criticas > 0 && <span className="ml-2 font-bold text-red-700">• {criticas} CRÍTICA{criticas > 1 ? "S" : ""}</span>}
              {graves > 0 && <span className="ml-2 font-bold text-red-600">• {graves} GRAVE{graves > 1 ? "S" : ""}</span>}
            </p>
          </div>
        </div>
        {expandido ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
      </button>

      {/* Lista de intercorrências */}
      {expandido && (
        <div className="px-4 pb-4 space-y-3">
          {comIntercorrencia
            .sort((a, b) => {
              const ordem = { Crítica: 0, Grave: 1, Moderada: 2, Leve: 3 };
              return (ordem[a.intercorrencia_gravidade] ?? 4) - (ordem[b.intercorrencia_gravidade] ?? 4);
            })
            .map((r) => (
              <div
                key={r.id}
                className={`border-l-4 rounded-lg p-4 ${GRAVIDADE_CORES[r.intercorrencia_gravidade] || "bg-gray-100 border-gray-400 text-gray-900"}`}
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge className={GRAVIDADE_BADGE[r.intercorrencia_gravidade] || "bg-gray-500"}>
                    {r.intercorrencia_gravidade || "Sem gravidade"}
                  </Badge>
                  <Badge className={
                    r.indicacao === "IAM" ? "bg-red-600" :
                    r.indicacao === "TEP" ? "bg-orange-600" : "bg-purple-600"
                  }>
                    {r.indicacao}
                  </Badge>
                  <span className="font-semibold">{r.paciente_nome}</span>
                  {r.intercorrencia_data_hora && (
                    <span className="text-xs flex items-center gap-1 text-gray-600">
                      <Clock className="w-3 h-3" />
                      {format(new Date(r.intercorrencia_data_hora), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold">
                  Tipo: <span className="font-normal">{r.tipo_intercorrencia || "Não especificado"}</span>
                </p>

                {r.descricao_intercorrencia && (
                  <p className="text-sm mt-1">
                    <span className="font-semibold">Descrição:</span> {r.descricao_intercorrencia}
                  </p>
                )}

                {r.conduta_intercorrencia && (
                  <p className="text-sm mt-1">
                    <span className="font-semibold">Conduta:</span> {r.conduta_intercorrencia}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-600">
                  {r.unidade_saude && <span>🏥 {r.unidade_saude}</span>}
                  {r.medicamento && <span>💊 {r.medicamento.split("(")[0].trim()}</span>}
                  {r.medico_prescritor_nome && <span>👨‍⚕️ Dr. {r.medico_prescritor_nome}</span>}
                  {r.numero_lote && <span>📦 Lote: {r.numero_lote}</span>}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}