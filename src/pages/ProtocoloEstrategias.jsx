import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function ProtocoloEstrategias() {
  const [selectedCenario, setSelectedCenario] = useState("cenario1");

  const cenario1 = {
    titulo: "Cenário 1: Estratégia 1 em Hospital Sem Hemodinâmica",
    condicao: "Paciente com Síndrome de Dor Torácica há < 12 horas, e sem contraindicações à fibrinólise e sua indicação (APENAS CASOS SELECIONADOS E SINALIZADOS PELO MÉDICO REGULADOR)",
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
        categoria: "RECOMENDAÇÕES PARA TROMBÓLISE",
        itens: [
          "Após a administração da terapia inicial, incluindo analgesia e anti-agregação plaquetária, identificar as contraindicações ao uso do trombolítico."
        ]
      },
      {
        categoria: "CONTRAINDICAÇÕES ABSOLUTAS",
        itens: [
          "História de AVC hemorrágico prévio ou AVC isquêmico nos últimos seis meses",
          "Malformação arteriovenosa, dano ou neoplasia em sistema nervoso central",
          "Trauma de face ou cabeça nos últimos 30 dias",
          "Punção não compressível há menos de 24 horas (exemplos: biópsia renal ou hepática, punção liquórica)",
          "Sangramento ativo",
          "Sangramento em trato gastrointestinal nos últimos 30 dias",
          "Suspeita de dissecção aguda de aorta"
        ]
      },
      {
        categoria: "CONTRAINDICAÇÕES RELATIVAS",
        itens: [
          "PA > 180/110mmHg",
          "Uso prévio de anticoagulante",
          "Doença hepática avançada",
          "Úlcera péptica ativa",
          "Ressuscitação cardíaca prolongada",
          "Endocardite infecciosa",
          "Gravidez e primeira semana de puerpério",
          "Ataque isquêmico transitório nos últimos seis meses"
        ]
      },
      {
        categoria: "1 - TERAPIA ANTICOAGULANTE: Enoxaparina Injetável",
        itens: [
          "< 75 anos: 30mg EV em bolus; após 15 minutos, 1mg/kg subcutâneo (SC) 12/12 horas (máximo de 100mg/dose)",
          "≥ 75 anos: 0,75mg/kg SC 12/12 horas (máximo de 100mg/dose, omite-se a dose de ataque)"
        ]
      },
      {
        categoria: "2.1 – ALTEPLASE (Início dos sintomas há menos de seis horas)",
        itens: [
          "15mg EV em bolus, seguidos de infusão de 0,75mg/kg (não excedendo 50mg) em 30 minutos e, por fim, mais 0,50mg/kg (não excedendo 35mg) nos próximos 60 minutos."
        ]
      },
      {
        categoria: "2.2 – ALTEPLASE (Início dos sintomas entre seis e 12 horas)",
        itens: [
          "10mg EV em bolus, seguidos de infusão de 50mg em 60 minutos e, por fim, mais 35mg nos próximos 120 minutos. Naqueles com menos de 65kg, a dose total não deve exceder 1,5mg/kg."
        ]
      },
      {
        categoria: "3.1 – TENECTEPLASE (Ampola de 40mg até 80Kg)",
        itens: [
          "Até 60kg: 30mg",
          "60kg a 70kg: 35mg",
          "71kg a 80kg: 40mg",
          "Nos idosos com mais de 75 anos, faz-se somente metade da dose."
        ]
      },
      {
        categoria: "3.2 – TENECTEPLASE (Ampola de 50mg > 80Kg)",
        itens: [
          "81kg a 90kg: 45mg",
          "90kg: 50mg",
          "Nos idosos com mais de 75 anos, faz-se somente metade da dose."
        ]
      },
      {
        categoria: "CUIDADOS PERITROMBÓLISE",
        itens: [
          "O paciente deve permanecer sob monitorização hemodinâmica contínua, com verificação dos sinais vitais 15/15 min. durante as primeiras duas horas; 30/30 min. nas próximas quatro horas; e de 60/60 min por 18 horas.",
          "Devem ser evitados procedimentos invasivos dentro de 24 horas, sobretudo dentro das primeiras seis horas após o término do trombolítico, tais como: cateterização venosa central ou punção arterial; sondagem vesical; sondagem nasoenteral ou nasogástrica.",
          "Observar os critérios de reperfusão, verificados após 90 minutos do início do trombolítico (melhora súbita da dor, regressão superior a 50% do supradesnível de ST, pico precoce de marcadores de necrose e/ou arritmias de reperfusão)."
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

  const cenario3 = {
    titulo: "Cenário 3: Estratégia 2 e 3",
    condicao: "Paciente com Síndrome Coronariana Aguda",
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
          "Clopidogrel 300 mg (ataque)",
          "Ticagrelor 180 mg ou Prasugrel 60 mg"
        ]
      },
      {
        categoria: "Adicionar anticoagulante",
        itens: [
          "Enoxaparina de manutenção de 1 mg/kg 12/12 horas ou 0,75 mg/kg se idade > 75 anos, ou ajustar dose para ClCr < 30 (redução de 50% da dose), após realização de procedimento"
        ]
      },
      {
        categoria: "Realizar Estratificação Invasiva em até 24 horas",
        itens: [
          "Nos pacientes instáveis hemodinamicamente, ou com choque, realizar em até 2 horas"
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Condutas Iniciais</h1>
          <p className="text-gray-600">Protocolo Coração Paraibano - Secretaria de Estado da Saúde</p>
          <p className="text-sm text-gray-500 mt-2">Fonte: Protocolo Coração Paraibano, 2026</p>
        </div>

        {/* Tabs de Cenários */}
        <Tabs value={selectedCenario} onValueChange={setSelectedCenario} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="cenario1" className="text-left text-xs sm:text-sm">
              <span className="hidden sm:inline">Cenário 1</span>
              <span className="sm:hidden">C1</span>
            </TabsTrigger>
            <TabsTrigger value="cenario2" className="text-left text-xs sm:text-sm">
              <span className="hidden sm:inline">Cenário 2</span>
              <span className="sm:hidden">C2</span>
            </TabsTrigger>
            <TabsTrigger value="cenario3" className="text-left text-xs sm:text-sm">
              <span className="hidden sm:inline">Cenário 3</span>
              <span className="sm:hidden">C3</span>
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

          <TabsContent value="cenario3" className="space-y-6">
            <Card className="border-2 border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">{cenario3.titulo}</CardTitle>
              </CardHeader>
            </Card>
            {renderCenario(cenario3)}
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