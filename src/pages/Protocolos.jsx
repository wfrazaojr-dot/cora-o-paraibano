import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Heart, Pill, TestTube, Activity } from "lucide-react";

export default function Protocolos() {
  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Protocolos Clínicos</h1>
          <p className="text-gray-600">Diretrizes e protocolos para atendimento de dor torácica</p>
          <p className="text-sm text-gray-500 mt-2">
            Baseados na Diretriz Brasileira de Atendimento à Dor Torácica na Unidade de Emergência – 2025 
            (de Barros e Silva et al.) e Sistema Manchester Adaptado de Classificação de Risco
          </p>
        </div>

        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader className="bg-red-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-600" />
                Protocolo de Dor Torácica - Coração Paraibano 2026
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900">Indicação</h4>
                  <p>
                    Protocolo para pacientes com dor torácica aguda de origem não traumática, ou sintoma equivalente em repouso, 
                    ou originalmente ao esforço mas que não melhorou após 10 minutos de repouso (sintoma presente nas últimas 24h).
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-gray-900">Objetivos</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Identificação precoce:</strong> Triagem de qualidade e ECG em até 10 minutos</li>
                    <li><strong>Salvar vida:</strong> Check-list do tratamento medicamentoso inicial</li>
                    <li><strong>Reduzir necrose:</strong> SCACST com fluxo porta-balão até 60 minutos ou transferência rápida</li>
                    <li><strong>Evitar altas inadvertidas:</strong> Investigação ambulatorial precoce para casos de baixo risco</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-gray-900">Classificação da Dor Torácica</h4>
                  <div className="space-y-2 mt-2">
                    <div className="bg-red-50 p-3 rounded border border-red-200">
                      <p className="font-semibold text-red-900">Tipo A - Alta Probabilidade</p>
                      <p className="text-xs">Características clássicas com irradiação e piora com esforço. Tratar como SCA mesmo com ECG e troponina negativos.</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded border border-orange-200">
                      <p className="font-semibold text-orange-900">Tipo B - Provavelmente Anginosa</p>
                      <p className="text-xs">Características típicas mas ausência de algumas manifestações. Exame adicional confirmatório necessário.</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                      <p className="font-semibold text-yellow-900">Tipo C - Provavelmente Não Anginosa</p>
                      <p className="text-xs">Redução na probabilidade de SCA mas diagnóstico alternativo não bem definido. Parametrização de troponina essencial.</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded border border-green-200">
                      <p className="font-semibold text-green-900">Tipo D - Não Anginosa</p>
                      <p className="text-xs">Diagnóstico alternativo bem definido ou baixa probabilidade. Pode não necessitar investigação de SCA.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-gray-900">Eletrocardiografia (ECG)</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Realizar em até 10 minutos da chegada do paciente</li>
                    <li>Elevação de ST ≥ 1mm em duas derivações contíguas = SCACST</li>
                    <li>Ausência de elevação do ST indica fluxo transitório ou parcial (SCASST)</li>
                    <li>Novos ECGs se houver mudança clínica ou de dor</li>
                    <li>Considerar derivações V3R, V4R, V7-V9 para suspeita de infarto de VD ou posterior</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-gray-900">Marcadores de Necrose Miocárdica</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Troponina Ultrassensível:</strong> Recomendação 2025 (SBC, ESC, AHA). Medida em ng/L com 100% sensibilidade em 3h de dor</li>
                    <li><strong>Troponina Convencional:</strong> Segunda escolha. Dosagem repetida em 6-12h</li>
                    <li><strong>CK-MB:</strong> Não indicado quando troponina disponível</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-gray-900">Estratégias de Tratamento</h4>
                  <div className="space-y-2">
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <p className="font-semibold text-blue-900">Estratégia 1 - SCACST</p>
                      <p className="text-xs">Transferência imediata para centro especializado. Porta-balão até 60 minutos se hemodinâmica disponível, ou transferência em 120-150 minutos. Considerar fibrinólise precoce em casos de distância ou logística.</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <p className="font-semibold text-blue-900">Estratégia 2 - SCASST de Alto Risco</p>
                      <p className="text-xs">Estratificação invasiva precoce em padrões de alto risco (alterações dinâmicas, padrões de Wellens, Winter, Aslanger).</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <p className="font-semibold text-blue-900">Estratégia 3 - SCASST sem Alto Risco</p>
                      <p className="text-xs">Estratificação invasiva precoce durante internação para casos que não se enquadram na estratégia 2.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="bg-purple-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                4. HEART Score - Escore de Gravidade Clínica
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-sm">
                <p className="text-gray-700 mb-4">
                  Ferramenta validada pela Sociedade Brasileira de Cardiologia (2025) para estratificação de risco 
                  em pacientes com dor torácica.
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
        </div>
      </div>
    </div>
  );
}