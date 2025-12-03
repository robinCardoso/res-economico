'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { configuracaoModeloNegocioService, type UpdateConfiguracaoModeloNegocioDto } from '@/services/configuracao-modelo-negocio.service';
import { contasService } from '@/services/contas.service';
import type { ConfiguracaoModeloNegocio, ModeloNegocio } from '@/types/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ModeloNegocioDetalhesForm } from '@/components/configuracao/ModeloNegocioDetalhesForm';
import { ContaDreAutocomplete } from '@/components/configuracao/ContaDreAutocomplete';

const MODELOS_NEGOCIO: Array<{ value: ModeloNegocio; label: string }> = [
  { value: 'ASSOCIACAO', label: 'Associação' },
  { value: 'COMERCIO', label: 'Comércio' },
  { value: 'INDUSTRIA', label: 'Indústria' },
  { value: 'SERVICOS', label: 'Serviços' },
  { value: 'AGROPECUARIA', label: 'Agronegócio' },
  { value: 'OUTRO', label: 'Outro' },
];

const configuracaoSchema = z.object({
  modeloNegocio: z.enum(['ASSOCIACAO', 'COMERCIO', 'INDUSTRIA', 'SERVICOS', 'AGROPECUARIA', 'OUTRO']),
  descricao: z.string().optional(),
  custosCentralizados: z.boolean(),
  receitasCentralizadas: z.boolean(),
  ativo: z.boolean(),
  // Campos dinâmicos para contas
  contasReceitaMensalidades: z.string().optional(),
  contasReceitaBonificacoes: z.string().optional(),
  contasCustosFuncionarios: z.string().optional(),
  contasCustosSistema: z.string().optional(),
  contasCustosContabilidade: z.string().optional(),
  // JSON para modeloNegocioDetalhes
  modeloNegocioDetalhesJson: z.string().optional(),
});

type ConfiguracaoFormData = z.infer<typeof configuracaoSchema>;

const ConfiguracaoModelosNegocioPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModelo, setEditingModelo] = useState<ModeloNegocio | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [contasReceitaExtra, setContasReceitaExtra] = useState<Array<{ key: string; value: string }>>([]);
  const [contasCustosExtra, setContasCustosExtra] = useState<Array<{ key: string; value: string }>>([]);

  const { data: configuracoes, isLoading, error } = useQuery({
    queryKey: ['configuracao-modelo-negocio'],
    queryFn: () => configuracaoModeloNegocioService.list(),
  });

  const createMutation = useMutation({
    mutationFn: configuracaoModeloNegocioService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracao-modelo-negocio'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ modelo, dto }: { modelo: string; dto: UpdateConfiguracaoModeloNegocioDto }) =>
      configuracaoModeloNegocioService.update(modelo, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracao-modelo-negocio'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: configuracaoModeloNegocioService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracao-modelo-negocio'] });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ConfiguracaoFormData>({
    resolver: zodResolver(configuracaoSchema),
    defaultValues: {
      custosCentralizados: false,
      receitasCentralizadas: false,
      ativo: true,
    },
  });

  const configuracoesList = Array.isArray(configuracoes) ? configuracoes : [];

  const openCreateModal = () => {
    setEditingModelo(null);
    setContasReceitaExtra([]);
    setContasCustosExtra([]);
    reset({
      modeloNegocio: undefined,
      descricao: '',
      custosCentralizados: false,
      ativo: true,
      contasReceitaMensalidades: '',
      contasReceitaBonificacoes: '',
      contasCustosFuncionarios: '',
      contasCustosSistema: '',
      contasCustosContabilidade: '',
      modeloNegocioDetalhesJson: '',
    });
    setIsModalOpen(true);
    setErrorMessage(null);
  };

  const openEditModal = async (config: ConfiguracaoModeloNegocio) => {
    setEditingModelo(config.modeloNegocio);
    setLoadingConfig(true);
    setErrorMessage(null);
    
    try {
      // Buscar dados atualizados do banco para garantir que temos os dados mais recentes
      const configAtualizada = await configuracaoModeloNegocioService.getByModelo(config.modeloNegocio);
      
      // Buscar todas as contas para poder encontrar os nomes baseados nos códigos
      const todasContas = await contasService.list({ tipoConta: '3-DRE' });
      
      // Função auxiliar para encontrar nome da conta pelo código
      const encontrarNomeConta = (codigo: string): string => {
        if (!codigo) return '';
        // O código pode estar no formato "classificacao.conta" ou "classificacao.conta.subConta"
        const partes = codigo.split('.');
        const conta = todasContas.find((c) => {
          if (partes.length === 2) {
            return c.classificacao === partes[0] && c.conta === partes[1] && (!c.subConta || c.subConta.trim() === '');
          } else if (partes.length === 3) {
            return c.classificacao === partes[0] && c.conta === partes[1] && c.subConta === partes[2];
          }
          return false;
        });
        return conta?.nomeConta || '';
      };
      
      // Extrair contas de receita
      const receitaKeys = Object.keys(configAtualizada.contasReceita || {});
      const receitaExtra: Array<{ key: string; value: string }> = [];
      receitaKeys.forEach((key) => {
        if (key !== 'mensalidades' && key !== 'bonificacoes') {
          const codigoConta = configAtualizada.contasReceita[key] as string;
          const nomeConta = encontrarNomeConta(codigoConta) || key; // Usar nome do banco ou fallback para a chave
          receitaExtra.push({ key: nomeConta, value: codigoConta });
        }
      });
      setContasReceitaExtra(receitaExtra);

      // Extrair contas de custos
      const custosKeys = Object.keys(configAtualizada.contasCustos || {});
      const custosExtra: Array<{ key: string; value: string }> = [];
      custosKeys.forEach((key) => {
        if (key !== 'funcionarios' && key !== 'sistema' && key !== 'contabilidade') {
          const codigoConta = configAtualizada.contasCustos[key] as string;
          const nomeConta = encontrarNomeConta(codigoConta) || key; // Usar nome do banco ou fallback para a chave
          custosExtra.push({ key: nomeConta, value: codigoConta });
        }
      });
      setContasCustosExtra(custosExtra);

      // Preencher formulário com dados do banco
      reset({
        modeloNegocio: configAtualizada.modeloNegocio,
        descricao: configAtualizada.descricao || '',
        custosCentralizados: configAtualizada.custosCentralizados,
        receitasCentralizadas: configAtualizada.receitasCentralizadas ?? false,
        ativo: configAtualizada.ativo,
        contasReceitaMensalidades: (configAtualizada.contasReceita?.mensalidades as string) || '',
        contasReceitaBonificacoes: (configAtualizada.contasReceita?.bonificacoes as string) || '',
        contasCustosFuncionarios: (configAtualizada.contasCustos?.funcionarios as string) || '',
        contasCustosSistema: (configAtualizada.contasCustos?.sistema as string) || '',
        contasCustosContabilidade: (configAtualizada.contasCustos?.contabilidade as string) || '',
        modeloNegocioDetalhesJson: JSON.stringify(configAtualizada.modeloNegocioDetalhes || {}, null, 2),
      });
      
      setIsModalOpen(true);
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      setErrorMessage('Erro ao carregar configuração para edição. Tente novamente.');
      // Ainda assim, abrir o modal com os dados da lista (fallback)
      // Tentar buscar contas para encontrar nomes
      let todasContas: Array<{ classificacao: string; conta: string; subConta?: string | null; nomeConta: string }> = [];
      try {
        todasContas = await contasService.list({ tipoConta: '3-DRE' });
      } catch {
        // Ignorar erro ao buscar contas no fallback
      }
      
      const encontrarNomeConta = (codigo: string): string => {
        if (!codigo || todasContas.length === 0) return '';
        const partes = codigo.split('.');
        const conta = todasContas.find((c) => {
          if (partes.length === 2) {
            return c.classificacao === partes[0] && c.conta === partes[1] && (!c.subConta || c.subConta.trim() === '');
          } else if (partes.length === 3) {
            return c.classificacao === partes[0] && c.conta === partes[1] && c.subConta === partes[2];
          }
          return false;
        });
        return conta?.nomeConta || '';
      };
      
      const receitaKeys = Object.keys(config.contasReceita || {});
      const receitaExtra: Array<{ key: string; value: string }> = [];
      receitaKeys.forEach((key) => {
        if (key !== 'mensalidades' && key !== 'bonificacoes') {
          const codigoConta = config.contasReceita[key] as string;
          const nomeConta = encontrarNomeConta(codigoConta) || key;
          receitaExtra.push({ key: nomeConta, value: codigoConta });
        }
      });
      setContasReceitaExtra(receitaExtra);

      const custosKeys = Object.keys(config.contasCustos || {});
      const custosExtra: Array<{ key: string; value: string }> = [];
      custosKeys.forEach((key) => {
        if (key !== 'funcionarios' && key !== 'sistema' && key !== 'contabilidade') {
          const codigoConta = config.contasCustos[key] as string;
          const nomeConta = encontrarNomeConta(codigoConta) || key;
          custosExtra.push({ key: nomeConta, value: codigoConta });
        }
      });
      setContasCustosExtra(custosExtra);

      reset({
        modeloNegocio: config.modeloNegocio,
        descricao: config.descricao || '',
        custosCentralizados: config.custosCentralizados,
        receitasCentralizadas: config.receitasCentralizadas ?? false,
        ativo: config.ativo,
        contasReceitaMensalidades: (config.contasReceita?.mensalidades as string) || '',
        contasReceitaBonificacoes: (config.contasReceita?.bonificacoes as string) || '',
        contasCustosFuncionarios: (config.contasCustos?.funcionarios as string) || '',
        contasCustosSistema: (config.contasCustos?.sistema as string) || '',
        contasCustosContabilidade: (config.contasCustos?.contabilidade as string) || '',
        modeloNegocioDetalhesJson: JSON.stringify(config.modeloNegocioDetalhes || {}, null, 2),
      });
      setIsModalOpen(true);
    } finally {
      setLoadingConfig(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingModelo(null);
    setContasReceitaExtra([]);
    setContasCustosExtra([]);
    reset();
    setErrorMessage(null);
  };

  const onSubmit = async (data: ConfiguracaoFormData) => {
    setErrorMessage(null);
    try {
      // Construir contasReceita
      const contasReceita: Record<string, string> = {};
      if (data.contasReceitaMensalidades) {
        contasReceita.mensalidades = data.contasReceitaMensalidades;
      }
      if (data.contasReceitaBonificacoes) {
        contasReceita.bonificacoes = data.contasReceitaBonificacoes;
      }
      contasReceitaExtra.forEach((item) => {
        if (item.key && item.value) {
          contasReceita[item.key] = item.value;
        }
      });

      // Construir contasCustos
      const contasCustos: Record<string, string> = {};
      if (data.contasCustosFuncionarios) {
        contasCustos.funcionarios = data.contasCustosFuncionarios;
      }
      if (data.contasCustosSistema) {
        contasCustos.sistema = data.contasCustosSistema;
      }
      if (data.contasCustosContabilidade) {
        contasCustos.contabilidade = data.contasCustosContabilidade;
      }
      contasCustosExtra.forEach((item) => {
        if (item.key && item.value) {
          contasCustos[item.key] = item.value;
        }
      });

      // Parse modeloNegocioDetalhes
      let modeloNegocioDetalhes: Record<string, unknown> = {};
      if (data.modeloNegocioDetalhesJson) {
        try {
          modeloNegocioDetalhes = JSON.parse(data.modeloNegocioDetalhesJson);
        } catch {
          throw new Error('JSON inválido em Modelo de Negócio Detalhes');
        }
      }

      const dto = {
        modeloNegocio: data.modeloNegocio,
        modeloNegocioDetalhes,
        contasReceita,
        contasCustos,
        custosCentralizados: data.custosCentralizados,
        receitasCentralizadas: data.receitasCentralizadas,
        descricao: data.descricao || undefined,
        ativo: data.ativo,
      };

      if (editingModelo) {
        await updateMutation.mutateAsync({ modelo: editingModelo, dto });
      } else {
        await createMutation.mutateAsync(dto);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(
        error.response?.data?.message || error.message || 'Erro ao salvar configuração',
      );
    }
  };

  const handleDelete = async (modeloNegocio: string) => {
    if (!confirm(`Tem certeza que deseja excluir a configuração do modelo ${modeloNegocio}?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(modeloNegocio);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      alert(
        error.response?.data?.message || error.message || 'Erro ao excluir configuração',
      );
    }
  };

  const addContaReceita = () => {
    setContasReceitaExtra([...contasReceitaExtra, { key: '', value: '' }]);
  };

  const removeContaReceita = (index: number) => {
    setContasReceitaExtra(contasReceitaExtra.filter((_, i) => i !== index));
  };

  const updateContaReceita = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...contasReceitaExtra];
    updated[index] = { ...updated[index], [field]: value };
    setContasReceitaExtra(updated);
  };

  const addContaCusto = () => {
    setContasCustosExtra([...contasCustosExtra, { key: '', value: '' }]);
  };

  const removeContaCusto = (index: number) => {
    setContasCustosExtra(contasCustosExtra.filter((_, i) => i !== index));
  };

  const updateContaCusto = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...contasCustosExtra];
    updated[index] = { ...updated[index], [field]: value };
    setContasCustosExtra(updated);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">Carregando configurações...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-rose-500">
          Erro ao carregar configurações. Verifique se o backend está rodando.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground dark:text-slate-50">
            Configuração de Modelos de Negócio
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure os modelos de negócio uma vez e aplique a todas as empresas automaticamente.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
        >
          <Plus className="h-4 w-4" />
          Nova configuração
        </button>
      </header>

      {configuracoesList.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            Nenhuma configuração cadastrada. Clique em &quot;Nova configuração&quot; para começar.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground dark:text-slate-300">
                    Modelo de Negócio
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground dark:text-slate-300">
                    Descrição
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground dark:text-slate-300">
                    Status
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground dark:text-slate-300">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {configuracoesList.map((config) => (
                  <tr key={config.id}>
                    <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-foreground dark:text-slate-100">
                      {MODELOS_NEGOCIO.find((m) => m.value === config.modeloNegocio)?.label ||
                        config.modeloNegocio}
                    </td>
                    <td className="px-4 py-2 text-sm text-muted-foreground dark:text-slate-300">
                      {config.descricao || '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          config.ativo
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        {config.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(config)}
                          className="rounded-md p-1.5 text-foreground hover:bg-muted"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(config.modeloNegocio)}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground dark:text-slate-100">
                {editingModelo ? 'Editar configuração' : 'Nova configuração'}
              </h2>
              <button
                onClick={closeModal}
                disabled={loadingConfig}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingConfig ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-sm text-muted-foreground">Carregando dados da configuração...</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                {errorMessage && (
                  <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
                    {errorMessage}
                  </div>
                )}

              <div className="space-y-1">
                <label htmlFor="modeloNegocio" className="text-sm font-medium text-foreground dark:text-slate-300">
                  Modelo de Negócio *
                </label>
                <select
                  id="modeloNegocio"
                  {...register('modeloNegocio')}
                  disabled={!!editingModelo}
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Selecione o modelo</option>
                  {MODELOS_NEGOCIO.map((modelo) => (
                    <option key={modelo.value} value={modelo.value}>
                      {modelo.label}
                    </option>
                  ))}
                </select>
                {errors.modeloNegocio && (
                  <p className="text-xs text-rose-600">{errors.modeloNegocio.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="descricao" className="text-sm font-medium text-foreground dark:text-slate-300">
                  Descrição
                </label>
                <textarea
                  id="descricao"
                  {...register('descricao')}
                  rows={2}
                  placeholder="Descrição da configuração"
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="mb-4 text-sm font-semibold text-foreground dark:text-slate-100">
                  Contas de Receita (DRE)
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground dark:text-slate-400">
                      Mensalidades
                    </label>
                    <ContaDreAutocomplete
                      value={watch('contasReceitaMensalidades') || ''}
                      onChange={(value) => setValue('contasReceitaMensalidades', value)}
                      placeholder="Digite código (ex: 3.1.01.01) ou nome (ex: mensalidade)"
                      tipoConta="receita"
                      className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground dark:text-slate-400">
                      Bonificações
                    </label>
                    <ContaDreAutocomplete
                      value={watch('contasReceitaBonificacoes') || ''}
                      onChange={(value) => setValue('contasReceitaBonificacoes', value)}
                      placeholder="Digite código (ex: 3.1.02.01) ou nome (ex: bonificação)"
                      tipoConta="receita"
                      className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  {contasReceitaExtra.map((conta, index) => (
                    <div key={`receita-extra-${index}-${conta.value || 'empty'}`} className="flex gap-2">
                      <input
                        type="text"
                        value={conta.key}
                        onChange={(e) => updateContaReceita(index, 'key', e.target.value)}
                        placeholder="Nome da conta"
                        className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-foreground focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                      <ContaDreAutocomplete
                        value={conta.value}
                        onChange={(value) => updateContaReceita(index, 'value', value)}
                        placeholder="Código (ex: 3.1.01.01) ou nome da conta"
                        tipoConta="receita"
                        className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-foreground focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => removeContaReceita(index)}
                        className="rounded-md p-2 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addContaReceita}
                    className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400"
                  >
                    + Adicionar conta de receita
                  </button>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="mb-4 text-sm font-semibold text-foreground dark:text-slate-100">
                  Contas de Custos (DRE)
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground dark:text-slate-400">
                      Funcionários
                    </label>
                    <ContaDreAutocomplete
                      value={watch('contasCustosFuncionarios') || ''}
                      onChange={(value) => setValue('contasCustosFuncionarios', value)}
                      placeholder="Digite código (ex: 4.1.01) ou nome (ex: funcionários)"
                      tipoConta="custo"
                      className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground dark:text-slate-400">
                      Sistema
                    </label>
                    <ContaDreAutocomplete
                      value={watch('contasCustosSistema') || ''}
                      onChange={(value) => setValue('contasCustosSistema', value)}
                      placeholder="Digite código (ex: 4.1.02) ou nome (ex: sistema)"
                      tipoConta="custo"
                      className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground dark:text-slate-400">
                      Contabilidade
                    </label>
                    <ContaDreAutocomplete
                      value={watch('contasCustosContabilidade') || ''}
                      onChange={(value) => setValue('contasCustosContabilidade', value)}
                      placeholder="Digite código (ex: 4.1.03) ou nome (ex: contabilidade)"
                      tipoConta="custo"
                      className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  {contasCustosExtra.map((conta, index) => (
                    <div key={`custo-extra-${index}-${conta.value || 'empty'}`} className="flex gap-2">
                      <input
                        type="text"
                        value={conta.key}
                        onChange={(e) => updateContaCusto(index, 'key', e.target.value)}
                        placeholder="Nome da conta"
                        className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-foreground focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                      <ContaDreAutocomplete
                        value={conta.value}
                        onChange={(value) => updateContaCusto(index, 'value', value)}
                        placeholder="Código (ex: 3.1.01.01) ou nome da conta"
                        tipoConta="custo"
                        className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-foreground focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => removeContaCusto(index)}
                        className="rounded-md p-2 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addContaCusto}
                    className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400"
                  >
                    + Adicionar conta de custo
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('custosCentralizados')}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-foreground dark:text-slate-300">
                    Custos Centralizados na Matriz
                  </span>
                </label>
                <p className="text-xs text-muted-foreground">
                  Indica se os custos operacionais estão centralizados na matriz
                </p>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('receitasCentralizadas')}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-foreground dark:text-slate-300">
                    Receitas Centralizadas na Matriz
                  </span>
                </label>
                <p className="text-xs text-muted-foreground">
                  Indica se receitas (ex: bonificações) estão centralizadas na matriz
                </p>
              </div>

              <ModeloNegocioDetalhesForm
                modeloNegocio={watch('modeloNegocio')}
                value={watch('modeloNegocioDetalhesJson') || ''}
                onChange={(value) => setValue('modeloNegocioDetalhesJson', value)}
                errors={errors.modeloNegocioDetalhesJson?.message}
              />

              <div className="space-y-1">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('ativo')}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-foreground dark:text-slate-300">
                    Ativo
                  </span>
                </label>
                <p className="text-xs text-muted-foreground">
                  Configurações inativas não serão usadas como fallback
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="h-4 w-4" />
                  {editingModelo ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfiguracaoModelosNegocioPage;

