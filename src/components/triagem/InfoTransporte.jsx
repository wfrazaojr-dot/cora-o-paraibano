import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Truck, AlertTriangle } from "lucide-react";

const CONTRAIND_FIELDS = [
  { key: "doenca_renal_cronica", label: "Doença renal crônica moderada a grave" },
  { key: "anemia_grave", label: "Anemia grave" },
  { key: "ic_descompensada", label: "Insuficiência cardíaca descompensada" },
  { key: "arritmias_nao_controladas", label: "Arritmias não controladas" },
  { key: "infeccao_respiratoria", label: "Infecção respiratória aguda ou febre sem foco definido" },
  { key: "fragilidade_clinica", label: "Fragilidade clínica importante" },
  { key: "idade_comorbidades", label: "Idade avançada associada a múltiplas comorbidades" },
  { key: "dificuldade_acesso_vascular", label: "Dificuldade para obtenção de acesso vascular seguro" },
];

const glasgowOptions = [3,4,5,6,7,8,9,10,11,12,13,14,15];
const vmModos = ["VCV", "PCV", "CPAP", "PSV"];
const vmRelacaoIE = ["1:2", "1:3", "1:1"];
const drogasAnalgesia = ["Fentanil", "Midazolan", "Ketamin", "Propofol", "Norcurônio", "Rocurônio", "Vercurônio"];
const drogasDVA = ["Norepinefrina", "Epinefrina", "Tridil", "Nipride", "Dopamina", "Dobutamina", "Vasopressina"];

function SimNao({ fieldName, value, onChange }) {
  return (
    <div className="flex gap-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="radio" name={fieldName} checked={value === true} onChange={() => onChange(true)} />
        <span className="text-sm">Sim</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="radio" name={fieldName} checked={value === false} onChange={() => onChange(false)} />
        <span className="text-sm">Não</span>
      </label>
    </div>
  );
}

