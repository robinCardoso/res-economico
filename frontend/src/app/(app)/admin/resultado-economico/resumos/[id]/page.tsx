'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { resumosService } from '@/services/resumos.service';
import { ArrowLeft, Download, Calendar, Building2, User, Loader2, AlertCircle } from 'lucide-react';

const ResumoSection = ({ texto }: { texto: string }) => (
  <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
    <h2 className="mb-4 text-lg font-semibold text-foreground">Resumo</h2>
    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{texto}</p>
  </div>
);

interface Insight {
  tipo: string;
  titulo: string;
  descricao?: string;
  recomendacao?: string;
  confianca?: number | string;
}

interface PadraoAnomalo {
  tipo: string;
  descricao: string;
  severidade: string;
}

interface ResultadoAnalise {
  resumo?: string;
  insights?: Insight[];
  padroesAnomalos?: PadraoAnomalo[];
}

const ResumoDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: resumo, isLoading, error } = useQuery({
    queryKey: ['resumo', id],
    queryFn: () => resumosService.getById(id),
    enabled: !!id,
  });

  const handleExport = async (format: 'pdf' | 'excel' | 'json') => {
    if (!id) return;

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
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando resumo...</span>
      </div>
    );
  }

  if (error || !resumo) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <p className="text-sm text-rose-500">
          {error instanceof Error ? error.message : 'Erro ao carregar resumo. Verifique se o backend está rodando.'}
        </p>
        <button
          onClick={() => router.back()}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Voltar
        </button>
      </div>
    );
  }

  const resultado = (resumo.resultado || {}) as ResultadoAnalise;
  const resumoTexto: string | null = typeof resultado.resumo === 'string' ? resultado.resumo : null;

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
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground dark:text-slate-50">
            {resumo.titulo}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{resumo.mes ? `${resumo.mes}/${resumo.ano}` : resumo.ano}</span>
            </div>
            {resumo.empresa && (
              <div className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                <span>{resumo.empresa.nomeFantasia || resumo.empresa.razaoSocial}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <span>{new Date(resumo.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
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
          </div>
        </div>
        <div className="relative group">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <div className="absolute right-0 mt-1 w-32 rounded-md border border-border bg-card shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              className="w-full px-3 py-2 text-left text-xs hover:bg-muted"
            >
              PDF
            </button>
            <button
              type="button"
              onClick={() => handleExport('excel')}
              className="w-full px-3 py-2 text-left text-xs hover:bg-muted"
            >
              Excel
            </button>
            <button
              type="button"
              onClick={() => handleExport('json')}
              className="w-full px-3 py-2 text-left text-xs hover:bg-muted"
            >
              JSON
            </button>
          </div>
        </div>
      </header>

      {/* Resumo */}
      {resumoTexto !== null && resumoTexto.length > 0 ? (
        <ResumoSection texto={resumoTexto} />
      ) : null}

      {/* Insights */}
      {resultado?.insights && Array.isArray(resultado.insights) && resultado.insights.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Insights</h2>
          <div className="space-y-4">
            {resultado.insights.map((insight: Insight, index: number) => (
              <div
                key={index}
                className="rounded-md border border-border bg-muted p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      insight.tipo === 'POSITIVO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : insight.tipo === 'ATENCAO'
                          ? 'bg-yellow-100 text-yellow-800'
                          : insight.tipo === 'CRITICO'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {insight.tipo}
                  </span>
                  {insight.confianca && (
                    <span className="text-xs text-muted-foreground">
                      Confiança: {String(insight.confianca)}%
                    </span>
                  )}
                </div>
                <h3 className="mb-1 font-medium text-foreground">{insight.titulo}</h3>
                {insight.descricao && (
                  <p className="text-sm text-muted-foreground">{insight.descricao}</p>
                )}
                {insight.recomendacao && (
                  <p className="mt-2 text-sm font-medium text-foreground">
                    Recomendação: {insight.recomendacao}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Padrões Anômalos */}
      {resultado?.padroesAnomalos && Array.isArray(resultado.padroesAnomalos) && resultado.padroesAnomalos.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Padrões Anômalos</h2>
          <div className="space-y-2">
            {resultado.padroesAnomalos.map((padrao: PadraoAnomalo, index: number) => (
              <div
                key={index}
                className="rounded-md border border-border bg-muted p-3"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      padrao.severidade === 'ALTA'
                        ? 'bg-rose-100 text-rose-800'
                        : padrao.severidade === 'MEDIA'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {padrao.severidade}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{padrao.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informações Adicionais */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Informações Adicionais</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Tipo de Análise</dt>
            <dd className="mt-1 text-sm text-foreground">{resumo.tipoAnalise}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Modelo de IA</dt>
            <dd className="mt-1 text-sm text-foreground">{resumo.modeloIA}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Data de Criação</dt>
            <dd className="mt-1 text-sm text-foreground">
              {new Date(resumo.createdAt).toLocaleString('pt-BR')}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Última Atualização</dt>
            <dd className="mt-1 text-sm text-foreground">
              {new Date(resumo.updatedAt).toLocaleString('pt-BR')}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default ResumoDetailPage;
