
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Upload, Loader2, AlertCircle, AlertTriangle, Info, Zap } from "lucide-react";
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
      if (novosFiles.length > 0) {
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
            enum: ["Boa", "Regular", "Ruim"],
            description: "Qualidade da imagem do ECG para análise"
          },
          elevacao_st_detectada: {
            type: "boolean",
            description: "Você consegue VER elevação do segmento ST em ALGUMA derivação?"
          },
          derivacoes_com_elevacao: {
            type: "array",
            items: { type: "string" },
            description: "Liste TODAS as derivações onde você VÊ elevação de ST. Seja específico: V1, V2, V3, V4, V5, V6, I, II, III, aVR, aVL, aVF"
          },
          territorio_provavel: {
            type: "string",
            enum: [
              "Sem elevação de ST detectada",
              "Anterior (V1-V4)",
              "Anterosseptal (V1-V3)",
              "Anterior extenso (V1-V6, I, aVL)",
              "Inferior (II, III, aVF)",
              "Lateral (I, aVL, V5-V6)",
              "Inferolateral",
              "Múltiplos territórios",
              "Não é possível determinar"
            ],
            description: "Território coronário baseado nas derivações"
          },
          nivel_alerta: {
            type: "string",
            enum: [
              "🔴 CRÍTICO - Elevação de ST detectada - STEMI provável",
              "🟡 ATENÇÃO - Alterações inespecíficas - avaliar com cuidado",
              "🟢 Normal - Sem elevação significativa de ST detectada",
              "⚪ Inconclusivo - Qualidade insuficiente"
            ],
            description: "Nível de alerta para o médico"
          },
          mensagem_para_medico: {
            type: "string",
            description: "Mensagem detalhada sobre TODAS as derivações com elevação de ST. Liste cada uma."
          }
        },
        required: ["elevacao_st_detectada", "nivel_alerta", "derivacoes_com_elevacao"]
      };

      const prompt = `Você é um sistema especializado de TRIAGEM de ECG para detectar elevação de ST.

🎯 TAREFA CRÍTICA: Analise CUIDADOSAMENTE o segmento ST em TODAS as 12 derivações.

📋 INSTRUÇÕES PASSO A PASSO:

1️⃣ **EXAMINE CADA DERIVAÇÃO INDIVIDUALMENTE:**

**DERIVAÇÕES PRECORDIAIS (V1-V6):**
- V1: O segmento ST está elevado acima da linha de base? SIM/NÃO
- V2: O segmento ST está elevado acima da linha de base? SIM/NÃO
- V3: O segmento ST está elevado acima da linha de base? SIM/NÃO
- V4: O segmento ST está elevado acima da linha de base? SIM/NÃO
- V5: O segmento ST está elevado acima da linha de base? SIM/NÃO
- V6: O segmento ST está elevado acima da linha de base? SIM/NÃO

**DERIVAÇÕES DE MEMBROS:**
- I: Elevação de ST? SIM/NÃO
- II: Elevação de ST? SIM/NÃO
- III: Elevação de ST? SIM/NÃO
- aVR: Elevação de ST? SIM/NÃO
- aVL: Elevação de ST? SIM/NÃO
- aVF: Elevação de ST? SIM/NÃO

2️⃣ **CRITÉRIOS DE ELEVAÇÃO DE ST:**
- Homens: ≥ 2mm em V2-V3, ≥ 1mm nas outras derivações
- Mulheres: ≥ 1,5mm em V2-V3, ≥ 1mm nas outras derivações
- Elevação = segmento ST ACIMA da linha isoelétrica (linha de base)

3️⃣ **MAPEAMENTO DE TERRITÓRIO:**
- Se V1, V2, V3 → "Anterosseptal (V1-V3)"
- Se V1, V2, V3, V4 → "Anterior (V1-V4)"
- Se V2, V3, V4, V5 → "Anterior (V2-V5)"
- Se V1, V2, V3, V4, V5, V6 + I + aVL → "Anterior extenso (V1-V6, I, aVL)"
- Se V4, V5, V6 + I + aVL → "Lateral (I, aVL, V5-V6)"
- Se II, III, aVF → "Inferior (II, III, aVF)"
- Se II, III, aVF + V5, V6 → "Inferolateral"

4️⃣ **MENSAGEM PARA O MÉDICO:**
Liste TODAS as derivações onde você viu elevação, por exemplo:
"Elevação de ST detectada em: V2 (3mm), V3 (4mm), V4 (3mm), V5 (2mm). Território: Parede anterior."

⚠️ **IMPORTANTE:**
- NÃO ignore V4, V5, V6 - são críticas para IAM anterior extenso
- Se houver elevação em V2-V3 mas não em V4-V5, mencione isso
- Seja COMPLETO - liste TODAS as derivações com elevação
- Se não tiver certeza, diga "Não é possível determinar" ao invés de adivinhar

Analise o ECG anexado agora e responda de forma precisa e completa.`;

      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: ecgUrl,
        response_json_schema: schema
      });

      if (resultado) {
        console.log("Resultado da análise:", resultado);
        setAlertaTriagem(resultado);
      }

    } catch (error) {
      console.error("Erro na análise de triagem:", error);
      setAlertaTriagem({
        qualidade_imagem: "Ruim",
        elevacao_st_detectada: false,
        nivel_alerta: "⚪ Inconclusivo - Erro na análise automática",
        mensagem_para_medico: "Sistema de triagem não conseguiu processar. Médico deve interpretar manualmente.",
        derivacoes_com_elevacao: []
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
        <p className="text-gray-600">Anexe o ECG e aguarde análise de triagem automática</p>
      </div>

      <Alert className="border-blue-500 bg-blue-50">
        <Zap className="h-5 w-5 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Sistema de Triagem Automática:</strong> Ao anexar o ECG, o sistema fará uma análise rápida para detectar elevação de ST em TODAS as 12 derivações e alertar o médico. 
          <strong className="block mt-1">A interpretação final é sempre médica.</strong>
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

          {analyzing && (
            <Alert className="border-purple-500 bg-purple-50">
              <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
              <AlertDescription className="text-purple-800">
                🔍 Analisando ECG detalhadamente - examinando TODAS as 12 derivações para detectar elevação de ST... Aguarde alguns segundos...
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

      {alertaTriagem && !analyzing && (
        <Card className={`border-2 shadow-lg ${
          alertaTriagem.nivel_alerta?.includes('CRÍTICO') ? 'border-red-500 bg-red-50' :
          alertaTriagem.nivel_alerta?.includes('ATENÇÃO') ? 'border-yellow-500 bg-yellow-50' :
          alertaTriagem.nivel_alerta?.includes('Normal') ? 'border-green-500 bg-green-50' :
          'border-gray-500 bg-gray-50'
        }`}>
          <CardHeader className={`${
            alertaTriagem.nivel_alerta?.includes('CRÍTICO') ? 'bg-red-100 border-b-2 border-red-300' :
            alertaTriagem.nivel_alerta?.includes('ATENÇÃO') ? 'bg-yellow-100 border-b-2 border-yellow-300' :
            alertaTriagem.nivel_alerta?.includes('Normal') ? 'bg-green-100 border-b-2 border-green-300' :
            'bg-gray-100 border-b-2 border-gray-300'
          }`}>
            <CardTitle className={`text-lg flex items-center gap-2 ${
              alertaTriagem.nivel_alerta?.includes('CRÍTICO') ? 'text-red-900' :
              alertaTriagem.nivel_alerta?.includes('ATENÇÃO') ? 'text-yellow-900' :
              alertaTriagem.nivel_alerta?.includes('Normal') ? 'text-green-900' :
              'text-gray-900'
            }`}>
              <Zap className="w-5 h-5" />
              🤖 Alerta de Triagem Automática
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className={`p-4 rounded-lg border-2 ${
              alertaTriagem.nivel_alerta?.includes('CRÍTICO') ? 'bg-red-100 border-red-400' :
              alertaTriagem.nivel_alerta?.includes('ATENÇÃO') ? 'bg-yellow-100 border-yellow-400' :
              alertaTriagem.nivel_alerta?.includes('Normal') ? 'bg-green-100 border-green-400' :
              'bg-gray-100 border-gray-400'
            }`}>
              <p className="font-bold text-lg mb-2">
                {alertaTriagem.nivel_alerta}
              </p>
              {alertaTriagem.mensagem_para_medico && (
                <p className="text-sm mt-2">{alertaTriagem.mensagem_para_medico}</p>
              )}
            </div>

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
                {alertaTriagem.territorio_provavel && (
                  <div className="mt-3 p-3 bg-red-50 rounded">
                    <p className="text-sm"><strong>Território provável:</strong> {alertaTriagem.territorio_provavel}</p>
                  </div>
                )}
              </div>
            )}

            {!alertaTriagem.elevacao_st_detectada && alertaTriagem.territorio_provavel && (
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-gray-700">{alertaTriagem.territorio_provavel}</p>
              </div>
            )}

            <Alert className="border-orange-500 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 text-sm">
                <strong>⚠️ IMPORTANTE:</strong> Este é apenas um alerta de triagem automática. 
                <strong className="block mt-1">O médico DEVE interpretar o ECG pessoalmente antes de qualquer conduta.</strong>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {ecgFiles.length > 0 && (
        <Card className="border-2 border-blue-500 shadow-lg">
          <CardHeader className="bg-blue-50 border-b">
            <CardTitle className="text-blue-900 text-lg">
              📋 INTERPRETAÇÃO DO ECG PELO MÉDICO *
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
- Elevação do segmento ST: V2 (3mm), V3 (4mm), V4 (2mm), V5 (2mm)
- Território: PAREDE ANTERIOR
- Ondas Q patológicas: ausentes
- Infradesnivelamento recíproco: DII, DIII, aVF

CONCLUSÃO: STEMI DE PAREDE ANTERIOR
ARTÉRIA CULPADA: Descendente anterior esquerda (provável)
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

      <Alert className="border-green-500 bg-green-50">
        <Info className="h-5 w-5 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>✓ Sistemas especializados recomendados:</strong>
          <ul className="list-disc pl-5 mt-2 text-sm">
            <li>Philips DXL Algorithm (FDA approved)</li>
            <li>GE Marquette 12SL (certificado)</li>
            <li>Cardiologs AI (deep learning especializado)</li>
            <li>ECG.ai (análise por IA médica)</li>
          </ul>
          <p className="mt-2 text-xs">
            Estes sistemas devem ser usados quando disponíveis na instituição.
          </p>
        </AlertDescription>
      </Alert>

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
