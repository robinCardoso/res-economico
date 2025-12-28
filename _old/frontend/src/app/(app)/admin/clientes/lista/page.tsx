'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Users,
  TrendingUp,
  RefreshCw,
  Download,
  ArrowLeft,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react';
import numeral from 'numeral';
import { useClienteAnalyticsRelatorios } from '@/hooks/use-cliente-analytics';

// Tipos de ordenação
type SortField = 'nome' | 'segmento' | 'receita' | 'ultimaCompra' | 'ltv' | 'frequencia';
type SortDirection = 'asc' | 'desc';

// Configuração de segmentos
const SEGMENTO_CONFIG = {
  campeoes: { label: 'Campeões', color: 'bg-yellow-100 text-yellow-900', icon: '👑' },
  fieis: { label: 'Fiéis', color: 'bg-blue-100 text-blue-900', icon: '💚' },
  grandes_gastadores: { label: 'Grandes Gastadores', color: 'bg-green-100 text-green-900', icon: '💰' },
  promissores: { label: 'Promissores', color: 'bg-purple-100 text-purple-900', icon: '⭐' },
  necessitam_atencao: { label: 'Necessitam Atenção', color: 'bg-orange-100 text-orange-900', icon: '👀' },
  em_risco: { label: 'Em Risco', color: 'bg-red-100 text-red-900', icon: '⚠️' },
  perdidos: { label: 'Perdidos', color: 'bg-slate-100 text-slate-900', icon: '😢' },
  hibernando: { label: 'Hibernando', color: 'bg-cyan-100 text-cyan-900', icon: '😴' },
};

interface ClienteItem {
  nomeFantasia: string;
  uf?: string;
  metricas: {
    receitaTotal: number;
    frequenciaCompra: number;
    ultimaCompra: Date;
  };
  segmentacao: {
    segmento: string;
  };
}

