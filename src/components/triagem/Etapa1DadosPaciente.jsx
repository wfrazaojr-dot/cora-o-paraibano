import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Clock, Building2, AlertCircle, Upload } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { base44 } from "@/api/base44Client";

export default function Etapa1DadosPaciente({ dadosPaciente, onProxima, onAnterior }) {
  const [dados, setDados] = useState({
    unidade_saude: dadosPaciente.unidade_saude || "",
    nome_completo: dadosPaciente.nome_completo || "",
    idade: dadosPaciente.idade || "",
    sexo: dadosPaciente.sexo || "",
    data_atendimento: dadosPaciente.data_atendimento || format(new Date(), "yyyy-MM-dd"),
    hora_chegada: dadosPaciente.hora_chegada || "",
    data_hora_inicio_sintomas: dadosPaciente.data_hora_inicio_sintomas || format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    hora_classificacao_risco: dadosPaciente.triagem_enfermagem?.hora_classificacao_risco || "",
    hora_ecg: dadosPaciente.triagem_enfermagem?.hora_ecg || "",
    classificacao_risco: dadosPaciente.triagem_enfermagem?.classificacao_risco || "",
    ecg_files: dadosPaciente.triagem_enfermagem?.ecg_files || [],
    status: "Em Triagem"
  });

  const [uploadingECG, setUploadingECG] = useState(false);

  const calcularTempoDor = () => {
    if (!dados.data_hora_inicio_sintomas) return null;
    
    const inicioSintomas = new Date(dados.data_hora_inicio_sintomas);
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

  const handleUploadECG = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingECG(true);
    try {
      const uploadedUrls = [];
      for (let i = 0; i < files.length; i++) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: files[i] });
        uploadedUrls.push(file_url);
      }
      setDados(prev => ({
        ...prev,
        ecg_files: [...prev.ecg_files, ...uploadedUrls]
      }));
    } catch (error) {
      alert("Erro ao enviar arquivo(s) de ECG");
    } finally {
      setUploadingECG(false);
    }
  };



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
    
    onProxima({
      ...dados,
      data_hora_chegada: dataChegada,
      triagem_enfermagem: {
        data_hora_classificacao_risco: dataClassificacaoRisco,
        data_hora_ecg: dataEcg,
        tempo_triagem_ecg_minutos: tempoTriagemEcg,
        classificacao_risco: dados.classificacao_risco,
        ecg_files: dados.ecg_files
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

      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-5 h-5 text-green-700" />
          <Label htmlFor="unidade_saude" className="text-base font-semibold text-green-900">
            Nome da Unidade de Saúde *
          </Label>
        </div>
        <Input
          id="unidade_saude"
          value={dados.unidade_saude}
          onChange={(e) => setDados(prev => ({...prev, unidade_saude: e.target.value}))}
          placeholder="Ex: Hospital Municipal São José, UPA Centro, etc."
          required
          className="text-base border-2 border-green-400"
        />
        <p className="text-xs text-green-700 mt-2 font-medium">
          ⚠️ Este nome aparecerá nos relatórios e documentos oficiais - campo obrigatório
        </p>
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
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="idade">Idade *</Label>
          <Input
            id="idade"
            type="number"
            value={dados.idade}
            onChange={(e) => setDados(prev => ({...prev, idade: parseInt(e.target.value) || ""}))}
            placeholder="Digite a idade"
            required
            min="0"
            max="150"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sexo">Sexo *</Label>
          <select
            id="sexo"
            value={dados.sexo}
            onChange={(e) => setDados(prev => ({...prev, sexo: e.target.value}))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            required
          >
            <option value="">Selecione o sexo</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_hora_inicio_sintomas">Data e Hora do Início dos Sintomas *</Label>
          <Input
            id="data_hora_inicio_sintomas"
            type="datetime-local"
            value={dados.data_hora_inicio_sintomas}
            onChange={(e) => setDados(prev => ({...prev, data_hora_inicio_sintomas: e.target.value}))}
            required
          />
        </div>
        </div>

        {/* Data e Horários */}
        <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-4">
        <Label className="text-base font-semibold text-indigo-900 mb-4 block">
          Data e Horários do Atendimento *
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

        {/* Upload de ECG */}
        <div className="mt-4 space-y-3">
          <Label className="text-sm font-semibold text-purple-900">Arquivos de ECG</Label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
              <Upload className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">
                {uploadingECG ? "Enviando..." : "Adicionar ECG"}
              </span>
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleUploadECG}
                disabled={uploadingECG}
                className="hidden"
              />
            </label>
            {dados.ecg_files.length > 0 && (
              <span className="text-sm text-purple-700">
                {dados.ecg_files.length} arquivo(s) anexado(s)
              </span>
            )}
          </div>


        </div>
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
        <Button type="submit" className="bg-red-600 hover:bg-red-700">
          Próxima Etapa
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}