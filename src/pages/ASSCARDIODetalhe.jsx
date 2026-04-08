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
import { ArrowLeft, Heart, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import DadosPaciente from "@/components/regulacao/DadosPaciente";
import LinhaTempo from "@/components/regulacao/LinhaTempo";
import MonitorTransporte from "@/components/regulacao/MonitorTransporte";
import ChatInterno from "@/components/ChatInterno";
import RecomendacoesTrombolise from "@/components/asscardio/RecomendacoesTrombolise";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ASSCARDIODetalhe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const pacienteId = urlParams.get('id');

  const { data: paciente, isLoading } = useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: () => base44.entities.Paciente.list().then(list => list.find(p => p.id === pacienteId)),
    enabled: !!pacienteId
  });

  const [bloco0Open, setBloco0Open] = useState(true);
  const [bloco1Open, setBloco1Open] = useState(true);
  const [bloco2Open, setBloco2Open] = useState(false);
  const [bloco3Open, setBloco3Open] = useState(false);

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
    diagnostico_estrategia: [],
    parecer_cardiologista: "",
    cardiologista_nome: "",
    cardiologista_crm: "",
    cardiologista_rqe: ""
  });

  // Carregar dados salvos da assessoria cardiológica
  useEffect(() => {
    if (!paciente?.assessoria_cardiologia) return;

    const ass = paciente.assessoria_cardiologia;

    // Carregar dados clínicos
    if (ass.clinica) {
      setClinica(ass.clinica);
    }

    // Carregar dados ECG Supra
    if (ass.ecg_supra) {
      setEcgSupra(ass.ecg_supra);
    }

    // Carregar dados ECG Sem Supra
    if (ass.ecg_sem_supra) {
      setEcgSemSupra(ass.ecg_sem_supra);
    }

    // Carregar HEART Score
    if (ass.heart_score) {
      setHeartScore({
        historia: ass.heart_score.historia || 0,
        ecg: ass.heart_score.ecg || 0,
        idade: ass.heart_score.idade || 0,
        risco: ass.heart_score.risco || 0,
        troponina: ass.heart_score.troponina || 0
      });
    }

    // Carregar pré-parecer
    if (ass.pre_parecer) {
      setPreParecer(ass.pre_parecer);
      setEnfermeiroFinalizado(true);
    }

    // Carregar dados do médico (inclui confirma_triagem mesmo sem nome/parecer)
    if (ass.cardiologista_nome || ass.parecer_cardiologista || ass.diagnostico_estrategia || ass.confirma_triagem) {
      setMedicoData({
        confirma_triagem: ass.confirma_triagem || false,
        diagnostico_estrategia: ass.diagnostico_estrategia ? ass.diagnostico_estrategia.split(",").filter(Boolean) : [],
        parecer_cardiologista: ass.parecer_cardiologista || "",
        cardiologista_nome: ass.cardiologista_nome || "",
        cardiologista_crm: ass.cardiologista_crm || "",
        cardiologista_rqe: ass.cardiologista_rqe || ""
      });
    }
  }, [paciente]);

  // Auto-save
  const rascunhoKey = pacienteId ? `asscardio_rascunho_${pacienteId}` : null;
  const [autoSaveStatus, setAutoSaveStatus] = useState("");
  const autoSaveTimer = useRef(null);

  // Refs para acessar valores mais recentes no callback de auto-save sem re-criar o callback
  const clinicaRef = useRef(clinica);
  const ecgSupraRef = useRef(ecgSupra);
  const ecgSemSupraRef = useRef(ecgSemSupra);
  const heartScoreRef = useRef(heartScore);
  const preParecerRef = useRef(preParecer);
  const medicoDataRef = useRef(medicoData);

  useEffect(() => { clinicaRef.current = clinica; }, [clinica]);
  useEffect(() => { ecgSupraRef.current = ecgSupra; }, [ecgSupra]);
  useEffect(() => { ecgSemSupraRef.current = ecgSemSupra; }, [ecgSemSupra]);
  useEffect(() => { heartScoreRef.current = heartScore; }, [heartScore]);
  useEffect(() => { preParecerRef.current = preParecer; }, [preParecer]);
  useEffect(() => { medicoDataRef.current = medicoData; }, [medicoData]);

  const salvarRascunhoAuto = useCallback(async () => {
    if (!pacienteId) return;
    const cl = clinicaRef.current;
    const es = ecgSupraRef.current;
    const ess = ecgSemSupraRef.current;
    const hs = heartScoreRef.current;
    const pp = preParecerRef.current;
    const md = medicoDataRef.current;
    try {
      setAutoSaveStatus("Salvando...");
      const total = hs.historia + hs.ecg + hs.idade + hs.risco + hs.troponina;
      await base44.entities.Paciente.update(pacienteId, {
        assessoria_cardiologia: {
          clinica: cl,
          ecg_supra: es,
          ecg_sem_supra: ess,
          heart_score: { ...hs, total },
          pre_parecer: pp,
          diagnostico_estrategia: md.diagnostico_estrategia.join(","),
          parecer_cardiologista: md.parecer_cardiologista,
          cardiologista_nome: md.cardiologista_nome,
          cardiologista_crm: md.cardiologista_crm,
          cardiologista_rqe: md.cardiologista_rqe,
          confirma_triagem: md.confirma_triagem,
          _rascunho: true
        }
      });
      setAutoSaveStatus("✓ Rascunho salvo");
      setTimeout(() => setAutoSaveStatus(""), 2500);
    } catch (e) {
      setAutoSaveStatus("Erro ao salvar: " + e.message);
    }
  }, [pacienteId]);

  useEffect(() => {
    if (!rascunhoKey) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      salvarRascunhoAuto();
    }, 4000);
    return () => clearTimeout(autoSaveTimer.current);
  }, [clinica, ecgSupra, ecgSemSupra, heartScore, preParecer, enfermeiroFinalizado, medicoData]);

  // Rascunho: carregar do localStorage se paciente ainda não tem assessoria salva
  useEffect(() => {
    if (!rascunhoKey || !paciente) return;
    if (paciente?.assessoria_cardiologia?.cardiologista_nome || paciente?.assessoria_cardiologia?.parecer_cardiologista || paciente?.assessoria_cardiologia?.confirma_triagem) return;
    const raw = localStorage.getItem(rascunhoKey);
    if (!raw) return;
    try {
      const r = JSON.parse(raw);
      if (r.clinica) setClinica(r.clinica);
      if (r.ecgSupra) setEcgSupra(r.ecgSupra);
      if (r.ecgSemSupra) setEcgSemSupra(r.ecgSemSupra);
      if (r.heartScore) setHeartScore(r.heartScore);
      if (r.preParecer) setPreParecer(r.preParecer);
      if (r.enfermeiroFinalizado) setEnfermeiroFinalizado(r.enfermeiroFinalizado);
      if (r.medicoData) setMedicoData(r.medicoData);
    } catch {}
  }, [paciente]);

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
      parecer = `IAM SUPRA parede ${ecgSupra.parede_supra || 'não definida'} - AVALIAÇÃO IMEDIATA`;
    } else if (heartTotal >= 7) {
      parecer = `SCA SEM SUPRA alto risco (HEART ${heartTotal}) - URGENTE`;
    } else if (heartTotal >= 4) {
      parecer = `SCA risco intermediário (HEART ${heartTotal})`;
    } else {
      parecer = `ECG/clínica baixa probabilidade (HEART ${heartTotal})`;
    }

    setPreParecer(parecer);
    setEnfermeiroFinalizado(true);
    setAutoSaveStatus("✓ Pré-parecer gerado! Aguardando avaliação médica.");
    setTimeout(() => setAutoSaveStatus(""), 4000);
  };

  // Gera PDF com texto puro (jsPDF), sem html2canvas
  const gerarRelatorioPDF = async (cl, es, ess, hs, pp, md) => {
    const pdf = new jsPDF("p", "mm", "a4");
    const W = 210;
    const margin = 15;
    const maxW = W - margin * 2;
    let y = 15;

    const ln = (text, size = 10, bold = false, color = [0,0,0]) => {
      pdf.setFontSize(size);
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setTextColor(...color);
      const lines = pdf.splitTextToSize(String(text || ""), maxW);
      lines.forEach(line => {
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

    // Cabeçalho
    ln("RELATÓRIO DE ASSESSORIA CARDIOLÓGICA - ASSCARDIO", 14, true, [180, 0, 0]);
    ln("Programa Coração Paraibano", 10, false, [80, 80, 80]);
    ln(`Data/Hora: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 9, false, [80,80,80]);
    divisor();

    // Paciente
    ln("DADOS DO PACIENTE", 11, true);
    ln(`Nome: ${paciente?.nome_completo || "-"}`);
    ln(`Idade: ${paciente?.idade || "-"} anos  |  Sexo: ${paciente?.sexo || "-"}`);
    ln(`Unidade de Saúde: ${paciente?.unidade_saude || "-"}`);
    ln(`Macrorregião: ${paciente?.macrorregiao || "-"}`);
    if (paciente?.formulario_vaga?.email_unidade_solicitante) {
      ln(`E-mail Unidade: ${paciente.formulario_vaga.email_unidade_solicitante}`);
    }
    divisor();

    // Sinais Vitais
    if (paciente?.triagem_medica) {
      const tm = paciente.triagem_medica;
      ln("SINAIS VITAIS", 11, true);
      const pa = tm.pa_braco_esquerdo || "";
      const [pas, pad] = pa.split('/').map(s => s?.trim());
      if (pas) ln(`PAS: ${pas} mmHg  |  PAD: ${pad || "-"} mmHg`);
      if (tm.frequencia_cardiaca) ln(`FC: ${tm.frequencia_cardiaca} bpm  |  FR: ${tm.frequencia_respiratoria || "-"} irpm`);
      if (tm.spo2) ln(`SpO2: ${tm.spo2}%  |  Temp: ${tm.temperatura || "-"} °C`);
      if (tm.glicemia_capilar) ln(`Glicemia: ${tm.glicemia_capilar} mg/dL`);
      divisor();
    }

    // Pré-parecer
    if (pp) {
      ln("AVALIAÇÃO DE ENFERMAGEM (PRÉ-PARECER)", 11, true);
      ln(pp, 10, true, [0, 0, 180]);
      divisor();
    }

    // Dados clínicos
    ln("DADOS CLÍNICOS", 11, true);
    const clinFields = [
      cl.dor_tipica && "Dor torácica típica",
      cl.sudorese && "Sudorese",
      cl.has && "HAS",
      cl.dm && "Diabetes Mellitus",
      cl.tabagismo && "Tabagismo",
      cl.dislipidemia && "Dislipidemia",
    ].filter(Boolean);
    ln(clinFields.length > 0 ? clinFields.join(", ") : "Nenhum dado registrado");
    divisor();

    // ECG
    ln("ECG", 11, true);
    ln(`Supra de ST: ${es.tem_supra === "sim" ? "SIM" : "NÃO"}`);
    if (es.tem_supra === "sim" && es.parede_supra) ln(`Parede: ${es.parede_supra}`);
    const derivacoesAtivas = ["d2","d3","avf","v1","v2","v3","v4","v5","v6","d1","avl","t_hiperaguda","v7_v9","v3r_v4r"]
      .filter(k => es[k]).map(k => k.toUpperCase().replace("_", "-"));
    if (derivacoesAtivas.length > 0) ln(`Derivações: ${derivacoesAtivas.join(", ")}`);
    if (es.tem_supra === "nao") {
      const alteracoes = [
        ess.infra_st && "Infra ST ≥0.5mm",
        ess.t_invertida && "Onda T invertida",
        ess.q_nova && "Onda Q nova",
        ess.wellens && "Síndrome de Wellens",
        ess.infra_difusa_avr && "Infra difusa + supra aVR",
      ].filter(Boolean);
      if (alteracoes.length > 0) ln(`Alterações: ${alteracoes.join(", ")}`);
      ln(`Probabilidade: ${ess.probabilidade || "não definida"}`);
    }
    divisor();

    // HEART Score
    if (es.tem_supra !== "sim") {
      const total = hs.historia + hs.ecg + hs.idade + hs.risco + hs.troponina;
      const interp = total <= 3 ? "Baixo risco" : total <= 6 ? "Risco intermediário" : "Alto risco";
      ln("HEART SCORE", 11, true);
      ln(`H-História: ${hs.historia}  |  E-ECG: ${hs.ecg}  |  A-Idade: ${hs.idade}  |  R-Risco: ${hs.risco}  |  T-Troponina: ${hs.troponina}`);
      ln(`TOTAL: ${total} pontos — ${interp}`, 11, true);
      divisor();
    }

    // Avaliação do Cardiologista
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
    if (md.diagnostico_estrategia?.length > 0) {
      ln("Diagnóstico + Estratégia:", 10, true);
      md.diagnostico_estrategia.forEach(k => ln(`  • ${estrategiasMap[k] || k}`));
    }

    if (md.parecer_cardiologista) {
      y += 2;
      ln("PARECER DO CARDIOLOGISTA:", 10, true);
      ln(md.parecer_cardiologista);
    }
    divisor();

    // Rodapé
    ln("Sistema de Triagem de Dor Torácica — Coração Paraibano", 8, false, [120,120,120]);
    ln("Desenvolvedor: Walber Alves Frazão Júnior — COREN 110.238", 8, false, [120,120,120]);
    ln(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}`, 8, false, [120,120,120]);

    const nomePaciente = (paciente?.nome_completo || 'Paciente').replace(/\s+/g, '_');
    const nomeArquivo = `Parecer_ASSCARDIO_${nomePaciente}_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`;

    // Download local automático
    pdf.save(nomeArquivo);

    // Upload para nuvem (para CERH visualizar)
    const pdfBlob = pdf.output('blob');
    const pdfFile = new File([pdfBlob], nomeArquivo, { type: 'application/pdf' });
    const uploadResult = await base44.integrations.Core.UploadFile({ file: pdfFile });
    return uploadResult.file_url;
  };

  const salvarRascunho = useMutation({
    mutationFn: async () => {
      const total = calcularHeartTotal();
      await base44.entities.Paciente.update(pacienteId, {
        assessoria_cardiologia: {
          clinica,
          ecg_supra: ecgSupra,
          ecg_sem_supra: ecgSemSupra,
          heart_score: { ...heartScore, total, interpretacao: getHeartInterpretacao(total) },
          pre_parecer: preParecer,
          diagnostico_estrategia: medicoData.diagnostico_estrategia.join(","),
          parecer_cardiologista: medicoData.parecer_cardiologista,
          cardiologista_nome: medicoData.cardiologista_nome,
          cardiologista_crm: medicoData.cardiologista_crm,
          cardiologista_rqe: medicoData.cardiologista_rqe,
          confirma_triagem: medicoData.confirma_triagem,
          _rascunho: true
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['paciente', pacienteId]);
      setAutoSaveStatus("✓ Rascunho salvo!");
      setTimeout(() => setAutoSaveStatus(""), 3000);
    },
    onError: (error) => {
      setAutoSaveStatus("Erro ao salvar: " + error.message);
    }
  });

  const salvarLaudoMedico = useMutation({
    mutationFn: async () => {
      const total = calcularHeartTotal();
      const file_url = await gerarRelatorioPDF(clinica, ecgSupra, ecgSemSupra, heartScore, preParecer, medicoData);
      const updateData = {
        assessoria_cardiologia: {
          data_hora: new Date().toISOString(),
          clinica,
          ecg_supra: ecgSupra,
          ecg_sem_supra: ecgSemSupra,
          heart_score: { ...heartScore, total, interpretacao: getHeartInterpretacao(total) },
          pre_parecer: preParecer,
          diagnostico_estrategia: medicoData.diagnostico_estrategia.join(","),
          parecer_cardiologista: medicoData.parecer_cardiologista,
          cardiologista_nome: medicoData.cardiologista_nome,
          cardiologista_crm: medicoData.cardiologista_crm,
          cardiologista_rqe: medicoData.cardiologista_rqe,
          confirma_triagem: medicoData.confirma_triagem,
        },
        relatorio_asscardio_url: file_url,
        status: "Aguardando Regulação"
      };
      if (medicoData.diagnostico_estrategia.includes("6")) {
        updateData.hemodinamica = { ...paciente?.hemodinamica, tipo_icp: "trombolise_icp" };
      }
      await base44.entities.Paciente.update(pacienteId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['paciente', pacienteId]);
      navigate(createPageUrl("Dashboard"));
    },
    onError: (error) => {
      setAutoSaveStatus("Erro ao finalizar: " + error.message);
    }
  });

  if (isLoading) {
    return <div className="p-8">Carregando...</div>;
  }

  if (!paciente) {
    return <div className="p-8">Paciente não encontrado</div>;
  }

  const heartTotal = calcularHeartTotal();
  const confirmaTriagemValida = medicoData.confirma_triagem || paciente?.assessoria_cardiologia?.confirma_triagem || false;

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
          {paciente.triagem_medica?.tipo_sca === 'SCACESST' && (
            <Badge className="bg-red-600 text-white text-sm px-3 py-1">🔴 PRIORIDADE 0 - SCACESST</Badge>
          )}
          {paciente.triagem_medica?.tipo_sca === 'SCASESST_COM_TROPONINA' && (
            <Badge className="bg-orange-500 text-white text-sm px-3 py-1">🟠 PRIORIDADE 1 - SCASESST c/ Troponina</Badge>
          )}
          {paciente.triagem_medica?.tipo_sca === 'SCASESST_SEM_TROPONINA' && (
            <Badge className="bg-yellow-500 text-white text-sm px-3 py-1">🟡 PRIORIDADE 2 - SCASESST s/ Troponina</Badge>
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

          {/* Coluna Direita - Formulário */}
           <div className="lg:col-span-2 space-y-4">

            {/* Botão Baixar PDF do Laudo ASSCARDIO */}
            {paciente.relatorio_asscardio_url && (
              <Card className="border-2 border-red-300 bg-red-50">
                <CardHeader className="bg-red-100">
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    📄 Relatório ASSCARDIO - Gerado
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <Button
                    onClick={async () => {
                      const resp = await fetch(paciente.relatorio_asscardio_url);
                      const blob = await resp.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Parecer_ASSCARDIO_${(paciente.nome_completo || 'Paciente').replace(/\s+/g, '_')}.pdf`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    ⬇️ BAIXAR PDF DO PARECER CARDIOLÓGICO
                  </Button>
                </CardContent>
              </Card>
            )}

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
                        {paciente.hemodinamica.tipo_icp === 'ate_24h' && 'Estratégia Invasiva Precoce'}
                        {paciente.hemodinamica.tipo_icp === 'ate_72h' && 'Estratégia Invasiva Durante o Internamento'}
                        {paciente.hemodinamica.tipo_icp === 'trombolise_icp' && 'Trombólise e ICP 2-24h'}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Auto-save status */}
            {autoSaveStatus && (
              <div className="text-xs text-blue-700 text-right italic py-1 font-medium">{autoSaveStatus}</div>
            )}

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

          </CardContent>
        </Card>

        {/* 2. BLOCO 1 - ACHADOS DO ECG (SUPRA ST) */}
        {ecgSupra.tem_supra === "sim" && (
          <Collapsible open={bloco1Open} onOpenChange={setBloco1Open}>
            <Card className="mb-4 border-2 border-blue-200">
              <CollapsibleTrigger className="w-full">
                <CardHeader className="bg-blue-100 cursor-pointer hover:bg-blue-200 transition-colors">
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
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* 3. BLOCO 2 - SEM SUPRA COM TROPONINA (apenas se RELATO MÉDICO = NÃO) */}
        {ecgSupra.tem_supra === "nao" && (
          <Collapsible open={bloco2Open} onOpenChange={setBloco2Open}>
            <Card className="mb-4 border-2 border-orange-200">
              <CollapsibleTrigger className="w-full">
                <CardHeader className="bg-orange-100 cursor-pointer hover:bg-orange-200 transition-colors">
                  <CardTitle className="text-orange-900 flex items-center justify-between">
                    <span>🔍 BLOCO 2 - SEM SUPRA COM EXAME DE TROPONINA QUANTITATIVA</span>
                    {bloco2Open ? <ChevronUp /> : <ChevronDown />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-4 space-y-4">
                  {/* HEART Score calculado na Avaliação Clínica */}
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                    <Label className="text-base font-bold text-blue-900 block mb-2">📊 RESULTADO HEART SCORE</Label>
                    <p className="text-xs text-blue-600 mb-3 italic">
                      Este resultado é calculado na página: Avaliação Clínica - SCASESST com Troponina (Paciente SEM Supra de ST COM exame de Troponina)
                    </p>
                    {paciente?.avaliacao_clinica?.heart_score?.total != null ? (
                      <div className="space-y-3">
                        {/* Total + Interpretação */}
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
                            {paciente.avaliacao_clinica.heart_score.interpretacao
                              ? paciente.avaliacao_clinica.heart_score.interpretacao.split(":")[0]
                              : getHeartInterpretacao(paciente.avaliacao_clinica.heart_score.total)}
                          </Badge>
                        </div>
                        {/* Detalhamento por critério */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-white border border-blue-200 rounded p-2">
                            <span className="font-semibold text-blue-800">H - História:</span>
                            <span className="ml-2">
                              {paciente.avaliacao_clinica.heart_score.historia_clinica === 0 && "Levemente suspeita"}
                              {paciente.avaliacao_clinica.heart_score.historia_clinica === 1 && "Moderadamente suspeita"}
                              {paciente.avaliacao_clinica.heart_score.historia_clinica === 2 && "Altamente suspeita"}
                              <strong className="ml-1 text-blue-900">({paciente.avaliacao_clinica.heart_score.historia_clinica} pt)</strong>
                            </span>
                          </div>
                          <div className="bg-white border border-blue-200 rounded p-2">
                            <span className="font-semibold text-blue-800">E - ECG:</span>
                            <span className="ml-2">
                              {paciente.avaliacao_clinica.heart_score.ecg === 0 && "Normal"}
                              {paciente.avaliacao_clinica.heart_score.ecg === 1 && "Alterações inespecíficas"}
                              {paciente.avaliacao_clinica.heart_score.ecg === 2 && "Depressão/elevação ST"}
                              <strong className="ml-1 text-blue-900">({paciente.avaliacao_clinica.heart_score.ecg} pt)</strong>
                            </span>
                          </div>
                          <div className="bg-white border border-blue-200 rounded p-2">
                            <span className="font-semibold text-blue-800">A - Idade:</span>
                            <span className="ml-2">
                              {paciente.avaliacao_clinica.heart_score.idade === 0 && "< 45 anos"}
                              {paciente.avaliacao_clinica.heart_score.idade === 1 && "45–64 anos"}
                              {paciente.avaliacao_clinica.heart_score.idade === 2 && "≥ 65 anos"}
                              <strong className="ml-1 text-blue-900">({paciente.avaliacao_clinica.heart_score.idade} pt)</strong>
                            </span>
                          </div>
                          <div className="bg-white border border-blue-200 rounded p-2">
                            <span className="font-semibold text-blue-800">R - Fatores de Risco:</span>
                            <strong className="ml-1 text-blue-900">({paciente.avaliacao_clinica.heart_score.pontos_fatores_risco} pt)</strong>
                            {paciente.avaliacao_clinica.heart_score.fatores_risco?.length > 0 && (
                              <ul className="mt-1 text-xs text-gray-600 list-disc ml-4">
                                {paciente.avaliacao_clinica.heart_score.fatores_risco.map((f, i) => (
                                  <li key={i}>{f}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div className="bg-white border border-blue-200 rounded p-2">
                            <span className="font-semibold text-blue-800">T - Troponina:</span>
                            <span className="ml-2">
                              {paciente.avaliacao_clinica.heart_score.troponina === 0 && "Normal"}
                              {paciente.avaliacao_clinica.heart_score.troponina === 1 && "1 a 3× LSN"}
                              {paciente.avaliacao_clinica.heart_score.troponina === 2 && "> 3× LSN"}
                              <strong className="ml-1 text-blue-900">({paciente.avaliacao_clinica.heart_score.troponina} pt)</strong>
                            </span>
                          </div>
                        </div>
                        {/* Interpretação completa */}
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
                      <p className="text-sm text-gray-500 italic">Aguardando cálculo na Avaliação Clínica com Troponina.</p>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}



        {/* 4. BLOCO 3 - SEM SUPRA SEM TROPONINA (apenas se RELATO MÉDICO = NÃO) */}
        {ecgSupra.tem_supra === "nao" && (
          <Collapsible open={bloco3Open} onOpenChange={setBloco3Open}>
            <Card className="mb-4 border-2 border-purple-200">
              <CollapsibleTrigger className="w-full">
                <CardHeader className="bg-purple-100 cursor-pointer hover:bg-purple-200 transition-colors">
                  <CardTitle className="text-purple-900 flex items-center justify-between">
                    <span>🔍 BLOCO 3 - SEM SUPRA SEM EXAME DE TROPONINA QUANTITATIVA</span>
                    {bloco3Open ? <ChevronUp /> : <ChevronDown />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-4 space-y-4">
                  {paciente?.avaliacao_clinica?.historia_clinica || paciente?.avaliacao_clinica?.ecg_classificacao || paciente?.avaliacao_clinica?.faixa_etaria || paciente?.avaliacao_clinica?.fatores_risco?.length > 0 ? (
                    <div className="space-y-4">
                      {/* História Clínica */}
                      {paciente.avaliacao_clinica.historia_clinica && (
                        <div className="bg-white border border-purple-200 rounded-lg p-3">
                          <Label className="text-sm font-bold text-purple-900 block mb-1">HISTÓRIA CLÍNICA</Label>
                          <p className="text-purple-800">{paciente.avaliacao_clinica.historia_clinica}</p>
                        </div>
                      )}
                      {/* ECG */}
                      {paciente.avaliacao_clinica.ecg_classificacao && (
                        <div className="bg-white border border-purple-200 rounded-lg p-3">
                          <Label className="text-sm font-bold text-purple-900 block mb-1">ECG</Label>
                          <p className="text-purple-800">{paciente.avaliacao_clinica.ecg_classificacao}</p>
                        </div>
                      )}
                      {/* Idade */}
                      {paciente.avaliacao_clinica.faixa_etaria && (
                        <div className="bg-white border border-purple-200 rounded-lg p-3">
                          <Label className="text-sm font-bold text-purple-900 block mb-1">IDADE</Label>
                          <p className="text-purple-800">{paciente.avaliacao_clinica.faixa_etaria}</p>
                        </div>
                      )}
                      {/* Fatores de Risco */}
                      {paciente.avaliacao_clinica.fatores_risco?.length > 0 && (
                        <div className="bg-white border border-purple-200 rounded-lg p-3">
                          <Label className="text-sm font-bold text-purple-900 block mb-2">FATORES DE RISCO PARA DOENÇA CORONARIANA</Label>
                          <ul className="space-y-1">
                            {paciente.avaliacao_clinica.fatores_risco.map((fator, i) => (
                              <li key={i} className="text-purple-800 text-sm">• {fator}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">Aguardando preenchimento na Avaliação Clínica - SCASESST SEM Troponina.</p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
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

              {ecgSupra.tem_supra === "sim" && (
                <div className="space-y-1">
                  <Label className="font-semibold">Parede:</Label>
                  <Select value={ecgSupra.parede_supra} onValueChange={(v) => setEcgSupra({...ecgSupra, parede_supra: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a parede" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inferior">Inferior</SelectItem>
                      <SelectItem value="Anterior">Anterior</SelectItem>
                      <SelectItem value="Parede anterosseptal">Parede anterosseptal</SelectItem>
                      <SelectItem value="Parede anterior localizada">Parede anterior localizada</SelectItem>
                      <SelectItem value="Parede anterolateral">Parede anterolateral</SelectItem>
                      <SelectItem value="Parede anterior extensa">Parede anterior extensa</SelectItem>
                      <SelectItem value="Lateral">Lateral</SelectItem>
                      <SelectItem value="Parede lateral alta">Parede lateral alta</SelectItem>
                      <SelectItem value="Parede lateral baixa">Parede lateral baixa</SelectItem>
                      <SelectItem value="VD">VD (Ventrículo Direito)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-lg font-bold">DIAGNÓSTICO + ESTRATÉGIA:</Label>
                <div className="space-y-2">
                  {[
                    { value: "1", label: "☐ 1- IAM supra ST → \"Estratégia 1: transferência imediata\"", bg: "bg-red-100" },
                    { value: "2", label: "☐ 2- SCA sem supra MUITO alto risco → \"Estratégia 1: transferência imediata\"", bg: "bg-orange-100" },
                    { value: "3", label: "☐ 3- IAM sem supra/alto risco → \"Estratégia 2: Estratégia Invasiva Precoce\"", bg: "bg-yellow-100" },
                    { value: "4", label: "☐ 4- SCA intermediário → \"Estratégia 3: Estratégia Invasiva Durante o Internamento\"", bg: "bg-green-100" },
                    { value: "5", label: "☐ 5- Orientação Cardiológica", bg: "bg-blue-100" },
                    { value: "6", label: "☐ 6- Trombólise + ICP 2-24h", bg: "bg-purple-100" },
                  ].map(({ value, label, bg }) => (
                    <div key={value} className={`flex items-center space-x-2 ${bg} p-3 rounded`}>
                      <Checkbox
                        id={`est${value}`}
                        checked={medicoData.diagnostico_estrategia.includes(value)}
                        onCheckedChange={(checked) => {
                          const current = medicoData.diagnostico_estrategia;
                          const updated = checked ? [...current, value] : current.filter(v => v !== value);
                          setMedicoData({...medicoData, diagnostico_estrategia: updated});
                        }}
                      />
                      <Label htmlFor={`est${value}`} className="text-base cursor-pointer">{label}</Label>
                    </div>
                  ))}
                </div>
                {medicoData.diagnostico_estrategia.includes("6") && <RecomendacoesTrombolise />}
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

              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <Label className="font-bold">Médico Cardiologista *</Label>
                  <Input
                    value={medicoData.cardiologista_nome}
                    onChange={(e) => setMedicoData({...medicoData, cardiologista_nome: e.target.value})}
                    placeholder="Nome completo"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="font-bold">CRM *</Label>
                  <Input
                    value={medicoData.cardiologista_crm}
                    onChange={(e) => setMedicoData({...medicoData, cardiologista_crm: e.target.value})}
                    placeholder="Nº do CRM"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="font-bold">RQE</Label>
                  <Input
                    value={medicoData.cardiologista_rqe}
                    onChange={(e) => setMedicoData({...medicoData, cardiologista_rqe: e.target.value})}
                    placeholder="Nº do RQE"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => salvarRascunho.mutate()}
                  disabled={salvarRascunho.isPending}
                  variant="outline"
                  className="w-full border-2 border-orange-400 text-orange-700 hover:bg-orange-50 text-lg py-4"
                >
                  {salvarRascunho.isPending ? "Salvando..." : "💾 SALVAR RASCUNHO"}
                </Button>

                <Button
                  onClick={() => salvarLaudoMedico.mutate()}
                  disabled={salvarLaudoMedico.isPending || !confirmaTriagemValida}
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-6"
                >
                  {salvarLaudoMedico.isPending ? "Salvando..." : "🏁 FINALIZAR LAUDO"}
                </Button>
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