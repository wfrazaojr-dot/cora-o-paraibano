import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Upload, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { differenceInMinutes } from "date-fns";

export default function Etapa5ECGEnfermeiro({ dadosPaciente, onProxima, onAnterior }) {
  const [ecgFiles, setEcgFiles] = useState(dadosPaciente.ecg_files || []);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analiseEcg, setAnaliseEcg] = useState(dadosPaciente.analise_ecg_ia || "");
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
            ritmo: { type: "string", description: "Tipo de ritmo cardíaco detalhado" },
            frequencia_cardiaca: { type: "number", description: "FC em bpm" },
            
            // ANÁLISE DETALHADA POR PAREDE
            parede_inferior_dii_diii_avf: {
              type: "object",
              description: "Parede INFERIOR (DII, DIII, aVF). Se 2+ têm elevação ≥1mm = IAM INFERIOR",
              properties: {
                elevacao_st: { type: "boolean" },
                derivacoes_elevadas: { type: "string" },
                magnitude_mm: { type: "number" },
                ondas_q_presentes: { type: "boolean" },
                ondas_t_invertidas: { type: "boolean" }
              }
            },
            
            parede_anterior_v1_v2_v3_v4: {
              type: "object",
              description: "Parede ANTERIOR (V1-V4)",
              properties: {
                elevacao_st: { type: "boolean" },
                derivacoes_elevadas: { type: "string" },
                magnitude_mm: { type: "number" },
                ondas_q_presentes: { type: "boolean" },
                ondas_t_invertidas: { type: "boolean" }
              }
            },
            
            parede_lateral_di_avl_v5_v6: {
              type: "object",
              description: "Parede LATERAL (DI, aVL, V5, V6)",
              properties: {
                elevacao_st: { type: "boolean" },
                derivacoes_elevadas: { type: "string" },
                magnitude_mm: { type: "number" },
                ondas_q_presentes: { type: "boolean" },
                ondas_t_invertidas: { type: "boolean" }
              }
            },
            
            parede_septal_v1_v2: {
              type: "object",
              description: "Parede SEPTAL (V1, V2)",
              properties: {
                elevacao_st: { type: "boolean" },
                derivacoes_elevadas: { type: "string" },
                magnitude_mm: { type: "number" }
              }
            },
            
            parede_posterior: {
              type: "object",
              description: "Parede POSTERIOR (infra recíproco em V1-V3 + onda R alta)",
              properties: {
                suspeita_iam_posterior: { type: "boolean" },
                infra_v1_v2_v3: { type: "boolean" },
                onda_r_alta_v1_v2: { type: "boolean" }
              }
            },
            
            // ALTERAÇÕES RECÍPROCAS
            alteracoes_reciprocas: {
              type: "object",
              description: "Alterações recíprocas CONFIRMAM IAM",
              properties: {
                infra_avl: { type: "boolean", description: "Recíproca de IAM inferior" },
                infra_di: { type: "boolean", description: "Recíproca de IAM inferior" },
                infra_v1_v2_v3: { type: "boolean", description: "Sugestivo de IAM posterior" },
                presente: { type: "boolean" }
              }
            },
            
            // IDENTIFICAÇÃO DA ARTÉRIA
            arteria_culpada: {
              type: "object",
              description: "Identificação PRECISA da artéria acometida baseada no padrão ECG",
              properties: {
                arteria_principal: { 
                  type: "string", 
                  enum: ["Coronária Direita (CD)", "Descendente Anterior Esquerda (DAE)", "Circunflexa (Cx)", "Tronco de Coronária Esquerda (TCE)", "Diagonal", "Marginal", "Não aplicável"],
                  description: "Artéria principal acometida"
                },
                segmento_arterial: {
                  type: "string",
                  description: "Segmento específico: proximal, médio, distal"
                },
                justificativa_arteria: {
                  type: "string",
                  description: "Justificativa DETALHADA citando derivações específicas. Ex: 'Supra em DII>DIII sugere CD distal; Supra em DIII>DII sugere CD proximal ou dominância direita'"
                },
                arteria_dominancia: {
                  type: "string",
                  enum: ["Direita", "Esquerda", "Codominante", "Indeterminada"],
                  description: "Sistema de dominância coronariana"
                },
                extensao_infarto: {
                  type: "string",
                  enum: ["Transmural", "Subendocárdico", "Não-Q", "Indeterminado"],
                  description: "Extensão do infarto"
                }
              }
            },
            
            // CRITÉRIOS DE IAM
            criterios_iam_identificados: {
              type: "array",
              items: { type: "string" },
              description: "TODOS os critérios encontrados com detalhes"
            },
            
            // COMPLICAÇÕES
            complicacoes_suspeitas: {
              type: "object",
              properties: {
                bloqueio_av: { 
                  type: "boolean",
                  description: "Bloqueio AV (comum em IAM inferior por CD)" 
                },
                grau_bloqueio_av: { type: "string" },
                bloqueio_ramo_direito: { type: "boolean" },
                bloqueio_ramo_esquerdo: { type: "boolean" },
                taquicardia_ventricular: { type: "boolean" },
                fibrilacao_atrial: { type: "boolean" },
                sinais_choque_cardiogenico: { type: "boolean" }
              }
            },
            
            // DIAGNÓSTICO DETALHADO
            diagnostico_principal: { 
              type: "string", 
              description: "Diagnóstico ECG detalhado e específico" 
            },
            
            localizacao_iam: {
              type: "string",
              description: "Localização PRECISA: Inferior, Inferior + VD, Anterior extenso, Anterosseptal, Lateral alto, Inferolateral, etc"
            },
            
            // TRATAMENTO FARMACOLÓGICO ESPECÍFICO
            tratamento_farmacologico: {
              type: "object",
              description: "Protocolo farmacológico ESPECÍFICO baseado no tipo de IAM e artéria",
              properties: {
                terapia_antiplataquetaria: {
                  type: "object",
                  properties: {
                    asa: { 
                      type: "string", 
                      description: "Ex: AAS 200-300mg VO (mastigado), dose de ataque" 
                    },
                    inibidor_p2y12: { 
                      type: "string", 
                      description: "Ticagrelor 180mg VO (preferencial) OU Clopidogrel 600mg VO OU Prasugrel 60mg (se ICP primária)" 
                    }
                  }
                },
                anticoagulacao: {
                  type: "object",
                  properties: {
                    heparina: { 
                      type: "string", 
                      description: "Heparina não-fracionada: bolus 60-70 UI/kg (máx 5000 UI) + infusão 12-15 UI/kg/h" 
                    },
                    enoxaparina: { 
                      type: "string", 
                      description: "Enoxaparina: 30mg IV bolus + 1mg/kg SC 12/12h (se <75 anos)" 
                    }
                  }
                },
                terapia_adjuvante: {
                  type: "array",
                  items: { type: "string" },
                  description: "Betabloqueadores, IECA/BRA, Estatinas, Nitratos - com doses específicas"
                },
                tratamento_especifico_complicacoes: {
                  type: "array",
                  items: { type: "string" },
                  description: "Ex: 'IAM inferior + BAV → Atropina 0,5mg IV, marca-passo transcutâneo se necessário'"
                },
                contraindicacoes: {
                  type: "array",
                  items: { type: "string" },
                  description: "Contraindicações específicas para este paciente"
                }
              }
            },
            
            // ESTRATÉGIA DE REPERFUSÃO
            estrategia_reperfusao: {
              type: "object",
              properties: {
                recomendacao: {
                  type: "string",
                  enum: ["ICP primária (preferencial)", "Fibrinólise (se ICP indisponível)", "Anticoagulação isolada (IAMSSST)", "Estratégia invasiva precoce"],
                  description: "Estratégia de reperfusão recomendada"
                },
                urgencia: {
                  type: "string",
                  enum: ["Emergência (<90min)", "Urgente (<120min)", "Precoce (<24h)", "Não aplicável"],
                  description: "Janela temporal"
                },
                justificativa_estrategia: {
                  type: "string",
                  description: "Por que esta estratégia é recomendada"
                }
              }
            },
            
            alerta_iam: { 
              type: "boolean", 
              description: "TRUE se IAM confirmado/muito provável" 
            },
            
            gravidade: {
              type: "string",
              enum: ["Crítico - IAM extenso", "Alto risco - IAM", "Moderado - Possível IAM", "Baixo risco", "Normal"],
              description: "Gravidade baseada em extensão e complicações"
            },
            
            score_timi: {
              type: "number",
              description: "TIMI Score estimado (0-7) se aplicável"
            },
            
            interpretacao_resumo: { 
              type: "string", 
              description: "Resumo executivo em 3-4 frases com DERIVAÇÕES ESPECÍFICAS citadas" 
            }
          }
        };

        const promptAvancado = `
Você é um CARDIOLOGISTA INTERVENCIONISTA especializado em eletrocardiografia de emergência.

DADOS DO PACIENTE:
- Idade: ${dadosPaciente.idade} anos
- Sexo: ${dadosPaciente.sexo}
- Sintomas: Dor torácica
- Tempo de evolução: ${dadosPaciente.data_hora_inicio_sintomas ? 'Fornecido' : 'A determinar'}

═══════════════════════════════════════════════════════════════
INSTRUÇÕES CRÍTICAS PARA ANÁLISE AVANÇADA:
═══════════════════════════════════════════════════════════════

1️⃣ IDENTIFICAÇÃO DA ARTÉRIA CULPADA:

A) IAM DE PAREDE INFERIOR (CD em 80-90% dos casos):
   - Elevação ST em 2+ de: DII, DIII, aVF (magnitude ≥1mm)
   - Alterações recíprocas: Infra em aVL e/ou DI (CONFIRMAM diagnóstico)
   
   DIFERENCIAÇÃO ANATÔMICA:
   • Se DII > DIII → CD DISTAL ou Cx distal
   • Se DIII > DII → CD PROXIMAL ou dominância direita
   • Se elevação em V1 → Ventrículo Direito (VD)
   • Se infra em V1-V3 + R alta → IAM POSTERIOR associado
   
   ARTÉRIA: Coronária Direita (CD) - 80-90%
            Circunflexa (Cx) - 10-20% (se dominância esquerda)

B) IAM ANTERIOR/ANTEROSSEPTAL (DAE):
   - V1-V2 (septal) → DAE proximal (pré-1ª septal)
   - V1-V4 (anterosseptal) → DAE proximal/média
   - V1-V6 + DI + aVL (anterior extenso) → DAE proximal ou TCE
   - Apenas V3-V4 → DAE média/distal
   
   ARTÉRIA: Descendente Anterior Esquerda (DAE)
   GRAVIDADE: IAM anterior extenso = ALTO RISCO

C) IAM LATERAL:
   - DI + aVL (lateral alto) → 1ª Diagonal ou Cx proximal
   - V5-V6 (lateral baixo) → Cx distal ou DAE distal
   - DI + aVL + V5-V6 (lateral completo) → Cx
   
   ARTÉRIA: Circunflexa (Cx) ou Diagonal

D) IAM POSTERIOR ISOLADO:
   - Infra ST em V1-V3 (alteração recíproca)
   - Onda R alta e alargada em V1-V2 (≥0,04s)
   - Onda T positiva e alta em V1-V2
   
   ARTÉRIA: Cx (dominância esquerda) ou CD (dominância direita)

2️⃣ TRATAMENTO FARMACOLÓGICO ESPECÍFICO:

A) DUPLA ANTIAGREGAÇÃO PLAQUETÁRIA (DAPT):
   ✓ AAS 200-300mg VO (MASTIGADO) - dose de ataque
   ✓ Ticagrelor 180mg VO (PREFERENCIAL em IAMCSST)
     OU Clopidogrel 600mg VO (se Ticagrelor indisponível)
     OU Prasugrel 60mg VO (se ICP primária + <75 anos + >60kg)

B) ANTICOAGULAÇÃO:
   ✓ Heparina NÃO-fracionada: 
     - Bolus: 60-70 UI/kg IV (máximo 5000 UI)
     - Infusão: 12-15 UI/kg/h (ajustar por TTPa)
   
   ✓ OU Enoxaparina:
     - <75 anos: 30mg IV bolus + 1mg/kg SC 12/12h
     - ≥75 anos: SEM bolus, 0,75mg/kg SC 12/12h
     - Se ClCr <30: 1mg/kg SC 24/24h

C) BETABLOQUEADORES (se sem contraindicação):
   ✓ Metoprolol: 
     - 5mg IV lento (repetir até 15mg se tolerado)
     - Após: 25-50mg VO 6/6h → titular
   ✓ CONTRAINDICAÇÕES: BAV 2º/3º grau, bradicardia <60bpm, 
     IC descompensada, broncoespasmo ativo

D) IECA (iniciar em 24h):
   ✓ Captopril: 6,25mg VO → titular até 50mg 8/8h
   ✓ Enalapril: 2,5mg VO → titular até 10-20mg 12/12h
   ✓ INDICAÇÕES: IAMCSST anterior, FEVE <40%, IC, HAS, DM

E) ESTATINAS DE ALTA POTÊNCIA:
   ✓ Atorvastatina 80mg VO (iniciar na admissão)
   ✓ OU Rosuvastatina 40mg VO

F) TRATAMENTO DE COMPLICAÇÕES:

   IAM INFERIOR + BAV:
   ✓ Atropina 0,5mg IV (repetir até 3mg se necessário)
   ✓ Marca-passo transcutâneo se BAV 2º Mobitz II ou BAV 3º
   ✓ Dopamina 5-20mcg/kg/min se hipotensão

   IAM ANTERIOR + Choque Cardiogênico:
   ✓ Dobutamina 2,5-20mcg/kg/min (inotrópico)
   ✓ Noradrenalina 0,05-0,5mcg/kg/min (se PA baixa)
   ✓ Balão intra-aórtico (BIA) - considerar
   ✓ ICP de EMERGÊNCIA

   Dor Persistente:
   ✓ Morfina 2-4mg IV (repetir 5-15min se necessário)
   ✓ Nitroglicerina SL 0,4mg ou IV 5-200mcg/min
   ✓ CUIDADO: Evitar em IAM inferior (pode causar hipotensão)

3️⃣ ESTRATÉGIA DE REPERFUSÃO:

IAMCSST (Elevação ST):
✓ ICP PRIMÁRIA: <90min porta-balão (PREFERENCIAL)
✓ FIBRINÓLISE: Se ICP não disponível em <120min
  - Tenecteplase: dose ajustada por peso
  - Estreptoquinase: 1,5 milhões UI em 60min
  - CONTRAINDICAÇÕES: AVE prévio, sangramento ativo, cirurgia recente

IAMSSST (Sem elevação ST):
✓ Estratégia invasiva PRECOCE (<24h) se alto risco
✓ Anticoagulação + DAPT
✓ Estratificação por GRACE/TIMI score

4️⃣ ANÁLISE SISTEMÁTICA:

Analise TODAS as 12 derivações:
- Derivações de membros: DI, DII, DIII, aVR, aVL, aVF
- Derivações precordiais: V1, V2, V3, V4, V5, V6

Procure:
✓ Elevação ST ≥1mm (≥2mm em V2-V3)
✓ Infradesnivelamento recíproco
✓ Ondas Q patológicas (>0,04s ou >25% do QRS)
✓ Ondas T: invertidas, hiperagudas, pseudonormalização
✓ Bloqueios de ramo (mascaram IAM)
✓ Ritmo: FA pode indicar IAM atrial

RETORNE JSON COMPLETO E DETALHADO conforme schema.
Cite DERIVAÇÕES ESPECÍFICAS em toda análise.
`;

        const resultado = await base44.integrations.Core.InvokeLLM({
          prompt: promptAvancado,
          file_urls: novosFiles[0],
          response_json_schema: ecgSchema
        });

        if (resultado) {
          const d = resultado;
          
          let relatorio = `═══════════════════════════════════════════════════════════════
🏥 ANÁLISE AVANÇADA DE ECG - CARDIOLOGIA INTERVENCIONISTA
═══════════════════════════════════════════════════════════════

PACIENTE: ${dadosPaciente.nome_completo}
IDADE: ${dadosPaciente.idade} anos | SEXO: ${dadosPaciente.sexo}
DATA/HORA: ${new Date().toLocaleString('pt-BR')}

═══════════════════════════════════════════════════════════════
📊 1. DADOS BÁSICOS DO ECG
═══════════════════════════════════════════════════════════════
Ritmo: ${d.ritmo || "Não identificado"}
Frequência Cardíaca: ${d.frequencia_cardiaca || "N/A"} bpm

═══════════════════════════════════════════════════════════════
🫀 2. ANÁLISE DO SEGMENTO ST POR PAREDE CARDÍACA
═══════════════════════════════════════════════════════════════

📍 PAREDE INFERIOR (DII, DIII, aVF):
${d.parede_inferior_dii_diii_avf?.elevacao_st ? `
   🚨 ELEVAÇÃO DO SEGMENTO ST DETECTADA!
   • Derivações: ${d.parede_inferior_dii_diii_avf.derivacoes_elevadas || "DII, DIII, aVF"}
   • Magnitude: ${d.parede_inferior_dii_diii_avf.magnitude_mm || "N/A"} mm
   • Ondas Q: ${d.parede_inferior_dii_diii_avf.ondas_q_presentes ? "Presentes (necrose)" : "Ausentes"}
   • Ondas T: ${d.parede_inferior_dii_diii_avf.ondas_t_invertidas ? "Invertidas" : "Normais"}
   
   ⚠️ DIAGNÓSTICO: IAM DE PAREDE INFERIOR
` : "   ✓ Sem elevação significativa"}

📍 PAREDE ANTERIOR (V1-V4):
${d.parede_anterior_v1_v2_v3_v4?.elevacao_st ? `
   🚨 ELEVAÇÃO DO SEGMENTO ST DETECTADA!
   • Derivações: ${d.parede_anterior_v1_v2_v3_v4.derivacoes_elevadas}
   • Magnitude: ${d.parede_anterior_v1_v2_v3_v4.magnitude_mm || "N/A"} mm
   • Ondas Q: ${d.parede_anterior_v1_v2_v3_v4.ondas_q_presentes ? "Presentes (necrose)" : "Ausentes"}
   • Ondas T: ${d.parede_anterior_v1_v2_v3_v4.ondas_t_invertidas ? "Invertidas" : "Normais"}
   
   ⚠️ DIAGNÓSTICO: IAM ANTERIOR/ANTEROSSEPTAL
` : "   ✓ Sem elevação significativa"}

📍 PAREDE LATERAL (DI, aVL, V5, V6):
${d.parede_lateral_di_avl_v5_v6?.elevacao_st ? `
   🚨 ELEVAÇÃO DO SEGMENTO ST DETECTADA!
   • Derivações: ${d.parede_lateral_di_avl_v5_v6.derivacoes_elevadas}
   • Magnitude: ${d.parede_lateral_di_avl_v5_v6.magnitude_mm || "N/A"} mm
   • Ondas Q: ${d.parede_lateral_di_avl_v5_v6.ondas_q_presentes ? "Presentes" : "Ausentes"}
   
   ⚠️ DIAGNÓSTICO: IAM LATERAL
` : "   ✓ Sem elevação significativa"}

📍 PAREDE SEPTAL (V1, V2):
${d.parede_septal_v1_v2?.elevacao_st ? `
   🚨 ELEVAÇÃO detectada
   • Derivações: ${d.parede_septal_v1_v2.derivacoes_elevadas}
   
   ⚠️ IAM SEPTAL
` : "   ✓ Normal"}

📍 PAREDE POSTERIOR:
${d.parede_posterior?.suspeita_iam_posterior ? `
   🚨 SUSPEITA DE IAM POSTERIOR!
   • Infra recíproco V1-V3: ${d.parede_posterior.infra_v1_v2_v3 ? "SIM" : "NÃO"}
   • Onda R alta V1-V2: ${d.parede_posterior.onda_r_alta_v1_v2 ? "SIM" : "NÃO"}
` : "   ✓ Sem evidência de IAM posterior"}

═══════════════════════════════════════════════════════════════
🔄 3. ALTERAÇÕES RECÍPROCAS (Confirmam IAM)
═══════════════════════════════════════════════════════════════
${d.alteracoes_reciprocas?.presente ? `
⚠️ ALTERAÇÕES RECÍPROCAS PRESENTES (CONFIRMA IAM):
${d.alteracoes_reciprocas.infra_avl ? "• Infradesnivelamento em aVL (recíproca de IAM inferior)" : ""}
${d.alteracoes_reciprocas.infra_di ? "• Infradesnivelamento em DI (recíproca de IAM inferior)" : ""}
${d.alteracoes_reciprocas.infra_v1_v2_v3 ? "• Infradesnivelamento em V1-V3 (IAM posterior associado)" : ""}
` : "✓ Sem alterações recíprocas significativas"}

═══════════════════════════════════════════════════════════════
🩸 4. IDENTIFICAÇÃO DA ARTÉRIA CULPADA
═══════════════════════════════════════════════════════════════
${d.arteria_culpada?.arteria_principal && d.arteria_culpada.arteria_principal !== "Não aplicável" ? `
🎯 ARTÉRIA ACOMETIDA: ${d.arteria_culpada.arteria_principal}

• Segmento: ${d.arteria_culpada.segmento_arterial || "A determinar"}
• Dominância: ${d.arteria_culpada.arteria_dominancia || "Indeterminada"}
• Extensão: ${d.arteria_culpada.extensao_infarto || "A determinar"}

📋 JUSTIFICATIVA ANATÔMICA:
${d.arteria_culpada.justificativa_arteria || "Baseado no padrão de derivações acometidas"}
` : "Não aplicável (sem IAM confirmado)"}

═══════════════════════════════════════════════════════════════
⚡ 5. COMPLICAÇÕES DETECTADAS
═══════════════════════════════════════════════════════════════
${d.complicacoes_suspeitas?.bloqueio_av ? `⚠️ BLOQUEIO AV: ${d.complicacoes_suspeitas.grau_bloqueio_av || "Presente"}` : ""}
${d.complicacoes_suspeitas?.bloqueio_ramo_direito ? "⚠️ Bloqueio de Ramo Direito" : ""}
${d.complicacoes_suspeitas?.bloqueio_ramo_esquerdo ? "⚠️ Bloqueio de Ramo Esquerdo (dificulta análise)" : ""}
${d.complicacoes_suspeitas?.taquicardia_ventricular ? "🚨 Taquicardia Ventricular" : ""}
${d.complicacoes_suspeitas?.fibrilacao_atrial ? "⚠️ Fibrilação Atrial" : ""}
${d.complicacoes_suspeitas?.sinais_choque_cardiogenico ? "🚨 SINAIS DE CHOQUE CARDIOGÊNICO" : ""}
${!d.complicacoes_suspeitas || Object.values(d.complicacoes_suspeitas).every(v => !v) ? "✓ Sem complicações evidentes no ECG" : ""}

═══════════════════════════════════════════════════════════════
🎯 6. DIAGNÓSTICO PRINCIPAL
═══════════════════════════════════════════════════════════════
${d.diagnostico_principal || "Análise em andamento"}

${d.localizacao_iam && d.localizacao_iam !== "Não aplicável" ? `
📍 Localização: ${d.localizacao_iam}
` : ""}

Gravidade: ${d.gravidade || "A determinar"}
${d.score_timi ? `TIMI Score: ${d.score_timi}/7` : ""}

═══════════════════════════════════════════════════════════════
💊 7. PROTOCOLO FARMACOLÓGICO ESPECÍFICO
═══════════════════════════════════════════════════════════════

${d.tratamento_farmacologico ? `
A) DUPLA ANTIAGREGAÇÃO PLAQUETÁRIA (DAPT):
   ${d.tratamento_farmacologico.terapia_antiplataquetaria?.asa || "• AAS 200-300mg VO (mastigado) - dose de ataque"}
   ${d.tratamento_farmacologico.terapia_antiplataquetaria?.inibidor_p2y12 || "• Ticagrelor 180mg VO (preferencial)"}

