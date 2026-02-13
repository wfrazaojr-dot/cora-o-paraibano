import React, { useState, useEffect } from "react";
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
import { ArrowLeft, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function ASSCARDIODetalhe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const pacienteId = urlParams.get('id');

  const [bloco0Open, setBloco0Open] = useState(true);
  const [bloco1Open, setBloco1Open] = useState(true);
  const [bloco2Open, setBloco2Open] = useState(false);

  // Estado Enfermeiro - Dados Paciente
  const [dadosPaciente, setDadosPaciente] = useState({
    nome: "",
    idade: "",
    sexo: "",
    hora_chegada: "",
    unidade: "",
    troponina: "normal"
  });

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

  // Pré-parecer (gerado pelo enfermeiro)
  const [preParecer, setPreParecer] = useState("");
  const [enfermeiroFinalizado, setEnfermeiroFinalizado] = useState(false);

  // Médico
  const [medicoData, setMedicoData] = useState({
    confirma_triagem: false,
    diagnostico_estrategia: "",
    parecer_cardiologista: ""
  });

  const { data: paciente, isLoading } = useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: () => base44.entities.Paciente.list().then(list => list.find(p => p.id === pacienteId)),
    enabled: !!pacienteId
  });

  // Carregar dados do paciente
  useEffect(() => {
    if (paciente) {
      setDadosPaciente({
        nome: paciente.nome_completo || "",
        idade: paciente.idade?.toString() || "",
        sexo: paciente.sexo || "",
        hora_chegada: paciente.data_hora_chegada || "",
        unidade: paciente.unidade_saude || "",
        troponina: "normal"
      });
    }
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

  const salvarLaudoMedico = useMutation({
    mutationFn: async () => {
      await base44.entities.Paciente.update(pacienteId, {
        assessoria_cardiologia: {
          data_hora: new Date().toISOString(),
          dados_paciente: dadosPaciente,
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
        status: "Aguardando Regulação"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['paciente', pacienteId]);
      alert("Laudo finalizado com sucesso!");
      navigate(createPageUrl("Dashboard"));
    }
  });

  if (isLoading) {
    return <div className="p-8">Carregando...</div>;
  }

  const heartTotal = calcularHeartTotal();

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 to-green-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
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

        {/* 1. DADOS PACIENTE */}
        <Card className="mb-4 border-2 border-blue-200">
          <CardHeader className="bg-blue-100">
            <CardTitle className="text-blue-900">📋 DADOS DO PACIENTE (Enfermeiro)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Nome</Label>
                <Input value={dadosPaciente.nome} onChange={(e) => setDadosPaciente({...dadosPaciente, nome: e.target.value})} />
              </div>
              <div>
                <Label>Idade</Label>
                <Input value={dadosPaciente.idade} onChange={(e) => setDadosPaciente({...dadosPaciente, idade: e.target.value})} />
              </div>
              <div>
                <Label>Sexo</Label>
                <Select value={dadosPaciente.sexo} onValueChange={(v) => setDadosPaciente({...dadosPaciente, sexo: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hora Chegada</Label>
                <Input type="time" value={dadosPaciente.hora_chegada} onChange={(e) => setDadosPaciente({...dadosPaciente, hora_chegada: e.target.value})} />
              </div>
              <div>
                <Label>Unidade</Label>
                <Input placeholder="SAMU/UPA/PS" value={dadosPaciente.unidade} onChange={(e) => setDadosPaciente({...dadosPaciente, unidade: e.target.value})} />
              </div>
              <div>
                <Label>Troponina</Label>
                <Select value={dadosPaciente.troponina} onValueChange={(v) => setDadosPaciente({...dadosPaciente, troponina: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="1-3x">1-3x</SelectItem>
                    <SelectItem value=">3x">&gt;3x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. BLOCO 0 - CLÍNICA */}
        <Collapsible open={bloco0Open} onOpenChange={setBloco0Open}>
          <Card className="mb-4 border-2 border-green-200">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="bg-green-100 cursor-pointer hover:bg-green-200 transition-colors">
                <CardTitle className="text-green-900 flex items-center justify-between">
                  <span>📋 BLOCO 0 - CLÍNICA</span>
                  {bloco0Open ? <ChevronUp /> : <ChevronDown />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="dor_tipica" checked={clinica.dor_tipica} onCheckedChange={(c) => setClinica({...clinica, dor_tipica: c})} />
                    <Label htmlFor="dor_tipica" className="text-lg">☐ Dor típica</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sudorese" checked={clinica.sudorese} onCheckedChange={(c) => setClinica({...clinica, sudorese: c})} />
                    <Label htmlFor="sudorese" className="text-lg">☐ Sudorese</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="has" checked={clinica.has} onCheckedChange={(c) => setClinica({...clinica, has: c})} />
                    <Label htmlFor="has" className="text-lg">☐ HAS</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="dm" checked={clinica.dm} onCheckedChange={(c) => setClinica({...clinica, dm: c})} />
                    <Label htmlFor="dm" className="text-lg">☐ DM</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="tabagismo" checked={clinica.tabagismo} onCheckedChange={(c) => setClinica({...clinica, tabagismo: c})} />
                    <Label htmlFor="tabagismo" className="text-lg">☐ Tabagismo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="dislipidemia" checked={clinica.dislipidemia} onCheckedChange={(c) => setClinica({...clinica, dislipidemia: c})} />
                    <Label htmlFor="dislipidemia" className="text-lg">☐ Dislipidemia</Label>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

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
                      <Label htmlFor="supra_sim" className="text-lg">☑ SIM</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nao" id="supra_nao" />
                      <Label htmlFor="supra_nao" className="text-lg">☐ NÃO</Label>
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
        <Card className="mb-4 border-2 border-purple-200 bg-purple-50">
          <CardHeader className="bg-purple-100">
            <CardTitle className="text-purple-900">🧮 HEART SCORE (Auto-cálculo)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>H - História</Label>
                <Select value={heartScore.historia.toString()} onValueChange={(v) => setHeartScore({...heartScore, historia: parseInt(v)})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - Baixa</SelectItem>
                    <SelectItem value="1">1 - Moderada</SelectItem>
                    <SelectItem value="2">2 - Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>E - ECG</Label>
                <Select value={heartScore.ecg.toString()} onValueChange={(v) => setHeartScore({...heartScore, ecg: parseInt(v)})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - Normal</SelectItem>
                    <SelectItem value="1">1 - Não específico</SelectItem>
                    <SelectItem value="2">2 - Supra/Q</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>A - Idade</Label>
                <Select value={heartScore.idade.toString()} onValueChange={(v) => setHeartScore({...heartScore, idade: parseInt(v)})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - &lt;45 anos</SelectItem>
                    <SelectItem value="1">1 - 45-64 anos</SelectItem>
                    <SelectItem value="2">2 - ≥65 anos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>R - Fatores de Risco</Label>
                <Select value={heartScore.risco.toString()} onValueChange={(v) => setHeartScore({...heartScore, risco: parseInt(v)})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - 0 FR</SelectItem>
                    <SelectItem value="1">1 - 1-2 FR</SelectItem>
                    <SelectItem value="2">2 - ≥3 FR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>T - Troponina</Label>
                <Select value={heartScore.troponina.toString()} onValueChange={(v) => setHeartScore({...heartScore, troponina: parseInt(v)})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - Normal</SelectItem>
                    <SelectItem value="1">1 - 1-3x</SelectItem>
                    <SelectItem value="2">2 - &gt;3x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-purple-200 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-purple-900">
                TOTAL: {heartTotal} - {getHeartInterpretacao(heartTotal)}
              </p>
            </div>
          </CardContent>
        </Card>

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
  );
}