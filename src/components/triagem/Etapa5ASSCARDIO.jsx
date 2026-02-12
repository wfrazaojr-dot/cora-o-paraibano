import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import jsPDF from "jspdf";
import { FileText, Save } from "lucide-react";

export default function Etapa5ASSCARDIO({ dadosPaciente, onProximo, onVoltar, modoLeitura }) {
  const [cardiologista, setCardiologista] = useState({
    nome: "",
    crm: "",
    parecer: ""
  });

  useEffect(() => {
    if (dadosPaciente?.assessoria_cardiologia) {
      setCardiologista({
        nome: dadosPaciente.assessoria_cardiologia.cardiologista_nome || "",
        crm: dadosPaciente.assessoria_cardiologia.cardiologista_crm || "",
        parecer: dadosPaciente.assessoria_cardiologia.parecer_cardiologista || ""
      });
    }
  }, [dadosPaciente]);

  const gerarPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Cabeçalho
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text("PARECER ASSCARDIO - ASSESSORIA CARDIOLÓGICA", pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Dados do Paciente
    doc.setFontSize(12);
    doc.text("DADOS DO PACIENTE", 20, yPos);
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Nome: ${dadosPaciente.nome_completo}`, 20, yPos);
    yPos += 6;
    doc.text(`Idade: ${dadosPaciente.idade} anos | Sexo: ${dadosPaciente.sexo}`, 20, yPos);
    yPos += 6;
    doc.text(`Unidade: ${dadosPaciente.unidade_saude}`, 20, yPos);
    yPos += 12;

    // Dados do Cardiologista
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("CARDIOLOGISTA RESPONSÁVEL", 20, yPos);
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Nome: ${cardiologista.nome}`, 20, yPos);
    yPos += 6;
    doc.text(`CRM: ${cardiologista.crm}`, 20, yPos);
    yPos += 6;
    doc.text(`Data/Hora: ${new Date().toLocaleString('pt-BR')}`, 20, yPos);
    yPos += 12;

    // Parecer
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("PARECER CARDIOLÓGICO", 20, yPos);
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const parecerLines = doc.splitTextToSize(cardiologista.parecer, pageWidth - 40);
    doc.text(parecerLines, 20, yPos);

    // Upload do PDF
    const pdfBlob = doc.output('blob');
    const file = new File([pdfBlob], `parecer_asscardio_${dadosPaciente.id}.pdf`, { type: 'application/pdf' });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    return file_url;
  };

  const handleEnviar = async () => {
    if (!cardiologista.nome || !cardiologista.crm || !cardiologista.parecer) {
      alert("Por favor, preencha todos os campos");
      return;
    }

    const parecer_url = await gerarPDF();

    const dados = {
      assessoria_cardiologia: {
        cardiologista_nome: cardiologista.nome,
        cardiologista_crm: cardiologista.crm,
        parecer_cardiologista: cardiologista.parecer,
        data_hora: new Date().toISOString()
      },
      parecer_asscardio_url: parecer_url,
      status: "Aguardando Regulação"
    };

    onProximo(dados);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Parecer ASSCARDIO - Assessoria Cardiológica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dados do Paciente */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Dados do Paciente</h3>
            <p className="text-sm text-blue-800"><strong>Nome:</strong> {dadosPaciente.nome_completo}</p>
            <p className="text-sm text-blue-800"><strong>Idade:</strong> {dadosPaciente.idade} anos</p>
            <p className="text-sm text-blue-800"><strong>Sexo:</strong> {dadosPaciente.sexo}</p>
            <p className="text-sm text-blue-800"><strong>Unidade:</strong> {dadosPaciente.unidade_saude}</p>
          </div>

          {/* Dados do Cardiologista */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome_cardiologista">Nome do Cardiologista *</Label>
              <Input
                id="nome_cardiologista"
                value={cardiologista.nome}
                onChange={(e) => setCardiologista({ ...cardiologista, nome: e.target.value })}
                disabled={modoLeitura}
                placeholder="Digite o nome completo"
              />
            </div>

            <div>
              <Label htmlFor="crm_cardiologista">CRM *</Label>
              <Input
                id="crm_cardiologista"
                value={cardiologista.crm}
                onChange={(e) => setCardiologista({ ...cardiologista, crm: e.target.value })}
                disabled={modoLeitura}
                placeholder="Digite o CRM"
              />
            </div>

            <div>
              <Label htmlFor="parecer">Parecer Cardiológico *</Label>
              <Textarea
                id="parecer"
                value={cardiologista.parecer}
                onChange={(e) => setCardiologista({ ...cardiologista, parecer: e.target.value })}
                disabled={modoLeitura}
                placeholder="Digite o parecer cardiológico detalhado"
                rows={8}
                className="resize-none"
              />
            </div>
          </div>

          {/* Botões */}
          {!modoLeitura && (
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={onVoltar}>
                Voltar
              </Button>
              <Button onClick={handleEnviar} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                Enviar Parecer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}