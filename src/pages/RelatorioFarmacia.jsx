import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Activity, FlaskConical, Download, FileText, AlertCircle, CheckCircle2, Building2, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";

const MEDICAMENTOS = [
  "TENECTEPLASE (Ampola 40mg)",
  "TENECTEPLASE (Ampola 50mg)",
  "ALTEPLASE (Ampola 100mg)",
];

const CAMPOS_OBRIGATORIOS = [
  { key: "indicacao", label: "Indicação" },
  { key: "paciente_nome", label: "Nome do Paciente" },
  { key: "unidade_saude", label: "Unidade de Saúde" },
  { key: "medico_prescritor_nome", label: "Médico Prescritor" },
  { key: "medico_prescritor_crm", label: "CRM do Prescritor" },
  { key: "medicamento", label: "Medicamento" },
  { key: "numero_lote", label: "Número do Lote" },
  { key: "dose", label: "Dose" },
  { key: "diluicao", label: "Diluição" },
  { key: "via_administracao", label: "Via de Administração" },
  { key: "data_hora_prescricao", label: "Data/Hora da Prescrição" },
  { key: "horario_administracao", label: "Horário de Administração" },
  { key: "enfermeiro_responsavel_nome", label: "Enfermeiro Responsável" },
  { key: "enfermeiro_responsavel_coren", label: "COREN do Enfermeiro" },
  { key: "profissional_administrou_nome", label: "Profissional que Administrou" },
  { key: "profissional_administrou_coren", label: "COREN do Profissional" },
];

function verificarPendencias(registro) {
  const faltando = CAMPOS_OBRIGATORIOS.filter(({ key }) => !registro[key]);
  if (registro.tem_intercorrencia) {
    ["tipo_intercorrencia", "descricao_intercorrencia", "conduta_intercorrencia", "intercorrencia_data_hora", "intercorrencia_gravidade"].forEach((k) => {
      if (!registro[k]) faltando.push({ key: k, label: k.replace(/_/g, " ") });
    });
  }
  return faltando;
}

const meses = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

