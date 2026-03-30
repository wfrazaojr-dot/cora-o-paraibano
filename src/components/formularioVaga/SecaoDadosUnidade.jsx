import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SecaoDadosUnidade({ formData, setFormData, paciente }) {
  return (
    <div>
      <h3 className="text-base font-bold mb-3 border-b pb-2 text-blue-900">DADOS DA UNIDADE</h3>
      {paciente ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 grid md:grid-cols-3 gap-3">
          <div>
            <span className="text-xs text-blue-600 font-semibold uppercase">Unidade Solicitante</span>
            <p className="font-bold text-gray-900">{paciente.unidade_saude || '—'}</p>
          </div>
          <div>
            <span className="text-xs text-blue-600 font-semibold uppercase">Macrorregião</span>
            <p className="font-bold text-gray-900">{paciente.macrorregiao || '—'}</p>
          </div>
          <div>
            <span className="text-xs text-blue-600 font-semibold uppercase">Data e Horário da Admissão</span>
            <p className="text-gray-900">{paciente.data_hora_chegada ? new Date(paciente.data_hora_chegada).toLocaleString('pt-BR') : '—'}</p>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Unidade Solicitante *</Label>
            <Input value={formData.unidade_solicitante} onChange={(e) => setFormData({ ...formData, unidade_solicitante: e.target.value })} required />
          </div>
          <div>
            <Label>Data e Horário da Admissão</Label>
            <Input type="datetime-local" value={formData.data_hora_admissao} onChange={(e) => setFormData({ ...formData, data_hora_admissao: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  );
}