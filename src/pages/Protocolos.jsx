import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Activity, Truck, AlertTriangle } from "lucide-react";

export default function Protocolos() {
  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Protocolo de Dor Torácica - Coração Paraibano 2026</h1>
          <p className="text-gray-600 font-semibold mb-2">Resumo Clínico</p>
          <p className="text-sm text-gray-700 mb-3">
            Documento institucional da Secretaria de Estado da Saúde, para orientação teórica e prática a Médicos e Equipe Multiprofissional na abordagem dos pacientes com início agudo de sintomas sugestivos de Síndrome Coronária Aguda (SCA).
          </p>
        </div>

        <div className="space-y-6">
          {/* INDICAÇÃO */}
          <Card className="shadow-md">
            <CardHeader className="bg-red-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-600" />
                Indicação
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  Protocolo indicado para pacientes com origem domiciliar, atendidos em Serviços de Saúde, que tenham história de dor torácica (ou sintoma equivalente). Para abertura do Protocolo, o paciente deve apresentar <strong>"Dor torácica aguda"</strong>, de origem não traumática, ou sintoma equivalente em repouso, ou originalmente ao esforço, mas que não melhorou após 10 minutos de repouso, e que motivou prontoatendimento (habitualmente sintoma presente nas últimas 24 horas mesmo que ausente na admissão).
                </p>
                <p>
                  Além dos casos que apresentam critérios objetivos identificados no atendimento de enfermagem, também fazem parte deste Protocolo: Pacientes em Parada Cardiorrespiratória (PCR) na admissão; Pacientes que, após avaliação médica, apresentem suspeita diagnóstica de condições que possam ser confundidas com Síndrome Coronária Aguda (SCA), sendo nesta última condição, necessária uma avaliação criteriosa para evitar o desvio de fluxo adequado em situações de diagnósticos diferenciais como INJÚRIA MIOCÁRDICA EM PACIENTE CRÍTICO, MIOPERICARDITE, INSUFICIÊNCIA CARDÍACA DESCOMPENSADA e ESTENOSE AÓRTICA SINTOMÁTICA.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* OBJETIVOS */}
          <Card className="shadow-md">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle>Objetivos do Protocolo de Dor Torácica</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900">1. Identificação Precoce de Pacientes com SCA</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Triagem de qualidade</li>
                    <li>ECG em até 10 minutos – analisado pelo médico plantonista (munido de treinamento adequado para interpretação do ECG e identificação de padrões eletrocardiográficos sugestivos de isquemia)</li>
                    <li>Seriar marcadores conforme indicado, idealmente com troponina quantitativa (para observação de realização de curva típica de SCA)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900">2. Salvar Vida e Reduzir Necrose Miocárdica</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Check-list do Tratamento Medicamentoso inicial</li>
                    <li><strong>SCACST:</strong> Fluxo para porta-balão até 60 minutos se hemodinâmica disponível ou Transferência rápida (120-150 minutos) para hospital com hemodinâmica disponível</li>
                    <li>Trombólise precoce em casos em que tal tempo não possa ser respeitado</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900">3. Evitar Altas Inadvertidas e Internações Desnecessárias</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>ECG e Troponina</li>
                    <li>Contato via telemedicina para discussão clínica</li>
                    <li>Fluxo para investigação ambulatorial precoce nos casos sem diagnóstico e risco não-elevado</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SÍNDROME CORONARIANA AGUDA */}
          <Card className="shadow-md">
            <CardHeader className="bg-red-50 border-b">
              <CardTitle>Síndrome Coronariana Aguda (SCA)</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-gray-700 mb-4">
                A SCA representa o espectro de manifestações Clínicas e Laboratoriais da Isquemia Miocárdica Aguda, e é composta pela Angina Instável (AI), e pelo Infarto Agudo do Miocárdio (IAM) com ou sem elevação do segmento ST (atualmente com uma proposta de denominação de OCA (Oclusão de Coronária Aguda) e NOCA (Não Oclusão de Coronária Aguda), respectivamente).
              </p>
            </CardContent>
          </Card>

          {/* AVALIAÇÃO DOS TIPOS DE DOR TORÁCICA */}
          <Card className="shadow-md">
            <CardHeader className="bg-yellow-50 border-b">
              <CardTitle>Avaliação dos Tipos de Dor Torácica</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3 text-sm">
                <div className="bg-red-50 p-4 rounded border border-red-200">
                  <p className="font-semibold text-red-900 mb-2">Dor Tipo A (Alta Probabilidade)</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>Possui características clássicas, inclusive irradiação e piora com esforço. Pode incluir sintoma semelhante a IAM ou angina prévia.</li>
                    <li>Na ausência de diagnóstico alternativo bem definido, tratar como SCA mesmo que ECG e troponina negativos (considerar diagnóstico inicial de angina instável).</li>
                  </ul>
                </div>

                <div className="bg-orange-50 p-4 rounded border border-orange-200">
                  <p className="font-semibold text-orange-900 mb-2">Dor Tipo B (Provavelmente Anginosa)</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>Características típicas, mas ausência de algumas manifestações importantes.</li>
                    <li>Sintoma com suspeita moderada/elevada mas que precisa de um exame adicional confirmatório antes do tratamento.</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                  <p className="font-semibold text-yellow-900 mb-2">Dor Tipo C (Provavelmente Não Anginosa)</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>Há características que reduzem probabilidade de SCA, mas não há diagnóstico alternativo bem definido e não foi possível descartar isquemia miocárdica aguda.</li>
                    <li>Sintoma com suspeita baixa, mas que não foi possível descartar. A parametrização principalmente da dosagem de troponina é de extrema importância, idealmente com troponina quantitativa.</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <p className="font-semibold text-green-900 mb-2">Dor Tipo D (Não Anginosa)</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>Paciente com diagnóstico alternativo e/ou quadro de baixa probabilidade de SCA tanto pela clínica como pela probabilidade inicial.</li>
                    <li>Se houver diagnóstico alternativo bem definido, pode não ser necessário prosseguir com investigação de SCA (entretanto, ficar atento em pacientes com fatores de risco cardiovasculares).</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* EXAME FÍSICO */}
          <Card className="shadow-md">
            <CardHeader className="bg-purple-50 border-b">
              <CardTitle>Exame Físico (Direcionado)</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-sm text-gray-700">
                <p>
                  A principal característica é do diagnóstico diferencial com outras patologias que podem suscitar quadro semelhante ao da SCA, tais como: presença de dor durante a palpação torácica (dor inflamatória, musculoesquelética), diferença de pulso de pressão arterial ≥ 15 a 20 mmHg em ambos os MMSS com sopro de insuficiência aórtica (dissecção aguda de aorta), presença de atrito pericárdico (pericardite), pulso paradoxal (tamponamento cardíaco), ausência de murmúrio vesicular, dispneia e dor pleurítica (pneumotórax).
                </p>

                <div className="bg-gray-50 p-4 rounded border border-gray-200 mt-4">
                  <h4 className="font-semibold mb-3 text-gray-900">Classificação de Killip e Kimball</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-200">
                          <th className="border p-2 text-left">Classe</th>
                          <th className="border p-2 text-left">Características</th>
                          <th className="border p-2 text-center">Mortalidade em 7 Dias</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-2 font-semibold">I</td>
                          <td className="border p-2">Sem sinais de Congestão</td>
                          <td className="border p-2 text-center">3%</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="border p-2 font-semibold">II</td>
                          <td className="border p-2">B3 e/ou estertores basais</td>
                          <td className="border p-2 text-center">12%</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-semibold">III</td>
                          <td className="border p-2">Estertores em toda extensão pulmonar</td>
                          <td className="border p-2 text-center">20%</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="border p-2 font-semibold">IV</td>
                          <td className="border p-2">Choque Cardiogênico</td>
                          <td className="border p-2 text-center">50%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ELETROCARDIOGRAFIA */}
          <Card className="shadow-md">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle>Eletrocardiografia (ECG)</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-sm text-gray-700">
                <p>
                  A SCA possui uma nomenclatura eletrocardiográfica amplamente difundida através da avaliação do segmento ST, em duas possibilidades: presença ou ausência da elevação ou supradesnivelamento do segmento ST. Entretanto, cerca de 1/3 dos pacientes com SCASST possuem ECG inicial normal e, em até metade desses pacientes, o diagnóstico apenas é possível através de marcadores de necrose miocárdica ou ECG posteriores.
                </p>

                <div className="bg-blue-50 p-4 rounded border border-blue-200">
                  <h4 className="font-semibold mb-2 text-gray-900">Protocolo de Realização</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>ECG deve ser realizado em até 10 minutos da chegada no pronto-atendimento</li>
                    <li>Novos exames podem ser executados se houver mudança do quadro clínico ou da dor</li>
                    <li>Incluir derivações V3R, V4R, V7-V9 para pacientes com Dor Torácica e ECG sem alterações ou com suspeita de infarto de Ventrículo Direito ou imagem em espelho nas derivações anteriores</li>
                  </ul>
                </div>

                <h4 className="font-semibold mt-4 text-gray-900">Diagnóstico Eletrocardiográfico de SCA</h4>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  <li>
                    <strong>SCACST:</strong> Elevação do segmento ST ≥ 1mm em duas derivações contíguas ou de bloqueio de ramo esquerdo novo (ou presumivelmente novo)
                    <ul className="list-circle pl-5 mt-1 text-xs text-gray-600">
                      <li>Derivações V2 e V3: em mulheres ≥ 1,5mm; em homens &lt; 40 anos ≥ 2,5mm; em homens ≥ 40 anos ≥ 2,0mm</li>
                    </ul>
                  </li>
                  <li>
                    <strong>SCASST:</strong> Ausência de elevação persistente do segmento ST indica fluxo transitório e/ou parcialmente comprometido
                  </li>
                </ul>

                <div className="bg-yellow-50 p-4 rounded border border-yellow-200 mt-4">
                  <h4 className="font-semibold mb-2 text-gray-900">Características Eletrocardiográficas da SCASST</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                    <li>ECG pode estar normal, ter alterações inespecíficas ou alterações de onda T/segmento ST</li>
                    <li>Nova depressão horizontal ou descendente do ST ≥ 0,5mm e/ou inversão de onda T &gt; 1mm em duas derivações contíguas com onda R proeminente ou R/S &gt; 1</li>
                    <li>Estas alterações têm valor prognóstico, especialmente a depressão do ST que indica maior gravidade</li>
                  </ul>
                </div>

                <div className="bg-red-50 p-4 rounded border border-red-200 mt-4">
                  <h4 className="font-semibold mb-2 text-gray-900">Particularidades Diagnósticas</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div>
                      <p><strong>Supradesnivelamento do Segmento ST em V2 e V3 nos pacientes jovens:</strong></p>
                      <ul className="list-disc pl-5 mt-1 text-xs">
                        <li>Nas derivações V2 e V3, especialmente em homens jovens, pode ocorrer elevação do ST por repolarização precoce. Usar critérios: ≥ 1,5mm mulher, ≥ 2mm homem ≥ 40 anos, ≥ 2,5mm homem &lt; 40 anos</li>
                        <li>Quando a magnitude da elevação do ponto J é registrada em ECG prévio, uma nova elevação ≥1mm deve ser considerada uma alteração isquêmica</li>
                      </ul>
                    </div>

                    <div>
                      <p><strong>Bloqueio de Ramo Esquerdo (BRE):</strong></p>
                      <ul className="list-disc pl-5 mt-1 text-xs">
                        <li>Presente em ~7% dos pacientes com infarto agudo</li>
                        <li>BRE novo é equivalente a SCACST</li>
                        <li>Para BRE prévio, usar critérios de Sgarbossa ou Barcelona para confirmar diagnóstico</li>
                      </ul>
                    </div>

                    <div>
                      <p><strong>Critérios de Sgarbossa:</strong></p>
                      <ul className="list-disc pl-5 mt-1 text-xs">
                        <li>Elevação de ST ≥ 1mm concordante com QRS = 5 pontos</li>
                        <li>Depressão concordante de ST ≥ 1mm em V1, V2 e V3 = 3 pontos</li>
                        <li>Elevação discordante de ST ≥ 5mm ou 25% da medida total do QRS = 2 pontos</li>
                        <li>≥ 3 pontos: Alta probabilidade de infarto. Estratégia invasiva imediata</li>
                        <li>&lt; 3 pontos: Diagnóstico incerto, não descarta oclusão</li>
                      </ul>
                    </div>

                    <div>
                      <p><strong>Algoritmo de Barcelona (SCASST e BRE):</strong></p>
                      <ul className="list-disc pl-5 mt-1 text-xs">
                        <li>Desvio do ST ≥ 1,0mm concordante com polaridade QRS em qualquer derivação</li>
                        <li>Desvio ST ≥ 1mm discordante com polaridade QRS em derivações com amplitude máxima (R/S) ≤ 6mm</li>
                      </ul>
                    </div>

                    <div>
                      <p><strong>Portadores de Marcapasso:</strong></p>
                      <ul className="list-disc pl-5 mt-1 text-xs">
                        <li>Considerar supra desnivelamento de ST diagnóstico de IAM somente quando &gt; 5mm</li>
                      </ul>
                    </div>

                    <div>
                      <p><strong>Principais derivações e derivações atípicas:</strong></p>
                      <ul className="list-disc pl-5 mt-1 text-xs">
                        <li>Anteriores: V1-V6</li>
                        <li>Inferiores: DII, DIII, aVF</li>
                        <li>Laterais: DI, aVL</li>
                        <li>V3R e V4R: parede livre do VD</li>
                        <li>V7-V9: parede posterior (V7 na linha axilar posterior, V8 na linha médio-escapular esquerda, V9 na borda paravertebral esquerda)</li>
                        <li>IAM de VD e posterior devem ser investigados com mudanças nas derivações V3R, V4R, V7-V9</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MARCADORES DE NECROSE MIOCÁRDICA */}
          <Card className="shadow-md">
            <CardHeader className="bg-green-50 border-b">
              <CardTitle>Marcadores de Necrose Miocárdica</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900">CK-MB</h4>
                  <p>
                    Pode ser encontrada em tecidos não-cardíacos. Não há indicação para solicitação de CK-MB nos locais em que há disponibilidade de troponina (maior sensibilidade).
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-gray-900">Troponina</h4>
                  <p className="mb-2">
                    A dosagem de troponina apenas é válida quando o paciente possui quadro clínico de síndrome coronariana aguda. Várias outras doenças podem causar aumento de troponina. Possui validade prognóstica pois a elevação dos seus níveis está associada a maior mortalidade em curto e longo prazo, podendo permanecer elevado em torno de 2 semanas (troponina convencional).
                  </p>

                  <div className="bg-blue-50 p-3 rounded border border-blue-200 mt-2">
                    <p className="font-semibold text-gray-900 mb-2">Troponinas Ultrassensíveis (T ou I)</p>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-gray-700">
                      <li>Recomendação atual das diretrizes 2025 (SBC, ESC, AHA) para diagnóstico de SCA</li>
                      <li>Medida em ng/L com limites de detecção aumentados dez a cem vezes</li>
                      <li>Nos pacientes com 3 horas de dor tem sensibilidade de 100% e valor preditivo negativo de 95%</li>
                      <li>Seriamento sugerido: T=0h, T=3h (proporciona 100% de sensibilidade para IAM)</li>
                      <li>Casos de falso-positivos: miopatias, hipertensão pulmonar, insuficiência renal crônica (Cr &gt; 2,5 mg/dL)</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 p-3 rounded border border-green-200 mt-2">
                    <p className="font-semibold text-gray-900 mb-2">Troponina Convencional</p>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-gray-700">
                      <li>Segunda escolha. Medida em ng/ml</li>
                      <li>Dosagem repetida entre 6 e 12 horas</li>
                      <li>Seriamento sugerido: T=0h, T=3h, T=6h, T=12h</li>
                      <li>Importante tanto para diagnóstico quanto para exclusão</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                  <p className="text-xs text-red-900"><strong>Observação:</strong> Resultados de Troponina Qualitativa impedem a comparação entre a primeira e segunda amostra.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ESTRATÉGIAS DE TRATAMENTO */}
          <Card className="shadow-md">
            <CardHeader className="bg-red-50 border-b">
              <CardTitle>Estratégias de Tratamento</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-gray-700 mb-4">
                Serão descritos 03 (três) rotas de tratamento, definidas pelo médico regulador, distribuídos por todo o estado.
              </p>

              <div className="space-y-3 text-sm">
                <div className="bg-red-50 p-4 rounded border border-red-200">
                  <h4 className="font-semibold text-red-900 mb-2">Estratégia 1 – IAMcSST</h4>
                  <p className="text-gray-700">
                    Inclui os pacientes com quadro de IAMcSST, determinando transferência imediata com posterior avaliação presencial do cardiologista do CENTRO ESPECIALIZADO (Hospital Regional de Patos, Hospital de Trauma de Campina Grande e Hospital Metropolitano), com decisão de acionamento da equipe de hemodinâmica para estratificação imediata (Cateterismo Cardíaco). Os pacientes com SCAcSST são elegíveis ainda a terapia de reperfusão com fibrinolítico a fim de ganhar tempo para a realização de estudo e posterior angioplastia.
                  </p>
                </div>

                <div className="bg-orange-50 p-4 rounded border border-orange-200">
                  <h4 className="font-semibold text-orange-900 mb-2">Estratégia 2 – SCASST de Alto Risco</h4>
                  <p className="text-gray-700 mb-2">
                    Estratificação invasiva precoce em Síndrome Coronariana Aguda sem supradesnivelamento de segmento ST com padrão de alto risco. Padrões eletrocardiográficos de alto risco devem ser conduzidos nessa estratégia:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700 text-xs">
                    <li>Alteração dinâmica do segmento ST-T</li>
                    <li>Padrões eletrocardiográficos de Wellens, Winter, Supra de AVR com infra difuso, Aslanger</li>
                    <li>Infra de ST na derivação AVL</li>
                    <li>Infra de ST nas derivações V2-V3</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                  <h4 className="font-semibold text-yellow-900 mb-2">Estratégia 3 – SCASST sem Alto Risco</h4>
                  <p className="text-gray-700">
                    Estratificação invasiva precoce (durante internação) em síndromes coronarianas agudas sem supradesnivelamento de segmento ST que não se enquadram nos critérios da estratégia 2.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* HEART SCORE */}
          <Card className="shadow-md">
            <CardHeader className="bg-purple-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                HEART Score - Escore de Gravidade Clínica
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-sm">
                <p className="text-gray-700 mb-4">
                  Ferramenta validada pela Sociedade Brasileira de Cardiologia (2025) para estratificação de risco em pacientes com dor torácica.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Componente</th>
                        <th className="border p-2 text-center">0 pontos</th>
                        <th className="border p-2 text-center">1 ponto</th>
                        <th className="border p-2 text-center">2 pontos</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2 font-semibold">History (História)</td>
                        <td className="border p-2">Baixa suspeita</td>
                        <td className="border p-2">Moderada suspeita</td>
                        <td className="border p-2">Alta suspeita</td>
                      </tr>
                      <tr>
                        <td className="border p-2 font-semibold">ECG</td>
                        <td className="border p-2">Normal</td>
                        <td className="border p-2">Alterações inespecíficas</td>
                        <td className="border p-2">Alterações significativas</td>
                      </tr>
                      <tr>
                        <td className="border p-2 font-semibold">Age (Idade)</td>
                        <td className="border p-2">{"<"} 45 anos</td>
                        <td className="border p-2">45-64 anos</td>
                        <td className="border p-2">≥ 65 anos</td>
                      </tr>
                      <tr>
                        <td className="border p-2 font-semibold">Risk Factors</td>
                        <td className="border p-2">Nenhum</td>
                        <td className="border p-2">1-2 fatores</td>
                        <td className="border p-2">≥ 3 fatores ou DAC</td>
                      </tr>
                      <tr>
                        <td className="border p-2 font-semibold">Troponin</td>
                        <td className="border p-2">Normal</td>
                        <td className="border p-2">1-3x LSN</td>
                        <td className="border p-2">{"> "}3x LSN</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <p className="font-semibold text-green-900">0-3 pontos: Baixo Risco</p>
                    <p className="text-sm text-green-800">Risco de eventos adversos em 6 semanas: 0,9-1,7%</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                    <p className="font-semibold text-yellow-900">4-6 pontos: Risco Intermediário</p>
                    <p className="text-sm text-yellow-800">Risco de eventos adversos em 6 semanas: 12-16,6%</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded border border-red-200">
                    <p className="font-semibold text-red-900">7-10 pontos: Alto Risco</p>
                    <p className="text-sm text-red-800">Risco de eventos adversos em 6 semanas: 50-65%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* CUIDADOS PRÉ-TRANSFERÊNCIA */}
          <Card className="shadow-md">
            <CardHeader className="bg-orange-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-600" />
                Cuidados Pré-Transferência
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6 text-sm text-gray-700">

                {/* 1. Princípio Geral */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">1. Princípio Geral</h4>
                  <p>
                    A transferência de pacientes para centros terciários com serviço de hemodinâmica deve ser realizada apenas quando o benefício clínico esperado do cateterismo cardíaco superar claramente os riscos do procedimento e do transporte inter-hospitalar. A decisão deve ser individualizada, baseada em critérios clínicos objetivos e alinhada às recomendações de diretrizes mais recentes e conforme a portaria do Ministério da Saúde nº. 2.048/02 e a Resolução da AGEVISA PB nº. 006/2022.
                  </p>
                </div>

                {/* 2. Situações que justificam priorização */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">2. Situações que Justificam Priorização da Transferência</h4>
                  <p className="mb-3">
                    A transferência em Unidade de Suporte Avançado (USA) terrestre ou aérea para avaliação invasiva deve ser priorizada, mesmo na presença de contraindicações relativas, quando o paciente apresentar uma ou mais das seguintes condições:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    <li>Isquemia miocárdica em curso ou angina refratária ao tratamento clínico;</li>
                    <li>Arritmias graves associadas à isquemia miocárdica;</li>
                    <li>Insuficiência cardíaca aguda de provável etiologia isquêmica;</li>
                    <li>Choque cardiogênico;</li>
                    <li>Escore GRACE elevado (&gt;140);</li>
                    <li>Parada cardiorrespiratória com suspeita de causa coronariana.</li>
                  </ul>
                  <p className="mb-3">Nesses cenários, o potencial benefício vital da estratégia invasiva tende a superar os riscos associados ao procedimento.</p>

                  <div className="bg-yellow-50 border border-yellow-300 rounded p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-yellow-900 mb-1">Alerta!</p>
                        <p className="text-yellow-800 text-xs">
                          A instabilidade hemodinâmica, por si só, constitui indicação de estratégia invasiva urgente e não contraindicação ao cateterismo. Entretanto, quando houver instabilidade clínica extrema que impeça transporte seguro, como choque profundo refratário, hipoxemia grave não corrigível ou risco iminente de óbito durante o deslocamento, a transferência deve ser temporariamente adiada, priorizando estabilização clínica e reavaliação contínua e nova solicitação de vaga e transporte de USA.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Contraindicações */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">3. Situações que Contraindicam a Transferência</h4>
                  <p className="mb-3">
                    A transferência não é recomendada quando estiver presente qualquer uma das condições abaixo, por representar risco desproporcional ao benefício esperado:
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded p-4">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Coagulopatia grave não corrigida (INR muito elevado ou plaquetopenia significativa);</li>
                      <li>Sepse ou infecção ativa não controlada, incluindo endocardite infecciosa;</li>
                      <li>Alergia grave a contraste iodado sem possibilidade de pré-medicação ou uso de alternativa;</li>
                      <li>Insuficiência renal aguda não dialítica em progressão;</li>
                      <li>Recusa formal do paciente ou responsável legal após esclarecimento adequado;</li>
                      <li>Instabilidade clínica extrema que impeça transporte seguro, conforme descrito acima.</li>
                    </ul>
                  </div>
                  <p className="mt-3">Nessas situações, deve-se priorizar estabilização clínica, tratamento da condição de base e reavaliação periódica da indicação de transferência.</p>
                </div>

                {/* 4. Avaliação Criteriosa */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">4. Situações que Exigem Avaliação Criteriosa Antes da Transferência</h4>
                  <p className="mb-3">
                    As condições a seguir não contraindicam automaticamente o cateterismo cardíaco, mas exigem análise individualizada da relação risco x benefício e, preferencialmente, discussão prévia com o centro terciário:
                  </p>
                  <div className="bg-orange-50 border border-orange-200 rounded p-4">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Doença renal crônica moderada a grave;</li>
                      <li>Anemia grave;</li>
                      <li>Insuficiência cardíaca descompensada;</li>
                      <li>Arritmias não controladas;</li>
                      <li>Infecção respiratória aguda ou febre sem foco definido;</li>
                      <li>Fragilidade clínica importante;</li>
                      <li>Idade avançada associada a múltiplas comorbidades;</li>
                      <li>Dificuldade para obtenção de acesso vascular seguro.</li>
                    </ul>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}