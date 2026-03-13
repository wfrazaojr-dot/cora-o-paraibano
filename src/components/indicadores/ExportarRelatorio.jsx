import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

function buildRow(p) {
  const tm = p.triagem_medica || {};
  const hemo = p.hemodinamica || {};
  const transp = p.transporte || {};
  const ass = p.assessoria_cardiologia || {};
  const reg = p.regulacao_central || {};
  const enf = p.triagem_enfermagem || {};
  const etapa4 = p.historico_etapas?.find(e => e.etapa === 4);

  const portaEcg = enf.data_hora_classificacao_risco && enf.data_hora_ecg
    ? differenceInMinutes(new Date(enf.data_hora_ecg), new Date(enf.data_hora_classificacao_risco))
    : "";

  const portaDecisao = p.data_hora_inicio_triagem && etapa4?.data_hora
    ? differenceInMinutes(new Date(etapa4.data_hora), new Date(p.data_hora_inicio_triagem))
    : "";

  const regulacaoTempo = etapa4?.data_hora && reg.data_hora
    ? differenceInMinutes(new Date(reg.data_hora), new Date(etapa4.data_hora))
    : "";

  const telecardioTempo = etapa4?.data_hora && ass.data_hora
    ? differenceInMinutes(new Date(ass.data_hora), new Date(etapa4.data_hora))
    : "";

  const transporteTempo = transp.data_hora_inicio && transp.data_hora_chegada_destino
    ? differenceInMinutes(new Date(transp.data_hora_chegada_destino), new Date(transp.data_hora_inicio))
    : "";

  const icpTempo = hemo.data_hora_chegada && hemo.data_hora_inicio_procedimento
    ? differenceInMinutes(new Date(hemo.data_hora_inicio_procedimento), new Date(hemo.data_hora_chegada))
    : "";

  const fmcToDevice = p.data_hora_inicio_triagem && hemo.data_hora_chegada
    ? differenceInMinutes(new Date(hemo.data_hora_chegada), new Date(p.data_hora_inicio_triagem))
    : "";

  return {
    "Paciente": p.nome_completo || "",
    "Idade": p.idade || "",
    "Sexo": p.sexo || "",
    "Unidade de Saúde": p.unidade_saude || "",
    "Macrorregião": p.macrorregiao || "",
    "Data Chegada": p.data_hora_chegada ? format(new Date(p.data_hora_chegada), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "",
    "Status": p.status || "",
    "Tipo SCA": tm.tipo_sca || "",
    "PAS": tm.pa_braco_esquerdo || "",
    "PAD": tm.pa_braco_direito || "",
    "FC (bpm)": tm.frequencia_cardiaca || "",
    "FR (irpm)": tm.frequencia_respiratoria || "",
    "Temp (°C)": tm.temperatura || "",
    "SpO2 (%)": tm.spo2 || "",
    "Glicemia (mg/dL)": tm.glicemia_capilar || "",
    "Porta-ECG (min)": portaEcg,
    "Porta Decisão (min)": portaDecisao,
    "Regulação (min)": regulacaoTempo,
    "Porta-Telecardio (min)": telecardioTempo,
    "Transporte (min)": transporteTempo,
    "ICP-Hemodinâmica (min)": icpTempo,
    "FMC-to-device (min)": fmcToDevice,
    "Tipo ICP": hemo.tipo_icp || "",
    "Desfecho": hemo.desfecho || "",
    "Comparecimento": hemo.comparecimento_paciente || "",
    "Unidade Destino": reg.unidade_destino || "",
  };
}

export default function ExportarRelatorio({ pacientes, mesSelecionado, anoSelecionado, macrorregiao, tipoSca }) {
  const [formato, setFormato] = useState("csv");

  const dadosFiltrados = pacientes.filter(p => {
    if (macrorregiao && macrorregiao !== "todas" && p.macrorregiao !== macrorregiao) return false;
    if (tipoSca && tipoSca !== "todos" && p.triagem_medica?.tipo_sca !== tipoSca) return false;
    return true;
  });

  const exportar = () => {
    const rows = dadosFiltrados.map(buildRow);
    const nomeArquivo = `Indicadores_${mesSelecionado < 10 ? "0" + mesSelecionado : mesSelecionado}_${anoSelecionado}`;

    const headers = Object.keys(rows[0] || buildRow({}));
    const csvRows = [headers.join(";"), ...rows.map(r => headers.map(h => `"${r[h] ?? ""}"`).join(";"))];
    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Button onClick={exportar} disabled={dadosFiltrados.length === 0} className="bg-green-600 hover:bg-green-700">
        <Download className="w-4 h-4 mr-2" />
        Exportar CSV ({dadosFiltrados.length} registros)
      </Button>
    </div>
  );
}