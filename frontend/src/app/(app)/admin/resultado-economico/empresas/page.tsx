'use client';

import { useState } from 'react';
import { useEmpresas, useCreateEmpresa, useUpdateEmpresa, useDeleteEmpresa } from '@/hooks/use-empresas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { maskCNPJ, unmaskCNPJ } from '@/lib/masks';
import type { Empresa } from '@/types/api';

// Lista de UFs do Brasil
const UFS_BRASIL = [
  { value: 'AC', label: 'AC - Acre' },
  { value: 'AL', label: 'AL - Alagoas' },
  { value: 'AP', label: 'AP - Amapá' },
  { value: 'AM', label: 'AM - Amazonas' },
  { value: 'BA', label: 'BA - Bahia' },
  { value: 'CE', label: 'CE - Ceará' },
  { value: 'DF', label: 'DF - Distrito Federal' },
  { value: 'ES', label: 'ES - Espírito Santo' },
  { value: 'GO', label: 'GO - Goiás' },
  { value: 'MA', label: 'MA - Maranhão' },
  { value: 'MT', label: 'MT - Mato Grosso' },
  { value: 'MS', label: 'MS - Mato Grosso do Sul' },
  { value: 'MG', label: 'MG - Minas Gerais' },
  { value: 'PA', label: 'PA - Pará' },
  { value: 'PB', label: 'PB - Paraíba' },
  { value: 'PR', label: 'PR - Paraná' },
  { value: 'PE', label: 'PE - Pernambuco' },
  { value: 'PI', label: 'PI - Piauí' },
  { value: 'RJ', label: 'RJ - Rio de Janeiro' },
  { value: 'RN', label: 'RN - Rio Grande do Norte' },
  { value: 'RS', label: 'RS - Rio Grande do Sul' },
  { value: 'RO', label: 'RO - Rondônia' },
  { value: 'RR', label: 'RR - Roraima' },
  { value: 'SC', label: 'SC - Santa Catarina' },
  { value: 'SP', label: 'SP - São Paulo' },
  { value: 'SE', label: 'SE - Sergipe' },
  { value: 'TO', label: 'TO - Tocantins' },
];

const empresaSchema = z.object({
  cnpj: z.string().min(14, 'CNPJ deve ter 14 dígitos'),
  razaoSocial: z.string().min(2, 'Razão Social deve ter pelo menos 2 caracteres'),
  nomeFantasia: z.string().optional(),
  tipo: z.enum(['MATRIZ', 'FILIAL'], {
    message: 'Selecione o tipo',
  }),
  uf: z.enum(
    [
      'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
      'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
      'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
    ],
    { message: 'Selecione uma UF válida' }
  ).optional(),
  // NOVOS CAMPOS PARA CONTEXTO IA
  setor: z.string().optional(),
  porte: z.enum(['MICRO', 'PEQUENA', 'MEDIA', 'GRANDE']).optional(),
  dataFundacao: z.string().optional(),
  descricao: z.string().optional(),
  website: z.string().url('Website deve ser uma URL válida').optional().or(z.literal('')),
  modeloNegocio: z.enum(['ASSOCIACAO', 'COMERCIO', 'INDUSTRIA', 'SERVICOS', 'AGROPECUARIA', 'OUTRO']).optional(),
  modeloNegocioDetalhes: z.record(z.string(), z.unknown()).optional(),
  contasReceita: z.record(z.string(), z.string()).optional(),
  custosCentralizados: z.boolean().optional(),
  contasCustos: z.record(z.string(), z.string()).optional(),
});

type EmpresaFormData = z.infer<typeof empresaSchema>;

