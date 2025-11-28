'use client';

import Link from 'next/link';
import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUpload } from '@/hooks/use-uploads';
import { useUploadProgress } from '@/hooks/use-upload-progress';
import { useContagemPorTipoConta } from '@/hooks/use-alertas';
import { formatPeriodo, getStatusLabel } from '@/lib/format';
import { uploadsService } from '@/services/uploads.service';
import { Trash2, AlertTriangle, X, Loader2, Upload } from 'lucide-react';

type UploadDetalheProps = {
  params: Promise<{ id: string }>;
};

const UploadDetalhePage = ({ params }: UploadDetalheProps) => {
  const { id } = use(params);
  const router = useRouter();
  const { data: upload, isLoading, error } = useUpload(id);
  const isProcessing = upload?.status === 'PROCESSANDO';
  const { data: progress } = useUploadProgress(id, isProcessing || false);
  const { data: contagemPorTipoConta, isLoading: isLoadingContagem, isFetching: isFetchingContagem } = useContagemPorTipoConta(
    upload ? { uploadId: upload.id } : undefined
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">Carregando detalhes do upload...</div>
      </div>
    );
  }

  if (error || !upload) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-rose-500">
          Erro ao carregar upload. Verifique se o backend está rodando.
        </div>
      </div>
    );
  }

  const alertasPendentes = upload.alertas?.filter((a) => a.status === 'ABERTO') || [];

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await uploadsService.remove(id);
      router.push('/admin/resultado-economico/uploads');
    } catch (err) {
      console.error('Erro ao remover upload:', err);
      alert('Erro ao remover upload. Tente novamente.');
      setIsDeleting(false);
    }
  };

  const handleReprocessar = async () => {
    if (!confirm('Tem certeza que deseja reprocessar este upload?\n\nIsso irá:\n- Limpar todas as linhas e alertas atuais\n- Reprocessar o arquivo Excel novamente\n- Atualizar o catálogo de contas')) {
      return;
    }

    setIsReprocessing(true);
    try {
      console.log(`[Reprocessar] Iniciando reprocessamento do upload ${id}...`);
      await uploadsService.reprocessar(id);
      console.log(`[Reprocessar] Reprocessamento iniciado com sucesso. Aguardando processamento...`);
      
      // Aguardar um pouco antes de recarregar para dar tempo do backend processar
      setTimeout(() => {
        console.log(`[Reprocessar] Recarregando página...`);
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('[Reprocessar] Erro ao reprocessar upload:', err);
      alert(`Erro ao reprocessar upload: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      setIsReprocessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Upload {id.slice(0, 8)}
          </h1>
          <p className="text-sm text-muted-foreground">
            Resumo do processamento, alertas detectados e histórico de alterações.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/resultado-economico/uploads/novo"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Novo Upload
          </Link>
          <button
            onClick={handleReprocessar}
            disabled={isReprocessing || isProcessing}
            className="inline-flex items-center gap-2 rounded-md border border-sky-400 bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:border-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 transition-colors"
          >
            {isReprocessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Reprocessando...
              </>
            ) : (
              'Reprocessar'
            )}
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-2 rounded-md border border-rose-400 px-4 py-2 text-sm font-medium text-rose-500 hover:bg-rose-500/10 dark:border-rose-500/60 dark:text-rose-300 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Remover upload
          </button>
        </div>
      </header>

      {/* Barra de Progresso - Aparece apenas quando o upload está em status PROCESSANDO */}
      {isProcessing && (
        <section className="rounded-xl border border-sky-200 bg-sky-50/50 p-6 shadow-sm dark:border-sky-800 dark:bg-sky-900/20">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground">
              Processamento em andamento
            </h2>
            <span className="text-xs font-medium text-sky-600 dark:text-sky-400">
              {progress?.progress || 0}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 dark:bg-slate-700 mb-2">
            <div
              className="bg-sky-500 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress?.progress || 0}%` }}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin text-sky-500" />
            <span>{progress?.etapa || 'Iniciando processamento...'}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            O processamento está sendo executado em background. Esta página será atualizada automaticamente.
          </p>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <h2 className="text-xs font-semibold text-foreground mb-2">
            Informações gerais
          </h2>
          <dl className="space-y-1.5 text-xs">
            <div className="flex justify-between items-start gap-2">
              <dt className="text-muted-foreground font-medium min-w-[60px]">Empresa</dt>
              <dd className="text-foreground text-right truncate" title={upload.empresa?.razaoSocial || undefined}>
                {upload.empresa?.razaoSocial || 'N/A'}
              </dd>
            </div>
            <div className="flex justify-between items-center gap-2">
              <dt className="text-muted-foreground font-medium min-w-[60px]">Período</dt>
              <dd className="text-foreground  text-right">
                {formatPeriodo(upload.mes, upload.ano)}
              </dd>
            </div>
            <div className="flex justify-between items-start gap-2">
              <dt className="text-muted-foreground font-medium min-w-[60px]">Arquivo</dt>
              <dd className="text-foreground  text-right truncate max-w-[220px]" title={upload.nomeArquivo || undefined}>
                {upload.nomeArquivo || 'N/A'}
              </dd>
            </div>
            <div className="flex justify-between items-center gap-2">
              <dt className="text-muted-foreground font-medium min-w-[60px]">Linhas</dt>
              <dd className="text-foreground  text-right">{upload.totalLinhas}</dd>
            </div>
            <div className="flex justify-between items-center gap-2">
              <dt className="text-muted-foreground font-medium min-w-[60px]">Alertas</dt>
              <dd className={`text-right ${alertasPendentes.length > 0 ? 'text-amber-500 font-medium' : 'text-foreground '}`}>
                {alertasPendentes.length} pendentes
              </dd>
            </div>
          </dl>

          {/* Contagem por Tipo de Conta */}
          {upload && (
            <div className="mt-3 border-t border-slate-200 pt-2 dark:border-slate-800">
              <h3 className="text-[10px] font-semibold text-foreground  mb-1.5">
                Alertas por Tipo de Conta
              </h3>
              {(isLoadingContagem || isFetchingContagem) ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                  <span className="ml-2 text-[10px] text-muted-foreground ">Carregando...</span>
                </div>
              ) : contagemPorTipoConta && contagemPorTipoConta.length > 0 ? (
                <div className="space-y-1">
                  {contagemPorTipoConta.map((item) => (
                    <div
                      key={item.tipoConta}
                      className="flex items-center justify-between rounded bg-muted px-2 py-1"
                    >
                      <span className="text-[10px] text-muted-foreground  truncate">{item.tipoConta}</span>
                      <span className="inline-flex items-center justify-center rounded-full bg-sky-500 px-1.5 py-0.5 text-[9px] font-semibold text-white dark:bg-sky-600 ml-2 flex-shrink-0">
                        {item.quantidade}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-muted-foreground  py-2 text-center">
                  Nenhum alerta por tipo de conta
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground ">
            Alertas detectados
          </h2>
          {!upload.alertas || upload.alertas.length === 0 ? (
            <div className="mt-4 text-sm text-muted-foreground">Nenhum alerta encontrado.</div>
          ) : (
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground  max-h-[500px] overflow-y-auto pr-2">
              {upload.alertas.map((alerta) => (
                <li
                  key={alerta.id}
                  className={`rounded-lg border p-4 transition-all ${
                    alerta.severidade === 'ALTA'
                      ? 'border-rose-300/60 bg-rose-50/60 dark:border-rose-400/30 dark:bg-rose-400/10'
                      : alerta.tipo === 'CONTA_NOVA'
                        ? 'border-sky-300/60 bg-sky-50/60 dark:border-sky-400/30 dark:bg-sky-400/10'
                        : 'border-amber-300/60 bg-amber-50/60 dark:border-amber-400/30 dark:bg-amber-400/10'
                  } group hover:shadow-md`}
                >
                  <Link
                    href={`/admin/resultado-economico/alertas?alertaId=${alerta.id}`}
                    className="flex items-start justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex-1">
                      {alerta.linha
                        ? `${getStatusLabel(alerta.tipo)} na conta ${alerta.linha.classificacao} - ${alerta.linha.nomeConta}`
                        : alerta.mensagem}
                    </div>
                    <span
                      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        alerta.status === 'ABERTO'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-400/20 dark:text-rose-200'
                          : alerta.status === 'EM_ANALISE'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200'
                      }`}
                    >
                      {getStatusLabel(alerta.status)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground ">
            Histórico do upload
          </h2>
          <Link
            href="/admin/resultado-economico/uploads"
            className="text-xs font-medium text-sky-500 hover:text-sky-400"
          >
            Voltar para lista
          </Link>
        </div>
        <div className="mt-4 rounded-lg border border-border bg-muted/60 p-4 text-sm text-muted-foreground">
          {upload.linhas && upload.linhas.length > 0 ? (
            <div>
              Total de linhas: {upload.linhas.length}. Visualização detalhada em
              desenvolvimento.
            </div>
          ) : (
            <div>Visualização detalhada das linhas importadas em desenvolvimento.</div>
          )}
        </div>
      </section>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-rose-100 p-2 dark:bg-rose-900/20">
                  <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground ">
                  Confirmar exclusão
                </h3>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-slate-400 hover:text-muted-foreground dark:hover:text-slate-300"
                disabled={isDeleting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4">
              <p className="text-sm text-muted-foreground  mb-4">
                Tem certeza que deseja remover este upload? Esta ação não pode ser desfeita.
              </p>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20 mb-4">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-2">
                  Será removido permanentemente:
                </p>
                <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
                  <li>O registro do upload</li>
                  <li>Todas as {upload.totalLinhas || 0} linhas importadas</li>
                  <li>Todos os {upload.alertas?.length || 0} alertas relacionados</li>
                  <li>O arquivo Excel físico do servidor</li>
                </ul>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-1">
                  Não será afetado:
                </p>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                  <li>O catálogo de contas (ContaCatalogo)</li>
                  <li>A empresa associada</li>
                  <li>Outros uploads</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-md bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Removendo...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Sim, remover
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadDetalhePage;

