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
        // Método principal: Análise direta com visão de imagem
        const analise = await base44.integrations.Core.InvokeLLM({
          prompt: `Você é um cardiologista especialista e está interpretando um ELETROCARDIOGRAMA (ECG) de 12 derivações.

PACIENTE:
- Sexo: ${dadosPaciente.sexo}
- Idade: ${dadosPaciente.idade} anos
- Sintoma: Dor torácica

IMPORTANTE: Você DEVE analisar a imagem do traçado eletrocardiográfico que está sendo fornecida.

═══════════════════════════════════════════════════════════════
ANÁLISE AUTOMATIZADA DE ELETROCARDIOGRAMA
═══════════════════════════════════════════════════════════════

Por favor, analise CUIDADOSAMENTE o traçado e forneça um relatório COMPLETO:

1️⃣ RITMO E FREQUÊNCIA CARDÍACA
   - Identifique o ritmo (sinusal, FA, flutter, etc.)
   - Conte a frequência cardíaca em bpm
   - Avalie regularidade

2️⃣ INTERVALOS (meça no traçado):
   - Intervalo PR: ____ ms (normal 120-200ms)
   - Complexo QRS: ____ ms (normal <120ms)
   - Intervalo QT: ____ ms
   - QTc corrigido: ____ ms (normal <450ms homens, <460ms mulheres)

3️⃣ EIXO CARDÍACO
   - Determine o eixo QRS em graus
   - Normal / Desvio esquerda / Desvio direita

4️⃣ ⚠️⚠️⚠️ SEGMENTO ST - ANÁLISE CRÍTICA ⚠️⚠️⚠️

PROCURE CUIDADOSAMENTE POR:

A) SUPRADESNIVELAMENTO DO SEGMENTO ST (≥1mm):
   ▸ PRESENTE em alguma derivação? [SIM/NÃO]
   ▸ Se SIM, listar derivações: _______________
   ▸ Magnitude da elevação: ___ mm
   ▸ Morfologia: Côncava / Convexa / Retificada
   
   🚨 SE HOUVER SUPRA ST ≥1mm EM 2+ DERIVAÇÕES CONTÍGUAS:
      ⚠️⚠️⚠️ SUSPEITA DE IAMCSST (IAM COM SUPRA DE ST) ⚠️⚠️⚠️
      
   Localização do IAM:
   - V1-V4: Parede ANTERIOR (artéria descendente anterior)
   - II, III, aVF: Parede INFERIOR (artéria coronária direita)
   - I, aVL, V5-V6: Parede LATERAL (circunflexa)
   - V7-V9: Parede POSTERIOR
   - V3R-V4R: Ventrículo direito

B) INFRADESNIVELAMENTO DO SEGMENTO ST (≥1mm):
   ▸ Presente? [SIM/NÃO]
   ▸ Derivações: _______________
   ▸ Pode ser isquemia subendocárdica ou mudança recíproca

5️⃣ ONDAS T
   - Inversão de onda T? [SIM/NÃO] Em quais derivações?
   - Ondas T apiculadas (hipercalemia)?
   - Ondas T bifásicas (Síndrome de Wellens)?

6️⃣ ONDAS Q
   - Ondas Q patológicas (>40ms ou >1/3 do QRS)? [SIM/NÃO]
   - Localização: _______________
   - Sugere IAM prévio/em evolução

7️⃣ BLOQUEIOS DE CONDUÇÃO
   - Bloqueio de ramo direito (BRD)? [SIM/NÃO]
   - Bloqueio de ramo esquerdo (BRE)? [SIM/NÃO]
   - BAV 1º/2º/3º grau? [SIM/NÃO]

8️⃣ PADRÕES ESPECÍFICOS (marque se identificar):
   □ Síndrome de Wellens (ondas T invertidas V2-V3)
   □ Padrão de Winter (infra ST + ondas T altas)
   □ Critérios de Sgarbossa (IAM + BRE)
   □ Síndrome de Brugada (supra ST V1-V3)
   □ Pericardite aguda (supra ST difuso)
   □ Repolarização precoce benigna

═══════════════════════════════════════════════════════════════
🎯 CONCLUSÃO E INTERPRETAÇÃO FINAL
═══════════════════════════════════════════════════════════════

DIAGNÓSTICO PRINCIPAL SUGERIDO:
[Descreva o achado mais importante]

🚨 SE HOUVER IAMCSST:
⚠️⚠️⚠️ IAMCSST - ATIVAR PROTOCOLO DE REPERFUSÃO ⚠️⚠️⚠️
Localização: _______
Artéria envolvida: _______
AÇÃO URGENTE: Fibrinolítico ou ICP primária

DIAGNÓSTICOS DIFERENCIAIS:
1. _______________
2. _______________
3. _______________

CONDUTA SUGERIDA:
- Troponina seriada (0h e 1h ou 3h)
- [Outras condutas baseadas nos achados]

═══════════════════════════════════════════════════════════════
⚠️ NOTA: Esta é uma análise automatizada por IA. 
Todo ECG DEVE ser revisado por um médico qualificado.
═══════════════════════════════════════════════════════════════`,
          file_urls: novosFiles,
          add_context_from_internet: false
        });

        setAnaliseEcg(analise);

      } catch (error) {
        console.error("Erro na análise primária:", error);
        
        // Método alternativo: prompt simplificado
        try {
          const analiseAlternativa = await base44.integrations.Core.InvokeLLM({
            prompt: `Analise este ECG de paciente com dor torácica (${dadosPaciente.sexo}, ${dadosPaciente.idade} anos).

OLHE A IMAGEM e responda:

1. Frequência cardíaca: ___ bpm
2. Ritmo: ___________
3. Intervalo PR: ___ ms
4. QRS: ___ ms
5. QT: ___ ms

🚨 CRÍTICO - SEGMENTO ST:
- Há ELEVAÇÃO do ST ≥1mm? [SIM/NÃO]
- Em quais derivações? ___________
- Se SIM em 2+ derivações → ⚠️ SUSPEITA DE IAM

6. Infra ST presente? ___________
7. Ondas T invertidas? ___________
8. Ondas Q patológicas? ___________
9. Bloqueios? ___________

CONCLUSÃO:
[Normal / Alterações inespecíficas / Sugestivo de SCA / Sugestivo de IAM]

Se IAM: Localização _________ | Artéria _________

RECOMENDAÇÃO: ___________`,
            file_urls: novosFiles,
            add_context_from_internet: false
          });
          
          setAnaliseEcg(analiseAlternativa);
          
        } catch (error2) {
          console.error("Erro na análise alternativa:", error2);
          setAnaliseEcg(`⚠️ ANÁLISE AUTOMÁTICA NÃO DISPONÍVEL

ECG anexado com sucesso, porém a análise automatizada não pôde ser realizada neste momento.

AÇÃO NECESSÁRIA:
✓ ECG foi carregado e está disponível para visualização
✓ Médico deve interpretar manualmente o traçado
✓ Atenção especial para:
  - Supradesnivelamento do segmento ST (IAM)
  - Infradesnivelamento ST (isquemia)
  - Ondas T invertidas
  - Ondas Q patológicas
  - Bloqueios de condução

📋 PROTOCOLO MANUAL DE ANÁLISE:
1. Verificar ritmo e frequência
2. Medir intervalos PR, QRS, QT
3. Avaliar segmento ST em TODAS as derivações
4. Procurar alterações de onda T
5. Identificar ondas Q patológicas

${novosFiles.length} arquivo(s) de ECG disponível(is) para revisão médica.`);
        }
      }

    } catch (error) {
      console.error("Erro geral ao processar ECG:", error);
      alert("Erro ao processar ECG. Tente novamente.");
      setAnaliseEcg("Erro ao processar ECG. Por favor, tente anexar novamente.");
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
    analiseEcg.includes("SUPRADESNIVELAMENTO") ||
    analiseEcg.includes("SUSPEITA DE IAM")
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