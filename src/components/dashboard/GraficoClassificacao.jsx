import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS = {
  "Vermelha": "#DC2626",
  "Laranja": "#EA580C",
  "Amarela": "#CA8A04",
  "Verde": "#16A34A",
  "Azul": "#2563EB"
};

export default function GraficoClassificacao({ pacientes }) {
  const dados = Object.entries(
    pacientes.reduce((acc, p) => {
      const cor = p.classificacao_risco?.cor || "Sem classificação";
      acc[cor] = (acc[cor] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Classificação Hoje</CardTitle>
      </CardHeader>
      <CardContent>
        {dados.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Nenhum paciente classificado hoje
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={dados}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dados.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name] || "#6B7280"} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}