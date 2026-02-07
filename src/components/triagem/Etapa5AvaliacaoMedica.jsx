import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, FileImage, Activity, User, Stethoscope, AlertTriangle, Edit, CheckCircle2 } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const corClassificacao = {
  "Vermelha": "bg-red-100 text-red-800 border-red-300",
  "Laranja": "bg-orange-100 text-orange-800 border-orange-300",
  "Amarela": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Verde": "bg-green-100 text-green-800 border-green-300",
  "Azul": "bg-blue-100 text-blue-800 border-blue-300"
};

export default function Etapa5AvaliacaoMedica({ dadosPaciente, onProxima, onAnterior }) {
  const [avaliacao, setAvaliacao] = useState(() => {
    if (dadosPaciente.avaliacao_medica && dadosPaciente.avaliacao_medica.data_hora_avaliacao) {
      return dadosPaciente.avaliacao_medica;
    }
    return {
      data_hora_avaliacao: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      antecedentes: "",
      quadro_atual: "",
      hipoteses_diagnosticas: "",
      observacoes: ""
    };
  });

  const [medico, setMedico] = useState({
    nome: dadosPaciente.medico_nome || "",
    crm: dadosPaciente.medico_crm || ""
  });

  const [editandoDadosVitais, setEditandoDadosVitais] = useState(false);
  
  const [dadosVitaisMedico, setDadosVitaisMedico] = useState(() => {
    if (dadosPaciente.dados_vitais_medico) {
      return dadosPaciente.dados_vitais_medico;
    }
    return {
      pa_braco_esquerdo: dadosPaciente.dados_vitais?.pa_braco_esquerdo || "",
      pa_braco_direito: dadosPaciente.dados_vitais?.pa_braco_direito || "",
      frequencia_cardiaca: dadosPaciente.dados_vitais?.frequencia_cardiaca || null,
      frequencia_respiratoria: dadosPaciente.dados_vitais?.frequencia_respiratoria || null,
      temperatura: dadosPaciente.dados_vitais?.temperatura || null,
      spo2: dadosPaciente.dados_vitais?.spo2 || null,
      glicemia_capilar: dadosPaciente.dados_vitais?.glicemia_capilar || null,
      suporte_respiratorio: dadosPaciente.dados_vitais?.spo2_oxigenio === "o2_suplementar" ? "oxigenio_suplementar" : "ar_ambiente",
      litros_o2: dadosPaciente.dados_vitais?.spo2_litros_o2 || null,
      uso_dva: false,
      dva_tipo: "",
      uso_sedacao: false,
      sedacao_tipo: ""
    };
  });

  useEffect(() => {
    if (!dadosPaciente.avaliacao_medica || !dadosPaciente.avaliacao_medica.data_hora_avaliacao) {
      setAvaliacao(prev => ({
        ...prev,
        data_hora_avaliacao: format(new Date(), "yyyy-MM-dd'T'HH:mm")
      }));
    }
  }, [dadosPaciente.avaliacao_medica]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!medico.nome || !medico.crm) {
      alert("Por favor, preencha o nome e CRM do médico");
      return;
    }
    
    if (!avaliacao.quadro_atual || !avaliacao.hipoteses_diagnosticas) {
      alert("Por favor, preencha o Quadro Clínico Atual e as Hipóteses Diagnósticas");
      return;
    }
    
    const dadosVitaisLimpos = {
      ...dadosVitaisMedico,
      frequencia_cardiaca: dadosVitaisMedico.frequencia_cardiaca || null,
      frequencia_respiratoria: dadosVitaisMedico.frequencia_respiratoria || null,
      temperatura: dadosVitaisMedico.temperatura || null,
      spo2: dadosVitaisMedico.spo2 || null,
      glicemia_capilar: dadosVitaisMedico.glicemia_capilar || null,
      litros_o2: dadosVitaisMedico.litros_o2 || null,
    };
    
    const dadosParaSalvar = { 
      avaliacao_medica: avaliacao,
      dados_vitais_medico: dadosVitaisLimpos,
      medico_nome: medico.nome,
      medico_crm: medico.crm,
      status: "Em Atendimento"
    };
    
    onProxima(dadosParaSalvar);
  };

  const tempoDor = dadosPaciente.data_hora_inicio_sintomas
    ? differenceInMinutes(new Date(), new Date(dadosPaciente.data_hora_inicio_sintomas))
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header com as 3 logos */}
      <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between gap-4 w-full">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/8e093c8da_logoSecretariadeEstadodaSade.png" 
            alt="Secretaria de Estado da Saúde" 
            className="h-16 md:h-20 w-auto object-contain"
          />
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/fa5f3a17e_LOGOCORAAOPARAIBANO.png" 
            alt="Coração Paraibano" 
            className="h-16 md:h-20 w-auto object-contain"
          />
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/873a4a563_logo.png" 
            alt="PBSAÚDE" 
            className="h-16 md:h-20 w-auto object-contain"
          />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Avaliação Médica</h2>
        <p className="text-gray-600">Registro da avaliação clínica e diagnósticos</p>
      </div>

      {tempoDor !== null && (
        <Alert className="border-red-500 bg-red-50 shadow-lg">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong className="text-lg">⚠️ ALERTA! Tempo de Dor: {Math.floor(tempoDor / 60)}h {tempoDor % 60}min</strong>
            <p className="mt-1 text-sm">
              Desde início dos sintomas ({format(new Date(dadosPaciente.data_hora_inicio_sintomas), "dd/MM HH:mm", { locale: ptBR })}) até agora
            </p>
            <p className="mt-2 text-sm font-bold">
              {tempoDor > 180 ? "⚠️ >3 horas - Janela terapêutica reduzida" : "✓ Janela terapêutica ainda favorável"}
            </p>
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-lg border-l-4 border-l-purple-600">
        <CardHeader className="bg-purple-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-purple-900 text-xl">
              <Stethoscope className="w-6 h-6" />
              📊 Atualização de Dados Vitais
            </CardTitle>
            {!editandoDadosVitais ? (
              <Button
                type="button"
                onClick={() => setEditandoDadosVitais(true)}
                className="bg-purple-600 hover:bg-purple-700 gap-2"
              >
                <Edit className="w-4 h-4" />
                Atualizar Dados Vitais
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setEditandoDadosVitais(false)}
                variant="outline"
                className="text-purple-700 border-purple-300"
              >
                Cancelar Edição
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {!editandoDadosVitais ? (
            <>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-white rounded border">
                  <p className="text-xs text-gray-600 mb-1">PA Esquerdo</p>
                  <p className="text-lg font-bold text-gray-900">{dadosVitaisMedico.pa_braco_esquerdo || "-"} mmHg</p>
                </div>
                <div className="p-3 bg-white rounded border">
                  <p className="text-xs text-gray-600 mb-1">PA Direito</p>
                  <p className="text-lg font-bold text-gray-900">{dadosVitaisMedico.pa_braco_direito || "-"} mmHg</p>
                </div>
                <div className="p-3 bg-white rounded border">
                  <p className="text-xs text-gray-600 mb-1">FC</p>
                  <p className="text-lg font-bold text-gray-900">{dadosVitaisMedico.frequencia_cardiaca || "-"} bpm</p>
                </div>
                <div className="p-3 bg-white rounded border">
                  <p className="text-xs text-gray-600 mb-1">FR</p>
                  <p className="text-lg font-bold text-gray-900">{dadosVitaisMedico.frequencia_respiratoria || "-"} irpm</p>
                </div>
                <div className="p-3 bg-white rounded border">
                  <p className="text-xs text-gray-600 mb-1">Temperatura</p>
                  <p className="text-lg font-bold text-gray-900">{dadosVitaisMedico.temperatura || "-"} °C</p>
                </div>
                <div className="p-3 bg-white rounded border">
                  <p className="text-xs text-gray-600 mb-1">SpO2</p>
                  <p className="text-lg font-bold text-gray-900">{dadosVitaisMedico.spo2 || "-"}%</p>
                </div>
                <div className="p-3 bg-white rounded border">
                  <p className="text-xs text-gray-600 mb-1">Glicemia</p>
                  <p className="text-lg font-bold text-gray-900">{dadosVitaisMedico.glicemia_capilar || "-"} mg/dL</p>
                </div>
                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs text-blue-800 mb-1 font-semibold">Suporte Respiratório</p>
                  <p className="text-sm font-bold text-blue-900">
                    {dadosVitaisMedico.suporte_respiratorio === "ar_ambiente" && "Ar Ambiente"}
                    {dadosVitaisMedico.suporte_respiratorio === "oxigenio_suplementar" && `O2 ${dadosVitaisMedico.litros_o2 || "?"}L/min`}
                    {dadosVitaisMedico.suporte_respiratorio === "ventilacao_mecanica" && "Ventilação Mecânica"}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 rounded border border-orange-200">
                  <p className="text-xs text-orange-800 mb-1 font-semibold">DVA</p>
                  <p className="text-sm font-bold text-orange-900">
                    {dadosVitaisMedico.uso_dva ? dadosVitaisMedico.dva_tipo || "Em uso" : "Não"}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded border border-purple-200">
                  <p className="text-xs text-purple-800 mb-1 font-semibold">Sedação</p>
                  <p className="text-sm font-bold text-purple-900">
                    {dadosVitaisMedico.uso_sedacao ? dadosVitaisMedico.sedacao_tipo || "Em uso" : "Não"}
                  </p>
                </div>
              </div>
              <Alert className="border-purple-400 bg-purple-50">
                <AlertDescription className="text-purple-800 text-sm flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  <span>Clique em <strong>"Atualizar Dados Vitais"</strong> acima para modificar</span>
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <div className="space-y-6">
              <Alert className="border-blue-500 bg-blue-50">
                <AlertDescription className="text-blue-800">
                  <strong>💡 Atualize os dados vitais</strong> conforme a avaliação médica atual.
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pa_esq_medico">PA Esquerdo (mmHg)</Label>
                  <Input
                    id="pa_esq_medico"
                    value={dadosVitaisMedico.pa_braco_esquerdo}
                    onChange={(e) => setDadosVitaisMedico({...dadosVitaisMedico, pa_braco_esquerdo: e.target.value})}
                    placeholder="Ex: 120/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pa_dir_medico">PA Direito (mmHg)</Label>
                  <Input
                    id="pa_dir_medico"
                    value={dadosVitaisMedico.pa_braco_direito}
                    onChange={(e) => setDadosVitaisMedico({...dadosVitaisMedico, pa_braco_direito: e.target.value})}
                    placeholder="Ex: 120/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fc_medico">Frequência Cardíaca (bpm)</Label>
                  <Input
                    id="fc_medico"
                    type="number"
                    value={dadosVitaisMedico.frequencia_cardiaca || ""}
                    onChange={(e) => setDadosVitaisMedico({...dadosVitaisMedico, frequencia_cardiaca: e.target.value ? parseFloat(e.target.value) : null})}
                    placeholder="Ex: 75"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fr_medico">Frequência Respiratória (irpm)</Label>
                  <Input
                    id="fr_medico"
                    type="number"
                    value={dadosVitaisMedico.frequencia_respiratoria || ""}
                    onChange={(e) => setDadosVitaisMedico({...dadosVitaisMedico, frequencia_respiratoria: e.target.value ? parseFloat(e.target.value) : null})}
                    placeholder="Ex: 16"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temp_medico">Temperatura (°C)</Label>
                  <Input
                    id="temp_medico"
                    type="number"
                    step="0.1"
                    value={dadosVitaisMedico.temperatura || ""}
                    onChange={(e) => setDadosVitaisMedico({...dadosVitaisMedico, temperatura: e.target.value ? parseFloat(e.target.value) : null})}
                    placeholder="Ex: 36.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spo2_medico">SpO2 (%)</Label>
                  <Input
                    id="spo2_medico"
                    type="number"
                    value={dadosVitaisMedico.spo2 || ""}
                    onChange={(e) => setDadosVitaisMedico({...dadosVitaisMedico, spo2: e.target.value ? parseFloat(e.target.value) : null})}
                    placeholder="Ex: 98"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="glicemia_medico">Glicemia Capilar (mg/dL)</Label>
                  <Input
                    id="glicemia_medico"
                    type="number"
                    value={dadosVitaisMedico.glicemia_capilar || ""}
                    onChange={(e) => setDadosVitaisMedico({...dadosVitaisMedico, glicemia_capilar: e.target.value ? parseFloat(e.target.value) : null})}
                    placeholder="Ex: 110"
                  />
                </div>
              </div>

              <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                <Label className="text-base font-semibold text-blue-900 mb-3 block">🫁 Suporte Respiratório</Label>
                <RadioGroup
                  value={dadosVitaisMedico.suporte_respiratorio}
                  onValueChange={(value) => setDadosVitaisMedico({...dadosVitaisMedico, suporte_respiratorio: value, litros_o2: value === "ar_ambiente" ? null : dadosVitaisMedico.litros_o2})}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ar_ambiente" id="ar_amb_med" />
                    <Label htmlFor="ar_amb_med" className="cursor-pointer font-medium">
                      Ar Ambiente
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="oxigenio_suplementar" id="o2_sup_med" />
                    <Label htmlFor="o2_sup_med" className="cursor-pointer font-medium">
                      Oxigênio Suplementar
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ventilacao_mecanica" id="vm_med" />
                    <Label htmlFor="vm_med" className="cursor-pointer font-medium">
                      Ventilação Mecânica
                    </Label>
                  </div>
                </RadioGroup>

                {dadosVitaisMedico.suporte_respiratorio === "oxigenio_suplementar" && (
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="litros_o2_med">Litros de O2 por minuto</Label>
                    <Input
                      id="litros_o2_med"
                      type="number"
                      step="0.5"
                      value={dadosVitaisMedico.litros_o2 || ""}
                      onChange={(e) => setDadosVitaisMedico({...dadosVitaisMedico, litros_o2: e.target.value ? parseFloat(e.target.value) : null})}
                      placeholder="Ex: 2 ou 5"
                      className="bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
                <div className="flex items-center space-x-2 mb-3">
                  <Checkbox
                    id="uso_dva"
                    checked={dadosVitaisMedico.uso_dva}
                    onCheckedChange={(checked) => setDadosVitaisMedico({...dadosVitaisMedico, uso_dva: checked, dva_tipo: checked ? dadosVitaisMedico.dva_tipo : ""})}
                  />
                  <Label htmlFor="uso_dva" className="cursor-pointer font-semibold text-orange-900 text-base">
                    💉 Uso de Drogas Vasoativas (DVA)
                  </Label>
                </div>
                {dadosVitaisMedico.uso_dva && (
                  <div className="space-y-2">
                    <Label htmlFor="dva_tipo">Tipo de DVA</Label>
                    <Input
                      id="dva_tipo"
                      value={dadosVitaisMedico.dva_tipo}
                      onChange={(e) => setDadosVitaisMedico({...dadosVitaisMedico, dva_tipo: e.target.value})}
                      placeholder="Ex: Noradrenalina 0,1mcg/kg/min, Dobutamina..."
                      className="bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                <div className="flex items-center space-x-2 mb-3">
                  <Checkbox
                    id="uso_sedacao"
                    checked={dadosVitaisMedico.uso_sedacao}
                    onCheckedChange={(checked) => setDadosVitaisMedico({...dadosVitaisMedico, uso_sedacao: checked, sedacao_tipo: checked ? dadosVitaisMedico.sedacao_tipo : ""})}
                  />
                  <Label htmlFor="uso_sedacao" className="cursor-pointer font-semibold text-purple-900 text-base">
                    💊 Uso de Sedação
                  </Label>
                </div>
                {dadosVitaisMedico.uso_sedacao && (
                  <div className="space-y-2">
                    <Label htmlFor="sedacao_tipo">Tipo de Sedação</Label>
                    <Input
                      id="sedacao_tipo"
                      value={dadosVitaisMedico.sedacao_tipo}
                      onChange={(e) => setDadosVitaisMedico({...dadosVitaisMedico, sedacao_tipo: e.target.value})}
                      placeholder="Ex: Midazolam, Propofol, Fentanil..."
                      className="bg-white"
                    />
                  </div>
                )}
              </div>

              <Button
                type="button"
                onClick={() => setEditandoDadosVitais(false)}
                className="w-full bg-green-600 hover:bg-green-700 gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirmar Atualização
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* RESUMO COMPLETO DA TRIAGEM DE ENFERMAGEM */}
      <Card className="shadow-lg border-l-4 border-l-blue-600">
        <CardHeader className="bg-blue-50 border-b">
          <CardTitle className="flex items-center gap-2 text-blue-900 text-xl">
            <User className="w-6 h-6" />
            📋 Resumo Completo da Triagem de Enfermagem
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          {/* 1. DADOS DO PACIENTE */}
          <div className="border-l-4 border-l-indigo-500 pl-4 bg-indigo-50 p-4 rounded">
            <h3 className="font-bold text-indigo-900 mb-3 text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              1️⃣ DADOS DO PACIENTE
            </h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              {dadosPaciente.unidade_saude && (
                <div className="md:col-span-2 bg-blue-100 p-3 rounded">
                  <span className="text-blue-900 font-bold text-base">🏥 Unidade: {dadosPaciente.unidade_saude}</span>
                </div>
              )}
              <div>
                <span className="text-gray-700 font-semibold">Nome:</span>
                <p className="font-medium text-gray-900">{dadosPaciente.nome_completo || '-'}</p>
              </div>
              <div>
                <span className="text-gray-700 font-semibold">Prontuário:</span>
                <p className="font-medium text-gray-900">{dadosPaciente.prontuario || '-'}</p>
              </div>
              <div>
                <span className="text-gray-700 font-semibold">Idade/Sexo:</span>
                <p className="font-medium text-gray-900">{dadosPaciente.idade} anos / {dadosPaciente.sexo}</p>
              </div>
              <div>
                <span className="text-gray-700 font-semibold">Chegada:</span>
                <p className="font-medium text-gray-900">
                  {dadosPaciente.data_hora_chegada && format(new Date(dadosPaciente.data_hora_chegada), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>

          {/* 2. TRIAGEM CARDIOLÓGICA */}
          {dadosPaciente.triagem_cardiologica && (
            <div className="border-l-4 border-l-orange-500 pl-4 bg-orange-50 p-4 rounded">
              <h3 className="font-bold text-orange-900 mb-3 text-lg">
                2️⃣ TRIAGEM CARDIOLÓGICA (SBC 2025)
              </h3>
              {dadosPaciente.triagem_cardiologica.alerta_iam && (
                <Alert className="border-red-500 bg-red-100 mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-700" />
                  <AlertDescription className="text-red-800 font-bold">
                    ⚠️ ALERTA DE PROVÁVEL IAM DETECTADO
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${dadosPaciente.triagem_cardiologica.dor_desconforto_peito ? 'bg-red-600' : 'bg-green-600'}`}></span>
                  <span>Dor/desconforto no peito: <strong>{dadosPaciente.triagem_cardiologica.dor_desconforto_peito ? 'SIM' : 'NÃO'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${dadosPaciente.triagem_cardiologica.duracao_maior_10min ? 'bg-red-600' : 'bg-green-600'}`}></span>
                  <span>Duração {'>'} 10 min: <strong>{dadosPaciente.triagem_cardiologica.duracao_maior_10min ? 'SIM' : 'NÃO'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${dadosPaciente.triagem_cardiologica.irradiacao ? 'bg-red-600' : 'bg-green-600'}`}></span>
                  <span>Irradiação: <strong>{dadosPaciente.triagem_cardiologica.irradiacao ? 'SIM' : 'NÃO'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${dadosPaciente.triagem_cardiologica.dor_epigastrica ? 'bg-red-600' : 'bg-green-600'}`}></span>
                  <span>Dor epigástrica: <strong>{dadosPaciente.triagem_cardiologica.dor_epigastrica ? 'SIM' : 'NÃO'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${dadosPaciente.triagem_cardiologica.dispneia_diaforese ? 'bg-red-600' : 'bg-green-600'}`}></span>
                  <span>Dispneia/Diaforese: <strong>{dadosPaciente.triagem_cardiologica.dispneia_diaforese ? 'SIM' : 'NÃO'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${dadosPaciente.triagem_cardiologica.idade_fatores_risco ? 'bg-red-600' : 'bg-green-600'}`}></span>
                  <span>{'>'} 50 anos/DM/DCV: <strong>{dadosPaciente.triagem_cardiologica.idade_fatores_risco ? 'SIM' : 'NÃO'}</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* 3. DADOS VITAIS DA TRIAGEM */}
          {dadosPaciente.dados_vitais && (
            <div className="border-l-4 border-l-green-500 pl-4 bg-green-50 p-4 rounded">
              <h3 className="font-bold text-green-900 mb-3 text-lg">
                3️⃣ DADOS VITAIS (TRIAGEM)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white p-2 rounded border text-center">
                  <p className="text-xs text-gray-600">PA Esq</p>
                  <p className="font-bold text-sm">{dadosPaciente.dados_vitais.pa_braco_esquerdo || '-'}</p>
                </div>
                <div className="bg-white p-2 rounded border text-center">
                  <p className="text-xs text-gray-600">PA Dir</p>
                  <p className="font-bold text-sm">{dadosPaciente.dados_vitais.pa_braco_direito || '-'}</p>
                </div>
                <div className="bg-white p-2 rounded border text-center">
                  <p className="text-xs text-gray-600">FC</p>
                  <p className="font-bold text-sm">{dadosPaciente.dados_vitais.frequencia_cardiaca || '-'} bpm</p>
                </div>
                <div className="bg-white p-2 rounded border text-center">
                  <p className="text-xs text-gray-600">FR</p>
                  <p className="font-bold text-sm">{dadosPaciente.dados_vitais.frequencia_respiratoria || '-'} irpm</p>
                </div>
                <div className="bg-white p-2 rounded border text-center">
                  <p className="text-xs text-gray-600">Temp</p>
                  <p className="font-bold text-sm">{dadosPaciente.dados_vitais.temperatura || '-'} °C</p>
                </div>
                <div className="bg-white p-2 rounded border text-center">
                  <p className="text-xs text-gray-600">SpO2</p>
                  <p className="font-bold text-sm">{dadosPaciente.dados_vitais.spo2 || '-'}%</p>
                </div>
                <div className="bg-white p-2 rounded border text-center">
                  <p className="text-xs text-gray-600">Glicemia</p>
                  <p className="font-bold text-sm">{dadosPaciente.dados_vitais.glicemia_capilar || '-'} mg/dL</p>
                </div>
              </div>
            </div>
          )}

          {/* 4. CLASSIFICAÇÃO DE RISCO */}
          {dadosPaciente.classificacao_risco && (
            <div className={`border-l-4 pl-4 p-4 rounded ${
              dadosPaciente.classificacao_risco.cor === 'Vermelha' ? 'border-l-red-600 bg-red-50' :
              dadosPaciente.classificacao_risco.cor === 'Laranja' ? 'border-l-orange-600 bg-orange-50' :
              dadosPaciente.classificacao_risco.cor === 'Amarela' ? 'border-l-yellow-500 bg-yellow-50' :
              dadosPaciente.classificacao_risco.cor === 'Verde' ? 'border-l-green-600 bg-green-50' :
              'border-l-blue-600 bg-blue-50'
            }`}>
              <h3 className="font-bold mb-3 text-lg">
                4️⃣ CLASSIFICAÇÃO DE RISCO (MANCHESTER)
              </h3>
              <div className="flex items-center gap-4 mb-3">
                <Badge className={`${corClassificacao[dadosPaciente.classificacao_risco.cor]} border-2 text-lg px-4 py-2 font-bold`}>
                  {dadosPaciente.classificacao_risco.cor}
                </Badge>
                <span className="font-medium">{dadosPaciente.classificacao_risco.tempo_atendimento_max}</span>
              </div>
              {dadosPaciente.classificacao_risco.discriminadores && dadosPaciente.classificacao_risco.discriminadores.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Discriminadores:</p>
                  <div className="flex flex-wrap gap-2">
                    {dadosPaciente.classificacao_risco.discriminadores.map((disc, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {disc}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. ECG - APENAS ARQUIVOS */}
          {dadosPaciente.ecg_files && dadosPaciente.ecg_files.length > 0 && (
            <div className="border-l-4 border-l-purple-500 pl-4 bg-purple-50 p-4 rounded">
              <h3 className="font-bold text-purple-900 mb-3 text-lg flex items-center gap-2">
                <FileImage className="w-5 h-5" />
                5️⃣ ARQUIVOS DE ECG
              </h3>
              
              {dadosPaciente.tempo_triagem_ecg_minutos !== undefined && (
                <div className={`mb-3 p-3 rounded border-2 ${
                  dadosPaciente.tempo_triagem_ecg_minutos <= 10 
                    ? 'bg-green-100 border-green-400' 
                    : 'bg-orange-100 border-orange-400'
                }`}>
                  <p className="font-bold">
                    ⏱️ Tempo Triagem → ECG: {dadosPaciente.tempo_triagem_ecg_minutos} min
                    {dadosPaciente.tempo_triagem_ecg_minutos <= 10 ? ' ✓ Dentro da meta' : ' ⚠️ Acima da meta'}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {dadosPaciente.ecg_files.map((url, index) => (
                  <div key={index} className="border rounded overflow-hidden bg-white">
                    <img
                      src={url}
                      alt={`ECG ${index + 1}`}
                      className="w-full h-32 object-contain cursor-pointer hover:opacity-80"
                      onClick={() => window.open(url, '_blank')}
                    />
                    <div className="p-2 bg-purple-600 text-white text-center text-xs font-semibold">
                      ECG {index + 1} - Clique para ampliar
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. ENFERMEIRO RESPONSÁVEL */}
          {dadosPaciente.enfermeiro_nome && (
            <div className="border-l-4 border-l-teal-500 pl-4 bg-teal-50 p-4 rounded">
              <h3 className="font-bold text-teal-900 mb-2 text-lg">
                6️⃣ ENFERMEIRO RESPONSÁVEL
              </h3>
              <p className="text-sm">
                <strong>{dadosPaciente.enfermeiro_nome}</strong> • COREN: {dadosPaciente.enfermeiro_coren}
              </p>
            </div>
          )}

        </CardContent>
      </Card>

      <div className="border-t-2 border-blue-600 pt-6 mt-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-blue-600" />
          Avaliação Clínica do Médico
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="medico_nome">Nome Completo do Médico *</Label>
            <Input
              id="medico_nome"
              value={medico.nome}
              onChange={(e) => setMedico({...medico, nome: e.target.value})}
              placeholder="Digite o nome completo"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="medico_crm">Número CRM *</Label>
            <Input
              id="medico_crm"
              value={medico.crm}
              onChange={(e) => setMedico({...medico, crm: e.target.value})}
              placeholder="Ex: 123456"
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="antecedentes">Antecedentes Clínicos</Label>
            <Textarea
              id="antecedentes"
              placeholder="Histórico de doenças prévias, cirurgias, medicações em uso, alergias..."
              value={avaliacao.antecedentes}
              onChange={(e) => setAvaliacao({...avaliacao, antecedentes: e.target.value})}
              rows={4}
              className="resize-y"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quadro_atual">Quadro Clínico Atual (incluir interpretação do ECG) *</Label>
            <Textarea
              id="quadro_atual"
              placeholder="Características da dor torácica, dispneia, sintomas associados...

INTERPRETAÇÃO DO ECG:
- Ritmo:
- Frequência:
- Segmento ST:
- Onda T:
- Outras alterações:"
              value={avaliacao.quadro_atual}
              onChange={(e) => setAvaliacao({...avaliacao, quadro_atual: e.target.value})}
              rows={8}
              className="resize-y font-mono"
              required
            />
            <p className="text-xs text-gray-600">
              💡 Inclua a interpretação médica completa do ECG neste campo
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hipoteses">Hipóteses Diagnósticas *</Label>
            <Textarea
              id="hipoteses"
              placeholder="Diagnósticos diferenciais considerados..."
              value={avaliacao.hipoteses_diagnosticas}
              onChange={(e) => setAvaliacao({...avaliacao, hipoteses_diagnosticas: e.target.value})}
              rows={4}
              className="resize-y"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações Adicionais</Label>
            <Textarea
              id="observacoes"
              placeholder="Outras informações relevantes..."
              value={avaliacao.observacoes}
              onChange={(e) => setAvaliacao({...avaliacao, observacoes: e.target.value})}
              rows={3}
              className="resize-y"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onAnterior}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button type="submit" className="bg-red-600 hover:bg-red-700">
          Próxima Etapa
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}