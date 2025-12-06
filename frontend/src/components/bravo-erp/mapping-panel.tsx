'use client';

/**
 * ============================================
 * BRAVO ERP - PAINEL DE MAPEAMENTO
 * Componente reutilizável para mapeamento de campos
 * ============================================
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Save,
  Plus,
  Trash2,
  ArrowRight,
  Info,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Eye,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  bravoErpService,
  type CampoMapeamento,
  type CampoInterno,
  type CampoBravo,
} from '@/services/bravo-erp.service';
import { useRouter } from 'next/navigation';
import { MappingPreviewDialog } from './mapping-preview-dialog';
import { Input } from '@/components/ui/input';

// ============================================
// INTERFACES
// ============================================

interface MappingPanelProps {
  showBackButton?: boolean;
  compact?: boolean;
}

export function MappingPanel({ showBackButton = false, compact = false }: MappingPanelProps) {
  const { toast } = useToast();
  const router = useRouter();
  
  const [mapeamentos, setMapeamentos] = useState<CampoMapeamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // MELHORIAS: Campos dinâmicos
  const [camposInternos, setCamposInternos] = useState<CampoInterno[]>([]);
  const [camposBravo, setCamposBravo] = useState<CampoBravo[]>([]);
  const [loadingCamposInternos, setLoadingCamposInternos] = useState(false);
  const [loadingCamposBravo, setLoadingCamposBravo] = useState(false);
  const [ultimaAtualizacaoBravo, setUltimaAtualizacaoBravo] = useState<Date | null>(null);
  
  // Preview
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Busca/filtro
  const [buscaBravo, setBuscaBravo] = useState('');
  const [buscaInterno, setBuscaInterno] = useState('');

  // ============================================
  // FUNÇÕES - CAMPOS DINÂMICOS
  // ============================================

  const loadCamposInternos = async () => {
    setLoadingCamposInternos(true);
    try {
      const result = await bravoErpService.getInternalFields();
      if (result.success && result.fields) {
        setCamposInternos(result.fields);
      } else {
        toast({
          title: 'Erro ao carregar campos',
          description: result.error || 'Não foi possível carregar os campos da tabela',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar campos internos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar campos da tabela',
        variant: 'destructive',
      });
    } finally {
      setLoadingCamposInternos(false);
    }
  };

  const loadCamposBravo = async () => {
    setLoadingCamposBravo(true);
    try {
      const result = await bravoErpService.getBravoFields();
      if (result.success && result.fields) {
        setCamposBravo(result.fields);
        setUltimaAtualizacaoBravo(new Date());
        toast({
          title: 'Campos atualizados',
          description: `${result.fields.length} campos carregados do Bravo ERP`,
        });
      } else {
        toast({
          title: 'Erro ao carregar campos',
          description: result.error || 'Não foi possível carregar os campos do Bravo ERP',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar campos do Bravo ERP:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao carregar campos do Bravo ERP',
        variant: 'destructive',
      });
    } finally {
      setLoadingCamposBravo(false);
    }
  };

  // ============================================
  // FUNÇÕES - MAPEAMENTOS
  // ============================================

  const loadMapeamentos = async () => {
    setLoading(true);
    try {
      const result = await bravoErpService.getMapeamentos();
      if (result.success && result.mapeamentos) {
        setMapeamentos(result.mapeamentos || []);
      } else {
        toast({
          title: 'Erro ao carregar',
          description: result.error || 'Não foi possível carregar os mapeamentos',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar mapeamentos:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar os mapeamentos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (mapeamentos.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Adicione pelo menos um mapeamento antes de salvar',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const result = await bravoErpService.saveMapeamentos(mapeamentos);
      if (result.success) {
        toast({
          title: 'Mapeamento salvo',
          description: result.message || 'Configuração de campos salva com sucesso',
        });
        await loadMapeamentos();
      } else {
        toast({
          title: 'Erro ao salvar',
          description: result.error || 'Erro desconhecido',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro ao salvar',
        description: error instanceof Error ? error.message : 'Erro de rede ou servidor',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addMapeamento = () => {
    const novoMapeamento: CampoMapeamento = {
      campo_bravo: '',
      campo_interno: '',
      tipo_transformacao: 'direto',
      ativo: true,
      ordem: mapeamentos.length + 1,
    };
    setMapeamentos([...mapeamentos, novoMapeamento]);
  };

  const removeMapeamento = (index: number) => {
    setMapeamentos(mapeamentos.filter((_, i) => i !== index));
  };

  const updateMapeamento = (index: number, field: keyof CampoMapeamento, value: any) => {
    const updated = [...mapeamentos];
    updated[index] = { ...updated[index], [field]: value };
    setMapeamentos(updated);
  };

  const loadMapeamentoPadrao = () => {
    const padrao: CampoMapeamento[] = [
      // Campos obrigatórios
      { campo_bravo: 'ref', campo_interno: 'referencia', tipo_transformacao: 'direto', ativo: true, ordem: 1 },
      
      // Campos básicos
      { campo_bravo: 'titulo', campo_interno: 'descricao', tipo_transformacao: 'direto', ativo: true, ordem: 2 },
      { campo_bravo: 'excluido', campo_interno: 'ativo', tipo_transformacao: 'boolean_invertido', ativo: true, ordem: 3 },
      
      // Campos de classificação
      { campo_bravo: 'id_marca', campo_interno: 'marca', tipo_transformacao: 'direto', ativo: true, ordem: 4 },
      { campo_bravo: 'id_produto_categoria', campo_interno: 'grupo', tipo_transformacao: 'direto', ativo: true, ordem: 5 },
      
      // Campos diretos
      { campo_bravo: 'gtin.gtin', campo_interno: 'gtin', tipo_transformacao: 'direto', ativo: true, ordem: 6 },
      { campo_bravo: 'ncm', campo_interno: 'ncm', tipo_transformacao: 'direto', ativo: true, ordem: 7 },
      { campo_bravo: 'cest', campo_interno: 'cest', tipo_transformacao: 'direto', ativo: true, ordem: 8 },
      { campo_bravo: '_data_ult_modif', campo_interno: 'dataUltModif', tipo_transformacao: 'datetime', ativo: true, ordem: 9 },
      
      // Campos para metadata
      { campo_bravo: 'id_produto', campo_interno: 'metadata->bravo_id', tipo_transformacao: 'json', ativo: true, ordem: 10 },
      { campo_bravo: 'tipo', campo_interno: 'metadata->tipo_produto', tipo_transformacao: 'json', ativo: true, ordem: 11 },
      { campo_bravo: 'venda_preco_base_val', campo_interno: 'metadata->preco_venda', tipo_transformacao: 'json', ativo: true, ordem: 12 },
    ];
    setMapeamentos(padrao);
    toast({
      title: 'Mapeamento padrão carregado',
      description: 'Mapeamento baseado na estrutura da tabela produtos',
    });
  };

  // ============================================
  // FILTROS
  // ============================================

  const camposBravoFiltrados = camposBravo.filter(
    (campo) =>
      !buscaBravo ||
      campo.nome.toLowerCase().includes(buscaBravo.toLowerCase()) ||
      campo.caminho.toLowerCase().includes(buscaBravo.toLowerCase()),
  );

  const camposInternosFiltrados = camposInternos.filter(
    (campo) =>
      !buscaInterno ||
      campo.nome.toLowerCase().includes(buscaInterno.toLowerCase()) ||
      campo.descricao.toLowerCase().includes(buscaInterno.toLowerCase()),
  );

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    loadMapeamentos();
    loadCamposInternos();
    // Não carregar campos do Bravo automaticamente (requer API configurada)
  }, []);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Informações */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">Como funciona</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• <strong>Campo Bravo</strong>: Nome do campo na API do Bravo ERP</li>
                <li>• <strong>Campo Interno</strong>: Campo na tabela `produtos` ou `metadata` do seu banco</li>
                <li>• <strong>Transformação</strong>: Como converter o dado (direto, decimal, JSON, etc)</li>
                <li>• Campos mapeados para `metadata-&gt;` são salvos no campo JSONB</li>
                <li>• Os campos são carregados dinamicamente do banco e da API do Bravo ERP</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {!compact && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Campos Disponíveis do Bravo */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Campos Disponíveis (Bravo ERP)</CardTitle>
                  <CardDescription>
                    {camposBravo.length > 0
                      ? `${camposBravo.length} campos carregados dinamicamente`
                      : 'Campos retornados pela API do Bravo ERP'}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadCamposBravo}
                  disabled={loadingCamposBravo}
                >
                  {loadingCamposBravo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingCamposBravo ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
                  <p>Carregando campos do Bravo ERP...</p>
                </div>
              ) : camposBravo.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">Nenhum campo carregado</p>
                  <p className="text-xs mb-4">Clique no botão de atualizar para carregar os campos da API</p>
                  <Button variant="outline" size="sm" onClick={loadCamposBravo}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Carregar Campos
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    placeholder="Buscar campo..."
                    value={buscaBravo}
                    onChange={(e) => setBuscaBravo(e.target.value)}
                    className="mb-3"
                  />
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {camposBravoFiltrados.map((campo, index) => (
                      <div key={index} className="p-2 border rounded text-sm">
                        <div className="flex items-center justify-between">
                          <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {campo.nome}
                          </code>
                          <Badge variant="secondary" className="text-xs">
                            {campo.tipo}
                          </Badge>
                        </div>
                        {campo.valor_exemplo !== null && campo.valor_exemplo !== undefined && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Exemplo: {String(campo.valor_exemplo).substring(0, 50)}
                            {String(campo.valor_exemplo).length > 50 ? '...' : ''}
                          </p>
                        )}
                      </div>
                    ))}
                    {camposBravoFiltrados.length === 0 && buscaBravo && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum campo encontrado
                      </p>
                    )}
                  </div>
                  {ultimaAtualizacaoBravo && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Atualizado há {Math.round((Date.now() - ultimaAtualizacaoBravo.getTime()) / 1000 / 60)} min
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Campos do Sistema Interno */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Campos do Sistema</CardTitle>
              <CardDescription>
                {camposInternos.length > 0
                  ? `${camposInternos.length} campos da tabela produtos`
                  : 'Campos disponíveis na tabela `produtos`'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCamposInternos ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
                  <p>Carregando campos...</p>
                </div>
              ) : (
                <>
                  <Input
                    placeholder="Buscar campo..."
                    value={buscaInterno}
                    onChange={(e) => setBuscaInterno(e.target.value)}
                    className="mb-3"
                  />
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {camposInternosFiltrados.map((campo, index) => (
                      <div key={index} className="p-2 border rounded text-sm">
                        <div className="flex items-center justify-between">
                          <code className="font-mono text-xs bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                            {campo.nome}
                          </code>
                          <div className="flex gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {campo.tipo}
                            </Badge>
                            {campo.obrigatorio && (
                              <Badge variant="destructive" className="text-xs">
                                obrigatório
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{campo.descricao}</p>
                      </div>
                    ))}
                    {camposInternosFiltrados.length === 0 && buscaInterno && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum campo encontrado
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mapeamentos Ativos */}
      <Card>
        <CardHeader>
          <CardTitle>Mapeamentos Configurados</CardTitle>
          <CardDescription>
            Configure os mapeamentos entre os campos do Bravo ERP e seu sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" />
              <p>Carregando mapeamentos...</p>
            </div>
          ) : mapeamentos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum mapeamento configurado</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={loadMapeamentoPadrao}>
                Carregar Mapeamento Padrão
              </Button>
            </div>
          ) : (
            <>
              {mapeamentos.map((mapeamento, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-center p-2 border rounded-md bg-gray-50/30 dark:bg-gray-800/30 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {/* Campo Bravo */}
                  <div className="col-span-3">
                    <Label className="text-xs font-medium">Campo Bravo ERP</Label>
                    <Select
                      value={mapeamento.campo_bravo}
                      onValueChange={(value) => updateMapeamento(index, 'campo_bravo', value)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {camposBravo.map((campo) => (
                          <SelectItem key={campo.caminho || campo.nome} value={campo.caminho || campo.nome}>
                            {campo.nome} ({campo.tipo})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Seta */}
                  <div className="col-span-1 flex items-center justify-center">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </div>

                  {/* Campo Interno */}
                  <div className="col-span-3">
                    <Label className="text-xs font-medium">Campo Sistema</Label>
                    <Select
                      value={mapeamento.campo_interno}
                      onValueChange={(value) => updateMapeamento(index, 'campo_interno', value)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {camposInternos.map((campo) => (
                          <SelectItem key={campo.nome} value={campo.nome}>
                            {campo.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Transformação */}
                  <div className="col-span-3">
                    <Label className="text-xs font-medium">Transformação</Label>
                    <Select
                      value={mapeamento.tipo_transformacao}
                      onValueChange={(value) =>
                        updateMapeamento(index, 'tipo_transformacao', value)
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direto">Direto</SelectItem>
                        <SelectItem value="decimal">Decimal</SelectItem>
                        <SelectItem value="datetime">Data/Hora</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                        <SelectItem value="boolean_invertido">Boolean Invertido</SelectItem>
                        <SelectItem value="nested_object">Objeto Aninhado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ações */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <Checkbox
                      checked={mapeamento.ativo}
                      onCheckedChange={(checked) =>
                        updateMapeamento(index, 'ativo', checked as boolean)
                      }
                      className="scale-75"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => removeMapeamento(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Botão Adicionar */}
              <Button variant="outline" size="sm" onClick={addMapeamento} className="w-full mt-3">
                <Plus className="h-3 w-3 mr-2" />
                Adicionar Mapeamento
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex gap-3">
        {mapeamentos.length === 0 && (
          <Button variant="outline" onClick={loadMapeamentoPadrao} className="flex-1">
            Usar Mapeamento Padrão
          </Button>
        )}
        {mapeamentos.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setPreviewOpen(true)}
            className="flex-1"
          >
            <Eye className="h-3 w-3 mr-2" />
            Ver Preview
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={saving || mapeamentos.length === 0}
          className="flex-1"
        >
          <Save className="h-3 w-3 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Mapeamentos'}
        </Button>
      </div>

      {/* Status */}
      <Card>
        <CardContent className="pt-3 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Status dos Mapeamentos</h4>
              <p className="text-sm text-muted-foreground">
                {mapeamentos.filter((m) => m.ativo).length} de {mapeamentos.length} mapeamentos
                ativos
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant={mapeamentos.length > 0 ? 'default' : 'secondary'}>
                {mapeamentos.length} campos mapeados
              </Badge>
              <Badge
                variant={
                  mapeamentos.some((m) => m.campo_interno === 'referencia')
                    ? 'default'
                    : 'destructive'
                }
              >
                {mapeamentos.some((m) => m.campo_interno === 'referencia') ? '✓' : '✗'} referencia
              </Badge>
              {camposBravo.length > 0 && (
                <Badge variant="default" className="text-xs">
                  ✓ Dinâmico
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <MappingPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        mapeamentos={mapeamentos}
      />
    </div>
  );
}
