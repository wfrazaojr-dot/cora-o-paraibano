
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

// New component for displaying ECG history
function HistoricoECG({ historico }) {
  if (!historico || historico.length === 0) return null;

  return (
    <Card className="border-t-2 border-l-2 border-r-2 border-gray-200 mt-8">
      <CardHeader className="bg-gray-100 border-b">
        <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
          <Info className="w-5 h-5" /> Histórico de Análises de ECG
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Render history in reverse order to show newest first */}
        {historico.slice().reverse().map((analise, index) => (
          <div key={index} className="border p-3 rounded-lg shadow-sm bg-white">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-sm">Análise Recente</span>
              <Badge className={`text-xs ${
                analise.nivel_alerta?.includes('STEMI') || analise.nivel_alerta?.includes('CRÍTICO') ? 'bg-red-500' :
                analise.nivel_alerta?.includes('Alterações isquêmicas') || analise.nivel_alerta?.includes('URGENTE') ? 'bg-orange-500' :
                analise.nivel_alerta?.includes('Normal') ? 'bg-green-500' :
                'bg-gray-500'
              } text-white`}>{analise.nivel_alerta || 'N/A'}</Badge>
            </div>
            <p className="text-sm text-gray-700"><strong>Timestamp:</strong> {new Date(analise.timestamp).toLocaleString()}</p>
            {analise.diagnostico_resumido && <p className="text-sm text-gray-700"><strong>Diagnóstico:</strong> {analise.diagnostico_resumido}</p>}
            {analise.territorio && <p className="text-sm text-gray-700"><strong>Território:</strong> {analise.territorio}</p>}
            {analise.registrado_por && <p className="text-sm text-gray-700"><strong>Registrado por:</strong> {analise.registrado_por}</p>}
            {analise.ecg_url && (
              <a href={analise.ecg_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center mt-2">
                <ExternalLink className="w-4 h-4 mr-1" /> Ver ECG
              </a>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function Etapa5ECGEnfermeiro({ dadosPaciente, onProxima, onAnterior }) {
  const [ecgFiles, setEcgFiles] = useState(dadosPaciente.ecg_files || []);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [alertaTriagem, setAlertaTriagem] = useState(dadosPaciente.alerta_triagem_ecg || null);
  const [interpretacaoMedico, setInterpretacaoMedico] = useState(dadosPaciente.interpretacao_ecg_medico || "");
  const [gerandoSugestao, setGerandoSugestao] = useState(false);
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
    
    const analiseId = `ECG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestampAnalise = new Date().toISOString();
    
    console.log("=== ANÁLISE DE ECG ===");
    console.log("ID:", analiseId);
    console.log("Timestamp:", timestampAnalise);
    console.log("URL:", ecgUrl);
    
    try {
      const schema = {
        type: "object",
        properties: {
          id_analise: { type: "string" },
          V1_analise: { type: "string", description: "V1: ST [elevado X mm / normal / infradesnivelado X mm], T [normal/invertida/apiculada]" },
          V2_analise: { type: "string", description: "V2: ST [elevado X mm / normal / infradesnivelado X mm], T [normal/invertida/apiculada]" },
          V3_analise: { type: "string", description: "V3: ST [elevado X mm / normal / infradesnivelado X mm], T [normal/invertida/apiculada]" },
          V4_analise: { type: "string", description: "V4: ST [elevado X mm / normal / infradesnivelado X mm], T [normal/invertida/apiculada]" },
          V5_analise: { type: "string", description: "V5: ST [elevado X mm / normal / infradesnivelado X mm], T [normal/invertida/apiculada]" },
          V6_analise: { type: "string", description: "V6: ST [elevado X mm / normal / infradesnivelado X mm], T [normal/invertida/apiculada]" },
          DI_analise: { type: "string", description: "DI: ST [elevado X mm / normal / infradesnivelado X mm], T [normal/invertida]" },
          DII_analise: { type: "string", description: "DII: ST [elevado X mm / normal / infradesnivelado X mm], T [normal/invertida]" },
          DIII_analise: { type: "string", description: "DIII: ST [normal / elevado X mm / infradesnivelado X mm], T [normal/invertida]" },
          aVR_analise: { type: "string", description: "aVR: ST [elevado X mm / normal / infradesnivelado X mm]" },
          aVL_analise: { type: "string", description: "aVL: ST [elevado X mm / normal / infradesnivelado X mm], T [normal/invertida]" },
          aVF_analise: { type: "string", description: "aVF: ST [elevado X mm / normal / infradesnivelado X mm], T [normal/invertida]" },
          tem_elevacao_st: { type: "boolean" },
          derivacoes_elevadas: { type: "array", items: { type: "string" } },
          elevacao_milimetros: { type: "object", additionalProperties: { type: "number" } },
          territorio: {
            type: "string",
            enum: [
              "Normal - Sem elevação de ST",
              "PAREDE ANTERIOR (V1-V4)",
              "PAREDE ANTERIOR EXTENSA (V1-V6)",
              "PAREDE INFERIOR (DII, DIII, aVF)",
              "PAREDE LATERAL (DI, aVL, V5, V6)",
              "Múltiplos territórios"
            ]
          },
          arteria_culpada: { type: "string" },
          diagnostico: {
            type: "string",
            enum: [
              "🔴 STEMI - REPERFUSÃO IMEDIATA",
              "🟠 Alterações isquêmicas - Avaliar NSTEMI",
              "🟢 ECG Normal",
              "⚪ Inconclusivo"
            ]
          },
          mensagem_medico: { type: "string" },
          confianca: { type: "string", enum: ["Muito Alta", "Alta", "Moderada", "Baixa"] }
        },
        required: ["id_analise", "V1_analise", "V2_analise", "V3_analise", "V4_analise", "V5_analise", "V6_analise", "DI_analise", "DII_analise", "DIII_analise", "aVR_analise", "aVL_analise", "aVF_analise", "tem_elevacao_st", "diagnostico", "mensagem_medico"]
      };

      const prompt = `ANÁLISE DE ECG - ID: ${analiseId}

Você receberá UMA IMAGEM de ECG de 12 derivações.

TAREFA: Analise o ECG e preencha TODOS os campos obrigatórios do schema.

Para CADA derivação (V1, V2, V3, V4, V5, V6, DI, DII, DIII, aVR, aVL, aVF):
- Observe o segmento ST
- Descreva como: "ST [elevado X mm / normal / infradesnivelado X mm], T [normal/invertida/apiculada]"

Critérios de STEMI (AHA/ACC 2022):
- V2-V3: ≥2mm (homens) ou ≥1,5mm (mulheres)
- Demais derivações: ≥1mm
- Em ≥2 derivações contíguas do mesmo território

IMPORTANTE: Copie o ID fornecido: ${analiseId}

Agora analise a imagem anexada.`;

      console.log("📡 Enviando para análise...");
      
      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: ecgUrl,
        response_json_schema: schema
        // ✅ REMOVIDO: add_context_from_internet (não é necessário para análise de imagem de ECG)
      });

      if (resultado) {
        console.log("=== RESULTADO ===");
        console.log("ID retornado:", resultado.id_analise);
        console.log("V1:", resultado.V1_analise);
        console.log("V2:", resultado.V2_analise);
        console.log("V3:", resultado.V3_analise);
        console.log("V4:", resultado.V4_analise);
        console.log("V5:", resultado.V5_analise);
        console.log("V6:", resultado.V6_analise);
        console.log("DI:", resultado.DI_analise);
        console.log("DII:", resultado.DII_analise);
        console.log("DIII:", resultado.DIII_analise);
        console.log("aVR:", resultado.aVR_analise);
        console.log("aVL:", resultado.aVL_analise);
        console.log("aVF:", resultado.aVF_analise);
        console.log("Tem elevação ST:", resultado.tem_elevacao_st);
        console.log("Derivações elevadas:", resultado.derivacoes_elevadas);
        console.log("Território:", resultado.territorio);
        console.log("Diagnóstico:", resultado.diagnostico);
        
        if (resultado.id_analise !== analiseId) {
          console.warn("⚠️ AVISO: ID não corresponde!");
        }
        
        // Construir objeto de análise por derivação
        const analise_por_derivacao = {
          DI: resultado.DI_analise,
          DII: resultado.DII_analise,
          DIII: resultado.DIII_analise,
          aVR: resultado.aVR_analise,
          aVL: resultado.aVL_analise,
          aVF: resultado.aVF_analise,
          V1: resultado.V1_analise,
          V2: resultado.V2_analise,
          V3: resultado.V3_analise,
          V4: resultado.V4_analise,
          V5: resultado.V5_analise,
          V6: resultado.V6_analise
        };
        
        const analiseCompleta = {
          id_analise: resultado.id_analise,
          analise_por_derivacao: analise_por_derivacao,
          elevacao_st_detectada: resultado.tem_elevacao_st,
          derivacoes_com_elevacao: resultado.derivacoes_elevadas || [],
          medicao_elevacao_mm: resultado.elevacao_milimetros || {},
          territorio_afetado: resultado.territorio,
          arteria_culpada_provavel: resultado.arteria_culpada,
          nivel_alerta: resultado.diagnostico,
          mensagem_para_medico: resultado.mensagem_medico,
          confianca_diagnostico: resultado.confianca,
          qualidade_imagem: "Boa"
        };
        
        setAlertaTriagem(analiseCompleta);
      } else {
        throw new Error("Resultado vazio da IA");
      }

    } catch (error) {
      console.error("❌ ERRO NA ANÁLISE:", error);
      setAlertaTriagem({
        id_analise: analiseId,
        qualidade_imagem: "Ruim",
        elevacao_st_detectada: false,
        nivel_alerta: "⚪ Inconclusivo - Erro na análise automática",
        mensagem_para_medico: `ERRO NO SISTEMA DE ANÁLISE AUTOMÁTICA

O sistema não conseguiu processar o ECG.

⚠️ MÉDICO DEVE INTERPRETÁR MANUALMENTE

Erro técnico: ${error.message}`,
        derivacoes_com_elevacao: [],
        territorio_afetado: "Padrão não conclusivo",
        analise_por_derivacao: {},
        confianca_diagnostico: "Baixa"
      });
    }
    setAnalyzing(false);
  };

  const gerarSugestaoInterpretacao = async () => {
    if (!alertaTriagem || !alertaTriagem.analise_por_derivacao) {
      alert("Primeiro é necessário fazer upload e análise automática do ECG");
      return;
    }

    setGerandoSugestao(true);

    try {
      const schema = {
        type: "object",
        properties: {
          interpretacao_estruturada: {
            type: "string",
            description: "Laudo de ECG completo e estruturado, formatado profissionalmente"
          },
          diagnostico_principal: {
            type: "string",
            description: "Diagnóstico principal em formato conciso"
          },
          conduta_sugerida: {
            type: "string",
            description: "Conduta clínica recomendada baseada nos achados"
          }
        },
        required: ["interpretacao_estruturada", "diagnostico_principal", "conduta_sugerida"]
      };

      const analise = alertaTriagem.analise_por_derivacao;
      const prompt = `Você é um cardiologista especialista em eletrocardiografia.

TAREFA: Gerar um laudo médico profissional de ECG baseado na análise técnica fornecida.

ANÁLISE TÉCNICA DISPONÍVEL:
- ID da Análise: ${alertaTriagem.id_analise}
- Derivações analisadas: ${Object.keys(analise).length}

ACHADOS POR DERIVAÇÃO:
${Object.entries(analise).map(([deriv, achado]) => `- ${deriv}: ${achado}`).join('\n')}

RESUMO DA ANÁLISE AUTOMÁTICA:
- Elevação de ST detectada: ${alertaTriagem.elevacao_st_detectada ? 'SIM' : 'NÃO'}
${alertaTriagem.elevacao_st_detectada ? `- Derivações com elevação: ${alertaTriagem.derivacoes_com_elevacao?.join(', ')}` : ''}
${alertaTriagem.territorio_afetado ? `- Território afetado: ${alertaTriagem.territorio_afetado}` : ''}
${alertaTriagem.arteria_culpada_provavel ? `- Artéria culpada provável: ${alertaTriagem.arteria_culpada_provavel}` : ''}
- Nível de alerta: ${alertaTriagem.nivel_alerta}
- Confiança: ${alertaTriagem.confianca_diagnostico}

DADOS DO PACIENTE:
- Idade: ${dadosPaciente.idade} anos
- Sexo: ${dadosPaciente.sexo}
${dadosPaciente.dados_vitais?.frequencia_cardiaca ? `- FC: ${dadosPaciente.dados_vitais.frequencia_cardiaca} bpm` : ''}

INSTRUÇÕES PARA O LAUDO:

Gere um laudo no seguinte formato EXATO:

**ELETROCARDIOGRAMA DE 12 DERIVAÇÕES**

**RITMO E FREQUÊNCIA:**
[Descrever ritmo (sinusal/não sinusal) e FC estimada]

**ANÁLISE DO SEGMENTO ST E ONDA T:**

*Derivações Precordiais:*
- V1: [descrição detalhada]
- V2: [descrição detalhada]
- V3: [descrição detalhada]
- V4: [descrição detalhada]
- V5: [descrição detalhada]
- V6: [descrição detalhada]

*Derivações de Membros:*
- DI: [descrição detalhada]
- DII: [descrição detalhada]
- DIII: [descrição detalhada]
- aVR: [descrição detalhada]
- aVL: [descrição detalhada]
- aVF: [descrição detalhada]

**ACHADOS PRINCIPAIS:**
[Listar achados significativos]

**CONCLUSÃO:**
[Diagnóstico eletrocardiográfico]

${alertaTriagem.elevacao_st_detectada ? '**⚠️ CONDUTA URGENTE:**\n[Recomendação de conduta imediata]' : ''}

**OBSERVAÇÕES:**
[Limitações, recomendações de correlação clínica]

---

IMPORTANTE:
- Use terminologia médica técnica e precisa
- Seja objetivo e claro
- Inclua TODAS as 12 derivações
- Se houver elevação de ST, enfatize território e artéria
- Mencione critérios diagnósticos específicos quando aplicável (ex: critérios de Sgarbossa, De Winter, Wellens)
- Sempre termine recomendando correlação clínica

Gere o laudo completo agora.`;

      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: schema
      });

      if (resultado && resultado.interpretacao_estruturada) {
        // Adicionar nota de que foi gerado por IA
        const textoCompleto = `${resultado.interpretacao_estruturada}

---
💡 **Nota:** Este laudo foi gerado automaticamente como sugestão baseada na análise de IA.
O médico deve revisar, validar e ajustar conforme necessário antes de finalizar.

**Diagnóstico Sugerido:** ${resultado.diagnostico_principal}
**Conduta Sugerida:** ${resultado.conduta_sugerida}`;

        setInterpretacaoMedico(textoCompleto);
        
        alert("✓ Sugestão de interpretação gerada com sucesso!\n\nRevise e ajuste o texto conforme necessário antes de finalizar.");
      }

    } catch (error) {
      console.error("Erro ao gerar sugestão:", error);
      alert("Erro ao gerar sugestão de interpretação. Tente novamente.");
    }

    setGerandoSugestao(false);
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

    // Criar entrada para o histórico
    const historicoAtual = dadosPaciente.historico_ecg || [];
    let novoHistorico = [...historicoAtual];
    
    if (alertaTriagem && alertaTriagem.id_analise) {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      
      novoHistorico.push({
        id_analise: alertaTriagem.id_analise,
        timestamp: dataHoraEcg,
        ecg_url: ecgFiles[0], // Primeiro ECG anexado
        analise_completa: alertaTriagem,
        diagnostico_resumido: alertaTriagem.nivel_alerta?.split(' - ')[0] || alertaTriagem.nivel_alerta || 'Análise de ECG',
        territorio: alertaTriagem.territorio_afetado,
        nivel_alerta: alertaTriagem.nivel_alerta,
        registrado_por: user.email || 'Sistema'
      });
    }

    const dadosParaSalvar = {
      ecg_files: ecgFiles,
      data_hora_ecg: dataHoraEcg,
      tempo_triagem_ecg_minutos: tempoMinutos,
      alerta_triagem_ecg: alertaTriagem,
      historico_ecg: novoHistorico,
      interpretacao_ecg_medico: interpretacaoMedico || "", // Opcional - pode ser preenchido pelo médico depois
      enfermeiro_nome: enfermeiro.nome,
      enfermeiro_coren: enfermeiro.coren,
      status: "Aguardando Médico"
    };

    console.log("Dados para salvar:", dadosParaSalvar);
    console.log("Histórico de ECG atualizado:", novoHistorico.length, "análises");

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
                <div className="space-y-2">
                  <p className="font-bold">🔍 Análise Simplificada em Andamento...</p>
                  <p className="text-sm">• Analisando TODAS as 12 derivações do ECG</p>
                  <p className="text-sm">• Detectando elevação de segmento ST</p>
                  <p className="text-sm">• Identificando território coronariano</p>
                  <p className="text-sm font-bold mt-2">⏳ Aguarde 30-60 segundos...</p>
                </div>
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
          alertaTriagem.nivel_alerta?.includes('CRÍTICO') || alertaTriagem.nivel_alerta?.includes('STEMI') ? 'border-red-500 bg-red-50' :
          alertaTriagem.nivel_alerta?.includes('URGENTE') || alertaTriagem.nivel_alerta?.includes('Alterações isquêmicas') ? 'border-orange-500 bg-orange-50' :
          alertaTriagem.nivel_alerta?.includes('ATENÇÃO') ? 'border-yellow-500 bg-yellow-50' :
          alertaTriagem.nivel_alerta?.includes('Normal') ? 'border-green-500 bg-green-50' :
          'border-gray-500 bg-gray-50'
        }`}>
          <CardHeader className={`${
            alertaTriagem.nivel_alerta?.includes('CRÍTICO') || alertaTriagem.nivel_alerta?.includes('STEMI') ? 'bg-red-100 border-b-2 border-red-300' :
            alertaTriagem.nivel_alerta?.includes('URGENTE') || alertaTriagem.nivel_alerta?.includes('Alterações isquêmicas') ? 'bg-orange-100 border-b-2 border-orange-300' :
            alertaTriagem.nivel_alerta?.includes('ATENÇÃO') ? 'bg-yellow-100 border-b-2 border-yellow-300' :
            alertaTriagem.nivel_alerta?.includes('Normal') ? 'bg-green-100 border-b-2 border-green-300' :
            'bg-gray-100 border-b-2 border-gray-300'
          }`}>
            <CardTitle className={`text-lg flex items-center gap-2 ${
              alertaTriagem.nivel_alerta?.includes('CRÍTICO') || alertaTriagem.nivel_alerta?.includes('STEMI') ? 'text-red-900' :
              alertaTriagem.nivel_alerta?.includes('URGENTE') || alertaTriagem.nivel_alerta?.includes('Alterações isquêmicas') ? 'text-orange-900' :
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
              alertaTriagem.nivel_alerta?.includes('CRÍTICO') || alertaTriagem.nivel_alerta?.includes('STEMI') ? 'bg-red-100 border-red-400' :
              alertaTriagem.nivel_alerta?.includes('URGENTE') || alertaTriagem.nivel_alerta?.includes('Alterações isquêmicas') ? 'bg-orange-100 border-orange-400' :
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
               {alertaTriagem.confianca_diagnostico && (
                <p className="text-sm">Confiança no diagnóstico: <strong>{alertaTriagem.confianca_diagnostico}</strong></p>
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
                          {der} {alertaTriagem.medicao_elevacao_mm && alertaTriagem.medicao_elevacao_mm[der] ? `(${alertaTriagem.medicao_elevacao_mm[der]}mm)` : ''}
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

            {alertaTriagem.validacao_literatura && (
              <div className="bg-blue-50 p-3 rounded border border-blue-300">
                <p className="text-sm font-semibold text-blue-900 mb-1">Validação com Literatura Médica:</p>
                <p className="text-xs text-blue-800 whitespace-pre-wrap">{alertaTriagem.validacao_literatura}</p>
              </div>
            )}

            {alertaTriagem.casos_web_similares && alertaTriagem.casos_web_similares.length > 0 && (
              <div className="bg-blue-50 p-3 rounded border border-blue-300">
                <p className="text-sm font-semibold text-blue-900 mb-1">Casos Similares Encontrados na Web:</p>
                <ul className="list-disc pl-5 text-xs text-blue-800">
                  {alertaTriagem.casos_web_similares.map((caso, i) => (
                    <li key={i}>{caso}</li>
                  ))}
                </ul>
              </div>
            )}

            <Alert className="border-purple-500 bg-purple-50">
              <AlertTriangle className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-800 text-sm">
                <strong>📚 Baseado em:</strong> Diretriz Brasileira de Análise Eletrocardiográfica 2022 + AHA/ACC Guidelines 2025
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

            {alertaTriagem && alertaTriagem.analise_por_derivacao && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border-2 border-purple-300">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    <div>
                      <p className="font-semibold text-purple-900">🤖 Assistente de Documentação de ECG</p>
                      <p className="text-sm text-purple-700">Gere automaticamente uma sugestão de interpretação médica estruturada</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={gerarSugestaoInterpretacao}
                    disabled={gerandoSugestao}
                    className="bg-purple-600 hover:bg-purple-700 gap-2"
                  >
                    {gerandoSugestao ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Gerar Sugestão de Interpretação
                      </>
                    )}
                  </Button>
                </div>

                <Alert className="border-purple-500 bg-purple-50">
                  <AlertDescription className="text-purple-800 text-sm">
                    <strong>💡 Como funciona o Assistente:</strong>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Analisa os achados de ECG já identificados pela IA</li>
                      <li>Gera um laudo estruturado com terminologia médica adequada</li>
                      <li>Inclui análise de todas as 12 derivações</li>
                      <li>Sugere diagnóstico e conduta baseado nos achados</li>
                      <li><strong>IMPORTANTE:</strong> É uma sugestão - o médico deve revisar e validar</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}

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

      {/* HISTÓRICO DE ANÁLISES DE ECG */}
      {dadosPaciente.historico_ecg && dadosPaciente.historico_ecg.length > 0 && (
        <HistoricoECG historico={dadosPaciente.historico_ecg} />
      )}

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
