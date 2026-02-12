import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import jsPDF from "jspdf";
import { FileText, Save } from "lucide-react";

export default function Etapa8Hemodinamica({ dadosPaciente, onProximo, onVoltar, modoLeitura }) {
  const [hemodinamica, setHemodinamica] = useState({
    cardiologista_nome: "",
    cardiologista_crm: "",
    hora_chegada: "",
    hora_inicio_procedimento: "",
    procedimento_realizado: "",
    resultado: "",
    observacoes: ""
  });

  useEffect(() => {
    if (dadosPaciente?.hemodinamica) {
      setHemodinamica(dadosPaciente.hemodinamica);
    }
  }, [dadosPaciente]);

  const gerarPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text("RELATÓRIO DE HEMODINÂMICA", pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    doc.setFontSize(12);
    doc.text("DADOS DO PACIENTE", 20, yPos);
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Nome: ${dadosPaciente.nome_completo}`, 20, yPos);
    yPos += 6;
    doc.text(`Idade: ${dadosPaciente.idade} anos | Sexo: ${dadosPaciente.sexo}`, 20, yPos);
    yPos += 6;
    doc.text(`Unidade Origem: ${dadosPaciente.unidade_saude}`, 20, yPos);
    yPos += 12;

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("CARDIOLOGISTA HEMODINAMICISTA", 20, yPos);
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Nome: ${hemodinamica.cardiologista_nome}`, 20, yPos);
    yPos += 6;
    doc.text(`CRM: ${hemodinamica.cardiologista_crm}`, 20, yPos);
    yPos += 12;

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("TEMPOS", 20, yPos);
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Hora de Chegada: ${hemodinamica.hora_chegada}`, 20, yPos);
    yPos += 6;
    doc.text(`Hora Início Procedimento: ${hemodinamica.hora_inicio_procedimento}`, 20, yPos);
    yPos += 12;

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("PROCEDIMENTO", 20, yPos);
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const procLines = doc.splitTextToSize(hemodinamica.procedimento_realizado, pageWidth - 40);
    doc.text(procLines, 20, yPos);
    yPos += procLines.length * 6 + 10;

    doc.setFont(undefined, 'bold');
    doc.text("RESULTADO:", 20, yPos);
    yPos += 6;
    doc.setFont(undefined, 'normal');
    const resLines = doc.splitTextToSize(hemodinamica.resultado, pageWidth - 40);
    doc.text(resLines, 20, yPos);
    yPos += resLines.length * 6 + 10;

    if (hemodinamica.observacoes) {
      doc.setFont(undefined, 'bold');
      doc.text("OBSERVAÇÕES:", 20, yPos);
      yPos += 6;
      doc.setFont(undefined, 'normal');
      const obsLines = doc.splitTextToSize(hemodinamica.observacoes, pageWidth - 40);
      doc.text(obsLines, 20, yPos);
    }

    const pdfBlob = doc.output('blob');
    const file = new File([pdfBlob], `parecer_hemodinamica_${dadosPaciente.id}.pdf`, { type: 'application/pdf' });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    return file_url;
  };

  const handleEnviar = async () => {
    if (!hemodinamica.cardiologista_nome || !hemodinamica.cardiologista_crm || !hemodinamica.procedimento_realizado) {
      alert("Por favor, preencha os campos obrigatórios");
      return;
    }

    const parecer_url = await gerarPDF();

    const dados = {
      hemodinamica: hemodinamica,
      parecer_hemodinamica_url: parecer_url,
      status: "Concluído"
    };

    onProximo(dados);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Relatório de Hemodinâmica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="font-semibold text-red-900 mb-2">Dados do Paciente</h3>
            <p className="text-sm text-red-800"><strong>Nome:</strong> {dadosPaciente.nome_completo}</p>
            <p className="text-sm text-red-800"><strong>Idade:</strong> {dadosPaciente.idade} anos</p>
            <p className="text-sm text-red-800"><strong>Sexo:</strong> {dadosPaciente.sexo}</p>
            <p className="text-sm text-red-800"><strong>Unidade:</strong> {dadosPaciente.unidade_saude}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cardiologista_nome">Cardiologista Hemodinamicista *</Label>
              <Input
                id="cardiologista_nome"
                value={hemodinamica.cardiologista_nome}
                onChange={(e) => setHemodinamica({ ...hemodinamica, cardiologista_nome: e.target.value })}
                disabled={modoLeitura}
              />
            </div>
            <div>
              <Label htmlFor="cardiologista_crm">CRM *</Label>
              <Input
                id="cardiologista_crm"
                value={hemodinamica.cardiologista_crm}
                onChange={(e) => setHemodinamica({ ...hemodinamica, cardiologista_crm: e.target.value })}
                disabled={modoLeitura}
              />
            </div>
            <div>
              <Label htmlFor="hora_chegada">Hora de Chegada</Label>
              <Input
                id="hora_chegada"
                type="time"
                value={hemodinamica.hora_chegada}
                onChange={(e) => setHemodinamica({ ...hemodinamica, hora_chegada: e.target.value })}
                disabled={modoLeitura}
              />
            </div>
            <div>
              <Label htmlFor="hora_inicio_procedimento">Hora Início Procedimento</Label>
              <Input
                id="hora_inicio_procedimento"
                type="time"
                value={hemodinamica.hora_inicio_procedimento}
                onChange={(e) => setHemodinamica({ ...hemodinamica, hora_inicio_procedimento: e.target.value })}
                disabled={modoLeitura}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="procedimento_realizado">Procedimento Realizado *</Label>
            <Textarea
              id="procedimento_realizado"
              value={hemodinamica.procedimento_realizado}
              onChange={(e) => setHemodinamica({ ...hemodinamica, procedimento_realizado: e.target.value })}
              disabled={modoLeitura}
              rows={6}
            />
          </div>

          <div>
            <Label htmlFor="resultado">Resultado</Label>
            <Textarea
              id="resultado"
              value={hemodinamica.resultado}
              onChange={(e) => setHemodinamica({ ...hemodinamica, resultado: e.target.value })}
              disabled={modoLeitura}
              rows={6}
            />
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={hemodinamica.observacoes}
              onChange={(e) => setHemodinamica({ ...hemodinamica, observacoes: e.target.value })}
              disabled={modoLeitura}
              rows={4}
            />
          </div>

          {!modoLeitura && (
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={onVoltar}>
                Voltar
              </Button>
              <Button onClick={handleEnviar} className="bg-red-600 hover:bg-red-700">
                <Save className="w-4 h-4 mr-2" />
                Enviar Relatório
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}