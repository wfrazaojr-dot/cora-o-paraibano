import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, ArrowRightLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DialogoTransferencia({ 
  open, 
  onClose, 
  paciente, 
  onConfirmar, 
  isLoading 
}) {
  const [macroDestino, setMacroDestino] = useState("");
  const [motivo, setMotivo] = useState("");

  const macroAtual = paciente?.hemodinamica_macro_responsavel || paciente?.macrorregiao;
  const opcoesDestino = ["Macro 1", "Macro 2", "Macro 3"].filter(m => m !== macroAtual);

  const handleConfirmar = () => {
    if (!macroDestino || !motivo.trim()) {
      alert("Por favor, selecione a macrorregião de destino e informe o motivo da transferência.");
      return;
    }
    onConfirmar({ macroDestino, motivo });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-700">
            <ArrowRightLeft className="w-5 h-5" />
            Transferir Paciente para Outra Hemodinâmica
          </DialogTitle>
          <DialogDescription>
            Transferir o paciente <strong>{paciente?.nome_completo}</strong> para outra macrorregião devido à indisponibilidade de vaga.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Hemodinâmica Atual:</strong> {macroAtual}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="macro_destino">
              Hemodinâmica de Destino *
            </Label>
            <Select value={macroDestino} onValueChange={setMacroDestino}>
              <SelectTrigger id="macro_destino">
                <SelectValue placeholder="Selecione a macrorregião de destino..." />
              </SelectTrigger>
              <SelectContent>
                {opcoesDestino.map((macro) => (
                  <SelectItem key={macro} value={macro}>
                    Hemodinâmica {macro}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo_transferencia">
              Motivo da Transferência *
            </Label>
            <Textarea
              id="motivo_transferencia"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo da transferência (ex: setor lotado, indisponibilidade de equipamento, etc.)"
              rows={4}
            />
          </div>

          <Alert className="bg-yellow-50 border-yellow-300">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-sm">
              Após a transferência, o paciente aparecerá na fila da Hemodinâmica {macroDestino} para que o responsável realize o agendamento.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmar} 
            disabled={isLoading || !macroDestino || !motivo.trim()}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? "Transferindo..." : "Confirmar Transferência"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}