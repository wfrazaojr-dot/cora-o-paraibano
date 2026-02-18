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
import { ArrowLeft, Radio, FileText, Save, Heart, Download } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import DadosPaciente from "@/components/regulacao/DadosPaciente";
import LinhaTempo from "@/components/regulacao/LinhaTempo";
import { Badge } from "@/components/ui/badge";
import ChatInterno from "@/components/ChatInterno";

export default function CERHDetalhe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const pacienteId = urlParams.get('id');

  const [formData, setFormData] = useState({
    medico_regulador_nome: "",
    medico_regulador_crm: "",
    conduta_inicial: [],
    conduta_inicial_outros: "",
    conduta_final: "",
    unidade_destino: "",
    enfermeiro_nome: "",
    enfermeiro_coren: "",
    senha_ses: "",
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
            <ChatInterno pacienteId={pacienteId} />
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
                  <Label className="text-base font-semibold">Conduta Inicial (selecione as opções aplicáveis)</Label>
                  <div className="space-y-3 mt-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="conduta_asscardio"
                        checked={formData.conduta_inicial.includes("Parecer da ASSCARDIO")}
                        onCheckedChange={(checked) => {
                          const newCondutas = checked 
                            ? [...formData.conduta_inicial, "Parecer da ASSCARDIO"]
                            : formData.conduta_inicial.filter(c => c !== "Parecer da ASSCARDIO");
                          setFormData({...formData, conduta_inicial: newCondutas});
                        }}
                      />
                      <Label htmlFor="conduta_asscardio" className="font-normal cursor-pointer">Parecer da ASSCARDIO</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="conduta_troponina_1h"
                        checked={formData.conduta_inicial.includes("Envio de Resultado de Curva de Troponina US (0h e 1h)")}
                        onCheckedChange={(checked) => {
                          const newCondutas = checked 
                            ? [...formData.conduta_inicial, "Envio de Resultado de Curva de Troponina US (0h e 1h)"]
                            : formData.conduta_inicial.filter(c => c !== "Envio de Resultado de Curva de Troponina US (0h e 1h)");
                          setFormData({...formData, conduta_inicial: newCondutas});
                        }}
                      />
                      <Label htmlFor="conduta_troponina_1h" className="font-normal cursor-pointer">Envio de Resultado de Curva de Troponina US (0h e 1h)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="conduta_troponina_3h"
                        checked={formData.conduta_inicial.includes("Envio de Resultado de Curva de Troponina Convencional (0h-3h)")}
                        onCheckedChange={(checked) => {
                          const newCondutas = checked 
                            ? [...formData.conduta_inicial, "Envio de Resultado de Curva de Troponina Convencional (0h-3h)"]
                            : formData.conduta_inicial.filter(c => c !== "Envio de Resultado de Curva de Troponina Convencional (0h-3h)");
                          setFormData({...formData, conduta_inicial: newCondutas});
                        }}
                      />
                      <Label htmlFor="conduta_troponina_3h" className="font-normal cursor-pointer">Envio de Resultado de Curva de Troponina Convencional (0h-3h)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="conduta_repetir_ecg"
                        checked={formData.conduta_inicial.includes("Repetir ECG de 12 derivações")}
                        onCheckedChange={(checked) => {
                          const newCondutas = checked 
                            ? [...formData.conduta_inicial, "Repetir ECG de 12 derivações"]
                            : formData.conduta_inicial.filter(c => c !== "Repetir ECG de 12 derivações");
                          setFormData({...formData, conduta_inicial: newCondutas});
                        }}
                      />
                      <Label htmlFor="conduta_repetir_ecg" className="font-normal cursor-pointer">Repetir ECG de 12 derivações</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="conduta_ecg_v3v4r"
                        checked={formData.conduta_inicial.includes("Enviar ECG V3R e V4R")}
                        onCheckedChange={(checked) => {
                          const newCondutas = checked 
                            ? [...formData.conduta_inicial, "Enviar ECG V3R e V4R"]
                            : formData.conduta_inicial.filter(c => c !== "Enviar ECG V3R e V4R");
                          setFormData({...formData, conduta_inicial: newCondutas});
                        }}
                      />
                      <Label htmlFor="conduta_ecg_v3v4r" className="font-normal cursor-pointer">Enviar ECG V3R e V4R</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="conduta_ecg_v7v8"
                        checked={formData.conduta_inicial.includes("Enviar ECG V7 e V8")}
                        onCheckedChange={(checked) => {
                          const newCondutas = checked 
                            ? [...formData.conduta_inicial, "Enviar ECG V7 e V8"]
                            : formData.conduta_inicial.filter(c => c !== "Enviar ECG V7 e V8");
                          setFormData({...formData, conduta_inicial: newCondutas});
                        }}
                      />
                      <Label htmlFor="conduta_ecg_v7v8" className="font-normal cursor-pointer">Enviar ECG V7 e V8</Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="conduta_outros">Outros:</Label>
                      <Input
                        id="conduta_outros"
                        value={formData.conduta_inicial_outros}
                        onChange={(e) => setFormData({...formData, conduta_inicial_outros: e.target.value})}
                        placeholder="Descreva outras condutas..."
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Conduta Final</Label>
                  <Textarea
                    value={formData.conduta_final}
                    onChange={(e) => setFormData({...formData, conduta_final: e.target.value})}
                    placeholder="Descreva a conduta final..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Unidade de Saúde de Destino</Label>
                  <Input
                    value={formData.unidade_destino}
                    onChange={(e) => setFormData({...formData, unidade_destino: e.target.value})}
                    placeholder="Hospital/Unidade de destino"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Enfermeiro</Label>
                    <Input
                      value={formData.enfermeiro_nome}
                      onChange={(e) => setFormData({...formData, enfermeiro_nome: e.target.value})}
                      placeholder="Nome do enfermeiro"
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
                  <div>
                    <Label>Senha SES nº</Label>
                    <Input
                      value={formData.senha_ses}
                      onChange={(e) => setFormData({...formData, senha_ses: e.target.value})}
                      placeholder="Número da senha"
                    />
                  </div>
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

            {/* Relatório CERH */}
            {paciente.regulacao_central && (
              <Card className="border-indigo-200">
                <CardHeader className="bg-indigo-50">
                  <CardTitle className="flex items-center justify-between">
                    <span>Relatório CERH</span>
                    <Button
                      onClick={() => {
                        const relatorio = gerarRelatorioCERH();
                        const blob = new Blob([relatorio], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Relatorio_CERH_${paciente.nome_completo}_${new Date().toISOString().split('T')[0]}.txt`;
                        a.click();
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Relatório
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg font-mono text-sm">
                    <div>
                      <p className="font-bold text-indigo-900">RELATÓRIO CERH - CENTRAL DE REGULAÇÃO</p>
                      <p className="text-xs text-gray-600">
                        Data: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                    <div className="border-t pt-3">
                      <p className="font-semibold">DADOS DO PACIENTE:</p>
                      <p>Nome: {paciente.nome_completo}</p>
                      <p>Idade: {paciente.idade} anos | Sexo: {paciente.sexo}</p>
                      <p>Unidade de Origem: {paciente.unidade_saude}</p>
                    </div>
                    {paciente.regulacao_central.conduta_inicial?.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="font-semibold">CONDUTA INICIAL:</p>
                        {paciente.regulacao_central.conduta_inicial.map((conduta, idx) => (
                          <p key={idx}>• {conduta}</p>
                        ))}
                        {paciente.regulacao_central.conduta_inicial_outros && (
                          <p>• Outros: {paciente.regulacao_central.conduta_inicial_outros}</p>
                        )}
                      </div>
                    )}
                    {paciente.regulacao_central.conduta_final && (
                      <div className="border-t pt-3">
                        <p className="font-semibold">CONDUTA FINAL:</p>
                        <p>{paciente.regulacao_central.conduta_final}</p>
                      </div>
                    )}
                    {paciente.regulacao_central.unidade_destino && (
                      <div className="border-t pt-3">
                        <p className="font-semibold">UNIDADE DE DESTINO:</p>
                        <p>{paciente.regulacao_central.unidade_destino}</p>
                      </div>
                    )}
                    {paciente.regulacao_central.observacoes_regulacao && (
                      <div className="border-t pt-3">
                        <p className="font-semibold">OBSERVAÇÕES:</p>
                        <p>{paciente.regulacao_central.observacoes_regulacao}</p>
                      </div>
                    )}
                    <div className="border-t pt-3">
                      <p className="font-semibold">REGULAÇÃO REALIZADA POR:</p>
                      <p>Médico Regulador: {paciente.regulacao_central.medico_regulador_nome} - CRM {paciente.regulacao_central.medico_regulador_crm}</p>
                      {paciente.regulacao_central.enfermeiro_nome && (
                        <p>Enfermeiro: {paciente.regulacao_central.enfermeiro_nome} - COREN {paciente.regulacao_central.enfermeiro_coren}</p>
                      )}
                      {paciente.regulacao_central.senha_ses && (
                        <p>Senha SES nº: {paciente.regulacao_central.senha_ses}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  function gerarRelatorioCERH() {
    const data = new Date().toLocaleDateString('pt-BR');
    const hora = new Date().toLocaleTimeString('pt-BR');
    
    let relatorio = `RELATÓRIO CERH - CENTRAL DE REGULAÇÃO\n`;
    relatorio += `Data: ${data} às ${hora}\n`;
    relatorio += `\n===========================================\n\n`;
    
    relatorio += `DADOS DO PACIENTE:\n`;
    relatorio += `Nome: ${paciente.nome_completo}\n`;
    relatorio += `Idade: ${paciente.idade} anos | Sexo: ${paciente.sexo}\n`;
    relatorio += `Unidade de Origem: ${paciente.unidade_saude}\n\n`;
    
    if (paciente.regulacao_central?.conduta_inicial?.length > 0) {
      relatorio += `CONDUTA INICIAL:\n`;
      paciente.regulacao_central.conduta_inicial.forEach(conduta => {
        relatorio += `• ${conduta}\n`;
      });
      if (paciente.regulacao_central.conduta_inicial_outros) {
        relatorio += `• Outros: ${paciente.regulacao_central.conduta_inicial_outros}\n`;
      }
      relatorio += `\n`;
    }
    
    if (paciente.regulacao_central?.conduta_final) {
      relatorio += `CONDUTA FINAL:\n${paciente.regulacao_central.conduta_final}\n\n`;
    }
    
    if (paciente.regulacao_central?.unidade_destino) {
      relatorio += `UNIDADE DE DESTINO:\n${paciente.regulacao_central.unidade_destino}\n\n`;
    }
    
    if (paciente.regulacao_central?.observacoes_regulacao) {
      relatorio += `OBSERVAÇÕES:\n${paciente.regulacao_central.observacoes_regulacao}\n\n`;
    }
    
    relatorio += `REGULAÇÃO REALIZADA POR:\n`;
    relatorio += `Médico Regulador: ${paciente.regulacao_central?.medico_regulador_nome} - CRM ${paciente.regulacao_central?.medico_regulador_crm}\n`;
    if (paciente.regulacao_central?.enfermeiro_nome) {
      relatorio += `Enfermeiro: ${paciente.regulacao_central.enfermeiro_nome} - COREN ${paciente.regulacao_central.enfermeiro_coren}\n`;
    }
    if (paciente.regulacao_central?.senha_ses) {
      relatorio += `Senha SES nº: ${paciente.regulacao_central.senha_ses}\n`;
    }
    
    return relatorio;
  }
}