export default function ListaClientesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYears, setSelectedYears] = useState<number[]>([new Date().getFullYear()]);
  const [selectedSegmentos, setSelectedSegmentos] = useState<string[]>([]);
  const [selectedUFs, setSelectedUFs] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('receita');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showFilters, setShowFilters] = useState(false);

  // Buscar relatórios
  const { data: relatorios, isLoading, refetch } = useClienteAnalyticsRelatorios(
    selectedYears.length > 0 ? { ano: selectedYears } : undefined
  );

  const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const handleYearToggle = (year: number) => {
    setSelectedYears(prev =>
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year].sort((a, b) => b - a)
    );
    setCurrentPage(1);
  };

  const handleSegmentoToggle = (segmento: string) => {
    setSelectedSegmentos(prev =>
      prev.includes(segmento) ? prev.filter(s => s !== segmento) : [...prev, segmento]
    );
    setCurrentPage(1);
  };

  const handleUFToggle = (uf: string) => {
    setSelectedUFs(prev => (prev.includes(uf) ? prev.filter(u => u !== uf) : [...prev, uf]));
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  // Filtrar e ordenar dados
  const filteredAndSortedData = useMemo(() => {
    if (!relatorios) return [];

    let filtered = relatorios.filter(cliente => {
      const matchesSearch = cliente.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSegmento = selectedSegmentos.length === 0 || selectedSegmentos.includes(cliente.segmentacao.segmento);
      const matchesUF = selectedUFs.length === 0 || (cliente.uf && selectedUFs.includes(cliente.uf));

      return matchesSearch && matchesSegmento && matchesUF;
    });

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'nome':
          aValue = a.nomeFantasia;
          bValue = b.nomeFantasia;
          break;
        case 'segmento':
          aValue = a.segmentacao.segmento;
          bValue = b.segmentacao.segmento;
          break;
        case 'receita':
          aValue = a.metricas.receitaTotal;
          bValue = b.metricas.receitaTotal;
          break;
        case 'ultimaCompra':
          aValue = new Date(a.metricas.ultimaCompra).getTime();
          bValue = new Date(b.metricas.ultimaCompra).getTime();
          break;
        case 'ltv':
          aValue = a.metricas.receitaTotal;
          bValue = b.metricas.receitaTotal;
          break;
        case 'frequencia':
          aValue = a.metricas.frequenciaCompra;
          bValue = b.metricas.frequenciaCompra;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [relatorios, searchTerm, selectedSegmentos, selectedUFs, sortField, sortDirection]);

  // Paginação
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIdx, endIdx);

  // UFs únicos
  const uniqueUFs = Array.from(
    new Set(relatorios?.filter(c => c.uf).map(c => c.uf) || [])
  ).sort();

  // Segmentos disponíveis
  const availableSegmentos = [
    'campeoes',
    'fieis',
    'grandes_gastadores',
    'promissores',
    'necessitam_atencao',
    'em_risco',
    'perdidos',
    'hibernando',
  ];

  const handleExportCSV = () => {
    const headers = ['Nome', 'Segmento', 'UF', 'Receita Total', 'Última Compra', 'LTV', 'Frequência'];
    const rows = filteredAndSortedData.map(cliente => [
      cliente.nomeFantasia,
      SEGMENTO_CONFIG[cliente.segmentacao.segmento as keyof typeof SEGMENTO_CONFIG]?.label || cliente.segmentacao.segmento,
      cliente.uf || '-',
      numeral(cliente.metricas.receitaTotal).format('$0,0.00'),
      new Date(cliente.metricas.ultimaCompra).toLocaleDateString('pt-BR'),
      numeral(cliente.metricas.receitaTotal).format('$0,0.00'),
      `${numeral(cliente.metricas.frequenciaCompra).format('0.0')}/mês`,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lista-clientes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
        <div className="container mx-auto p-4">
        <div className="text-center py-8">Carregando lista de clientes...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Link href="/admin/clientes/perfil">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Lista de Clientes</h1>
          </div>
          <p className="text-muted-foreground">
            {filteredAndSortedData.length} cliente(s) encontrado(s)
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
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium">Filtrar por ano:</label>
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

      {/* Busca e Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Filtros</CardTitle>
              <CardDescription className="text-xs">Refine sua busca</CardDescription>
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

        <CardContent className="space-y-3">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg bg-background"
            />
          </div>

          {/* Filtros expandíveis */}
          {showFilters && (
            <div className="space-y-3 border-t pt-3">
              {/* Segmentos */}
              <div>
                <h4 className="font-semibold mb-1 text-xs">Segmento:</h4>
                <div className="flex flex-wrap gap-1.5">
                  {availableSegmentos.map(segmento => (
                    <Button
                      key={segmento}
                      variant={selectedSegmentos.includes(segmento) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSegmentoToggle(segmento)}
                      className="text-xs"
                    >
                      {SEGMENTO_CONFIG[segmento as keyof typeof SEGMENTO_CONFIG]?.icon}
                      {SEGMENTO_CONFIG[segmento as keyof typeof SEGMENTO_CONFIG]?.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* UFs */}
              {uniqueUFs.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-1 text-xs">Estado (UF):</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {uniqueUFs.map(uf => (
                      <Button
                        key={uf}
                        variant={selectedUFs.includes(uf) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleUFToggle(uf)}
                        className="text-xs"
                      >
                        {uf}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filtros ativos */}
          {(searchTerm || selectedSegmentos.length > 0 || selectedUFs.length > 0) && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t">
              {searchTerm && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setSearchTerm('')}
                >
                  Nome: {searchTerm}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {selectedSegmentos.map(seg => (
                <Badge
                  key={seg}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => handleSegmentoToggle(seg)}
                >
                  {SEGMENTO_CONFIG[seg as keyof typeof SEGMENTO_CONFIG]?.label}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
              {selectedUFs.map(uf => (
                <Badge
                  key={uf}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => handleUFToggle(uf)}
                >
                  {uf}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="pt-4">
          {filteredAndSortedData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum cliente encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-semibold cursor-pointer hover:bg-muted" onClick={() => handleSort('nome')}>
                      <div className="flex items-center gap-2">
                        Nome
                        {sortField === 'nome' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="text-left py-2 px-3 font-semibold cursor-pointer hover:bg-muted" onClick={() => handleSort('segmento')}>
                      <div className="flex items-center gap-2">
                        Segmento
                        {sortField === 'segmento' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="text-left py-2 px-3 font-semibold">UF</th>
                    <th className="text-right py-2 px-3 font-semibold cursor-pointer hover:bg-muted" onClick={() => handleSort('receita')}>
                      <div className="flex items-center justify-end gap-2">
                        Receita Total
                        {sortField === 'receita' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="text-left py-2 px-3 font-semibold cursor-pointer hover:bg-muted" onClick={() => handleSort('ultimaCompra')}>
                      <div className="flex items-center gap-2">
                        Última Compra
                        {sortField === 'ultimaCompra' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="text-right py-2 px-3 font-semibold cursor-pointer hover:bg-muted" onClick={() => handleSort('frequencia')}>
                      <div className="flex items-center justify-end gap-2">
                        Frequência
                        {sortField === 'frequencia' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="text-center py-2 px-3 font-semibold">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((cliente, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50 transition-colors text-xs">
                      <td className="py-2 px-3">
                        <p className="font-medium text-xs">{cliente.nomeFantasia}</p>
                      </td>
                      <td className="py-2 px-3">
                        <Badge
                          className={
                            SEGMENTO_CONFIG[cliente.segmentacao.segmento as keyof typeof SEGMENTO_CONFIG]?.color ||
                            'bg-gray-100'
                          }
                        >
                          {SEGMENTO_CONFIG[cliente.segmentacao.segmento as keyof typeof SEGMENTO_CONFIG]?.icon}
                          {SEGMENTO_CONFIG[cliente.segmentacao.segmento as keyof typeof SEGMENTO_CONFIG]?.label ||
                            cliente.segmentacao.segmento}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">
                        {cliente.uf || '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-xs">
                        {numeral(cliente.metricas.receitaTotal).format('$0,0.00')}
                      </td>
                      <td className="py-2 px-3 text-xs">
                        {new Date(cliente.metricas.ultimaCompra).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-2 px-3 text-right text-xs">
                        {numeral(cliente.metricas.frequenciaCompra).format('0.0')}/mês
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Link href={`/admin/clientes/${encodeURIComponent(cliente.nomeFantasia)}`}>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {filteredAndSortedData.length > 0 && (
        <div className="flex items-center justify-between text-xs gap-2">
          <div className="text-xs text-muted-foreground">
            Mostrando {startIdx + 1} a {Math.min(endIdx, filteredAndSortedData.length)} de{' '}
            {filteredAndSortedData.length} cliente(s)
          </div>

          <div className="flex items-center gap-1">
            <select
              value={itemsPerPage}
              onChange={e => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded px-2 py-1 text-xs bg-background"
            >
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>

            <div className="flex items-center gap-0.5">
              {(() => {
                const pages = [];
                let startPage = Math.max(1, currentPage - 2);
                let endPage = Math.min(totalPages, startPage + 4);
                
                // Ajustar se não temos 5 páginas no final
                if (endPage - startPage < 4) {
                  startPage = Math.max(1, endPage - 4);
                }
                
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <Button
                      key={`page-${i}`}
                      variant={currentPage === i ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(i)}
                    >
                      {i}
                    </Button>
                  );
                }
                
                return pages;
              })()}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