export default function RelatorioFarmacia() {
  const anoAtual = new Date().getFullYear();
  const [periodo, setPeriodo] = useState("mensal");
  const [mes, setMes] = useState(String(new Date().getMonth() + 1));
  const [ano, setAno] = useState(String(anoAtual));
  const [filtroMedicamento, setFiltroMedicamento] = useState("todos");
  const [filtroUnidade, setFiltroUnidade] = useState("todas");
  const [gerandoPDF, setGerandoPDF] = useState(false);

  const { data: registros = [], isLoading } = useQuery({
    queryKey: ["registros-trombolise"],
    queryFn: () => base44.entities.RegistroTrombolise.list("-created_date"),
    initialData: [],
  });

  // Lista de unidades disponíveis
  const unidades = useMemo(() => {
    const set = new Set(registros.map((r) => r.unidade_saude).filter(Boolean));
    return Array.from(set).sort();
  }, [registros]);

  // Registros filtrados por período + medicamento + unidade
  const registrosFiltrados = useMemo(() => {
    return registros.filter((r) => {
      const data = r.created_date ? new Date(r.created_date) : null;
      if (!data) return false;

      const anoR = data.getFullYear();
      const mesR = data.getMonth() + 1;

      if (periodo === "mensal" && (anoR !== Number(ano) || mesR !== Number(mes))) return false;
      if (periodo === "anual" && anoR !== Number(ano)) return false;

      if (filtroMedicamento !== "todos" && r.medicamento !== filtroMedicamento) return false;
      if (filtroUnidade !== "todas" && r.unidade_saude !== filtroUnidade) return false;

      return true;
    });
  }, [registros, periodo, mes, ano, filtroMedicamento, filtroUnidade]);

  // Estatísticas
  const stats = useMemo(() => {
    const totais = {};
    const lotes = {};
    let completos = 0;
    let pendentes = 0;

    registrosFiltrados.forEach((r) => {
      const med = r.medicamento || "Não informado";
      totais[med] = (totais[med] || 0) + 1;
      if (r.numero_lote) {
        if (!lotes[med]) lotes[med] = {};
        lotes[med][r.numero_lote] = (lotes[med][r.numero_lote] || 0) + 1;
      }
      const faltando = verificarPendencias(r);
      if (faltando.length === 0) completos++;
      else pendentes++;
    });

    return { totais, lotes, completos, pendentes };
  }, [registrosFiltrados]);

  const loadImg = (url) => new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      c.getContext("2d").drawImage(img, 0, 0);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

  const gerarPDF = async () => {
    setGerandoPDF(true);
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin = 15;
    const pageWidth = 210;
    let y = 8;

    const LOGO_GOV = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/8e093c8da_logoSecretariadeEstadodaSade.png";
    const LOGO_CORACAO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/fa5f3a17e_LOGOCORAAOPARAIBANO.png";
    const LOGO_PBSAUDE = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/873a4a563_logo.png";

    const [imgGov, imgCoracao, imgPbsaude] = await Promise.all([loadImg(LOGO_GOV), loadImg(LOGO_CORACAO), loadImg(LOGO_PBSAUDE)]);
    const logoH = 18; const logoW = 44;
    if (imgGov) doc.addImage(imgGov, "PNG", margin, y, logoW, logoH);
    if (imgCoracao) doc.addImage(imgCoracao, "PNG", pageWidth / 2 - logoW / 2, y, logoW, logoH);
    if (imgPbsaude) doc.addImage(imgPbsaude, "PNG", pageWidth - margin - logoW, y, logoW, logoH);

    y = 30;
    doc.setDrawColor(220, 38, 38); doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);

    y = 36;
    doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 0);
    doc.text("RELATÓRIO FARMACÊUTICO — USO DE TROMBOLÍTICOS", pageWidth / 2, y, { align: "center" });

    y += 5;
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    const periodoLabel = periodo === "mensal" ? `${meses[Number(mes) - 1]}/${ano}` : `Ano ${ano}`;
    doc.text(`Período: ${periodoLabel}   |   Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, pageWidth / 2, y, { align: "center" });

    y += 6;
    doc.setDrawColor(220, 38, 38); doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);

    // Resumo
    y += 8;
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(185, 28, 28);
    doc.text("RESUMO DO PERÍODO", margin + 3, y + 7);

    y += 14;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(0, 0, 0);
    doc.text(`Total de Registros: ${registrosFiltrados.length}`, margin + 3, y); y += 5;
    doc.text(`Registros Completos: ${stats.completos}`, margin + 3, y); y += 5;
    doc.text(`Registros com Pendência: ${stats.pendentes}`, margin + 3, y); y += 5;

    // Por medicamento
    y += 4;
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(185, 28, 28);
    doc.text("CONSUMO POR MEDICAMENTO", margin + 3, y + 7);
    y += 14;

    Object.entries(stats.totais).forEach(([med, qtd]) => {
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(0, 0, 0);
      doc.text(`${med}:`, margin + 3, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${qtd} uso(s)`, margin + 3 + 80, y);
      y += 5;
      const lotesDoMed = stats.lotes[med];
      if (lotesDoMed) {
        Object.entries(lotesDoMed).forEach(([lote, qtdLote]) => {
          doc.setTextColor(80, 80, 80);
          doc.text(`  Lote ${lote}: ${qtdLote} uso(s)`, margin + 6, y);
          y += 4;
        });
      }
      doc.setTextColor(0, 0, 0);
    });

    // Tabela detalhada
    y += 4;
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(185, 28, 28);
    doc.text("DETALHAMENTO DOS REGISTROS", margin + 3, y + 7);
    y += 12;

    // Cabeçalho tabela
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, pageWidth - 2 * margin, 7, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(0, 0, 0);
    doc.text("Paciente", margin + 2, y + 5);
    doc.text("Medicamento", margin + 45, y + 5);
    doc.text("Lote", margin + 95, y + 5);
    doc.text("Dose", margin + 120, y + 5);
    doc.text("Unidade", margin + 140, y + 5);
    doc.text("Status", margin + 165, y + 5);
    y += 8;

    registrosFiltrados.forEach((r, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      if (i % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(margin, y - 1, pageWidth - 2 * margin, 6, "F"); }
      const pendencias = verificarPendencias(r);
      doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(0, 0, 0);
      doc.text((r.paciente_nome || "-").substring(0, 22), margin + 2, y + 4);
      doc.text((r.medicamento || "-").substring(0, 26), margin + 45, y + 4);
      doc.text((r.numero_lote || "-").substring(0, 12), margin + 95, y + 4);
      doc.text((r.dose || "-").substring(0, 10), margin + 120, y + 4);
      doc.text((r.unidade_saude || "-").substring(0, 14), margin + 140, y + 4);
      if (pendencias.length === 0) {
        doc.setTextColor(22, 163, 74);
        doc.text("Completo", margin + 165, y + 4);
      } else {
        doc.setTextColor(220, 38, 38);
        doc.text(`Pendente (${pendencias.length})`, margin + 165, y + 4);
      }
      doc.setTextColor(0, 0, 0);
      y += 6;
    });

    // Rodapé
    const pageHeight = 297;
    doc.setDrawColor(220, 38, 38);
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
    doc.setFontSize(7); doc.setTextColor(100, 100, 100);
    doc.text("Sistema Coração Paraibano © 2025-2026 - Secretaria de Estado de Saúde da Paraíba", pageWidth / 2, pageHeight - 14, { align: "center" });
    doc.text("Documento gerado eletronicamente — Uso exclusivo da Farmácia/Gestor", pageWidth / 2, pageHeight - 9, { align: "center" });

    const nomeArquivo = `Relatorio_Farmacia_${periodo === "mensal" ? `${meses[Number(mes) - 1]}_${ano}` : ano}.pdf`;
    doc.save(nomeArquivo);
    setGerandoPDF(false);
  };

  const periodoLabel = periodo === "mensal" ? `${meses[Number(mes) - 1]}/${ano}` : `Ano ${ano}`;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <FlaskConical className="w-8 h-8 text-red-600" />
              <h1 className="text-3xl font-bold text-gray-900">Relatório Farmacêutico</h1>
            </div>
            <p className="text-gray-600 mt-1">Consumo de trombolíticos para reposição de estoque</p>
          </div>
          <Button
            onClick={gerarPDF}
            disabled={gerandoPDF || registrosFiltrados.length === 0}
            className="bg-red-600 hover:bg-red-700"
          >
            {gerandoPDF
              ? <Activity className="w-4 h-4 animate-spin mr-2" />
              : <Download className="w-4 h-4 mr-2" />}
            Exportar PDF
          </Button>
        </div>

        {/* Filtros */}
        <Card className="shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Período */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Período</p>
                <Select value={periodo} onValueChange={setPeriodo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Mês (só mensal) */}
              {periodo === "mensal" && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Mês</p>
                  <Select value={mes} onValueChange={setMes}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {meses.map((m, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Ano */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Ano</p>
                <Select value={ano} onValueChange={setAno}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[anoAtual, anoAtual - 1, anoAtual - 2].map((a) => (
                      <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Medicamento */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Medicamento</p>
                <Select value={filtroMedicamento} onValueChange={setFiltroMedicamento}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {MEDICAMENTOS.map((m) => <SelectItem key={m} value={m}>{m.split("(")[0].trim()}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Unidade */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Unidade de Saúde</p>
                <Select value={filtroUnidade} onValueChange={setFiltroUnidade}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {unidades.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Activity className="w-8 h-8 text-red-500 animate-spin mr-3" />
            <p className="text-gray-500">Carregando registros...</p>
          </div>
        ) : (
          <>
            {/* Cards de resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Total no Período</p>
                  <p className="text-2xl font-bold text-blue-700">{registrosFiltrados.length}</p>
                  <p className="text-xs text-gray-400">{periodoLabel}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Completos</p>
                  <p className="text-2xl font-bold text-green-700">{stats.completos}</p>
                  <p className="text-xs text-gray-400">Prontos para relatório</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Com Pendência</p>
                  <p className="text-2xl font-bold text-red-700">{stats.pendentes}</p>
                  <p className="text-xs text-gray-400">Informações faltando</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-orange-500 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Unidades</p>
                  <p className="text-2xl font-bold text-orange-700">{new Set(registrosFiltrados.map((r) => r.unidade_saude).filter(Boolean)).size}</p>
                  <p className="text-xs text-gray-400">No período</p>
                </CardContent>
              </Card>
            </div>

            {/* Consumo por medicamento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {MEDICAMENTOS.map((med) => {
                const qtd = stats.totais[med] || 0;
                const lotesDoMed = stats.lotes[med] || {};
                return (
                  <Card key={med} className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Package className="w-4 h-4 text-red-600" />
                        {med.split("(")[0].trim()}
                      </CardTitle>
                      <p className="text-xs text-gray-500">{med.match(/\(([^)]+)\)/)?.[1]}</p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-3xl font-bold text-red-700 mb-2">{qtd} <span className="text-sm font-normal text-gray-500">ampola(s)</span></p>
                      {Object.keys(lotesDoMed).length > 0 ? (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-600">Lotes utilizados:</p>
                          {Object.entries(lotesDoMed).map(([lote, n]) => (
                            <div key={lote} className="flex justify-between text-xs bg-gray-50 rounded px-2 py-1">
                              <span className="text-gray-600">Lote {lote}</span>
                              <span className="font-semibold">{n}x</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Sem uso no período</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Tabela detalhada */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-600" />
                  Detalhamento dos Registros ({registrosFiltrados.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {registrosFiltrados.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhum registro encontrado para o período selecionado</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-3 text-xs font-semibold text-gray-600">Paciente</th>
                          <th className="text-left p-3 text-xs font-semibold text-gray-600">Medicamento</th>
                          <th className="text-left p-3 text-xs font-semibold text-gray-600">Lote</th>
                          <th className="text-left p-3 text-xs font-semibold text-gray-600">Dose</th>
                          <th className="text-left p-3 text-xs font-semibold text-gray-600">Unidade</th>
                          <th className="text-left p-3 text-xs font-semibold text-gray-600">Prescritor</th>
                          <th className="text-left p-3 text-xs font-semibold text-gray-600">Data</th>
                          <th className="text-left p-3 text-xs font-semibold text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {registrosFiltrados.map((r) => {
                          const pendencias = verificarPendencias(r);
                          return (
                            <tr key={r.id} className="hover:bg-gray-50">
                              <td className="p-3 font-medium text-gray-900">{r.paciente_nome || "—"}</td>
                              <td className="p-3 text-gray-700">
                                <div className="text-xs">{r.medicamento?.split("(")[0].trim() || "—"}</div>
                                <div className="text-xs text-gray-400">{r.medicamento?.match(/\(([^)]+)\)/)?.[1]}</div>
                              </td>
                              <td className="p-3">
                                {r.numero_lote
                                  ? <Badge variant="outline" className="text-xs">{r.numero_lote}</Badge>
                                  : <span className="text-xs text-red-500">Não informado</span>}
                              </td>
                              <td className="p-3 text-gray-700">{r.dose || <span className="text-red-500 text-xs">—</span>}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-700">{r.unidade_saude || "—"}</span>
                                </div>
                              </td>
                              <td className="p-3 text-xs text-gray-600">
                                <div>{r.medico_prescritor_nome || "—"}</div>
                                <div className="text-gray-400">CRM: {r.medico_prescritor_crm || "—"}</div>
                              </td>
                              <td className="p-3 text-xs text-gray-600">
                                {r.created_date ? format(new Date(r.created_date), "dd/MM/yyyy") : "—"}
                              </td>
                              <td className="p-3">
                                {pendencias.length === 0 ? (
                                  <div className="flex items-center gap-1 text-green-700">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-xs font-medium">Completo</span>
                                  </div>
                                ) : (
                                  <div className="group relative">
                                    <div className="flex items-center gap-1 text-red-600 cursor-help">
                                      <AlertCircle className="w-4 h-4" />
                                      <span className="text-xs font-medium">{pendencias.length} campo(s)</span>
                                    </div>
                                    <div className="hidden group-hover:block absolute right-0 z-10 bg-white border border-red-200 rounded-lg p-2 shadow-lg w-48 text-xs">
                                      <p className="font-semibold text-red-700 mb-1">Campos pendentes:</p>
                                      {pendencias.map((p) => (
                                        <p key={p.key} className="text-gray-600">• {p.label}</p>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}