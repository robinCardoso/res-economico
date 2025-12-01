'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { atasService } from '@/services/atas.service';
import { FileText, Calendar, Users, Sparkles, Upload, Filter } from 'lucide-react';
import Link from 'next/link';
import type { FilterAtaDto, TipoReuniao, StatusAta } from '@/types/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteAtaButton } from './_components/delete-ata-button';

const getStatusColor = (status: StatusAta) => {
  switch (status) {
    case 'PUBLICADA':
      return 'bg-green-100 text-green-800 border-transparent hover:bg-primary/80';
    case 'RASCUNHO':
      return 'bg-yellow-100 text-yellow-800 border-transparent hover:bg-primary/80';
    case 'ARQUIVADA':
      return 'bg-gray-100 text-gray-800 border-transparent hover:bg-primary/80';
    default:
      return 'bg-gray-100 text-gray-800 border-transparent hover:bg-primary/80';
  }
};

const getTipoLabel = (tipo: TipoReuniao) => {
  const labels: Record<TipoReuniao, string> = {
    ASSEMBLEIA_GERAL: 'Assembleia Geral',
    CONSELHO_DIRETOR: 'Conselho Diretor',
    REUNIAO_ORDINARIA: 'Reunião Ordinária',
    REUNIAO_EXTRAORDINARIA: 'Reunião Extraordinária',
    COMISSAO: 'Comissão',
    OUTRO: 'Outro',
  };
  return labels[tipo] || tipo;
};

const getStatusLabel = (status: StatusAta) => {
  switch (status) {
    case 'PUBLICADA':
      return 'finalizada';
    case 'RASCUNHO':
      return 'rascunho';
    case 'ARQUIVADA':
      return 'arquivada';
    default:
      return status.toLowerCase();
  }
};

export default function AtasPage() {
  const [filters, setFilters] = useState<FilterAtaDto>({
    page: 1,
    limit: 20,
  });
  const [buscaInput, setBuscaInput] = useState(filters.busca || '');
  
  // Debounce da busca para evitar requisições a cada letra
  const debouncedBusca = useDebounce(buscaInput, 500);
  
  // Atualizar filtros quando o debounce da busca mudar
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      busca: debouncedBusca || undefined,
      page: 1, // Resetar para primeira página ao buscar
    }));
  }, [debouncedBusca]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['atas', filters],
    queryFn: () => atasService.list(filters),
  });


  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <FileText className="h-12 w-12 animate-pulse text-muted-foreground" />
        <span className="ml-3 text-lg text-muted-foreground">Carregando atas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-red-500">
        <FileText className="h-12 w-12" />
        <span className="ml-3 text-lg">Erro ao carregar atas: {error.message}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Atas de Reuniões</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie atas de reuniões com suporte a IA
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/atas/importar">
            <Button size="default" variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Importar Ata
            </Button>
          </Link>
        </div>
      </div>

      {/* Busca */}
      <div className="relative w-full">
        <div className="relative flex items-center">
          <Input
            type="text"
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 pr-20 h-9"
            placeholder='Buscar por conteúdo... (ex: "inclusão associado Gorutuba")'
            value={buscaInput}
            onChange={(e) => setBuscaInput(e.target.value)}
          />
          <Button
            className="absolute right-1 h-7"
            size="sm"
            disabled={!buscaInput.trim()}
          >
            <Filter className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-4">
            <CardTitle className="text-xs font-medium">Total de Atas</CardTitle>
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold">{data?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-4">
            <CardTitle className="text-xs font-medium">Finalizadas</CardTitle>
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold">
              {data?.data?.filter((a) => a.status === 'PUBLICADA').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-4">
            <CardTitle className="text-xs font-medium">Rascunhos</CardTitle>
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold">
              {data?.data?.filter((a) => a.status === 'RASCUNHO').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-4">
            <CardTitle className="text-xs font-medium">Geradas por IA</CardTitle>
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold">
              {data?.data?.filter((a) => (a as any).geradoPorIa).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Atas */}
      <div className="space-y-3">
        {data?.data && data.data.length > 0 ? (
          data.data.map((ata) => (
            <Card key={ata.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="px-4 py-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <CardTitle className="text-base font-semibold">{ata.titulo}</CardTitle>
                    <CardDescription className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(ata.dataReuniao), "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                      {ata.participantes && Array.isArray(ata.participantes) && ata.participantes.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {ata.participantes.length} participantes
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(ata as any).geradoPorIa && (
                      <Badge variant="outline" className="border-purple-200 text-purple-700 text-xs px-1.5 py-0.5">
                        <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                        IA
                      </Badge>
                    )}
                    <Badge className={`${getStatusColor(ata.status)} text-xs px-1.5 py-0.5`}>
                      {getStatusLabel(ata.status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">{getTipoLabel(ata.tipo)}</Badge>
                    {ata.createdAt && (
                      <span className="text-xs text-muted-foreground">
                        Criado em{' '}
                        {format(new Date(ata.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    )}
                  </div>

                  {(ata as any).resumo && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {(ata as any).resumo}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Link href={`/admin/atas/${ata.id}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                        Ver Detalhes
                      </Button>
                    </Link>
                    <DeleteAtaButton ataId={ata.id} ataTitulo={ata.titulo} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="text-base font-semibold mb-1.5">Nenhuma ata encontrada</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Comece importando sua primeira ata de reunião
              </p>
              <Link href="/admin/atas/importar">
                <Button size="sm">
                  <Upload className="mr-2 h-3.5 w-3.5" />
                  Importar Primeira Ata
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}

