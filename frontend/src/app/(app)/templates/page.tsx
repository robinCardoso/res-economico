'use client';

import { useState } from 'react';
import {
  useTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
} from '@/hooks/use-templates';
import { useEmpresas } from '@/hooks/use-empresas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { TemplateImportacaoWithRelations } from '@/types/api';
import type { ColumnMapping } from '@/services/templates.service';

const templateSchema = z.object({
  empresaId: z.string().min(1, 'Empresa é obrigatória'),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: z.string().optional(),
  columnMapping: z.object({
    classificacao: z.string().optional(),
    conta: z.string().optional(),
    subConta: z.string().optional(),
    nomeConta: z.string().optional(),
    tipoConta: z.string().optional(),
    nivel: z.string().optional(),
    titulo: z.string().optional(),
    estabelecimento: z.string().optional(),
    saldoAnterior: z.string().optional(),
    debito: z.string().optional(),
    credito: z.string().optional(),
    saldoAtual: z.string().optional(),
  }),
});

type TemplateFormData = z.infer<typeof templateSchema>;

const COLUMN_FIELDS = [
  { key: 'classificacao', label: 'Classificação', required: true },
  { key: 'conta', label: 'Conta', required: true },
  { key: 'subConta', label: 'Sub Conta', required: false },
  { key: 'nomeConta', label: 'Nome da Conta', required: true },
  { key: 'tipoConta', label: 'Tipo', required: true },
  { key: 'nivel', label: 'Nível', required: true },
  { key: 'titulo', label: 'Título', required: false },
  { key: 'estabelecimento', label: 'Estabelecimento', required: false },
  { key: 'saldoAnterior', label: 'Saldo Anterior', required: false },
  { key: 'debito', label: 'Débito', required: false },
  { key: 'credito', label: 'Crédito', required: false },
  { key: 'saldoAtual', label: 'Saldo Atual', required: false },
] as const;

const TemplatesPage = () => {
  const { data: templates, isLoading, error } = useTemplates();
  const { data: empresas } = useEmpresas();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      columnMapping: {},
    },
  });

  const templatesList = Array.isArray(templates) ? templates : [];
  const empresasList = Array.isArray(empresas) ? empresas : [];

  const openCreateModal = () => {
    setEditingTemplate(null);
    reset({
      empresaId: '',
      nome: '',
      descricao: '',
      columnMapping: {},
    });
    setIsModalOpen(true);
    setErrorMessage(null);
  };

  const openEditModal = (template: TemplateImportacaoWithRelations) => {
    setEditingTemplate(template.id);
    const config = template.configuracao as { columnMapping?: ColumnMapping } | null;
    const columnMapping = config?.columnMapping || {};
    
    reset({
      empresaId: template.empresaId,
      nome: template.nome,
      descricao: template.descricao || '',
      columnMapping,
    });
    setIsModalOpen(true);
    setErrorMessage(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
    reset();
    setErrorMessage(null);
  };

  const onSubmit = async (data: TemplateFormData) => {
    setErrorMessage(null);
    try {
      if (editingTemplate) {
        await updateTemplate.mutateAsync({
          id: editingTemplate,
          dto: data,
        });
      } else {
        await createTemplate.mutateAsync(data);
      }
      closeModal();
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message || 'Erro ao salvar template. Tente novamente.',
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) {
      return;
    }

    try {
      await deleteTemplate.mutateAsync(id);
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Erro ao excluir template.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-slate-500">Carregando templates...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-rose-500">
          Erro ao carregar templates. Verifique se o backend está rodando.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Templates de importação
          </h1>
          <p className="text-sm text-slate-500">
            Defina o mapeamento de colunas para cada empresa ou tipo de planilha.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900"
        >
          <Plus className="h-4 w-4" />
          Criar template
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {templatesList.length === 0 ? (
          <div className="col-span-2 px-6 py-12 text-center text-sm text-slate-500">
            Nenhum template encontrado. Crie um novo template para começar.
          </div>
        ) : (
          templatesList.map((template) => {
            const config = template.configuracao as { columnMapping?: ColumnMapping } | null;
            const columnMapping = config?.columnMapping || {};
            const colunasCount = Object.keys(columnMapping).filter((k) => columnMapping[k as keyof ColumnMapping]).length;

            return (
              <article
                key={template.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
              >
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {template.nome}
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                  {template.descricao || 'Sem descrição'}
                </p>
                <dl className="mt-4 flex flex-wrap gap-6 text-xs text-slate-500 dark:text-slate-400">
                  <div>
                    <dt>Empresa</dt>
                    <dd className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {template.empresa?.razaoSocial || 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt>Colunas mapeadas</dt>
                    <dd className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {colunasCount}
                    </dd>
                  </div>
                  <div>
                    <dt>Última atualização</dt>
                    <dd className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatDate(template.updatedAt)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-6 flex gap-3 text-sm">
                  <button
                    onClick={() => openEditModal(template)}
                    className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="flex items-center gap-2 rounded-md border border-rose-300 px-3 py-2 text-rose-500 hover:bg-rose-500/10 dark:border-rose-500/60 dark:text-rose-300"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {editingTemplate ? 'Editar template' : 'Criar template'}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {errorMessage && (
                <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Empresa <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('empresaId')}
                  className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">Selecione uma empresa</option>
                  {empresasList.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.razaoSocial}
                    </option>
                  ))}
                </select>
                {errors.empresaId && (
                  <p className="mt-1 text-xs text-rose-500">{errors.empresaId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nome <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('nome')}
                  className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                {errors.nome && (
                  <p className="mt-1 text-xs text-rose-500">{errors.nome.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Descrição
                </label>
                <textarea
                  {...register('descricao')}
                  rows={3}
                  className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Mapeamento de Colunas
                </label>
                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                  {COLUMN_FIELDS.map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        {field.label}
                        {field.required && <span className="text-rose-500 ml-1">*</span>}
                      </label>
                      <input
                        type="text"
                        {...register(`columnMapping.${field.key}`)}
                        placeholder={`Nome da coluna no Excel (ex: "${field.label}")`}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Informe o nome exato da coluna no arquivo Excel. Deixe em branco se a coluna não existir.
                </p>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createTemplate.isPending || updateTemplate.isPending}
                  className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
                >
                  <Check className="h-4 w-4" />
                  {editingTemplate ? 'Salvar alterações' : 'Criar template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesPage;
