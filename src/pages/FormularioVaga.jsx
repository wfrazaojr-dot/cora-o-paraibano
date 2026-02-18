import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUp, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function FormularioVaga() {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    nome_paciente: "",
    idade: "",
    sexo: "",
    unidade_origem: "",
    diagnostico: "",
    necessidade: "",
    observacoes: "",
    documentos: []
  });

  const [uploadingFiles, setUploadingFiles] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingFiles(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      
      const results = await Promise.all(uploadPromises);
      const fileUrls = results.map(r => r.file_url);
      
      setFormData(prev => ({
        ...prev,
        documentos: [...prev.documentos, ...fileUrls]
      }));
      
      toast.success(`${files.length} arquivo(s) enviado(s) com sucesso!`);
    } catch (error) {
      toast.error("Erro ao enviar arquivos: " + error.message);
    } finally {
      setUploadingFiles(false);
    }
  };

  const enviarSolicitacao = useMutation({
    mutationFn: async () => {
      // Aqui você pode criar uma entidade específica para solicitações de vaga
      // ou enviar por email para a SES
      await base44.integrations.Core.SendEmail({
        to: user?.email || "ses@saude.pb.gov.br",
        subject: `Solicitação de Vaga - ${formData.nome_paciente}`,
        body: `
SOLICITAÇÃO DE VAGA/INTERNAÇÃO

Unidade Solicitante: ${formData.unidade_origem}
Solicitante: ${user?.full_name} (${user?.email})

DADOS DO PACIENTE:
Nome: ${formData.nome_paciente}
Idade: ${formData.idade} anos
Sexo: ${formData.sexo}

INFORMAÇÕES CLÍNICAS:
Diagnóstico: ${formData.diagnostico}
Necessidade: ${formData.necessidade}

Observações: ${formData.observacoes || 'Nenhuma'}

Total de Documentos Anexados: ${formData.documentos.length}

---
Enviado através do Sistema Coração Paraibano
Data: ${new Date().toLocaleString('pt-BR')}
        `
      });
    },
    onSuccess: () => {
      toast.success("Solicitação enviada com sucesso! Aguarde retorno da SES por e-mail.");
      setFormData({
        nome_paciente: "",
        idade: "",
        sexo: "",
        unidade_origem: "",
        diagnostico: "",
        necessidade: "",
        observacoes: "",
        documentos: []
      });
    },
    onError: (error) => {
      toast.error("Erro ao enviar solicitação: " + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.nome_paciente || !formData.idade || !formData.sexo || 
        !formData.unidade_origem || !formData.diagnostico || !formData.necessidade) {
      toast.error("Por favor, preencha todos os campos obrigatórios!");
      return;
    }

    enviarSolicitacao.mutate();
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-blue-50 to-green-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            📋 FORMULÁRIO DE SOLICITAÇÃO DE VAGA
          </h1>
          <p className="text-gray-600 mt-2">
            Preencha o formulário abaixo para solicitar vaga/internação junto à SES
          </p>
        </div>

        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-900">Dados da Solicitação</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados do Paciente */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Dados do Paciente
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome_paciente}
                      onChange={(e) => setFormData({...formData, nome_paciente: e.target.value})}
                      placeholder="Nome completo do paciente"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="idade">Idade *</Label>
                    <Input
                      id="idade"
                      type="number"
                      value={formData.idade}
                      onChange={(e) => setFormData({...formData, idade: e.target.value})}
                      placeholder="Idade em anos"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sexo">Sexo *</Label>
                    <Select value={formData.sexo} onValueChange={(v) => setFormData({...formData, sexo: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o sexo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Feminino">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="unidade">Unidade de Origem *</Label>
                    <Input
                      id="unidade"
                      value={formData.unidade_origem}
                      onChange={(e) => setFormData({...formData, unidade_origem: e.target.value})}
                      placeholder="Nome da unidade de saúde"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Informações Clínicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Informações Clínicas
                </h3>

                <div>
                  <Label htmlFor="diagnostico">Diagnóstico *</Label>
                  <Textarea
                    id="diagnostico"
                    value={formData.diagnostico}
                    onChange={(e) => setFormData({...formData, diagnostico: e.target.value})}
                    placeholder="Descreva o diagnóstico do paciente"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="necessidade">Necessidade/Motivo da Solicitação *</Label>
                  <Textarea
                    id="necessidade"
                    value={formData.necessidade}
                    onChange={(e) => setFormData({...formData, necessidade: e.target.value})}
                    placeholder="Descreva a necessidade (ex: vaga em UTI, cirurgia, etc)"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações Adicionais</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                    placeholder="Informações complementares (opcional)"
                    rows={2}
                  />
                </div>
              </div>

              {/* Upload de Documentos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Documentos do Paciente
                </h3>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <FileUp className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-sm text-gray-600 mb-1">
                      Clique para adicionar documentos
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, Imagens ou Documentos (múltiplos arquivos permitidos)
                    </p>
                  </label>
                </div>

                {formData.documentos.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <p className="font-semibold text-green-900">
                        {formData.documentos.length} documento(s) anexado(s)
                      </p>
                    </div>
                    <ul className="text-sm text-green-700 space-y-1">
                      {formData.documentos.map((doc, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span>•</span>
                          <span className="truncate">Documento {idx + 1}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {uploadingFiles && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-blue-700">Enviando arquivos...</p>
                  </div>
                )}
              </div>

              {/* Botão de Envio */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={enviarSolicitacao.isPending || uploadingFiles}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
                >
                  <Send className="w-5 h-5 mr-2" />
                  {enviarSolicitacao.isPending ? "Enviando..." : "ENVIAR SOLICITAÇÃO"}
                </Button>
              </div>

              {/* Alerta Informativo */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-900">Importante:</p>
                    <p className="text-sm text-yellow-800 mt-1">
                      Após o envio, aguarde retorno da SES por e-mail com a atualização do caso 
                      e/ou senha para internação. Em caso de urgência, entre em contato com a 
                      Central de Regulação.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}