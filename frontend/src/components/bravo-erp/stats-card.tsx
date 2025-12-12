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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Estatísticas</CardTitle>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Atualizar estatísticas"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : stats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total de Produtos</p>
                <p className="text-2xl font-bold">{stats.totalProdutos.toLocaleString('pt-BR')}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Produtos Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.produtosAtivos.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Calendar className="h-4 w-4" />
                <span>Última Sincronização</span>
              </div>
              <p className="text-sm font-medium">
                {stats.ultimaSincronizacao
                  ? formatDate(stats.ultimaSincronizacao)
                  : 'Nenhuma sincronização realizada'}
              </p>
            </div>

            {stats.ultimoSync && (
              <div className="pt-2 space-y-1">
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
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma estatística disponível</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
