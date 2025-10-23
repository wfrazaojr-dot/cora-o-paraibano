import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

const colorMap = {
  blue: {
    bg: "bg-blue-500",
    light: "bg-blue-50",
    text: "text-blue-600"
  },
  red: {
    bg: "bg-red-500",
    light: "bg-red-50",
    text: "text-red-600"
  },
  green: {
    bg: "bg-green-500",
    light: "bg-green-50",
    text: "text-green-600"
  },
  orange: {
    bg: "bg-orange-500",
    light: "bg-orange-50",
    text: "text-orange-600"
  }
};

export default function StatsCard({ title, value, icon: Icon, color, subtitle }) {
  const colors = colorMap[color];
  
  return (
    <Card className="relative overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 ${colors.bg} rounded-full opacity-10`} />
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${colors.light}`}>
            <Icon className={`w-6 h-6 ${colors.text}`} />
          </div>
        </div>
        {subtitle && (
          <p className="text-sm text-gray-500 flex items-center gap-1">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}