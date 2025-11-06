import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Upload, Loader2, AlertCircle, AlertTriangle, Info, Zap, ExternalLink, XCircle } from "lucide-react";
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

    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao anexar ECG. Tente novamente.");
    }
    
    setUploading(false);
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
        <p className="text-gray-600">Anexe o ECG para registro no sistema</p>
      </div>

      {/* AVISO CRÍTICO - ANÁLISE AUTOMÁTICA REMOVIDA */}
      <Alert className="border-red-600 bg-red-50 border-2">
        <XCircle className="h-6 w-6 text-red-700" />
        <AlertDescription className="text-red-900">
          <strong className="text-lg block mb-2">⚠️ IMPORTANTE: Sistema de Análise Automática DESATIVADO</strong>
          <p className="mb-2">
            A análise automática de ECG por IA <strong>NÃO É CONFIÁVEL</strong> para decisões clínicas.
          </p>
          <p className="font-bold">
            O médico DEVE interpretar o ECG pessoalmente antes de qualquer conduta.
          </p>
        </AlertDescription>
      </Alert>

      {/* BOTÃO CARDIOLOGS.AI */}
      <Card className="border-2 border-blue-500 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="bg-blue-100 border-b border-blue-300">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Zap className="w-6 h-6" />
            🤖 Sistema Especializado Recomendado: Cardiologs AI
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              <strong>Cardiologs AI</strong> é um sistema certificado pela FDA (EUA) e CE (Europa) para análise de ECG 
              com inteligência artificial especializada.
            </p>
            
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">✓ Recursos do Cardiologs AI:</h4>
              <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                <li>Detecção de STEMI e NSTEMI com alta precisão</li>
                <li>Análise de todas as 12 derivações automaticamente</li>
                <li>Identificação de territórios coronarianos afetados</li>
                <li>Relatório detalhado pronto em segundos</li>
                <li>Validado clinicamente em milhões de ECGs</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-3 rounded border border-yellow-300">
              <p className="text-sm text-yellow-900">
                <strong>📝 Como usar:</strong>
              </p>
              <ol className="text-sm text-yellow-800 mt-2 space-y-1 list-decimal pl-5">
                <li>Clique no botão abaixo para abrir Cardiologs.ai em nova aba</li>
                <li>Faça upload do ECG no sistema Cardiologs</li>
                <li>Aguarde análise automática (5-10 segundos)</li>
                <li>Copie o resultado e cole no campo "Interpretação do ECG" abaixo</li>
              </ol>
            </div>

            <a 
              href="https://app.cardiologs.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
              <Button 
                type="button" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-lg"
              >
                <ExternalLink className="w-5 h-5 mr-3" />
                Abrir Cardiologs AI (Sistema Externo Especializado)
              </Button>
            </a>

            <p className="text-xs text-gray-600 text-center">
              Sistema externo - requer conta no Cardiologs.com
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
          <strong>✓ Sistemas especializados certificados recomendados:</strong>
          <ul className="list-disc pl-5 mt-2 text-sm">
            <li><strong>Cardiologs AI</strong> - FDA e CE certificado (link acima) ⭐ RECOMENDADO</li>
            <li><strong>Philips DXL Algorithm</strong> - FDA approved</li>
            <li><strong>GE Marquette 12SL</strong> - Certificado internacionalmente</li>
            <li><strong>Schiller MEANS</strong> - Análise avançada de ECG</li>
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