B) ANTICOAGULAÇÃO:
   ${d.tratamento_farmacologico.anticoagulacao?.heparina || "• Heparina NÃO-fracionada: bolus 60-70 UI/kg + infusão"}
   ${d.tratamento_farmacologico.anticoagulacao?.enoxaparina || "• OU Enoxaparina: 30mg IV + 1mg/kg SC 12/12h"}

C) TERAPIA ADJUVANTE:
${d.tratamento_farmacologico.terapia_adjuvante && d.tratamento_farmacologico.terapia_adjuvante.length > 0 ? 
  d.tratamento_farmacologico.terapia_adjuvante.map(t => `   • ${t}`).join('\n') :
  `   • Betabloqueador: Metoprolol 5mg IV → 25-50mg VO
   • IECA: Captopril 6,25mg VO (iniciar em 24h)
   • Estatina: Atorvastatina 80mg VO`}

${d.tratamento_farmacologico.tratamento_especifico_complicacoes && d.tratamento_farmacologico.tratamento_especifico_complicacoes.length > 0 ? `
D) TRATAMENTO DE COMPLICAÇÕES:
${d.tratamento_farmacologico.tratamento_especifico_complicacoes.map(t => `   • ${t}`).join('\n')}
` : ""}

${d.tratamento_farmacologico.contraindicacoes && d.tratamento_farmacologico.contraindicacoes.length > 0 ? `
⚠️ CONTRAINDICAÇÕES NESTE PACIENTE:
${d.tratamento_farmacologico.contraindicacoes.map(c => `   • ${c}`).join('\n')}
` : ""}
` : `
PROTOCOLO PADRÃO IAMCSST:
• AAS 200-300mg VO (mastigado)
• Ticagrelor 180mg VO ou Clopidogrel 600mg VO
• Heparina não-fracionada ou Enoxaparina
• Betabloqueador se sem contraindicação
• IECA/BRA em 24h
• Estatina de alta potência
`}

═══════════════════════════════════════════════════════════════
🚑 8. ESTRATÉGIA DE REPERFUSÃO
═══════════════════════════════════════════════════════════════
${d.estrategia_reperfusao ? `
📌 RECOMENDAÇÃO: ${d.estrategia_reperfusao.recomendacao || "ICP primária (preferencial)"}
⏱️ URGÊNCIA: ${d.estrategia_reperfusao.urgencia || "Emergência (<90min)"}

