import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Activity, Download, User, Stethoscope, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function CentralSES() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const relatorioRef = useRef(null);
  const urlParams = new URLSearchParams(window.location.search);
  const pacienteId = urlParams.get("id");

  const [etapa, setEtapa] = useState("identificacao"); // identificacao, parecer, relatorio
  const [tipoProfissional, setTipoProfissional] = useState("");
  const [profissional, setProfissional] = useState({ nome: "", registro: "" });
  const [parecerMedico, setParecerMedico] = useState("");
  const [parecerEnfermeiro, setParecerEnfermeiro] = useState("");
  const [gerandoPDF, setGerandoPDF] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: paciente, isLoading } = useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: () => base44.entities.Paciente.filter({ id: pacienteId }).then(list => list[0]),
    enabled: !!pacienteId,
  });

  const salvarRegulacaoMutation = useMutation({
    mutationFn: async (dados) => {
      return base44.entities.Paciente.update(pacienteId, {
        regulacao_central: dados
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paciente', pacienteId] });
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
    },
  });

  const handleIdentificacao = () => {
    if (!tipoProfissional || !profissional.nome || !profissional.registro) {
      alert("Por favor, preencha todos os campos");
      return;
    }
    setEtapa("parecer");
  };

  const handleSalvarParecer = async () => {
    const regulacao = paciente?.regulacao_central || {};
    
    const dadosAtualizados = {
      ...regulacao,
      data_hora: format(new Date(), "yyyy-MM-dd'T'HH:mm")
    };

    if (tipoProfissional === "medico") {
      dadosAtualizados.medico_regulador_nome = profissional.nome;
      dadosAtualizados.medico_regulador_crm = profissional.registro;
      dadosAtualizados.parecer_medico_regulador = parecerMedico;
    } else {
      dadosAtualizados.enfermeiro_regulador_nome = profissional.nome;
      dadosAtualizados.enfermeiro_regulador_coren = profissional.registro;
      dadosAtualizados.parecer_enfermeiro_regulador = parecerEnfermeiro;
    }

    await salvarRegulacaoMutation.mutateAsync(dadosAtualizados);
    setEtapa("relatorio");
  };

  const gerarPDF = async () => {
    if (!relatorioRef.current) return;
    setGerandoPDF(true);

    try {
      const canvas = await html2canvas(relatorioRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Regulacao_Central_${paciente?.nome_completo?.replace(/ /g, "_")}_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    }
    setGerandoPDF(false);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando dados do paciente...</div>;
  }

  if (!paciente) {
    return <div className="p-8 text-center">Paciente não encontrado</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Header com logos */}
        <div className="bg-white border rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 w-full">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/8e093c8da_logoSecretariadeEstadodaSade.png" 
              alt="Secretaria de Estado da Saúde" 
              className="h-16 md:h-20 w-auto object-contain"
            />
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/fa5f3a17e_LOGOCORAAOPARAIBANO.png" 
              alt="Coração Paraibano" 
              className="h-16 md:h-20 w-auto object-contain"
            />
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/873a4a563_logo.png" 
              alt="PBSAÚDE" 
              className="h-16 md:h-20 w-auto object-contain"
            />
          </div>
        </div>

        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Painel
          </Button>
          <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-3">
            <Activity className="w-8 h-8" />
            Central de Regulação SES-PB
          </h1>
          <p className="text-gray-600 mt-2">CERH - Central Estadual de Regulação em Saúde</p>
        </div>

        {/* ETAPA 1: IDENTIFICAÇÃO */}
        {etapa === "identificacao" && (
          <Card className="shadow-lg">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="text-blue-900">Identificação do Profissional</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-semibold">Tipo de Profissional *</Label>
                <RadioGroup value={tipoProfissional} onValueChange={setTipoProfissional}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medico" id="medico" />
                    <Label htmlFor="medico" className="cursor-pointer font-medium">
                      Médico Regulador
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="enfermeiro" id="enfermeiro" />
                    <Label htmlFor="enfermeiro" className="cursor-pointer font-medium">
                      Enfermeiro Regulador
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {tipoProfissional && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={profissional.nome}
                      onChange={(e) => setProfissional({...profissional, nome: e.target.value})}
                      placeholder="Digite o nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registro">
                      {tipoProfissional === "medico" ? "Número CRM *" : "Número COREN *"}
                    </Label>
                    <Input
                      id="registro"
                      value={profissional.registro}
                      onChange={(e) => setProfissional({...profissional, registro: e.target.value})}
                      placeholder={tipoProfissional === "medico" ? "Ex: 123456" : "Ex: 110238"}
                    />
                  </div>
                </>
              )}

              <Button
                onClick={handleIdentificacao}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!tipoProfissional || !profissional.nome || !profissional.registro}
              >
                Acessar Relatório do Paciente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ETAPA 2: PARECER */}
        {etapa === "parecer" && (
          <div className="space-y-6">
            {/* Resumo do Paciente */}
            <Card className="shadow-lg border-l-4 border-l-red-600">
              <CardHeader className="bg-red-50">
                <CardTitle className="text-red-900">Dados do Paciente</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div><strong>Nome:</strong> {paciente.nome_completo}</div>
                  <div><strong>Idade:</strong> {paciente.idade} anos</div>
                  <div><strong>Sexo:</strong> {paciente.sexo}</div>
                  <div><strong>Unidade:</strong> {paciente.unidade_saude}</div>
                  <div><strong>Médico Triagem:</strong> {paciente.medico_nome || "-"}</div>
                  <div><strong>CRM:</strong> {paciente.medico_crm || "-"}</div>
                  <div><strong>Tempo Deslocamento:</strong> {paciente.tempo_deslocamento_minutos ? `${paciente.tempo_deslocamento_minutos} min` : "-"}</div>
                  {paciente.triagem_medica?.tipo_sca && (
                    <div className="md:col-span-2">
                      <strong>Tipo de SCA:</strong> 
                      <span className="ml-2 px-3 py-1 bg-red-100 text-red-800 rounded font-bold">
                        {paciente.triagem_medica.tipo_sca}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Assessoria de Cardiologia (se houver) */}
            {paciente.assessoria_cardiologia?.parecer_cardiologista && (
              <Card className="shadow-lg border-l-4 border-l-purple-600">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="text-purple-900">Assessoria de Cardiologia</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <p className="text-sm font-semibold mb-2">Médico Cardiologista:</p>
                    <p className="text-xs text-gray-700">
                      {paciente.assessoria_cardiologia.cardiologista_nome} - CRM: {paciente.assessoria_cardiologia.cardiologista_crm}
                    </p>
                    <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{paciente.assessoria_cardiologia.parecer_cardiologista}</p>
                  </div>
                  {paciente.assessoria_cardiologia.parecer_enfermeiro && (
                    <div className="pt-3 border-t">
                      <p className="text-sm font-semibold mb-2">Enfermeiro Assessor:</p>
                      <p className="text-xs text-gray-700">
                        {paciente.assessoria_cardiologia.enfermeiro_nome} - COREN: {paciente.assessoria_cardiologia.enfermeiro_coren}
                      </p>
                      <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{paciente.assessoria_cardiologia.parecer_enfermeiro}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Parecer anterior (se houver) */}
            {tipoProfissional === "enfermeiro" && paciente.regulacao_central?.parecer_medico_regulador && (
              <Card className="shadow-lg border-l-4 border-l-green-600">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-green-900">Parecer do Médico Regulador</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm font-semibold mb-2">
                    {paciente.regulacao_central.medico_regulador_nome} - CRM: {paciente.regulacao_central.medico_regulador_crm}
                  </p>
                  <p className="text-gray-700 whitespace-pre-wrap">{paciente.regulacao_central.parecer_medico_regulador}</p>
                </CardContent>
              </Card>
            )}

            {/* Emitir Parecer */}
            <Card className="shadow-lg border-l-4 border-l-blue-600">
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-blue-900">
                  {tipoProfissional === "medico" ? "Parecer do Médico Regulador" : "Parecer do Enfermeiro Regulador"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Alert className="border-blue-400 bg-blue-50">
                  <AlertDescription className="text-blue-800">
                    <strong>Profissional:</strong> {profissional.nome} • 
                    <strong className="ml-2">{tipoProfissional === "medico" ? "CRM" : "COREN"}:</strong> {profissional.registro}
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="parecer">Parecer e Conduta *</Label>
                  <Textarea
                    id="parecer"
                    value={tipoProfissional === "medico" ? parecerMedico : parecerEnfermeiro}
                    onChange={(e) => tipoProfissional === "medico" ? setParecerMedico(e.target.value) : setParecerEnfermeiro(e.target.value)}
                    placeholder="Digite o parecer de regulação e a conduta (liberação de vaga, transferência, etc)..."
                    rows={10}
                    className="resize-y"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setEtapa("identificacao")}
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleSalvarParecer}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={tipoProfissional === "medico" ? !parecerMedico : !parecerEnfermeiro}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Salvar Parecer e Gerar Relatório
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ETAPA 3: RELATÓRIO */}
        {etapa === "relatorio" && (
          <div className="space-y-6">
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-800 font-semibold">
                Parecer salvo com sucesso! Relatório disponível para download.
              </AlertDescription>
            </Alert>

            <div ref={relatorioRef} className="bg-white border-2 border-gray-300 rounded-lg p-8 shadow-lg">
              {/* Header com logos */}
              <div className="mb-6">
                <div className="flex items-center justify-between gap-4 w-full mb-4">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/8e093c8da_logoSecretariadeEstadodaSade.png" 
                    alt="Secretaria de Estado da Saúde" 
                    className="h-16 w-auto object-contain"
                  />
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/fa5f3a17e_LOGOCORAAOPARAIBANO.png" 
                    alt="Coração Paraibano" 
                    className="h-16 w-auto object-contain"
                  />
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/873a4a563_logo.png" 
                    alt="PBSAÚDE" 
                    className="h-16 w-auto object-contain"
                  />
                </div>
                <div className="text-center pb-4 border-b-4 border-blue-600">
                  <h1 className="text-3xl font-bold text-blue-900">RELATÓRIO DE REGULAÇÃO - CERH</h1>
                  <p className="text-gray-600 mt-2">Central Estadual de Regulação em Saúde da Paraíba</p>
                  <p className="text-gray-600">{format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
                </div>
              </div>

              {/* Dados do Paciente */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">DADOS DO PACIENTE</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="font-semibold">Nome:</span> {paciente.nome_completo}</div>
                  <div><span className="font-semibold">Idade:</span> {paciente.idade} anos</div>
                  <div><span className="font-semibold">Sexo:</span> {paciente.sexo}</div>
                  <div><span className="font-semibold">Unidade:</span> {paciente.unidade_saude}</div>
                  <div><span className="font-semibold">Médico Triagem:</span> {paciente.medico_nome || "-"}</div>
                  <div><span className="font-semibold">CRM:</span> {paciente.medico_crm || "-"}</div>
                  <div><span className="font-semibold">Tempo Deslocamento:</span> {paciente.tempo_deslocamento_minutos ? `${paciente.tempo_deslocamento_minutos} min` : "-"}</div>
                  {paciente.triagem_medica?.tipo_sca && (
                    <div className="col-span-2">
                      <span className="font-semibold">Tipo de SCA:</span> {paciente.triagem_medica.tipo_sca}
                    </div>
                  )}
                </div>
              </div>

              {/* Medicamentos Prescritos */}
              {paciente.avaliacao_clinica?.prescricao_medicamentos?.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">MEDICAMENTOS PRESCRITOS</h2>
                  <table className="w-full text-sm border border-collapse">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-400 p-2 text-left">Medicamento</th>
                        <th className="border border-gray-400 p-2 text-left">Dose</th>
                        <th className="border border-gray-400 p-2 text-left">Via</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paciente.avaliacao_clinica.prescricao_medicamentos.map((med, i) => (
                        <tr key={i}>
                          <td className="border border-gray-400 p-2">{med.medicamento || med.nome || "-"}</td>
                          <td className="border border-gray-400 p-2">{med.dose || "-"}</td>
                          <td className="border border-gray-400 p-2">{med.via || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Parecer do Médico Regulador */}
              {paciente.regulacao_central?.parecer_medico_regulador && (
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">PARECER DO MÉDICO REGULADOR</h2>
                  <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 mb-3">
                    <p className="font-semibold text-sm mb-2">
                      {paciente.regulacao_central.medico_regulador_nome} • CRM: {paciente.regulacao_central.medico_regulador_crm}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{paciente.regulacao_central.parecer_medico_regulador}</p>
                  </div>
                </div>
              )}

              {/* Parecer do Enfermeiro Regulador */}
              {paciente.regulacao_central?.parecer_enfermeiro_regulador && (
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">PARECER DO ENFERMEIRO REGULADOR</h2>
                  <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4 mb-3">
                    <p className="font-semibold text-sm mb-2">
                      {paciente.regulacao_central.enfermeiro_regulador_nome} • COREN: {paciente.regulacao_central.enfermeiro_regulador_coren}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{paciente.regulacao_central.parecer_enfermeiro_regulador}</p>
                  </div>
                </div>
              )}

              {/* Rodapé */}
              <div className="mt-8 pt-4 border-t-2 border-gray-300 text-xs text-gray-600">
                <p>Gerado em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={gerarPDF}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={gerandoPDF}
              >
                <Download className="w-4 h-4 mr-2" />
                {gerandoPDF ? "Gerando PDF..." : "Baixar Relatório em PDF"}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("Dashboard"))}
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}