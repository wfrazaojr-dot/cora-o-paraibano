import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, Clock, CheckCircle, AlertTriangle, Download, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MonitorTransporte({ paciente }) {
  const transporte = paciente?.transporte;

  // Não exibe nada se não houver solicitação de transporte
  if (!transporte?.data_hora_solicitacao) return null;

  // Transporte solicitado mas ainda NÃO iniciado
  if (!transporte.data_hora_inicio) {
    return (
      <Card className="border-2 border-blue-400 bg-blue-50">
        <CardHeader className="pb-2 bg-blue-100">
          <CardTitle className="flex items-center gap-2 text-sm text-blue-800">
            <Clock className="w-4 h-4" />
            <Truck className="w-4 h-4" />
            Transporte — Pendente
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3 space-y-2 text-xs">
          <div>
            <p className="font-semibold text-gray-600">SOLICITADO EM</p>
            <p className="font-bold">{format(new Date(transporte.data_hora_solicitacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          </div>
          {transporte.unidade_destino && (
            <div className="flex items-center gap-1 font-bold text-indigo-700">
              <MapPin className="w-3 h-3" />
              <span>Destino: {transporte.unidade_destino}</span>
            </div>
          )}
          <p className="text-blue-700 italic">Aguardando início do transporte pela equipe responsável.</p>
        </CardContent>
      </Card>
    );
  }

  // Transporte iniciado
  const status = transporte?.status_transporte || "Em Deslocamento";
  const finalizado = !!transporte?.data_hora_chegada_destino;
  const isIntercorrencia = status === "Com Intercorrência";

  const borderColor = finalizado
    ? isIntercorrencia ? "border-red-400" : "border-green-400"
    : "border-yellow-400";

  const bgColor = finalizado
    ? isIntercorrencia ? "bg-red-50" : "bg-green-50"
    : "bg-yellow-50";

  const headerBg = finalizado
    ? isIntercorrencia ? "bg-red-100" : "bg-green-100"
    : "bg-yellow-100";

  const titleColor = finalizado
    ? isIntercorrencia ? "text-red-800" : "text-green-800"
    : "text-yellow-800";

  const StatusIcon = finalizado
    ? isIntercorrencia ? AlertTriangle : CheckCircle
    : Clock;

  const fmt = (iso) => iso ? format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "—";

  return (
    <Card className={`border-2 ${borderColor} ${bgColor}`}>
      <CardHeader className={`pb-2 ${headerBg}`}>
        <CardTitle className={`flex items-center gap-2 text-sm ${titleColor}`}>
          <StatusIcon className="w-4 h-4" />
          <Truck className="w-4 h-4" />
          Transporte — {status}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3 space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          {transporte.tipo_transporte && (
            <div>
              <p className="font-semibold text-gray-600">TIPO</p>
              <p className="font-bold">{transporte.tipo_transporte}</p>
            </div>
          )}
          {transporte.central_transporte && (
            <div>
              <p className="font-semibold text-gray-600">CENTRAL</p>
              <p>{transporte.central_transporte}</p>
            </div>
          )}
          {transporte.unidade_destino && (
            <div className="col-span-2">
              <p className="font-semibold text-gray-600 flex items-center gap-1"><MapPin className="w-3 h-3" /> DESTINO</p>
              <p className="font-bold text-indigo-700">{transporte.unidade_destino}</p>
            </div>
          )}
          {transporte.data_hora_inicio && (
            <div>
              <p className="font-semibold text-gray-600">INÍCIO</p>
              <p>{fmt(transporte.data_hora_inicio)}</p>
            </div>
          )}
          {transporte.data_hora_chegada_destino && (
            <div>
              <p className="font-semibold text-gray-600">CHEGADA</p>
              <p>{fmt(transporte.data_hora_chegada_destino)}</p>
            </div>
          )}
        </div>

        {transporte.data_hora_inicio && transporte.data_hora_chegada_destino && (
          <div className="p-2 bg-white rounded border border-gray-200">
            <p className="font-semibold text-gray-600">TEMPO TOTAL</p>
            <p className="font-bold">
              {Math.round((new Date(transporte.data_hora_chegada_destino) - new Date(transporte.data_hora_inicio)) / 60000)} minutos
            </p>
          </div>
        )}

        {transporte.motivo_intercorrencia && (
          <div className="p-2 bg-red-100 rounded border border-red-300">
            <p className="font-semibold text-red-700">INTERCORRÊNCIA</p>
            <p className="text-red-800">{transporte.motivo_intercorrencia}</p>
          </div>
        )}

        {transporte.intercorrencias && (
          <div>
            <p className="font-semibold text-gray-600">OBSERVAÇÕES</p>
            <p className="text-gray-700 whitespace-pre-wrap">{transporte.intercorrencias}</p>
          </div>
        )}

        {paciente.relatorio_transporte_url && (
          <Button
            size="sm"
            onClick={() => window.open(paciente.relatorio_transporte_url, '_blank')}
            className="w-full bg-yellow-600 hover:bg-yellow-700 mt-1"
          >
            <Download className="w-3 h-3 mr-1" />
            Relatório PDF do Transporte
          </Button>
        )}
      </CardContent>
    </Card>
  );
}