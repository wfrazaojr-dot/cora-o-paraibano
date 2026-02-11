import React, { useState, useEffect } from "react";
import { Clock, AlertCircle, Zap } from "lucide-react";
import { differenceInSeconds } from "date-fns";

export default function TempoPortaAgulhaEtapa3({ dataHoraChegada }) {
  const [tempoDecorrido, setTempoDecorrido] = useState(0);

  useEffect(() => {
    if (!dataHoraChegada) return;

    const calcularTempo = () => {
      const inicio = new Date(dataHoraChegada);
      const segundos = differenceInSeconds(new Date(), inicio);
      setTempoDecorrido(segundos);
    };

    calcularTempo();
    const interval = setInterval(calcularTempo, 1000);

    return () => clearInterval(interval);
  }, [dataHoraChegada]);

  if (!dataHoraChegada) return null;

  const minutos = Math.floor(tempoDecorrido / 60);
  const segundos = tempoDecorrido % 60;
  const metaMinutos = 30;
  const dentroMeta = minutos < metaMinutos;

  return (
    <div className={`border-2 rounded-lg p-4 ${
      dentroMeta ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
    }`}>
      <div className="flex items-center gap-3">
        {dentroMeta ? (
          <Zap className="w-6 h-6 text-green-600 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
        )}
        <div className="flex-1">
          <p className={`text-sm font-semibold ${
            dentroMeta ? 'text-green-900' : 'text-red-900'
          }`}>
            Tempo Porta-Agulha
          </p>
          <p className={`text-3xl font-bold ${
            dentroMeta ? 'text-green-700' : 'text-red-700'
          }`}>
            {minutos} min {segundos}s
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Meta: {metaMinutos} minutos (Trombolítico)
          </p>
          <p className={`text-xs font-medium mt-1 ${
            dentroMeta ? 'text-green-700' : 'text-red-700'
          }`}>
            {dentroMeta ? '✓ Dentro da meta' : '⚠️ Fora da meta'}
          </p>
        </div>
      </div>
    </div>
  );
}