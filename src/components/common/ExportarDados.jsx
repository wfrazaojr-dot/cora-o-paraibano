import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

const LOGO_GOV = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/8e093c8da_logoSecretariadeEstadodaSade.png";
const LOGO_CORACAO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/fa5f3a17e_LOGOCORAAOPARAIBANO.png";
const LOGO_PBSAUDE = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/873a4a563_logo.png";

async function loadImageAsDataURL(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Componente de exportação reutilizável.
 * Props:
 *   dados: array de objetos a exportar
 *   colunas: [{ header: string, key: string, format?: (val) => string }]
 *   titulo: título do relatório
 *   nomeArquivo: nome base do arquivo (sem extensão)
 */
export default function ExportarDados({ dados = [], colunas = [], titulo = "Relatório", nomeArquivo = "relatorio" }) {
  const [exportando, setExportando] = useState(false);

  const exportarExcel = () => {
    const linhas = dados.map((item) => {
      const row = {};
      colunas.forEach((col) => {
        row[col.header] = col.format ? col.format(item[col.key], item) : (item[col.key] ?? "");
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(linhas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados");
    XLSX.writeFile(wb, `${nomeArquivo}.xlsx`);
  };

  const exportarPDF = async () => {
    setExportando(true);
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = 297;
    const margin = 10;

    // Carregar logos
    const [logoGov, logoCoracao, logoPbsaude] = await Promise.all([
      loadImageAsDataURL(LOGO_GOV),
      loadImageAsDataURL(LOGO_CORACAO),
      loadImageAsDataURL(LOGO_PBSAUDE),
    ]);

    // Cabeçalho com logos
    const logoH = 16;
    const logoW = 40;
    if (logoGov) doc.addImage(logoGov, "PNG", margin, 4, logoW, logoH);
    if (logoCoracao) doc.addImage(logoCoracao, "PNG", pageWidth / 2 - logoW / 2, 4, logoW, logoH);
    if (logoPbsaude) doc.addImage(logoPbsaude, "PNG", pageWidth - margin - logoW, 4, logoW, logoH);

    let y = 24;
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);

    y += 7;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(titulo, pageWidth / 2, y, { align: "center" });

    y += 5;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")} — Total: ${dados.length} registro(s)`, pageWidth / 2, y, { align: "center" });

    y += 6;

    // Cabeçalho da tabela
    const colWidth = Math.min(40, (pageWidth - 2 * margin) / colunas.length);
    doc.setFillColor(220, 38, 38);
    doc.rect(margin, y, pageWidth - 2 * margin, 7, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    colunas.forEach((col, i) => {
      doc.text(col.header, margin + i * colWidth + 1, y + 5, { maxWidth: colWidth - 2 });
    });

    y += 9;

    // Linhas de dados
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    dados.forEach((item, rowIdx) => {
      if (y > 185) {
        doc.addPage();
        y = 15;
      }
      if (rowIdx % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(margin, y - 4, pageWidth - 2 * margin, 6.5, "F");
      }
      colunas.forEach((col, i) => {
        const val = col.format ? col.format(item[col.key], item) : (item[col.key] ?? "");
        doc.text(String(val).substring(0, 30), margin + i * colWidth + 1, y, { maxWidth: colWidth - 2 });
      });
      y += 7;
    });

    // Rodapé
    const pageHeight = 210;
    doc.setDrawColor(220, 38, 38);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.setFontSize(6);
    doc.setTextColor(120, 120, 120);
    doc.text("Sistema Coração Paraibano © 2025-2026 — SES-PB", pageWidth / 2, pageHeight - 7, { align: "center" });

    doc.save(`${nomeArquivo}.pdf`);
    setExportando(false);
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={exportarExcel}
        className="border-green-500 text-green-700 hover:bg-green-50"
        disabled={dados.length === 0}
      >
        <Download className="w-4 h-4 mr-1" />
        Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={exportarPDF}
        disabled={exportando || dados.length === 0}
        className="border-red-400 text-red-700 hover:bg-red-50"
      >
        <Download className="w-4 h-4 mr-1" />
        {exportando ? "Gerando..." : "PDF"}
      </Button>
    </div>
  );
}