import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function ProtocoloEstrategias() {
  const [selectedCenario, setSelectedCenario] = useState("cenario1");

  const cenario1 = {
    titulo: "Cenário 1: Estratégia 1 em Hospital Sem Hemodinâmica",
    condicao: "Paciente com Síndrome de Dor Torácica há > 12 horas, e sem contraindicações à fibrinólise e sua indicação (APENAS CASOS SELECIONADOS E SINALIZADOS PELO MÉDICO REGULADOR)",
    medicamentos: [
      {
        categoria: "Medidas Iniciais",
        itens: [
          "Monitorização eletrocardiográfica",
          "Oxigênio suplementar se SpO2 < 90%",
          "Acesso Venoso Periférico",
          "Eletrocardiografia de 12 derivações",
          "Administrar AAS 300 mg mastigados"
        ]
      },
      {
        categoria: "Analgesia",
        itens: [
          "Considerar o uso de Nitrato 5 mg SL (até 15 mg) ou endovenoso (se não houver contraindicações)",
          "Considerar o uso de Morfina 1 a 2 mg EV"
        ]
      },
      {
        categoria: "Adicionar 2º Antiagregante",
        itens: [
          "Clopidogrel 300 mg (ataque) ou 75 mg (se > 75 anos)"
        ]
      },
      {
        categoria: "Adicionar anticoagulante",
        itens: [
          "Enoxaparina 30 mg EV (15 a 30 minutos após fibrinolítico) e 30 mg EV (15 minutos após administração de fibrinolítico) e manutenção de 1 mg/kg 12/12 horas ou 0,75 mg/kg se idade > 75 anos, ou ajustar dose para ClCr < 30 (redução de 50% da dose)"
        ]
      },
      {
        categoria: "Administrar Fibrinolítico",
        itens: [
          "Administrar após a avaliação conjunta com médico Cardiologista do Complexo Regulador do Estado da Paraíba (CERH-PB)",
          "Alteplase (conforme orientação já exposta), com os cuidados envolvidos tanto durante a administração quanto após",
          "Avaliar critérios de reperfusão e realizar prontamente novo contato com Médico Regulador do Coração Paraibano"
        ]
      },
      {
        categoria: "Administrar Estatina",
        itens: [
          "Atorvastatina 80 mg via oral",
          "Rosuvastatina 40 mg via oral",
          "Sinvastatina 40 mg via oral (na indisponibilidade das demais)"
        ]
      },
      {
        categoria: "Administrar betabloqueador",
        itens: [
          "Iniciar nas primeiras 24 horas, em dose baixa, se não apresentar contraindicações"
        ]
      },
      {
        categoria: "Administrar IECA",
        itens: [
          "Iniciar nas primeiras 24 horas, em dose baixa, se não apresentar contraindicações"
        ]
      }
    ]
  };

  const cenario2 = {
    titulo: "Cenário 2: Estratégia 1 - Tratamento no Contexto de Hospital com Hemodinâmica",
    condicao: "Paciente com Síndrome de Dor Torácica há < 12 horas, com indicação de Angioplastia primária",
    medicamentos: [
      {
        categoria: "Medidas Iniciais",
        itens: [
          "Monitorização eletrocardiográfica",
          "Oxigênio suplementar se SpO2 < 90%",
          "Acesso Venoso Periférico",
          "Eletrocardiografia de 12 derivações",
          "Administrar AAS 300 mg mastigados"
        ]
      },
      {
        categoria: "Analgesia",
        itens: [
          "Considerar o uso de Nitrato 5 mg SL (até 15 mg) ou endovenoso (se não houver contraindicações)",
          "Considerar o uso de Morfina 1 a 2 mg EV"
        ]
      },
      {
        categoria: "Adicionar 2º Antiagregante",
        itens: [
          "Clopidogrel 600 mg (ataque) ou 300 mg (se > 75 anos)",
          "Ticagrelor 180 mg",
          "Prasugrel 60 mg (em sala, após conhecida anatomia coronariana)"
        ]
      },
      {
        categoria: "Adicionar anticoagulante",
        itens: [
          "Enoxaparina de manutenção de 1 mg/kg 12/12 horas ou 0,75 mg/kg se idade > 75 anos, ou ajustar dose para ClCr < 30 (redução de 50% da dose), após realização de procedimento"
        ]
      },
      {
        categoria: "Angioplastia Primária",
        itens: [
          "Realizar nos primeiros 60 (sessenta) minutos após admissão"
        ]
      },
      {
        categoria: "Administrar Estatina",
        itens: [
          "Atorvastatina 80 mg via oral",
          "Rosuvastatina 40 mg via oral",
          "Sinvastatina 40 mg via oral (na indisponibilidade das demais)"
        ]
      },
      {
        categoria: "Administrar betabloqueador",
        itens: [
          "Iniciar nas primeiras 24 horas, em dose baixa, se não apresentar contraindicações"
        ]
      },
      {
        categoria: "Administrar IECA",
        itens: [
          "Iniciar nas primeiras 24 horas, em dose baixa, se não apresentar contraindicações"
        ]
      }
    ]
  };

  const renderCenario = (cenario) => (
    <div className="space-y-6">
      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-900 mb-2">{cenario.condicao}</h3>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {cenario.medicamentos.map((secao, idx) => (
          <Card key={idx} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-blue-900">{secao.categoria}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {secao.itens.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Estratégias e Condutas Iniciais</h1>
          <p className="text-gray-600">Protocolo Coração Paraibano - Secretaria de Estado da Saúde</p>
          <p className="text-sm text-gray-500 mt-2">Fonte: Protocolo Coração Paraibano, 2026</p>
        </div>

        {/* Tabs de Cenários */}
        <Tabs value={selectedCenario} onValueChange={setSelectedCenario} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="cenario1" className="text-left">
              <span className="hidden sm:inline">Cenário 1:</span>
              <span className="sm:hidden">Sem Hemodinâmica</span>
            </TabsTrigger>
            <TabsTrigger value="cenario2" className="text-left">
              <span className="hidden sm:inline">Cenário 2:</span>
              <span className="sm:hidden">Com Hemodinâmica</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cenario1" className="space-y-6">
            <Card className="border-2 border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">{cenario1.titulo}</CardTitle>
              </CardHeader>
            </Card>
            {renderCenario(cenario1)}
          </TabsContent>

          <TabsContent value="cenario2" className="space-y-6">
            <Card className="border-2 border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">{cenario2.titulo}</CardTitle>
              </CardHeader>
            </Card>
            {renderCenario(cenario2)}
          </TabsContent>
        </Tabs>

        {/* Footer com fonte */}
        <div className="mt-12 pt-8 border-t border-gray-300">
          <p className="text-xs text-gray-600">
            <strong>Fonte:</strong> Secretaria de Estado da Saúde da Paraíba - Protocolo Coração Paraibano, 2026<br />
            Fundação Paraibana de Gestão em Saúde<br />
            Rua Roberto dos Santos Correia, S/N, Várzea Nova, Santa Rita – PB | CEP: 58.034-500
          </p>
        </div>
      </div>
    </div>
  );
}