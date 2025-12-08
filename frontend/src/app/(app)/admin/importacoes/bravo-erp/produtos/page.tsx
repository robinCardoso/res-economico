'use client';

/**
 * ============================================
 * BRAVO ERP - PÁGINA PRINCIPAL DE PRODUTOS
 * Gerenciamento completo de sincronização
 * ============================================
 */

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCard } from '@/components/bravo-erp/stats-card';
import { LogsPanel } from '@/components/bravo-erp/logs-panel';
import { ConfigPanel } from '@/components/bravo-erp/config-panel';
import { MappingPanel } from '@/components/bravo-erp/mapping-panel';
import { SyncPanel } from '@/components/bravo-erp/sync-panel';
import { bravoErpService, type SyncStats, type SyncLog, type ResumableSync } from '@/services/bravo-erp.service';
import { Package, Settings, RefreshCw, Map } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BravoERPProdutosPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [resumableSyncs, setResumableSyncs] = useState<ResumableSync[]>([]);

  useEffect(() => {
    loadStats();
    loadLogs();
    loadResumableSyncs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const data = await bravoErpService.getStats(false);
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as estatísticas',
        variant: 'destructive',
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const refreshStats = async () => {
    try {
      setLoadingStats(true);
      const data = await bravoErpService.getStats(true);
      setStats(data);
      toast({
        title: 'Atualizado',
        description: 'Estatísticas atualizadas com sucesso',
      });
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar as estatísticas',
        variant: 'destructive',
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const loadLogs = async () => {
    try {
      setLoadingLogs(true);
      const response = await bravoErpService.getLogs({ limit: 20 });
      if (response.success && response.data) {
        setLogs(response.data.logs || []);
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os logs',
        variant: 'destructive',
      });
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadResumableSyncs = async () => {
    try {
      const response = await bravoErpService.getResumableSyncs(10);
      if (response.success && response.data) {
        setResumableSyncs(response.data.resumable_syncs || []);
      }
    } catch (error) {
      console.error('Erro ao carregar sincronizações retomáveis:', error);
    }
  };

  const handleResumeSync = async (logId: string) => {
    try {
      const response = await bravoErpService.resumeSync(logId);
      if (response.success) {
        toast({
          title: 'Sucesso',
          description: response.message || 'Sincronização retomada',
        });
        await loadResumableSyncs();
        await loadLogs();
      } else {
        toast({
          title: 'Erro',
          description: response.message || 'Não foi possível retomar a sincronização',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao retomar sincronização:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao retomar sincronização',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Bravo ERP - Produtos</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie a sincronização de produtos do Bravo ERP
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard stats={stats} loading={loadingStats} onRefresh={refreshStats} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            Configuração
          </TabsTrigger>
          <TabsTrigger value="sync">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sincronização
          </TabsTrigger>
          <TabsTrigger value="mapping">
            <Map className="h-4 w-4 mr-2" />
            Mapeamento
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Package className="h-4 w-4 mr-2" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <ConfigPanel />
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <SyncPanel
            onSyncStart={() => {
              // Recarregar logs quando iniciar sincronização
              setTimeout(() => {
                loadLogs();
                loadStats();
              }, 2000);
            }}
            onSyncComplete={() => {
              // Recarregar tudo quando completar
              loadLogs();
              loadStats();
              loadResumableSyncs();
            }}
          />
        </TabsContent>

        <TabsContent value="mapping" className="space-y-4">
          <MappingPanel compact={false} />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <LogsPanel
            logs={logs}
            loading={loadingLogs}
            onRefresh={loadLogs}
            onResume={handleResumeSync}
            resumableSyncs={resumableSyncs}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
