import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, Pill, TestTube, AlertCircle } from "lucide-react";
import TempoDor from "./TempoDor";
import TempoECG from "./TempoECG";
import TempoPortaAgulhaEtapa3 from "./TempoPortaAgulhaEtapa3";
import TempoPortaBalaoEtapa3 from "./TempoPortaBalaoEtapa3";
import InfoTransporte from "./InfoTransporte";

export default function Etapa3_3_SCASESST_SemTroponina({ dadosPaciente, onProxima, onAnterior, modoLeitura = false }) {
  const [dados, setDados] = useState({
    antecedentes: dadosPaciente.avaliacao_clinica?.antecedentes || "",
    quadro_atual: dadosPaciente.avaliacao_clinica?.quadro_atual || "",
    hipotese_diagnostica: dadosPaciente.avaliacao_clinica?.hipotese_diagnostica || "",
    prescricao_medicamentos: dadosPaciente.avaliacao_clinica?.prescricao_medicamentos || [],
    exames_solicitados: dadosPaciente.avaliacao_clinica?.exames_solicitados || [],
    resultados_exames: dadosPaciente.avaliacao_clinica?.resultados_exames || {},
    observacoes_exames: dadosPaciente.avaliacao_clinica?.observacoes_exames || {
      exames_nao_realizados: false,
      exames_nao_liberados: false,
      outros: ""
    },
    info_transporte: dadosPaciente.avaliacao_clinica?.info_transporte || {},
    // Dados para BLOCO 3 - ASSCARDIO
    historia_clinica: dadosPaciente.avaliacao_clinica?.historia_clinica || "",
    ecg_classificacao: dadosPaciente.avaliacao_clinica?.ecg_classificacao || "",
    faixa_etaria: dadosPaciente.avaliacao_clinica?.faixa_etaria || "",
    fatores_risco: dadosPaciente.avaliacao_clinica?.fatores_risco || []
  });

  const [novoMedicamento, setNovoMedicamento] = useState({ medicamento: "", dose: "", via: "" });
  const [novoExame, setNovoExame] = useState("");

  const medicamentosComuns = [
    { nome: "AAS", dose: "300mg", via: "VO (mastigado)" },
    { nome: "Mononitrato de Isossorbida", dose: "5-15mg", via: "SL" },
    { nome: "Dinitrato de Isossorbida", dose: "5-15mg", via: "SL" },
    { nome: "Morfina", dose: "1-2mg", via: "EV" },
    { nome: "Atorvastatina", dose: "80mg", via: "VO" },
    { nome: "Rosuvastatina", dose: "40mg", via: "VO" },
    { nome: "Sinvastatina", dose: "40mg", via: "VO" },
    { nome: "Enoxaparina", dose: "0,75-1mg/kg", via: "SC" },
    { nome: "Clopidogrel", dose: "300-600mg", via: "VO" }
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

  const toggleExame = (exame) => {
    setDados(prev => ({
      ...prev,
      exames_solicitados: prev.exames_solicitados.includes(exame)
        ? prev.exames_solicitados.filter(e => e !== exame)
        : [...prev.exames_solicitados, exame]
    }));
  };

  const adicionarExameManual = () => {
    if (novoExame.trim()) {
      toggleExame(novoExame.trim());
      setNovoExame("");
    }
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

  const toggleFatorRisco = (fator) => {
    setDados(prev => ({
      ...prev,
      fatores_risco: prev.fatores_risco.includes(fator)
        ? prev.fatores_risco.filter(f => f !== fator)
        : [...prev.fatores_risco, fator]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!dados.antecedentes || !dados.quadro_atual || !dados.hipotese_diagnostica) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    onProxima({ avaliacao_clinica: dados });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Avaliação Clínica - SCASESST SEM Troponina</h2>
        <p className="text-gray-600">Paciente com Síndrome Coronariana Aguda SEM Supra de ST e SEM Troponina Quantitativa</p>
      </div>

      {/* Tempo de Dor */}
      <TempoDor dataHoraInicioSintomas={dadosPaciente.data_hora_inicio_sintomas} />

      {/* Tempo de ECG */}
      <TempoECG dataHoraChegada={dadosPaciente.data_hora_chegada} dataHoraEcg={dadosPaciente.data_hora_ecg} />

      {/* Temporizadores Porta-Agulha e FMC-to-device */}
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

      {/* Prescrição Medicamentosa */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
          <Pill className="w-5 h-5" />
          Prescrição Medicamentosa
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

      {/* Exames */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Requisição de Exames
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

      {/* Avaliação de Risco para ASSCARDIO */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 space-y-6">
        <h3 className="text-lg font-bold text-blue-900">📊 Avaliação de Risco (para ASSCARDIO - BLOCO 3)</h3>

        {/* História Clínica */}
        <div>
          <Label className="text-base font-semibold text-blue-900 block mb-2">HISTÓRIA CLÍNICA</Label>
          <RadioGroup value={dados.historia_clinica} onValueChange={(v) => setDados(prev => ({...prev, historia_clinica: v}))}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Levemente suspeita" id="hist1" />
              <Label htmlFor="hist1">Levemente suspeita</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Moderadamente suspeita" id="hist2" />
              <Label htmlFor="hist2">Moderadamente suspeita</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Altamente suspeita" id="hist3" />
              <Label htmlFor="hist3">Altamente suspeita</Label>
            </div>
          </RadioGroup>
        </div>

        {/* ECG */}
        <div>
          <Label className="text-base font-semibold text-blue-900 block mb-2">ECG</Label>
          <RadioGroup value={dados.ecg_classificacao} onValueChange={(v) => setDados(prev => ({...prev, ecg_classificacao: v}))}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Normal" id="ecg1" />
              <Label htmlFor="ecg1">Normal</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Com alterações inespecíficas de repolarização" id="ecg2" />
              <Label htmlFor="ecg2">Com alterações inespecíficas de repolarização</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Com depressão ou elevação do ST não explicada por outras causas" id="ecg3" />
              <Label htmlFor="ecg3">Com depressão ou elevação do ST não explicada por outras causas</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Idade */}
        <div>
          <Label className="text-base font-semibold text-blue-900 block mb-2">IDADE</Label>
          <RadioGroup value={dados.faixa_etaria} onValueChange={(v) => setDados(prev => ({...prev, faixa_etaria: v}))}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="< 45 anos" id="idade1" />
              <Label htmlFor="idade1">{"< 45 anos"}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="45–64 anos" id="idade2" />
              <Label htmlFor="idade2">45–64 anos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="≥ 65 anos" id="idade3" />
              <Label htmlFor="idade3">≥ 65 anos</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Fatores de Risco */}
        <div>
          <Label className="text-base font-semibold text-blue-900 block mb-2">FATORES DE RISCO PARA DOENÇA CORONARIANA</Label>
          <div className="space-y-2">
            {[
              "Hipercolesterolemia",
              "Diabetes",
              "Hipertensão",
              "Obesidade (IMC > 30 Kg/m²)",
              "Tabagismo (atual ou interrupção ≤ 3 meses)",
              "História familiar precoce (com DCV antes dos 65 anos)",
              "Doença aterosclerótica conhecida (IAM prévio, ICP/CRM, AVC/AIT ou doença arterial periférica)"
            ].map((fator) => (
              <div key={fator} className="flex items-center space-x-2">
                <Checkbox
                  id={fator}
                  checked={dados.fatores_risco.includes(fator)}
                  onCheckedChange={() => toggleFatorRisco(fator)}
                />
                <Label htmlFor={fator} className="cursor-pointer">{fator}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dados Clínicos */}
      <div className="space-y-4">
        <div>
          <Label>Antecedentes Clínicos *</Label>
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

        <div>
          <Label>Quadro Atual *</Label>
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

        <div>
          <Label>Hipótese Diagnóstica e Justificativa de Transferência *</Label>
          <Textarea
            value={dados.hipotese_diagnostica}
            onChange={(e) => setDados(prev => ({...prev, hipotese_diagnostica: e.target.value}))}
            rows={3}
            required
            placeholder="Hipótese diagnóstica e justificativa para transferência..."
          />
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