import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Activity, Mail, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";

export default function RecuperarPIN() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [novoPIN, setNovoPIN] = useState("");
  const [confirmPIN, setConfirmPIN] = useState("");
  const [codigoEnviado, setCodigoEnviado] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEnviarCodigo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await base44.auth.me();
      
      if (user.email !== email) {
        setError("Email não corresponde ao usuário logado");
        setLoading(false);
        return;
      }

      // Gerar código de 6 dígitos
      const codigoGerado = Math.floor(100000 + Math.random() * 900000).toString();
      setCodigoEnviado(codigoGerado);

      // Enviar email com código
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: "Código de Recuperação de PIN - Triagem Dor Torácica",
        body: `
Olá ${user.full_name},

Você solicitou a recuperação do seu PIN de acesso.

Seu código de verificação é: ${codigoGerado}

Este código é válido por 10 minutos.

Se você não solicitou esta recuperação, ignore este email.

---
Sistema de Triagem de Dor Torácica
        `
      });

      setStep(2);
    } catch (err) {
      setError("Erro ao enviar código. Tente novamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificarCodigo = (e) => {
    e.preventDefault();
    
    if (codigo === codigoEnviado) {
      setStep(3);
      setError("");
    } else {
      setError("Código incorreto. Verifique e tente novamente.");
    }
  };

  const handleRedefinirPIN = async (e) => {
    e.preventDefault();
    
    if (novoPIN.length !== 4) {
      setError("O PIN deve ter 4 dígitos");
      return;
    }

    if (novoPIN !== confirmPIN) {
      setError("Os PINs não coincidem");
      return;
    }

    setLoading(true);
    
    try {
      await base44.auth.updateMe({ pin: novoPIN });
      setStep(4);
    } catch (err) {
      setError("Erro ao redefinir PIN. Tente novamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
              <Activity className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Recuperar PIN
          </h1>

          {step === 1 && (
            <>
              <p className="text-center text-gray-600 mb-8">
                Enviaremos um código de verificação para seu email
              </p>

              <form onSubmit={handleEnviarCodigo} className="space-y-6">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={loading}
                >
                  {loading ? "Enviando..." : "Enviar Código"}
                </Button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-center text-gray-600 mb-8">
                Digite o código de 6 dígitos enviado para {email}
              </p>

              <form onSubmit={handleVerificarCodigo} className="space-y-6">
                <Input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                  autoFocus
                />

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={codigo.length !== 6}
                >
                  Verificar Código
                </Button>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-center text-gray-600 mb-8">
                Crie seu novo PIN de 4 dígitos
              </p>

              <form onSubmit={handleRedefinirPIN} className="space-y-6">
                <div className="space-y-4">
                  <Input
                    type="password"
                    value={novoPIN}
                    onChange={(e) => setNovoPIN(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="Novo PIN (4 dígitos)"
                    className="text-center text-xl tracking-widest"
                    maxLength={4}
                    autoFocus
                  />
                  <Input
                    type="password"
                    value={confirmPIN}
                    onChange={(e) => setConfirmPIN(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="Confirme o PIN"
                    className="text-center text-xl tracking-widest"
                    maxLength={4}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={novoPIN.length !== 4 || confirmPIN.length !== 4 || loading}
                >
                  {loading ? "Salvando..." : "Redefinir PIN"}
                </Button>
              </form>
            </>
          )}

          {step === 4 && (
            <>
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  PIN Redefinido com Sucesso!
                </h2>
                <p className="text-gray-600 mb-6">
                  Seu PIN foi alterado. Use o novo PIN para acessar o sistema.
                </p>
                <Button
                  onClick={() => navigate(createPageUrl("PINLogin"))}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Fazer Login
                </Button>
              </div>
            </>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate(createPageUrl("PINLogin"))}
              className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}