💡 JUSTIFICATIVA:
${d.estrategia_reperfusao.justificativa_estrategia || "Baseado no tipo de IAM e tempo de evolução"}
` : `
📌 ICP PRIMÁRIA (PREFERENCIAL)
   • Meta: Porta-balão <90 minutos
   • Restauração do fluxo coronariano

📌 FIBRINÓLISE (se ICP não disponível em <120min)
   • Tenecteplase ou Estreptoquinase
   • Avaliar contraindicações
`}

═══════════════════════════════════════════════════════════════
📝 9. INTERPRETAÇÃO RESUMIDA
═══════════════════════════════════════════════════════════════
${d.interpretacao_resumo || "Análise ECG completa realizada com identificação de padrões específicos."}

═══════════════════════════════════════════════════════════════
✅ 10. CRITÉRIOS DE IAM IDENTIFICADOS
═══════════════════════════════════════════════════════════════
${d.criterios_iam_identificados && d.criterios_iam_identificados.length > 0 ? 
  d.criterios_iam_identificados.map((c, i) => `${i+1}. ${c}`).join('\n') : 
  "Nenhum critério específico de IAM identificado neste ECG"}

${d.alerta_iam ? `
═══════════════════════════════════════════════════════════════
🚨 ALERTA MÁXIMO - IAM CONFIRMADO/MUITO PROVÁVEL
═══════════════════════════════════════════════════════════════

