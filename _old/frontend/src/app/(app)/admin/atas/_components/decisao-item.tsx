'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle2, 
  User,
  Calendar,
  MessageSquare,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface Decisao {
  descricao: string;
  responsavel?: string;
  prazo?: string;
  concluida?: boolean;
  comentarios?: string[];
  concluida_em?: string;
}

interface DecisaoItemProps {
  decisao: Decisao;
  index: number;
  onUpdate: (index: number, updates: Partial<Decisao>) => Promise<void>;
}

export function DecisaoItem({ decisao, index, onUpdate }: DecisaoItemProps) {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleConcluida = async () => {
    setIsUpdating(true);
    try {
      const updates: Partial<Decisao> = {
        concluida: !decisao.concluida,
        ...(!decisao.concluida ? { concluida_em: new Date().toISOString() } : {}),
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
      const updatedComments = [...(decisao.comentarios || []), newComment];
      await onUpdate(index, { comentarios: updatedComments });
      setNewComment('');
      setShowCommentInput(false);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${decisao.concluida ? 'bg-green-50 dark:bg-green-950/20' : ''}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className={`text-sm font-medium ${decisao.concluida ? 'line-through text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
              {decisao.descricao}
            </p>
            
            {/* Informações da Decisão */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-600 dark:text-gray-400">
              {decisao.responsavel && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {decisao.responsavel}
                </span>
              )}
              {decisao.prazo && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {(() => {
                    try {
                      const data = new Date(decisao.prazo);
                      if (isNaN(data.getTime())) return decisao.prazo;
                      return format(data, 'dd/MM/yyyy', { locale: ptBR });
                    } catch {
                      return decisao.prazo;
                    }
                  })()}
                </span>
              )}
              {decisao.concluida && decisao.concluida_em && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Concluída em {(() => {
                    try {
                      const data = new Date(decisao.concluida_em);
                      if (isNaN(data.getTime())) return decisao.concluida_em;
                      return format(data, 'dd/MM/yyyy', { locale: ptBR });
                    } catch {
                      return decisao.concluida_em;
                    }
                  })()}
                </span>
              )}
            </div>
          </div>

          {/* Badge de Status */}
          {decisao.concluida ? (
            <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Concluída
            </Badge>
          ) : (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Pendente
            </Badge>
          )}
        </div>

        {/* Comentários Existentes */}
        {decisao.comentarios && decisao.comentarios.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Comentários:</p>
            {decisao.comentarios.map((comentario, idx) => (
              <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                {comentario}
              </div>
            ))}
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {/* Botão de Concluir/Desfazer */}
          <Button
            size="sm"
            variant={decisao.concluida ? "outline" : "default"}
            onClick={handleToggleConcluida}
            disabled={isUpdating}
            className="h-8 text-xs"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {decisao.concluida ? 'Desfazer' : 'Marcar como Concluída'}
          </Button>

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

