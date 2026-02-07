import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Activity, Plus, History, BookOpen, FileText, Users, AlertCircle, TrendingUp, Shield, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import NotificacoesCenter from "@/components/NotificacoesCenter";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });



  const navigationItems = [
    {
      title: "Painel Inicial",
      url: createPageUrl("Dashboard"),
      icon: Activity,
    },
    {
      title: "Novo Paciente",
      url: createPageUrl("NovaTriagem"),
      icon: Plus,
    },
    {
      title: "Histórico",
      url: createPageUrl("Historico"),
      icon: History,
    },
    {
      title: "Indicadores",
      url: createPageUrl("Indicadores"),
      icon: TrendingUp,
    },
    {
      title: "Protocolos",
      url: createPageUrl("Protocolos"),
      icon: BookOpen,
    },
    {
      title: "Estratégias e Condutas",
      url: createPageUrl("ProtocoloEstrategias"),
      icon: FileText,
    },
    {
      title: "Manual",
      url: createPageUrl("Manual"),
      icon: FileText,
    },
  ];

  // Adicionar item de Administração apenas para admins
  if (user?.role === 'admin') {
    navigationItems.push({
      title: "Administração",
      url: createPageUrl("Administracao"),
      icon: Shield,
    });
  }

  const handleLogout = () => {
    if (confirm("Tem certeza que deseja sair do sistema?")) {
      sessionStorage.removeItem("profissional_logado");
      base44.auth.logout();
    }
  };

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --primary: 0 72% 51%;
          --primary-foreground: 0 0% 100%;
          --destructive: 0 84% 60%;
          --destructive-foreground: 0 0% 100%;
        }
        
        .ecg-background {
          background-image: url("data:image/svg+xml,%3Csvg width='100' height='60' viewBox='0 0 100 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30 L 20 30 L 22 25 L 24 35 L 26 15 L 28 30 L 30 28 L 40 28 L 60 28 L 62 23 L 64 33 L 66 13 L 68 28 L 70 26 L 80 26 L 100 26' stroke='rgba(239, 68, 68, 0.08)' fill='none' stroke-width='1'/%3E%3C/svg%3E");
          background-repeat: repeat;
        }
      `}</style>
      <div className="min-h-screen flex flex-col w-full bg-gray-50 ecg-background">
        {/* Header com as 3 logos */}
        <header className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-4 w-full max-w-7xl mx-auto">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/8e093c8da_logoSecretariadeEstadodaSade.png" 
              alt="Secretaria de Estado da Saúde" 
              className="h-16 md:h-20 w-auto object-contain"
            />
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/fa5f3a17e_LOGOCORAAOPARAIBANO.png" 
              alt="Coração Paraibano" 
              className="h-16 md:h-20 w-auto object-contain"
            />
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/873a4a563_logo.png" 
              alt="PBSAÚDE" 
              className="h-16 md:h-20 w-auto object-contain"
            />
          </div>
        </header>

        <div className="flex flex-1 min-h-0">
        <Sidebar className="border-r border-red-200 bg-white">
          <SidebarHeader className="border-b border-red-200 p-4 bg-white">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/ffd6172a5_LOGOCORAAOPARAIBANO.png" 
                alt="Coração Paraibano" 
                className="h-12 w-auto"
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">App Coração Paraibano</p>
          </SidebarHeader>
          
          <SidebarContent className="p-2">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 py-2">
                Navegação
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-red-50 hover:text-red-700 transition-colors duration-200 rounded-lg mb-1 ${
                          location.pathname === item.url ? 'bg-red-50 text-red-700 font-semibold' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2">
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 py-2">
                Metas de Qualidade
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-3 py-2 space-y-2">
                  <div className="text-sm p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-900 font-bold mb-1">Tempos</p>
                    <p className="text-xs text-blue-800">• Triagem ≤4min</p>
                    <p className="text-xs text-blue-800">• Espera ≤15min</p>
                    <p className="text-xs text-blue-800">• Triagem clínica ≤20min</p>
                  </div>
                  <div className="text-sm p-2 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs text-red-900 font-bold mb-1">Meta Crítica</p>
                    <p className="text-xs text-red-800">• IAM-ECG ≤10min</p>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>

            {user && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 py-2">
                  Usuário
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <div className="px-3 py-2">
                    <div className="bg-blue-50 p-3 rounded-lg mb-3">
                      <p className="text-xs text-blue-900 font-semibold">{user.full_name}</p>
                      <p className="text-xs text-blue-700">{user.email}</p>
                      {user.role === 'admin' && (
                        <p className="text-xs text-red-600 font-bold mt-1">ADMINISTRADOR</p>
                      )}
                    </div>
                    {(() => {
                      const profissionalLogado = sessionStorage.getItem("profissional_logado");
                      if (profissionalLogado) {
                        const prof = JSON.parse(profissionalLogado);
                        return (
                          <div className="bg-green-50 p-3 rounded-lg mb-3 border border-green-200">
                            <p className="text-xs text-green-900 font-semibold">{prof.nome}</p>
                            <p className="text-xs text-green-700">{prof.tipo} - {prof.registro}</p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300"
                      size="sm"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair do Sistema
                    </Button>
                    {sessionStorage.getItem("profissional_logado") && (
                      <Button
                        onClick={() => {
                          if (confirm("Deseja desconectar o profissional atual?")) {
                            sessionStorage.removeItem("profissional_logado");
                            window.location.reload();
                          }
                        }}
                        variant="outline"
                        className="w-full mt-2 border-orange-200 text-orange-700 hover:bg-orange-50"
                        size="sm"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Desconectar Profissional
                      </Button>
                    )}
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t border-red-200 p-4 bg-gray-50">
            <div className="space-y-2">
              <div className="text-xs">
                <p className="font-semibold text-gray-900">Autor:</p>
                <p className="text-gray-700">Walber Alves Frazão Júnior</p>
                <p className="text-gray-600">Enfermeiro Emergencista</p>
                <p className="text-gray-600">COREN 110.238</p>
                <p className="text-gray-500 mt-1">Pós-graduado em Cardiologia,</p>
                <p className="text-gray-500">Neurologia e Auditoria em</p>
                <p className="text-gray-500">Serviços de Saúde</p>
              </div>
              <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                <p>© 2025 - Todos os direitos reservados</p>
                <p className="mt-1">Uso, cópia ou venda não autorizados são proibidos</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

          <main className="flex-1 flex flex-col">
            <header className="bg-white border-b border-gray-200 px-6 py-4 md:hidden shadow-sm">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200" />
                <h1 className="text-xl font-bold text-red-600">Coração Paraibano</h1>
              </div>
            </header>

            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}