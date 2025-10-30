import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Activity, TrendingUp, TrendingDown, AlertTriangle, Clock, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const RANGES_CRITICAL = {
  pa_sistolica: { min: 90, max: 180, critico_min: 70, critico_max: 200 },
  pa_diastolica: { min: 60, max: 120, critico_min: 40, critico_max: 140 },
  fc: { min: 60, max: 100, critico_min: 40, critico_max: 140 },
  fr: { min: 12, max: 20, critico_min: 8, critico_max: 30 },
  temperatura: { min: 36, max: 37.5, critico_min: 35, critico_max: 41 },
  spo2: { min: 95, max: 100, critico_min: 90, critico_max: 100 },
  glicemia: { min: 70, max: 180, critico_min: 54, critico_max: 400 }
};

const RANGES_DPOC = {
  spo2: { min: 88, max: 92, critico_min: 85, critico_max: 100 }
};

const RANGES_DIABETES = {
  glicemia: { min: 80, max: 180, critico_min: 54, critico_max: 400 }
};

export default function MonitorSinaisVitais({ paciente }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const vitaisAtuais = paciente.dados_vitais_medico || paciente.dados_vitais || {};
  
  const [vitais, setVitais] = useState({
    pa_braco_esquerdo: vitaisAtuais.pa_braco_esquerdo || "",
    pa_braco_direito: vitaisAtuais.pa_braco_direito || "",
    frequencia_cardiaca: vitaisAtuais.frequencia_cardiaca || "",
    frequencia_respiratoria: vitaisAtuais.frequencia_respiratoria || "",
    temperatura: vitaisAtuais.temperatura || "",
    spo2: vitaisAtuais.spo2 || "",
    spo2_oxigenio: vitaisAtuais.suporte_respiratorio || vitaisAtuais.spo2_oxigenio || "ar_ambiente",
    spo2_litros_o2: vitaisAtuais.litros_o2 || vitaisAtuais.spo2_litros_o2 || "",
    glicemia_capilar: vitaisAtuais.glicemia_capilar || "",
    uso_dva: vitaisAtuais.uso_dva || false,
    dva_tipo: vitaisAtuais.dva_tipo || "",
    uso_sedacao: vitaisAtuais.uso_sedacao || false,
    sedacao_tipo: vitaisAtuais.sedacao_tipo || ""
  });

  const atualizarMutation = useMutation({
    mutationFn: async (dadosVitais) => {
      const timestamp = new Date().toISOString();
      const historico = paciente.historico_sinais_vitais || [];
      
      return await base44.entities.Paciente.update(paciente.id, {
        dados_vitais_medico: {
          ...dadosVitais,
          ultima_atualizacao: timestamp
        },
        historico_sinais_vitais: [
          ...historico,
          {
            timestamp,
            dados: dadosVitais,
            registrado_por: "Sistema"
          }
        ]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      queryClient.invalidateQueries({ queryKey: ['paciente', paciente.id] });
      setOpen(false);
    }
  });

  const getValorStatus = (valor, tipo, pacienteInfo = {}) => {
    if (!valor || valor === "") return null;
    
    const val = parseFloat(valor);
    if (isNaN(val)) return null;

    let ranges = RANGES_CRITICAL[tipo];
    
    // Ajustar para DPOC
    if (tipo === "spo2" && (pacienteInfo.dpoc || paciente.dados_vitais?.dpoc)) {
      ranges = RANGES_DPOC.spo2;
    }
    
    // Ajustar para Diabetes
    if (tipo === "glicemia" && (pacienteInfo.diabetes || paciente.dados_vitais?.diabetes)) {
      ranges = RANGES_DIABETES.glicemia;
    }

    if (!ranges) return null;

    if (val < ranges.critico_min || val > ranges.critico_max) {
      return { status: "critico", cor: "text-red-700 bg-red-100 border-red-400", icon: AlertTriangle };
    } else if (val < ranges.min || val > ranges.max) {
      return { status: "alerta", cor: "text-orange-700 bg-orange-100 border-orange-400", icon: TrendingDown };
    } else {
      return { status: "normal", cor: "text-green-700 bg-green-100 border-green-400", icon: TrendingUp };
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    atualizarMutation.mutate(vitais);
  };

  const parsePA = (paString) => {
    if (!paString) return { sistolica: null, diastolica: null };
    const parts = paString.split("/");
    return {
      sistolica: parts[0] ? parseFloat(parts[0]) : null,
      diastolica: parts[1] ? parseFloat(parts[1]) : null
    };
  };

  const paStatus = (pa) => {
    const { sistolica, diastolica } = parsePA(pa);
    const statusSist = sistolica ? getValorStatus(sistolica, "pa_sistolica") : null;
    const statusDiast = diastolica ? getValorStatus(diastolica, "pa_diastolica") : null;
    
    if (!statusSist && !statusDiast) return null;
    
    if (statusSist?.status === "critico" || statusDiast?.status === "critico") {
      return { status: "critico", cor: "text-red-700 bg-red-100 border-red-400", icon: AlertTriangle };
    } else if (statusSist?.status === "alerta" || statusDiast?.status === "alerta") {
      return { status: "alerta", cor: "text-orange-700 bg-orange-100 border-orange-400", icon: TrendingDown };
    } else {
      return { status: "normal", cor: "text-green-700 bg-green-100 border-green-400", icon: TrendingUp };
    }
  };

  const renderStatusBadge = (status) => {
    if (!status) return null;
    
    const Icon = status.icon;
    const statusText = status.status === "critico" ? "CRÍTICO" : 
                      status.status === "alerta" ? "ALERTA" : "NORMAL";
    
    return (
      <div className={`text-xs p-2 rounded border ${status.cor} flex items-center gap-2`}>
        <Icon className="w-4 h-4" />
        <span className="font-semibold">{statusText}</span>
      </div>
    );
  };

  const ultimaAtualizacao = vitaisAtuais.ultima_atualizacao;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Activity className="w-4 h-4" />
          Atualizar Sinais Vitais
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Activity className="w-6 h-6 text-red-600" />
            Monitor de Sinais Vitais - {paciente.nome_completo}
          </DialogTitle>
        </DialogHeader>

        {ultimaAtualizacao && (
          <Alert className="border-blue-500 bg-blue-50">
            <Clock className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Última atualização:</strong> {format(new Date(ultimaAtualizacao), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sinais Vitais Principais */}
          <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold text-blue-900 mb-4 text-lg">📊 Sinais Vitais Principais</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pa_esquerdo">PA Braço Esquerdo (mmHg)</Label>
                <Input
                  id="pa_esquerdo"
                  placeholder="Ex: 120/80"
                  value={vitais.pa_braco_esquerdo}
                  onChange={(e) => setVitais({...vitais, pa_braco_esquerdo: e.target.value})}
                  className="bg-white"
                />
                {renderStatusBadge(paStatus(vitais.pa_braco_esquerdo))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pa_direito">PA Braço Direito (mmHg)</Label>
                <Input
                  id="pa_direito"
                  placeholder="Ex: 120/80"
                  value={vitais.pa_braco_direito}
                  onChange={(e) => setVitais({...vitais, pa_braco_direito: e.target.value})}
                  className="bg-white"
                />
                {renderStatusBadge(paStatus(vitais.pa_braco_direito))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fc">Frequência Cardíaca (bpm)</Label>
                <Input
                  id="fc"
                  type="number"
                  placeholder="Ex: 75"
                  value={vitais.frequencia_cardiaca}
                  onChange={(e) => setVitais({...vitais, frequencia_cardiaca: e.target.value === "" ? "" : parseFloat(e.target.value) || ""})}
                  className="bg-white"
                />
                {renderStatusBadge(getValorStatus(vitais.frequencia_cardiaca, "fc"))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fr">Frequência Respiratória (irpm)</Label>
                <Input
                  id="fr"
                  type="number"
                  placeholder="Ex: 16"
                  value={vitais.frequencia_respiratoria}
                  onChange={(e) => setVitais({...vitais, frequencia_respiratoria: e.target.value === "" ? "" : parseFloat(e.target.value) || ""})}
                  className="bg-white"
                />
                {renderStatusBadge(getValorStatus(vitais.frequencia_respiratoria, "fr"))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="temp">Temperatura (°C)</Label>
                <Input
                  id="temp"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 36.5"
                  value={vitais.temperatura}
                  onChange={(e) => setVitais({...vitais, temperatura: e.target.value === "" ? "" : parseFloat(e.target.value) || ""})}
                  className="bg-white"
                />
                {renderStatusBadge(getValorStatus(vitais.temperatura, "temperatura"))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="spo2">SpO2 (%)</Label>
                <Input
                  id="spo2"
                  type="number"
                  placeholder="Ex: 98"
                  value={vitais.spo2}
                  onChange={(e) => setVitais({...vitais, spo2: e.target.value === "" ? "" : parseFloat(e.target.value) || ""})}
                  className="bg-white"
                />
                {renderStatusBadge(getValorStatus(vitais.spo2, "spo2", { dpoc: paciente.dados_vitais?.dpoc }))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="glicemia">Glicemia Capilar (mg/dL)</Label>
                <Input
                  id="glicemia"
                  type="number"
                  placeholder="Ex: 110"
                  value={vitais.glicemia_capilar}
                  onChange={(e) => setVitais({...vitais, glicemia_capilar: e.target.value === "" ? "" : parseFloat(e.target.value) || ""})}
                  className="bg-white"
                />
                {renderStatusBadge(getValorStatus(vitais.glicemia_capilar, "glicemia", { diabetes: paciente.dados_vitais?.diabetes }))}
              </div>
            </div>
          </div>

          {/* Suporte Respiratório */}
          <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
            <h3 className="font-semibold text-green-900 mb-3">🫁 Suporte Respiratório</h3>
            <RadioGroup
              value={vitais.spo2_oxigenio}
              onValueChange={(value) => setVitais({...vitais, spo2_oxigenio: value})}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ar_ambiente" id="ar_amb" />
                <Label htmlFor="ar_amb" className="cursor-pointer">Ar ambiente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="oxigenio_suplementar" id="o2" />
                <Label htmlFor="o2" className="cursor-pointer">Oxigênio suplementar</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ventilacao_mecanica" id="vm" />
                <Label htmlFor="vm" className="cursor-pointer">Ventilação Mecânica</Label>
              </div>
            </RadioGroup>

            {vitais.spo2_oxigenio === "oxigenio_suplementar" && (
              <div className="mt-3 space-y-2">
                <Label htmlFor="litros">Litros de O2/min</Label>
                <Input
                  id="litros"
                  type="number"
                  step="0.5"
                  value={vitais.spo2_litros_o2}
                  onChange={(e) => setVitais({...vitais, spo2_litros_o2: e.target.value === "" ? "" : parseFloat(e.target.value) || ""})}
                  className="bg-white"
                />
              </div>
            )}
          </div>

          {/* DVA e Sedação */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="dva"
                  checked={vitais.uso_dva}
                  onChange={(e) => setVitais({...vitais, uso_dva: e.target.checked})}
                  className="w-4 h-4"
                />
                <Label htmlFor="dva" className="cursor-pointer font-semibold text-orange-900">
                  Drogas Vasoativas (DVA)
                </Label>
              </div>
              {vitais.uso_dva && (
                <Input
                  placeholder="Ex: Noradrenalina 0,1mcg/kg/min"
                  value={vitais.dva_tipo}
                  onChange={(e) => setVitais({...vitais, dva_tipo: e.target.value})}
                  className="bg-white"
                />
              )}
            </div>

            <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="sedacao"
                  checked={vitais.uso_sedacao}
                  onChange={(e) => setVitais({...vitais, uso_sedacao: e.target.checked})}
                  className="w-4 h-4"
                />
                <Label htmlFor="sedacao" className="cursor-pointer font-semibold text-purple-900">
                  Sedação
                </Label>
              </div>
              {vitais.uso_sedacao && (
                <Input
                  placeholder="Ex: Midazolam, Propofol"
                  value={vitais.sedacao_tipo}
                  onChange={(e) => setVitais({...vitais, sedacao_tipo: e.target.value})}
                  className="bg-white"
                />
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-red-600 hover:bg-red-700 gap-2"
              disabled={atualizarMutation.isPending}
            >
              <Save className="w-4 h-4" />
              {atualizarMutation.isPending ? "Salvando..." : "Salvar Sinais Vitais"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}