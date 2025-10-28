import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Clock, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Etapa1DadosPaciente({ dadosPaciente, onProxima }) {
  const [dados, setDados] = useState({
    unidade_saude: dadosPaciente.unidade_saude || "",
    nome_completo: dadosPaciente.nome_completo || "",
    idade: dadosPaciente.idade || "",
    sexo: dadosPaciente.sexo || "",
    prontuario: dadosPaciente.prontuario || "",
    data_hora_chegada: dadosPaciente.data_hora_chegada || format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    data_hora_inicio_sintomas: dadosPaciente.data_hora_inicio_sintomas || "",
    data_hora_inicio_triagem: dadosPaciente.data_hora_inicio_triagem || format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    status: "Em Triagem"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onProxima(dados);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Informações do Paciente</h2>
        <p className="text-gray-600">Preencha os dados básicos do paciente para iniciar a triagem</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
        <Clock className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">Data e Hora do Início da Triagem</p>
          <p className="text-lg font-bold text-blue-700">
            {format(new Date(dados.data_hora_inicio_triagem), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-5 h-5 text-green-700" />
          <Label htmlFor="unidade_saude" className="text-base font-semibold text-green-900">
            Nome da Unidade de Saúde *
          </Label>
        </div>
        <Input
          id="unidade_saude"
          value={dados.unidade_saude}
          onChange={(e) => setDados({...dados, unidade_saude: e.target.value})}
          placeholder="Ex: Hospital Municipal São José, UPA Centro, etc."
          required
          className="text-base"
        />
        <p className="text-xs text-green-700 mt-2">
          Este nome aparecerá nos relatórios e documentos oficiais
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="nome_completo">Nome Completo *</Label>
          <Input
            id="nome_completo"
            value={dados.nome_completo}
            onChange={(e) => setDados({...dados, nome_completo: e.target.value})}
            placeholder="Digite o nome completo"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="prontuario">Número do Prontuário *</Label>
          <Input
            id="prontuario"
            value={dados.prontuario}
            onChange={(e) => setDados({...dados, prontuario: e.target.value})}
            placeholder="Ex: 123456"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="idade">Idade *</Label>
          <Input
            id="idade"
            type="number"
            value={dados.idade}
            onChange={(e) => setDados({...dados, idade: parseInt(e.target.value)})}
            placeholder="Digite a idade"
            required
            min="0"
            max="150"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sexo">Sexo *</Label>
          <Select value={dados.sexo} onValueChange={(value) => setDados({...dados, sexo: value})} required>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o sexo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Masculino">Masculino</SelectItem>
              <SelectItem value="Feminino">Feminino</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_hora_chegada">Data e Hora de Chegada *</Label>
          <Input
            id="data_hora_chegada"
            type="datetime-local"
            value={dados.data_hora_chegada}
            onChange={(e) => setDados({...dados, data_hora_chegada: e.target.value})}
            required
          />
          <p className="text-xs text-gray-500">Pode ser ajustada se necessário</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_hora_inicio_sintomas">Data e Hora do Início dos Sintomas *</Label>
          <Input
            id="data_hora_inicio_sintomas"
            type="datetime-local"
            value={dados.data_hora_inicio_sintomas}
            onChange={(e) => setDados({...dados, data_hora_inicio_sintomas: e.target.value})}
            required
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" className="bg-red-600 hover:bg-red-700">
          Próxima Etapa
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}