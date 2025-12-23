'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useEmpresas } from '@/hooks/use-empresas';
import { 
  useImportVendas, 
  useVendasMappingFields,
  useVendaColumnMappings,
  useCreateVendaColumnMapping,
  useUpdateVendaColumnMapping,
  useDeleteVendaColumnMapping,
  useVendasImportLogs,
  useDeleteImportLog,
} from '@/hooks/use-vendas';
import { vendasService } from '@/services/vendas.service';
import { ImportStepper } from '@/components/imports/import-stepper';
import { ImportHistoryTable } from '@/components/imports/import-history-table';
import { ImportProgressBar } from '@/components/vendas/import-progress-bar';
import type { MappingInfo } from '@/lib/imports/import-vendas-utils';
import {
    formatValueForPreview,
    convertValue as convertValueOriginal,
    processFile
} from '@/lib/imports/import-vendas-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DATA_TYPES = [
    { value: 'text', label: 'Texto' },
    { value: 'integer', label: 'Número (Inteiro)' },
    { value: 'decimal', label: 'Número (Decimal)' },
    { value: 'currency', label: 'Moeda (R$)' },
    { value: 'date', label: 'Data' },
];

export default function ImportarVendasPage() {
  const { data: empresas, isLoading: isLoadingEmpresas } = useEmpresas();
  const { data: mappingFields, isLoading: isLoadingFields } = useVendasMappingFields();
  const importMutation = useImportVendas();
  const [empresaId, setEmpresaId] = useState<string>('');
  const [currentImportLogId, setCurrentImportLogId] = useState<string | null>(null);
  
  // Hooks para mapeamentos no banco de dados
  const { data: columnMappings } = useVendaColumnMappings();
  const createMappingMutation = useCreateVendaColumnMapping();
  const updateMappingMutation = useUpdateVendaColumnMapping();
  const deleteMappingMutation = useDeleteVendaColumnMapping();
  
  // Buscar logs de importação para verificar se há importações em andamento
  const { data: importLogs, refetch: refetchLogs } = useVendasImportLogs();
  
  // Verificar se há importações em andamento ao carregar a página
  useEffect(() => {
    if (importLogs && importLogs.length > 0) {
      // Buscar a importação mais recente que ainda está em andamento (progresso < 100)
      // Ordenar por data de criação (mais recente primeiro) e pegar a primeira em andamento
      const importacaoEmAndamento = importLogs
        .filter((log) => log.progresso !== undefined && log.progresso < 100)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      if (importacaoEmAndamento && !currentImportLogId) {
        // Se encontrou uma importação em andamento e não há logId atual, definir
        // Usar setTimeout para evitar setState síncrono em effect
        setTimeout(() => {
          setCurrentImportLogId(importacaoEmAndamento.id);
          console.log(
            `🔄 Importação em andamento detectada: ${importacaoEmAndamento.id} (${importacaoEmAndamento.progresso}%)`
          );
        }, 0);
      } else if (!importacaoEmAndamento && currentImportLogId) {
        // Se não há importação em andamento mas há um logId, limpar
        // (importação foi concluída)
        setTimeout(() => {
          setCurrentImportLogId(null);
        }, 0);
      }
    }
  }, [importLogs, currentImportLogId]);
  
  // Atualizar logs periodicamente se houver importação em andamento
  useEffect(() => {
    if (currentImportLogId) {
      // Atualizar logs a cada 5 segundos enquanto houver importação em andamento
      const interval = setInterval(() => {
        refetchLogs();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [currentImportLogId, refetchLogs]);

  // Converter campos do backend para o formato esperado pelo ImportStepper
  const DATABASE_FIELDS = useMemo(() => {
    if (!mappingFields) return [];
    return mappingFields.map(field => ({
      value: field.value,
      label: field.label,
    }));
  }, [mappingFields]);

  // Criar mapeamentos iniciais baseados nos campos do backend
  const createInitialMappings = useCallback(() => {
    if (!mappingFields) return {};
    return mappingFields.reduce((acc, field) => {
      let defaultType: MappingInfo['dataType'] = 'text';
      const dataTypeMap: Record<string, MappingInfo['dataType']> = {
        'text': 'text',
        'integer': 'integer',
        'decimal': 'decimal',
        'currency': 'currency',
        'date': 'date',
      };
      defaultType = dataTypeMap[field.dataType] || 'text';
      acc[field.value] = { fileColumn: null, dataType: defaultType };
      return acc;
    }, {} as Record<string, MappingInfo>);
  }, [mappingFields]);

  // Campos obrigatórios baseados nos campos do backend
  const requiredFields = useMemo(() => {
    if (!mappingFields) return ['nfe', 'data', 'razaoSocial'];
    return mappingFields.filter(f => f.required).map(f => f.value);
  }, [mappingFields]);

  const handleImportAction = async (mode: 'import' | 'upsert', input: unknown): Promise<Record<string, unknown>> => {
    const inputData = input as {
      file: File;
      importDto: {
        empresaId: string;
        mappingName?: string;
        columnMapping?: Record<string, string>; // ImportStepper já passa como Record<string, string>
      };
      mappedData?: unknown[];
    };

    if (!inputData.file || !inputData.importDto.empresaId) {
      throw new Error('Arquivo e empresa são obrigatórios');
    }

    // Validar se o mapeamento foi fornecido
    if (!inputData.importDto.columnMapping || Object.keys(inputData.importDto.columnMapping).length === 0) {
      throw new Error('Mapeamento de colunas é obrigatório. Por favor, mapeie as colunas antes de importar.');
    }

    // Iniciar importação (a função retorna após concluir, mas o log é criado antes)
    // Vamos buscar o último log criado recentemente para mostrar progresso
    const timestampAntes = Date.now();
    
    const result = await importMutation.mutateAsync({
      file: inputData.file,
      importDto: {
        empresaId: inputData.importDto.empresaId,
        mappingName: inputData.importDto.mappingName,
        columnMapping: inputData.importDto.columnMapping, // Já está no formato correto
      },
    });
    
    // Definir o logId para mostrar a barra de progresso
    // Se a importação ainda está processando (progresso < 100), mostrar progresso
    if (result.logId) {
      setCurrentImportLogId(result.logId);
    } else {
      // Se não retornou logId, buscar o último log criado recentemente
      // (fallback caso o backend não retorne o logId)
      const logs = await vendasService.getImportLogs();
      const logRecente = logs.find(log => {
        const logTime = new Date(log.createdAt).getTime();
        return logTime >= timestampAntes - 5000; // Últimos 5 segundos
      });
      if (logRecente && logRecente.progresso !== undefined && logRecente.progresso < 100) {
        setCurrentImportLogId(logRecente.id);
      }
    }
    
    // Transformar o resultado para o formato esperado pelo ImportStepper
    const transformedResult: Record<string, unknown> = {
        success: result.success,
        message: result.message,
        totalRows: result.estatisticas?.totalLinhas || 0,
        successCount: result.estatisticas?.novos || 0, // Novos registros criados
        errorCount: result.estatisticas?.erroCount || 0,
        results: [],
        historyId: result.logId || null,
        details: {
          successCount: result.estatisticas?.novos || 0,
          errorCount: result.estatisticas?.erroCount || 0,
          existingCount: result.estatisticas?.duplicatas || 0, // Registros existentes (atualizados)
          errors: [],
        }
    };
    
    return transformedResult;
  };

  const dataTypes = DATA_TYPES.map(dt => ({
      value: dt.value as "text" | "integer" | "decimal" | "currency" | "date",
      label: dt.label
  }));
  
  const formatValue = useCallback((value: unknown, dbField: string, dataType: unknown): string => {
      const type = dataType as MappingInfo['dataType'];
      return formatValueForPreview(value, dbField, type);
  }, []);

  const convertValue = useCallback((value: unknown, dbField: string, dataType: unknown): unknown => {
      const type = dataType as MappingInfo['dataType'];
      return convertValueOriginal(value, type);
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Importar Vendas</h1>
          <p className="text-muted-foreground mt-2">
            Importe planilhas Excel com dados de vendas usando mapeamento de colunas
          </p>
        </div>
      </div>

      {/* Seleção de Empresa */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Importação</CardTitle>
          <CardDescription>
            Selecione a empresa para associar as vendas importadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="empresaId">Empresa *</Label>
            <Select
              value={empresaId}
              onValueChange={setEmpresaId}
              disabled={isLoadingEmpresas}
            >
              <SelectTrigger id="empresaId">
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent className="[&>div]:max-h-[17rem]">
                {isLoadingEmpresas ? (
                  <SelectItem value="loading" disabled>
                    Carregando...
                  </SelectItem>
                ) : (
                  empresas?.map((empresa) => {
                    const displayText = empresa.razaoSocial && empresa.filial
                      ? `${empresa.razaoSocial} - ${empresa.filial}`
                      : empresa.razaoSocial || empresa.filial || 'Empresa sem nome';
                    return (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {displayText}
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Todas as vendas do arquivo serão associadas a esta empresa
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Barra de Progresso da Importação */}
      {currentImportLogId && (
        <ImportProgressBar
          logId={currentImportLogId}
          onComplete={() => {
            // Quando a importação for concluída, limpar o logId após um delay
            setTimeout(() => {
              setCurrentImportLogId(null);
            }, 3000);
          }}
        />
      )}

      {/* ImportStepper com sistema completo de mapeamento */}
      {isLoadingFields ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Carregando campos de mapeamento...</p>
          </CardContent>
        </Card>
      ) : (
        <ImportStepper
          pageTitle="Importar Vendas"
          pageDescription="Siga os passos para importar suas vendas via planilha Excel."
          importType="vendas"
          databaseFields={DATABASE_FIELDS}
          dataTypes={dataTypes}
          createInitialMappings={createInitialMappings}
          importAction={handleImportAction}
          historyTableComponent={
            <ImportHistoryTable
              useImportLogs={useVendasImportLogs}
              useDeleteImportLog={useDeleteImportLog}
              labels={{
                entityName: 'venda',
                entityNamePlural: 'vendas',
                entityNameCapitalized: 'Vendas',
              }}
            />
          }
          requiredFields={requiredFields}
          formatValueForPreview={formatValue}
          convertValue={convertValue}
          processFile={processFile}
          empresaId={empresaId}
          useDatabaseMappings={true}
          onLoadMappings={async () => {
            // Converter mapeamentos do banco para o formato esperado pelo componente
            if (!columnMappings) return [];
            return columnMappings.map(mapping => {
              // Converter columnMapping (Record<string, string>) para MappingInfo
              const mappings: Record<string, MappingInfo> = {};
              Object.entries(mapping.columnMapping).forEach(([dbField, fileColumn]) => {
                // Encontrar o tipo de dados do campo
                const fieldInfo = mappingFields?.find(f => f.value === dbField);
                let dataType: MappingInfo['dataType'] = 'text';
                if (fieldInfo) {
                  const dataTypeMap: Record<string, MappingInfo['dataType']> = {
                    'text': 'text',
                    'integer': 'integer',
                    'decimal': 'decimal',
                    'currency': 'currency',
                    'date': 'date',
                  };
                  dataType = dataTypeMap[fieldInfo.dataType] || 'text';
                }
                mappings[dbField] = {
                  fileColumn: fileColumn || null,
                  dataType,
                };
              });
              
              // Converter filters do banco para o formato esperado (Filter[])
              type FilterCondition = 'is_empty' | 'is_not_empty' | 'equals' | 'not_equals' | 'contains';
              type Filter = {
                id: string;
                column: string;
                condition: FilterCondition;
                value: string;
              };
              
              const filters: Filter[] = ((mapping.filters as Array<{ id: string; column: string; condition: string; value?: string }>) || []).map(filter => ({
                id: filter.id,
                column: filter.column,
                condition: (['is_empty', 'is_not_empty', 'equals', 'not_equals', 'contains'].includes(filter.condition) 
                  ? filter.condition 
                  : 'equals') as FilterCondition,
                value: filter.value || '',
              }));
              
              return {
                id: mapping.id,
                name: mapping.nome,
                mappings,
                filters,
              };
            });
          }}
          onSaveMapping={async (name, mappings, filters) => {
            // Converter MappingInfo para columnMapping (Record<string, string>)
            const columnMapping: Record<string, string> = {};
            Object.entries(mappings).forEach(([dbField, mappingInfo]) => {
              if (mappingInfo.fileColumn) {
                columnMapping[dbField] = mappingInfo.fileColumn;
              }
            });
            
            const result = await createMappingMutation.mutateAsync({
              nome: name,
              columnMapping,
              filters: filters.length > 0 ? filters : undefined,
            });
            
            return { id: result.id };
          }}
          onUpdateMapping={async (id, mappings, filters) => {
            const columnMapping: Record<string, string> = {};
            Object.entries(mappings).forEach(([dbField, mappingInfo]) => {
              if (mappingInfo.fileColumn) {
                columnMapping[dbField] = mappingInfo.fileColumn;
              }
            });
            
            await updateMappingMutation.mutateAsync({
              id,
              dto: {
                columnMapping,
                filters: filters.length > 0 ? filters : undefined,
              },
            });
          }}
          onDeleteMapping={async (id: string) => {
            await deleteMappingMutation.mutateAsync(id);
          }}
        />
      )}
    </div>
  );
}
