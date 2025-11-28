'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  FileText,
  Download,
  Trash2,
  ArrowLeft,
  Calendar,
  Building2,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { resumosService } from '@/services/resumos.service';
import { uploadsService } from '@/services/uploads.service';
import type { Insight, PadraoAnomalo, SugestaoCorrecao } from '@/types/api';
import { ConfiguracaoCard } from '@/components/configuracao/ConfiguracaoCard';
import { ModeloNegocioBadge } from '@/components/configuracao/ModeloNegocioBadge';
import { MetricasModelo } from '@/components/configuracao/MetricasModelo';

type ResumoDetalheProps = {
  params: Promise<{ id: string }>;
};

const statusLabels: Record<string, string> = {
  PROCESSANDO: 'Processando',
  CONCLUIDO: 'Concluído',
  ERRO: 'Erro',
  CANCELADO: 'Cancelado',
};

const statusColors: Record<string, string> = {
  PROCESSANDO: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  CONCLUIDO: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  ERRO: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  CANCELADO: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const insightIcons: Record<string, typeof CheckCircle2> = {
  POSITIVO: CheckCircle2,
  ATENCAO: AlertTriangle,
  CRITICO: XCircle,
  INFORMATIVO: Info,
};

const insightColors: Record<string, string> = {
  POSITIVO: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
  ATENCAO: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
  CRITICO: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
  INFORMATIVO: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
};

const severidadeColors: Record<string, string> = {
  BAIXA: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  MEDIA: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  ALTA: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function ResumoDetalhePage({ params }: ResumoDetalheProps) {
  const { id } = use(params);
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const {
    data: resumo,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['resumo', id],
    queryFn: () => resumosService.getById(id),
  });

  // Buscar upload se disponível para calcular métricas
  const { data: upload } = useQuery({
    queryKey: ['upload', resumo?.uploadId],
    queryFn: () => {
      if (!resumo?.uploadId) return null;
      return uploadsService.getById(resumo.uploadId);
    },
    enabled: !!resumo?.uploadId,
  });

  const resultado = resumo?.resultado as {
    insights?: Insight[];
    padroesAnomalos?: PadraoAnomalo[];
    sugestoesCorrecao?: SugestaoCorrecao[];
    resumo?: string;
  } | undefined;

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja deletar este resumo?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await resumosService.delete(id);
      router.push('/resumos');
    } catch (error) {
      console.error('Erro ao deletar resumo:', error);
      alert('Erro ao deletar resumo');
      setIsDeleting(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'json') => {
    setIsExporting(format);
    try {
      let blob: Blob;
      let filename: string;

      if (format === 'pdf') {
        blob = await resumosService.exportPDF(id);
        filename = `resumo-${resumo?.titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase() || id}.pdf`;
      } else if (format === 'excel') {
        blob = await resumosService.exportExcel(id);
        filename = `resumo-${resumo?.titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase() || id}.xlsx`;
      } else {
        const data = await resumosService.exportJSON(id);
        const jsonStr = JSON.stringify(data, null, 2);
        blob = new Blob([jsonStr], { type: 'application/json' });
        filename = `resumo-${resumo?.titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase() || id}.json`;
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
    } finally {
      setIsExporting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (error || !resumo) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">Erro ao carregar resumo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Link
            href="/resumos"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-slate-100 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Resumos
          </Link>
          <h1 className="text-3xl font-bold text-foreground dark:text-slate-100 mb-2">
            {resumo.titulo}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{resumo.periodo || (resumo.mes ? `${resumo.mes}/${resumo.ano}` : resumo.ano.toString())}</span>
            </div>
            {resumo.empresa && (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>{resumo.empresa.razaoSocial}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              <span>{resumo.tipoAnalise}</span>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[resumo.status]}`}>
              {statusLabels[resumo.status]}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting !== null}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            title="Exportar PDF"
          >
            {isExporting === 'pdf' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            PDF
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={isExporting !== null}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            title="Exportar Excel"
          >
            {isExporting === 'excel' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Excel
          </button>
          <button
            onClick={() => handleExport('json')}
            disabled={isExporting !== null}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            title="Exportar JSON"
          >
            {isExporting === 'json' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            JSON
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            title="Deletar"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Metadados */}
      <div className="bg-card rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-foreground dark:text-slate-100 mb-4">
          Informações
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground dark:text-slate-400">Modelo IA</label>
            <p className="text-foreground dark:text-slate-100">{resumo.modeloIA}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground dark:text-slate-400">Criado em</label>
            <p className="text-foreground dark:text-slate-100">
              {new Date(resumo.createdAt).toLocaleString('pt-BR')}
            </p>
          </div>
          {resumo.criadoPor && (
            <div>
              <label className="text-sm font-medium text-muted-foreground dark:text-slate-400">Criado por</label>
              <p className="text-foreground dark:text-slate-100">{resumo.criadoPor}</p>
            </div>
          )}
          {resumo.empresa?.modeloNegocio && (
            <div>
              <label className="text-sm font-medium text-muted-foreground dark:text-slate-400">Modelo de Negócio</label>
              <div className="mt-1">
                <ModeloNegocioBadge modelo={resumo.empresa.modeloNegocio} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card de Configuração Aplicada */}
      {resumo.empresa && (
        <ConfiguracaoCard empresa={resumo.empresa} />
      )}

      {/* Métricas do Modelo (se upload disponível) */}
      {resumo.empresa && upload?.linhas && upload.linhas.length > 0 && (
        <MetricasModelo
          empresa={resumo.empresa}
          relatorioContas={upload.linhas.map((linha) => ({
            classificacao: linha.classificacao,
            conta: linha.conta,
            subConta: linha.subConta || null,
            saldoAtual: typeof linha.saldoAtual === 'number' 
              ? linha.saldoAtual 
              : typeof linha.saldoAtual === 'string'
              ? parseFloat(linha.saldoAtual)
              : 0,
          }))}
        />
      )}

      {/* Resumo da Análise */}
      {resultado?.resumo && (
        <div className="bg-card rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-sky-600" />
            <h2 className="text-lg font-semibold text-foreground dark:text-slate-100">
              Resumo da Análise
            </h2>
          </div>
          <div
            className="text-foreground dark:text-slate-300 whitespace-pre-wrap break-words"
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {resultado.resumo}
          </div>
        </div>
      )}

      {/* Insights */}
      {resultado?.insights && resultado.insights.length > 0 && (
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-foreground dark:text-slate-100 mb-4">
            Insights ({resultado.insights.length})
          </h2>
          <div className="space-y-4">
            {resultado.insights.map((insight, index) => {
              const Icon = insightIcons[insight.tipo] || Info;
              return (
                <div
                  key={index}
                  className={`rounded-lg border p-4 ${insightColors[insight.tipo]}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-foreground dark:text-slate-100">
                          {insight.titulo}
                        </h3>
                        <span className="text-xs text-muted-foreground dark:text-slate-400">
                          Confiança: {insight.confianca}%
                        </span>
                      </div>
                      <p className="text-foreground dark:text-slate-300 mb-2">{insight.descricao}</p>
                      {insight.recomendacao && (
                        <div className="mt-2 p-2 bg-muted/50 rounded">
                          <p className="text-sm font-medium text-foreground dark:text-slate-100">
                            Recomendação:
                          </p>
                          <p className="text-sm text-foreground dark:text-slate-300">
                            {insight.recomendacao}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Padrões Anômalos */}
      {resultado?.padroesAnomalos && resultado.padroesAnomalos.length > 0 && (
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-foreground dark:text-slate-100 mb-4">
            Padrões Anômalos ({resultado.padroesAnomalos.length})
          </h2>
          <div className="space-y-3">
            {resultado.padroesAnomalos.map((padrao, index) => (
              <div
                key={index}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-foreground dark:text-slate-100">{padrao.tipo}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${severidadeColors[padrao.severidade]}`}>
                    {padrao.severidade}
                  </span>
                </div>
                <p className="text-foreground dark:text-slate-300">{padrao.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sugestões de Correção */}
      {resultado?.sugestoesCorrecao && resultado.sugestoesCorrecao.length > 0 && (
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-foreground dark:text-slate-100 mb-4">
            Sugestões de Correção ({resultado.sugestoesCorrecao.length})
          </h2>
          <div className="space-y-3">
            {resultado.sugestoesCorrecao.map((sugestao, index) => (
              <div
                key={index}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-foreground dark:text-slate-100">Problema</h3>
                  <span className="text-xs text-muted-foreground dark:text-slate-400">
                    Confiança: {sugestao.confianca}%
                  </span>
                </div>
                <p className="text-foreground dark:text-slate-300 mb-3">{sugestao.problema}</p>
                <div>
                  <h4 className="font-medium text-foreground dark:text-slate-100 mb-1">Solução</h4>
                  <p className="text-foreground dark:text-slate-300">{sugestao.solucao}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado vazio se não houver dados */}
      {(!resultado?.resumo &&
        (!resultado?.insights || resultado.insights.length === 0) &&
        (!resultado?.padroesAnomalos || resultado.padroesAnomalos.length === 0) &&
        (!resultado?.sugestoesCorrecao || resultado.sugestoesCorrecao.length === 0)) && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold text-foreground dark:text-slate-100 mb-2">
            Nenhum dado de análise disponível
          </h3>
          <p className="text-muted-foreground dark:text-slate-400">
            Este resumo não contém dados de análise.
          </p>
        </div>
      )}
    </div>
  );
}