AÇÕES IMEDIATAS OBRIGATÓRIAS:

1. ☎️ COMUNICAR CARDIOLOGISTA/HEMODINÂMICA IMEDIATAMENTE
2. 💊 INICIAR DAPT (AAS + Ticagrelor/Clopidogrel) AGORA
3. 💉 ANTICOAGULAÇÃO (Heparina ou Enoxaparina)
4. 🏥 PREPARAR PARA ICP PRIMÁRIA (meta <90min)
5. 📊 MONITORIZAÇÃO CARDÍACA CONTÍNUA
6. 💧 ACESSO VENOSO CALIBROSO (2 acessos)
7. 🫁 OXIGÊNIO se SpO2 <90%
8. 🩺 REAVALIAR SINAIS VITAIS A CADA 5-15 MIN

META CRÍTICA: REPERFUSÃO EM ATÉ 90 MINUTOS DO 1º CONTATO MÉDICO

TEMPO É MÚSCULO CARDÍACO!
` : ""}

═══════════════════════════════════════════════════════════════
⚠️ AVISO MÉDICO-LEGAL IMPORTANTE
═══════════════════════════════════════════════════════════════
Esta análise por Inteligência Artificial é AUXILIAR e NÃO substitui
a interpretação por médico qualificado (cardiologista ou emergencista).

O ECG DEVE SER REVISADO por profissional habilitado antes de 
qualquer decisão terapêutica.

A IA pode apresentar ERROS de interpretação. A responsabilidade
clínica é EXCLUSIVA do médico assistente.

═══════════════════════════════════════════════════════════════
Desenvolvido por: Walber Alves Frazão Júnior - COREN 110.238
Sistema: Triagem de Dor Torácica - Base44 Platform
═══════════════════════════════════════════════════════════════`;

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
✓ Identificação da artéria culpada

