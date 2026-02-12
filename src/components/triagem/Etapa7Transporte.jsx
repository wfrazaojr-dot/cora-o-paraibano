import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import jsPDF from "jspdf";
import { FileText, Save } from "lucide-react";

export default function Etapa7Transporte({ dadosPaciente, onProximo, onVoltar, modoLeitura }) {
  const [transporte, setTransporte] = useState({
    responsavel_nome: "",
    responsavel_matricula: "",
    veiculo: "",
    equipe: "",
    observacoes: "",
    hora_saida: "",
    hora_chegada_prevista: ""
  });

  useEffect(() => {
    if (dadosPaciente?.transporte) {
      setTransporte(dadosPaciente.transporte);
    }
  }, [dadosPaciente]);

  const gerarPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text("RELATÓRIO DE TRANSPORTE", pageWidth / 2, yPos, { align: 'center' });
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
    doc.text("DADOS DO TRANSPORTE", 20, yPos);
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Responsável: ${transporte.responsavel_nome}`, 20, yPos);
    yPos += 6;
    doc.text(`Matrícula: ${transporte.responsavel_matricula}`, 20, yPos);
    yPos += 6;
    doc.text(`Veículo: ${transporte.veiculo}`, 20, yPos);
    yPos += 6;
    doc.text(`Equipe: ${transporte.equipe}`, 20, yPos);
    yPos += 6;
    doc.text(`Hora Saída: ${transporte.hora_saida}`, 20, yPos);
    yPos += 6;
    doc.text(`Previsão Chegada: ${transporte.hora_chegada_prevista}`, 20, yPos);
    yPos += 10;
    doc.setFont(undefined, 'bold');
    doc.text("Observações:", 20, yPos);
    yPos += 6;
    doc.setFont(undefined, 'normal');
    const obsLines = doc.splitTextToSize(transporte.observacoes, pageWidth - 40);
    doc.text(obsLines, 20, yPos);

    const pdfBlob = doc.output('blob');
    const file = new File([pdfBlob], `parecer_transporte_${dadosPaciente.id}.pdf`, { type: 'application/pdf' });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    return file_url;
  };

  const handleEnviar = async () => {
    if (!transporte.responsavel_nome || !transporte.veiculo) {
      alert("Por favor, preencha os campos obrigatórios");
      return;
    }

    const parecer_url = await gerarPDF();

    const dados = {
      transporte: transporte,
      parecer_transporte_url: parecer_url,
      status: "Aguardando Hemodinâmica"
    };

    onProximo(dados);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Transporte de Paciente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h3 className="font-semibold text-orange-900 mb-2">Dados do Paciente</h3>
            <p className="text-sm text-orange-800"><strong>Nome:</strong> {dadosPaciente.nome_completo}</p>
            <p className="text-sm text-orange-800"><strong>Idade:</strong> {dadosPaciente.idade} anos</p>
            <p className="text-sm text-orange-800"><strong>Sexo:</strong> {dadosPaciente.sexo}</p>
            <p className="text-sm text-orange-800"><strong>Unidade:</strong> {dadosPaciente.unidade_saude}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="responsavel_nome">Responsável pelo Transporte *</Label>
              <Input
                id="responsavel_nome"
                value={transporte.responsavel_nome}
                onChange={(e) => setTransporte({ ...transporte, responsavel_nome: e.target.value })}
                disabled={modoLeitura}
              />
            </div>
            <div>
              <Label htmlFor="responsavel_matricula">Matrícula</Label>
              <Input
                id="responsavel_matricula"
                value={transporte.responsavel_matricula}
                onChange={(e) => setTransporte({ ...transporte, responsavel_matricula: e.target.value })}
                disabled={modoLeitura}
              />
            </div>
            <div>
              <Label htmlFor="veiculo">Veículo *</Label>
              <Input
                id="veiculo"
                value={transporte.veiculo}
                onChange={(e) => setTransporte({ ...transporte, veiculo: e.target.value })}
                disabled={modoLeitura}
                placeholder="Placa ou identificação"
              />
            </div>
            <div>
              <Label htmlFor="equipe">Equipe</Label>
              <Input
                id="equipe"
                value={transporte.equipe}
                onChange={(e) => setTransporte({ ...transporte, equipe: e.target.value })}
                disabled={modoLeitura}
              />
            </div>
            <div>
              <Label htmlFor="hora_saida">Hora de Saída</Label>
              <Input
                id="hora_saida"
                type="time"
                value={transporte.hora_saida}
                onChange={(e) => setTransporte({ ...transporte, hora_saida: e.target.value })}
                disabled={modoLeitura}
              />
            </div>
            <div>
              <Label htmlFor="hora_chegada_prevista">Previsão de Chegada</Label>
              <Input
                id="hora_chegada_prevista"
                type="time"
                value={transporte.hora_chegada_prevista}
                onChange={(e) => setTransporte({ ...transporte, hora_chegada_prevista: e.target.value })}
                disabled={modoLeitura}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={transporte.observacoes}
              onChange={(e) => setTransporte({ ...transporte, observacoes: e.target.value })}
              disabled={modoLeitura}
              rows={6}
            />
          </div>

          {!modoLeitura && (
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={onVoltar}>
                Voltar
              </Button>
              <Button onClick={handleEnviar} className="bg-orange-600 hover:bg-orange-700">
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