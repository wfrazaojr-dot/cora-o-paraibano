import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, FileImage, Activity, User, Stethoscope, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const corClassificacao = {
  "Vermelha": "bg-red-100 text-red-800 border-red-300",
  "Laranja": "bg-orange-100 text-orange-800 border-orange-300",
  "Amarela": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Verde": "bg-green-100 text-green-800 border-green-300",
  "Azul": "bg-blue-100 text-blue-800 border-blue-300"
};

export default function Etapa5AvaliacaoMedica({ dadosPaciente, onProxima, onAnterior }) {
  const [avaliacao, setAvaliacao] = useState(() => {
    if (dadosPaciente.avaliacao_medica && dadosPaciente.avaliacao_medica.data_hora_avaliacao) {
      return dadosPaciente.avaliacao_medica;
    }
    return {
      data_hora_avaliacao: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      antecedentes: "",
      quadro_atual: "",
      hipoteses_diagnosticas: "",
      observacoes: ""
    };
  });

  const [medico, setMedico] = useState({
    nome: dadosPaciente.medico_nome || "",
    crm: dadosPaciente.medico_crm || ""
  });

  useEffect(() => {
    if (!dadosPaciente.avaliacao_medica || !dadosPaciente.avaliacao_medica.data_hora_avaliacao) {
      setAvaliacao(prev => ({
        ...prev,
        data_hora_avaliacao: format(new Date(), "yyyy-MM-dd'T'HH:mm")
      }));
    }
  }, [dadosPaciente.avaliacao_medica]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!medico.nome || !medico.crm) {
      alert("Por favor, preencha o nome e CRM do médico");
      return;
    }
    onProxima({ 
      avaliacao_medica: avaliacao,
      medico_nome: medico.nome,
      medico_crm: medico.crm,
      status: "Em Atendimento"
    });
  };

  const tempoTriagemAvaliacao = dadosPaciente.data_hora_inicio_triagem && avaliacao.data_hora_avaliacao
    ? Math.round((new Date(avaliacao.data_hora_avaliacao) - new Date(dadosPaciente.data_hora_inicio_triagem)) / 60000)
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Avaliação Médica</h2>
        <p className="text-gray-600">Registro da avaliação clínica e diagnósticos</p>
      </div>

      {/* ALERTA DE TEMPO */}
      {tempoTriagemAvaliacao !== null && (
        <Alert className={tempoTriagemAvaliacao <= 30 ? "border-green-500 bg-green-50" : "border-orange-500 bg-orange-50"}>
          <AlertDescription className={tempoTriagemAvaliacao <= 30 ? "text-green-800" : "text-orange-800"}>
            <strong>⏱️ Tempo Triagem → Avaliação Médica: {tempoTriagemAvaliacao} minutos</strong>
            {tempoTriagemAvaliacao <= 30 ? " ✓ Dentro da meta" : " ⚠️ Acima da meta de 30 minutos"}
          </AlertDescription>
        </Alert>
      )}

      {/* ============================================ */}
      {/* RESUMO COMPLETO DA TRIAGEM DE ENFERMAGEM */}
      {/* ============================================ */}
      <Card className="shadow-lg border-l-4 border-l-blue-600">
        <CardHeader className="bg-blue-50 border-b">
          <CardTitle className="flex items-center gap-2 text-blue-900 text-xl">
            <User className="w-6 h-6" />
            📋 Resumo da Triagem de Enfermagem (Etapas 1-4)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          
          {/* ========== ETAPA 1: DADOS DO PACIENTE ========== */}
          <div className="border-l-4 border-l-indigo-500 pl-4 bg-indigo-50 p-4 rounded">
            <h3 className="font-bold text-indigo-900 mb-3 text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              1️⃣ DADOS DO PACIENTE
            </h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              {dadosPaciente.unidade_saude && (
                <div className="md:col-span-2 bg-blue-100 p-2 rounded">
                  <span className="text-blue-900 font-bold">🏥 Unidade:</span>
                  <p className="font-bold text-blue-900 text-base">{dadosPaciente.unidade_saude}</p>
                </div>
              )}
              <div>
                <span className="text-gray-700 font-semibold">Nome:</span>
                <p className="font-medium text-gray-900">{dadosPaciente.nome_completo || '-'}</p>
              </div>
              <div>
                <span className="text-gray-700 font-semibold">Prontuário:</span>
                <p className="font-medium text-gray-900">{dadosPaciente.prontuario || '-'}</p>
              </div>
              <div>
                <span className="text-gray-700 font-semibold">Idade:</span>
                <p className="font-medium text-gray-900">{dadosPaciente.idade || '-'} anos</p>
              </div>
              <div>
                <span className="text-gray-700 font-semibold">Sexo:</span>
                <p className="font-medium text-gray-900">{dadosPaciente.sexo || '-'}</p>
              </div>
              <div>
                <span className="text-gray-700 font-semibold">Chegada:</span>
                <p className="font-medium text-gray-900">
                  {dadosPaciente.data_hora_chegada ? format(new Date(dadosPaciente.data_hora_chegada), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'}
                </p>
              </div>
              <div>
                <span className="text-gray-700 font-semibold">Início dos Sintomas:</span>
                <p className="font-medium text-gray-900">
                  {dadosPaciente.data_hora_inicio_sintomas ? format(new Date(dadosPaciente.data_hora_inicio_sintomas), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* ========== ETAPA 2: TRIAGEM CARDIOLÓGICA ========== */}
          <div className="border-l-4 border-l-red-500 pl-4 bg-red-50 p-4 rounded">
            <h3 className="font-bold text-red-900 mb-3 text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              2️⃣ TRIAGEM CARDIOLÓGICA (SBC 2025)
            </h3>
            {dadosPaciente.triagem_cardiologica?.alerta_iam && (
              <div className="mb-3 p-3 bg-red-200 border-2 border-red-400 rounded">
                <p className="text-red-900 font-bold text-base">⚠️ ALERTA DE PROVÁVEL IAM DETECTADO</p>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <span className="text-gray-700">Dor/desconforto no peito:</span>
                <Badge className={`${dadosPaciente.triagem_cardiologica?.dor_desconforto_peito ? 'bg-red-600' : 'bg-green-600'} text-white`}>
                  {dadosPaciente.triagem_cardiologica?.dor_desconforto_peito ? 'SIM' : 'NÃO'}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <span className="text-gray-700">Duração {'>'} 10 min:</span>
                <Badge className={`${dadosPaciente.triagem_cardiologica?.duracao_maior_10min ? 'bg-red-600' : 'bg-green-600'} text-white`}>
                  {dadosPaciente.triagem_cardiologica?.duracao_maior_10min ? 'SIM' : 'NÃO'}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <span className="text-gray-700">Irradiação (braços/mandíbula):</span>
                <Badge className={`${dadosPaciente.triagem_cardiologica?.irradiacao ? 'bg-red-600' : 'bg-green-600'} text-white`}>
                  {dadosPaciente.triagem_cardiologica?.irradiacao ? 'SIM' : 'NÃO'}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <span className="text-gray-700">Dor epigástrica:</span>
                <Badge className={`${dadosPaciente.triagem_cardiologica?.dor_epigastrica ? 'bg-red-600' : 'bg-green-600'} text-white`}>
                  {dadosPaciente.triagem_cardiologica?.dor_epigastrica ? 'SIM' : 'NÃO'}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <span className="text-gray-700">Dispneia/diaforese:</span>
                <Badge className={`${dadosPaciente.triagem_cardiologica?.dispneia_diaforese ? 'bg-red-600' : 'bg-green-600'} text-white`}>
                  {dadosPaciente.triagem_cardiologica?.dispneia_diaforese ? 'SIM' : 'NÃO'}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <span className="text-gray-700">{'>'}50 anos/diabetes/DCV:</span>
                <Badge className={`${dadosPaciente.triagem_cardiologica?.idade_fatores_risco ? 'bg-red-600' : 'bg-green-600'} text-white`}>
                  {dadosPaciente.triagem_cardiologica?.idade_fatores_risco ? 'SIM' : 'NÃO'}
                </Badge>
              </div>
            </div>
          </div>

          {/* ========== ETAPA 3: DADOS VITAIS ========== */}
          <div className="border-l-4 border-l-green-500 pl-4 bg-green-50 p-4 rounded">
            <h3 className="font-bold text-green-900 mb-3 text-lg flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              3️⃣ DADOS VITAIS E ECG
            </h3>
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              <div className="bg-white p-2 rounded">
                <span className="text-gray-600 block text-xs">PA Esquerdo</span>
                <p className="font-bold text-gray-900 text-base">{dadosPaciente.dados_vitais?.pa_braco_esquerdo || '-'} mmHg</p>
              </div>
              <div className="bg-white p-2 rounded">
                <span className="text-gray-600 block text-xs">PA Direito</span>
                <p className="font-bold text-gray-900 text-base">{dadosPaciente.dados_vitais?.pa_braco_direito || '-'} mmHg</p>
              </div>
              <div className="bg-white p-2 rounded">
                <span className="text-gray-600 block text-xs">Frequência Cardíaca</span>
                <p className="font-bold text-gray-900 text-base">{dadosPaciente.dados_vitais?.frequencia_cardiaca || '-'} bpm</p>
              </div>
              <div className="bg-white p-2 rounded">
                <span className="text-gray-600 block text-xs">Frequência Respiratória</span>
                <p className="font-bold text-gray-900 text-base">{dadosPaciente.dados_vitais?.frequencia_respiratoria || '-'} irpm</p>
              </div>
              <div className="bg-white p-2 rounded">
                <span className="text-gray-600 block text-xs">Temperatura</span>
                <p className="font-bold text-gray-900 text-base">{dadosPaciente.dados_vitais?.temperatura || '-'} °C</p>
              </div>
              <div className="bg-white p-2 rounded">
                <span className="text-gray-600 block text-xs">SpO2</span>
                <p className="font-bold text-gray-900 text-base">{dadosPaciente.dados_vitais?.spo2 || '-'}%</p>
              </div>
              <div className="bg-white p-2 rounded">
                <span className="text-gray-600 block text-xs">Glicemia Capilar</span>
                <p className="font-bold text-gray-900 text-base">{dadosPaciente.dados_vitais?.glicemia_capilar || '-'} mg/dL</p>
              </div>
              <div className="bg-white p-2 rounded">
                <span className="text-gray-600 block text-xs">Diabetes</span>
                <Badge className={dadosPaciente.dados_vitais?.diabetes ? "bg-orange-500" : "bg-gray-400"}>
                  {dadosPaciente.dados_vitais?.diabetes ? 'SIM' : 'NÃO'}
                </Badge>
              </div>
              <div className="bg-white p-2 rounded">
                <span className="text-gray-600 block text-xs">DPOC</span>
                <Badge className={dadosPaciente.dados_vitais?.dpoc ? "bg-orange-500" : "bg-gray-400"}>
                  {dadosPaciente.dados_vitais?.dpoc ? 'SIM' : 'NÃO'}
                </Badge>
              </div>
            </div>

            {/* TEMPO TRIAGEM-ECG */}
            {dadosPaciente.tempo_triagem_ecg_minutos !== undefined && (
              <div className={`mt-4 p-3 rounded border-2 ${dadosPaciente.tempo_triagem_ecg_minutos <= 10 ? 'bg-green-100 border-green-400' : 'bg-orange-100 border-orange-400'}`}>
                <p className="font-bold text-sm">
                  <span>⏱️ Tempo Triagem → ECG:</span>{' '}
                  <span className={`text-lg ${dadosPaciente.tempo_triagem_ecg_minutos <= 10 ? 'text-green-700' : 'text-orange-700'}`}>
                    {dadosPaciente.tempo_triagem_ecg_minutos} minutos
                  </span>
                  {dadosPaciente.tempo_triagem_ecg_minutos <= 10 ? ' ✓ Dentro da meta' : ' ⚠️ Acima da meta de 10 minutos'}
                </p>
                {dadosPaciente.data_hora_inicio_triagem && dadosPaciente.data_hora_ecg && (
                  <div className="text-xs text-gray-700 mt-2">
                    <p>• Hora da Triagem: <strong>{format(new Date(dadosPaciente.data_hora_inicio_triagem), "HH:mm", { locale: ptBR })}</strong></p>
                    <p>• Hora do ECG: <strong>{format(new Date(dadosPaciente.data_hora_ecg), "HH:mm", { locale: ptBR })}</strong></p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ========== ECG E ANÁLISE ========== */}
          {dadosPaciente.ecg_files && dadosPaciente.ecg_files.length > 0 && (
            <div className="border-l-4 border-l-purple-500 pl-4 bg-purple-50 p-4 rounded">
              <h4 className="font-bold text-purple-900 mb-3 text-lg flex items-center gap-2">
                <FileImage className="w-5 h-5" />
                📊 ECGs Anexados ({dadosPaciente.ecg_files.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {dadosPaciente.ecg_files.map((url, index) => (
                  <div key={index} className="border-2 border-purple-200 rounded overflow-hidden bg-white shadow">
                    <img 
                      src={url} 
                      alt={`ECG ${index + 1}`} 
                      className="w-full h-48 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(url, '_blank')}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const parent = e.target.closest('.border-2');
                        if (parent) {
                          const fallbackDiv = parent.querySelector('.fallback-link');
                          if (fallbackDiv) fallbackDiv.style.display = 'flex';
                        }
                      }}
                    />
                    <div className="fallback-link w-full h-48 items-center justify-center bg-gray-100 hidden">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline text-sm font-medium">
                        📄 Ver ECG {index + 1}
                      </a>
                    </div>
                    <div className="p-2 bg-purple-100 text-center">
                      <Badge className="bg-purple-600 text-white">ECG {index + 1}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              {dadosPaciente.analise_ecg_ia && (
                <div className="p-4 bg-white rounded border-2 border-purple-200 shadow-sm">
                  <p className="text-sm font-bold text-purple-900 mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    🤖 Análise do ECG por Inteligência Artificial:
                  </p>
                  <pre className="text-xs text-purple-800 whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-y-auto">
                    {dadosPaciente.analise_ecg_ia}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* ========== ETAPA 4: CLASSIFICAÇÃO DE RISCO ========== */}
          <div className="border-l-4 border-l-orange-500 pl-4 bg-orange-50 p-4 rounded">
            <h3 className="font-bold text-orange-900 mb-3 text-lg">4️⃣ CLASSIFICAÇÃO DE RISCO (Manchester)</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-white p-3 rounded">
                <span className="text-gray-700 font-semibold">Classificação:</span>
                {dadosPaciente.classificacao_risco?.cor && (
                  <Badge className={`${corClassificacao[dadosPaciente.classificacao_risco.cor]} border-2 font-bold text-lg px-4 py-2`}>
                    {dadosPaciente.classificacao_risco.cor}
                  </Badge>
                )}
              </div>
              <div className="bg-white p-3 rounded">
                <span className="text-gray-700 font-semibold block mb-1">Tempo máximo de atendimento:</span>
                <p className="font-bold text-gray-900 text-base">{dadosPaciente.classificacao_risco?.tempo_atendimento_max || '-'}</p>
              </div>
              {dadosPaciente.classificacao_risco?.discriminadores && (
                <div className="bg-white p-3 rounded">
                  <span className="text-gray-700 font-semibold block mb-2">Discriminadores identificados:</span>
                  <div className="space-y-1">
                    {dadosPaciente.classificacao_risco.discriminadores.map((disc, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-orange-600">•</span>
                        <span className="text-sm text-gray-800">{disc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========== ENFERMEIRO RESPONSÁVEL ========== */}
          <div className="border-l-4 border-l-teal-500 pl-4 bg-teal-50 p-4 rounded">
            <h4 className="font-bold text-teal-900 mb-3 text-base flex items-center gap-2">
              <User className="w-5 h-5" />
              👨‍⚕️ Enfermeiro(a) Responsável pela Triagem
            </h4>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="bg-white p-3 rounded">
                <span className="text-teal-700 font-semibold block mb-1">Nome:</span>
                <p className="font-bold text-teal-900 text-base">{dadosPaciente.enfermeiro_nome || '-'}</p>
              </div>
              <div className="bg-white p-3 rounded">
                <span className="text-teal-700 font-semibold block mb-1">COREN:</span>
                <p className="font-bold text-teal-900 text-base">{dadosPaciente.enfermeiro_coren || '-'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* FORMULÁRIO DE AVALIAÇÃO MÉDICA */}
      {/* ============================================ */}
      <div className="border-t-2 border-blue-600 pt-6 mt-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-blue-600" />
          Avaliação Clínica do Médico
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="medico_nome">Nome Completo do Médico *</Label>
            <Input
              id="medico_nome"
              value={medico.nome}
              onChange={(e) => setMedico({...medico, nome: e.target.value})}
              placeholder="Digite o nome completo"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="medico_crm">Número CRM *</Label>
            <Input
              id="medico_crm"
              value={medico.crm}
              onChange={(e) => setMedico({...medico, crm: e.target.value})}
              placeholder="Ex: 123456"
              required
            />
          </div>
        </div>

        <div className="space-y-2 mb-4 bg-yellow-50 p-4 rounded border border-yellow-200">
          <Label htmlFor="data_avaliacao" className="text-base font-semibold">Data e Hora da Avaliação</Label>
          <Input
            id="data_avaliacao"
            type="datetime-local"
            value={avaliacao.data_hora_avaliacao}
            readOnly
            disabled
            className="bg-gray-100 cursor-not-allowed text-base font-bold"
          />
          <p className="text-xs text-green-700 font-semibold flex items-center gap-1">
            ✓ Data/hora registrada automaticamente ao acessar esta etapa (não pode ser alterada)
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="antecedentes">Antecedentes Clínicos</Label>
            <Textarea
              id="antecedentes"
              placeholder="Histórico de doenças prévias, cirurgias, medicações em uso, alergias..."
              value={avaliacao.antecedentes}
              onChange={(e) => setAvaliacao({...avaliacao, antecedentes: e.target.value})}
              rows={4}
              className="resize-y"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quadro_atual">Quadro Clínico Atual *</Label>
            <Textarea
              id="quadro_atual"
              placeholder="Características da dor torácica, dispneia, sintomas associados..."
              value={avaliacao.quadro_atual}
              onChange={(e) => setAvaliacao({...avaliacao, quadro_atual: e.target.value})}
              rows={5}
              className="resize-y"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hipoteses">Hipóteses Diagnósticas *</Label>
            <Textarea
              id="hipoteses"
              placeholder="Diagnósticos diferenciais considerados (IAM, angina, dissecção de aorta, pericardite, TEP, etc.)"
              value={avaliacao.hipoteses_diagnosticas}
              onChange={(e) => setAvaliacao({...avaliacao, hipoteses_diagnosticas: e.target.value})}
              rows={4}
              className="resize-y"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações Adicionais</Label>
            <Textarea
              id="observacoes"
              placeholder="Outras informações relevantes, achados no exame físico, complicações..."
              value={avaliacao.observacoes}
              onChange={(e) => setAvaliacao({...avaliacao, observacoes: e.target.value})}
              rows={3}
              className="resize-y"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onAnterior}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button type="submit" className="bg-red-600 hover:bg-red-700">
          Próxima Etapa
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}