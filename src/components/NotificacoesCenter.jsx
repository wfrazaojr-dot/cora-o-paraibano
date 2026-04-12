import React, { useState, useEffect } from 'react';
import { X, Bell, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

export default function NotificacoesCenter() {
  const [notificacoes, setNotificacoes] = useState([]);
  const navigate = useNavigate();
  const isAsscardio = window.location.pathname.toLowerCase().includes('asscardio');

  useEffect(() => {
    if (isAsscardio) return;
    const unsubscribe = base44.entities.Paciente.subscribe((event) => {
      if (event.type === 'create' || event.type === 'update') {
        verificarNotificacoes(event.data, event.type);
      }
    });

    return unsubscribe;
  }, [isAsscardio]);

  const verificarNotificacoes = async (paciente, tipoEvento) => {
    try {
      const config = await base44.entities.ConfiguracaoNotificacoes.list();
      const configGlobal = config.find(c => !c.unidade_saude) || {};

      let devNotificar = false;
      let mensagem = '';
      let tipo = 'info';

      if (tipoEvento === 'create' && configGlobal.notificar_chegada_paciente) {
        devNotificar = true;
        mensagem = `Novo paciente chegou: ${paciente.nome_completo}`;
        tipo = 'info';
      }

      if (
        paciente.triagem_medica?.tipo_sca === 'SCACESST' &&
        configGlobal.notificar_iamecg
      ) {
        devNotificar = true;
        mensagem = `⚠️ IAM-ECG: ${paciente.nome_completo} - CRÍTICO!`;
        tipo = 'critical';
      }

      if (
        paciente.classificacao_prioridade === 'Vermelha' &&
        configGlobal.notificar_classificacao_vermelha
      ) {
        devNotificar = true;
        mensagem = `🔴 Prioridade Vermelha: ${paciente.nome_completo}`;
        tipo = 'critical';
      }

      if (
        paciente.avaliacao_clinica?.heart_score?.total >= 7 &&
        configGlobal.notificar_heart_score_alto
      ) {
        devNotificar = true;
        mensagem = `⚠️ HEART Score Alto: ${paciente.nome_completo} (${paciente.avaliacao_clinica.heart_score.total} pontos)`;
        tipo = 'warning';
      }

      if (devNotificar) {
        adicionarNotificacao(mensagem, tipo, paciente.id);
      }
    } catch (error) {
      console.error('Erro ao verificar notificações:', error);
    }
  };

  const adicionarNotificacao = (mensagem, tipo, pacienteId) => {
    const id = Date.now();
    const notificacao = { id, mensagem, tipo, pacienteId };
    
    setNotificacoes(prev => [notificacao, ...prev]);

    // Remover automaticamente após 10 segundos
    setTimeout(() => {
      setNotificacoes(prev => prev.filter(n => n.id !== id));
    }, 10000);
  };

  const removerNotificacao = (id) => {
    setNotificacoes(prev => prev.filter(n => n.id !== id));
  };

  const irParaPaciente = (pacienteId) => {
    navigate(`${createPageUrl('Historico')}?pacienteId=${pacienteId}`);
    removerNotificacao(pacienteId);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {notificacoes.map(notif => (
        <div
          key={notif.id}
          className={`rounded-lg shadow-lg p-4 text-white flex items-start gap-3 cursor-pointer transition-all duration-300 ${
            notif.tipo === 'critical'
              ? 'bg-red-600 hover:bg-red-700'
              : notif.tipo === 'warning'
              ? 'bg-yellow-600 hover:bg-yellow-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          onClick={() => irParaPaciente(notif.pacienteId)}
        >
          <div className="flex-shrink-0 mt-1">
            {notif.tipo === 'critical' ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{notif.mensagem}</p>
            <p className="text-xs opacity-90 mt-1">Clique para detalhes do paciente</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removerNotificacao(notif.id);
            }}
            className="flex-shrink-0 hover:opacity-75 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}