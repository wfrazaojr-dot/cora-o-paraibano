import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ChatInterno({ pacienteId }) {
  const queryClient = useQueryClient();
  const [novaMensagem, setNovaMensagem] = useState("");
  const messagesEndRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: mensagens = [] } = useQuery({
    queryKey: ['mensagens', pacienteId],
    queryFn: async () => {
      const allMessages = await base44.entities.Mensagem.list();
      return allMessages.filter(m => m.paciente_id === pacienteId)
        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    },
    enabled: !!pacienteId,
    refetchInterval: 5000
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  const enviarMensagem = useMutation({
    mutationFn: async () => {
      if (!novaMensagem.trim()) return;
      
      await base44.entities.Mensagem.create({
        paciente_id: pacienteId,
        remetente_nome: user.full_name,
        remetente_email: user.email,
        equipe_remetente: user.equipe || 'unidade_saude',
        mensagem: novaMensagem,
        data_hora: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mensagens', pacienteId]);
      setNovaMensagem("");
    }
  });

  const getEquipeColor = (equipe) => {
    switch(equipe) {
      case 'unidade_saude': return 'bg-blue-100 border-blue-500 text-blue-900';
      case 'cerh': return 'bg-purple-100 border-purple-500 text-purple-900';
      case 'asscardio': return 'bg-red-100 border-red-500 text-red-900';
      default: return 'bg-gray-100 border-gray-500 text-gray-900';
    }
  };

  const getEquipeLabel = (equipe) => {
    switch(equipe) {
      case 'unidade_saude': return 'Unidade';
      case 'cerh': return 'CERH';
      case 'asscardio': return 'ASSCARDIO';
      default: return 'Sistema';
    }
  };

  return (
    <Card className="border-2 border-blue-300">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <MessageSquare className="w-5 h-5" />
          Chat Interno
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Mensagens */}
        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
          {mensagens.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Nenhuma mensagem ainda</p>
          ) : (
            mensagens.map((msg) => (
              <div key={msg.id} className={`p-3 rounded-lg border-l-4 ${getEquipeColor(msg.equipe_remetente)}`}>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <p className="font-semibold text-sm">{msg.remetente_nome}</p>
                    <p className="text-xs opacity-75">{getEquipeLabel(msg.equipe_remetente)}</p>
                  </div>
                  <p className="text-xs opacity-75">
                    {format(new Date(msg.created_date), "dd/MM HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.mensagem}</p>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Campo de envio */}
        <div className="space-y-2">
          <Textarea
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            placeholder="Digite sua mensagem..."
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                enviarMensagem.mutate();
              }
            }}
          />
          <Button
            onClick={() => enviarMensagem.mutate()}
            disabled={!novaMensagem.trim() || enviarMensagem.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-2" />
            {enviarMensagem.isPending ? "Enviando..." : "Enviar Mensagem"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}