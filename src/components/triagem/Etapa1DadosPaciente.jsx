import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Etapa1DadosPaciente({ dadosPaciente, onProxima }) {
  const [dados, setDados] = useState({
    unidade_saude: dadosPaciente.unidade_saude || "",
    nome_completo: dadosPaciente.nome_completo || "",
    idade: dadosPaciente.idade || "",
    sexo: dadosPaciente.sexo || "",
    data_hora_chegada: dadosPaciente.data_hora_chegada || format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    data_hora_inicio_sintomas: dadosPaciente.data_hora_inicio_sintomas || "",
    status: "Em Triagem"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!dados.unidade_saude || dados.unidade_saude.trim() === "") {
      alert("Por favor, preencha o nome da Unidade de Saúde");
      return;
    }
    
    if (!dados.sexo) {
      alert("Por favor, selecione o sexo do paciente");
      return;
    }
    
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
            {format(new Date(dados.data_hora_chegada), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>

      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-5 h-5 text-green-700" />
          <Label htmlFor="unidade_saude" className="text-base font-semibold text-green-900">
            Nome da Unidade de Saúde *
          </Label>
        </div>
        <Input
          id="unidade_saude"
          value={dados.unidade_saude}
          onChange={(e) => setDados(prev => ({...prev, unidade_saude: e.target.value}))}
          placeholder="Ex: Hospital Municipal São José, UPA Centro, etc."
          required
          className="text-base border-2 border-green-400"
        />
        <p className="text-xs text-green-700 mt-2 font-medium">
          ⚠️ Este nome aparecerá nos relatórios e documentos oficiais - campo obrigatório
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="nome_completo">Nome Completo *</Label>
          <Input
            id="nome_completo"
            value={dados.nome_completo}
            onChange={(e) => setDados(prev => ({...prev, nome_completo: e.target.value}))}
            placeholder="Digite o nome completo"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="idade">Idade *</Label>
          <Input
            id="idade"
            type="number"
            value={dados.idade}
            onChange={(e) => setDados(prev => ({...prev, idade: parseInt(e.target.value) || ""}))}
            placeholder="Digite a idade"
            required
            min="0"
            max="150"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sexo">Sexo *</Label>
          <select
            id="sexo"
            value={dados.sexo}
            onChange={(e) => setDados(prev => ({...prev, sexo: e.target.value}))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            required
          >
            <option value="">Selecione o sexo</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_hora_chegada">Data e Hora de Chegada na Unidade *</Label>
          <Input
            id="data_hora_chegada"
            type="datetime-local"
            value={dados.data_hora_chegada}
            onChange={(e) => setDados(prev => ({...prev, data_hora_chegada: e.target.value}))}
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
            onChange={(e) => setDados(prev => ({...prev, data_hora_inicio_sintomas: e.target.value}))}
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