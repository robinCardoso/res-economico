'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRelatorioResultado } from '@/hooks/use-relatorios';
import { useEmpresas } from '@/hooks/use-empresas';
import { relatoriosService } from '@/services/relatorios.service';
import type { TipoRelatorio, ContaRelatorio } from '@/types/api';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';

const RelatorioResultadoPage = () => {
  // Estado para controlar se os filtros estão expandidos
  const [filtrosExpandidos, setFiltrosExpandidos] = useState<boolean>(true);

  // Estados locais dos filtros (não aplicados ainda)
  const [anoLocal, setAnoLocal] = useState<number>(new Date().getFullYear());
  const [tipoLocal, setTipoLocal] = useState<TipoRelatorio>('CONSOLIDADO');
  const [empresaIdLocal, setEmpresaIdLocal] = useState<string>('');
  const [empresaIdsLocal, setEmpresaIdsLocal] = useState<string[]>([]);

  // Estados dos filtros aplicados (usados na query)
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [tipo, setTipo] = useState<TipoRelatorio>('CONSOLIDADO');
  const [empresaId, setEmpresaId] = useState<string>('');
  const [empresaIds, setEmpresaIds] = useState<string[]>([]);

  const { data: empresas } = useEmpresas();
  const empresasList = empresas || [];

  // Buscar anos disponíveis no banco de dados
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [carregandoAnos, setCarregandoAnos] = useState<boolean>(true);

  useEffect(() => {
    const buscarAnos = async () => {
      try {
        const anos = await relatoriosService.getAnosDisponiveis();
        setAnosDisponiveis(anos);
        if (anos.length > 0) {
          const primeiroAno = anos[0];
          setAnoLocal(primeiroAno);
          setAno(primeiroAno);
        }
      } catch (error) {
        console.error('Erro ao buscar anos disponíveis:', error);
      } finally {
        setCarregandoAnos(false);
      }
    };
    buscarAnos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const params = useMemo(
    () => ({
      ano,
      tipo,
      empresaId: tipo === 'FILIAL' ? empresaId : undefined,
      empresaIds: tipo === 'CONSOLIDADO' && empresaIds.length > 0 ? empresaIds : undefined,
    }),
    [ano, tipo, empresaId, empresaIds],
  );

  const aplicarFiltros = () => {
    setAno(anoLocal);
    setTipo(tipoLocal);
    setEmpresaId(empresaIdLocal);
    setEmpresaIds(empresaIdsLocal);
    // Recolher os filtros após aplicar
    setFiltrosExpandidos(false);
  };

  const limparFiltros = () => {
    const anoAtual = new Date().getFullYear();
    setAnoLocal(anoAtual);
    setTipoLocal('CONSOLIDADO');
    setEmpresaIdLocal('');
    setEmpresaIdsLocal([]);
    setAno(anoAtual);
    setTipo('CONSOLIDADO');
    setEmpresaId('');
    setEmpresaIds([]);
  };

  const { data: relatorio, isLoading, error } = useRelatorioResultado(params);

  const formatarValor = (valor: number): string => {
    if (valor === 0) return '0';
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);
  };

  const getValorClassName = (valor: number): string => {
    if (valor === 0) return '';
    if (valor < 0) return 'text-rose-600 dark:text-rose-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  const [contasExpandidas, setContasExpandidas] = useState<Set<string>>(new Set());

  const toggleExpandir = (classificacao: string) => {
    setContasExpandidas((prev) => {
      const novo = new Set(prev);
      if (novo.has(classificacao)) {
        novo.delete(classificacao);
      } else {
        novo.add(classificacao);
      }
      return novo;
    });
  };

  const renderizarContas = (contas: ContaRelatorio[] | undefined, nivel = 0): React.ReactElement[] => {
    if (!contas || contas.length === 0) return [];

    return contas.flatMap((conta) => {
      const indentacao = nivel * 16; // Reduzido de 24px para 16px
      const isRaiz = nivel === 0;
      const temFilhos = conta.filhos && conta.filhos.length > 0;
      const estaExpandida = contasExpandidas.has(conta.classificacao) || nivel === 0; // Raiz sempre expandida

      return (
        <React.Fragment key={conta.classificacao}>
          <tr
            className={`border-b border-slate-200 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-900/50 ${
              isRaiz ? 'bg-slate-50/30 dark:bg-slate-900/30' : ''
            }`}
          >
            <td className="sticky left-0 z-[50] bg-white border-r border-slate-200 px-2 py-1.5 text-[10px] font-medium text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-1" style={{ paddingLeft: `${indentacao}px` }}>
                {temFilhos && (
                  <button
                    onClick={() => toggleExpandir(conta.classificacao)}
                    className="flex h-4 w-4 items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                    title={estaExpandida ? 'Recolher' : 'Expandir'}
                  >
                    <span className="text-[10px]">{estaExpandida ? '−' : '+'}</span>
                  </button>
                )}
                {!temFilhos && <span className="w-4" />}
                <span className="whitespace-nowrap font-mono">{conta.classificacao}</span>
              </div>
            </td>
            <td className="sticky left-[80px] z-[40] bg-white border-r border-slate-200 px-2 py-1.5 text-[10px] text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 min-w-[200px] shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
              <div style={{ paddingLeft: `${indentacao}px` }} className="truncate" title={conta.nomeConta}>
                {conta.nomeConta}
              </div>
            </td>
            {relatorio?.periodo.map((periodo) => {
              const valor = conta.valores[periodo.mes] || 0;
              return (
                <td
                  key={periodo.mes}
                  className={`px-2 py-1.5 text-right text-[10px] font-mono whitespace-nowrap min-w-[90px] ${getValorClassName(valor)}`}
                  title={formatarValor(valor)}
                >
                  {formatarValor(valor)}
                </td>
              );
            })}
            <td className={`sticky right-0 z-[40] bg-white border-l border-slate-200 px-2 py-1.5 text-right text-[10px] font-mono font-semibold dark:bg-slate-900 dark:border-slate-800 whitespace-nowrap min-w-[90px] shadow-[-2px_0_4px_rgba(0,0,0,0.05)] ${getValorClassName(conta.valores.total || 0)}`}>
              {formatarValor(conta.valores.total || 0)}
            </td>
          </tr>
          {temFilhos && estaExpandida && renderizarContas(conta.filhos, nivel + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Filtros compactos */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {filtrosExpandidos ? (
          <div className="px-3 py-2">
            <div className="flex flex-wrap items-start gap-2.5">
              {/* Ano */}
              <div className="min-w-[100px]">
                <label htmlFor="ano" className="mb-0.5 block text-[10px] font-medium text-slate-700 dark:text-slate-300">
                  Ano
                </label>
                <select
                  id="ano"
                  value={anoLocal || ''}
                  onChange={(e) => setAnoLocal(parseInt(e.target.value) || new Date().getFullYear())}
                  disabled={carregandoAnos}
                  className="h-7 w-full rounded border border-slate-300 bg-white px-2 text-[10px] text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {carregandoAnos ? (
                    <option value="">Carregando...</option>
                  ) : anosDisponiveis.length === 0 ? (
                    <option value="">Nenhum ano disponível</option>
                  ) : (
                    anosDisponiveis.map((ano) => (
                      <option key={ano} value={ano}>
                        {ano}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Tipo */}
              <div className="min-w-[120px]">
                <label htmlFor="tipo" className="mb-0.5 block text-[10px] font-medium text-slate-700 dark:text-slate-300">
                  Tipo
                </label>
                <select
                  id="tipo"
                  value={tipoLocal}
                  onChange={(e) => {
                    setTipoLocal(e.target.value as TipoRelatorio);
                    setEmpresaIdLocal('');
                    setEmpresaIdsLocal([]);
                  }}
                  className="h-7 w-full rounded border border-slate-300 bg-white px-2 text-[10px] text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="CONSOLIDADO">Consolidado</option>
                  <option value="FILIAL">Filial</option>
                </select>
              </div>

              {/* Empresa (FILIAL) */}
              {tipoLocal === 'FILIAL' && (
                <div className="min-w-[250px]">
                  <label
                    htmlFor="empresa-filial"
                    className="mb-0.5 block text-[10px] font-medium text-slate-700 dark:text-slate-300"
                  >
                    Empresa
                  </label>
                  <select
                    id="empresa-filial"
                    value={empresaIdLocal}
                    onChange={(e) => setEmpresaIdLocal(e.target.value)}
                    className="h-7 w-full rounded border border-slate-300 bg-white px-2 text-[10px] text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Selecione uma empresa</option>
                    {empresasList.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.razaoSocial}{empresa.uf ? ` - ${empresa.uf}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Empresas (CONSOLIDADO) */}
              {tipoLocal === 'CONSOLIDADO' && (
                <div className="min-w-[250px]">
                  <label
                    htmlFor="empresas-consolidado"
                    className="mb-0.5 block text-[10px] font-medium text-slate-700 dark:text-slate-300"
                  >
                    Empresas (opcional)
                  </label>
                  <select
                    id="empresas-consolidado"
                    multiple
                    value={empresaIdsLocal}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                      setEmpresaIdsLocal(selected);
                    }}
                    className="h-12 w-full rounded border border-slate-300 bg-white px-2 text-[10px] text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {empresasList.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.razaoSocial}{empresa.uf ? ` - ${empresa.uf}` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="mt-0.5 text-[9px] text-slate-500">
                    {empresaIdsLocal.length === 0
                      ? 'Nenhuma = todas'
                      : `${empresaIdsLocal.length} selecionada(s)`}
                  </p>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex items-start gap-2 pt-[18px]">
                <button
                  onClick={aplicarFiltros}
                  className="inline-flex h-7 items-center gap-1.5 rounded bg-sky-600 px-3 text-[10px] font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 dark:bg-sky-500 dark:hover:bg-sky-600"
                >
                  Filtrar
                </button>
                <button
                  onClick={limparFiltros}
                  className="inline-flex h-7 items-center gap-1.5 rounded border border-slate-300 bg-white px-3 text-[10px] font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Limpar Filtros
                </button>
              </div>

              {/* Botões de Exportação */}
              {relatorio && (
                <div className="flex items-start gap-1.5 pt-[18px]">
                  <button
                    disabled
                    className="inline-flex h-7 items-center gap-1 rounded border border-slate-300 bg-white px-2 text-[10px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <FileSpreadsheet className="h-3 w-3" />
                    Excel
                  </button>
                  <button
                    disabled
                    className="inline-flex h-7 items-center gap-1 rounded border border-slate-300 bg-white px-2 text-[10px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <FileText className="h-3 w-3" />
                    PDF
                  </button>
                </div>
              )}
            </div>

            {/* Mensagem de validação */}
            {tipo === 'FILIAL' && !empresaId && (
              <div className="mt-1.5 rounded border border-amber-200 bg-amber-50/50 px-2 py-1 text-[9px] text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                Selecione uma empresa e clique em "Filtrar" para gerar o relatório por filial.
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between px-3 py-1.5">
            <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-400">
              <span className="font-medium">Filtros aplicados:</span>
              <span>Ano: {ano}</span>
              <span>•</span>
              <span>Tipo: {tipo === 'FILIAL' ? 'Filial' : 'Consolidado'}</span>
              {tipo === 'FILIAL' && empresaId && (
                <>
                  <span>•</span>
                  <span>
                    Empresa:{' '}
                    {empresasList.find((e) => e.id === empresaId)?.razaoSocial || 'N/A'}
                  </span>
                </>
              )}
              {tipo === 'CONSOLIDADO' && empresaIds.length > 0 && (
                <>
                  <span>•</span>
                  <span>{empresaIds.length} empresa(s) selecionada(s)</span>
                </>
              )}
            </div>
            <button
              onClick={() => setFiltrosExpandidos(true)}
              className="inline-flex h-6 items-center gap-1 rounded border border-slate-300 bg-white px-2 text-[10px] font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Editar Filtros
            </button>
          </div>
        )}
      </div>

      {/* Área de conteúdo com scroll */}
      <div className="flex-1 overflow-auto relative">
        {isLoading && (
          <div className="flex h-full items-center justify-center">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
              <span className="text-sm text-slate-500">Gerando relatório...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex h-full items-center justify-center p-6">
            <div className="rounded border border-rose-200 bg-rose-50/50 p-4 text-sm text-rose-600 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300">
              <p className="font-medium mb-1">Erro ao gerar relatório</p>
              <p>
                {tipo === 'FILIAL' && !empresaId
                  ? 'Selecione uma empresa para gerar o relatório por filial.'
                  : 'Verifique se há uploads para o período selecionado.'}
              </p>
            </div>
          </div>
        )}

        {relatorio && !isLoading && (
          <div className="h-full">
            {/* Cabeçalho do Relatório - fixo no topo do container de scroll */}
            <div className="sticky top-0 z-[105] border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                RESULTADO ECONÔMICO {relatorio.empresaNome.toUpperCase()}
                {relatorio.uf ? ` - ${relatorio.uf}` : ''} {relatorio.ano}
              </h2>
            </div>

            {/* Tabela com scroll horizontal e vertical */}
            <div className="h-[calc(100%-60px)] overflow-auto overscroll-contain">
              <table className="min-w-full divide-y divide-slate-200 text-[10px] dark:divide-slate-800">
                <thead className="sticky top-0 z-[100] bg-slate-50/95 backdrop-blur-sm dark:bg-slate-900/95 shadow-sm">
                  <tr>
                    <th className="sticky left-0 z-[101] bg-slate-50/95 border-r border-slate-200 px-2 py-1.5 text-left text-[10px] font-medium text-slate-500 dark:bg-slate-900/95 dark:border-slate-800 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                      CLASSI
                    </th>
                    <th className="sticky left-[80px] z-[100] bg-slate-50/95 border-r border-slate-200 px-2 py-1.5 text-left text-[10px] font-medium text-slate-500 dark:bg-slate-900/95 dark:border-slate-800 min-w-[200px] shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                      DESCRI
                    </th>
                    {relatorio.periodo.map((periodo) => (
                      <th
                        key={periodo.mes}
                        className="px-2 py-1.5 text-right text-[10px] font-medium text-slate-500 whitespace-nowrap min-w-[90px]"
                      >
                        {periodo.nome}
                      </th>
                    ))}
                    <th className="sticky right-0 z-[100] bg-slate-50/95 border-l border-slate-200 px-2 py-1.5 text-right text-[10px] font-medium text-slate-500 dark:bg-slate-900/95 dark:border-slate-800 whitespace-nowrap min-w-[90px] shadow-[-2px_0_4px_rgba(0,0,0,0.05)]">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {renderizarContas(relatorio.contas)}
                </tbody>
              </table>

              {relatorio.contas.length === 0 && (
                <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                  Nenhum dado encontrado para o período selecionado.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelatorioResultadoPage;
