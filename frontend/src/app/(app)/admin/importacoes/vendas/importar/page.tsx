'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useEmpresas } from '@/hooks/use-empresas';
import { useImportVendas, useVendasMappingFields } from '@/hooks/use-vendas';
import { ImportStepper } from '@/components/imports/import-stepper';
import { ImportHistoryTable } from '@/components/imports/import-history-table';
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

interface ImportResult extends Record<string, unknown> {
    message: string;
    success: boolean;
    totalRows: number;
    successCount: number;
    errorCount: number;
    results?: { status: 'success' | 'error'; message: string; lineNumber: number; docId: string }[];
    historyId: string | null;
    details?: {
        successCount: number;
        errorCount: number;
        existingCount: number;
        errors: string[];
    };
}

export default function ImportarVendasPage() {
  const router = useRouter();
  const { data: empresas, isLoading: isLoadingEmpresas } = useEmpresas();
  const { data: mappingFields, isLoading: isLoadingFields } = useVendasMappingFields();
  const importMutation = useImportVendas();
  const [empresaId, setEmpresaId] = useState<string>('');

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

    const result = await importMutation.mutateAsync({
      file: inputData.file,
      importDto: {
        empresaId: inputData.importDto.empresaId,
        mappingName: inputData.importDto.mappingName,
        columnMapping: inputData.importDto.columnMapping, // Já está no formato correto
      },
    });
    
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
              <SelectContent>
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
          historyTableComponent={<ImportHistoryTable />}
          requiredFields={requiredFields}
          formatValueForPreview={formatValue}
          convertValue={convertValue}
          processFile={processFile}
          empresaId={empresaId}
          onEmpresaIdChange={setEmpresaId}
        />
      )}
    </div>
  );
}
