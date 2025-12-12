'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, File, ChevronsRight, ArrowLeft, AlertTriangle, CheckCircle2, PlusCircle, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { RowData } from '@/lib/imports/import-vendas-utils';

interface ImportProgress {
    currentBatch: number;
    totalBatches: number;
    processedRecords: number;
    totalRecords: number;
    successCount: number;
    errorCount: number;
    isComplete: boolean;
    errors: string[];
}

type ImportStepperProps = {
    pageTitle: string;
    pageDescription: string;
    importType: 'vendas';
    databaseFields: { value: string; label: string }[];
    dataTypes: { value: 'text' | 'integer' | 'decimal' | 'currency' | 'date'; label: string }[];
    createInitialMappings: () => Record<string, MappingInfo>;
    importAction: (mode: 'import' | 'upsert', data: unknown) => Promise<Record<string, unknown>>;
    historyTableComponent?: React.ReactNode;
    requiredFields?: string[];
    formatValueForPreview: (value: unknown, dbField: string, dataType: unknown) => string;
    convertValue: (value: unknown, dbField: string, dataType: unknown) => unknown;
    processFile: (file: File, onProgress: (p: number) => void) => Promise<{ headers: string[], data: RowData[], headerRowIndex: number }>;
    supportsUpsert?: boolean;
    empresaId?: string;
    onEmpresaIdChange?: (empresaId: string) => void;
    // Props opcionais para usar banco de dados ao invés de localStorage
    useDatabaseMappings?: boolean;
    onLoadMappings?: () => Promise<Array<{ id: string; name: string; mappings: Record<string, MappingInfo>; filters: Filter[] }>>;
    onSaveMapping?: (name: string, mappings: Record<string, MappingInfo>, filters: Filter[]) => Promise<{ id: string }>;
    onDeleteMapping?: (id: string) => Promise<void>;
};

type MappingInfo = { fileColumn: string | null; dataType: 'text' | 'integer' | 'decimal' | 'currency' | 'date' };
type FilterCondition = 'is_empty' | 'is_not_empty' | 'equals' | 'not_equals' | 'contains';
type Filter = {
    id: string;
    column: string;
    condition: FilterCondition;
    value: string;
};

const FILTER_CONDITIONS: { value: FilterCondition; label: string, requiresValue: boolean }[] = [
    { value: 'is_not_empty', label: 'Não está vazio', requiresValue: false },
    { value: 'is_empty', label: 'Está vazio', requiresValue: false },
    { value: 'contains', label: 'Contém', requiresValue: true },
    { value: 'equals', label: 'É igual a', requiresValue: true },
    { value: 'not_equals', label: 'É diferente de', requiresValue: true },
];

