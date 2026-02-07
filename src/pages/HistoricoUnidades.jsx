import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function HistoricoUnidades() {
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);

  // Buscar usuário atual
  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  // Buscar pacientes criados pela unidade de saúde atual
  const { data: pacientes = [], isLoading } = useQuery({
    queryKey: ['pacientes-unidade', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const unidade = user.full_name || 'Sem unidade';
      return await base44.entities.Paciente.filter(
        { unidade_saude: unidade },
        '-created_date',
        100
      );
    },
    enabled: !!user?.email,
  });

  const filteredPacientes = pacientes.filter(p =>
    p.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.unidade_saude?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      'Em Triagem': 'bg-blue-100 text-blue-800',
      'Aguardando Assessoria': 'bg-yellow-100 text-yellow-800',
      'Aguardando Regulação': 'bg-orange-100 text-orange-800',
      'Regulado': 'bg-green-100 text-green-800',
      'Concluído': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPrioridadeColor = (prioridade) => {
    const colors = {
      'Vermelha': 'bg-red-100 text-red-800',
      'Amarela': 'bg-yellow-100 text-yellow-800',
      'Verde': 'bg-green-100 text-green-800',
    };
    return colors[prioridade] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Histórico de Pacientes</h1>
        <p className="text-gray-600">Pacientes registrados pela sua unidade de saúde</p>
      </div>

      {/* Barra de busca */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por nome do paciente ou unidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de pacientes */}
      {filteredPacientes.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum paciente encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPacientes.map((paciente) => (
            <Card key={paciente.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-gray-900">{paciente.nome_completo}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{paciente.unidade_saude}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getPrioridadeColor(paciente.classificacao_prioridade)}>
                      {paciente.classificacao_prioridade || 'Não classificado'}
                    </Badge>
                    <Badge className={getStatusColor(paciente.status)}>
                      {paciente.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Idade</p>
                    <p className="font-semibold text-gray-900">{paciente.idade} anos</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Sexo</p>
                    <p className="font-semibold text-gray-900">{paciente.sexo}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Data de Chegada</p>
                    <p className="font-semibold text-gray-900">
                      {paciente.data_hora_chegada
                        ? format(new Date(paciente.data_hora_chegada), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Registrado em</p>
                    <p className="font-semibold text-gray-900">
                      {format(new Date(paciente.created_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}