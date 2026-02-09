import React, { useState, useEffect } from "react";
import { Clock, AlertCircle } from "lucide-react";
import { differenceInMinutes, differenceInSeconds } from "date-fns";

export default function TempoPortaAgulha({ dataHoraInicio }) {
  const [tempoDecorrido, setTempoDecorrido] = useState(0);

  useEffect(() => {
    if (!dataHoraInicio) return;

    const calcularTempo = () => {
      const inicio = new Date(dataHoraInicio);
      const agora = new Date();
      const segundos = differenceInSeconds(agora, inicio);
      setTempoDecorrido(segundos);
    };

    calcularTempo();
    const intervalo = setInterval(calcularTempo, 1000);

    return () => clearInterval(intervalo);
  }, [dataHoraInicio]);

  if (!dataHoraInicio) return null;

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
          <Clock className="w-6 h-6 text-green-600" />
        ) : (
          <AlertCircle className="w-6 h-6 text-red-600" />
        )}
        <div className="flex-1">
          <p className={`text-sm font-semibold ${
            dentroMeta ? 'text-green-900' : 'text-red-900'
          }`}>
            ⏱️ Tempo Porta-Agulha (Meta: 30 minutos)
          </p>
          <p className={`text-3xl font-bold ${
            dentroMeta ? 'text-green-700' : 'text-red-700'
          }`}>
            {String(minutos).padStart(2, '0')}:{String(segundos).padStart(2, '0')}
          </p>
          <p className={`text-xs font-medium mt-1 ${
            dentroMeta ? 'text-green-700' : 'text-red-700'
          }`}>
            {dentroMeta 
              ? `✓ Dentro da meta (${metaMinutos - minutos} min restantes)` 
              : `⚠️ Meta excedida há ${minutos - metaMinutos} minutos`
            }
          </p>
        </div>
      </div>
    </div>
  );
}