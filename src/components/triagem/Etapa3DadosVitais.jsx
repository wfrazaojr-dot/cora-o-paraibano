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
        const ecgSchema = {
          type: "object",
          properties: {
            ritmo: { 
              type: "string", 
              description: "Tipo de ritmo cardíaco: Sinusal, Fibrilação Atrial, Flutter, Taquicardia, etc." 
            },
            frequencia_cardiaca: { 
              type: "number", 
              description: "Frequência cardíaca em batimentos por minuto (bpm)" 
            },
            intervalo_pr: { 
              type: "number", 
              description: "Intervalo PR medido em milissegundos. Normal: 120-200ms" 
            },
            duracao_qrs: { 
              type: "number", 
              description: "Duração do complexo QRS em milissegundos. Normal: <120ms" 
            },
            intervalo_qt: { 
              type: "number", 
              description: "Intervalo QT em milissegundos" 
            },
            intervalo_qtc: {
              type: "number",
              description: "Intervalo QT corrigido pela frequência cardíaca"
            },
            eixo_qrs: {
              type: "string",
              description: "Eixo elétrico do QRS: Normal, Desvio à esquerda, Desvio à direita"
            },
            segmento_st_elevado: { 
              type: "boolean", 
              description: "IMPORTANTE: Só marcar TRUE se houver ELEVAÇÃO clara do segmento ST de pelo menos 1mm (1 quadradinho pequeno) acima da linha isoelétrica em 2 ou mais derivações CONTÍGUAS. Seja CONSERVADOR e PRECISO. Não confundir repolarização precoce benigna com IAMCSST." 
            },
            derivacoes_st_elevado: { 
              type: "string", 
              description: "Liste APENAS as derivações que apresentam elevação REAL do segmento ST ≥1mm. Exemplo: 'V2, V3, V4' ou 'II, III, aVF'. Se não houver elevação, escrever 'Nenhuma'" 
            },
            magnitude_elevacao_st_mm: {
              type: "number",
              description: "Magnitude da maior elevação do ST em milímetros. Se não houver, colocar 0"
            },
            segmento_st_deprimido: { 
              type: "boolean", 
              description: "Se há depressão do segmento ST ≥1mm abaixo da linha isoelétrica" 
            },
            derivacoes_st_deprimido: { 
              type: "string", 
              description: "Derivações com depressão do ST. Se nenhuma: 'Nenhuma'" 
            },
            ondas_t_invertidas: { 
              type: "boolean", 
              description: "Se há inversão das ondas T" 
            },
            derivacoes_t_invertidas: {
              type: "string",
              description: "Derivações com ondas T invertidas"
            },
            ondas_q_patologicas: { 
              type: "boolean", 
              description: "Ondas Q patológicas: >40ms de duração OU >25% da amplitude do QRS" 
            },
            derivacoes_q_patologicas: {
              type: "string",
              description: "Derivações com ondas Q patológicas"
            },
            bloqueio_ramo_direito: {
              type: "boolean",
              description: "Bloqueio de Ramo Direito: QRS ≥120ms + padrão rsR' em V1-V2"
            },
            bloqueio_ramo_esquerdo: {
              type: "boolean",
              description: "Bloqueio de Ramo Esquerdo: QRS ≥120ms + QS ou rS em V1 + R empastada em I, aVL, V5-V6"
            },
            bloqueio_av: {
              type: "string",
              description: "Bloqueio AV: Nenhum, 1º grau (PR>200ms), 2º grau Mobitz I ou II, 3º grau"
            },
            hipertrofia_ventricular_esquerda: {
              type: "boolean",
              description: "HVE pelos critérios de Sokolow-Lyon ou Cornell"
            },
            padrao_identificado: {
              type: "string",
              description: "Padrões específicos: Wellens, Winter, Sgarbossa, Brugada, Repolarização Precoce, Pericardite, ou 'Nenhum padrão específico'"
            },
            interpretacao_resumo: { 
              type: "string", 
              description: "Interpretação resumida em 1-2 frases do achado principal do ECG" 
            },
            alerta_iam: { 
              type: "boolean", 
              description: "Marcar TRUE APENAS se houver FORTE evidência de IAM: Supra ST ≥1mm em 2+ derivações contíguas OU padrão de Wellens OU critérios de Sgarbossa positivos. NÃO marcar TRUE para alterações inespecíficas." 
            },
            localizacao_iam: {
              type: "string",
              description: "Se houver IAM, qual a localização: Anterior, Inferior, Lateral, Septal, Posterior, VD, ou 'Não aplicável'"
            },
            arteria_culpada: {
              type: "string",
              description: "Se houver IAM, artéria provavelmente acometida: DAE (Descendente Anterior Esquerda), CD (Coronária Direita), Cx (Circunflexa), TCE (Tronco Coronária Esquerda), ou 'Não aplicável'"
            }
          }
        };

        const resultado = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: novosFiles[0],
          json_schema: ecgSchema
        });

        if (resultado.status === "success" && resultado.output) {
          const d = resultado.output;
          
          let relatorio = `═══════════════════════════════════════════════════════════════
ANÁLISE AUTOMATIZADA DE ECG
═══════════════════════════════════════════════════════════════

1. RITMO E FREQUÊNCIA
   - Ritmo: ${d.ritmo || "Não identificado"}
   - Frequência Cardíaca: ${d.frequencia_cardiaca || "N/A"} bpm

2. INTERVALOS
   - Intervalo PR: ${d.intervalo_pr || "N/A"} ms ${d.intervalo_pr ? (d.intervalo_pr >= 120 && d.intervalo_pr <= 200 ? "(✓ Normal)" : d.intervalo_pr < 120 ? "(⚠ Curto)" : "(⚠ Prolongado)") : ""}
   - Duração QRS: ${d.duracao_qrs || "N/A"} ms ${d.duracao_qrs ? (d.duracao_qrs < 120 ? "(✓ Normal)" : "(⚠ Alargado)") : ""}
   - Intervalo QT: ${d.intervalo_qt || "N/A"} ms
   - QTc corrigido: ${d.intervalo_qtc || "N/A"} ms

3. EIXO CARDÍACO
   - Eixo QRS: ${d.eixo_qrs || "Não determinado"}

4. ⚠️ ANÁLISE DO SEGMENTO ST (CRÍTICO)
   
   A) SUPRADESNIVELAMENTO DO ST:
   ${d.segmento_st_elevado ? `
   🚨🚨🚨 ELEVAÇÃO DO SEGMENTO ST IDENTIFICADA 🚨🚨🚨
   - Derivações acometidas: ${d.derivacoes_st_elevado}
   - Magnitude da elevação: ${d.magnitude_elevacao_st_mm || "N/A"} mm
   - Morfologia: ${d.segmento_st_elevado ? "Elevação presente" : ""}
   
   ⚠️⚠️⚠️ POSSÍVEL IAMCSST (IAM COM SUPRA DE ST) ⚠️⚠️⚠️
   ${d.localizacao_iam && d.localizacao_iam !== "Não aplicável" ? `- Localização: Parede ${d.localizacao_iam}` : ""}
   ${d.arteria_culpada && d.arteria_culpada !== "Não aplicável" ? `- Artéria culpada provável: ${d.arteria_culpada}` : ""}
   ` : `   - Não há elevação significativa do segmento ST (≥1mm)`}
   
   B) INFRADESNIVELAMENTO DO ST:
   ${d.segmento_st_deprimido ? `
   - Depressão do ST presente
   - Derivações: ${d.derivacoes_st_deprimido}
   - Pode indicar: Isquemia subendocárdica ou alteração recíproca
   ` : `   - Sem depressão significativa do segmento ST`}

5. ONDAS T
   ${d.ondas_t_invertidas ? `
   - Ondas T invertidas presentes
   - Derivações: ${d.derivacoes_t_invertidas}
   - Pode indicar: Isquemia, IAM em evolução, ou padrão de Wellens
   ` : `   - Ondas T sem inversões significativas`}

6. ONDAS Q
   ${d.ondas_q_patologicas ? `
   - Ondas Q patológicas presentes
   - Derivações: ${d.derivacoes_q_patologicas}
   - Sugere: IAM prévio ou em evolução
   ` : `   - Sem ondas Q patológicas`}

7. BLOQUEIOS E DISTÚRBIOS DE CONDUÇÃO
   ${d.bloqueio_ramo_direito ? "- Bloqueio de Ramo Direito (BRD)" : ""}
   ${d.bloqueio_ramo_esquerdo ? "- Bloqueio de Ramo Esquerdo (BRE)" : ""}
   ${d.bloqueio_av && d.bloqueio_av !== "Nenhum" ? `- Bloqueio AV: ${d.bloqueio_av}` : "- Sem bloqueios AV"}
   ${!d.bloqueio_ramo_direito && !d.bloqueio_ramo_esquerdo ? "- Sem bloqueios de ramo" : ""}

8. HIPERTROFIAS
   ${d.hipertrofia_ventricular_esquerda ? "- Critérios para Hipertrofia Ventricular Esquerda presentes" : "- Sem critérios para hipertrofia ventricular"}

9. PADRÕES ESPECÍFICOS
   ${d.padrao_identificado && d.padrao_identificado !== "Nenhum padrão específico" ? `
   ⚠️ Padrão identificado: ${d.padrao_identificado}
   ` : "- Nenhum padrão específico identificado"}

═══════════════════════════════════════════════════════════════
🎯 INTERPRETAÇÃO E CONCLUSÃO
═══════════════════════════════════════════════════════════════

${d.interpretacao_resumo || "ECG analisado"}

${d.alerta_iam ? `
🚨🚨🚨 ALERTA DE EMERGÊNCIA 🚨🚨🚨

FORTE SUSPEITA DE INFARTO AGUDO DO MIOCÁRDIO (IAM)
${d.localizacao_iam && d.localizacao_iam !== "Não aplicável" ? `Localização: ${d.localizacao_iam}` : ""}
${d.arteria_culpada && d.arteria_culpada !== "Não aplicável" ? `Artéria: ${d.arteria_culpada}` : ""}

⚠️ CONDUTA URGENTE NECESSÁRIA:
• Comunicar médico IMEDIATAMENTE
• Avaliar reperfusão (ICP primária ou fibrinólise)
• AAS + Antiagregante duplo
• Anticoagulação
• Monitorização contínua
` : ""}

═══════════════════════════════════════════════════════════════
📋 NOTAS IMPORTANTES
═══════════════════════════════════════════════════════════════
✓ Esta análise automatizada é AUXILIAR
✓ Todo ECG deve ser interpretado por MÉDICO QUALIFICADO
✓ Decisões clínicas devem basear-se em avaliação médica completa
✓ Considerar quadro clínico, exames laboratoriais e evolução
═══════════════════════════════════════════════════════════════`;

          setAnaliseEcg(relatorio);
        } else {
          throw new Error("Falha na extração");
        }

      } catch (error) {
        console.error("Erro na análise automática:", error);
        
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

3️⃣ EIXO CARDÍACO
   □ Eixo QRS: Normal / Desvio esquerda / Desvio direita

4️⃣ ⚠️ SEGMENTO ST (CRÍTICO) - MEDIR DO PONTO J
   
   IMPORTANTE: Medir 80ms (2 quadradinhos) após o ponto J
   
   □ ELEVAÇÃO ST ≥1mm em 2+ derivações CONTÍGUAS?: 
      SIM □ NÃO □
   
   □ Se SIM, derivações: __________________
   □ Magnitude: ______ mm
   □ Morfologia: Côncava / Convexa / Retificada
   
   □ DEPRESSÃO ST?: SIM □ NÃO □
   □ Derivações: __________________

5️⃣ ONDAS T
   □ Inversão de T?: SIM □ NÃO □
   □ Derivações: __________________
   □ Ondas T bifásicas (Wellens)?: SIM □ NÃO □

6️⃣ ONDAS Q PATOLÓGICAS
   □ Q >40ms OU >1/3 do QRS?: SIM □ NÃO □
   □ Localização: __________________

7️⃣ BLOQUEIOS
   □ BRD / BRE / BAV: __________________

8️⃣ PADRÕES ESPECÍFICOS
   □ Síndrome de Wellens
   □ Padrão de Winter
   □ Critérios de Sgarbossa (IAM + BRE)
   □ Síndrome de Brugada
   □ Pericardite
   □ Repolarização precoce benigna

═══════════════════════════════════════════════════════════════
🚨 CRITÉRIOS PARA IAMCSST:
═══════════════════════════════════════════════════════════════

Supra ST ≥1mm em 2+ derivações CONTÍGUAS:

ANTERIOR: V1-V6, I, aVL → DAE (Descendente Anterior)
INFERIOR: II, III, aVF → CD (Coronária Direita)
LATERAL: I, aVL, V5-V6 → Cx (Circunflexa)
POSTERIOR: V7-V9 (infra ST em V1-V3 = supra posterior)
VD: V3R, V4R → Ramo VD da CD

═══════════════════════════════════════════════════════════════
⏱️ Meta de tempo: ECG realizado em ${tempoMinutos} min ${tempoMinutos <= 10 ? '✓' : '⚠️'}
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
    analiseEcg.includes("FORTE SUSPEITA DE INFARTO") ||
    analiseEcg.includes("ELEVAÇÃO DO SEGMENTO ST IDENTIFICADA") ||
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
                Processando análise detalhada do ECG... Aguarde...
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