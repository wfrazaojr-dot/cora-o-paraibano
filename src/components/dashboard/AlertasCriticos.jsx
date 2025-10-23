import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { differenceInMinutes } from "date-fns";

export default function AlertasCriticos({ pacientes }) {
  return (
    <Card className="shadow-md border-l-4 border-l-red-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          Alertas Críticos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pacientes.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Nenhum alerta no momento
          </p>
        ) : (
          <div className="space-y-3">
            {pacientes.map((p) => {
              const minutos = differenceInMinutes(new Date(), new Date(p.data_hora_inicio_triagem));
              return (
                <div key={p.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-semibold text-sm text-red-900">{p.nome_completo}</p>
                  <p className="text-xs text-red-700 mt-1">
                    {p.classificacao_risco?.cor} • {minutos} min aguardando
                  </p>
                  <p className="text-xs text-red-600 mt-1 font-medium">
                    ⚠️ Tempo excedido para classificação
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}