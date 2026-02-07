import React from "react";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TempoECG({ dataHoraChegada, dataHoraEcg }) {
  if (!dataHoraChegada || !dataHoraEcg) return null;

  const chegada = new Date(dataHoraChegada);
  const ecg = new Date(dataHoraEcg);
  
  const minutos = differenceInMinutes(ecg, chegada);
  const dentroMeta = minutos <= 10;

  return (
    <div className={`border-2 rounded-lg p-4 flex items-center gap-3 ${
      dentroMeta ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
    }`}>
      {dentroMeta ? (
        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
      )}
      <div className="flex-1">
        <p className={`text-sm font-semibold ${
          dentroMeta ? 'text-green-900' : 'text-red-900'
        }`}>
          Tempo de Realização do ECG
        </p>
        <p className={`text-2xl font-bold ${
          dentroMeta ? 'text-green-700' : 'text-red-700'
        }`}>
          {minutos} minutos
        </p>
        <p className={`text-xs font-medium mt-1 ${
          dentroMeta ? 'text-green-700' : 'text-red-700'
        }`}>
          {dentroMeta ? '✓ Dentro da meta (≤10 minutos)' : '⚠️ Fora da meta (>10 minutos)'}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Chegada: {format(chegada, "HH:mm", { locale: ptBR })} | ECG: {format(ecg, "HH:mm", { locale: ptBR })}
        </p>
      </div>
    </div>
  );
}