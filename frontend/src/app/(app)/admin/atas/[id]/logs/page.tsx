'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { logAlteracoesService } from '@/services/log-alteracoes.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const getTipoLabel = (tipo: string) => {
  const labels: Record<string, string> = {
    CRIACAO: 'Criação',
    EDICAO: 'Edição',
    EXCLUSAO: 'Exclusão',
    MUDANCA_STATUS: 'Mudança de Status',
    ADICAO_HISTORICO: 'Adição de Histórico',
    EDICAO_HISTORICO: 'Edição de Histórico',
    EXCLUSAO_HISTORICO: 'Exclusão de Histórico',
    ADICAO_PRAZO: 'Adição de Prazo',
    EDICAO_PRAZO: 'Edição de Prazo',
    EXCLUSAO_PRAZO: 'Exclusão de Prazo',
    CONCLUSAO_PRAZO: 'Conclusão de Prazo',
    ADICAO_COMENTARIO: 'Adição de Comentário',
    EDICAO_COMENTARIO: 'Edição de Comentário',
    EXCLUSAO_COMENTARIO: 'Exclusão de Comentário',
    UPLOAD_ARQUIVO: 'Upload de Arquivo',
    DOWNLOAD_ARQUIVO: 'Download de Arquivo',
  };
  return labels[tipo] || tipo;
};

const getTipoColor = (tipo: string) => {
  if (tipo.includes('CRIACAO')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (tipo.includes('EXCLUSAO')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  if (tipo.includes('EDICAO')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  if (tipo.includes('MUDANCA')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
};

export default function LogsAtaPage() {
  const params = useParams();
  const router = useRouter();
  const ataId = params.id as string;
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [busca, setBusca] = useState('');

  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['logs-alteracoes', ataId],
    queryFn: () => logAlteracoesService.listarPorAta(ataId),
  });

  const logsFiltrados = logs?.filter((log) => {
    if (filtroTipo !== 'TODOS' && log.tipoAlteracao !== filtroTipo) {
      return false;
    }
    if (busca && !log.descricao?.toLowerCase().includes(busca.toLowerCase())) {
      return false;
    }
    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando logs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-destructive">
                Erro ao carregar logs: {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
              <Button onClick={() => router.push(`/admin/atas/${ataId}`)} className="mt-3" size="sm">
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
    <div className="container mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/atas/${ataId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Log de Alterações</h1>
            <p className="text-sm text-muted-foreground">
              Histórico completo de todas as alterações nesta ata
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por descrição..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo de alteração" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos os tipos</SelectItem>
                <SelectItem value="CRIACAO">Criação</SelectItem>
                <SelectItem value="EDICAO">Edição</SelectItem>
                <SelectItem value="EXCLUSAO">Exclusão</SelectItem>
                <SelectItem value="MUDANCA_STATUS">Mudança de Status</SelectItem>
                <SelectItem value="ADICAO_HISTORICO">Adição de Histórico</SelectItem>
                <SelectItem value="EDICAO_HISTORICO">Edição de Histórico</SelectItem>
                <SelectItem value="EXCLUSAO_HISTORICO">Exclusão de Histórico</SelectItem>
                <SelectItem value="ADICAO_PRAZO">Adição de Prazo</SelectItem>
                <SelectItem value="EDICAO_PRAZO">Edição de Prazo</SelectItem>
                <SelectItem value="EXCLUSAO_PRAZO">Exclusão de Prazo</SelectItem>
                <SelectItem value="CONCLUSAO_PRAZO">Conclusão de Prazo</SelectItem>
                <SelectItem value="ADICAO_COMENTARIO">Adição de Comentário</SelectItem>
                <SelectItem value="EDICAO_COMENTARIO">Edição de Comentário</SelectItem>
                <SelectItem value="EXCLUSAO_COMENTARIO">Exclusão de Comentário</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      {logsFiltrados.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-base font-semibold mb-1.5">Nenhum log encontrado</h3>
            <p className="text-sm text-muted-foreground">
              {logs?.length === 0
                ? 'Ainda não há alterações registradas nesta ata'
                : 'Nenhum log corresponde aos filtros selecionados'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logsFiltrados.map((log) => (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getTipoColor(log.tipoAlteracao)}>
                        {getTipoLabel(log.tipoAlteracao)}
                      </Badge>
                      {log.campo && (
                        <span className="text-xs text-muted-foreground">
                          Campo: {log.campo}
                        </span>
                      )}
                    </div>
                    {log.descricao && (
                      <p className="text-sm font-medium">{log.descricao}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(log.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {log.usuario.nome}
                    </div>
                  </div>
                </div>
              </CardHeader>
              {(log.valorAnterior || log.valorNovo) && (
                <CardContent className="pt-0">
                  <div className="grid gap-3 md:grid-cols-2">
                    {log.valorAnterior && (
                      <div className="p-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <p className="text-xs font-semibold text-red-800 dark:text-red-200 mb-1">
                          Valor Anterior:
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-300 break-words">
                          {log.valorAnterior.length > 200
                            ? `${log.valorAnterior.substring(0, 200)}...`
                            : log.valorAnterior}
                        </p>
                      </div>
                    )}
                    {log.valorNovo && (
                      <div className="p-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <p className="text-xs font-semibold text-green-800 dark:text-green-200 mb-1">
                          Valor Novo:
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 break-words">
                          {log.valorNovo.length > 200
                            ? `${log.valorNovo.substring(0, 200)}...`
                            : log.valorNovo}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

