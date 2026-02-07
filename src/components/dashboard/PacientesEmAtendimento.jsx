import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, RefreshCw, Activity, AlertTriangle, TrendingUp } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import MonitorSinaisVitais from "./MonitorSinaisVitais";

const corClassificacao = {
  "Vermelha": "bg-red-100 text-red-800 border-red-300",
  "Laranja": "bg-orange-100 text-orange-800 border-orange-300",
  "Amarela": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Verde": "bg-green-100 text-green-800 border-green-300",
  "Azul": "bg-blue-100 text-blue-800 border-blue-300"
};

const getVitalStatus = (vital, tipo, paciente) => {
  if (!vital || vital === "") return null;
  
  const val = parseFloat(vital);
  if (isNaN(val)) return null;

  const ranges = {
    fc: { min: 60, max: 100, critico_min: 40, critico_max: 140 },
    fr: { min: 12, max: 20, critico_min: 8, critico_max: 30 },
    temperatura: { min: 36, max: 37.5, critico_min: 35, critico_max: 41 },
    spo2: { min: 95, max: 100, critico_min: 90, critico_max: 100 },
    glicemia: { min: 70, max: 180, critico_min: 54, critico_max: 400 }
  };

  // Ajustar para DPOC
  if (tipo === "spo2" && paciente.dados_vitais?.dpoc) {
    ranges.spo2 = { min: 88, max: 92, critico_min: 85, critico_max: 100 };
  }

  // Ajustar para Diabetes
  if (tipo === "glicemia" && paciente.dados_vitais?.diabetes) {
    ranges.glicemia = { min: 80, max: 180, critico_min: 54, critico_max: 400 };
  }

  const range = ranges[tipo];
  if (!range) return null;

  if (val < range.critico_min || val > range.critico_max) {
    return "critico";
  } else if (val < range.min || val > range.max) {
    return "alerta";
  } else {
    return "normal";
  }
};

const VitalBadge = ({ label, valor, status }) => {
  if (!valor) return null;

  const cores = {
    critico: "bg-red-100 text-red-800 border-red-400",
    alerta: "bg-orange-100 text-orange-800 border-orange-400",
    normal: "bg-green-100 text-green-800 border-green-400"
  };

  const icones = {
    critico: AlertTriangle,
    alerta: Activity,
    normal: TrendingUp
  };

  const Icon = icones[status] || Activity;

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium ${cores[status] || "bg-gray-100 text-gray-800"}`}>
      <Icon className="w-3 h-3" />
      <span>{label}: {valor}</span>
    </div>
  );
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
              
              const vitais = paciente.dados_vitais_medico || paciente.dados_vitais || {};
              const ultimaAtualizacao = vitais.ultima_atualizacao;
              const temVitaisCriticos = 
                getVitalStatus(vitais.frequencia_cardiaca, "fc", paciente) === "critico" ||
                getVitalStatus(vitais.frequencia_respiratoria, "fr", paciente) === "critico" ||
                getVitalStatus(vitais.temperatura, "temperatura", paciente) === "critico" ||
                getVitalStatus(vitais.spo2, "spo2", paciente) === "critico" ||
                getVitalStatus(vitais.glicemia_capilar, "glicemia", paciente) === "critico";
              
              return (
                <div 
                  key={paciente.id}
                  className={`p-4 border-2 rounded-lg hover:shadow-md transition-all ${
                    temVitaisCriticos ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{paciente.nome_completo}</h3>
                      <p className="text-sm text-gray-600">
                        {paciente.idade} anos • {paciente.sexo} • Pront. {paciente.prontuario}
                      </p>
                    </div>
                    {paciente.classificacao_risco?.cor && (
                      <Badge className={`${corClassificacao[paciente.classificacao_risco.cor] || 'bg-gray-100 text-gray-800 border-gray-300'} border font-semibold`}>
                        {paciente.classificacao_risco.cor}
                      </Badge>
                    )}
                  </div>

                  {/* Sinais Vitais em Tempo Real */}
                  {vitais && Object.keys(vitais).length > 1 && (
                    <div className="mb-3 p-3 bg-gray-50 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                          <Activity className="w-4 h-4" />
                          Sinais Vitais
                          {temVitaisCriticos && (
                            <Badge className="ml-2 bg-red-600 text-white text-xs animate-pulse">
                              VALORES CRÍTICOS
                            </Badge>
                          )}
                        </p>
                        {ultimaAtualizacao && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Atualizado {format(new Date(ultimaAtualizacao), "HH:mm")}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <VitalBadge 
                          label="FC" 
                          valor={vitais.frequencia_cardiaca ? `${vitais.frequencia_cardiaca} bpm` : null} 
                          status={getVitalStatus(vitais.frequencia_cardiaca, "fc", paciente)}
                        />
                        <VitalBadge 
                          label="FR" 
                          valor={vitais.frequencia_respiratoria ? `${vitais.frequencia_respiratoria} irpm` : null} 
                          status={getVitalStatus(vitais.frequencia_respiratoria, "fr", paciente)}
                        />
                        <VitalBadge 
                          label="SpO2" 
                          valor={vitais.spo2 ? `${vitais.spo2}%` : null} 
                          status={getVitalStatus(vitais.spo2, "spo2", paciente)}
                        />
                        <VitalBadge 
                          label="Temp" 
                          valor={vitais.temperatura ? `${vitais.temperatura}°C` : null} 
                          status={getVitalStatus(vitais.temperatura, "temperatura", paciente)}
                        />
                        <VitalBadge 
                          label="Glicemia" 
                          valor={vitais.glicemia_capilar ? `${vitais.glicemia_capilar} mg/dL` : null} 
                          status={getVitalStatus(vitais.glicemia_capilar, "glicemia", paciente)}
                        />
                        {vitais.pa_braco_esquerdo && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium bg-blue-100 text-blue-800 border-blue-400">
                            <span>PA: {vitais.pa_braco_esquerdo}</span>
                          </div>
                        )}
                      </div>
                      {(vitais.uso_dva || vitais.uso_sedacao) && (
                        <div className="mt-2 flex gap-2">
                          {vitais.uso_dva && (
                            <Badge className="bg-orange-600 text-white text-xs">
                              DVA: {vitais.dva_tipo || "Em uso"}
                            </Badge>
                          )}
                          {vitais.uso_sedacao && (
                            <Badge className="bg-purple-600 text-white text-xs">
                              Sedação: {vitais.sedacao_tipo || "Em uso"}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {tempoEspera} min
                    </span>
                    <Badge variant="outline">{paciente.status}</Badge>
                  </div>

                  {paciente.triagem_cardiologica?.alerta_iam && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-medium">
                      ⚠️ PROVÁVEL IAM - REALIZE ECG EM ATÉ 10 MIN
                    </div>
                  )}

                  <div className="flex gap-2">
                    <MonitorSinaisVitais paciente={paciente} />
                    <Link to={`${createPageUrl("NovaTriagem")}?id=${paciente.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Ver Detalhes
                      </Button>
                    </Link>
                    <Link to={`${createPageUrl("NovaTriagem")}?id=${paciente.id}&retriagem=true`}>
                      <Button variant="outline" size="sm" className="bg-blue-50 hover:bg-blue-100">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retriagem
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}