import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ClipboardList, CheckCircle2 } from "lucide-react";

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

const REGISTRO_TIPO = {
  medico: "CRM",
  enfermeiro: "COREN",
  assistente_social: "CRESS",
};

function formatCPF(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export default function SolicitarAcesso() {
  const [userEmail, setUserEmail] = useState("");
  const [form, setForm] = useState({
    nome_completo: "",
    cpf: "",
    telefone: "",
    perfil: "",
    funcao: "",
    registro_numero: "",
    matricula: "",
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  // Tentar obter e-mail do usuário autenticado pelo GOV.BR
  useEffect(() => {
    base44.auth.me()
      .then(u => { if (u?.email) setUserEmail(u.email); })
      .catch(() => {});
  }, []);

  const funcoesDoPerfil = form.perfil ? FUNCOES_POR_PERFIL[form.perfil] || [] : [];
  const precisaRegistro = ["medico", "enfermeiro", "assistente_social"].includes(form.funcao);
  const precisaMatricula = ["operador_frota", "administrativo"].includes(form.funcao);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    if (!form.nome_completo || !form.cpf || !form.perfil || !form.funcao) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }
    if (precisaRegistro && !form.registro_numero) {
      setErro("Informe o número do registro profissional.");
      return;
    }
    if (precisaMatricula && !form.matricula) {
      setErro("Informe a matrícula.");
      return;
    }
    if (!userEmail) {
      setErro("Não foi possível identificar seu e-mail. Faça login pelo GOV.BR novamente.");
      return;
    }

    setLoading(true);
    const response = await base44.functions.invoke("registrarSolicitacaoAcesso", {
      email: userEmail,
      nome_completo: form.nome_completo,
      cpf: form.cpf,
      telefone: form.telefone || null,
      perfil: form.perfil,
      funcao: form.funcao,
      registro_profissional_tipo: precisaRegistro ? REGISTRO_TIPO[form.funcao] : null,
      registro_profissional_numero: precisaRegistro ? form.registro_numero : null,
      matricula: precisaMatricula ? form.matricula : null,
    });

    setLoading(false);
    if (response?.data?.success) {
      setSucesso(true);
    } else {
      setErro(response?.data?.error || "Erro ao registrar solicitação. Tente novamente.");
    }
  };

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl text-center">
          <CardContent className="pt-10 pb-10 space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Solicitação Enviada!</h2>
            <p className="text-gray-600">
              Sua solicitação de acesso foi registrada com sucesso.<br />
              Você será notificado por e-mail quando aprovado.
            </p>
            <p className="text-sm text-blue-700 font-medium">{userEmail}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl shadow-xl">
        <CardHeader className="text-center border-b pb-6">
          <div className="flex justify-center gap-4 mb-4">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/fa5f3a17e_LOGOCORAAOPARAIBANO.png" alt="Coração Paraibano" className="h-12 w-auto object-contain" />
          </div>
          <div className="flex justify-center mb-2">
            <div className="bg-red-600 p-3 rounded-full">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-gray-900">Solicitar Acesso</CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            Preencha seus dados para solicitar acesso ao Sistema Coração Paraibano.<br />
            Após o envio, aguarde a aprovação do Administrador Manager.<br />
            <span className="text-blue-700 font-medium">Você receberá um e-mail quando seu acesso for liberado.</span>
          </CardDescription>
          {userEmail && (
            <div className="mt-3 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
              ✅ Autenticado via GOV.BR: <strong>{userEmail}</strong>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nome Completo *</Label>
              <Input className="mt-1" placeholder="Digite seu nome completo"
                value={form.nome_completo} onChange={e => setForm({ ...form, nome_completo: e.target.value })} />
            </div>

            <div>
              <Label>CPF *</Label>
              <Input className="mt-1" placeholder="123.456.789-00" maxLength={14}
                value={form.cpf} onChange={e => setForm({ ...form, cpf: formatCPF(e.target.value) })} />
            </div>

            <div>
              <Label>Telefone / WhatsApp</Label>
              <Input className="mt-1" placeholder="(83) 9 9999-9999"
                value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} />
            </div>

            <div>
              <Label>Perfil de Acesso *</Label>
              <Select value={form.perfil} onValueChange={v => setForm({ ...form, perfil: v, funcao: "" })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione seu perfil" /></SelectTrigger>
                <SelectContent>
                  {PERFIS_OPCOES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {form.perfil && (
              <div>
                <Label>Função *</Label>
                <Select value={form.funcao} onValueChange={v => setForm({ ...form, funcao: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione sua função" /></SelectTrigger>
                  <SelectContent>
                    {funcoesDoPerfil.map(f => <SelectItem key={f} value={f}>{FUNCAO_LABELS[f]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {precisaRegistro && (
              <div>
                <Label>{REGISTRO_TIPO[form.funcao]} *</Label>
                <Input className="mt-1" placeholder={`Número do ${REGISTRO_TIPO[form.funcao]}`}
                  value={form.registro_numero} onChange={e => setForm({ ...form, registro_numero: e.target.value })} />
              </div>
            )}

            {precisaMatricula && (
              <div>
                <Label>Matrícula *</Label>
                <Input className="mt-1" placeholder="Número da matrícula"
                  value={form.matricula} onChange={e => setForm({ ...form, matricula: e.target.value })} />
              </div>
            )}

            {erro && <p className="text-sm text-red-600 bg-red-50 rounded p-3">{erro}</p>}

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
              {loading ? "Enviando..." : "Enviar Solicitação de Acesso"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}