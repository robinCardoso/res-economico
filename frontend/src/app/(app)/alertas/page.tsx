'use client';

import { useState } from 'react';
import { useAlertas } from '@/hooks/use-alertas';
import { useEmpresas } from '@/hooks/use-empresas';
import { formatDateTime, getStatusLabel } from '@/lib/format';
import { maskCNPJ } from '@/lib/masks';

const AlertasPage = () => {
  const { data: alertas, isLoading, error } = useAlertas();
  const { data: empresas } = useEmpresas();
  const [empresaFiltro, setEmpresaFiltro] = useState<string>('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-slate-500">Carregando alertas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-rose-500">
          Erro ao carregar alertas. Verifique se o backend está rodando.
        </div>
      </div>
    );
  }

  // Garantir que alertas seja sempre um array
  const alertasList = Array.isArray(alertas) ? alertas : [];
  const empresasList = Array.isArray(empresas) ? empresas : [];

  // Filtrar alertas por empresa se filtro estiver selecionado
  const alertasFiltrados = empresaFiltro
    ? alertasList.filter((alerta) => alerta.upload?.empresaId === empresaFiltro)
    : alertasList;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Alertas
        </h1>
        <p className="text-sm text-slate-500">
          Acompanhe divergências de saldo e contas inéditas detectadas nas importações.
        </p>
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
              {alertasFiltrados.length} alerta(s) encontrado(s)
            </span>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        {alertasFiltrados.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            {empresaFiltro
              ? 'Nenhum alerta encontrado para esta empresa.'
              : 'Nenhum alerta encontrado.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-50/60 dark:bg-slate-900/80">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    Conta / Detalhe
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Empresa</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">
                    Criado em
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {alertasFiltrados.map((alerta) => (
                <tr key={alerta.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900">
                  <td className="px-4 py-3 font-medium">{alerta.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">{getStatusLabel(alerta.tipo)}</td>
                  <td className="px-4 py-3">
                    {alerta.linha
                      ? `${alerta.linha.classificacao} - ${alerta.linha.nomeConta}`
                      : alerta.mensagem}
                  </td>
                  <td className="px-4 py-3">
                    {alerta.upload?.empresa?.razaoSocial || 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        alerta.status === 'ABERTO'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-400/20 dark:text-rose-200'
                          : alerta.status === 'EM_ANALISE'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200'
                      }`}
                    >
                      {getStatusLabel(alerta.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDateTime(alerta.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default AlertasPage;