const EmpresasPage = () => {
  const { data: empresas, isLoading, error } = useEmpresas();
  const createEmpresa = useCreateEmpresa();
  const updateEmpresa = useUpdateEmpresa();
  const deleteEmpresa = useDeleteEmpresa();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cnpjValue, setCnpjValue] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      tipo: 'MATRIZ',
    },
  });

  const empresasList = Array.isArray(empresas) ? empresas : [];

  const openCreateModal = () => {
    setEditingEmpresa(null);
    setCnpjValue('');
    reset({
      cnpj: '',
      razaoSocial: '',
      nomeFantasia: '',
      tipo: 'MATRIZ' as const,
      uf: undefined as EmpresaFormData['uf'],
      setor: '',
      porte: undefined,
      dataFundacao: '',
      descricao: '',
      website: '',
      modeloNegocio: undefined,
      modeloNegocioDetalhes: undefined,
      contasReceita: undefined,
      custosCentralizados: false,
      contasCustos: undefined,
    });
    setIsModalOpen(true);
    setErrorMessage(null);
  };

  const openEditModal = (empresa: Empresa) => {
    setEditingEmpresa(empresa.id);
    const cnpjFormatted = maskCNPJ(empresa.cnpj);
    setCnpjValue(cnpjFormatted);
    
    // Validar se uf é um estado válido
    const ufsValidos = UFS_BRASIL.map((u) => u.value) as readonly string[];
    const ufValido: EmpresaFormData['uf'] = empresa.uf && ufsValidos.includes(empresa.uf) 
      ? (empresa.uf as EmpresaFormData['uf']) 
      : undefined;
    
    reset({
      cnpj: empresa.cnpj,
      razaoSocial: empresa.razaoSocial,
      nomeFantasia: empresa.nomeFantasia || '',
      tipo: empresa.tipo || 'MATRIZ',
      uf: ufValido,
      setor: empresa.setor || '',
      porte: empresa.porte || undefined,
      dataFundacao: empresa.dataFundacao ? empresa.dataFundacao.split('T')[0] : '',
      descricao: empresa.descricao || '',
      website: empresa.website || '',
      modeloNegocio: empresa.modeloNegocio || undefined,
      modeloNegocioDetalhes: empresa.modeloNegocioDetalhes || undefined,
      contasReceita: empresa.contasReceita || undefined,
      custosCentralizados: empresa.custosCentralizados || false,
      contasCustos: empresa.contasCustos || undefined,
    });
    setIsModalOpen(true);
    setErrorMessage(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmpresa(null);
    setCnpjValue('');
    reset();
    setErrorMessage(null);
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCNPJ(e.target.value);
    setCnpjValue(masked);
    const unmasked = unmaskCNPJ(masked);
    setValue('cnpj', unmasked, { shouldValidate: true });
  };

  const onSubmit = async (data: EmpresaFormData) => {
    setErrorMessage(null);
    try {
      const cnpjLimpo = unmaskCNPJ(data.cnpj);
      
      if (editingEmpresa) {
        await updateEmpresa.mutateAsync({
          id: editingEmpresa,
          dto: {
            razaoSocial: data.razaoSocial,
            nomeFantasia: data.nomeFantasia || undefined,
            tipo: data.tipo,
            uf: data.uf || undefined,
            setor: data.setor || undefined,
            porte: data.porte,
            dataFundacao: data.dataFundacao || undefined,
            descricao: data.descricao || undefined,
            website: data.website || undefined,
            modeloNegocio: data.modeloNegocio,
            modeloNegocioDetalhes: data.modeloNegocioDetalhes,
            contasReceita: data.contasReceita,
            custosCentralizados: data.custosCentralizados,
            contasCustos: data.contasCustos,
          },
        });
      } else {
        await createEmpresa.mutateAsync({
          cnpj: cnpjLimpo,
          razaoSocial: data.razaoSocial,
          nomeFantasia: data.nomeFantasia || undefined,
          tipo: data.tipo,
          uf: data.uf || undefined,
          setor: data.setor || undefined,
          porte: data.porte,
          dataFundacao: data.dataFundacao || undefined,
          descricao: data.descricao || undefined,
          website: data.website || undefined,
          modeloNegocio: data.modeloNegocio,
          modeloNegocioDetalhes: data.modeloNegocioDetalhes,
          contasReceita: data.contasReceita,
          custosCentralizados: data.custosCentralizados,
          contasCustos: data.contasCustos,
        });
      }
      closeModal();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(
        error.response?.data?.message || error.message || 'Erro ao salvar empresa',
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) {
      return;
    }

    try {
      await deleteEmpresa.mutateAsync(id);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      alert(
        error.response?.data?.message || error.message || 'Erro ao excluir empresa',
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-slate-500">Carregando empresas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-rose-500">
          Erro ao carregar empresas. Verifique se o backend está rodando.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Empresas
          </h1>
          <p className="text-sm text-slate-500">
            Gerencie as empresas (Matriz e Filiais) do sistema.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
        >
          <Plus className="h-4 w-4" />
          Nova empresa
        </button>
      </header>

      {empresasList.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            Nenhuma empresa cadastrada. Clique em &quot;Nova empresa&quot; para começar.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-300">
                    CNPJ
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-300">
                    Razão Social
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-300">
                    Nome Fantasia
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-300">
                    Tipo
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-300">
                    UF
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-300">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {empresasList.map((empresa) => (
                  <tr key={empresa.id}>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-foreground">
                      {maskCNPJ(empresa.cnpj)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-foreground">
                      {empresa.razaoSocial}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-slate-500 dark:text-slate-300">
                      {empresa.nomeFantasia || '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        empresa.tipo === 'MATRIZ'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200'
                      }`}>
                        {empresa.tipo === 'MATRIZ' ? 'Matriz' : 'Filial'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-slate-500 dark:text-slate-300">
                      {empresa.uf || '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(empresa)}
                          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(empresa.id)}
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
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">
                {editingEmpresa ? 'Editar empresa' : 'Nova empresa'}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {errorMessage && (
                <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="cnpj" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  CNPJ *
                </label>
                <input
                  id="cnpj"
                  type="text"
                  value={cnpjValue}
                  onChange={handleCnpjChange}
                  maxLength={18}
                  placeholder="00.000.000/0000-00"
                  disabled={!!editingEmpresa}
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {errors.cnpj && (
                  <p className="text-xs text-rose-600">{errors.cnpj.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="razaoSocial" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Razão Social *
                </label>
                <input
                  id="razaoSocial"
                  type="text"
                  {...register('razaoSocial')}
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {errors.razaoSocial && (
                  <p className="text-xs text-rose-600">{errors.razaoSocial.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="nomeFantasia" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nome Fantasia
                </label>
                <input
                  id="nomeFantasia"
                  type="text"
                  {...register('nomeFantasia')}
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {errors.nomeFantasia && (
                  <p className="text-xs text-rose-600">{errors.nomeFantasia.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="tipo" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Tipo *
                </label>
                <select
                  id="tipo"
                  {...register('tipo')}
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="MATRIZ">Matriz</option>
                  <option value="FILIAL">Filial</option>
                </select>
                {errors.tipo && (
                  <p className="text-xs text-rose-600">{errors.tipo.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="uf" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  UF
                </label>
                <select
                  id="uf"
                  {...register('uf')}
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">Selecione uma UF</option>
                  {UFS_BRASIL.map((uf) => (
                    <option key={uf.value} value={uf.value}>
                      {uf.label}
                    </option>
                  ))}
                </select>
                {errors.uf && (
                  <p className="text-xs text-rose-600">{errors.uf.message}</p>
                )}
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
                  disabled={createEmpresa.isPending || updateEmpresa.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="h-4 w-4" />
                  {editingEmpresa ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmpresasPage;

