import React, { useState, useEffect } from "react";
import { Clock, AlertCircle, Heart } from "lucide-react";
import { differenceInSeconds } from "date-fns";

export default function TempoPortaBalaoEtapa3({ dataHoraChegada }) {
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
  const metaMinutos = 120;
  const dentroMeta = minutos < metaMinutos;

  return (
    <div className={`border-2 rounded-lg p-2.5 ${
      dentroMeta ? 'bg-blue-50 border-blue-300' : 'bg-orange-50 border-orange-300'
    }`}>
      <div className="flex items-center gap-2">
        {dentroMeta ? (
          <Heart className="w-5 h-5 text-blue-600 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
        )}
        <div className="flex-1">
          <p className={`text-xs font-semibold ${
            dentroMeta ? 'text-blue-900' : 'text-orange-900'
          }`}>
            FMC-to-device
          </p>
          <p className={`text-2xl font-bold ${
            dentroMeta ? 'text-blue-700' : 'text-orange-700'
          }`}>
            {minutos} min {segundos}s
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
            Meta: {metaMinutos} min
          </p>
          <p className={`text-xs font-medium mt-0.5 ${
            dentroMeta ? 'text-blue-700' : 'text-orange-700'
          }`}>
            {dentroMeta ? '✓ Dentro da meta' : '⚠️ Fora da meta'}
          </p>
        </div>
      </div>
    </div>
  );
}