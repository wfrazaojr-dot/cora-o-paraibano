import React, { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, Pill, TestTube, Activity, AlertCircle } from "lucide-react";
import TempoDor from "./TempoDor";
import TempoECG from "./TempoECG";
import TempoPortaAgulhaEtapa3 from "./TempoPortaAgulhaEtapa3";
import TempoPortaBalaoEtapa3 from "./TempoPortaBalaoEtapa3";

export default function Etapa3_2_SCASESST_ComTroponina({ dadosPaciente, onProxima, onAnterior, modoLeitura = false }) {
  const [dados, setDados] = useState({
    antecedentes: dadosPaciente.avaliacao_clinica?.antecedentes || "",
    quadro_atual: dadosPaciente.avaliacao_clinica?.quadro_atual || "",
    hipotese_diagnostica: dadosPaciente.avaliacao_clinica?.hipotese_diagnostica || "",
    limite_superior_normalidade: dadosPaciente.avaliacao_clinica?.limite_superior_normalidade || "",
    valor_troponina_paciente: dadosPaciente.avaliacao_clinica?.valor_troponina_paciente || "",
    valor_troponina_paciente_2: dadosPaciente.avaliacao_clinica?.valor_troponina_paciente_2 || "",
    tipo_troponina_1: dadosPaciente.avaliacao_clinica?.tipo_troponina_1 || "",
    tipo_troponina_2: dadosPaciente.avaliacao_clinica?.tipo_troponina_2 || "",
    heart_score: dadosPaciente.avaliacao_clinica?.heart_score || {
      historia_clinica: null,
      ecg: null,
      idade: null,
      fatores_risco: [],
      pontos_fatores_risco: 0,
      troponina: null,
      total: 0,
      interpretacao: ""
    },
    prescricao_medicamentos: dadosPaciente.avaliacao_clinica?.prescricao_medicamentos || [],
    exames_solicitados: dadosPaciente.avaliacao_clinica?.exames_solicitados || [],
    resultados_exames_mnm: dadosPaciente.avaliacao_clinica?.resultados_exames_mnm || [],
    resultados_exames: dadosPaciente.avaliacao_clinica?.resultados_exames || {},
    observacoes_exames: dadosPaciente.avaliacao_clinica?.observacoes_exames || {
      exames_nao_realizados: false,
      exames_nao_liberados: false,
      outros: ""
    }
  });

  const [novoMedicamento, setNovoMedicamento] = useState({ medicamento: "", dose: "", via: "" });
  const [novoExame, setNovoExame] = useState("");

  const fatoresRiscoOptions = [
    "Hipercolesterolemia",
    "Diabetes",
    "Hipertensão",
    "Obesidade (IMC > 30 Kg/m²)",
    "Tabagismo (atual ou interrupção ≤ 3 meses)",
    "História familiar precoce (com DCV antes dos 65 anos)",
    "Doença aterosclerótica conhecida (IAM prévio, ICP/CRM, AVC/AIT ou doença arterial periférica)"
  ];

  const calcularHeartScore = () => {
    const { historia_clinica, ecg, idade, fatores_risco, troponina } = dados.heart_score;
    
    if (historia_clinica === null || ecg === null || idade === null || troponina === null) {
      return;
    }

    let pontosFatoresRisco = 0;
    const doencaAterosclerotica = fatores_risco.includes("Doença aterosclerótica conhecida (IAM prévio, ICP/CRM, AVC/AIT ou doença arterial periférica)");
    
    if (doencaAterosclerotica || fatores_risco.length >= 3) {
      pontosFatoresRisco = 2;
    } else if (fatores_risco.length >= 1) {
      pontosFatoresRisco = 1;
    }

    const total = historia_clinica + ecg + idade + pontosFatoresRisco + troponina;
    
    let interpretacao = "";
    if (total <= 3) {
      interpretacao = "BAIXO RISCO: Risco de MACE < 2%. Conduta: alta precoce ou investigação ambulatorial. Cateterismo: não urgente; considerar apenas se sintomas persistirem.";
    } else if (total >= 4 && total <= 6) {
      interpretacao = "RISCO INTERMEDIÁRIO: Risco de MACE 12-16%. Conduta: internação e investigação hospitalar. Cateterismo: recomendado em até 72 horas.";
    } else {
      interpretacao = "ALTO RISCO: Risco de MACE > 50%. Conduta: manejo agressivo e avaliação imediata. Cateterismo: idealmente imediato ou em até 24 horas.";
    }

    setDados(prev => ({
      ...prev,
      heart_score: {
        ...prev.heart_score,
        pontos_fatores_risco: pontosFatoresRisco,
        total,
        interpretacao
      }
    }));
  };

  useEffect(() => {
    calcularHeartScore();
  }, [dados.heart_score.historia_clinica, dados.heart_score.ecg, dados.heart_score.idade, dados.heart_score.fatores_risco, dados.heart_score.troponina]);

  const medicamentosComuns = [
    { nome: "AAS", dose: "300mg", via: "VO (mastigado)" },
    { nome: "Mononitrato de Isossorbida", dose: "5-15mg", via: "SL" },
    { nome: "Dinitrato de Isossorbida", dose: "5-15mg", via: "SL" },
    { nome: "Morfina", dose: "1-2mg", via: "EV" },
    { nome: "Atorvastatina", dose: "80mg", via: "VO" },
    { nome: "Rosuvastatina", dose: "40mg", via: "VO" },
    { nome: "Sinvastatina", dose: "40mg", via: "VO" },
    { nome: "Enoxaparina", dose: "0,75-1mg/kg", via: "SC" },
    { nome: "Enoxaparina (Trombólise)", dose: "30mg EV (15-30min pós fibrinolítico) + 30mg EV (15min pós)", via: "EV" },
    { nome: "Clopidogrel", dose: "300-600mg", via: "VO" },
    { nome: "Captopril", dose: "50-100mg", via: "VO" },
    { nome: "Nitroglicerina", dose: "10-200mcg/min", via: "EV" },
    { nome: "Fentanil", dose: "25-50mcg", via: "EV" },
    { nome: "Metoprolol", dose: "25-50mg", via: "VO" }
  ];

  const examesComuns = [
    "Troponina US 0h",
    "Troponina US 1h",
    "Troponina US 3h",
    "Troponina Convencional 0h",
    "Troponina Convencional 3h",
    "Troponina Convencional 6h",
    "Troponina Convencional 12h",
    "Hemograma completo",
    "Creatinina / Ureia",
    "Eletrólitos (Na, K, Mg)",
    "Glicemia",
    "Coagulograma",
    "CPK-MB",
    "D-dímero",
    "Radiografia de tórax",
    "Ecocardiograma"
  ];

  const adicionarMedicamento = (med) => {
    setDados(prev => ({
      ...prev,
      prescricao_medicamentos: [...prev.prescricao_medicamentos, {
        medicamento: med.nome || med.medicamento,
        dose: med.dose,
        via: med.via
      }]
    }));
  };

  const adicionarMedicamentoManual = () => {
    if (novoMedicamento.medicamento && novoMedicamento.dose) {
      adicionarMedicamento(novoMedicamento);
      setNovoMedicamento({ medicamento: "", dose: "", via: "" });
    }
  };

  const removerMedicamento = (index) => {
    setDados(prev => ({
      ...prev,
      prescricao_medicamentos: prev.prescricao_medicamentos.filter((_, i) => i !== index)
    }));
  };

  const editarDoseMedicamento = (index, novaDose) => {
    setDados(prev => ({
      ...prev,
      prescricao_medicamentos: prev.prescricao_medicamentos.map((med, i) => 
        i === index ? { ...med, dose: novaDose } : med
      )
    }));
  };

  const adicionarExameManual = () => {
    if (novoExame.trim()) {
      toggleExame(novoExame.trim());
      setNovoExame("");
    }
  };

  const tiposExamesMNM = [
    "Troponina US (0h)",
    "Troponina US (1h)",
    "Troponina Convencional (0h)",
    "Troponina Convencional (2h)",
    "Outros"
  ];

  const adicionarResultadoExame = () => {
    setDados(prev => ({
      ...prev,
      resultados_exames: [...prev.resultados_exames, { tipo: "", resultado: "" }]
    }));
  };

  const atualizarResultadoExameMNM = (index, campo, valor) => {
    setDados(prev => ({
      ...prev,
      resultados_exames_mnm: prev.resultados_exames_mnm.map((res, i) =>
        i === index ? { ...res, [campo]: valor } : res
      )
    }));
  };

  const removerResultadoExameMNM = (index) => {
    setDados(prev => ({
      ...prev,
      resultados_exames_mnm: prev.resultados_exames_mnm.filter((_, i) => i !== index)
    }));
  };

  const atualizarResultadoExame = (exame, resultado) => {
    setDados(prev => ({
      ...prev,
      resultados_exames: {
        ...prev.resultados_exames,
        [exame]: resultado
      }
    }));
  };

  const toggleExame = (exame) => {
    setDados(prev => ({
      ...prev,
      exames_solicitados: prev.exames_solicitados.includes(exame)
        ? prev.exames_solicitados.filter(e => e !== exame)
        : [...prev.exames_solicitados, exame]
    }));
  };

  const toggleFatorRisco = (fator) => {
    setDados(prev => ({
      ...prev,
      heart_score: {
        ...prev.heart_score,
        fatores_risco: prev.heart_score.fatores_risco.includes(fator)
          ? prev.heart_score.fatores_risco.filter(f => f !== fator)
          : [...prev.heart_score.fatores_risco, fator]
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!dados.antecedentes || !dados.quadro_atual || !dados.hipotese_diagnostica) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    if (!dados.limite_superior_normalidade || !dados.valor_troponina_paciente) {
      alert("Preencha o Limite Superior da Normalidade e o Valor da Troponina do paciente");
      return;
    }

    if (dados.heart_score.total === 0) {
      alert("Complete o HEART Score");
      return;
    }

    onProxima({ avaliacao_clinica: dados });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Avaliação Clínica - SCASESST com Troponina</h2>
        <p className="text-gray-600">Paciente SEM Supra de ST COM exame de Troponina</p>
      </div>

      {/* Tempo de Dor */}
      <TempoDor dataHoraInicioSintomas={dadosPaciente.data_hora_inicio_sintomas} />

      {/* Tempo de ECG */}
      <TempoECG dataHoraChegada={dadosPaciente.data_hora_chegada} dataHoraEcg={dadosPaciente.data_hora_ecg} />

      {/* Temporizadores Porta-Agulha e Porta-Balão */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TempoPortaAgulhaEtapa3 dataHoraChegada={dadosPaciente.data_hora_chegada} />
        <TempoPortaBalaoEtapa3 dataHoraChegada={dadosPaciente.data_hora_chegada} />
      </div>

      {/* Alerta sobre uso de inibidor da fosfodiesterase */}
      {dadosPaciente.uso_inibidor_fosfodiesterase === true && (
        <div className="bg-red-100 border-2 border-red-500 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-700" />
            <div>
              <p className="text-lg font-bold text-red-900">
                🚨 ATENÇÃO: EVITAR USO DE NITRATOS
              </p>
              <p className="text-sm text-red-800 mt-1">
                Paciente fez uso de inibidor da 5-fosfodiesterase nas últimas 24-72h
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 1. Prescrição Medicamentosa */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
          <Pill className="w-5 h-5" />
          1. Prescrição Medicamentosa
        </h3>

        <div className="space-y-3 mb-4">
          <Label>Medicamentos do Protocolo</Label>
          <div className="grid md:grid-cols-2 gap-2">
            {medicamentosComuns.map((med) => (
              <Button
                key={med.nome}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adicionarMedicamento(med)}
                className="justify-start"
              >
                + {med.nome} {med.dose} {med.via}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <Label>Adicionar Medicamento Personalizado</Label>
          <div className="grid md:grid-cols-3 gap-2">
            <Input
              placeholder="Medicamento"
              value={novoMedicamento.medicamento}
              onChange={(e) => setNovoMedicamento(prev => ({...prev, medicamento: e.target.value}))}
            />
            <Input
              placeholder="Dose"
              value={novoMedicamento.dose}
              onChange={(e) => setNovoMedicamento(prev => ({...prev, dose: e.target.value}))}
            />
            <Input
              placeholder="Via"
              value={novoMedicamento.via}
              onChange={(e) => setNovoMedicamento(prev => ({...prev, via: e.target.value}))}
            />
          </div>
          <Button type="button" variant="outline" onClick={adicionarMedicamentoManual}>
            Adicionar
          </Button>
        </div>

        {dados.prescricao_medicamentos.length > 0 && (
          <div>
            <Label className="mb-2 block">Medicamentos Prescritos</Label>
            <div className="space-y-2">
              {dados.prescricao_medicamentos.map((med, index) => (
                <div key={index} className="flex items-center gap-2 bg-white p-3 rounded border">
                  <div className="flex-1">
                    <strong>{med.medicamento || med.nome}</strong> - ({med.via})
                  </div>
                  <Input
                    type="text"
                    value={med.dose}
                    onChange={(e) => editarDoseMedicamento(index, e.target.value)}
                    className="w-32"
                    placeholder="Dose"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removerMedicamento(index)}
                    className="text-red-600"
                  >
                    Remover
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Exames Solicitados */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          2. Requisição de Exames
        </h3>

        <div className="space-y-2 mb-4">
          {examesComuns.map((exame) => (
            <div key={exame} className="flex items-center gap-3">
              <Checkbox
                checked={dados.exames_solicitados.includes(exame)}
                onCheckedChange={() => toggleExame(exame)}
              />
              <Label className="cursor-pointer">{exame}</Label>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Adicionar exame personalizado"
            value={novoExame}
            onChange={(e) => setNovoExame(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarExameManual())}
          />
          <Button type="button" variant="outline" onClick={adicionarExameManual}>
            Adicionar
          </Button>
        </div>

      </div>

      {/* Resultados de Exames MNM */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Resultados de Exames - MNM
        </h3>

        <div className="space-y-3 mb-4">
          {dados.resultados_exames_mnm.map((resultado, index) => (
            <div key={index} className="bg-white p-3 rounded border flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-xs mb-1 block">Tipo de Exame</Label>
                <select
                  value={resultado.tipo}
                  onChange={(e) => atualizarResultadoExameMNM(index, "tipo", e.target.value)}
                  className="w-full h-9 rounded-md border border-input px-3 text-sm"
                >
                  <option value="">Selecione...</option>
                  {tiposExamesMNM.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <Label className="text-xs mb-1 block">Resultado</Label>
                <Input
                  placeholder="Ex: 0.05, positivo, normal..."
                  value={resultado.resultado}
                  onChange={(e) => atualizarResultadoExameMNM(index, "resultado", e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removerResultadoExameMNM(index)}
                className="text-red-600"
              >
                Remover
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setDados(prev => ({
            ...prev,
            resultados_exames_mnm: [...prev.resultados_exames_mnm, { tipo: "", resultado: "" }]
          }))}
          className="w-full"
        >
          + Adicionar Resultado de Exame
        </Button>
      </div>

      {/* Exames Solicitados e Resultados */}
      {dados.exames_solicitados.length > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-teal-900 mb-4 flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Exames Solicitados e Resultados
          </h3>
          <div className="space-y-3">
            {dados.exames_solicitados.map((exame, index) => (
              <div key={index} className="bg-white p-4 rounded border border-teal-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div>
                    <Label className="text-sm font-semibold text-gray-900">{exame}</Label>
                  </div>
                  <div>
                    <Input
                      placeholder="Resultado do exame..."
                      value={dados.resultados_exames[exame] || ""}
                      onChange={(e) => atualizarResultadoExame(exame, e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-teal-300">
            <Label className="text-base font-semibold text-teal-900 mb-4 block">Observações</Label>
            <div className="space-y-3 bg-white p-4 rounded border border-teal-200">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={dados.observacoes_exames.exames_nao_realizados}
                  onCheckedChange={(checked) => setDados(prev => ({
                    ...prev,
                    observacoes_exames: {
                      ...prev.observacoes_exames,
                      exames_nao_realizados: checked
                    }
                  }))}
                />
                <Label className="cursor-pointer">Exames não Realizados</Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={dados.observacoes_exames.exames_nao_liberados}
                  onCheckedChange={(checked) => setDados(prev => ({
                    ...prev,
                    observacoes_exames: {
                      ...prev.observacoes_exames,
                      exames_nao_liberados: checked
                    }
                  }))}
                />
                <Label className="cursor-pointer">Exames Não Liberados até o Momento</Label>
              </div>
              <div className="space-y-2">
                <Label>Outros:</Label>
                <Textarea
                  value={dados.observacoes_exames.outros}
                  onChange={(e) => setDados(prev => ({
                    ...prev,
                    observacoes_exames: {
                      ...prev.observacoes_exames,
                      outros: e.target.value
                    }
                  }))}
                  placeholder="Descreva outras observações..."
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Antecedentes Clínicos */}
      <div className="space-y-4">
        <div>
          <Label>3. Antecedentes Clínicos *</Label>
          <p className="text-xs text-gray-500 mb-2">
            Histórico de doenças prévias, alergias, uso de inibidor da 5 fosfodiesterase, medicações em uso
          </p>
          <Textarea
            value={dados.antecedentes}
            onChange={(e) => setDados(prev => ({...prev, antecedentes: e.target.value}))}
            rows={4}
            required
            placeholder="Descreva os antecedentes clínicos do paciente..."
          />
        </div>

        {/* 4. Quadro Atual */}
        <div>
          <Label>4. Quadro Atual *</Label>
          <p className="text-xs text-gray-500 mb-2">
            Característica da dor torácica, dispneia, sintomas associados, descartado sepse, dissecção aguda de aorta, 
            tamponamento pericárdico, choque cardiogênico, rotura de esôfago e intoxicação por drogas
          </p>
          <Textarea
            value={dados.quadro_atual}
            onChange={(e) => setDados(prev => ({...prev, quadro_atual: e.target.value}))}
            rows={6}
            required
            placeholder="Descreva o quadro clínico atual..."
          />
        </div>

        {/* 5. Hipótese Diagnóstica e Justificativa de Transferência */}
        <div>
          <Label>5. Hipótese Diagnóstica e Justificativa de Transferência *</Label>
          <Textarea
            value={dados.hipotese_diagnostica}
            onChange={(e) => setDados(prev => ({...prev, hipotese_diagnostica: e.target.value}))}
            rows={3}
            required
            placeholder="Hipótese diagnóstica e justificativa para transferência..."
          />
        </div>
      </div>

      {/* HEART SCORE */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          HEART SCORE
        </h3>

        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold mb-3 block">HISTÓRIA CLÍNICA *</Label>
            <div className="space-y-2">
              {[
                { valor: 0, texto: "Levemente suspeita" },
                { valor: 1, texto: "Moderadamente suspeita" },
                { valor: 2, texto: "Altamente suspeita" }
              ].map((opcao) => (
                <div key={opcao.valor} className="flex items-center gap-3 p-2 bg-white rounded">
                  <input
                    type="radio"
                    name="historia"
                    checked={dados.heart_score.historia_clinica === opcao.valor}
                    onChange={() => setDados(prev => ({
                      ...prev,
                      heart_score: {...prev.heart_score, historia_clinica: opcao.valor}
                    }))}
                    className="w-4 h-4"
                  />
                  <Label>{opcao.texto} ({opcao.valor} ponto{opcao.valor !== 1 ? 's' : ''})</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">ECG *</Label>
            <div className="space-y-2">
              {[
                { valor: 0, texto: "Normal" },
                { valor: 1, texto: "Com alterações inespecíficas de repolarização" },
                { valor: 2, texto: "Com depressão ou elevação do ST não explicada por outras causas" }
              ].map((opcao) => (
                <div key={opcao.valor} className="flex items-center gap-3 p-2 bg-white rounded">
                  <input
                    type="radio"
                    name="ecg_heart"
                    checked={dados.heart_score.ecg === opcao.valor}
                    onChange={() => setDados(prev => ({
                      ...prev,
                      heart_score: {...prev.heart_score, ecg: opcao.valor}
                    }))}
                    className="w-4 h-4"
                  />
                  <Label>{opcao.texto} ({opcao.valor} ponto{opcao.valor !== 1 ? 's' : ''})</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">IDADE *</Label>
            <div className="space-y-2">
              {[
                { valor: 0, texto: "< 45 anos" },
                { valor: 1, texto: "45–64 anos" },
                { valor: 2, texto: "≥ 65 anos" }
              ].map((opcao) => (
                <div key={opcao.valor} className="flex items-center gap-3 p-2 bg-white rounded">
                  <input
                    type="radio"
                    name="idade_heart"
                    checked={dados.heart_score.idade === opcao.valor}
                    onChange={() => setDados(prev => ({
                      ...prev,
                      heart_score: {...prev.heart_score, idade: opcao.valor}
                    }))}
                    className="w-4 h-4"
                  />
                  <Label>{opcao.texto} ({opcao.valor} ponto{opcao.valor !== 1 ? 's' : ''})</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">FATORES DE RISCO PARA DOENÇA CORONARIANA *</Label>
            <p className="text-xs text-gray-600 mb-2">
              0 pontos: nenhum • 1 ponto: 1-2 fatores • 2 pontos: ≥3 fatores ou doença aterosclerótica
            </p>
            <div className="space-y-2">
              {fatoresRiscoOptions.map((fator) => (
                <div key={fator} className="flex items-center gap-3 p-2 bg-white rounded">
                  <Checkbox
                    checked={dados.heart_score.fatores_risco.includes(fator)}
                    onCheckedChange={() => toggleFatorRisco(fator)}
                  />
                  <Label className="cursor-pointer">{fator}</Label>
                </div>
              ))}
            </div>
            <p className="text-sm text-blue-700 mt-2">
              <strong>Pontos calculados:</strong> {dados.heart_score.pontos_fatores_risco}
            </p>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">TROPONINA *</Label>

            <Alert className="bg-amber-50 border-amber-300 mb-4">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <p className="font-semibold mb-2">Para pontuar corretamente a troponina:</p>
                <p className="text-sm">Você precisa informar o Limite Superior da Normalidade (percentil 99) do seu laboratório. A pontuação será baseada em quantas vezes o resultado da troponina do paciente ultrapassa esse limite.</p>
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 gap-4 mb-4 bg-white p-4 rounded border border-amber-200">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Limite Superior da Normalidade (percentil 99) do Laboratório *</Label>
                <p className="text-xs text-gray-600 mb-2">Ex: 0.04, 0.03, etc.</p>
                <Input
                  type="number"
                  step="0.001"
                  value={dados.limite_superior_normalidade}
                  onChange={(e) => setDados(prev => ({...prev, limite_superior_normalidade: e.target.value}))}
                  placeholder="Digite o limite superior (ex: 0.04)"
                  required
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2 block">Valor da Troponina do Paciente *</Label>
                <p className="text-xs text-gray-600 mb-2">Ex: 0.08, 0.15, etc.</p>
                <Input
                  type="number"
                  step="0.001"
                  value={dados.valor_troponina_paciente}
                  onChange={(e) => setDados(prev => ({...prev, valor_troponina_paciente: e.target.value}))}
                  placeholder="Digite o valor da troponina (ex: 0.08)"
                  required
                />
              </div>
            </div>

            {dados.limite_superior_normalidade && dados.valor_troponina_paciente && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-4">
                <p className="text-sm font-semibold text-blue-900">
                  Proporção: {(parseFloat(dados.valor_troponina_paciente) / parseFloat(dados.limite_superior_normalidade)).toFixed(2)}x o limite superior
                </p>
              </div>
            )}

            <div className="space-y-2">
              {[
                { valor: 0, texto: "Normal" },
                { valor: 1, texto: "1 a 3 vezes o limite superior" },
                { valor: 2, texto: "> 3 vezes o limite superior" }
              ].map((opcao) => (
                <div key={opcao.valor} className="flex items-center gap-3 p-2 bg-white rounded">
                  <input
                    type="radio"
                    name="troponina"
                    checked={dados.heart_score.troponina === opcao.valor}
                    onChange={() => setDados(prev => ({
                      ...prev,
                      heart_score: {...prev.heart_score, troponina: opcao.valor}
                    }))}
                    className="w-4 h-4"
                  />
                  <Label>{opcao.texto} ({opcao.valor} ponto{opcao.valor !== 1 ? 's' : ''})</Label>
                </div>
              ))}
            </div>
          </div>

          {dados.heart_score.total > 0 && (
            <Alert className={`${
              dados.heart_score.total <= 3 ? 'bg-green-50 border-green-300' :
              dados.heart_score.total <= 6 ? 'bg-yellow-50 border-yellow-300' :
              'bg-red-50 border-red-300'
            }`}>
              <AlertDescription>
                <p className="text-lg font-bold mb-2">
                  HEART SCORE: {dados.heart_score.total} pontos
                </p>
                <p className="text-sm">{dados.heart_score.interpretacao}</p>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>



      {modoLeitura && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
          <p className="text-blue-900 font-semibold text-center">
            ℹ️ Modo Visualização: Os dados desta etapa não podem ser modificados
          </p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onAnterior}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Etapa Anterior
        </Button>
        {!modoLeitura ? (
          <Button type="submit" className="bg-red-600 hover:bg-red-700">
            Próxima Etapa
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button type="button" onClick={() => onProxima({ avaliacao_clinica: dados })} className="bg-blue-600 hover:bg-blue-700">
            Próxima Etapa
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </form>
  );
}