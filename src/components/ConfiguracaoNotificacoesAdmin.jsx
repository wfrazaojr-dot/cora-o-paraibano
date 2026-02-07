import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';

export default function ConfiguracaoNotificacoesAdmin() {
  const queryClient = useQueryClient();
  const [salvoComSucesso, setSalvoComSucesso] = useState(false);

  const { data: configs, isLoading } = useQuery({
    queryKey: ['configuracoes-notificacoes'],
    queryFn: () => base44.entities.ConfiguracaoNotificacoes.list(),
  });

  const configGlobal = configs?.find(c => !c.unidade_saude);
  const [formData, setFormData] = useState({
    notificar_chegada_paciente: false,
    notificar_iamecg: false,
    notificar_classificacao_vermelha: false,
    notificar_heart_score_alto: false,
    notificar_status_mudanca: false,
  });

  useEffect(() => {
    if (configGlobal) {
      setFormData({
        notificar_chegada_paciente: configGlobal.notificar_chegada_paciente ?? true,
        notificar_iamecg: configGlobal.notificar_iamecg ?? true,
        notificar_classificacao_vermelha: configGlobal.notificar_classificacao_vermelha ?? true,
        notificar_heart_score_alto: configGlobal.notificar_heart_score_alto ?? true,
        notificar_status_mudanca: configGlobal.notificar_status_mudanca ?? false,
      });
    }
  }, [configGlobal]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (configGlobal?.id) {
        return await base44.entities.ConfiguracaoNotificacoes.update(configGlobal.id, data);
      } else {
        return await base44.entities.ConfiguracaoNotificacoes.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes-notificacoes'] });
      setSalvoComSucesso(true);
      setTimeout(() => setSalvoComSucesso(false), 3000);
    },
  });

  const handleChange = (campo) => {
    setFormData(prev => ({
      ...prev,
      [campo]: !prev[campo]
    }));
  };

  const handleSalvar = () => {
    updateMutation.mutate(formData);
  };

  const eventos = [
    {
      id: 'notificar_chegada_paciente',
      label: 'Chegada de novo paciente',
      descricao: 'Notifica quando um paciente chega na unidade',
    },
    {
      id: 'notificar_iamecg',
      label: 'IAM com elevação do ST (SCACST)',
      descricao: 'Alerta crítico quando paciente tem IAM-ECG',
    },
    {
      id: 'notificar_classificacao_vermelha',
      label: 'Prioridade Vermelha',
      descricao: 'Notifica pacientes classificados como risco crítico',
    },
    {
      id: 'notificar_heart_score_alto',
      label: 'HEART Score Alto (7-10 pontos)',
      descricao: 'Alerta quando paciente tem risco elevado no HEART score',
    },
    {
      id: 'notificar_status_mudanca',
      label: 'Mudanças de Status',
      descricao: 'Notifica alterações no status do atendimento do paciente',
    },
  ];

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Notificações</CardTitle>
          <CardDescription>
            Selecione quais eventos devem gerar notificações em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {salvoComSucesso && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Configurações salvas com sucesso!
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {eventos.map(evento => (
              <div key={evento.id} className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <Checkbox
                  id={evento.id}
                  checked={formData[evento.id]}
                  onCheckedChange={() => handleChange(evento.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label 
                    htmlFor={evento.id}
                    className="text-base font-semibold cursor-pointer block"
                  >
                    {evento.label}
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {evento.descricao}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSalvar}
            className="w-full bg-red-600 hover:bg-red-700"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </CardContent>
      </Card>

      <Alert className="bg-blue-50 border-blue-200">
        <AlertDescription className="text-blue-800">
          <strong>Informação:</strong> As notificações aparecem como cards no canto inferior direito da tela e desaparecem automaticamente após 10 segundos. Clique em uma notificação para ir direto ao paciente.
        </AlertDescription>
      </Alert>
    </div>
  );
}