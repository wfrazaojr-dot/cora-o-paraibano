import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, ClipboardList, CheckCircle2, Download } from "lucide-react";
import { jsPDF } from "jspdf";

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

const REGISTRO_TIPO_MAP = {
  medico: "CRM",
  enfermeiro: "COREN",
  assistente_social: "CRESS",
};

const EQUIPE_MAP = {
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

function formatCPF(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

// Função para gerar PDF com os dados do cadastro
function gerarPDFCadastro(form, emailExibido, precisaRegistro, precisaMatricula) {
  const doc = new jsPDF();
  
  // Configuração básica
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPosition = 20;
  
  // Título
  doc.setFontSize(18);
  doc.setTextColor(220, 38, 38); // Vermelho (vermelho da marca)
  doc.text("CARDIOPB", margin, yPosition);
  
  // Subtítulo
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Solicitação de Acesso ao Sistema", margin, yPosition + 10);
  
  // Data e hora
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const now = new Date().toLocaleString('pt-BR');
  doc.text(`Gerado em: ${now}`, margin, yPosition + 18);
  
  yPosition += 30;
  
  // Linha separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;
  
  // Dados do usuário
  const dados = [
    { label: "Nome Completo", valor: form.nome_completo },
    { label: "CPF", valor: form.cpf },
    { label: "E-mail", valor: emailExibido },
    { label: "Telefone", valor: form.telefone || "—" },
    { label: "Perfil", valor: PERFIS_OPCOES.find(p => p.value === form.perfil)?.label || form.perfil },
    { label: "Função", valor: FUNCAO_LABELS[form.funcao] || form.funcao },
  ];
  
  if (form.perfil === "UNIDADE_SAUDE" && form.unidade_saude) {
    dados.push({ label: "Unidade de Saúde", valor: form.unidade_saude });
  }
  
  if (precisaRegistro && form.registro_numero) {
    dados.push({ label: REGISTRO_TIPO_MAP[form.funcao], valor: form.registro_numero });
  }
  
  if (precisaMatricula && form.matricula) {
    dados.push({ label: "Matrícula", valor: form.matricula });
  }
  
  doc.setFontSize(10);
  dados.forEach((item) => {
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, "bold");
    doc.text(`${item.label}:`, margin, yPosition);
    
    doc.setTextColor(50, 50, 50);
    doc.setFont(undefined, "normal");
    doc.text(item.valor, margin + 50, yPosition);
    
    yPosition += 7;
  });
  
  yPosition += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;
  
  // Rodapé
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("Este documento foi gerado automaticamente pelo Sistema CARDIOPB.", margin, yPosition);
  doc.text("Mantenha este arquivo para controle pessoal. A aprovação será enviada via e-mail.", margin, yPosition + 5);
  
  // Salvar PDF
  const fileName = `Cadastro_${form.nome_completo.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
  doc.save(fileName);
}

/**
 * CadastroPerfil — formulário de cadastro para novas solicitações.
 * Salva os dados na entidade SolicitacaoAcesso e notifica administradores.
 */
export default function CadastroPerfil() {
  // ✅ Todos os campos iniciam vazios - sem pré-preenchimento
  const [form, setForm] = useState({
    perfil: "",
    nome_completo: "",
    email: "",
    cpf: "",
    funcao: "",
    registro_numero: "",
    matricula: "",
    telefone: "",
    unidade_saude: "",
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [etapa, setEtapa] = useState("FORMULARIO"); // FORMULARIO | REVISAO | SUCESSO
  const [dadosSalvos, setDadosSalvos] = useState(null); // Preserva dados após envio bem-sucedido
  const [pdfExportado, setPdfExportado] = useState(false); // Controla se o PDF foi exportado



  const funcoesDoPerfil = form.perfil ? FUNCOES_POR_PERFIL[form.perfil] || [] : [];
  const precisaRegistro = ["medico", "enfermeiro", "assistente_social"].includes(form.funcao);
  const precisaMatricula = ["operador_frota", "administrativo"].includes(form.funcao);
  const emailExibido = form.email;

  const handleSalvarCadastro = (e) => {
    e.preventDefault();
    setErro("");

    if (!form.perfil || !form.nome_completo || !form.cpf || !form.funcao) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }
    if (!emailExibido) {
      setErro("Informe seu e-mail.");
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

    setErro("");
    setEtapa("REVISAO");
  };

  const handleEnviarFormulario = async (e) => {
    e.preventDefault();
    setLoading(true);

    // ✅ GARANTIA ABSOLUTA: Salvar EXATAMENTE o que o usuário digitou
    const dadosParaSalvar = {
      email: emailExibido,
      nome_completo: form.nome_completo.trim(), // Valor digitado pelo usuário
      cpf: form.cpf.trim(),
      telefone: form.telefone?.trim() || null,
      perfil: form.perfil,
      funcao: form.funcao,
      registro_profissional_tipo: precisaRegistro ? REGISTRO_TIPO_MAP[form.funcao] : null,
      registro_profissional_numero: precisaRegistro ? form.registro_numero?.trim() : null,
      matricula: precisaMatricula ? form.matricula?.trim() : null,
      equipe: EQUIPE_MAP[form.perfil] || "unidade_saude",
      unidade_saude: form.unidade_saude?.trim() || null,
    };

    const response = await base44.functions.invoke("registrarSolicitacaoAcesso", dadosParaSalvar);
    setLoading(false);
    if (response?.data?.success) {
      // ✅ Preservar EXATAMENTE o que foi salvo
      setDadosSalvos({
        nome_completo: form.nome_completo,
        cpf: form.cpf,
        email: emailExibido,
        telefone: form.telefone,
        perfil: form.perfil,
        funcao: form.funcao,
        unidade_saude: form.unidade_saude,
        registro_numero: form.registro_numero,
        matricula: form.matricula,
      });
      setEtapa("SUCESSO");
    } else {
      setErro(response?.data?.error || "Erro ao registrar solicitação. Tente novamente.");
    }
  };

  // Tela de sucesso
  if (etapa === "SUCESSO" && dadosSalvos) {
    const registroOuMatriculaLabel = dadosSalvos.matricula ? "Matrícula" : (precisaRegistro ? REGISTRO_TIPO_MAP[dadosSalvos.funcao] : "");
    const registroOuMatriculaValor = dadosSalvos.matricula || dadosSalvos.registro_numero;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardContent className="pt-10 pb-10">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Cadastro em Análise</h2>
            <p className="text-gray-700 leading-relaxed text-center mb-6">
             Seu cadastro foi enviado com sucesso e está aguardando aprovação em até 72h do Administrador Manager da Secretaria de estado da saúde da PB. Mantenha ativo seu acesso pelo GOV.BR.
            </p>

            {/* Dados revisados e salvos */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Dados enviados e armazenados:
              </p>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Nome Completo:</span>
                  <span className="font-semibold text-gray-900">{dadosSalvos.nome_completo}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">CPF:</span>
                  <span className="text-gray-900">{dadosSalvos.cpf}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">E-mail:</span>
                  <span className="text-gray-900">{dadosSalvos.email}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Telefone:</span>
                  <span className="text-gray-900">{dadosSalvos.telefone || "—"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Perfil:</span>
                  <span className="text-gray-900">{PERFIS_OPCOES.find(p => p.value === dadosSalvos.perfil)?.label}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Função:</span>
                  <span className="font-semibold text-gray-900">{FUNCAO_LABELS[dadosSalvos.funcao] || dadosSalvos.funcao}</span>
                </div>
                {dadosSalvos.perfil === "UNIDADE_SAUDE" && dadosSalvos.unidade_saude && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">Unidade de Saúde:</span>
                    <span className="text-gray-900">{dadosSalvos.unidade_saude}</span>
                  </div>
                )}
                {registroOuMatriculaLabel && registroOuMatriculaValor && (
                  <div className="flex justify-between">
                    <span className="font-medium">{registroOuMatriculaLabel}:</span>
                    <span className="text-gray-900">{registroOuMatriculaValor}</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-gray-600 text-sm text-center">⏱ Aguarde até 72 horas para novo acesso.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de revisão
  if (etapa === "REVISAO") {
    const registroLabel = precisaRegistro ? REGISTRO_TIPO_MAP[form.funcao] : "Registro";
    const registroOuMatriculaLabel = precisaMatricula ? "Matrícula" : registroLabel;
    const registroOuMatriculaValor = precisaMatricula ? form.matricula : form.registro_numero;

    const handleExportarPDF = () => {
      gerarPDFCadastro(form, emailExibido, precisaRegistro, precisaMatricula);
      setPdfExportado(true);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-xl shadow-xl">
          <CardHeader className="text-center border-b pb-6">
            <div className="flex justify-center gap-4 mb-3">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/9ba212c7d_LOGOCARDIOPB.jpg"
                alt="CARDIOPB"
                className="h-12 w-auto object-contain"
              />
            </div>
            <div className="flex justify-center mb-2">
              <div className="bg-blue-600 p-3 rounded-full">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-gray-900">Confira seus Dados</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Verifique se todos os dados estão corretos antes de enviar.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="space-y-4 mb-6 bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between border-b pb-3">
                <span className="font-semibold text-gray-700">Nome Completo:</span>
                <span className="text-gray-900 font-medium">{form.nome_completo}</span>
              </div>
              <div className="flex justify-between border-b pb-3">
                <span className="font-semibold text-gray-700">CPF:</span>
                <span className="text-gray-900">{form.cpf}</span>
              </div>
              <div className="flex justify-between border-b pb-3">
                <span className="font-semibold text-gray-700">E-mail:</span>
                <span className="text-gray-900">{emailExibido}</span>
              </div>
              <div className="flex justify-between border-b pb-3">
                <span className="font-semibold text-gray-700">Telefone:</span>
                <span className="text-gray-900">{form.telefone || "Não informado"}</span>
              </div>
              <div className="flex justify-between border-b pb-3">
                <span className="font-semibold text-gray-700">Perfil:</span>
                <span className="text-gray-900">{PERFIS_OPCOES.find(p => p.value === form.perfil)?.label || form.perfil}</span>
              </div>
              <div className="flex justify-between border-b pb-3">
                <span className="font-semibold text-gray-700">Função:</span>
                <span className="text-gray-900 font-medium">{FUNCAO_LABELS[form.funcao] || form.funcao}</span>
              </div>
              {form.perfil === "UNIDADE_SAUDE" && (
                <div className="flex justify-between border-b pb-3">
                  <span className="font-semibold text-gray-700">Unidade de Saúde:</span>
                  <span className="text-gray-900">{form.unidade_saude || "Não informado"}</span>
                </div>
              )}
              {registroOuMatriculaLabel && (
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">{registroOuMatriculaLabel}:</span>
                  <span className="text-gray-900">{registroOuMatriculaValor || "Não informado"}</span>
                </div>
              )}
            </div>

            {pdfExportado && (
              <p className="text-sm text-green-600 bg-green-50 rounded p-3 mb-4 flex items-center gap-2">
                ✓ PDF salvo no seu desktop com sucesso!
              </p>
            )}

            {erro && (
              <p className="text-sm text-red-600 bg-red-50 rounded p-3 mb-4">{erro}</p>
            )}

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  onClick={() => setEtapa("FORMULARIO")}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  EDITAR
                </Button>
                <Button
                  onClick={handleExportarPDF}
                  variant="outline"
                  className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                  disabled={loading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  SALVAR E EXPORTAR PDF
                </Button>
              </div>
              <Button
                onClick={handleEnviarFormulario}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                disabled={loading}
              >
                {loading ? "Enviando..." : "ENVIAR FORMULÁRIO"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl shadow-xl">
        <CardHeader className="text-center border-b pb-6">
          <div className="flex justify-center gap-4 mb-3">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/9ba212c7d_LOGOCARDIOPB.jpg"
              alt="CARDIOPB"
              className="h-12 w-auto object-contain"
            />
          </div>
          <div className="flex justify-center mb-2">
            <div className="bg-red-600 p-3 rounded-full">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-gray-900">Solicitar Acesso</CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            Preencha seus dados para solicitar acesso ao Sistema CARDIOPB.<br />
            Após o envio, o Administrador Manager analisará seu pedido.<br />
            <span className="text-orange-600 font-medium">⏱ Aguarde até 72 horas para novo acesso.</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSalvarCadastro} className="space-y-4">
            <div>
              <Label>Nome Completo *</Label>
              <Input
                className="mt-1"
                placeholder="Digite seu nome completo"
                value={form.nome_completo}
                onChange={e => setForm({ ...form, nome_completo: e.target.value })}
              />
            </div>

            <div>
              <Label>E-mail *</Label>
              <Input
                className="mt-1"
                type="email"
                placeholder="seu.email@exemplo.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <Label>CPF *</Label>
              <Input
                className="mt-1"
                placeholder="123.456.789-00"
                maxLength={14}
                value={form.cpf}
                onChange={e => setForm({ ...form, cpf: formatCPF(e.target.value) })}
              />
            </div>

            <div>
              <Label>Telefone / WhatsApp</Label>
              <Input
                className="mt-1"
                placeholder="(83) 9 9999-9999"
                value={form.telefone}
                onChange={e => setForm({ ...form, telefone: e.target.value })}
              />
            </div>

            <div>
              <Label>Perfil de Acesso *</Label>
              <Select value={form.perfil} onValueChange={v => setForm({ ...form, perfil: v, funcao: "" })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione seu perfil" />
                </SelectTrigger>
                <SelectContent>
                  {PERFIS_OPCOES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.perfil && (
              <div>
                <Label>Função *</Label>
                <Select value={form.funcao} onValueChange={v => setForm({ ...form, funcao: v })}>
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

            {form.perfil === "UNIDADE_SAUDE" && (
              <div>
                <Label>Unidade de Saúde</Label>
                <Input
                  className="mt-1"
                  placeholder="Digite o nome de sua unidade de saúde"
                  value={form.unidade_saude}
                  onChange={e => setForm({ ...form, unidade_saude: e.target.value })}
                />
              </div>
            )}

            {precisaRegistro && (
              <div>
                <Label>{REGISTRO_TIPO_MAP[form.funcao]} *</Label>
                <Input
                  className="mt-1"
                  placeholder={`Número do ${REGISTRO_TIPO_MAP[form.funcao]}`}
                  value={form.registro_numero}
                  onChange={e => setForm({ ...form, registro_numero: e.target.value })}
                />
              </div>
            )}

            {precisaMatricula && (
              <div>
                <Label>Matrícula *</Label>
                <Input
                  className="mt-1"
                  placeholder="Número da matrícula"
                  value={form.matricula}
                  onChange={e => setForm({ ...form, matricula: e.target.value })}
                />
              </div>
            )}

            {erro && (
              <p className="text-sm text-red-600 bg-red-50 rounded p-3">{erro}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              disabled={loading}
            >
              SALVAR CADASTRO
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}