CRITÉRIOS DE IAM POR PAREDE E ARTÉRIA:

• INFERIOR (DII, DIII, aVF): Supra ST ≥1mm em 2+ derivações
  → Artéria: Coronária Direita (CD) - 80-90%
  → Recíproca: Infra em aVL ou DI
  → Complicação: Bloqueio AV

• ANTERIOR (V1-V4): Supra ST ≥1mm (≥2mm em V2-V3)
  → Artéria: Descendente Anterior Esquerda (DAE)
  → Alto risco se anterior extenso

• LATERAL (DI, aVL, V5, V6): Supra ST ≥1mm
  → Artéria: Circunflexa (Cx) ou Diagonal

• POSTERIOR: Infra V1-V3 + Onda R alta
  → Artéria: Cx ou CD (conforme dominância)`);
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
      enfermeiro_nome: enfermeiro.nome,
      enfermeiro_coren: enfermeiro.coren,
      status: "Aguardando Médico"
    });
  };

  const tempoTriagemEcg = dadosPaciente.tempo_triagem_ecg_minutos;
  const temAlertaIAM = analiseEcg && (
    analiseEcg.includes("IAM") || 
    analiseEcg.includes("SUSPEITA") ||
    analiseEcg.includes("ALERTA MÁXIMO")
  );

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
                🔍 Análise AVANÇADA com IA especializada... Identificando artérias e protocolo farmacológico... Aguarde...
              </AlertDescription>
            </Alert>
          )}

          {temAlertaIAM && (
            <Alert className="border-red-500 bg-red-50 animate-pulse">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-800 font-bold text-base">
                🚨 ALERTA MÁXIMO: IAM detectado!
                Revise IMEDIATAMENTE análise completa + protocolo farmacológico abaixo.
              </AlertDescription>
            </Alert>
          )}

          {analiseEcg && (
            <div className="border-l-4 border-l-blue-600 bg-blue-50 p-4 rounded">
              <h4 className="font-semibold text-blue-900 mb-2">📊 Análise AVANÇADA de ECG por IA Especializada:</h4>
              <pre className="text-xs text-blue-800 whitespace-pre-wrap font-mono leading-relaxed">{analiseEcg}</pre>
              <div className="mt-4 p-3 bg-yellow-50 border-2 border-yellow-400 rounded">
                <p className="text-xs text-yellow-900 font-bold">
                  ⚠️ AVISO MÉDICO-LEGAL: Esta análise por IA é AUXILIAR. NÃO substitui interpretação por médico qualificado. 
                  A responsabilidade clínica é EXCLUSIVA do médico assistente.
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