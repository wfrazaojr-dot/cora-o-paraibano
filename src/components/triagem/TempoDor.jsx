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
      <div className={`border-2 rounded-lg p-4 ${
        foraJanela ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300'
      } ${className}`}>
        <div className="flex items-center gap-3">
          <Clock className={`w-6 h-6 flex-shrink-0 ${
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
              Início: {format(dataInicio, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
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

      {/* Metas Terapêuticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Porta Agulha */}
        <div className={`border-2 rounded-lg p-3 ${
          dentroMetaAgulha ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-start gap-2">
            <Zap className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              dentroMetaAgulha ? 'text-green-600' : 'text-red-600'
            }`} />
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold ${
                dentroMetaAgulha ? 'text-green-900' : 'text-red-900'
              }`}>
                Porta-Agulha
              </p>
              <p className={`text-lg font-bold ${
                dentroMetaAgulha ? 'text-green-700' : 'text-red-700'
              }`}>
                {formatarTempo(tempoRestanteAgulha)}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">Meta: 30 min</p>
              <p className={`text-xs font-medium mt-1 ${
                dentroMetaAgulha ? 'text-green-700' : 'text-red-700'
              }`}>
                {dentroMetaAgulha ? '✓ Dentro da meta' : '✗ Fora da meta'}
              </p>
            </div>
          </div>
        </div>

        {/* Porta Balão */}
        <div className={`border-2 rounded-lg p-3 ${
          dentroMetaBalaο ? 'bg-blue-50 border-blue-300' : 'bg-orange-50 border-orange-300'
        }`}>
          <div className="flex items-start gap-2">
            <Heart className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              dentroMetaBalaο ? 'text-blue-600' : 'text-orange-600'
            }`} />
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold ${
                dentroMetaBalaο ? 'text-blue-900' : 'text-orange-900'
              }`}>
                Porta-Balão
              </p>
              <p className={`text-lg font-bold ${
                dentroMetaBalaο ? 'text-blue-700' : 'text-orange-700'
              }`}>
                {formatarTempo(tempoRestanteBalaο)}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">Meta: 120 min</p>
              <p className={`text-xs font-medium mt-1 ${
                dentroMetaBalaο ? 'text-blue-700' : 'text-orange-700'
              }`}>
                {dentroMetaBalaο ? '✓ Dentro da meta' : '✗ Fora da meta'}
              </p>
            </div>
          </div>
        </div>

        {/* Janela Máxima */}
        <div className={`border-2 rounded-lg p-3 ${
          !foraJanela ? 'bg-purple-50 border-purple-300' : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-start gap-2">
            <Clock className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
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
              <p className="text-xs text-gray-600 mt-0.5">Meta: 12 horas</p>
              <p className={`text-xs font-medium mt-1 ${
                !foraJanela ? 'text-purple-700' : 'text-red-700'
              }`}>
                {!foraJanela ? '✓ Dentro da janela' : '✗ Fora da janela'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}