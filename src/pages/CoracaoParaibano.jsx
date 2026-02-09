import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus } from "lucide-react";

export default function CoracaoParaibano() {
  const navigate = useNavigate();

  const handleNovosPacientes = () => {
    navigate(createPageUrl("NovaTriagem"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-6 shadow-sm rounded-t-lg">
        <div className="max-w-6xl mx-auto">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fa0edee56f5a67f929da76/fa5f3a17e_LOGOCORAAOPARAIBANO.png" 
            alt="Coração Paraibano" 
            className="h-20 w-auto object-contain mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900">CORAÇÃO PARAIBANO</h1>
          <p className="text-gray-600 mt-1">Unidade de Saúde - Triagem de Pacientes Cardíacos</p>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-6xl mx-auto mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Novo Paciente */}
          <button
            onClick={handleNovosPacientes}
            className="p-8 bg-white rounded-lg shadow-md border-2 border-red-300 hover:shadow-lg hover:border-red-500 transition-all duration-200"
          >
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-red-100 rounded-full mb-4">
                <Plus className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Novo Paciente</h2>
              <p className="text-gray-600">Iniciar triagem de um novo paciente cardíaco</p>
            </div>
          </button>

          {/* Placeholder para futuros cards */}
          <div className="p-8 bg-white rounded-lg shadow-md border-2 border-gray-200 opacity-50">
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <div className="w-12 h-12 bg-gray-300 rounded"></div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Em breve</h2>
              <p className="text-gray-600">Novos recursos disponíveis</p>
            </div>
          </div>

          <div className="p-8 bg-white rounded-lg shadow-md border-2 border-gray-200 opacity-50">
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <div className="w-12 h-12 bg-gray-300 rounded"></div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Em breve</h2>
              <p className="text-gray-600">Novos recursos disponíveis</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}