export default function InfoTransporte({ dados, onChange }) {
  const d = dados || {};

  const toggleDroga = (lista, droga) => {
    const current = d[lista] || [];
    const updated = current.includes(droga)
      ? current.filter(x => x !== droga)
      : [...current, droga];
    onChange(lista, updated);
  };

  return (
    <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-6 space-y-5">
      <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
        <Truck className="w-5 h-5" />
        6. Informações para Transporte
      </h3>

      {/* Glasgow + O2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start">
        <div>
          <Label className="text-sm font-semibold mb-1 block">Escala de Coma de Glasgow</Label>
          <select
            value={d.glasgow || ""}
            onChange={(e) => onChange("glasgow", e.target.value)}
            className="w-full h-9 rounded-md border border-input px-3 text-sm bg-white"
          >
            <option value="">Selecione...</option>
            {glasgowOptions.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-sm font-semibold mb-2 block">Ar Ambiente</Label>
          <SimNao fieldName="ar_ambiente" value={d.ar_ambiente} onChange={(v) => onChange("ar_ambiente", v)} />
        </div>
        <div>
          <Label className="text-sm font-semibold mb-2 block">Cateter Nasal</Label>
          <SimNao fieldName="cateter_nasal" value={d.cateter_nasal} onChange={(v) => onChange("cateter_nasal", v)} />
        </div>
        <div>
          <Label className="text-sm font-semibold mb-2 block">Máscara O₂</Label>
          <SimNao fieldName="mascara_o2" value={d.mascara_o2} onChange={(v) => onChange("mascara_o2", v)} />
        </div>
      </div>

      {/* Ventilação Mecânica */}
      <div className="border rounded-lg p-4 bg-white space-y-3">
        <div className="flex items-center gap-6">
          <Label className="text-sm font-semibold">Ventilação Mecânica</Label>
          <SimNao fieldName="vm_ativo" value={d.vm_ativo} onChange={(v) => onChange("vm_ativo", v)} />
        </div>
        {d.vm_ativo === true && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
            <div>
              <Label className="text-xs mb-1 block">Modo</Label>
              <select value={d.vm_modo || ""} onChange={(e) => onChange("vm_modo", e.target.value)}
                className="w-full h-9 rounded-md border border-input px-3 text-sm bg-white">
                <option value="">...</option>
                {vmModos.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">FR (ipm)</Label>
              <Input value={d.vm_fr || ""} onChange={(e) => onChange("vm_fr", e.target.value)} placeholder="Ex: 14" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">PEEP (cmH₂O)</Label>
              <Input value={d.vm_peep || ""} onChange={(e) => onChange("vm_peep", e.target.value)} placeholder="Ex: 5" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">FiO₂ (%)</Label>
              <Input value={d.vm_fio2 || ""} onChange={(e) => onChange("vm_fio2", e.target.value)} placeholder="Ex: 40" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Relação I:E</Label>
              <select value={d.vm_relacao_ie || ""} onChange={(e) => onChange("vm_relacao_ie", e.target.value)}
                className="w-full h-9 rounded-md border border-input px-3 text-sm bg-white">
                <option value="">...</option>
                {vmRelacaoIE.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Analgesia/Sedação */}
      <div className="border rounded-lg p-4 bg-white space-y-3">
        <div className="flex items-center gap-6">
          <Label className="text-sm font-semibold">Analgesia/Sedação</Label>
          <SimNao fieldName="analgesia_sedacao" value={d.analgesia_sedacao} onChange={(v) => onChange("analgesia_sedacao", v)} />
        </div>
        {d.analgesia_sedacao === true && (
          <div>
            <Label className="text-xs mb-2 block text-gray-600">Drogas:</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {drogasAnalgesia.map(dr => (
                <div key={dr} className="flex items-center gap-2">
                  <Checkbox
                    checked={(d.analgesia_drogas || []).includes(dr)}
                    onCheckedChange={() => toggleDroga("analgesia_drogas", dr)}
                  />
                  <Label className="cursor-pointer text-sm">{dr}</Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DVA */}
      <div className="border rounded-lg p-4 bg-white space-y-3">
        <div className="flex items-center gap-6">
          <Label className="text-sm font-semibold">DVA (Droga Vasoativa)</Label>
          <SimNao fieldName="dva" value={d.dva} onChange={(v) => onChange("dva", v)} />
        </div>
        {d.dva === true && (
          <div>
            <Label className="text-xs mb-2 block text-gray-600">Drogas:</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {drogasDVA.map(dr => (
                <div key={dr} className="flex items-center gap-2">
                  <Checkbox
                    checked={(d.dva_drogas || []).includes(dr)}
                    onCheckedChange={() => toggleDroga("dva_drogas", dr)}
                  />
                  <Label className="cursor-pointer text-sm">{dr}</Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Marcapasso Transcutâneo */}
      <div className="flex items-center gap-6">
        <Label className="text-sm font-semibold">Marcapasso Transcutâneo</Label>
        <SimNao fieldName="marcapasso_transcutaneo" value={d.marcapasso_transcutaneo} onChange={(v) => onChange("marcapasso_transcutaneo", v)} />
      </div>

      {/* Contraindicações ao Transporte */}
      <div className="border-2 border-red-300 rounded-lg p-4 bg-red-50 space-y-3">
        <h4 className="text-sm font-bold text-red-900">⚠️ Contraindicações ao Transporte (avalie cada item)</h4>
        <div className="space-y-2">
          {CONTRAIND_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <Label className="text-sm text-gray-800">{label}</Label>
              <SimNao fieldName={key} value={d[key]} onChange={(v) => onChange(key, v)} />
            </div>
          ))}
        </div>
        {CONTRAIND_FIELDS.some(({ key }) => d[key] === true) && (
          <div className="mt-4 bg-red-100 border-2 border-red-600 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-900 text-sm mb-1">⚠️ Alerta! Transporte Contraindicado</p>
                <p className="text-red-800 text-sm">
                  Após o envio desta solicitação, estabilize o paciente e, em seguida, atualize este relatório e envie e-mail para Central de Regulação (CERH) da sua Macrorregião, atualizando e declarando a estabilização clínica para liberação da Vaga e transporte em USA com o novo relatório gerado em PDF.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}