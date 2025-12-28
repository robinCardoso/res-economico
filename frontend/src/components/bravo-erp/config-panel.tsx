'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Save,
  Eye,
  EyeOff,
  Info,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { bravoErpService, type BravoConfig } from '@/services/bravo-erp.service';

export function ConfigPanel() {
  const { toast } = useToast();
  const [config, setConfig] = useState<BravoConfig>({
    baseUrl: 'https://v2.bravoerp.com.br',
    cliente: 'redeuniao_sc',
    email: '',
    senha: '',
    pdv: '1',
    ambiente: 'p',
    server: 'alpha',
    token: '',
    timeout: 30,
    verificar_duplicatas: true,
    usar_data_ult_modif: true,
    importar_excluidos: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await bravoErpService.getConfig();
      if (response.success && response.config) {
        setConfig({
          baseUrl: response.config.baseUrl || 'https://v2.bravoerp.com.br',
          cliente: response.config.cliente || 'redeuniao_sc',
          email: response.config.email || '',
          senha: response.config.senha || '',
          pdv: response.config.pdv || '1',
          ambiente: response.config.ambiente || 'p',
          server: response.config.server || 'alpha',
          token: response.config.token || '',
          timeout: response.config.timeout || 30,
          verificar_duplicatas: response.config.verificar_duplicatas ?? true,
          usar_data_ult_modif: response.config.usar_data_ult_modif ?? true,
          importar_excluidos: response.config.importar_excluidos ?? false,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a configuração',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config.baseUrl || !config.cliente) {
      toast({
        title: 'Erro de Validação',
        description: 'URL Base e Cliente são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const response = await bravoErpService.saveConfig(config);
      if (response.success) {
        toast({
          title: 'Sucesso',
          description: response.message || 'Configuração salva com sucesso',
        });
      } else {
        toast({
          title: 'Erro',
          description: response.error || 'Não foi possível salvar a configuração',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configuração',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const response = await bravoErpService.testConnection();
      if (response.success) {
        toast({
          title: 'Conexão Testada',
          description: response.message || 'Conexão estabelecida com sucesso',
        });
      } else {
        toast({
          title: 'Erro na Conexão',
          description: response.message || 'Não foi possível conectar',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao testar conexão',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isConfigValid = !!(config.baseUrl && config.cliente);

  return (
    <div className="space-y-3 text-sm">
      {/* Informações */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-3 pb-3 px-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                Informações Importantes
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-0.5">
                <li>• <strong>URL Base</strong> e <strong>Cliente</strong> são obrigatórios</li>
                <li>• <strong>Token da API</strong> é obrigatório para sincronização</li>
                <li>• Suas credenciais são armazenadas de forma segura no banco de dados</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dica sobre Nova Sincronização */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent className="pt-3 pb-3 px-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-green-900 dark:text-green-100">
                Para Nova Sincronização
              </h4>
              <p className="text-xs text-green-800 dark:text-green-200">
                Para usar a <strong>Sincronização de Produtos</strong>, você só precisa preencher:
                <br />
                ✅ URL Base + Cliente + <strong>Token da API</strong>
                <br />
                <span className="text-[10px]">Simples e direto!</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Configuração */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm">Credenciais do Bravo ERP</CardTitle>
          <CardDescription className="text-xs">
            Configure as credenciais e parâmetros de conexão
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4">
          {/* Linha 1: URL Base e Cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="baseUrl" className="text-xs">URL Base *</Label>
              <Input
                id="baseUrl"
                className="h-8 text-xs"
                value={config.baseUrl || ''}
                onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                placeholder="https://v2.bravoerp.com.br"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cliente" className="text-xs">Cliente *</Label>
              <Input
                id="cliente"
                className="h-8 text-xs"
                value={config.cliente || ''}
                onChange={(e) => setConfig({ ...config, cliente: e.target.value })}
                placeholder="redeuniao_sc"
              />
            </div>
          </div>

          {/* Linha 2: PDV, Ambiente e Servidor */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pdv" className="text-xs">PDV</Label>
              <Input
                id="pdv"
                className="h-8 text-xs"
                value={config.pdv || ''}
                onChange={(e) => setConfig({ ...config, pdv: e.target.value })}
                placeholder="1"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ambiente" className="text-xs">Ambiente</Label>
              <Select
                value={config.ambiente || 'p'}
                onValueChange={(value: 'p' | 'h') => setConfig({ ...config, ambiente: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="p">Produção (p)</SelectItem>
                  <SelectItem value="h">Homologação (h)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="server">Servidor</Label>
              <Input
                id="server"
                value={config.server || ''}
                onChange={(e) => setConfig({ ...config, server: e.target.value })}
                placeholder="alpha"
              />
            </div>
          </div>

          {/* Linha 3: Token e Timeout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="token" className="text-xs">Token da API (Obrigatório)</Label>
              <div className="relative">
                <Input
                  id="token"
                  className="h-8 text-xs pr-10"
                  type={showPassword ? 'text' : 'password'}
                  value={config.token || ''}
                  onChange={(e) => setConfig({ ...config, token: e.target.value })}
                  placeholder="Token para Machine_PublicApi_Produto"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-8 px-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                🔑 <strong>Obrigatório</strong> para sincronização de produtos
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="timeout" className="text-xs">Timeout (segundos)</Label>
              <Input
                id="timeout"
                className="h-8 text-xs"
                type="number"
                value={config.timeout || 30}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    timeout: parseInt(e.target.value, 10) || 30,
                  })
                }
                placeholder="30"
              />
            </div>
          </div>

          {/* Linha 4: Configurações Avançadas */}
          <div className="space-y-2.5 pt-3 border-t">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                Configurações Avançadas de Sincronização
              </Label>
              <p className="text-[10px] text-muted-foreground">
                Configure como o sistema deve verificar duplicatas e gerenciar sincronização
                incremental
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Verificação de Duplicatas */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="verificar_duplicatas"
                    checked={config.verificar_duplicatas ?? true}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, verificar_duplicatas: checked })
                    }
                  />
                  <Label htmlFor="verificar_duplicatas" className="text-xs font-medium">
                    Verificar Duplicatas (id_prod + referencia)
                  </Label>
                </div>
                <p className="text-[10px] text-muted-foreground ml-7">
                  ✅ <strong>Recomendado:</strong> Evita importar produtos duplicados baseado na
                  combinação id_prod + referencia
                </p>
              </div>

              {/* Usar Data Última Modificação */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="usar_data_ult_modif"
                    checked={config.usar_data_ult_modif ?? true}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, usar_data_ult_modif: checked })
                    }
                  />
                  <Label htmlFor="usar_data_ult_modif" className="text-xs font-medium">
                    Sincronização Incremental por Data
                  </Label>
                </div>
                <p className="text-[10px] text-muted-foreground ml-7">
                  🔄 <strong>Totalmente Automatizado:</strong> Primeira sincronização (tabela vazia)
                  busca todos os produtos até a data atual. Sincronizações posteriores buscam
                  produtos modificados após a data da última sincronização bem-sucedida.
                </p>
              </div>

              {/* Importar Produtos Excluídos */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="importar_excluidos"
                    checked={config.importar_excluidos ?? false}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, importar_excluidos: checked })
                    }
                  />
                  <Label htmlFor="importar_excluidos" className="text-xs font-medium">
                    Importar Produtos Excluídos
                  </Label>
                </div>
                <p className="text-[10px] text-muted-foreground ml-7">
                  📦 <strong>Importa todos os produtos:</strong> Quando ativado, importa todos os produtos do Bravo ERP, incluindo os que estão marcados como excluídos. Quando desativado, importa apenas produtos ativos (excluido = 'N').
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={saving || !isConfigValid}
          className="flex-1 h-8 text-xs"
          size="sm"
        >
          <Save className="h-3 w-3 mr-1.5" />
          {saving ? 'Salvando...' : 'Salvar Configuração'}
        </Button>
        <Button
          onClick={handleTestConnection}
          disabled={testing || !isConfigValid}
          variant="outline"
          className="h-8 text-xs"
          size="sm"
        >
          {testing ? (
            <>
              <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
              Testando...
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3 mr-1.5" />
              Testar Conexão
            </>
          )}
        </Button>
      </div>

      {/* Status */}
      <Card>
        <CardContent className="pt-2.5 pb-2.5 px-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold">Status da Configuração</h4>
              <p className="text-[10px] text-muted-foreground">
                Verifique se todos os campos estão preenchidos corretamente
              </p>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <Badge variant={config.baseUrl ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0.5">
                URL: {config.baseUrl ? '✓' : '✗'}
              </Badge>
              <Badge variant={config.cliente ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0.5">
                Cliente: {config.cliente ? '✓' : '✗'}
              </Badge>
              <Badge variant={config.token ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0.5">
                Token: {config.token ? '✓' : '✗'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
