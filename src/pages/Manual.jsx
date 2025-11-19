import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Stethoscope, FileText, Activity, AlertTriangle } from "lucide-react";

export default function Manual() {
  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manual do Usuário</h1>
          <p className="text-gray-600">Guia completo para uso do Sistema de Triagem de Dor Torácica</p>
        </div>

        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Visão Geral do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  O Sistema Integrado de Triagem de Dor Torácica foi desenvolvido para auxiliar enfermeiros e médicos 
                  em unidades de pronto atendimento e hospitais de emergência no processo de triagem, classificação de 
                  risco e atendimento de pacientes com dor torácica.
                </p>
                <p>
                  O sistema segue as diretrizes da Sociedade Brasileira de Cardiologia (2025) e utiliza o Sistema 
                  Manchester Adaptado de Classificação de Risco, garantindo um atendimento padronizado e eficiente.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="bg-green-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Perfis de Usuário
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Enfermeiro de Triagem</h4>
                  <p className="text-gray-700">
                    Responsável pelas etapas 1 a 4: cadastro do paciente, triagem cardiológica, registro de dados 
                    vitais e ECG, e classificação de risco pelo Sistema Manchester Adaptado.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Médico Assistencial</h4>
                  <p className="text-gray-700">
                    Responsável pelas etapas 5 a 8: avaliação clínica, prescrição medicamentosa, solicitação de 
                    exames e geração do relatório para a Central de Regulação.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="bg-red-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-600" />
                Fluxo de Atendimento - 8 Etapas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="border-l-4 border-l-blue-500 pl-4">
                  <h4 className="font-semibold mb-2">Etapa 1: Dados do Paciente</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                    <li>Clique em "Nova Triagem" no menu lateral</li>
                    <li>O sistema registra automaticamente data e hora atual</li>
                    <li>Preencha: nome completo, idade, sexo, prontuário</li>
                    <li>Ajuste data/hora de chegada se necessário</li>
                    <li>Registre data e hora do início dos sintomas</li>
                  </ul>
                </div>

                <div className="border-l-4 border-l-red-500 pl-4">
                  <h4 className="font-semibold mb-2">Etapa 2: Triagem Cardiológica</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                    <li>Responda às 6 perguntas com SIM ou NÃO</li>
                    <li>Se qualquer resposta for SIM: alerta de PROVÁVEL IAM aparece</li>
                    <li>⚠️ Meta: Realizar ECG em até 10 minutos após o alerta</li>
                  </ul>
                </div>

                <div className="border-l-4 border-l-green-500 pl-4">
                  <h4 className="font-semibold mb-2">Etapa 3: Dados Vitais e ECG</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                    <li>Registre pressão arterial (ambos os braços), FC, FR, temperatura, SpO2</li>
                    <li>Informe se paciente tem diabetes ou DPOC</li>
                    <li>Registre glicemia capilar (sistema calcula valores aceitáveis)</li>
                    <li>Anexe até 3 arquivos de ECG (PDF, PNG ou JPEG)</li>
                    <li>Sistema calcula tempo triagem-ECG automaticamente</li>
                    <li>Inteligência artificial analisa o ECG e fornece interpretação</li>
                  </ul>
                </div>

                <div className="border-l-4 border-l-orange-500 pl-4">
                  <h4 className="font-semibold mb-2">Etapa 4: Classificação de Risco</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                    <li>Selecione discriminadores identificados (Sistema Manchester Adaptado)</li>
                    <li>Sistema calcula automaticamente a cor de classificação</li>
                    <li>Cores: Vermelha (imediato), Laranja (10 min), Amarela (60 min), Verde (120 min), Azul (240 min)</li>
                    <li>Se houve alerta de IAM, classificação mínima é Laranja</li>
                  </ul>
                </div>

                <div className="border-l-4 border-l-purple-500 pl-4">
                  <h4 className="font-semibold mb-2">Etapa 5: Avaliação Médica</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                    <li>Médico registra antecedentes clínicos do paciente</li>
                    <li>Descreve quadro clínico atual</li>
                    <li>Lista hipóteses diagnósticas (diagnósticos diferenciais)</li>
                    <li>Registra diagnóstico confirmado ou principal</li>
                    <li>Adiciona observações relevantes</li>
                  </ul>
                </div>

                <div className="border-l-4 border-l-pink-500 pl-4">
                  <h4 className="font-semibold mb-2">Etapa 6: Prescrição Medicamentosa</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                    <li>Selecione medicamentos comuns ou adicione personalizados</li>
                    <li>Protocolo SCA: DAPT, betabloqueadores, IECA/BRA, estatinas</li>
                    <li>Registre dose, via de administração</li>
                    <li>Marque como "administrado" após aplicação</li>
                  </ul>
                </div>

                <div className="border-l-4 border-l-teal-500 pl-4">
                  <h4 className="font-semibold mb-2">Etapa 7: Solicitação de Exames</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                    <li>Selecione exames do protocolo (troponina, hemograma, etc.)</li>
                    <li>Adicione exames personalizados se necessário</li>
                    <li>Sistema registra todos os exames solicitados</li>
                  </ul>
                </div>

                <div className="border-l-4 border-l-indigo-500 pl-4">
                  <h4 className="font-semibold mb-2">Etapa 8: Relatório e Regulação</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                    <li>Revise o checklist de conclusão</li>
                    <li>Sistema mostra tempo total do atendimento</li>
                    <li>Baixe relatório em formato TXT</li>
                    <li>Envie relatório por email para Central de Regulação</li>
                    <li>Finalize o atendimento</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="bg-yellow-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Metas de Tempo Críticas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-red-50 rounded border border-red-200">
                  <p className="font-semibold text-red-900">ECG em até 10 minutos</p>
                  <p className="text-red-800">
                    Desde o início da triagem até o carregamento do ECG no sistema
                  </p>
                </div>
                <div className="p-3 bg-orange-50 rounded border border-orange-200">
                  <p className="font-semibold text-orange-900">Avaliação médica em até 30 minutos</p>
                  <p className="text-orange-800">
                    Desde a triagem até a avaliação médica completa (casos que necessitam regulação)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="bg-purple-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-purple-600" />
                Funcionalidades Adicionais
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h4 className="font-semibold mb-2">Painel Inicial (Dashboard)</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Visualização de pacientes em atendimento em tempo real</li>
                    <li>Estatísticas do dia: total de atendimentos, casos críticos</li>
                    <li>Alertas de pacientes fora do tempo esperado</li>
                    <li>Gráfico de classificação de risco</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Histórico de Atendimentos</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Consulta de todos os pacientes atendidos</li>
                    <li>Busca por nome, prontuário ou classificação</li>
                    <li>Visualização de tempos de atendimento</li>
                    <li>Acesso rápido aos detalhes de cada caso</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Análise de ECG por IA</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Detecção automática de alterações no traçado</li>
                    <li>Identificação de síndromes específicas (Wellens, Winter, etc.)</li>
                    <li>Diferenciação de bloqueios de ramo</li>
                    <li>Alertas para padrões que parecem IAM mas não são</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-l-gray-500">
            <CardHeader className="bg-gray-50">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Suporte e Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>Sistema desenvolvido por:</strong><br />
                  Walber Alves Frazão Júnior<br />
                  Enfermeiro Emergencista (COREN 110.238)<br />
                  Pós-graduado em Cardiologia e Hemodinâmica (FACULDADE INVECTUS)<br />
                  Pós-graduado em Neurologia (INSTITUTO ENSINAR BRASIL)<br />
                  Pós-graduado em Auditoria em Serviços de Saúde (FACULDADE UNINA)<br />
                  Pós-graduado em Urgência e Emergência (UNIFAN)
                </p>
                <p className="mt-4 pt-4 border-t text-xs text-gray-600">
                  © 2025 Sistema de Triagem de Dor Torácica - Todos os direitos reservados<br />
                  O uso, cópia ou venda não autorizados são proibidos
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}