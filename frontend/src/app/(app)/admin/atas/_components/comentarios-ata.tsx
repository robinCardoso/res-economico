'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare, 
  Send, 
  Reply, 
  ThumbsUp, 
  ThumbsDown,
  Lightbulb,
  User,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface Comentario {
  id: string;
  comentario: string;
  tipo: 'comentario' | 'sugestao' | 'aprovacao' | 'reprovacao';
  autor_id: string;
  criado_em: string;
  comentario_pai_id?: string;
  autor?: {
    name: string;
    email: string;
  };
  respostas?: Comentario[];
}

interface ComentariosAtaProps {
  ataId: string;
  comentarios: Comentario[];
  onComentarioAdicionado: () => void;
}

export function ComentariosAta({ ataId, comentarios, onComentarioAdicionado }: ComentariosAtaProps) {
  const [novoComentario, setNovoComentario] = useState('');
  const [tipoComentario, setTipoComentario] = useState<'comentario' | 'sugestao' | 'aprovacao' | 'reprovacao'>('comentario');
  const [respondendoA, setRespondendoA] = useState<string | null>(null);
  const [respostaTexto, setRespostaTexto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'aprovacao':
        return <ThumbsUp className="h-4 w-4" />;
      case 'reprovacao':
        return <ThumbsDown className="h-4 w-4" />;
      case 'sugestao':
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'aprovacao':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'reprovacao':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'sugestao':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'aprovacao':
        return 'Aprovação';
      case 'reprovacao':
        return 'Reprovação';
      case 'sugestao':
        return 'Sugestão';
      default:
        return 'Comentário';
    }
  };

  const handleAdicionarComentario = async () => {
    if (!novoComentario.trim()) {
      toast({
        title: 'Atenção',
        description: 'Digite um comentário antes de enviar.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
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

      const response = await fetch(`/api/admin/atas/${ataId}/comentarios`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comentario: novoComentario,
          tipo: tipoComentario,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao adicionar comentário');
      }

      toast({
        title: 'Sucesso',
        description: 'Comentário adicionado com sucesso!',
      });
      
      setNovoComentario('');
      setTipoComentario('comentario');
      onComentarioAdicionado();
    } catch (error: unknown) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao adicionar comentário',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResponder = async (comentarioId: string) => {
    if (!respostaTexto.trim()) {
      toast({
        title: 'Atenção',
        description: 'Digite uma resposta antes de enviar.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
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

      const response = await fetch(`/api/admin/atas/${ataId}/comentarios`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comentario: respostaTexto,
          tipo: 'comentario',
          comentario_pai_id: comentarioId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao adicionar resposta');
      }

      toast({
        title: 'Sucesso',
        description: 'Resposta adicionada com sucesso!',
      });
      
      setRespostaTexto('');
      setRespondendoA(null);
      onComentarioAdicionado();
    } catch (error: unknown) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao adicionar resposta',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const comentariosPrincipais = comentarios.filter(c => !c.comentario_pai_id);
  const getRespostas = (comentarioId: string) => comentarios.filter(c => c.comentario_pai_id === comentarioId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comentários e Discussões
        </CardTitle>
        <CardDescription>
          Adicione comentários, sugestões ou aprovações para esta ata
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulário de Novo Comentário */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={tipoComentario === 'comentario' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTipoComentario('comentario')}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Comentário
            </Button>
            <Button
              variant={tipoComentario === 'sugestao' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTipoComentario('sugestao')}
            >
              <Lightbulb className="h-4 w-4 mr-1" />
              Sugestão
            </Button>
            <Button
              variant={tipoComentario === 'aprovacao' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTipoComentario('aprovacao')}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Aprovar
            </Button>
            <Button
              variant={tipoComentario === 'reprovacao' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTipoComentario('reprovacao')}
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              Reprovar
            </Button>
          </div>

          <Textarea
            placeholder={`Digite seu ${getTipoLabel(tipoComentario).toLowerCase()}...`}
            value={novoComentario}
            onChange={(e) => setNovoComentario(e.target.value)}
            className="min-h-[100px]"
          />

          <Button
            onClick={handleAdicionarComentario}
            disabled={!novoComentario.trim() || isSubmitting}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Enviando...' : `Adicionar ${getTipoLabel(tipoComentario)}`}
          </Button>
        </div>

        {/* Lista de Comentários */}
        {comentariosPrincipais.length > 0 ? (
          <div className="space-y-4">
            {comentariosPrincipais.map((comentario) => {
              const respostas = getRespostas(comentario.id);
              
              return (
                <div key={comentario.id} className="space-y-3">
                  {/* Comentário Principal */}
                  <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {comentario.autor?.name || 'Usuário'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comentario.criado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <Badge className={`${getTipoColor(comentario.tipo)} flex items-center gap-1`}>
                        {getTipoIcon(comentario.tipo)}
                        {getTipoLabel(comentario.tipo)}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      {comentario.comentario}
                    </p>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setRespondendoA(respondendoA === comentario.id ? null : comentario.id)}
                      className="h-8 text-xs"
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      {respondendoA === comentario.id ? 'Cancelar' : `Responder (${respostas.length})`}
                    </Button>

                    {/* Input de Resposta */}
                    {respondendoA === comentario.id && (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          placeholder="Digite sua resposta..."
                          value={respostaTexto}
                          onChange={(e) => setRespostaTexto(e.target.value)}
                          className="min-h-[80px] text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleResponder(comentario.id)}
                          disabled={!respostaTexto.trim() || isSubmitting}
                          className="h-8 text-xs"
                        >
                          {isSubmitting ? 'Enviando...' : 'Enviar Resposta'}
                        </Button>
                      </div>
                    )}

                    {/* Respostas */}
                    {respostas.length > 0 && (
                      <div className="mt-3 ml-6 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                        {respostas.map((resposta) => (
                          <div key={resposta.id} className="p-3 bg-white dark:bg-gray-800 rounded border">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs font-medium">
                                {resposta.autor?.name || 'Usuário'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(resposta.criado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {resposta.comentario}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

