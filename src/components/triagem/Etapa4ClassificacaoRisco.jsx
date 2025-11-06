
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, FileImage, Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const discriminadores = {
  vermelha: [
    "Alteração do Nível de Consciência",
    "Obstrução das Vias Aéreas",
    "SpO2 ≤ 89% em ar ambiente",
    "PAS ≤ 80 mmHg",
    "FC ≥ 140 bpm",
    "FC ≤ 40 bpm",
    "Diaforese (palidez, sudorese fria)"
  ],
  laranja: [
    "Alerta de Provável IAM (triagem cardiológica)",
    "Dispneia com SpO2 ≥ 90% e ≤ 94% em ar ambiente",
    "PAS ≥ 160 e/ou PAD ≥ 110 mmHg",
    "PA ≥ 140/90 mmHg com cefaleia, epigastralgia ou alterações visuais",
    "Dor torácica intensa (7 a 10 pontos)",
    "Início agudo de dor após trauma",
    "Portador de doença falciforme"
  ],
  amarela: [
    "Dispneia moderada (mas consegue falar frases mais longas)",
    "PAS de 140-159 e/ou PAD de 90-109 mmHg, assintomática",
    "Dor torácica moderada (4 a 6 pontos)",
    "Edema unilateral de MMII ou dor na panturrilha",
    "Febre com Tax: 38º C a 39,9º C",
    "Dor de garganta com placas"
  ],
  verde: [
    "Obstrução nasal com secreção amarelada",
    "Dor de garganta sem outras alterações",
    "Tosse produtiva, persistente",
    "Febre Tax: 37,9º C",
    "PAS ≤ 139 mmHg e PAD ≤ 89 mmHg"
  ],
  azul: [
    "Sintomas a mais de 7 dias"
  ]
};

const temposAtendimento = {
  "Vermelha": "Atendimento imediato",
  "Laranja": "Aguardar até 10 minutos",
  "Amarela": "Aguardar até 60 minutos",
  "Verde": "Aguardar até 120 minutos",
  "Azul": "Aguardar até 240 minutos"
};

// Função para extrair PA sistólica e diastólica
const extrairPA = (paString) => {
  if (!paString) return { sistolica: null, diastolica: null };
  const partes = paString.split("/");
  return {
    sistolica: partes[0] ? parseFloat(partes[0].trim()) : null,
    diastolica: partes[1] ? parseFloat(partes[1].trim()) : null
  };
};

