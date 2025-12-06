'use client';

/**
 * ============================================
 * BRAVO ERP - PAINEL DE SINCRONIZAÇÃO
 * Componente para iniciar e acompanhar sincronizações
 * ============================================
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  RefreshCw,
  Database,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Settings,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  bravoErpService,
  type SyncRequest,
  type SyncResponse,
  type SyncStatus,
  type SyncProgress,
  type BravoConfig,
} from '@/services/bravo-erp.service';

interface SyncPanelProps {
  onSyncStart?: (syncLogId: string) => void;
  onSyncComplete?: () => void;
}

export function SyncPanel({ onSyncStart, onSyncComplete }: SyncPanelProps) {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [syncType, setSyncType] = useState<'rapida' | 'completa' | null>(null);
  const [currentSyncLogId, setCurrentSyncLogId] = useState<string | null>(null);
  const [currentLockId, setCurrentLockId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [config, setConfig] = useState<BravoConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Carregar configuração
  useEffect(() => {
    loadConfig();
  }, []);

  // Polling de status quando há sincronização em andamento
  useEffect(() => {
    if (!syncing || !currentSyncLogId) return;

    const interval = setInterval(async () => {
      try {
        // Buscar status geral
        const status = await bravoErpService.getStatus();
        setSyncStatus(status);

        // Buscar progresso específico
        if (currentSyncLogId) {
          const progressData = await bravoErpService.getProgress(currentSyncLogId);
          setProgress(progressData);

          // Verificar se completou
          if (status.isRunning === false) {
            setSyncing(false);
            setSyncType(null);
            setCurrentSyncLogId(null);
            setCurrentLockId(null);
            
            if (onSyncComplete) {
              onSyncComplete();
            }
            
            toast({
              title: 'Sincronização concluída',
              description: 'A sincronização foi finalizada com sucesso',
            });
          }
        }
      } catch (error) {
        console.error('Erro ao buscar status da sincronização:', error);
      }
    }, 3000); // Polling a cada 3 segundos

    return () => clearInterval(interval);
  }, [syncing, currentSyncLogId, onSyncComplete, toast]);

  const loadConfig = async () => {
    try {
      setLoadingConfig(true);
      const response = await bravoErpService.getConfig();
      if (response.success && response.config) {
        setConfig(response.config);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSyncRapida = async () => {
    if (!config?.token) {
      toast({
        title: 'Token não configurado',
        description: 'Configure o token da API antes de sincronizar',
        variant: 'destructive',
      });
      return;
    }

    setSyncing(true);
    setSyncType('rapida');
    setCurrentSyncLogId(null);
    setCurrentLockId(null);

    try {
      toast({
        title: 'Sincronização Rápida iniciada',
        description: 'Aguarde enquanto os produtos são importados...',
      });

      const request: SyncRequest = {
        apenas_ativos: true,
        limit: 50,
        pages: 1,
        verificar_duplicatas: config.verificar_duplicatas,
        usar_data_ult_modif: config.usar_data_ult_modif,
      };

      const response: SyncResponse = await bravoErpService.sync(request);

      if (response.success && response.sync_log_id) {
        setCurrentSyncLogId(response.sync_log_id);
        setCurrentLockId(response.lock_id || null);

        if (onSyncStart && response.sync_log_id) {
          onSyncStart(response.sync_log_id);
        }

        toast({
          title: 'Sincronização Rápida iniciada',
          description: 'Os produtos estão sendo importados em segundo plano.',
        });

        // Aguardar um pouco e verificar se já finalizou (sync rápida é rápida)
        setTimeout(async () => {
          try {
            const status = await bravoErpService.getStatus();
            if (!status.isRunning) {
              setSyncing(false);
              setSyncType(null);
              setCurrentSyncLogId(null);
              setCurrentLockId(null);
              
              if (onSyncComplete) {
                onSyncComplete();
              }
            }
          } catch (error) {
            console.error('Erro ao verificar status:', error);
          }
        }, 5000);
      } else {
        setSyncing(false);
        setSyncType(null);
        toast({
          title: 'Erro ao iniciar sincronização',
          description: response.error || response.message || 'Erro desconhecido',
          variant: 'destructive',
        });
        
        if (response.lock_id) {
          setCurrentLockId(response.lock_id);
        }
      }
    } catch (error) {
      console.error('Erro na sincronização rápida:', error);
      setSyncing(false);
      setSyncType(null);
      toast({
        title: 'Erro na sincronização',
        description: error instanceof Error ? error.message : 'Erro de rede ou servidor',
        variant: 'destructive',
      });
    }
  };

  const handleSyncCompleto = async () => {
    if (!config?.token) {
      toast({
        title: 'Token não configurado',
        description: 'Configure o token da API antes de sincronizar',
        variant: 'destructive',
      });
      return;
    }

    // Confirmar ação
    if (
      !confirm(
        'Deseja iniciar a sincronização completa? Isso pode demorar alguns minutos.',
      )
    ) {
      return;
    }

    setSyncing(true);
    setSyncType('completa');
    setCurrentSyncLogId(null);
    setCurrentLockId(null);

    try {
      toast({
        title: 'Sincronização Completa iniciada',
        description: 'Este processo pode levar alguns minutos. Aguarde a finalização.',
      });

      const request: SyncRequest = {
        apenas_ativos: true,
        pages: 999, // Máximo de páginas
        verificar_duplicatas: config.verificar_duplicatas,
        usar_data_ult_modif: config.usar_data_ult_modif,
      };

      const response: SyncResponse = await bravoErpService.sync(request);

      if (response.success && response.sync_log_id) {
        setCurrentSyncLogId(response.sync_log_id);
        setCurrentLockId(response.lock_id || null);

        if (onSyncStart && response.sync_log_id) {
          onSyncStart(response.sync_log_id);
        }
      } else {
        setSyncing(false);
        setSyncType(null);
        toast({
          title: 'Erro ao iniciar sincronização',
          description: response.error || response.message || 'Erro desconhecido',
          variant: 'destructive',
        });
        
        if (response.lock_id) {
          setCurrentLockId(response.lock_id);
        }
      }
    } catch (error) {
      console.error('Erro na sincronização completa:', error);
      setSyncing(false);
      setSyncType(null);
      toast({
        title: 'Erro na sincronização',
        description: error instanceof Error ? error.message : 'Erro de rede ou servidor',
        variant: 'destructive',
      });
    }
  };

  const handleCancelSync = async () => {
    if (!currentLockId && !currentSyncLogId) {
      toast({
        title: 'Nada para cancelar',
        description: 'Não há sincronização em andamento',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm('Deseja realmente cancelar a sincronização em andamento?')) {
      return;
    }

    try {
      const response = await bravoErpService.cancelSync(currentLockId || undefined, currentSyncLogId || undefined);
      
      if (response.success) {
        setSyncing(false);
        setSyncType(null);
        setCurrentSyncLogId(null);
        setCurrentLockId(null);
        setSyncStatus(null);
        setProgress(null);
        
        toast({
          title: 'Sincronização cancelada',
          description: response.message || 'A sincronização foi cancelada com sucesso',
        });

        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        toast({
          title: 'Erro ao cancelar',
          description: response.message || 'Não foi possível cancelar a sincronização',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao cancelar sincronização:', error);
      toast({
        title: 'Erro ao cancelar',
        description: 'Erro ao tentar cancelar a sincronização',
        variant: 'destructive',
      });
    }
  };

  const hasConfig = config && config.token;

  return (
    <div className="space-y-6">
      {/* Alerta se não há configuração */}
      {!hasConfig && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuração necessária</AlertTitle>
          <AlertDescription>
            Configure o token da API na aba Configuração antes de sincronizar.
          </AlertDescription>
        </Alert>
      )}

      {/* Link para Mapeamento */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 dark:text-green-100">
                  Configure o Mapeamento de Campos
                </h4>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Escolha quais campos do Bravo ERP serão importados e como serão salvos no seu
                  banco de dados
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões de Sincronização */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sincronização Rápida */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-orange-600" />
              Sincronização Rápida
            </CardTitle>
            <CardDescription>Importa até 50 produtos (recomendado para testes)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSyncRapida}
              disabled={syncing || !hasConfig || loadingConfig}
              size="lg"
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {syncing && syncType === 'rapida' ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Sincronizar 50
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Sincronização Completa */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-600" />
              Sincronização Completa
            </CardTitle>
            <CardDescription>
              Importa TODOS os produtos disponíveis (pode demorar vários minutos)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSyncCompleto}
              disabled={syncing || !hasConfig || loadingConfig}
              size="lg"
              className="w-full"
            >
              {syncing && syncType === 'completa' ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Database className="h-5 w-5 mr-2" />
                  Sincronizar TODOS
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Status da Sincronização */}
      {syncing && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Sincronização em Andamento
            </CardTitle>
            <CardDescription>
              {syncType === 'rapida'
                ? 'Importando até 50 produtos...'
                : 'Importando todos os produtos...'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progresso */}
            {progress?.progress && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso</span>
                  <span>
                    {progress.progress.progressPercentage?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${progress.progress.progressPercentage || 0}%`,
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    Produtos processados: {progress.progress.products_processed || 0}
                  </div>
                  <div>
                    Total: {progress.progress.total_produtos_bravo || 0}
                  </div>
                  <div>
                    Página atual: {progress.progress.current_page || 0}
                  </div>
                  <div>
                    Status: {progress.progress.status || 'processando'}
                  </div>
                </div>
              </div>
            )}

            {/* Status geral */}
            {syncStatus && (
              <div className="flex items-center gap-2">
                {syncStatus.isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm">Sincronização em execução...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Sincronização concluída</span>
                  </>
                )}
              </div>
            )}

            {/* Botão de Cancelar */}
            <Button
              onClick={handleCancelSync}
              variant="outline"
              className="w-full"
              disabled={!currentLockId && !currentSyncLogId}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar Sincronização
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Informações */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                Como funciona a sincronização
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>
                  • <strong>Sincronização Rápida:</strong> Importa até 50 produtos, ideal para
                  testes e verificações rápidas
                </li>
                <li>
                  • <strong>Sincronização Completa:</strong> Importa todos os produtos disponíveis
                  no Bravo ERP, pode levar vários minutos
                </li>
                <li>
                  • A sincronização é executada em segundo plano e pode ser acompanhada na aba
                  Logs
                </li>
                <li>• Você pode cancelar uma sincronização em andamento a qualquer momento</li>
                <li>
                  • Sincronizações interrompidas podem ser retomadas através da aba Logs
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
