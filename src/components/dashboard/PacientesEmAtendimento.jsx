import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const corClassificacao = {
  "Vermelha": "bg-red-100 text-red-800 border-red-300",
  "Laranja": "bg-orange-100 text-orange-800 border-orange-300",
  "Amarela": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Verde": "bg-green-100 text-green-800 border-green-300",
  "Azul": "bg-blue-100 text-blue-800 border-blue-300"
};

export default function PacientesEmAtendimento({ pacientes, isLoading }) {
  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Pacientes em Atendimento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="p-4 border rounded-lg">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Pacientes em Atendimento ({pacientes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {pacientes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum paciente em atendimento no momento</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pacientes.map((paciente) => {
              const tempoEspera = paciente.data_hora_inicio_triagem 
                ? differenceInMinutes(new Date(), new Date(paciente.data_hora_inicio_triagem))
                : 0;
              
              return (
                <Link 
                  key={paciente.id}
                  to={`${createPageUrl("NovaTriagem")}?id=${paciente.id}`}
                  className="block p-4 border rounded-lg hover:shadow-md transition-all bg-white"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{paciente.nome_completo}</h3>
                      <p className="text-sm text-gray-600">
                        {paciente.idade} anos • {paciente.sexo} • Pront. {paciente.prontuario}
                      </p>
                    </div>
                    {paciente.classificacao_risco?.cor && (
                      <Badge className={`${corClassificacao[paciente.classificacao_risco.cor]} border font-semibold`}>
                        {paciente.classificacao_risco.cor}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {tempoEspera} min
                    </span>
                    <Badge variant="outline">{paciente.status}</Badge>
                  </div>
                  {paciente.triagem_cardiologica?.alerta_iam && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-medium">
                      ⚠️ PROVÁVEL IAM - REALIZE ECG EM ATÉ 10 MIN
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}