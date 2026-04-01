import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RecomendacoesTrombolise() {
  return (
    <Card className="border-2 border-purple-400 bg-purple-50 mt-4">
      <CardHeader className="bg-purple-100">
        <CardTitle className="text-purple-900 text-base">💊 RECOMENDAÇÕES PARA TROMBÓLISE</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4 text-sm text-gray-800">
        <p>
          Após a administração da terapia inicial, incluindo analgesia e anti-agregação plaquetária, identificar as contraindicações ao uso do trombolítico.
        </p>

        <div>
          <p className="font-bold text-red-800 mb-1">CONTRAINDICAÇÕES ABSOLUTAS:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>História de AVC hemorrágico prévio ou AVC isquêmico nos últimos seis meses; malformação arteriovenosa, dano ou neoplasia em sistema nervoso central;</li>
            <li>Trauma de face ou cabeça nos últimos 30 dias;</li>
            <li>Punção não compressível há menos de 24 horas (exemplos: biópsia renal ou hepática, punção liquórica);</li>
            <li>Sangramento ativo; sangramento em trato gastrointestinal nos últimos 30 dias;</li>
            <li>Suspeita de dissecção aguda de aorta.</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-orange-800 mb-1">CONTRAINDICAÇÕES RELATIVAS:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>PA &gt; 180/110mmHg;</li>
            <li>Uso prévio de anticoagulante;</li>
            <li>Doença hepática avançada;</li>
            <li>Úlcera péptica ativa;</li>
            <li>Ressuscitação cardíaca prolongada;</li>
            <li>Endocardite infecciosa;</li>
            <li>Gravidez e primeira semana de puerpério;</li>
            <li>Ataque isquêmico transitório nos últimos seis meses.</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-blue-900 mb-2">TERAPIA PERITROMBÓLISE</p>

          <p className="font-semibold text-blue-800 mb-1">1 - TERAPIA ANTICOAGULANTE — Enoxaparina Injetável:</p>
          <ul className="list-disc ml-5 space-y-1 mb-3">
            <li>&lt; 75 anos: 30mg EV em bolus; após 15 minutos, 1mg/kg SC 12/12 horas (máximo de 100mg/dose);</li>
            <li>≥ 75 anos: 0,75mg/kg SC 12/12 horas (máximo de 100mg/dose, omite-se a dose de ataque).</li>
          </ul>

          <p className="font-semibold text-blue-800 mb-1">2 – FIBRINÓLISE</p>
          <p className="font-medium mb-1">2.1 – ALTEPLASE (Início dos sintomas há menos de seis horas):</p>
          <ul className="list-disc ml-5 mb-2">
            <li>15mg EV em bolus, seguidos de infusão de 0,75mg/kg (não excedendo 50mg) em 30 minutos e, por fim, mais 0,50mg/kg (não excedendo 35mg) nos próximos 60 minutos.</li>
          </ul>
          <p className="font-medium mb-1">2.2 – ALTEPLASE (Início dos sintomas entre seis e 12 horas):</p>
          <ul className="list-disc ml-5 mb-3">
            <li>10mg EV em bolus, seguidos de infusão de 50mg em 60 minutos e, por fim, mais 35mg nos próximos 120 minutos. Naqueles com menos de 65kg, a dose total não deve exceder 1,5mg/kg.</li>
          </ul>

          <p className="font-medium mb-1">3.1 – TENECTEPLASE (Ampola de 40mg até 80Kg):</p>
          <ul className="list-disc ml-5 mb-2">
            <li>Até 60kg: 30mg;</li>
            <li>60kg a 70kg: 35mg;</li>
            <li>71kg a 80kg: 40mg.</li>
            <li>Nos idosos com mais de 75 anos, faz-se somente metade da dose.</li>
          </ul>
          <p className="font-medium mb-1">3.2 – TENECTEPLASE (Ampola de 50mg &gt; 80Kg):</p>
          <ul className="list-disc ml-5 mb-3">
            <li>81kg a 90kg: 45mg;</li>
            <li>90kg: 50mg.</li>
            <li>Nos idosos com mais de 75 anos, faz-se somente metade da dose.</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-400 rounded-lg p-3">
          <p className="font-bold text-yellow-900 mb-1">⚠️ CUIDADOS PERITROMBÓLISE</p>
          <p>
            O paciente deve permanecer sob monitorização hemodinâmica contínua, com verificação dos sinais vitais 15/15 min durante as primeiras duas horas; 30/30 min nas próximas quatro horas; e de 60/60 min por 18 horas.
          </p>
          <p className="mt-2">
            Devem ser evitados procedimentos invasivos dentro de 24 horas, sobretudo dentro das primeiras seis horas após o término do trombolítico, tais como: cateterização venosa central ou punção arterial; sondagem vesical; sondagem nasoenteral ou nasogástrica.
          </p>
          <p className="mt-2">
            Observar os critérios de reperfusão, verificados após 90 minutos do início do trombolítico (melhora súbita da dor, regressão superior a 50% do supradesnível de ST, pico precoce de marcadores de necrose e/ou arritmias de reperfusão).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}