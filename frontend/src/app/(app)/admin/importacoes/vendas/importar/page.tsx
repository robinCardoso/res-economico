'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useEmpresas } from '@/hooks/use-empresas';
import { useImportVendas } from '@/hooks/use-vendas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

const importSchema = z.object({
  empresaId: z.string().min(1, 'Selecione uma empresa'),
  mappingName: z.string().optional(),
});

type ImportFormData = z.infer<typeof importSchema>;

export default function ImportarVendasPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: empresas, isLoading: isLoadingEmpresas } = useEmpresas();
  const importMutation = useImportVendas();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<unknown[][]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    estatisticas?: {
      totalLinhas: number;
      sucessoCount: number;
      erroCount: number;
      produtosNaoEncontrados: number;
      duplicatas: number;
      novos: number;
    };
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ImportFormData>({
    resolver: zodResolver(importSchema),
  });

  const empresaId = watch('empresaId');

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
    setImportResult(null);

    // Pré-visualizar arquivo
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
          header: 1,
          defval: null,
          raw: false,
        }) as unknown[][];

        // Mostrar primeiras 10 linhas como preview
        setPreview(jsonData.slice(0, 10));
      } catch (err) {
        console.error('Erro ao ler arquivo:', err);
        setError('Erro ao ler o arquivo. Verifique se é um arquivo Excel válido.');
        setFile(null);
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFileSelect(selectedFile);
      }
    },
    [handleFileSelect],
  );

  const onSubmit = async (data: ImportFormData) => {
    if (!file) {
      setError('Selecione um arquivo para importar');
      return;
    }

    setError(null);
    setImportResult(null);

    try {
      const result = await importMutation.mutateAsync({
        file,
        importDto: {
          empresaId: data.empresaId,
          mappingName: data.mappingName,
        },
      });

      setImportResult({
        success: result.success,
        message: result.message,
        estatisticas: result.estatisticas,
      });

      if (result.success) {
        toast({
          title: 'Importação concluída',
          description: result.message,
        });
        // Redirecionar após 2 segundos
        setTimeout(() => {
          router.push('/admin/importacoes/vendas');
        }, 2000);
      } else {
        toast({
          title: 'Erro na importação',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao importar';
      setError(errorMessage);
      toast({
        title: 'Erro na importação',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Importar Vendas</h1>
          <p className="text-muted-foreground mt-2">
            Importe planilhas Excel com dados de vendas
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Seleção de Empresa */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Importação</CardTitle>
            <CardDescription>
              Selecione a empresa e configure a importação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="empresaId">Empresa *</Label>
              <Select
                value={empresaId || undefined}
                onValueChange={(value) => {
                  setValue('empresaId', value);
                }}
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
                    empresas?.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {empresa.nomeFantasia || empresa.razaoSocial}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Todas as vendas do arquivo serão associadas a esta empresa
              </p>
              {errors.empresaId && (
                <p className="text-sm text-destructive">{errors.empresaId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mappingName">Nome do Mapeamento (Opcional)</Label>
              <Input
                id="mappingName"
                {...register('mappingName')}
                placeholder="Ex: Mapeamento Padrão"
              />
            </div>
          </CardContent>
        </Card>

        {/* Upload de Arquivo */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Arquivo</CardTitle>
            <CardDescription>
              Faça upload de uma planilha Excel (.xls ou .xlsx) com os dados de vendas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
            >
              {file ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <FileSpreadsheet className="h-8 w-8" />
                    <span className="font-medium">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFile(null);
                        setPreview([]);
                        setImportResult(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-primary hover:underline">
                        Clique para selecionar
                      </span>{' '}
                      ou arraste o arquivo aqui
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".xls,.xlsx"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Formatos suportados: .xls, .xlsx (máximo 10MB)
                  </p>
                </div>
              )}
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        {preview.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pré-visualização</CardTitle>
              <CardDescription>
                Primeiras linhas do arquivo (máximo 10 linhas)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    {preview[0] && (
                      <TableRow>
                        {preview[0].map((cell, index) => (
                          <TableHead key={index} className="min-w-[100px]">
                            {String(cell || '')}
                          </TableHead>
                        ))}
                      </TableRow>
                    )}
                  </TableHeader>
                  <TableBody>
                    {preview.slice(1).map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <TableCell key={cellIndex}>
                            {cell !== null && cell !== undefined ? String(cell) : ''}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultado da Importação */}
        {importResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {importResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
                Resultado da Importação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={importResult.success ? 'text-green-600' : 'text-destructive'}>
                {importResult.message}
              </p>

              {importResult.estatisticas && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Linhas</p>
                    <p className="text-2xl font-bold">{importResult.estatisticas.totalLinhas}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sucesso</p>
                    <p className="text-2xl font-bold text-green-600">
                      {importResult.estatisticas.sucessoCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Erros</p>
                    <p className="text-2xl font-bold text-destructive">
                      {importResult.estatisticas.erroCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Novos Registros</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {importResult.estatisticas.novos}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duplicatas</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {importResult.estatisticas.duplicatas}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Produtos Não Encontrados</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {importResult.estatisticas.produtosNaoEncontrados}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Botões de Ação */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/importacoes/vendas')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!file || !empresaId || importMutation.isPending}
          >
            {importMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              'Importar Vendas'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
