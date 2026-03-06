import React, { useState } from "react"; // v2
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
import { ArrowLeft, Truck, FileText, Save, MapPin, AlertTriangle, Download } from "lucide-react";
import DadosPaciente from "@/components/regulacao/DadosPaciente";
import LinhaTempo from "@/components/regulacao/LinhaTempo";
import { Badge } from "@/components/ui/badge";

export default function TransporteDetalhe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const pacienteId = urlParams.get('id');

  const [formData, setFormData] = useState({
    central_transporte: "",
    tipo_transporte: "USA CORAÇÃO PARAIBANO",
    intercorrencias: "",
    motivo_nao_finalizado: "",
    status_transporte: "Aguardando"
  });

  const { data: paciente, isLoading } = useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: () => base44.entities.Paciente.list().then(list => list.find(p => p.id === pacienteId)),
    enabled: !!pacienteId
  });

  const iniciarTransporte = useMutation({
    mutationFn: async () => {
      await base44.entities.Paciente.update(pacienteId, {
        transporte: {
          ...formData,
          data_hora_solicitacao: paciente.transporte?.data_hora_solicitacao || new Date().toISOString(),
          data_hora_inicio: new Date().toISOString(),
          status_transporte: "Em Deslocamento"
        },
        status: "Em Transporte"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['paciente', pacienteId]);
      alert("Transporte iniciado!");
    }
  });

  const finalizarTransporte = useMutation({
    mutationFn: async () => {
      const resultado = await base44.functions.invoke('generateRelatorioTransporte', { pacienteId });
      await base44.entities.Paciente.update(pacienteId, {
        transporte: {
          ...paciente.transporte,
          ...formData,
          data_hora_chegada_destino: new Date().toISOString(),
          status_transporte: "Concluído",
          relatorio_url: resultado.data.file_url
        },
        status: "Aguardando Hemodinâmica",
        relatorio_hemodinamica_url: resultado.data.file_url
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['paciente', pacienteId]);
      alert("Transporte concluído e relatório gerado!");
      navigate(createPageUrl("Dashboard"));
    }
  });

  const finalizarSemSucesso = useMutation({
    mutationFn: async () => {
      const resultado = await base44.functions.invoke('generateRelatorioTransporte', { pacienteId, motivo: formData.motivo_nao_finalizado });
      await base44.entities.Paciente.update(pacienteId, {
        transporte: {
          ...paciente.transporte,
          ...formData,
          data_hora_chegada_destino: new Date().toISOString(),
          status_transporte: "Não Finalizado",
          motivo_nao_finalizado: formData.motivo_nao_finalizado,
          relatorio_url: resultado.data.file_url
        },
        status: "Concluído",
        relatorio_hemodinamica_url: resultado.data.file_url
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['paciente', pacienteId]);
      alert("Transporte finalizado com motivo registrado!");
      navigate(createPageUrl("Dashboard"));
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
            <LinhaTempo paciente={paciente} />
          </div>

          {/* Coluna Direita */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações de Destino */}
            {paciente.regulacao_central?.unidade_destino && (
              <Card className="border-indigo-200 bg-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-700">
                    <MapPin className="w-5 h-5" />
                    Destino Regulado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <p className="text-sm font-semibold text-indigo-800">Unidade de Destino</p>
                    <p className="text-lg font-bold">{paciente.regulacao_central.unidade_destino}</p>
                  </div>
                  {paciente.regulacao_central.observacoes_regulacao && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-indigo-800">Observações</p>
                      <p className="text-sm">{paciente.regulacao_central.observacoes_regulacao}</p>
                    </div>
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
                  <Button
                    onClick={() => window.open(paciente.relatorio_triagem_url, '_blank')}
                    className="w-full"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Visualizar Relatório
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Formulário de Transporte */}
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Transporte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                {!paciente.transporte?.data_hora_inicio && (
                  <div>
                    <Button
                      onClick={() => iniciarTransporte.mutate()}
                      disabled={iniciarTransporte.isPending}
                      className="w-full bg-yellow-600 hover:bg-yellow-700"
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      {iniciarTransporte.isPending ? "Iniciando..." : "Iniciar Transporte"}
                    </Button>
                  </div>
                )}

                <div>
                  <Label>Intercorrências durante o Trajeto</Label>
                  <Textarea
                    value={formData.intercorrencias}
                    onChange={(e) => setFormData({...formData, intercorrencias: e.target.value})}
                    placeholder="Registre aqui quaisquer intercorrências durante o transporte..."
                    rows={5}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    {paciente.transporte?.data_hora_inicio && !paciente.transporte?.data_hora_chegada_destino && (
                      <>
                        <Button
                          onClick={() => finalizarTransporte.mutate()}
                          disabled={finalizarTransporte.isPending}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {finalizarTransporte.isPending ? "Finalizando..." : "PACIENTE ENTREGUE"}
                        </Button>
                        <Button
                          onClick={() => setFormData({...formData, showMotivo: true})}
                          disabled={finalizarSemSucesso.isPending}
                          variant="outline"
                          className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Finalizar Transporte
                        </Button>
                      </>
                    )}
                  </div>

                  {formData.showMotivo && paciente.transporte?.data_hora_inicio && !paciente.transporte?.data_hora_chegada_destino && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
                      <Label className="text-red-700 font-semibold">Motivo da Não Finalização</Label>
                      <Select 
                        value={formData.motivo_nao_finalizado} 
                        onValueChange={(value) => setFormData({...formData, motivo_nao_finalizado: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o motivo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="óbito_transporte">Óbito no Transporte</SelectItem>
                          <SelectItem value="sinistro_transito">Sinistro de Trânsito Impediu Deslocamento</SelectItem>
                          <SelectItem value="paciente_nao_sera_encaminhado">Paciente Não Será Mais Encaminhado</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      {formData.motivo_nao_finalizado === "outro" && (
                        <Textarea
                          value={formData.motivo_detalhado || ""}
                          onChange={(e) => setFormData({...formData, motivo_detalhado: e.target.value})}
                          placeholder="Descreva o motivo..."
                          rows={3}
                        />
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => finalizarSemSucesso.mutate()}
                          disabled={finalizarSemSucesso.isPending || !formData.motivo_nao_finalizado}
                          className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {finalizarSemSucesso.isPending ? "Finalizando..." : "Gerar Relatório e Finalizar"}
                        </Button>
                        <Button
                          onClick={() => setFormData({...formData, showMotivo: false, motivo_nao_finalizado: ""})}
                          variant="outline"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {paciente.transporte?.status_transporte && (
                  <div className="pt-4 border-t">
                    <Badge>Status: {paciente.transporte.status_transporte}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}