import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Activity, Lock, AlertCircle } from "lucide-react";

export default function PINLogin() {
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
      const user = await base44.auth.me();
      
      if (!user.pin) {
        // Primeiro acesso - define o PIN
        await base44.auth.updateMe({ 
          pin: pin,
          ultimo_acesso: new Date().toISOString()
        });
        localStorage.setItem("pin_verified", user.email);
        navigate(createPageUrl("Dashboard"));
      } else if (user.pin === pin) {
        // PIN correto
        await base44.auth.updateMe({ 
          ultimo_acesso: new Date().toISOString()
        });
        localStorage.setItem("pin_verified", user.email);
        navigate(createPageUrl("Dashboard"));
      } else {
        // PIN incorreto
        setError("PIN incorreto. Tente novamente.");
        setPin("");
      }
    } catch (err) {
      setError("Erro ao verificar PIN. Tente novamente.");
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
            Triagem Dor Torácica
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
                {pin.length === 0 ? "Primeiro acesso? Crie seu PIN de 4 dígitos" : `${pin.length}/4 dígitos`}
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
                onClick={() => navigate(createPageUrl("RecuperarPIN"))}
                className="text-sm text-red-600 hover:text-red-700 hover:underline"
              >
                Esqueci meu PIN
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