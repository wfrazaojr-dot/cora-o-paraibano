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
            ritmo: { type: "string", description: "Tipo de ritmo cardíaco" },
            frequencia_cardiaca: { type: "number", description: "FC em bpm" },
            parede_inferior_dii_diii_avf: {
              type: "object",
              description: "Análise da parede INFERIOR (DII, DIII, aVF). Se 2+ destas 3 derivações têm elevação ≥1mm = IAM INFERIOR",
              properties: {
                elevacao_st: { type: "boolean", description: "TRUE se DII, DIII ou aVF têm supra ≥1mm" },
                derivacoes_elevadas: { type: "string", description: "Quais estão elevadas. Ex: DII e DIII" },
                magnitude_mm: { type: "number", description: "Maior elevação em mm" }
              }
            },
            parede_anterior_v1_v2_v3_v4: {
              type: "object",
              description: "Análise da parede ANTERIOR (V1-V4)",
              properties: {
                elevacao_st: { type: "boolean", description: "TRUE se V1-V4 têm supra ≥1mm (≥2mm em V2-V3)" },
                derivacoes_elevadas: { type: "string" },
                magnitude_mm: { type: "number" }
              }
            },
            parede_lateral_di_avl_v5_v6: {
              type: "object",
              description: "Análise da parede LATERAL (DI, aVL, V5, V6)",
              properties: {
                elevacao_st: { type: "boolean" },
                derivacoes_elevadas: { type: "string" },
                magnitude_mm: { type: "number" }
              }
            },
            alteracoes_reciprocas: {
              type: "object",
              description: "Alterações recíprocas CONFIRMAM IAM. Ex: Infra em aVL quando há supra em DII/DIII/aVF",
              properties: {
                infra_avl: { type: "boolean", description: "TRUE se aVL tem infra ≥1mm (recíproca de IAM inferior)" },
                infra_di: { type: "boolean", description: "TRUE se DI tem infra ≥1mm (recíproca de IAM inferior)" },
                infra_v1_v2_v3: { type: "boolean", description: "TRUE se V1-V3 têm infra (recíproca de IAM posterior)" }
              }
            },
            criterios_iam_identificados: {
              type: "array",
              items: { type: "string" },
              description: "Liste TODOS os critérios de IAM. Ex: ['Supra ≥1mm em DII e DIII', 'Infra recíproco em aVL']"
            },
            ondas_q_patologicas: { type: "boolean" },
            derivacoes_q_patologicas: { type: "string" },
            bloqueio_ramo_esquerdo: { type: "boolean" },
            bloqueio_ramo_direito: { type: "boolean" },
            diagnostico_principal: { type: "string", description: "Ex: 'IAM de parede inferior', 'ECG normal'" },
            localizacao_iam: { type: "string", description: "Inferior, Anterior, Lateral, Anterosseptal, etc ou Não aplicável" },
            arteria_culpada_provavel: { type: "string", description: "CD (coronária direita), DAE, Cx, TCE, ou Não aplicável" },
            alerta_iam: { type: "boolean", description: "TRUE se houver elevação ST ≥1mm em 2+ derivações contíguas OU alterações recíprocas de IAM" },
            gravidade: { type: "string", description: "Crítico, Alto risco, Moderado, Baixo, Normal" },
            interpretacao_resumo: { type: "string", description: "Resumo em 2-3 frases" }
          }
        };

        const promptEspecializado = `
Você é um cardiologista especializado em ECG. Analise este eletrocardiograma com MÁXIMA ATENÇÃO.

CRITÉRIOS PARA IAM DE PAREDE INFERIOR:
- Se 2 ou mais destas 3 derivações (DII, DIII, aVF) têm elevação ST ≥1mm → IAM INFERIOR
- Alteração recíproca: Infradesnivelamento em aVL ou DI CONFIRMA o diagnóstico
- Artéria: Coronária Direita (CD)

CRITÉRIOS PARA IAM ANTERIOR:
- Elevação ST ≥1mm em V3-V4 (ou ≥2mm em V2-V3)
- Artéria: DAE (Descendente Anterior Esquerda)

CRITÉRIOS PARA IAM LATERAL:
- Elevação ST ≥1mm em DI, aVL, V5 ou V6
- Artéria: Cx (Circunflexa)

ALTERAÇÕES RECÍPROCAS SÃO CRUCIAIS:
- Infra em aVL com supra em DII/DIII/aVF = CONFIRMA IAM inferior
- Infra em DI com supra em DII/DIII/aVF = CONFIRMA IAM inferior

SEJA SENSÍVEL: Elevação de apenas 1mm JÁ É SIGNIFICATIVA!

Analise derivação por derivação: DI, DII, DIII, aVR, aVL, aVF, V1, V2, V3, V4, V5, V6

Retorne JSON PRECISO conforme schema especificado.`;

        const resultado = await base44.integrations.Core.InvokeLLM({
          prompt: promptEspecializado,
          file_urls: novosFiles[0],
          response_json_schema: ecgSchema
        });

        if (resultado) {
          const d = resultado;
          
          let relatorio = `ANÁLISE AUTOMATIZADA DE ECG

═══════════════════════════════════════════
1. DADOS BÁSICOS
═══════════════════════════════════════════
Ritmo: ${d.ritmo || "Não identificado"}
Frequência Cardíaca: ${d.frequencia_cardiaca || "N/A"} bpm

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
5. ONDAS Q E BLOQUEIOS
═══════════════════════════════════════════
Ondas Q: ${d.ondas_q_patologicas ? `Ondas Q patológicas em ${d.derivacoes_q_patologicas}` : "Sem ondas Q patológicas"}
${d.bloqueio_ramo_esquerdo ? "⚠️ Bloqueio de Ramo Esquerdo presente" : ""}
${d.bloqueio_ramo_direito ? "⚠️ Bloqueio de Ramo Direito presente" : ""}
${!d.bloqueio_ramo_esquerdo && !d.bloqueio_ramo_direito ? "Sem bloqueios identificados" : ""}

═══════════════════════════════════════════
📋 DIAGNÓSTICO
═══════════════════════════════════════════
${d.diagnostico_principal || "Diagnóstico não especificado"}

${d.localizacao_iam && d.localizacao_iam !== "Não aplicável" ? `Localização: ${d.localizacao_iam}` : ""}
${d.arteria_culpada_provavel && d.arteria_culpada_provavel !== "Não aplicável" ? `Artéria provável: ${d.arteria_culpada_provavel}` : ""}
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
✓ Segmento ST (elevação/depressão)
✓ Ondas T e Q patológicas
✓ Bloqueios de ramo

CRITÉRIOS DE IAM POR PAREDE:
• INFERIOR: Supra ST ≥1mm em 2+ de DII, DIII, aVF
  → Alteração recíproca: Infra em aVL ou DI
• ANTERIOR: Supra ST ≥1mm em V3-V4 (≥2mm em V2-V3)
• LATERAL: Supra ST ≥1mm em DI, aVL, V5, V6`);
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
    analiseEcg.includes("ALERTA DE EMERGÊNCIA")
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