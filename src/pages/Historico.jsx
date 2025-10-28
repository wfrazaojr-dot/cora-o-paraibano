import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ExternalLink, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const corClassificacao = {
  "Vermelha": "bg-red-100 text-red-800 border-red-300",
  "Laranja": "bg-orange-100 text-orange-800 border-orange-300",
  "Amarela": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Verde": "bg-green-100 text-green-800 border-green-300",
  "Azul": "bg-blue-100 text-blue-800 border-blue-300"
};

export default function Historico() {
  const [busca, setBusca] = useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pacientes = [], isLoading } = useQuery({
    queryKey: ['pacientes', user?.email],
    queryFn: async () => {
      // Se for admin, mostra todos os pacientes
      if (user?.role === 'admin') {
        return base44.entities.Paciente.list("-created_date");
      }
      // Se for usuário comum, mostra apenas seus pacientes
      return base44.entities.Paciente.filter({ created_by: user?.email }, "-created_date");
    },
    enabled: !!user,
    initialData: [],
  });

  const pacientesFiltrados = pacientes.filter(p => {
    const termoBusca = busca.toLowerCase().trim();
    if (!termoBusca) return true;
    
    return (
      p.nome_completo?.toLowerCase().includes(termoBusca) ||
      p.prontuario?.includes(termoBusca) ||
      p.classificacao_risco?.cor?.toLowerCase().includes(termoBusca) ||
      p.id?.toLowerCase().includes(termoBusca)
    );
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Histórico de Atendimentos</h1>
          <p className="text-gray-600">Registro completo de todos os pacientes atendidos</p>
          <p className="text-sm text-blue-600 mt-1">
            👤 {user.full_name} • {user.email}
            {user.role === 'admin' && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">ADMINISTRADOR - Vendo todos os usuários</span>}
          </p>
        </div>

        <Card className="shadow-md mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por nome, prontuário, classificação ou ID do paciente..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            {busca && (
              <p className="text-sm text-gray-500 mt-2">
                {pacientesFiltrados.length === 0 ? (
                  <span className="text-red-600">Nenhum paciente encontrado com "{busca}"</span>
                ) : (
                  <span>Mostrando {pacientesFiltrados.length} resultado(s) para "{busca}"</span>
                )}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="border-b">
            <CardTitle>Pacientes ({pacientesFiltrados.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Carregando...</div>
            ) : pacientesFiltrados.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {busca ? `Nenhum paciente encontrado` : `Nenhum paciente cadastrado`}
              </div>
            ) : (
              <div className="divide-y">
                {pacientesFiltrados.map((paciente) => (
                  <div key={paciente.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{paciente.nome_completo}</h3>
                            <p className="text-sm text-gray-600">
                              {paciente.idade} anos • {paciente.sexo} • Pront. {paciente.prontuario}
                            </p>
                            <p className="text-xs text-gray-500 font-mono mt-1">
                              ID: {paciente.id}
                            </p>
                            {user.role === 'admin' && (
                              <p className="text-xs text-blue-600 mt-1">
                                👤 Criado por: {paciente.created_by}
                              </p>
                            )}
                          </div>
                          {paciente.classificacao_risco?.cor && (
                            <Badge className={`${corClassificacao[paciente.classificacao_risco.cor]} border font-semibold`}>
                              {paciente.classificacao_risco.cor}
                            </Badge>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-3 mt-4">
                          <div className="text-sm">
                            <span className="text-gray-600">Chegada:</span>{" "}
                            <span className="font-medium">
                              {format(new Date(paciente.data_hora_chegada), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          {paciente.tempo_triagem_ecg_minutos && (
                            <div className="text-sm">
                              <span className="text-gray-600">Tempo Triagem-ECG:</span>{" "}
                              <span className={`font-medium ${paciente.tempo_triagem_ecg_minutos <= 10 ? "text-green-600" : "text-orange-600"}`}>
                                {paciente.tempo_triagem_ecg_minutos} min
                              </span>
                            </div>
                          )}
                          <div className="text-sm">
                            <span className="text-gray-600">Status:</span>{" "}
                            <Badge variant="outline">{paciente.status}</Badge>
                          </div>
                          {paciente.tempo_total_minutos && (
                            <div className="text-sm">
                              <span className="text-gray-600">Tempo Total:</span>{" "}
                              <span className="font-medium">{paciente.tempo_total_minutos} min</span>
                            </div>
                          )}
                          {paciente.avaliacao_medica?.diagnostico_confirmado && (
                            <div className="text-sm md:col-span-2">
                              <span className="text-gray-600">Diagnóstico:</span>{" "}
                              <span className="font-medium">{paciente.avaliacao_medica.diagnostico_confirmado}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link to={`${createPageUrl("NovaTriagem")}?id=${paciente.id}`}>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </Link>
                        <Link to={`${createPageUrl("NovaTriagem")}?id=${paciente.id}&retriagem=true`}>
                          <Button variant="outline" size="sm" className="bg-blue-50 hover:bg-blue-100">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retriagem
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}