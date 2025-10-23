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
      const analise = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um sistema de interpretação automatizada de ECG similar aos aparelhos com IA integrada (ex: GE MAC, Philips PageWriter, Mortara).

DADOS DO PACIENTE:
- Sexo: ${dadosPaciente.sexo}
- Idade: ${dadosPaciente.idade} anos

INSTRUÇÕES PARA ANÁLISE:

Analise o(s) traçado(s) de ECG fornecido(s) e forneça um relatório ESTRUTURADO seguindo este formato exato:

═══════════════════════════════════════
ANÁLISE AUTOMÁTICA DE ECG
═══════════════════════════════════════

1. RITMO E FREQUÊNCIA
   - Ritmo: [Sinusal / Fibrilação Atrial / Flutter Atrial / Outro]
   - Frequência Cardíaca: [valor] bpm
   - Regularidade: [Regular / Irregular]

2. INTERVALOS E ONDAS (em milissegundos)
   - Intervalo PR: [valor] ms [Normal: 120-200ms / Curto / Prolongado]
   - Duração QRS: [valor] ms [Normal: <120ms / Alargado se ≥120ms]
   - Intervalo QT: [valor] ms
   - QTc (corrigido): [valor] ms [Normal: <450ms homens, <460ms mulheres]
   - Onda P: [Presente/Ausente] [Morfologia]

3. EIXO CARDÍACO
   - Eixo QRS: [Normal / Desvio à esquerda / Desvio à direita / Eixo indeterminado]
   - Estimativa: [graus]

4. ⚠️ ANÁLISE DO SEGMENTO ST (CRÍTICO)
   - SUPRADESNIVELAMENTO (≥1mm em 2+ derivações contíguas):
     * Presente: [SIM/NÃO]
     * Localização: [Anterior/Inferior/Lateral/Septal/Não aplicável]
     * Derivações afetadas: [listar]
     * Magnitude: [em mm]
   
   - INFRADESNIVELAMENTO (≥1mm):
     * Presente: [SIM/NÃO]
     * Derivações: [listar]
     * Possível isquemia recíproca: [SIM/NÃO]

5. ALTERAÇÕES DA ONDA T
   - Ondas T invertidas: [SIM/NÃO] [Derivações]
   - Ondas T apiculadas: [SIM/NÃO]
   - Possível isquemia: [SIM/NÃO]

6. ONDAS Q PATOLÓGICAS
   - Presentes: [SIM/NÃO]
   - Localização: [Derivações]
   - Sugestão de IAM prévio: [SIM/NÃO]

7. BLOQUEIOS E DISTÚRBIOS DE CONDUÇÃO
   - Bloqueio de ramo direito: [SIM/NÃO]
   - Bloqueio de ramo esquerdo: [SIM/NÃO]
   - Bloqueio divisional: [SIM/NÃO]
   - Bloqueio AV: [Ausente / 1º grau / 2º grau / 3º grau]

8. HIPERTROFIAS
   - Hipertrofia ventricular esquerda: [SIM/NÃO] [Critérios]
   - Hipertrofia ventricular direita: [SIM/NÃO]
   - Crescimento atrial: [SIM/NÃO]

9. PADRÕES ESPECÍFICOS IDENTIFICADOS
   Marque se presente:
   □ Padrão de Wellens (ondas T bifásicas/invertidas em V2-V3)
   □ Síndrome de Winter (infraST com ondas T altas em precordiais)
   □ Critérios de Sgarbossa (IAM + BRE)
   □ Padrão de Brugada (elevação ST em V1-V3 com aspecto "corcova")
   □ Síndrome do QT longo
   □ Repolarização precoce benigna
   □ Pericardite (supra ST difuso + infraPR)

10. 🚨 CONCLUSÃO E ALERTA
    
    INTERPRETAÇÃO PRINCIPAL:
    [Descreva o achado mais importante]
    
    ⚠️ ALERTA DE EMERGÊNCIA:
    [Se houver SUPRADESNIVELAMENTO DO ST compatível com IAM]
    ⚠️⚠️⚠️ POSSÍVEL IAMCSST (IAM COM SUPRA DE ST) ⚠️⚠️⚠️
    Localização: [parede do coração afetada]
    Artéria provável: [coronária direita/descendente anterior/circunflexa]
    AÇÃO: Ativar protocolo de reperfusão IMEDIATAMENTE
    
    DIAGNÓSTICOS DIFERENCIAIS SUGERIDOS:
    1. [Diagnóstico mais provável]
    2. [Segunda possibilidade]
    3. [Terceira possibilidade]
    
    RECOMENDAÇÕES:
    - [Ações sugeridas baseadas nos achados]
    - [Exames complementares se necessário]
    - [Urgência da avaliação médica]

═══════════════════════════════════════

OBSERVAÇÃO IMPORTANTE: Esta é uma análise automatizada por IA e NÃO substitui a interpretação médica. Todo ECG deve ser revisado por um médico qualificado.

═══════════════════════════════════════`,
        file_urls: novosFiles,
      });

      setAnaliseEcg(analise);

    } catch (error) {
      console.error("Erro ao processar ECG:", error);
      alert("Erro ao processar ECG. Tente novamente.");
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

  // Verificar se há alerta de IAM na análise
  const temAlertaIAM = analiseEcg && (
    analiseEcg.includes("IAMCSST") || 
    analiseEcg.includes("IAM COM SUPRA DE ST") ||
    analiseEcg.includes("SUPRADESNIVELAMENTO")
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
                Analisando ECG com Inteligência Artificial... 
                <br />
                Avaliando intervalos PR, QT, QRS, segmento ST e ondas...
              </AlertDescription>
            </Alert>
          )}

          {temAlertaIAM && (
            <Alert className="border-red-500 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 font-semibold">
                🚨 ALERTA: IA detectou possível SUPRADESNIVELAMENTO do segmento ST compatível com IAM!
                <br />
                Revise a análise completa abaixo.
              </AlertDescription>
            </Alert>
          )}

          {analiseEcg && (
            <div className="border-l-4 border-l-blue-600 bg-blue-50 p-4 rounded">
              <h4 className="font-semibold text-blue-900 mb-2">📊 Análise Automatizada de ECG por IA:</h4>
              <pre className="text-sm text-blue-800 whitespace-pre-wrap font-sans">{analiseEcg}</pre>
              <p className="text-xs text-blue-600 mt-3 italic">
                ⚠️ Esta é uma análise automatizada e não substitui a interpretação médica
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