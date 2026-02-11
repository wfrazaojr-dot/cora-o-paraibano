import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, Activity, FileText, Upload, X, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format, differenceInMinutes } from "date-fns";

export default function Etapa2TriagemMedica({ dadosPaciente, onProxima, onAnterior, modoLeitura = false, permitirNavegacao = false }) {
  const [uploadingECG, setUploadingECG] = useState(false);
  const [dados, setDados] = useState({
    medico_nome: dadosPaciente.triagem_medica?.medico_nome || "",
    medico_crm: dadosPaciente.triagem_medica?.medico_crm || "",
    pa_braco_esquerdo: dadosPaciente.triagem_medica?.pa_braco_esquerdo || "",
    pa_braco_direito: dadosPaciente.triagem_medica?.pa_braco_direito || "",
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
    alteracoes_ecg: dadosPaciente.triagem_medica?.alteracoes_ecg || [],
    tipo_sca: dadosPaciente.triagem_medica?.tipo_sca || ""
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
        litros_oxigenio: dados.uso_oxigenio && dados.litros_oxigenio ? parseFloat(dados.litros_oxigenio) : undefined,
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
            <Label>Pressão Arterial Braço Esquerdo (mmHg) *</Label>
            <Input
              type="text"
              value={dados.pa_braco_esquerdo}
              onChange={(e) => setDados(prev => ({...prev, pa_braco_esquerdo: e.target.value}))}
              placeholder="Ex: 120/80"
              required
            />
          </div>

          <div>
            <Label>Pressão Arterial Braço Direito (mmHg) *</Label>
            <Input
              type="text"
              value={dados.pa_braco_direito}
              onChange={(e) => setDados(prev => ({...prev, pa_braco_direito: e.target.value}))}
              placeholder="Ex: 120/80"
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
            
            {dados.diferenca_pa_mse_msd === "Sim" && (
              <Alert className="mt-3 bg-red-100 border-red-400">
                <AlertTriangle className="h-5 w-5 text-red-700" />
                <AlertDescription className="text-red-800 font-bold text-lg">
                  ⚠️ DESCARTAR DAA (Dissecção Aguda de Aorta)
                </AlertDescription>
              </Alert>
            )}
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

          <div className="md:col-span-2">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={dados.dpoc}
                onCheckedChange={(checked) => setDados(prev => ({...prev, dpoc: checked}))}
              />
              <Label>DPOC</Label>
            </div>
          </div>

          <div className="md:col-span-2">
            <Label>SpO2 (%) *</Label>
            <Input
              type="number"
              value={dados.spo2}
              onChange={(e) => setDados(prev => ({...prev, spo2: parseInt(e.target.value) || ""}))}
              required
            />
            {dados.spo2 && (
              <Alert className={`mt-2 ${
                dados.dpoc 
                  ? (dados.spo2 >= 88 && dados.spo2 <= 92 ? 'bg-green-50 border-green-300' : 'bg-orange-50 border-orange-300')
                  : (dados.spo2 >= 92 && dados.spo2 <= 96 ? 'bg-green-50 border-green-300' : 'bg-orange-50 border-orange-300')
              }`}>
                <AlertDescription className={
                  dados.dpoc 
                    ? (dados.spo2 >= 88 && dados.spo2 <= 92 ? 'text-green-800' : 'text-orange-800')
                    : (dados.spo2 >= 92 && dados.spo2 <= 96 ? 'text-green-800' : 'text-orange-800')
                }>
                  <strong>SpO2 Alvo {dados.dpoc ? 'DPOC' : ''}:</strong> {dados.dpoc ? '88% a 92%' : '92% a 96%'}
                </AlertDescription>
              </Alert>
            )}
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
                <Label>Litros de O2 por minuto (L/min) *</Label>
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

          <div className="md:col-span-2">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={dados.diabetes}
                onCheckedChange={(checked) => setDados(prev => ({...prev, diabetes: checked}))}
              />
              <Label>Diabetes</Label>
            </div>
          </div>

          <div className="md:col-span-2">
            <Label>Glicemia Capilar (mg/dL) *</Label>
            <Input
              type="number"
              value={dados.glicemia_capilar}
              onChange={(e) => setDados(prev => ({...prev, glicemia_capilar: parseInt(e.target.value) || ""}))}
              required
            />
            {dados.glicemia_capilar && (
              <div className="mt-2 space-y-1">
                {dados.diabetes ? (
                  <>
                    <Alert className={`${
                      (dados.glicemia_capilar < 70 || dados.glicemia_capilar > 400) 
                        ? 'bg-red-100 border-red-400' 
                        : (dados.glicemia_capilar >= 80 && dados.glicemia_capilar <= 200)
                        ? 'bg-green-50 border-green-300'
                        : 'bg-orange-50 border-orange-300'
                    }`}>
                      <AlertDescription className={
                        (dados.glicemia_capilar < 70 || dados.glicemia_capilar > 400) 
                          ? 'text-red-800 font-bold' 
                          : (dados.glicemia_capilar >= 80 && dados.glicemia_capilar <= 200)
                          ? 'text-green-800'
                          : 'text-orange-800'
                      }>
                        {(dados.glicemia_capilar < 70 || dados.glicemia_capilar > 400) && (
                          <>⚠️ <strong>Valores críticos:</strong> &lt; 70 ou &gt; 400 mg/dL (requer correção imediata)</>
                        )}
                        {(dados.glicemia_capilar >= 70 && dados.glicemia_capilar <= 400) && (
                          <><strong>Meta de glicemia:</strong> 80 a 200 mg/dL</>
                        )}
                      </AlertDescription>
                    </Alert>
                  </>
                ) : (
                  <>
                    <Alert className={`${
                      (dados.glicemia_capilar < 70 || dados.glicemia_capilar > 200) 
                        ? 'bg-red-100 border-red-400' 
                        : 'bg-green-50 border-green-300'
                    }`}>
                      <AlertDescription className={
                        (dados.glicemia_capilar < 70 || dados.glicemia_capilar > 200) 
                          ? 'text-red-800 font-bold' 
                          : 'text-green-800'
                      }>
                        {(dados.glicemia_capilar < 70 || dados.glicemia_capilar > 200) ? (
                          <>⚠️ <strong>Valores críticos:</strong> &lt; 70 ou &gt; 200 mg/dL</>
                        ) : (
                          <><strong>Valores aceitáveis:</strong> 70 a 200 mg/dL</>
                        )}
                      </AlertDescription>
                    </Alert>
                  </>
                )}
              </div>
            )}
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
              <div key={index} className="border-2 border-yellow-200 rounded-lg overflow-hidden bg-white relative group">
                <button
                  onClick={() => removerECG(index)}
                  className="absolute top-2 right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                  title="Remover ECG"
                >
                  <X className="w-4 h-4" />
                </button>
                {fileUrl.toLowerCase().endsWith('.pdf') ? (
                  <div className="p-4 flex items-center gap-3">
                    <FileText className="w-8 h-8 text-yellow-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">ECG {index + 1}</p>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-yellow-600 hover:underline flex items-center gap-1"
                      >
                        Visualizar PDF <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="relative cursor-pointer" onClick={() => window.open(fileUrl, '_blank')}>
                    <img
                      src={fileUrl}
                      alt={`ECG ${index + 1}`}
                      className="w-full h-48 object-contain bg-gray-50"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                      <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                )}
              </div>
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