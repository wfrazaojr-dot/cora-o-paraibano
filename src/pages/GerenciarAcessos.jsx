import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2, XCircle, Lock, Search, Users, RefreshCw,
  ShieldCheck, FileSpreadsheet, FileText, Trash2, History,
  ChevronDown, ChevronUp, Bell, UserPlus, AlertCircle
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

// ── Constantes ──────────────────────────────────────────────────────────────

const DEV_EMAIL = "wfrazaojr@gmail.com";

const ROLES_COM_ACESSO = [
  "admin", "ADMINISTRADOR_MANAGER", "ADMINISTRADOR_CERH",
  "ADMINISTRADOR_CARDIOLOGIA", "ADMINISTRADOR_TRANSPORTE", "DESENVOLVEDOR"
];

const STATUS_CONFIG = {
  PENDENTE:  { label: "Pendente",  color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  ATIVO:     { label: "Ativo",     color: "bg-green-100  text-green-800  border-green-300"  },
  INATIVO:   { label: "Inativo",   color: "bg-gray-100   text-gray-700   border-gray-300"   },
  BLOQUEADO: { label: "Bloqueado", color: "bg-red-100    text-red-800    border-red-300"    },
};

const PERFIL_LABELS = {
  UNIDADE_SAUDE:          "Unidade de Saúde",
  CERH:                   "CERH",
  ASSCARDIO:              "ASSCARDIO",
  TRANSPORTE:             "Transporte",
  HEMODINAMICA:           "Hemodinâmica",
  ADMINISTRADOR_MANAGER:  "Adm. Manager",
  ADMINISTRADOR_CERH:     "Adm. CERH",
  ADMINISTRADOR_CARDIOLOGIA: "Adm. Cardiologia",
  ADMINISTRADOR_TRANSPORTE:  "Adm. Transporte",
};

const FUNCAO_LABELS = {
  medico:            "Médico",
  enfermeiro:        "Enfermeiro",
  assistente_social: "Assistente Social",
  operador_frota:    "Operador de Frota",
  administrativo:    "Administrativo",
};

const EQUIPE_MAP = {
  UNIDADE_SAUDE: "unidade_saude", CERH: "cerh", ASSCARDIO: "asscardio",
  TRANSPORTE: "transporte", HEMODINAMICA: "hemodinamica",
  ADMINISTRADOR_MANAGER: "admin", ADMINISTRADOR_CERH: "cerh",
  ADMINISTRADOR_CARDIOLOGIA: "asscardio", ADMINISTRADOR_TRANSPORTE: "transporte",
};

// ── Componente principal ─────────────────────────────────────────────────────

export default function GerenciarAcessos() {
  const queryClient = useQueryClient();
  const [busca, setBusca]               = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPerfil, setFiltroPerfil] = useState("todos");
  const [filtroEquipe, setFiltroEquipe] = useState("todos");
  const [dialogBloqueio, setDialogBloqueio] = useState(null);
  const [motivoBloqueio, setMotivoBloqueio] = useState("");
  const [dialogExcluir, setDialogExcluir]   = useState(null);
  const [historicoExpandido, setHistoricoExpandido] = useState({});
  const [abaAtiva, setAbaAtiva] = useState("pendentes");

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn:  () => base44.auth.me(),
  });

  const { data: usuarios = [], isLoading, refetch } = useQuery({
    queryKey: ["usuarios-gerenciar"],
    queryFn:  () => base44.entities.User.list(),
    enabled:  !!currentUser,
  });

  const { data: solicitacoes = [], refetch: refetchSolic } = useQuery({
    queryKey: ["solicitacoes-acesso"],
    queryFn:  () => base44.entities.SolicitacaoAcesso.list("-created_date", 200),
    enabled:  !!currentUser,
  });

  const { data: logsAuditoria = [] } = useQuery({
    queryKey: ["logs-acesso"],
    queryFn:  () => base44.entities.LogAuditoria.filter({ entidade: "User" }, "-created_date", 500),
    enabled:  !!currentUser,
  });

  // ── Verificação de permissão ───────────────────────────────────────────────

  const isDev      = currentUser?.email?.toLowerCase() === DEV_EMAIL;
  const isManager  = isDev || ROLES_COM_ACESSO.includes(currentUser?.role);

  const podeGerenciarUsuario = (u) => {
    if (isDev) return true;
    if (u.role === "ADMINISTRADOR_MANAGER") return false;
    return isManager;
  };

  // ── Mutations ──────────────────────────────────────────────────────────────

  const registrarLog = async (acao, usuario, descricao) => {
    await base44.entities.LogAuditoria.create({
      usuario_email: currentUser?.email || "",
      usuario_nome:  currentUser?.full_name || currentUser?.email || "",
      acao, entidade: "User", entidade_id: usuario.id, descricao,
      severidade: acao === "deletar" ? "critico" : "aviso",
    });
    queryClient.invalidateQueries({ queryKey: ["logs-acesso"] });
  };

  // Aprovar/Rejeitar registro da entidade SolicitacaoAcesso (formulário externo)
  const processarSolicMutation = useMutation({
    mutationFn: async ({ sol, acao }) => {
      await base44.entities.SolicitacaoAcesso.update(sol.id, {
        status: acao === "aprovar" ? "APROVADO" : "REJEITADO",
      });
      if (acao === "aprovar") {
        // Verificar se o usuário já existe (logou via GOV.BR antes da aprovação)
        const todos = await base44.entities.User.list();
        const usuarioExistente = todos.find(u => u.email?.toLowerCase() === sol.email?.toLowerCase());

        if (usuarioExistente) {
          // Usuário já existe: apenas atualizar os dados e ativar
          await base44.entities.User.update(usuarioExistente.id, {
            nome_completo: sol.nome_completo, cpf: sol.cpf, telefone: sol.telefone,
            perfil: sol.perfil, funcao: sol.funcao,
            equipe: EQUIPE_MAP[sol.perfil] || "unidade_saude",
            registro_profissional_tipo: sol.registro_profissional_tipo,
            registro_profissional_numero: sol.registro_profissional_numero,
            matricula: sol.matricula, status_acesso: "ATIVO",
            cadastro_completo: true,
          });
        } else {
          // Usuário ainda não existe: convidar e aguardar criação
          await base44.users.inviteUser(sol.email, sol.perfil || "user");
          await new Promise(r => setTimeout(r, 2000));
          const todosApos = await base44.entities.User.list();
          const criado = todosApos.find(u => u.email?.toLowerCase() === sol.email?.toLowerCase());
          if (criado) {
            await base44.entities.User.update(criado.id, {
              nome_completo: sol.nome_completo, cpf: sol.cpf, telefone: sol.telefone,
              perfil: sol.perfil, funcao: sol.funcao,
              equipe: EQUIPE_MAP[sol.perfil] || "unidade_saude",
              registro_profissional_tipo: sol.registro_profissional_tipo,
              registro_profissional_numero: sol.registro_profissional_numero,
              matricula: sol.matricula, status_acesso: "ATIVO",
              cadastro_completo: true,
            });
          }
        }

        await base44.integrations.Core.SendEmail({
          to: sol.email,
          subject: "✅ Acesso Aprovado — Sistema Coração Paraibano",
          body: `Olá, ${sol.nome_completo}!\n\nSua solicitação foi APROVADA.\nPerfil: ${PERFIL_LABELS[sol.perfil] || sol.perfil}\n\nAcesse: https://coracaoparaibano.base44.app\n\nAtenciosamente,\nEquipe Coração Paraibano`,
        });
      } else {
        await base44.integrations.Core.SendEmail({
          to: sol.email,
          subject: "❌ Solicitação Negada — Sistema Coração Paraibano",
          body: `Olá, ${sol.nome_completo}.\n\nSua solicitação não foi aprovada. Para mais informações, contate o Administrador Manager.\n\nAtenciosamente,\nEquipe Coração Paraibano`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes-acesso"] });
      queryClient.invalidateQueries({ queryKey: ["usuarios-gerenciar"] });
    },
  });

  // Ativar / Inativar / Bloquear usuário existente
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status, motivo, usuarioAlvo }) => {
      const updateData = { status_acesso: status };
      if (motivo) updateData.motivo_bloqueio = motivo;
      if (status === "ATIVO") updateData.motivo_bloqueio = null;
      const descricao = motivo
        ? `Status alterado para "${status}" — Motivo: ${motivo}`
        : `Status alterado para "${status}"`;
      if (usuarioAlvo) await registrarLog("atualizar", usuarioAlvo, descricao);

      // Se ativando, sincronizar SolicitacaoAcesso correspondente (se houver)
      if (status === "ATIVO" && usuarioAlvo?.email) {
        const solics = await base44.entities.SolicitacaoAcesso.filter({ email: usuarioAlvo.email, status: "PENDENTE" });
        for (const sol of (solics || [])) {
          // Copiar dados do perfil para o User se ainda não tiver
          const dadosPerfil = {};
          if (!usuarioAlvo.perfil && sol.perfil)   dadosPerfil.perfil  = sol.perfil;
          if (!usuarioAlvo.funcao && sol.funcao)    dadosPerfil.funcao  = sol.funcao;
          if (!usuarioAlvo.cpf   && sol.cpf)        dadosPerfil.cpf     = sol.cpf;
          if (!usuarioAlvo.telefone && sol.telefone) dadosPerfil.telefone = sol.telefone;
          if (!usuarioAlvo.equipe && sol.perfil)    dadosPerfil.equipe  = EQUIPE_MAP[sol.perfil] || "unidade_saude";
          if (!usuarioAlvo.registro_profissional_tipo && sol.registro_profissional_tipo)
            dadosPerfil.registro_profissional_tipo = sol.registro_profissional_tipo;
          if (!usuarioAlvo.registro_profissional_numero && sol.registro_profissional_numero)
            dadosPerfil.registro_profissional_numero = sol.registro_profissional_numero;
          if (Object.keys(dadosPerfil).length > 0)
            Object.assign(updateData, dadosPerfil);
          await base44.entities.SolicitacaoAcesso.update(sol.id, { status: "APROVADO" });
        }
      }

      const result = await base44.entities.User.update(userId, updateData);
      if (status === "ATIVO" && usuarioAlvo) {
        const emailDest = usuarioAlvo.email_cadastro || usuarioAlvo.email;
        if (emailDest) {
          await base44.integrations.Core.SendEmail({
            to: emailDest,
            subject: "✅ Acesso Aprovado — Sistema Coração Paraibano",
            body: `Olá, ${usuarioAlvo.full_name || usuarioAlvo.nome_completo || "Profissional"}!\n\nSeu cadastro foi APROVADO. Acesse: https://coracaoparaibano.base44.app\n\nAtenciosamente,\nEquipe Coração Paraibano`,
          });
        }
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios-gerenciar"] });
      setDialogBloqueio(null);
      setMotivoBloqueio("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (usuario) => {
      await registrarLog("deletar", usuario, `Usuário "${usuario.full_name || usuario.email}" foi EXCLUÍDO.`);
      return base44.entities.User.delete(usuario.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios-gerenciar"] });
      setDialogExcluir(null);
    },
  });

  // ── Acesso negado ──────────────────────────────────────────────────────────

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

  // ── Dados computados ───────────────────────────────────────────────────────

  const getStatusEfetivo = (u) => u.status_acesso || (u.cadastro_completo ? "PENDENTE" : "PENDENTE");

  // Usuários sem status ATIVO (ainda não aprovados) — excluindo dev e admin/colaboradores
  const usuariosPendentes = usuarios.filter(u =>
    u.email?.toLowerCase() !== DEV_EMAIL &&
    u.role !== "admin" &&
    u.status_acesso !== "ATIVO" &&
    u.status_acesso !== "BLOQUEADO" &&
    u.status_acesso !== "INATIVO"
  );

  // Solicitações externas ainda PENDENTE na entidade SolicitacaoAcesso
  const solicPendentes = solicitacoes.filter(s => s.status === "PENDENTE");

  // Total unificado para o badge
  const totalPendentes = usuariosPendentes.length + solicPendentes.length;

  // Lista "Todos os Usuários" com filtros
  const usuariosExibidos = usuarios
    .filter(u => u.email?.toLowerCase() !== DEV_EMAIL)
    .filter(u => {
      const matchBusca = !busca ||
        u.full_name?.toLowerCase().includes(busca.toLowerCase()) ||
        u.email?.toLowerCase().includes(busca.toLowerCase()) ||
        u.cpf?.includes(busca);
      const statusEfetivo = getStatusEfetivo(u);
      const matchStatus   = filtroStatus === "todos" || statusEfetivo === filtroStatus;
      const matchPerfil   = filtroPerfil === "todos" || u.perfil === filtroPerfil;
      const matchEquipe   = filtroEquipe === "todos" || u.equipe === filtroEquipe;
      return matchBusca && matchStatus && matchPerfil && matchEquipe;
    });

  const contadores = {
    PENDENTE:  usuarios.filter(u => (u.status_acesso === "PENDENTE" || !u.status_acesso) && u.cadastro_completo).length,
    ATIVO:     usuarios.filter(u => u.status_acesso === "ATIVO").length,
    INATIVO:   usuarios.filter(u => u.status_acesso === "INATIVO").length,
    BLOQUEADO: usuarios.filter(u => u.status_acesso === "BLOQUEADO").length,
  };

  // ── Exportação ─────────────────────────────────────────────────────────────

  const getDadosExportacao = () => usuarios
    .filter(u => u.email?.toLowerCase() !== DEV_EMAIL)
    .map(u => ({
      "Nome":                u.full_name || u.nome_completo || "",
      "E-mail":              u.email || "",
      "CPF":                 u.cpf || "",
      "Perfil":              PERFIL_LABELS[u.perfil] || u.perfil || "",
      "Função":              FUNCAO_LABELS[u.funcao] || u.funcao || "",
      "Equipe":              u.equipe?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "",
      "Unidade de Saúde":    u.unidade_saude || "",
      "Registro":            u.registro_profissional_tipo && u.registro_profissional_numero
                               ? `${u.registro_profissional_tipo}: ${u.registro_profissional_numero}` : "",
      "Matrícula":           u.matricula || "",
      "Status":              STATUS_CONFIG[u.status_acesso]?.label || "Pendente",
      "Cadastro":            u.created_date ? new Date(u.created_date).toLocaleDateString("pt-BR") : "",
    }));

  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(getDadosExportacao());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Profissionais");
    XLSX.writeFile(wb, `profissionais_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.xlsx`);
  };

  const exportarPDF = () => {
    const dados = getDadosExportacao();
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14); doc.setTextColor(180, 30, 30);
    doc.text("Lista de Profissionais", 14, 16);
    doc.setFontSize(8); doc.setTextColor(100, 100, 100);
    doc.text(`Gerado: ${new Date().toLocaleString("pt-BR")} | Total: ${dados.length}`, 14, 23);
    const colunas   = ["Nome", "E-mail", "CPF", "Perfil", "Função", "Equipe", "Unidade", "Registro", "Status", "Cadastro"];
    const larguras  = [35, 45, 22, 28, 20, 22, 30, 22, 18, 18];
    let y = 30;
    doc.setFillColor(220, 38, 38); doc.setTextColor(255, 255, 255); doc.setFontSize(7);
    doc.rect(14, y, 269, 7, "F");
    let x = 14;
    colunas.forEach((c, i) => { doc.text(c, x + 1, y + 5); x += larguras[i]; });
    y += 7;
    doc.setTextColor(40, 40, 40);
    dados.forEach((row, idx) => {
      if (y > 185) { doc.addPage(); y = 15; }
      if (idx % 2 === 0) { doc.setFillColor(245, 245, 245); doc.rect(14, y, 269, 7, "F"); }
      const vals = [row["Nome"], row["E-mail"], row["CPF"], row["Perfil"], row["Função"],
                    row["Equipe"], row["Unidade de Saúde"], row["Registro"], row["Status"], row["Cadastro"]];
      x = 14;
      vals.forEach((v, i) => { doc.text(doc.splitTextToSize(String(v || ""), larguras[i] - 2)[0] || "", x + 1, y + 5); x += larguras[i]; });
      y += 7;
    });
    doc.save(`profissionais_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.pdf`);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-red-600" />
            Gerenciar Acessos
          </h1>
          <p className="text-gray-600 text-sm mt-1">Aprovação e controle de usuários do sistema</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => { refetch(); refetchSolic(); }} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportarExcel} className="gap-2 border-green-400 text-green-700 hover:bg-green-50">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportarPDF} className="gap-2 border-red-300 text-red-700 hover:bg-red-50">
            <FileText className="w-4 h-4" /> PDF
          </Button>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-0 mb-6 border-b border-gray-200">
        <button
          onClick={() => setAbaAtiva("pendentes")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${abaAtiva === "pendentes" ? "border-red-600 text-red-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          <Bell className="w-4 h-4" />
          Aguardando Aprovação
          {totalPendentes > 0 && (
            <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {totalPendentes}
            </span>
          )}
        </button>
        <button
          onClick={() => setAbaAtiva("usuarios")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${abaAtiva === "usuarios" ? "border-red-600 text-red-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          <Users className="w-4 h-4" />
          Todos os Usuários
          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
            {usuarios.filter(u => u.email?.toLowerCase() !== DEV_EMAIL).length}
          </span>
        </button>
      </div>

      {/* ── ABA: AGUARDANDO APROVAÇÃO ───────────────────────────────────── */}
      {abaAtiva === "pendentes" && (
        <div className="space-y-6">

          {/* Bloco 1: Usuários cadastrados via GOV.BR aguardando aprovação */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Usuários cadastrados via GOV.BR — aguardando aprovação
              <span className="bg-yellow-100 text-yellow-800 border border-yellow-300 text-xs px-2 py-0.5 rounded-full font-bold">
                {usuariosPendentes.length}
              </span>
            </h2>

            {usuariosPendentes.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  <p className="text-sm">Nenhum usuário aguardando aprovação.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {usuariosPendentes.map(u => (
                  <Card key={u.id} className="border border-yellow-300 bg-yellow-50">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">{u.full_name || u.nome_completo || "(Sem nome)"}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-yellow-100 text-yellow-800 border-yellow-300">
                              {u.cadastro_completo ? "Cadastro completo" : "Sem cadastro completo"}
                            </span>
                            {u.perfil && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                {PERFIL_LABELS[u.perfil] || u.perfil}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                            <span>{u.email}</span>
                            {u.cpf && <span>CPF: {u.cpf}</span>}
                            {u.funcao && <span>Função: {FUNCAO_LABELS[u.funcao] || u.funcao}</span>}
                            {u.registro_profissional_tipo && u.registro_profissional_numero && (
                              <span>{u.registro_profissional_tipo}: {u.registro_profissional_numero}</span>
                            )}
                            {u.telefone && <span>Tel: {u.telefone}</span>}
                            {u.unidade_saude && <span>Unidade: {u.unidade_saude}</span>}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Cadastro em: {u.created_date ? new Date(u.created_date).toLocaleString("pt-BR") : "—"}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white gap-1"
                            onClick={() => updateStatusMutation.mutate({ userId: u.id, status: "ATIVO", usuarioAlvo: u })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle2 className="w-4 h-4" /> Aprovar
                          </Button>
                          <Button
                            size="sm" variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-50 gap-1"
                            onClick={() => updateStatusMutation.mutate({ userId: u.id, status: "BLOQUEADO", usuarioAlvo: u })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <XCircle className="w-4 h-4" /> Recusar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Bloco 2: Solicitações externas (entidade SolicitacaoAcesso) */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Solicitações de acesso externas
              <span className="bg-orange-100 text-orange-800 border border-orange-300 text-xs px-2 py-0.5 rounded-full font-bold">
                {solicPendentes.length}
              </span>
            </h2>

            {solicPendentes.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  <p className="text-sm">Nenhuma solicitação externa pendente.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {solicPendentes.map(sol => (
                  <Card key={sol.id} className="border border-orange-300 bg-orange-50">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">{sol.nome_completo}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-orange-100 text-orange-800 border-orange-300">
                              Solicitação Externa
                            </span>
                            {sol.perfil && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                {PERFIL_LABELS[sol.perfil] || sol.perfil}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                            <span>{sol.email}</span>
                            {sol.cpf && <span>CPF: {sol.cpf}</span>}
                            {sol.funcao && <span>Função: {FUNCAO_LABELS[sol.funcao] || sol.funcao}</span>}
                            {sol.registro_profissional_tipo && sol.registro_profissional_numero && (
                              <span>{sol.registro_profissional_tipo}: {sol.registro_profissional_numero}</span>
                            )}
                            {sol.telefone && <span>Tel: {sol.telefone}</span>}
                            {sol.unidade_saude && <span>Unidade: {sol.unidade_saude}</span>}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Solicitado em: {sol.created_date ? new Date(sol.created_date).toLocaleString("pt-BR") : "—"}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white gap-1"
                            onClick={() => processarSolicMutation.mutate({ sol, acao: "aprovar" })}
                            disabled={processarSolicMutation.isPending}
                          >
                            <CheckCircle2 className="w-4 h-4" /> Aprovar & Convidar
                          </Button>
                          <Button
                            size="sm" variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-50 gap-1"
                            onClick={() => processarSolicMutation.mutate({ sol, acao: "rejeitar" })}
                            disabled={processarSolicMutation.isPending}
                          >
                            <XCircle className="w-4 h-4" /> Rejeitar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ABA: TODOS OS USUÁRIOS ──────────────────────────────────────── */}
      {abaAtiva === "usuarios" && (
        <>
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
                  <Input placeholder="Buscar por nome, e-mail ou CPF..." value={busca}
                    onChange={e => setBusca(e.target.value)} className="pl-9" />
                </div>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="INATIVO">Inativo</SelectItem>
                    <SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filtroEquipe} onValueChange={setFiltroEquipe}>
                  <SelectTrigger className="w-full md:w-52"><SelectValue placeholder="Equipe / Setor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Setores</SelectItem>
                    <SelectItem value="unidade_saude">🏥 Unidade de Saúde</SelectItem>
                    <SelectItem value="cerh">CERH</SelectItem>
                    <SelectItem value="asscardio">ASSCARDIO</SelectItem>
                    <SelectItem value="transporte">Transporte</SelectItem>
                    <SelectItem value="hemodinamica">Hemodinâmica</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filtroPerfil} onValueChange={setFiltroPerfil}>
                  <SelectTrigger className="w-full md:w-52"><SelectValue placeholder="Perfil" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Perfis</SelectItem>
                    <SelectGroup>
                      <SelectLabel className="text-xs text-gray-500 font-semibold uppercase tracking-wide px-2 py-1">Perfis Base</SelectLabel>
                      <SelectItem value="UNIDADE_SAUDE">Unidade de Saúde</SelectItem>
                      <SelectItem value="CERH">CERH</SelectItem>
                      <SelectItem value="ASSCARDIO">ASSCARDIO</SelectItem>
                      <SelectItem value="TRANSPORTE">Transporte</SelectItem>
                      <SelectItem value="HEMODINAMICA">Hemodinâmica</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-xs text-gray-500 font-semibold uppercase tracking-wide px-2 py-1">Administradores</SelectLabel>
                      <SelectItem value="ADMINISTRADOR_MANAGER">ADM Manager</SelectItem>
                      <SelectItem value="ADMINISTRADOR_CERH">ADM CERH</SelectItem>
                      <SelectItem value="ADMINISTRADOR_CARDIOLOGIA">ADM Cardiologia</SelectItem>
                      <SelectItem value="ADMINISTRADOR_TRANSPORTE">ADM Transporte</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Lista */}
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
              {usuariosExibidos.map(usuario => {
                const statusAtual = getStatusEfetivo(usuario);
                const cfg = STATUS_CONFIG[statusAtual] || STATUS_CONFIG["PENDENTE"];
                const logsUsuario = logsAuditoria.filter(l => l.entidade_id === usuario.id);
                const expandido = historicoExpandido[usuario.id];

                return (
                  <Card key={usuario.id} className="border hover:shadow-md transition-shadow">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">{usuario.full_name || usuario.nome_completo || "(Sem nome)"}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>{cfg.label}</span>
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
                          <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-4 border-t border-gray-100 pt-1">
                            {usuario.equipe && (
                              <span className="font-medium text-blue-700">
                                Equipe: {usuario.equipe.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                              </span>
                            )}
                            {usuario.unidade_saude && <span>Unidade: <strong>{usuario.unidade_saude}</strong></span>}
                            {usuario.created_date && (
                              <span className="text-gray-400">Cadastro: {new Date(usuario.created_date).toLocaleDateString("pt-BR")}</span>
                            )}
                          </div>
                          {usuario.motivo_bloqueio && (
                            <p className="text-xs text-red-600 mt-1">Motivo: {usuario.motivo_bloqueio}</p>
                          )}
                          {logsUsuario.length > 0 && (
                            <div className="mt-2">
                              <button
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                onClick={() => setHistoricoExpandido(prev => ({ ...prev, [usuario.id]: !prev[usuario.id] }))}
                              >
                                <History className="w-3 h-3" />
                                {logsUsuario.length} registro(s)
                                {expandido ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                              {expandido && (
                                <div className="mt-2 space-y-1 border-l-2 border-blue-200 pl-3">
                                  {logsUsuario.map(log => (
                                    <div key={log.id} className="text-xs text-gray-600">
                                      <span className="text-gray-400">{new Date(log.created_date).toLocaleString("pt-BR")}</span>
                                      {" · "}<span className="font-medium text-gray-700">{log.usuario_nome || log.usuario_email}</span>
                                      {" · "}<span>{log.descricao}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 flex-wrap shrink-0">
                          {!podeGerenciarUsuario(usuario) ? (
                            <span className="text-xs text-gray-400 italic px-2 py-1">Apenas o desenvolvedor pode gerenciar</span>
                          ) : (
                            <>
                              {statusAtual !== "ATIVO" && (
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1"
                                  onClick={() => updateStatusMutation.mutate({ userId: usuario.id, status: "ATIVO", usuarioAlvo: usuario })}
                                  disabled={updateStatusMutation.isPending}>
                                  <CheckCircle2 className="w-4 h-4" /> Ativar
                                </Button>
                              )}
                              {statusAtual !== "INATIVO" && (
                                <Button size="sm" variant="outline" className="border-gray-400 text-gray-700 gap-1"
                                  onClick={() => updateStatusMutation.mutate({ userId: usuario.id, status: "INATIVO", usuarioAlvo: usuario })}
                                  disabled={updateStatusMutation.isPending}>
                                  <XCircle className="w-4 h-4" /> Desativar
                                </Button>
                              )}
                              {statusAtual !== "BLOQUEADO" && (
                                <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50 gap-1"
                                  onClick={() => { setDialogBloqueio(usuario); setMotivoBloqueio(""); }}
                                  disabled={updateStatusMutation.isPending}>
                                  <Lock className="w-4 h-4" /> Bloquear
                                </Button>
                              )}
                              <Button size="sm" variant="outline" className="border-red-600 text-red-700 hover:bg-red-100 gap-1"
                                onClick={() => setDialogExcluir(usuario)} disabled={deleteMutation.isPending}>
                                <Trash2 className="w-4 h-4" /> Excluir
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
        </>
      )}

      {/* Dialog Excluir */}
      <Dialog open={!!dialogExcluir} onOpenChange={() => setDialogExcluir(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Excluir Usuário
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-700">
            Tem certeza que deseja excluir permanentemente{" "}
            <strong>{dialogExcluir?.full_name || dialogExcluir?.email}</strong>?{" "}
            Esta ação <strong>não pode ser desfeita</strong>.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogExcluir(null)}>Cancelar</Button>
            <Button className="bg-red-700 hover:bg-red-800 text-white"
              onClick={() => deleteMutation.mutate(dialogExcluir)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Excluindo..." : "Confirmar Exclusão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Bloquear */}
      <Dialog open={!!dialogBloqueio} onOpenChange={() => setDialogBloqueio(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700">Bloquear Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Bloquear acesso de <strong>{dialogBloqueio?.full_name || dialogBloqueio?.email}</strong>.
            </p>
            <div>
              <Label htmlFor="motivo">Motivo (opcional)</Label>
              <Input id="motivo" className="mt-1" placeholder="Descreva o motivo..."
                value={motivoBloqueio} onChange={e => setMotivoBloqueio(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogBloqueio(null)}>Cancelar</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => updateStatusMutation.mutate({
                userId: dialogBloqueio.id, status: "BLOQUEADO",
                motivo: motivoBloqueio, usuarioAlvo: dialogBloqueio,
              })} disabled={updateStatusMutation.isPending}>
              Confirmar Bloqueio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}