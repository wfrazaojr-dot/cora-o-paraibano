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
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Heart, FileText, Save } from "lucide-react";
import DadosPaciente from "@/components/regulacao/DadosPaciente";
import LinhaTempo from "@/components/regulacao/LinhaTempo";

export default function ASSCARDIODetalhe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const pacienteId = urlParams.get('id');

  const [formData, setFormData] = useState({
    cardiologista_nome: "",
    cardiologista_crm: "",
    enfermeiro_nome: "",
    enfermeiro_coren: "",
    diagnostico: "",
    conduta: "",
    parecer_cardiologista: "",
    parecer_enfermeiro: "",
    indicacao_hemodinamica: false,
    urgencia: "Urgente"
  });

  const { data: paciente, isLoading } = useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: () => base44.entities.Paciente.list().then(list => list.find(p => p.id === pacienteId)),
    enabled: !!pacienteId
  });

  const salvarParecer = useMutation({
    mutationFn: async () => {
      await base44.entities.Paciente.update(pacienteId, {
        assessoria_cardiologia: {
          ...formData,
          data_hora: new Date().toISOString()
        },
        status: "Aguardando Regulação"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['paciente', pacienteId]);
      alert("Parecer ASSCARDIO salvo com sucesso!");
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
              <Heart className="w-8 h-8 text-red-600" />
              ASSCARDIO - Parecer Cardiológico
            </h1>
            <p className="text-gray-600">Avaliação e conduta especializada</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda - Dados do Paciente e Linha do Tempo */}
          <div className="lg:col-span-1 space-y-6">
            <DadosPaciente paciente={paciente} />
            <LinhaTempo paciente={paciente} />
          </div>

          {/* Coluna Direita - Relatório e Formulário */}
          <div className="lg:col-span-2 space-y-6">
            {/* Relatório da Unidade de Saúde */}
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
                    Visualizar Relatório Completo
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Formulário de Parecer */}
            <Card>
              <CardHeader>
                <CardTitle>Parecer Cardiológico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome do Cardiologista</Label>
                    <Input
                      value={formData.cardiologista_nome}
                      onChange={(e) => setFormData({...formData, cardiologista_nome: e.target.value})}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <Label>CRM</Label>
                    <Input
                      value={formData.cardiologista_crm}
                      onChange={(e) => setFormData({...formData, cardiologista_crm: e.target.value})}
                      placeholder="CRM"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome do Enfermeiro</Label>
                    <Input
                      value={formData.enfermeiro_nome}
                      onChange={(e) => setFormData({...formData, enfermeiro_nome: e.target.value})}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <Label>COREN</Label>
                    <Input
                      value={formData.enfermeiro_coren}
                      onChange={(e) => setFormData({...formData, enfermeiro_coren: e.target.value})}
                      placeholder="COREN"
                    />
                  </div>
                </div>

                <div>
                  <Label>Diagnóstico</Label>
                  <Textarea
                    value={formData.diagnostico}
                    onChange={(e) => setFormData({...formData, diagnostico: e.target.value})}
                    placeholder="Diagnóstico cardiológico..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Conduta</Label>
                  <Textarea
                    value={formData.conduta}
                    onChange={(e) => setFormData({...formData, conduta: e.target.value})}
                    placeholder="Conduta recomendada..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Parecer do Cardiologista</Label>
                  <Textarea
                    value={formData.parecer_cardiologista}
                    onChange={(e) => setFormData({...formData, parecer_cardiologista: e.target.value})}
                    placeholder="Parecer detalhado..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Parecer do Enfermeiro</Label>
                  <Textarea
                    value={formData.parecer_enfermeiro}
                    onChange={(e) => setFormData({...formData, parecer_enfermeiro: e.target.value})}
                    placeholder="Parecer de enfermagem..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hemodinamica"
                    checked={formData.indicacao_hemodinamica}
                    onCheckedChange={(checked) => setFormData({...formData, indicacao_hemodinamica: checked})}
                  />
                  <Label htmlFor="hemodinamica">Indicação de Hemodinâmica</Label>
                </div>

                <div>
                  <Label>Urgência</Label>
                  <Select value={formData.urgencia} onValueChange={(value) => setFormData({...formData, urgencia: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Emergência">Emergência</SelectItem>
                      <SelectItem value="Urgente">Urgente</SelectItem>
                      <SelectItem value="Eletivo">Eletivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => salvarParecer.mutate()}
                  disabled={salvarParecer.isPending}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {salvarParecer.isPending ? "Salvando..." : "Enviar Parecer para CERH"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}