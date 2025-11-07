import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, Search, Calendar, AlertCircle, FileText, Eye, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function HistoricoECG({ historico = [] }) {
  const [busca, setBusca] = useState("");
  const [filtroNivel, setFiltroNivel] = useState("todos");
  const [ordenacao, setOrdenacao] = useState("-data"); // -data = mais recente primeiro
  const [analiseDetalhada, setAnaliseDetalhada] = useState(null);

  // Filtrar histórico
  const historicoFiltrado = historico
    .filter(item => {
      const matchBusca = !busca || 
        item.diagnostico_resumido?.toLowerCase().includes(busca.toLowerCase()) ||
        item.territorio?.toLowerCase().includes(busca.toLowerCase()) ||
        item.id_analise?.toLowerCase().includes(busca.toLowerCase());
      
      const matchNivel = filtroNivel === "todos" || 
        item.nivel_alerta?.includes(filtroNivel);
      
      return matchBusca && matchNivel;
    })
    .sort((a, b) => {
      if (ordenacao === "-data") {
        return new Date(b.timestamp) - new Date(a.timestamp);
      } else {
        return new Date(a.timestamp) - new Date(b.timestamp);
      }
    });

  const getNivelCorClasse = (nivel) => {
    if (nivel?.includes('CRÍTICO')) return 'bg-red-100 text-red-800 border-red-400';
    if (nivel?.includes('URGENTE')) return 'bg-orange-100 text-orange-800 border-orange-400';
    if (nivel?.includes('ATENÇÃO')) return 'bg-yellow-100 text-yellow-800 border-yellow-400';
    if (nivel?.includes('Normal')) return 'bg-green-100 text-green-800 border-green-400';
    return 'bg-gray-100 text-gray-800 border-gray-400';
  };

  if (!historico || historico.length === 0) {
    return (
      <Card className="border-2 border-blue-200 shadow-md">
        <CardHeader className="bg-blue-50">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <History className="w-5 h-5" />
            📜 Histórico de Análises de ECG
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma análise de ECG registrada ainda</p>
            <p className="text-xs mt-2">As análises aparecerão aqui após o primeiro ECG</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2 border-blue-200 shadow-md">
        <CardHeader className="bg-blue-50 border-b">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <History className="w-5 h-5" />
            📜 Histórico de Análises de ECG ({historico.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Filtros e Ordenação */}
          <div className="grid md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por diagnóstico, território, ID..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={filtroNivel} onValueChange={setFiltroNivel}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Níveis</SelectItem>
                <SelectItem value="CRÍTICO">🔴 Crítico</SelectItem>
                <SelectItem value="URGENTE">🟠 Urgente</SelectItem>
                <SelectItem value="ATENÇÃO">🟡 Atenção</SelectItem>
                <SelectItem value="Normal">🟢 Normal</SelectItem>
              </SelectContent>
            </Select>

            <Select value={ordenacao} onValueChange={setOrdenacao}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-data">📅 Mais Recente</SelectItem>
                <SelectItem value="data">📅 Mais Antigo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resumo dos Filtros */}
          {(busca || filtroNivel !== "todos") && (
            <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                {historicoFiltrado.length === 0 ? (
                  <span className="font-medium">Nenhum resultado encontrado</span>
                ) : (
                  <span>Mostrando <strong>{historicoFiltrado.length}</strong> de {historico.length} análises</span>
                )}
              </p>
              {(busca || filtroNivel !== "todos") && (
                <Button
                  onClick={() => {
                    setBusca("");
                    setFiltroNivel("todos");
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-blue-700 hover:text-blue-900"
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          )}

          {/* Lista de Análises */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {historicoFiltrado.map((item, index) => (
              <div
                key={item.id_analise || index}
                className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition-all ${getNivelCorClasse(item.nivel_alerta)}`}
                onClick={() => setAnaliseDetalhada(item)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs font-mono">
                        #{item.id_analise?.slice(0, 8) || 'N/A'}
                      </Badge>
                      <Badge className={`${getNivelCorClasse(item.nivel_alerta)} border font-semibold text-xs`}>
                        {item.nivel_alerta?.split(' - ')[0] || 'N/A'}
                      </Badge>
                    </div>
                    <p className="font-bold text-sm mb-1">
                      {item.diagnostico_resumido || 'Análise de ECG'}
                    </p>
                    {item.territorio && (
                      <p className="text-xs">
                        <strong>Território:</strong> {item.territorio}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-white/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAnaliseDetalhada(item);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-700 mt-2 pt-2 border-t border-gray-300">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(item.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                  {item.registrado_por && (
                    <span className="flex items-center gap-1">
                      👤 {item.registrado_por}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {historicoFiltrado.length === 0 && busca && (
            <div className="text-center py-8 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma análise encontrada para "{busca}"</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={!!analiseDetalhada} onOpenChange={(open) => !open && setAnaliseDetalhada(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalhes da Análise de ECG
            </DialogTitle>
            <DialogDescription>
              Análise completa realizada em {analiseDetalhada && format(new Date(analiseDetalhada.timestamp), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>

          {analiseDetalhada && (
            <div className="space-y-4 mt-4">
              {/* Cabeçalho da Análise */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">ID da Análise:</span>
                    <p className="font-mono font-bold">{analiseDetalhada.id_analise}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Data e Hora:</span>
                    <p className="font-bold">
                      {format(new Date(analiseDetalhada.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Registrado por:</span>
                    <p className="font-bold">{analiseDetalhada.registrado_por || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Nível de Alerta:</span>
                    <Badge className={`${getNivelCorClasse(analiseDetalhada.nivel_alerta)} border font-semibold mt-1`}>
                      {analiseDetalhada.nivel_alerta}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Imagem do ECG */}
              {analiseDetalhada.ecg_url && (
                <div className="border-2 border-blue-200 rounded-lg overflow-hidden">
                  <div className="bg-blue-50 p-2 border-b border-blue-200">
                    <p className="text-sm font-semibold text-blue-900">📊 ECG Analisado</p>
                  </div>
                  <img
                    src={analiseDetalhada.ecg_url}
                    alt="ECG"
                    className="w-full cursor-pointer hover:opacity-90"
                    onClick={() => window.open(analiseDetalhada.ecg_url, '_blank')}
                  />
                </div>
              )}

              {/* Análise Completa */}
              {analiseDetalhada.analise_completa && (
                <div className="space-y-4">
                  {/* Diagnóstico Resumido */}
                  <div className={`p-4 rounded-lg border-2 ${getNivelCorClasse(analiseDetalhada.nivel_alerta)}`}>
                    <h3 className="font-bold text-lg mb-2">📋 Diagnóstico</h3>
                    <p className="font-semibold">{analiseDetalhada.diagnostico_resumido}</p>
                    {analiseDetalhada.territorio && (
                      <p className="text-sm mt-2">
                        <strong>Território Afetado:</strong> {analiseDetalhada.territorio}
                      </p>
                    )}
                  </div>

                  {/* Análise por Derivação */}
                  {analiseDetalhada.analise_completa.analise_por_derivacao && (
                    <Card className="border-2 border-purple-200">
                      <CardHeader className="bg-purple-50 pb-3">
                        <CardTitle className="text-base">📊 Análise por Derivação (12 derivações)</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-bold text-sm mb-2 text-purple-900">Derivações de Membros:</h4>
                            <div className="space-y-1 text-xs">
                              {['DI', 'DII', 'DIII', 'aVR', 'aVL', 'aVF'].map(der => (
                                <div key={der} className="p-2 bg-white rounded border">
                                  <strong>{der}:</strong> {analiseDetalhada.analise_completa.analise_por_derivacao[der] || 'N/A'}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-bold text-sm mb-2 text-purple-900">Derivações Precordiais:</h4>
                            <div className="space-y-1 text-xs">
                              {['V1', 'V2', 'V3', 'V4', 'V5', 'V6'].map(der => (
                                <div key={der} className="p-2 bg-white rounded border">
                                  <strong>{der}:</strong> {analiseDetalhada.analise_completa.analise_por_derivacao[der] || 'N/A'}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Elevação de ST */}
                  {analiseDetalhada.analise_completa.elevacao_st_detectada && (
                    <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
                      <h3 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        ⚠️ ELEVAÇÃO DE ST DETECTADA
                      </h3>
                      {analiseDetalhada.analise_completa.derivacoes_com_elevacao?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-semibold mb-2">Derivações com elevação:</p>
                          <div className="flex flex-wrap gap-2">
                            {analiseDetalhada.analise_completa.derivacoes_com_elevacao.map((der, i) => (
                              <Badge key={i} className="bg-red-600 text-white">
                                {der}
                                {analiseDetalhada.analise_completa.medicao_elevacao_mm?.[der] && 
                                  ` (${analiseDetalhada.analise_completa.medicao_elevacao_mm[der]}mm)`}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {analiseDetalhada.analise_completa.arteria_culpada_provavel && (
                        <p className="text-sm mt-3">
                          <strong>Artéria Culpada Provável:</strong> {analiseDetalhada.analise_completa.arteria_culpada_provavel}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Mensagem Completa */}
                  {analiseDetalhada.analise_completa.mensagem_para_medico && (
                    <Card className="border-2 border-blue-200">
                      <CardHeader className="bg-blue-50 pb-3">
                        <CardTitle className="text-base">📝 Relatório Completo</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="text-sm whitespace-pre-wrap font-mono bg-white p-4 rounded border">
                          {analiseDetalhada.analise_completa.mensagem_para_medico}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Confiança do Diagnóstico */}
                  {analiseDetalhada.analise_completa.confianca_diagnostico && (
                    <div className="bg-gray-50 p-3 rounded border">
                      <p className="text-sm">
                        <strong>Confiança no Diagnóstico:</strong>{' '}
                        <Badge variant="outline" className="ml-2">
                          {analiseDetalhada.analise_completa.confianca_diagnostico}
                        </Badge>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setAnaliseDetalhada(null)} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}