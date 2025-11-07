import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Upload, Loader2, AlertCircle, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { differenceInMinutes } from "date-fns";

export default function Etapa5ECGEnfermeiro({ dadosPaciente, onProxima, onAnterior }) {
  const [ecgFiles, setEcgFiles] = useState(dadosPaciente.ecg_files || []);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analiseECG, setAnaliseECG] = useState(dadosPaciente.analise_ecg || null);
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

      // Análise automática do primeiro ECG
      if (urls.length > 0) {
        await analisarECGAutomaticamente(urls[0]);
      }

    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao anexar ECG. Tente novamente.");
    }
    
    setUploading(false);
  };

  const analisarECGAutomaticamente = async (ecgUrl) => {
    setAnalyzing(true);
    setAnaliseECG(null);

    try {
      const schema = {
        type: "object",
        properties: {
          qualidade_imagem: {
            type: "string",
            enum: ["Boa", "Razoável", "Ruim"],
            description: "Qualidade da imagem do ECG para leitura"
          },
          ritmo: {
            type: "string",
            description: "Ritmo cardíaco observado (ex: sinusal, fibrilação atrial, etc)"
          },
          frequencia_cardiaca: {
            type: "number",
            description: "Frequência cardíaca aproximada em bpm"
          },
          alteracoes_st: {
            type: "string",
            description: "Descreva alterações do segmento ST se houver (ex: elevação em DII, DIII, aVF)"
          },
          alteracoes_onda_t: {
            type: "string",
            description: "Descreva alterações da onda T se houver"
          },
          outras_alteracoes: {
            type: "string",
            description: "Outras alterações importantes (bloqueios, arritmias, etc)"
          },
          interpretacao_geral: {
            type: "string",
            description: "Interpretação geral do ECG em linguagem simples"
          }
        },
        required: ["qualidade_imagem", "ritmo", "interpretacao_geral"]
      };

      const prompt = `Você é um especialista em análise de eletrocardiogramas (ECG).

Analise a imagem de ECG anexada e responda:

1. **Qualidade da imagem**: A imagem está legível? (Boa/Razoável/Ruim)

2. **Ritmo cardíaco**: Qual o ritmo? (sinusal, fibrilação atrial, flutter, etc)

3. **Frequência cardíaca**: Aproximadamente quantos batimentos por minuto?

4. **Segmento ST**: 
   - Há elevação do segmento ST? Em quais derivações?
   - Há infradesnivelamento do segmento ST? Em quais derivações?
   - Se não há alterações, escreva "normal"

5. **Onda T**:
   - As ondas T estão normais, invertidas, apiculadas ou achatadas?
   - Em quais derivações há alterações?
   - Se não há alterações, escreva "normal"

6. **Outras alterações importantes**:
   - Há bloqueios de ramo?
   - Há arritmias?
   - Há sinais de hipertrofia ventricular?
   - Se não há outras alterações, escreva "nenhuma"

7. **Interpretação geral**: 
   Faça um resumo simples do que você observou no ECG, como se estivesse explicando para um médico.

IMPORTANTE: 
- Seja OBJETIVO e DESCRITIVO
- NÃO faça diagnósticos clínicos (não diga "IAM", "angina", etc)
- APENAS descreva o que você VÊ no traçado do ECG`;

      console.log("📊 Iniciando análise automática de ECG...");
      
      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: ecgUrl,
        response_json_schema: schema
      });

      if (resultado && resultado.interpretacao_geral) {
        console.log("✅ Análise concluída com sucesso");
        
        // Determinar nível de alerta baseado nas alterações
        let nivelAlerta = "info"; // info, warning, danger
        let mensagemAlerta = "ECG analisado - Sem alterações críticas aparentes";
        
        const alteracoesST = resultado.alteracoes_st?.toLowerCase() || "";
        const alteracoesT = resultado.alteracoes_onda_t?.toLowerCase() || "";
        
        if (alteracoesST.includes("elevação") || alteracoesST.includes("elevado")) {
          nivelAlerta = "danger";
          mensagemAlerta = "⚠️ ATENÇÃO: Elevação de ST detectada";
        } else if (alteracoesST.includes("infra") || alteracoesST.includes("depressão")) {
          nivelAlerta = "warning";
          mensagemAlerta = "⚠️ Infradesnivelamento de ST detectado";
        } else if (alteracoesT.includes("invertida") || alteracoesT.includes("inversão")) {
          nivelAlerta = "warning";
          mensagemAlerta = "Ondas T invertidas detectadas";
        }
        
        const analise = {
          ...resultado,
          nivel_alerta: nivelAlerta,
          mensagem_alerta: mensagemAlerta,
          timestamp: new Date().toISOString(),
          ecg_url: ecgUrl
        };
        
        setAnaliseECG(analise);
      } else {
        throw new Error("Resposta inválida da análise");
      }

    } catch (error) {
      console.error("❌ Erro na análise:", error);
      
      // Criar análise de fallback
      setAnaliseECG({
        qualidade_imagem: "Ruim",
        ritmo: "Não avaliável",
        interpretacao_geral: `ERRO NA ANÁLISE AUTOMÁTICA\n\nO sistema não conseguiu processar o ECG.\n\n⚠️ INTERPRETAÇÃO MÉDICA MANUAL OBRIGATÓRIA\n\nErro: ${error.message}`,
        nivel_alerta: "warning",
        mensagem_alerta: "Erro na análise automática - Interpretação manual necessária",
        timestamp: new Date().toISOString()
      });
    }
    
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

    const dadosParaSalvar = {
      ecg_files: ecgFiles,
      data_hora_ecg: dataHoraEcg,
      tempo_triagem_ecg_minutos: tempoMinutos,
      analise_ecg: analiseECG,
      enfermeiro_nome: enfermeiro.nome,
      enfermeiro_coren: enfermeiro.coren,
      status: "Aguardando Médico"
    };

    onProxima(dadosParaSalvar);
  };

  const tempoTriagemEcg = dadosPaciente.tempo_triagem_ecg_minutos;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Eletrocardiograma (ECG)</h2>
        <p className="text-gray-600">Anexe o ECG - análise automática por IA</p>
      </div>

      <Alert className="border-blue-600 bg-blue-50 border-2">
        <Info className="h-6 w-6 text-blue-700" />
        <AlertDescription className="text-blue-900">
          <strong className="text-lg block mb-2">🤖 Análise Inteligente de ECG</strong>
          <p className="mb-2">
            O sistema analisará automaticamente o ECG usando inteligência artificial.
          </p>
          <p className="font-bold text-sm">
            ⚠️ A análise é um SUPORTE - interpretação médica é obrigatória.
          </p>
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
              disabled={uploading || analyzing || ecgFiles.length >= 3}
            />
            <label htmlFor="ecg-upload" className="cursor-pointer flex flex-col items-center">
              {uploading ? (
                <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-2" />
              ) : (
                <Upload className="w-12 h-12 text-gray-400 mb-2" />
              )}
              <p className="text-sm font-medium text-gray-700">
                {uploading ? "Carregando..." : analyzing ? "Analisando..." : "Clique para anexar ECG"}
              </p>
              <p className="text-xs text-gray-500 mt-1">Imagem ou PDF do ECG de 12 derivações</p>
            </label>
          </div>

          {analyzing && (
            <Alert className="border-purple-500 bg-purple-50">
              <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
              <AlertDescription className="text-purple-800">
                <div className="space-y-2">
                  <p className="font-bold">🤖 Inteligência Artificial Analisando ECG...</p>
                  <p className="text-sm">• Avaliando qualidade da imagem</p>
                  <p className="text-sm">• Identificando ritmo e frequência</p>
                  <p className="text-sm">• Analisando segmento ST e ondas T</p>
                  <p className="text-sm">• Detectando outras alterações</p>
                  <p className="text-sm font-bold mt-2">⏳ Aguarde 20-40 segundos...</p>
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
                    />
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

      {/* RESULTADO DA ANÁLISE */}
      {analiseECG && !analyzing && (
        <Card className={`shadow-lg border-2 ${
          analiseECG.nivel_alerta === "danger" ? "border-red-500 bg-red-50" :
          analiseECG.nivel_alerta === "warning" ? "border-orange-500 bg-orange-50" :
          "border-green-500 bg-green-50"
        }`}>
          <CardHeader className={`${
            analiseECG.nivel_alerta === "danger" ? "bg-red-100 border-b-2 border-red-300" :
            analiseECG.nivel_alerta === "warning" ? "bg-orange-100 border-b-2 border-orange-300" :
            "bg-green-100 border-b-2 border-green-300"
          }`}>
            <CardTitle className="text-lg flex items-center gap-2">
              {analiseECG.nivel_alerta === "danger" ? <AlertTriangle className="w-6 h-6 text-red-700" /> :
               analiseECG.nivel_alerta === "warning" ? <AlertCircle className="w-6 h-6 text-orange-700" /> :
               <CheckCircle2 className="w-6 h-6 text-green-700" />}
              🤖 Análise Automática do ECG
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            
            {/* Alerta Principal */}
            <div className={`p-4 rounded-lg border-2 font-bold text-lg ${
              analiseECG.nivel_alerta === "danger" ? "bg-red-100 border-red-400 text-red-900" :
              analiseECG.nivel_alerta === "warning" ? "bg-orange-100 border-orange-400 text-orange-900" :
              "bg-green-100 border-green-400 text-green-900"
            }`}>
              {analiseECG.mensagem_alerta}
            </div>

            {/* Qualidade da Imagem */}
            <div className="bg-white p-3 rounded border">
              <p className="text-sm font-semibold text-gray-700 mb-1">📷 Qualidade da Imagem:</p>
              <Badge className={`${
                analiseECG.qualidade_imagem === "Boa" ? "bg-green-100 text-green-800" :
                analiseECG.qualidade_imagem === "Razoável" ? "bg-yellow-100 text-yellow-800" :
                "bg-red-100 text-red-800"
              }`}>
                {analiseECG.qualidade_imagem}
              </Badge>
            </div>

            {/* Dados Básicos */}
            <div className="grid md:grid-cols-2 gap-3">
              {analiseECG.ritmo && (
                <div className="bg-white p-3 rounded border">
                  <p className="text-sm font-semibold text-gray-700 mb-1">💓 Ritmo:</p>
                  <p className="text-gray-900">{analiseECG.ritmo}</p>
                </div>
              )}
              {analiseECG.frequencia_cardiaca && (
                <div className="bg-white p-3 rounded border">
                  <p className="text-sm font-semibold text-gray-700 mb-1">📊 Frequência Cardíaca:</p>
                  <p className="text-gray-900">{analiseECG.frequencia_cardiaca} bpm</p>
                </div>
              )}
            </div>

            {/* Alterações ST */}
            {analiseECG.alteracoes_st && (
              <div className="bg-white p-3 rounded border">
                <p className="text-sm font-semibold text-gray-700 mb-1">📈 Segmento ST:</p>
                <p className="text-gray-900 whitespace-pre-wrap">{analiseECG.alteracoes_st}</p>
              </div>
            )}

            {/* Alterações Onda T */}
            {analiseECG.alteracoes_onda_t && (
              <div className="bg-white p-3 rounded border">
                <p className="text-sm font-semibold text-gray-700 mb-1">🌊 Onda T:</p>
                <p className="text-gray-900 whitespace-pre-wrap">{analiseECG.alteracoes_onda_t}</p>
              </div>
            )}

            {/* Outras Alterações */}
            {analiseECG.outras_alteracoes && analiseECG.outras_alteracoes !== "nenhuma" && (
              <div className="bg-yellow-50 p-3 rounded border border-yellow-300">
                <p className="text-sm font-semibold text-yellow-900 mb-1">⚠️ Outras Alterações:</p>
                <p className="text-yellow-800 whitespace-pre-wrap">{analiseECG.outras_alteracoes}</p>
              </div>
            )}

            {/* Interpretação Geral */}
            <div className="bg-blue-50 p-4 rounded border border-blue-300">
              <p className="text-sm font-semibold text-blue-900 mb-2">📋 Interpretação Geral:</p>
              <p className="text-blue-800 whitespace-pre-wrap leading-relaxed">{analiseECG.interpretacao_geral}</p>
            </div>

            {/* Aviso Importante */}
            <Alert className="border-purple-500 bg-purple-50">
              <AlertTriangle className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-800 text-sm">
                <strong>⚠️ IMPORTANTE:</strong> Esta é uma análise automática de SUPORTE. 
                A interpretação CLÍNICA e decisão final são SEMPRE do médico responsável.
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
          disabled={ecgFiles.length === 0 || !enfermeiro.nome || !enfermeiro.coren || analyzing}
        >
          Concluir Triagem de Enfermagem
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}