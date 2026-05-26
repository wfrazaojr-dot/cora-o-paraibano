import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, ClipboardList } from "lucide-react";

const PERFIS_OPCOES = [
  { value: "UNIDADE_SAUDE", label: "Unidade de Saúde" },
  { value: "CERH", label: "CERH - Central Estadual de Regulação em Hemodinâmica" },
  { value: "ASSCARDIO", label: "ASSCARDIO - Assessoria Cardiológica" },
  { value: "TRANSPORTE", label: "Transporte" },
  { value: "HEMODINAMICA", label: "Hemodinâmica" },
  { value: "ADMINISTRADOR_MANAGER", label: "Administrador Manager" },
  { value: "ADMINISTRADOR_CERH", label: "Administrador CERH" },
  { value: "ADMINISTRADOR_CARDIOLOGIA", label: "Administrador Cardiologia" },
  { value: "ADMINISTRADOR_TRANSPORTE", label: "Administrador Transporte" },
];

const FUNCOES_POR_PERFIL = {
  UNIDADE_SAUDE: ["medico", "enfermeiro", "assistente_social", "administrativo"],
  CERH: ["medico", "enfermeiro"],
  ASSCARDIO: ["medico", "enfermeiro"],
  TRANSPORTE: ["operador_frota", "enfermeiro", "medico"],
  HEMODINAMICA: ["medico", "enfermeiro"],
  ADMINISTRADOR_MANAGER: ["administrativo"],
  ADMINISTRADOR_CERH: ["medico", "enfermeiro"],
  ADMINISTRADOR_CARDIOLOGIA: ["medico"],
  ADMINISTRADOR_TRANSPORTE: ["operador_frota", "administrativo"],
};

const FUNCAO_LABELS = {
  medico: "Médico",
  enfermeiro: "Enfermeiro",
  assistente_social: "Assistente Social",
  operador_frota: "Operador de Frota",
  administrativo: "Administrativo",
};

