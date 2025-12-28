'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, DollarSign, Percent } from 'lucide-react';
import { configuracaoModeloNegocioService } from '@/services/configuracao-modelo-negocio.service';
import type { Empresa } from '@/types/api';

interface MetricasModeloProps {
  empresa: Empresa | null | undefined;
  relatorioContas?: Array<{
    classificacao: string;
    conta: string;
    subConta?: string | null;
    saldoAtual: number;
  }>;
}

export const MetricasModelo = ({ empresa, relatorioContas }: MetricasModeloProps) => {
  const modeloNegocio = empresa?.modeloNegocio;

  // Buscar configuração global se empresa tiver modelo definido
  const { data: configuracaoGlobal } = useQuery({
    queryKey: ['configuracao-modelo-negocio', modeloNegocio],
    queryFn: () => {
      if (!modeloNegocio) return null;
      return configuracaoModeloNegocioService.getByModelo(modeloNegocio);
    },
    enabled: !!modeloNegocio,
  });

  // Obter contas configuradas
  const contasReceita = empresa?.contasReceita || configuracaoGlobal?.contasReceita;
  const contasCustos = empresa?.contasCustos || configuracaoGlobal?.contasCustos;

  // Calcular métricas se tiver dados do relatório
  const metricas = useMemo(() => {
    if (!relatorioContas || !contasReceita) return null;

    let mensalidadesTotal = 0;
    let bonificacoesTotal = 0;
    let custosTotal = 0;

    relatorioContas.forEach((linha) => {
      const contaCompleta = linha.subConta && linha.subConta.trim() !== ''
        ? `${linha.classificacao}.${linha.conta}.${linha.subConta}`
        : `${linha.classificacao}.${linha.conta}`;

      const saldo = Math.abs(linha.saldoAtual);

      // Verificar mensalidades
      if (contasReceita.mensalidades) {
        const contaMensalidades = contasReceita.mensalidades as string;
        if (contaCompleta === contaMensalidades || contaCompleta.startsWith(contaMensalidades + '.')) {
          mensalidadesTotal += saldo;
        }
      }

      // Verificar bonificações
      if (contasReceita.bonificacoes) {
        const contaBonificacoes = contasReceita.bonificacoes as string;
        if (contaCompleta === contaBonificacoes || contaCompleta.startsWith(contaBonificacoes + '.')) {
          bonificacoesTotal += saldo;
        }
      }

      // Verificar custos
      if (contasCustos) {
        Object.values(contasCustos).forEach((contaCusto) => {
          if ((contaCompleta === contaCusto || contaCompleta.startsWith(contaCusto + '.')) && linha.saldoAtual < 0) {
            custosTotal += saldo;
          }
        });
      }
    });

    const receitaTotal = mensalidadesTotal + bonificacoesTotal;
    const coberturaCustos = receitaTotal > 0 ? (mensalidadesTotal / custosTotal) * 100 : 0;
    const proporcaoMensalidadesBonificacoes = bonificacoesTotal > 0 ? mensalidadesTotal / bonificacoesTotal : 0;

    return {
      mensalidadesTotal,
      bonificacoesTotal,
      custosTotal,
      receitaTotal,
      coberturaCustos,
      proporcaoMensalidadesBonificacoes,
    };
  }, [relatorioContas, contasReceita, contasCustos]);

  if (!empresa || !modeloNegocio || !metricas) return null;

  const formatarValor = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
        Métricas do Modelo de Negócio
      </h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <DollarSign className="h-4 w-4" />
            <span>Mensalidades</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {formatarValor(metricas.mensalidadesTotal)}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <TrendingUp className="h-4 w-4" />
            <span>Bonificações</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {formatarValor(metricas.bonificacoesTotal)}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <DollarSign className="h-4 w-4" />
            <span>Custos</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {formatarValor(metricas.custosTotal)}
          </p>
        </div>
        {metricas.custosTotal > 0 && (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Percent className="h-4 w-4" />
              <span>Cobertura por Mensalidades</span>
            </div>
            <p className={`mt-1 text-sm font-semibold ${
              metricas.coberturaCustos >= 100 
                ? 'text-emerald-600 dark:text-emerald-400' 
                : 'text-amber-600 dark:text-amber-400'
            }`}>
              {metricas.coberturaCustos.toFixed(1)}%
            </p>
          </div>
        )}
        {metricas.bonificacoesTotal > 0 && (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <TrendingUp className="h-4 w-4" />
              <span>Proporção M/B</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {metricas.proporcaoMensalidadesBonificacoes.toFixed(2)}:1
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

