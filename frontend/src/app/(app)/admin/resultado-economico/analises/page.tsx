'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { aiService } from '@/services/ai.service';
import { resumosService } from '@/services/resumos.service';
import { useEmpresas } from '@/hooks/use-empresas';
import { BrainCircuit, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { AnalisarDadosParams, AnaliseResponse } from '@/types/api';

const AnalisesPage = () => {
  const router = useRouter();
  const { data: empresas } = useEmpresas();
  const [tipoAnalise, setTipoAnalise] = useState<'GERAL' | 'UPLOAD' | 'ALERTAS' | 'RELATORIO' | 'COMPARATIVO'>('GERAL');
  const [empresaId, setEmpresaId] = useState<string>('');
  const [mes, setMes] = useState<number | undefined>(undefined);
  const [ano, setAno] = useState<number | undefined>(new Date().getFullYear());
  const [descricao, setDescricao] = useState<string>('');
  const [salvarResumo, setSalvarResumo] = useState<boolean>(true);
  const [tituloResumo, setTituloResumo] = useState<string>('');

  const analiseMutation = useMutation({
    mutationFn: (params: AnalisarDadosParams) => aiService.analisarDados(params),
    onSuccess: async (data: AnaliseResponse, variables) => {
      // Se o usuário optou por salvar o resumo
      if (salvarResumo) {
        try {
          const titulo = tituloResumo || `Análise ${tipoAnalise} - ${new Date().toLocaleDateString('pt-BR')}`;
          await resumosService.create({
            titulo,
            mes: mes || undefined,
            ano: ano || new Date().getFullYear(),
            empresaId: empresaId || undefined,
            tipoAnalise,
            parametros: variables,
          });
          
          // Redirecionar para a página de resumos após salvar
          setTimeout(() => {
            router.push('/admin/resultado-economico/resumos');
          }, 2000); // Dar tempo para o usuário ver a mensagem de sucesso
        } catch (err) {
          console.error('Erro ao salvar resumo:', err);
          // Não redirecionar se houver erro, para que o usuário veja o resultado
        }
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ano) {
      alert('Por favor, informe o ano');
      return;
    }

    const params: AnalisarDadosParams = {
      tipo: tipoAnalise,
      ...(empresaId && { empresaId }),
      ...(mes && { mes }),
      ...(ano && { ano }),
      ...(descricao && { descricao }),
    };

    analiseMutation.mutate(params);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground dark:text-slate-50">
          Análises Inteligentes
        </h1>
        <p className="text-sm text-muted-foreground">
          Análises assistidas pela Groq AI para explicar variações, apontar anomalias e gerar insights automáticos dos seus dados.
        </p>
      </header>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tipoAnalise" className="block text-sm font-medium text-foreground mb-2">
              Tipo de Análise *
            </label>
            <select
              id="tipoAnalise"
              value={tipoAnalise}
              onChange={(e) => setTipoAnalise(e.target.value as typeof tipoAnalise)}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            >
              <option value="GERAL">Análise Geral</option>
              <option value="UPLOAD">Análise de Upload</option>
              <option value="ALERTAS">Análise de Alertas</option>
              <option value="RELATORIO">Análise de Relatório</option>
              <option value="COMPARATIVO">Análise Comparativa</option>
            </select>
          </div>

          <div>
            <label htmlFor="empresaId" className="block text-sm font-medium text-foreground mb-2">
              Empresa (opcional)
            </label>
            <select
              id="empresaId"
              value={empresaId}
              onChange={(e) => setEmpresaId(e.target.value)}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Todas (Consolidado)</option>
              {empresas?.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nomeFantasia || empresa.razaoSocial}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="ano" className="block text-sm font-medium text-foreground mb-2">
                Ano *
              </label>
              <input
                id="ano"
                type="number"
                value={ano || ''}
                onChange={(e) => setAno(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                min="2020"
                max="2100"
                className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                required
              />
            </div>

            <div>
              <label htmlFor="mes" className="block text-sm font-medium text-foreground mb-2">
                Mês (opcional)
              </label>
              <input
                id="mes"
                type="number"
                min="1"
                max="12"
                value={mes || ''}
                onChange={(e) => setMes(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div>
            <label htmlFor="descricao" className="block text-sm font-medium text-foreground mb-2">
              Descrição Adicional (opcional)
            </label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              placeholder="Descreva o que você gostaria que a IA analisasse especificamente..."
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="border-t border-border pt-4">
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={salvarResumo}
                  onChange={(e) => setSalvarResumo(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-foreground">
                  Salvar como Resumo Econômico
                </span>
              </label>

              {salvarResumo && (
                <div>
                  <label htmlFor="tituloResumo" className="block text-sm font-medium text-foreground mb-2">
                    Título do Resumo (opcional)
                  </label>
                  <input
                    id="tituloResumo"
                    type="text"
                    value={tituloResumo}
                    onChange={(e) => setTituloResumo(e.target.value)}
                    placeholder="Deixe em branco para usar título automático"
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="submit"
              disabled={analiseMutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-purple-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analiseMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <BrainCircuit className="h-4 w-4" />
                  Executar Análise
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Resultado da Análise */}
      {analiseMutation.isSuccess && analiseMutation.data && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-foreground">Análise Concluída</h2>
          </div>

          {analiseMutation.data.resumo && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-foreground mb-2">Resumo</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {analiseMutation.data.resumo}
              </p>
            </div>
          )}

          {analiseMutation.data.insights && analiseMutation.data.insights.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-foreground mb-2">Insights</h3>
              <div className="space-y-2">
                {analiseMutation.data.insights.map((insight, index) => (
                  <div
                    key={index}
                    className="rounded-md border border-border bg-muted p-3"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          insight.tipo === 'POSITIVO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : insight.tipo === 'ATENCAO'
                              ? 'bg-yellow-100 text-yellow-800'
                              : insight.tipo === 'CRITICO'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {insight.tipo}
                      </span>
                      {insight.confianca && (
                        <span className="text-xs text-muted-foreground">
                          Confiança: {insight.confianca}%
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium text-foreground mt-2">{insight.titulo}</h4>
                    {insight.descricao && (
                      <p className="text-sm text-muted-foreground mt-1">{insight.descricao}</p>
                    )}
                    {insight.recomendacao && (
                      <p className="text-sm text-foreground mt-2 font-medium">
                        Recomendação: {insight.recomendacao}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {salvarResumo && (
            <div className="mt-4 p-3 rounded-md bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800">
              <p className="text-sm text-emerald-800 dark:text-emerald-200">
                Resumo salvo com sucesso! Você pode visualizá-lo na página de Resumos Econômicos.
              </p>
            </div>
          )}
        </div>
      )}

      {analiseMutation.isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 shadow-sm dark:border-rose-800 dark:bg-rose-900/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-rose-600" />
            <h2 className="text-lg font-semibold text-rose-800 dark:text-rose-200">
              Erro na Análise
            </h2>
          </div>
          <p className="text-sm text-rose-700 dark:text-rose-300">
            {analiseMutation.error instanceof Error
              ? analiseMutation.error.message
              : 'Ocorreu um erro ao executar a análise. Verifique se a chave da API do Groq está configurada.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalisesPage;
