import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DadosPaciente({ paciente }) {
  const getPrioridadeColor = (tipo) => {
    if (tipo === "SCACESST") return "bg-red-600";
    if (tipo === "SCASESST_COM_TROPONINA") return "bg-orange-500";
    if (tipo === "SCASESST_SEM_TROPONINA") return "bg-yellow-500";
    return "bg-gray-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Dados do Paciente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Nome Completo</p>
            <p className="font-semibold text-lg">{paciente.nome_completo}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Idade / Sexo</p>
            <p className="font-medium">{paciente.idade} anos • {paciente.sexo}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Unidade de Origem
            </p>
            <p className="font-medium">{paciente.unidade_saude}</p>
            {paciente.macrorregiao && (
              <p className="text-xs text-teal-700 font-semibold mt-0.5">{paciente.macrorregiao}</p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500">Status Atual</p>
            <Badge className="mt-1">{paciente.status}</Badge>
          </div>

          {paciente.data_hora_inicio_sintomas && (
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Início dos Sintomas
              </p>
              <p className="font-medium">
                {format(new Date(paciente.data_hora_inicio_sintomas), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </p>
            </div>
          )}

          {paciente.triagem_medica?.tipo_sca && (
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Classificação
              </p>
              <Badge className={`mt-1 ${getPrioridadeColor(paciente.triagem_medica.tipo_sca)}`}>
                {paciente.triagem_medica.tipo_sca === "SCACESST" && "SCACESST"}
                {paciente.triagem_medica.tipo_sca === "SCASESST_COM_TROPONINA" && "SCASESST c/ Troponina"}
                {paciente.triagem_medica.tipo_sca === "SCASESST_SEM_TROPONINA" && "SCASESST s/ Troponina"}
              </Badge>
            </div>
          )}
        </div>

        {/* Sinais Vitais */}
        {paciente.triagem_medica && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold mb-3">Sinais Vitais</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {(() => {
                const pa = paciente.triagem_medica.pa_braco_esquerdo || "";
                const separador = pa.includes('/') ? '/' : pa.includes('x') ? 'x' : null;
                const pas = separador ? pa.split(separador)[0]?.trim() : pa.trim();
                const pad = separador ? pa.split(separador)[1]?.trim() : null;
                return (
                  <>
                    {pas && (
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">PAS (mm Hg)</p>
                        <p className="font-medium">{pas}</p>
                      </div>
                    )}
                    {pad && (
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">PAD (mm Hg)</p>
                        <p className="font-medium">{pad}</p>
                      </div>
                    )}
                    {!pad && pas && (
                      <div className="bg-gray-50 p-2 rounded border border-yellow-200">
                        <p className="text-xs text-gray-500">PAD (mm Hg)</p>
                        <p className="text-xs text-gray-400 italic">Não informado</p>
                      </div>
                    )}
                  </>
                );
              })()}
              {paciente.triagem_medica.frequencia_cardiaca && (
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-500">FC</p>
                  <p className="font-medium">{paciente.triagem_medica.frequencia_cardiaca} bpm</p>
                </div>
              )}
              {paciente.triagem_medica.spo2 && (
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-500">SpO2</p>
                  <p className="font-medium">{paciente.triagem_medica.spo2}%</p>
                </div>
              )}
              {paciente.triagem_medica.glicemia_capilar && (
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-500">Glicemia</p>
                  <p className="font-medium">{paciente.triagem_medica.glicemia_capilar} mg/dL</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}