import React, { useState, useRef } from "react";
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
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CERHDetalhe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const pacienteId = urlParams.get('id');
  const relatorioRef = useRef(null);

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

  const gerarRelatorioPDF = async (pacienteData) => {
    if (!relatorioRef.current) return null;
    try {
      const canvas = await html2canvas(relatorioRef.current, {
        scale: 1.8,
        logging: false,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        imageTimeout: 15000,
        removeContainer: true
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      const pdfBlob = pdf.output('blob');
      const nomePaciente = (pacienteData?.nome_completo || 'Paciente').replace(/\s+/g, '_');
      const nomeArquivo = `Relatorio_CERH_${nomePaciente}_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`;
      const pdfFile = new File([pdfBlob], nomeArquivo, { type: 'application/pdf' });
      const uploadResult = await base44.integrations.Core.UploadFile({ file: pdfFile });
      return uploadResult.file_url;
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      throw error;
    }
  };

  const salvarRegulacao = useMutation({
    mutationFn: async () => {
      const regulacaoData = {
        ...formData,
        data_hora: new Date().toISOString()
      };
      // Primeiro salva os dados para que o ref do relatório seja renderizado
      await base44.entities.Paciente.update(pacienteId, {
        regulacao_central: regulacaoData,
        status: "Aguardando Transporte"
      });
      // Aguarda re-render para capturar o relatório
      await new Promise(resolve => setTimeout(resolve, 500));
      const file_url = await gerarRelatorioPDF(paciente);
      if (file_url) {
        await base44.entities.Paciente.update(pacienteId, {
          relatorio_cerh_url: file_url
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['paciente', pacienteId]);
      alert("Regulação CERH registrada com sucesso! Relatório PDF gerado.");
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

      {/* Template oculto para geração do PDF */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={relatorioRef} className="bg-white p-8" style={{ width: '210mm', minHeight: '297mm' }}>
          {/* Cabeçalho com logos */}
          <div className="mb-6 pb-4 border-b-2 border-gray-300">
            <div className="flex items-center justify-between gap-4 w-full mb-3">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/8e093c8da_logoSecretariadeEstadodaSade.png" alt="SES" className="h-12 w-auto object-contain" crossOrigin="anonymous" />
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/fa5f3a17e_LOGOCORAAOPARAIBANO.png" alt="Coração Paraibano" className="h-12 w-auto object-contain" crossOrigin="anonymous" />
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/006e0d9aa_LogoComplexoregulador.jpg" alt="Complexo Regulador" className="h-12 w-auto object-contain" crossOrigin="anonymous" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-indigo-700">RELATÓRIO CERH - CENTRAL DE REGULAÇÃO</h1>
              <p className="text-sm text-gray-600 mt-1">Data: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            </div>
          </div>

          {/* Dados do Paciente */}
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">DADOS DO PACIENTE</h2>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div><span className="font-semibold">Nome:</span> {paciente?.nome_completo}</div>
              <div><span className="font-semibold">Idade:</span> {paciente?.idade} anos | <span className="font-semibold">Sexo:</span> {paciente?.sexo}</div>
              <div><span className="font-semibold">Unidade de Origem:</span> {paciente?.unidade_saude}</div>
              <div><span className="font-semibold">Macrorregiâo:</span> {paciente?.macrorregiao}</div>
            </div>
          </div>

          {/* Conduta Inicial */}
          {formData.conduta_inicial?.length > 0 && (
            <div className="mb-4">
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">CONDUTA INICIAL</h2>
              <div className="text-xs space-y-1">
                {formData.conduta_inicial.map((c, i) => <p key={i}>• {c}</p>)}
                {formData.conduta_inicial_outros && <p>• Outros: {formData.conduta_inicial_outros}</p>}
              </div>
            </div>
          )}

          {/* Conduta Final */}
          {formData.conduta_final && (
            <div className="mb-4">
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">CONDUTA FINAL</h2>
              <p className="text-xs whitespace-pre-wrap">{formData.conduta_final}</p>
            </div>
          )}

          {/* Unidade de Destino */}
          {formData.unidade_destino && (
            <div className="mb-4">
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">UNIDADE DE DESTINO</h2>
              <p className="text-xs font-semibold">{formData.unidade_destino}</p>
            </div>
          )}

          {/* Observações */}
          {formData.observacoes_regulacao && (
            <div className="mb-4">
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">OBSERVAÇÕES</h2>
              <p className="text-xs whitespace-pre-wrap">{formData.observacoes_regulacao}</p>
            </div>
          )}

          {/* Parecer ASSCARDIO resumido */}
          {paciente?.assessoria_cardiologia?.parecer_cardiologista && (
            <div className="mb-4">
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">PARECER ASSCARDIO</h2>
              <div className="text-xs space-y-1">
                <p><span className="font-semibold">Cardiologista:</span> {paciente.assessoria_cardiologia.cardiologista_nome} - CRM {paciente.assessoria_cardiologia.cardiologista_crm}</p>
                {paciente.assessoria_cardiologia.diagnostico && <p><span className="font-semibold">Diagnóstico:</span> {paciente.assessoria_cardiologia.diagnostico}</p>}
                {paciente.assessoria_cardiologia.conduta && <p><span className="font-semibold">Conduta:</span> {paciente.assessoria_cardiologia.conduta}</p>}
              </div>
            </div>
          )}

          {/* Equipe CERH */}
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">EQUIPE CERH</h2>
            <div className="text-xs space-y-1">
              <p><span className="font-semibold">Médico Regulador:</span> {formData.medico_regulador_nome} - CRM {formData.medico_regulador_crm}</p>
              {formData.enfermeiro_nome && <p><span className="font-semibold">Enfermeiro:</span> {formData.enfermeiro_nome} - COREN {formData.enfermeiro_coren}</p>}
              {formData.senha_ses && <p><span className="font-semibold">Senha SES nº:</span> {formData.senha_ses}</p>}
            </div>
          </div>

          {/* Rodapé */}
          <div className="mt-8 pt-4 border-t-2 border-gray-300 text-xs text-gray-600">
            <p className="font-semibold">Sistema de Triagem de Dor Torácica - Coração Paraibano</p>
            <p>Desenvolvedor: Walber Alves Frazão Júnior - COREN 110.238</p>
            <p>Gerado em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
          </div>
        </div>
      </div>

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
                  <div className="mt-4">
                    {paciente.relatorio_asscardio_url ? (
                      <Button
                        onClick={() => window.open(paciente.relatorio_asscardio_url, '_blank')}
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Abrir Parecer Completo ASSCARDIO
                      </Button>
                    ) : (
                      <Button
                        onClick={() => navigate(createPageUrl("ASSCARDIODetalhe") + "?id=" + pacienteId)}
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Ver Detalhes do Parecer ASSCARDIO
                      </Button>
                    )}
                  </div>
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

            {/* Relatório CERH PDF */}
            {paciente.relatorio_cerh_url && (
              <Card className="border-indigo-200">
                <CardHeader className="bg-indigo-50">
                  <CardTitle className="flex items-center gap-2 text-indigo-700">
                    <FileText className="w-5 h-5" />
                    Relatório CERH
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => window.open(paciente.relatorio_cerh_url, '_blank')}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Relatório PDF
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