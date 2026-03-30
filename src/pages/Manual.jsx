import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Stethoscope, FileText, Activity, AlertTriangle, Radio, Heart, Truck, Building2 } from "lucide-react";

export default function Manual() {
  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manual do Sistema Coração Paraibano</h1>
          <p className="text-gray-600">Guia completo de uso do sistema integrado de regulação cardiológica</p>
        </div>

        <div className="space-y-6">
          {/* Visão Geral */}
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
                  O <strong>Sistema Coração Paraibano</strong> é uma plataforma integrada de regulação cardiológica desenvolvida para 
                  otimizar o fluxo de pacientes com síndromes coronarianas agudas (SCA) no estado da Paraíba.
                </p>
                <p>
                  O sistema conecta <strong>Unidades de Saúde</strong>, <strong>Assessoria de Cardiologia (ASSCARDIO)</strong>, 
                  <strong>Central Estadual de Regulação Hospitalar (CERH)</strong>, <strong>Transporte</strong> e 
                  <strong>Serviços de Hemodinâmica</strong>, garantindo atendimento rápido e eficiente aos pacientes críticos.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Perfis de Usuário */}
          <Card className="shadow-md">
            <CardHeader className="bg-green-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Perfis de Usuário e Equipes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-sm">
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-semibold mb-2">🏥 Unidades de Saúde</h4>
                  <p className="text-gray-700 mb-2">
                    Médicos e enfermeiros das unidades de pronto atendimento e hospitais que realizam o primeiro atendimento.
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>Cadastro de novos pacientes com suspeita de SCA</li>
                    <li>Triagem de enfermagem e médica (Etapas 1-4)</li>
                    <li>Geração de relatório de triagem</li>
                    <li>Envio de Formulário/Vaga para SES</li>
                    <li>Acesso ao histórico de seus pacientes</li>
                  </ul>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold mb-2">❤️ ASSCARDIO (Assessoria de Cardiologia)</h4>
                  <p className="text-gray-700 mb-2">
                    Cardiologistas que avaliam remotamente os casos enviados pelas unidades de saúde.
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>Visualização de relatórios de triagem das unidades</li>
                    <li>Análise de ECGs e exames complementares</li>
                    <li>Parecer cardiológico com diagnóstico e conduta</li>
                    <li>Indicação ou não de hemodinâmica</li>
                    <li>Classificação de urgência (Emergência/Urgente/Eletivo)</li>
                    <li>Geração de relatório ASSCARDIO</li>
                  </ul>
                </div>

                <div className="border-l-4 border-indigo-500 pl-4">
                  <h4 className="font-semibold mb-2">📡 CERH (Central de Regulação)</h4>
                  <p className="text-gray-700 mb-2">
                    Médicos reguladores que definem unidade de destino e coordenam transferências.
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>Visualização de pareceres ASSCARDIO</li>
                    <li>Definição de conduta inicial e final</li>
                    <li>Busca de vaga em unidade de destino</li>
                    <li>Emissão de senha SES para internação</li>
                    <li>Acionamento de alerta para Unidade enviar Formulário/Vaga</li>
                    <li>Geração de relatório de regulação com e-mail da unidade</li>
                  </ul>
                </div>

                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold mb-2">🚑 Transporte</h4>
                  <p className="text-gray-700 mb-2">
                    Equipe responsável pela remoção e transporte de pacientes entre unidades.
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>Monitor de transportes em tempo real</li>
                    <li>Visualização de pacientes aguardando transporte</li>
                    <li>Registro de início, intercorrências e conclusão de transporte</li>
                    <li>Geração automática de relatório de transporte</li>
                    <li>Acesso ao painel de regulação para contexto clínico</li>
                  </ul>
                </div>

                <div className="border-l-4 border-pink-500 pl-4">
                  <h4 className="font-semibold mb-2">💉 Hemodinâmica</h4>
                  <p className="text-gray-700 mb-2">
                    Equipe que realiza procedimentos de cateterismo e ICP (Intervenção Coronariana Percutânea).
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>Definição de estratégia: ICP Imediata, Estratégia Invasiva Precoce (≤24h), ou Estratégia Invasiva Durante o Internamento (≤72h)</li>
                    <li>Agendamento de ICP para estratégias não imediatas</li>
                    <li>Geração automática de relatório de agendamento identificando a macrorregião responsável</li>
                    <li>Registro de chegada, início de procedimento e início de ICP</li>
                    <li>Transferência de pacientes entre hemodinâmicas (Macro 1, 2 ou 3)</li>
                    <li>Finalização com desfecho e geração de relatório completo</li>
                    <li>Relatórios incluem e-mail da unidade de origem</li>
                  </ul>
                </div>

                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold mb-2">👨‍⚕️ Administrador</h4>
                  <p className="text-gray-700 mb-2">
                    Acesso completo a todas as funcionalidades do sistema.
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>Visualização de todos os painéis e indicadores</li>
                    <li>Gestão de usuários e profissionais</li>
                    <li>Configuração de notificações</li>
                    <li>Acesso total ao histórico de todos os pacientes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fluxo Completo */}
          <Card className="shadow-md">
            <CardHeader className="bg-red-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-600" />
                Fluxo Completo de Atendimento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    1️⃣ Triagem na Unidade de Saúde (Etapas 1-4)
                  </h4>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div>
                      <p className="font-semibold">Etapa 1: Dados do Paciente</p>
                      <ul className="list-disc pl-5 mt-1">
                        <li>Nome completo, idade, sexo, unidade de saúde</li>
                        <li>Data/hora de chegada e início dos sintomas</li>
                        <li>Uso de inibidor de fosfodiesterase (pacientes masculinos)</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold">Etapa 2: Triagem Médica Cardiológica</p>
                      <ul className="list-disc pl-5 mt-1">
                        <li>Médico e CRM responsável</li>
                        <li>Sinais vitais completos (PA ambos os braços, FC, FR, TAX, SpO2)</li>
                        <li>Glicemia capilar e comorbidades (DM, DPOC)</li>
                        <li>Upload de ECG (até 3 arquivos)</li>
                        <li>Seleção de alterações do ECG</li>
                        <li>Classificação do tipo de SCA (SCACESST, SCASESST c/ ou s/ Troponina)</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold">Etapa 3: Avaliação Clínica</p>
                      <ul className="list-disc pl-5 mt-1">
                        <li>Antecedentes clínicos</li>
                        <li>Quadro atual e hipótese diagnóstica</li>
                        <li>Cálculo do HEART Score (história, ECG, idade, fatores de risco, troponina)</li>
                        <li>Prescrição de medicamentos</li>
                        <li>Solicitação de exames</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold">Etapa 4: Relatório de Triagem</p>
                      <ul className="list-disc pl-5 mt-1">
                        <li>Revisão de todos os dados coletados</li>
                        <li>Identificação do médico responsável</li>
                        <li>Confirmação de disponibilidade de hemodinâmica na USA</li>
                        <li>Geração e upload de relatório em PDF</li>
                        <li>⚠️ Alerta importante: ENVIAR FORMULÁRIO/VAGA após triagem</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    2️⃣ Avaliação ASSCARDIO
                  </h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>O cardiologista da ASSCARDIO:</p>
                    <ul className="list-disc pl-5">
                      <li>Visualiza o relatório de triagem da unidade</li>
                      <li>Analisa ECGs e dados clínicos</li>
                      <li>Preenche bloco clínico e analisa achados de ECG (com/sem Supra ST)</li>
                      <li>Visualiza HEART Score calculado (para pacientes sem Supra ST com Troponina)</li>
                      <li>Emite parecer técnico com diagnóstico e estratégia:
                        <ul className="list-disc pl-5 mt-1">
                          <li>Estratégia 1: Transferência imediata (IAM Supra ST ou SCA sem supra de muito alto risco)</li>
                          <li>Estratégia 2: Estratégia Invasiva Precoce (IAM sem supra/alto risco)</li>
                          <li>Estratégia 3: Estratégia Invasiva Durante o Internamento (SCA intermediário)</li>
                          <li>Orientação Cardiológica</li>
                          <li>Estratégia 6: Trombólise</li>
                        </ul>
                      </li>
                      <li>Gera relatório ASSCARDIO com e-mail da unidade</li>
                    </ul>
                  </div>
                </div>

                <div className="border-l-4 border-indigo-500 pl-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Radio className="w-5 h-5" />
                    3️⃣ Regulação CERH
                  </h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>O médico regulador da CERH:</p>
                    <ul className="list-disc pl-5">
                      <li>Visualiza relatórios da Unidade e da ASSCARDIO</li>
                      <li>Visualiza informações de agendamento de ICP quando aplicável</li>
                      <li>Define conduta inicial (ex: aguardar troponina, repetir ECG)</li>
                      <li>Define conduta final</li>
                      <li>Identifica unidade de destino</li>
                      <li>Emite senha SES para internação</li>
                      <li>Ao confirmar regulação: sistema envia alerta para Unidade enviar Formulário/Vaga</li>
                      <li>Gera relatório de regulação com e-mail da unidade</li>
                    </ul>
                  </div>
                </div>

                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    4️⃣ Formulário/Vaga (SES)
                  </h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>A Unidade de Saúde preenche e envia:</p>
                    <ul className="list-disc pl-5">
                      <li>Dados pessoais completos do paciente (RG, CPF, CNS, endereço)</li>
                      <li>Especialidade solicitada (UTI Cardio, Hemodinâmica, Outra)</li>
                      <li>E-mail da unidade solicitante (salvo automaticamente para inclusão em relatórios)</li>
                      <li>Dados clínicos detalhados (exame físico, sinais vitais, gasometria)</li>
                      <li>Comorbidades e medicações de uso contínuo</li>
                      <li>Conduta atual (VMI, sedação, drogas vasoativas)</li>
                      <li>Anexar até 4 documentos (PDF, GIF, JPEG)</li>
                      <li>Baixar formulário em PDF</li>
                      <li>Enviar para SES por e-mail</li>
                    </ul>
                    <p className="font-semibold text-yellow-900 mt-2">
                      ⚠️ Este formulário acelera a autorização de vaga pela SES
                    </p>
                  </div>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    5️⃣ Transporte
                  </h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>A equipe de transporte:</p>
                    <ul className="list-disc pl-5">
                      <li>Acessa o Monitor de Transportes</li>
                      <li>Visualiza pacientes aguardando transporte</li>
                      <li>Registra início do transporte</li>
                      <li>Documenta intercorrências durante o trajeto (se houver)</li>
                      <li>Registra chegada ao destino</li>
                      <li>Sistema gera automaticamente relatório de transporte em PDF</li>
                    </ul>
                  </div>
                </div>

                <div className="border-l-4 border-pink-500 pl-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    6️⃣ Hemodinâmica
                  </h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>A equipe de hemodinâmica:</p>
                    <ul className="list-disc pl-5">
                      <li><strong>Define estratégia de ICP:</strong>
                        <ul className="list-disc pl-5 mt-1">
                          <li>ICP Imediata (para IAM com Supra ST)</li>
                          <li>Estratégia Invasiva Precoce (≤24h, para alto risco)</li>
                          <li>Estratégia Invasiva Durante o Internamento (≤72h, para risco intermediário)</li>
                        </ul>
                      </li>
                      <li>Para estratégias não imediatas: agenda data/hora do procedimento e gera relatório identificando a macrorregião (ex: RELATÓRIO DE AGENDAMENTO - HEMODINÂMICA MACRO 1)</li>
                      <li>Sistema entra em standby até a data agendada</li>
                      <li>Registra chegada do paciente, início do procedimento e início da ICP</li>
                      <li>Pode transferir paciente entre hemodinâmicas (Macro 1 ↔ Macro 2 ↔ Macro 3)</li>
                      <li>Finaliza caso com desfecho, procedimento realizado e intercorrências</li>
                      <li>Gera relatório final da hemodinâmica com e-mail da unidade</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Painéis do Sistema */}
          <Card className="shadow-md">
            <CardHeader className="bg-purple-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                Painéis do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">🏠 Painel Inicial</h4>
                  <ul className="list-disc pl-5 text-gray-700">
                    <li>Seleção de equipe ao fazer primeiro acesso (Unidade, CERH, ASSCARDIO)</li>
                    <li>Resumo das funcionalidades disponíveis por perfil</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">📋 Painel Assistencial (Histórico)</h4>
                  <p className="text-gray-700 mb-2">Para Unidades de Saúde e Administradores:</p>
                  <ul className="list-disc pl-5 text-gray-700">
                    <li>Lista de todos os pacientes cadastrados</li>
                    <li>Busca por nome do paciente</li>
                    <li>Filtros por unidade, status, data</li>
                    <li>Visualização de tempos de atendimento</li>
                    <li>🚨 Alerta visual "ENVIE FORMULÁRIO/VAGA" para pacientes regulados</li>
                    <li>Botão direto para acessar Formulário/Vaga</li>
                    <li>Botão "Ver Detalhes" e "Retriagem"</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">🔴 Painel de Regulação (Dashboard)</h4>
                  <p className="text-gray-700 mb-2">Para CERH, ASSCARDIO, Transporte e Administradores:</p>
                  <ul className="list-disc pl-5 text-gray-700">
                    <li>Cards com estatísticas: Prioridade 0, 1, 2</li>
                    <li>Pacientes dentro da janela terapêutica (≤12h)</li>
                    <li>Aguardando ASSCARDIO, CERH, Transporte, Hemodinâmica</li>
                    <li>Lista de pacientes ordenados por prioridade</li>
                    <li>Filtros clicáveis nos cards</li>
                    <li>Botões de acesso rápido por equipe (ASSCARDIO, CERH, Transporte, Hemodinâmica)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">🚑 Monitor de Transportes</h4>
                  <p className="text-gray-700 mb-2">Para equipe de Transporte e Administradores:</p>
                  <ul className="list-disc pl-5 text-gray-700">
                    <li>Visualização em tempo real de todos os transportes</li>
                    <li>Status: Aguardando, Em Deslocamento, Concluído, Com Intercorrência</li>
                    <li>Filtros por status e busca por paciente</li>
                    <li>Cartões com informações de origem, destino, tipo de transporte e central</li>
                    <li>Acesso rápido aos detalhes do paciente e registro de transporte</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">📊 Indicadores</h4>
                  <p className="text-gray-700 mb-2">Apenas Administradores:</p>
                  <ul className="list-disc pl-5 text-gray-700">
                    <li>Métricas gerais do sistema</li>
                    <li>Desempenho por unidade</li>
                    <li>Tempos médios de atendimento</li>
                    <li>Taxa de cumprimento de metas</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metas Críticas */}
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
                  <p className="font-semibold text-red-900">⏱️ Triagem ≤ 4 minutos</p>
                  <p className="text-red-800">Do início até conclusão da triagem de enfermagem</p>
                </div>
                <div className="p-3 bg-red-50 rounded border border-red-200">
                  <p className="font-semibold text-red-900">⏱️ ECG IAM ≤ 10 minutos</p>
                  <p className="text-red-800">Em casos suspeitos de IAM com ECG</p>
                </div>
                <div className="p-3 bg-orange-50 rounded border border-orange-200">
                  <p className="font-semibold text-orange-900">⏱️ Espera ≤ 15 minutos</p>
                  <p className="text-orange-800">Da triagem até início do atendimento médico</p>
                </div>
                <div className="p-3 bg-orange-50 rounded border border-orange-200">
                  <p className="font-semibold text-orange-900">⏱️ Triagem clínica ≤ 20 minutos</p>
                  <p className="text-orange-800">Tempo total da avaliação médica inicial</p>
                </div>
                <div className="p-3 bg-green-50 rounded border border-green-200">
                  <p className="font-semibold text-green-900">⏱️ Janela terapêutica ≤ 12 horas</p>
                  <p className="text-green-800">Do início dos sintomas até reperfusão (ICP/fibrinólise)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat Interno */}
          <Card className="shadow-md">
            <CardHeader className="bg-teal-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                Chat Interno por Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  Cada paciente possui um chat interno exclusivo para comunicação entre as equipes:
                </p>
                <ul className="list-disc pl-5">
                  <li>Unidade de Saúde pode enviar dúvidas ou informações adicionais</li>
                  <li>ASSCARDIO pode solicitar exames complementares ou esclarecimentos</li>
                  <li>CERH pode informar sobre disponibilidade de vagas</li>
                  <li>Todas as mensagens ficam registradas no prontuário do paciente</li>
                  <li>Identificação automática da equipe que enviou a mensagem</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Recursos Especiais */}
          <Card className="shadow-md">
            <CardHeader className="bg-indigo-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-indigo-600" />
                Recursos Especiais
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h4 className="font-semibold mb-2">📈 Cálculo Automático do HEART Score</h4>
                  <ul className="list-disc pl-5">
                    <li>Pontuação automática baseada em 5 critérios</li>
                    <li>Interpretação de risco (baixo 0-3, intermediário 4-6, alto 7-10)</li>
                    <li>Auxílio na decisão de internação ou alta</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">⏱️ Cálculo Automático de Tempos</h4>
                  <ul className="list-disc pl-5">
                    <li>Tempo de dor (início dos sintomas até atendimento)</li>
                    <li>Tempo triagem-ECG</li>
                    <li>Tempo porta-balão (quando aplicável)</li>
                    <li>Tempo total de atendimento</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">🔔 Sistema de Notificações</h4>
                  <ul className="list-disc pl-5">
                    <li>Alertas para novos pacientes</li>
                    <li>Notificações de pacientes com IAM-ECG</li>
                    <li>Avisos de prioridade vermelha</li>
                    <li>Alertas de HEART Score alto</li>
                    <li>Configurável por unidade ou global</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">🔐 Acesso por Perfil com Senha</h4>
                  <ul className="list-disc pl-5">
                    <li>Senha específica por perfil: ASSCARDIO, CERH, Hemodinâmica e Transporte</li>
                    <li>Cada perfil possui uma senha própria de acesso definida pelo administrador</li>
                    <li>Registro automático de quem preencheu cada etapa</li>
                    <li>Rastreabilidade completa do atendimento</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navegação do Sistema */}
          <Card className="shadow-md">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Navegação do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3 text-sm text-gray-700">
                <p className="font-semibold">Menu lateral contém:</p>
                <ul className="list-disc pl-5">
                  <li><strong>Painel Inicial:</strong> Tela de boas-vindas e seleção de equipe</li>
                  <li><strong>Painel Assistencial:</strong> Histórico de pacientes (Unidades de Saúde)</li>
                  <li><strong>Painel de Regulação:</strong> Dashboard de casos (CERH/ASSCARDIO/Transporte)</li>
                  <li><strong>Indicadores:</strong> Métricas e estatísticas (Administradores)</li>
                  <li><strong>Protocolos:</strong> Guias clínicos e fluxogramas</li>
                  <li><strong>Estratégias e Condutas:</strong> Protocolos de medicamentos</li>
                  <li><strong>Manual:</strong> Esta página de ajuda</li>
                  <li><strong>Monitor Transportes:</strong> Gestão de transportes em tempo real (Transporte)</li>
                  <li><strong>Formulário/Vaga:</strong> Solicitação de vaga SES</li>
                  <li><strong>Administração:</strong> Gestão de usuários e configurações (Administradores)</li>
                </ul>
                
                <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="font-semibold text-blue-900">💡 Metas de Qualidade</p>
                  <p className="text-blue-800 text-xs mt-1">
                    O menu lateral exibe as metas de tempo que devem ser seguidas pela equipe
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suporte */}
          <Card className="shadow-md border-l-4 border-l-gray-500">
            <CardHeader className="bg-gray-50">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Desenvolvimento e Suporte
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>Sistema desenvolvido por:</strong><br />
                  Walber Alves Frazão Júnior<br />
                  Enfermeiro Emergencista (COREN 110.238)
                </p>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-600">
                    <strong>Secretaria de Estado de Saúde da Paraíba</strong><br />
                    Programa Coração Paraibano
                  </p>
                </div>
                <p className="mt-4 pt-4 border-t text-xs text-gray-600">
                  © 2025-2026 Sistema Coração Paraibano - Todos os direitos reservados<br />
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