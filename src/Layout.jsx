import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Activity, Plus, History, BookOpen, FileText, Users, AlertCircle } from "lucide-react";
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

const navigationItems = [
  {
    title: "Painel Inicial",
    url: createPageUrl("Dashboard"),
    icon: Activity,
  },
  {
    title: "Nova Triagem",
    url: createPageUrl("NovaTriagem"),
    icon: Plus,
  },
  {
    title: "Histórico",
    url: createPageUrl("Historico"),
    icon: History,
  },
  {
    title: "Protocolos",
    url: createPageUrl("Protocolos"),
    icon: BookOpen,
  },
  {
    title: "Manual",
    url: createPageUrl("Manual"),
    icon: FileText,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

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
      <div className="min-h-screen flex w-full bg-gray-50 ecg-background">
        <Sidebar className="border-r border-red-200 bg-white">
          <SidebarHeader className="border-b border-red-200 p-4 bg-gradient-to-r from-red-600 to-red-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
                <Activity className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="font-bold text-white text-lg">Triagem Dor Torácica</h2>
                <p className="text-xs text-red-100">Sistema de Classificação de Risco</p>
              </div>
            </div>
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
                Informações
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-3 py-2 space-y-3">
                  <div className="flex items-center gap-2 text-sm p-2 bg-red-50 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Meta IAM-ECG</p>
                      <p className="text-xs text-red-600 font-bold">≤ 10 minutos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm p-2 bg-orange-50 rounded-lg">
                    <Users className="w-4 h-4 text-orange-600" />
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Meta Regulação</p>
                      <p className="text-xs text-orange-600 font-bold">≤ 30 minutos</p>
                    </div>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-red-200 p-4 bg-gray-50">
            <div className="space-y-2">
              <div className="text-xs">
                <p className="font-semibold text-gray-900">Autor:</p>
                <p className="text-gray-700">Walber Alves Frazão Júnior</p>
                <p className="text-gray-600">Enfermeiro Emergencista</p>
                <p className="text-gray-600">COREN 110.238</p>
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
              <h1 className="text-xl font-bold text-red-600">Triagem Dor Torácica</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}