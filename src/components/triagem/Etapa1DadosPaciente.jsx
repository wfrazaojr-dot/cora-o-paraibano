import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Clock, Building2, AlertCircle } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import { CIDADES_POR_MACRO } from "@/components/data/cidadesParaiba";


export default function Etapa1DadosPaciente({ dadosPaciente, onProxima, onAnterior, modoLeitura = false, permitirNavegacao = false }) {
  const calcularIdade = (dataNasc) => {
    if (!dataNasc) return null;
    const hoje = new Date();
    const nasc = new Date(dataNasc + "T00:00:00");
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade >= 0 ? idade : null;
  };

  const [dados, setDados] = useState({
    unidade_saude: "",
    cidade: "",
    macrorregiao: "",
    nome_completo: "",
    data_nascimento: "",
    sexo: "",
    uso_inibidor_fosfodiesterase: null,
    data_atendimento: format(new Date(), "yyyy-MM-dd"),
    hora_chegada: "",
    data_sintomas: format(new Date(), "yyyy-MM-dd"),
    hora_sintomas: "",
    hora_classificacao_risco: "",
    hora_ecg: "",
    classificacao_risco: "",
    status: "Em Triagem"
  });



  useEffect(() => {
    setDados({
      unidade_saude: dadosPaciente.unidade_saude || "",
      cidade: dadosPaciente.cidade || "",
      macrorregiao: dadosPaciente.macrorregiao || "",
      nome_completo: dadosPaciente.nome_completo || "",
      data_nascimento: dadosPaciente.data_nascimento || "",
      sexo: dadosPaciente.sexo || "",
      uso_inibidor_fosfodiesterase: dadosPaciente.uso_inibidor_fosfodiesterase ?? null,
      data_atendimento: dadosPaciente.data_hora_chegada ? format(new Date(dadosPaciente.data_hora_chegada), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      hora_chegada: dadosPaciente.data_hora_chegada ? format(new Date(dadosPaciente.data_hora_chegada), "HH:mm") : "",
      data_sintomas: dadosPaciente.data_hora_inicio_sintomas ? format(new Date(dadosPaciente.data_hora_inicio_sintomas), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      hora_sintomas: dadosPaciente.data_hora_inicio_sintomas ? format(new Date(dadosPaciente.data_hora_inicio_sintomas), "HH:mm") : "",
      hora_classificacao_risco: dadosPaciente.triagem_enfermagem?.data_hora_classificacao_risco ? format(new Date(dadosPaciente.triagem_enfermagem.data_hora_classificacao_risco), "HH:mm") : "",
      hora_ecg: dadosPaciente.triagem_enfermagem?.data_hora_ecg ? format(new Date(dadosPaciente.triagem_enfermagem.data_hora_ecg), "HH:mm") : "",
      classificacao_risco: dadosPaciente.triagem_enfermagem?.classificacao_risco || "",
      status: "Em Triagem"
    });
  }, [dadosPaciente]);

  const calcularTempoDor = () => {
    if (!dados.data_sintomas || !dados.hora_sintomas) return null;
    
    const inicioSintomas = new Date(`${dados.data_sintomas}T${dados.hora_sintomas}`);
    const agora = new Date();
    const minutos = differenceInMinutes(agora, inicioSintomas);
    
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    
    return { horas, minutos: mins, totalMinutos: minutos };
  };

  const tempoDor = calcularTempoDor();

  const calcularTempoTriagemEcg = () => {
    if (!dados.hora_classificacao_risco || !dados.hora_ecg) return null;
    
    const dataAtendimento = dados.data_atendimento || format(new Date(), "yyyy-MM-dd");
    const dataClassificacao = new Date(`${dataAtendimento}T${dados.hora_classificacao_risco}`);
    const dataEcg = new Date(`${dataAtendimento}T${dados.hora_ecg}`);
    
    const minutos = differenceInMinutes(dataEcg, dataClassificacao);
    return minutos;
  };

  const tempoTriagemEcg = calcularTempoTriagemEcg();



  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!dados.unidade_saude || dados.unidade_saude.trim() === "") {
      alert("Por favor, preencha o nome da Unidade de Saúde");
      return;
    }
    
    if (!dados.sexo) {
      alert("Por favor, selecione o sexo do paciente");
      return;
    }

    if (dados.sexo === "Masculino" && dados.uso_inibidor_fosfodiesterase === null) {
      alert("Por favor, informe se o paciente fez uso de inibidor da 5-fosfodiesterase nas últimas 24-72h");
      return;
    }

    if (!dados.hora_chegada) {
      alert("Por favor, preencha o horário de chegada");
      return;
    }

    if (!dados.hora_classificacao_risco || !dados.hora_ecg || !dados.classificacao_risco) {
      alert("Por favor, preencha todos os campos da Triagem de Enfermagem (hora da classificação de risco, hora do ECG e classificação de risco)");
      return;
    }
    
    // Converter data e horas para datetime-local format
    const dataChegada = `${dados.data_atendimento}T${dados.hora_chegada}`;
    const dataClassificacaoRisco = `${dados.data_atendimento}T${dados.hora_classificacao_risco}`;
    const dataEcg = `${dados.data_atendimento}T${dados.hora_ecg}`;
    const dataHoraInicioSintomas = `${dados.data_sintomas}T${dados.hora_sintomas}`;
    
    const idadeCalculada = calcularIdade(dados.data_nascimento);

    if (!dados.macrorregiao) {
      alert("Por favor, selecione a Macrorregião de Saúde");
      return;
    }

    onProxima({
      ...dados,
      cidade: dados.cidade,
      idade: idadeCalculada,
      data_hora_chegada: dataChegada,
      data_hora_inicio_sintomas: dataHoraInicioSintomas,
      triagem_enfermagem: {
        data_hora_classificacao_risco: dataClassificacaoRisco,
        data_hora_ecg: dataEcg,
        tempo_triagem_ecg_minutos: tempoTriagemEcg,
        classificacao_risco: dados.classificacao_risco
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Informações do Paciente</h2>
        <p className="text-gray-600">Preencha os dados básicos do paciente para iniciar a triagem</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
        <Clock className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">Data e Hora do Início da Triagem</p>
          <p className="text-lg font-bold text-blue-700">
            {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>

      <div className="bg-teal-50 border-2 border-teal-300 rounded-lg p-4 space-y-4">
        <Label className="text-base font-semibold text-teal-900 block">
          Macrorregião de Saúde *
        </Label>
        <div className="flex gap-3">
          {["Macro 1", "Macro 2", "Macro 3"].map((macro) => (
            <button
              key={macro}
              type="button"
              onClick={() => !modoLeitura && setDados(prev => ({...prev, macrorregiao: macro, cidade: ""}))}
              className={`flex-1 py-3 rounded-lg border-2 font-bold text-sm transition-colors ${
                dados.macrorregiao === macro
                  ? "bg-teal-600 border-teal-600 text-white"
                  : "bg-white border-teal-300 text-teal-700 hover:bg-teal-50"
              } ${modoLeitura ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
            >
              {macro}
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <Label htmlFor="cidade" className="text-sm font-semibold text-teal-900">Cidade da Unidade de Saúde *</Label>
          {dados.macrorregiao && CIDADES_POR_MACRO[dados.macrorregiao] ? (
            <select
              id="cidade"
              value={dados.cidade}
              onChange={(e) => setDados(prev => ({...prev, cidade: e.target.value}))}
              className="flex h-10 w-full rounded-md border-2 border-teal-400 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              disabled={modoLeitura}
            >
              <option value="">Selecione a cidade</option>
              {CIDADES_POR_MACRO[dados.macrorregiao].map(cidade => (
                <option key={cidade} value={cidade}>{cidade}</option>
              ))}
            </select>
          ) : (
            <Input
              id="cidade"
              value={dados.cidade}
              disabled
              placeholder="Selecione primeiro a Macrorregião acima"
              className="border-2 border-teal-200 bg-gray-50 text-gray-400"
            />
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-700" />
            <Label htmlFor="unidade_saude" className="text-sm font-semibold text-teal-900">
              Nome da Unidade de Saúde *
            </Label>
          </div>
          <Input
            id="unidade_saude"
            value={dados.unidade_saude}
            onChange={(e) => setDados(prev => ({...prev, unidade_saude: e.target.value}))}
            placeholder="Ex: Hospital Municipal São José, UPA Centro, etc."
            required
            className="text-base border-2 border-teal-400"
            disabled={modoLeitura}
          />
          <p className="text-xs text-teal-700 mt-1 font-medium">
            ⚠️ Este nome aparecerá nos relatórios e documentos oficiais - campo obrigatório
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="nome_completo">Nome Completo *</Label>
          <Input
            id="nome_completo"
            value={dados.nome_completo}
            onChange={(e) => setDados(prev => ({...prev, nome_completo: e.target.value}))}
            placeholder="Digite o nome completo"
            required
            disabled={modoLeitura}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
          <Input
            id="data_nascimento"
            type="date"
            value={dados.data_nascimento}
            onChange={(e) => setDados(prev => ({...prev, data_nascimento: e.target.value}))}
            required
            disabled={modoLeitura}
          />
          {dados.data_nascimento && calcularIdade(dados.data_nascimento) !== null && (
            <p className="text-sm text-blue-700 font-medium">
              Idade: {calcularIdade(dados.data_nascimento)} anos
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sexo">Sexo *</Label>
          <select
            id="sexo"
            value={dados.sexo}
            onChange={(e) => setDados(prev => ({...prev, sexo: e.target.value, uso_inibidor_fosfodiesterase: e.target.value === "Masculino" ? null : false}))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            required
            disabled={modoLeitura}
          >
            <option value="">Selecione o sexo</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
          </select>
        </div>

      </div>

      {/* Alerta para pacientes masculinos sobre inibidor da 5-fosfodiesterase */}
      {dados.sexo === "Masculino" && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4">
          <Label className="text-base font-semibold text-amber-900 mb-3 block">
            ⚠️ Fez uso de inibidor da 5-fosfodiesterase nas últimas 24-72h? *
          </Label>
          <p className="text-sm text-amber-800 mb-3">
            (Medicamentos como Sildenafil/Viagra, Tadalafil/Cialis, Vardenafil/Levitra)
          </p>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="uso_inibidor"
                value="sim"
                checked={dados.uso_inibidor_fosfodiesterase === true}
                onChange={(e) => setDados(prev => ({...prev, uso_inibidor_fosfodiesterase: true}))}
                className="w-4 h-4"
                required
                disabled={modoLeitura}
              />
              <Label>Sim</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="uso_inibidor"
                value="nao"
                checked={dados.uso_inibidor_fosfodiesterase === false}
                onChange={(e) => setDados(prev => ({...prev, uso_inibidor_fosfodiesterase: false}))}
                className="w-4 h-4"
                required
                disabled={modoLeitura}
              />
              <Label>Não</Label>
            </div>
          </div>
          {dados.uso_inibidor_fosfodiesterase === true && (
            <div className="mt-3 p-3 bg-red-100 border border-red-400 rounded-lg">
              <p className="text-sm font-bold text-red-900">
                🚨 ATENÇÃO: Paciente em uso recente de inibidor da fosfodiesterase. EVITAR USO DE NITRATOS!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Data e Hora do Início dos Sintomas */}
      <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
        <Label className="text-base font-semibold text-orange-900 mb-4 block">
          Data e Hora do Início dos Sintomas *
        </Label>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="data_sintomas" className="text-sm">Data *</Label>
            <Input
              id="data_sintomas"
              type="date"
              value={dados.data_sintomas}
              onChange={(e) => setDados(prev => ({...prev, data_sintomas: e.target.value}))}
              required
              disabled={modoLeitura}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hora_sintomas" className="text-sm">Hora *</Label>
            <Input
              id="hora_sintomas"
              type="time"
              value={dados.hora_sintomas}
              onChange={(e) => setDados(prev => ({...prev, hora_sintomas: e.target.value}))}
              required
              disabled={modoLeitura}
            />
          </div>
        </div>
      </div>

        {/* Data e Horário da Admissão */}
        <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-4">
        <Label className="text-base font-semibold text-indigo-900 mb-4 block">
          Data e Horário da Admissão *
        </Label>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="data_atendimento" className="text-sm">Data *</Label>
            <Input
              id="data_atendimento"
              type="date"
              value={dados.data_atendimento}
              onChange={(e) => setDados(prev => ({...prev, data_atendimento: e.target.value}))}
              required
              disabled={modoLeitura}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hora_chegada" className="text-sm">Hora de Chegada na Unidade *</Label>
            <Input
              id="hora_chegada"
              type="time"
              value={dados.hora_chegada}
              onChange={(e) => setDados(prev => ({...prev, hora_chegada: e.target.value}))}
              required
              disabled={modoLeitura}
            />
          </div>
        </div>
      </div>

      {/* Triagem de Enfermagem */}
      <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
        <Label className="text-base font-semibold text-purple-900 mb-4 block">
          Triagem de Enfermagem *
        </Label>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hora_classificacao_risco" className="text-sm">Hora da Classificação de Risco *</Label>
            <Input
              id="hora_classificacao_risco"
              type="time"
              value={dados.hora_classificacao_risco}
              onChange={(e) => setDados(prev => ({...prev, hora_classificacao_risco: e.target.value}))}
              required
              disabled={modoLeitura}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hora_ecg" className="text-sm">Hora de Realização do ECG *</Label>
            <Input
              id="hora_ecg"
              type="time"
              value={dados.hora_ecg}
              onChange={(e) => setDados(prev => ({...prev, hora_ecg: e.target.value}))}
              required
              disabled={modoLeitura}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="classificacao_risco" className="text-sm">Classificação de Risco *</Label>
            <select
              id="classificacao_risco"
              value={dados.classificacao_risco}
              onChange={(e) => setDados(prev => ({...prev, classificacao_risco: e.target.value}))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
              disabled={modoLeitura}
            >
              <option value="">Selecione a cor</option>
              <option value="vermelha">🔴 Vermelha</option>
              <option value="laranja">🟠 Laranja</option>
              <option value="amarela">🟡 Amarela</option>
              <option value="verde">🟢 Verde</option>
            </select>
          </div>
        </div>

        {tempoTriagemEcg !== null && tempoTriagemEcg >= 0 && (
          <div className={`mt-4 border-2 rounded-lg p-3 ${
            tempoTriagemEcg <= 10 ? 'bg-green-50 border-green-300' : 'bg-orange-50 border-orange-300'
          }`}>
            <div className="flex items-center gap-3">
              <Clock className={`w-5 h-5 ${
                tempoTriagemEcg <= 10 ? 'text-green-600' : 'text-orange-600'
              }`} />
              <div className="flex-1">
                <p className={`text-sm font-semibold ${
                  tempoTriagemEcg <= 10 ? 'text-green-900' : 'text-orange-900'
                }`}>
                  Indicador Triagem ECG
                </p>
                <p className={`text-xl font-bold ${
                  tempoTriagemEcg <= 10 ? 'text-green-700' : 'text-orange-700'
                }`}>
                  {tempoTriagemEcg} minutos
                </p>
                <p className={`text-xs font-medium mt-1 ${
                  tempoTriagemEcg <= 10 ? 'text-green-700' : 'text-orange-700'
                }`}>
                  {tempoTriagemEcg <= 10 ? '✓ Dentro da meta (≤ 10 minutos)' : '⚠️ Acima da meta de 10 minutos'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {tempoDor && tempoDor.totalMinutos >= 0 && (
        <div className={`border-2 rounded-lg p-4 ${
          tempoDor.totalMinutos > 720 ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300'
        }`}>
          <div className="flex items-center gap-3">
            <AlertCircle className={`w-6 h-6 ${
              tempoDor.totalMinutos > 720 ? 'text-red-600' : 'text-yellow-600'
            }`} />
            <div className="flex-1">
              <p className={`text-sm font-semibold ${
                tempoDor.totalMinutos > 720 ? 'text-red-900' : 'text-yellow-900'
              }`}>
                Tempo de Dor
              </p>
              <p className={`text-2xl font-bold ${
                tempoDor.totalMinutos > 720 ? 'text-red-700' : 'text-yellow-700'
              }`}>
                {tempoDor.horas}h {tempoDor.minutos}min
              </p>
              {tempoDor.totalMinutos > 720 && (
                <p className="text-xs text-red-700 font-medium mt-1">
                  ⚠️ Paciente fora da janela terapêutica ideal (mais de 12 horas)
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4">
        {!modoLeitura ? (
          <Button type="submit" className="bg-red-600 hover:bg-red-700">
            Próxima Etapa
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : permitirNavegacao ? (
          <Button type="button" onClick={() => onProxima({}, true)} className="bg-blue-600 hover:bg-blue-700">
            Próxima Etapa
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : null}
      </div>
    </form>
  );
}