import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import moment from "moment";

export default function ChatPaciente({ pacienteId, onClose }) {
  const [mensagem, setMensagem] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: mensagens = [], isLoading } = useQuery({
    queryKey: ['chat-mensagens', pacienteId],
    queryFn: async () => {
      const allMensagens = await base44.entities.ChatMensagem.list();
      return allMensagens
        .filter(m => m.paciente_id === pacienteId)
        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    },
    enabled: !!pacienteId,
    refetchInterval: 3000
  });

  const enviarMensagem = useMutation({
    mutationFn: async () => {
      if (!mensagem.trim()) return;
      
      const equipe = user?.equipe || 'unidade_saude';
      
      await base44.entities.ChatMensagem.create({
        paciente_id: pacienteId,
        remetente_nome: user?.full_name || "Usuário",
        remetente_equipe: equipe,
        mensagem: mensagem.trim()
      });
    },
    onSuccess: () => {
      setMensagem("");
      queryClient.invalidateQueries(['chat-mensagens', pacienteId]);
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  const getEquipeColor = (equipe) => {
    switch (equipe) {
      case 'unidade_saude':
        return 'bg-blue-100 text-blue-800';
      case 'cerh':
        return 'bg-indigo-100 text-indigo-800';
      case 'asscardio':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEquipeLabel = (equipe) => {
    switch (equipe) {
      case 'unidade_saude':
        return 'Unidade de Saúde';
      case 'cerh':
        return 'CERH';
      case 'asscardio':
        return 'ASSCARDIO';
      default:
        return equipe;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Chat da Equipe Multiprofissional
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Mensagens */}
        <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {isLoading ? (
            <p className="text-center text-gray-500">Carregando mensagens...</p>
          ) : mensagens.length === 0 ? (
            <p className="text-center text-gray-500">Nenhuma mensagem ainda. Inicie a conversa!</p>
          ) : (
            mensagens.map((msg) => {
              const isMinhaMsg = msg.created_by === user?.email;
              return (
                <div key={msg.id} className={`flex ${isMinhaMsg ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isMinhaMsg ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'} rounded-lg p-3 shadow-sm`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getEquipeColor(msg.remetente_equipe)}>
                        {getEquipeLabel(msg.remetente_equipe)}
                      </Badge>
                      <span className={`text-xs font-semibold ${isMinhaMsg ? 'text-blue-100' : 'text-gray-700'}`}>
                        {msg.remetente_nome}
                      </span>
                    </div>
                    <p className={`text-sm ${isMinhaMsg ? 'text-white' : 'text-gray-800'}`}>
                      {msg.mensagem}
                    </p>
                    <p className={`text-xs mt-1 ${isMinhaMsg ? 'text-blue-100' : 'text-gray-500'}`}>
                      {moment(msg.created_date).format('DD/MM/YYYY HH:mm')}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input de mensagem */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-2">
            <Textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Digite sua mensagem..."
              rows={2}
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  enviarMensagem.mutate();
                }
              }}
            />
            <Button
              onClick={() => enviarMensagem.mutate()}
              disabled={!mensagem.trim() || enviarMensagem.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Pressione Enter para enviar, Shift+Enter para nova linha</p>
        </div>
      </CardContent>
    </Card>
  );
}