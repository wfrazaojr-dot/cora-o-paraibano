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

const corClassificacao = {
  "Vermelha": "bg-red-100 text-red-800 border-red-300",
  "Laranja": "bg-orange-100 text-orange-800 border-orange-300",
  "Amarela": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Verde": "bg-green-100 text-green-800 border-green-300",
  "Azul": "bg-blue-100 text-blue-800 border-blue-300"
};

export default function Etapa5AvaliacaoMedica({ dadosPaciente, onProxima, onAnterior }) {
  const [avaliacao, setAvaliacao] = useState(() => {
    // Se já existe avaliação salva, usa ela
    if (dadosPaciente.avaliacao_medica && dadosPaciente.avaliacao_medica.data_hora_avaliacao) {
      return dadosPaciente.avaliacao_medica;
    }
    // Se não existe, cria nova com data/hora ATUAL
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

  // Atualiza a data/hora sempre que o componente é montado e não há avaliação prévia
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Avaliação Médica</h2>
        <p className="text-gray-600">Registro da avaliação clínica e diagnósticos</p>
      </div>

      {/* RESUMO DA TRIAGEM DE ENFERMAGEM */}
      <Card className="shadow-lg border-l-4 border-l-blue-600">
        <CardHeader className="bg-blue-50 border-b">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <User className="w-5 h-5" />
            Resumo da Triagem de Enfermagem
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          {/* TRIAGEM CARDIOLÓGICA */}
          <div className="border-l-4 border-l-red-500 pl-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Triagem Cardiológica (SBC 2025)
            </h4>
            {dadosPaciente.triagem_cardiologica?.alerta_iam && (
              <div className="mb-3 p-3 bg-red-100 border border-red-300 rounded">
                <p className="text-red-900 font-bold">⚠️ ALERTA DE PROVÁVEL IAM DETECTADO</p>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Dor/desconforto no peito:</span>
                <span className={`font-semibold ${dadosPaciente.triagem_cardiologica?.dor_desconforto_peito ? 'text-red-600' : 'text-green-600'}`}>
                  {dadosPaciente.triagem_cardiologica?.dor_desconforto_peito ? 'SIM' : 'NÃO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Duração {'>'} 10 minutos:</span>
                <span className={`font-semibold ${dadosPaciente.triagem_cardiologica?.duracao_maior_10min ? 'text-red-600' : 'text-green-600'}`}>
                  {dadosPaciente.triagem_cardiologica?.duracao_maior_10min ? 'SIM' : 'NÃO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Irradiação (braços/mandíbula):</span>
                <span className={`font-semibold ${dadosPaciente.triagem_cardiologica?.irradiacao ? 'text-red-600' : 'text-green-600'}`}>
                  {dadosPaciente.triagem_cardiologica?.irradiacao ? 'SIM' : 'NÃO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Dor epigástrica:</span>
                <span className={`font-semibold ${dadosPaciente.triagem_cardiologica?.dor_epigastrica ? 'text-red-600' : 'text-green-600'}`}>
                  {dadosPaciente.triagem_cardiologica?.dor_epigastrica ? 'SIM' : 'NÃO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Dispneia/diaforese:</span>
                <span className={`font-semibold ${dadosPaciente.triagem_cardiologica?.dispneia_diaforese ? 'text-red-600' : 'text-green-600'}`}>
                  {dadosPaciente.triagem_cardiologica?.dispneia_diaforese ? 'SIM' : 'NÃO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">{'>'}50 anos/diabetes/DCV:</span>
                <span className={`font-semibold ${dadosPaciente.triagem_cardiologica?.idade_fatores_risco ? 'text-red-600' : 'text-green-600'}`}>
                  {dadosPaciente.triagem_cardiologica?.idade_fatores_risco ? 'SIM' : 'NÃO'}
                </span>
              </div>
            </div>
          </div>

          {/* DADOS VITAIS */}
          <div className="border-l-4 border-l-green-500 pl-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-green-600" />
              Dados Vitais
            </h4>
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-gray-600">PA Esquerdo:</span>
                <p className="font-medium">{dadosPaciente.dados_vitais?.pa_braco_esquerdo || '-'} mmHg</p>
              </div>
              <div>
                <span className="text-gray-600">PA Direito:</span>
                <p className="font-medium">{dadosPaciente.dados_vitais?.pa_braco_direito || '-'} mmHg</p>
              </div>
              <div>
                <span className="text-gray-600">FC:</span>
                <p className="font-medium">{dadosPaciente.dados_vitais?.frequencia_cardiaca || '-'} bpm</p>
              </div>
              <div>
                <span className="text-gray-600">FR:</span>
                <p className="font-medium">{dadosPaciente.dados_vitais?.frequencia_respiratoria || '-'} irpm</p>
              </div>
              <div>
                <span className="text-gray-600">Temperatura:</span>
                <p className="font-medium">{dadosPaciente.dados_vitais?.temperatura || '-'} °C</p>
              </div>
              <div>
                <span className="text-gray-600">SpO2:</span>
                <p className="font-medium">{dadosPaciente.dados_vitais?.spo2 || '-'}%</p>
              </div>
              <div>
                <span className="text-gray-600">Glicemia:</span>
                <p className="font-medium">{dadosPaciente.dados_vitais?.glicemia_capilar || '-'} mg/dL</p>
              </div>
              <div>
                <span className="text-gray-600">Diabetes:</span>
                <p className="font-medium">{dadosPaciente.dados_vitais?.diabetes ? 'SIM' : 'NÃO'}</p>
              </div>
              <div>
                <span className="text-gray-600">DPOC:</span>
                <p className="font-medium">{dadosPaciente.dados_vitais?.dpoc ? 'SIM' : 'NÃO'}</p>
              </div>
            </div>
          </div>

          {/* CLASSIFICAÇÃO DE RISCO */}
          <div className="border-l-4 border-l-orange-500 pl-4">
            <h4 className="font-semibold text-gray-900 mb-3">Classificação de Risco (Manchester)</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-gray-700 text-sm">Classificação:</span>
                {dadosPaciente.classificacao_risco?.cor && (
                  <Badge className={`${corClassificacao[dadosPaciente.classificacao_risco.cor]} border font-semibold text-base px-4 py-1`}>
                    {dadosPaciente.classificacao_risco.cor}
                  </Badge>
                )}
              </div>
              <div className="text-sm">
                <span className="text-gray-700">Tempo máximo de atendimento:</span>
                <p className="font-medium">{dadosPaciente.classificacao_risco?.tempo_atendimento_max || '-'}</p>
              </div>
              {dadosPaciente.classificacao_risco?.discriminadores && (
                <div className="text-sm">
                  <span className="text-gray-700">Discriminadores identificados:</span>
                  <p className="font-medium">{dadosPaciente.classificacao_risco.discriminadores.join(", ")}</p>
                </div>
              )}
            </div>
          </div>

          {/* DADOS DO ENFERMEIRO */}
          <div className="border-l-4 border-l-purple-500 pl-4 bg-purple-50 p-3 rounded">
            <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Enfermeiro(a) Responsável pela Triagem
            </h4>
            <div className="text-sm space-y-1">
              <div>
                <span className="text-purple-700">Nome:</span>
                <p className="font-medium text-purple-900">{dadosPaciente.enfermeiro_nome || '-'}</p>
              </div>
              <div>
                <span className="text-purple-700">COREN:</span>
                <p className="font-medium text-purple-900">{dadosPaciente.enfermeiro_coren || '-'}</p>
              </div>
            </div>
          </div>

          {/* TEMPO TRIAGEM-ECG */}
          {dadosPaciente.tempo_triagem_ecg_minutos !== undefined && (
            <div className={`p-3 rounded border ${dadosPaciente.tempo_triagem_ecg_minutos <= 10 ? 'bg-green-50 border-green-300' : 'bg-orange-50 border-orange-300'}`}>
              <p className="text-sm">
                <span className="font-semibold">Tempo Triagem → ECG:</span>{' '}
                <span className={`font-bold ${dadosPaciente.tempo_triagem_ecg_minutos <= 10 ? 'text-green-700' : 'text-orange-700'}`}>
                  {dadosPaciente.tempo_triagem_ecg_minutos} minutos
                </span>
                {dadosPaciente.tempo_triagem_ecg_minutos <= 10 ? ' ✓ Dentro da meta' : ' ⚠️ Acima da meta de 10 minutos'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ECG E ANÁLISE DE IA */}
      {dadosPaciente.ecg_files && dadosPaciente.ecg_files.length > 0 && (
        <div className="border-l-4 border-l-blue-600 bg-blue-50 p-4 rounded">
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <FileImage className="w-5 h-5" />
            ECGs do Paciente
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {dadosPaciente.ecg_files.map((url, index) => (
              <div key={index} className="border rounded overflow-hidden bg-white">
                <img 
                  src={url} 
                  alt={`ECG ${index + 1}`} 
                  className="w-full h-48 object-contain cursor-pointer hover:opacity-80"
                  onClick={() => window.open(url, '_blank')}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const parent = e.target.closest('.border');
                    if (parent) {
                      const fallbackDiv = parent.querySelector('.fallback-link');
                      if (fallbackDiv) fallbackDiv.style.display = 'flex';
                    }
                  }}
                />
                <div className="fallback-link w-full h-48 items-center justify-center bg-gray-100 hidden">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                    Ver ECG {index + 1}
                  </a>
                </div>
              </div>
            ))}
          </div>
          {dadosPaciente.analise_ecg_ia && (
            <div className="p-4 bg-white rounded border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Análise do ECG por Inteligência Artificial:
              </p>
              <pre className="text-sm text-blue-800 whitespace-pre-wrap font-sans">{dadosPaciente.analise_ecg_ia}</pre>
            </div>
          )}
        </div>
      )}

      {/* FORMULÁRIO DE AVALIAÇÃO MÉDICA */}
      <div className="border-t-2 pt-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Avaliação Clínica do Médico</h3>
        
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

        <div className="space-y-2 mb-4">
          <Label htmlFor="data_avaliacao">Data e Hora da Avaliação</Label>
          <Input
            id="data_avaliacao"
            type="datetime-local"
            value={avaliacao.data_hora_avaliacao}
            readOnly
            disabled
            className="bg-gray-100 cursor-not-allowed"
          />
          <p className="text-xs text-green-600 font-medium">
            ✓ Data/hora registrada automaticamente ao acessar esta etapa (não pode ser alterada)
          </p>
        </div>

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