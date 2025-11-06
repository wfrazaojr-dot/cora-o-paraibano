
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

      // IMPORTANTE: Limpar completamente análise anterior
      console.log("=== NOVO ECG CARREGADO - LIMPANDO ANÁLISE ANTERIOR ===");
      console.log("Timestamp:", new Date().toISOString());
      console.log("Nova URL:", urls[0]);
      setAlertaTriagem(null); // Reset completo
      
      // Aguardar um momento para garantir que o estado foi limpo
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Executar análise do NOVO ECG
      await analisarECGTriagem(urls[0]);

    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao anexar ECG. Tente novamente.");
    }
    
    setUploading(false);
  };

  const analisarECGTriagem = async (ecgUrl) => {
    setAnalyzing(true);
    
    // Gerar ID único para esta análise
    const analiseId = `ECG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestampAnalise = new Date().toISOString();
    
    console.log("=== INICIANDO ANÁLISE DE ECG INDEPENDENTE ===");
    console.log("ID da Análise:", analiseId);
    console.log("Timestamp:", timestampAnalise);
    console.log("URL do ECG:", ecgUrl);
    
    try {
      const schema = {
        type: "object",
        properties: {
          id_analise: {
            type: "string",
            description: "ID único desta análise"
          },
          qualidade_imagem: {
            type: "string",
            enum: ["Excelente", "Boa", "Regular", "Ruim"]
          },
          analise_por_derivacao: {
            type: "object",
            description: "Análise OBRIGATÓRIA de CADA uma das 12 derivações",
            properties: {
              DI: { type: "string", description: "Análise completa de DI: ritmo, eixo, ST, T, Q" },
              DII: { type: "string", description: "Análise completa de DII: ritmo, eixo, ST, T, Q" },
              DIII: { type: "string", description: "Análise completa de DIII: ritmo, eixo, ST, T, Q" },
              aVR: { type: "string", description: "Análise completa de aVR: ritmo, eixo, ST, T, Q" },
              aVL: { type: "string", description: "Análise completa de aVL: ritmo, eixo, ST, T, Q" },
              aVF: { type: "string", description: "Análise completa de aVF: ritmo, eixo, ST, T, Q" },
              V1: { type: "string", description: "Análise completa de V1: ritmo, eixo, ST, T, Q, R" },
              V2: { type: "string", description: "Análise completa de V2: ritmo, eixo, ST, T, Q, R" },
              V3: { type: "string", description: "Análise completa de V3: ritmo, eixo, ST, T, Q, R" },
              V4: { type: "string", description: "Análise completa de V4: ritmo, eixo, ST, T, Q, R" },
              V5: { type: "string", description: "Análise completa de V5: ritmo, eixo, ST, T, Q, R" },
              V6: { type: "string", description: "Análise completa de V6: ritmo, eixo, ST, T, Q, R" }
            },
            required: ["DI", "DII", "DIII", "aVR", "aVL", "aVF", "V1", "V2", "V3", "V4", "V5", "V6"]
          },
          elevacao_st_detectada: {
            type: "boolean"
          },
          derivacoes_com_elevacao: {
            type: "array",
            items: { type: "string" }
          },
          infradesniv_st_detectado: {
            type: "boolean"
          },
          derivacoes_com_infradesniv: {
            type: "array",
            items: { type: "string" }
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
            ]
          },
          arteria_culpada_provavel: {
            type: "string"
          },
          nivel_alerta: {
            type: "string",
            enum: [
              "🔴 CRÍTICO - STEMI detectado - REPERFUSÃO IMEDIATA",
              "🟠 URGENTE - Alterações sugestivas de isquemia - Avaliar NSTEMI",
              "🟡 ATENÇÃO - Alterações inespecíficas - Correlação clínica",
              "🟢 Normal - Sem alterações significativas de ST detectadas",
              "⚪ Inconclusivo - Qualidade insuficiente ou artefatos"
            ]
          },
          ondas_q_patologicas: {
            type: "boolean"
          },
          alteracoes_onda_t: {
            type: "string"
          },
          bloqueios_detectados: {
            type: "array",
            items: { type: "string" }
          },
          frequencia_cardiaca_ecg: {
            type: "number"
          },
          ritmo: {
            type: "string"
          },
          mensagem_para_medico: {
            type: "string"
          },
          tempo_porta_balao_recomendado: {
            type: "string"
          },
          casos_similares_referencia: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["id_analise", "analise_por_derivacao", "elevacao_st_detectada", "nivel_alerta"]
      };

      const prompt = `
╔═══════════════════════════════════════════════════════════════════════════════╗
║  ANÁLISE SISTEMÁTICA DE ECG - 12 DERIVAÇÕES                                  ║
║  ID: ${analiseId}                                                            ║
║  TIMESTAMP: ${timestampAnalise}                                              ║
╚═══════════════════════════════════════════════════════════════════════════════╝

🚨 **PROTOCOLO OBRIGATÓRIO - ANÁLISE DERIVAÇÃO POR DERIVAÇÃO**

Você DEVE analisar TODAS as 12 derivações do ECG:

**DERIVAÇÕES DE MEMBROS (6):**
1. DI
2. DII  
3. DIII
4. aVR
5. aVL
6. aVF

**DERIVAÇÕES PRECORDIAIS (6):**
7. V1
8. V2
9. V3
10. V4
11. V5
12. V6

---

📋 **MÉTODO SISTEMÁTICO - SIGA RIGOROSAMENTE:**

**ETAPA 1: ANÁLISE INDIVIDUAL DE CADA DERIVAÇÃO**

Para CADA UMA das 12 derivações, você DEVE responder:

1. **Segmento ST:**
   - Está no nível da linha isoelétrica?
   - Há elevação? Se sim, quantos mm?
   - Há infradesnivelamento? Se sim, quantos mm?
   - Morfologia: côncava, convexa, horizontal?

2. **Onda T:**
   - Está normal (positiva)?
   - Está invertida?
   - Está apiculada (hiperaguda)?
   - Amplitude anormal?

3. **Onda Q:**
   - Ausente ou presente?
   - Se presente: largura e profundidade
   - É patológica? (≥40ms e ≥25% da onda R)

4. **Complexo QRS:**
   - Amplitude da onda R
   - Progressão normal de R (V1 a V6)?
   - Morfologia especial?

---

**ETAPA 2: ANÁLISE DERIVAÇÃO POR DERIVAÇÃO - FORMATO OBRIGATÓRIO**

**DI (Derivação I):**
Exemplo: "Ritmo sinusal. Segmento ST isoelétrico. Onda T positiva normal. Sem ondas Q. Complexo QRS estreito."

**DII (Derivação II):**
Exemplo: "Ritmo sinusal. Elevação de ST de 3mm. Onda T positiva. Sem ondas Q patológicas."

**DIII (Derivação III):**
[Descrever ESPECIFICAMENTE o que você VÊ nesta derivação]

**aVR:**
[Descrever ESPECIFICAMENTE o que você VÊ nesta derivação]

**aVL:**
[Descrever ESPECIFICAMENTE o que você VÊ nesta derivação]
Atenção: Infradesnivelamento em aVL é alteração recíproca comum em IAM inferior!

**aVF:**
[Descrever ESPECIFICAMENTE o que você VÊ nesta derivação]

**V1 (Precordial 1):**
[Descrever ESPECIFICAMENTE o que você VÊ nesta derivação]

**V2 (Precordial 2):**
[Descrever ESPECIFICAMENTE o que você VÊ nesta derivação]
Critério STEMI: ≥2mm em homens, ≥1,5mm em mulheres

**V3 (Precordial 3):**
[Descrever ESPECIFICAMENTE o que você VÊ nesta derivação]
Critério STEMI: ≥2mm em homens, ≥1,5mm em mulheres

**V4 (Precordial 4):**
[Descrever ESPECIFICAMENTE o que você VÊ nesta derivação]
Critério STEMI: ≥1mm

**V5 (Precordial 5):**
[Descrever ESPECIFICAMENTE o que você VÊ nesta derivação]
Critério STEMI: ≥1mm

**V6 (Precordial 6):**
[Descrever ESPECIFICAMENTE o que você VÊ nesta derivação]
Critério STEMI: ≥1mm

---

**ETAPA 3: SÍNTESE E LOCALIZAÇÃO**

Após analisar TODAS as 12 derivações individualmente, determine:

**DERIVAÇÕES COM ELEVAÇÃO DE ST (liste TODAS):**
Exemplo: V2 (4mm), V3 (5mm), V4 (4mm), V5 (2mm)

**DERIVAÇÕES COM INFRADESNIVELAMENTO DE ST (liste TODAS):**
Exemplo: aVL (2mm) - alteração recíproca

**TERRITÓRIO AFETADO:**
- **SE V1, V2, V3, V4** → PAREDE ANTERIOR
- **SE V2, V3, V4, V5, V6** → PAREDE ANTERIOR EXTENSA  
- **SE DII, DIII, aVF** → PAREDE INFERIOR
- **SE DI, aVL** → PAREDE LATERAL ALTA
- **SE V5, V6** → PAREDE LATERAL BAIXA

**ARTÉRIA CULPADA:**
- Anterior → DAE (Descendente Anterior Esquerda)
- Inferior → CD (Coronária Direita) ou Cx (Circunflexa)
- Lateral → Cx (Circunflexa) ou Diagonal

---

**ETAPA 4: MENSAGEM PARA O MÉDICO**

Forneça uma mensagem DETALHADA seguindo este formato:

"**[DIAGNÓSTICO PRINCIPAL]**

**📊 ANÁLISE SISTEMÁTICA DAS 12 DERIVAÇÕES:**

**Derivações de Membros:**
- DI: [descrição específica]
- DII: [descrição específica]
- DIII: [descrição específica]
- aVR: [descrição específica]
- aVL: [descrição específica]
- aVF: [descrição específica]

**Derivações Precordiais:**
- V1: [descrição específica]
- V2: [descrição específica]
- V3: [descrição específica]
- V4: [descrição específica]
- V5: [descrição específica]
- V6: [descrição específica]

**🔍 ACHADOS PRINCIPAIS:**
- Elevação de ST em: [derivações] com [X]mm cada
- Infradesnivelamento recíproco em: [derivações]
- Ondas Q patológicas: [presente/ausente]
- Alterações de onda T: [descrição]

**📍 LOCALIZAÇÃO:**
- Território: [especificar]
- Artéria culpada provável: [especificar]

**⚠️ CLASSIFICAÇÃO:**
- [STEMI/NSTEMI/Normal]

**🎯 CONDUTA RECOMENDADA:**
- [Reperfusão imediata / Investigação adicional / etc]
- Tempo porta-balão: [se aplicável]

**📚 Referência:**
- Padrão compatível com casos de [banco de dados]"

---

**CRITÉRIOS DE STEMI (AHA/ACC 2022):**
- **V2-V3:** ≥2mm (homens) ou ≥1,5mm (mulheres)
- **Demais derivações:** ≥1mm
- **Em ≥2 derivações contíguas** do mesmo território

---

**DIAGNÓSTICOS DIFERENCIAIS IMPORTANTES:**

1. **Repolarização Precoce Benigna:**
   - Elevação ST côncava em V2-V4
   - Comum em jovens atletas
   - SEM alterações recíprocas

2. **Bloqueio de Ramo Esquerdo (BRE):**
   - QRS alargado (≥120ms)
   - Pode mascarar ou simular IAM
   - Usar Critérios de Sgarbossa

3. **Pericardite:**
   - Elevação ST DIFUSA em múltiplas derivações
   - Infradesnivelamento do segmento PR

4. **Síndrome de Brugada:**
   - Padrão tipo 1 em V1-V2
   - Elevação ST com morfologia descendente

---

🎯 **INSTRUÇÕES FINAIS:**

1. ✅ Você ANALISOU todas as 12 derivações individualmente?
2. ✅ Você DESCREVEU especificamente cada uma no campo "analise_por_derivacao"?
3. ✅ Você LISTOU todas as derivações com elevação de ST?
4. ✅ Você IDENTIFICOU o território coronariano correto?
5. ✅ Você COPIOU o ID único: ${analiseId}?

**COPIE O ID ÚNICO ACIMA NO CAMPO "id_analise"**

**ESTA É UMA ANÁLISE COMPLETAMENTE NOVA E INDEPENDENTE**
**NÃO USE INFORMAÇÕES DE ANÁLISES ANTERIORES**
**ANALISE APENAS A IMAGEM ANEXADA AGORA**

**ANÁLISE É PARA SUPORTE DIAGNÓSTICO - DECISÃO CLÍNICA FINAL É DO MÉDICO**
`;

      console.log("Enviando para análise da IA - análise derivação por derivação obrigatória");
      
      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: ecgUrl,
        response_json_schema: schema,
        add_context_from_internet: false
      });

      if (resultado) {
        console.log("=== RESULTADO DA ANÁLISE ===");
        console.log("ID retornado:", resultado.id_analise);
        console.log("ID esperado:", analiseId);
        console.log("Análise por derivação:", resultado.analise_por_derivacao);
        console.log("Elevação ST:", resultado.elevacao_st_detectada);
        console.log("Derivações:", resultado.derivacoes_com_elevacao);
        console.log("Território:", resultado.territorio_afetado);
        
        if (resultado.id_analise !== analiseId) {
          console.warn("⚠️ AVISO: ID não corresponde!");
        }
        
        setAlertaTriagem(resultado);
      }

    } catch (error) {
      console.error("Erro na análise:", error);
      setAlertaTriagem({
        id_analise: analiseId,
        qualidade_imagem: "Ruim",
        elevacao_st_detectada: false,
        nivel_alerta: "⚪ Inconclusivo - Erro na análise automática",
        mensagem_para_medico: "Sistema não conseguiu processar. Médico deve interpretar manualmente.",
        derivacoes_com_elevacao: [],
        territorio_afetado: "Padrão não conclusivo",
        analise_por_derivacao: {}
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

    const dataHoraEcg = dadosPaciente.data_hora_ecg || new Date().toISOString();
    const tempoMinutos = dadosPaciente.tempo_triagem_ecg_minutos || (dadosPaciente.data_hora_inicio_triagem
      ? differenceInMinutes(new Date(dataHoraEcg), new Date(dadosPaciente.data_hora_inicio_triagem))
      : 0);

    const dadosParaSalvar = {
      ecg_files: ecgFiles,
      data_hora_ecg: dataHoraEcg,
      tempo_triagem_ecg_minutos: tempoMinutos,
      alerta_triagem_ecg: alertaTriagem,
      interpretacao_ecg_medico: interpretacaoMedico || "", // Opcional - pode ser preenchido pelo médico depois
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
              📋 INTERPRETAÇÃO DO ECG PELO MÉDICO (OPCIONAL)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Alert className="border-blue-500 bg-blue-50">
              <Info className="h-5 w-5 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>✓ Este campo é OPCIONAL nesta etapa:</strong>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Se o médico já interpretou o ECG, você pode registrar aqui</li>
                  <li>Caso contrário, deixe em branco - o médico interpretará na Etapa 6</li>
                  <li>A análise automática por IA já foi realizada e está registrada acima</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="interpretacao" className="text-base font-semibold">
                Interpretação Completa do ECG (Opcional)
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
CONDUTA: Reperfusão imediata (ICP primária vs fibrinolítico)

(Se deixado em branco, o médico interpretará na Etapa 6)"
                rows={12}
                className="font-mono text-sm resize-y"
              />
              <p className="text-xs text-gray-600">
                ℹ️ Campo opcional. Se não preenchido agora, o médico fará a interpretação na próxima etapa.
              </p>
            </div>

            <Alert className="border-yellow-500 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 text-sm">
                <strong>💡 Nota Importante:</strong> A análise automática por IA já foi realizada e serve como <strong>suporte inicial</strong>.
                A interpretação médica final (obrigatória) será feita na Etapa 6 - Avaliação Médica.
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
          disabled={ecgFiles.length === 0 || !enfermeiro.nome || !enfermeiro.coren}
        >
          Concluir Triagem de Enfermagem
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}
