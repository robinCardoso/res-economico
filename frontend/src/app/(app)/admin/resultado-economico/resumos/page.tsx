'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { resumosService } from '@/services/resumos.service';
import { FileText, Download, Trash2, Eye, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { ResumoEconomico, FilterResumoDto, ResumoStatus } from '@/types/api';
import { TipoAnalise } from '@/types/api';

const ResumosPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FilterResumoDto>({
    ano: undefined,
    mes: undefined,
    status: undefined,
    tipoAnalise: undefined,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['resumos', filters],
    queryFn: () => resumosService.list({ ...filters, page: 1, limit: 50 }),
  });

  const deleteMutation = useMutation({
    mutationFn: resumosService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumos'] });
    },
  });

  const handleDelete = async (id: string, titulo: string) => {
    if (!confirm(`Tem certeza que deseja excluir o resumo "${titulo}"?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      alert('Erro ao excluir resumo');
    }
  };

  const handleExport = async (id: string, format: 'pdf' | 'excel' | 'json') => {
    try {
      if (format === 'pdf') {
        const blob = await resumosService.exportPDF(id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resumo-${id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else if (format === 'excel') {
        const blob = await resumosService.exportExcel(id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resumo-${id}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const json = await resumosService.exportJSON(id);
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resumo-${id}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch {
      alert(`Erro ao exportar resumo em formato ${format.toUpperCase()}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">Carregando resumos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-rose-500">
          Erro ao carregar resumos. Verifique se o backend está rodando.
        </div>
      </div>
    );
  }

  const resumos = data?.data || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground dark:text-slate-50">
            Resumos Econômicos
          </h1>
          <p className="text-sm text-muted-foreground">
            Histórico de análises salvas, respostas detalhadas e exportação de insights em PDF, Excel ou JSON.
          </p>
        </div>
      </header>

      {/* Filtros */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label htmlFor="ano" className="block text-xs font-medium text-muted-foreground mb-1">
              Ano
            </label>
            <input
              id="ano"
              type="number"
              value={filters.ano || ''}
              onChange={(e) =>
                setFilters({ ...filters, ano: e.target.value ? parseInt(e.target.value, 10) : undefined })
              }
              placeholder="Ex: 2025"
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label htmlFor="mes" className="block text-xs font-medium text-muted-foreground mb-1">
              Mês
            </label>
            <input
              id="mes"
              type="number"
              min="1"
              max="12"
              value={filters.mes || ''}
              onChange={(e) =>
                setFilters({ ...filters, mes: e.target.value ? parseInt(e.target.value, 10) : undefined })
              }
              placeholder="Ex: 11"
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-xs font-medium text-muted-foreground mb-1">
              Status
            </label>
            <select
              id="status"
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: (e.target.value || undefined) as ResumoStatus | undefined })}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Todos</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="PROCESSANDO">Processando</option>
              <option value="ERRO">Erro</option>
            </select>
          </div>
          <div>
            <label htmlFor="tipoAnalise" className="block text-xs font-medium text-muted-foreground mb-1">
              Tipo de Análise
            </label>
            <select
              id="tipoAnalise"
              value={filters.tipoAnalise || ''}
              onChange={(e) => setFilters({ ...filters, tipoAnalise: (e.target.value || undefined) as TipoAnalise | undefined })}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Todos</option>
              <option value="UPLOAD">Upload</option>
              <option value="RELATORIO">Relatório</option>
              <option value="COMPARATIVO">Comparativo</option>
              <option value="GERAL">Geral</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Resumos */}
      {total === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            Nenhum resumo encontrado. Crie análises inteligentes para gerar resumos.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Título
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Período
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Empresa
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Tipo
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Data
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {resumos.map((resumo: ResumoEconomico) => (
                  <tr key={resumo.id}>
                    <td className="px-4 py-2 text-sm font-medium text-foreground">
                      {resumo.titulo}
                    </td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">
                      {resumo.mes ? `${resumo.mes}/${resumo.ano}` : resumo.ano}
                    </td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">
                      {resumo.empresa?.nomeFantasia || resumo.empresa?.razaoSocial || 'Consolidado'}
                    </td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">
                      {resumo.tipoAnalise}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          resumo.status === 'CONCLUIDO'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                            : resumo.status === 'PROCESSANDO'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200'
                        }`}
                      >
                        {resumo.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">
                      {new Date(resumo.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/resultado-economico/resumos/${resumo.id}`}
                          className="rounded-md p-1.5 text-foreground hover:bg-muted"
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <div className="relative group">
                          <button
                            type="button"
                            className="rounded-md p-1.5 text-foreground hover:bg-muted"
                            title="Exportar"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <div className="absolute right-0 mt-1 w-32 rounded-md border border-border bg-card shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button
                              type="button"
                              onClick={() => handleExport(resumo.id, 'pdf')}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-muted"
                            >
                              PDF
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExport(resumo.id, 'excel')}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-muted"
                            >
                              Excel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExport(resumo.id, 'json')}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-muted"
                            >
                              JSON
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(resumo.id, resumo.titulo)}
                          className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumosPage;
