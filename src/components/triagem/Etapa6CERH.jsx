import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import jsPDF from "jspdf";
import { FileText, Save } from "lucide-react";

export default function Etapa6CERH({ dadosPaciente, onProximo, onVoltar, modoLeitura }) {
  const [regulador, setRegulador] = useState({
    medico_nome: "",
    medico_crm: "",
    parecer_medico: "",
    enfermeiro_nome: "",
    enfermeiro_coren: "",
    parecer_enfermeiro: ""
  });

  useEffect(() => {
    if (dadosPaciente?.regulacao_central) {
      setRegulador({
        medico_nome: dadosPaciente.regulacao_central.medico_regulador_nome || "",
        medico_crm: dadosPaciente.regulacao_central.medico_regulador_crm || "",
        parecer_medico: dadosPaciente.regulacao_central.parecer_medico_regulador || "",
        enfermeiro_nome: dadosPaciente.regulacao_central.enfermeiro_regulador_nome || "",
        enfermeiro_coren: dadosPaciente.regulacao_central.enfermeiro_regulador_coren || "",
        parecer_enfermeiro: dadosPaciente.regulacao_central.parecer_enfermeiro_regulador || ""
      });
    }
  }, [dadosPaciente]);

  const gerarPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text("PARECER CERH - CENTRAL DE REGULAÇÃO", pageWidth / 2, yPos, { align: 'center' });
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
    doc.text(`Unidade: ${dadosPaciente.unidade_saude}`, 20, yPos);
    yPos += 12;

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("MÉDICO REGULADOR", 20, yPos);
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Nome: ${regulador.medico_nome}`, 20, yPos);
    yPos += 6;
    doc.text(`CRM: ${regulador.medico_crm}`, 20, yPos);
    yPos += 6;
    doc.text(`Data/Hora: ${new Date().toLocaleString('pt-BR')}`, 20, yPos);
    yPos += 10;
    doc.setFont(undefined, 'bold');
    doc.text("Parecer Médico:", 20, yPos);
    yPos += 6;
    doc.setFont(undefined, 'normal');
    const parecerMedicoLines = doc.splitTextToSize(regulador.parecer_medico, pageWidth - 40);
    doc.text(parecerMedicoLines, 20, yPos);
    yPos += parecerMedicoLines.length * 6 + 10;

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("ENFERMEIRO REGULADOR", 20, yPos);
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Nome: ${regulador.enfermeiro_nome}`, 20, yPos);
    yPos += 6;
    doc.text(`COREN: ${regulador.enfermeiro_coren}`, 20, yPos);
    yPos += 10;
    doc.setFont(undefined, 'bold');
    doc.text("Parecer Enfermeiro:", 20, yPos);
    yPos += 6;
    doc.setFont(undefined, 'normal');
    const parecerEnfLines = doc.splitTextToSize(regulador.parecer_enfermeiro, pageWidth - 40);
    doc.text(parecerEnfLines, 20, yPos);

    const pdfBlob = doc.output('blob');
    const file = new File([pdfBlob], `parecer_cerh_${dadosPaciente.id}.pdf`, { type: 'application/pdf' });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    return file_url;
  };

  const handleEnviar = async () => {
    if (!regulador.medico_nome || !regulador.medico_crm || !regulador.parecer_medico) {
      alert("Por favor, preencha todos os campos obrigatórios do médico regulador");
      return;
    }

    const parecer_url = await gerarPDF();

    const dados = {
      regulacao_central: {
        medico_regulador_nome: regulador.medico_nome,
        medico_regulador_crm: regulador.medico_crm,
        parecer_medico_regulador: regulador.parecer_medico,
        enfermeiro_regulador_nome: regulador.enfermeiro_nome,
        enfermeiro_regulador_coren: regulador.enfermeiro_coren,
        parecer_enfermeiro_regulador: regulador.parecer_enfermeiro,
        data_hora: new Date().toISOString()
      },
      parecer_cerh_url: parecer_url,
      status: "Aguardando Transporte"
    };

    onProximo(dados);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Parecer CERH - Central de Regulação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-2">Dados do Paciente</h3>
            <p className="text-sm text-purple-800"><strong>Nome:</strong> {dadosPaciente.nome_completo}</p>
            <p className="text-sm text-purple-800"><strong>Idade:</strong> {dadosPaciente.idade} anos</p>
            <p className="text-sm text-purple-800"><strong>Sexo:</strong> {dadosPaciente.sexo}</p>
            <p className="text-sm text-purple-800"><strong>Unidade:</strong> {dadosPaciente.unidade_saude}</p>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-gray-900">Médico Regulador</h3>
            <div>
              <Label htmlFor="medico_nome">Nome do Médico *</Label>
              <Input
                id="medico_nome"
                value={regulador.medico_nome}
                onChange={(e) => setRegulador({ ...regulador, medico_nome: e.target.value })}
                disabled={modoLeitura}
              />
            </div>
            <div>
              <Label htmlFor="medico_crm">CRM *</Label>
              <Input
                id="medico_crm"
                value={regulador.medico_crm}
                onChange={(e) => setRegulador({ ...regulador, medico_crm: e.target.value })}
                disabled={modoLeitura}
              />
            </div>
            <div>
              <Label htmlFor="parecer_medico">Parecer Médico *</Label>
              <Textarea
                id="parecer_medico"
                value={regulador.parecer_medico}
                onChange={(e) => setRegulador({ ...regulador, parecer_medico: e.target.value })}
                disabled={modoLeitura}
                rows={6}
              />
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-gray-900">Enfermeiro Regulador</h3>
            <div>
              <Label htmlFor="enfermeiro_nome">Nome do Enfermeiro</Label>
              <Input
                id="enfermeiro_nome"
                value={regulador.enfermeiro_nome}
                onChange={(e) => setRegulador({ ...regulador, enfermeiro_nome: e.target.value })}
                disabled={modoLeitura}
              />
            </div>
            <div>
              <Label htmlFor="enfermeiro_coren">COREN</Label>
              <Input
                id="enfermeiro_coren"
                value={regulador.enfermeiro_coren}
                onChange={(e) => setRegulador({ ...regulador, enfermeiro_coren: e.target.value })}
                disabled={modoLeitura}
              />
            </div>
            <div>
              <Label htmlFor="parecer_enfermeiro">Parecer Enfermeiro</Label>
              <Textarea
                id="parecer_enfermeiro"
                value={regulador.parecer_enfermeiro}
                onChange={(e) => setRegulador({ ...regulador, parecer_enfermeiro: e.target.value })}
                disabled={modoLeitura}
                rows={6}
              />
            </div>
          </div>

          {!modoLeitura && (
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={onVoltar}>
                Voltar
              </Button>
              <Button onClick={handleEnviar} className="bg-purple-600 hover:bg-purple-700">
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