'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { atasService } from '@/services/atas.service';
import { ArrowLeft, Save, Loader2, FileText, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { AtaReuniao } from '@/types/api';
import { StatusAta } from '@/types/api';

interface Topico {
  titulo: string;
  descricao: string;
  importancia: 'alta' | 'media' | 'baixa';
}

export default function RascunhoPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [transcricao, setTranscricao] = useState('');
  const [textoExtraido, setTextoExtraido] = useState('');
  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [metadados, setMetadados] = useState<{
    tempoExtracao: number;
    tempoTranscricao: number;
    tempoTopicos: number;
    tempoTotal: number;
    modeloUsado: string;
  } | null>(null);

  // Buscar dados do rascunho
  const { data: ata, isLoading } = useQuery({
    queryKey: ['ata', id],
    queryFn: () => atasService.getById(id),
    enabled: !!id,
  });

  // Carregar dados do processamento se disponíveis
  useEffect(() => {
    if (ata) {
      setTranscricao(ata.conteudo || '');
      
      // Tentar carregar dados do processamento do localStorage
      const dadosSalvos = localStorage.getItem(`rascunho-${id}`);
      if (dadosSalvos) {
        try {
          const dados = JSON.parse(dadosSalvos) as {
            textoExtraido: string;
            transcricao: string;
            topicos: Topico[];
            metadados: typeof metadados;
          };
          setTextoExtraido(dados.textoExtraido);
          if (dados.transcricao && !ata.conteudo) {
            setTranscricao(dados.transcricao);
          }
          setTopicos(dados.topicos);
          setMetadados(dados.metadados);
          // Limpar do localStorage após carregar
          localStorage.removeItem(`rascunho-${id}`);
        } catch (error) {
          console.error('Erro ao carregar dados do rascunho:', error);
        }
      }
    }
  }, [ata, id]);

  const saveMutation = useMutation({
    mutationFn: async (novaTranscricao: string) => {
      return atasService.update(id, {
        conteudo: novaTranscricao,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso!',
        description: 'Rascunho salvo com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['ata', id] });
    },
    onError: (err) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao salvar rascunho',
      });
    },
  });

  const finalizarMutation = useMutation({
    mutationFn: async () => {
      return atasService.update(id, {
        status: StatusAta.EM_PROCESSO, // Mover para "Em Processo" ao finalizar
      });
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso!',
        description: 'Rascunho finalizado. Redirecionando...',
      });
      queryClient.invalidateQueries({ queryKey: ['ata', id] });
      router.push(`/admin/atas/${id}`);
    },
    onError: (err) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao finalizar rascunho',
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(transcricao);
  };

  const handleFinalizar = () => {
    if (!transcricao.trim()) {
      toast({
        variant: 'destructive',
        title: 'Atenção',
        description: 'A transcrição não pode estar vazia.',
      });
      return;
    }
    finalizarMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!ata) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Ata não encontrada.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (ata.status !== 'RASCUNHO') {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Esta ata não é um rascunho. Status atual: {ata.status}
            </p>
            <Link href={`/admin/atas/${id}`}>
              <Button className="mt-4">Ver Ata</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-6">
        <Link href="/admin/atas">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Editar Rascunho</h1>
            <p className="text-muted-foreground mt-2">
              {ata.numero} - {ata.titulo}
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            Rascunho
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal - Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Transcrição da Ata
              </CardTitle>
              <CardDescription>
                Edite a transcrição sugerida pela IA. Você pode modificar qualquer parte do texto.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="transcricao">Conteúdo da Ata</Label>
                <Textarea
                  id="transcricao"
                  value={transcricao}
                  onChange={(e) => setTranscricao(e.target.value)}
                  className="min-h-[500px] font-mono text-sm"
                  placeholder="A transcrição aparecerá aqui..."
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {transcricao.length} caracteres
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  variant="outline"
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Rascunho
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleFinalizar}
                  disabled={finalizarMutation.isPending || !transcricao.trim()}
                >
                  {finalizarMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Finalizar Transcrição
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Texto Extraído (colapsável) */}
          {textoExtraido && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Texto Extraído do PDF</CardTitle>
                <CardDescription className="text-xs">
                  Texto bruto extraído do documento original
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg max-h-64 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {textoExtraido}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Tópicos e Metadados */}
        <div className="space-y-6">
          {/* Tópicos Importantes */}
          {topicos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-4 w-4" />
                  Tópicos Importantes
                </CardTitle>
                <CardDescription className="text-xs">
                  Identificados automaticamente pela IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topicos.map((topico, index) => (
                    <div
                      key={index}
                      className="p-3 bg-muted rounded-lg border-l-4"
                      style={{
                        borderLeftColor:
                          topico.importancia === 'alta'
                            ? 'var(--destructive)'
                            : topico.importancia === 'media'
                              ? 'var(--warning)'
                              : 'var(--muted-foreground)',
                      }}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold text-sm">{topico.titulo}</h4>
                        <Badge
                          variant={
                            topico.importancia === 'alta'
                              ? 'destructive'
                              : topico.importancia === 'media'
                                ? 'default'
                                : 'secondary'
                          }
                          className="text-xs"
                        >
                          {topico.importancia}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{topico.descricao}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadados */}
          {metadados && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações do Processamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modelo IA:</span>
                  <span className="font-medium">{metadados.modeloUsado}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Extração:</span>
                  <span className="font-medium">{(metadados.tempoExtracao / 1000).toFixed(1)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transcrição:</span>
                  <span className="font-medium">
                    {(metadados.tempoTranscricao / 1000).toFixed(1)}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tópicos:</span>
                  <span className="font-medium">{(metadados.tempoTopicos / 1000).toFixed(1)}s</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold">{(metadados.tempoTotal / 1000).toFixed(1)}s</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações da Ata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações da Ata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Tipo:</span>
                <p className="font-medium">{ata.tipo}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Data:</span>
                <p className="font-medium">
                  {new Date(ata.dataReuniao).toLocaleDateString('pt-BR')}
                </p>
              </div>
              {ata.local && (
                <div>
                  <span className="text-muted-foreground">Local:</span>
                  <p className="font-medium">{ata.local}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

