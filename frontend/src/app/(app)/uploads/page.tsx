'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUploads } from '@/hooks/use-uploads';
import { useEmpresas } from '@/hooks/use-empresas';
import { formatPeriodo, formatDateTime, getStatusLabel } from '@/lib/format';
import { maskCNPJ } from '@/lib/masks';
import { Building2, AlertCircle, FileText, Calendar, Clock, Loader2 } from 'lucide-react';

const UploadsPage = () => {
  const { data: uploads, isLoading, error } = useUploads();
  const { data: empresas } = useEmpresas();
  const [empresaFiltro, setEmpresaFiltro] = useState<string>('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-slate-500">Carregando uploads...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-rose-500">
          Erro ao carregar uploads. Verifique se o backend está rodando.
        </div>
      </div>
    );
  }

  // Garantir que uploads seja sempre um array
  const uploadsList = Array.isArray(uploads) ? uploads : [];
  const empresasList = Array.isArray(empresas) ? empresas : [];

  // Filtrar uploads por empresa se filtro estiver selecionado
  const uploadsFiltrados = empresaFiltro
    ? uploadsList.filter((upload) => upload.empresaId === empresaFiltro)
    : uploadsList;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Uploads
          </h1>
          <p className="text-sm text-slate-500">
            Histórico de importações por empresa, período e status.
          </p>
        </div>
        <Link
          href="/uploads/novo"
          className="inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
        >
          Novo upload
        </Link>
      </header>

      {/* Filtro por empresa */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex items-center gap-4">
          <label htmlFor="empresa-filtro" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Filtrar por empresa:
          </label>
          <select
            id="empresa-filtro"
            value={empresaFiltro}
            onChange={(e) => setEmpresaFiltro(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Todas as empresas</option>
            {empresasList.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.razaoSocial} {empresa.nomeFantasia ? `(${empresa.nomeFantasia})` : ''} - {maskCNPJ(empresa.cnpj)}
              </option>
            ))}
          </select>
          {empresaFiltro && (
            <span className="text-xs text-slate-500">
              {uploadsFiltrados.length} upload(s) encontrado(s)
            </span>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        {uploadsFiltrados.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            {empresaFiltro
              ? 'Nenhum upload encontrado para esta empresa.'
              : 'Nenhum upload encontrado. Comece criando um novo upload.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs dark:divide-slate-800">
              <thead className="bg-slate-50/60 dark:bg-slate-900/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 min-w-[240px]">
                    Empresa
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">Período</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">Alertas</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">Linhas</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">Atualizado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {uploadsFiltrados.map((upload) => (
                  <tr key={upload.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          <Building2 className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {upload.empresa?.razaoSocial || 'N/A'}
                          </div>
                          {upload.empresa?.nomeFantasia && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              {upload.empresa.nomeFantasia}
                            </div>
                          )}
                          {upload.empresa?.cnpj && (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
                              CNPJ: {maskCNPJ(upload.empresa.cnpj)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatPeriodo(upload.mes, upload.ano)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            upload.status === 'CONCLUIDO'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200'
                              : upload.status === 'COM_ALERTAS'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200'
                                : upload.status === 'PROCESSANDO'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-200'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-400/20 dark:text-slate-200'
                          }`}
                        >
                          {getStatusLabel(upload.status)}
                        </span>
                        {upload.status === 'PROCESSANDO' && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {(upload.alertas?.length || 0) > 0 ? (
                        <Link
                          href={`/alertas?uploadId=${upload.id}`}
                          className="flex items-center gap-1.5 group hover:opacity-80 transition-opacity"
                        >
                          <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-sm font-medium text-amber-700 dark:text-amber-300 group-hover:underline">
                            {upload.alertas?.length || 0}
                          </span>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            0
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        <span>{upload.totalLinhas || 0}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs">{formatDateTime(upload.updatedAt)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/uploads/${upload.id}`}
                        className={`inline-flex items-center text-xs font-medium transition-colors ${
                          upload.status === 'PROCESSANDO'
                            ? 'text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-semibold'
                            : 'text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300'
                        }`}
                      >
                        {upload.status === 'PROCESSANDO' ? 'Ver progresso' : 'Ver detalhes'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default UploadsPage;

