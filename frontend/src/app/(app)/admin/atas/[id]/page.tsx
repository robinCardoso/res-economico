'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Calendar, Users, FileText, Sparkles, ArrowLeft, Edit, Loader2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { DecisaoItem } from '../_components/decisao-item';
import { AcaoItem } from '../_components/acao-item';
import { ComentariosAta } from '../_components/comentarios-ata';
import { useToast } from '@/hooks/use-toast';

// Função para decodificar HTML entities (funciona no cliente e servidor)
function decodificarHtml(html: string): string {
  // Se estiver no cliente, usar DOM
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = html;
    return textarea.value;
  }
  
  // Se estiver no servidor, usar substituição manual
  return html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ');
}

// Função para remover tags HTML e converter para texto formatado
function removerTagsHtml(html: string): string {
  // Primeiro, decodificar HTML entities
  let texto = decodificarHtml(html);
  
  // Converter tags HTML comuns para quebras de linha
  texto = texto.replace(/<br\s*\/?>/gi, '\n');
  texto = texto.replace(/<\/p>/gi, '\n\n');
  texto = texto.replace(/<p[^>]*>/gi, '');
  texto = texto.replace(/<\/li>/gi, '\n');
  texto = texto.replace(/<li[^>]*>/gi, '• ');
  texto = texto.replace(/<\/ul>/gi, '\n');
  texto = texto.replace(/<ul[^>]*>/gi, '');
  texto = texto.replace(/<\/ol>/gi, '\n');
  texto = texto.replace(/<ol[^>]*>/gi, '');
  texto = texto.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  texto = texto.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  texto = texto.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  texto = texto.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  
  // Remover todas as outras tags HTML
  texto = texto.replace(/<[^>]+>/g, '');
  
  // Limpar espaços em branco extras
  texto = texto.replace(/\n{3,}/g, '\n\n');
  texto = texto.trim();
  
  return texto;
}

// Função para formatar o conteúdo da ATA com parágrafos e indentação
function formatarConteudoAta(conteudo: string): string {
  if (!conteudo) return '';
  
  let texto = conteudo;
  
  // Se o conteúdo contém HTML escapado ou tags HTML, processar
  if (texto.includes('&lt;') || texto.includes('<')) {
    texto = removerTagsHtml(texto);
  }
  
  // Adicionar quebra de linha após pontos finais seguidos de espaço e maiúscula (novos parágrafos)
  texto = texto.replace(/\.\s+([A-ZÁÉÍÓÚÂÊÔÀ])/g, '.\n\n$1');
  
  // Adicionar quebra de linha antes de números de itens (1), 2), etc.)
  texto = texto.replace(/(\s+)(\d+\))/g, '\n\n$2');
  
  // Adicionar quebra de linha antes de frases que começam com "O Sr.", "A Sr.", etc.
  texto = texto.replace(/(\s+)(O Sr\.|A Sr\.|O Presidente|A Diretoria|O Secretário)/g, '\n\n$2');
  
  // Adicionar quebra de linha antes de "Nada mais havendo"
  texto = texto.replace(/(\s+)(Nada mais havendo)/g, '\n\n$2');
  
  // Adicionar quebra de linha antes de "Chapecó, SC" (assinatura)
  texto = texto.replace(/(\s+)(Chapecó, SC)/g, '\n\n$2');
  
  // Adicionar indentação para itens de lista
  texto = texto.replace(/^(\d+\))/gm, '    $1');
  texto = texto.replace(/^(•\s)/gm, '    $1');
  
  // Limpar múltiplas quebras de linha consecutivas (máximo 2)
  texto = texto.replace(/\n{3,}/g, '\n\n');
  
  // Remover espaços em branco no início e fim
  texto = texto.trim();
  
  return texto;
}

interface AtaDetalhes {
  id: string;
  titulo: string;
  data_reuniao: string;
  tipo_reuniao: string;
  descricao?: string;
  conteudo: string;
  status: string;
  participantes: Array<{
    nome: string;
    cargo?: string;
    presente: boolean;
  }>;
      pautas: Array<{
        titulo: string;
        descricao?: string;
      }>;
      decisoes: Array<{
        descricao: string;
        responsavel?: string;
        prazo?: string;
        concluida?: boolean;
        comentarios?: string[];
        concluida_em?: string;
      }>;
      acoes: Array<{
        descricao: string;
        responsavel?: string;
        prazo?: string;
        status?: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
        comentarios?: string[];
        concluida_em?: string;
      }>;
  gerado_por_ia?: boolean;
  modelo_ia?: string;
  ia_usada?: string;
  custo_ia?: string;
  tempo_processamento_ia?: number;
  criado_em?: string;
  arquivo_original_url?: string;
  arquivo_original_nome?: string;
  arquivo_original_tipo?: string;
}

