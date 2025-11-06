import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Upload, Loader2, AlertCircle, AlertTriangle, Info, Zap, ExternalLink, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { differenceInMinutes } from "date-fns";

export default function Etapa5ECGEnfermeiro({ dadosPaciente, onProxima, onAnterior }) {
  const [ecgFiles, setEcgFiles] = useState(dadosPaciente.ecg_files || []);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [alertaTriagem, setAlertaTriagem] = useState(dadosPaciente.alerta_triagem_ecg || null);
  const [interpretacaoMedico, setInterpretacaoMedico] = useState(dadosPaciente.interpretacao_ecg_medico || "");
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

      // Executar análise de triagem automática
      if (novosFiles.length > 0 && !alertaTriagem) {
        await analisarECGTriagem(novosFiles[0]);
      }

    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao anexar ECG. Tente novamente.");
    }
    
    setUploading(false);
  };

  const analisarECGTriagem = async (ecgUrl) => {
    setAnalyzing(true);
    try {
      const schema = {
        type: "object",
        properties: {
          qualidade_imagem: {
            type: "string",
            enum: ["Excelente", "Boa", "Regular", "Ruim"],
            description: "Qualidade da imagem do ECG para análise"
          },
          elevacao_st_detectada: {
            type: "boolean",
            description: "Você detecta elevação do segmento ST em ALGUMA das 12 derivações?"
          },
          derivacoes_com_elevacao: {
            type: "array",
            items: { type: "string" },
            description: "Liste TODAS as derivações onde você VÊ elevação de ST. Seja COMPLETO: DI, DII, DIII, aVR, aVL, aVF, V1, V2, V3, V4, V5, V6"
          },
          infradesniv_st_detectado: {
            type: "boolean",
            description: "Você detecta infradesnivelamento (depressão) do segmento ST?"
          },
          derivacoes_com_infradesniv: {
            type: "array",
            items: { type: "string" },
            description: "Liste TODAS as derivações com infradesnivelamento de ST"
          },
          territorio_afetado: {
            type: "string",
            enum: [
              "Sem alterações significativas de ST",
              "PAREDE ANTERIOR (V1-V4)",
              "PAREDE ANTEROSSEPTAL (V1-V3)", 
              "PAREDE ANTERIOR EXTENSA (V1-V6 + DI + aVL)",
              "PAREDE INFERIOR (DII, DIII, aVF)",
              "PAREDE LATERAL ALTA (DI, aVL)",
              "PAREDE LATERAL BAIXA (V5, V6)",
              "PAREDE INFEROLATERAL (DII, DIII, aVF + V5, V6)",
              "PAREDE POSTERIOR (V7-V9 ou alterações recíprocas em V1-V3)",
              "Múltiplos territórios",
              "Padrão não conclusivo"
            ],
            description: "Território coronariano afetado baseado nas derivações com alterações"
          },
          arteria_culpada_provavel: {
            type: "string",
            description: "Artéria coronária provavelmente culpada pelo IAM (se aplicável)"
          },
          nivel_alerta: {
            type: "string",
            enum: [
              "🔴 CRÍTICO - STEMI detectado - REPERFUSÃO IMEDIATA",
              "🟠 URGENTE - Alterações sugestivas de isquemia - Avaliar NSTEMI",
              "🟡 ATENÇÃO - Alterações inespecíficas - Correlação clínica",
              "🟢 Normal - Sem alterações significativas de ST detectadas",
              "⚪ Inconclusivo - Qualidade insuficiente ou artefatos"
            ],
            description: "Nível de urgência baseado nos achados"
          },
          ondas_q_patologicas: {
            type: "boolean",
            description: "Presença de ondas Q patológicas (possível IAM prévio)"
          },
          alteracoes_onda_t: {
            type: "string",
            description: "Descrição de alterações na onda T (inversão, apiculada, etc)"
          },
          bloqueios_detectados: {
            type: "array",
            items: { type: "string" },
            description: "Bloqueios de ramo ou atrioventriculares detectados"
          },
          frequencia_cardiaca_ecg: {
            type: "number",
            description: "Frequência cardíaca estimada pelo ECG (bpm)"
          },
          ritmo: {
            type: "string",
            description: "Ritmo detectado (sinusal, fibrilação atrial, etc)"
          },
          mensagem_para_medico: {
            type: "string",
            description: "Mensagem DETALHADA e ESPECÍFICA para o médico com TODOS os achados relevantes"
          },
          tempo_porta_balao_recomendado: {
            type: "string",
            description: "Se STEMI, tempo máximo recomendado para reperfusão"
          }
        },
        required: ["elevacao_st_detectada", "nivel_alerta", "derivacoes_com_elevacao"]
      };

      const prompt = `Você é um sistema de TRIAGEM de ECG certificado, seguindo diretrizes da SBC 2022 e AHA 2025.

🎯 **OBJETIVO:** Análise de SUPORTE DIAGNÓSTICO para TRIAGEM de ECG - NÃO substitui interpretação médica.

📋 **INSTRUÇÕES CRÍTICAS DE ANÁLISE:**

**1. EXAMINE DERIVAÇÃO POR DERIVAÇÃO - NÃO PULE NENHUMA:**

🔴 **DERIVAÇÕES DE MEMBROS (IAM INFERIOR/LATERAL):**
- **DII:** Elevação ST? Infradesnivelamento? Quantos mm?
- **DIII:** Elevação ST? Infradesnivelamento? Quantos mm?
- **aVF:** Elevação ST? Infradesnivelamento? Quantos mm?
- **DI:** Elevação ST? Infradesnivelamento? Quantos mm?
- **aVL:** Elevação ST? Infradesnivelamento? Quantos mm? (importante para IAM inferior - infradesnivelamento recíproco)
- **aVR:** Elevação ST? (pode indicar oclusão de tronco)

🔴 **DERIVAÇÕES PRECORDIAIS (IAM ANTERIOR):**
- **V1:** Elevação ST? Quantos mm?
- **V2:** Elevação ST? Quantos mm?
- **V3:** Elevação ST? Quantos mm?
- **V4:** Elevação ST? Quantos mm?
- **V5:** Elevação ST? Quantos mm?
- **V6:** Elevação ST? Quantos mm?

**2. CRITÉRIOS DE ELEVAÇÃO DE ST (STEMI):**
- Homens: ≥ 2mm em V2-V3, ≥ 1mm nas demais
- Mulheres: ≥ 1,5mm em V2-V3, ≥ 1mm nas demais
- Ponto J (início do segmento ST) deve estar elevado acima da linha isoelétrica

**3. MAPEAMENTO DE TERRITÓRIOS CORONARIANOS:**

**IAM INFERIOR:**
- **Elevação em:** DII, DIII, aVF
- **Infradesnivelamento recíproco:** aVL (comum), DI (pode ocorrer)
- **Artéria:** Coronária Direita (90%) ou Circunflexa (10%)
- **⚠️ ATENÇÃO:** IAM inferior é FREQUENTEMENTE subdiagnosticado! Sempre verifique DII, DIII, aVF

**IAM INFEROLATERAL:**
- **Elevação em:** DII, DIII, aVF + V5, V6
- **Artéria:** Coronária Direita dominante ou Circunflexa

**IAM ANTERIOR:**
- **Anterosseptal:** V1, V2, V3 → Descendente Anterior proximal
- **Anterior extenso:** V1-V6 + DI + aVL → Descendente Anterior proximal (grande área)
- **Lateral alta:** DI, aVL → Circunflexa ou Diagonal
- **Lateral baixa:** V5, V6 → Circunflexa

**IAM POSTERIOR:**
- Infradesnivelamento em V1-V3 + elevação em V7-V9 (se disponível)
- Ondas R altas em V1-V2

**4. ALTERAÇÕES RECÍPROCAS (IMPORTANTE!):**
- IAM inferior → Infradesnivelamento em aVL é COMUM e CONFIRMA o diagnóstico
- IAM anterior → Infradesnivelamento em derivações inferiores pode ocorrer

**5. ONDAS Q PATOLÓGICAS:**
- Largura ≥ 40ms (1mm) e profundidade ≥ 25% da onda R
- Sugere IAM prévio ou em evolução

**6. BLOQUEIOS DE RAMO:**
- **BRE novo:** Pode mascarar IAM - usar Critérios de Sgarbossa
- **BRD:** Não impede diagnóstico de IAM

**7. MENSAGEM PARA O MÉDICO:**
Seja EXTREMAMENTE DETALHADO. Exemplo:

"**STEMI DE PAREDE INFERIOR DETECTADO**

**Elevação do segmento ST:**
- DII: 3mm de elevação
- DIII: 4mm de elevação  
- aVF: 3mm de elevação

**Alterações recíprocas:**
- aVL: 2mm de infradesnivelamento (confirma IAM inferior)

**Território:** PAREDE INFERIOR (DII, DIII, aVF)
**Artéria culpada provável:** Coronária Direita (CD)

**⚠️ CONDUTA URGENTE:**
- Tempo porta-balão: ≤90 minutos
- Acionar hemodinâmica IMEDIATAMENTE
- Se indisponível: considerar fibrinolítico em ≤30 min

**Outras observações:**
- Ritmo sinusal, FC ~78 bpm
- Sem bloqueios de ramo
- Sem ondas Q patológicas (IAM agudo recente)"

**8. IMPORTANTES DIAGNÓSTICOS DIFERENCIAIS:**
- Síndrome de Brugada (V1-V3)
- Repolarização precoce benigna
- Pericardite (elevação difusa + infra PR)
- Aneurisma ventricular (elevação ST persistente)

**9. QUALIDADE DA IMAGEM:**
- Excelente: Todas as derivações visíveis, sem artefatos
- Boa: Derivações visíveis, artefatos mínimos
- Regular: Algumas derivações com interferência
- Ruim: Múltiplas derivações ilegíveis

---

**AGORA ANALISE O ECG ANEXADO:**

Examine CUIDADOSAMENTE cada uma das 12 derivações.
NÃO SUBESTIME IAM inferior (DII, DIII, aVF).
Liste TODAS as derivações com alterações.
Seja DETALHADO e ESPECÍFICO na mensagem para o médico.

⚠️ **LEMBRETE:** Esta é uma análise de TRIAGEM para SUPORTE DIAGNÓSTICO.
A interpretação e decisão clínica final são SEMPRE do médico responsável.`;

      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: ecgUrl,
        response_json_schema: schema
      });

      if (resultado) {
        console.log("Resultado da análise de ECG:", resultado);
        setAlertaTriagem(resultado);
      }

    } catch (error) {
      console.error("Erro na análise de triagem:", error);
      setAlertaTriagem({
        qualidade_imagem: "Ruim",
        elevacao_st_detectada: false,
        nivel_alerta: "⚪ Inconclusivo - Erro na análise automática",
        mensagem_para_medico: "Sistema de triagem não conseguiu processar. Médico deve interpretar manualmente.",
        derivacoes_com_elevacao: [],
        territorio_afetado: "Padrão não conclusivo"
      });
    }
    setAnalyzing(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log("Iniciando submit da Etapa 5");
    console.log("ECG Files:", ecgFiles.length);
    console.log("Enfermeiro:", enfermeiro);
    console.log("Interpretação:", interpretacaoMedico.length);
    
    if (ecgFiles.length === 0) {
      alert("Por favor, anexe pelo menos um arquivo de ECG");
      return;
    }
    if (!enfermeiro.nome || !enfermeiro.coren) {
      alert("Por favor, preencha o nome e COREN do enfermeiro");
      return;
    }
    if (!interpretacaoMedico.trim()) {
      alert("Por favor, preencha a interpretação do ECG. O médico DEVE interpretar o ECG antes de prosseguir.");
      return;
    }
    
    const dataHoraEcg = dadosPaciente.data_hora_ecg || new Date().toISOString();
    const tempoMinutos = dadosPaciente.tempo_triagem_ecg_minutos || (dadosPaciente.data_hora_inicio_triagem 
      ? differenceInMinutes(new Date(dataHoraEcg), new Date(dadosPaciente.data_hora_inicio_triagem))
      : 0);
    
    const dadosParaSalvar = { 
      ecg_files: ecgFiles,
      data_hora_ecg: dataHoraEcg, 
      tempo_triagem_ecg_minutos: tempoMinutos,
      alerta_triagem_ecg: alertaTriagem,
      interpretacao_ecg_medico: interpretacaoMedico,
      enfermeiro_nome: enfermeiro.nome,
      enfermeiro_coren: enfermeiro.coren,
      status: "Aguardando Médico"
    };
    
    console.log("Dados para salvar:", dadosParaSalvar);
    
    try {
      onProxima(dadosParaSalvar);
      console.log("onProxima chamado com sucesso");
    } catch (error) {
      console.error("Erro ao chamar onProxima:", error);
      alert("Erro ao avançar para próxima etapa. Verifique o console para mais detalhes.");
    }
  };

  const tempoTriagemEcg = dadosPaciente.tempo_triagem_ecg_minutos;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Eletrocardiograma (ECG)</h2>
        <p className="text-gray-600">Anexe o ECG para triagem automática e registro no sistema</p>
      </div>

      {/* AVISO SBC/AHA 2022 */}
      <Alert className="border-blue-600 bg-blue-50 border-2">
        <Sparkles className="h-6 w-6 text-blue-700" />
        <AlertDescription className="text-blue-900">
          <strong className="text-lg block mb-2">🤖 Análise de ECG por IA - Suporte Diagnóstico (SBC/AHA 2022)</strong>
          <p className="mb-2">
            Sistema de <strong>triagem e suporte diagnóstico</strong> reconhecido pela SBC e AHA.
          </p>
          <p className="font-bold text-sm">
            ⚠️ NÃO substitui interpretação médica. Supervisão médica obrigatória.
          </p>
        </AlertDescription>
      </Alert>

      {/* BOTÃO CARDIOLOGS.AI - OPCIONAL */}
      <Card className="border-2 border-purple-300 shadow-md bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardHeader className="bg-purple-100 border-b border-purple-200">
          <CardTitle className="flex items-center gap-2 text-purple-900 text-base">
            <ExternalLink className="w-5 h-5" />
            💎 Sistemas Especializados Certificados (Opcional)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              Para análise ainda mais precisa, você pode usar sistemas especializados certificados:
            </p>
            
            <div className="grid grid-cols-2 gap-2">
              <a 
                href="https://app.cardiologs.com" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button 
                  type="button" 
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-2" />
                  Cardiologs AI
                </Button>
              </a>
              
              <Button 
                type="button" 
                variant="outline"
                size="sm"
                className="w-full text-xs"
                disabled
              >
                Philips DXL
              </Button>
            </div>

            <p className="text-xs text-gray-600 text-center mt-2">
              Sistemas externos - requerem licença institucional
            </p>
          </div>
        </CardContent>
      </Card>

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

          {analyzing && (
            <Alert className="border-purple-500 bg-purple-50">
              <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
              <AlertDescription className="text-purple-800">
                🔍 Analisando ECG automaticamente - examinando TODAS as 12 derivações (DI, DII, DIII, aVR, aVL, aVF, V1-V6)... Aguarde 5-10 segundos...
              </AlertDescription>
            </Alert>
          )}

          {ecgFiles.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium">Arquivos anexados: {ecgFiles.length}/3</p>
              <div className="grid md:grid-cols-3 gap-3">
                {ecgFiles.map((url, index) => (
                  <div key={index} className="border-2 border-green-200 rounded overflow-hidden bg-green-50">
                    <img 
                      src={url} 
                      alt={`ECG ${index + 1}`} 
                      className="w-full h-48 object-contain cursor-pointer hover:opacity-80 transition-opacity bg-white"
                      onClick={() => window.open(url, '_blank')}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const parent = e.target.closest('.border-2');
                        if (parent) {
                          const fallbackDiv = parent.querySelector('.fallback-link');
                          if (fallbackDiv) fallbackDiv.style.display = 'flex';
                        }
                      }}
                    />
                    <div className="fallback-link w-full h-48 items-center justify-center bg-gray-100 hidden">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-medium">
                        📄 Ver ECG {index + 1}
                      </a>
                    </div>
                    <div className="p-2 bg-green-600 text-center">
                      <Badge className="bg-white text-green-800">ECG {index + 1}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              {tempoTriagemEcg !== undefined && (
                <Alert className={tempoTriagemEcg <= 10 ? "border-green-500 bg-green-50" : "border-orange-500 bg-orange-50"}>
                  <AlertCircle className={`h-4 w-4 ${tempoTriagemEcg <= 10 ? "text-green-600" : "text-orange-600"}`} />
                  <AlertDescription className={tempoTriagemEcg <= 10 ? "text-green-800" : "text-orange-800"}>
                    <strong>⏱️ Tempo triagem → ECG: {tempoTriagemEcg} min</strong>
                    {tempoTriagemEcg <= 10 ? " ✓ Dentro da meta (≤10 min)" : " ⚠️ Acima da meta de 10 minutos"}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RESULTADO DA ANÁLISE AUTOMÁTICA */}
      {alertaTriagem && !analyzing && (
        <Card className={`border-2 shadow-lg ${
          alertaTriagem.nivel_alerta?.includes('CRÍTICO') ? 'border-red-500 bg-red-50' :
          alertaTriagem.nivel_alerta?.includes('URGENTE') ? 'border-orange-500 bg-orange-50' :
          alertaTriagem.nivel_alerta?.includes('ATENÇÃO') ? 'border-yellow-500 bg-yellow-50' :
          alertaTriagem.nivel_alerta?.includes('Normal') ? 'border-green-500 bg-green-50' :
          'border-gray-500 bg-gray-50'
        }`}>
          <CardHeader className={`${
            alertaTriagem.nivel_alerta?.includes('CRÍTICO') ? 'bg-red-100 border-b-2 border-red-300' :
            alertaTriagem.nivel_alerta?.includes('URGENTE') ? 'bg-orange-100 border-b-2 border-orange-300' :
            alertaTriagem.nivel_alerta?.includes('ATENÇÃO') ? 'bg-yellow-100 border-b-2 border-yellow-300' :
            alertaTriagem.nivel_alerta?.includes('Normal') ? 'bg-green-100 border-b-2 border-green-300' :
            'bg-gray-100 border-b-2 border-gray-300'
          }`}>
            <CardTitle className={`text-lg flex items-center gap-2 ${
              alertaTriagem.nivel_alerta?.includes('CRÍTICO') ? 'text-red-900' :
              alertaTriagem.nivel_alerta?.includes('URGENTE') ? 'text-orange-900' :
              alertaTriagem.nivel_alerta?.includes('ATENÇÃO') ? 'text-yellow-900' :
              alertaTriagem.nivel_alerta?.includes('Normal') ? 'text-green-900' :
              'text-gray-900'
            }`}>
              <Zap className="w-5 h-5" />
              🤖 Análise Automática de Triagem (SBC/AHA 2022)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className={`p-4 rounded-lg border-2 ${
              alertaTriagem.nivel_alerta?.includes('CRÍTICO') ? 'bg-red-100 border-red-400' :
              alertaTriagem.nivel_alerta?.includes('URGENTE') ? 'bg-orange-100 border-orange-400' :
              alertaTriagem.nivel_alerta?.includes('ATENÇÃO') ? 'bg-yellow-100 border-yellow-400' :
              alertaTriagem.nivel_alerta?.includes('Normal') ? 'bg-green-100 border-green-400' :
              'bg-gray-100 border-gray-400'
            }`}>
              <p className="font-bold text-lg mb-2">
                {alertaTriagem.nivel_alerta}
              </p>
              {alertaTriagem.qualidade_imagem && (
                <p className="text-sm mt-2">Qualidade da imagem: <strong>{alertaTriagem.qualidade_imagem}</strong></p>
              )}
            </div>

            {alertaTriagem.mensagem_para_medico && (
              <div className="bg-white p-4 rounded-lg border-2 border-blue-300">
                <h3 className="font-bold text-blue-900 mb-2">📋 Análise Detalhada:</h3>
                <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {alertaTriagem.mensagem_para_medico}
                </div>
              </div>
            )}

            {alertaTriagem.elevacao_st_detectada && (
              <div className="bg-white p-4 rounded-lg border-2 border-red-300">
                <p className="font-bold text-red-900 mb-2">⚠️ ELEVAÇÃO DE ST DETECTADA</p>
                {alertaTriagem.derivacoes_com_elevacao && alertaTriagem.derivacoes_com_elevacao.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold mb-1">Derivações com elevação:</p>
                    <div className="flex flex-wrap gap-2">
                      {alertaTriagem.derivacoes_com_elevacao.map((der, i) => (
                        <Badge key={i} className="bg-red-600 text-white text-sm px-3 py-1">
                          {der}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {alertaTriagem.territorio_afetado && (
                  <div className="mt-3 p-3 bg-red-50 rounded">
                    <p className="text-sm"><strong>Território afetado:</strong> {alertaTriagem.territorio_afetado}</p>
                  </div>
                )}
                {alertaTriagem.arteria_culpada_provavel && (
                  <div className="mt-2 p-3 bg-red-50 rounded">
                    <p className="text-sm"><strong>Artéria culpada provável:</strong> {alertaTriagem.arteria_culpada_provavel}</p>
                  </div>
                )}
                {alertaTriagem.tempo_porta_balao_recomendado && (
                  <div className="mt-2 p-3 bg-red-100 rounded border border-red-400">
                    <p className="text-sm font-bold text-red-900">🚨 {alertaTriagem.tempo_porta_balao_recomendado}</p>
                  </div>
                )}
              </div>
            )}

            {alertaTriagem.infradesniv_st_detectado && alertaTriagem.derivacoes_com_infradesniv && alertaTriagem.derivacoes_com_infradesniv.length > 0 && (
              <div className="bg-white p-4 rounded-lg border-2 border-orange-300">
                <p className="font-bold text-orange-900 mb-2">⚠️ INFRADESNIVELAMENTO DE ST DETECTADO</p>
                <p className="text-sm font-semibold mb-1">Derivações:</p>
                <div className="flex flex-wrap gap-2">
                  {alertaTriagem.derivacoes_com_infradesniv.map((der, i) => (
                    <Badge key={i} className="bg-orange-600 text-white text-sm px-3 py-1">
                      {der}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-orange-800 mt-2">
                  Pode indicar: NSTEMI, isquemia subendocárdica ou alterações recíprocas
                </p>
              </div>
            )}

            {(alertaTriagem.ritmo || alertaTriagem.frequencia_cardiaca_ecg) && (
              <div className="bg-gray-50 p-3 rounded border">
                <p className="text-sm text-gray-700">
                  {alertaTriagem.ritmo && <span><strong>Ritmo:</strong> {alertaTriagem.ritmo}</span>}
                  {alertaTriagem.ritmo && alertaTriagem.frequencia_cardiaca_ecg && " • "}
                  {alertaTriagem.frequencia_cardiaca_ecg && <span><strong>FC:</strong> ~{alertaTriagem.frequencia_cardiaca_ecg} bpm</span>}
                </p>
              </div>
            )}

            {alertaTriagem.bloqueios_detectados && alertaTriagem.bloqueios_detectados.length > 0 && (
              <div className="bg-yellow-50 p-3 rounded border border-yellow-300">
                <p className="text-sm font-semibold text-yellow-900 mb-1">Bloqueios detectados:</p>
                <ul className="list-disc pl-5 text-sm text-yellow-800">
                  {alertaTriagem.bloqueios_detectados.map((bloq, i) => (
                    <li key={i}>{bloq}</li>
                  ))}
                </ul>
              </div>
            )}

            <Alert className="border-purple-500 bg-purple-50">
              <AlertTriangle className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-800 text-sm">
                <strong>📚 Baseado em:</strong> Diretriz SBC de Análise Eletrocardiográfica 2022 + AHA/ACC Guidelines 2025
                <br />
                <strong className="block mt-1">⚠️ SUPERVISÃO MÉDICA OBRIGATÓRIA:</strong> Este é um sistema de SUPORTE DIAGNÓSTICO para triagem. A interpretação e decisão clínica final são sempre do médico responsável.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {ecgFiles.length > 0 && (
        <Card className="border-2 border-blue-500 shadow-lg">
          <CardHeader className="bg-blue-50 border-b">
            <CardTitle className="text-blue-900 text-lg">
              📋 INTERPRETAÇÃO DO ECG PELO MÉDICO * (OBRIGATÓRIO)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Alert className="border-blue-500 bg-blue-50">
              <Info className="h-5 w-5 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>O médico deve interpretar o ECG e registrar:</strong>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Ritmo e frequência cardíaca</li>
                  <li>Alterações do segmento ST (elevação/depressão)</li>
                  <li>Territórios afetados (anterior/inferior/lateral)</li>
                  <li>Ondas T, ondas Q patológicas</li>
                  <li>Outras alterações relevantes</li>
                  <li>Conclusão: STEMI / NSTEMI / ECG normal / etc</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="interpretacao" className="text-base font-semibold">
                Interpretação Completa do ECG *
              </Label>
              <Textarea
                id="interpretacao"
                value={interpretacaoMedico}
                onChange={(e) => setInterpretacaoMedico(e.target.value)}
                placeholder="Exemplo:

ECG de 12 derivações:
- Ritmo sinusal, FC: 78 bpm
- Elevação do segmento ST: DII (3mm), DIII (4mm), aVF (3mm)
- Infradesnivelamento recíproco: aVL (2mm)
- Território: PAREDE INFERIOR
- Ondas Q patológicas: ausentes

CONCLUSÃO: STEMI DE PAREDE INFERIOR
ARTÉRIA CULPADA: Coronária Direita (provável)
CONDUTA: Reperfusão imediata (ICP primária vs fibrinolítico)"
                rows={12}
                className="font-mono text-sm resize-y"
                required
              />
              <p className="text-xs text-gray-600">
                * Campo obrigatório. A interpretação deve ser detalhada e assinada pelo médico.
              </p>
            </div>

            <Alert className="border-red-500 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 text-sm">
                <strong>Lembrete:</strong> Em caso de STEMI, o tempo porta-balão deve ser ≤90 minutos. 
                Acione hemodinâmica ou considere fibrinolítico imediatamente.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

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
          disabled={ecgFiles.length === 0 || !enfermeiro.nome || !enfermeiro.coren || !interpretacaoMedico.trim()}
        >
          Concluir Triagem
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}