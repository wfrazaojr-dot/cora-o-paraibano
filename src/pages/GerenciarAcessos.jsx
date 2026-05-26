import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Lock, Search, Users, RefreshCw, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const STATUS_CONFIG = {
  PENDENTE: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  ATIVO: { label: "Ativo", color: "bg-green-100 text-green-800 border-green-300" },
  INATIVO: { label: "Inativo", color: "bg-gray-100 text-gray-700 border-gray-300" },
  BLOQUEADO: { label: "Bloqueado", color: "bg-red-100 text-red-800 border-red-300" },
};

const PERFIL_LABELS = {
  UNIDADE_SAUDE: "Unidade de Saúde",
  CERH: "CERH",
  ASSCARDIO: "ASSCARDIO",
  TRANSPORTE: "Transporte",
  HEMODINAMICA: "Hemodinâmica",
  ADMINISTRADOR_MANAGER: "Adm. Manager",
  ADMINISTRADOR_CERH: "Adm. CERH",
  ADMINISTRADOR_CARDIOLOGIA: "Adm. Cardiologia",
  ADMINISTRADOR_TRANSPORTE: "Adm. Transporte",
};

const FUNCAO_LABELS = {
  medico: "Médico",
  enfermeiro: "Enfermeiro",
  assistente_social: "Assistente Social",
  operador_frota: "Operador de Frota",
  administrativo: "Administrativo",
};

export default function GerenciarAcessos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPerfil, setFiltroPerfil] = useState("todos");
  const [dialogBloqueio, setDialogBloqueio] = useState(null);
  const [motivoBloqueio, setMotivoBloqueio] = useState("");

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: usuarios = [], isLoading, refetch } = useQuery({
    queryKey: ['usuarios-gerenciar'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!currentUser,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status, motivo }) => {
      const updateData = { status_acesso: status };
      if (motivo) updateData.motivo_bloqueio = motivo;
      if (status === "ATIVO") updateData.motivo_bloqueio = null;
      return base44.entities.User.update(userId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-gerenciar'] });
      setDialogBloqueio(null);
      setMotivoBloqueio("");
    },
  });

  // Verificar permissão
  const isDev = currentUser?.email?.toLowerCase() === "wfrazaojr@gmail.com";
  const isManager = currentUser?.role === "ADMINISTRADOR_MANAGER" || currentUser?.role === "admin" || isDev;

  if (!isManager) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center">
            <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Apenas o Administrador Manager tem acesso a esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const usuariosFiltrados = usuarios.filter(u => {
    const matchBusca = !busca ||
      u.full_name?.toLowerCase().includes(busca.toLowerCase()) ||
      u.email?.toLowerCase().includes(busca.toLowerCase()) ||
      u.cpf?.includes(busca);
    const matchStatus = filtroStatus === "todos" || u.status_acesso === filtroStatus || (!u.status_acesso && filtroStatus === "PENDENTE");
    const matchPerfil = filtroPerfil === "todos" || u.perfil === filtroPerfil;
    return matchBusca && matchStatus && matchPerfil;
  });

  // Excluir o próprio desenvolvedor da lista
  const usuariosExibidos = usuariosFiltrados.filter(u => u.email?.toLowerCase() !== "wfrazaojr@gmail.com");

  const contadores = {
    PENDENTE: usuarios.filter(u => (u.status_acesso === "PENDENTE" || !u.status_acesso) && u.cadastro_completo).length,
    ATIVO: usuarios.filter(u => u.status_acesso === "ATIVO").length,
    INATIVO: usuarios.filter(u => u.status_acesso === "INATIVO").length,
    BLOQUEADO: usuarios.filter(u => u.status_acesso === "BLOQUEADO").length,
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-red-600" />
            Gerenciar Acessos
          </h1>
          <p className="text-gray-600 text-sm mt-1">Aprovação e controle de usuários cadastrados no sistema</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(contadores).map(([status, count]) => (
          <Card key={status} className={`border ${STATUS_CONFIG[status].color}`}>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs font-medium mt-1">{STATUS_CONFIG[status].label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, e-mail ou CPF..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="ATIVO">Ativo</SelectItem>
                <SelectItem value="INATIVO">Inativo</SelectItem>
                <SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroPerfil} onValueChange={setFiltroPerfil}>
              <SelectTrigger className="w-full md:w-52">
                <SelectValue placeholder="Perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Perfis</SelectItem>
                {Object.entries(PERFIL_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela/Lista */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Carregando usuários...</div>
      ) : usuariosExibidos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhum usuário encontrado com os filtros selecionados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {usuariosExibidos.map((usuario) => {
            const statusAtual = usuario.status_acesso || (usuario.cadastro_completo ? "PENDENTE" : "user");
            const cfg = STATUS_CONFIG[statusAtual] || STATUS_CONFIG["PENDENTE"];

            return (
              <Card key={usuario.id} className="border hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Info do usuário */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{usuario.full_name || usuario.nome_completo || "(Sem nome)"}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        {usuario.perfil && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                            {PERFIL_LABELS[usuario.perfil] || usuario.perfil}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span>{usuario.email}</span>
                        {usuario.cpf && <span>CPF: {usuario.cpf}</span>}
                        {usuario.funcao && <span>Função: {FUNCAO_LABELS[usuario.funcao] || usuario.funcao}</span>}
                        {usuario.registro_profissional_tipo && usuario.registro_profissional_numero && (
                          <span>{usuario.registro_profissional_tipo}: {usuario.registro_profissional_numero}</span>
                        )}
                        {usuario.matricula && <span>Matrícula: {usuario.matricula}</span>}
                      </div>
                      {usuario.motivo_bloqueio && (
                        <p className="text-xs text-red-600 mt-1">
                          Motivo: {usuario.motivo_bloqueio}
                        </p>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 flex-wrap">
                      {statusAtual !== "ATIVO" && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white gap-1"
                          onClick={() => updateStatusMutation.mutate({ userId: usuario.id, status: "ATIVO" })}
                          disabled={updateStatusMutation.isPending}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Ativar
                        </Button>
                      )}
                      {statusAtual !== "INATIVO" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-400 text-gray-700 gap-1"
                          onClick={() => updateStatusMutation.mutate({ userId: usuario.id, status: "INATIVO" })}
                          disabled={updateStatusMutation.isPending}
                        >
                          <XCircle className="w-4 h-4" />
                          Desativar
                        </Button>
                      )}
                      {statusAtual !== "BLOQUEADO" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50 gap-1"
                          onClick={() => { setDialogBloqueio(usuario); setMotivoBloqueio(""); }}
                          disabled={updateStatusMutation.isPending}
                        >
                          <Lock className="w-4 h-4" />
                          Bloquear
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de Bloqueio */}
      <Dialog open={!!dialogBloqueio} onOpenChange={() => setDialogBloqueio(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700">Bloquear Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Você está prestes a bloquear o acesso de <strong>{dialogBloqueio?.full_name || dialogBloqueio?.nome_completo || dialogBloqueio?.email}</strong>.
            </p>
            <div>
              <Label htmlFor="motivo">Motivo do bloqueio (opcional)</Label>
              <Input
                id="motivo"
                className="mt-1"
                placeholder="Descreva o motivo do bloqueio..."
                value={motivoBloqueio}
                onChange={(e) => setMotivoBloqueio(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogBloqueio(null)}>Cancelar</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => updateStatusMutation.mutate({
                userId: dialogBloqueio.id,
                status: "BLOQUEADO",
                motivo: motivoBloqueio
              })}
              disabled={updateStatusMutation.isPending}
            >
              Confirmar Bloqueio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}