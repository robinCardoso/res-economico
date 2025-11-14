'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, X, CheckCircle2 } from 'lucide-react';
import { maskCNPJ } from '@/lib/masks';
import { useEmpresas } from '@/hooks/use-empresas';
import { useTemplates } from '@/hooks/use-templates';
import { uploadsService } from '@/services/uploads.service';
import { validateExcelFile, type ValidationAlert } from '@/lib/excel-validator';

const uploadSchema = z.object({
  empresaId: z.string().min(1, 'Selecione uma empresa'),
  mes: z.number().min(1).max(12, 'Mês inválido'),
  ano: z.number().min(2020).max(2100, 'Ano inválido'),
  templateId: z.string().optional(),
});

type UploadFormData = z.infer<typeof uploadSchema>;

const meses = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const NovoUploadPage = () => {
  const router = useRouter();
  const { data: empresas, isLoading: isLoadingEmpresas } = useEmpresas();
  const { data: templates, isLoading: isLoadingTemplates } = useTemplates();
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<unknown[][]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationAlerts, setValidationAlerts] = useState<ValidationAlert[]>([]);
  const [showValidation, setShowValidation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear(),
    },
  });

  const empresaId = watch('empresaId');

  // Função para detectar quais colunas são mapeadas vs extras
  const detectColumnMapping = useCallback((headers: unknown[]): {
    mappedColumns: Set<number>;
    extraColumns: Set<number>;
  } => {
    const mappedColumns = new Set<number>();
    const extraColumns = new Set<number>();
    
    // Colunas esperadas (mapeadas)
    const expectedColumns = [
      'Classificação', 'classificação', 'classificacao',
      'Conta', 'conta',
      'Sub', 'sub', 'Sub Conta', 'sub conta',
      'Nome da conta contábil/C. Custo', 'Nome da conta', 'nome da conta',
      'Tipo conta', 'tipo conta',
      'Nível', 'nível', 'nivel',
      'Cta. título', 'Cta título', 'cta título',
      'Estab.', 'Estabelecimento', 'estab',
      'Saldo anterior', 'saldo anterior',
      'Débito', 'débito', 'debito',
      'Crédito', 'crédito', 'credito',
      'Saldo atual', 'saldo atual', 'Saldo final', 'saldo final',
    ];

    headers.forEach((header, index) => {
      if (!header) return;
      
      const headerStr = String(header).toLowerCase().trim();
      const isMapped = expectedColumns.some(expected => 
        headerStr.includes(expected.toLowerCase()) || 
        expected.toLowerCase().includes(headerStr)
      );
      
      if (isMapped) {
        mappedColumns.add(index);
      } else {
        // Colunas extras conhecidas que devem ser ignoradas
        const knownExtras = ['mês', 'mes', 'uf'];
        const isKnownExtra = knownExtras.some(extra => 
          headerStr === extra || headerStr.includes(extra)
        );
        
        if (isKnownExtra || headerStr.length > 0) {
          extraColumns.add(index);
        }
      }
    });

    return { mappedColumns, extraColumns };
  }, []);

  const handleFileSelect = useCallback((selectedFile: File) => {
    // Validar tipo de arquivo
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroEnabled.12',
    ];
    
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xls|xlsx)$/i)) {
      setError('Por favor, selecione um arquivo Excel (.xls ou .xlsx)');
      return;
    }

    // Validar tamanho (máximo 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('O arquivo deve ter no máximo 10MB');
      return;
    }

    setError(null);
    setFile(selectedFile);

    // Pré-visualizar arquivo e validar
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
          header: 1,
          defval: null, // null para células vazias
          raw: false 
        }) as unknown[][];

        // Detectar linha do cabeçalho (igual ao backend)
        // Procurar por palavras-chave comuns de cabeçalho de balancete
        const headerKeywords = [
          'classificação', 'classificacao', 'conta', 'nome', 'tipo', 'nível', 'nivel',
          'saldo', 'débito', 'debito', 'crédito', 'credito', 'título', 'titulo',
          'estabelecimento', 'estab'
        ];
        
        let headerRowIndex = 0;
        let bestMatch = 0;
        let bestMatchScore = 0;
        
        for (let i = 0; i < Math.min(10, jsonData.length); i++) {
          const row = jsonData[i];
          if (Array.isArray(row)) {
            // Verificar se a linha tem pelo menos 3 células com texto (não números)
            const textCells = row.filter((cell: unknown) => {
              if (cell === null || cell === undefined || cell === '') return false;
              const str = String(cell).trim();
              // Se for texto (não número puro) e tiver mais de 2 caracteres
              return isNaN(Number(str)) && str.length > 2;
            });
            
            if (textCells.length >= 3) {
              // Calcular score: quantas palavras-chave de cabeçalho aparecem nesta linha
              const rowText = textCells.map(cell => String(cell).toLowerCase()).join(' ');
              const matchScore = headerKeywords.filter(keyword => 
                rowText.includes(keyword)
              ).length;
              
              // Se encontrou uma linha com muitas palavras-chave de cabeçalho, é provavelmente o cabeçalho
              if (matchScore > bestMatchScore) {
                bestMatchScore = matchScore;
                bestMatch = i;
              }
              
              // Se encontrou pelo menos 3 palavras-chave, usar esta linha
              if (matchScore >= 3) {
                headerRowIndex = i;
                break;
              }
            }
          }
        }
        
        // Se não encontrou uma linha perfeita, usar a melhor correspondência
        if (headerRowIndex === 0 && bestMatchScore > 0) {
          headerRowIndex = bestMatch;
        }

        // Garantir que todas as linhas tenham o mesmo número de colunas
        // Usar o número de colunas do cabeçalho como referência
        const headerRow = jsonData[headerRowIndex] || [];
        const numColumns = headerRow.length;

        // Normalizar todas as linhas para ter exatamente o mesmo número de colunas do cabeçalho
        const normalizedData = jsonData.map((row) => {
          if (!Array.isArray(row)) {
            // Se não for array, criar array vazio com o número correto de colunas
            return new Array(numColumns).fill(null);
          }
          
          const normalized = [...row];
          
          // Preencher com null se a linha tiver menos colunas que o cabeçalho
          while (normalized.length < numColumns) {
            normalized.push(null);
          }
          
          // Truncar se tiver mais colunas que o cabeçalho (garantir alinhamento)
          return normalized.slice(0, numColumns);
        });

        // Criar preview: cabeçalho + primeiras 10 linhas de dados
        const previewData = [
          normalizedData[headerRowIndex], // Cabeçalho
          ...normalizedData.slice(headerRowIndex + 1, headerRowIndex + 11) // Primeiras 10 linhas de dados
        ];
        
        setPreview(previewData);

        // Validar arquivo completo
        const validation = validateExcelFile(workbook, []);
        setValidationAlerts(validation.alerts);
        setShowValidation(validation.alerts.length > 0);
        
        if (validation.alerts.length > 0) {
          // Filtrar alertas que não são apenas informativos (colunas extras conhecidas)
          const nonInfoAlerts = validation.alerts.filter(
            a => !(a.tipo === 'COLUNA_EXTRA' && a.severidade === 'BAIXA')
          );
          const criticalErrors = nonInfoAlerts.filter(a => a.severidade === 'ALTA').length;
          if (criticalErrors > 0) {
            setError(`⚠️ ${criticalErrors} erro(s) crítico(s) encontrado(s) na validação. Revise os alertas antes de enviar.`);
          } else {
            setError(null); // Apenas avisos informativos, não bloquear
          }
        } else {
          setError(null);
        }
      } catch {
        setError('Erro ao ler o arquivo Excel. Verifique se o arquivo está válido.');
        setFile(null);
        setValidationAlerts([]);
        setShowValidation(false);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const onSubmit = async (data: UploadFormData) => {
    if (!file) {
      setError('Por favor, selecione um arquivo');
      return;
    }

    // Verificar se há erros críticos na validação (excluindo alertas informativos de colunas extras)
    const criticalErrors = validationAlerts.filter(
      a => a.severidade === 'ALTA' && a.tipo !== 'COLUNA_EXTRA'
    );
    if (criticalErrors.length > 0) {
      setError(`Não é possível enviar o arquivo. Existem ${criticalErrors.length} erro(s) crítico(s) que precisam ser corrigidos.`);
      setShowValidation(true);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await uploadsService.create(file, {
        empresaId: data.empresaId,
        mes: data.mes,
        ano: data.ano,
        templateId: data.templateId,
      });
      
      router.push('/uploads');
    } catch (err: unknown) {
      console.error('Erro no upload:', err);
      const error = err as { 
        response?: { 
          data?: { 
            message?: string | string[];
            error?: string;
          }; 
          status?: number;
        }; 
        message?: string;
      };
      
      // Extrair mensagem de erro
      let errorMessage = 'Erro ao fazer upload. Tente novamente.';
      
      if (error.response?.data) {
        const data = error.response.data;
        if (data.message) {
          if (Array.isArray(data.message)) {
            errorMessage = data.message.join(', ');
          } else {
            errorMessage = data.message;
          }
        } else if (data.error) {
          errorMessage = data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const empresasList = Array.isArray(empresas) ? empresas : [];
  const templatesList = Array.isArray(templates) ? templates : [];

  return (
    <div className="space-y-8 max-w-full overflow-x-hidden">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Novo upload
          </h1>
          <p className="text-sm text-slate-500">
            Importe arquivos Excel e configure o período de referência.
          </p>
        </div>
        <Link
          href="/uploads"
          className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Voltar
        </Link>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Seleção de Empresa, Mês e Ano */}
        <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 sm:grid-cols-3">
          <div className="space-y-1">
            <label htmlFor="empresaId" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Empresa *
            </label>
            <select
              id="empresaId"
              {...register('empresaId')}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              disabled={isLoadingEmpresas}
            >
              <option value="">Selecione uma empresa</option>
              {empresasList.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.razaoSocial} {empresa.nomeFantasia ? `(${empresa.nomeFantasia})` : ''} - {maskCNPJ(empresa.cnpj)}
                </option>
              ))}
            </select>
            {errors.empresaId && (
              <p className="text-xs text-rose-600">{errors.empresaId.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="mes" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Mês *
            </label>
            <select
              id="mes"
              {...register('mes', { valueAsNumber: true })}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {meses.map((mes) => (
                <option key={mes.value} value={mes.value}>
                  {mes.label}
                </option>
              ))}
            </select>
            {errors.mes && (
              <p className="text-xs text-rose-600">{errors.mes.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="ano" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Ano *
            </label>
            <input
              id="ano"
              type="number"
              {...register('ano', { valueAsNumber: true })}
              min="2020"
              max="2100"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            {errors.ano && (
              <p className="text-xs text-rose-600">{errors.ano.message}</p>
            )}
          </div>
        </section>

        {/* Seleção de Template */}
        {empresaId && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <label htmlFor="templateId" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Template de importação (opcional)
            </label>
            <select
              id="templateId"
              {...register('templateId')}
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              disabled={isLoadingTemplates}
            >
              <option value="">Nenhum template (usar padrão)</option>
              {templatesList
                .filter((t) => !t.empresaId || t.empresaId === empresaId) // Templates globais (null) ou da empresa específica
                .map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.nome} {!template.empresaId ? '(Global)' : ''}
                  </option>
                ))}
            </select>
          </section>
        )}

        {/* Upload de Arquivo */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 max-w-full overflow-x-hidden">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Selecionar arquivo Excel
          </h2>

          {error && (
            <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`rounded-lg border-2 border-dashed p-8 text-center transition ${
                isDragging
                  ? 'border-sky-500 bg-sky-50 dark:bg-sky-500/10'
                  : 'border-slate-300 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/60'
              }`}
            >
              <Upload className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                Arraste o arquivo aqui ou clique para selecionar
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Formatos aceitos: .xls, .xlsx (máximo 10MB)
              </p>
              <input
                type="file"
                accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileInput}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-sky-400"
              >
                Selecionar arquivo
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreview([]);
                    setError(null);
                  }}
                  className="rounded-md p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Pré-visualização */}
              {preview.length > 0 && (() => {
                const { extraColumns } = Array.isArray(preview[0]) 
                  ? detectColumnMapping(preview[0])
                  : { extraColumns: new Set<number>() };
                const hasExtras = extraColumns.size > 0;
                
                return (
                  <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 max-w-full overflow-x-hidden">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          Pré-visualização (primeiras 10 linhas)
                        </p>
                        {hasExtras && (
                          <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <span>⚠️</span>
                            <span>Colunas extras serão ignoradas</span>
                          </span>
                        )}
                      </div>
                      {hasExtras && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Colunas destacadas em amarelo (Mês, UF, etc.) serão ignoradas no processamento. O sistema já coleta mês/ano via formulário.
                        </p>
                      )}
                    </div>
                  <div className="p-4 max-w-full overflow-x-hidden">
                    <div 
                      className="w-full max-w-full overflow-x-auto overflow-y-visible border border-slate-200 rounded-md dark:border-slate-700"
                      style={{ 
                        WebkitOverflowScrolling: 'touch'
                      }}
                    >
                      <table className="text-xs whitespace-nowrap" style={{ width: 'max-content', minWidth: '100%' }}>
                        <thead>
                          {preview.length > 0 && Array.isArray(preview[0]) && (() => {
                            const { mappedColumns, extraColumns } = detectColumnMapping(preview[0]);
                            return (
                              <tr className="border-b-2 border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-800">
                                {preview[0].map((cell: unknown, cellIndex: number) => {
                                  const isExtra = extraColumns.has(cellIndex);
                                  const isMapped = mappedColumns.has(cellIndex);
                                  return (
                                    <th
                                      key={cellIndex}
                                      className={`px-3 py-2 text-left text-xs font-semibold bg-slate-100 dark:bg-slate-800 ${
                                        isExtra
                                          ? 'text-amber-600 dark:text-amber-400 border-l-2 border-amber-400'
                                          : isMapped
                                            ? 'text-slate-700 dark:text-slate-300'
                                            : 'text-slate-500 dark:text-slate-400'
                                      }`}
                                      title={
                                        isExtra
                                          ? 'Coluna extra - será ignorada no processamento'
                                          : isMapped
                                            ? 'Coluna mapeada - será processada'
                                            : 'Coluna não identificada'
                                      }
                                    >
                                      <div className="flex items-center gap-1">
                                        {cell?.toString() || `Coluna ${cellIndex + 1}`}
                                        {isExtra && (
                                          <span className="text-[10px] text-amber-500" title="Esta coluna será ignorada no processamento">
                                            ⚠️
                                          </span>
                                        )}
                                      </div>
                                    </th>
                                  );
                                })}
                              </tr>
                            );
                          })()}
                        </thead>
                        <tbody>
                          {preview.slice(1).map((row, rowIndex) => {
                            const { extraColumns } = preview.length > 0 && Array.isArray(preview[0]) 
                              ? detectColumnMapping(preview[0])
                              : { extraColumns: new Set<number>() };
                            
                            return (
                              <tr key={rowIndex} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                {Array.isArray(row) &&
                                  row.map((cell: unknown, cellIndex: number) => {
                                    const isExtra = extraColumns.has(cellIndex);
                                    return (
                                      <td
                                        key={cellIndex}
                                        className={`px-3 py-2 ${
                                          isExtra
                                            ? 'text-amber-600 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-900/10'
                                            : 'text-slate-700 dark:text-slate-300'
                                        }`}
                                      >
                                        {cell?.toString() || ''}
                                      </td>
                                    );
                                  })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                );
              })()}

              {/* Alertas de Validação */}
              {showValidation && validationAlerts.length > 0 && (
                <div className="mt-4 rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Alertas de Validação ({validationAlerts.length})
                      </p>
                      <button
                        onClick={() => setShowValidation(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto p-4">
                    <div className="space-y-2">
                      {validationAlerts.map((alert, index) => {
                        // Estilização baseada no tipo e severidade
                        const bgColor =
                          alert.tipo === 'COLUNA_EXTRA'
                            ? alert.severidade === 'BAIXA'
                              ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                              : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
                            : alert.severidade === 'ALTA'
                              ? 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800'
                              : alert.severidade === 'MEDIA'
                                ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
                                : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
                        
                        const textColor =
                          alert.tipo === 'COLUNA_EXTRA'
                            ? alert.severidade === 'BAIXA'
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-amber-700 dark:text-amber-300'
                            : alert.severidade === 'ALTA'
                              ? 'text-rose-700 dark:text-rose-300'
                              : alert.severidade === 'MEDIA'
                                ? 'text-amber-700 dark:text-amber-300'
                                : 'text-blue-700 dark:text-blue-300';

                        return (
                          <div
                            key={index}
                            className={`rounded-md border px-3 py-2 text-sm ${bgColor} ${textColor}`}
                          >
                            <div className="flex items-start gap-2">
                              <span className="font-semibold">
                                {alert.tipo === 'COLUNA_EXTRA' && alert.severidade === 'BAIXA' 
                                  ? 'ℹ️' 
                                  : alert.severidade === 'ALTA'
                                    ? '⚠️'
                                    : '⚠️'
                                } {alert.tipo === 'COLUNA_EXTRA' ? 'Cabeçalho' : `Linha ${alert.linha}`}:
                              </span>
                              <span>{alert.mensagem}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Botões de ação */}
        <div className="flex justify-end gap-3">
          <Link
            href="/uploads"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={!file || isUploading}
            className="inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <span className="mr-2">Enviando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Enviar arquivo
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NovoUploadPage;