function formatCPF(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export default function CadastroPerfil() {
  const navigate = useNavigate();
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [form, setForm] = useState({
    perfil: "",
    nome_completo: "",
    email: "",
    cpf: "",
    funcao: "",
    registro_tipo: "",
    registro_numero: "",
    matricula: "",
    telefone: "",
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  // Pré-preencher e-mail com o do GOV.BR
  useEffect(() => {
    if (user?.email && !form.email) {
      setForm(prev => ({ ...prev, email: user.email, nome_completo: prev.nome_completo || user.full_name || "" }));
    }
  }, [user]);

  // Redirecionar para login se não autenticado
  useEffect(() => {
    if (!isLoading && !user) {
      base44.auth.redirectToLogin(window.location.href);
    }
    // Se já tem cadastro completo, redirecionar para o painel
    if (!isLoading && user?.cadastro_completo) {
      navigate("/", { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading || !user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const funcoesDoPerfil = form.perfil ? FUNCOES_POR_PERFIL[form.perfil] || [] : [];
  const precisaRegistro = ["medico", "enfermeiro", "assistente_social"].includes(form.funcao);
  const precisaMatricula = ["operador_frota", "administrativo"].includes(form.funcao);

  const registroTipoPorFuncao = {
    medico: "CRM",
    enfermeiro: "COREN",
    assistente_social: "CRESS",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    if (!form.perfil || !form.nome_completo || !form.email || !form.cpf || !form.funcao) {
      setErro("Preencha todos os campos obrigatórios, incluindo o e-mail.");
      return;
    }
    if (precisaRegistro && (!form.registro_numero)) {
      setErro("Informe o número do registro profissional.");
      return;
    }
    if (precisaMatricula && !form.matricula) {
      setErro("Informe a matrícula.");
      return;
    }

    setLoading(true);

    // Determinar role com base no perfil
    let roleMap = {
      UNIDADE_SAUDE: "UNIDADE_SAUDE",
      CERH: "CERH",
      ASSCARDIO: "ASSCARDIO",
      TRANSPORTE: "TRANSPORTE",
      HEMODINAMICA: "HEMODINAMICA",
      ADMINISTRADOR_MANAGER: "ADMINISTRADOR_MANAGER",
      ADMINISTRADOR_CERH: "ADMINISTRADOR_CERH",
      ADMINISTRADOR_CARDIOLOGIA: "ADMINISTRADOR_CARDIOLOGIA",
      ADMINISTRADOR_TRANSPORTE: "ADMINISTRADOR_TRANSPORTE",
    };

    const equipeMap = {
      UNIDADE_SAUDE: "unidade_saude",
      CERH: "cerh",
      ASSCARDIO: "asscardio",
      TRANSPORTE: "transporte",
      HEMODINAMICA: "hemodinamica",
      ADMINISTRADOR_MANAGER: "admin",
      ADMINISTRADOR_CERH: "cerh",
      ADMINISTRADOR_CARDIOLOGIA: "asscardio",
      ADMINISTRADOR_TRANSPORTE: "transporte",
    };

    await base44.auth.updateMe({
      nome_completo: form.nome_completo,
      email_cadastro: form.email,
      cpf: form.cpf,
      telefone: form.telefone || null,
      perfil: form.perfil,
      funcao: form.funcao,
      equipe: equipeMap[form.perfil] || "unidade_saude",
      registro_profissional_tipo: precisaRegistro ? registroTipoPorFuncao[form.funcao] : null,
      registro_profissional_numero: precisaRegistro ? form.registro_numero : null,
      matricula: precisaMatricula ? form.matricula : null,
      status_acesso: "PENDENTE",
      cadastro_completo: true,
    });

    sessionStorage.setItem("perfil_selecionado_sessao", form.perfil);
    setLoading(false);
    navigate("/AcessoPendente");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl shadow-xl">
        <CardHeader className="text-center border-b pb-6">
          <div className="flex justify-center mb-3">
            <div className="bg-red-600 p-3 rounded-full">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-gray-900">Cadastro Complementar</CardTitle>



          <CardDescription className="text-gray-600 mt-3">
            Preencha seus dados para solicitar acesso ao sistema.<br />
            Após o envio, aguarde a aprovação do Administrador Manager.<br />
            <span className="text-blue-700 font-medium">Você receberá um e-mail assim que seu acesso for liberado.</span>
          </CardDescription>
          {user && (
            <div className="mt-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
              <User className="inline w-4 h-4 mr-1" />
              Autenticado via GOV.BR: <strong>{user.email}</strong>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Perfil */}
            <div>
              <Label>Perfil *</Label>
              <Select value={form.perfil} onValueChange={(v) => setForm({ ...form, perfil: v, funcao: "" })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione seu perfil de acesso" />
                </SelectTrigger>
                <SelectContent>
                  {PERFIS_OPCOES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nome Completo */}
            <div>
              <Label>Nome Completo *</Label>
              <Input
                className="mt-1"
                placeholder="Digite seu nome completo"
                value={form.nome_completo}
                onChange={(e) => setForm({ ...form, nome_completo: e.target.value })}
              />
            </div>

            {/* E-mail */}
            <div>
              <Label>E-mail de Contato *</Label>
              <Input
                className="mt-1"
                type="email"
                placeholder="seu@email.gov.br"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Este e-mail será usado para notificá-lo quando seu acesso for aprovado.
              </p>
            </div>

            {/* CPF */}
            <div>
              <Label>CPF *</Label>
              <Input
                className="mt-1"
                placeholder="123.456.789-00"
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: formatCPF(e.target.value) })}
                maxLength={14}
              />
            </div>

            {/* Telefone */}
            <div>
              <Label>Telefone / WhatsApp</Label>
              <Input
                className="mt-1"
                placeholder="(83) 9 9999-9999"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              />
            </div>

            {/* Função */}
            {form.perfil && (
              <div>
                <Label>Função *</Label>
                <Select value={form.funcao} onValueChange={(v) => setForm({ ...form, funcao: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione sua função" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcoesDoPerfil.map(f => (
                      <SelectItem key={f} value={f}>{FUNCAO_LABELS[f]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Registro Profissional */}
            {precisaRegistro && (
              <div>
                <Label>{registroTipoPorFuncao[form.funcao]} *</Label>
                <Input
                  className="mt-1"
                  placeholder={`Número do ${registroTipoPorFuncao[form.funcao]}`}
                  value={form.registro_numero}
                  onChange={(e) => setForm({ ...form, registro_numero: e.target.value })}
                />
              </div>
            )}

            {/* Matrícula */}
            {precisaMatricula && (
              <div>
                <Label>Matrícula *</Label>
                <Input
                  className="mt-1"
                  placeholder="Número da matrícula"
                  value={form.matricula}
                  onChange={(e) => setForm({ ...form, matricula: e.target.value })}
                />
              </div>
            )}

            {erro && (
              <p className="text-sm text-red-600 bg-red-50 rounded p-3">{erro}</p>
            )}

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
              {loading ? "Enviando..." : "Enviar Solicitação de Acesso"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}