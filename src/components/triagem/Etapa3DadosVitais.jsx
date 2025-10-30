
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
    spo2_oxigenio: "ar_ambiente",
    spo2_litros_o2: "",
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
        const ecgSchema = {
          type: "object",
          properties: {
            ritmo: { 
              type: "string", 
              description: "Tipo de ritmo cardíaco: Sinusal, Fibrilação Atrial, Flutter, Taquicardia, Bradicardia, etc." 
            },
            frequencia_cardiaca: { 
              type: "number", 
              description: "Frequência cardíaca em batimentos por minuto (bpm)" 
            },
            
            // ANÁLISE POR PAREDE CARDÍACA
            parede_inferior_dii_diii_avf: {
              type: "object",
              description: "Análise da parede INFERIOR (derivações DII, DIII, aVF). ATENÇÃO: Se 2 ou mais destas 3 derivações tiverem elevação ≥1mm = IAM INFERIOR",
              properties: {
                elevacao_st: { type: "boolean", description: "TRUE se DII, DIII ou aVF têm supra ≥1mm" },
                derivacoes_elevadas: { type: "string", description: "Quais das 3 estão elevadas. Ex: DII e DIII" },
                magnitude_mm: { type: "number", description: "Maior elevação em mm" }
              }
            },
            
            parede_anterior_v1_v2_v3_v4: {
              type: "object",
              description: "Análise da parede ANTERIOR (V1, V2, V3, V4)",
              properties: {
                elevacao_st: { type: "boolean", description: "TRUE se V1-V4 têm supra ≥1mm (≥2mm em V2-V3)" },
                derivacoes_elevadas: { type: "string", description: "Quais estão elevadas" },
                magnitude_mm: { type: "number", description: "Maior elevação em mm" }
              }
            },
            
            parede_lateral_di_avl_v5_v6: {
              type: "object",
              description: "Análise da parede LATERAL (DI, aVL, V5, V6)",
              properties: {
                elevacao_st: { type: "boolean", description: "TRUE se DI, aVL, V5 ou V6 têm supra ≥1mm" },
                derivacoes_elevadas: { type: "string", description: "Quais estão elevadas" },
                magnitude_mm: { type: "number", description: "Maior elevação em mm" }
              }
            },
            
            parede_septal_v1_v2: {
              type: "object",
              description: "Análise da parede SEPTAL (V1, V2)",
              properties: {
                elevacao_st: { type: "boolean", description: "TRUE se V1 ou V2 têm supra ≥2mm" },
                derivacoes_elevadas: { type: "string", description: "Quais estão elevadas" },
                magnitude_mm: { type: "number", description: "Maior elevação em mm" }
              }
            },
            
            // ALTERAÇÕES RECÍPROCAS (muito importantes!)
            alteracoes_reciprocas: {
              type: "object",
              description: "Alterações recíprocas ajudam a confirmar IAM. Ex: Infra em aVL quando há supra em DII/DIII/aVF",
              properties: {
                infra_avl: { type: "boolean", description: "TRUE se aVL tem infradesnivelamento ≥1mm (recíproca de IAM inferior)" },
                infra_di: { type: "boolean", description: "TRUE se DI tem infradesnivelamento ≥1mm (recíproca de IAM inferior)" },
                infra_v1_v2_v3: { type: "boolean", description: "TRUE se V1-V3 têm infradesnivelamento (recíproca de IAM posterior)" }
              }
            },
            
            // CRITÉRIOS ESPECÍFICOS DE IAM
            criterios_iam_identificados: {
              type: "array",
              items: { type: "string" },
              description: "Liste TODOS os critérios de IAM encontrados. Ex: ['Supra ≥1mm em DII e DIII', 'Infra recíproco em aVL', 'Ondas Q em DIII']"
            },
            
            intervalo_pr: { 
              type: "number", 
              description: "Intervalo PR em ms. Normal: 120-200ms" 
            },
            duracao_qrs: { 
              type: "number", 
              description: "Duração do QRS em ms. Normal < 120ms" 
            },
            intervalo_qtc: {
              type: "number",
              description: "Intervalo QT corrigido"
            },
            eixo_qrs: {
              type: "string",
              description: "Eixo elétrico: Normal (0 a +90°), Desvio esquerda, Desvio direita"
            },
            
            ondas_t_invertidas: { 
              type: "boolean", 
              description: "Se há inversão de ondas T" 
            },
            derivacoes_t_invertidas: {
              type: "string",
              description: "Quais derivações têm T invertida"
            },
            
            ondas_q_patologicas: { 
              type: "boolean", 
              description: "Ondas Q patológicas (duração >40ms ou >25% do QRS)" 
            },
            derivacoes_q_patologicas: {
              type: "string",
              description: "Derivações com ondas Q patológicas"
            },
            
            bloqueio_ramo_esquerdo: {
              type: "boolean",
              description: "BRE presente (QRS >120ms + padrão em V1-V6)"
            },
            bloqueio_ramo_direito: {
              type: "boolean",
              description: "BRD presente (QRS >120ms + padrão RSR' em V1)"
            },
            
            // DIAGNÓSTICO FINAL
            diagnostico_principal: {
              type: "string",
              description: "Diagnóstico ECG principal. Exemplos: 'IAM de parede inferior', 'IAM anterosseptal', 'ECG normal', 'Alterações inespecíficas'"
            },
            
            localizacao_iam: {
              type: "string",
              description: "Se for IAM, qual parede: Inferior, Anterior, Anterosseptal, Lateral, Posterior, Inferolateral, Anterolateral, Extenso. Se não for IAM: Não aplicável"
            },
            
            arteria_culpada_provavel: {
              type: "string",
              description: "Artéria provavelmente acometida: CD (coronária direita - IAM inferior), DAE (descendente anterior esquerda - IAM anterior), Cx (circunflexa - IAM lateral), TCE (tronco), Não aplicável"
            },
            
            alerta_iam: { 
              type: "boolean", 
              description: "TRUE se houver QUALQUER elevação de ST ≥1mm em 2+ derivações contíguas OU alterações recíprocas sugestivas de IAM" 
            },
            
            gravidade: {
              type: "string",
              description: "Crítico (IAM confirmado ou muito provável), Alto risco (alterações sugestivas), Moderado (alterações inespecíficas), Baixo, Normal"
            },
            
            interpretacao_resumo: { 
              type: "string", 
              description: "Resumo clínico em 2-3 frases, mencionando derivações específicas e alterações encontradas" 
            }
          }
        };

        const promptComplementar = `
INSTRUÇÕES CRÍTICAS PARA ANÁLISE DE ECG:

1. PAREDE INFERIOR (DII, DIII, aVF):
   - Se 2 ou mais destas 3 derivações têm elevação ST ≥1mm → IAM DE PAREDE INFERIOR
   - Procure por infradesnivelamento recíproco em aVL e/ou DI (confirma IAM inferior)
   - Artéria culpada: Coronária Direita (CD) na maioria dos casos

2. PAREDE ANTERIOR (V1, V2, V3, V4):
   - Elevação ST ≥1mm em V3-V4 (ou ≥2mm em V2-V3) → IAM ANTERIOR
   - Artéria culpada: Descendente Anterior Esquerda (DAE)

3. PAREDE LATERAL (DI, aVL, V5, V6):
   - Elevação ST ≥1mm → IAM LATERAL
   - Artéria culpada: Circunflexa (Cx)

4. ALTERAÇÕES RECÍPROCAS SÃO MUITO IMPORTANTES:
   - Infra em aVL com supra em DII/DIII/aVF = CONFIRMA IAM INFERIOR
   - Infra em DI com supra em DII/DIII/aVF = CONFIRMA IAM INFERIOR
   - Não ignore essas alterações recíprocas!

5. SEJA SENSÍVEL: Elevações de apenas 1mm já são significativas!

6. ANALISE DERIVAÇÃO POR DERIVAÇÃO: DI, DII, DIII, aVR, aVL, aVF, V1, V2, V3, V4, V5, V6

Retorne uma análise PRECISA e DETALHADA.
`;

        const resultado = await base44.integrations.Core.InvokeLLM({
          prompt: `Você é um especialista em eletrocardiografia. Analise este ECG com MÁXIMA ATENÇÃO às elevações do segmento ST.

${promptComplementar}

Retorne EXATAMENTE no formato JSON especificado. Seja MUITO cuidadoso ao identificar elevações de ST.`,
          file_urls: novosFiles[0],
          response_json_schema: ecgSchema
        });

        if (resultado) {
          const d = resultado;
          
          // Construir relatório mais detalhado
          let relatorio = `ANÁLISE AUTOMATIZADA DE ECG

═══════════════════════════════════════════
1. DADOS BÁSICOS
═══════════════════════════════════════════
Ritmo: ${d.ritmo || "Não identificado"}
Frequência Cardíaca: ${d.frequencia_cardiaca || "N/A"} bpm
Eixo QRS: ${d.eixo_qrs || "Não determinado"}

═══════════════════════════════════════════
2. ANÁLISE DO SEGMENTO ST POR PAREDE
═══════════════════════════════════════════

📍 PAREDE INFERIOR (DII, DIII, aVF):
${d.parede_inferior_dii_diii_avf?.elevacao_st ? `
   ⚠️ ELEVAÇÃO DO SEGMENTO ST IDENTIFICADA!
   Derivações afetadas: ${d.parede_inferior_dii_diii_avf.derivacoes_elevadas || "DII, DIII, aVF"}
   Magnitude: ${d.parede_inferior_dii_diii_avf.magnitude_mm || "N/A"} mm
   🚨 SUSPEITA DE IAM DE PAREDE INFERIOR
` : "   Sem elevação significativa"}

📍 PAREDE ANTERIOR (V1-V4):
${d.parede_anterior_v1_v2_v3_v4?.elevacao_st ? `
   ⚠️ ELEVAÇÃO DO SEGMENTO ST IDENTIFICADA!
   Derivações afetadas: ${d.parede_anterior_v1_v2_v3_v4.derivacoes_elevadas}
   Magnitude: ${d.parede_anterior_v1_v2_v3_v4.magnitude_mm || "N/A"} mm
   🚨 SUSPEITA DE IAM ANTERIOR
` : "   Sem elevação significativa"}

📍 PAREDE LATERAL (DI, aVL, V5, V6):
${d.parede_lateral_di_avl_v5_v6?.elevacao_st ? `
   ⚠️ ELEVAÇÃO DO SEGMENTO ST IDENTIFICADA!
   Derivações afetadas: ${d.parede_lateral_di_avl_v5_v6.derivacoes_elevadas}
   Magnitude: ${d.parede_lateral_di_avl_v5_v6.magnitude_mm || "N/A"} mm
   🚨 SUSPEITA DE IAM LATERAL
` : "   Sem elevação significativa"}

📍 PAREDE SEPTAL (V1, V2):
${d.parede_septal_v1_v2?.elevacao_st ? `
   ⚠️ ELEVAÇÃO DO SEGMENTO ST IDENTIFICADA!
   Derivações afetadas: ${d.parede_septal_v1_v2.derivacoes_elevadas}
   Magnitude: ${d.parede_septal_v1_v2.magnitude_mm || "N/A"} mm
   🚨 SUSPEITA DE IAM SEPTAL
` : "   Sem elevação significativa"}

═══════════════════════════════════════════
3. ALTERAÇÕES RECÍPROCAS
═══════════════════════════════════════════
${d.alteracoes_reciprocas?.infra_avl ? "⚠️ Infradesnivelamento em aVL (recíproca de IAM inferior)" : "aVL: Normal"}
${d.alteracoes_reciprocas?.infra_di ? "⚠️ Infradesnivelamento em DI (recíproca de IAM inferior)" : "DI: Normal"}
${d.alteracoes_reciprocas?.infra_v1_v2_v3 ? "⚠️ Infradesnivelamento em V1-V3 (sugestivo de IAM posterior)" : "V1-V3: Normal"}

═══════════════════════════════════════════
4. CRITÉRIOS DE IAM IDENTIFICADOS
═══════════════════════════════════════════
${d.criterios_iam_identificados && d.criterios_iam_identificados.length > 0 ? 
  d.criterios_iam_identificados.map((c, i) => `${i+1}. ${c}`).join('\n') : 
  "Nenhum critério específico de IAM identificado"}

═══════════════════════════════════════════
5. ONDAS T E Q
═══════════════════════════════════════════
Ondas T: ${d.ondas_t_invertidas ? `Inversão em ${d.derivacoes_t_invertidas}` : "Normais"}
Ondas Q: ${d.ondas_q_patologicas ? `Ondas Q patológicas em ${d.derivacoes_q_patologicas}` : "Sem ondas Q patológicas"}

═══════════════════════════════════════════
6. BLOQUEIOS
═══════════════════════════════════════════
${d.bloqueio_ramo_esquerdo ? "⚠️ Bloqueio de Ramo Esquerdo presente" : ""}
${d.bloqueio_ramo_direito ? "⚠️ Bloqueio de Ramo Direito presente" : ""}
${!d.bloqueio_ramo_esquerdo && !d.bloqueio_ramo_direito ? "Sem bloqueios identificados" : ""}

═══════════════════════════════════════════
7. INTERVALOS
═══════════════════════════════════════════
Intervalo PR: ${d.intervalo_pr || "N/A"} ms
Duração QRS: ${d.duracao_qrs || "N/A"} ms
QTc: ${d.intervalo_qtc || "N/A"} ms

═══════════════════════════════════════════
📋 DIAGNÓSTICO
═══════════════════════════════════════════
${d.diagnostico_principal || "Diagnóstico não especificado"}

${d.localizacao_iam && d.localizacao_iam !== "Não aplicável" ? `
Localização: ${d.localizacao_iam}
` : ""}

${d.arteria_culpada_provavel && d.arteria_culpada_provavel !== "Não aplicável" ? `
Artéria provável: ${d.arteria_culpada_provavel}
` : ""}

Gravidade: ${d.gravidade || "Não especificada"}

═══════════════════════════════════════════
💬 INTERPRETAÇÃO CLÍNICA
═══════════════════════════════════════════
${d.interpretacao_resumo || "Análise realizada"}

${d.alerta_iam ? `
═══════════════════════════════════════════
🚨 ALERTA DE EMERGÊNCIA - IAM DETECTADO
═══════════════════════════════════════════

CONDUTA URGENTE:
• Comunicar IMEDIATAMENTE o médico cardiologista
• Preparar para cateterismo de urgência
• AAS 200-300mg VO (mastigado)
• Clopidogrel 600mg VO ou Ticagrelor 180mg
• Anticoagulação (Heparina ou Enoxaparina)
• Monitorização cardíaca contínua
• Acesso venoso calibroso
• Oxigênio se SpO2 < 90%

META: Reperfusão em até 90 minutos do primeiro contato médico
` : ""}

═══════════════════════════════════════════
⚠️ NOTA IMPORTANTE
═══════════════════════════════════════════
Esta análise é AUXILIAR e NÃO substitui a interpretação
por médico qualificado. O ECG deve ser revisado por um
cardiologista ou médico emergencista.`;

          setAnaliseEcg(relatorio);
        } else {
          throw new Error("Falha na análise");
        }

      } catch (error) {
        console.error("Erro na análise automática:", error);
        
        setAnaliseEcg(`ECG ANEXADO COM SUCESSO

${novosFiles.length} arquivo(s) carregado(s).
Tempo desde triagem: ${tempoMinutos} minutos

⚠️ Análise automática não disponível no momento.

O médico deve interpretar manualmente:
✓ Ritmo e frequência
✓ Intervalo PR, QRS, QT
✓ Segmento ST (elevação/depressão)
✓ Ondas T e Q patológicas
✓ Bloqueios de ramo

CRITÉRIOS DE IAM POR PAREDE:
• INFERIOR: Supra ST ≥1mm em 2+ de DII, DIII, aVF
  → Alteração recíproca: Infra em aVL ou DI
• ANTERIOR: Supra ST ≥1mm em V3-V4 (≥2mm em V2-V3)
• LATERAL: Supra ST ≥1mm em DI, aVL, V5, V6
• SEPTAL: Supra ST ≥2mm em V1-V2`);
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
      if (glicemia < 54 || glicemia > 400) {
        return { 
          texto: "Valores críticos: < 54 ou > 400 mg/dL (requer correção imediata)", 
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
      if (glicemia < 54 || glicemia > 400) {
        return { 
          texto: "Valores críticos: < 54 ou > 400 mg/dL (requer correção imediata)", 
          cor: "text-red-600 font-semibold",
          bg: "bg-red-50 border-red-300"
        };
      } else if (glicemia >= 70 && glicemia <= 180) {
        return { 
          texto: "Valores aceitáveis: 70 a 180 mg/dL (dentro da meta)", 
          cor: "text-green-600 font-semibold",
          bg: "bg-green-50 border-green-300"
        };
      } else {
        return { 
          texto: "Valores aceitáveis: 70 a 180 mg/dL - Fora da meta ideal", 
          cor: "text-orange-600 font-semibold",
          bg: "bg-orange-50 border-orange-300"
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
    analiseEcg.includes("IAM") || 
    analiseEcg.includes("IAMCSST") ||
    analiseEcg.includes("SUSPEITA") ||
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
            onChange={(e) => {
              const val = e.target.value;
              setDados({...dados, frequencia_cardiaca: val === "" ? "" : parseFloat(val) || ""});
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fr">Frequência Respiratória (irpm)</Label>
          <Input
            id="fr"
            type="number"
            placeholder="Ex: 16"
            value={dados.frequencia_respiratoria}
            onChange={(e) => {
              const val = e.target.value;
              setDados({...dados, frequencia_respiratoria: val === "" ? "" : parseFloat(val) || ""});
            }}
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
            onChange={(e) => {
              const val = e.target.value;
              setDados({...dados, temperatura: val === "" ? "" : parseFloat(val) || ""});
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="spo2">SpO2 (%)</Label>
          <Input
            id="spo2"
            type="number"
            placeholder="Ex: 98"
            value={dados.spo2}
            onChange={(e) => {
              const val = e.target.value;
              setDados({...dados, spo2: val === "" ? "" : parseFloat(val) || ""});
            }}
          />
        </div>
      </div>

      {/* Suporte de Oxigênio */}
      <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
        <Label className="text-base font-semibold text-blue-900 mb-3 block">
          Suporte de Oxigênio
        </Label>
        <RadioGroup
          value={dados.spo2_oxigenio}
          onValueChange={(value) => setDados({...dados, spo2_oxigenio: value, spo2_litros_o2: value === "ar_ambiente" ? "" : dados.spo2_litros_o2})}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ar_ambiente" id="ar_ambiente" />
            <Label htmlFor="ar_ambiente" className="cursor-pointer font-medium">
              Ar ambiente (sem oxigênio suplementar)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="o2_suplementar" id="o2_suplementar" />
            <Label htmlFor="o2_suplementar" className="cursor-pointer font-medium">
              Oxigênio suplementar
            </Label>
          </div>
        </RadioGroup>

        {dados.spo2_oxigenio === "o2_suplementar" && (
          <div className="mt-4 space-y-2">
            <Label htmlFor="litros_o2">Litros de O2 por minuto</Label>
            <Input
              id="litros_o2"
              type="number"
              step="0.5"
              min="0"
              max="15"
              placeholder="Ex: 2 ou 5"
              value={dados.spo2_litros_o2}
              onChange={(e) => {
                const val = e.target.value;
                setDados({...dados, spo2_litros_o2: val === "" ? "" : parseFloat(val) || ""});
              }}
              className="bg-white"
            />
            <p className="text-xs text-blue-700">
              💡 Informe quantos litros por minuto o paciente está recebendo
            </p>
          </div>
        )}
      </div>

      {getSpo2Status() && (
        <div className={`text-sm p-3 rounded border ${getSpo2Status().bg}`}>
          <p className={getSpo2Status().cor}>
            {getSpo2Status().texto}
          </p>
        </div>
      )}

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
          onChange={(e) => {
            const val = e.target.value;
            setDados({...dados, glicemia_capilar: val === "" ? "" : parseFloat(val) || ""});
          }}
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
                {uploading ? "Carregando..." : "Clique para anexar ECG"}
              </p>
              <p className="text-xs text-gray-500 mt-1">Escolha da galeria, tire uma foto ou selecione arquivo PDF</p>
              <p className="text-xs text-blue-600 mt-2 font-semibold">
                📱 No celular: Galeria, Câmera ou Arquivos
              </p>
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
                🔍 Analisando ECG com IA especializada... Aguarde alguns segundos...
              </AlertDescription>
            </Alert>
          )}

          {temAlertaIAM && (
            <Alert className="border-red-500 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 font-semibold">
                🚨 ALERTA: Possível IAM detectado!
                Revise IMEDIATAMENTE a análise completa abaixo.
              </AlertDescription>
            </Alert>
          )}

          {analiseEcg && (
            <div className="border-l-4 border-l-blue-600 bg-blue-50 p-4 rounded">
              <h4 className="font-semibold text-blue-900 mb-2">📊 Análise de ECG por Inteligência Artificial:</h4>
              <pre className="text-sm text-blue-800 whitespace-pre-wrap font-sans leading-relaxed">{analiseEcg}</pre>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
                <p className="text-xs text-yellow-800 font-semibold">
                  ⚠️ ATENÇÃO: Esta análise é AUXILIAR e NÃO substitui a interpretação por médico qualificado. 
                  O ECG deve ser revisado por um cardiologista ou médico emergencista antes de qualquer decisão clínica.
                </p>
              </div>
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
