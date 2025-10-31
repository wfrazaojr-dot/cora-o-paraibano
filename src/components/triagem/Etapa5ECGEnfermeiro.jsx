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
            qualidade_imagem: {
              type: "string",
              enum: ["Excelente", "Boa", "Regular", "Ruim", "Ilegível"],
              description: "Qualidade geral da imagem do ECG"
            },
            consegue_ver_12_derivacoes: {
              type: "boolean",
              description: "Você consegue ver claramente as 12 derivações do ECG?"
            },
            observacao_visual_derivacao_por_derivacao: {
              type: "object",
              properties: {
                DI: { type: "string", description: "O que você VÊ em DI? Descreva apenas o que vê visualmente (ST elevado/deprimido/normal, QRS largo/estreito, etc)" },
                DII: { type: "string", description: "O que você VÊ em DII?" },
                DIII: { type: "string", description: "O que você VÊ em DIII?" },
                aVR: { type: "string", description: "O que você VÊ em aVR?" },
                aVL: { type: "string", description: "O que você VÊ em aVL?" },
                aVF: { type: "string", description: "O que você VÊ em aVF?" },
                V1: { type: "string", description: "O que você VÊ em V1?" },
                V2: { type: "string", description: "O que você VÊ em V2?" },
                V3: { type: "string", description: "O que você VÊ em V3?" },
                V4: { type: "string", description: "O que você VÊ em V4?" },
                V5: { type: "string", description: "O que você VÊ em V5?" },
                V6: { type: "string", description: "O que você VÊ em V6?" }
              }
            },
            ritmo_observado: {
              type: "string",
              description: "Que ritmo você observa? (Sinusal regular, irregular, etc) - Seja descritivo, não diagnóstico"
            },
            frequencia_estimada: {
              type: "string",
              description: "Frequência estimada em bpm ou faixa aproximada"
            },
            elevacao_st_detectada: {
              type: "boolean",
              description: "Você consegue VER elevação do segmento ST em ALGUMA derivação?"
            },
            derivacoes_com_elevacao_st_visiveis: {
              type: "array",
              items: { type: "string" },
              description: "Liste APENAS as derivações onde você VÊ elevação de ST. Seja ESPECÍFICO e HONESTO. Se não vê, deixe vazio."
            },
            validacao_territorio: {
              type: "object",
              properties: {
                v1_a_v4_tem_elevacao: {
                  type: "boolean",
                  description: "V1, V2, V3 ou V4 têm elevação de ST? TRUE apenas se você VER elevação nessas derivações"
                },
                ii_iii_avf_tem_elevacao: {
                  type: "boolean",
                  description: "II, III ou aVF têm elevação de ST? TRUE apenas se você VER elevação nessas derivações"
                },
                i_avl_v5_v6_tem_elevacao: {
                  type: "boolean",
                  description: "I, aVL, V5 ou V6 têm elevação de ST? TRUE apenas se você VER elevação nessas derivações"
                }
              }
            },
            territorio_afetado_baseado_nas_derivacoes: {
              type: "string",
              enum: [
                "Nenhum - não vejo alterações significativas",
                "Anterior (V1-V4) - porque vejo alterações nessas derivações",
                "Inferior (II, III, aVF) - porque vejo alterações nessas derivações",
                "Lateral (I, aVL, V5-V6) - porque vejo alterações nessas derivações",
                "Múltiplos territórios",
                "Não consigo determinar com confiança"
              ],
              description: "Baseado APENAS nas derivações onde você VIU alterações, qual território? IMPORTANTE: Anterior = V1-V4, Inferior = II,III,aVF, Lateral = I,aVL,V5-V6"
            },
            justificativa_territorio: {
              type: "string",
              description: "EXPLIQUE detalhadamente POR QUE você identificou esse território. Cite as derivações específicas e o que viu nelas. Ex: 'Identifiquei território anterior porque VI elevação de ST em V2, V3 e V4, com magnitude de aproximadamente 2-3mm'"
            },
            depressao_st_detectada: {
              type: "boolean",
              description: "Você vê depressão do segmento ST?"
            },
            derivacoes_com_depressao_st: {
              type: "array",
              items: { type: "string" },
              description: "Derivações com depressão de ST (se houver)"
            },
            ondas_t_anormais: {
              type: "boolean",
              description: "Você vê ondas T invertidas, achatadas ou hiperagudas?"
            },
            descricao_ondas_t: {
              type: "string",
              description: "Descreva as alterações nas ondas T, se houver"
            },
            ondas_q_visiveis: {
              type: "boolean",
              description: "Você vê ondas Q proeminentes?"
            },
            derivacoes_com_ondas_q: {
              type: "array",
              items: { type: "string" },
              description: "Derivações com ondas Q (se houver)"
            },
            qrs_alargado: {
              type: "boolean",
              description: "O complexo QRS parece alargado (≥3 quadradinhos)?"
            },
            nivel_alerta: {
              type: "string",
              enum: [
                "CRÍTICO - Possível STEMI - alterações em derivações específicas sugerem isquemia aguda",
                "ALTO - Alterações isquêmicas suspeitas - requer avaliação urgente",
                "MODERADO - Alterações inespecíficas - investigação necessária",
                "BAIXO - Sem alterações agudas evidentes",
                "INCONCLUSIVO - Qualidade insuficiente para análise confiável"
              ],
              description: "Nível de alerta baseado nos achados"
            },
            confianca: {
              type: "string",
              enum: ["Alta", "Moderada", "Baixa", "Muito Baixa"],
              description: "Qual seu nível de confiança nesta análise?"
            },
            limitacoes: {
              type: "array",
              items: { type: "string" },
              description: "Limitações que afetam esta análise"
            },
            resumo_pt: {
              type: "string",
              description: "Resumo em português do que você OBSERVOU (não diagnósticos). Seja específico sobre derivações."
            }
          },
          required: ["qualidade_imagem", "consegue_ver_12_derivacoes"]
        };

        const contextoPaciente = `
CONTEXTO DO PACIENTE:
- Idade: ${dadosPaciente.idade} anos
- Sexo: ${dadosPaciente.sexo}
- Queixa: Dor torácica
- Alerta IAM na triagem: ${dadosPaciente.triagem_cardiologica?.alerta_iam ? 'SIM' : 'NÃO'}
`;

        const promptRigoroso = `You are analyzing an ECG image. You MUST be EXTREMELY ACCURATE about which leads show changes.

${contextoPaciente}

═══════════════════════════════════════════════════════════════
CRITICAL INSTRUCTIONS - READ CAREFULLY
═══════════════════════════════════════════════════════════════

THIS IS A LIFE-CRITICAL TASK. ACCURACY IS PARAMOUNT.

COMMON ERRORS TO AVOID:
❌ Saying "inferior wall" when it's actually "anterior wall"
❌ Confusing V1-V4 (anterior) with II,III,aVF (inferior)
❌ Making assumptions without seeing actual ST changes
❌ Being overconfident when image quality is poor

STEP-BY-STEP ANALYSIS PROTOCOL:

STEP 1: IMAGE QUALITY
───────────────────────
Can you clearly see a 12-lead ECG?
- Are the leads labeled (I, II, III, aVR, aVL, aVF, V1, V2, V3, V4, V5, V6)?
- Is the tracing clear enough to assess ST segments?
- If NO → Set qualidade_imagem: "Ruim" or "Ilegível" and STOP

STEP 2: DESCRIBE WHAT YOU SEE IN EACH LEAD
────────────────────────────────────────────
For EACH of the 12 leads, describe VISUALLY what you observe:
- Is the ST segment elevated, depressed, or isoelectric (at baseline)?
- Is the QRS narrow or wide?
- Are T waves normal, inverted, flat, or peaked?

Be HONEST. If you can't see a lead clearly, say "Cannot assess clearly"

EXAMPLE GOOD RESPONSES:
- "ST segment appears elevated approximately 2-3mm above baseline"
- "ST segment appears isoelectric (at baseline level)"
- "Cannot assess ST segment clearly in this lead due to artifact"

STEP 3: IDENTIFY WHICH LEADS SHOW ST ELEVATION
───────────────────────────────────────────────
Look at each lead and ask: Do I SEE ST elevation here?

Remember the paper grid:
- 1 small square = 1mm
- ST elevation significant if ≥1mm in limb leads
- ST elevation significant if ≥2mm in V2-V3

List ONLY the leads where you ACTUALLY SEE elevation.
Do NOT guess or assume.

STEP 4: VALIDATE TERRITORY CORRELATION
───────────────────────────────────────
Now VERIFY your findings make sense:

IF you see ST elevation in V1, V2, V3, or V4:
→ Territory is ANTERIOR
→ Set v1_a_v4_tem_elevacao: TRUE
→ Set territorio: "Anterior (V1-V4) - porque vejo alterações nessas derivações"

IF you see ST elevation in II, III, or aVF:
→ Territory is INFERIOR
→ Set ii_iii_avf_tem_elevacao: TRUE
→ Set territorio: "Inferior (II, III, aVF) - porque vejo alterações nessas derivações"

IF you see ST elevation in I, aVL, V5, or V6:
→ Territory is LATERAL
→ Set i_avl_v5_v6_tem_elevacao: TRUE
→ Set territorio: "Lateral (I, aVL, V5-V6) - porque vejo alterações nessas derivações"

IF you see NO clear ST elevation:
→ Set territorio: "Nenhum - não vejo alterações significativas"

STEP 5: JUSTIFY YOUR CONCLUSION
────────────────────────────────
In justificativa_territorio, EXPLAIN your reasoning:

GOOD EXAMPLE:
"Identifiquei território anterior porque observei elevação do segmento ST nas derivações V2 (aproximadamente 3mm), V3 (aproximadamente 4mm) e V4 (aproximadamente 2mm). Essas derivações correspondem à parede anterior do ventrículo esquerdo, suprida pela artéria descendente anterior esquerda."

BAD EXAMPLE (DON'T DO THIS):
"Território inferior afetado" (without explaining which leads you saw changes in)

STEP 6: CROSS-CHECK YOUR WORK
──────────────────────────────
Before submitting your response, verify:

✓ Did I list specific leads where I saw ST elevation?
✓ Does my territorio match the leads I listed?
✓ Did I explain WHY I identified that territorio?
✓ Am I being honest about what I can and cannot see?

CRITICAL REMINDERS:
═══════════════════

1. ANTERIOR WALL = V1, V2, V3, V4 (precordial leads)
2. INFERIOR WALL = II, III, aVF (inferior limb leads)  
3. LATERAL WALL = I, aVL, V5, V6

4. If you see ST elevation in V1-V4 → It's ANTERIOR, NOT inferior
5. If you see ST elevation in II,III,aVF → It's INFERIOR, NOT anterior

6. Be CONSERVATIVE. If unsure → Say "Não consigo determinar com confiança"

7. NEVER make up findings. Only report what you ACTUALLY SEE.

8. Your justificativa MUST cite specific leads and what you saw.

Now analyze the ECG image carefully and respond in JSON format.
Be accurate. Be specific. Be honest about limitations.
`;

        const resultado = await base44.integrations.Core.InvokeLLM({
          prompt: promptRigoroso,
          file_urls: novosFiles[0],
          response_json_schema: ecgSchema
        });

        if (resultado) {
          setAchadosEstruturados(resultado);
          
          const d = resultado;
          
          let relatorio = `╔══════════════════════════════════════════════════════════╗
║         🏥 ANÁLISE DE ECG POR IA - TRIAGEM PRELIMINAR    ║
╚══════════════════════════════════════════════════════════╝

⚠️ ATENÇÃO: Esta é uma análise preliminar que pode conter erros.
TODOS os ECGs devem ser interpretados por médico qualificado.

QUALIDADE DA IMAGEM: ${d.qualidade_imagem || "Não avaliada"}
12 DERIVAÇÕES VISÍVEIS: ${d.consegue_ver_12_derivacoes ? "SIM" : "NÃO"}
CONFIANÇA NA ANÁLISE: ${d.confianca || "Não especificada"}

${!d.consegue_ver_12_derivacoes ? `
⚠️ NÃO FOI POSSÍVEL VISUALIZAR TODAS AS 12 DERIVAÇÕES
A análise pode estar comprometida.
Recomenda-se repetir o ECG ou interpretação médica manual.

` : ''}

┌──────────────────────────────────────────────────────────┐
│ OBSERVAÇÕES VISUAIS DERIVAÇÃO POR DERIVAÇÃO              │
└──────────────────────────────────────────────────────────┘

${d.observacao_visual_derivacao_por_derivacao ? `
Derivação I:   ${d.observacao_visual_derivacao_por_derivacao.DI || 'Não avaliada'}
Derivação II:  ${d.observacao_visual_derivacao_por_derivacao.DII || 'Não avaliada'}
Derivação III: ${d.observacao_visual_derivacao_por_derivacao.DIII || 'Não avaliada'}
Derivação aVR: ${d.observacao_visual_derivacao_por_derivacao.aVR || 'Não avaliada'}
Derivação aVL: ${d.observacao_visual_derivacao_por_derivacao.aVL || 'Não avaliada'}
Derivação aVF: ${d.observacao_visual_derivacao_por_derivacao.aVF || 'Não avaliada'}

Derivação V1:  ${d.observacao_visual_derivacao_por_derivacao.V1 || 'Não avaliada'}
Derivação V2:  ${d.observacao_visual_derivacao_por_derivacao.V2 || 'Não avaliada'}
Derivação V3:  ${d.observacao_visual_derivacao_por_derivacao.V3 || 'Não avaliada'}
Derivação V4:  ${d.observacao_visual_derivacao_por_derivacao.V4 || 'Não avaliada'}
Derivação V5:  ${d.observacao_visual_derivacao_por_derivacao.V5 || 'Não avaliada'}
Derivação V6:  ${d.observacao_visual_derivacao_por_derivacao.V6 || 'Não avaliada'}
` : 'Observações por derivação não disponíveis'}

┌──────────────────────────────────────────────────────────┐
│ RITMO E FREQUÊNCIA                                        │
└──────────────────────────────────────────────────────────┘
Ritmo Observado: ${d.ritmo_observado || 'Não identificado'}
Frequência Estimada: ${d.frequencia_estimada || 'Não calculada'}

┌──────────────────────────────────────────────────────────┐
│ SEGMENTO ST                                               │
└──────────────────────────────────────────────────────────┘
${d.elevacao_st_detectada ? `
🚨 ELEVAÇÃO DE ST DETECTADA

Derivações com elevação visível:
${d.derivacoes_com_elevacao_st_visiveis && d.derivacoes_com_elevacao_st_visiveis.length > 0 ? 
  d.derivacoes_com_elevacao_st_visiveis.map(deriv => `  • ${deriv}`).join('\n') : 
  '  (Nenhuma derivação específica listada)'}

VALIDAÇÃO DE TERRITÓRIO:
  V1-V4 tem elevação? ${d.validacao_territorio?.v1_a_v4_tem_elevacao ? 'SIM → Sugere ANTERIOR' : 'NÃO'}
  II,III,aVF tem elevação? ${d.validacao_territorio?.ii_iii_avf_tem_elevacao ? 'SIM → Sugere INFERIOR' : 'NÃO'}
  I,aVL,V5-V6 tem elevação? ${d.validacao_territorio?.i_avl_v5_v6_tem_elevacao ? 'SIM → Sugere LATERAL' : 'NÃO'}

` : 'Sem elevação significativa de ST detectada'}

${d.depressao_st_detectada && d.derivacoes_com_depressao_st && d.derivacoes_com_depressao_st.length > 0 ? `
⚠️ DEPRESSÃO DE ST DETECTADA
Derivações: ${d.derivacoes_com_depressao_st.join(", ")}
` : ''}

┌──────────────────────────────────────────────────────────┐
│ TERRITÓRIO MIOCÁRDICO AFETADO                             │
└──────────────────────────────────────────────────────────┘
${d.territorio_afetado_baseado_nas_derivacoes || 'Não determinado'}

${d.justificativa_territorio ? `
JUSTIFICATIVA DETALHADA:
${d.justificativa_territorio}
` : 'Justificativa não fornecida'}

┌──────────────────────────────────────────────────────────┐
│ OUTROS ACHADOS                                            │
└──────────────────────────────────────────────────────────┘
${d.ondas_t_anormais ? `
⚠️ Alterações nas ondas T:
${d.descricao_ondas_t || 'Não descrito'}
` : 'Ondas T sem alterações evidentes'}

${d.ondas_q_visiveis && d.derivacoes_com_ondas_q && d.derivacoes_com_ondas_q.length > 0 ? `
⚠️ Ondas Q proeminentes em: ${d.derivacoes_com_ondas_q.join(", ")}
` : ''}

${d.qrs_alargado ? '⚠️ Complexo QRS aparenta estar alargado' : ''}

╔══════════════════════════════════════════════════════════╗
║                    ${d.nivel_alerta || 'NÍVEL DE ALERTA NÃO DEFINIDO'}                                     ║
╚══════════════════════════════════════════════════════════╝

${d.limitacoes && d.limitacoes.length > 0 ? `
┌──────────────────────────────────────────────────────────┐
│ ⚠️ LIMITAÇÕES DESTA ANÁLISE                              │
└──────────────────────────────────────────────────────────┘
${d.limitacoes.map((lim, i) => `${i+1}. ${lim}`).join('\n')}
` : ''}

┌──────────────────────────────────────────────────────────┐
│ RESUMO EM PORTUGUÊS                                       │
└──────────────────────────────────────────────────────────┘
${d.resumo_pt || 'Resumo não disponível'}

╔══════════════════════════════════════════════════════════╗
║ ⚠️⚠️⚠️ AVISOS CRÍTICOS ⚠️⚠️⚠️                          ║
╚══════════════════════════════════════════════════════════╝

❌ Esta análise por IA pode conter ERROS
❌ NÃO é um diagnóstico médico oficial
❌ Sistemas especializados (Philips, GE) são mais confiáveis

✓ TODOS os ECGs DEVEM ser interpretados por médico qualificado
✓ Em caso de dúvida, SEMPRE peça avaliação médica
✓ Correlacione com quadro clínico do paciente
✓ ECG normal NÃO exclui síndrome coronariana aguda

Análise realizada em: ${new Date().toLocaleString('pt-BR')}
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
✓ Segmento ST (elevação/depressão)
✓ Territórios afetados
✓ Ondas T e Q patológicas

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Eletrocardiograma (ECG)</h2>
        <p className="text-gray-600">Anexe o ECG do paciente e identifique o enfermeiro responsável</p>
      </div>

      <Alert className="border-red-500 bg-red-50">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>⚠️ AVISO CRÍTICO:</strong> A análise automática por IA é preliminar e pode conter erros graves, incluindo identificação incorreta de territórios afetados. 
          <strong className="block mt-1">MÉDICO DEVE INTERPRETAR PESSOALMENTE ANTES DE QUALQUER CONDUTA.</strong>
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
              <p className="text-xs text-gray-500 mt-1">Imagem ou PDF do ECG de 12 derivações</p>
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
                    Tempo triagem → ECG: <strong>{tempoTriagemEcg} min</strong>
                    {tempoTriagemEcg <= 10 ? " ✓" : " ⚠️ >10 min"}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {analyzing && (
            <Alert className="border-blue-500 bg-blue-50">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <AlertDescription className="text-blue-800 text-sm">
                🔍 Analisando ECG derivação por derivação... Aguarde...
              </AlertDescription>
            </Alert>
          )}

          {achadosEstruturados && (
            <Card className="border-2 border-purple-300 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="w-5 h-5" />
                  🤖 Análise Preliminar por IA
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Alert className="border-yellow-500 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-900 text-sm">
                    <strong>Confiança: {achadosEstruturados.confianca}</strong>
                    <br/>Qualidade: {achadosEstruturados.qualidade_imagem}
                  </AlertDescription>
                </Alert>

                {achadosEstruturados.territorio_afetado_baseado_nas_derivacoes && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-300">
                    <p className="font-semibold text-blue-900 text-sm mb-1">Território Identificado:</p>
                    <p className="text-sm text-blue-800">{achadosEstruturados.territorio_afetado_baseado_nas_derivacoes}</p>
                    {achadosEstruturados.justificativa_territorio && (
                      <div className="mt-2 p-2 bg-white rounded text-xs text-gray-700">
                        <strong>Justificativa:</strong> {achadosEstruturados.justificativa_territorio}
                      </div>
                    )}
                  </div>
                )}

                {achadosEstruturados.resumo_pt && (
                  <div className="bg-gray-50 p-3 rounded border text-sm">
                    <strong className="text-gray-900">Resumo:</strong>
                    <p className="text-gray-700 mt-1">{achadosEstruturados.resumo_pt}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {analiseEcg && (
            <details className="border-l-4 border-l-blue-600 bg-blue-50 p-4 rounded">
              <summary className="font-semibold text-blue-900 cursor-pointer">📊 Ver Relatório Completo</summary>
              <pre className="text-xs text-blue-800 whitespace-pre-wrap font-mono leading-relaxed mt-3 max-h-96 overflow-y-auto bg-white p-3 rounded">
                {analiseEcg}
              </pre>
            </details>
          )}
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-bold text-lg mb-4">Identificação do Enfermeiro Responsável</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="enfermeiro_nome">Nome Completo *</Label>
            <Input
              id="enfermeiro_nome"
              value={enfermeiro.nome}
              onChange={(e) => setEnfermeiro({...enfermeiro, nome: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="enfermeiro_coren">COREN *</Label>
            <Input
              id="enfermeiro_coren"
              value={enfermeiro.coren}
              onChange={(e) => setEnfermeiro({...enfermeiro, coren: e.target.value})}
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
          Concluir Triagem
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}