// Função para identificar discriminadores automaticamente baseado nos dados vitais
const identificarDiscriminadoresAutomaticos = (dadosPaciente) => {
  const discriminadoresAuto = [];
  const vitais = dadosPaciente.dados_vitais || {};
  const triagem = dadosPaciente.triagem_cardiologica || {};

  const paEsq = extrairPA(vitais.pa_braco_esquerdo);
  const paDir = extrairPA(vitais.pa_braco_direito);

  const pasSistolica = Math.max(
    paEsq.sistolica || 0,
    paDir.sistolica || 0
  );

  const pasDiastolica = Math.max(
    paEsq.diastolica || 0,
    paDir.diastolica || 0
  );

  // VERMELHA: SpO2 ≤ 89%
  if (vitais.spo2 !== null && vitais.spo2 <= 89) {
    discriminadoresAuto.push("SpO2 ≤ 89% em ar ambiente");
  }

  // VERMELHA: PAS ≤ 80 mmHg
  if (pasSistolica > 0 && pasSistolica <= 80) {
    discriminadoresAuto.push("PAS ≤ 80 mmHg");
  }

  // VERMELHA: FC ≥ 140 bpm
  if (vitais.frequencia_cardiaca !== null && vitais.frequencia_cardiaca >= 140) {
    discriminadoresAuto.push("FC ≥ 140 bpm");
  }

  // VERMELHA: FC ≤ 40 bpm
  if (vitais.frequencia_cardiaca !== null && vitais.frequencia_cardiaca <= 40) {
    discriminadoresAuto.push("FC ≤ 40 bpm");
  }

  // LARANJA: Alerta de Provável IAM
  if (triagem.alerta_iam) {
    discriminadoresAuto.push("Alerta de Provável IAM (triagem cardiológica)");
  }

  // LARANJA: Dispneia com SpO2 ≥ 90% e ≤ 94%
  // Assuming "Dispneia" is implied if SpO2 is in this range and not already in red, or is explicitly flagged elsewhere.
  // For auto-detection based purely on vitals, we'll check SpO2 range.
  if (vitais.spo2 !== null && vitais.spo2 >= 90 && vitais.spo2 <= 94) {
    discriminadoresAuto.push("Dispneia com SpO2 ≥ 90% e ≤ 94% em ar ambiente");
  }

  // LARANJA: PAS ≥ 160 e/ou PAD ≥ 110
  if (pasSistolica >= 160 || pasDiastolica >= 110) {
    discriminadoresAuto.push("PAS ≥ 160 e/ou PAD ≥ 110 mmHg");
  }

  // AMARELA: PAS de 140-159 e/ou PAD de 90-109
  if ((pasSistolica >= 140 && pasSistolica <= 159) || (pasDiastolica >= 90 && pasDiastolica <= 109)) {
    discriminadoresAuto.push("PAS de 140-159 e/ou PAD de 90-109 mmHg, assintomática");
  }

  // AMARELA: Febre com Tax: 38º C a 39,9º C
  if (vitais.temperatura !== null && vitais.temperatura >= 38 && vitais.temperatura <= 39.9) {
    discriminadoresAuto.push("Febre com Tax: 38º C a 39,9º C");
  }

  // VERDE: Febre Tax: 37,9º C
  if (vitais.temperatura !== null && vitais.temperatura >= 37 && vitais.temperatura <= 37.9) {
    discriminadoresAuto.push("Febre Tax: 37,9º C");
  }

  // VERDE: PA normal (PAS ≤ 139 mmHg e PAD ≤ 89 mmHg)
  if (pasSistolica > 0 && pasSistolica <= 139 && pasDiastolica > 0 && pasDiastolica <= 89) {
    discriminadoresAuto.push("PAS ≤ 139 mmHg e PAD ≤ 89 mmHg");
  }

  return discriminadoresAuto;
};

