import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Upload, Loader2, AlertCircle, CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { differenceInMinutes } from "date-fns";

export default function Etapa5ECGEnfermeiro({ dadosPaciente, onProxima, onAnterior }) {
  const [ecgFiles, setEcgFiles] = useState(dadosPaciente.ecg_files || []);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analiseEcg, setAnaliseEcg] = useState(dadosPaciente.analise_ecg_ia || "");
  const [achadosEstruturados, setAchadosEstruturados] = useState(dadosPaciente.ecg_achados_estruturados || null);
  const [enfermeiro, setEnfermeiro] = useState({
    nome: dadosPaciente.enfermeiro_nome || "",
    coren: dadosPaciente.enfermeiro_coren || ""
  });

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
            qualidade_tecnica: {
              type: "object",
              properties: {
                imagem_legivel: { type: "boolean", description: "Can you clearly see ECG tracings?" },
                calibracao_visivel: { type: "boolean", description: "Is 10mm = 1mV calibration visible?" },
                velocidade_papel: { type: "string", description: "Paper speed visible? (25mm/s standard)" },
                todas_12_derivacoes: { type: "boolean", description: "All 12 leads clearly visible?" },
                artefatos: { type: "string", description: "Artifacts present: none/minimal/moderate/severe" },
                avaliacao_qualidade: { 
                  type: "string", 
                  enum: ["Excelente - análise confiável", "Boa - análise possível", "Regular - análise limitada", "Ruim - análise não recomendada"],
                  description: "Overall quality assessment"
                }
              }
            },
            parametros_basicos: {
              type: "object",
              properties: {
                ritmo: { 
                  type: "string",
                  description: "Rhythm identification. Options: Sinus rhythm, Atrial fibrillation, Atrial flutter, Sinus tachycardia, Sinus bradycardia, Cannot determine clearly"
                },
                frequencia_cardiaca: { 
                  type: "number",
                  description: "Heart rate in bpm. Calculate by: 300/number of large squares between R-R, or count complexes in 6 seconds x 10"
                },
                regularidade_rr: {
                  type: "string",
                  enum: ["Regular (variação <10%)", "Irregularmente irregular", "Regularmente irregular", "Não avaliável"],
                  description: "R-R interval regularity"
                }
              }
            },
            eixo_cardiaco: {
              type: "object",
              properties: {
                eixo_qrs: {
                  type: "string",
                  enum: ["Normal (0° a +90°)", "Desvio esquerda (-30° a -90°)", "Desvio direita (+90° a +180°)", "Extremo", "Não determinável"],
                  description: "QRS axis. Determine by: Lead I positive + aVF positive = Normal. Lead I positive + aVF negative = LAD. Lead I negative + aVF positive = RAD."
                },
                metodo_determinacao: {
                  type: "string",
                  description: "How axis was determined (e.g., 'Lead I and aVF method' or 'Cannot determine clearly')"
                }
              }
            },
            intervalos_medidos: {
              type: "object",
              properties: {
                intervalo_pr: {
                  type: "object",
                  properties: {
                    medida_ms: { type: "string", description: "PR interval in ms (start of P to start of QRS). Normal: 120-200ms" },
                    interpretacao: { 
                      type: "string",
                      enum: ["Normal (120-200ms)", "Curto (<120ms)", "Prolongado (>200ms) - BAV 1°", "Variável", "Não mensurável"],
                      description: "PR interval interpretation"
                    }
                  }
                },
                duracao_qrs: {
                  type: "object",
                  properties: {
                    medida_ms: { type: "string", description: "QRS duration in ms. Normal: <120ms" },
                    interpretacao: {
                      type: "string",
                      enum: ["Normal (<120ms)", "Limítrofe (100-120ms)", "Alargado (≥120ms)", "Muito alargado (>160ms)", "Não mensurável"],
                      description: "QRS duration interpretation"
                    }
                  }
                },
                intervalo_qt: {
                  type: "object",
                  properties: {
                    medida_ms: { type: "string", description: "QT interval in ms" },
                    qtc_calculado: { type: "string", description: "QTc (corrected) if calculable. Normal: <440ms men, <460ms women" },
                    interpretacao: {
                      type: "string",
                      enum: ["Normal", "Limítrofe", "Prolongado (risco arritmia)", "Encurtado", "Não mensurável"],
                      description: "QT interpretation"
                    }
                  }
                }
              }
            },
            analise_segmento_st: {
              type: "object",
              properties: {
                metodo_avaliacao: {
                  type: "string",
                  description: "How ST segment was evaluated (e.g., 'Measured 80ms after J-point in each lead')"
                },
                derivacoes_inferiores: {
                  type: "object",
                  properties: {
                    DII: { type: "string", description: "ST in lead II: Isoelectric/Elevated Xmm/Depressed Xmm/Cannot assess" },
                    DIII: { type: "string", description: "ST in lead III" },
                    aVF: { type: "string", description: "ST in aVF" },
                    interpretacao: { type: "string", description: "Inferior leads summary" }
                  }
                },
                derivacoes_anteriores: {
                  type: "object",
                  properties: {
                    V1: { type: "string", description: "ST in V1" },
                    V2: { type: "string", description: "ST in V2" },
                    V3: { type: "string", description: "ST in V3" },
                    V4: { type: "string", description: "ST in V4" },
                    interpretacao: { type: "string", description: "Anterior leads summary" }
                  }
                },
                derivacoes_laterais: {
                  type: "object",
                  properties: {
                    DI: { type: "string", description: "ST in lead I" },
                    aVL: { type: "string", description: "ST in aVL" },
                    V5: { type: "string", description: "ST in V5" },
                    V6: { type: "string", description: "ST in V6" },
                    interpretacao: { type: "string", description: "Lateral leads summary" }
                  }
                },
                elevacao_st_detectada: {
                  type: "boolean",
                  description: "TRUE if ST elevation ≥1mm (limb) or ≥2mm (precordial V2-V3) in 2+ contiguous leads"
                },
                derivacoes_com_elevacao: {
                  type: "array",
                  items: { type: "string" },
                  description: "Specific leads with ST elevation"
                },
                magnitude_maxima_elevacao: {
                  type: "string",
                  description: "Maximum ST elevation height in mm"
                },
                depressao_st_detectada: {
                  type: "boolean",
                  description: "TRUE if ST depression ≥1mm in 2+ leads"
                },
                derivacoes_com_depressao: {
                  type: "array",
                  items: { type: "string" },
                  description: "Leads with ST depression"
                },
                mudancas_reciprocas: {
                  type: "string",
                  description: "Reciprocal ST changes observed (increases specificity for STEMI)"
                }
              }
            },
            analise_ondas_t: {
              type: "object",
              properties: {
                avaliacao_geral: {
                  type: "string",
                  enum: ["Normal em todas derivações", "Inversões específicas", "Ondas T hiperagudas", "Achatadas/bifásicas", "Padrão misto", "Não avaliável"],
                  description: "Overall T wave assessment"
                },
                derivacoes_anormais: {
                  type: "array",
                  items: { type: "string" },
                  description: "Leads with abnormal T waves"
                },
                descricao_alteracoes: {
                  type: "string",
                  description: "Detailed description of T wave abnormalities"
                }
              }
            },
            ondas_q: {
              type: "object",
              properties: {
                q_patologicas_presentes: {
                  type: "boolean",
                  description: "TRUE if pathological Q waves present (≥40ms or ≥25% R wave height)"
                },
                derivacoes_com_q: {
                  type: "array",
                  items: { type: "string" },
                  description: "Leads with pathological Q waves"
                },
                significado_clinico: {
                  type: "string",
                  description: "Clinical significance (e.g., 'Suggests prior inferior MI' or 'Q waves normal in aVR, III')"
                }
              }
            },
            bloqueios_conducao: {
              type: "object",
              properties: {
                bloqueio_av: {
                  type: "string",
                  enum: ["Nenhum", "BAV 1° grau (PR >200ms)", "BAV 2° Mobitz I (Wenckebach)", "BAV 2° Mobitz II", "BAV 3° grau (completo)", "Não determinável"],
                  description: "AV block assessment"
                },
                bloqueio_ramo: {
                  type: "string",
                  enum: ["Nenhum", "BRE completo (QRS ≥120ms, R largo V5-V6)", "BRE incompleto", "BRD completo (QRS ≥120ms, RSR' V1)", "BRD incompleto", "Bloqueio divisional", "Não determinável"],
                  description: "Bundle branch block"
                },
                criterios_utilizados: {
                  type: "string",
                  description: "Which criteria were used for diagnosis"
                }
              }
            },
            achados_isquemicos: {
              type: "object",
              properties: {
                isquemia_detectada: {
                  type: "boolean",
                  description: "TRUE if any ischemic changes detected"
                },
                achados_especificos: {
                  type: "array",
                  items: { type: "string" },
                  description: "Specific ischemic findings with lead locations"
                },
                territorio_afetado: {
                  type: "string",
                  enum: ["Nenhum", "Inferior (II, III, aVF)", "Anterior (V1-V4)", "Lateral (I, aVL, V5-V6)", "Posterior", "Múltiplos territórios", "Indeterminado"],
                  description: "Affected myocardial territory"
                },
                arteria_provavel: {
                  type: "string",
                  enum: ["N/A", "Coronária direita (CD)", "Descendente anterior esquerda (DA)", "Circunflexa (Cx)", "Tronco esquerda (possível)", "Indeterminável"],
                  description: "Probable culprit artery"
                }
              }
            },
            nivel_alerta: {
              type: "string",
              enum: [
                "CRÍTICO - STEMI provável - Ativação hemodinâmica urgente",
                "ALTO - Alterações isquêmicas agudas - Avaliação cardiológica urgente",
                "MODERADO - Alterações sugestivas de isquemia - Investigação necessária",
                "BAIXO - Alterações inespecíficas ou achados crônicos",
                "ROTINA - ECG sem alterações agudas significativas",
                "INCONCLUSIVO - Qualidade inadequada para interpretação confiável"
              ],
              description: "Alert level based on findings"
            },
            confianca_interpretacao: {
              type: "string",
              enum: ["Alta (>90%)", "Moderada (70-90%)", "Baixa (50-70%)", "Muito baixa (<50%) - Revisão médica essencial"],
              description: "Confidence in this interpretation based on image quality and clarity of findings"
            },
            limitacoes_especificas: {
              type: "array",
              items: { type: "string" },
              description: "Specific limitations affecting this interpretation"
            },
            diagnostico_diferencial: {
              type: "array",
              items: { type: "string" },
              description: "Differential diagnoses to consider based on ECG pattern"
            },
            recomendacoes_clinicas: {
              type: "array",
              items: { type: "string" },
              description: "Specific clinical recommendations based on findings"
            },
            comparacao_necessaria: {
              type: "string",
              description: "Note about need for comparison with prior ECGs"
            },
            resumo_executivo_pt: {
              type: "string",
              description: "Executive summary in Portuguese for medical team - be specific, objective, and accurate"
            }
          }
        };

        const contextoPaciente = `
CONTEXTO CLÍNICO DO PACIENTE:
- Idade: ${dadosPaciente.idade} anos (IMPORTANTE para critérios idade-específicos de QTc e outros parâmetros)
- Sexo: ${dadosPaciente.sexo} (IMPORTANTE para critérios de QTc: homens <440ms, mulheres <460ms)
- Queixa principal: Dor torácica
- Triagem cardiológica: ${dadosPaciente.triagem_cardiologica?.alerta_iam ? 'ALERTA POSITIVO para possível IAM' : 'Sem alerta IAM'}
- Frequência cardíaca aferida: ${dadosPaciente.dados_vitais?.frequencia_cardiaca || 'Não disponível'} bpm
- Pressão arterial: ${dadosPaciente.dados_vitais?.pa_braco_esquerdo || 'Não disponível'}
`;

        const promptEspecializado = `You are a highly experienced cardiologist AI assistant specialized in systematic ECG interpretation following AHA/ACC/ESC 2023 Guidelines and SBC 2025 Brazilian Cardiology Society Guidelines.

${contextoPaciente}

═══════════════════════════════════════════════════════════════════════════════
CRITICAL INSTRUCTIONS - THIS IS A LIFE-CRITICAL ANALYSIS
═══════════════════════════════════════════════════════════════════════════════

1. ACCURACY IS PARAMOUNT - You are assisting in potential life-threatening conditions
2. Follow SYSTEMATIC PROTOCOL below step-by-step
3. Be SPECIFIC with measurements and lead locations
4. CORRELATE findings with clinical context provided
5. When uncertain, state confidence level honestly
6. Consider AGE and SEX specific criteria (provided above)

═══════════════════════════════════════════════════════════════════════════════
SYSTEMATIC ECG INTERPRETATION PROTOCOL
═══════════════════════════════════════════════════════════════════════════════

PHASE 1: TECHNICAL QUALITY ASSESSMENT
────────────────────────────────────────
Before ANY interpretation, assess:
1. Image clarity - Can you see ECG tracings clearly?
2. Calibration - Is 10mm = 1mV calibration box visible?
3. Paper speed - Can you confirm 25mm/s (standard)?
4. All 12 leads - Are all labeled and visible (I, II, III, aVR, aVL, aVF, V1-V6)?
5. Artifacts - Baseline wander, muscle tremor, AC interference?

IF QUALITY IS POOR → State "avaliacao_qualidade: Ruim" and SET "confianca_interpretacao: Muito baixa"

PHASE 2: RHYTHM ANALYSIS (Step-by-step)
────────────────────────────────────────
1. Are P waves present?
   - Look in leads II, V1 (best for P wave visualization)
   - P waves should be upright in II, inverted in aVR
   
2. Is there a P wave before every QRS?
   - If NO P waves + irregular rhythm → Consider Atrial Fibrillation
   - If sawtooth pattern → Consider Atrial Flutter
   
3. Is there a QRS after every P wave?
   - If NO → AV block present
   
4. Measure R-R intervals:
   - Regular? → Sinus rhythm, SVT, VT (if wide)
   - Irregular? → AF, multifocal atrial tachycardia, frequent ectopics

PHASE 3: RATE CALCULATION (Two methods - use both to verify)
─────────────────────────────────────────────────────────────
Method 1: 300 divided by number of large squares (5mm) between two R waves
Method 2: Count QRS in 6 seconds × 10

PHASE 4: AXIS DETERMINATION (Quick method)
───────────────────────────────────────────
1. Look at Lead I: Positive or Negative overall QRS?
2. Look at Lead aVF: Positive or Negative overall QRS?

Results:
- Lead I (+) + aVF (+) = Normal axis (0° to +90°)
- Lead I (+) + aVF (-) = Left axis deviation
- Lead I (-) + aVF (+) = Right axis deviation  
- Lead I (-) + aVF (-) = Extreme axis

PHASE 5: INTERVAL MEASUREMENTS (Use calipers mentally or count squares)
───────────────────────────────────────────────────────────────────────
A) PR INTERVAL (measure in lead II if clear):
   - Start: Beginning of P wave
   - End: Beginning of QRS
   - Normal: 3-5 small squares (120-200ms)
   - >5 small squares (>200ms) = First Degree AV Block
   
B) QRS DURATION (measure widest QRS, usually V1 or V2):
   - Normal: <3 small squares (<120ms)
   - ≥3 small squares (≥120ms) = Bundle branch block OR ventricular origin
   
   IF QRS ≥120ms, determine if RBBB or LBBB:
   - RBBB: RSR' pattern in V1 ("M" shape), wide S in I and V6
   - LBBB: Broad R in V5-V6, no Q in I, aVL, V5-V6
   
C) QT INTERVAL:
   - Start: Beginning of QRS
   - End: End of T wave (where T returns to baseline)
   - Correct for heart rate: QTc = QT / √RR interval
   - IMPORTANT: Use age and sex criteria from patient context
   - Men: QTc >440ms prolonged
   - Women: QTc >460ms prolonged

PHASE 6: ST SEGMENT ANALYSIS - MOST CRITICAL FOR CHEST PAIN
──────────────────────────────────────────────────────────────
Systematic approach - Check EVERY lead:

MEASUREMENT TECHNIQUE:
- Measure ST deviation 80ms (2 small squares) after J-point
- Use TP segment as baseline (between T and next P)
- ST is isoelectric = at baseline level

INFERIOR LEADS (II, III, aVF):
- Check for ST elevation ≥1mm (≥0.1mV = 1 small square)
- Check for reciprocal ST depression in lateral leads
- Inferior STEMI suggests RCA or LCx occlusion

ANTERIOR LEADS (V1-V4):
- V1-V2: Check for ST elevation ≥2mm (men <40yo), ≥2.5mm (men ≥40yo), ≥1.5mm (women)
- V3-V4: Check for ST elevation ≥1mm
- Anterior STEMI suggests LAD occlusion

LATERAL LEADS (I, aVL, V5-V6):
- Check for ST elevation ≥1mm
- Lateral STEMI suggests LCx or diagonal LAD

POSTERIOR (V1-V3 reciprocal changes):
- ST depression in V1-V3 + Tall R waves may indicate posterior MI
- True posterior leads (V7-V9) not usually on standard ECG

STEMI CRITERIA (for chest pain patient):
- ST elevation ≥1mm in 2+ contiguous LIMB leads (II+III+aVF or I+aVL)
- OR ST elevation ≥2mm in 2+ contiguous PRECORDIAL leads (V1-V4)
- Contiguous = anatomically adjacent leads

IMPORTANT - STEMI MIMICS TO AVOID:
1. Early repolarization - ST elevation with J-point notching, common in young
2. Pericarditis - Diffuse ST elevation + PR depression
3. LVH with strain - ST elevation in leads with deep S waves
4. LBBB - ST-T discordant changes (ST opposite to QRS direction)
5. Brugada - Coved ST elevation V1-V2

ST DEPRESSION SIGNIFICANCE:
- ≥1mm horizontal/downsloping in 2+ leads = Subendocardial ischemia/NSTEMI
- Diffuse ST depression + ST elevation in aVR = Left main or 3-vessel disease (HIGH RISK!)

PHASE 7: T WAVE ANALYSIS
─────────────────────────
Normal T waves: Upright in I, II, V3-V6; inverted in aVR; variable in III, aVL, V1

Abnormal patterns:
1. HYPERACUTE T WAVES: Tall, peaked, prominent → Very early STEMI
2. T WAVE INVERSIONS: Deep, symmetrical
   - Wellens' syndrome: Deep TWI in V2-V4 → Critical LAD stenosis (intervene within 24-48h!)
   - Anterior TWI: May indicate evolving anterior MI
   - Inferior TWI: May indicate evolving inferior MI
3. FLATTENED T WAVES: Non-specific, may indicate ischemia or electrolyte abnormality
4. BIPHASIC T WAVES: May indicate ischemia

PHASE 8: Q WAVE ANALYSIS
─────────────────────────
Pathological Q waves indicate TRANSMURAL infarction (may be old or acute):

Criteria for pathological Q:
- Width ≥40ms (≥1 small square) OR
- Depth ≥25% of R wave height OR
- Q wave present where it shouldn't be (V1-V3)

Normal Q waves:
- Small Q in I, aVL, V5-V6 (septal depolarization)
- Deep Q in aVR (normal)
- Variable Q in III (can disappear with inspiration)

Locations:
- Q in II, III, aVF = Inferior MI territory
- Q in V1-V4 = Anterior MI territory  
- Q in I, aVL, V5-V6 = Lateral MI territory

IMPORTANT: Are these NEW or OLD Q waves? (Need prior ECG for comparison)

PHASE 9: CONDUCTION BLOCKS
───────────────────────────
AV BLOCKS:
1. First Degree: PR >200ms, all P waves conducted
2. Second Degree Mobitz I (Wenckebach): Progressive PR lengthening then dropped QRS
3. Second Degree Mobitz II: Fixed PR, sudden dropped QRS (DANGEROUS - risk of complete block)
4. Third Degree (Complete): No relationship between P and QRS (EMERGENCY)

BUNDLE BRANCH BLOCKS:
- RBBB: QRS ≥120ms + RSR' in V1 + wide S in I, V6
- LBBB: QRS ≥120ms + broad notched R in I, V5-V6 + no Q in I, aVL, V5-V6
  * Note: LBBB makes STEMI diagnosis difficult (use Sgarbossa criteria if suspected)

═══════════════════════════════════════════════════════════════════════════════
DECISION ALGORITHM FOR THIS CHEST PAIN PATIENT
═══════════════════════════════════════════════════════════════════════════════

IF ST elevation meets STEMI criteria in 2+ contiguous leads:
→ SET nivel_alerta: "CRÍTICO - STEMI provável"
→ IDENTIFY exact leads and territory
→ CALCULATE magnitude of elevation
→ CHECK for reciprocal changes (increases specificity)
→ RECOMMEND: "Ativação imediata da hemodinâmica, AAS 300mg, clopidogrel/ticagrelor, anticoagulação"

IF ST depression ≥1mm in 2+ leads OR deep T inversions:
→ SET nivel_alerta: "ALTO - Alterações isquêmicas agudas"
→ RECOMMEND: "Troponina seriada, estratificação de risco, considerar cateterismo"

IF diffuse ST depression + ST elevation aVR:
→ SET nivel_alerta: "CRÍTICO - Possível doença de tronco/triarterial"
→ RECOMMEND: "Avaliação cardiológica urgente, considerar cateterismo emergencial"

IF Complete AV block or Mobitz II:
→ SET nivel_alerta: "CRÍTICO - Bloqueio AV alto grau"
→ RECOMMEND: "Marca-passo transvenoso de emergência"

IF Wide complex tachycardia (QRS >120ms, rate >100):
→ SET nivel_alerta: "CRÍTICO - Possível TV"
→ RECOMMEND: "Suporte avançado de vida, cardioversão se instável"

IF Normal or non-specific changes:
→ SET nivel_alerta: "BAIXO/ROTINA"
→ BUT NOTE: "6-12% dos IAM têm ECG inicial normal. Troponina e ECG seriado mandatórios."

═══════════════════════════════════════════════════════════════════════════════
CONFIDENCE AND LIMITATIONS
═══════════════════════════════════════════════════════════════════════════════

SET confianca_interpretacao based on:
- Image quality (excellent/good → high confidence)
- Clarity of findings (clear ST elevation → high confidence)
- Presence of artifacts (minimal → high confidence)
- Technical limitations (poor quality, unable to measure intervals → low confidence)

LIST limitacoes_especificas such as:
- "Qualidade da imagem subótima em derivações precordiais"
- "Artefatos musculares dificultam medição precisa de intervalos"
- "Comparação com ECG prévio não disponível"
- "Possível má posição de eletrodos em derivações precordiais"

═══════════════════════════════════════════════════════════════════════════════
FINAL INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

1. Fill ALL fields in the JSON schema with SPECIFIC data
2. BE PRECISE: Write "ST elevation 3mm in leads II, III, aVF" not "ST elevation in inferior leads"
3. MEASUREMENTS: Include actual numbers whenever possible
4. In resumo_executivo_pt: Write clear, actionable Portuguese summary
5. In recomendacoes_clinicas: Be specific and prioritized
6. If UNCERTAIN about any finding: State low confidence and recommend physician review
7. REMEMBER: This assists medical decision-making for a chest pain patient - BE ACCURATE

Now analyze this ECG image systematically following ALL phases above. Return structured JSON.`;

        const resultado = await base44.integrations.Core.InvokeLLM({
          prompt: promptEspecializado,
          file_urls: novosFiles[0],
          response_json_schema: ecgSchema
        });

        if (resultado) {
          setAchadosEstruturados(resultado);
          
          const d = resultado;
          
          let relatorio = `╔══════════════════════════════════════════════════════════════════════════╗
║              🏥 ANÁLISE SISTEMÁTICA DE ECG POR IA                         ║
║          (Baseado em Guidelines AHA/ACC/ESC 2023 e SBC 2025)            ║
╚══════════════════════════════════════════════════════════════════════════╝

${d.qualidade_tecnica ? `
┌──────────────────────────────────────────────────────────────────────────┐
│ ✓ AVALIAÇÃO TÉCNICA DA QUALIDADE                                        │
└──────────────────────────────────────────────────────────────────────────┘
Imagem Legível: ${d.qualidade_tecnica.imagem_legivel ? 'SIM' : 'NÃO'}
Calibração Visível: ${d.qualidade_tecnica.calibracao_visivel ? 'SIM' : 'NÃO'}
Velocidade do Papel: ${d.qualidade_tecnica.velocidade_papel || 'Não identificada'}
12 Derivações Visíveis: ${d.qualidade_tecnica.todas_12_derivacoes ? 'SIM' : 'NÃO'}
Artefatos: ${d.qualidade_tecnica.artefatos || 'Não avaliado'}

AVALIAÇÃO GERAL DA QUALIDADE: ${d.qualidade_tecnica.avaliacao_qualidade || 'Não avaliada'}
` : ''}

NÍVEL DE CONFIANÇA DA INTERPRETAÇÃO: ${d.confianca_interpretacao || 'Não especificado'}

╔══════════════════════════════════════════════════════════════════════════╗
║                    ${d.nivel_alerta || 'NÍVEL DE ALERTA NÃO DEFINIDO'}                              ║
╚══════════════════════════════════════════════════════════════════════════╝

${d.parametros_basicos ? `
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. RITMO E FREQUÊNCIA                                                    │
└──────────────────────────────────────────────────────────────────────────┘
Ritmo: ${d.parametros_basicos.ritmo || 'Não identificado'}
Frequência Cardíaca: ${d.parametros_basicos.frequencia_cardiaca || 'N/A'} bpm
Regularidade R-R: ${d.parametros_basicos.regularidade_rr || 'Não avaliada'}
` : ''}

${d.eixo_cardiaco ? `
┌──────────────────────────────────────────────────────────────────────────┐
│ 2. EIXO CARDÍACO                                                         │
└──────────────────────────────────────────────────────────────────────────┘
Eixo QRS: ${d.eixo_cardiaco.eixo_qrs || 'Não determinado'}
Método: ${d.eixo_cardiaco.metodo_determinacao || 'Não especificado'}
` : ''}

${d.intervalos_medidos ? `
┌──────────────────────────────────────────────────────────────────────────┐
│ 3. INTERVALOS MEDIDOS                                                    │
└──────────────────────────────────────────────────────────────────────────┘

INTERVALO PR:
  Medida: ${d.intervalos_medidos.intervalo_pr?.medida_ms || 'Não medido'}
  Interpretação: ${d.intervalos_medidos.intervalo_pr?.interpretacao || 'Não avaliada'}

DURAÇÃO QRS:
  Medida: ${d.intervalos_medidos.duracao_qrs?.medida_ms || 'Não medida'}
  Interpretação: ${d.intervalos_medidos.duracao_qrs?.interpretacao || 'Não avaliada'}

INTERVALO QT:
  Medida: ${d.intervalos_medidos.intervalo_qt?.medida_ms || 'Não medido'}
  QTc Corrigido: ${d.intervalos_medidos.intervalo_qt?.qtc_calculado || 'Não calculado'}
  Interpretação: ${d.intervalos_medidos.intervalo_qt?.interpretacao || 'Não avaliada'}
` : ''}

${d.analise_segmento_st ? `
┌──────────────────────────────────────────────────────────────────────────┐
│ 4. ⚠️ ANÁLISE DO SEGMENTO ST (CRÍTICO PARA DOR TORÁCICA)               │
└──────────────────────────────────────────────────────────────────────────┘

Método de Avaliação: ${d.analise_segmento_st.metodo_avaliacao || 'Não especificado'}

DERIVAÇÕES INFERIORES (II, III, aVF):
  DII: ${d.analise_segmento_st.derivacoes_inferiores?.DII || 'Não avaliado'}
  DIII: ${d.analise_segmento_st.derivacoes_inferiores?.DIII || 'Não avaliado'}
  aVF: ${d.analise_segmento_st.derivacoes_inferiores?.aVF || 'Não avaliado'}
  → ${d.analise_segmento_st.derivacoes_inferiores?.interpretacao || 'Sem interpretação'}

DERIVAÇÕES ANTERIORES (V1-V4):
  V1: ${d.analise_segmento_st.derivacoes_anteriores?.V1 || 'Não avaliado'}
  V2: ${d.analise_segmento_st.derivacoes_anteriores?.V2 || 'Não avaliado'}
  V3: ${d.analise_segmento_st.derivacoes_anteriores?.V3 || 'Não avaliado'}
  V4: ${d.analise_segmento_st.derivacoes_anteriores?.V4 || 'Não avaliado'}
  → ${d.analise_segmento_st.derivacoes_anteriores?.interpretacao || 'Sem interpretação'}

DERIVAÇÕES LATERAIS (I, aVL, V5-V6):
  DI: ${d.analise_segmento_st.derivacoes_laterais?.DI || 'Não avaliado'}
  aVL: ${d.analise_segmento_st.derivacoes_laterais?.aVL || 'Não avaliado'}
  V5: ${d.analise_segmento_st.derivacoes_laterais?.V5 || 'Não avaliado'}
  V6: ${d.analise_segmento_st.derivacoes_laterais?.V6 || 'Não avaliado'}
  → ${d.analise_segmento_st.derivacoes_laterais?.interpretacao || 'Sem interpretação'}

${d.analise_segmento_st.elevacao_st_detectada ? `
🚨 ELEVAÇÃO DE ST DETECTADA:
   Derivações: ${d.analise_segmento_st.derivacoes_com_elevacao?.join(", ") || 'Não especificadas'}
   Magnitude Máxima: ${d.analise_segmento_st.magnitude_maxima_elevacao || 'Não medida'}
   Mudanças Recíprocas: ${d.analise_segmento_st.mudancas_reciprocas || 'Não observadas'}
` : 'Sem elevação significativa de ST detectada'}

${d.analise_segmento_st.depressao_st_detectada ? `
⚠️ DEPRESSÃO DE ST DETECTADA:
   Derivações: ${d.analise_segmento_st.derivacoes_com_depressao?.join(", ") || 'Não especificadas'}
` : ''}
` : ''}

${d.analise_ondas_t ? `
┌──────────────────────────────────────────────────────────────────────────┐
│ 5. ANÁLISE DAS ONDAS T                                                   │
└──────────────────────────────────────────────────────────────────────────┘
Avaliação Geral: ${d.analise_ondas_t.avaliacao_geral || 'Não avaliada'}
${d.analise_ondas_t.derivacoes_anormais?.length > 0 ? 
  `Derivações com Alterações: ${d.analise_ondas_t.derivacoes_anormais.join(", ")}` : ''}
${d.analise_ondas_t.descricao_alteracoes ? 
  `Descrição: ${d.analise_ondas_t.descricao_alteracoes}` : ''}
` : ''}

${d.ondas_q ? `
┌──────────────────────────────────────────────────────────────────────────┐
│ 6. ONDAS Q PATOLÓGICAS                                                   │
└──────────────────────────────────────────────────────────────────────────┘
${d.ondas_q.q_patologicas_presentes ? 
  `⚠️ Ondas Q patológicas detectadas
   Derivações: ${d.ondas_q.derivacoes_com_q?.join(", ") || 'Não especificadas'}
   Significado Clínico: ${d.ondas_q.significado_clinico || 'A determinar'}` :
  'Sem ondas Q patológicas detectadas'}
` : ''}

${d.bloqueios_conducao ? `
┌──────────────────────────────────────────────────────────────────────────┐
│ 7. BLOQUEIOS DE CONDUÇÃO                                                 │
└──────────────────────────────────────────────────────────────────────────┘
Bloqueio AV: ${d.bloqueios_conducao.bloqueio_av || 'Nenhum'}
Bloqueio de Ramo: ${d.bloqueios_conducao.bloqueio_ramo || 'Nenhum'}
${d.bloqueios_conducao.criterios_utilizados ? 
  `Critérios Utilizados: ${d.bloqueios_conducao.criterios_utilizados}` : ''}
` : ''}

${d.achados_isquemicos ? `
┌──────────────────────────────────────────────────────────────────────────┐
│ 8. ⚠️ ACHADOS ISQUÊMICOS                                                │
└──────────────────────────────────────────────────────────────────────────┘
${d.achados_isquemicos.isquemia_detectada ? 
  `🚨 ISQUEMIA DETECTADA

Achados Específicos:
${d.achados_isquemicos.achados_especificos?.map((a, i) => `  ${i+1}. ${a}`).join('\n')}

Território Afetado: ${d.achados_isquemicos.territorio_afetado || 'Não determinado'}
Artéria Provável: ${d.achados_isquemicos.arteria_provavel || 'Não determinada'}
` :
  'Sem sinais claros de isquemia aguda detectados'}
` : ''}

${d.recomendacoes_clinicas?.length > 0 ? `
┌──────────────────────────────────────────────────────────────────────────┐
│ 🎯 RECOMENDAÇÕES CLÍNICAS IMEDIATAS                                      │
└──────────────────────────────────────────────────────────────────────────┘
${d.recomendacoes_clinicas.map((rec, i) => `${i+1}. ${rec}`).join('\n')}
` : ''}

${d.diagnostico_diferencial?.length > 0 ? `
┌──────────────────────────────────────────────────────────────────────────┐
│ DIAGNÓSTICOS DIFERENCIAIS A CONSIDERAR                                   │
└──────────────────────────────────────────────────────────────────────────┘
${d.diagnostico_diferencial.map((diag, i) => `${i+1}. ${diag}`).join('\n')}
` : ''}

${d.limitacoes_especificas?.length > 0 ? `
┌──────────────────────────────────────────────────────────────────────────┐
│ ⚠️ LIMITAÇÕES DESTA ANÁLISE                                             │
└──────────────────────────────────────────────────────────────────────────┘
${d.limitacoes_especificas.map((lim, i) => `${i+1}. ${lim}`).join('\n')}
` : ''}

┌──────────────────────────────────────────────────────────────────────────┐
│ 📋 RESUMO EXECUTIVO                                                      │
└──────────────────────────────────────────────────────────────────────────┘
${d.resumo_executivo_pt || 'Resumo não disponível'}

${d.comparacao_necessaria || 'IMPORTANTE: Comparação com ECG prévio não disponível mas fortemente recomendada'}

╔══════════════════════════════════════════════════════════════════════════╗
║ ⚠️⚠️⚠️ AVISOS CRÍTICOS E LIMITAÇÕES ⚠️⚠️⚠️                              ║
╚══════════════════════════════════════════════════════════════════════════╝

❌ Esta análise por IA NÃO substitui interpretação por médico qualificado
❌ Esta análise é ASSISTIVA e pode conter erros
❌ Sistemas especializados (Philips DXL, GE Marquette) são mais precisos

✓ TODOS os ECGs DEVEM ser interpretados por cardiologista ou emergencista
✓ Esta análise serve como ALERTA para achados que requerem atenção
✓ Correlacione SEMPRE com quadro clínico e biomarcadores
✓ ECG normal NÃO exclui IAM (6-12% dos IAM têm ECG inicial normal)
✓ Recomenda-se ECGs seriados (6h, 12h, 24h) e troponinas seriadas

Análise realizada em: ${new Date().toLocaleString('pt-BR')}
Sistema de Triagem de Dor Torácica - IA Cardiológica v4.0
`;

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
✓ Ritmo e frequência cardíaca
✓ Eixo cardíaco
✓ Intervalos PR, QRS, QT
✓ Segmento ST (elevação/depressão)
✓ Ondas T e Q patológicas
✓ Bloqueios de condução

META: ECG em até 10 minutos para suspeita de SCA

IMPORTANTE: Sempre correlacionar com quadro clínico!

NOTA: Para análise mais precisa, considere sistemas especializados como
Philips DXL 16-Lead Analysis ou GE Marquette 12SL Algorithm.`);
      }

    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao anexar ECG. Tente novamente.");
    }
    
    setUploading(false);
    setAnalyzing(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (ecgFiles.length === 0) {
      alert("Por favor, anexe pelo menos um arquivo de ECG");
      return;
    }
    if (!enfermeiro.nome || !enfermeiro.coren) {
      alert("Por favor, preencha o nome e COREN do enfermeiro");
      return;
    }
    
    const dataHoraEcg = dadosPaciente.data_hora_ecg || new Date().toISOString();
    const tempoMinutos = dadosPaciente.tempo_triagem_ecg_minutos || (dadosPaciente.data_hora_inicio_triagem 
      ? differenceInMinutes(new Date(dataHoraEcg), new Date(dadosPaciente.data_hora_inicio_triagem))
      : 0);
    
    onProxima({ 
      ecg_files: ecgFiles,
      data_hora_ecg: dataHoraEcg, 
      tempo_triagem_ecg_minutos: tempoMinutos,
      analise_ecg_ia: analiseEcg,
      ecg_achados_estruturados: achadosEstruturados,
      enfermeiro_nome: enfermeiro.nome,
      enfermeiro_coren: enfermeiro.coren,
      status: "Aguardando Médico"
    });
  };

  const tempoTriagemEcg = dadosPaciente.tempo_triagem_ecg_minutos;
  const nivelAlerta = achadosEstruturados?.nivel_alerta;

  const getAlertColor = (nivel) => {
    if (!nivel) return "bg-gray-100 text-gray-800";
    if (nivel.includes("CRÍTICO")) return "bg-red-600 text-white animate-pulse";
    if (nivel.includes("ALTO")) return "bg-orange-600 text-white";
    if (nivel.includes("MODERADO")) return "bg-yellow-600 text-white";
    if (nivel.includes("BAIXO") || nivel.includes("ROTINA")) return "bg-green-600 text-white";
    if (nivel.includes("INCONCLUSIVO")) return "bg-gray-600 text-white";
    return "bg-blue-600 text-white";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Eletrocardiograma (ECG)</h2>
        <p className="text-gray-600">Anexe o ECG do paciente e identifique o enfermeiro responsável</p>
      </div>

      <Alert className="border-blue-500 bg-blue-50">
        <Info className="h-5 w-5 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          <strong>📊 Sobre a Análise de ECG por IA:</strong>
          <ul className="mt-2 space-y-1 text-xs">
            <li>• Esta análise usa IA genérica (GPT-4 Vision) para interpretação preliminar</li>
            <li>• <strong>NÃO é equivalente</strong> a sistemas especializados como Philips DXL, GE Marquette 12SL</li>
            <li>• Serve como <strong>ferramenta de triagem</strong> para alertar achados que requerem atenção</li>
            <li>• <strong>Interpretação médica final é obrigatória</strong> antes de qualquer conduta clínica</li>
          </ul>
        </AlertDescription>
      </Alert>

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
            <label htmlFor="ecg-upload" className="cursor-pointer flex flex-col items-center">
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
            <Alert className="border-purple-500 bg-purple-50">
              <Loader2 className="h-4 w-4 text-purple-600 animate-spin" />
              <AlertDescription className="text-purple-800">
                <div className="space-y-1">
                  <p className="font-semibold">🔍 Análise Sistemática em Andamento...</p>
                  <p className="text-xs">• Avaliando qualidade técnica da imagem</p>
                  <p className="text-xs">• Medindo intervalos PR, QRS, QT</p>
                  <p className="text-xs">• Analisando segmento ST em 12 derivações</p>
                  <p className="text-xs">• Verificando ondas T, Q e bloqueios</p>
                  <p className="text-xs mt-2 text-purple-600">Aplicando protocolo AHA/ACC/ESC 2023...</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {achadosEstruturados && (
            <Card className="border-2 border-purple-300 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6" />
                    🤖 Análise Sistemática de ECG por IA
                  </div>
                  <Badge variant="outline" className="bg-white text-purple-900 border-none">
                    {achadosEstruturados.confianca_interpretacao || 'Confiança não especificada'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* NÍVEL DE ALERTA */}
                {nivelAlerta && (
                  <Alert className={`border-2 ${getAlertColor(nivelAlerta)}`}>
                    <AlertDescription className="font-bold text-lg">
                      {nivelAlerta}
                    </AlertDescription>
                  </Alert>
                )}

                {/* QUALIDADE TÉCNICA */}
                {achadosEstruturados.qualidade_tecnica && (
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="font-semibold text-gray-900 mb-2 text-sm">✓ Qualidade Técnica:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>Imagem: {achadosEstruturados.qualidade_tecnica.imagem_legivel ? '✓' : '✗'}</div>
                      <div>12 Derivações: {achadosEstruturados.qualidade_tecnica.todas_12_derivacoes ? '✓' : '✗'}</div>
                      <div className="col-span-2">
                        <strong>{achadosEstruturados.qualidade_tecnica.avaliacao_qualidade}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* RESUMO EXECUTIVO */}
                {achadosEstruturados.resumo_executivo_pt && (
                  <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                    <p className="font-bold text-blue-900 mb-2">📋 Resumo Executivo:</p>
                    <p className="text-sm text-blue-900 whitespace-pre-wrap">{achadosEstruturados.resumo_executivo_pt}</p>
                  </div>
                )}

                {/* RECOMENDAÇÕES CLÍNICAS */}
                {achadosEstruturados.recomendacoes_clinicas?.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                    <p className="font-bold text-green-900 mb-2">🎯 Recomendações Clínicas:</p>
                    <ul className="space-y-1">
                      {achadosEstruturados.recomendacoes_clinicas.map((rec, i) => (
                        <li key={i} className="text-sm text-green-800 flex gap-2">
                          <span className="font-bold">{i+1}.</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* LIMITAÇÕES */}
                {achadosEstruturados.limitacoes_especificas?.length > 0 && (
                  <Alert className="border-yellow-500 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-900 text-sm">
                      <strong>Limitações desta Análise:</strong>
                      <ul className="mt-1 space-y-1 text-xs">
                        {achadosEstruturados.limitacoes_especificas.map((lim, i) => (
                          <li key={i}>• {lim}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {analiseEcg && (
            <div className="border-l-4 border-l-indigo-600 bg-indigo-50 p-4 rounded">
              <h4 className="font-semibold text-indigo-900 mb-2">📊 Relatório Detalhado Completo:</h4>
              <pre className="text-xs text-indigo-900 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto bg-white p-4 rounded border border-indigo-200">
                {analiseEcg}
              </pre>
              <div className="mt-4 p-3 bg-red-50 border-2 border-red-400 rounded">
                <p className="text-xs text-red-900 font-bold">
                  ⚠️⚠️⚠️ DISCLAIMER CRÍTICO ⚠️⚠️⚠️
                </p>
                <p className="text-xs text-red-800 mt-2">
                  Esta análise por IA NÃO substitui interpretação médica especializada nem sistemas dedicados de ECG (Philips, GE, etc.). 
                  Serve apenas como ferramenta assistiva de triagem. Todos os ECGs DEVEM ser revisados por médico qualificado.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-bold text-lg mb-4">Identificação do Enfermeiro Responsável</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="enfermeiro_nome">Nome Completo do Enfermeiro *</Label>
            <Input
              id="enfermeiro_nome"
              value={enfermeiro.nome}
              onChange={(e) => setEnfermeiro({...enfermeiro, nome: e.target.value})}
              placeholder="Digite o nome completo"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="enfermeiro_coren">Número COREN *</Label>
            <Input
              id="enfermeiro_coren"
              value={enfermeiro.coren}
              onChange={(e) => setEnfermeiro({...enfermeiro, coren: e.target.value})}
              placeholder="Ex: 123456"
              required
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onAnterior}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button 
          type="submit" 
          className="bg-red-600 hover:bg-red-700"
          disabled={ecgFiles.length === 0 || !enfermeiro.nome || !enfermeiro.coren}
        >
          Concluir Triagem de Enfermagem
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}