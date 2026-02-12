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
import { ArrowLeft, Truck, FileText, Save, MapPin } from "lucide-react";
import DadosPaciente from "@/components/regulacao/DadosPaciente";
import LinhaTempo from "@/components/regulacao/LinhaTempo";
import { Badge } from "@/components/ui/badge";

export default function TransporteDetalhe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const pacienteId = urlParams.get('id');

  const [formData, setFormData] = useState({
    equipe_responsavel: "",
    tipo_transporte: "SAMU",
    intercorrencias: "",
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
      await base44.entities.Paciente.update(pacienteId, {
        transporte: {
          ...paciente.transporte,
          ...formData,
          data_hora_chegada_destino: new Date().toISOString(),
          status_transporte: "Concluído"
        },
        status: "Aguardando Hemodinâmica"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['paciente', pacienteId]);
      alert("Transporte concluído!");
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
                  <Label>Equipe Responsável</Label>
                  <Input
                    value={formData.equipe_responsavel}
                    onChange={(e) => setFormData({...formData, equipe_responsavel: e.target.value})}
                    placeholder="Nome da equipe/viatura"
                  />
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
                      <SelectItem value="SAMU">SAMU</SelectItem>
                      <SelectItem value="Ambulância Básica">Ambulância Básica</SelectItem>
                      <SelectItem value="UTI Móvel">UTI Móvel</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Intercorrências durante o Trajeto</Label>
                  <Textarea
                    value={formData.intercorrencias}
                    onChange={(e) => setFormData({...formData, intercorrencias: e.target.value})}
                    placeholder="Registre aqui quaisquer intercorrências durante o transporte..."
                    rows={5}
                  />
                </div>

                <div className="flex gap-2">
                  {!paciente.transporte?.data_hora_inicio && (
                    <Button
                      onClick={() => iniciarTransporte.mutate()}
                      disabled={iniciarTransporte.isPending}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      {iniciarTransporte.isPending ? "Iniciando..." : "Iniciar Transporte"}
                    </Button>
                  )}

                  {paciente.transporte?.data_hora_inicio && !paciente.transporte?.data_hora_chegada_destino && (
                    <Button
                      onClick={() => finalizarTransporte.mutate()}
                      disabled={finalizarTransporte.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {finalizarTransporte.isPending ? "Finalizando..." : "Finalizar Entrega"}
                    </Button>
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