export default function Etapa4ClassificacaoRisco({ dadosPaciente, onProxima, onAnterior }) {
  const [discriminadoresSelecionados, setDiscriminadoresSelecionados] = useState([]);
  const [classificacao, setClassificacao] = useState(dadosPaciente.classificacao_risco || null);
  const [analisandoIA, setAnalisandoIA] = useState(false);
  const [sugestaoIA, setSugestaoIA] = useState(null);

  // Análise automática ao entrar na etapa
  useEffect(() => {
    // Identificar discriminadores automáticos baseados nos dados vitais
    const discAuto = identificarDiscriminadoresAutomaticos(dadosPaciente);

    // Se já existe classificação salva, usar os discriminadores salvos
    if (dadosPaciente.classificacao_risco?.discriminadores) {
      setDiscriminadoresSelecionados(dadosPaciente.classificacao_risco.discriminadores);
    } else if (discAuto.length > 0) {
      // Caso contrário, usar os identificados automaticamente
      setDiscriminadoresSelecionados(discAuto);
    }

    // Executar análise da IA
    if (!sugestaoIA && !analisandoIA) {
      analisarComIA();
    }
  }, []);

  const analisarComIA = async () => {
    setAnalisandoIA(true);

    try {
      // Preparar dados para análise
      const dadosAnalise = {
        idade: dadosPaciente.idade,
        sexo: dadosPaciente.sexo,
        triagem_cardiologica: dadosPaciente.triagem_cardiologica,
        dados_vitais: dadosPaciente.dados_vitais,
        tempo_sintomas: dadosPaciente.data_hora_inicio_sintomas
      };

      const schema = {
        type: "object",
        properties: {
          classificacao_sugerida: {
            type: "string",
            enum: ["Vermelha", "Laranja", "Amarela", "Verde", "Azul"],
            description: "Classificação de risco sugerida pelo Sistema Manchester"
          },
          discriminadores_identificados: {
            type: "array",
            items: { type: "string" },
            description: "Lista de discriminadores identificados automaticamente baseado nos dados"
          },
          justificativa: { // Ensuring 'justificativa' is present as it's used in UI and expected by prompt
            type: "string",
            description: "Justificativa clara e detalhada para a classificação sugerida, citando dados específicos"
          },
          nivel_confianca: {
            type: "string",
            enum: ["Alta", "Média", "Baixa"],
            description: "Nível de confiança na classificação sugerida"
          },
          alertas_criticos: {
            type: "array",
            items: { type: "string" },
            description: "Alertas críticos que requerem atenção imediata"
          },
          proximos_passos: {
            type: "array",
            items: { type: "string" },
            description: "Próximos passos recomendados para a equipe médica"
          },
          tempo_atendimento_recomendado: {
            type: "string",
            description: "Tempo máximo recomendado para iniciar atendimento"
          }
        }
      };

      const triagem = dadosAnalise.triagem_cardiologica || {};

      const prompt = `
Você é um sistema especialista em triagem de emergência usando o Protocolo Manchester e diretrizes da SBC 2025 para dor torácica.

DADOS DO PACIENTE:
- Idade: ${dadosAnalise.idade} anos
- Sexo: ${dadosAnalise.sexo}

TRIAGEM CARDIOLÓGICA:
${dadosAnalise.triagem_cardiologica ? `
- Dor/desconforto no peito: ${triagem.dor_desconforto_peito ? 'SIM' : 'NÃO'}
- Duração > 10 min: ${triagem.duracao_maior_10min ? 'SIM' : 'NÃO'}
- Irradiação: ${triagem.irradiacao ? 'SIM' : 'NÃO'}
- Dor epigástrica: ${triagem.dor_epigastrica ? 'SIM' : 'NÃO'}
- Dispneia/diaforese: ${triagem.dispneia_diaforese ? 'SIM' : 'NÃO'}
- >50 anos/diabetes/DCV: ${triagem.idade_fatores_risco ? 'SIM' : 'NÃO'}
- ALERTA IAM: ${triagem.alerta_iam ? 'SIM ⚠️' : 'NÃO'}
` : 'Não disponível'}

DADOS VITAIS:
${dadosAnalise.dados_vitais ? `
- PA Esquerdo: ${dadosAnalise.dados_vitais.pa_braco_esquerdo || 'N/A'}
- PA Direito: ${dadosAnalise.dados_vitais.pa_braco_direito || 'N/A'}
- FC: ${dadosAnalise.dados_vitais.frequencia_cardiaca || 'N/A'} bpm
- FR: ${dadosAnalise.dados_vitais.frequencia_respiratoria || 'N/A'} irpm
- Temperatura: ${dadosAnalise.dados_vitais.temperatura || 'N/A'} °C
- SpO2: ${dadosAnalise.dados_vitais.spo2 || 'N/A'}%
- Glicemia: ${dadosAnalise.dados_vitais.glicemia_capilar || 'N/A'} mg/dL
- Diabetes: ${dadosAnalise.dados_vitais.diabetes ? 'SIM' : 'NÃO'}
- DPOC: ${dadosAnalise.dados_vitais.dpoc ? 'SIM' : 'NÃO'}
` : 'Não disponível'}

PROTOCOLO MANCHESTER - CRITÉRIOS DETALHADOS:

VERMELHA (Ameaça à vida - Atendimento IMEDIATO):
- Alteração do Nível de Consciência
- Obstrução das Vias Aéreas
- SpO2 ≤ 89% em ar ambiente
- PAS ≤ 80 mmHg
- FC ≥ 140 bpm
- FC ≤ 40 bpm
- Diaforese (palidez, sudorese fria)

LARANJA (Muito urgente - até 10 minutos):
- Alerta de Provável IAM (qualquer SIM na triagem cardiológica)
- Dispneia com SpO2 ≥ 90% e ≤ 94% em ar ambiente
- PAS ≥ 160 e/ou PAD ≥ 110 mmHg
- PA ≥ 140/90 mmHg com cefaleia, epigastralgia ou alterações visuais
- Dor torácica intensa (7 a 10 pontos)
- Início agudo de dor após trauma
- Portador de doença falciforme

AMARELA (Urgente - até 60 minutos):
- Dispneia moderada (mas consegue falar frases mais longas)
- PAS de 140-159 e/ou PAD de 90-109 mmHg, assintomática
- Dor torácica moderada (4 a 6 pontos)
- Edema unilateral de MMII ou dor na panturrilha
- Febre com Tax: 38º C a 39,9º C
- Dor de garganta com placas

VERDE (Pouco urgente - até 120 minutos):
- Obstrução nasal com secreção amarelada
- Dor de garganta sem outras alterações
- Tosse produtiva, persistente
- Febre Tax: 37,9º C
- PAS ≤ 139 mmHg e PAD ≤ 89 mmHg

AZUL (Não urgente - até 240 minutos):
- Sintomas a mais de 7 dias

REGRAS DE CLASSIFICAÇÃO:
1. Se QUALQUER critério de VERMELHA estiver presente, a classificação final é VERMELHA.
2. Se "Alerta de Provável IAM" estiver presente, a classificação final é NO MÍNIMO LARANJA.
3. A classificação é determinada pelo discriminador de maior gravidade encontrado.
4. Analise TODOS os dados vitais cuidadosamente.
5. Seja conservador - na dúvida, classifique para cima.
6. Liste discriminadores específicos baseados nos DADOS REAIS do paciente.
7. Forneça justificativa clara e detalhada para a classificação sugerida, citando dados específicos.
8. Calcule o tempo de atendimento recomendado com base na classificação final.

Analise e retorne a classificação de risco adequada com justificativa detalhada e outros campos solicitados.
`;

      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: schema
      });

      if (resultado) {
        setSugestaoIA(resultado);

        // Mesclar discriminadores da IA com os já identificados automaticamente
        if (resultado.discriminadores_identificados && resultado.discriminadores_identificados.length > 0) {
          const discAuto = identificarDiscriminadoresAutomaticos(dadosPaciente);
          const todosDisc = [...new Set([...discAuto, ...resultado.discriminadores_identificados])];
          setDiscriminadoresSelecionados(todosDisc);
        }
      }

    } catch (error) {
      console.error("Erro na análise por IA:", error);
    }

    setAnalisandoIA(false);
  };

  useEffect(() => {
    if (discriminadoresSelecionados.length > 0) {
      let cor = "Azul"; // Default lowest classification

      // Check for Red discriminators first
      if (discriminadoresSelecionados.some(d => discriminadores.vermelha.includes(d))) {
        cor = "Vermelha";
      } else if (discriminadoresSelecionados.some(d => discriminadores.laranja.includes(d))) {
        cor = "Laranja";
      } else if (discriminadoresSelecionados.some(d => discriminadores.amarela.includes(d))) {
        cor = "Amarela";
      } else if (discriminadoresSelecionados.some(d => discriminadores.verde.includes(d))) {
        cor = "Verde";
      }

      // Special rule: if "Alerta de Provável IAM" is present, min classification is Laranja
      if (dadosPaciente.triagem_cardiologica?.alerta_iam && (cor === "Azul" || cor === "Verde" || cor === "Amarela")) {
        cor = "Laranja";
      }

      setClassificacao({
        cor,
        tempo_atendimento_max: temposAtendimento[cor],
        discriminadores: discriminadoresSelecionados
      });
    } else {
      setClassificacao(null);
    }
  }, [discriminadoresSelecionados, dadosPaciente.triagem_cardiologica?.alerta_iam]);

  const toggleDiscriminador = (discriminador) => {
    if (discriminador === "Alerta de Provável IAM (triagem cardiológica)" && dadosPaciente.triagem_cardiologica?.alerta_iam) {
      // If IAM alert is true, this discriminator should always be selected and disabled for manual change
      return;
    }

    if (discriminadoresSelecionados.includes(discriminador)) {
      setDiscriminadoresSelecionados(discriminadoresSelecionados.filter(d => d !== discriminador));
    } else {
      setDiscriminadoresSelecionados([...discriminadoresSelecionados, discriminador]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Preparar dados para salvar
    const dadosParaSalvar = {
      classificacao_risco: classificacao,
      sugestao_ia_classificacao: sugestaoIA
    };

    onProxima(dadosParaSalvar);
  };

  const corClassificacao = {
    "Vermelha": "bg-red-600",
    "Laranja": "bg-orange-600",
    "Amarela": "bg-yellow-500",
    "Verde": "bg-green-600",
    "Azul": "bg-blue-600"
  };

  const corBadge = {
    "Vermelha": "bg-red-100 text-red-800 border-red-300",
    "Laranja": "bg-orange-100 text-orange-800 border-orange-300",
    "Amarela": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "Verde": "bg-green-100 text-green-800 border-green-300",
    "Azul": "bg-blue-100 text-blue-800 border-blue-300"
  };

  // Exibir resumo dos dados vitais cadastrados
  const vitais = dadosPaciente.dados_vitais || {};
  const paEsq = extrairPA(vitais.pa_braco_esquerdo);
  const paDir = extrairPA(vitais.pa_braco_direito);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Classificação de Risco</h2>
        <p className="text-gray-600">Sistema Manchester com análise automatizada por IA</p>
      </div>

      {/* RESUMO DOS DADOS VITAIS */}
      <Card className="border-l-4 border-l-blue-600 shadow-md bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-blue-900">📊 Dados Vitais Cadastrados (Etapa 3)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-white p-3 rounded border">
              <p className="text-gray-600 text-xs mb-1">PA Esquerdo</p>
              <p className="font-bold text-gray-900">{vitais.pa_braco_esquerdo || '-'}</p>
              {paEsq.sistolica && (
                <p className="text-xs text-gray-600">({paEsq.sistolica}/{paEsq.diastolica})</p>
              )}
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-gray-600 text-xs mb-1">PA Direito</p>
              <p className="font-bold text-gray-900">{vitais.pa_braco_direito || '-'}</p>
              {paDir.sistolica && (
                <p className="text-xs text-gray-600">({paDir.sistolica}/{paDir.diastolica})</p>
              )}
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-gray-600 text-xs mb-1">SpO2</p>
              <p className="font-bold text-gray-900">{vitais.spo2 ? `${vitais.spo2}%` : '-'}</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-gray-600 text-xs mb-1">Temperatura</p>
              <p className="font-bold text-gray-900">{vitais.temperatura ? `${vitais.temperatura}°C` : '-'}</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-gray-600 text-xs mb-1">FC</p>
              <p className="font-bold text-gray-900">{vitais.frequencia_cardiaca ? `${vitais.frequencia_cardiaca} bpm` : '-'}</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-gray-600 text-xs mb-1">FR</p>
              <p className="font-bold text-gray-900">{vitais.frequencia_respiratoria ? `${vitais.frequencia_respiratoria} irpm` : '-'}</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-gray-600 text-xs mb-1">Glicemia</p>
              <p className="font-bold text-gray-900">{vitais.glicemia_capilar ? `${vitais.glicemia_capilar} mg/dL` : '-'}</p>
            </div>
          </div>
          <Alert className="mt-3 border-blue-400 bg-white">
            <AlertDescription className="text-blue-800 text-xs">
              ✓ Os discriminadores relacionados a estes valores foram <strong>automaticamente pré-marcados</strong> abaixo
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* SUGESTÃO AUTOMATIZADA DA IA */}
      {analisandoIA && (
        <Card className="border-l-4 border-l-purple-600 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
              <div>
                <p className="font-semibold text-purple-900">🤖 Análise Automática em Andamento...</p>
                <p className="text-sm text-purple-700">Analisando dados vitais, triagem cardiológica e histórico do paciente...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {sugestaoIA && !analisandoIA && (
        <Card className="border-l-4 border-l-purple-600 shadow-lg bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader className="pb-3 bg-purple-100 border-b border-purple-200">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Sparkles className="w-6 h-6" />
              🤖 Classificação Sugerida por IA
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Classificação Sugerida */}
            <div className="flex items-center gap-4 p-4 bg-white rounded-lg border-2 border-purple-200">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">Classificação Recomendada:</p>
                <Badge className={`${corBadge[sugestaoIA.classificacao_sugerida]} border-2 text-xl px-6 py-2 font-bold`}>
                  {sugestaoIA.classificacao_sugerida}
                </Badge>
                <p className="text-xs text-gray-600 mt-2">
                  {sugestaoIA.tempo_atendimento_recomendado}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Confiança:</p>
                <Badge className={`${
                  sugestaoIA.nivel_confianca === "Alta" ? "bg-green-100 text-green-800" :
                  sugestaoIA.nivel_confianca === "Média" ? "bg-yellow-100 text-yellow-800" :
                  "bg-orange-100 text-orange-800"
                } border font-semibold`}>
                  {sugestaoIA.nivel_confianca}
                </Badge>
              </div>
            </div>

            {/* Justificativa */}
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <p className="text-sm font-semibold text-purple-900 mb-2">📋 Justificativa:</p>
              <p className="text-sm text-gray-700 leading-relaxed">{sugestaoIA.justificativa}</p>
            </div>

            {/* Alertas Críticos */}
            {sugestaoIA.alertas_criticos && sugestaoIA.alertas_criticos.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
                <p className="text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
                  ⚠️ ALERTAS CRÍTICOS:
                </p>
                <ul className="space-y-1">
                  {sugestaoIA.alertas_criticos.map((alerta, idx) => (
                    <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span>{alerta}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Próximos Passos */}
            {sugestaoIA.proximos_passos && sugestaoIA.proximos_passos.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
                <p className="text-sm font-semibold text-blue-900 mb-2">🎯 Próximos Passos Recomendados:</p>
                <ol className="space-y-2">
                  {sugestaoIA.proximos_passos.map((passo, idx) => (
                    <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                      <span className="font-bold text-blue-600">{idx + 1}.</span>
                      <span>{passo}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Discriminadores Identificados */}
            {sugestaoIA.discriminadores_identificados && sugestaoIA.discriminadores_identificados.length > 0 && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm font-semibold text-purple-900 mb-2">✓ Discriminadores Identificados Automaticamente:</p>
                <div className="flex flex-wrap gap-2">
                  {sugestaoIA.discriminadores_identificados.map((disc, idx) => (
                    <Badge key={idx} variant="outline" className="bg-white border-purple-300 text-purple-800">
                      {disc}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Alert className="border-purple-500 bg-purple-50">
              <AlertDescription className="text-purple-800 text-xs">
                <strong>💡 Nota:</strong> Esta é uma sugestão automatizada. O enfermeiro pode ajustar a classificação conforme julgamento clínico,
                marcando ou desmarcando discriminadores abaixo.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* ECG PREVIEW */}
      {dadosPaciente.ecg_files && dadosPaciente.ecg_files.length > 0 && (
        <div className="border-l-4 border-l-blue-600 bg-blue-50 p-4 rounded">
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <FileImage className="w-5 h-5" />
            ECGs Anexados ({dadosPaciente.ecg_files.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {dadosPaciente.ecg_files.map((url, index) => (
              <div key={index} className="border rounded overflow-hidden bg-white">
                <img
                  src={url}
                  alt={`ECG ${index + 1}`}
                  className="w-full h-48 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex'; // Show fallback div
                  }}
                />
                {/* Fallback for broken image, display a link instead */}
                <div style={{ display: 'none' }} className="w-full h-48 flex items-center justify-center bg-gray-100 p-2 text-center">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                    Ver Imagem do ECG {index + 1}
                  </a>
                </div>
              </div>
            ))}
          </div>
          {dadosPaciente.analise_ecg_ia && (
            <div className="mt-4 p-3 bg-white rounded border border-blue-200">
              <p className="text-xs font-semibold text-blue-900 mb-1">Análise por IA:</p>
              <p className="text-xs text-blue-800 whitespace-pre-wrap">{dadosPaciente.analise_ecg_ia.substring(0, 300)}...</p>
            </div>
          )}
        </div>
      )}

      {dadosPaciente.triagem_cardiologica?.alerta_iam && (
        <Alert className="border-orange-500 bg-orange-50">
          <AlertDescription className="text-orange-800 font-semibold">
            ⚠️ Paciente com alerta de IAM - Classificação mínima: LARANJA
          </AlertDescription>
        </Alert>
      )}

      {/* DISCRIMINADORES MANUAIS */}
      <div className="border-t-2 border-gray-300 pt-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Confirmar ou Ajustar Discriminadores
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          ✓ Discriminadores baseados em dados vitais foram <strong>pré-marcados automaticamente</strong>. Você pode ajustá-los conforme necessário.
        </p>

        <div className="space-y-6">
          <div className="border-l-4 border-l-red-600 bg-red-50 p-4 rounded">
            <h3 className="font-bold text-red-900 mb-3">Discriminadores Vermelhos (Ameaçadores da Vida)</h3>
            <div className="space-y-2">
              {discriminadores.vermelha.map((disc, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Checkbox
                    id={`v-${i}`}
                    checked={discriminadoresSelecionados.includes(disc)}
                    onCheckedChange={() => toggleDiscriminador(disc)}
                  />
                  <Label htmlFor={`v-${i}`} className="cursor-pointer">{disc}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="border-l-4 border-l-orange-600 bg-orange-50 p-4 rounded">
            <h3 className="font-bold text-orange-900 mb-3">Discriminadores Laranja</h3>
            <div className="space-y-2">
              {discriminadores.laranja.map((disc, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Checkbox
                    id={`l-${i}`}
                    checked={discriminadoresSelecionados.includes(disc)}
                    onCheckedChange={() => toggleDiscriminador(disc)}
                    disabled={disc === "Alerta de Provável IAM (triagem cardiológica)" && dadosPaciente.triagem_cardiologica?.alerta_iam}
                  />
                  <Label htmlFor={`l-${i}`} className="cursor-pointer">{disc}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="border-l-4 border-l-yellow-500 bg-yellow-50 p-4 rounded">
            <h3 className="font-bold text-yellow-900 mb-3">Discriminadores Amarelos</h3>
            <div className="space-y-2">
              {discriminadores.amarela.map((disc, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Checkbox
                    id={`a-${i}`}
                    checked={discriminadoresSelecionados.includes(disc)}
                    onCheckedChange={() => toggleDiscriminador(disc)}
                  />
                  <Label htmlFor={`a-${i}`} className="cursor-pointer">{disc}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="border-l-4 border-l-green-600 bg-green-50 p-4 rounded">
            <h3 className="font-bold text-green-900 mb-3">Discriminadores Verdes</h3>
            <div className="space-y-2">
              {discriminadores.verde.map((disc, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Checkbox
                    id={`g-${i}`}
                    checked={discriminadoresSelecionados.includes(disc)}
                    onCheckedChange={() => toggleDiscriminador(disc)}
                  />
                  <Label htmlFor={`g-${i}`} className="cursor-pointer">{disc}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="border-l-4 border-l-blue-600 bg-blue-50 p-4 rounded">
            <h3 className="font-bold text-blue-900 mb-3">Discriminadores Azuis</h3>
            <div className="space-y-2">
              {discriminadores.azul.map((disc, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Checkbox
                    id={`b-${i}`}
                    checked={discriminadoresSelecionados.includes(disc)}
                    onCheckedChange={() => toggleDiscriminador(disc)}
                  />
                  <Label htmlFor={`b-${i}`} className="cursor-pointer">{disc}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CLASSIFICAÇÃO FINAL */}
      {classificacao && (
        <div className="border-2 border-gray-300 rounded-lg p-6 bg-white">
          <h3 className="font-bold text-lg mb-4">Classificação Final Determinada:</h3>
          <div className="flex items-center gap-4 mb-4">
            <Badge className={`${corClassificacao[classificacao.cor]} text-white text-lg px-6 py-2`}>
              {classificacao.cor}
            </Badge>
            <span className="font-medium">{classificacao.tempo_atendimento_max}</span>
          </div>
          <p className="text-sm text-gray-600">Discriminadores: {classificacao.discriminadores.join(", ")}</p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onAnterior}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button
          type="submit"
          className="bg-red-600 hover:bg-red-700"
          disabled={!classificacao}
        >
          Próxima Etapa
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}
