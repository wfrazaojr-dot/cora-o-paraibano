import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Activity, Heart, Radio, Truck, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function LinhaTempo({ paciente }) {
  const eventos = [];

  // Macrorregião como primeiro item informativo
  const macrorregiao = paciente.macrorregiao || null;

  // Adicionar eventos da linha do tempo
  if (paciente.data_hora_inicio_sintomas) {
    const tempoDorMin = paciente.data_hora_inicio_triagem
      ? Math.round((new Date(paciente.data_hora_inicio_triagem) - new Date(paciente.data_hora_inicio_sintomas)) / 60000)
      : null;
    eventos.push({
      tipo: "Início dos Sintomas",
      dataHora: paciente.data_hora_inicio_sintomas,
      icone: Clock,
      cor: "text-orange-600",
      detalhe: tempoDorMin != null ? `Tempo de Dor até triagem: ${tempoDorMin} min` : null
    });
  }

  if (paciente.data_hora_inicio_triagem) {
    eventos.push({
      tipo: "Triagem Médica Iniciada",
      dataHora: paciente.data_hora_inicio_triagem,
      icone: Activity,
      cor: "text-blue-600"
    });
  }



  if (paciente.triagem_enfermagem?.data_hora_ecg) {
    eventos.push({
      tipo: "ECG Realizado",
      dataHora: paciente.triagem_enfermagem.data_hora_ecg,
      icone: Activity,
      cor: "text-purple-600"
    });
  }

  if (paciente.relatorio_triagem_url) {
    eventos.push({
      tipo: "Relatório Enviado para Regulação",
      dataHora: paciente.created_date,
      icone: FileText,
      cor: "text-green-600"
    });
  }

  if (paciente.assessoria_cardiologia?.data_hora) {
    eventos.push({
      tipo: "Parecer ASSCARDIO",
      dataHora: paciente.assessoria_cardiologia.data_hora,
      icone: Heart,
      cor: "text-red-600",
      detalhe: `Cardiologista: ${paciente.assessoria_cardiologia.cardiologista_nome}`
    });
  }

  if (paciente.regulacao_central?.data_hora) {
    eventos.push({
      tipo: "Regulação CERH",
      dataHora: paciente.regulacao_central.data_hora,
      icone: Radio,
      cor: "text-indigo-600",
      detalhe: `Destino: ${paciente.regulacao_central.unidade_destino || 'Não definido'}`
    });
  }

  if (paciente.transporte?.data_hora_inicio) {
    eventos.push({
      tipo: "Transporte Iniciado",
      dataHora: paciente.transporte.data_hora_inicio,
      icone: Truck,
      cor: "text-yellow-600",
      detalhe: `Tipo: ${paciente.transporte.tipo_transporte}`
    });
  }

  if (paciente.transporte?.data_hora_chegada_destino) {
    eventos.push({
      tipo: "Chegada ao Destino",
      dataHora: paciente.transporte.data_hora_chegada_destino,
      icone: Truck,
      cor: "text-green-600"
    });
  }

  if (paciente.hemodinamica?.comparecimento_paciente === "nao_compareceu") {
    eventos.push({
      tipo: "⚠️ Paciente NÃO compareceu à Hemodinâmica",
      dataHora: paciente.hemodinamica?.data_hora_agendamento_icp || paciente.updated_date,
      icone: Activity,
      cor: "text-red-700",
      detalhe: "Paciente não compareceu na data/hora agendada para o procedimento."
    });
  }

  if (paciente.hemodinamica?.data_hora_chegada) {
    eventos.push({
      tipo: "Chegada à Hemodinâmica",
      dataHora: paciente.hemodinamica.data_hora_chegada,
      icone: Activity,
      cor: "text-pink-600"
    });
  }

  if (paciente.hemodinamica?.data_hora_inicio_procedimento) {
    eventos.push({
      tipo: "Início do Procedimento",
      dataHora: paciente.hemodinamica.data_hora_inicio_procedimento,
      icone: Activity,
      cor: "text-red-600"
    });
  }

  if (paciente.hemodinamica?.data_hora_fim_procedimento) {
    eventos.push({
      tipo: "Fim do Procedimento",
      dataHora: paciente.hemodinamica.data_hora_fim_procedimento,
      icone: Activity,
      cor: "text-green-600",
      detalhe: `Desfecho: ${paciente.hemodinamica.desfecho}`
    });
  }

  // Ordenar eventos por data/hora
  eventos.sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora));

  // Janela terapêutica: 12h a partir do início dos sintomas
  let janelaInfo = null;
  if (paciente.data_hora_inicio_sintomas) {
    const inicio = new Date(paciente.data_hora_inicio_sintomas);
    const limiteJanela = new Date(inicio.getTime() + 12 * 60 * 60 * 1000);
    const agora = new Date();
    const restanteMs = limiteJanela - agora;
    const restanteMin = Math.round(restanteMs / 60000);
    if (restanteMs > 0) {
      const horas = Math.floor(restanteMin / 60);
      const mins = restanteMin % 60;
      janelaInfo = { texto: `${horas}h ${mins}min restantes`, aberta: true };
    } else {
      const ultrapassadoMin = Math.abs(restanteMin);
      const horas = Math.floor(ultrapassadoMin / 60);
      const mins = ultrapassadoMin % 60;
      janelaInfo = { texto: `Encerrada há ${horas}h ${mins}min`, aberta: false };
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Linha do Tempo
        </CardTitle>
      </CardHeader>
      <CardContent>
        {janelaInfo && (
          <div className={`mb-3 pb-3 border-b flex items-center gap-2 rounded-lg px-3 py-2 ${janelaInfo.aberta ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <Clock className={`w-4 h-4 ${janelaInfo.aberta ? 'text-green-600' : 'text-red-600'}`} />
            <div>
              <p className={`text-xs font-bold ${janelaInfo.aberta ? 'text-green-800' : 'text-red-800'}`}>
                ⏱ Janela Terapêutica (12h)
              </p>
              <p className={`text-xs font-semibold ${janelaInfo.aberta ? 'text-green-700' : 'text-red-700'}`}>
                {janelaInfo.texto}
              </p>
            </div>
          </div>
        )}
        {macrorregiao && (
          <div className="mb-3 pb-3 border-b">
            <span className="inline-block bg-teal-100 text-teal-800 font-bold text-xs px-3 py-1 rounded-full border border-teal-300">
              📍 {macrorregiao}
            </span>
          </div>
        )}
        <div className="space-y-4">
          {eventos.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum evento registrado</p>
          ) : (
            eventos.map((evento, index) => {
              const Icon = evento.icone;
              return (
                <div key={index} className="flex gap-3">
                  <div className={`${evento.cor} mt-1`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{evento.tipo}</p>
                      <Badge variant="outline" className="text-xs">
                        {format(new Date(evento.dataHora), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </Badge>
                    </div>
                    {evento.detalhe && (
                      <p className="text-sm text-gray-600 mt-1">{evento.detalhe}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}