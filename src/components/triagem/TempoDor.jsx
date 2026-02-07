import React from "react";
import { AlertCircle, Clock } from "lucide-react";
import { differenceInMinutes, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TempoDor({ dataHoraInicioSintomas, className = "" }) {
  if (!dataHoraInicioSintomas) return null;

  const tempoDorMinutos = differenceInMinutes(new Date(), new Date(dataHoraInicioSintomas));
  const horas = Math.floor(tempoDorMinutos / 60);
  const minutos = tempoDorMinutos % 60;
  const foraJanela = tempoDorMinutos > 720; // mais de 12 horas

  return (
    <div className={`border-2 rounded-lg p-4 ${
      foraJanela ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300'
    } ${className}`}>
      <div className="flex items-center gap-3">
        <Clock className={`w-6 h-6 ${
          foraJanela ? 'text-red-600' : 'text-yellow-600'
        }`} />
        <div className="flex-1">
          <p className={`text-sm font-semibold ${
            foraJanela ? 'text-red-900' : 'text-yellow-900'
          }`}>
            TEMPO DE DOR (INDICADOR PRINCIPAL)
          </p>
          <p className={`text-3xl font-bold ${
            foraJanela ? 'text-red-700' : 'text-yellow-700'
          }`}>
            {horas}h {minutos}min
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Início: {format(new Date(dataHoraInicioSintomas), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
          {foraJanela && (
            <div className="mt-2 flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <p className="text-xs font-bold">
                ⚠️ FORA DA JANELA TERAPÊUTICA (mais de 12 horas)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}