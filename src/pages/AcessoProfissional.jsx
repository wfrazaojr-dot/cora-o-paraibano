import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Activity, Lock, AlertCircle } from "lucide-react";

export default function AcessoProfissional() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setPin(value);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (pin.length !== 4) {
      setError("Digite um PIN de 4 dígitos");
      return;
    }

    setLoading(true);
    
    try {
      // Buscar profissional pelo PIN
      const profissionais = await base44.entities.Profissional.filter({ pin: pin, ativo: true });
      
      if (profissionais.length === 0) {
        setError("PIN incorreto ou profissional inativo");
        setPin("");
        setLoading(false);
        return;
      }

      const profissional = profissionais[0];

      // Salvar na sessão
      sessionStorage.setItem("profissional_logado", JSON.stringify(profissional));

      // Redirecionar
      const nextUrl = sessionStorage.getItem("redirect_after_pin");
      sessionStorage.removeItem("redirect_after_pin");
      window.location.href = nextUrl || "/Dashboard";
      
    } catch (err) {
      setError("Erro ao verificar PIN. Tente novamente.");
      console.error(err);
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
            Coração Paraibano
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Digite seu PIN de 4 dígitos
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="password"
                  value={pin}
                  onChange={handlePinChange}
                  placeholder="••••"
                  className="pl-10 text-center text-2xl tracking-widest h-14 font-bold"
                  maxLength={4}
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 text-center">
                {pin.length}/4 dígitos
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-lg"
              disabled={pin.length !== 4 || loading}
            >
              {loading ? "Verificando..." : "Acessar"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/CadastroProfissional")}
                className="text-sm text-red-600 hover:text-red-700 hover:underline"
              >
                Primeiro acesso? Cadastre-se aqui
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              Sistema de acesso seguro por PIN
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}