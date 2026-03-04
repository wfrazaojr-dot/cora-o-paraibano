import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, Activity, Upload, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format, differenceInMinutes } from "date-fns";
import VisualizadorECG from "./VisualizadorECG";

export default function Etapa2TriagemMedica({ dadosPaciente, onProxima, onAnterior, modoLeitura = false, permitirNavegacao = false }) {
  const [uploadingECG, setUploadingECG] = useState(false);
  const [dados, setDados] = useState({
    medico_nome: dadosPaciente.triagem_medica?.medico_nome || "",
    medico_crm: dadosPaciente.triagem_medica?.medico_crm || "",
    pa_braco_esquerdo: dadosPaciente.triagem_medica?.pa_braco_esquerdo || "",
    pa_braco_direito: dadosPaciente.triagem_medica?.pa_braco_direito || "",
    frequencia_cardiaca: dadosPaciente.triagem_medica?.frequencia_cardiaca || "",
    frequencia_respiratoria: dadosPaciente.triagem_medica?.frequencia_respiratoria || "",
    temperatura: dadosPaciente.triagem_medica?.temperatura || "",
    spo2: dadosPaciente.triagem_medica?.spo2 || "",
    diabetes: dadosPaciente.triagem_medica?.diabetes || false,
    dpoc: dadosPaciente.triagem_medica?.dpoc || false,
    glicemia_capilar: dadosPaciente.triagem_medica?.glicemia_capilar || "",
    ecg_files: dadosPaciente.triagem_medica?.ecg_files || [],
    alteracoes_ecg: dadosPaciente.triagem_medica?.alteracoes_ecg || [],
    tipo_sca: dadosPaciente.triagem_medica?.tipo_sca || "",
    fatores_risco: dadosPaciente.triagem_medica?.fatores_risco || [],
    historia_clinica: dadosPaciente.triagem_medica?.historia_clinica || "",
    ecg_classificacao: dadosPaciente.triagem_medica?.ecg_classificacao || ""
  });



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

  const handleUploadECG = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingECG(true);
    try {
      const uploadedUrls = [];
      for (let i = 0; i < files.length; i++) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: files[i] });
        uploadedUrls.push(file_url);
      }
      setDados(prev => ({
        ...prev,
        ecg_files: [...prev.ecg_files, ...uploadedUrls]
      }));
    } catch (error) {
      alert("Erro ao enviar arquivo(s) de ECG");
    } finally {
      setUploadingECG(false);
    }
  };

  const removerECG = (index) => {
    setDados(prev => ({
      ...prev,
      ecg_files: prev.ecg_files.filter((_, i) => i !== index)
    }));
  };

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
        data_hora_inicio: dadosPaciente.data_hora_chegada
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
            <Label>PA Braço Esquerdo (mmHg) *</Label>
            <Input
              type="text"
              value={dados.pa_braco_esquerdo}
              onChange={(e) => setDados(prev => ({...prev, pa_braco_esquerdo: e.target.value}))}
              placeholder="Ex: 120/80"
              required
            />
          </div>

          <div>
            <Label>PA Braço Direito (mmHg) *</Label>
            <Input
              type="text"
              value={dados.pa_braco_direito}
              onChange={(e) => setDados(prev => ({...prev, pa_braco_direito: e.target.value}))}
              placeholder="Ex: 120/80"
              required
            />
          </div>

          <div>
            <Label>FC - Frequência Cardíaca (bpm) *</Label>
            <Input
              type="number"
              value={dados.frequencia_cardiaca}
              onChange={(e) => setDados(prev => ({...prev, frequencia_cardiaca: parseInt(e.target.value) || ""}))}
              required
            />
          </div>

          <div>
            <Label>FR - Frequência Respiratória (irpm) *</Label>
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

          <div>
            <Label>Glicemia Capilar (mg/dL) *</Label>
            <Input
              type="number"
              value={dados.glicemia_capilar}
              onChange={(e) => setDados(prev => ({...prev, glicemia_capilar: parseInt(e.target.value) || ""}))}
              required
            />
          </div>


        </div>
      </div>

      {/* Upload e Visualização ECG */}
      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-4">Eletrocardiograma (ECG)</h3>
        
        {/* Upload de ECG */}
        <div className="mb-4">
          <label className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-yellow-300 rounded-lg cursor-pointer hover:bg-yellow-50 transition-colors w-fit">
            <Upload className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-700">
              {uploadingECG ? "Enviando..." : "Adicionar ECG"}
            </span>
            <input
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={handleUploadECG}
              disabled={uploadingECG}
              className="hidden"
            />
          </label>
        </div>

        {dados.ecg_files.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {dados.ecg_files.map((fileUrl, index) => (
              <VisualizadorECG 
                key={index}
                fileUrl={fileUrl}
                index={index}
                onRemover={removerECG}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-600">Nenhum ECG anexado. Adicione arquivos de ECG acima.</p>
        )}

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

      {/* Fatores de Risco */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-orange-900 mb-4">Fatores de Risco</h3>
        <div className="grid md:grid-cols-2 gap-2">
          {[
            "Hipertensão",
            "Diabetes",
            "Tabagismo atual",
            "Obesidade",
            "Colesterol alto",
            "Histórico familiar de doença coronariana"
          ].map((fator) => (
            <div key={fator} className="flex items-center gap-2">
              <Checkbox
                checked={dados.fatores_risco.includes(fator)}
                onCheckedChange={(checked) => setDados(prev => ({
                  ...prev,
                  fatores_risco: checked
                    ? [...prev.fatores_risco, fator]
                    : prev.fatores_risco.filter(f => f !== fator)
                }))}
                disabled={modoLeitura}
              />
              <Label className="font-normal">{fator}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* História Clínica */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-teal-900 mb-4">História Clínica</h3>
        <div className="space-y-2">
          {[
            "Pouco suspeita ou dor claramente muscular ou de outra causa",
            "Moderadamente suspeita",
            "Altamente suspeita: dor em aperto, irradiação para o braço, sudorese"
          ].map((opcao) => (
            <div key={opcao} className="flex items-center gap-3 p-3 bg-white rounded border-2 hover:border-teal-400 cursor-pointer">
              <input
                type="radio"
                name="historia_clinica"
                value={opcao}
                checked={dados.historia_clinica === opcao}
                onChange={(e) => setDados(prev => ({...prev, historia_clinica: e.target.value}))}
                disabled={modoLeitura}
                className="w-5 h-5"
              />
              <Label className="cursor-pointer flex-1 font-normal">{opcao}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* ECG - Classificação */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-indigo-900 mb-4">Eletrocardiograma - ECG</h3>
        <div className="space-y-2">
          {[
            "Normal",
            "Alteração inespecífica da repolarização",
            "Depressão significativa do segmento ST"
          ].map((opcao) => (
            <div key={opcao} className="flex items-center gap-3 p-3 bg-white rounded border-2 hover:border-indigo-400 cursor-pointer">
              <input
                type="radio"
                name="ecg_classificacao"
                value={opcao}
                checked={dados.ecg_classificacao === opcao}
                onChange={(e) => setDados(prev => ({...prev, ecg_classificacao: e.target.value}))}
                disabled={modoLeitura}
                className="w-5 h-5"
              />
              <Label className="cursor-pointer flex-1 font-normal">{opcao}</Label>
            </div>
          ))}
        </div>
      </div>

      {modoLeitura && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
          <p className="text-blue-900 font-semibold text-center">
            ℹ️ Modo Visualização: Os dados desta etapa não podem ser modificados
          </p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onAnterior}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Etapa Anterior
        </Button>
        {!modoLeitura ? (
          <Button type="submit" className="bg-red-600 hover:bg-red-700">
            Próxima Etapa
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : permitirNavegacao ? (
          <Button type="button" onClick={() => onProxima({}, true)} className="bg-blue-600 hover:bg-blue-700">
            Próxima Etapa
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : null}
      </div>
    </form>
  );
}