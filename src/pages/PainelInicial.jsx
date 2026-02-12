import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Building2, Heart, Radio, Truck, Activity, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const perfis = [
  {
    id: "unidade_saude",
    titulo: "UNIDADES DE SAÚDE",
    descricao: "Acesso para profissionais das Unidades de Saúde - Triagem e atendimento de pacientes",
    icon: Building2,
    cor: "bg-blue-600 hover:bg-blue-700",
    requerSenha: false
  },
  {
    id: "asscardio",
    titulo: "ASSCARDIO",
    descricao: "Assessoria Cardiológica - Suporte especializado e pareceres técnicos",
    icon: Heart,
    cor: "bg-green-600 hover:bg-green-700",
    requerSenha: true,
    senha: "pbsaude2023"
  },
  {
    id: "cerh",
    titulo: "CERH",
    descricao: "Central Estadual de Regulação em Hemodinâmica - Regulação e encaminhamento",
    icon: Radio,
    cor: "bg-purple-600 hover:bg-purple-700",
    requerSenha: true,
    senha: "sespb2023"
  },
  {
    id: "transporte",
    titulo: "TRANSPORTE",
    descricao: "Gestão e coordenação de transporte de pacientes",
    icon: Truck,
    cor: "bg-orange-600 hover:bg-orange-700",
    requerSenha: true,
    senha: "aph2023"
  },
  {
    id: "hemodinamica",
    titulo: "HEMODINÂMICA",
    descricao: "Unidades de Hemodinâmica - Recebimento e tratamento de pacientes",
    icon: Activity,
    cor: "bg-red-600 hover:bg-red-700",
    requerSenha: true,
    senha: "pbsaude2024"
  },
  {
    id: "admin",
    titulo: "ADMINISTRADOR",
    descricao: "Acesso administrativo completo - Gestão e configuração do sistema",
    icon: Shield,
    cor: "bg-gray-800 hover:bg-gray-900",
    requerSenha: false
  }
];

export default function PainelInicial() {
  const navigate = useNavigate();
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [perfilSelecionado, setPerfilSelecionado] = useState(null);
  const [senhaDigitada, setSenhaDigitada] = useState("");
  const [erroSenha, setErroSenha] = useState(false);

  const getPaginaDestino = (perfilId) => {
    switch(perfilId) {
      case "unidade_saude":
        return "Historico";
      case "asscardio":
      case "cerh":
        return "Dashboard";
      case "transporte":
      case "hemodinamica":
        return "Dashboard";
      case "admin":
        return "Dashboard";
      default:
        return "Dashboard";
    }
  };

  const handleSelecionarPerfil = async (perfilId) => {
    const perfil = perfis.find(p => p.id === perfilId);
    
    if (perfil.requerSenha) {
      setPerfilSelecionado(perfil);
      setSenhaDigitada("");
      setErroSenha(false);
    } else {
      await base44.auth.updateMe({ equipe: perfilId });
      navigate(createPageUrl(getPaginaDestino(perfilId)));
    }
  };

  const handleConfirmarSenha = async () => {
    if (senhaDigitada === perfilSelecionado.senha) {
      await base44.auth.updateMe({ equipe: perfilSelecionado.id });
      navigate(createPageUrl(getPaginaDestino(perfilSelecionado.id)));
    } else {
      setErroSenha(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Boas-vindas */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Bem-vindo ao App Coração Paraibano
          </h1>
          <p className="text-xl text-gray-700 mb-2">
            Olá, <span className="font-semibold text-red-600">{user?.full_name}</span>
          </p>
          <p className="text-lg text-gray-600">
            Selecione seu perfil de acesso para continuar
          </p>
        </div>

        {/* Grid de perfis */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {perfis.map((perfil) => {
            const Icon = perfil.icon;
            return (
              <Card 
                key={perfil.id}
                className="hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border-2 hover:border-gray-300"
                onClick={() => handleSelecionarPerfil(perfil.id)}
              >
                <CardContent className="p-6">
                  <div className={`${perfil.cor} w-16 h-16 rounded-lg flex items-center justify-center mb-4 transition-colors`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {perfil.titulo}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {perfil.descricao}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Informações do usuário */}
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
          <p className="text-sm text-gray-600 text-center">
            <span className="font-semibold">Email:</span> {user?.email}
          </p>
          {user?.role === 'admin' && (
            <p className="text-sm text-center mt-2">
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-semibold">
                ADMINISTRADOR
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Dialog de autenticação por senha */}
      <Dialog open={!!perfilSelecionado} onOpenChange={() => setPerfilSelecionado(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Autenticação - {perfilSelecionado?.titulo}</DialogTitle>
            <DialogDescription>
              Digite a senha de acesso para {perfilSelecionado?.titulo}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={senhaDigitada}
                onChange={(e) => {
                  setSenhaDigitada(e.target.value);
                  setErroSenha(false);
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleConfirmarSenha()}
                placeholder="Digite a senha"
              />
              {erroSenha && (
                <p className="text-sm text-red-600 mt-2">
                  Senha incorreta. Caso tenha esquecido, contate o administrador.
                </p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setPerfilSelecionado(null)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmarSenha}>
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}