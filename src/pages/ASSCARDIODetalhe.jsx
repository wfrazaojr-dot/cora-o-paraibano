import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { ArrowLeft, Heart, ChevronDown, ChevronUp, Calendar, FileDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import DadosPaciente from "@/components/regulacao/DadosPaciente";
import LinhaTempo from "@/components/regulacao/LinhaTempo";
import MonitorTransporte from "@/components/regulacao/MonitorTransporte";
import ChatInterno from "@/components/ChatInterno";
import RecomendacoesTrombolise from "@/components/asscardio/RecomendacoesTrombolise";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Converte array → string para salvar no banco
const arrayParaString = (arr) => {
  if (!arr || !Array.isArray(arr)) return "";
  return arr.join(",");
};

// Converte string → array ao carregar do banco
const stringParaArray = (str) => {
  if (!str || typeof str !== "string") return [];
  return str.split(",").filter(Boolean);
};

export default function ASSCARDIODetalhe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const pacienteId = urlParams.get("id");

  const { data: paciente, isLoading } = useQuery({
    queryKey: ["paciente", pacienteId],
    queryFn: () =>
      base44.entities.Paciente.list().then((list) => list.find((p) => p.id === pacienteId)),
    enabled: !!pacienteId,
    refetchInterval: 30000,
  });

  const [bloco1Open, setBloco1Open] = useState(true);
  const [bloco2Open, setBloco2Open] = useState(false);
  const [bloco3Open, setBloco3Open] = useState(false);

  const [ecgSupra, setEcgSupra] = useState({
    d2: false, d3: false, avf: false,
    reciproco_d1_avl: false, reciproco_v1_v3: false,
    v1: false, v2: false, v3: false, v4: false,
    reciproco_d2_d3_avf: false,
    d1: false, avl: false, v5: false, v6: false,
    t_hiperaguda: false, v7_v9: false, v3r_v4r: false,
    tem_supra: "nao",
    parede_supra: "",
  });

  const [ecgSemSupra, setEcgSemSupra] = useState({
    infra_st: false,
    t_invertida: false,
    q_nova: false,
    wellens: false,
    infra_difusa_avr: false,
    probabilidade: "baixa",
  });

  const [heartScore, setHeartScore] = useState({ historia: 0, ecg: 0, idade: 0, risco: 0, troponina: 0 });
  const [preParecer, setPreParecer] = useState("");
  const [enfermeiroFinalizado, setEnfermeiroFinalizado] = useState(false);
  const [medicoData, setMedicoData] = useState({
    confirma_triagem: false,
    diagnostico_estrategia: [], // array em memória
    parecer_cardiologista: "",
    cardiologista_nome: "",
    cardiologista_crm: "",
    cardiologista_rqe: "",
  });

  const [autoSaveStatus, setAutoSaveStatus] = useState("");
  const autoSaveTimer = useRef(null);
  const initialLoadDone = useRef(false);

  // Refs para evitar stale closures no auto-save
  const ecgSupraRef = useRef(ecgSupra);
  const ecgSemSupraRef = useRef(ecgSemSupra);
  const heartScoreRef = useRef(heartScore);
  const preParecerRef = useRef(preParecer);
  const medicoDataRef = useRef(medicoData);
  const pacienteRef = useRef(paciente);

  useEffect(() => { ecgSupraRef.current = ecgSupra; }, [ecgSupra]);
  useEffect(() => { ecgSemSupraRef.current = ecgSemSupra; }, [ecgSemSupra]);
  useEffect(() => { heartScoreRef.current = heartScore; }, [heartScore]);
  useEffect(() => { preParecerRef.current = preParecer; }, [preParecer]);
  useEffect(() => { medicoDataRef.current = medicoData; }, [medicoData]);
  useEffect(() => { pacienteRef.current = paciente; }, [paciente]);

  // Carregar dados salvos ao receber paciente — apenas UMA VEZ
  useEffect(() => {
    if (initialLoadDone.current) return;
    if (!paciente) return;
    initialLoadDone.current = true;

    const ass = paciente.assessoria_cardiologia;

    // Para Prioridade 2 (sem troponina), ativar seção do cardiologista automaticamente
    if (paciente.triagem_medica?.tipo_sca === "SCASESST_SEM_TROPONINA") {
      setEnfermeiroFinalizado(true);
      if (!ass?.pre_parecer) {
        setPreParecer("SCASESST SEM Troponina — Avaliação cardiológica necessária");
      }
    }

    if (!ass) return;

    if (ass.ecg_supra) setEcgSupra(ass.ecg_supra);
    if (ass.ecg_sem_supra) setEcgSemSupra(ass.ecg_sem_supra);
    if (ass.heart_score) {
      setHeartScore({
        historia: ass.heart_score.historia || 0,
        ecg: ass.heart_score.ecg || 0,
        idade: ass.heart_score.idade || 0,
        risco: ass.heart_score.risco || 0,
        troponina: ass.heart_score.troponina || 0,
      });
    }
    if (ass.pre_parecer) {
      setPreParecer(ass.pre_parecer);
      setEnfermeiroFinalizado(true);
    }

    setMedicoData({
      confirma_triagem: ass.confirma_triagem || false,
      diagnostico_estrategia: stringParaArray(ass.diagnostico_estrategia),
      parecer_cardiologista: ass.parecer_cardiologista || "",
      cardiologista_nome: ass.cardiologista_nome || "",
      cardiologista_crm: ass.cardiologista_crm || "",
      cardiologista_rqe: ass.cardiologista_rqe || "",
    });
  }, [paciente]);

  // Pré-preencher HEART Score da triagem (só se não houver rascunho salvo)
  useEffect(() => {
    if (paciente?.assessoria_cardiologia?.heart_score) return;
    if (!paciente) return;
    const triagem = paciente?.triagem_medica || {};
    let historia = 0;
    if (triagem.historia_clinica?.includes("Altamente suspeita")) historia = 2;
    else if (triagem.historia_clinica?.includes("Moderadamente")) historia = 1;
    let ecg = 0;
    if (triagem.ecg_classificacao?.includes("Depressão significativa")) ecg = 2;
    else if (triagem.ecg_classificacao?.includes("inespecífica")) ecg = 1;
    const idade = paciente?.idade || 0;
    let pontoIdade = idade >= 65 ? 2 : idade >= 45 ? 1 : 0;
    const qtdFatores = (triagem.fatores_risco || []).length;
    let risco = qtdFatores >= 3 ? 2 : qtdFatores >= 1 ? 1 : 0;
    setHeartScore((prev) => ({ ...prev, historia, ecg, idade: pontoIdade, risco }));
  }, [paciente?.id]);

  // ─── Auto-save a cada 4 segundos de inatividade ───────────────────────────
  const salvarRascunhoAuto = useCallback(async () => {
    if (!pacienteId) return;
    const es = ecgSupraRef.current;
    const ess = ecgSemSupraRef.current;
    const hs = heartScoreRef.current;
    const pp = preParecerRef.current;
    const md = medicoDataRef.current;
    const total = hs.historia + hs.ecg + hs.idade + hs.risco + hs.troponina;

    setAutoSaveStatus("Salvando...");
    try {
      await base44.entities.Paciente.update(pacienteId, {
        assessoria_cardiologia: {
          ecg_supra: es,
          ecg_sem_supra: ess,
          heart_score: { ...hs, total },
          pre_parecer: pp,
          diagnostico_estrategia: arrayParaString(md.diagnostico_estrategia),
          parecer_cardiologista: md.parecer_cardiologista,
          cardiologista_nome: md.cardiologista_nome,
          cardiologista_crm: md.cardiologista_crm,
          cardiologista_rqe: md.cardiologista_rqe,
          confirma_triagem: md.confirma_triagem,
          _rascunho: true,
        },
      });
      setAutoSaveStatus("✓ Rascunho salvo");
      setTimeout(() => setAutoSaveStatus(""), 3000);
    } catch (e) {
      setAutoSaveStatus("Erro auto-save: " + e.message);
    }
  }, [pacienteId]);

  // ─── Handler para confirma_triagem com save imediato ────────────────────────
  const handleConfirmaTriagem = useCallback((checked) => {
    const newMedicoData = { ...medicoDataRef.current, confirma_triagem: checked };
    setMedicoData(newMedicoData);
    medicoDataRef.current = newMedicoData;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(salvarRascunhoAuto, 100);
  }, [salvarRascunhoAuto]);

  useEffect(() => {
    if (!pacienteId) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(salvarRascunhoAuto, 4000);
    return () => clearTimeout(autoSaveTimer.current);
  }, [ecgSupra, ecgSemSupra, heartScore, preParecer, medicoData, salvarRascunhoAuto]);

  // ─── Cálculos ────────────────────────────────────────────────────────────
  const calcularHeartTotal = () =>
    heartScore.historia + heartScore.ecg + heartScore.idade + heartScore.risco + heartScore.troponina;

  const getHeartInterpretacao = (total) => {
    if (total <= 3) return "Baixo (0-3)";
    if (total <= 6) return "Intermediário (4-6)";
    return "Alto (7-10)";
  };

  const gerarPreParecer = () => {
    const total = calcularHeartTotal();
    let parecer = "";
    if (ecgSupra.tem_supra === "sim") {
      parecer = `IAM SUPRA parede ${ecgSupra.parede_supra || "não definida"} - AVALIAÇÃO IMEDIATA`;
    } else if (total >= 7) {
      parecer = `SCA SEM SUPRA alto risco (HEART ${total}) - URGENTE`;
    } else if (total >= 4) {
      parecer = `SCA risco intermediário (HEART ${total})`;
    } else {
      parecer = `ECG/clínica baixa probabilidade (HEART ${total})`;
    }
    setPreParecer(parecer);
    setEnfermeiroFinalizado(true);
  };

  // ─── Geração de PDF ───────────────────────────────────────────────────────
  const urlParaBase64 = (url) =>
    fetch(url)
      .then((r) => r.blob())
      .then(
        (blob) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          })
      )
      .catch(() => null);

  const gerarPDF = async (pac, es, ess, hs, pp, md) => {
    const pdf = new jsPDF("p", "mm", "a4");
    const W = 210;
    const margin = 15;
    const maxW = W - margin * 2;
    let y = 15;

    // Carregar logos
    const [logoGov, logoCoracao, logoComplexo] = await Promise.all([
      urlParaBase64("https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/8e093c8da_logoSecretariadeEstadodaSade.png"),
      urlParaBase64("https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/fa5f3a17e_LOGOCORAAOPARAIBANO.png"),
      urlParaBase64("https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/873a4a563_logo.png"),
    ]);

    // Inserir logos no cabeçalho
    const logoH = 18;
    if (logoGov) pdf.addImage(logoGov, "PNG", margin, y, 40, logoH);
    if (logoCoracao) pdf.addImage(logoCoracao, "PNG", W / 2 - 22, y, 44, logoH);
    if (logoComplexo) pdf.addImage(logoComplexo, "PNG", W - margin - 40, y, 40, logoH);
    y += logoH + 5;

    const ln = (text, size = 10, bold = false, color = [0, 0, 0]) => {
      pdf.setFontSize(size);
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setTextColor(...color);
      const lines = pdf.splitTextToSize(String(text || ""), maxW);
      lines.forEach((line) => {
        if (y > 275) { pdf.addPage(); y = 15; }
        pdf.text(line, margin, y);
        y += size * 0.45;
      });
      y += 2;
    };

    const divisor = () => {
      if (y > 275) { pdf.addPage(); y = 15; }
      pdf.setDrawColor(180, 180, 180);
      pdf.line(margin, y, W - margin, y);
      y += 4;
    };

    ln("RELATÓRIO DE ASSESSORIA CARDIOLÓGICA - ASSCARDIO", 14, true, [180, 0, 0]);
    ln("Programa Coração Paraibano", 10, false, [80, 80, 80]);
    ln(`Data/Hora: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 9, false, [80, 80, 80]);
    divisor();

    ln("DADOS DO PACIENTE", 11, true);
    ln(`Nome: ${pac?.nome_completo || "-"}`);
    ln(`Idade: ${pac?.idade || "-"} anos  |  Sexo: ${pac?.sexo || "-"}`);
    ln(`Unidade de Saúde: ${pac?.unidade_saude || "-"}`);
    ln(`Macrorregião: ${pac?.macrorregiao || "-"}`);
    divisor();

    if (pac?.triagem_medica) {
      const tm = pac.triagem_medica;
      ln("SINAIS VITAIS", 11, true);
      if (tm.pa_braco_esquerdo) ln(`PA: ${tm.pa_braco_esquerdo} mmHg`);
      if (tm.frequencia_cardiaca) ln(`FC: ${tm.frequencia_cardiaca} bpm  |  FR: ${tm.frequencia_respiratoria || "-"} irpm`);
      if (tm.spo2) ln(`SpO2: ${tm.spo2}%  |  Temp: ${tm.temperatura || "-"} °C`);
      if (tm.glicemia_capilar) ln(`Glicemia: ${tm.glicemia_capilar} mg/dL`);
      divisor();
    }

    if (pp) {
      ln("AVALIAÇÃO DE ENFERMAGEM (PRÉ-PARECER)", 11, true);
      ln(pp, 10, true, [0, 0, 180]);
      divisor();
    }

    ln("ECG", 11, true);
    ln(`Supra de ST: ${es.tem_supra === "sim" ? "SIM" : "NÃO"}`);
    if (es.tem_supra === "sim" && es.parede_supra) ln(`Parede: ${es.parede_supra}`);
    const derivs = ["d2","d3","avf","v1","v2","v3","v4","v5","v6","d1","avl","t_hiperaguda","v7_v9","v3r_v4r"]
      .filter((k) => es[k]).map((k) => k.toUpperCase().replace("_", "-"));
    if (derivs.length > 0) ln(`Derivações: ${derivs.join(", ")}`);
    if (es.tem_supra === "nao") {
      const alts = [
        ess.infra_st && "Infra ST ≥0.5mm",
        ess.t_invertida && "Onda T invertida",
        ess.q_nova && "Onda Q nova",
        ess.wellens && "Síndrome de Wellens",
        ess.infra_difusa_avr && "Infra difusa + supra aVR",
      ].filter(Boolean);
      if (alts.length > 0) ln(`Alterações: ${alts.join(", ")}`);
      ln(`Probabilidade: ${ess.probabilidade || "não definida"}`);
    }
    divisor();

    if (es.tem_supra !== "sim") {
      const total = hs.historia + hs.ecg + hs.idade + hs.risco + hs.troponina;
      const interp = total <= 3 ? "Baixo risco" : total <= 6 ? "Risco intermediário" : "Alto risco";
      ln("HEART SCORE", 11, true);
      ln(`H: ${hs.historia}  E: ${hs.ecg}  A: ${hs.idade}  R: ${hs.risco}  T: ${hs.troponina}`);
      ln(`TOTAL: ${total} pontos — ${interp}`, 11, true);
      divisor();
    }

    ln("AVALIAÇÃO DO CARDIOLOGISTA", 11, true);
    if (md.cardiologista_nome) {
      ln(`Dr(a). ${md.cardiologista_nome}`);
      ln(`CRM: ${md.cardiologista_crm}${md.cardiologista_rqe ? " | RQE: " + md.cardiologista_rqe : ""}`);
    }
    ln(`Triagem confirmada: ${md.confirma_triagem ? "Sim" : "Não"}`);

    const estrategiasMap = {
      "1": "1- IAM supra ST → Estratégia 1: transferência imediata",
      "2": "2- SCA sem supra MUITO alto risco → Estratégia 1",
      "3": "3- IAM sem supra/alto risco → Estratégia 2: Invasiva Precoce",
      "4": "4- SCA intermediário → Estratégia 3: Invasiva no Internamento",
      "5": "5- Orientação Cardiológica",
      "6": "6- Trombólise + ICP 2-24h",
    };

    const estratArr = Array.isArray(md.diagnostico_estrategia)
      ? md.diagnostico_estrategia
      : stringParaArray(md.diagnostico_estrategia);

    if (estratArr.length > 0) {
      ln("Diagnóstico + Estratégia:", 10, true);
      estratArr.forEach((k) => ln(`  • ${estrategiasMap[k] || k}`));
    }

    if (md.parecer_cardiologista) {
      y += 2;
      ln("PARECER DO CARDIOLOGISTA:", 10, true);
      ln(md.parecer_cardiologista);
    }
    divisor();

    ln("Sistema de Triagem de Dor Torácica — Coração Paraibano", 8, false, [120, 120, 120]);
    ln("Desenvolvedor: Walber Alves Frazão Júnior — COREN 110.238", 8, false, [120, 120, 120]);
    ln(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}`, 8, false, [120, 120, 120]);

    return pdf;
  };

  // ─── Finalizar Laudo (gera PDF + download + upload + salva) ──────────────
  const salvarLaudoMedico = useMutation({
    mutationFn: async () => {
      const total = calcularHeartTotal();
      const pac = pacienteRef.current;

      // 1. Gerar PDF
      const pdf = await gerarPDF(pac, ecgSupra, ecgSemSupra, heartScore, preParecer, medicoData);
      const nomePaciente = (pac?.nome_completo || "Paciente").replace(/\s+/g, "_");
      const nomeArquivo = `Parecer_ASSCARDIO_${nomePaciente}_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`;

      // 2. Download automático para o dispositivo
      pdf.save(nomeArquivo);

      // 3. Upload para nuvem
      const pdfBlob = pdf.output("blob");
      const pdfFile = new File([pdfBlob], nomeArquivo, { type: "application/pdf" });
      const uploadResult = await base44.integrations.Core.UploadFile({ file: pdfFile });
      const fileUrl = uploadResult.file_url;

      // 4. Salvar no banco
      const updateData = {
        assessoria_cardiologia: {
          data_hora: new Date().toISOString(),
          ecg_supra: ecgSupra,
          ecg_sem_supra: ecgSemSupra,
          heart_score: { ...heartScore, total, interpretacao: getHeartInterpretacao(total) },
          pre_parecer: preParecer,
          diagnostico_estrategia: arrayParaString(medicoData.diagnostico_estrategia),
          parecer_cardiologista: medicoData.parecer_cardiologista,
          cardiologista_nome: medicoData.cardiologista_nome,
          cardiologista_crm: medicoData.cardiologista_crm,
          cardiologista_rqe: medicoData.cardiologista_rqe,
          confirma_triagem: medicoData.confirma_triagem,
        },
        relatorio_asscardio_url: fileUrl,
        status: "Aguardando Regulação",
      };

      if (medicoData.diagnostico_estrategia.includes("6")) {
        updateData.hemodinamica = { ...(pac?.hemodinamica || {}), tipo_icp: "trombolise_icp" };
      }

      await base44.entities.Paciente.update(pacienteId, updateData);
      return fileUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["paciente", pacienteId]);
      navigate(createPageUrl("Dashboard"));
    },
    onError: (error) => {
      setAutoSaveStatus("Erro ao finalizar laudo: " + error.message);
    },
  });

  if (isLoading) return <div className="p-8">Carregando...</div>;
  if (!paciente) return <div className="p-8">Paciente não encontrado</div>;

  const heartTotal = calcularHeartTotal();
  const confirmaTriagemValida = medicoData.confirma_triagem;

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 to-green-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Button variant="outline" onClick={() => navigate(createPageUrl("Dashboard"))}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-blue-900 flex items-center gap-2">
              <Heart className="w-8 h-8 text-red-600" />
              TRIAGEM ECG - ASSCARDIO
            </h1>
            <p className="text-blue-700">Enfermeiro + Cardiologista</p>
          </div>
          {paciente.triagem_medica?.tipo_sca === "SCACESST" && (
            <Badge className="bg-red-600 text-white">🔴 PRIORIDADE 0 - SCACESST</Badge>
          )}
          {paciente.triagem_medica?.tipo_sca === "SCASESST_COM_TROPONINA" && (
            <Badge className="bg-orange-500 text-white">🟠 PRIORIDADE 1 - SCASESST c/ Troponina</Badge>
          )}
          {paciente.triagem_medica?.tipo_sca === "SCASESST_SEM_TROPONINA" && (
            <Badge className="bg-yellow-500 text-white">🟡 PRIORIDADE 2 - SCASESST s/ Troponina</Badge>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda */}
          <div className="lg:col-span-1 space-y-6">
            <DadosPaciente paciente={paciente} />
            <MonitorTransporte paciente={paciente} />
            <LinhaTempo paciente={paciente} />
            <ChatInterno pacienteId={pacienteId} />
          </div>

          {/* Coluna Direita */}
          <div className="lg:col-span-2 space-y-4">

            {/* Relatório já gerado */}
            {paciente.relatorio_asscardio_url && (
              <Card className="border-2 border-red-300 bg-red-50">
                <CardHeader className="bg-red-100 pb-2">
                  <CardTitle className="text-red-800">📄 Relatório ASSCARDIO Gerado</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <Button
                    onClick={async () => {
                      const resp = await fetch(paciente.relatorio_asscardio_url);
                      const blob = await resp.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `Parecer_ASSCARDIO_${(paciente.nome_completo || "Paciente").replace(/\s+/g, "_")}.pdf`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    BAIXAR PDF DO PARECER CARDIOLÓGICO
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Agendamento ICP */}
            {paciente.hemodinamica?.data_hora_agendamento_icp && (
              <Card className="border-blue-300 bg-blue-50">
                <CardHeader className="bg-blue-100 pb-2">
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Calendar className="w-5 h-5" />
                    Agendamento de ICP
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 mt-2">
                  <div className="bg-white p-3 rounded-lg border-2 border-blue-200">
                    <p className="text-sm font-semibold text-blue-900">Data e Hora Agendada:</p>
                    <p className="text-lg font-bold text-blue-600">
                      {format(new Date(paciente.hemodinamica.data_hora_agendamento_icp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {paciente.hemodinamica?.tipo_icp && (
                    <Badge>
                      {paciente.hemodinamica.tipo_icp === "imediata" && "Imediata"}
                      {paciente.hemodinamica.tipo_icp === "ate_24h" && "Estratégia Invasiva Precoce"}
                      {paciente.hemodinamica.tipo_icp === "ate_72h" && "Estratégia Invasiva no Internamento"}
                      {paciente.hemodinamica.tipo_icp === "trombolise_icp" && "Trombólise e ICP 2-24h"}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Status auto-save */}
            {autoSaveStatus && (
              <div className={`text-sm text-right italic py-1 font-medium ${autoSaveStatus.startsWith("Erro") ? "text-red-600" : "text-blue-700"}`}>
                {autoSaveStatus}
              </div>
            )}

            {/* DECISÃO: SUPRA ST? */}
            <Card className="border-2 border-yellow-400 bg-yellow-50">
              <CardHeader className="bg-yellow-100 pb-2">
                <CardTitle className="text-yellow-900">📋 RELATO MÉDICO DE SUPRA ST?</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <RadioGroup
                  value={ecgSupra.tem_supra}
                  onValueChange={(v) => setEcgSupra({ ...ecgSupra, tem_supra: v })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="supra_sim" />
                    <Label htmlFor="supra_sim" className="text-lg font-semibold">SIM</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="supra_nao" />
                    <Label htmlFor="supra_nao" className="text-lg font-semibold">NÃO</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* BLOCO 1 - ECG SUPRA */}
            {ecgSupra.tem_supra === "sim" && (
              <Collapsible open={bloco1Open} onOpenChange={setBloco1Open}>
                <Card className="border-2 border-blue-200">
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="bg-blue-100 cursor-pointer hover:bg-blue-200 transition-colors pb-3">
                      <CardTitle className="text-blue-900 flex items-center justify-between">
                        <span>🔍 BLOCO 1 - ACHADOS DO ECG (SUPRA ST)</span>
                        {bloco1Open ? <ChevronUp /> : <ChevronDown />}
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-4 space-y-4">
                      <div className="border-l-4 border-red-500 pl-4">
                        <h4 className="font-bold text-red-700 mb-2">Parede Inferior:</h4>
                        <div className="grid md:grid-cols-3 gap-3">
                          {[["d2","D2"],["d3","D3"],["avf","aVF"]].map(([k,l]) => (
                            <div key={k} className="flex items-center space-x-2">
                              <Checkbox id={k} checked={ecgSupra[k]} onCheckedChange={(c) => setEcgSupra({...ecgSupra,[k]:c})} />
                              <Label htmlFor={k} className="text-lg">{l}</Label>
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">Recíprocos:</p>
                        <div className="grid md:grid-cols-2 gap-3 mt-1">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="rec_d1_avl" checked={ecgSupra.reciproco_d1_avl} onCheckedChange={(c) => setEcgSupra({...ecgSupra,reciproco_d1_avl:c})} />
                            <Label htmlFor="rec_d1_avl">D1/aVL</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="rec_v1_v3" checked={ecgSupra.reciproco_v1_v3} onCheckedChange={(c) => setEcgSupra({...ecgSupra,reciproco_v1_v3:c})} />
                            <Label htmlFor="rec_v1_v3">V1-V3</Label>
                          </div>
                        </div>
                      </div>
                      <div className="border-l-4 border-orange-500 pl-4">
                        <h4 className="font-bold text-orange-700 mb-2">Parede Anterior:</h4>
                        <div className="grid md:grid-cols-4 gap-3">
                          {[["v1","V1"],["v2","V2"],["v3","V3"],["v4","V4"]].map(([k,l]) => (
                            <div key={k} className="flex items-center space-x-2">
                              <Checkbox id={k} checked={ecgSupra[k]} onCheckedChange={(c) => setEcgSupra({...ecgSupra,[k]:c})} />
                              <Label htmlFor={k} className="text-lg">{l}</Label>
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">Recíprocos:</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Checkbox id="rec_d2_d3_avf" checked={ecgSupra.reciproco_d2_d3_avf} onCheckedChange={(c) => setEcgSupra({...ecgSupra,reciproco_d2_d3_avf:c})} />
                          <Label htmlFor="rec_d2_d3_avf">D2/D3/aVF</Label>
                        </div>
                      </div>
                      <div className="border-l-4 border-green-500 pl-4">
                        <h4 className="font-bold text-green-700 mb-2">Parede Lateral:</h4>
                        <div className="grid md:grid-cols-4 gap-3">
                          {[["d1","D1"],["avl","aVL"],["v5","V5"],["v6","V6"]].map(([k,l]) => (
                            <div key={k} className="flex items-center space-x-2">
                              <Checkbox id={k} checked={ecgSupra[k]} onCheckedChange={(c) => setEcgSupra({...ecgSupra,[k]:c})} />
                              <Label htmlFor={k} className="text-lg">{l}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="border-l-4 border-purple-500 pl-4">
                        <h4 className="font-bold text-purple-700 mb-2">Outros:</h4>
                        <div className="grid md:grid-cols-3 gap-3">
                          {[["t_hiperaguda","T hiperaguda"],["v7_v9","V7-V9"],["v3r_v4r","V3R/V4R"]].map(([k,l]) => (
                            <div key={k} className="flex items-center space-x-2">
                              <Checkbox id={k} checked={ecgSupra[k]} onCheckedChange={(c) => setEcgSupra({...ecgSupra,[k]:c})} />
                              <Label htmlFor={k}>{l}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}

            {/* BLOCO 2 - SEM SUPRA COM TROPONINA */}
            {ecgSupra.tem_supra === "nao" && (
              <Collapsible open={bloco2Open} onOpenChange={setBloco2Open}>
                <Card className="border-2 border-orange-200">
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="bg-orange-100 cursor-pointer hover:bg-orange-200 transition-colors pb-3">
                      <CardTitle className="text-orange-900 flex items-center justify-between">
                        <span>🔍 BLOCO 2 - SEM SUPRA COM TROPONINA QUANTITATIVA</span>
                        {bloco2Open ? <ChevronUp /> : <ChevronDown />}
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-4">
                      {paciente?.avaliacao_clinica?.heart_score?.total != null ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-blue-900">
                              {paciente.avaliacao_clinica.heart_score.total} pontos
                            </span>
                            <Badge className={
                              paciente.avaliacao_clinica.heart_score.total <= 3
                                ? "bg-green-100 text-green-800"
                                : paciente.avaliacao_clinica.heart_score.total <= 6
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }>
                              {getHeartInterpretacao(paciente.avaliacao_clinica.heart_score.total)}
                            </Badge>
                          </div>
                          {paciente.avaliacao_clinica.heart_score.interpretacao && (
                            <div className={`p-3 rounded text-sm font-medium ${
                              paciente.avaliacao_clinica.heart_score.total <= 3
                                ? "bg-green-50 border border-green-300 text-green-900"
                                : paciente.avaliacao_clinica.heart_score.total <= 6
                                ? "bg-yellow-50 border border-yellow-300 text-yellow-900"
                                : "bg-red-50 border border-red-300 text-red-900"
                            }`}>
                              {paciente.avaliacao_clinica.heart_score.interpretacao}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">Aguardando cálculo na Avaliação Clínica com Troponina.</p>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}

            {/* BLOCO 3 - SEM SUPRA SEM TROPONINA */}
            {ecgSupra.tem_supra === "nao" && (
              <Collapsible open={bloco3Open} onOpenChange={setBloco3Open}>
                <Card className="border-2 border-purple-200">
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="bg-purple-100 cursor-pointer hover:bg-purple-200 transition-colors pb-3">
                      <CardTitle className="text-purple-900 flex items-center justify-between">
                        <span>🔍 BLOCO 3 - SEM SUPRA SEM TROPONINA QUANTITATIVA</span>
                        {bloco3Open ? <ChevronUp /> : <ChevronDown />}
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-4">
                      {paciente?.avaliacao_clinica?.historia_clinica ||
                       paciente?.avaliacao_clinica?.ecg_classificacao ||
                       paciente?.avaliacao_clinica?.faixa_etaria ||
                       (paciente?.avaliacao_clinica?.fatores_risco?.length > 0) ? (
                        <div className="space-y-3">
                          {paciente.avaliacao_clinica.historia_clinica && (
                            <div className="bg-white border border-purple-200 rounded-lg p-3">
                              <Label className="text-sm font-bold text-purple-900 block mb-1">HISTÓRIA CLÍNICA</Label>
                              <p className="text-purple-800">{paciente.avaliacao_clinica.historia_clinica}</p>
                            </div>
                          )}
                          {paciente.avaliacao_clinica.ecg_classificacao && (
                            <div className="bg-white border border-purple-200 rounded-lg p-3">
                              <Label className="text-sm font-bold text-purple-900 block mb-1">ECG</Label>
                              <p className="text-purple-800">{paciente.avaliacao_clinica.ecg_classificacao}</p>
                            </div>
                          )}
                          {paciente.avaliacao_clinica.faixa_etaria && (
                            <div className="bg-white border border-purple-200 rounded-lg p-3">
                              <Label className="text-sm font-bold text-purple-900 block mb-1">IDADE</Label>
                              <p className="text-purple-800">{paciente.avaliacao_clinica.faixa_etaria}</p>
                            </div>
                          )}
                          {paciente.avaliacao_clinica.fatores_risco?.length > 0 && (
                            <div className="bg-white border border-purple-200 rounded-lg p-3">
                              <Label className="text-sm font-bold text-purple-900 block mb-2">FATORES DE RISCO</Label>
                              <ul className="space-y-1">
                                {paciente.avaliacao_clinica.fatores_risco.map((f, i) => (
                                  <li key={i} className="text-purple-800 text-sm">• {f}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">Aguardando preenchimento na Avaliação Clínica - SCASESST SEM Troponina.</p>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}

            {/* BOTÃO GERAR PRÉ-PARECER */}
            {!enfermeiroFinalizado && (
              <Card className="border-2 border-green-400 bg-green-50">
                <CardContent className="pt-6">
                  <Button
                    onClick={gerarPreParecer}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6"
                  >
                    ✅ GERAR PARECER DE CARDIOLOGIA
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* PRÉ-PARECER GERADO */}
            {preParecer && (
              <Card className="border-2 border-blue-400 bg-blue-50">
                <CardHeader className="bg-blue-100 pb-2">
                  <CardTitle className="text-blue-900">✅ PRÉ-PARECER (Enfermeiro)</CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <p className="text-xl font-bold text-blue-900">{preParecer}</p>
                </CardContent>
              </Card>
            )}

            {/* SEÇÃO DO CARDIOLOGISTA */}
            {enfermeiroFinalizado && (
              <Card className="border-4 border-red-400 bg-red-50">
                <CardHeader className="bg-red-100 pb-2">
                  <CardTitle className="text-red-900">👨‍⚕️ AVALIAÇÃO DO CARDIOLOGISTA</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="confirma"
                      checked={medicoData.confirma_triagem}
                      onCheckedChange={handleConfirmaTriagem}
                    />
                    <Label htmlFor="confirma" className="text-lg font-semibold">
                      ✓ Confirmo a triagem de enfermagem
                    </Label>
                  </div>

                  {ecgSupra.tem_supra === "sim" && (
                    <div className="space-y-1">
                      <Label className="font-semibold">Parede:</Label>
                      <Select
                        value={ecgSupra.parede_supra}
                        onValueChange={(v) => setEcgSupra({ ...ecgSupra, parede_supra: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a parede" />
                        </SelectTrigger>
                        <SelectContent>
                          {["Inferior","Anterior","Parede anterosseptal","Parede anterior localizada","Parede anterolateral","Parede anterior extensa","Lateral","Parede lateral alta","Parede lateral baixa","VD"].map((op) => (
                            <SelectItem key={op} value={op}>{op}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-lg font-bold">DIAGNÓSTICO + ESTRATÉGIA:</Label>
                    {[
                      { value: "1", label: "1- IAM supra ST → Estratégia 1: transferência imediata", bg: "bg-red-100" },
                      { value: "2", label: "2- SCA sem supra MUITO alto risco → Estratégia 1: transferência imediata", bg: "bg-orange-100" },
                      { value: "3", label: "3- IAM sem supra/alto risco → Estratégia 2: Invasiva Precoce", bg: "bg-yellow-100" },
                      { value: "4", label: "4- SCA intermediário → Estratégia 3: Invasiva no Internamento", bg: "bg-green-100" },
                      { value: "5", label: "5- Orientação Cardiológica", bg: "bg-blue-100" },
                      { value: "6", label: "6- Trombólise + ICP 2-24h", bg: "bg-purple-100" },
                    ].map(({ value, label, bg }) => (
                      <div key={value} className={`flex items-center space-x-2 ${bg} p-3 rounded`}>
                        <Checkbox
                          id={`est${value}`}
                          checked={medicoData.diagnostico_estrategia.includes(value)}
                          onCheckedChange={(checked) => {
                            const current = medicoData.diagnostico_estrategia;
                            const updated = checked
                              ? [...current, value]
                              : current.filter((v) => v !== value);
                            setMedicoData({ ...medicoData, diagnostico_estrategia: updated });
                          }}
                        />
                        <Label htmlFor={`est${value}`} className="text-base cursor-pointer">{label}</Label>
                      </div>
                    ))}
                    {medicoData.diagnostico_estrategia.includes("6") && <RecomendacoesTrombolise />}
                  </div>

                  <div>
                    <Label className="text-lg font-bold">Parecer do Cardiologista:</Label>
                    <Textarea
                      value={medicoData.parecer_cardiologista}
                      onChange={(e) => setMedicoData({ ...medicoData, parecer_cardiologista: e.target.value })}
                      placeholder="Digite aqui o parecer detalhado do cardiologista..."
                      rows={6}
                      className="mt-2"
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <Label className="font-bold">Médico Cardiologista *</Label>
                      <Input
                        value={medicoData.cardiologista_nome}
                        onChange={(e) => setMedicoData({ ...medicoData, cardiologista_nome: e.target.value })}
                        placeholder="Nome completo"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="font-bold">CRM *</Label>
                      <Input
                        value={medicoData.cardiologista_crm}
                        onChange={(e) => setMedicoData({ ...medicoData, cardiologista_crm: e.target.value })}
                        placeholder="Nº do CRM"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="font-bold">RQE</Label>
                      <Input
                        value={medicoData.cardiologista_rqe}
                        onChange={(e) => setMedicoData({ ...medicoData, cardiologista_rqe: e.target.value })}
                        placeholder="Nº do RQE"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <Button
                      onClick={() => salvarLaudoMedico.mutate()}
                      disabled={salvarLaudoMedico.isPending || !confirmaTriagemValida}
                      className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-6"
                    >
                      <FileDown className="w-5 h-5 mr-2" />
                      {salvarLaudoMedico.isPending
                        ? "Gerando PDF e salvando..."
                        : "🏁 FINALIZAR LAUDO (Download PDF + Enviar ao CERH)"}
                    </Button>

                    {!confirmaTriagemValida && (
                      <p className="text-sm text-red-600 text-center">
                        ⚠️ Marque "Confirmo a triagem de enfermagem" para finalizar o laudo.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}