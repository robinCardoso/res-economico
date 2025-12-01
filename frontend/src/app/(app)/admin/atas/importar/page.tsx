'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { atasService } from '@/services/atas.service';
import { ArrowLeft, Upload, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { TipoReuniao } from '@/types/api';

export default function ImportarAtaPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    tipoReuniao: '' as TipoReuniao | '',
    dataReuniao: '',
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!arquivo) {
        throw new Error('Selecione um arquivo para importar');
      }
      return atasService.importar(
        arquivo,
        formData.dataReuniao,
        formData.tipoReuniao || undefined,
      );
    },
    onSuccess: (ata) => {
      toast({
        title: 'Sucesso!',
        description: 'Arquivo importado e processado com sucesso. Redirecionando...',
      });
      // Redirecionar imediatamente para a página de detalhes da ata recém-criada
      router.push(`/admin/atas/${ata.id}`);
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao importar arquivo';
      
      // Verificar se é erro de conexão
      if (errorMessage.includes('conexão') || errorMessage.includes('conectar')) {
        toast({
          variant: 'destructive',
          title: 'Erro de Conexão',
          description: `${errorMessage}\n\nVerifique:\n1. Backend está rodando na porta 3000\n2. Backend está escutando em 0.0.0.0\n3. Firewall não está bloqueando\n4. NEXT_PUBLIC_API_URL configurado`,
          duration: 10000,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: errorMessage,
        });
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    importMutation.mutate();
  };

  const handleFileSelect = (file: File | null) => {
    if (file) {
      const extensao = file.name.split('.').pop()?.toLowerCase();
      if (extensao !== 'txt' && extensao !== 'pdf') {
        toast({
          variant: 'destructive',
          title: 'Formato inválido',
          description: 'Apenas arquivos TXT e PDF são suportados.',
        });
        return;
      }
      setArquivo(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/admin/atas">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Importar Ata Existente</h1>
        <p className="text-muted-foreground mt-2">
          Importe atas que já foram realizadas no passado
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Importar Ata por Arquivo</CardTitle>
          <CardDescription>
            Faça upload de arquivo TXT ou PDF
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dataReuniao">Data da Reunião *</Label>
                <Input
                  id="dataReuniao"
                  type="date"
                  value={formData.dataReuniao}
                  onChange={(e) =>
                    setFormData({ ...formData, dataReuniao: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="tipoReuniao">Tipo de Reunião</Label>
                <Select
                  value={formData.tipoReuniao}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipoReuniao: value as TipoReuniao })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASSEMBLEIA_GERAL">Assembleia Geral</SelectItem>
                    <SelectItem value="CONSELHO_DIRETOR">Conselho Diretor</SelectItem>
                    <SelectItem value="REUNIAO_ORDINARIA">Reunião Ordinária</SelectItem>
                    <SelectItem value="REUNIAO_EXTRAORDINARIA">Reunião Extraordinária</SelectItem>
                    <SelectItem value="COMISSAO">Comissão</SelectItem>
                    <SelectItem value="OUTRO">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="arquivo">Arquivo *</Label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer
                  transition-all duration-200
                  ${isDragging 
                    ? 'border-primary bg-primary/5 scale-[1.02]' 
                    : 'border-input hover:border-primary/50 hover:bg-muted/50'
                  }
                  ${arquivo ? 'border-primary/50 bg-primary/5' : ''}
                `}
              >
                <input
                  ref={fileInputRef}
                  id="arquivo"
                  type="file"
                  accept=".txt,.pdf"
                  onChange={handleInputChange}
                  className="hidden"
                  required
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  {arquivo ? (
                    <>
                      <FileText className="h-8 w-8 text-primary" />
                      <p className="text-sm font-medium text-foreground">
                        {arquivo.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(arquivo.size / 1024).toFixed(2)} KB
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Clique para trocar o arquivo
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className={`h-8 w-8 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                      <p className={`text-sm font-medium transition-colors ${isDragging ? 'text-primary' : 'text-foreground'}`}>
                        {isDragging ? 'Solte o arquivo aqui' : 'Clique ou arraste o arquivo aqui'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Formatos suportados: TXT, PDF
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={importMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={importMutation.isPending || !arquivo}>
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar Arquivo
                  </>
                )}
              </Button>
            </div>

            {/* Mensagem de Progresso */}
            {importMutation.isPending && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Processando arquivo e extraindo informações com IA...
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Isso pode levar alguns segundos. Por favor, aguarde...
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

