'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { atasService } from '@/services/atas.service';
import { ArrowLeft, Upload, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tipoAta, setTipoAta] = useState<'FINALIZADA' | 'RASCUNHO' | 'EM_PROCESSO'>('FINALIZADA');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    tipoReuniao: '' as TipoReuniao | '',
    dataReuniao: '',
    modeloAtaId: '',
    dataAssinatura: '',
    observacoes: '',
  });

  // Carregar modelos de ata quando tipo de reunião for selecionado
  const { data: modelos } = useQuery({
    queryKey: ['modelos-ata', formData.tipoReuniao],
    queryFn: () => atasService.listarModelos({
      tipoReuniao: formData.tipoReuniao,
      ativo: true,
    }) as Promise<Array<{ id: string; nome: string; descricao?: string }>>,
    enabled: !!formData.tipoReuniao && tipoAta === 'RASCUNHO',
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!arquivo) {
        throw new Error('Selecione um arquivo para importar');
      }
      if (tipoAta === 'RASCUNHO') {
        if (!formData.tipoReuniao) {
          throw new Error('Selecione o tipo de reunião para rascunhos');
        }
        const resultado = await atasService.importarRascunho(
          arquivo,
          formData.dataReuniao,
          formData.tipoReuniao,
          formData.modeloAtaId || undefined,
        );
        return resultado;
      } else if (tipoAta === 'EM_PROCESSO') {
        if (!formData.tipoReuniao) {
          throw new Error('Selecione o tipo de reunião');
        }
        const ata = await atasService.importarEmProcesso(
          arquivo,
          formData.dataReuniao,
          formData.tipoReuniao,
          formData.dataAssinatura || undefined,
          formData.observacoes || undefined,
        );
        return { ata };
      } else {
        const ata = await atasService.importar(
          arquivo,
          formData.dataReuniao,
          formData.tipoReuniao || undefined,
        );
        return { ata };
      }
    },
    onSuccess: (result) => {
      const ata = result.ata;
      
      toast({
        title: 'Sucesso!',
        description: tipoAta === 'RASCUNHO' 
          ? 'Rascunho criado e processado com IA. Redirecionando para edição...'
          : tipoAta === 'EM_PROCESSO'
            ? 'Ata importada como "Em Processo". Redirecionando para gerenciamento...'
            : 'Arquivo importado e processado com sucesso. Redirecionando...',
      });
      
      // Se for rascunho, salvar dados do processamento no localStorage para a página de rascunho
      if (tipoAta === 'RASCUNHO' && 'textoExtraido' in result) {
        localStorage.setItem(`rascunho-${ata.id}`, JSON.stringify({
          textoExtraido: result.textoExtraido,
          transcricao: result.transcricao,
          topicos: result.topicos,
          metadados: result.metadados,
        }));
      }
      
      // Redirecionar para página apropriada
      if (tipoAta === 'RASCUNHO') {
        router.push(`/admin/atas/${ata.id}/rascunho`);
      } else if (tipoAta === 'EM_PROCESSO') {
        router.push(`/admin/atas/${ata.id}/processo`);
      } else {
        router.push(`/admin/atas/${ata.id}`);
      }
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.dataReuniao) {
      newErrors.dataReuniao = 'Data da reunião é obrigatória';
    }

    if ((tipoAta === 'RASCUNHO' || tipoAta === 'EM_PROCESSO') && !formData.tipoReuniao) {
      newErrors.tipoReuniao = 'Tipo de reunião é obrigatório';
    }

    if (!arquivo) {
      newErrors.arquivo = 'Arquivo é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Marcar todos os campos como tocados
    setTouched({
      dataReuniao: true,
      tipoReuniao: true,
      arquivo: true,
    });

    if (!validateForm()) {
      return;
    }

    importMutation.mutate();
  };

  const handleFileSelect = (file: File | null) => {
    if (file) {
      // Validar tamanho do arquivo (10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB em bytes
      if (file.size > maxSize) {
        toast({
          variant: 'destructive',
          title: 'Arquivo muito grande',
          description: 'O arquivo deve ter no máximo 10MB.',
        });
        setArquivo(null);
        setErrors((prev) => ({ ...prev, arquivo: 'O arquivo deve ter no máximo 10MB' }));
        return;
      }

      const extensao = file.name.split('.').pop()?.toLowerCase();
      if (tipoAta === 'RASCUNHO' && extensao !== 'pdf') {
        toast({
          variant: 'destructive',
          title: 'Formato inválido',
          description: 'Para rascunhos, apenas arquivos PDF são suportados.',
        });
        setArquivo(null);
        setErrors((prev) => ({ ...prev, arquivo: 'Para rascunhos, apenas arquivos PDF são suportados' }));
        return;
      }
      if ((tipoAta === 'FINALIZADA' || tipoAta === 'EM_PROCESSO') && extensao !== 'txt' && extensao !== 'pdf') {
        toast({
          variant: 'destructive',
          title: 'Formato inválido',
          description: 'Apenas arquivos TXT e PDF são suportados.',
        });
        setArquivo(null);
        setErrors((prev) => ({ ...prev, arquivo: 'Apenas arquivos TXT e PDF são suportados' }));
        return;
      }
      // Arquivo válido - atualizar estado
      setArquivo(file);
      setTouched((prev) => ({ ...prev, arquivo: true }));
      // Limpar erro se arquivo válido
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.arquivo;
        return newErrors;
      });
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    } else {
      setArquivo(null);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
    // Marcar campo como tocado
    setTouched({ ...touched, [field]: true });
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
        <h1 className="text-3xl font-bold">Importar Ata</h1>
        <p className="text-muted-foreground mt-2">
          Importe atas existentes ou crie rascunhos para transcrição
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
            {/* Seletor de Tipo de Ata */}
            <div>
              <Label htmlFor="tipoAta">Tipo de Importação *</Label>
              <Select
                value={tipoAta}
                onValueChange={(value) => {
                  setTipoAta(value as 'FINALIZADA' | 'RASCUNHO' | 'EM_PROCESSO');
                  // Limpar modelo quando mudar o tipo
                  if (value !== 'RASCUNHO') {
                    setFormData({ ...formData, modeloAtaId: '' });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de importação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FINALIZADA">
                    Finalizada - Ata já concluída e registrada
                  </SelectItem>
                  <SelectItem value="RASCUNHO">
                    Rascunho - Extrair texto e transcrever com IA
                  </SelectItem>
                  <SelectItem value="EM_PROCESSO">
                    Em Processo - Ata em andamento com prazos e histórico
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {tipoAta === 'FINALIZADA' && 'Importa ata já finalizada e registrada'}
                {tipoAta === 'RASCUNHO' && 'Extrai texto do PDF e cria transcrição profissional com IA'}
                {tipoAta === 'EM_PROCESSO' && 'Importa ata que está em processo de andamento com prazos e histórico'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dataReuniao">Data da Reunião *</Label>
                <Input
                  id="dataReuniao"
                  type="date"
                  value={formData.dataReuniao}
                  onChange={(e) => handleFieldChange('dataReuniao', e.target.value)}
                  onBlur={() => setTouched({ ...touched, dataReuniao: true })}
                  className={touched.dataReuniao && errors.dataReuniao ? 'border-destructive' : ''}
                  required
                />
                {touched.dataReuniao && errors.dataReuniao && (
                  <p className="text-xs text-destructive mt-1">{errors.dataReuniao}</p>
                )}
              </div>

              <div>
                <Label htmlFor="tipoReuniao">
                  Tipo de Reunião {(tipoAta === 'RASCUNHO' || tipoAta === 'EM_PROCESSO') && '*'}
                </Label>
                <Select
                  value={formData.tipoReuniao}
                  onValueChange={(value) => handleFieldChange('tipoReuniao', value)}
                  onOpenChange={(open) => {
                    if (!open) {
                      setTouched({ ...touched, tipoReuniao: true });
                    }
                  }}
                  required={tipoAta === 'RASCUNHO' || tipoAta === 'EM_PROCESSO'}
                >
                  <SelectTrigger className={touched.tipoReuniao && errors.tipoReuniao ? 'border-destructive' : ''}>
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
                {touched.tipoReuniao && errors.tipoReuniao && (
                  <p className="text-xs text-destructive mt-1">{errors.tipoReuniao}</p>
                )}
              </div>
            </div>

            {tipoAta === 'RASCUNHO' && (
              <div>
                <Label htmlFor="modeloAta">Modelo de Ata (Opcional)</Label>
                <Select
                  value={formData.modeloAtaId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, modeloAtaId: value })
                  }
                  disabled={!formData.tipoReuniao}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      formData.tipoReuniao 
                        ? "Selecione um modelo (opcional)" 
                        : "Selecione primeiro o tipo de reunião"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum (usar padrão)</SelectItem>
                    {modelos?.map((modelo) => (
                      <SelectItem key={modelo.id} value={modelo.id}>
                        {modelo.nome}
                        {modelo.descricao && ` - ${modelo.descricao}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Selecione um modelo de ata para melhorar a qualidade da transcrição
                </p>
              </div>
            )}

            {tipoAta === 'EM_PROCESSO' && (
              <>
                <div>
                  <Label htmlFor="dataAssinatura">Data de Assinatura (Opcional)</Label>
                  <Input
                    id="dataAssinatura"
                    type="date"
                    value={formData.dataAssinatura}
                    onChange={(e) =>
                      setFormData({ ...formData, dataAssinatura: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Se informada, a ata será marcada como assinada. Caso contrário, ficará pendente de assinatura.
                  </p>
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações (Opcional)</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) =>
                      setFormData({ ...formData, observacoes: e.target.value })
                    }
                    placeholder="Adicione observações sobre a ata em processo..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Informações adicionais sobre o estado atual da ata
                  </p>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="arquivo">
                Arquivo * {tipoAta === 'RASCUNHO' && '(Apenas PDF)'} (Máximo 10MB)
              </Label>
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer
                  transition-all duration-200
                  ${isDragging 
                    ? 'border-primary bg-primary/5 scale-[1.02]' 
                    : touched.arquivo && errors.arquivo
                      ? 'border-destructive bg-destructive/5'
                      : 'border-input hover:border-primary/50 hover:bg-muted/50'
                  }
                  ${arquivo && !errors.arquivo ? 'border-primary/50 bg-primary/5' : ''}
                `}
              >
                <input
                  ref={fileInputRef}
                  id="arquivo"
                  type="file"
                  accept={tipoAta === 'RASCUNHO' ? '.pdf' : '.txt,.pdf'}
                  onChange={handleInputChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  {arquivo ? (
                    <>
                      <FileText className="h-8 w-8 text-primary" />
                      <p className="text-sm font-medium text-foreground">
                        {arquivo.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {arquivo.size > 1024 * 1024 
                          ? `${(arquivo.size / (1024 * 1024)).toFixed(2)} MB`
                          : `${(arquivo.size / 1024).toFixed(2)} KB`
                        }
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
              {touched.arquivo && errors.arquivo && (
                <p className="text-xs text-destructive mt-1">{errors.arquivo}</p>
              )}
            </div>

            {/* Mensagens de Erro Gerais */}
            {Object.keys(errors).length > 0 && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm font-medium text-destructive mb-2">
                  Por favor, corrija os seguintes erros:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
                  {errors.dataReuniao && <li>{errors.dataReuniao}</li>}
                  {errors.tipoReuniao && <li>{errors.tipoReuniao}</li>}
                  {errors.arquivo && <li>{errors.arquivo}</li>}
                </ul>
              </div>
            )}

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

