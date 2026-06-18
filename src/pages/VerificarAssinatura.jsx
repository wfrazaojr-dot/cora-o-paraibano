import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Search, CheckCircle, XCircle, Loader2, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function VerificarAssinatura() {
  const [codigo, setCodigo] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("codigo") || "";
  });
  const [resultado, setResultado] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const verificar = async () => {
    if (!codigo.trim()) {
      setErro("Informe o código de confirmação.");
      return;
    }
    setCarregando(true);
    setErro("");
    setResultado(null);

    const assinaturas = await base44.entities.AssinaturaDigital.filter({
      hash_confirmacao: codigo.trim().toUpperCase()
    });

    if (assinaturas.length === 0) {
      setResultado({ valido: false, mensagem: "Código não encontrado no sistema." });
    } else {
      const a = assinaturas[0];
      setResultado({
        valido: true,
        documento_tipo: a.documento_tipo,
        documento_id: a.documento_id,
        usuario_nome: a.usuario_nome,
        usuario_email: a.usuario_email,
        paciente_nome: a.paciente_nome,
        data_emissao: a.created_date,
      });
    }
    setCarregando(false);
  };

  const tipoLabels = {
    triagem: "Relatório de Triagem",
    transporte: "Relatório de Transporte",
    trombolise: "Registro de Trombólise",
    farmacia: "Relatório Farmacêutico",
    formulario_vaga: "Formulário de Solicitação de Vaga",
    exportacao: "Exportação de Dados",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl border-t-4 border-t-green-600">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img
              src="https://media.base44.com/images/public/68fa0edee56f5a67f929da76/d2078127c_LOGOCARDIOPB.jpg"
              alt="CARDIOPB"
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <Shield className="w-6 h-6 text-green-600" />
            Verificar Autenticidade
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Valide se um documento foi realmente emitido pelo sistema CARDIOPB
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Digite o código de confirmação (ex: TRI-A3F7-9B2C)"
              value={codigo}
              onChange={(e) => { setCodigo(e.target.value); setErro(""); }}
              className="font-mono text-sm uppercase"
              onKeyDown={(e) => e.key === "Enter" && verificar()}
            />
            <Button
              onClick={verificar}
              disabled={carregando}
              className="bg-green-600 hover:bg-green-700"
            >
              {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          {erro && (
            <Alert variant="destructive">
              <XCircle className="w-4 h-4" />
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          {resultado && (
            <div className={`rounded-lg p-4 border-2 ${resultado.valido ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"}`}>
              {resultado.valido ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <span className="font-bold text-green-800 text-lg">Documento Autêntico</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Tipo de Documento</p>
                      <p className="font-semibold text-gray-900">{tipoLabels[resultado.documento_tipo] || resultado.documento_tipo}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Data de Emissão</p>
                      <p className="font-semibold text-gray-900">
                        {resultado.data_emissao ? format(new Date(resultado.data_emissao), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Emitido por</p>
                      <p className="font-semibold text-gray-900">{resultado.usuario_nome}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Email do Emissor</p>
                      <p className="font-semibold text-gray-900 text-xs">{resultado.usuario_email}</p>
                    </div>
                    {resultado.paciente_nome && (
                      <div className="col-span-2">
                        <p className="text-gray-500 text-xs">Paciente</p>
                        <p className="font-semibold text-gray-900">{resultado.paciente_nome}</p>
                      </div>
                    )}
                  </div>
                  <div className="bg-white rounded p-2 border border-green-200 text-center">
                    <p className="text-xs text-green-700">
                      <Shield className="w-3 h-3 inline mr-1" />
                      Este documento foi emitido digitalmente pelo sistema CARDIOPB e sua autenticidade foi confirmada.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <XCircle className="w-10 h-10 text-red-500 mx-auto" />
                  <p className="font-bold text-red-800">{resultado.mensagem}</p>
                  <p className="text-xs text-red-600">Este código não foi encontrado na base de assinaturas digitais do CARDIOPB.</p>
                </div>
              )}
            </div>
          )}

          <div className="text-center text-xs text-gray-400 pt-2">
            <FileText className="w-4 h-4 inline mr-1" />
            Sistema CARDIOPB — Secretaria de Estado da Saúde da Paraíba
          </div>
        </CardContent>
      </Card>
    </div>
  );
}