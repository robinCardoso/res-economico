'use client';

/**
 * ============================================
 * BRAVO ERP - DIALOG DE PREVIEW DE MAPEAMENTO
 * Componente para visualizar preview do mapeamento
 * ============================================
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Check, X, Copy, Download, AlertCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  bravoErpService,
  type CampoMapeamento,
  type MappingPreviewResponse,
} from '@/services/bravo-erp.service';

interface MappingPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapeamentos: CampoMapeamento[];
}

export function MappingPreviewDialog({
  open,
  onOpenChange,
  mapeamentos,
}: MappingPreviewDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<MappingPreviewResponse | null>(null);
  const [filtro, setFiltro] = useState<'todos' | 'mapeados' | 'nao_mapeados'>('todos');

  useEffect(() => {
    if (open && mapeamentos.length > 0) {
      loadPreview();
    }
  }, [open, mapeamentos]);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const result = await bravoErpService.previewMapping(mapeamentos);
      if (result.success) {
        setPreviewData(result);
      } else {
        toast({
          title: 'Erro ao gerar preview',
          description: result.error || 'Não foi possível gerar o preview',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao gerar preview',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (value instanceof Date) return value.toLocaleString('pt-BR');
    return String(value);
  };

  const copyJSON = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast({
      title: 'Copiado!',
      description: 'JSON copiado para a área de transferência',
    });
  };

  const getProductIdentifier = (original: any): string => {
    const ref = original?.ref || original?.referencia || '';
    const titulo = original?.titulo || '';
    return ref && titulo ? `${ref} - ${titulo}` : ref || titulo || 'Produto';
  };

  // Função para obter valor de campo aninhado
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((o, key) => {
      if (o && typeof o === 'object') {
        return o[key];
      }
      return undefined;
    }, obj);
  };

  const mappedFieldsSet = new Set(
    previewData?.mapping_details?.map((d) => d.campo_bravo) || [],
  );

  // Usar unmapped_fields do backend + campos mapeados para ter lista completa
  const allFieldsSet = new Set<string>();
  previewData?.mapping_details?.forEach((d) => allFieldsSet.add(d.campo_bravo));
  previewData?.unmapped_fields?.forEach((f) => allFieldsSet.add(f.campo));
  
  const allFields = Array.from(allFieldsSet);

  const filteredFields =
    filtro === 'mapeados'
      ? allFields.filter((f) => mappedFieldsSet.has(f))
      : filtro === 'nao_mapeados'
        ? allFields.filter((f) => !mappedFieldsSet.has(f))
        : allFields;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview do Mapeamento</DialogTitle>
          <DialogDescription>
            Visualize como ficará o produto após aplicar os mapeamentos configurados
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Gerando preview...</p>
          </div>
        ) : previewData?.success ? (
          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            {/* Identificação do Produto */}
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm font-medium">
                  Produto de Referência:{' '}
                  <span className="text-primary">
                    {getProductIdentifier(previewData.original)}
                  </span>
                </p>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="resumido" className="flex-1 flex flex-col overflow-hidden">
              <TabsList>
                <TabsTrigger value="resumido">Resumido</TabsTrigger>
                <TabsTrigger value="completo">Completo</TabsTrigger>
              </TabsList>

              {/* Preview Resumido */}
              <TabsContent value="resumido" className="flex-1 overflow-hidden flex flex-col">
                <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
                  {/* Dados Originais */}
                  <Card className="overflow-hidden flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-lg">Dados Originais (Bravo ERP)</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
                      <div className="space-y-3">
                        {previewData.mapping_details?.map((detail, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                {detail.campo_bravo}
                              </code>
                              <Badge variant={detail.sucesso ? 'default' : 'destructive'}>
                                {detail.sucesso ? (
                                  <Check className="h-3 w-3 mr-1" />
                                ) : (
                                  <X className="h-3 w-3 mr-1" />
                                )}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground break-words">
                              {formatValue(detail.valor_original)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dados Mapeados */}
                  <Card className="overflow-hidden flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-lg">Dados Mapeados (Sistema)</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
                      <div className="space-y-3">
                        {previewData.mapping_details?.map((detail, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <code className="text-xs font-mono bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                                {detail.campo_interno}
                              </code>
                              <Badge variant={detail.sucesso ? 'default' : 'destructive'}>
                                {detail.transformacao}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground break-words">
                              {formatValue(detail.valor_mapeado)}
                            </p>
                            {detail.erro && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                Erro: {detail.erro}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Preview Completo */}
              <TabsContent value="completo" className="flex-1 overflow-hidden flex flex-col">
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={filtro === 'todos' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFiltro('todos')}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={filtro === 'mapeados' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFiltro('mapeados')}
                  >
                    Mapeados
                  </Button>
                  <Button
                    variant={filtro === 'nao_mapeados' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFiltro('nao_mapeados')}
                  >
                    Não Mapeados
                  </Button>
                </div>

                <Card className="flex-1 overflow-hidden flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg">Todos os Campos</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto">
                    <div className="space-y-2">
                      {filteredFields.map((campoPath) => {
                        const isMapped = mappedFieldsSet.has(campoPath);
                        
                        // Buscar valor original
                        const valorOriginal = previewData.original
                          ? getNestedValue(previewData.original, campoPath)
                          : undefined;
                        
                        // Buscar detalhes do mapeamento
                        const mappingDetail = previewData.mapping_details?.find(
                          (d) => d.campo_bravo === campoPath,
                        );
                        
                        // Buscar em unmapped_fields
                        const unmappedField = previewData.unmapped_fields?.find(
                          (f) => f.campo === campoPath,
                        );

                        const valor = valorOriginal !== undefined ? valorOriginal : unmappedField?.valor;

                        return (
                          <div
                            key={campoPath}
                            className="p-3 border rounded-lg grid grid-cols-3 gap-4 items-start"
                          >
                            <div>
                              <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                {campoPath}
                              </code>
                              <p className="text-xs text-muted-foreground mt-2 break-words">
                                {formatValue(valor)}
                              </p>
                              {unmappedField && (
                                <Badge variant="secondary" className="mt-1 text-xs">
                                  {unmappedField.tipo}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center justify-center">
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              {mappingDetail ? (
                                <>
                                  <code className="text-xs font-mono bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                                    {mappingDetail.campo_interno}
                                  </code>
                                  <p className="text-xs text-muted-foreground mt-2 break-words">
                                    {formatValue(mappingDetail.valor_mapeado)}
                                  </p>
                                  <Badge
                                    variant={mappingDetail.sucesso ? 'default' : 'destructive'}
                                    className="mt-1 text-xs"
                                  >
                                    {mappingDetail.sucesso ? (
                                      <Check className="h-3 w-3 mr-1" />
                                    ) : (
                                      <X className="h-3 w-3 mr-1" />
                                    )}
                                    {mappingDetail.transformacao}
                                  </Badge>
                                </>
                              ) : (
                                <p className="text-xs text-muted-foreground italic">
                                  (não mapeado)
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {filteredFields.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum campo encontrado
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Ações */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => copyJSON(previewData.mapped)}
                size="sm"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar JSON
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
                Fechar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <AlertCircle className="h-8 w-8 text-destructive mr-3" />
            <p className="text-muted-foreground">
              {previewData?.error || 'Erro ao carregar preview'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
