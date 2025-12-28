'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  RefreshCw,
  Download,
  ArrowLeft,
  Search,
  Filter,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Target,
  ChevronDown,
  ChevronUp,
  Edit2,
  Save,
} from 'lucide-react';
import numeral from 'numeral';
import { useClienteAnalyticsRelatorios } from '@/hooks/use-cliente-analytics';

// Tipos de recomendação
const TIPO_RECOMENDACAO = {
  upselling: {
    label: 'Upselling',
    icon: '📈',
    color: 'bg-blue-100 text-blue-900',
    desc: 'Aumentar o valor do pedido',
  },
  cross_selling: {
    label: 'Cross-selling',
    icon: '🛍️',
    color: 'bg-green-100 text-green-900',
    desc: 'Vender produtos complementares',
  },
  reativacao: {
    label: 'Reativação',
    icon: '♻️',
    color: 'bg-purple-100 text-purple-900',
    desc: 'Reativar cliente inativo',
  },
  retencao: {
    label: 'Retenção',
    icon: '🔒',
    color: 'bg-orange-100 text-orange-900',
    desc: 'Reter cliente em risco',
  },
  fidelizacao: {
    label: 'Fidelização',
    icon: '💎',
    color: 'bg-pink-100 text-pink-900',
    desc: 'Aumentar frequência de compra',
  },
  expansao: {
    label: 'Expansão',
    icon: '🚀',
    color: 'bg-indigo-100 text-indigo-900',
    desc: 'Vender novas categorias',
  },
};

// Status de recomendação
const STATUS_RECOMENDACAO = {
  pendente: { label: 'Pendente', icon: '⏳', color: 'bg-gray-100 text-gray-900' },
  em_andamento: { label: 'Em Andamento', icon: '⚙️', color: 'bg-yellow-100 text-yellow-900' },
  concluida: { label: 'Concluída', icon: '✅', color: 'bg-green-100 text-green-900' },
  rejeitada: { label: 'Rejeitada', icon: '❌', color: 'bg-red-100 text-red-900' },
};

interface RecomendacaoItem {
  nomeFantasia: string;
  tipo: string;
  prioridade: 'alta' | 'media' | 'baixa';
  titulo: string;
  descricao: string;
  impactoEstimado: number;
  probabilidadeSucesso: number;
  acoes: string[];
}

interface RecomendacaoComStatus extends RecomendacaoItem {
  status: 'pendente' | 'em_andamento' | 'concluida' | 'rejeitada';
  dataStatus?: Date;
  observacoes?: string;
  roiAtual?: number;
}

