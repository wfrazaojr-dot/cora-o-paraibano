import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Activity, User, Mail, Lock, Stethoscope } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CadastroProfissional() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dados, setDados] = useState({
    nome: "",
    registro: "",
    tipo: "",
    email: "",
    pin: "",
    confirmarPin: ""
  });

  const handleChange = (field, value) => {
    setDados(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const handlePinChange = (field, value) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 4);
    setDados(prev => ({ ...prev, [field]: numericValue }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!dados.nome || !dados.registro || !dados.tipo || !dados.email || !dados.pin) {
      setError("Preencha todos os campos");
      return;
    }

    if (dados.pin.length !== 4) {
      setError("PIN deve ter 4 dígitos");
      return;
    }

    if (dados.pin !== dados.confirmarPin) {
      setError("PINs não conferem");
      return;
    }

    setLoading(true);
    
    try {
      // Verificar se já existe profissional com este PIN
      const profissionaisExistentes = await base44.entities.Profissional.filter({ pin: dados.pin });
      if (profissionaisExistentes.length > 0) {
        setError("Este PIN já está em uso. Escolha outro.");
        setLoading(false);
        return;
      }

      // Criar profissional
      const profissional = await base44.entities.Profissional.create({
        nome: dados.nome,
        registro: dados.registro,
        tipo: dados.tipo,
        email: dados.email,
        pin: dados.pin,
        ativo: true
      });

      // Enviar email de confirmação
      await base44.integrations.Core.SendEmail({
        to: dados.email,
        subject: "Cadastro Confirmado - Sistema de Triagem",
        body: `Olá ${dados.nome},\n\nSeu cadastro foi realizado com sucesso!\n\nDados de acesso:\nNome: ${dados.nome}\nRegistro: ${dados.registro}\nTipo: ${dados.tipo}\nPIN: ${dados.pin}\n\nGuarde seu PIN em local seguro.\n\nPrograma Coração Paraibano`
      });

      // Salvar na sessão
      sessionStorage.setItem("profissional_logado", JSON.stringify(profissional));

      // Redirecionar
      const nextUrl = sessionStorage.getItem("redirect_after_pin");
      sessionStorage.removeItem("redirect_after_pin");
      window.location.href = nextUrl || "/Dashboard";
      
    } catch (err) {
      setError("Erro ao cadastrar. Tente novamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Primeiro Acesso
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Cadastre seus dados para acessar o sistema
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    value={dados.nome}
                    onChange={(e) => handleChange("nome", e.target.value)}
                    placeholder="Digite seu nome completo"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Registro (CRM/COREN) *
                  </label>
                  <div className="relative">
                    <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      value={dados.registro}
                      onChange={(e) => handleChange("registro", e.target.value)}
                      placeholder="Ex: 12345"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Tipo de Profissional *
                  </label>
                  <Select
                    value={dados.tipo}
                    onValueChange={(value) => handleChange("tipo", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Médico">Médico</SelectItem>
                      <SelectItem value="Enfermeiro">Enfermeiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="email"
                    value={dados.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="seu@email.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    PIN de 4 dígitos *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="password"
                      value={dados.pin}
                      onChange={(e) => handlePinChange("pin", e.target.value)}
                      placeholder="••••"
                      className="pl-10 text-center text-2xl tracking-widest"
                      maxLength={4}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{dados.pin.length}/4 dígitos</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Confirmar PIN *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="password"
                      value={dados.confirmarPin}
                      onChange={(e) => handlePinChange("confirmarPin", e.target.value)}
                      placeholder="••••"
                      className="pl-10 text-center text-2xl tracking-widest"
                      maxLength={4}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{dados.confirmarPin.length}/4 dígitos</p>
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg"
              disabled={loading}
            >
              {loading ? "Cadastrando..." : "Cadastrar e Acessar"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/LoginProfissional")}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Já possuo cadastro
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}