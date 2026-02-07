import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, Upload, AlertTriangle, Activity } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format, differenceInMinutes } from "date-fns";

export default function Etapa2TriagemMedica({ dadosPaciente, onProxima, onAnterior }) {
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState({
    pa_sistolica: dadosPaciente.triagem_medica?.pa_sistolica || "",
    pa_diastolica: dadosPaciente.triagem_medica?.pa_diastolica || "",
    diferenca_pa_mse_msd: dadosPaciente.triagem_medica?.diferenca_pa_mse_msd || "",
    frequencia_cardiaca: dadosPaciente.triagem_medica?.frequencia_cardiaca || "",
    frequencia_respiratoria: dadosPaciente.triagem_medica?.frequencia_respiratoria || "",
    temperatura: dadosPaciente.triagem_medica?.temperatura || "",
    spo2: dadosPaciente.triagem_medica?.spo2 || "",
    uso_oxigenio: dadosPaciente.triagem_medica?.uso_oxigenio || false,
    litros_oxigenio: dadosPaciente.triagem_medica?.litros_oxigenio || "",
    diabetes: dadosPaciente.triagem_medica?.diabetes || false,
    dpoc: dadosPaciente.triagem_medica?.dpoc || false,
    glicemia_capilar: dadosPaciente.triagem_medica?.glicemia_capilar || "",
    ecg_files: dadosPaciente.triagem_medica?.ecg_files || [],
    data_hora_ecg: dadosPaciente.triagem_medica?.data_hora_ecg || "",
    alteracoes_ecg: dadosPaciente.triagem_medica?.alteracoes_ecg || [],
    tipo_sca: dadosPaciente.triagem_medica?.tipo_sca || ""
  });

  const [tempoEntradaEcg, setTempoEntradaEcg] = useState(null);
  const [mostrarAlertaEcg, setMostrarAlertaEcg] = useState(false);

  useEffect(() => {
    if (dados.pa_sistolica && dados.pa_diastolica && dados.frequencia_cardiaca && 
        dados.frequencia_respiratoria && dados.temperatura && dados.spo2) {
      setMostrarAlertaEcg(true);
    }
  }, [dados]);

  useEffect(() => {
    if (dados.data_hora_ecg && dadosPaciente.data_hora_chegada) {
      try {
        const dataEcg = new Date(dados.data_hora_ecg);
        const dataChegada = new Date(dadosPaciente.data_hora_chegada);
        
        if (!isNaN(dataEcg.getTime()) && !isNaN(dataChegada.getTime())) {
          const minutos = differenceInMinutes(dataEcg, dataChegada);
          setTempoEntradaEcg(minutos);
        }
      } catch (error) {
        console.error("Erro ao calcular tempo ECG:", error);
      }
    }
  }, [dados.data_hora_ecg, dadosPaciente.data_hora_chegada]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (dados.ecg_files.length + files.length > 3) {
      alert("Máximo de 3 arquivos");
      return;
    }

    setLoading(true);
    try {
      const uploadPromises = files.map(file => base44.integrations.Core.UploadFile({ file }));
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      
      setDados(prev => ({
        ...prev,
        ecg_files: [...prev.ecg_files, ...urls]
      }));
    } catch (error) {
      alert("Erro ao fazer upload dos arquivos");
    } finally {
      setLoading(false);
    }
  };

  const alteracoesEcgOptions = [
    "Onda T hiperaguda ou evolução típica",
    "Supra de ST significativo em derivações contíguas",
    "Recíprocos presentes",
    "ST em V2–V3 elevado ≥ 2,0 mm Homens ≥ 40 anos",
    "ST em V2–V3 elevado ≥ 2,5 mm Homens < 40 anos",
    "ST em V2–V3 elevado ≥ 1,5 mm em Mulheres",
    "Ausência de causas alternativas (pericardite, BRE, marcapasso, etc.)",
    "Onda T negativa em V1 ou AVR",
    "Onda T negativa discreta em V2 (especialmente em mulheres jovens)",
    "Elevação leve do ST com concavidade para cima com Onda J discreta",
    "Inversão de onda T em DIII isolada"
  ];

  const toggleAlteracao = (alteracao) => {
    setDados(prev => ({
      ...prev,
      alteracoes_ecg: prev.alteracoes_ecg.includes(alteracao)
        ? prev.alteracoes_ecg.filter(a => a !== alteracao)
        : [...prev.alteracoes_ecg, alteracao]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!dados.tipo_sca) {
      alert("Por favor, selecione o tipo de SCA");
      return;
    }

    const dadosTriagem = {
      triagem_medica: {
        ...dados,
        litros_oxigenio: dados.uso_oxigenio && dados.litros_oxigenio ? parseFloat(dados.litros_oxigenio) : undefined,
        data_hora_inicio: dadosPaciente.data_hora_chegada,
        tempo_entrada_ecg_minutos: tempoEntradaEcg
      }
    };

    onProxima(dadosTriagem);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Triagem Médica Cardiológica</h2>
        <p className="text-gray-600">Dados vitais, ECG e classificação inicial</p>
      </div>

      {/* Sinais Vitais */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Sinais Vitais
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Pressão Arterial Sistólica (mmHg) *</Label>
            <Input
              type="number"
              value={dados.pa_sistolica}
              onChange={(e) => setDados(prev => ({...prev, pa_sistolica: parseInt(e.target.value) || ""}))}
              placeholder="Ex: 120"
              required
            />
          </div>

          <div>
            <Label>Pressão Arterial Diastólica (mmHg) *</Label>
            <Input
              type="number"
              value={dados.pa_diastolica}
              onChange={(e) => setDados(prev => ({...prev, pa_diastolica: parseInt(e.target.value) || ""}))}
              placeholder="Ex: 80"
              required
            />
          </div>

          <div className="md:col-span-2">
            <Label className="mb-3 block">Há diferença maior que 15 mmHg entre PA em MSE X MSD? *</Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="diferenca_pa"
                  value="Sim"
                  checked={dados.diferenca_pa_mse_msd === "Sim"}
                  onChange={(e) => setDados(prev => ({...prev, diferenca_pa_mse_msd: e.target.value}))}
                  className="w-4 h-4"
                  required
                />
                <Label>Sim</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="diferenca_pa"
                  value="Não"
                  checked={dados.diferenca_pa_mse_msd === "Não"}
                  onChange={(e) => setDados(prev => ({...prev, diferenca_pa_mse_msd: e.target.value}))}
                  className="w-4 h-4"
                  required
                />
                <Label>Não</Label>
              </div>
            </div>
          </div>

          <div>
            <Label>Frequência Cardíaca (bpm) *</Label>
            <Input
              type="number"
              value={dados.frequencia_cardiaca}
              onChange={(e) => setDados(prev => ({...prev, frequencia_cardiaca: parseInt(e.target.value) || ""}))}
              required
            />
          </div>

          <div>
            <Label>Frequência Respiratória (irpm) *</Label>
            <Input
              type="number"
              value={dados.frequencia_respiratoria}
              onChange={(e) => setDados(prev => ({...prev, frequencia_respiratoria: parseInt(e.target.value) || ""}))}
              required
            />
          </div>

          <div>
            <Label>Temperatura (°C) *</Label>
            <Input
              type="number"
              step="0.1"
              value={dados.temperatura}
              onChange={(e) => setDados(prev => ({...prev, temperatura: parseFloat(e.target.value) || ""}))}
              required
            />
          </div>

          <div>
            <Label>SpO2 (%) *</Label>
            <Input
              type="number"
              value={dados.spo2}
              onChange={(e) => setDados(prev => ({...prev, spo2: parseInt(e.target.value) || ""}))}
              required
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center gap-4 mb-2">
              <Checkbox
                checked={dados.uso_oxigenio}
                onCheckedChange={(checked) => setDados(prev => ({...prev, uso_oxigenio: checked}))}
              />
              <Label>Em uso de oxigênio?</Label>
            </div>
            
            {dados.uso_oxigenio && (
              <div className="ml-8">
                <Label>Litros de O2 por minuto *</Label>
                <Input
                  type="number"
                  value={dados.litros_oxigenio}
                  onChange={(e) => setDados(prev => ({...prev, litros_oxigenio: parseFloat(e.target.value) || ""}))}
                  placeholder="Ex: 2"
                  required={dados.uso_oxigenio}
                />
              </div>
            )}
          </div>

          <div>
            <Label>Glicemia Capilar (mg/dL) *</Label>
            <Input
              type="number"
              value={dados.glicemia_capilar}
              onChange={(e) => setDados(prev => ({...prev, glicemia_capilar: parseInt(e.target.value) || ""}))}
              required
            />
          </div>

          <div className="flex items-center gap-4">
            <Checkbox
              checked={dados.diabetes}
              onCheckedChange={(checked) => setDados(prev => ({...prev, diabetes: checked}))}
            />
            <Label>Diabetes</Label>

            <Checkbox
              checked={dados.dpoc}
              onCheckedChange={(checked) => setDados(prev => ({...prev, dpoc: checked}))}
            />
            <Label>DPOC</Label>
          </div>
        </div>
      </div>

      {/* Alerta ECG */}
      {mostrarAlertaEcg && (
        <Alert className="bg-red-50 border-red-300">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800 font-semibold text-lg">
            ⚠️ ANEXAR ECG
          </AlertDescription>
        </Alert>
      )}

      {/* Upload ECG */}
      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-4">Eletrocardiograma (ECG)</h3>
        
        <div className="space-y-4">
          <div>
            <Label>Anexar ECG (até 3 arquivos - PDF, JPEG, PNG)</Label>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,image/*"
              multiple
              onChange={handleFileUpload}
              disabled={loading || dados.ecg_files.length >= 3}
              className="mt-2"
            />
            {dados.ecg_files.length > 0 && (
              <p className="text-sm text-green-600 mt-2">
                ✓ {dados.ecg_files.length} arquivo(s) anexado(s)
              </p>
            )}
          </div>

          {dados.ecg_files.length > 0 && (
            <div>
              <Label>Data e Hora da Realização do ECG *</Label>
              <Input
                type="datetime-local"
                value={dados.data_hora_ecg}
                onChange={(e) => setDados(prev => ({...prev, data_hora_ecg: e.target.value}))}
                required
              />
              
              {tempoEntradaEcg !== null && (
                <Alert className={`mt-3 ${tempoEntradaEcg <= 10 ? 'bg-green-50 border-green-300' : 'bg-orange-50 border-orange-300'}`}>
                  <AlertDescription className={tempoEntradaEcg <= 10 ? 'text-green-800' : 'text-orange-800'}>
                    <strong>Tempo Entrada → ECG:</strong> {tempoEntradaEcg} minutos
                    {tempoEntradaEcg <= 10 ? ' ✓ Dentro da meta' : ' ⚠ Acima da meta de 10 minutos'}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        {/* Alterações ECG */}
        {dados.ecg_files.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <Label className="text-base font-semibold mb-3 block">Alterações Eletrocardiográficas</Label>
            <div className="space-y-2">
              {alteracoesEcgOptions.map((alteracao) => (
                <div key={alteracao} className="flex items-start gap-3">
                  <Checkbox
                    checked={dados.alteracoes_ecg.includes(alteracao)}
                    onCheckedChange={() => toggleAlteracao(alteracao)}
                  />
                  <Label className="font-normal cursor-pointer">{alteracao}</Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Classificação SCA */}
      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-4">Classificação da Síndrome Coronariana Aguda</h3>
        <Label className="mb-3 block">Conforme Triagem Médica Cardiológica, assinale: *</Label>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-white rounded border-2 hover:border-red-400 cursor-pointer">
            <input
              type="radio"
              name="tipo_sca"
              value="SCACESST"
              checked={dados.tipo_sca === "SCACESST"}
              onChange={(e) => setDados(prev => ({...prev, tipo_sca: e.target.value}))}
              className="w-5 h-5"
            />
            <Label className="cursor-pointer flex-1">
              <strong>A) SCACESST</strong> - Síndrome Coronariana Aguda COM Supra de ST
            </Label>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white rounded border-2 hover:border-red-400 cursor-pointer">
            <input
              type="radio"
              name="tipo_sca"
              value="SCASESST_COM_TROPONINA"
              checked={dados.tipo_sca === "SCASESST_COM_TROPONINA"}
              onChange={(e) => setDados(prev => ({...prev, tipo_sca: e.target.value}))}
              className="w-5 h-5"
            />
            <Label className="cursor-pointer flex-1">
              <strong>B) SCASESST COM Troponina</strong> - SEM Supra de ST e COM exame de Troponina Quantitativa
            </Label>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white rounded border-2 hover:border-red-400 cursor-pointer">
            <input
              type="radio"
              name="tipo_sca"
              value="SCASESST_SEM_TROPONINA"
              checked={dados.tipo_sca === "SCASESST_SEM_TROPONINA"}
              onChange={(e) => setDados(prev => ({...prev, tipo_sca: e.target.value}))}
              className="w-5 h-5"
            />
            <Label className="cursor-pointer flex-1">
              <strong>C) SCASESST SEM Troponina</strong> - SEM Supra de ST e SEM exame de Troponina Quantitativa
            </Label>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onAnterior}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Etapa Anterior
        </Button>
        <Button type="submit" className="bg-red-600 hover:bg-red-700">
          Próxima Etapa
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}