export default function RecomendacoesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYears, setSelectedYears] = useState<number[]>([new Date().getFullYear()]);
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [minImpacto, setMinImpacto] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRec, setExpandedRec] = useState<number | null>(null);
  const [editingRec, setEditingRec] = useState<number | null>(null);
  const [editingStatus, setEditingStatus] = useState<string>('');
  const [editingObservacoes, setEditingObservacoes] = useState<string>('');
  const [recomendacoesComStatus, setRecomendacoesComStatus] = useState<RecomendacaoComStatus[]>([]);

  // Buscar relatórios
  const { data: relatorios, isLoading, refetch } = useClienteAnalyticsRelatorios(
    selectedYears.length > 0 ? { ano: selectedYears } : undefined
  );

  // Extrair recomendações dos relatórios
  const todasRecomendacoes = useMemo(() => {
    if (!relatorios) return [];

    const recomendacoes: RecomendacaoComStatus[] = [];
    
    relatorios.forEach(cliente => {
      cliente.recomendacoes?.forEach(rec => {
        const existingRec = recomendacoesComStatus.find(
          r =>
            r.nomeFantasia === cliente.nomeFantasia &&
            r.titulo === rec.titulo &&
            r.tipo === rec.tipo
        );

        recomendacoes.push({
          ...rec,
          nomeFantasia: cliente.nomeFantasia,
          status: existingRec?.status || 'pendente',
          dataStatus: existingRec?.dataStatus,
          observacoes: existingRec?.observacoes,
          roiAtual: existingRec?.roiAtual,
        });
      });
    });

    return recomendacoes;
  }, [relatorios, recomendacoesComStatus]);

  const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const handleYearToggle = (year: number) => {
    setSelectedYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year].sort((a, b) => b - a)
    );
  };

  const handleTipoToggle = (tipo: string) => {
    setSelectedTipos(prev =>
      prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
    );
  };

  const handleStatusToggle = (status: string) => {
    setSelectedStatus(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  // Filtrar e ordenar recomendações
  const filteredRecomendacoes = useMemo(() => {
    return todasRecomendacoes
      .filter(rec => {
        const matchesSearch =
          rec.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rec.titulo.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTipo = selectedTipos.length === 0 || selectedTipos.includes(rec.tipo);
        const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(rec.status);
        const matchesImpacto = rec.impactoEstimado >= minImpacto;

        return matchesSearch && matchesTipo && matchesStatus && matchesImpacto;
      })
      .sort((a, b) => {
        // Ordenar por: Status (pendente/em_andamento primeiro), depois por impacto
        const statusOrder = { pendente: 0, em_andamento: 1, concluida: 2, rejeitada: 3 };
        const statusDiff =
          (statusOrder[a.status as keyof typeof statusOrder] || 99) -
          (statusOrder[b.status as keyof typeof statusOrder] || 99);
        if (statusDiff !== 0) return statusDiff;

        return b.impactoEstimado - a.impactoEstimado;
      });
  }, [todasRecomendacoes, searchTerm, selectedTipos, selectedStatus, minImpacto]);

  const handleSaveStatus = (index: number) => {
    const updated = [...recomendacoesComStatus];
    const rec = filteredRecomendacoes[index];
    const existingIndex = updated.findIndex(
      r =>
        r.nomeFantasia === rec.nomeFantasia &&
        r.titulo === rec.titulo &&
        r.tipo === rec.tipo
    );

    if (existingIndex >= 0) {
      updated[existingIndex] = {
        ...updated[existingIndex],
        status: editingStatus as any,
        dataStatus: new Date(),
        observacoes: editingObservacoes,
      };
    } else {
      updated.push({
        ...rec,
        status: editingStatus as any,
        dataStatus: new Date(),
        observacoes: editingObservacoes,
      });
    }

    setRecomendacoesComStatus(updated);
    setEditingRec(null);
    setEditingStatus('');
    setEditingObservacoes('');
  };

  // Calcular métricas
  const metricas = useMemo(() => {
    const total = filteredRecomendacoes.length;
    const pendentes = filteredRecomendacoes.filter(r => r.status === 'pendente').length;
    const emAndamento = filteredRecomendacoes.filter(r => r.status === 'em_andamento').length;
    const concluidas = filteredRecomendacoes.filter(r => r.status === 'concluida').length;
    const rejeitadas = filteredRecomendacoes.filter(r => r.status === 'rejeitada').length;

    const impactoTotal = filteredRecomendacoes.reduce((sum, r) => sum + r.impactoEstimado, 0);
    const impactoPotencial = filteredRecomendacoes
      .filter(r => r.status === 'pendente' || r.status === 'em_andamento')
      .reduce((sum, r) => sum + r.impactoEstimado, 0);

    const probMedia =
      filteredRecomendacoes.length > 0
        ? filteredRecomendacoes.reduce((sum, r) => sum + r.probabilidadeSucesso, 0) /
          filteredRecomendacoes.length
        : 0;

    return {
      total,
      pendentes,
      emAndamento,
      concluidas,
      rejeitadas,
      impactoTotal,
      impactoPotencial,
      probMedia,
    };
  }, [filteredRecomendacoes]);

  const handleExportCSV = () => {
    const headers = [
      'Cliente',
      'Tipo',
      'Título',
      'Prioridade',
      'Impacto Estimado',
      'Probabilidade',
      'Status',
      'Data Status',
      'Observações',
    ];
    const rows = filteredRecomendacoes.map(rec => {
      const statusRec = recomendacoesComStatus.find(
        r =>
          r.nomeFantasia === rec.nomeFantasia &&
          r.titulo === rec.titulo &&
          r.tipo === rec.tipo
      );
      return [
        rec.nomeFantasia,
        TIPO_RECOMENDACAO[rec.tipo as keyof typeof TIPO_RECOMENDACAO]?.label || rec.tipo,
        rec.titulo,
        rec.prioridade,
        numeral(rec.impactoEstimado).format('$0,0.00'),
        `${rec.probabilidadeSucesso}%`,
        STATUS_RECOMENDACAO[statusRec?.status as keyof typeof STATUS_RECOMENDACAO]?.label ||
          'Pendente',
        statusRec?.dataStatus ? new Date(statusRec.dataStatus).toLocaleDateString('pt-BR') : '-',
        statusRec?.observacoes || '-',
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recomendacoes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Carregando recomendações...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin/clientes/perfil">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Recomendações</h1>
          </div>
          <p className="text-muted-foreground">
            {filteredRecomendacoes.length} recomendação(ões) encontrada(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filtro de Anos */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Filtrar por ano:</label>
            <div className="flex gap-2 flex-wrap">
              {availableYears.map(year => (
                <button
                  key={year}
                  onClick={() => handleYearToggle(year)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    selectedYears.includes(year)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.total}</div>
            <p className="text-xs text-muted-foreground">recomendações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impacto Potencial</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{numeral(metricas.impactoPotencial).format('$0,0.00')}</div>
            <p className="text-xs text-muted-foreground">pendente/andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Probabilidade Média</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{numeral(metricas.probMedia).format('0.0')}%</div>
            <p className="text-xs text-muted-foreground">sucesso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.concluidas}</div>
            <p className="text-xs text-muted-foreground">implementadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Filtros</CardTitle>
              <CardDescription>Refine sua busca</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por cliente ou recomendação..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
            />
          </div>

          {showFilters && (
            <div className="space-y-4 border-t pt-4">
              {/* Tipos */}
              <div>
                <h4 className="font-semibold mb-2 text-sm">Tipo de Recomendação:</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(TIPO_RECOMENDACAO).map(([key, value]) => (
                    <Button
                      key={key}
                      variant={selectedTipos.includes(key) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleTipoToggle(key)}
                      className="text-xs"
                    >
                      {value.icon} {value.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <h4 className="font-semibold mb-2 text-sm">Status:</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(STATUS_RECOMENDACAO).map(([key, value]) => (
                    <Button
                      key={key}
                      variant={selectedStatus.includes(key) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusToggle(key)}
                      className="text-xs"
                    >
                      {value.icon} {value.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Impacto Mínimo */}
              <div>
                <h4 className="font-semibold mb-2 text-sm">Impacto Mínimo:</h4>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max={Math.max(...todasRecomendacoes.map(r => r.impactoEstimado), 1000)}
                    value={minImpacto}
                    onChange={e => setMinImpacto(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium">
                    {numeral(minImpacto).format('$0,0.00')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Filtros ativos */}
          {(searchTerm || selectedTipos.length > 0 || selectedStatus.length > 0 || minImpacto > 0) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {searchTerm && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchTerm('')}>
                  {searchTerm}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {selectedTipos.map(tipo => (
                <Badge
                  key={tipo}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => handleTipoToggle(tipo)}
                >
                  {TIPO_RECOMENDACAO[tipo as keyof typeof TIPO_RECOMENDACAO]?.label}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
              {selectedStatus.map(status => (
                <Badge
                  key={status}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => handleStatusToggle(status)}
                >
                  {STATUS_RECOMENDACAO[status as keyof typeof STATUS_RECOMENDACAO]?.label}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
              {minImpacto > 0 && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setMinImpacto(0)}>
                  Impacto mín: {numeral(minImpacto).format('$0,0')}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Recomendações */}
      <div className="space-y-3">
        {filteredRecomendacoes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhuma recomendação encontrada</p>
            </CardContent>
          </Card>
        ) : (
          filteredRecomendacoes.map((rec, idx) => {
            const statusRec = recomendacoesComStatus.find(
              r =>
                r.nomeFantasia === rec.nomeFantasia &&
                r.titulo === rec.titulo &&
                r.tipo === rec.tipo
            );
            const status = statusRec?.status || 'pendente';
            const tipoConfig = TIPO_RECOMENDACAO[rec.tipo as keyof typeof TIPO_RECOMENDACAO];
            const statusConfig = STATUS_RECOMENDACAO[status as keyof typeof STATUS_RECOMENDACAO];

            return (
              <Card key={idx} className={tipoConfig?.color || ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{tipoConfig?.icon}</span>
                        <Link href={`/admin/clientes/${encodeURIComponent(rec.nomeFantasia)}`}>
                          <h3 className="font-semibold hover:underline cursor-pointer">
                            {rec.nomeFantasia}
                          </h3>
                        </Link>
                        <Badge className={statusConfig?.color || ''}>
                          {statusConfig?.icon} {statusConfig?.label}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{rec.titulo}</p>
                      <p className="text-xs text-muted-foreground mt-1">{rec.descricao}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedRec(expandedRec === idx ? null : idx)
                      }
                    >
                      {expandedRec === idx ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {/* Conteúdo expandido */}
                {expandedRec === idx && (
                  <CardContent className="space-y-4 border-t pt-4">
                    {/* Métricas */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-3 bg-white/50 rounded">
                        <p className="text-xs text-muted-foreground">Impacto Estimado</p>
                        <p className="text-lg font-bold">
                          {numeral(rec.impactoEstimado).format('$0,0.00')}
                        </p>
                      </div>
                      <div className="p-3 bg-white/50 rounded">
                        <p className="text-xs text-muted-foreground">Probabilidade de Sucesso</p>
                        <p className="text-lg font-bold">{rec.probabilidadeSucesso}%</p>
                      </div>
                      <div className="p-3 bg-white/50 rounded">
                        <p className="text-xs text-muted-foreground">Prioridade</p>
                        <Badge
                          variant={
                            rec.prioridade === 'alta'
                              ? 'destructive'
                              : rec.prioridade === 'media'
                                ? 'default'
                                : 'secondary'
                          }
                        >
                          {rec.prioridade.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    {/* Ações */}
                    {rec.acoes.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Ações Sugeridas:</h4>
                        <ul className="text-sm space-y-1">
                          {rec.acoes.map((acao, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-green-600 mt-0.5">✓</span>
                              <span>{acao}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Gerenciar Status */}
                    {editingRec === idx ? (
                      <div className="space-y-3 border-t pt-3">
                        <div>
                          <label className="text-sm font-semibold mb-2 block">
                            Atualizar Status:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(STATUS_RECOMENDACAO).map(([key, value]) => (
                              <Button
                                key={key}
                                variant={editingStatus === key ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setEditingStatus(key)}
                              >
                                {value.icon} {value.label}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-semibold mb-2 block">
                            Observações (opcional):
                          </label>
                          <textarea
                            value={editingObservacoes}
                            onChange={e => setEditingObservacoes(e.target.value)}
                            placeholder="Adicione notas sobre o andamento..."
                            className="w-full p-2 border rounded text-sm bg-background"
                            rows={3}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveStatus(idx)}
                            disabled={!editingStatus}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingRec(null);
                              setEditingStatus('');
                              setEditingObservacoes('');
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 border-t pt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingRec(idx);
                            setEditingStatus(status);
                            setEditingObservacoes(statusRec?.observacoes || '');
                          }}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Gerenciar Status
                        </Button>

                        {statusRec?.observacoes && (
                          <div className="text-xs text-muted-foreground">
                            <strong>Observações:</strong> {statusRec.observacoes}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
