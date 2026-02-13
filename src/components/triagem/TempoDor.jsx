import React from "react";
import { AlertCircle, Clock, Zap, Heart } from "lucide-react";
import { differenceInMinutes, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TempoDor({ dataHoraInicioSintomas, className = "" }) {
  if (!dataHoraInicioSintomas) return null;

  const dataInicio = new Date(dataHoraInicioSintomas);
  
  // Verifica se a data é válida
  if (isNaN(dataInicio.getTime())) return null;

  const tempoDorMinutos = differenceInMinutes(new Date(), dataInicio);
  const horas = Math.floor(tempoDorMinutos / 60);
  const minutos = tempoDorMinutos % 60;
  
  // Metas terapêuticas (em minutos)
  const metaPortaAgulha = 30; // Trombolítico
  const metaPortaBalaο = 120; // Angioplastia primária
  const janelaMaximaIAM = 720; // 12 horas
  
  // Cálculo de tempo restante
  const tempoRestanteAgulha = metaPortaAgulha - tempoDorMinutos;
  const tempoRestanteBalaο = metaPortaBalaο - tempoDorMinutos;
  const tempoRestanteJanela = janelaMaximaIAM - tempoDorMinutos;
  
  const foraJanela = tempoDorMinutos > janelaMaximaIAM;
  const dentroMetaAgulha = tempoRestanteAgulha > 0;
  const dentroMetaBalaο = tempoRestanteBalaο > 0;

  const formatarTempo = (minutos) => {
    if (minutos <= 0) return "Expirado";
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  };

  return (
    <div className="space-y-3">
      {/* Principal - Tempo de Dor */}
      <div className={`border-2 rounded-lg p-2.5 ${
        foraJanela ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300'
      } ${className}`}>
        <div className="flex items-center gap-2">
          <Clock className={`w-5 h-5 flex-shrink-0 ${
            foraJanela ? 'text-red-600' : 'text-yellow-600'
          }`} />
          <div className="flex-1">
            <p className={`text-xs font-semibold ${
              foraJanela ? 'text-red-900' : 'text-yellow-900'
            }`}>
              TEMPO DE DOR
            </p>
            <p className={`text-2xl font-bold ${
              foraJanela ? 'text-red-700' : 'text-yellow-700'
            }`}>
              {horas}h {minutos}min
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              Início: {format(dataInicio, "dd/MM 'às' HH:mm", { locale: ptBR })}
            </p>
            {foraJanela && (
              <div className="mt-1 flex items-center gap-1 text-red-700">
                <AlertCircle className="w-3 h-3" />
                <p className="text-xs font-bold">
                  ⚠️ FORA DA JANELA (&gt;12h)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Janela Máxima IAM */}
      <div className={`border-2 rounded-lg p-2 ${
        !foraJanela ? 'bg-purple-50 border-purple-300' : 'bg-red-50 border-red-300'
      }`}>
        <div className="flex items-start gap-2">
          <Clock className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
            !foraJanela ? 'text-purple-600' : 'text-red-600'
          }`} />
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold ${
              !foraJanela ? 'text-purple-900' : 'text-red-900'
            }`}>
              Janela Máxima IAM
            </p>
            <p className={`text-lg font-bold ${
              !foraJanela ? 'text-purple-700' : 'text-red-700'
            }`}>
              {formatarTempo(tempoRestanteJanela)}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">Meta: 12h</p>
            <p className={`text-xs font-medium mt-0.5 ${
              !foraJanela ? 'text-purple-700' : 'text-red-700'
            }`}>
              {!foraJanela ? '✓ Dentro' : '✗ Fora'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}