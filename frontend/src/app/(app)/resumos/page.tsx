'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Trash2, Eye, Filter, Plus, Loader2, Calendar, Building2, Tag } from 'lucide-react';
import { resumosService } from '@/services/resumos.service';
import { relatoriosService } from '@/services/relatorios.service';
import { useEmpresas } from '@/hooks/use-empresas';
import type { FilterResumoDto, ResumoStatus, TipoAnalise } from '@/types/api';
import { TipoAnalise as TipoAnaliseEnum } from '@/types/api';
import Link from 'next/link';

const meses = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const statusLabels: Record<ResumoStatus, string> = {
  PROCESSANDO: 'Processando',
  CONCLUIDO: 'Concluído',
  ERRO: 'Erro',
  CANCELADO: 'Cancelado',
};

const statusColors: Record<ResumoStatus, string> = {
  PROCESSANDO: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  CONCLUIDO: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  ERRO: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  CANCELADO: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const tipoAnaliseLabels: Record<TipoAnalise, string> = {
  UPLOAD: 'Upload',
  ALERTAS: 'Alertas',
  RELATORIO: 'Relatório',
  COMPARATIVO: 'Comparativo',
  GERAL: 'Geral',
};

export default function ResumosPage() {
  const [filters, setFilters] = useState<FilterResumoDto>({
    page: 1,
    limit: 20,
  });
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [mesesDisponiveis, setMesesDisponiveis] = useState<number[]>([]);

  const { data: empresas } = useEmpresas();

  // Buscar anos disponíveis
  useEffect(() => {
    const buscarAnos = async () => {
      try {
        const anos = await relatoriosService.getAnosDisponiveis();
        setAnosDisponiveis(anos);
      } catch (error) {
        console.error('Erro ao buscar anos:', error);
      }
    };
    buscarAnos();
  }, []);

  // Buscar meses disponíveis quando ano for selecionado
  useEffect(() => {
    const buscarMeses = async () => {
      if (filters.ano) {
        try {
          const meses = await relatoriosService.getMesesDisponiveis(
            filters.ano,
            filters.empresaId,
          );
          setMesesDisponiveis(meses);
        } catch (error) {
          console.error('Erro ao buscar meses:', error);
          setMesesDisponiveis([]);
        }
      } else {
        setMesesDisponiveis([]);
      }
    };
    buscarMeses();
  }, [filters.ano, filters.empresaId]);

  const {
    data: resumosData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['resumos', filters],
    queryFn: () => resumosService.list(filters),
  });

  const handleFilterChange = (key: keyof FilterResumoDto, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 1, // Resetar para primeira página ao filtrar
    }));
  };

  const handleExport = async (id: string, format: 'pdf' | 'excel' | 'json') => {
    try {
      let blob: Blob;
      let filename: string;

      if (format === 'pdf') {
        blob = await resumosService.exportPDF(id);
        filename = `resumo-${id}.pdf`;
      } else if (format === 'excel') {
        blob = await resumosService.exportExcel(id);
        filename = `resumo-${id}.xlsx`;
      } else {
        const data = await resumosService.exportJSON(id);
        const jsonStr = JSON.stringify(data, null, 2);
        blob = new Blob([jsonStr], { type: 'application/json' });
        filename = `resumo-${id}.json`;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(`Erro ao exportar ${format}:`, error);
      alert(`Erro ao exportar ${format.toUpperCase()}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este resumo?')) {
      return;
    }

    try {
      await resumosService.delete(id);
      refetch();
    } catch (error) {
      console.error('Erro ao deletar resumo:', error);
      alert('Erro ao deletar resumo');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Resumos Econômicos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e visualize seus resumos de análises
          </p>
        </div>
        <Link
          href="/analises"
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Resumo
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Empresa */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Empresa
            </label>
            <select
              value={filters.empresaId || ''}
              onChange={(e) => handleFilterChange('empresaId', e.target.value)}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Todas</option>
              {empresas?.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.razaoSocial}
                </option>
              ))}
            </select>
          </div>

          {/* Ano */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Ano
            </label>
            <select
              value={filters.ano?.toString() || ''}
              onChange={(e) => {
                handleFilterChange('ano', e.target.value ? parseInt(e.target.value) : undefined);
                handleFilterChange('mes', undefined); // Limpar mês ao mudar ano
              }}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Todos</option>
              {anosDisponiveis.map((ano) => (
                <option key={ano} value={ano.toString()}>
                  {ano}
                </option>
              ))}
            </select>
          </div>

          {/* Mês */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Mês
            </label>
            <select
              value={filters.mes?.toString() || ''}
              onChange={(e) => handleFilterChange('mes', e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={!filters.ano || mesesDisponiveis.length === 0}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
            >
              <option value="">Todos</option>
              {mesesDisponiveis.map((mes) => {
                const mesInfo = meses.find((m) => m.value === mes);
                return (
                  <option key={mes} value={mes.toString()}>
                    {mesInfo ? mesInfo.label : mes}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Todos</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Análise */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tipo
            </label>
            <select
              value={filters.tipoAnalise || ''}
              onChange={(e) => handleFilterChange('tipoAnalise', e.target.value || undefined)}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Todos</option>
              {Object.entries(tipoAnaliseLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Resumos */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">Erro ao carregar resumos</p>
        </div>
      ) : !resumosData || resumosData.data.length === 0 ? (
        <div className="bg-card rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhum resumo encontrado
          </h3>
          <p className="text-muted-foreground mb-4">
            {Object.keys(filters).length > 2
              ? 'Tente ajustar os filtros ou criar um novo resumo'
              : 'Crie seu primeiro resumo a partir de uma análise'}
          </p>
          <Link
            href="/analises"
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar Resumo
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumosData.data.map((resumo) => (
              <div
                key={resumo.id}
                className="bg-card rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                {/* Cabeçalho do Card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {resumo.titulo}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{resumo.periodo}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${statusColors[resumo.status]}`}
                  >
                    {statusLabels[resumo.status]}
                  </span>
                </div>

                {/* Informações */}
                <div className="space-y-2 mb-4">
                  {resumo.empresa && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="w-4 h-4" />
                      <span>{resumo.empresa.razaoSocial}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Tag className="w-4 h-4" />
                    <span>{tipoAnaliseLabels[resumo.tipoAnalise as TipoAnaliseEnum]}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Criado em {new Date(resumo.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 pt-4 border-t border-border">
                  <Link
                    href={`/resumos/${resumo.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalhes
                  </Link>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleExport(resumo.id, 'pdf')}
                      className="p-2 text-muted-foreground hover:bg-muted rounded transition-colors"
                      title="Exportar PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(resumo.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Deletar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginação */}
          {resumosData.totalPages > 1 && (
            <div className="flex items-center justify-between bg-card rounded-lg shadow p-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {resumosData.data.length} de {resumosData.total} resumos
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFilterChange('page', (filters.page || 1) - 1)}
                  disabled={filters.page === 1}
                  className="px-3 py-1 rounded border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                >
                  Anterior
                </button>
                <span className="text-sm text-muted-foreground">
                  Página {filters.page || 1} de {resumosData.totalPages}
                </span>
                <button
                  onClick={() => handleFilterChange('page', (filters.page || 1) + 1)}
                  disabled={(filters.page || 1) >= resumosData.totalPages}
                  className="px-3 py-1 rounded border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

