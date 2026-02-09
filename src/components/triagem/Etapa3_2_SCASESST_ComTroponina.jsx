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
import TempoPortaAgulha from "./TempoPortaAgulha";

export default function Etapa3_2_SCASESST_ComTroponina({ dadosPaciente, onProxima, onAnterior }) {
  const [dados, setDados] = useState({
    antecedentes: dadosPaciente.avaliacao_clinica?.antecedentes || "",
    quadro_atual: dadosPaciente.avaliacao_clinica?.quadro_atual || "",
    hipotese_diagnostica: dadosPaciente.avaliacao_clinica?.hipotese_diagnostica || "",
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
    resultados_exames: dadosPaciente.avaliacao_clinica?.resultados_exames || []
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
    "Troponina (0h e 1h ou 3h)",
    "Troponina convencional",
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

  const atualizarResultadoExame = (index, campo, valor) => {
    setDados(prev => ({
      ...prev,
      resultados_exames: prev.resultados_exames.map((res, i) =>
        i === index ? { ...res, [campo]: valor } : res
      )
    }));
  };

  const removerResultadoExame = (index) => {
    setDados(prev => ({
      ...prev,
      resultados_exames: prev.resultados_exames.filter((_, i) => i !== index)
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

      {/* Tempo Porta-Agulha */}
      <TempoPortaAgulha dataHoraInicio={dadosPaciente.data_hora_inicio_triagem} />

      {/* Tempo de Dor */}
      <TempoDor dataHoraInicioSintomas={dadosPaciente.data_hora_inicio_sintomas} />

      {/* Tempo de ECG */}
      <TempoECG dataHoraChegada={dadosPaciente.data_hora_chegada} dataHoraEcg={dadosPaciente.data_hora_ecg} />

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

        {dados.exames_solicitados.length > 0 && (
          <div>
            <Label className="mb-2 block">Exames Adicionados</Label>
            <div className="bg-white p-3 rounded border">
              <ul className="list-disc pl-5 space-y-1">
                {dados.exames_solicitados.map((exame, index) => (
                  <li key={index} className="text-sm">{exame}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Resultados de Exames MNM */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Resultados de Exames - MNM
        </h3>

        <div className="space-y-3 mb-4">
          {dados.resultados_exames.map((resultado, index) => (
            <div key={index} className="bg-white p-3 rounded border flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-xs mb-1 block">Tipo de Exame</Label>
                <select
                  value={resultado.tipo}
                  onChange={(e) => atualizarResultadoExame(index, "tipo", e.target.value)}
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
                  onChange={(e) => atualizarResultadoExame(index, "resultado", e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removerResultadoExame(index)}
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
          onClick={adicionarResultadoExame}
          className="w-full"
        >
          + Adicionar Resultado de Exame
        </Button>
      </div>

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



      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onAnterior}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Etapa Anterior
        </Button>
        <Button type="submit" className="bg-red-600 hover:bg-red-700">
          Próxima Etapa
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}