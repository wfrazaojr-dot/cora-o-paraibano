import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Upload, Loader2, AlertCircle, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
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
            pode_analisar: {
              type: "boolean",
              description: "TRUE only if you can clearly see a 12-lead ECG with good quality. FALSE if image is unclear, incomplete, or not an ECG."
            },
            motivo_nao_pode_analisar: {
              type: "string",
              description: "If pode_analisar is FALSE, explain why (poor quality, not an ECG, incomplete, etc.)"
            },
            qualidade_imagem: {
              type: "string",
              enum: ["Excellent", "Good", "Fair", "Poor", "Unreadable"],
              description: "Image quality assessment"
            },
            ondas_p_visiveis: {
              type: "string",
              enum: ["Sim, claramente visíveis", "Parcialmente visíveis", "Não visíveis", "Não consigo determinar"],
              description: "Can you see P waves clearly?"
            },
            complexos_qrs_visiveis: {
              type: "string",
              enum: ["Sim, claramente visíveis", "Parcialmente visíveis", "Não visíveis", "Não consigo determinar"],
              description: "Can you see QRS complexes clearly?"
            },
            ritmo_aparente: {
              type: "string",
              description: "What rhythm do you observe? Be honest if unsure."
            },
            frequencia_estimada: {
              type: "string",
              description: "Estimated heart rate. Use ranges if unsure (e.g., '70-80 bpm' or 'Cannot determine')"
            },
            regularidade: {
              type: "string",
              enum: ["Regular", "Irregular", "Cannot determine"],
              description: "Is the rhythm regular or irregular?"
            },
            segmento_st_observacoes: {
              type: "string",
              description: "DESCRIBE what you see in ST segment. Do NOT diagnose. E.g., 'Appears elevated in leads II, III, aVF' or 'Cannot assess clearly'"
            },
            ondas_t_observacoes: {
              type: "string",
              description: "DESCRIBE T waves. E.g., 'Appear inverted in V2-V4' or 'Cannot assess clearly'"
            },
            achados_visiveis: {
              type: "array",
              items: { type: "string" },
              description: "List what you can CLEARLY see, not diagnoses. E.g., 'Wide QRS complex', 'Irregular rhythm', 'ST segment elevation visible in inferior leads'"
            },
            alertas_visuais: {
              type: "array",
              items: { type: "string" },
              description: "Visual findings that concern you. E.g., 'Possible ST elevation', 'Very fast rate', 'Irregular baseline'"
            },
            nivel_confianca: {
              type: "string",
              enum: ["Muito Baixo - Requer revisão médica urgente", "Baixo - Múltiplas incertezas", "Moderado - Alguns achados claros", "Razoável - Achados visíveis"],
              description: "How confident are you in this analysis?"
            },
            recomendacao_principal: {
              type: "string",
              description: "Main recommendation for the medical team"
            },
            resumo_pt: {
              type: "string",
              description: "Brief summary in Portuguese describing what you observed (not diagnoses)"
            }
          },
          required: ["pode_analisar"]
        };

        const promptConservador = `
You are analyzing an ECG image for preliminary screening ONLY.

CRITICAL RULES:
1. You are NOT diagnosing - you are DESCRIBING what you see
2. If image quality is poor or you're unsure → SAY SO
3. Use descriptive language: "appears to show", "possibly indicates", "cannot determine"
4. NEVER make definitive diagnoses
5. When in doubt, recommend physician review

PATIENT CONTEXT:
- Age: ${dadosPaciente.idade} years
- Sex: ${dadosPaciente.sexo}
- Chest pain patient
- Alert: ${dadosPaciente.triagem_cardiologica?.alerta_iam ? 'Possible ACS' : 'No ACS alert'}

ANALYSIS STEPS:

1. FIRST: Can you see a clear 12-lead ECG?
   - If NO → Set pode_analisar: false and explain why
   - If YES → Proceed carefully

2. IMAGE QUALITY:
   - Is the image clear enough to make observations?
   - Can you see the paper grid?
   - Are leads labeled?
   - Is calibration visible (10mm = 1mV)?

3. WHAT CAN YOU SEE? (Be honest):
   - P waves: Can you see them clearly? Where?
   - QRS complexes: Are they visible? Narrow or wide?
   - T waves: Can you see them? Normal, inverted, peaked?
   - ST segment: What does it look like? Elevated, depressed, normal?

4. RHYTHM:
   - Is it regular or irregular?
   - Can you count the rate?

5. CONCERNING VISUAL FINDINGS:
   - Do you see any obvious ST elevation?
   - Do you see very wide QRS?
   - Do you see very fast or very slow rate?
   - Do you see irregular rhythm?

IMPORTANT:
- Use phrases like "appears to show", "may indicate", "cannot clearly determine"
- If you see possible ST elevation → Mention it as "appears elevated" NOT "STEMI"
- If unsure about anything → State "Cannot determine with confidence"
- Your role is to ALERT physicians to review, not to diagnose

RESPONSE FORMAT:
- Be descriptive, not diagnostic
- Be honest about limitations
- Focus on VISUAL observations
- Recommend physician review for ANY concerns

Now analyze the image and respond in JSON format.
`;

        const resultado = await base44.integrations.Core.InvokeLLM({
          prompt: promptConservador,
          file_urls: novosFiles[0],
          response_json_schema: ecgSchema
        });

        if (resultado) {
          setAchadosEstruturados(resultado);
          
          const d = resultado;
          
          let relatorio = `╔══════════════════════════════════════════════════════════╗
║        🤖 ANÁLISE PRELIMINAR DE ECG POR IA               ║
║           (APENAS TRIAGEM - NÃO É DIAGNÓSTICO)           ║
╚══════════════════════════════════════════════════════════╝

${!d.pode_analisar ? `
⚠️⚠️⚠️ ANÁLISE NÃO PÔDE SER REALIZADA ⚠️⚠️⚠️

MOTIVO: ${d.motivo_nao_pode_analisar || "Imagem não adequada para análise"}

AÇÃO NECESSÁRIA:
✓ Verificar qualidade da imagem do ECG
✓ Reenviar imagem com melhor qualidade
✓ Médico deve interpretar manualmente

` : `

QUALIDADE DA IMAGEM: ${d.qualidade_imagem || "Não avaliada"}
NÍVEL DE CONFIANÇA: ${d.nivel_confianca || "Não especificado"}

┌─────────────────────────────────────────────────────────┐
│ OBSERVAÇÕES VISUAIS (Não são diagnósticos)              │
└─────────────────────────────────────────────────────────┘

ONDAS P: ${d.ondas_p_visiveis || "Não avaliado"}
COMPLEXOS QRS: ${d.complexos_qrs_visiveis || "Não avaliado"}
RITMO APARENTE: ${d.ritmo_aparente || "Não identificado"}
FREQUÊNCIA ESTIMADA: ${d.frequencia_estimada || "Não calculada"}
REGULARIDADE: ${d.regularidade || "Não avaliada"}

┌─────────────────────────────────────────────────────────┐
│ SEGMENTO ST - OBSERVAÇÕES                                │
└─────────────────────────────────────────────────────────┘
${d.segmento_st_observacoes || "Não foi possível avaliar com clareza"}

┌─────────────────────────────────────────────────────────┐
│ ONDAS T - OBSERVAÇÕES                                    │
└─────────────────────────────────────────────────────────┘
${d.ondas_t_observacoes || "Não foi possível avaliar com clareza"}

${d.achados_visiveis && d.achados_visiveis.length > 0 ? `
┌─────────────────────────────────────────────────────────┐
│ ACHADOS VISÍVEIS NA IMAGEM                               │
└─────────────────────────────────────────────────────────┘
${d.achados_visiveis.map((achado, i) => `${i + 1}. ${achado}`).join('\n')}
` : ''}

${d.alertas_visuais && d.alertas_visuais.length > 0 ? `
┌─────────────────────────────────────────────────────────┐
│ ⚠️ ACHADOS QUE REQUEREM ATENÇÃO MÉDICA                  │
└─────────────────────────────────────────────────────────┘
${d.alertas_visuais.map((alerta, i) => `${i + 1}. ${alerta}`).join('\n')}
` : ''}

┌─────────────────────────────────────────────────────────┐
│ RESUMO EM PORTUGUÊS                                      │
└─────────────────────────────────────────────────────────┘
${d.resumo_pt || "Análise não concluída"}

┌─────────────────────────────────────────────────────────┐
│ RECOMENDAÇÃO PRINCIPAL                                   │
└─────────────────────────────────────────────────────────┘
${d.recomendacao_principal || "ECG deve ser interpretado por médico qualificado"}
`}

╔══════════════════════════════════════════════════════════╗
║ ⚠️⚠️⚠️ AVISOS CRÍTICOS IMPORTANTES ⚠️⚠️⚠️               ║
╚══════════════════════════════════════════════════════════╝

❌ Esta NÃO é uma interpretação médica oficial
❌ Esta NÃO é um diagnóstico
❌ Esta análise é APENAS para triagem preliminar

✓ TODOS os ECGs DEVEM ser interpretados por um cardiologista
  ou médico emergencista ANTES de qualquer decisão clínica

✓ NÃO tome condutas baseadas apenas nesta análise

✓ Em caso de suspeita de IAM ou emergência, CHAME O MÉDICO
  IMEDIATAMENTE independente desta análise

✓ Correlacione SEMPRE com quadro clínico do paciente

✓ ECG normal não exclui síndrome coronariana aguda

✓ Recomenda-se ECGs seriados e dosagem de troponina

Gerado em: ${new Date().toLocaleString('pt-BR')}
Sistema de Triagem de Dor Torácica v3.0
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

IMPORTANTE: Sempre correlacionar com quadro clínico!`);
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
          <strong>⚠️ AVISO IMPORTANTE:</strong> A análise automática por IA é apenas para triagem preliminar e pode conter erros. 
          <strong className="block mt-1">TODOS os ECGs DEVEM ser interpretados por um médico qualificado.</strong>
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
            <Alert className="border-blue-500 bg-blue-50">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <AlertDescription className="text-blue-800">
                🔍 Realizando análise preliminar do ECG... (Apenas triagem, não é diagnóstico)
              </AlertDescription>
            </Alert>
          )}

          {achadosEstruturados && (
            <Card className="border-2 border-purple-300 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  {achadosEstruturados.pode_analisar ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <XCircle className="w-6 h-6" />
                  )}
                  🤖 Análise Preliminar por IA
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {!achadosEstruturados.pode_analisar ? (
                  <Alert className="border-red-600 bg-red-50 border-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <AlertDescription className="text-red-900">
                      <strong>⚠️ ANÁLISE NÃO PÔDE SER REALIZADA</strong>
                      <p className="mt-2">{achadosEstruturados.motivo_nao_pode_analisar}</p>
                      <p className="mt-2 font-semibold">AÇÃO: Verificar qualidade da imagem ou médico interpretar manualmente</p>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Alert className="border-yellow-500 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-900">
                        <strong>Nível de Confiança:</strong> {achadosEstruturados.nivel_confianca}
                        <br/>
                        <strong className="mt-1 block">Qualidade da Imagem:</strong> {achadosEstruturados.qualidade_imagem}
                      </AlertDescription>
                    </Alert>

                    {achadosEstruturados.alertas_visuais && achadosEstruturados.alertas_visuais.length > 0 && (
                      <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-300">
                        <p className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          ⚠️ Achados que Requerem Atenção Médica:
                        </p>
                        <ul className="space-y-1">
                          {achadosEstruturados.alertas_visuais.map((alerta, i) => (
                            <li key={i} className="text-sm text-orange-800 flex items-start gap-2">
                              <span className="font-bold">{i + 1}.</span>
                              <span>{alerta}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {achadosEstruturados.achados_visiveis && achadosEstruturados.achados_visiveis.length > 0 && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
                        <p className="font-semibold text-blue-900 mb-2">👁️ Achados Visíveis na Imagem:</p>
                        <ul className="space-y-1">
                          {achadosEstruturados.achados_visiveis.map((achado, i) => (
                            <li key={i} className="text-sm text-blue-800">• {achado}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {achadosEstruturados.resumo_pt && (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                        <p className="font-semibold text-gray-900 mb-2">📋 Resumo:</p>
                        <p className="text-sm text-gray-800">{achadosEstruturados.resumo_pt}</p>
                      </div>
                    )}

                    {achadosEstruturados.recomendacao_principal && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-300">
                        <p className="font-semibold text-green-900 mb-2">💡 Recomendação:</p>
                        <p className="text-sm text-green-800">{achadosEstruturados.recomendacao_principal}</p>
                      </div>
                    )}
                  </>
                )}

                <Alert className="border-red-500 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 text-xs">
                    <strong>ATENÇÃO:</strong> Esta análise é PRELIMINAR e pode conter erros. 
                    Médico DEVE interpretar o ECG antes de qualquer conduta clínica.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {analiseEcg && (
            <div className="border-l-4 border-l-blue-600 bg-blue-50 p-4 rounded">
              <h4 className="font-semibold text-blue-900 mb-2">📊 Relatório Completo de Triagem:</h4>
              <pre className="text-sm text-blue-800 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto bg-white p-4 rounded border border-blue-200">
                {analiseEcg}
              </pre>
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