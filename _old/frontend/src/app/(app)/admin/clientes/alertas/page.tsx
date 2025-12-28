'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  Download,
  RefreshCw,
  Search,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
} from 'lucide-react';
import { useClienteAnalyticsAlertas } from '@/hooks/use-cliente-analytics';
import type { AlertaCliente } from '@/services/cliente-analytics.service';
import numeral from 'numeral';
import Link from 'next/link';

export default function AlertasClientesPage() {
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todos');
  const [ordenacao, setOrdenacao] = useState<'prioridade' | 'dias' | 'receita'>('prioridade');

  // Buscar alertas
  const { data: alertas, isLoading, refetch } = useClienteAnalyticsAlertas();

  // Filtrar e ordenar alertas
  const alertasFiltrados = useMemo(() => {
    if (!alertas) return [];

    let resultado = [...alertas];

    // Filtro de busca
    if (busca) {
      const buscaLower = busca.toLowerCase();
      resultado = resultado.filter((alerta) =>
        alerta.nomeFantasia.toLowerCase().includes(buscaLower)
      );
    }

    // Filtro de tipo
    if (filtroTipo !== 'todos') {
      resultado = resultado.filter((alerta) => alerta.tipo === filtroTipo);
    }

    // Filtro de prioridade
    if (filtroPrioridade !== 'todos') {
      resultado = resultado.filter((alerta) => alerta.prioridade === filtroPrioridade);
    }

    // Ordenação
    resultado.sort((a, b) => {
      if (ordenacao === 'prioridade') {
        const prioridadeMap = { alta: 3, media: 2, baixa: 1 };
        return prioridadeMap[b.prioridade] - prioridadeMap[a.prioridade];
      } else if (ordenacao === 'dias') {
        return (b.diasSemCompra || 0) - (a.diasSemCompra || 0);
      } else {
        return (b.receitaPotencialPerdida || 0) - (a.receitaPotencialPerdida || 0);
      }
    });

    return resultado;
  }, [alertas, busca, filtroTipo, filtroPrioridade, ordenacao]);

  // Estatísticas
  const estatisticas = useMemo(() => {
    if (!alertas) return { total: 0, alta: 0, media: 0, baixa: 0, receitaRisco: 0 };

    return {
      total: alertas.length,
      alta: alertas.filter((a) => a.prioridade === 'alta').length,
      media: alertas.filter((a) => a.prioridade === 'media').length,
      baixa: alertas.filter((a) => a.prioridade === 'baixa').length,
      receitaRisco: alertas.reduce((sum, a) => sum + (a.receitaPotencialPerdida || 0), 0),
    };
  }, [alertas]);

  // Exportar CSV
  const exportarCSV = () => {
    if (!alertasFiltrados.length) return;

    const headers = ['Cliente', 'Tipo', 'Prioridade', 'Mensagem', 'Dias Sem Compra', 'Receita em Risco', 'Ação Recomendada'];
    const rows = alertasFiltrados.map((alerta) => [
      alerta.nomeFantasia,
      formatarTipoAlerta(alerta.tipo),
      alerta.prioridade.toUpperCase(),
      alerta.mensagem,
      alerta.diasSemCompra?.toString() || '',
      alerta.receitaPotencialPerdida ? numeral(alerta.receitaPotencialPerdida).format('0,0.00') : '',
      alerta.acaoRecomendada,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `alertas-clientes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alertas de Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Monitore clientes que necessitam atenção imediata
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={exportarCSV} disabled={!alertasFiltrados.length}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.total}</div>
            <p className="text-xs text-muted-foreground">
              {alertasFiltrados.length !== estatisticas.total
                ? `${alertasFiltrados.length} filtrados`
                : 'Todos os alertas'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alta Prioridade</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{estatisticas.alta}</div>
            <p className="text-xs text-red-600">Ação imediata necessária</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Prioridade</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{estatisticas.media}</div>
            <p className="text-xs text-amber-600">Monitoramento necessário</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Baixa Prioridade</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.baixa}</div>
            <p className="text-xs text-muted-foreground">Ação preventiva</p>
          </CardContent>
        </Card>

        <Card className="border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita em Risco</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {numeral(estatisticas.receitaRisco).format('$0,0')}
            </div>
            <p className="text-xs text-muted-foreground">Potencial de perda</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros e Busca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Filtro de Tipo */}
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de alerta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="inativo_30_dias">Inativos 30+ dias</SelectItem>
                <SelectItem value="inativo_60_dias">Inativos 60+ dias</SelectItem>
                <SelectItem value="inativo_90_dias">Inativos 90+ dias</SelectItem>
                <SelectItem value="queda_receita">Queda de receita</SelectItem>
                <SelectItem value="risco_churn">Risco de churn</SelectItem>
                <SelectItem value="oportunidade_upselling">Oportunidade upselling</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro de Prioridade */}
            <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as prioridades</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>

            {/* Ordenação */}
            <Select value={ordenacao} onValueChange={(v: any) => setOrdenacao(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prioridade">Prioridade</SelectItem>
                <SelectItem value="dias">Dias sem compra</SelectItem>
                <SelectItem value="receita">Receita em risco</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Alertas */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas Ativos ({alertasFiltrados.length})</CardTitle>
          <CardDescription>
            Clientes que requerem atenção imediata da equipe comercial
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">Carregando alertas...</div>
          ) : alertasFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {busca || filtroTipo !== 'todos' || filtroPrioridade !== 'todos'
                  ? 'Nenhum alerta encontrado com os filtros aplicados'
                  : 'Nenhum alerta ativo no momento'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead className="text-right">Dias</TableHead>
                    <TableHead className="text-right">Receita em Risco</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertasFiltrados.map((alerta, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Badge
                          variant={
                            alerta.prioridade === 'alta'
                              ? 'destructive'
                              : alerta.prioridade === 'media'
                                ? 'default'
                                : 'secondary'
                          }
                        >
                          {alerta.prioridade.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{alerta.nomeFantasia}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatarTipoAlerta(alerta.tipo)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="text-sm">{alerta.mensagem}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {alerta.acaoRecomendada}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {alerta.diasSemCompra ? (
                          <span className="font-mono text-sm">{alerta.diasSemCompra}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {alerta.receitaPotencialPerdida ? (
                          <span className="font-mono text-sm">
                            {numeral(alerta.receitaPotencialPerdida).format('$0,0.00')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/admin/clientes/perfil?cliente=${encodeURIComponent(alerta.nomeFantasia)}`}
                        >
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function formatarTipoAlerta(tipo: string): string {
  const map: Record<string, string> = {
    inativo_30_dias: 'Inativo 30+ dias',
    inativo_60_dias: 'Inativo 60+ dias',
    inativo_90_dias: 'Inativo 90+ dias',
    queda_receita: 'Queda de Receita',
    risco_churn: 'Risco de Churn',
    oportunidade_upselling: 'Oportunidade Upselling',
  };
  return map[tipo] || tipo;
}
