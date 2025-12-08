'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
  History,
  Play,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { SyncLog, ResumableSync } from '@/services/bravo-erp.service';

interface LogsPanelProps {
  logs: SyncLog[];
  loading?: boolean;
  onRefresh?: () => void;
  onResume?: (logId: string) => void;
  resumableSyncs?: ResumableSync[];
}

export function LogsPanel({
  logs,
  loading = false,
  onRefresh,
  onResume,
  resumableSyncs = [],
}: LogsPanelProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getStatusIcon = (log: SyncLog) => {
    if (log.status === 'completed' || log.status === 'sucesso') {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    if (log.status === 'failed' || log.status === 'erro') {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
    if (log.status === 'running' || log.status === 'executando') {
      return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
    }
    if (log.status === 'cancelled' || log.status === 'cancelado') {
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
    return <Clock className="h-5 w-5 text-gray-400" />;
  };

  const getStatusBadge = (log: SyncLog) => {
    if (log.status === 'completed' || log.status === 'sucesso') {
      return <Badge className="bg-green-100 text-green-800">Concluído</Badge>;
    }
    if (log.status === 'failed' || log.status === 'erro') {
      return <Badge className="bg-red-100 text-red-800">Falhou</Badge>;
    }
    if (log.status === 'running' || log.status === 'executando') {
      return <Badge className="bg-blue-100 text-blue-800">Em execução</Badge>;
    }
    if (log.status === 'cancelled' || log.status === 'cancelado') {
      return <Badge className="bg-yellow-100 text-yellow-800">Cancelado</Badge>;
    }
    return <Badge variant="outline">{log.status}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Sincronizações Retomáveis */}
      {resumableSyncs && resumableSyncs.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <RefreshCw className="h-5 w-5" />
              Sincronizações Interrompidas
            </CardTitle>
            <CardDescription>
              Sincronizações que podem ser retomadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resumableSyncs.map((sync: ResumableSync) => (
                <div
                  key={String(sync.id)}
                  className="flex items-center justify-between p-4 rounded-lg border border-orange-200 bg-white"
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <div>
                      <div className="font-medium text-orange-800">
                        Sincronização{' '}
                        {sync.sync_type === 'complete' ? 'Completa' : 'Rápida'}
                      </div>
                      <div className="text-sm text-orange-600">
                        Iniciada:{' '}
                        {sync.started_at
                          ? formatDate(sync.started_at)
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                  {onResume && (
                    <Button
                      size="sm"
                      onClick={() => onResume(String(sync.id))}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Retomar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs Históricos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Logs de Sincronização
            </CardTitle>
            <CardDescription>
              Histórico das últimas sincronizações com o Bravo ERP
            </CardDescription>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
              />
              Atualizar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-muted-foreground">Carregando logs...</p>
              </div>
            </div>
          ) : logs.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-4 rounded-lg border transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(log)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {log.sync_type === 'complete'
                            ? 'Sincronização Completa'
                            : log.sync_type === 'quick'
                              ? 'Sincronização Rápida'
                              : 'Sincronização'}
                        </span>
                        {getStatusBadge(log)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(log.started_at)}
                      </div>
                      {(() => {
                        const errorMsg = log.error_message;
                        if (
                          errorMsg !== undefined &&
                          errorMsg !== null &&
                          errorMsg !== ''
                        ) {
                          return (
                            <div className="text-sm text-red-600 mt-1">
                              {typeof errorMsg === 'string'
                                ? errorMsg
                                : String(errorMsg)}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-medium">
                      {(() => {
                        const total =
                          log.total_produtos_bravo ??
                          (typeof log.produtos_processados === 'number'
                            ? log.produtos_processados
                            : 0) ??
                          0;
                        return Number(total).toLocaleString('pt-BR');
                      })()}{' '}
                      produtos
                    </div>
                    {log.tempo_total_segundos && (
                      <div className="text-sm text-muted-foreground">
                        ⏱️ {formatDuration(log.tempo_total_segundos)}
                      </div>
                    )}
                    {log.produtos_inseridos !== undefined && (
                      <div className="text-xs text-muted-foreground">
                        +{log.produtos_inseridos} inseridos
                      </div>
                    )}
                    {log.produtos_atualizados !== undefined && (
                      <div className="text-xs text-muted-foreground">
                        {log.produtos_atualizados} atualizados
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="font-semibold mb-2">Nenhum log encontrado</h3>
              <p className="text-sm">
                Execute uma sincronização para ver os logs aqui
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
