import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import DadosPaciente from "@/components/regulacao/DadosPaciente";
import LinhaTempo from "@/components/regulacao/LinhaTempo";
import ChatInterno from "@/components/ChatInterno";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ASSCARDIODetalhe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const pacienteId = urlParams.get('id');
  const relatorioRef = useRef(null);

  const { data: paciente, isLoading } = useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: () => base44.entities.Paciente.list().then(list => list.find(p => p.id === pacienteId)),
    enabled: !!pacienteId
  });

  const [bloco0Open, setBloco0Open] = useState(true);
  const [bloco1Open, setBloco1Open] = useState(true);
  const [bloco2Open, setBloco2Open] = useState(false);

  // Bloco 0 - Clínica
  const [clinica, setClinica] = useState({
    dor_tipica: false,
    sudorese: false,
    has: false,
    dm: false,
    tabagismo: false,
    dislipidemia: false
  });

  // Bloco 1 - Supra ST
  const [ecgSupra, setEcgSupra] = useState({
    // Inferior
    d2: false, d3: false, avf: false,
    reciproco_d1_avl: false, reciproco_v1_v3: false,
    // Anterior
    v1: false, v2: false, v3: false, v4: false,
    reciproco_d2_d3_avf: false,
    // Lateral
    d1: false, avl: false, v5: false, v6: false,
    // Outros
    t_hiperaguda: false,
    v7_v9: false,
    v3r_v4r: false,
    // Decisão
    tem_supra: "nao",
    parede_supra: ""
  });

  // Bloco 2 - Sem Supra
  const [ecgSemSupra, setEcgSemSupra] = useState({
    infra_st: false,
    t_invertida: false,
    q_nova: false,
    wellens: false,
    infra_difusa_avr: false,
    probabilidade: "baixa"
  });

  // HEART Score
  const [heartScore, setHeartScore] = useState({
    historia: 0,
    ecg: 0,
    idade: 0,
    risco: 0,
    troponina: 0
  });

  // Pré-preencher HEART Score quando paciente carrega
  useEffect(() => {
    if (!paciente) return;

    const triagem = paciente.triagem_medica || {};

    // H - História Clínica
    let historia = 0;
    if (triagem.historia_clinica?.includes("Altamente suspeita")) historia = 2;
    else if (triagem.historia_clinica?.includes("Moderadamente")) historia = 1;

    // E - ECG
    let ecg = 0;
    if (triagem.ecg_classificacao?.includes("Depressão significativa")) ecg = 2;
    else if (triagem.ecg_classificacao?.includes("inespecífica")) ecg = 1;

    // A - Idade
    const idade = paciente.idade || 0;
    let pontoIdade = 0;
    if (idade >= 65) pontoIdade = 2;
    else if (idade >= 45) pontoIdade = 1;

    // R - Fatores de Risco
    const qtdFatores = (triagem.fatores_risco || []).length;
    let risco = 0;
    if (qtdFatores >= 3) risco = 2;
    else if (qtdFatores >= 1) risco = 1;

    setHeartScore(prev => ({
      ...prev,
      historia,
      ecg,
      idade: pontoIdade,
      risco
    }));
  }, [paciente]);

  // Pré-parecer (gerado pelo enfermeiro)
  const [preParecer, setPreParecer] = useState("");
  const [enfermeiroFinalizado, setEnfermeiroFinalizado] = useState(false);

  // Médico
  const [medicoData, setMedicoData] = useState({
    confirma_triagem: false,
    diagnostico_estrategia: "",
    parecer_cardiologista: ""
  });

  // Calcular HEART Score total
  const calcularHeartTotal = () => {
    return heartScore.historia + heartScore.ecg + heartScore.idade + heartScore.risco + heartScore.troponina;
  };

  const getHeartInterpretacao = (total) => {
    if (total <= 3) return "Baixo (0-3)";
    if (total <= 6) return "Intermediário (4-6)";
    return "Alto (7-10)";
  };

  // Gerar pré-parecer automaticamente
  const gerarPreParecer = () => {
    const heartTotal = calcularHeartTotal();
    let parecer = "";

    if (ecgSupra.tem_supra === "sim") {
      parecer = `IAM SUPRA parede ${ecgSupra.parede_supra} - AVALIAÇÃO IMEDIATA`;
    } else if (heartTotal >= 7) {
      parecer = `SCA SEM SUPRA alto risco (HEART ${heartTotal}) - URGENTE`;
    } else if (heartTotal >= 4) {
      parecer = `SCA risco intermediário (HEART ${heartTotal})`;
    } else {
      parecer = `ECG/clínica baixa probabilidade`;
    }

    setPreParecer(parecer);
    setEnfermeiroFinalizado(true);
    alert("Pré-parecer gerado! Aguardando avaliação médica.");
  };

  const gerarRelatorioPDF = async () => {
    if (!relatorioRef.current) return null;

    try {
      const canvas = await html2canvas(relatorioRef.current, {
        scale: 1.8,
        logging: false,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        imageTimeout: 15000,
        removeContainer: true
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const pdfBlob = pdf.output('blob');
      const nomePaciente = (paciente?.nome_completo || 'Paciente').replace(/\s+/g, '_');
      const nomeArquivo = `Relatorio_ASSCARDIO_${nomePaciente}_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`;
      const pdfFile = new File([pdfBlob], nomeArquivo, { type: 'application/pdf' });

      const uploadResult = await base44.integrations.Core.UploadFile({ file: pdfFile });
      return uploadResult.file_url;
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      throw error;
    }
  };

  const salvarLaudoMedico = useMutation({
    mutationFn: async () => {
      // Gerar o relatório como PDF
      const file_url = await gerarRelatorioPDF();

      // Salvar dados da assessoria + URL do relatório
      await base44.entities.Paciente.update(pacienteId, {
        assessoria_cardiologia: {
          data_hora: new Date().toISOString(),
          clinica: clinica,
          ecg_supra: ecgSupra,
          ecg_sem_supra: ecgSemSupra,
          heart_score: {
            ...heartScore,
            total: calcularHeartTotal(),
            interpretacao: getHeartInterpretacao(calcularHeartTotal())
          },
          pre_parecer: preParecer,
          diagnostico_estrategia: medicoData.diagnostico_estrategia,
          parecer_cardiologista: medicoData.parecer_cardiologista
        },
        relatorio_asscardio_url: file_url,
        status: "Aguardando Regulação"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['paciente', pacienteId]);
      alert("Laudo finalizado com sucesso! Relatório disponível para o CERH.");
      navigate(createPageUrl("Dashboard"));
    },
    onError: (error) => {
      alert("Erro ao salvar laudo: " + error.message);
    }
  });

  if (isLoading) {
    return <div className="p-8">Carregando...</div>;
  }

  if (!paciente) {
    return <div className="p-8">Paciente não encontrado</div>;
  }

  const heartTotal = calcularHeartTotal();

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 to-green-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate(createPageUrl("Dashboard"))}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-blue-900 flex items-center gap-2">
              <Heart className="w-8 h-8 text-red-600" />
              🏥 TRIAGEM ECG - ASSCARDIO
            </h1>
            <p className="text-blue-700">Enfermeiro + Cardiologista</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda */}
          <div className="lg:col-span-1 space-y-6">
            <DadosPaciente paciente={paciente} />
            <LinhaTempo paciente={paciente} />
            <ChatInterno pacienteId={pacienteId} />
          </div>

          {/* Coluna Direita - Formulário */}
           <div className="lg:col-span-2 space-y-4">

            {/* Card de Agendamento de ICP - Se houver */}
            {paciente.hemodinamica?.data_hora_agendamento_icp && (
              <Card className="border-blue-300 bg-blue-50">
                <CardHeader className="bg-blue-100">
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Calendar className="w-5 h-5" />
                    Agendamento de ICP
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 mt-4">
                  <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                    <p className="text-sm font-semibold text-blue-900">Data e Hora Agendada:</p>
                    <p className="text-lg font-bold text-blue-600">{format(new Date(paciente.hemodinamica.data_hora_agendamento_icp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  </div>
                  {paciente.hemodinamica?.tipo_icp && (
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Tipo de ICP:</p>
                      <Badge className="mt-1">
                        {paciente.hemodinamica.tipo_icp === 'imediata' && 'Imediata'}
                        {paciente.hemodinamica.tipo_icp === 'ate_24h' && 'Até 24 horas'}
                        {paciente.hemodinamica.tipo_icp === 'ate_72h' && 'Até 72 horas'}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Relatório Visual (Oculto) */}
            <div style={{ position: 'absolute', left: '-9999px' }}>
              <div 
                ref={relatorioRef} 
                className="bg-white p-8"
                style={{ width: '210mm', minHeight: '297mm' }}
              >
                {/* Cabeçalho com logos */}
                <div className="mb-6 pb-4 border-b-2 border-gray-300">
                  <div className="flex items-center justify-between gap-4 w-full mb-3">
                    <img 
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/8e093c8da_logoSecretariadeEstadodaSade.png" 
                      alt="Secretaria de Estado da Saúde" 
                      className="h-12 w-auto object-contain"
                      crossOrigin="anonymous"
                    />
                    <img 
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/fa5f3a17e_LOGOCORAAOPARAIBANO.png" 
                      alt="Coração Paraibano" 
                      className="h-12 w-auto object-contain"
                      crossOrigin="anonymous"
                    />
                    <img 
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/006e0d9aa_LogoComplexoregulador.jpg" 
                      alt="Complexo Regulador" 
                      className="h-12 w-auto object-contain"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div className="text-center">
                    <h1 className="text-xl font-bold text-red-600 flex items-center justify-center gap-2">
                      <Heart className="w-6 h-6" />
                      RELATÓRIO ASSESSORIA CARDIOLÓGICA - ASSCARDIO
                    </h1>
                    <p className="text-sm text-gray-700 mt-2">
                      Data: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {/* Dados do Paciente */}
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-300">DADOS DO PACIENTE</h2>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="font-semibold">Nome:</span> {paciente?.nome_completo}</div>
                    <div><span className="font-semibold">Idade:</span> {paciente?.idade} anos</div>
                    <div><span className="font-semibold">Sexo:</span> {paciente?.sexo}</div>
                    <div><span className="font-semibold">Unidade:</span> {paciente?.unidade_saude || 'Não Informada'}</div>
                  </div>
                </div>

                {/* Pré-Parecer */}
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-300">AVALIAÇÃO DE ENFERMAGEM (PRÉ-PARECER)</h2>
                  <p className="text-sm font-bold text-blue-900">{preParecer}</p>
                </div>

                {/* Dados Clínicos */}
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-300">DADOS CLÍNICOS</h2>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>• Dor Típica: {clinica.dor_tipica ? 'Sim' : 'Não'}</div>
                    <div>• Sudorese: {clinica.sudorese ? 'Sim' : 'Não'}</div>
                    <div>• HAS: {clinica.has ? 'Sim' : 'Não'}</div>
                    <div>• DM: {clinica.dm ? 'Sim' : 'Não'}</div>
                    <div>• Tabagismo: {clinica.tabagismo ? 'Sim' : 'Não'}</div>
                    <div>• Dislipidemia: {clinica.dislipidemia ? 'Sim' : 'Não'}</div>
                  </div>
                </div>

                {/* ECG Supra ST */}
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-300">ACHADOS DO ECG (SUPRA ST)</h2>
                  <div className="text-xs space-y-1">
                    <p><strong>Tem Supra ST:</strong> {ecgSupra.tem_supra === 'sim' ? 'Sim' : 'Não'}</p>
                    {ecgSupra.tem_supra === 'sim' && <p><strong>Parede:</strong> {ecgSupra.parede_supra}</p>}
                    <p><strong>Parede Inferior:</strong> D2={ecgSupra.d2?'Sim':'Não'}, D3={ecgSupra.d3?'Sim':'Não'}, aVF={ecgSupra.avf?'Sim':'Não'}</p>
                    <p><strong>Recíprocos Inferior:</strong> D1/aVL={ecgSupra.reciproco_d1_avl?'Sim':'Não'}, V1-V3={ecgSupra.reciproco_v1_v3?'Sim':'Não'}</p>
                    <p><strong>Parede Anterior:</strong> V1={ecgSupra.v1?'Sim':'Não'}, V2={ecgSupra.v2?'Sim':'Não'}, V3={ecgSupra.v3?'Sim':'Não'}, V4={ecgSupra.v4?'Sim':'Não'}</p>
                    <p><strong>Recíprocos Anterior:</strong> D2/D3/aVF={ecgSupra.reciproco_d2_d3_avf?'Sim':'Não'}</p>
                    <p><strong>Parede Lateral:</strong> D1={ecgSupra.d1?'Sim':'Não'}, aVL={ecgSupra.avl?'Sim':'Não'}, V5={ecgSupra.v5?'Sim':'Não'}, V6={ecgSupra.v6?'Sim':'Não'}</p>
                    <p><strong>Outros:</strong> T Hiperaguda={ecgSupra.t_hiperaguda?'Sim':'Não'}, V7-V9={ecgSupra.v7_v9?'Sim':'Não'}, V3R/V4R={ecgSupra.v3r_v4r?'Sim':'Não'}</p>
                  </div>
                </div>

                {/* ECG Sem Supra */}
                {ecgSupra.tem_supra === 'nao' && (
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-300">ACHADOS DO ECG (SEM SUPRA ST)</h2>
                    <div className="text-xs space-y-1">
                      <p>• Infra ST ≥0.5mm: {ecgSemSupra.infra_st ? 'Sim' : 'Não'}</p>
                      <p>• T invertida: {ecgSemSupra.t_invertida ? 'Sim' : 'Não'}</p>
                      <p>• Q nova: {ecgSemSupra.q_nova ? 'Sim' : 'Não'}</p>
                      <p>• Wellens: {ecgSemSupra.wellens ? 'Sim' : 'Não'}</p>
                      <p>• Infra difusa+aVR: {ecgSemSupra.infra_difusa_avr ? 'Sim' : 'Não'}</p>
                      <p><strong>Probabilidade:</strong> {ecgSemSupra.probabilidade}</p>
                    </div>
                  </div>
                )}

                {/* HEART Score - apenas quando NÃO tem supra ST */}
                {ecgSupra.tem_supra !== 'sim' && (
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-300">HEART SCORE</h2>
                    <div className="text-xs space-y-1">
                      <p>• História: {heartScore.historia} pontos</p>
                      <p>• ECG: {heartScore.ecg} pontos</p>
                      <p>• Idade: {heartScore.idade} pontos</p>
                      <p>• Fatores de Risco: {heartScore.risco} pontos</p>
                      <p className="font-bold text-base mt-2">TOTAL: {calcularHeartTotal()} pontos - {getHeartInterpretacao(calcularHeartTotal())}</p>
                    </div>
                  </div>
                )}

                {/* Avaliação do Cardiologista */}
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-300">AVALIAÇÃO DO CARDIOLOGISTA</h2>
                  <div className="text-xs space-y-2">
                    <p><strong>Triagem de enfermagem confirmada:</strong> {medicoData.confirma_triagem ? 'Sim' : 'Não'}</p>
                    <p><strong>Diagnóstico + Estratégia:</strong> {(() => {
                      const estrategias = {
                        "1": "1- IAM supra ST → Estratégia 1: transferência imediata",
                        "2": "2- SCA sem supra MUITO alto risco → Estratégia 1: transferência imediata",
                        "3": "3- IAM sem supra/alto risco → Estratégia 2: invasiva ≤24h",
                        "4": "4- SCA intermediário → Estratégia 3: invasiva ≤72h"
                      };
                      return estrategias[medicoData.diagnostico_estrategia] || 'Não definido';
                    })()}</p>
                    <div className="mt-3">
                      <p className="font-semibold mb-1">PARECER DO CARDIOLOGISTA:</p>
                      <p className="whitespace-pre-wrap">{medicoData.parecer_cardiologista}</p>
                    </div>
                  </div>
                </div>

                {/* Rodapé */}
                <div className="mt-8 pt-4 border-t-2 border-gray-300 text-xs text-gray-600">
                  <p className="font-semibold">Sistema de Triagem de Dor Torácica</p>
                  <p>Autor: Walber Alves Frazão Júnior - COREN 110.238</p>
                  <p>Gerado em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
                </div>
              </div>
            </div>

        {/* 1. DECISÃO 1E: RELATO MÉDICO DE SUPRA ST? */}
        <Card className="mb-4 border-2 border-yellow-400 bg-yellow-50">
          <CardHeader className="bg-yellow-100">
            <CardTitle className="text-yellow-900">📋 RELATO MÉDICO DE SUPRA ST?</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <RadioGroup value={ecgSupra.tem_supra} onValueChange={(v) => setEcgSupra({...ecgSupra, tem_supra: v})}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="supra_sim" />
                <Label htmlFor="supra_sim" className="text-lg font-semibold">SIM</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="supra_nao" />
                <Label htmlFor="supra_nao" className="text-lg font-semibold">NÃO</Label>
              </div>
            </RadioGroup>
            {ecgSupra.tem_supra === "sim" && (
              <div className="mt-3">
                <Label className="font-semibold">Parede:</Label>
                <Select value={ecgSupra.parede_supra} onValueChange={(v) => setEcgSupra({...ecgSupra, parede_supra: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a parede" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inferior">Inferior</SelectItem>
                    <SelectItem value="Anterior">Anterior</SelectItem>
                    <SelectItem value="Lateral">Lateral</SelectItem>
                    <SelectItem value="Posterior">Posterior</SelectItem>
                    <SelectItem value="VD">VD (Ventrículo Direito)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. BLOCO 1 - SUPRA ST */}
        <Collapsible open={bloco1Open} onOpenChange={setBloco1Open}>
          <Card className="mb-4 border-2 border-blue-200">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="bg-blue-100 cursor-pointer hover:bg-blue-200 transition-colors">
                <CardTitle className="text-blue-900 flex items-center justify-between">
                  <span>🔍 BLOCO 1 - SUPRA ST?</span>
                  {bloco1Open ? <ChevronUp /> : <ChevronDown />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-4 space-y-4">
                {/* Parede Inferior */}
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-bold text-red-700 mb-2">Parede Inferior:</h4>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="d2" checked={ecgSupra.d2} onCheckedChange={(c) => setEcgSupra({...ecgSupra, d2: c})} />
                      <Label htmlFor="d2" className="text-lg">☐ D2</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="d3" checked={ecgSupra.d3} onCheckedChange={(c) => setEcgSupra({...ecgSupra, d3: c})} />
                      <Label htmlFor="d3" className="text-lg">☐ D3</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="avf" checked={ecgSupra.avf} onCheckedChange={(c) => setEcgSupra({...ecgSupra, avf: c})} />
                      <Label htmlFor="avf" className="text-lg">☐ aVF</Label>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Recíprocos:</p>
                  <div className="grid md:grid-cols-2 gap-3 mt-1">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="rec_d1_avl" checked={ecgSupra.reciproco_d1_avl} onCheckedChange={(c) => setEcgSupra({...ecgSupra, reciproco_d1_avl: c})} />
                      <Label htmlFor="rec_d1_avl">☐ D1/aVL</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="rec_v1_v3" checked={ecgSupra.reciproco_v1_v3} onCheckedChange={(c) => setEcgSupra({...ecgSupra, reciproco_v1_v3: c})} />
                      <Label htmlFor="rec_v1_v3">☐ V1-V3</Label>
                    </div>
                  </div>
                </div>

                {/* Parede Anterior */}
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-bold text-orange-700 mb-2">Parede Anterior:</h4>
                  <div className="grid md:grid-cols-4 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="v1" checked={ecgSupra.v1} onCheckedChange={(c) => setEcgSupra({...ecgSupra, v1: c})} />
                      <Label htmlFor="v1" className="text-lg">☐ V1</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="v2" checked={ecgSupra.v2} onCheckedChange={(c) => setEcgSupra({...ecgSupra, v2: c})} />
                      <Label htmlFor="v2" className="text-lg">☐ V2</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="v3" checked={ecgSupra.v3} onCheckedChange={(c) => setEcgSupra({...ecgSupra, v3: c})} />
                      <Label htmlFor="v3" className="text-lg">☐ V3</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="v4" checked={ecgSupra.v4} onCheckedChange={(c) => setEcgSupra({...ecgSupra, v4: c})} />
                      <Label htmlFor="v4" className="text-lg">☐ V4</Label>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Recíprocos:</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Checkbox id="rec_d2_d3_avf" checked={ecgSupra.reciproco_d2_d3_avf} onCheckedChange={(c) => setEcgSupra({...ecgSupra, reciproco_d2_d3_avf: c})} />
                    <Label htmlFor="rec_d2_d3_avf">☐ D2/D3/aVF</Label>
                  </div>
                </div>

                {/* Parede Lateral */}
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-bold text-green-700 mb-2">Parede Lateral:</h4>
                  <div className="grid md:grid-cols-4 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="d1" checked={ecgSupra.d1} onCheckedChange={(c) => setEcgSupra({...ecgSupra, d1: c})} />
                      <Label htmlFor="d1" className="text-lg">☐ D1</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="avl" checked={ecgSupra.avl} onCheckedChange={(c) => setEcgSupra({...ecgSupra, avl: c})} />
                      <Label htmlFor="avl" className="text-lg">☐ aVL</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="v5" checked={ecgSupra.v5} onCheckedChange={(c) => setEcgSupra({...ecgSupra, v5: c})} />
                      <Label htmlFor="v5" className="text-lg">☐ V5</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="v6" checked={ecgSupra.v6} onCheckedChange={(c) => setEcgSupra({...ecgSupra, v6: c})} />
                      <Label htmlFor="v6" className="text-lg">☐ V6</Label>
                    </div>
                  </div>
                </div>

                {/* Outros */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-bold text-purple-700 mb-2">Outros:</h4>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="t_hiperaguda" checked={ecgSupra.t_hiperaguda} onCheckedChange={(c) => setEcgSupra({...ecgSupra, t_hiperaguda: c})} />
                      <Label htmlFor="t_hiperaguda">☐ T hiperaguda</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="v7_v9" checked={ecgSupra.v7_v9} onCheckedChange={(c) => setEcgSupra({...ecgSupra, v7_v9: c})} />
                      <Label htmlFor="v7_v9">☐ V7-V9</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="v3r_v4r" checked={ecgSupra.v3r_v4r} onCheckedChange={(c) => setEcgSupra({...ecgSupra, v3r_v4r: c})} />
                      <Label htmlFor="v3r_v4r">☐ V3R/V4R</Label>
                    </div>
                  </div>
                </div>

                {/* Decisão 1E */}
                <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-400">
                  <Label className="text-lg font-bold text-yellow-900 mb-3 block">Decisão 1E: TEM SUPRA ST?</Label>
                  <RadioGroup value={ecgSupra.tem_supra} onValueChange={(v) => setEcgSupra({...ecgSupra, tem_supra: v})}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sim" id="supra_sim" />
                      <Label htmlFor="supra_sim" className="text-lg">SIM</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nao" id="supra_nao" />
                      <Label htmlFor="supra_nao" className="text-lg">NÃO</Label>
                    </div>
                  </RadioGroup>
                  {ecgSupra.tem_supra === "sim" && (
                    <div className="mt-3">
                      <Label>Parede:</Label>
                      <Select value={ecgSupra.parede_supra} onValueChange={(v) => setEcgSupra({...ecgSupra, parede_supra: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a parede" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inferior">Inferior</SelectItem>
                          <SelectItem value="Anterior">Anterior</SelectItem>
                          <SelectItem value="Lateral">Lateral</SelectItem>
                          <SelectItem value="Posterior">Posterior</SelectItem>
                          <SelectItem value="VD">VD (Ventrículo Direito)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* 4. BLOCO 2 - SEM SUPRA (apenas se 1E = NÃO) */}
        {ecgSupra.tem_supra === "nao" && (
          <Collapsible open={bloco2Open} onOpenChange={setBloco2Open}>
            <Card className="mb-4 border-2 border-orange-200">
              <CollapsibleTrigger className="w-full">
                <CardHeader className="bg-orange-100 cursor-pointer hover:bg-orange-200 transition-colors">
                  <CardTitle className="text-orange-900 flex items-center justify-between">
                    <span>🔍 BLOCO 2 - SEM SUPRA</span>
                    {bloco2Open ? <ChevronUp /> : <ChevronDown />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-4">
                  <div className="grid md:grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="infra_st" checked={ecgSemSupra.infra_st} onCheckedChange={(c) => setEcgSemSupra({...ecgSemSupra, infra_st: c})} />
                      <Label htmlFor="infra_st" className="text-lg">☐ Infra ST ≥0.5mm</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="t_invertida" checked={ecgSemSupra.t_invertida} onCheckedChange={(c) => setEcgSemSupra({...ecgSemSupra, t_invertida: c})} />
                      <Label htmlFor="t_invertida" className="text-lg">☐ T invertida</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="q_nova" checked={ecgSemSupra.q_nova} onCheckedChange={(c) => setEcgSemSupra({...ecgSemSupra, q_nova: c})} />
                      <Label htmlFor="q_nova" className="text-lg">☐ Q nova</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="wellens" checked={ecgSemSupra.wellens} onCheckedChange={(c) => setEcgSemSupra({...ecgSemSupra, wellens: c})} />
                      <Label htmlFor="wellens" className="text-lg">☐ Wellens</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="infra_difusa" checked={ecgSemSupra.infra_difusa_avr} onCheckedChange={(c) => setEcgSemSupra({...ecgSemSupra, infra_difusa_avr: c})} />
                      <Label htmlFor="infra_difusa" className="text-lg">☐ Infra difusa+aVR</Label>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-400">
                    <Label className="text-lg font-bold text-yellow-900 mb-3 block">Decisão 2D: Probabilidade</Label>
                    <RadioGroup value={ecgSemSupra.probabilidade} onValueChange={(v) => setEcgSemSupra({...ecgSemSupra, probabilidade: v})}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="forte" id="prob_forte" />
                        <Label htmlFor="prob_forte" className="text-lg">Forte</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="inter" id="prob_inter" />
                        <Label htmlFor="prob_inter" className="text-lg">Intermediária</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="baixa" id="prob_baixa" />
                        <Label htmlFor="prob_baixa" className="text-lg">Baixa</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* 5. HEART SCORE */}
        {(ecgSupra.tem_supra === "nao" || ecgSupra.tem_supra === "") && (
          <Card className="mb-4 border-2 border-purple-200 bg-purple-50">
            <CardHeader className="bg-purple-100">
              <CardTitle className="text-purple-900">🧮 HEART SCORE</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-sm text-purple-700 bg-purple-100 p-2 rounded">
                ℹ️ H, E, R e A foram pré-preenchidos com base nos dados da triagem. Revise se necessário e preencha a Troponina.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {/* H */}
                <div>
                  <Label className="font-semibold">H – História Clínica</Label>
                  <Select value={heartScore.historia.toString()} onValueChange={(v) => setHeartScore({...heartScore, historia: parseInt(v)})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 – Pouco suspeita</SelectItem>
                      <SelectItem value="1">1 – Moderadamente suspeita</SelectItem>
                      <SelectItem value="2">2 – Altamente suspeita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* E */}
                <div>
                  <Label className="font-semibold">E – ECG</Label>
                  <Select value={heartScore.ecg.toString()} onValueChange={(v) => setHeartScore({...heartScore, ecg: parseInt(v)})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 – Normal</SelectItem>
                      <SelectItem value="1">1 – Alteração inespecífica</SelectItem>
                      <SelectItem value="2">2 – Depressão significativa do ST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* A */}
                <div>
                  <Label className="font-semibold">A – Idade ({paciente?.idade} anos)</Label>
                  <Select value={heartScore.idade.toString()} onValueChange={(v) => setHeartScore({...heartScore, idade: parseInt(v)})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 – &lt; 45 anos</SelectItem>
                      <SelectItem value="1">1 – 45 a 64 anos</SelectItem>
                      <SelectItem value="2">2 – ≥ 65 anos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* R */}
                <div>
                  <Label className="font-semibold">R – Fatores de Risco ({(paciente?.triagem_medica?.fatores_risco || []).length} fator(es))</Label>
                  <Select value={heartScore.risco.toString()} onValueChange={(v) => setHeartScore({...heartScore, risco: parseInt(v)})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 – Nenhum fator de risco</SelectItem>
                      <SelectItem value="1">1 – 1 ou 2 fatores de risco</SelectItem>
                      <SelectItem value="2">2 – ≥ 3 fatores de risco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* T */}
                <div className="md:col-span-2 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3">
                  <Label className="font-semibold text-yellow-900">T – Troponina (preencher manualmente)</Label>
                  <Select value={heartScore.troponina.toString()} onValueChange={(v) => setHeartScore({...heartScore, troponina: parseInt(v)})}>
                    <SelectTrigger className="mt-2"><SelectValue placeholder="Selecione o resultado da Troponina" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 – Normal (abaixo do limite)</SelectItem>
                      <SelectItem value="1">1 – Entre 1 a 3x o limite normal</SelectItem>
                      <SelectItem value="2">2 – Maior que 3x o limite normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Resultado */}
              <div className={`p-4 rounded-lg text-center border-2 ${
                heartTotal <= 3 ? 'bg-green-100 border-green-400 text-green-900' :
                heartTotal <= 6 ? 'bg-yellow-100 border-yellow-400 text-yellow-900' :
                'bg-red-100 border-red-400 text-red-900'
              }`}>
                <p className="text-3xl font-bold">TOTAL: {heartTotal} pontos</p>
                <p className="text-xl font-semibold mt-1">{getHeartInterpretacao(heartTotal)}</p>
                <p className="text-sm mt-2">
                  {heartTotal <= 3 && "✅ Alta hospitalar segura e acompanhamento ambulatorial."}
                  {heartTotal >= 4 && heartTotal <= 6 && "⚠️ Observação, monitoramento e exames seriados (troponina)."}
                  {heartTotal >= 7 && "🚨 Internação imediata e possível intervenção (cateterismo)."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 6. BOTÃO ENFERMEIRO */}
        {!enfermeiroFinalizado && (
          <Card className="mb-4 border-2 border-green-400 bg-green-50">
            <CardContent className="pt-6">
              <Button 
                onClick={gerarPreParecer}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6"
              >
                ✅ GERAR PRÉ-PARECER
              </Button>
            </CardContent>
          </Card>
        )}

        {/* PRÉ-PARECER GERADO */}
        {preParecer && (
          <Card className="mb-4 border-2 border-blue-400 bg-blue-50">
            <CardHeader className="bg-blue-100">
              <CardTitle className="text-blue-900">✅ PRÉ-PARECER (Enfermeiro)</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-xl font-bold text-blue-900">{preParecer}</p>
            </CardContent>
          </Card>
        )}

        {/* 7. SEÇÃO MÉDICO */}
        {enfermeiroFinalizado && (
          <Card className="mb-4 border-4 border-red-400 bg-red-50">
            <CardHeader className="bg-red-100">
              <CardTitle className="text-red-900">👨‍⚕️ AVALIAÇÃO DO CARDIOLOGISTA</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="confirma" 
                  checked={medicoData.confirma_triagem} 
                  onCheckedChange={(c) => setMedicoData({...medicoData, confirma_triagem: c})} 
                />
                <Label htmlFor="confirma" className="text-lg font-semibold">✓ Confirmo a triagem de enfermagem</Label>
              </div>

              <div className="space-y-2">
                <Label className="text-lg font-bold">DIAGNÓSTICO + ESTRATÉGIA:</Label>
                <RadioGroup value={medicoData.diagnostico_estrategia} onValueChange={(v) => setMedicoData({...medicoData, diagnostico_estrategia: v})}>
                  <div className="flex items-center space-x-2 bg-red-100 p-3 rounded">
                    <RadioGroupItem value="1" id="est1" />
                    <Label htmlFor="est1" className="text-base">☐ 1- IAM supra ST → "Estratégia 1: transferência imediata"</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-orange-100 p-3 rounded">
                    <RadioGroupItem value="2" id="est2" />
                    <Label htmlFor="est2" className="text-base">☐ 2- SCA sem supra MUITO alto risco → "Estratégia 1: transferência imediata"</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-yellow-100 p-3 rounded">
                    <RadioGroupItem value="3" id="est3" />
                    <Label htmlFor="est3" className="text-base">☐ 3- IAM sem supra/alto risco → "Estratégia 2: invasiva ≤24h"</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-green-100 p-3 rounded">
                    <RadioGroupItem value="4" id="est4" />
                    <Label htmlFor="est4" className="text-base">☐ 4- SCA intermediário → "Estratégia 3: invasiva ≤72h"</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-lg font-bold">Parecer do Cardiologista:</Label>
                <Textarea
                  value={medicoData.parecer_cardiologista}
                  onChange={(e) => setMedicoData({...medicoData, parecer_cardiologista: e.target.value})}
                  placeholder="Digite aqui o parecer detalhado do cardiologista..."
                  rows={6}
                  className="mt-2"
                />
              </div>

              <Button
                onClick={() => salvarLaudoMedico.mutate()}
                disabled={salvarLaudoMedico.isPending || !medicoData.confirma_triagem}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-6"
              >
                {salvarLaudoMedico.isPending ? "Salvando..." : "🏁 FINALIZAR LAUDO"}
              </Button>
            </CardContent>
          </Card>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}