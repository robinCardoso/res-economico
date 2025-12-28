'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, RefreshCw, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { SyncStats } from '@/services/bravo-erp.service';

interface StatsCardProps {
  stats: SyncStats | null;
  loading?: boolean;
  onRefresh?: () => void;
}

export function StatsCard({ stats, loading = false, onRefresh }: StatsCardProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Nunca';
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const translateSyncType = (syncType: string | undefined): string => {
    if (!syncType) return 'N/A';
    const translations: Record<string, string> = {
      complete: 'Completa',
      quick: 'Rápida',
      automatica: 'Automática',
    };
    return translations[syncType.toLowerCase()] || syncType;
  };

  return (
    <Card className="text-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-3">
        <CardTitle className="text-xs font-medium">Estatísticas</CardTitle>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Atualizar estatísticas"
          >
            <RefreshCw
              className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : stats ? (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Total de Produtos</p>
                <p className="text-lg font-semibold">{stats.totalProdutos.toLocaleString('pt-BR')}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Produtos Ativos</p>
                <p className="text-lg font-semibold text-green-600">
                  {stats.produtosAtivos.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Calendar className="h-3 w-3" />
                <span>Última Sincronização</span>
              </div>
              <p className="text-xs font-medium">
                {stats.ultimaSincronizacao
                  ? formatDate(stats.ultimaSincronizacao)
                  : 'Nenhuma sincronização realizada'}
              </p>
            </div>

            {stats.ultimoSync && (
              <div className="pt-1.5 space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-medium">
                    {translateSyncType(stats.ultimoSync.sync_type)}
                  </span>
                </div>
                {(() => {
                  const totalProdutos = stats.ultimoSync.total_produtos_bravo;
                  if (
                    totalProdutos !== undefined &&
                    totalProdutos !== null &&
                    (typeof totalProdutos === 'number' ||
                      typeof totalProdutos === 'string')
                  ) {
                    const numValue =
                      typeof totalProdutos === 'number'
                        ? totalProdutos
                        : Number(totalProdutos);
                    if (!isNaN(numValue)) {
                      return (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            Produtos no Bravo:
                          </span>
                          <span className="font-medium">
                            {numValue.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <Package className="h-5 w-5 mx-auto mb-1.5 opacity-50" />
            <p className="text-xs">Nenhuma estatística disponível</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
