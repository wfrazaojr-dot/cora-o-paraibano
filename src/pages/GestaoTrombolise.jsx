import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Plus, FileText, Search, X, Pill, Printer } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import jsPDF from "jspdf";

const MEDICAMENTOS = [
  "TENECTEPLASE (Ampola 40mg)",
  "TENECTEPLASE (Ampola 50mg)",
  "ALTEPLASE (Ampola 100mg)",
];

const INDICACOES = ["IAM", "TEP", "AVC"];

const emptyForm = {
  indicacao: "",
  paciente_nome: "",
  paciente_data_nascimento: "",
  paciente_prontuario: "",
  unidade_saude: "",
  data_hora_chegada: "",
  cardiologista_indicou_nome: "",
  cardiologista_indicou_crm: "",
  medico_prescritor_nome: "",
  medico_prescritor_crm: "",
  medicamento: "",
  numero_lote: "",
  dose: "",
  diluicao: "",
  via_administracao: "IV",
  data_hora_prescricao: "",
  horario_administracao: "",
  enfermeiro_responsavel_nome: "",
  enfermeiro_responsavel_coren: "",
  profissional_administrou_nome: "",
  profissional_administrou_coren: "",
  observacoes: "",
};

export default function GestaoTrombolise() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busca, setBusca] = useState("");
  const [filtroIndicacao, setFiltroIndicacao] = useState("todas");
  const [gerandoPDF, setGerandoPDF] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: registros = [], isLoading } = useQuery({
    queryKey: ["registros-trombolise"],
    queryFn: () => base44.entities.RegistroTrombolise.list("-created_date"),
    initialData: [],
  });

  const criarMutation = useMutation({
    mutationFn: (dados) => base44.entities.RegistroTrombolise.create(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registros-trombolise"] });
      setMostrarFormulario(false);
      setForm(emptyForm);
      alert("✅ Registro de trombólise salvo com sucesso!");
    },
  });

  const handleSalvar = () => {
    if (!form.indicacao || !form.paciente_nome || !form.medicamento || !form.medico_prescritor_nome || !form.medico_prescritor_crm) {
      alert("Preencha os campos obrigatórios: Indicação, Nome do Paciente, Medicamento, Médico Prescritor e CRM.");
      return;
    }
    criarMutation.mutate(form);
  };

  const gerarPDF = async (registro) => {
    setGerandoPDF(true);
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin = 15;
    const pageWidth = 210;
    let y = 15;

    // Cabeçalho
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, pageWidth, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("SECRETARIA DE ESTADO DA SAÚDE DA PARAÍBA", pageWidth / 2, 10, { align: "center" });
    doc.text("PROGRAMA CORAÇÃO PARAIBANO", pageWidth / 2, 17, { align: "center" });
    doc.setFontSize(10);
    doc.text("COMPLEXO REGULADOR ESTADUAL", pageWidth / 2, 23, { align: "center" });

    y = 36;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("REGISTRO DE USO DE TROMBOLÍTICO", pageWidth / 2, y, { align: "center" });

    y += 4;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, pageWidth / 2, y, { align: "center" });

    y += 8;
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);

    // Seção: Indicação
    y += 6;
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(185, 28, 28);
    doc.text("INDICAÇÃO CLÍNICA", margin + 3, y + 7);

    y += 13;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(registro.indicacao || "-", margin + 3, y);

    // Seção: Dados do Paciente
    y += 8;
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(185, 28, 28);
    doc.text("DADOS DO PACIENTE", margin + 3, y + 7);

    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    const camposPaciente = [
      ["Nome Completo", registro.paciente_nome],
      ["Data de Nascimento", registro.paciente_data_nascimento ? format(new Date(registro.paciente_data_nascimento + "T12:00:00"), "dd/MM/yyyy") : "-"],
      ["Prontuário", registro.paciente_prontuario || "-"],
      ["Unidade de Saúde", registro.unidade_saude || "-"],
      ["Data/Hora Chegada", registro.data_hora_chegada ? format(new Date(registro.data_hora_chegada), "dd/MM/yyyy HH:mm") : "-"],
    ];
    camposPaciente.forEach(([label, val]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, margin + 3, y);
      doc.setFont("helvetica", "normal");
      doc.text(val || "-", margin + 50, y);
      y += 6;
    });

    // Seção: Médicos
    y += 2;
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(185, 28, 28);
    doc.text("PROFISSIONAIS MÉDICOS", margin + 3, y + 7);

    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    const camposMedicos = [
      ["Cardiologista (Indicação)", registro.cardiologista_indicou_nome ? `${registro.cardiologista_indicou_nome} - CRM: ${registro.cardiologista_indicou_crm || "-"}` : "Não informado (emergência)"],
      ["Médico Prescritor", `${registro.medico_prescritor_nome} - CRM: ${registro.medico_prescritor_crm}`],
    ];
    camposMedicos.forEach(([label, val]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, margin + 3, y);
      doc.setFont("helvetica", "normal");
      doc.text(val || "-", margin + 55, y);
      y += 6;
    });

    // Seção: Prescrição
    y += 2;
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(185, 28, 28);
    doc.text("DADOS DA PRESCRIÇÃO", margin + 3, y + 7);

    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    const camposPrescricao = [
      ["Medicamento", registro.medicamento],
      ["Número do Lote", registro.numero_lote || "-"],
      ["Dose", registro.dose || "-"],
      ["Diluição", registro.diluicao || "-"],
      ["Via de Administração", registro.via_administracao || "-"],
      ["Data/Hora Prescrição", registro.data_hora_prescricao ? format(new Date(registro.data_hora_prescricao), "dd/MM/yyyy HH:mm") : "-"],
      ["Horário de Administração", registro.horario_administracao || "-"],
    ];
    camposPrescricao.forEach(([label, val]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, margin + 3, y);
      doc.setFont("helvetica", "normal");
      doc.text(val || "-", margin + 55, y);
      y += 6;
    });

    // Seção: Enfermagem
    y += 2;
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(185, 28, 28);
    doc.text("EQUIPE DE ENFERMAGEM", margin + 3, y + 7);

    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    const camposEnf = [
      ["Enf. Responsável do Setor", registro.enfermeiro_responsavel_nome ? `${registro.enfermeiro_responsavel_nome} - COREN: ${registro.enfermeiro_responsavel_coren || "-"}` : "-"],
      ["Profissional que Administrou", registro.profissional_administrou_nome ? `${registro.profissional_administrou_nome} - COREN: ${registro.profissional_administrou_coren || "-"}` : "-"],
    ];
    camposEnf.forEach(([label, val]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, margin + 3, y);
      doc.setFont("helvetica", "normal");
      doc.text(val || "-", margin + 65, y);
      y += 6;
    });

    if (registro.observacoes) {
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Observações:", margin + 3, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      const obs = doc.splitTextToSize(registro.observacoes, pageWidth - 2 * margin - 6);
      doc.text(obs, margin + 3, y);
    }

    // Rodapé
    const pageHeight = 297;
    doc.setDrawColor(220, 38, 38);
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("Sistema Coração Paraibano © 2025-2026 - Secretaria de Estado de Saúde da Paraíba", pageWidth / 2, pageHeight - 14, { align: "center" });
    doc.text("Documento gerado eletronicamente - Uso exclusivo da equipe de saúde", pageWidth / 2, pageHeight - 9, { align: "center" });

    doc.save(`Trombolise_${registro.paciente_nome?.replace(/\s+/g, "_")}_${format(new Date(), "dd-MM-yyyy")}.pdf`);
    setGerandoPDF(false);
  };

  const registrosFiltrados = registros.filter((r) => {
    const matchBusca = !busca.trim() || r.paciente_nome?.toLowerCase().includes(busca.toLowerCase()) || r.unidade_saude?.toLowerCase().includes(busca.toLowerCase());
    const matchIndicacao = filtroIndicacao === "todas" || r.indicacao === filtroIndicacao;
    return matchBusca && matchIndicacao;
  });

  if (!user) return <div className="min-h-screen flex items-center justify-center"><Activity className="w-8 h-8 text-red-600 animate-spin" /></div>;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Pill className="w-8 h-8 text-red-600" />
              <h1 className="text-3xl font-bold text-gray-900">Gestão de Trombólise</h1>
            </div>
            <p className="text-gray-600 mt-1">Controle de prescrição e administração de trombolíticos</p>
          </div>
          <Button
            onClick={() => { setMostrarFormulario(true); setForm({ ...emptyForm, data_hora_prescricao: new Date().toISOString().slice(0, 16), data_hora_chegada: new Date().toISOString().slice(0, 16) }); }}
            className="bg-red-600 hover:bg-red-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Registro
          </Button>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {["IAM", "TEP", "AVC"].map((ind) => (
            <Card key={ind} className="shadow-sm border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 font-medium">{ind}</p>
                <p className="text-2xl font-bold text-red-700">{registros.filter((r) => r.indicacao === ind).length}</p>
              </CardContent>
            </Card>
          ))}
          <Card className="shadow-sm border-l-4 border-l-gray-400">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 font-medium">Total</p>
              <p className="text-2xl font-bold text-gray-700">{registros.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Formulário de Novo Registro */}
        {mostrarFormulario && (
          <Card className="shadow-lg mb-6 border-2 border-red-300">
            <CardHeader className="bg-red-50 border-b border-red-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <Pill className="w-5 h-5" />
                  Novo Registro de Trombólise
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setMostrarFormulario(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">

                {/* Indicação */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 border-b pb-1">Indicação Clínica *</h3>
                  <div className="flex gap-3">
                    {INDICACOES.map((ind) => (
                      <Button
                        key={ind}
                        variant={form.indicacao === ind ? "default" : "outline"}
                        className={form.indicacao === ind ? "bg-red-600 hover:bg-red-700" : ""}
                        onClick={() => setForm({ ...form, indicacao: ind })}
                      >
                        {ind}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Dados do Paciente */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 border-b pb-1">Dados do Paciente *</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome Completo *</Label>
                      <Input value={form.paciente_nome} onChange={(e) => setForm({ ...form, paciente_nome: e.target.value })} placeholder="Nome do paciente" />
                    </div>
                    <div>
                      <Label>Data de Nascimento</Label>
                      <Input type="date" value={form.paciente_data_nascimento} onChange={(e) => setForm({ ...form, paciente_data_nascimento: e.target.value })} />
                    </div>
                    <div>
                      <Label>Número do Prontuário</Label>
                      <Input value={form.paciente_prontuario} onChange={(e) => setForm({ ...form, paciente_prontuario: e.target.value })} placeholder="Nº prontuário" />
                    </div>
                    <div>
                      <Label>Unidade de Saúde</Label>
                      <Input value={form.unidade_saude} onChange={(e) => setForm({ ...form, unidade_saude: e.target.value })} placeholder="Unidade de saúde" />
                    </div>
                    <div>
                      <Label>Data/Hora de Chegada</Label>
                      <Input type="datetime-local" value={form.data_hora_chegada} onChange={(e) => setForm({ ...form, data_hora_chegada: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Médicos */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 border-b pb-1">Profissionais Médicos</h3>
                  <p className="text-xs text-gray-500 mb-3 bg-yellow-50 border border-yellow-200 rounded p-2">⚠️ O cardiologista indicador é opcional — pode ocorrer trombólise sem parecer ASSCARDIO em situações de emergência.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Cardiologista que Indicou (opcional)</Label>
                      <Input value={form.cardiologista_indicou_nome} onChange={(e) => setForm({ ...form, cardiologista_indicou_nome: e.target.value })} placeholder="Nome do cardiologista" />
                    </div>
                    <div>
                      <Label>CRM do Cardiologista (opcional)</Label>
                      <Input value={form.cardiologista_indicou_crm} onChange={(e) => setForm({ ...form, cardiologista_indicou_crm: e.target.value })} placeholder="CRM" />
                    </div>
                    <div>
                      <Label>Médico Prescritor *</Label>
                      <Input value={form.medico_prescritor_nome} onChange={(e) => setForm({ ...form, medico_prescritor_nome: e.target.value })} placeholder="Nome do médico prescritor" />
                    </div>
                    <div>
                      <Label>CRM do Médico Prescritor *</Label>
                      <Input value={form.medico_prescritor_crm} onChange={(e) => setForm({ ...form, medico_prescritor_crm: e.target.value })} placeholder="CRM" />
                    </div>
                  </div>
                </div>

                {/* Prescrição */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 border-b pb-1">Dados da Prescrição *</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Medicamento *</Label>
                      <Select value={form.medicamento} onValueChange={(v) => setForm({ ...form, medicamento: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione o medicamento" /></SelectTrigger>
                        <SelectContent>
                          {MEDICAMENTOS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Número do Lote</Label>
                      <Input value={form.numero_lote} onChange={(e) => setForm({ ...form, numero_lote: e.target.value })} placeholder="Nº do lote" />
                    </div>
                    <div>
                      <Label>Dose</Label>
                      <Input value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} placeholder="Ex: 40mg" />
                    </div>
                    <div>
                      <Label>Diluição</Label>
                      <Input value={form.diluicao} onChange={(e) => setForm({ ...form, diluicao: e.target.value })} placeholder="Ex: 8mL de água estéril" />
                    </div>
                    <div>
                      <Label>Via de Administração</Label>
                      <Input value={form.via_administracao} onChange={(e) => setForm({ ...form, via_administracao: e.target.value })} placeholder="Ex: IV" />
                    </div>
                    <div>
                      <Label>Data/Hora da Prescrição</Label>
                      <Input type="datetime-local" value={form.data_hora_prescricao} onChange={(e) => setForm({ ...form, data_hora_prescricao: e.target.value })} />
                    </div>
                    <div>
                      <Label>Horário para Administração</Label>
                      <Input value={form.horario_administracao} onChange={(e) => setForm({ ...form, horario_administracao: e.target.value })} placeholder="Ex: 14:30" />
                    </div>
                  </div>
                </div>

                {/* Enfermagem */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 border-b pb-1">Equipe de Enfermagem</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Enfermeiro Responsável do Setor</Label>
                      <Input value={form.enfermeiro_responsavel_nome} onChange={(e) => setForm({ ...form, enfermeiro_responsavel_nome: e.target.value })} placeholder="Nome do enfermeiro" />
                    </div>
                    <div>
                      <Label>COREN do Enfermeiro Responsável</Label>
                      <Input value={form.enfermeiro_responsavel_coren} onChange={(e) => setForm({ ...form, enfermeiro_responsavel_coren: e.target.value })} placeholder="COREN" />
                    </div>
                    <div>
                      <Label>Profissional que Administrou</Label>
                      <Input value={form.profissional_administrou_nome} onChange={(e) => setForm({ ...form, profissional_administrou_nome: e.target.value })} placeholder="Nome do profissional" />
                    </div>
                    <div>
                      <Label>COREN do Profissional que Administrou</Label>
                      <Input value={form.profissional_administrou_coren} onChange={(e) => setForm({ ...form, profissional_administrou_coren: e.target.value })} placeholder="COREN" />
                    </div>
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <Label>Observações</Label>
                  <textarea
                    className="w-full border border-input rounded-md p-3 text-sm resize-none h-20"
                    value={form.observacoes}
                    onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                    placeholder="Observações adicionais..."
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="outline" onClick={() => setMostrarFormulario(false)}>Cancelar</Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700"
                    onClick={handleSalvar}
                    disabled={criarMutation.isPending}
                  >
                    {criarMutation.isPending ? <Activity className="w-4 h-4 animate-spin mr-2" /> : null}
                    Salvar Registro
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Buscar por paciente ou unidade..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
          </div>
          <Select value={filtroIndicacao} onValueChange={setFiltroIndicacao}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Indicação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as indicações</SelectItem>
              {INDICACOES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
            </SelectContent>
          </Select>
          {(busca || filtroIndicacao !== "todas") && (
            <Button variant="ghost" onClick={() => { setBusca(""); setFiltroIndicacao("todas"); }}>
              <X className="w-4 h-4 mr-1" /> Limpar
            </Button>
          )}
        </div>

        {/* Lista de Registros */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-600" />
              Registros de Trombólise ({registrosFiltrados.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Activity className="w-8 h-8 animate-spin text-red-500 mr-3" />
                <p className="text-gray-500">Carregando registros...</p>
              </div>
            ) : registrosFiltrados.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Pill className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum registro encontrado</p>
              </div>
            ) : (
              <div className="divide-y">
                {registrosFiltrados.map((registro) => (
                  <div key={registro.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={
                            registro.indicacao === "IAM" ? "bg-red-600" :
                            registro.indicacao === "TEP" ? "bg-orange-600" :
                            "bg-purple-600"
                          }>
                            {registro.indicacao}
                          </Badge>
                          <span className="font-semibold text-gray-900">{registro.paciente_nome}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600 mt-1">
                          <span>💊 {registro.medicamento?.split("(")[0].trim()}</span>
                          <span>🏥 {registro.unidade_saude || "—"}</span>
                          <span>👨‍⚕️ Dr. {registro.medico_prescritor_nome}</span>
                          <span>📅 {registro.created_date ? format(new Date(registro.created_date), "dd/MM/yyyy HH:mm") : "—"}</span>
                        </div>
                        {registro.numero_lote && <span className="text-xs text-gray-400">Lote: {registro.numero_lote}</span>}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => gerarPDF(registro)}
                        disabled={gerandoPDF}
                        className="border-red-400 text-red-700 hover:bg-red-50 shrink-0"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Gerar PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}