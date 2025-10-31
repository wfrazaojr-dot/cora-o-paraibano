
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Upload, Loader2, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
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
            qualidade_imagem: {
              type: "string",
              enum: ["Excellent", "Good", "Fair", "Poor", "Unreadable"],
              description: "Image quality assessment"
            },
            interpretacao_principal: {
              type: "string",
              enum: [
                "Normal Sinus Rhythm",
                "Sinus Tachycardia",
                "Sinus Bradycardia",
                "Possible STEMI - URGENT",
                "Possible NSTEMI", 
                "ST Elevation Detected",
                "ST Depression Detected",
                "T Wave Abnormalities",
                "Left Bundle Branch Block",
                "Right Bundle Branch Block",
                "Atrial Fibrillation",
                "Atrial Flutter",
                "Supraventricular Tachycardia",
                "Ventricular Tachycardia - EMERGENCY",
                "Ventricular Fibrillation - EMERGENCY",
                "First Degree AV Block",
                "Second Degree AV Block",
                "Third Degree AV Block - URGENT",
                "Left Ventricular Hypertrophy",
                "Ischemic Changes Suspected",
                "Non-Specific Abnormalities",
                "Unable to Interpret - Requires Physician Review"
              ],
              description: "Single most important finding"
            },
            nivel_urgencia: {
              type: "string",
              enum: ["EMERGENCY", "URGENT", "MODERATE", "LOW", "ROUTINE"],
              description: "Clinical urgency level"
            },
            ritmo: { 
              type: "string", 
              description: "Cardiac rhythm identified" 
            },
            frequencia_cardiaca_estimada: { 
              type: "number", 
              description: "Estimated heart rate in bpm from ECG" 
            },
            regularidade: {
              type: "string",
              enum: ["Regular", "Regularly Irregular", "Irregularly Irregular"],
              description: "Rhythm regularity"
            },
            eixo_cardiaco: {
              type: "string",
              enum: ["Normal Axis (0 to +90)", "Left Axis Deviation (-30 to -90)", "Right Axis Deviation (+90 to +180)", "Extreme Axis Deviation", "Cannot Determine"],
              description: "QRS axis"
            },
            intervalo_pr: {
              type: "string",
              description: "PR interval measurement and interpretation (Normal: 120-200ms)"
            },
            complexo_qrs: {
              type: "string", 
              description: "QRS duration and morphology (Normal: 80-120ms)"
            },
            intervalo_qt: {
              type: "string",
              description: "QT interval assessment (mention if prolonged >440ms men, >460ms women)"
            },
            segmento_st: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  enum: ["Normal in all leads", "Elevation in specific leads", "Depression in specific leads", "Mixed changes", "Early repolarization pattern", "Cannot assess"],
                  description: "Overall ST segment assessment"
                },
                elevacao_detectada: {
                  type: "boolean",
                  description: "TRUE if ANY ST elevation ≥1mm detected"
                },
                derivacoes_com_elevacao: {
                  type: "array",
                  items: { type: "string" },
                  description: "Specific leads showing ST elevation (e.g., II, III, aVF or V1-V4)"
                },
                magnitude_elevacao: {
                  type: "string",
                  description: "Height of ST elevation in mm if present"
                },
                depressao_detectada: {
                  type: "boolean",
                  description: "TRUE if ST depression ≥1mm detected"
                },
                derivacoes_com_depressao: {
                  type: "array",
                  items: { type: "string" },
                  description: "Leads showing ST depression"
                }
              }
            },
            onda_t: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  enum: ["Normal in all leads", "Inverted in specific leads", "Peaked/Hyperacute", "Flattened", "Biphasic", "Cannot assess"],
                  description: "T wave morphology"
                },
                derivacoes_anormais: {
                  type: "array",
                  items: { type: "string" },
                  description: "Leads with abnormal T waves"
                }
              }
            },
            ondas_q_patologicas: {
              type: "object",
              properties: {
                present: { type: "boolean" },
                derivacoes: {
                  type: "array",
                  items: { type: "string" },
                  description: "Leads with pathological Q waves (>40ms or >25% R wave)"
                },
                sugestao: {
                  type: "string",
                  description: "What the Q waves might suggest (old MI, etc)"
                }
              }
            },
            bloqueios: {
              type: "object",
              properties: {
                bloqueio_av: {
                  type: "string",
                  enum: ["None", "First Degree (PR >200ms)", "Second Degree Mobitz I (Wenckebach)", "Second Degree Mobitz II", "Third Degree (Complete Heart Block)", "Cannot Determine"],
                  description: "AV conduction block"
                },
                bloqueio_ramo: {
                  type: "string",
                  enum: ["None", "Complete RBBB (QRS ≥120ms, RSR' in V1)", "Incomplete RBBB", "Complete LBBB (QRS ≥120ms, broad R in V5-V6)", "Incomplete LBBB", "Cannot Determine"],
                  description: "Bundle branch block"
                }
              }
            },
            hipertrofia: {
              type: "object",
              properties: {
                hipertrofia_ve: {
                  type: "boolean",
                  description: "Signs of left ventricular hypertrophy"
                },
                criterios_presentes: {
                  type: "array",
                  items: { type: "string" },
                  description: "Which LVH criteria are met (Sokolow-Lyon, Cornell, etc)"
                }
              }
            },
            sinais_isquemia_detalhados: {
              type: "array",
              items: { type: "string" },
              description: "Specific ischemic findings identified with lead locations"
            },
            territorio_afetado: {
              type: "string",
              enum: ["None", "Inferior (II, III, aVF)", "Anterior (V1-V4)", "Anteroseptal (V1-V3)", "Anterolateral (V4-V6, I, aVL)", "Lateral (I, aVL, V5-V6)", "Posterior (reciprocal changes in V1-V3)", "Right Ventricular (V1, V3R-V4R)", "Extensive (multiple territories)", "Cannot Determine"],
              description: "Affected myocardial territory"
            },
            arteria_culpada_provavel: {
              type: "string",
              enum: ["None/Not Applicable", "LAD (Left Anterior Descending)", "RCA (Right Coronary Artery)", "LCx (Left Circumflex)", "Left Main (possible)", "Cannot Determine from ECG"],
              description: "Probable culprit artery based on territory"
            },
            alerta_critico: {
              type: "boolean",
              description: "TRUE ONLY if definite life-threatening findings (STEMI, VT/VF, complete AV block)"
            },
            achados_criticos_especificos: {
              type: "array",
              items: { type: "string" },
              description: "List specific critical findings if alerta_critico is true"
            },
            recomendacoes_imediatas: {
              type: "array",
              items: { type: "string" },
              description: "Immediate clinical actions recommended based on findings"
            },
            diagnosticos_diferenciais: {
              type: "array",
              items: { type: "string" },
              description: "Possible diagnoses to consider based on ECG pattern"
            },
            confianca_interpretacao: {
              type: "string",
              enum: ["High - Clear findings", "Moderate - Some uncertainty", "Low - Poor quality or borderline findings", "Very Low - Requires urgent physician review"],
              description: "AI confidence level in this interpretation"
            },
            limitacoes_analise: {
              type: "array",
              items: { type: "string" },
              description: "Any limitations or factors affecting interpretation (poor quality, artifacts, etc)"
            },
            comparacao_ecg_previo: {
              type: "string",
              description: "Note that comparison with previous ECG is not available but recommended"
            },
            resumo_clinico_pt: {
              type: "string",
              description: "Clinical summary in Portuguese for the medical team - be specific and clear"
            }
          }
        };

        const dadosClinicosContexto = `
PATIENT CONTEXT:
- Age: ${dadosPaciente.idade} years
- Sex: ${dadosPaciente.sexo}
- Chief Complaint: Chest pain
- Cardiac Triage Alert: ${dadosPaciente.triagem_cardiologica?.alerta_iam ? 'YES - Possible ACS' : 'No'}
- Vital Signs: HR ${dadosPaciente.dados_vitais?.frequencia_cardiaca || 'N/A'} bpm, BP ${dadosPaciente.dados_vitais?.pa_braco_esquerdo || 'N/A'}
`;

        const promptEspecializado = `
You are an expert cardiologist AI assistant trained in ECG interpretation following ACC/AHA/ESC 2023 guidelines and SBC 2025 Brazilian guidelines.

${dadosClinicosContexto}

CRITICAL INSTRUCTIONS - READ CAREFULLY:

1. ACCURACY IS PARAMOUNT - Lives depend on correct interpretation
2. Be CONSERVATIVE - When uncertain, recommend physician review
3. SYSTEMATICALLY analyze the ECG following the structured protocol below
4. Correlate ECG findings with the clinical context provided
5. Distinguish between normal variants and pathological findings
6. Be specific about lead locations and measurements

═══════════════════════════════════════════════════════════
SYSTEMATIC ECG ANALYSIS PROTOCOL
═══════════════════════════════════════════════════════════

STEP 1: IMAGE QUALITY ASSESSMENT
- Assess if the ECG image is readable
- Check for: proper lead placement, calibration (10mm = 1mV), paper speed (25mm/s)
- Identify artifacts (muscle tremor, AC interference, baseline wander)
- If quality is poor, SET confianca_interpretacao to "Low" or "Very Low"

STEP 2: RHYTHM ANALYSIS
- Identify P waves: Are they present, regular, upright in leads I, II, aVF?
- P-QRS relationship: Is each P followed by a QRS? Is each QRS preceded by a P?
- Regularity: Measure R-R intervals - Regular? Regularly irregular? Irregularly irregular?
- Common rhythms:
  * Sinus Rhythm: Regular, P before each QRS, rate 60-100 bpm
  * Atrial Fibrillation: No P waves, irregularly irregular R-R, fibrillatory baseline
  * Atrial Flutter: Sawtooth F waves (best in II, III, aVF), regular or variable conduction
  * SVT: Regular, narrow QRS tachycardia, rate >150 bpm
  * VT: Regular, WIDE QRS (>120ms), rate >100 bpm

STEP 3: RATE CALCULATION
- Count QRS complexes in 10 seconds × 6 = rate per minute
- OR: 300 divided by number of large squares between R-R intervals
- Normal: 60-100 bpm
- Bradycardia: <60 bpm (consider if patient is athlete, on beta-blockers)
- Tachycardia: >100 bpm (sinus? pathological?)

STEP 4: AXIS DETERMINATION
- Lead I positive + Lead aVF positive = Normal axis (0° to +90°)
- Lead I positive + Lead aVF negative = Left axis deviation (-30° to -90°)
- Lead I negative + Lead aVF positive = Right axis deviation (+90° to +180°)
- Lead I negative + Lead aVF negative = Extreme axis deviation
- Clinical significance: LAD (LVH, LBBB, inferior MI), RAD (RVH, PE, lateral MI)

STEP 5: INTERVAL MEASUREMENTS (CRUCIAL)
A) PR INTERVAL (beginning of P to beginning of QRS):
   - Normal: 120-200ms (3-5 small squares at 25mm/s)
   - >200ms = First Degree AV Block
   - Progressive lengthening then dropped QRS = Mobitz I
   - Intermittent non-conducted P waves = Mobitz II (dangerous!)
   - No relationship between P and QRS = Complete AV Block (emergency!)

B) QRS DURATION (ventricular depolarization):
   - Normal: 80-120ms (<3 small squares)
   - 120-150ms = Incomplete bundle branch block
   - ≥120ms = Complete bundle branch block OR ventricular rhythm
   - RBBB: RSR' pattern in V1, wide S in V6
   - LBBB: Broad R in V5-V6, no Q in I, V5-V6

C) QT INTERVAL:
   - Measure from Q to end of T wave
   - Correct for rate using Bazett's formula: QTc = QT/√RR
   - Prolonged: >440ms (men), >460ms (women) → Risk of Torsades de Pointes
   - Causes: drugs, electrolytes, congenital long QT syndrome

STEP 6: CRITICAL - ST SEGMENT ANALYSIS
This is THE MOST IMPORTANT part for chest pain patients!

NORMAL ST SEGMENT:
- Should be at baseline (isoelectric)
- Slight elevation (<1mm) in V2-V3 can be normal (early repolarization)
- Slight depression (<0.5mm) can be normal

PATHOLOGICAL ST ELEVATION (STEMI criteria):
- ≥1mm (1 small square) ST elevation in 2+ CONTIGUOUS leads (limb leads)
- ≥2mm ST elevation in 2+ CONTIGUOUS precordial leads (V2-V3)
- New or presumably new LBBB with clinical suspicion of MI

CHECK EACH LEAD SYSTEMATICALLY:
- Inferior leads (II, III, aVF): ST elevation → Inferior STEMI (RCA or LCx)
  * If also in V3R-V4R → Right ventricular infarction (give fluids, NO nitrates!)
- Anterior leads (V1-V4): ST elevation → Anterior STEMI (LAD)
  * V1-V2 = Septal
  * V3-V4 = Anterior
- Lateral leads (I, aVL, V5-V6): ST elevation → Lateral STEMI (LCx or diagonal LAD)
- Posterior MI: ST DEPRESSION in V1-V3 + Tall R waves (reciprocal changes)

PATHOLOGICAL ST DEPRESSION:
- ≥1mm horizontal or downsloping ST depression in 2+ leads
- Suggests: NSTEMI, subendocardial ischemia, reciprocal changes
- Diffuse ST depression + ST elevation in aVR → Left main or 3-vessel disease (very high risk!)

BEWARE OF MIMICS (common errors):
- Pericarditis: Diffuse ST elevation (NOT contiguous territory) + PR depression
- Early repolarization: ST elevation with prominent J-waves, usually young patients
- LVH: ST elevation in leads with deep S waves (strain pattern)
- LBBB: ST-T discordant to QRS (don't diagnose STEMI with LBBB alone)
- Brugada pattern: Coved ST elevation in V1-V2 (genetic, sudden death risk)

STEP 7: T WAVE ANALYSIS
- Normal: Upright in I, II, V3-V6; can be inverted in aVR, V1
- Pathological T wave inversion:
  * Deep symmetrical T inversion in V2-V4 = Wellens' syndrome (critical LAD stenosis!)
  * T inversion in leads corresponding to ST elevation = evolving MI
  * New T inversion in chest pain patient = possible NSTEMI
- Hyperacute T waves: Tall, peaked T in precordial leads = very early STEMI
- Flattened T waves: Non-specific, can be ischemia, electrolyte abnormalities

STEP 8: Q WAVE ANALYSIS
Pathological Q waves indicate transmural infarction (may be old or new):
- Duration ≥40ms (1 small square) OR
- Depth ≥25% of R wave height OR
- Q wave in leads where Q should not exist (V1-V3)
- Territories:
  * Q in II, III, aVF = Inferior MI (old or acute)
  * Q in V1-V4 = Anterior MI (old or acute)
  * Q in I, aVL, V5-V6 = Lateral MI (old or acute)
- IMPORTANT: Compare with patient history - are these new or old?

STEP 9: HYPERTROPHY PATTERNS
Left Ventricular Hypertrophy (common in hypertension):
- Sokolow-Lyon: S in V1 + R in V5 or V6 ≥35mm
- Cornell: R in aVL ≥11mm
- Associated: ST-T changes (strain), LAD
- Clinical: HTN, aortic stenosis, hypertrophic cardiomyopathy

Right Ventricular Hypertrophy:
- RAD, R/S ratio >1 in V1, right atrial enlargement
- Causes: Pulmonary HTN, PE, congenital heart disease

═══════════════════════════════════════════════════════════
DECISION ALGORITHM FOR CHEST PAIN ECG
═══════════════════════════════════════════════════════════

IF ST elevation ≥1mm in 2+ contiguous leads:
→ SET interpretacao_principal: "Possible STEMI - URGENT"
→ SET nivel_urgencia: "EMERGENCY"
→ SET alerta_critico: TRUE
→ Identify territory and probable artery
→ Recommend: Activate cath lab, ASA 300mg, dual antiplatelet, heparin, transfer

IF ST depression ≥1mm in 2+ leads OR T wave inversion in 2+ leads:
→ SET interpretacao_principal: "Possible NSTEMI" or "ST Depression Detected"
→ SET nivel_urgencia: "URGENT"
→ Recommend: Serial troponins, cardiology consult, risk stratification

IF Complete AV block or VT/VF:
→ SET nivel_urgencia: "EMERGENCY"
→ SET alerta_critico: TRUE

IF Normal ECG in chest pain patient:
→ NOTE: 6-12% of MI patients have normal initial ECG!
→ Recommend: Serial ECGs, troponins, do NOT rule out ACS based on ECG alone

═══════════════════════════════════════════════════════════
COMMON PITFALLS TO AVOID
═══════════════════════════════════════════════════════════

1. DON'T call STEMI with poor quality ECG
2. DON'T miss posterior MI (look for reciprocal ST depression V1-V3)
3. DON'T forget to check lead placement (reversed leads can mimic abnormalities)
4. DON'T over-interpret early repolarization as STEMI (young, J-point elevation, upward concave ST)
5. DON'T miss Wellens' syndrome (may have normal or minimal enzymes but critical LAD stenosis)
6. DON'T diagnose ischemia in presence of LBBB without additional criteria (Sgarbossa criteria)
7. DON'T forget that normal ECG does NOT exclude ACS
8. DON'T miss hyperkalemia (tall peaked T waves, wide QRS)

═══════════════════════════════════════════════════════════
FINAL INSTRUCTIONS
═══════════════════════════════════════════════════════════

1. Fill ALL fields in the JSON schema accurately
2. Be SPECIFIC: Instead of "abnormal ST", write "ST elevation 3mm in leads II, III, aVF"
3. In resumo_clinico_pt: Write clear Portuguese summary for Brazilian physicians
4. In recomendacoes_imediatas: Be concrete and actionable
5. If unsure: Set confianca_interpretacao to "Low" or "Very Low"
6. Remember: This is ASSISTIVE ONLY - physician must review
7. Correlate with patient's clinical presentation provided above

Now analyze the ECG image systematically and return the structured JSON.
`;

        const resultado = await base44.integrations.Core.InvokeLLM({
          prompt: promptEspecializado,
          file_urls: novosFiles[0],
          response_json_schema: ecgSchema
        });

        if (resultado) {
          setAchadosEstruturados(resultado);
          
          const d = resultado;
          
          let relatorio = `╔══════════════════════════════════════════════════════════╗
║     🤖 ANÁLISE AUTOMATIZADA DE ECG POR IA                ║
║        (Análise Preliminar - Revisão Médica Obrigatória) ║
╚══════════════════════════════════════════════════════════╝

${d.alerta_critico ? '⚠️⚠️⚠️ ALERTA CRÍTICO - ATENÇÃO MÉDICA IMEDIATA NECESSÁRIA ⚠️⚠️⚠️\n' : ''}

QUALIDADE DA IMAGEM: ${d.qualidade_imagem || "Não avaliada"}
CONFIANÇA NA INTERPRETAÇÃO: ${d.confianca_interpretacao || "Não especificada"}

┌─────────────────────────────────────────────────────────┐
│ INTERPRETAÇÃO PRINCIPAL                                  │
└─────────────────────────────────────────────────────────┘
${d.interpretacao_principal || "Não especificada"}

Nível de Urgência: ${d.nivel_urgencia || "Não especificado"}

┌─────────────────────────────────────────────────────────┐
│ ANÁLISE DO RITMO                                         │
└─────────────────────────────────────────────────────────┘
Ritmo: ${d.ritmo || "Não identificado"}
Frequência Cardíaca (estimada): ${d.frequencia_cardiaca_estimada || "N/A"} bpm
Regularidade: ${d.regularidade || "Não avaliada"}

┌─────────────────────────────────────────────────────────┐
│ EIXO CARDÍACO                                            │
└─────────────────────────────────────────────────────────┘
${d.eixo_cardiaco || "Não determinado"}

┌─────────────────────────────────────────────────────────┐
│ INTERVALOS                                               │
└─────────────────────────────────────────────────────────┘
Intervalo PR: ${d.intervalo_pr || "Não medido"}
Duração QRS: ${d.complexo_qrs || "Não medida"}
Intervalo QT: ${d.intervalo_qt || "Não medido"}

┌─────────────────────────────────────────────────────────┐
│ ⚠️ ANÁLISE DO SEGMENTO ST (CRÍTICO)                     │
└─────────────────────────────────────────────────────────┘
${d.segmento_st ? `
Status Geral: ${d.segmento_st.status || "Não avaliado"}

${d.segmento_st.elevacao_detectada ? `
🚨 ELEVAÇÃO DE ST DETECTADA:
   Derivações: ${d.segmento_st.derivacoes_com_elevacao?.join(", ") || "Não especificadas"}
   Magnitude: ${d.segmento_st.magnitude_elevacao || "Não medida"}
` : 'Sem elevação de ST significativa detectada'}

${d.segmento_st.depressao_detectada ? `
⚠️ DEPRESSÃO DE ST DETECTADA:
   Derivações: ${d.segmento_st.derivacoes_com_depressao?.join(", ") || "Não especificadas"}
` : 'Sem depressão de ST significativa detectada'}
` : "Segmento ST não avaliado"}

┌─────────────────────────────────────────────────────────┐
│ ANÁLISE DAS ONDAS T                                      │
└─────────────────────────────────────────────────────────┘
${d.onda_t ? `
Status: ${d.onda_t.status || "Não avaliado"}
${d.onda_t.derivacoes_anormais?.length > 0 ? 
  `Derivações com alterações: ${d.onda_t.derivacoes_anormais.join(", ")}` : 
  'Sem alterações significativas nas ondas T'}
` : "Ondas T não avaliadas"}

┌─────────────────────────────────────────────────────────┐
│ ONDAS Q PATOLÓGICAS                                      │
└─────────────────────────────────────────────────────────┘
${d.ondas_q_patologicas?.present ? 
  `⚠️ Ondas Q patológicas detectadas
   Derivações: ${d.ondas_q_patologicas.derivacoes?.join(", ") || "Não especificadas"}
   Sugestão: ${d.ondas_q_patologicas.sugestao || "Não fornecida"}` :
  "Sem ondas Q patológicas detectadas"}

┌─────────────────────────────────────────────────────────┐
│ BLOQUEIOS DE CONDUÇÃO                                    │
└─────────────────────────────────────────────────────────┘
${d.bloqueios ? `
Bloqueio AV: ${d.bloqueios.bloqueio_av || "Nenhum"}
Bloqueio de Ramo: ${d.bloqueios.bloqueio_ramo || "Nenhum"}
` : "Bloqueios não avaliados"}

${d.hipertrofia?.hipertrofia_ve ? `
┌─────────────────────────────────────────────────────────┐
│ HIPERTROFIA VENTRICULAR                                  │
└─────────────────────────────────────────────────────────┘
⚠️ Sinais de Hipertrofia Ventricular Esquerda
Critérios presentes: ${d.hipertrofia.criterios_presentes?.join(", ") || "Não especificados"}
` : ''}

${d.sinais_isquemia_detalhados?.length > 0 ? `
┌─────────────────────────────────────────────────────────┐
│ ⚠️ SINAIS DE ISQUEMIA DETECTADOS                        │
└─────────────────────────────────────────────────────────┘
${d.sinais_isquemia_detalhados.map((sinal, i) => `${i + 1}. ${sinal}`).join('\n')}
` : ''}

${d.territorio_afetado && d.territorio_afetado !== "None" ? `
┌─────────────────────────────────────────────────────────┐
│ TERRITÓRIO MIOCÁRDICO AFETADO                            │
└─────────────────────────────────────────────────────────┘
Território: ${d.territorio_afetado}
Artéria Culpada Provável: ${d.arteria_culpada_provavel || "Não determinada"}
` : ''}

${d.achados_criticos_especificos?.length > 0 ? `
┌─────────────────────────────────────────────────────────┐
│ 🚨 ACHADOS CRÍTICOS ESPECÍFICOS                         │
└─────────────────────────────────────────────────────────┘
${d.achados_criticos_especificos.map((achado, i) => `${i + 1}. ${achado}`).join('\n')}
` : ''}

${d.recomendacoes_imediatas?.length > 0 ? `
┌─────────────────────────────────────────────────────────┐
│ 🚨 RECOMENDAÇÕES IMEDIATAS                               │
└─────────────────────────────────────────────────────────┘
${d.recomendacoes_imediatas.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}
` : ''}

${d.diagnosticos_diferenciais?.length > 0 ? `
┌─────────────────────────────────────────────────────────┐
│ DIAGNÓSTICOS DIFERENCIAIS A CONSIDERAR                   │
└─────────────────────────────────────────────────────────┘
${d.diagnosticos_diferenciais.map((diag, i) => `${i + 1}. ${diag}`).join('\n')}
` : ''}

${d.limitacoes_analise?.length > 0 ? `
┌─────────────────────────────────────────────────────────┐
│ ⚠️ LIMITAÇÕES DESTA ANÁLISE                             │
└─────────────────────────────────────────────────────────┘
${d.limitacoes_analise.map((lim, i) => `${i + 1}. ${lim}`).join('\n')}
` : ''}

┌─────────────────────────────────────────────────────────┐
│ 📋 RESUMO CLÍNICO (PORTUGUÊS)                           │
└─────────────────────────────────────────────────────────┘
${d.resumo_clinico_pt || "Resumo não disponível"}

${d.comparacao_ecg_previo || "IMPORTANTE: Comparação com ECG prévio não disponível mas recomendada"}

╔══════════════════════════════════════════════════════════╗
║ ⚠️⚠️⚠️ AVISO IMPORTANTE ⚠️⚠️⚠️                          ║
╚══════════════════════════════════════════════════════════╝

Esta é uma análise PRELIMINAR e ASSISTIVA realizada por 
Inteligência Artificial. 

✓ TODOS os ECGs DEVEM ser revisados e interpretados por um
  cardiologista ou médico emergencista qualificado antes de
  qualquer decisão clínica.

✓ NÃO confie EXCLUSIVAMENTE na interpretação automatizada.

✓ Correlacione SEMPRE com a apresentação clínica do paciente.

✓ UM ECG NORMAL NÃO EXCLUI SÍNDROME CORONARIANA AGUDA.
  6-12% dos pacientes com IAM têm ECG inicial normal!

✓ Recomenda-se ECGs seriados e dosagem de troponina.

Gerado em: ${new Date().toLocaleString('pt-BR')}
Sistema de Triagem de Dor Torácica - IA Cardiológica v2.0
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
✓ Ritmo e frequência
✓ Segmento ST (elevação/depressão)
✓ Ondas T e Q patológicas
✓ Bloqueios de ramo

META: ECG em até 10 minutos para suspeita de SCA`);
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
  const temAlertaCritico = achadosEstruturados?.alerta_critico;

  const getNivelUrgenciaColor = (nivel) => {
    const colors = {
      EMERGENCY: "bg-red-600 text-white animate-pulse",
      URGENT: "bg-orange-600 text-white",
      MODERATE: "bg-yellow-600 text-white",
      LOW: "bg-blue-600 text-white",
      ROUTINE: "bg-green-600 text-white"
    };
    return colors[nivel] || "bg-gray-600 text-white";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Eletrocardiograma (ECG)</h2>
        <p className="text-gray-600">Anexe o ECG do paciente e identifique o enfermeiro responsável</p>
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
            <Alert className="border-blue-500 bg-blue-50">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <AlertDescription className="text-blue-800">
                🔍 Analisando ECG com IA especializada em cardiologia...
                <br/>
                <span className="text-xs mt-1 block">Aplicando protocolos ACC/AHA/ESC 2023 e SBC 2025...</span>
              </AlertDescription>
            </Alert>
          )}

          {achadosEstruturados && (
            <Card className="border-2 border-purple-300 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6" />
                  🤖 Análise de ECG por IA - {achadosEstruturados.qualidade_imagem}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {temAlertaCritico && (
                  <Alert className="border-red-600 bg-red-50 border-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <AlertDescription className="text-red-900 font-bold">
                      🚨 ALERTA CRÍTICO - ATENÇÃO MÉDICA IMEDIATA NECESSÁRIA
                    </AlertDescription>
                  </Alert>
                )}

                <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
                  <p className="text-sm text-gray-600 mb-2">Interpretação Principal:</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className={`${getNivelUrgenciaColor(achadosEstruturados.nivel_urgencia)} text-lg px-6 py-2 font-bold`}>
                      {achadosEstruturados.interpretacao_principal}
                    </Badge>
                    <Badge variant="outline" className="text-sm">
                      {achadosEstruturados.confianca_interpretacao}
                    </Badge>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <div className="bg-gray-50 p-3 rounded border">
                    <p className="text-xs text-gray-600">Ritmo</p>
                    <p className="font-bold text-gray-900">{achadosEstruturados.ritmo || "-"}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded border">
                    <p className="text-xs text-gray-600">FC Estimada</p>
                    <p className="font-bold text-gray-900">{achadosEstruturados.frequencia_cardiaca_estimada || "-"} bpm</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded border">
                    <p className="text-xs text-gray-600">Eixo</p>
                    <p className="font-bold text-gray-900 text-xs">{achadosEstruturados.eixo_cardiaco || "-"}</p>
                  </div>
                </div>

                {achadosEstruturados.segmento_st?.elevacao_detectada && (
                  <Alert className="border-red-500 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-900">
                      <strong>🚨 ELEVAÇÃO DE ST DETECTADA</strong>
                      <p className="text-sm mt-1">
                        Derivações: {achadosEstruturados.segmento_st.derivacoes_com_elevacao?.join(", ")}
                      </p>
                      {achadosEstruturados.segmento_st.magnitude_elevacao && (
                        <p className="text-sm">Magnitude: {achadosEstruturados.segmento_st.magnitude_elevacao}</p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {achadosEstruturados.achados_criticos_especificos?.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
                    <p className="font-bold text-red-900 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Achados Críticos:
                    </p>
                    <ul className="space-y-1">
                      {achadosEstruturados.achados_criticos_especificos.map((achado, i) => (
                        <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                          <span className="font-bold">{i + 1}.</span>
                          <span>{achado}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {achadosEstruturados.recomendacoes_imediatas?.length > 0 && (
                  <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-300">
                    <p className="font-bold text-orange-900 mb-2">🎯 Recomendações Imediatas:</p>
                    <ul className="space-y-1">
                      {achadosEstruturados.recomendacoes_imediatas.map((rec, i) => (
                        <li key={i} className="text-sm text-orange-800 flex items-start gap-2">
                          <span className="font-bold">{i + 1}.</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {achadosEstruturados.resumo_clinico_pt && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
                    <p className="font-semibold text-blue-900 mb-2">📋 Resumo Clínico:</p>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">{achadosEstruturados.resumo_clinico_pt}</p>
                  </div>
                )}

                {achadosEstruturados.limitacoes_analise?.length > 0 && (
                  <Alert className="border-yellow-500 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-900">
                      <strong>⚠️ Limitações desta Análise:</strong>
                      <ul className="text-sm mt-1 space-y-1">
                        {achadosEstruturados.limitacoes_analise.map((lim, i) => (
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
            <div className="border-l-4 border-l-blue-600 bg-blue-50 p-4 rounded">
              <h4 className="font-semibold text-blue-900 mb-2">📊 Relatório Detalhado Completo:</h4>
              <pre className="text-sm text-blue-800 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto bg-white p-4 rounded border border-blue-200">
                {analiseEcg}
              </pre>
              <div className="mt-4 p-3 bg-red-50 border-2 border-red-300 rounded">
                <p className="text-xs text-red-900 font-bold">
                  ⚠️⚠️⚠️ AVISO CRÍTICO ⚠️⚠️⚠️
                </p>
                <p className="text-xs text-red-800 mt-1">
                  Esta análise é PRELIMINAR e ASSISTIVA. TODOS os ECGs DEVEM ser revisados por médico qualificado. 
                  NÃO tome decisões clínicas baseadas APENAS nesta análise automatizada.
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
