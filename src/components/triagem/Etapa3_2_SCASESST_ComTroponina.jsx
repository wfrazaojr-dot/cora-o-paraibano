import React, { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, Pill, TestTube, Activity } from "lucide-react";

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
    exames_solicitados: dadosPaciente.avaliacao_clinica?.exames_solicitados || []
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
    { nome: "AAS", dose: "200-300mg", via: "VO (mastigado)" },
    { nome: "Clopidogrel", dose: "300-600mg", via: "VO" },
    { nome: "Ticagrelor", dose: "180mg", via: "VO" },
    { nome: "Enoxaparina", dose: "1mg/kg", via: "SC" },
    { nome: "Morfina", dose: "2-4mg", via: "EV" },
    { nome: "Fentanil", dose: "25-50mcg", via: "EV" },
    { nome: "Metoprolol", dose: "25-50mg", via: "VO" },
    { nome: "Atorvastatina", dose: "40-80mg", via: "VO" }
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
      prescricao_medicamentos: [...prev.prescricao_medicamentos, med]
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

      {/* Dados Clínicos */}
      <div className="space-y-4">
        <div>
          <Label>1. Antecedentes Clínicos *</Label>
          <Textarea
            value={dados.antecedentes}
            onChange={(e) => setDados(prev => ({...prev, antecedentes: e.target.value}))}
            rows={4}
            required
          />
        </div>

        <div>
          <Label>2. Quadro Atual *</Label>
          <Textarea
            value={dados.quadro_atual}
            onChange={(e) => setDados(prev => ({...prev, quadro_atual: e.target.value}))}
            rows={6}
            required
          />
        </div>

        <div>
          <Label>3. Hipótese Diagnóstica *</Label>
          <Textarea
            value={dados.hipotese_diagnostica}
            onChange={(e) => setDados(prev => ({...prev, hipotese_diagnostica: e.target.value}))}
            rows={3}
            required
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

      {/* Prescrição e Exames - similar ao anterior */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-4">Prescrição Medicamentosa</h3>
        <div className="grid md:grid-cols-2 gap-2">
          {medicamentosComuns.map((med) => (
            <Button
              key={med.nome}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => adicionarMedicamento(med)}
            >
              + {med.nome} {med.dose}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">Exames Solicitados</h3>
        <div className="space-y-2">
          {examesComuns.map((exame) => (
            <div key={exame} className="flex items-center gap-3">
              <Checkbox
                checked={dados.exames_solicitados.includes(exame)}
                onCheckedChange={() => toggleExame(exame)}
              />
              <Label>{exame}</Label>
            </div>
          ))}
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