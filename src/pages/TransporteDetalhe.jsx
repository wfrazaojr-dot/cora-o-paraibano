import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Truck, FileText, MapPin, AlertTriangle, Download, CheckCircle, XCircle, Clock } from "lucide-react";
import DadosPaciente from "@/components/regulacao/DadosPaciente";
import LinhaTempo from "@/components/regulacao/LinhaTempo";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const MOTIVOS_INTERCORRENCIA = [
  "Paciente sem condições de transporte",
  "Paciente foi a óbito no transporte",
  "Viatura sem condições de transporte",
  "Transporte cancelado",
  "Outro"
];

export default function TransporteDetalhe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const pacienteId = urlParams.get('id');

  const [formData, setFormData] = useState({
    central_transporte: "",
    tipo_transporte: "USA CORAÇÃO PARAIBANO",
    intercorrencias: "",
    motivo_intercorrencia: "",
    motivo_detalhado: "",
    acoes_tomadas: "",
    showIntercorrencia: false,
  });
  const [gerandoPDF, setGerandoPDF] = useState(false);

  const { data: paciente, isLoading } = useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: () => base44.entities.Paciente.list().then(list => list.find(p => p.id === pacienteId)),
    enabled: !!pacienteId,
    refetchInterval: 15000
  });

  const transporteIniciado = !!paciente?.transporte?.data_hora_inicio;
  const transporteFinalizado = !!paciente?.transporte?.data_hora_chegada_destino;

  const iniciarTransporte = useMutation({
    mutationFn: async () => {
      await base44.entities.Paciente.update(pacienteId, {
        transporte: {
          ...paciente?.transporte,
          central_transporte: formData.central_transporte,
          tipo_transporte: formData.tipo_transporte,
          data_hora_solicitacao: paciente?.transporte?.data_hora_solicitacao || new Date().toISOString(),
          data_hora_inicio: new Date().toISOString(),
          status_transporte: "Em Deslocamento",
          unidade_destino: paciente?.regulacao_central?.unidade_destino || ""
        },
        status: "Em Transporte"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['paciente', pacienteId]);
      alert("Transporte iniciado com sucesso!");
    }
  });

  const finalizarTransporte = useMutation({
    mutationFn: async () => {
      setGerandoPDF(true);
      const resultado = await base44.functions.invoke('generateRelatorioTransporte', {
        pacienteId,
        intercorrencias: formData.intercorrencias || null,
        status_final: "Concluído"
      });
      await base44.entities.Paciente.update(pacienteId, {
        transporte: {
          ...paciente.transporte,
          intercorrencias: formData.intercorrencias || "",
          data_hora_chegada_destino: new Date().toISOString(),
          status_transporte: "Concluído",
          relatorio_transporte_url: resultado.data.file_url
        },
        status: "Aguardando Hemodinâmica",
        relatorio_transporte_url: resultado.data.file_url
      });
      setGerandoPDF(false);
      // Abrir PDF automaticamente
      window.open(resultado.data.file_url, '_blank');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['paciente', pacienteId]);
      alert("Transporte concluído! Relatório PDF gerado e aberto.");
      navigate(createPageUrl("Dashboard"));
    },
    onError: () => setGerandoPDF(false)
  });

  const finalizarComIntercorrencia = useMutation({
    mutationFn: async () => {
      if (!formData.motivo_intercorrencia) throw new Error("Selecione um motivo de intercorrência.");
      setGerandoPDF(true);
      const motivoFinal = formData.motivo_intercorrencia === "Outro"
        ? `Outro: ${formData.motivo_detalhado}`
        : formData.motivo_intercorrencia;

      const dataHoraFim = new Date().toISOString();

      const resultado = await base44.functions.invoke('generateRelatorioTransporte', {
        pacienteId,
        intercorrencias: formData.intercorrencias || null,
        motivo_intercorrencia: motivoFinal,
        acoes_tomadas: formData.acoes_tomadas || null,
        status_final: "Com Intercorrência"
      });

      // Histórico completo da intercorrência
      const registroIntercorrencia = {
        data_hora: dataHoraFim,
        motivo: motivoFinal,
        descricao: formData.intercorrencias || "",
        acoes_tomadas: formData.acoes_tomadas || "",
        relatorio_url: resultado.data.file_url,
        tipo_transporte: paciente.transporte?.tipo_transporte || "",
        central: paciente.transporte?.central_transporte || "",
        destino: paciente.transporte?.unidade_destino || paciente.regulacao_central?.unidade_destino || "",
        registrado_por: "equipe_transporte"
      };

      const historicoAnterior = paciente.transporte?.historico_intercorrencias || [];

      await base44.entities.Paciente.update(pacienteId, {
        transporte: {
          ...paciente.transporte,
          intercorrencias: formData.intercorrencias || "",
          motivo_intercorrencia: motivoFinal,
          acoes_tomadas: formData.acoes_tomadas || "",
          data_hora_chegada_destino: dataHoraFim,
          status_transporte: "Com Intercorrência",
          relatorio_transporte_url: resultado.data.file_url,
          historico_intercorrencias: [...historicoAnterior, registroIntercorrencia]
        },
        status: "Concluído",
        relatorio_transporte_url: resultado.data.file_url
      });

      // Notificar via mensagem interna no chat do paciente (CERH e ASSCARDIO monitoram)
      const msgTexto = `⚠️ INTERCORRÊNCIA NO TRANSPORTE\n\nPaciente: ${paciente.nome_completo}\nMotivo: ${motivoFinal}${formData.intercorrencias ? `\nDescrição: ${formData.intercorrencias}` : ""}${formData.acoes_tomadas ? `\nAções tomadas: ${formData.acoes_tomadas}` : ""}\nData/Hora: ${new Date(dataHoraFim).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n\nStatus atualizado para: CONCLUÍDO COM INTERCORRÊNCIA`;

      await base44.entities.Mensagem.create({
        paciente_id: pacienteId,
        remetente_nome: "Sistema - Transporte",
        remetente_email: "sistema@coracaoparaibano",
        equipe_remetente: "unidade_saude",
        mensagem: msgTexto,
        data_hora: dataHoraFim
      });

      // Notificação por email para CERH (se houver email de regulação)
      const emailCERH = paciente.regulacao_central?.email_regulador || null;
      if (emailCERH) {
        await base44.integrations.Core.SendEmail({
          to: emailCERH,
          subject: `⚠️ Intercorrência no Transporte - ${paciente.nome_completo}`,
          body: `<h2>⚠️ INTERCORRÊNCIA NO TRANSPORTE</h2><p><strong>Paciente:</strong> ${paciente.nome_completo}</p><p><strong>Motivo:</strong> ${motivoFinal}</p>${formData.intercorrencias ? `<p><strong>Descrição:</strong> ${formData.intercorrencias}</p>` : ""}${formData.acoes_tomadas ? `<p><strong>Ações tomadas:</strong> ${formData.acoes_tomadas}</p>` : ""}<p><strong>Data/Hora:</strong> ${new Date(dataHoraFim).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p><p>Acesse o sistema para mais detalhes.</p>`
        });
      }

      setGerandoPDF(false);
      window.open(resultado.data.file_url, '_blank');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['paciente', pacienteId]);
      alert("Transporte finalizado com intercorrência! Relatório PDF gerado, histórico salvo e equipes notificadas.");
      navigate(createPageUrl("Dashboard"));
    },
    onError: (err) => {
      setGerandoPDF(false);
      alert(err.message || "Erro ao finalizar.");
    }
  });

  if (isLoading) {
    return <div className="p-8">Carregando...</div>;
  }

  if (!paciente) {
    return <div className="p-8">Paciente não encontrado</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate(createPageUrl("Dashboard"))}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-8 h-8 text-yellow-600" />
              TRANSPORTE - Gestão de Deslocamento
            </h1>
            <p className="text-gray-600">Coordenação e registro de transporte</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda */}
          <div className="lg:col-span-1 space-y-6">
            <DadosPaciente paciente={paciente} />

            {/* Status do Transporte - Visível para todos monitorarem */}
            {transporteIniciado && (
              <Card className={`border-2 ${transporteFinalizado ? (paciente.transporte.status_transporte === "Com Intercorrência" ? "border-red-400 bg-red-50" : "border-green-400 bg-green-50") : "border-yellow-400 bg-yellow-50"}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {transporteFinalizado
                      ? paciente.transporte.status_transporte === "Com Intercorrência"
                        ? <><AlertTriangle className="w-4 h-4 text-red-600" /><span className="text-red-700">Transporte c/ Intercorrência</span></>
                        : <><CheckCircle className="w-4 h-4 text-green-600" /><span className="text-green-700">Transporte Concluído</span></>
                      : <><Clock className="w-4 h-4 text-yellow-600" /><span className="text-yellow-700">Em Deslocamento</span></>
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div>
                    <p className="font-semibold text-gray-700">Tipo:</p>
                    <p>{paciente.transporte.tipo_transporte}</p>
                  </div>
                  {paciente.transporte.central_transporte && (
                    <div>
                      <p className="font-semibold text-gray-700">Central:</p>
                      <p>{paciente.transporte.central_transporte}</p>
                    </div>
                  )}
                  {paciente.transporte.unidade_destino && (
                    <div>
                      <p className="font-semibold text-gray-700">Destino:</p>
                      <p className="font-bold">{paciente.transporte.unidade_destino}</p>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-700">Início:</p>
                    <p>{format(new Date(paciente.transporte.data_hora_inicio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  </div>
                  {paciente.transporte.data_hora_chegada_destino && (
                    <div>
                      <p className="font-semibold text-gray-700">Chegada ao Destino:</p>
                      <p>{format(new Date(paciente.transporte.data_hora_chegada_destino), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                    </div>
                  )}
                  {paciente.transporte.motivo_intercorrencia && (
                    <div className="p-2 bg-red-100 rounded border border-red-300">
                      <p className="font-semibold text-red-800">Motivo Intercorrência:</p>
                      <p className="text-red-700">{paciente.transporte.motivo_intercorrencia}</p>
                    </div>
                  )}
                  {paciente.transporte.intercorrencias && (
                    <div>
                      <p className="font-semibold text-gray-700">Observações:</p>
                      <p className="text-gray-600 whitespace-pre-wrap">{paciente.transporte.intercorrencias}</p>
                    </div>
                  )}
                  {paciente.relatorio_transporte_url && (
                    <Button
                      size="sm"
                      onClick={() => window.open(paciente.relatorio_transporte_url, '_blank')}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 mt-2"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Ver Relatório PDF
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            <LinhaTempo paciente={paciente} />
          </div>

          {/* Coluna Direita */}
          <div className="lg:col-span-2 space-y-6">
            {/* Destino Regulado */}
            {paciente.regulacao_central?.unidade_destino && (
              <Card className="border-indigo-200 bg-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-700">
                    <MapPin className="w-5 h-5" />
                    Destino Regulado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-bold">{paciente.regulacao_central.unidade_destino}</p>
                  {paciente.regulacao_central.observacoes_regulacao && (
                    <p className="text-sm text-indigo-700 mt-2">{paciente.regulacao_central.observacoes_regulacao}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Relatório da Unidade */}
            {paciente.relatorio_triagem_url && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Relatório da Unidade de Saúde
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => window.open(paciente.relatorio_triagem_url, '_blank')} className="w-full">
                    <FileText className="w-4 h-4 mr-2" />Visualizar Relatório
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* === ETAPA 1: Configurar e Iniciar Transporte (antes de iniciar) === */}
            {!transporteIniciado && (
              <Card className="border-2 border-yellow-400">
                <CardHeader className="bg-yellow-50">
                  <CardTitle className="flex items-center gap-2 text-yellow-800">
                    <Truck className="w-5 h-5" />
                    Configurar Transporte
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div>
                    <Label>Central de Transporte</Label>
                    <Select
                      value={formData.central_transporte}
                      onValueChange={(value) => setFormData({...formData, central_transporte: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a central" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COFIH">COFIH</SelectItem>
                        <SelectItem value="Central/Ambulância Municipal">Central/Ambulância Municipal</SelectItem>
                        <SelectItem value="SAMU JP">SAMU JP</SelectItem>
                        <SelectItem value="SAMU CG">SAMU CG</SelectItem>
                        <SelectItem value="SAMU MONTEIRO">SAMU MONTEIRO</SelectItem>
                        <SelectItem value="SAMU PATOS">SAMU PATOS</SelectItem>
                        <SelectItem value="SAMU SOUSA">SAMU SOUSA</SelectItem>
                        <SelectItem value="SAMU PIANCÓ">SAMU PIANCÓ</SelectItem>
                        <SelectItem value="SAMU CAJAZEIRAS">SAMU CAJAZEIRAS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tipo de Transporte</Label>
                    <Select
                      value={formData.tipo_transporte}
                      onValueChange={(value) => setFormData({...formData, tipo_transporte: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USA CORAÇÃO PARAIBANO">USA CORAÇÃO PARAIBANO</SelectItem>
                        <SelectItem value="USA SAMU">USA SAMU</SelectItem>
                        <SelectItem value="USA MUNICIPAL">USA MUNICIPAL</SelectItem>
                        <SelectItem value="USB COM MÉDICO">USB COM MÉDICO</SelectItem>
                        <SelectItem value="USA ASA FIXA GRAME">USA ASA FIXA GRAME</SelectItem>
                        <SelectItem value="USA ASA ROTATIVA SAMU">USA ASA ROTATIVA SAMU</SelectItem>
                        <SelectItem value="USA ASA ROTATIVA GRAME">USA ASA ROTATIVA GRAME</SelectItem>
                        <SelectItem value="OUTRO">OUTRO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={() => iniciarTransporte.mutate()}
                    disabled={iniciarTransporte.isPending}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white text-base py-6"
                  >
                    <Truck className="w-5 h-5 mr-2" />
                    {iniciarTransporte.isPending ? "Iniciando..." : "🚑 INICIAR TRANSPORTE"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* === ETAPA 2: Transporte em andamento === */}
            {transporteIniciado && !transporteFinalizado && (
              <Card className="border-2 border-yellow-500 bg-yellow-50">
                <CardHeader className="bg-yellow-100">
                  <CardTitle className="flex items-center gap-2 text-yellow-800">
                    <Clock className="w-5 h-5" />
                    Transporte em Andamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-lg border border-yellow-300 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">TIPO</p>
                      <p className="font-bold">{paciente.transporte.tipo_transporte}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">INÍCIO</p>
                      <p className="font-bold">{format(new Date(paciente.transporte.data_hora_inicio), "HH:mm 'de' dd/MM", { locale: ptBR })}</p>
                    </div>
                    {paciente.transporte.unidade_destino && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 font-semibold">DESTINO</p>
                        <p className="font-bold text-indigo-700">{paciente.transporte.unidade_destino}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Observações / Intercorrências durante o Trajeto (opcional)</Label>
                    <Textarea
                      value={formData.intercorrencias}
                      onChange={(e) => setFormData({...formData, intercorrencias: e.target.value})}
                      placeholder="Registre quaisquer observações durante o transporte..."
                      rows={3}
                    />
                  </div>

                  {/* Botão Transporte Finalizado (sem intercorrência grave) */}
                  {!formData.showIntercorrencia && (
                    <Button
                      onClick={() => finalizarTransporte.mutate()}
                      disabled={finalizarTransporte.isPending || gerandoPDF}
                      className="w-full bg-green-600 hover:bg-green-700 text-white text-base py-6"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {gerandoPDF ? "Gerando PDF..." : finalizarTransporte.isPending ? "Finalizando..." : "✅ TRANSPORTE FINALIZADO - PACIENTE ENTREGUE"}
                    </Button>
                  )}

                  {/* Separador */}
                  {!formData.showIntercorrencia && (
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-300" /></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-yellow-50 px-2 text-gray-500">ou</span></div>
                    </div>
                  )}

                  {/* Botão para intercorrência */}
                  {!formData.showIntercorrencia && (
                    <Button
                      onClick={() => setFormData({...formData, showIntercorrencia: true})}
                      variant="outline"
                      className="w-full border-red-400 text-red-700 hover:bg-red-50"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Houve Intercorrência no Transporte
                    </Button>
                  )}

                  {/* Formulário de intercorrência */}
                  {formData.showIntercorrencia && (
                    <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg space-y-3">
                      <div className="flex items-center gap-2 text-red-700 font-semibold">
                        <AlertTriangle className="w-5 h-5" />
                        Registrar Intercorrência
                      </div>
                      <div>
                        <Label className="text-red-800 font-semibold">Motivo da Intercorrência *</Label>
                        <Select
                          value={formData.motivo_intercorrencia}
                          onValueChange={(value) => setFormData({...formData, motivo_intercorrencia: value})}
                        >
                          <SelectTrigger className="mt-1 border-red-300">
                            <SelectValue placeholder="Selecione o motivo" />
                          </SelectTrigger>
                          <SelectContent>
                            {MOTIVOS_INTERCORRENCIA.map(m => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.motivo_intercorrencia === "Outro" && (
                        <div>
                          <Label className="text-red-800">Descreva o motivo</Label>
                          <Textarea
                            value={formData.motivo_detalhado}
                            onChange={(e) => setFormData({...formData, motivo_detalhado: e.target.value})}
                            placeholder="Descreva o motivo..."
                            rows={2}
                            className="border-red-300"
                          />
                        </div>
                      )}

                      <div>
                        <Label className="text-red-800 font-semibold">Ações Tomadas / Solução Aplicada</Label>
                        <Textarea
                          value={formData.acoes_tomadas}
                          onChange={(e) => setFormData({...formData, acoes_tomadas: e.target.value})}
                          placeholder="Descreva as ações tomadas pela equipe para resolver ou mitigar a intercorrência..."
                          rows={3}
                          className="mt-1 border-red-300"
                        />
                      </div>

                      <div className="p-2 bg-orange-50 border border-orange-300 rounded text-xs text-orange-800">
                        📢 Ao finalizar, a equipe CERH e a unidade de origem serão notificadas automaticamente via chat interno do sistema.
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => finalizarComIntercorrencia.mutate()}
                          disabled={finalizarComIntercorrencia.isPending || gerandoPDF || !formData.motivo_intercorrencia}
                          className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {gerandoPDF ? "Gerando PDF..." : finalizarComIntercorrencia.isPending ? "Finalizando..." : "Finalizar e Gerar Relatório"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setFormData({...formData, showIntercorrencia: false, motivo_intercorrencia: "", motivo_detalhado: ""})}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* === ETAPA 3: Transporte Finalizado === */}
            {transporteFinalizado && (
              <Card className={`border-2 ${paciente.transporte.status_transporte === "Com Intercorrência" ? "border-red-400 bg-red-50" : "border-green-400 bg-green-50"}`}>
                <CardHeader className={paciente.transporte.status_transporte === "Com Intercorrência" ? "bg-red-100" : "bg-green-100"}>
                  <CardTitle className={`flex items-center gap-2 ${paciente.transporte.status_transporte === "Com Intercorrência" ? "text-red-700" : "text-green-700"}`}>
                    {paciente.transporte.status_transporte === "Com Intercorrência"
                      ? <><AlertTriangle className="w-5 h-5" /> Transporte Finalizado com Intercorrência</>
                      : <><CheckCircle className="w-5 h-5" /> Transporte Concluído com Sucesso</>
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">INÍCIO</p>
                      <p className="font-bold">{format(new Date(paciente.transporte.data_hora_inicio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">CHEGADA AO DESTINO</p>
                      <p className="font-bold">{format(new Date(paciente.transporte.data_hora_chegada_destino), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                    </div>
                  </div>
                  {paciente.transporte.motivo_intercorrencia && (
                    <div className="p-3 bg-red-100 rounded-lg border border-red-300 space-y-2">
                      <div>
                        <p className="text-xs font-semibold text-red-800">MOTIVO INTERCORRÊNCIA</p>
                        <p className="text-red-700">{paciente.transporte.motivo_intercorrencia}</p>
                      </div>
                      {paciente.transporte.intercorrencias && (
                        <div>
                          <p className="text-xs font-semibold text-red-800">DESCRIÇÃO</p>
                          <p className="text-red-700 text-sm whitespace-pre-wrap">{paciente.transporte.intercorrencias}</p>
                        </div>
                      )}
                      {paciente.transporte.acoes_tomadas && (
                        <div className="p-2 bg-green-50 border border-green-300 rounded">
                          <p className="text-xs font-semibold text-green-800">AÇÕES TOMADAS / SOLUÇÃO</p>
                          <p className="text-green-800 text-sm whitespace-pre-wrap">{paciente.transporte.acoes_tomadas}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {paciente.transporte.historico_intercorrencias?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-gray-600 mb-1">HISTÓRICO DE INTERCORRÊNCIAS ({paciente.transporte.historico_intercorrencias.length})</p>
                      <div className="space-y-2">
                        {paciente.transporte.historico_intercorrencias.map((item, idx) => (
                          <div key={idx} className="p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                            <p className="font-semibold text-gray-700">{new Date(item.data_hora).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
                            <p><span className="font-semibold">Motivo:</span> {item.motivo}</p>
                            {item.acoes_tomadas && <p><span className="font-semibold">Ações:</span> {item.acoes_tomadas}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {paciente.relatorio_transporte_url && (
                    <Button
                      onClick={() => window.open(paciente.relatorio_transporte_url, '_blank')}
                      className="w-full bg-yellow-600 hover:bg-yellow-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Abrir Relatório PDF do Transporte
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}