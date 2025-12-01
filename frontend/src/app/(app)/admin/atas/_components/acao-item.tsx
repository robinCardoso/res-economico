'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle2, 
  Clock, 
  XCircle,
  AlertCircle,
  MessageSquare,
  User,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface Acao {
  descricao: string;
  responsavel?: string;
  prazo?: string;
  status?: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  comentarios?: string[];
  concluida_em?: string;
}

interface AcaoItemProps {
  acao: Acao;
  index: number;
  onUpdate: (index: number, updates: Partial<Acao>) => Promise<void>;
}

export function AcaoItem({ acao, index, onUpdate }: AcaoItemProps) {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'concluida':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'em_andamento':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelada':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'concluida':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'em_andamento':
        return <Clock className="h-4 w-4" />;
      case 'cancelada':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'concluida':
        return 'Concluída';
      case 'em_andamento':
        return 'Em Andamento';
      case 'cancelada':
        return 'Cancelada';
      default:
        return 'Pendente';
    }
  };

  const handleStatusChange = async (newStatus: Acao['status']) => {
    setIsUpdating(true);
    try {
      const updates: Partial<Acao> = {
        status: newStatus,
        ...(newStatus === 'concluida' && !acao.concluida_em ? { concluida_em: new Date().toISOString() } : {}),
      };
      await onUpdate(index, updates);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setIsUpdating(true);
    try {
      const updatedComments = [...(acao.comentarios || []), newComment];
      await onUpdate(index, { comentarios: updatedComments });
      setNewComment('');
      setShowCommentInput(false);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Header com Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {acao.descricao}
            </p>
            
            {/* Informações da Ação */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-600 dark:text-gray-400">
              {acao.responsavel && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {acao.responsavel}
                </span>
              )}
              {acao.prazo && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {(() => {
                    try {
                      const data = new Date(acao.prazo);
                      if (isNaN(data.getTime())) return acao.prazo;
                      return format(data, 'dd/MM/yyyy', { locale: ptBR });
                    } catch {
                      return acao.prazo;
                    }
                  })()}
                </span>
              )}
              {acao.concluida_em && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Concluída em {(() => {
                    try {
                      const data = new Date(acao.concluida_em);
                      if (isNaN(data.getTime())) return acao.concluida_em;
                      return format(data, 'dd/MM/yyyy', { locale: ptBR });
                    } catch {
                      return acao.concluida_em;
                    }
                  })()}
                </span>
              )}
            </div>
          </div>

          {/* Badge de Status */}
          <Badge className={`${getStatusColor(acao.status)} flex items-center gap-1`}>
            {getStatusIcon(acao.status)}
            {getStatusLabel(acao.status)}
          </Badge>
        </div>

        {/* Comentários Existentes */}
        {acao.comentarios && acao.comentarios.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Comentários:</p>
            {acao.comentarios.map((comentario, idx) => (
              <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                {comentario}
              </div>
            ))}
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {/* Botões de Status */}
          {acao.status !== 'concluida' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange('concluida')}
              disabled={isUpdating}
              className="h-8 text-xs"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Concluir
            </Button>
          )}
          
          {acao.status !== 'em_andamento' && acao.status !== 'concluida' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange('em_andamento')}
              disabled={isUpdating}
              className="h-8 text-xs"
            >
              <Clock className="h-3 w-3 mr-1" />
              Em Andamento
            </Button>
          )}
          
          {acao.status !== 'cancelada' && acao.status !== 'concluida' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange('cancelada')}
              disabled={isUpdating}
              className="h-8 text-xs"
            >
              <XCircle className="h-3 w-3 mr-1" />
              Cancelar
            </Button>
          )}

          {/* Botão de Comentário */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCommentInput(!showCommentInput)}
            className="h-8 text-xs"
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            {showCommentInput ? 'Cancelar' : 'Comentar'}
          </Button>
        </div>

        {/* Input de Comentário */}
        {showCommentInput && (
          <div className="space-y-2 pt-2 border-t">
            <Textarea
              placeholder="Adicione um comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] text-sm"
            />
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={!newComment.trim() || isUpdating}
              className="h-8 text-xs"
            >
              {isUpdating ? 'Salvando...' : 'Adicionar Comentário'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

