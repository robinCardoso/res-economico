'use client';

import { useQuery } from '@tanstack/react-query';
import { Settings, ExternalLink, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { configuracaoModeloNegocioService } from '@/services/configuracao-modelo-negocio.service';
import { ModeloNegocioBadge } from './ModeloNegocioBadge';
import type { Empresa } from '@/types/api';

interface ConfiguracaoCardProps {
  empresa: Empresa | null | undefined;
}

export const ConfiguracaoCard = ({ empresa }: ConfiguracaoCardProps) => {
  const modeloNegocio = empresa?.modeloNegocio;

  // Buscar configuração global se empresa tiver modelo definido
  const { data: configuracaoGlobal, isLoading } = useQuery({
    queryKey: ['configuracao-modelo-negocio', modeloNegocio],
    queryFn: () => {
      if (!modeloNegocio) return null;
      return configuracaoModeloNegocioService.getByModelo(modeloNegocio);
    },
    enabled: !!modeloNegocio,
  });

  // Determinar fonte da configuração
  const temConfiguracaoEmpresa =
    empresa?.contasReceita || empresa?.contasCustos || empresa?.modeloNegocioDetalhes;
  const temConfiguracaoGlobal = !!configuracaoGlobal;
  const fonteConfiguracao = temConfiguracaoEmpresa ? 'Empresa' : temConfiguracaoGlobal ? 'Global' : null;

  // Usar configuração da empresa se disponível, senão usar global
  const contasReceita = empresa?.contasReceita || configuracaoGlobal?.contasReceita;
  const contasCustos = empresa?.contasCustos || configuracaoGlobal?.contasCustos;
  const custosCentralizados = empresa?.custosCentralizados ?? configuracaoGlobal?.custosCentralizados ?? false;
  const receitasCentralizadas =
    (empresa?.receitasCentralizadas ?? configuracaoGlobal?.receitasCentralizadas) ?? false;

  // Se não tem modelo nem configuração, não mostrar card
  if (!modeloNegocio && !temConfiguracaoEmpresa && !temConfiguracaoGlobal) {
    return null;
  }

  // Se não tem configuração mas tem modelo, mostrar aviso
  if (modeloNegocio && !temConfiguracaoEmpresa && !temConfiguracaoGlobal && !isLoading) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              Configuração não encontrada
            </h3>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              Esta empresa tem modelo de negócio definido, mas não há configuração disponível. Configure em{' '}
              <Link
                href="/configuracoes/modelos-negocio"
                className="font-medium underline hover:text-amber-900 dark:hover:text-amber-100"
              >
                Configurações &gt; Modelos de Negócio
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Configuração Aplicada
          </h3>
        </div>
        <Link
          href="/configuracoes/modelos-negocio"
          className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
        >
          Editar
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {/* Modelo de Negócio */}
        {modeloNegocio && (
          <div>
            <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Modelo:</div>
            <ModeloNegocioBadge modelo={modeloNegocio} />
            {fonteConfiguracao && (
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Fonte: {fonteConfiguracao === 'Empresa' ? 'Configuração da Empresa' : 'Configuração Global'}
              </div>
            )}
          </div>
        )}

        {/* Contas de Receita */}
        {contasReceita && Object.keys(contasReceita).length > 0 && (
          <div>
            <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">
              📊 Contas de Receita:
            </div>
            <div className="space-y-1">
              {Object.entries(contasReceita).map(([tipo, conta]) => (
                <div key={tipo} className="text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-medium capitalize">{tipo}:</span> {conta}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contas de Custos */}
        {contasCustos && Object.keys(contasCustos).length > 0 && (
          <div>
            <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">
              💰 Contas de Custos:
            </div>
            <div className="space-y-1">
              {Object.entries(contasCustos).map(([tipo, conta]) => (
                <div key={tipo} className="text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-medium capitalize">{tipo}:</span> {conta}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status de Centralização */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-400">Custos Centralizados:</span>{' '}
            <span className={custosCentralizados ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>
              {custosCentralizados ? 'Sim' : 'Não'}
            </span>
          </div>
          <div className="text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-400">Receitas Centralizadas:</span>{' '}
            <span
              className={receitasCentralizadas ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}
            >
              {receitasCentralizadas ? 'Sim' : 'Não'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

