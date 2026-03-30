import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SecaoDadosPessoais({ formData, setFormData, paciente, calcularIdade, formatarCPF, formatarTelefone }) {
  return (
    <div>
      <h3 className="text-base font-bold mb-3 border-b pb-2 text-blue-900">DADOS PESSOAIS</h3>
      {paciente && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 grid md:grid-cols-3 gap-3">
          <div className="md:col-span-3">
            <span className="text-xs text-blue-600 font-semibold uppercase">Nome Completo</span>
            <p className="font-bold text-gray-900">{paciente.nome_completo}</p>
          </div>
          <div>
            <span className="text-xs text-blue-600 font-semibold uppercase">Data de Nascimento</span>
            <p className="text-gray-900">{paciente.data_nascimento ? new Date(paciente.data_nascimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</p>
          </div>
          <div>
            <span className="text-xs text-blue-600 font-semibold uppercase">Idade</span>
            <p className="text-gray-900">{paciente.idade ? `${paciente.idade} anos` : '—'}</p>
          </div>
          <div>
            <span className="text-xs text-blue-600 font-semibold uppercase">Sexo</span>
            <p className="text-gray-900">{paciente.sexo || '—'}</p>
          </div>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        {!paciente && (
          <>
            <div className="md:col-span-2">
              <Label>Nome Completo *</Label>
              <Input value={formData.nome_completo} onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })} required />
            </div>
            <div>
              <Label>Data de Nascimento</Label>
              <Input type="date" value={formData.data_nascimento} onChange={(e) => {
                const novaData = e.target.value;
                setFormData({ ...formData, data_nascimento: novaData, idade: calcularIdade(novaData) });
              }} />
            </div>
            <div>
              <Label>Idade</Label>
              <Input type="number" value={formData.idade} onChange={(e) => setFormData({ ...formData, idade: e.target.value })} />
            </div>
            <div>
              <Label>Sexo</Label>
              <Select value={formData.sexo} onValueChange={(v) => setFormData({ ...formData, sexo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        <div>
          <Label>Nome da Mãe</Label>
          <Input value={formData.nome_mae} onChange={(e) => setFormData({ ...formData, nome_mae: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Label>Local de Nascimento</Label>
          <Input value={formData.local_nascimento} onChange={(e) => setFormData({ ...formData, local_nascimento: e.target.value })} />
        </div>
        <div>
          <Label>RG nº</Label>
          <Input value={formData.rg} onChange={(e) => setFormData({ ...formData, rg: e.target.value })} />
        </div>
        <div>
          <Label>UF</Label>
          <Input value={formData.uf_rg} onChange={(e) => setFormData({ ...formData, uf_rg: e.target.value })} maxLength={2} />
        </div>
        <div>
          <Label>CPF nº</Label>
          <Input value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: formatarCPF(e.target.value) })} maxLength={14} />
        </div>
        <div>
          <Label>CNS nº</Label>
          <Input value={formData.cns} onChange={(e) => setFormData({ ...formData, cns: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Label>Endereço Completo</Label>
          <Input value={formData.endereco} onChange={(e) => setFormData({ ...formData, endereco: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Label>Telefone de Contato do Responsável</Label>
          <Input value={formData.telefone_responsavel} onChange={(e) => setFormData({ ...formData, telefone_responsavel: formatarTelefone(e.target.value) })} maxLength={14} placeholder="83 98877-3344" />
        </div>
      </div>
    </div>
  );
}