import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, MapPin, Truck, Eye, User, Users } from "lucide-react";
import { differenceInMinutes, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const LIMITES_MINUTOS = { 0: 60, 1: 120, 2: 180 };

const PRIORIDADE_LABELS = {
  0: { label: "Prioridade 0 · SCACESST", color: "bg-red-600" },
  1: { label: "Prioridade 1 · SCASESST c/Trop", color: "bg-orange-500" },
  2: { label: "Prioridade 2 · SCASESST s/Trop", color: "bg-yellow-500" },
};

export default function CartaoTransporte({ paciente }) {
  const navigate = useNavigate();
  const transporte = paciente.transporte || {};
  const finalizado = !!transporte.data_hora_chegada_destino;

  const minutosEmTransporte = transporte.data_hora_inicio
    ? differenceInMinutes(new Date(), new Date(transporte.data_hora_inicio))
    : null;

  const limite = LIMITES_MINUTOS[paciente.prioridade] ?? 180;
  const percentual = minutosEmTransporte != null ? Math.min((minutosEmTransporte / limite) * 100, 100) : 0;
  const atrasado = minutosEmTransporte != null && minutosEmTransporte > limite;
  const priorInfo = PRIORIDADE_LABELS[paciente.prioridade];

  const barColor = atrasado
    ? "bg-red-500"
    : percentual > 75
    ? "bg-orange-400"
    : "bg-green-500";

  return (
    <Card className={`border-2 transition-all ${
      atrasado ? "border-red-400 bg-red-50 shadow-red-100 shadow-md" :
      paciente.prioridade === 0 ? "border-orange-400 bg-orange-50" :
      finalizado ? "border-green-400 bg-green-50" : "border-yellow-300 bg-white"
    }`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 truncate">{paciente.nome_completo}</p>
            <p className="text-xs text-gray-500">{paciente.unidade_saude}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {priorInfo && <Badge className={`${priorInfo.color} text-white text-xs`}>{priorInfo.label}</Badge>}
            {atrasado && (
              <Badge className="bg-red-700 text-white text-xs animate-pulse">⚠️ ATRASADO</Badge>
            )}
            {finalizado && (
              <Badge className="bg-green-600 text-white text-xs">✅ Concluído</Badge>
            )}
          </div>
        </div>

        {/* Destino */}
        {(transporte.unidade_destino || paciente.regulacao_central?.unidade_destino) && (
          <div className="flex items-center gap-1 text-sm text-indigo-700">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="font-semibold truncate">{transporte.unidade_destino || paciente.regulacao_central?.unidade_destino}</span>
          </div>
        )}

        {/* Tipo de transporte */}
        {transporte.tipo_transporte && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Truck className="w-3 h-3 shrink-0" />
            {transporte.tipo_transporte}
            {transporte.central_transporte && ` · ${transporte.central_transporte}`}
          </div>
        )}

        {/* Tempo em transporte */}
        {!finalizado && minutosEmTransporte != null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {minutosEmTransporte < 60
                  ? `${minutosEmTransporte}min em transporte`
                  : `${Math.floor(minutosEmTransporte / 60)}h${minutosEmTransporte % 60 > 0 ? `${minutosEmTransporte % 60}min` : ""} em transporte`}
              </span>
              <span className={atrasado ? "text-red-600 font-bold" : "text-gray-500"}>
                Limite: {limite}min
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${percentual}%` }}
              />
            </div>
          </div>
        )}

        {/* Início e chegada */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          {transporte.data_hora_inicio && (
            <div>
              <p className="font-semibold text-gray-700">Início</p>
              <p>{format(new Date(transporte.data_hora_inicio), "HH:mm · dd/MM", { locale: ptBR })}</p>
            </div>
          )}
          {finalizado && transporte.data_hora_chegada_destino && (
            <div>
              <p className="font-semibold text-gray-700">Chegada</p>
              <p>{format(new Date(transporte.data_hora_chegada_destino), "HH:mm · dd/MM", { locale: ptBR })}</p>
            </div>
          )}
        </div>

        {/* Equipe */}
        {(transporte.viatura || transporte.medico || transporte.enfermeiro || transporte.condutor) && (
          <div className="text-xs bg-gray-50 border border-gray-200 rounded p-2 space-y-1">
            {transporte.viatura && (
              <div className="flex items-center gap-1 text-gray-700">
                <Truck className="w-3 h-3 shrink-0 text-gray-500" />
                <span className="font-semibold">Viatura:</span> {transporte.viatura}
              </div>
            )}
            {transporte.medico && (
              <div className="flex items-center gap-1 text-gray-700">
                <User className="w-3 h-3 shrink-0 text-blue-500" />
                <span className="font-semibold">Médico:</span> {transporte.medico}
              </div>
            )}
            {transporte.enfermeiro && (
              <div className="flex items-center gap-1 text-gray-700">
                <User className="w-3 h-3 shrink-0 text-green-500" />
                <span className="font-semibold">Enfermeiro:</span> {transporte.enfermeiro}
              </div>
            )}
            {transporte.condutor && (
              <div className="flex items-center gap-1 text-gray-700">
                <Users className="w-3 h-3 shrink-0 text-gray-500" />
                <span className="font-semibold">Condutor:</span> {transporte.condutor}
              </div>
            )}
          </div>
        )}

        {/* Intercorrência */}
        {transporte.motivo_intercorrencia && (
          <div className="text-xs bg-red-100 border border-red-300 rounded p-2 text-red-800">
            <span className="font-bold">⚠️ Intercorrência:</span> {transporte.motivo_intercorrencia}
          </div>
        )}

        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs"
          onClick={() => navigate(createPageUrl("TransporteDetalhe") + `?id=${paciente.id}`)}
        >
          <Eye className="w-3 h-3 mr-1" />
          Ver Detalhes
        </Button>
      </CardContent>
    </Card>
  );
}