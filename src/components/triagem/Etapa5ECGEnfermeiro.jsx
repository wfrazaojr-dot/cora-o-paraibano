
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
                analise.nivel_alerta?.includes('Elevação de ST') ? 'bg-red-500' :
                analise.nivel_alerta?.includes('Infradesnivelamento de ST') ? 'bg-orange-500' :
                analise.nivel_alerta?.includes('sem alterações significativas') ? 'bg-green-500' :
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
    // const timestampAnalise = new Date().toISOString(); // No longer used directly here
    
    console.log("=== ANÁLISE TÉCNICA DE ECG ===");
    console.log("ID:", analiseId);
    console.log("URL:", ecgUrl);
    
    try {
      const schema = {
        type: "object",
        properties: {
          id_analise: { type: "string" },
          ritmo: { type: "string", description: "Ex: Sinusal, Fibrilação atrial, etc" },
          fc_bpm: { type: "number", description: "Frequência cardíaca em bpm" },
          V1_ST: { type: "string", description: "Ex: normal, elevado 2mm, infradesnivelado 1mm" },
          V2_ST: { type: "string" },
          V3_ST: { type: "string" },
          V4_ST: { type: "string" },
          V5_ST: { type: "string" },
          V6_ST: { type: "string" },
          DI_ST: { type: "string" },
          DII_ST: { type: "string" },
          DIII_ST: { type: "string" },
          aVR_ST: { type: "string" },
          aVL_ST: { type: "string" },
          aVF_ST: { type: "string" },
          V1_T: { type: "string", description: "Ex: normal, invertida, apiculada, achatada" },
          V2_T: { type: "string" },
          V3_T: { type: "string" },
          V4_T: { type: "string" },
          V5_T: { type: "string" },
          V6_T: { type: "string" },
          DI_T: { type: "string" },
          DII_T: { type: "string" },
          DIII_T: { type: "string" },
          aVL_T: { type: "string" },
          aVF_T: { type: "string" },
          outras_alteracoes: { type: "string", description: "Outras alterações observadas (bloqueios, etc). Se não houver, escreva 'Nenhuma'." },
          laudo_tecnico: { type: "string", description: "Laudo técnico completo conforme especificado no prompt" }
        },
        required: ["id_analise", "ritmo", "fc_bpm", "V1_ST", "V2_ST", "V3_ST", "V4_ST", "V5_ST", "V6_ST", "DI_ST", "DII_ST", "DIII_ST", "aVR_ST", "aVL_ST", "aVF_ST", "V1_T", "V2_T", "V3_T", "V4_T", "V5_T", "V6_T", "DI_T", "DII_T", "DIII_T", "aVL_T", "aVF_T", "outras_alteracoes", "laudo_tecnico"]
      };

      const prompt = `Você é um sistema automático de análise de ECG (como Philips, GE, etc).

IMPORTANTE: Você deve fazer APENAS análise técnica eletrocardiográfica. NÃO faça diagnósticos clínicos (ex: IAM, STEMI, NSTEMI).

ID da análise: ${analiseId}

TAREFA: Analise a IMAGEM de ECG anexada e meça:

1. Ritmo e Frequência Cardíaca (FC)
2. Segmento ST em cada derivação
3. Onda T em cada derivação
4. Quaisquer outras alterações eletrocardiográficas notáveis.

FORMATO DE RESPOSTA:

Para segmento ST, use:
- "normal" (se isoelétrico, sem elevação ou infradesnivelamento significativo)
- "elevado Xmm" (se acima da linha isoelétrica, com valor em mm)
- "infradesnivelado Xmm" (se abaixo da linha isoelétrica, com valor em mm)

Para onda T, use:
- "normal"
- "invertida"
- "apiculada"
- "achatada"
- "não avaliável" (se não for possível determinar)

NO LAUDO TÉCNICO, escreva como um aparelho de ECG faria, seguindo este formato EXATO (use placeholders para os valores reais):

**ANÁLISE ELETROCARDIOGRÁFICA**

Ritmo: [descrever ritmo, ex: Sinusal]
Frequência cardíaca: [X] bpm

**SEGMENTO ST:**
- V1: [normal / elevado Xmm / infradesnivelado Xmm]
- V2: [normal / elevado Xmm / infradesnivelado Xmm]
- V3: [normal / elevado Xmm / infradesnivelado Xmm]
- V4: [normal / elevado Xmm / infradesnivelado Xmm]
- V5: [normal / elevado Xmm / infradesnivelado Xmm]
- V6: [normal / elevado Xmm / infradesnivelado Xmm]
- DI: [normal / elevado Xmm / infradesnivelado Xmm]
- DII: [normal / elevado Xmm / infradesnivelado Xmm]
- DIII: [normal / elevado Xmm / infradesnivelado Xmm]
- aVR: [normal / elevado Xmm / infradesnivelado Xmm]
- aVL: [normal / elevado Xmm / infradesnivelado Xmm]
- aVF: [normal / elevado Xmm / infradesnivelado Xmm]

**ONDA T:**
- V1: [normal / invertida / apiculada / achatada / não avaliável]
- V2: [normal / invertida / apiculada / achatada / não avaliável]
- V3: [normal / invertida / apiculada / achatada / não avaliável]
- V4: [normal / invertida / apiculada / achatada / não avaliável]
- V5: [normal / invertida / apiculada / achatada / não avaliável]
- V6: [normal / invertida / apiculada / achatada / não avaliável]
- DI: [normal / invertida / apiculada / achatada / não avaliável]
- DII: [normal / invertida / apiculada / achatada / não avaliável]
- DIII: [normal / invertida / apiculada / achatada / não avaliável]
- aVL: [normal / invertida / apiculada / achatada / não avaliável]
- aVF: [normal / invertida / apiculada / achatada / não avaliável]

**OUTRAS ALTERAÇÕES:**
[Descrever outras alterações, como bloqueios de ramo, sobrecargas, extrassístoles, etc. Se não houver, escreva 'Nenhuma'.]

---
IMPORTANTE: NÃO mencione diagnósticos como "IAM", "STEMI", "NSTEMI", "Isquemia", etc. Apenas descreva OBJETIVAMENTE o que você VÊ no traçado.
Seja conciso, técnico e objetivo. Use a terminologia exata solicitada.

Agora analise a imagem.`;

      console.log("📡 Enviando ECG para análise técnica...");
      
      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: ecgUrl,
        response_json_schema: schema
      });

      if (resultado) {
        console.log("✅ Análise técnica concluída");
        console.log("Ritmo:", resultado.ritmo);
        console.log("FC:", resultado.fc_bpm);
        
        // Identify leads with ST alterations
        const derivacoesAlteradas = [];
        const medicoes = {}; // Stores elevation/depression values
        
        ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'DI', 'DII', 'DIII', 'aVR', 'aVL', 'aVF'].forEach(deriv => {
          const st = resultado[`${deriv}_ST`];
          if (st && !st.includes('normal')) {
            derivacoesAlteradas.push(deriv);
            
            const match = st.match(/(\d+(\.\d+)?)\s*mm/);
            if (match) {
              medicoes[deriv] = parseFloat(match[1]);
            }
          }
        });
        
        const st_elevated = derivacoesAlteradas.filter(d => resultado[`${d}_ST`]?.includes('elevado'));
        const st_depressed = derivacoesAlteradas.filter(d => resultado[`${d}_ST`]?.includes('infradesnivelado'));

        let nivelAlerta = "🟢 ECG sem alterações significativas de ST";
        
        if (st_elevated.length > 0) {
          // Check for significant elevation (2+ contiguous leads) for "critical" alert, using simplified contiguous logic
          const hasSignificantElevation = 
            (st_elevated.includes('V1') && st_elevated.includes('V2')) ||
            (st_elevated.includes('V2') && st_elevated.includes('V3')) ||
            (st_elevated.includes('V3') && st_elevated.includes('V4')) ||
            (st_elevated.includes('V4') && st_elevated.includes('V5')) ||
            (st_elevated.includes('V5') && st_elevated.includes('V6')) ||
            (st_elevated.includes('DI') && st_elevated.includes('aVL')) ||
            (st_elevated.includes('DII') && st_elevated.includes('DIII')) ||
            (st_elevated.includes('DII') && st_elevated.includes('aVF')) ||
            (st_elevated.includes('DIII') && st_elevated.includes('aVF'));

          if (hasSignificantElevation) {
             nivelAlerta = "🔴 Elevação de ST (≥2 derivações contíguas)";
          } else {
             nivelAlerta = "🟡 Elevação de ST isolada";
          }
        } else if (st_depressed.length > 0) {
          nivelAlerta = "🟠 Infradesnivelamento de ST";
        }
        
        const analiseCompleta = {
          id_analise: resultado.id_analise,
          qualidade_imagem: "Boa",
          ritmo: resultado.ritmo,
          frequencia_cardiaca_ecg: resultado.fc_bpm,
          
          st_elevated: st_elevated,
          st_depressed: st_depressed,
          medicao_elevacao_mm: medicoes, // Stores elevation/depression values from string parsing
          
          nivel_alerta: nivelAlerta,
          mensagem_para_medico: resultado.laudo_tecnico,
          confianca_diagnostico: "Alta",
          
          analise_por_derivacao: {
            DI: `ST: ${resultado.DI_ST}, T: ${resultado.DI_T || 'não avaliável'}`,
            DII: `ST: ${resultado.DII_ST}, T: ${resultado.DII_T || 'não avaliável'}`,
            DIII: `ST: ${resultado.DIII_ST}, T: ${resultado.DIII_T || 'não avaliável'}`,
            aVR: `ST: ${resultado.aVR_ST}`, // No T wave analysis for aVR in prompt
            aVL: `ST: ${resultado.aVL_ST}, T: ${resultado.aVL_T || 'não avaliável'}`,
            aVF: `ST: ${resultado.aVF_ST}, T: ${resultado.aVF_T || 'não avaliável'}`,
            V1: `ST: ${resultado.V1_ST}, T: ${resultado.V1_T || 'não avaliável'}`,
            V2: `ST: ${resultado.V2_ST}, T: ${resultado.V2_T || 'não avaliável'}`,
            V3: `ST: ${resultado.V3_ST}, T: ${resultado.V3_T || 'não avaliável'}`,
            V4: `ST: ${resultado.V4_ST}, T: ${resultado.V4_T || 'não avaliável'}`,
            V5: `ST: ${resultado.V5_ST}, T: ${resultado.V5_T || 'não avaliável'}`,
            V6: `ST: ${resultado.V6_ST}, T: ${resultado.V6_T || 'não avaliável'}`
          },
          outras_alteracoes: resultado.outras_alteracoes
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
        st_elevated: [],
        st_depressed: [],
        nivel_alerta: "⚪ Erro na análise automática",
        mensagem_para_medico: `ERRO NO SISTEMA DE ANÁLISE

O sistema não conseguiu processar o ECG.

⚠️ MÉDICO DEVE INTERPRETAR MANUALMENTE

Erro: ${error.message}`,
        analise_por_derivacao: {},
        confianca_diagnostico: "Baixa",
        ritmo: "Não avaliável",
        frequencia_cardiaca_ecg: null,
        outras_alteracoes: "Erro na análise automática."
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
      const analise = alertaTriagem.analise_por_derivacao;
      
      const prompt = `Você é um médico cardiologista especializado em eletrocardiografia.
Sua tarefa é gerar um laudo médico estruturado com base na análise TÉCNICA do ECG fornecida abaixo.

**INFORMAÇÕES DISPONÍVEIS:**
- ID da Análise Técnica: ${alertaTriagem.id_analise}
- Ritmo: ${alertaTriagem.ritmo || 'Não especificado'}
- Frequência Cardíaca: ${alertaTriagem.frequencia_cardiaca_ecg || '?'} bpm

**ANÁLISE POR DERIVAÇÃO:**
${Object.entries(analise).map(([deriv, dados]) => `${deriv}: ${dados}`).join('\n')}

${alertaTriagem.outras_alteracoes && alertaTriagem.outras_alteracoes !== 'Nenhuma' ? `\n**OUTRAS ALTERAÇÕES:**\n${alertaTriagem.outras_alteracoes}` : ''}

**INSTRUÇÕES PARA O LAUDO:**
Gere um laudo no seguinte formato EXATO:

**ELETROCARDIOGRAMA DE 12 DERIVAÇÕES**

**RITMO:** [Descrever o ritmo, ex: Sinusal]
**FREQUÊNCIA CARDÍACA:** [Número] bpm

**ANÁLISE DO SEGMENTO ST:**
[Para cada derivação (V1-V6, DI, DII, DIII, aVR, aVL, aVF), descrever o segmento ST: normal, elevado Xmm ou infradesnivelado Xmm]

**ANÁLISE DA ONDA T:**
[Para cada derivação (V1-V6, DI, DII, DIII, aVL, aVF), descrever a morfologia da onda T: normal, invertida, apiculada, achatada ou não avaliável. Exclua aVR se não aplicável.]

**OUTRAS ALTERAÇÕES:**
[Listar outras alterações detectadas, como bloqueios de ramo, sobrecargas, extrassístoles, etc. Se não houver, escreva 'Nenhuma'.]

**CONCLUSÃO TÉCNICA:**
[Resumo objetivo e técnico das principais alterações eletrocardiográficas encontradas. NÃO inclua diagnósticos clínicos como 'IAM', 'STEMI', 'NSTEMI', 'Isquemia', etc. Apenas descreva os achados técnicos.]

**OBSERVAÇÕES:**
[Mencionar que este é um laudo técnico baseado nos achados. A interpretação clínica e a correlação com o quadro do paciente são de responsabilidade do médico assistente.]

---
IMPORTANTE:
- Mantenha o formato exato acima.
- Use terminologia médica precisa.
- Seja objetivo.
- NÃO faça diagnóstico clínico.
- Preencha todas as seções, mesmo que seja para indicar 'normal' ou 'Nenhuma'.`;

      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_type: "text" // Requesting plain text output
      });

      if (resultado) {
        const textoCompleto = `${resultado}

---
💡 **Nota:** Este laudo técnico foi gerado automaticamente como sugestão baseada na análise de IA.
O médico deve revisar, validar e ajustar conforme necessário antes de finalizar.
A interpretação CLÍNICA e a tomada de decisão são de responsabilidade do médico.`;

        setInterpretacaoMedico(textoCompleto);
        alert("✓ Laudo técnico gerado com sucesso!\n\nRevise e ajuste o texto conforme necessário.");
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
        diagnostico_resumido: alertaTriagem.nivel_alerta || 'Análise de ECG', // Use nivel_alerta for summarized diagnosis
        territorio: alertaTriagem.territorio_afetado || null, // Will be null as first AI does not infer territory
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
                  <p className="font-bold">🔍 Análise Técnica de ECG em Andamento...</p>
                  <p className="text-sm">• Analisando TODAS as 12 derivações do ECG</p>
                  <p className="text-sm">• Medindo segmentos ST e ondas T</p>
                  <p className="text-sm">• Gerando laudo técnico detalhado</p>
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
          alertaTriagem.nivel_alerta?.includes('Elevação de ST') ? 'border-red-500 bg-red-50' :
          alertaTriagem.nivel_alerta?.includes('Infradesnivelamento de ST') ? 'border-orange-500 bg-orange-50' :
          alertaTriagem.nivel_alerta?.includes('sem alterações significativas') ? 'border-green-500 bg-green-50' :
          'border-gray-500 bg-gray-50'
        }`}>
          <CardHeader className={`${
            alertaTriagem.nivel_alerta?.includes('Elevação de ST') ? 'bg-red-100 border-b-2 border-red-300' :
            alertaTriagem.nivel_alerta?.includes('Infradesnivelamento de ST') ? 'bg-orange-100 border-b-2 border-orange-300' :
            alertaTriagem.nivel_alerta?.includes('sem alterações significativas') ? 'bg-green-100 border-b-2 border-green-300' :
            'bg-gray-100 border-b-2 border-gray-300'
          }`}>
            <CardTitle className={`text-lg flex items-center gap-2 ${
              alertaTriagem.nivel_alerta?.includes('Elevação de ST') ? 'text-red-900' :
              alertaTriagem.nivel_alerta?.includes('Infradesnivelamento de ST') ? 'text-orange-900' :
              alertaTriagem.nivel_alerta?.includes('sem alterações significativas') ? 'text-green-900' :
              'text-gray-900'
            }`}>
              <Zap className="w-5 h-5" />
              🤖 Análise Técnica de ECG por IA
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className={`p-4 rounded-lg border-2 ${
              alertaTriagem.nivel_alerta?.includes('Elevação de ST') ? 'bg-red-100 border-red-400' :
              alertaTriagem.nivel_alerta?.includes('Infradesnivelamento de ST') ? 'bg-orange-100 border-orange-400' :
              alertaTriagem.nivel_alerta?.includes('sem alterações significativas') ? 'bg-green-100 border-green-400' :
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
                <h3 className="font-bold text-blue-900 mb-2">📋 Laudo Técnico Bruto (por derivação):</h3>
                <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {alertaTriagem.mensagem_para_medico}
                </div>
              </div>
            )}

            {alertaTriagem.st_elevated?.length > 0 && (
              <div className="bg-white p-4 rounded-lg border-2 border-red-300">
                <p className="font-bold text-red-900 mb-2">⚠️ ELEVAÇÃO DE ST DETECTADA</p>
                {alertaTriagem.st_elevated && alertaTriagem.st_elevated.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold mb-1">Derivações com elevação:</p>
                    <div className="flex flex-wrap gap-2">
                      {alertaTriagem.st_elevated.map((der, i) => (
                        <Badge key={i} className="bg-red-600 text-white text-sm px-3 py-1">
                          {der} {alertaTriagem.medicao_elevacao_mm && alertaTriagem.medicao_elevacao_mm[der] ? `(${alertaTriagem.medicao_elevacao_mm[der]}mm)` : ''}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {alertaTriagem.st_depressed?.length > 0 && (
              <div className="bg-white p-4 rounded-lg border-2 border-orange-300">
                <p className="font-bold text-orange-900 mb-2">⚠️ INFRADESNIVELAMENTO DE ST DETECTADO</p>
                <p className="text-sm font-semibold mb-1">Derivações:</p>
                <div className="flex flex-wrap gap-2">
                  {alertaTriagem.st_depressed.map((der, i) => (
                    <Badge key={i} className="bg-orange-600 text-white text-sm px-3 py-1">
                      {der} {alertaTriagem.medicao_elevacao_mm && alertaTriagem.medicao_elevacao_mm[der] ? `(${alertaTriagem.medicao_elevacao_mm[der]}mm)` : ''}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-orange-800 mt-2">
                  Pode indicar isquemia, alterações recíprocas, etc.
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

            {alertaTriagem.outras_alteracoes && alertaTriagem.outras_alteracoes !== 'Nenhuma' && (
              <div className="bg-yellow-50 p-3 rounded border border-yellow-300">
                <p className="text-sm font-semibold text-yellow-900 mb-1">Outras alterações detectadas:</p>
                <p className="text-sm text-yellow-800 whitespace-pre-wrap">{alertaTriagem.outras_alteracoes}</p>
              </div>
            )}

            <Alert className="border-purple-500 bg-purple-50">
              <AlertTriangle className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-800 text-sm">
                <strong>📚 Baseado em:</strong> Diretriz Brasileira de Análise Eletrocardiográfica 2022 + AHA/ACC Guidelines 2025
                <br />
                <strong className="block mt-1">⚠️ SUPERVISÃO MÉDICA OBRIGATÓRIA:</strong> Este é um sistema de SUPORTE TÉCNICO para triagem. A interpretação CLÍNICA e a decisão final são sempre do médico responsável.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {ecgFiles.length > 0 && (
        <Card className="border-2 border-blue-500 shadow-lg">
          <CardHeader className="bg-blue-50 border-b">
            <CardTitle className="text-blue-900 text-lg">
              📋 LAUDO TÉCNICO ELETROCARDIOGRÁFICO (OPCIONAL)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Alert className="border-blue-500 bg-blue-50">
              <Info className="h-5 w-5 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>✓ Este campo é OPCIONAL nesta etapa:</strong>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Se desejar registrar um laudo técnico estruturado, pode usar o assistente de IA</li>
                  <li>Caso contrário, deixe em branco - o médico poderá preencher na Etapa 6</li>
                  <li>A análise técnica automática por IA já foi realizada e está registrada acima</li>
                </ul>
              </AlertDescription>
            </Alert>

            {alertaTriagem && alertaTriagem.analise_por_derivacao && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border-2 border-purple-300">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    <div>
                      <p className="font-semibold text-purple-900">🤖 Assistente de Laudo Técnico de ECG</p>
                      <p className="text-sm text-purple-700">Gere automaticamente um laudo técnico estruturado a partir da análise da IA</p>
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
                        Gerar Laudo Técnico
                      </>
                    )}
                  </Button>
                </div>

                <Alert className="border-purple-500 bg-purple-50">
                  <AlertDescription className="text-purple-800 text-sm">
                    <strong>💡 Como funciona o Assistente:</strong>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Usa os achados técnicos de ECG já identificados pela IA (ritmo, FC, ST, T, etc.)</li>
                      <li>Gera um laudo estruturado com terminologia médica adequada e neutra</li>
                      <li>Inclui análise de todas as 12 derivações</li>
                      <li><strong>IMPORTANTE:</strong> É uma descrição TÉCNICA. NÃO inclui diagnóstico clínico. O médico deve revisar e validar.</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="interpretacao" className="text-base font-semibold">
                Laudo Técnico do ECG (Opcional)
              </Label>
              <Textarea
                id="interpretacao"
                value={interpretacaoMedico}
                onChange={(e) => setInterpretacaoMedico(e.target.value)}
                placeholder="Exemplo:

**ELETROCARDIOGRAMA DE 12 DERIVAÇÕES**

**RITMO:** Sinusal
**FREQUÊNCIA CARDÍACA:** 78 bpm

**ANÁLISE DO SEGMENTO ST:**
- DII: elevado 3mm
- DIII: elevado 4mm
- aVF: elevado 3mm
- aVL: infradesnivelado 2mm
- Demais derivações: normal

**ANÁLISE DA ONDA T:**
- DII, DIII, aVF: normal
- aVL: invertida
- Demais derivações: normal

**OUTRAS ALTERAÇÕES:** Nenhuma

**CONCLUSÃO TÉCNICA:** Elevação de segmento ST em parede inferior, com infradesnivelamento recíproco em aVL.

**OBSERVAÇÕES:** Laudo técnico baseado nos achados. Interpretação clínica a cargo do médico assistente.

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
                <strong>💡 Nota Importante:</strong> A análise automática por IA já foi realizada e serve como <strong>suporte técnico inicial</strong>.
                A interpretação CLÍNICA e decisão médica final (obrigatória) será feita na Etapa 6 - Avaliação Médica.
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
