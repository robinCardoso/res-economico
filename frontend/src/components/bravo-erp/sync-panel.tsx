'use client';

/**
 * ============================================
 * BRAVO ERP - PAINEL DE SINCRONIZAÇÃO
 * Componente para iniciar e acompanhar sincronizações
 * ============================================
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  
  // Refs para acessar valores atualizados dentro do polling (evitar problemas de closure)
  const currentSyncLogIdRef = useRef<string | null>(null);
  const currentLockIdRef = useRef<string | null>(null);
  
  // Atualizar refs quando os valores mudam
  useEffect(() => {
    currentSyncLogIdRef.current = currentSyncLogId;
  }, [currentSyncLogId]);
  
  useEffect(() => {
    currentLockIdRef.current = currentLockId;
  }, [currentLockId]);

  // Carregar configuração
  useEffect(() => {
    loadConfig();
  }, []);

  // Verificar se há sincronização em execução ao montar o componente
  // Isso permite recuperar o progresso mesmo após sair e voltar à página
  useEffect(() => {
    const checkRunningSync = async () => {
      try {
        const status = await bravoErpService.getStatus();
        
        // Se há sincronização rodando, recuperar estado
        if (status.isRunning && status.currentSync) {
          console.log('🔄 Sincronização em execução detectada ao carregar página:', status.currentSync);
          
          setSyncing(true);
          setSyncType(status.currentSync.type === 'complete' ? 'completa' : 'rapida');
          
          // O currentSync.id é o lockId (formato: sync_timestamp_random)
          // Vamos usar isso para buscar o progresso (o endpoint faz a conversão automática)
          const lockIdOrSyncLogId = status.currentSync.id;
          
          if (lockIdOrSyncLogId) {
            // Armazenar lockId
            setCurrentLockId(lockIdOrSyncLogId);
            
            // Tentar buscar progresso usando o lockId (o endpoint converte automaticamente)
            try {
              const progressResponse = await bravoErpService.getProgress(lockIdOrSyncLogId);
              if (progressResponse) {
                console.log('✅ Progresso recuperado ao carregar página:', progressResponse);
                
                // getProgress sempre retorna SyncProgress
                setProgress(progressResponse);
              }
              
              // Buscar logs para tentar obter o sync_log_id real (UUID)
              try {
                const logsResponse = await bravoErpService.getLogs({ limit: 5, status: 'running' });
                if (logsResponse.success && logsResponse.data?.logs && logsResponse.data.logs.length > 0) {
                  // Pegar o log mais recente em execução
                  const latestRunningLog = logsResponse.data.logs[0];
                  if (latestRunningLog.status === 'running' || latestRunningLog.status === 'processando') {
                    setCurrentSyncLogId(latestRunningLog.id);
                    console.log('✅ sync_log_id recuperado dos logs:', latestRunningLog.id);
                  }
                }
              } catch (logsError) {
                console.warn('⚠️ Não foi possível buscar logs para obter sync_log_id:', logsError);
                // Não é crítico, podemos continuar usando o lockId
              }
              
            } catch (progressError) {
              console.warn('⚠️ Não foi possível buscar progresso ao recuperar:', progressError);
              // Continuar mesmo sem progresso inicial, o polling vai buscar depois
            }
          }
          
          toast({
            title: 'Sincronização em execução detectada',
            description: 'Uma sincronização em andamento foi encontrada e será acompanhada automaticamente.',
          });
        } else {
          console.log('ℹ️ Nenhuma sincronização em execução ao carregar página');
        }
      } catch (error) {
        console.error('Erro ao verificar sincronização em execução:', error);
        // Não exibir erro ao usuário, apenas logar
      }
    };

    // Verificar após um pequeno delay para garantir que a página está montada
    const timeoutId = setTimeout(checkRunningSync, 500);
    
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executar apenas uma vez ao montar

  // Polling de status quando há sincronização em andamento
  useEffect(() => {
    if (!syncing) return;

    // Flag para evitar buscar logs múltiplas vezes
    let hasTriedToGetSyncLogId = false;

    // Iniciar polling imediatamente, mesmo sem sync_log_id
    // Isso permite buscar o status geral e identificar o sync_log_id em execução
    const interval = setInterval(async () => {
      try {
        // Buscar status geral primeiro
        const status = await bravoErpService.getStatus();
        setSyncStatus(status);

        // Se temos um lockId mas não syncLogId, tentar obter dos logs (apenas uma vez)
        let logIdToUse = currentSyncLogId;
        
        if (!logIdToUse && status.currentSync?.id && !hasTriedToGetSyncLogId) {
          // Marcar que já tentamos buscar
          hasTriedToGetSyncLogId = true;
          
          // Usar lockId do status como fallback temporário
          logIdToUse = status.currentSync.id;
          setCurrentLockId(status.currentSync.id);
          
          // Tentar buscar sync_log_id real dos logs (apenas uma vez)
          try {
            const logsResponse = await bravoErpService.getLogs({ limit: 3, status: 'running' });
            if (logsResponse.success && logsResponse.data?.logs && logsResponse.data.logs.length > 0) {
              const latestRunningLog = logsResponse.data.logs[0];
              if (latestRunningLog.status === 'running' || latestRunningLog.status === 'processando') {
                setCurrentSyncLogId(latestRunningLog.id);
                logIdToUse = latestRunningLog.id; // Usar o UUID real ao invés do lockId
                console.log('✅ sync_log_id atualizado durante polling:', latestRunningLog.id);
              }
            }
          } catch (logsError) {
            // Não é crítico, continuar com lockId
            console.warn('⚠️ Não foi possível buscar sync_log_id dos logs:', logsError);
          }
        } else if (!logIdToUse && status.currentSync?.id) {
          // Se já tentamos buscar antes, usar lockId diretamente
          logIdToUse = status.currentSync.id;
        }
        
        if (logIdToUse) {

          try {
            const progressResponse = await bravoErpService.getProgress(logIdToUse);
            
            // Log para debug
            console.log('📊 Progresso recebido:', {
              logId: logIdToUse,
              response: progressResponse,
            });
            
            // A resposta pode estar em progressResponse.progress ou progressResponse diretamente
            if (progressResponse && typeof progressResponse === 'object') {
              // getProgress sempre retorna SyncProgress
              console.log('✅ Progresso encontrado:', progressResponse);
              setProgress(progressResponse);
            }
          } catch (progressError) {
            // Se não conseguiu buscar progresso específico, usar status geral
            console.warn('⚠️ Não foi possível buscar progresso específico:', progressError);
            
            // Criar progresso básico a partir do status
            if (status.currentSync) {
              setProgress({
                success: true,
                progress: {
                  status: status.currentSync.status || 'processando',
                  current_step: null,
                  current_page: 0,
                  products_processed: 0,
                  total_produtos_bravo: 0,
                  progressPercentage: 0,
                  estimatedTimeRemaining: null,
                  details: {
                    pagesProcessed: 0,
                    totalPages: 0,
                  },
                },
              });
            }
          }
        } else if (status.isRunning) {
          // Ainda não temos sync_log_id, mas há sincronização rodando
          // Criar progresso básico
          setProgress({
            success: true,
            progress: {
              status: 'iniciando',
              current_step: null,
              current_page: 0,
              products_processed: 0,
              total_produtos_bravo: 0,
              progressPercentage: 0,
              estimatedTimeRemaining: null,
              details: {
                pagesProcessed: 0,
                totalPages: 0,
              },
            },
          });
        }

        // Verificar se completou
        if (status.isRunning === false && currentSyncLogIdRef.current) {
          // Última atualização de progresso antes de finalizar
          try {
            const finalProgress = await bravoErpService.getProgress(currentSyncLogIdRef.current);
            if (finalProgress) {
              if (finalProgress.progress) {
                setProgress(finalProgress);
              } else {
                // Se não tem progress, manter apenas success
                setProgress({
                  success: finalProgress.success,
                  progress: undefined,
                });
              }
            }
          } catch {
            // Ignorar erro na busca final
          }

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
      } catch (error) {
        console.error('Erro ao buscar status da sincronização:', error);
        // Não parar o polling por causa de erros temporários
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

      if (response.success) {
        // Se temos sync_log_id imediato, usar
        if (response.sync_log_id) {
          setCurrentSyncLogId(response.sync_log_id);
          setCurrentLockId(response.lock_id || null);

          if (onSyncStart && response.sync_log_id) {
            onSyncStart(response.sync_log_id);
          }
        } else if (response.lock_id) {
          // Se não temos sync_log_id mas temos lock_id, tentar buscar via logs
          setCurrentLockId(response.lock_id);
          
          // Tentar buscar sync_log_id dos logs após um breve delay
          setTimeout(async () => {
            try {
              const logsResponse = await bravoErpService.getLogs({ limit: 1, status: 'running' });
              if (logsResponse.data?.logs?.[0]?.id) {
                setCurrentSyncLogId(logsResponse.data.logs[0].id);
                if (onSyncStart) {
                  onSyncStart(logsResponse.data.logs[0].id);
                }
              }
            } catch (error) {
              console.warn('Não foi possível buscar sync_log_id dos logs:', error);
            }
          }, 2000);
        }

        toast({
          title: 'Sincronização Rápida iniciada',
          description: response.message || 'Os produtos estão sendo importados em segundo plano.',
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

      if (response.success) {
        // Se temos sync_log_id imediato, usar
        if (response.sync_log_id) {
          setCurrentSyncLogId(response.sync_log_id);
          setCurrentLockId(response.lock_id || null);

          if (onSyncStart && response.sync_log_id) {
            onSyncStart(response.sync_log_id);
          }

          // Buscar progresso imediatamente
          try {
            const initialProgress = await bravoErpService.getProgress(response.sync_log_id);
            if (initialProgress) {
              if (initialProgress.progress) {
                setProgress(initialProgress);
              } else {
                setProgress({
                  success: initialProgress.success,
                  progress: undefined,
                });
              }
            }
          } catch (error) {
            // Ignorar erro - o polling vai tentar novamente
            console.warn('Não foi possível buscar progresso inicial:', error);
          }
        } else if (response.lock_id) {
          // Se não temos sync_log_id mas temos lock_id, tentar buscar via logs
          setCurrentLockId(response.lock_id);
          
          // Tentar buscar sync_log_id dos logs após um breve delay
          setTimeout(async () => {
            try {
              const logsResponse = await bravoErpService.getLogs({ limit: 1, status: 'running' });
              if (logsResponse.data?.logs?.[0]?.id) {
                const logId = logsResponse.data.logs[0].id;
                setCurrentSyncLogId(logId);
                if (onSyncStart) {
                  onSyncStart(logId);
                }
                
                // Buscar progresso após obter o log_id
                try {
                  const initialProgress = await bravoErpService.getProgress(logId);
                  if (initialProgress) {
                    if (initialProgress.progress) {
                      setProgress(initialProgress);
                    } else {
                      // Se não tem progress, manter apenas success
                      setProgress({
                        success: initialProgress.success,
                        progress: undefined,
                      });
                    }
                  }
                } catch (error) {
                  console.warn('Não foi possível buscar progresso inicial:', error);
                }
              }
            } catch (error) {
              console.warn('Não foi possível buscar sync_log_id dos logs:', error);
            }
          }, 2000);
        }

        toast({
          title: 'Sincronização Completa iniciada',
          description: response.message || 'Este processo pode levar alguns minutos. Acompanhe o progresso na aba "Logs".',
        });
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
    // Verificar se há sincronização em andamento
    if (!syncing && !currentLockId && !currentSyncLogId) {
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
      // Log para debug
      console.log('🛑 Tentando cancelar sincronização:', {
        currentLockId,
        currentSyncLogId,
        syncing,
      });

      const response = await bravoErpService.cancelSync(currentLockId || undefined, currentSyncLogId || undefined);
      
      console.log('🛑 Resposta do cancelamento:', response);

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
      console.error('❌ Erro ao cancelar sincronização:', error);
      toast({
        title: 'Erro ao cancelar',
        description: error instanceof Error ? error.message : 'Erro ao tentar cancelar a sincronização',
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
            {/* Progresso Simplificado - Mostra apenas o que está acontecendo */}
            {syncing && (
              <div className="space-y-4">
                {/* O que está acontecendo agora */}
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span>
                    {progress?.progress?.current_step || 
                     'Iniciando sincronização...'}
                  </span>
                </div>

                {/* Informações principais em destaque */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Produtos Processados
                    </div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {progress?.progress?.products_processed ?? 
                       progress?.progress?.productsProcessed ?? 
                       0}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Página Atual
                    </div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {progress?.progress?.current_page ?? 
                       progress?.progress?.currentPage ?? 
                       0}
                    </div>
                  </div>
                </div>

                {/* Total encontrado (sempre mostra, mesmo se 0) */}
                <div className="text-sm text-muted-foreground pt-2 border-t">
                  Total de produtos encontrados:{' '}
                  <span className="font-semibold text-foreground">
                    {progress?.progress?.total_produtos_bravo ?? 
                     progress?.progress?.totalProducts ?? 
                     0}
                  </span>
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
