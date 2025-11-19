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
            (de Barros e Silva et al.) e Sistema Manchester de Classificação de Risco
          </p>
        </div>

        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader className="bg-red-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-600" />
                1. Dor Torácica e Síndromes Coronarianas Agudas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Definição</h4>
                  <p className="text-gray-700">
                    Síndrome Coronariana Aguda (SCA) engloba um espectro de condições causadas por isquemia miocárdica aguda, 
                    incluindo angina instável, IAM sem supra de ST (IAMSSST) e IAM com supra de ST (IAMCSST).
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Apresentação Clínica</h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>Dor ou desconforto torácico em aperto, queimação ou peso</li>
                    <li>Irradiação para braços, mandíbula, dorso ou epigástrio</li>
                    <li>Sintomas associados: dispneia, náuseas, diaforese, síncope</li>
                    <li>Duração geralmente maior que 10 minutos</li>
                  </ul>
                </div>

                <div className="bg-red-50 p-4 rounded border border-red-200">
                  <h4 className="font-semibold mb-2 text-red-900">⚠️ Meta de Tempo</h4>
                  <p className="text-red-800 font-medium">
                    ECG em até 10 minutos do primeiro contato médico para pacientes com suspeita de SCA
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-blue-600" />
                2. Medicamentos nas SCA
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Terapia Antiplaquetária Dupla (DAPT)</h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li><strong>AAS:</strong> 200-300mg VO (mastigado) - dose de ataque</li>
                    <li><strong>Clopidogrel:</strong> 300-600mg VO</li>
                    <li><strong>Ticagrelor:</strong> 180mg VO (preferencial em IAMCSST)</li>
                    <li><strong>Prasugrel:</strong> 60mg VO (considerar em ICP primária)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Betabloqueadores</h4>
                  <p className="text-gray-700 mb-2">Iniciar nas primeiras 24h, quando não contraindicados:</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li><strong>Metoprolol:</strong> 25-50mg VO a cada 6-12h</li>
                    <li><strong>Contraindicações:</strong> IC aguda, choque, BAV avançado, bradicardia grave</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">IECA/BRA</h4>
                  <p className="text-gray-700 mb-2">Iniciar nas primeiras 24h em pacientes com:</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>Disfunção ventricular esquerda (FEVE ≤ 40%)</li>
                    <li>IAM anterior</li>
                    <li>Congestão pulmonar</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Estatinas de Alta Potência</h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li><strong>Atorvastatina:</strong> 40-80mg VO</li>
                    <li><strong>Rosuvastatina:</strong> 20-40mg VO</li>
                    <li>Iniciar desde a admissão hospitalar</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="bg-green-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5 text-green-600" />
                3. Exames Laboratoriais
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Protocolo de Troponina Ultrassensível</h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li><strong>0h e 1h:</strong> Protocolo rápido (alta sensibilidade)</li>
                    <li><strong>0h e 3h:</strong> Protocolo padrão</li>
                    <li>Elevação significativa indica necrose miocárdica</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Exames Complementares Essenciais</h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>Hemograma completo</li>
                    <li>Função renal (creatinina, ureia)</li>
                    <li>Eletrólitos (Na, K, Mg)</li>
                    <li>Glicemia</li>
                    <li>Coagulograma (se anticoagulação prevista)</li>
                    <li>CPK-MB (marcador adicional)</li>
                    <li>D-dímero (se suspeita de TEP)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Exames de Imagem</h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li><strong>Radiografia de tórax:</strong> Avaliar congestão, cardiomegalia, pneumotórax</li>
                    <li><strong>Ecocardiograma:</strong> Função ventricular, alterações de motilidade segmentar</li>
                  </ul>
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

          <Card className="shadow-md border-l-4 border-l-gray-500">
            <CardHeader className="bg-gray-50">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Referências Bibliográficas e Créditos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Protocolos Principais:</h4>
                  
                  <div className="space-y-3 pl-4">
                    <div>
                      <p className="font-semibold">1. Manual de Classificação de Risco</p>
                      <p className="text-gray-600">DISTRITO FEDERAL. Secretaria de Saúde. <strong>Manual de Classificação de Risco.</strong> Brasília: Governo do Distrito Federal, 2023. Disponível em: <a href="https://www.saude.df.gov.br" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://www.saude.df.gov.br</a>. Acesso em: jan. 2025.</p>
                    </div>

                    <div>
                      <p className="font-semibold">2. Sistema Manchester de Classificação de Risco</p>
                      <p className="text-gray-600">MACKWAY-JONES, Kevin; MARSDEN, Janet; WINDLE, Jill. <strong>Sistema Manchester de Classificação de Risco.</strong> 2. ed. Belo Horizonte: Grupo Brasileiro de Classificação de Risco, 2017.</p>
                    </div>

                    <div>
                      <p className="font-semibold">3. Diretriz Brasileira - SBC 2025</p>
                      <p className="text-gray-600">DE BARROS E SILVA, P. G. M. et al. <strong>Diretriz Brasileira de Atendimento à Dor Torácica na Unidade de Emergência – 2025.</strong> Arquivos Brasileiros de Cardiologia, v. 123, n. 1, 2025. Disponível em: <a href="https://www.scielo.br/j/abc" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://www.scielo.br/j/abc</a>. Acesso em: jan. 2025.</p>
                    </div>

                    <div>
                      <p className="font-semibold">4. Diretriz ACC/AHA/ACEP/NAEMSP/SCAI 2025</p>
                      <p className="text-gray-600">AMERICAN COLLEGE OF CARDIOLOGY et al. <strong>2025 ACC/AHA/ACEP/NAEMSP/SCAI Guideline for the Management of Patients With Acute Coronary Syndromes:</strong> A Report of the American College of Cardiology/American Heart Association Joint Committee on Clinical Practice Guidelines. Circulation, 2025. Disponível em: <a href="https://www.ahajournals.org/journal/circ" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://www.ahajournals.org/journal/circ</a>. Acesso em: jan. 2025.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-300">
                  <h4 className="font-bold text-gray-900 mb-2">Desenvolvido por:</h4>
                  <p><strong>Walber Alves Frazão Júnior</strong></p>
                  <p>Enfermeiro Emergencista - COREN 110.238</p>
                  <p className="text-gray-600">Pós-graduado em Cardiologia, Neurologia e Auditoria em Serviços de Saúde</p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-300 text-xs text-gray-600">
                  <p>© 2025 - Todos os direitos reservados</p>
                  <p>Uso, cópia ou venda não autorizados são proibidos por lei</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}