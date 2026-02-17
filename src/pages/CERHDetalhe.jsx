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
import { ArrowLeft, Radio, FileText, Save, Heart } from "lucide-react";
import DadosPaciente from "@/components/regulacao/DadosPaciente";
import LinhaTempo from "@/components/regulacao/LinhaTempo";
import { Badge } from "@/components/ui/badge";

export default function CERHDetalhe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const pacienteId = urlParams.get('id');

  const [formData, setFormData] = useState({
    medico_regulador_nome: "",
    medico_regulador_crm: "",
    unidade_destino: "",
    observacoes_regulacao: ""
  });

  const { data: paciente, isLoading } = useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: () => base44.entities.Paciente.list().then(list => list.find(p => p.id === pacienteId)),
    enabled: !!pacienteId
  });

  const salvarRegulacao = useMutation({
    mutationFn: async () => {
      await base44.entities.Paciente.update(pacienteId, {
        regulacao_central: {
          ...formData,
          data_hora: new Date().toISOString()
        },
        status: "Aguardando Transporte"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['paciente', pacienteId]);
      alert("Regulação CERH registrada com sucesso!");
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
              <Radio className="w-8 h-8 text-indigo-600" />
              CERH - Central de Regulação
            </h1>
            <p className="text-gray-600">Busca de vaga e definição de destino</p>
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
            {/* Parecer ASSCARDIO */}
            {paciente.assessoria_cardiologia?.parecer_cardiologista && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <Heart className="w-5 h-5" />
                    Parecer ASSCARDIO
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-red-800">Cardiologista</p>
                    <p className="text-sm">{paciente.assessoria_cardiologia.cardiologista_nome} - CRM {paciente.assessoria_cardiologia.cardiologista_crm}</p>
                  </div>
                  {paciente.assessoria_cardiologia.diagnostico && (
                    <div>
                      <p className="text-sm font-semibold text-red-800">Diagnóstico</p>
                      <p className="text-sm">{paciente.assessoria_cardiologia.diagnostico}</p>
                    </div>
                  )}
                  {paciente.assessoria_cardiologia.conduta && (
                    <div>
                      <p className="text-sm font-semibold text-red-800">Conduta</p>
                      <p className="text-sm">{paciente.assessoria_cardiologia.conduta}</p>
                    </div>
                  )}
                  {paciente.assessoria_cardiologia.indicacao_hemodinamica && (
                    <Badge className="bg-red-600">Indicação de Hemodinâmica</Badge>
                  )}
                  {paciente.assessoria_cardiologia.urgencia && (
                    <Badge variant="outline" className="border-red-300">
                      Urgência: {paciente.assessoria_cardiologia.urgencia}
                    </Badge>
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

            {/* Formulário de Regulação */}
            <Card>
              <CardHeader>
                <CardTitle>Regulação e Definição de Vaga</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Médico Regulador</Label>
                    <Input
                      value={formData.medico_regulador_nome}
                      onChange={(e) => setFormData({...formData, medico_regulador_nome: e.target.value})}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <Label>CRM</Label>
                    <Input
                      value={formData.medico_regulador_crm}
                      onChange={(e) => setFormData({...formData, medico_regulador_crm: e.target.value})}
                      placeholder="CRM"
                    />
                  </div>
                </div>

                <div>
                  <Label>Unidade de Destino</Label>
                  <Input
                    value={formData.unidade_destino}
                    onChange={(e) => setFormData({...formData, unidade_destino: e.target.value})}
                    placeholder="Hospital de destino"
                  />
                </div>

                <div>
                  <Label>Observações da Regulação</Label>
                  <Textarea
                    value={formData.observacoes_regulacao}
                    onChange={(e) => setFormData({...formData, observacoes_regulacao: e.target.value})}
                    placeholder="Observações adicionais..."
                    rows={3}
                  />
                </div>

                <Button
                  onClick={() => salvarRegulacao.mutate()}
                  disabled={salvarRegulacao.isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {salvarRegulacao.isPending ? "Salvando..." : "Confirmar Regulação"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}