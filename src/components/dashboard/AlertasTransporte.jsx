import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, Bell, BellOff, X, Clock, Truck } from "lucide-react";
import { differenceInMinutes } from "date-fns";

// Limites de tempo (minutos) por prioridade para considerar "atrasado"
const LIMITES_MINUTOS = {
  0: 60,  // SCACESST: alerta após 60min em transporte
  1: 120, // SCASESST c/ Troponina: 120min
  2: 180, // SCASESST s/ Troponina: 180min
};

function tocarAlerta() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beep = (freq, start, dur) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = freq;
      o.type = "sine";
      g.gain.setValueAtTime(0, ctx.currentTime + start);
      g.gain.linearRampToValueAtTime(0.4, ctx.currentTime + start + 0.01);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + start + dur);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + dur + 0.05);
    };
    beep(880, 0, 0.15);
    beep(880, 0.2, 0.15);
    beep(1100, 0.4, 0.3);
  } catch (_) {}
}

export default function AlertasTransporte({ pacientes }) {
  const [somAtivo, setSomAtivo] = useState(true);
  const [descartados, setDescartados] = useState(new Set());
  const jaTocoRef = useRef(new Set());

  const alertas = pacientes
    .filter(p => p.status === "Em Transporte" && p.transporte?.data_hora_inicio && !p.transporte?.data_hora_chegada_destino)
    .map(p => {
      const minutosEmTransporte = differenceInMinutes(new Date(), new Date(p.transporte.data_hora_inicio));
      const limite = LIMITES_MINUTOS[p.prioridade] ?? 180;
      const atrasado = minutosEmTransporte > limite;
      const prioridadeAlta = p.prioridade === 0;
      return { ...p, minutosEmTransporte, limite, atrasado, prioridadeAlta };
    })
    .filter(p => p.atrasado || p.prioridadeAlta)
    .filter(p => !descartados.has(p.id));

  useEffect(() => {
    if (!somAtivo) return;
    alertas.forEach(a => {
      if (a.atrasado && !jaTocoRef.current.has(a.id)) {
        jaTocoRef.current.add(a.id);
        tocarAlerta();
      }
    });
  }, [alertas.map(a => a.id).join(","), somAtivo]);

  if (alertas.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
          <AlertTriangle className="w-4 h-4 animate-pulse" />
          ALERTAS DE TRANSPORTE ({alertas.length})
        </div>
        <button
          onClick={() => setSomAtivo(v => !v)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 border rounded px-2 py-1"
        >
          {somAtivo ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
          {somAtivo ? "Som ativo" : "Som mudo"}
        </button>
      </div>

      {alertas.map(a => (
        <div
          key={a.id}
          className={`flex items-start justify-between gap-3 rounded-lg border-2 p-3 text-sm ${
            a.atrasado
              ? "bg-red-50 border-red-400 animate-pulse"
              : "bg-orange-50 border-orange-400"
          }`}
        >
          <div className="flex items-start gap-2">
            {a.atrasado
              ? <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              : <Truck className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
            }
            <div>
              <p className="font-semibold text-gray-900">{a.nome_completo}</p>
              <p className={`text-xs font-bold ${a.atrasado ? "text-red-700" : "text-orange-700"}`}>
                {a.atrasado
                  ? `⚠️ TEMPO EXCEDIDO: ${a.minutosEmTransporte}min em transporte (limite: ${a.limite}min)`
                  : `🚨 PRIORIDADE 0 em transporte há ${a.minutosEmTransporte}min`
                }
              </p>
              <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Destino: {a.transporte?.unidade_destino || "Não definido"} • {a.unidade_saude}
              </p>
            </div>
          </div>
          <button
            onClick={() => setDescartados(prev => new Set([...prev, a.id]))}
            className="text-gray-400 hover:text-gray-600 shrink-0"
            title="Dispensar alerta"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}