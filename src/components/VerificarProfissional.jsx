import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function VerificarProfissional({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const profissionalLogado = sessionStorage.getItem("profissional_logado");
    
    if (!profissionalLogado) {
      // Salvar URL de destino para redirecionar depois do login
      sessionStorage.setItem("redirect_after_pin", location.pathname + location.search);
      navigate(createPageUrl("LoginProfissional"));
    }
  }, [navigate, location]);

  const profissionalLogado = sessionStorage.getItem("profissional_logado");
  
  if (!profissionalLogado) {
    return null;
  }

  return children;
}