export default function DetalhesAtaPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [ata, setAta] = useState<AtaDetalhes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshComentarios, setRefreshComentarios] = useState(0);

  useEffect(() => {
    const fetchAta = async () => {
      try {
        // Pegar token do localStorage
        const authStorage = localStorage.getItem('auth-storage');
        let token = '';
        if (authStorage) {
          try {
            const auth = JSON.parse(authStorage);
            token = auth?.state?.token || '';
          } catch {
            // Ignora erros de parsing
          }
        }

        const response = await fetch(`/api/admin/atas/${params.id}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Ata não encontrada');
        }
        const data = await response.json();
        // Garantir que arrays sempre existam
        const ataComArrays = {
          ...data,
          participantes: data.participantes || [],
          pautas: data.pautas || [],
          decisoes: data.decisoes || [],
          acoes: data.acoes || [],
        };
        setAta(ataComArrays);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar ata');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchAta();
    }
  }, [params.id]);

  // Buscar comentários
  const { data: comentariosData } = useQuery({
    queryKey: ['comentarios-ata', params.id, refreshComentarios],
    queryFn: async () => {
      // Pegar token do localStorage
      const authStorage = localStorage.getItem('auth-storage');
      let token = '';
      if (authStorage) {
        try {
          const auth = JSON.parse(authStorage);
          token = auth?.state?.token || '';
        } catch {
          // Ignora erros de parsing
        }
      }

      const response = await fetch(`/api/admin/atas/${params.id}/comentarios`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar comentários');
      }

      return await response.json();
    },
    enabled: !!params.id,
  });

  // Função para atualizar decisões
  const handleUpdateDecisao = async (index: number, updates: unknown) => {
    if (!ata) return;

    const updatedDecisoes = [...ata.decisoes];
    updatedDecisoes[index] = { ...updatedDecisoes[index], ...(updates as Record<string, unknown>) };

    try {
      // Pegar token do localStorage
      const authStorage = localStorage.getItem('auth-storage');
      let token = '';
      if (authStorage) {
        try {
          const auth = JSON.parse(authStorage);
          token = auth?.state?.token || '';
        } catch {
          // Ignora erros de parsing
        }
      }

      const response = await fetch(`/api/admin/atas/${ata.id}/decisoes`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ decisoes: updatedDecisoes }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar decisões');
      }

      setAta({ ...ata, decisoes: updatedDecisoes });
      toast({
        title: 'Sucesso',
        description: 'Decisão atualizada com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar decisão',
        variant: 'destructive',
      });
    }
  };

  // Função para atualizar ações
  const handleUpdateAcao = async (index: number, updates: unknown) => {
    if (!ata) return;

    const updatedAcoes = [...ata.acoes];
    updatedAcoes[index] = { ...updatedAcoes[index], ...(updates as Record<string, unknown>) };

    try {
      // Pegar token do localStorage
      const authStorage = localStorage.getItem('auth-storage');
      let token = '';
      if (authStorage) {
        try {
          const auth = JSON.parse(authStorage);
          token = auth?.state?.token || '';
        } catch {
          // Ignora erros de parsing
        }
      }

      const response = await fetch(`/api/admin/atas/${ata.id}/acoes`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ acoes: updatedAcoes }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar ações');
      }

      setAta({ ...ata, acoes: updatedAcoes });
      toast({
        title: 'Sucesso',
        description: 'Ação atualizada com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar ação',
        variant: 'destructive',
      });
    }
  };

  // Função para baixar arquivo original
  const handleDownloadArquivo = async () => {
    if (!ata?.arquivo_original_url) {
      toast({
        title: 'Aviso',
        description: 'Arquivo original não disponível para download.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Abrir em nova aba para download
      window.open(ata.arquivo_original_url, '_blank');
      
      toast({
        title: 'Download iniciado',
        description: `Baixando ${ata.arquivo_original_nome || 'arquivo'}...`,
      });
    } catch {
      toast({
        title: 'Erro',
        description: 'Erro ao fazer download do arquivo.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadHTML = async () => {
    if (!ata?.id) {
      toast({
        title: 'Erro',
        description: 'ID da ata não encontrado.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/export-ata?id=${ata.id}`);
      
      if (!response.ok) {
        throw new Error('Erro ao gerar HTML');
      }

      // Criar blob e fazer download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ata-${ata.titulo?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Download iniciado',
        description: 'HTML da ata baixado com sucesso!',
      });
    } catch (error: unknown) {
      console.error('Erro ao baixar HTML:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar HTML da ata.',
        variant: 'destructive',
      });
    }
  };

  // Função para recarregar comentários
  const handleComentarioAdicionado = () => {
    setRefreshComentarios(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !ata) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive">{error || 'Ata não encontrada'}</p>
              <Button onClick={() => router.push('/admin/atas')} className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/atas')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{ata.titulo}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={ata.status === 'finalizada' ? 'default' : 'secondary'}>
                {ata.status}
              </Badge>
              {ata.gerado_por_ia && (
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  IA
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadHTML}>
            <Download className="h-4 w-4 mr-2" />
            Baixar HTML
          </Button>
          {ata.arquivo_original_url && (
            <Button variant="outline" onClick={handleDownloadArquivo}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Original
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push(`/admin/atas/${ata.id}/editar`)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Informações Gerais */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {format(new Date(ata.data_reuniao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm capitalize">{ata.tipo_reuniao.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{ata.participantes.length} participantes</span>
            </div>
            {ata.descricao && (
              <div>
                <p className="text-sm text-muted-foreground">{ata.descricao}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações de IA */}
        {ata.gerado_por_ia && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Processamento por IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ata.ia_usada && (
                <div>
                  <p className="text-sm text-muted-foreground">IA Utilizada</p>
                  <p className="text-sm font-medium">{ata.ia_usada}</p>
                </div>
              )}
              {ata.modelo_ia && (
                <div>
                  <p className="text-sm text-muted-foreground">Modelo</p>
                  <p className="text-sm font-medium">{ata.modelo_ia}</p>
                </div>
              )}
              {ata.custo_ia && (
                <div>
                  <p className="text-sm text-muted-foreground">Custo Estimado</p>
                  <p className="text-sm font-medium capitalize">{ata.custo_ia}</p>
                </div>
              )}
              {ata.tempo_processamento_ia && (
                <div>
                  <p className="text-sm text-muted-foreground">Tempo de Processamento</p>
                  <p className="text-sm font-medium">{ata.tempo_processamento_ia}ms</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Participantes */}
      {ata.participantes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Participantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ata.participantes.map((participante, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <div>
                    <p className="font-medium">{participante.nome}</p>
                    {participante.cargo && (
                      <p className="text-sm text-muted-foreground">{participante.cargo}</p>
                    )}
                  </div>
                  <Badge variant={participante.presente ? 'default' : 'secondary'}>
                    {participante.presente ? 'Presente' : 'Ausente'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pautas */}
      {ata.pautas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pautas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ata.pautas.map((pauta, index) => (
                <div key={index} className="p-3 rounded-md border">
                  <p className="font-medium">{pauta.titulo}</p>
                  {pauta.descricao && (
                    <p className="text-sm text-muted-foreground mt-1">{pauta.descricao}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decisões */}
      {ata.decisoes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Decisões</CardTitle>
            <CardDescription>
              Gerencie as decisões tomadas nesta reunião
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ata.decisoes.map((decisao, index) => (
                <DecisaoItem
                  key={index}
                  decisao={decisao}
                  index={index}
                  onUpdate={handleUpdateDecisao}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      {ata.acoes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ações</CardTitle>
            <CardDescription>
              Acompanhe o progresso das ações definidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ata.acoes.map((acao, index) => (
                <AcaoItem
                  key={index}
                  acao={acao}
                  index={index}
                  onUpdate={handleUpdateAcao}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comentários e Discussões */}
      <ComentariosAta
        ataId={ata.id}
        comentarios={comentariosData || []}
        onComentarioAdicionado={handleComentarioAdicionado}
      />

      {/* Conteúdo Completo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conteúdo Completo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="text-sm leading-relaxed space-y-4">
              {formatarConteudoAta(ata.conteudo).split('\n\n').map((paragrafo, index) => {
                const paragrafoLimpo = paragrafo.trim();
                if (!paragrafoLimpo) return null;
                
                // Verificar se é um item de lista numerado
                const isItemNumerado = paragrafoLimpo.match(/^\d+\)/);
                // Verificar se é um item de lista com bullet
                const isItemBullet = paragrafoLimpo.match(/^•\s/);
                // Verificar se é um título (texto em negrito)
                const isTitulo = paragrafoLimpo.match(/^\*\*.*\*\*$/);
                
                return (
                  <p 
                    key={index} 
                    className={`
                      ${isItemNumerado || isItemBullet ? 'ml-6 pl-2 border-l-2 border-primary/20' : ''}
                      ${isTitulo ? 'font-semibold text-foreground' : 'text-muted-foreground'}
                    `}
                  >
                    {paragrafoLimpo.replace(/^\*\*(.*?)\*\*/g, '$1').replace(/^\*(.*?)\*/g, '$1')}
                  </p>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}