'use client';

import React, { useState, useMemo } from 'react';
import { useRelatorioResultado } from '@/hooks/use-relatorios';
import { useEmpresas } from '@/hooks/use-empresas';
import type { TipoRelatorio, ContaRelatorio } from '@/types/api';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';

const RelatorioResultadoPage = () => {
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [tipo, setTipo] = useState<TipoRelatorio>('CONSOLIDADO');
  const [empresaId, setEmpresaId] = useState<string>('');
  const [empresaIds, setEmpresaIds] = useState<string[]>([]);

  const { data: empresas } = useEmpresas();
  const empresasList = empresas || [];

  const params = useMemo(
    () => ({
      ano,
      tipo,
      empresaId: tipo === 'FILIAL' ? empresaId : undefined,
      empresaIds: tipo === 'CONSOLIDADO' && empresaIds.length > 0 ? empresaIds : undefined,
    }),
    [ano, tipo, empresaId, empresaIds],
  );

  const { data: relatorio, isLoading, error } = useRelatorioResultado(params);

  const formatarValor = (valor: number): string => {
    if (valor === 0) return '0';
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);
  };

  const renderizarContas = (contas: ContaRelatorio[] | undefined, nivel = 0): JSX.Element[] => {
    if (!contas || contas.length === 0) return [];

    return contas.flatMap((conta) => {
      const indentacao = nivel * 24; // 24px por nível
      const isRaiz = nivel === 0;

      return (
        <React.Fragment key={conta.classificacao}>
          <tr
            className={`border-b border-slate-200 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-900/50 ${
              isRaiz ? 'bg-slate-50/30 dark:bg-slate-900/30' : ''
            }`}
          >
            <td className="px-4 py-3 text-xs font-medium text-slate-700 dark:text-slate-300">
              <div style={{ paddingLeft: `${indentacao}px` }}>{conta.classificacao}</div>
            </td>
            <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
              <div style={{ paddingLeft: `${indentacao}px` }}>{conta.nomeConta}</div>
            </td>
            {relatorio?.periodo.map((periodo) => (
              <td
                key={periodo.mes}
                className="px-3 py-3 text-right text-xs font-mono text-slate-700 dark:text-slate-300"
              >
                {formatarValor(conta.valores[periodo.mes] || 0)}
              </td>
            ))}
            <td className="px-3 py-3 text-right text-xs font-mono font-semibold text-slate-900 dark:text-slate-100">
              {formatarValor(conta.valores.total || 0)}
            </td>
          </tr>
          {conta.filhos && conta.filhos.length > 0 && renderizarContas(conta.filhos, nivel + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Relatório de Resultado Econômico
        </h1>
        <p className="text-sm text-slate-500">
          Gere relatórios consolidados por filial ou consolidado para análise de resultados.
        </p>
      </header>

      {/* Filtros */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Ano */}
          <div>
            <label htmlFor="ano" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Ano
            </label>
            <input
              type="number"
              id="ano"
              min="2020"
              max="2100"
              value={ano}
              onChange={(e) => setAno(parseInt(e.target.value) || new Date().getFullYear())}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Tipo */}
          <div>
            <label htmlFor="tipo" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Tipo
            </label>
            <select
              id="tipo"
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value as TipoRelatorio);
                setEmpresaId('');
                setEmpresaIds([]);
              }}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="CONSOLIDADO">Consolidado</option>
              <option value="FILIAL">Filial</option>
            </select>
          </div>

          {/* Empresa (FILIAL) */}
          {tipo === 'FILIAL' && (
            <div>
              <label
                htmlFor="empresa-filial"
                className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Empresa
              </label>
              <select
                id="empresa-filial"
                value={empresaId}
                onChange={(e) => setEmpresaId(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">Selecione uma empresa</option>
                {empresasList.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.razaoSocial}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Empresas (CONSOLIDADO) */}
          {tipo === 'CONSOLIDADO' && (
            <div>
              <label
                htmlFor="empresas-consolidado"
                className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Empresas (opcional)
              </label>
              <select
                id="empresas-consolidado"
                multiple
                value={empresaIds}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                  setEmpresaIds(selected);
                }}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                size={3}
              >
                {empresasList.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.razaoSocial}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                {empresaIds.length === 0
                  ? 'Nenhuma selecionada = todas as empresas'
                  : `${empresaIds.length} empresa(s) selecionada(s)`}
              </p>
            </div>
          )}
        </div>

        {/* Botões de Exportação */}
        {relatorio && (
          <div className="mt-4 flex gap-3">
            <button
              disabled
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel
            </button>
            <button
              disabled
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <FileText className="h-4 w-4" />
              Exportar PDF
            </button>
          </div>
        )}
      </section>

      {/* Mensagem de validação */}
      {tipo === 'FILIAL' && !empresaId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <p className="font-medium">Selecione uma empresa para gerar o relatório por filial.</p>
        </div>
      )}

      {/* Relatório */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
          <span className="ml-3 text-sm text-slate-500">Gerando relatório...</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-6 text-sm text-rose-600 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300">
          <p className="font-medium mb-2">Erro ao gerar relatório</p>
          <p>
            {tipo === 'FILIAL' && !empresaId
              ? 'Selecione uma empresa para gerar o relatório por filial.'
              : 'Verifique se há uploads para o período selecionado.'}
          </p>
        </div>
      )}

      {relatorio && !isLoading && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          {/* Cabeçalho do Relatório */}
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              RESULTADO ECONÔMICO {relatorio.empresaNome.toUpperCase()}
              {relatorio.uf ? ` - ${relatorio.uf}` : ''} {relatorio.ano}
            </h2>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs dark:divide-slate-800">
              <thead className="bg-slate-50/60 dark:bg-slate-900/80">
                <tr>
                  <th className="sticky left-0 z-10 bg-slate-50/60 px-4 py-3 text-left text-xs font-medium text-slate-500 dark:bg-slate-900/80">
                    CLASSI
                  </th>
                  <th className="sticky left-0 z-10 bg-slate-50/60 px-4 py-3 text-left text-xs font-medium text-slate-500 dark:bg-slate-900/80 min-w-[300px]">
                    DESCRI
                  </th>
                  {relatorio.periodo.map((periodo) => (
                    <th
                      key={periodo.mes}
                      className="px-3 py-3 text-right text-xs font-medium text-slate-500"
                    >
                      {periodo.nome}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right text-xs font-medium text-slate-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {renderizarContas(relatorio.contas)}
              </tbody>
            </table>
          </div>

          {relatorio.contas.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              Nenhum dado encontrado para o período selecionado.
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default RelatorioResultadoPage;

