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
import { CheckCircle2, XCircle, Lock, Search, Users, RefreshCw, ShieldCheck, FileSpreadsheet, FileText, Trash2, History, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

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
  const [dialogExcluir, setDialogExcluir] = useState(null);
  const [historicoExpandido, setHistoricoExpandido] = useState({});

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: usuarios = [], isLoading, refetch } = useQuery({
    queryKey: ['usuarios-gerenciar'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!currentUser,
  });

  const { data: logsAuditoria = [] } = useQuery({
    queryKey: ['logs-acesso'],
    queryFn: () => base44.entities.LogAuditoria.filter({ entidade: "User" }, "-created_date", 500),
    enabled: !!currentUser,
  });

  const registrarLog = async (acao, usuario, descricao) => {
    await base44.entities.LogAuditoria.create({
      usuario_email: currentUser?.email || "",
      usuario_nome: currentUser?.full_name || currentUser?.email || "",
      acao,
      entidade: "User",
      entidade_id: usuario.id,
      descricao,
      severidade: acao === "deletar" ? "critico" : "aviso",
    });
    queryClient.invalidateQueries({ queryKey: ['logs-acesso'] });
  };

  const deleteMutation = useMutation({
    mutationFn: async (usuario) => {
      await registrarLog("deletar", usuario,
        `Usuário "${usuario.full_name || usuario.email}" foi EXCLUÍDO do sistema.`
      );
      return base44.entities.User.delete(usuario.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-gerenciar'] });
      setDialogExcluir(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status, motivo, usuarioAlvo }) => {
      const updateData = { status_acesso: status };
      if (motivo) updateData.motivo_bloqueio = motivo;
      if (status === "ATIVO") updateData.motivo_bloqueio = null;
      const statusLabel = { ATIVO: "ATIVO", INATIVO: "INATIVO", BLOQUEADO: "BLOQUEADO" }[status] || status;
      const descricao = motivo
        ? `Status alterado para "${statusLabel}" — Motivo: ${motivo}`
        : `Status alterado para "${statusLabel}"`;
      if (usuarioAlvo) await registrarLog("atualizar", usuarioAlvo, descricao);
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

  // Apenas o desenvolvedor pode aprovar/ativar/bloquear/excluir ADMINISTRADOR_MANAGER
  const podeGerenciarUsuario = (usuario) => {
    if (isDev) return true; // desenvolvedor pode tudo
    if (usuario.role === "ADMINISTRADOR_MANAGER") return false; // apenas dev pode gerenciar MANAGER
    return isManager;
  };

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

  const getDadosExportacao = () => usuarios
    .filter(u => u.email?.toLowerCase() !== "wfrazaojr@gmail.com")
    .map(u => ({
      "Nome": u.full_name || u.nome_completo || "(Sem nome)",
      "E-mail": u.email || "",
      "CPF": u.cpf || "",
      "Perfil": PERFIL_LABELS[u.perfil] || u.perfil || "",
      "Função": FUNCAO_LABELS[u.funcao] || u.funcao || "",
      "Equipe": u.equipe?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "",
      "Unidade de Saúde": u.unidade_saude || "",
      "Registro Profissional": u.registro_profissional_tipo && u.registro_profissional_numero
        ? `${u.registro_profissional_tipo}: ${u.registro_profissional_numero}` : "",
      "Matrícula": u.matricula || "",
      "Status": STATUS_CONFIG[u.status_acesso]?.label || (u.cadastro_completo ? "Pendente" : "Sem cadastro"),
      "Data de Cadastro": u.created_date ? new Date(u.created_date).toLocaleDateString("pt-BR") : "",
    }));

  const exportarExcel = () => {
    const dados = getDadosExportacao();
    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Profissionais");
    XLSX.writeFile(wb, `profissionais_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.xlsx`);
  };

  const exportarPDF = () => {
    const dados = getDadosExportacao();
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.setTextColor(180, 30, 30);
    doc.text("Lista de Profissionais Cadastrados", 14, 16);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}   |   Total: ${dados.length} profissionais`, 14, 23);

    // Cabeçalho da tabela
    const colunas = ["Nome", "E-mail", "CPF", "Perfil", "Função", "Equipe", "Unidade de Saúde", "Registro", "Status", "Cadastro"];
    const linhaAltura = 7;
    let y = 30;

    // Header
    doc.setFillColor(220, 38, 38);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.rect(14, y, 269, linhaAltura, "F");
    const larguras = [35, 45, 22, 28, 20, 22, 30, 22, 18, 18];
    let x = 14;
    colunas.forEach((col, i) => { doc.text(col, x + 1, y + 5); x += larguras[i]; });
    y += linhaAltura;

    // Linhas
    doc.setTextColor(40, 40, 40);
    dados.forEach((row, idx) => {
      if (y > 185) { doc.addPage(); y = 15; }
      if (idx % 2 === 0) { doc.setFillColor(245, 245, 245); doc.rect(14, y, 269, linhaAltura, "F"); }
      const vals = [row["Nome"], row["E-mail"], row["CPF"], row["Perfil"], row["Função"], row["Equipe"], row["Unidade de Saúde"], row["Registro Profissional"], row["Status"], row["Data de Cadastro"]];
      x = 14;
      vals.forEach((val, i) => {
        const txt = doc.splitTextToSize(String(val || ""), larguras[i] - 2);
        doc.text(txt[0] || "", x + 1, y + 5);
        x += larguras[i];
      });
      y += linhaAltura;
    });

    doc.save(`profissionais_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.pdf`);
  };

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
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportarExcel} className="gap-2 border-green-400 text-green-700 hover:bg-green-50">
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportarPDF} className="gap-2 border-red-300 text-red-700 hover:bg-red-50">
            <FileText className="w-4 h-4" />
            PDF
          </Button>
        </div>
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
                      <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-100 pt-1">
                        {usuario.equipe && (
                          <span className="font-medium text-blue-700">
                            Equipe: {usuario.equipe.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                          </span>
                        )}
                        {usuario.unidade_saude && (
                          <span>Unidade: <strong>{usuario.unidade_saude}</strong></span>
                        )}
                        {usuario.created_date && (
                          <span className="text-gray-400">
                            Cadastro: {new Date(usuario.created_date).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                      {usuario.motivo_bloqueio && (
                        <p className="text-xs text-red-600 mt-1">
                          Motivo: {usuario.motivo_bloqueio}
                        </p>
                      )}

                      {/* Histórico de ações */}
                      {(() => {
                        const logsUsuario = logsAuditoria.filter(l => l.entidade_id === usuario.id);
                        if (logsUsuario.length === 0) return null;
                        const expandido = historicoExpandido[usuario.id];
                        return (
                          <div className="mt-2">
                            <button
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                              onClick={() => setHistoricoExpandido(prev => ({ ...prev, [usuario.id]: !prev[usuario.id] }))}
                            >
                              <History className="w-3 h-3" />
                              {logsUsuario.length} registro(s) de alteração
                              {expandido ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            {expandido && (
                              <div className="mt-2 space-y-1 border-l-2 border-blue-200 pl-3">
                                {logsUsuario.map(log => (
                                  <div key={log.id} className="text-xs text-gray-600">
                                    <span className="text-gray-400">{new Date(log.created_date).toLocaleString("pt-BR")}</span>
                                    {" · "}
                                    <span className="font-medium text-gray-700">{log.usuario_nome || log.usuario_email}</span>
                                    {" · "}
                                    <span>{log.descricao}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 flex-wrap">
                      {!podeGerenciarUsuario(usuario) ? (
                        <span className="text-xs text-gray-400 italic px-2 py-1">Apenas o desenvolvedor pode gerenciar este usuário</span>
                      ) : (
                        <>
                          {statusAtual !== "ATIVO" && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white gap-1"
                              onClick={() => updateStatusMutation.mutate({ userId: usuario.id, status: "ATIVO", usuarioAlvo: usuario })}
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
                              onClick={() => updateStatusMutation.mutate({ userId: usuario.id, status: "INATIVO", usuarioAlvo: usuario })}
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
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-600 text-red-700 hover:bg-red-100 gap-1"
                            onClick={() => setDialogExcluir(usuario)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de Exclusão */}
      <Dialog open={!!dialogExcluir} onOpenChange={() => setDialogExcluir(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Excluir Usuário
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-700">
            Tem certeza que deseja excluir permanentemente o usuário{" "}
            <strong>{dialogExcluir?.full_name || dialogExcluir?.nome_completo || dialogExcluir?.email}</strong>?
            Esta ação <strong>não pode ser desfeita</strong>.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogExcluir(null)}>Cancelar</Button>
            <Button
              className="bg-red-700 hover:bg-red-800 text-white"
              onClick={() => deleteMutation.mutate(dialogExcluir)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Confirmar Exclusão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                motivo: motivoBloqueio,
                usuarioAlvo: dialogBloqueio
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