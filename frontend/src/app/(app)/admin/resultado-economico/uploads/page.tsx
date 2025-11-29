'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUploads } from '@/hooks/use-uploads';
import { useEmpresas } from '@/hooks/use-empresas';
import { relatoriosService } from '@/services/relatorios.service';
import { formatPeriodo, formatDateTime, getStatusLabel } from '@/lib/format';
import { maskCNPJ } from '@/lib/masks';
import { Building2, AlertCircle, FileText, Calendar, Clock, Loader2 } from 'lucide-react';

const UploadsPage = () => {
  const router = useRouter();
  const [empresaFiltro, setEmpresaFiltro] = useState<string>('');
  const [anoFiltro, setAnoFiltro] = useState<number | undefined>(undefined);
  const [mesFiltro, setMesFiltro] = useState<number | undefined>(undefined);
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [carregandoAnos, setCarregandoAnos] = useState<boolean>(true);
  const { data: uploads, isLoading, error } = useUploads({
    empresaId: empresaFiltro || undefined,
    ano: anoFiltro,
    mes: mesFiltro,
  });
  const { data: empresas } = useEmpresas();

  // Buscar anos disponíveis a partir do banco (tabela Upload)
  useEffect(() => {
    const buscarAnos = async () => {
      try {
        const anos = await relatoriosService.getAnosDisponiveis();
        setAnosDisponiveis(anos);

        // Se ainda não houver ano selecionado, usar o mais recente
        if (!anoFiltro && anos.length > 0) {
          setAnoFiltro(anos[0]);
        }
      } catch (err) {
        console.error('Erro ao buscar anos disponíveis para uploads:', err);
      } finally {
        setCarregandoAnos(false);
      }
    };

    void buscarAnos();
  }, [anoFiltro]);

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

  // Como já usamos filtros na consulta (empresa/ano/mês), aqui só usamos a lista retornada
  const uploadsFiltrados = uploadsList;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Uploads
          </h1>
          <p className="text-sm text-slate-500">
            Histórico de importações por empresa, período e status.
          </p>
        </div>
        <Link
          href="/admin/resultado-economico/uploads/novo"
          className="inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
        >
          Novo upload
        </Link>
      </header>

      {/* Filtro por empresa / período */}
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <label htmlFor="empresa-filtro" className="text-sm font-medium text-foreground">
            Filtrar por empresa:
          </label>
          <select
            id="empresa-filtro"
            value={empresaFiltro}
            onChange={(e) => setEmpresaFiltro(e.target.value)}
            className="rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Todas as empresas</option>
            {empresasList.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.razaoSocial} {empresa.nomeFantasia ? `(${empresa.nomeFantasia})` : ''} - {maskCNPJ(empresa.cnpj)}
              </option>
            ))}
          </select>

          {/* Filtro de ano (usando anos disponíveis do banco) */}
          <label htmlFor="ano-filtro" className="text-sm font-medium text-foreground">
            Ano:
          </label>
          <select
            id="ano-filtro"
            value={anoFiltro ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              setAnoFiltro(value ? Number(value) : undefined);
            }}
            disabled={carregandoAnos}
            className="w-28 rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
          >
            <option value="">
              {carregandoAnos ? 'Carregando...' : 'Todos os anos'}
            </option>
            {anosDisponiveis.map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>

          {/* Filtro de mês */}
          <label htmlFor="mes-filtro" className="text-sm font-medium text-foreground">
            Mês:
          </label>
          <select
            id="mes-filtro"
            value={mesFiltro ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              setMesFiltro(value ? Number(value) : undefined);
            }}
            className="w-32 rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Todos</option>
            <option value="1">Janeiro</option>
            <option value="2">Fevereiro</option>
            <option value="3">Março</option>
            <option value="4">Abril</option>
            <option value="5">Maio</option>
            <option value="6">Junho</option>
            <option value="7">Julho</option>
            <option value="8">Agosto</option>
            <option value="9">Setembro</option>
            <option value="10">Outubro</option>
            <option value="11">Novembro</option>
            <option value="12">Dezembro</option>
          </select>

          {(empresaFiltro || anoFiltro || mesFiltro) && (
            <span className="text-xs text-slate-500">
              {uploadsFiltrados.length} upload(s) encontrado(s)
            </span>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card shadow-sm">
        {uploadsFiltrados.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            {empresaFiltro
              ? 'Nenhum upload encontrado para esta empresa.'
              : 'Nenhum upload encontrado. Comece criando um novo upload.'}
          </div>
        ) : (
          <div 
            className="overflow-x-auto overflow-y-auto h-[400px] w-full" 
            style={{ 
              scrollbarWidth: 'thin',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <table className="w-full divide-y divide-border text-[10px]">
              <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm shadow-sm">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-foreground w-[25%]">
                    Empresa
                  </th>
                  <th className="px-2 py-2 text-left text-[10px] font-medium text-muted-foreground w-[10%]">Período</th>
                  <th className="px-2 py-2 text-left text-[10px] font-medium text-muted-foreground w-[25%]">Arquivo</th>
                  <th className="px-2 py-2 text-left text-[10px] font-medium text-muted-foreground w-[10%]">Status</th>
                  <th className="px-2 py-2 text-left text-[10px] font-medium text-muted-foreground w-[8%]">Alertas</th>
                  <th className="px-2 py-2 text-left text-[10px] font-medium text-muted-foreground w-[7%]">Linhas</th>
                  <th className="px-2 py-2 text-left text-[10px] font-medium text-muted-foreground w-[15%]">Atualizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {uploadsFiltrados.map((upload) => (
                  <tr
                    key={upload.id}
                    onClick={() => router.push(`/admin/resultado-economico/uploads/${upload.id}`)}
                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-start gap-1.5">
                        <div className="flex-shrink-0 mt-0.5">
                          <Building2 className="h-3 w-3 text-slate-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-foreground truncate">
                            {upload.empresa?.razaoSocial || 'N/A'}
                          </div>
                          {upload.empresa?.nomeFantasia && (
                            <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                              {upload.empresa.nomeFantasia}
                            </div>
                          )}
                          {upload.empresa?.cnpj && (
                            <div className="text-[9px] text-muted-foreground mt-0.5 font-mono">
                              CNPJ: {maskCNPJ(upload.empresa.cnpj)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1 text-xs text-foreground">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span>{formatPeriodo(upload.mes, upload.ano)}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <FileText className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-[200px]" title={upload.nomeArquivo || undefined}>
                          {upload.nomeArquivo || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                            upload.status === 'CONCLUIDO'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200'
                              : upload.status === 'COM_ALERTAS'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200'
                                : upload.status === 'PROCESSANDO'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-200'
                                  : 'bg-muted text-foreground'
                          }`}
                        >
                          {getStatusLabel(upload.status)}
                        </span>
                        {upload.status === 'PROCESSANDO' && (
                          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      {(upload.alertas?.length || 0) > 0 ? (
                        <Link
                          href={`/admin/resultado-economico/alertas?uploadId=${upload.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 group hover:opacity-80 transition-opacity"
                        >
                          <AlertCircle className="h-3 w-3 text-amber-500" />
                          <span className="text-xs font-medium text-amber-700 dark:text-amber-300 group-hover:underline">
                            {upload.alertas?.length || 0}
                          </span>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">
                            0
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1 text-xs text-foreground">
                        <FileText className="h-3 w-3 text-slate-400" />
                        <span>{upload.totalLinhas || 0}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span className="text-[10px]">{formatDateTime(upload.updatedAt)}</span>
                      </div>
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

