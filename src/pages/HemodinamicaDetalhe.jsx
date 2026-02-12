import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Activity, FileText, Save } from "lucide-react";
import DadosPaciente from "@/components/regulacao/DadosPaciente";
import LinhaTempo from "@/components/regulacao/LinhaTempo";
import { Badge } from "@/components/ui/badge";

export default function HemodinamicaDetalhe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const pacienteId = urlParams.get('id');

  const [formData, setFormData] = useState({
    procedimento_realizado: "",
    intercorrencias: "",
    desfecho: "Sucesso",
    observacoes: ""
  });

  const { data: paciente, isLoading } = useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: () => base44.entities.Paciente.list().then(list => list.find(p => p.id === pacienteId)),
    enabled: !!pacienteId
  });

  const registrarChegada = useMutation({
    mutationFn: async () => {
      await base44.entities.Paciente.update(pacienteId, {
        hemodinamica: {
          data_hora_chegada: new Date().toISOString()
        },
        status: "Aguardando Hemodinâmica"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['paciente', pacienteId]);
      alert("Chegada registrada!");
    }
  });

  const iniciarProcedimento = useMutation({
    mutationFn: async () => {
      await base44.entities.Paciente.update(pacienteId, {
        hemodinamica: {
          ...paciente.hemodinamica,
          data_hora_inicio_procedimento: new Date().toISOString()
        },
        status: "Em Procedimento"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['paciente', pacienteId]);
      alert("Procedimento iniciado!");
    }
  });

  const finalizarCaso = useMutation({
    mutationFn: async () => {
      const dataHoraFim = new Date();
      const dataHoraInicio = new Date(paciente.hemodinamica.data_hora_inicio_procedimento);
      const portaBalao = Math.round((dataHoraFim - dataHoraInicio) / 60000);

      await base44.entities.Paciente.update(pacienteId, {
        hemodinamica: {
          ...paciente.hemodinamica,
          ...formData,
          data_hora_fim_procedimento: dataHoraFim.toISOString(),
          porta_balao_minutos: portaBalao
        },
        status: "Concluído"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['paciente', pacienteId]);
      alert("Caso finalizado com sucesso!");
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
              <Activity className="w-8 h-8 text-pink-600" />
              HEMODINÂMICA - Procedimento
            </h1>
            <p className="text-gray-600">Registro de procedimento e desfecho</p>
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

            {/* Controles de Etapas */}
            <Card>
              <CardHeader>
                <CardTitle>Controle de Procedimento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!paciente.hemodinamica?.data_hora_chegada && (
                  <Button
                    onClick={() => registrarChegada.mutate()}
                    disabled={registrarChegada.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {registrarChegada.isPending ? "Registrando..." : "Registrar Chegada"}
                  </Button>
                )}

                {paciente.hemodinamica?.data_hora_chegada && !paciente.hemodinamica?.data_hora_inicio_procedimento && (
                  <Button
                    onClick={() => iniciarProcedimento.mutate()}
                    disabled={iniciarProcedimento.isPending}
                    className="w-full bg-pink-600 hover:bg-pink-700"
                  >
                    {iniciarProcedimento.isPending ? "Iniciando..." : "Iniciar Procedimento"}
                  </Button>
                )}

                {paciente.hemodinamica?.data_hora_chegada && (
                  <div className="pt-3 border-t">
                    <Badge className="bg-green-600">
                      Chegada: {new Date(paciente.hemodinamica.data_hora_chegada).toLocaleString('pt-BR')}
                    </Badge>
                  </div>
                )}

                {paciente.hemodinamica?.data_hora_inicio_procedimento && (
                  <div className="pt-2">
                    <Badge className="bg-pink-600">
                      Início: {new Date(paciente.hemodinamica.data_hora_inicio_procedimento).toLocaleString('pt-BR')}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Formulário de Finalização */}
            {paciente.hemodinamica?.data_hora_inicio_procedimento && !paciente.hemodinamica?.data_hora_fim_procedimento && (
              <Card>
                <CardHeader>
                  <CardTitle>Finalização do Caso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Procedimento Realizado</Label>
                    <Textarea
                      value={formData.procedimento_realizado}
                      onChange={(e) => setFormData({...formData, procedimento_realizado: e.target.value})}
                      placeholder="Descreva o procedimento realizado..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label>Intercorrências</Label>
                    <Textarea
                      value={formData.intercorrencias}
                      onChange={(e) => setFormData({...formData, intercorrencias: e.target.value})}
                      placeholder="Registre intercorrências durante o procedimento..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Desfecho</Label>
                    <Select 
                      value={formData.desfecho} 
                      onValueChange={(value) => setFormData({...formData, desfecho: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sucesso">Sucesso</SelectItem>
                        <SelectItem value="Complicações">Complicações</SelectItem>
                        <SelectItem value="Óbito">Óbito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      value={formData.observacoes}
                      onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                      placeholder="Observações adicionais..."
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={() => finalizarCaso.mutate()}
                    disabled={finalizarCaso.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {finalizarCaso.isPending ? "Finalizando..." : "Finalizar Caso"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}