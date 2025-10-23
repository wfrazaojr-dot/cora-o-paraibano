import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, Upload, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { differenceInMinutes } from "date-fns";

export default function Etapa3DadosVitais({ dadosPaciente, onProxima, onAnterior }) {
  const [dados, setDados] = useState(dadosPaciente.dados_vitais || {
    pa_braco_esquerdo: "",
    pa_braco_direito: "",
    frequencia_cardiaca: "",
    frequencia_respiratoria: "",
    temperatura: "",
    spo2: "",
    diabetes: false,
    dpoc: false,
    glicemia_capilar: ""
  });

  const [ecgFiles, setEcgFiles] = useState(dadosPaciente.ecg_files || []);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analiseEcg, setAnaliseEcg] = useState(dadosPaciente.analise_ecg_ia || "");

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      
      const novosFiles = [...ecgFiles, ...urls].slice(0, 3);
      setEcgFiles(novosFiles);

      const dataHoraEcg = new Date().toISOString();
      const tempoMinutos = dadosPaciente.data_hora_inicio_triagem 
        ? differenceInMinutes(new Date(dataHoraEcg), new Date(dadosPaciente.data_hora_inicio_triagem))
        : 0;

      setAnalyzing(true);
      
      try {
        // Tentar usar ExtractDataFromUploadedFile com schema estruturado
        const ecgSchema = {
          type: "object",
          properties: {
            ritmo: { type: "string", description: "Tipo de ritmo cardíaco identificado" },
            frequencia_cardiaca: { type: "number", description: "Frequência cardíaca em bpm" },
            intervalo_pr: { type: "number", description: "Intervalo PR em ms" },
            duracao_qrs: { type: "number", description: "Duração do complexo QRS em ms" },
            intervalo_qt: { type: "number", description: "Intervalo QT em ms" },
            segmento_st_elevado: { type: "boolean", description: "Se há elevação do segmento ST" },
            derivacoes_st_elevado: { type: "string", description: "Derivações com elevação de ST" },
            segmento_st_deprimido: { type: "boolean", description: "Se há depressão do segmento ST" },
            derivacoes_st_deprimido: { type: "string", description: "Derivações com depressão de ST" },
            ondas_t_invertidas: { type: "boolean", description: "Se há inversão de ondas T" },
            ondas_q_patologicas: { type: "boolean", description: "Se há ondas Q patológicas" },
            bloqueio_ramo: { type: "string", description: "Tipo de bloqueio de ramo se presente" },
            interpretacao: { type: "string", description: "Interpretação geral do traçado" },
            alerta_iam: { type: "boolean", description: "Se há suspeita de IAM" }
          }
        };

        const resultado = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: novosFiles[0],
          json_schema: ecgSchema
        });

        if (resultado.status === "success" && resultado.output) {
          const dados = resultado.output;
          
          let relatorio = `═══════════════════════════════════════════════════════════════
ANÁLISE AUTOMATIZADA DE ECG
═══════════════════════════════════════════════════════════════

1. RITMO E FREQUÊNCIA
   - Ritmo: ${dados.ritmo || "Não identificado"}
   - Frequência Cardíaca: ${dados.frequencia_cardiaca || "N/A"} bpm

2. INTERVALOS
   - Intervalo PR: ${dados.intervalo_pr || "N/A"} ms (normal: 120-200ms)
   - Duração QRS: ${dados.duracao_qrs || "N/A"} ms (normal: <120ms)
   - Intervalo QT: ${dados.intervalo_qt || "N/A"} ms

3. SEGMENTO ST - ANÁLISE CRÍTICA
   ${dados.segmento_st_elevado ? `
   ⚠️⚠️⚠️ ELEVAÇÃO DO SEGMENTO ST IDENTIFICADA ⚠️⚠️⚠️
   - Derivações com elevação: ${dados.derivacoes_st_elevado}
   - POSSÍVEL IAMCSST (IAM COM SUPRA DE ST)
   ` : "   - Sem elevação significativa do segmento ST"}
   
   ${dados.segmento_st_deprimido ? `
   - Depressão do ST em: ${dados.derivacoes_st_deprimido}
   - Possível isquemia subendocárdica
   ` : ""}

4. ONDAS T
   ${dados.ondas_t_invertidas ? "- Inversão de ondas T identificada" : "- Ondas T sem alterações significativas"}

5. ONDAS Q
   ${dados.ondas_q_patologicas ? "- Ondas Q patológicas presentes" : "- Sem ondas Q patológicas"}

6. BLOQUEIOS
   ${dados.bloqueio_ramo ? `- ${dados.bloqueio_ramo}` : "- Sem bloqueios identificados"}

═══════════════════════════════════════════════════════════════
INTERPRETAÇÃO
═══════════════════════════════════════════════════════════════

${dados.interpretacao || "Análise em andamento"}

${dados.alerta_iam ? `
🚨🚨🚨 ALERTA DE EMERGÊNCIA 🚨🚨🚨

POSSÍVEL INFARTO AGUDO DO MIOCÁRDIO (IAM)
Conduta urgente necessária!
` : ""}

═══════════════════════════════════════════════════════════════
⚠️ AVISO IMPORTANTE
═══════════════════════════════════════════════════════════════
Esta é uma análise automatizada auxiliar. Todo ECG deve ser 
interpretado por profissional médico qualificado antes de 
qualquer decisão clínica.
═══════════════════════════════════════════════════════════════`;

          setAnaliseEcg(relatorio);
        } else {
          throw new Error("Falha na extração");
        }

      } catch (error) {
        console.error("Erro na análise automática:", error);
        
        // Fallback: criar relatório estruturado para preenchimento manual
        setAnaliseEcg(`═══════════════════════════════════════════════════════════════
ECG ANEXADO COM SUCESSO
═══════════════════════════════════════════════════════════════

${novosFiles.length} arquivo(s) de ECG carregado(s).
Tempo desde triagem: ${tempoMinutos} minutos

⚠️ Análise automática não disponível no momento.

═══════════════════════════════════════════════════════════════
CHECKLIST PARA INTERPRETAÇÃO MANUAL DO ECG
═══════════════════════════════════════════════════════════════

O médico deve avaliar:

1️⃣ RITMO E FREQUÊNCIA
   □ Ritmo sinusal / FA / Flutter / Outro: __________
   □ Frequência cardíaca: ______ bpm
   □ Regular / Irregular

2️⃣ INTERVALOS
   □ PR: ______ ms (normal 120-200ms)
   □ QRS: ______ ms (normal <120ms)
   □ QT/QTc: ______ ms

3️⃣ ⚠️ SEGMENTO ST (CRÍTICO)
   □ ELEVAÇÃO ST ≥1mm em 2+ derivações?: SIM □ NÃO □
   □ Se SIM, derivações: __________________
   □ DEPRESSÃO ST?: SIM □ NÃO □
   □ Derivações: __________________

4️⃣ ONDAS T
   □ Inversão de T?: SIM □ NÃO □
   □ Derivações: __________________

5️⃣ ONDAS Q PATOLÓGICAS
   □ Presentes?: SIM □ NÃO □
   □ Localização: __________________

6️⃣ BLOQUEIOS
   □ BRD / BRE / BAV: __________________

═══════════════════════════════════════════════════════════════
🚨 SE HOUVER SUPRA ST ≥1mm EM 2+ DERIVAÇÕES CONTÍGUAS:
   → SUSPEITA DE IAMCSST
   → AÇÃO IMEDIATA NECESSÁRIA
═══════════════════════════════════════════════════════════════

LOCALIZAÇÃO DO IAM POR DERIVAÇÕES:
- V1-V4: Parede anterior (DAE)
- II, III, aVF: Parede inferior (CD)
- I, aVL, V5-V6: Parede lateral (Cx)

═══════════════════════════════════════════════════════════════
Meta de tempo: ECG realizado em ${tempoMinutos} min ${tempoMinutos <= 10 ? '✓' : '⚠️'}
═══════════════════════════════════════════════════════════════`);
      }

    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao anexar ECG. Tente novamente.");
    }
    
    setUploading(false);
    setAnalyzing(false);
  };

  const getGlicemiaStatus = () => {
    const glicemia = parseFloat(dados.glicemia_capilar);
    if (!glicemia || isNaN(glicemia)) return null;

    if (dados.diabetes) {
      if (glicemia < 70 || glicemia > 400) {
        return { 
          texto: "Valores críticos: < 70 ou > 400 mg/dL (requer correção imediata)", 
          cor: "text-red-600 font-semibold",
          bg: "bg-red-50 border-red-300"
        };
      } else if (glicemia >= 80 && glicemia <= 180) {
        return { 
          texto: "Valores aceitáveis: 80 a 180 mg/dL (meta de glicemia)", 
          cor: "text-green-600 font-semibold",
          bg: "bg-green-50 border-green-300"
        };
      } else {
        return { 
          texto: "Valores aceitáveis: 80 a 180 mg/dL (meta de glicemia) - Fora da meta ideal", 
          cor: "text-orange-600 font-semibold",
          bg: "bg-orange-50 border-orange-300"
        };
      }
    } else {
      if (glicemia < 60 || glicemia > 400) {
        return { 
          texto: "Valores críticos: < 60 ou > 400 mg/dL", 
          cor: "text-red-600 font-semibold",
          bg: "bg-red-50 border-red-300"
        };
      } else {
        return { 
          texto: "Valores aceitáveis: 70 a 400 mg/dL", 
          cor: "text-green-600 font-semibold",
          bg: "bg-green-50 border-green-300"
        };
      }
    }
  };

  const getSpo2Status = () => {
    const spo2 = parseFloat(dados.spo2);
    if (!spo2 || isNaN(spo2)) return null;

    if (dados.dpoc) {
      if (spo2 >= 88 && spo2 <= 92) {
        return { 
          texto: "SpO2 Alvo DPOC: 88% a 92% - Dentro da meta", 
          cor: "text-green-600 font-semibold",
          bg: "bg-green-50 border-green-300"
        };
      } else {
        return { 
          texto: "SpO2 Alvo DPOC: 88% a 92% - Fora da meta", 
          cor: "text-orange-600 font-semibold",
          bg: "bg-orange-50 border-orange-300"
        };
      }
    } else {
      if (spo2 >= 92 && spo2 <= 96) {
        return { 
          texto: "SpO2 Alvo: 92% a 96% - Dentro da meta", 
          cor: "text-green-600 font-semibold",
          bg: "bg-green-50 border-green-300"
        };
      } else {
        return { 
          texto: "SpO2 Alvo: 92% a 96% - Fora da meta", 
          cor: "text-orange-600 font-semibold",
          bg: "bg-orange-50 border-orange-300"
        };
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (ecgFiles.length === 0) {
      alert("Por favor, anexe pelo menos um arquivo de ECG");
      return;
    }
    
    const dataHoraEcg = dadosPaciente.data_hora_ecg || new Date().toISOString();
    const tempoMinutos = dadosPaciente.tempo_triagem_ecg_minutos || (dadosPaciente.data_hora_inicio_triagem 
      ? differenceInMinutes(new Date(dataHoraEcg), new Date(dadosPaciente.data_hora_inicio_triagem))
      : 0);
    
    onProxima({ 
      dados_vitais: dados,
      ecg_files: ecgFiles,
      data_hora_ecg: dataHoraEcg, 
      tempo_triagem_ecg_minutos: tempoMinutos,
      analise_ecg_ia: analiseEcg
    });
  };

  const tempoTriagemEcg = dadosPaciente.tempo_triagem_ecg_minutos;

  const temAlertaIAM = analiseEcg && (
    analiseEcg.includes("IAMCSST") || 
    analiseEcg.includes("IAM COM SUPRA") ||
    analiseEcg.includes("POSSÍVEL IAMCSST") ||
    analiseEcg.includes("POSSÍVEL INFARTO") ||
    analiseEcg.toUpperCase().includes("ELEVAÇÃO DO SEGMENTO ST") ||
    analiseEcg.includes("ALERTA DE EMERGÊNCIA")
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dados Vitais e ECG</h2>
        <p className="text-gray-600">Registre os sinais vitais e anexe o eletrocardiograma</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="pa_esquerdo">PA Braço Esquerdo (mmHg)</Label>
          <Input
            id="pa_esquerdo"
            placeholder="Ex: 120/80"
            value={dados.pa_braco_esquerdo}
            onChange={(e) => setDados({...dados, pa_braco_esquerdo: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pa_direito">PA Braço Direito (mmHg)</Label>
          <Input
            id="pa_direito"
            placeholder="Ex: 120/80"
            value={dados.pa_braco_direito}
            onChange={(e) => setDados({...dados, pa_braco_direito: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fc">Frequência Cardíaca (bpm)</Label>
          <Input
            id="fc"
            type="number"
            placeholder="Ex: 75"
            value={dados.frequencia_cardiaca}
            onChange={(e) => setDados({...dados, frequencia_cardiaca: parseFloat(e.target.value)})}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fr">Frequência Respiratória (irpm)</Label>
          <Input
            id="fr"
            type="number"
            placeholder="Ex: 16"
            value={dados.frequencia_respiratoria}
            onChange={(e) => setDados({...dados, frequencia_respiratoria: parseFloat(e.target.value)})}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="temp">Temperatura (°C)</Label>
          <Input
            id="temp"
            type="number"
            step="0.1"
            placeholder="Ex: 36.5"
            value={dados.temperatura}
            onChange={(e) => setDados({...dados, temperatura: parseFloat(e.target.value)})}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="spo2">SpO2 (%)</Label>
          <Input
            id="spo2"
            type="number"
            placeholder="Ex: 98"
            value={dados.spo2}
            onChange={(e) => setDados({...dados, spo2: parseFloat(e.target.value)})}
          />
          {getSpo2Status() && (
            <div className={`text-sm p-3 rounded border ${getSpo2Status().bg}`}>
              <p className={getSpo2Status().cor}>
                {getSpo2Status().texto}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label>Diabetes</Label>
          <RadioGroup
            value={dados.diabetes ? "sim" : "nao"}
            onValueChange={(v) => setDados({...dados, diabetes: v === "sim"})}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim" id="diabetes-sim" />
              <Label htmlFor="diabetes-sim" className="cursor-pointer">SIM</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao" id="diabetes-nao" />
              <Label htmlFor="diabetes-nao" className="cursor-pointer">NÃO</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label>DPOC</Label>
          <RadioGroup
            value={dados.dpoc ? "sim" : "nao"}
            onValueChange={(v) => setDados({...dados, dpoc: v === "sim"})}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim" id="dpoc-sim" />
              <Label htmlFor="dpoc-sim" className="cursor-pointer">SIM</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao" id="dpoc-nao" />
              <Label htmlFor="dpoc-nao" className="cursor-pointer">NÃO</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="glicemia">Glicemia Capilar (mg/dL)</Label>
        <Input
          id="glicemia"
          type="number"
          placeholder="Ex: 110"
          value={dados.glicemia_capilar}
          onChange={(e) => setDados({...dados, glicemia_capilar: parseFloat(e.target.value)})}
        />
        {getGlicemiaStatus() && (
          <div className={`text-sm p-3 rounded border ${getGlicemiaStatus().bg}`}>
            <p className={getGlicemiaStatus().cor}>
              {getGlicemiaStatus().texto}
            </p>
          </div>
        )}
      </div>

      <div className="border-t pt-6">
        <Label className="text-lg font-semibold mb-3 block">Anexar ECG (até 3 arquivos)</Label>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*,.pdf"
              capture="environment"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="ecg-upload"
              disabled={uploading || ecgFiles.length >= 3}
            />
            <label
              htmlFor="ecg-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              {uploading ? (
                <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-2" />
              ) : (
                <Upload className="w-12 h-12 text-gray-400 mb-2" />
              )}
              <p className="text-sm font-medium text-gray-700">
                {uploading ? "Carregando..." : "Clique para anexar ECG ou tirar foto"}
              </p>
              <p className="text-xs text-gray-500 mt-1">PDF ou Imagem (câmera disponível em smartphones)</p>
            </label>
          </div>

          {ecgFiles.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium">Arquivos anexados: {ecgFiles.length}/3</p>
              {ecgFiles.map((url, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                  <Badge className="bg-green-600">ECG {index + 1}</Badge>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                    Ver arquivo
                  </a>
                </div>
              ))}
              {tempoTriagemEcg !== undefined && (
                <Alert className={tempoTriagemEcg <= 10 ? "border-green-500 bg-green-50" : "border-orange-500 bg-orange-50"}>
                  <AlertCircle className={`h-4 w-4 ${tempoTriagemEcg <= 10 ? "text-green-600" : "text-orange-600"}`} />
                  <AlertDescription className={tempoTriagemEcg <= 10 ? "text-green-800" : "text-orange-800"}>
                    Tempo entre triagem e ECG: <strong>{tempoTriagemEcg} minutos</strong>
                    {tempoTriagemEcg <= 10 ? " ✓ Dentro da meta" : " ⚠️ Acima da meta de 10 minutos"}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {analyzing && (
            <Alert className="border-blue-500 bg-blue-50">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <AlertDescription className="text-blue-800">
                Processando análise do ECG... Aguarde...
              </AlertDescription>
            </Alert>
          )}

          {temAlertaIAM && (
            <Alert className="border-red-500 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 font-semibold">
                🚨 ALERTA: Possível alteração compatível com IAM detectada!
                <br />
                Revise a análise completa abaixo.
              </AlertDescription>
            </Alert>
          )}

          {analiseEcg && (
            <div className="border-l-4 border-l-blue-600 bg-blue-50 p-4 rounded">
              <h4 className="font-semibold text-blue-900 mb-2">📊 Análise de ECG:</h4>
              <pre className="text-sm text-blue-800 whitespace-pre-wrap font-sans">{analiseEcg}</pre>
              <p className="text-xs text-blue-600 mt-3 italic">
                ⚠️ Esta análise é auxiliar. Todo ECG deve ser interpretado por médico qualificado.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onAnterior}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={ecgFiles.length === 0}>
          Próxima Etapa
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}