export function ImportStepper({
    pageTitle,
    pageDescription,
    importType,
    databaseFields,
    dataTypes,
    createInitialMappings,
    importAction,
    historyTableComponent,
    requiredFields = [],
    formatValueForPreview,
    convertValue,
    processFile,
    supportsUpsert = false,
    empresaId,
    onEmpresaIdChange,
    useDatabaseMappings = false,
    onLoadMappings,
    onSaveMapping,
    onDeleteMapping,
}: ImportStepperProps) {
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [fileHeaders, setFileHeaders] = useState<string[]>([]);
    const [fileData, setFileData] = useState<RowData[]>([]);
    
    const [mappings, setMappings] = useState<Record<string, MappingInfo>>(createInitialMappings);
    const [savedMappings, setSavedMappings] = useState<Array<{id: string; name: string; mappings: Record<string, MappingInfo>; filters: Filter[]}>>([]);
    const [selectedMapping, setSelectedMapping] = useState<string>('');
    const [newMappingName, setNewMappingName] = useState('');
    const [isLoadingMappings, setIsLoadingMappings] = useState(false);
    
    const [filters, setFilters] = useState<Filter[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [importMode, setImportMode] = useState<'import' | 'upsert'>('import');
    const [importResult, setImportResult] = useState<Record<string, unknown> | null>(null);
    const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
    const [showEmptyFieldsDialog, setShowEmptyFieldsDialog] = useState(false);
    const [emptyFieldsIssues, setEmptyFieldsIssues] = useState<Array<{ rowIndex: number; fields: string[]; fileColumn: string; isRequired: boolean }>>([]);

    // Carregar mapeamentos salvos (do banco de dados ou localStorage)
    useEffect(() => {
        const loadMappings = async () => {
            setIsLoadingMappings(true);
            try {
                if (useDatabaseMappings && onLoadMappings) {
                    // Carregar do banco de dados
                    const mappings = await onLoadMappings();
                    setSavedMappings(mappings);
                } else {
                    // Carregar do localStorage (compatibilidade com outros tipos)
                    const storedMappings = localStorage.getItem(`importMappings_${importType}`);
                    if (storedMappings) {
                        setSavedMappings(JSON.parse(storedMappings));
                    }
                }
            } catch (error) {
                console.error('Erro ao carregar mapeamentos salvos:', error);
                toast({ 
                    variant: "destructive", 
                    title: "Erro", 
                    description: "Erro ao carregar mapeamentos salvos" 
                });
            } finally {
                setIsLoadingMappings(false);
            }
        };
        
        loadMappings();
    }, [importType, useDatabaseMappings, onLoadMappings, toast]);

    const uniqueColumnValues = useMemo(() => {
        const uniqueValues: Record<string, string[]> = {};
        if (fileData.length === 0) return uniqueValues;

        fileHeaders.forEach(header => {
            const values = new Set<string>();
            fileData.forEach(row => {
                const cellValue = row[header];
                const cleanCellValue = cellValue === null || cellValue === undefined ? '' : String(cellValue).trim();
                if (cleanCellValue) {
                    values.add(cleanCellValue);
                }
            });
            uniqueValues[header] = Array.from(values).sort();
        });
        return uniqueValues;
    }, [fileData, fileHeaders]);

    const isMappingValid = useMemo(() => {
        // Verificar apenas se todos os campos obrigatórios estão mapeados
        // Campos opcionais podem ficar sem mapeamento
        return requiredFields.every(field => {
            const mapping = mappings[field];
            return mapping && mapping.fileColumn !== null && mapping.fileColumn !== '';
        });
    }, [mappings, requiredFields]);

    const filteredData = useMemo(() => {
        if (filters.length === 0) return fileData;
        return fileData.filter(row => {
            return filters.every(filter => {
                if (!filter.column || !filter.condition) return true;
                const cellValue = row[filter.column];
                const cleanCellValue = cellValue === null || cellValue === undefined ? '' : String(cellValue).trim();

                switch (filter.condition) {
                    case 'is_empty': return cleanCellValue === '';
                    case 'is_not_empty': return cleanCellValue !== '';
                    case 'equals': return cleanCellValue === filter.value;
                    case 'not_equals': return cleanCellValue !== filter.value;
                    case 'contains': return cleanCellValue.includes(filter.value);
                    default: return true;
                }
            });
        });
    }, [fileData, filters]);

    const mappedData = useMemo(() => {
        if (filteredData.length === 0) return [];
        return filteredData.map(row => {
            const newRow: RowData = {};
            for (const dbField in mappings) {
                const mappingInfo = mappings[dbField];
                if (mappingInfo.fileColumn) {
                    const originalValue = row[mappingInfo.fileColumn];
                    newRow[dbField] = convertValue(originalValue, dbField, mappingInfo.dataType);
                }
            }
            return newRow;
        });
    }, [filteredData, mappings, convertValue]);

    const handleFileChange = async (selectedFile: File | null) => {
        if (!selectedFile) return;
        setFile(selectedFile);
        setIsProcessing(true);
        setProcessingProgress(0);
        try {
            const { headers, data } = await processFile(selectedFile, setProcessingProgress);
            setFileHeaders(headers);
            setFileData(data);
            setStep(2);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao processar arquivo';
            toast({ variant: "destructive", title: "Erro ao Ler Arquivo", description: errorMessage });
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleMappingChange = (dbField: string, fileColumn: string | null) => {
        setMappings(prev => ({ ...prev, [dbField]: { ...prev[dbField], fileColumn } }));
    };

    const handleDataTypeChange = (dbField: string, dataType: unknown) => {
        setMappings(prev => ({ ...prev, [dbField]: { ...prev[dbField], dataType: dataType as MappingInfo['dataType'] } }));
    };

    const handleNewMappingNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMappingName(e.target.value);
    }, []);

    const handleSaveMapping = async () => {
        if (!newMappingName) {
            toast({ variant: "destructive", title: "Erro", description: "Dê um nome ao seu mapeamento." });
            return;
        }

        try {
            if (useDatabaseMappings && onSaveMapping) {
                // Salvar no banco de dados
                const result = await onSaveMapping(newMappingName, mappings, filters);
                const newMapping = {
                    id: result.id,
                    name: newMappingName,
                    mappings,
                    filters
                };
                setSavedMappings([...savedMappings, newMapping]);
                toast({ title: "Sucesso", description: "Mapeamento e filtros salvos no banco de dados!" });
                setSelectedMapping(newMapping.id);
            } else {
                // Salvar no localStorage (compatibilidade com outros tipos)
                const newMapping = {
                    id: Date.now().toString(),
                    name: newMappingName,
                    mappings,
                    filters
                };
                const updatedMappings = [...savedMappings, newMapping];
                setSavedMappings(updatedMappings);
                localStorage.setItem(`importMappings_${importType}`, JSON.stringify(updatedMappings));
                toast({ title: "Sucesso", description: "Mapeamento e filtros salvos!" });
                setSelectedMapping(newMapping.id);
            }
            setNewMappingName('');
        } catch (error: unknown) {
            console.error('Erro ao salvar mapeamento:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            toast({ variant: "destructive", title: "Erro", description: `Erro ao salvar mapeamento: ${errorMessage}` });
        }
    };

    const handleLoadMapping = (id: string) => {
        const mapping = savedMappings.find(m => m.id === id);
        if (mapping) {
            setMappings(mapping.mappings || createInitialMappings());
            setFilters(mapping.filters || []);
            setSelectedMapping(id);
        }
    };
    
    const handleDeleteMapping = async (id: string) => {
        try {
            if (useDatabaseMappings && onDeleteMapping) {
                // Deletar do banco de dados
                await onDeleteMapping(id);
                const updatedMappings = savedMappings.filter(m => m.id !== id);
                setSavedMappings(updatedMappings);
                toast({ title: "Sucesso", description: "Mapeamento excluído do banco de dados." });
            } else {
                // Deletar do localStorage (compatibilidade com outros tipos)
                const updatedMappings = savedMappings.filter(m => m.id !== id);
                setSavedMappings(updatedMappings);
                localStorage.setItem(`importMappings_${importType}`, JSON.stringify(updatedMappings));
                toast({ title: "Sucesso", description: "Mapeamento excluído." });
            }
            
            if (selectedMapping === id) {
                setSelectedMapping('');
                setMappings(createInitialMappings());
                setFilters([]);
            }
        } catch (error: unknown) {
            console.error('Erro ao excluir mapeamento:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            toast({ variant: "destructive", title: "Erro", description: `Erro ao excluir mapeamento: ${errorMessage}` });
        }
    };

    // Valida campos vazios nos dados originais do Excel (antes do mapeamento)
    // Isso é mais eficiente e preciso, pois verifica os dados brutos
    // Valida APENAS campos obrigatórios (campos opcionais não são reportados)
    const validateEmptyFields = useMemo(() => {
        const issues: Array<{ rowIndex: number; fields: string[]; fileColumn: string; isRequired: boolean }> = [];
        
        // Só validar se temos mapeamentos e dados
        if (filteredData.length === 0 || requiredFields.length === 0) {
            return issues;
        }
        
        // Criar conjunto de campos obrigatórios para verificação rápida
        const requiredFieldsSet = new Set(requiredFields);
        
        filteredData.forEach((row, index) => {
            const emptyRequiredFields: Array<{ label: string; fileColumn: string }> = [];
            
            // Verificar APENAS campos obrigatórios mapeados
            requiredFields.forEach(field => {
                const mapping = mappings[field];
                if (mapping && mapping.fileColumn) {
                    // Pegar o valor original do Excel (antes da conversão)
                    // row contém os dados brutos do Excel, onde as chaves são os nomes das colunas do Excel
                    // mapping.fileColumn é o nome da coluna do Excel que foi mapeada para este campo
                    const originalValue = row[mapping.fileColumn];
                    
                    // Verificar se está vazio: null, undefined, string vazia, apenas espaços, ou NaN para números
                    let isEmpty = false;
                    
                    if (originalValue === null || originalValue === undefined) {
                        isEmpty = true;
                    } else if (typeof originalValue === 'string') {
                        isEmpty = originalValue.trim() === '';
                    } else if (typeof originalValue === 'number') {
                        // Para números, considerar vazio apenas se for NaN (0 é um valor válido)
                        isEmpty = isNaN(originalValue);
                    } else if (typeof originalValue === 'boolean') {
                        // Boolean nunca é vazio
                        isEmpty = false;
                    } else {
                        // Para outros tipos, converter para string e verificar
                        const strValue = String(originalValue).trim();
                        isEmpty = strValue === '' || strValue === 'null' || strValue === 'undefined';
                    }
                    
                    if (isEmpty) {
                        const fieldLabel = databaseFields.find(f => f.value === field)?.label || field;
                        emptyRequiredFields.push({
                            label: fieldLabel,
                            fileColumn: mapping.fileColumn
                        });
                    }
                }
            });
            
            // Adicionar apenas se houver campos obrigatórios vazios
            if (emptyRequiredFields.length > 0) {
                issues.push({
                    rowIndex: index + 1, // Linha 1-indexed para o usuário (linha do Excel)
                    fields: emptyRequiredFields.map(f => f.label),
                    fileColumn: emptyRequiredFields[0].fileColumn, // Primeira coluna vazia para referência
                    isRequired: true // Sempre true, pois só validamos obrigatórios
                });
            }
        });
        
        return issues;
    }, [filteredData, requiredFields, mappings, databaseFields]);
    
    // Estatísticas de validação para mostrar no Passo 2
    // Agora só mostra campos obrigatórios, então todas as issues são required
    const validationStats = useMemo(() => {
        return {
            totalIssues: validateEmptyFields.length,
            requiredIssues: validateEmptyFields.length, // Todas são obrigatórias agora
            optionalIssues: 0, // Não mostramos mais opcionais
            affectedRows: new Set(validateEmptyFields.map(i => i.rowIndex)).size,
            affectedRowsRequired: new Set(validateEmptyFields.map(i => i.rowIndex)).size,
        };
    }, [validateEmptyFields]);

    const handleNextToReview = () => {
        if (!empresaId) {
            toast({ variant: "destructive", title: "Empresa Obrigatória", description: "Selecione uma empresa antes de continuar." });
            return;
        }
        if (!isMappingValid) {
            toast({ variant: "destructive", title: "Mapeamento Incompleto", description: "Mapeie todos os campos obrigatórios antes de continuar." });
            return;
        }
        
        // Validar campos vazios (já calculado em useMemo)
        if (validateEmptyFields.length > 0) {
            setEmptyFieldsIssues(validateEmptyFields);
            setShowEmptyFieldsDialog(true);
            return;
        }
        
        // Se não houver problemas, avançar para revisão
        setStep(3);
    };
    
    const handleProceedWithEmptyFields = () => {
        setShowEmptyFieldsDialog(false);
        setStep(3);
    };
    
    const handleCancelReview = () => {
        setShowEmptyFieldsDialog(false);
        setEmptyFieldsIssues([]);
    };

    const handleImport = async () => {
        if (!file || !empresaId) return;
        setIsSubmitting(true);
        setImportResult(null);
        setImportProgress(null);
        
        try {
            // Converter mapeamento do formato do frontend para o formato do backend
            const columnMappingForBackend: Record<string, string> = {};
            for (const [dbField, mappingInfo] of Object.entries(mappings)) {
                if (mappingInfo.fileColumn) {
                    columnMappingForBackend[dbField] = mappingInfo.fileColumn;
                }
            }

            // Validar se há mapeamento antes de enviar
            if (Object.keys(columnMappingForBackend).length === 0) {
                toast({ variant: "destructive", title: "Mapeamento Obrigatório", description: "Por favor, mapeie pelo menos um campo antes de importar." });
                setIsSubmitting(false);
                return;
            }

            const result = await importAction(importMode, {
                file,
                importDto: {
                    empresaId,
                    mappingName: selectedMapping ? savedMappings.find(m => m.id === selectedMapping)?.name : newMappingName || undefined,
                    columnMapping: columnMappingForBackend, // Sempre enviar o mapeamento (não undefined)
                },
                mappedData, // Dados já mapeados para preview (não usado pelo backend, apenas para referência)
            });
            
            setImportResult(result);
            toast({ title: "Importação Finalizada", description: (result.message as string) || "Importação concluída" });
            setStep(4);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            toast({ variant: "destructive", title: "Erro na Importação", description: errorMessage });
            setImportResult({ 
                success: false, 
                message: errorMessage, 
                totalRows: filteredData.length,
                successCount: 0, 
                errorCount: filteredData.length
            });
            setStep(4);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const startNewImport = () => {
        setStep(1); 
        setFile(null); 
        setFileData([]); 
        setFileHeaders([]);
        setMappings(createInitialMappings()); 
        setSelectedMapping('');
        setImportResult(null); 
        setFilters([]);
        setImportProgress(null);
    }

    const addFilter = () => setFilters([...filters, { id: Date.now().toString(), column: '', condition: 'is_not_empty', value: '' }]);
    const removeFilter = (id: string) => setFilters(filters.filter(f => f.id !== id));
    const updateFilter = (id: string, newFilter: Partial<Filter>) => {
        setFilters(filters.map(f => f.id === id ? { ...f, ...newFilter } : f));
    };
    
    const renderStepContent = () => {
        switch (step) {
            case 1: return (
                <Card>
                    <CardHeader><CardTitle>{pageTitle} - Passo 1</CardTitle><CardDescription>{pageDescription}</CardDescription></CardHeader>
                    <CardContent>
                        <Tabs defaultValue="import">
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="import">Nova Importação</TabsTrigger>
                                {historyTableComponent && <TabsTrigger value="history">Histórico</TabsTrigger>}
                            </TabsList>
                            <TabsContent value="import">
                                <Label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-10 h-10 mb-3 text-primary animate-spin" />
                                                <p>Processando...</p>
                                                <Progress value={processingProgress} className="w-48 mt-2"/>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                                                <p><span className="font-semibold">Clique para enviar</span> ou arraste</p>
                                                <p className="text-xs text-muted-foreground">XLSX, XLS ou CSV</p>
                                            </>
                                        )}
                                    </div>
                                </Label>
                                <Input id="file-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e.target.files?.[0] || null)} disabled={isProcessing} accept=".xlsx,.xls,.csv" />
                            </TabsContent>
                            {historyTableComponent && <TabsContent value="history">{historyTableComponent}</TabsContent>}
                        </Tabs>
                    </CardContent>
                </Card>
            );
            case 2: return (
                 <Card>
                    <CardHeader><CardTitle>Passo 2: Mapeamento e Filtros</CardTitle><CardDescription>Associe colunas, defina tipos e crie filtros para limpar os dados.</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 border rounded-lg space-y-4">
                            <h3 className="font-semibold text-lg">Mapeamentos Salvos</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Select onValueChange={handleLoadMapping} value={selectedMapping}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={isLoadingMappings ? "Carregando..." : "Carregar mapeamento..."} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {savedMappings.map(mapping => (
                                            <SelectItem key={mapping.id} value={mapping.id}>
                                                {mapping.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="Salvar como..." 
                                        value={newMappingName} 
                                        onChange={handleNewMappingNameChange} 
                                    />
                                    <Button onClick={handleSaveMapping} disabled={!newMappingName}>Salvar</Button>
                                </div>
                                {selectedMapping && <Button variant="outline" className="border-red-500 text-red-500" onClick={() => handleDeleteMapping(selectedMapping)}>Excluir</Button>}
                            </div>
                        </div>
                        <div className='p-4 border rounded-lg space-y-2'>
                            <h3 className="font-semibold text-lg">Mapeamento de Colunas</h3>
                            <div className="grid gap-4 max-h-[40vh] overflow-y-auto p-2 mt-2">
                                {databaseFields.map(dbField => (
                                    <div key={dbField.value} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] gap-2 items-center">
                                        <Label>{dbField.label}{requiredFields.includes(dbField.value) && <span className="text-destructive">*</span>}</Label>
                                        <Select value={mappings[dbField.value]?.fileColumn || ''} onValueChange={(val) => handleMappingChange(dbField.value, val)}>
                                            <SelectTrigger><SelectValue placeholder="Coluna..." /></SelectTrigger>
                                            <SelectContent className="max-h-60">{fileHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <Select value={mappings[dbField.value]?.dataType || ''} onValueChange={(val) => handleDataTypeChange(dbField.value, val)}>
                                            <SelectTrigger><SelectValue placeholder="Tipo..." /></SelectTrigger>
                                            <SelectContent>{dataTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>
                        </div>
                         <div className="p-4 border rounded-lg space-y-4">
                            <div className='flex justify-between items-start'>
                                <div><h3 className="font-semibold text-lg">Filtros de Exclusão</h3><p className="text-sm text-muted-foreground">Ignore linhas que não cumprem TODAS as regras.</p></div>
                                <Button variant="outline" onClick={addFilter}><PlusCircle className="mr-2 h-4 w-4" />Adicionar</Button>
                            </div>
                        <div className="space-y-3">
                            {filters.map(filter => {
                                const condition = FILTER_CONDITIONS.find(c => c.value === filter.condition);
                                return (
                                    <div key={filter.id} className="grid grid-cols-[2fr_1.5fr_1.5fr_auto] gap-2 items-center p-2 rounded-md bg-muted/50">
                                        <Select value={filter.column} onValueChange={(val) => updateFilter(filter.id, { column: val, value: '' })}>
                                            <SelectTrigger><SelectValue placeholder="Coluna" /></SelectTrigger>
                                            <SelectContent className="max-h-60">{fileHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <Select value={filter.condition} onValueChange={(val: FilterCondition) => updateFilter(filter.id, { condition: val })}>
                                            <SelectTrigger><SelectValue placeholder="Condição" /></SelectTrigger>
                                            <SelectContent>{FILTER_CONDITIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                                        </Select>
                                        {condition?.requiresValue ? (
                                            <Select value={filter.value} onValueChange={(val) => updateFilter(filter.id, { value: val })}>
                                               <SelectTrigger><SelectValue placeholder="Valor" /></SelectTrigger>
                                               <SelectContent className="max-h-60">
                                                   {(uniqueColumnValues[filter.column] || []).map(val => <SelectItem key={val} value={val}>{val}</SelectItem>)}
                                                   {!(uniqueColumnValues[filter.column] || []).length && <SelectItem value="no-values" disabled>Coluna sem valores</SelectItem>}
                                               </SelectContent>
                                            </Select>
                                        ) : <div />}
                                        <Button variant="ghost" size="icon" onClick={() => removeFilter(filter.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </div>
                                );
                            })}
                        </div>
                        {filters.length > 0 && <div className="text-sm text-center p-2 bg-blue-50 text-blue-800 rounded-lg">{fileData.length} linhas no arquivo. {fileData.length - filteredData.length} removidas. {filteredData.length} serão importadas.</div>}
                        </div>
                        
                        {/* Aviso de campos vazios - apenas obrigatórios */}
                        {isMappingValid && validationStats.totalIssues > 0 && (
                            <div className="p-4 border border-red-500 bg-red-50 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0 text-red-600" />
                                    <div className="flex-1">
                                        <div className="font-semibold mb-2 text-red-800">
                                            Atenção: Campos Obrigatórios Vazios
                                        </div>
                                        <div className="text-sm space-y-2 text-red-700">
                                            {/* Resumo */}
                                            <div>
                                                <div className="mb-2">
                                                    <strong>{validationStats.affectedRowsRequired} linha(s)</strong> têm campos <strong>obrigatórios</strong> vazios.
                                                </div>
                                            </div>
                                            
                                            {/* Detalhes específicos - mostrar primeiras 10 linhas */}
                                            <div className="mt-3 pt-3 border-t border-red-300">
                                                <div className="font-medium mb-2">Detalhes por linha:</div>
                                                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                                                    {validateEmptyFields.slice(0, 10).map((issue) => (
                                                        <div 
                                                            key={`${issue.rowIndex}-${issue.fileColumn}`}
                                                            className="text-xs bg-white/70 p-2 rounded border border-red-200"
                                                        >
                                                            <div className="font-semibold text-red-800">
                                                                Linha {issue.rowIndex} do Excel:
                                                            </div>
                                                            <div className="ml-2 mt-0.5">
                                                                <span className="font-medium">Campo(s) vazio(s):</span>{' '}
                                                                <span className="font-mono font-semibold text-red-700">{issue.fields.join(', ')}</span>
                                                            </div>
                                                            <div className="ml-2 text-xs text-red-600 mt-0.5">
                                                                Coluna do Excel: <span className="font-mono">{issue.fileColumn}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {validateEmptyFields.length > 10 && (
                                                        <div className="text-xs text-red-600 italic pt-1">
                                                            ... e mais {validateEmptyFields.length - 10} linha(s) com campos obrigatórios vazios
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="mt-2 pt-2 border-t border-red-300 font-medium">
                                                Você poderá revisar todos os detalhes e decidir se deseja prosseguir antes de importar.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="justify-between">
                         <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4"/>Voltar</Button>
                         <Button onClick={handleNextToReview} disabled={!isMappingValid || !empresaId}>Revisar {filteredData.length} Linhas <ChevronsRight className="ml-2 h-4 w-4"/></Button>
                    </CardFooter>
                </Card>
            );
             case 3: return (
                <Card>
                    <CardHeader><CardTitle>Passo 3: Revisão</CardTitle><CardDescription>Amostra de {filteredData.length} linhas que serão importadas.</CardDescription></CardHeader>
                    <CardContent>
                         <div className="border rounded-md overflow-x-auto max-h-[60vh]">
                            <Table className="w-full" style={{ tableLayout: 'auto', width: '100%' }}>
                                <TableHeader>
                                    <TableRow>
                                        {databaseFields.filter(f => mappings[f.value]?.fileColumn).map(f => {
                                            // Larguras mínimas específicas para campos importantes
                                            const getMinWidth = (fieldValue: string) => {
                                                if (fieldValue === 'razaoSocial' || fieldValue === 'nomeFantasia') return 'min-w-[200px]';
                                                if (fieldValue === 'descricaoProduto') return 'min-w-[250px]';
                                                if (fieldValue === 'nfe' || fieldValue === 'referencia' || fieldValue === 'idDoc' || fieldValue === 'idProd') return 'min-w-[120px]';
                                                if (fieldValue === 'data' || fieldValue === 'dataVenda') return 'min-w-[110px]';
                                                if (fieldValue === 'valorUnit' || fieldValue === 'valorTotal' || fieldValue === 'qtd') return 'min-w-[100px]';
                                                return 'min-w-[100px]';
                                            };
                                            return (
                                                <TableHead 
                                                    key={f.value} 
                                                    className={`${getMinWidth(f.value)} whitespace-nowrap px-4 py-2 text-left font-medium`}
                                                >
                                                    {f.label}
                                                </TableHead>
                                            );
                                        })}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mappedData.slice(0, 10).map((row, i) => (
                                        <TableRow key={i}>
                                            {databaseFields.filter(f => mappings[f.value]?.fileColumn).map(f => {
                                                const getMinWidth = (fieldValue: string) => {
                                                    if (fieldValue === 'razaoSocial' || fieldValue === 'nomeFantasia') return 'min-w-[200px]';
                                                    if (fieldValue === 'descricaoProduto') return 'min-w-[250px]';
                                                    if (fieldValue === 'nfe' || fieldValue === 'referencia' || fieldValue === 'idDoc' || fieldValue === 'idProd') return 'min-w-[120px]';
                                                    if (fieldValue === 'data' || fieldValue === 'dataVenda') return 'min-w-[110px]';
                                                    if (fieldValue === 'valorUnit' || fieldValue === 'valorTotal' || fieldValue === 'qtd') return 'min-w-[100px]';
                                                    return 'min-w-[100px]';
                                                };
                                                return (
                                                    <TableCell 
                                                        key={f.value} 
                                                        className={`${getMinWidth(f.value)} whitespace-normal break-words px-4 py-2 align-top`}
                                                    >
                                                        <div className="max-w-none break-words">
                                                            {formatValueForPreview(row[f.value], f.value, mappings[f.value]?.dataType)}
                                                        </div>
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         </div>
                         {supportsUpsert && <div className="mt-4 flex items-center space-x-2"><Checkbox id="upsert-mode" onCheckedChange={(c) => setImportMode(c ? 'upsert' : 'import')} /><Label htmlFor="upsert-mode">Atualizar registros existentes</Label></div>}
                    </CardContent>
                     <CardFooter className="justify-between">
                        <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="mr-2 h-4 w-4"/>Voltar</Button>
                        <Button onClick={handleImport} disabled={isSubmitting || filteredData.length === 0 || !empresaId}>{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Importando...</> : `Importar ${filteredData.length} Registros`}</Button>
                    </CardFooter>
                </Card>
            );
             case 4: return (
                <Card>
                    <CardHeader><CardTitle>Passo 4: Resultado</CardTitle><CardDescription>Importação concluída.</CardDescription></CardHeader>
                    <CardContent className="text-center space-y-4">
                         {importResult?.success ? <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" /> : <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />}
                        <p className="text-lg font-medium">{importResult?.message as string}</p>
                        <div className="flex justify-center gap-4 text-sm">
                            <span>Total: {importResult?.totalRows as number}</span>
                            <span className="text-green-600 font-semibold">Novos: {importResult?.successCount as number}</span>
                            <span className="text-blue-600 font-semibold">Existentes: {(importResult?.details as { existingCount?: number })?.existingCount || 0}</span>
                            {(importResult?.errorCount as number) > 0 && <span className="text-destructive font-semibold">Erros: {importResult?.errorCount as number}</span>}
                        </div>
                    </CardContent>
                     <CardFooter><Button onClick={startNewImport} className="mx-auto">Nova Importação</Button></CardFooter>
                </Card>
            );
            default: return null;
        }
    };
    
    return (
        <div>
            {renderStepContent()}
            
            {/* Dialog para campos vazios */}
            <AlertDialog open={showEmptyFieldsDialog} onOpenChange={setShowEmptyFieldsDialog}>
                <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Campos Obrigatórios Vazios Encontrados
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Foram encontrados campos <strong>obrigatórios</strong> vazios em {emptyFieldsIssues.length} linha(s).
                            <br /><br />
                            Deseja prosseguir mesmo assim ou voltar para corrigir?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {emptyFieldsIssues.slice(0, 50).map((issue) => (
                                <div 
                                    key={`${issue.rowIndex}-${issue.fileColumn}`} 
                                    className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500"
                                >
                                    <div className="font-semibold text-sm mb-1 text-red-800">
                                        Linha {issue.rowIndex} do Excel:
                                    </div>
                                    <div className="text-sm text-red-700">
                                        <span className="font-medium">Campo(s) obrigatório(s) vazio(s):</span>{' '}
                                        <span className="font-semibold">{issue.fields.join(', ')}</span>
                                    </div>
                                    {issue.fileColumn && (
                                        <div className="text-xs text-red-600 mt-1">
                                            Coluna do Excel: <span className="font-mono">{issue.fileColumn}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {emptyFieldsIssues.length > 50 && (
                                <div className="text-sm text-muted-foreground text-center p-2 bg-yellow-50 rounded">
                                    ... e mais {emptyFieldsIssues.length - 50} linha(s) com campos vazios
                                </div>
                            )}
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancelReview}>
                            Voltar e Corrigir
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleProceedWithEmptyFields}
                            className="bg-yellow-500 hover:bg-yellow-600"
                        >
                            Prosseguir Mesmo Assim
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
