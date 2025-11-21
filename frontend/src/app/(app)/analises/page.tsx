'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { BrainCircuit, Loader2, AlertCircle, CheckCircle2, Info, AlertTriangle, Sparkles, Save, X } from 'lucide-react';
import { aiService } from '@/services/ai.service';
import { relatoriosService } from '@/services/relatorios.service';
import { uploadsService } from '@/services/uploads.service';
import { resumosService } from '@/services/resumos.service';
import { TipoAnalise, type AnaliseResponse, type Insight, type PadraoAnomalo, type UploadWithRelations, type CreateResumoDto } from '@/types/api';
import { useEmpresas } from '@/hooks/use-empresas';

const meses = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const AnalisesPage = () => {
  const [tipoAnalise, setTipoAnalise] = useState<TipoAnalise>(TipoAnalise.GERAL);
  const [uploadId, setUploadId] = useState<string>('');
  const [empresaId, setEmpresaId] = useState<string>('');
  const [mes, setMes] = useState<string>('');
  const [ano, setAno] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  // Campos para análise comparativa
  const [mes1, setMes1] = useState<string>('');
  const [ano1, setAno1] = useState<string>('');
  const [mes2, setMes2] = useState<string>('');
  const [ano2, setAno2] = useState<string>('');
  const [tipoValor, setTipoValor] = useState<'ACUMULADO' | 'PERIODO'>('ACUMULADO');
  
  // Estados para filtros de upload
  const [empresaFiltro, setEmpresaFiltro] = useState<string>('');
  const [anoFiltro, setAnoFiltro] = useState<string>('');
  const [mesFiltro, setMesFiltro] = useState<string>('');
  const [uploadsFiltrados, setUploadsFiltrados] = useState<UploadWithRelations[]>([]);
  const [carregandoUploads, setCarregandoUploads] = useState<boolean>(false);

  // Estados para dados disponíveis
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [mesesDisponiveisAno1, setMesesDisponiveisAno1] = useState<number[]>([]);
  const [mesesDisponiveisAno2, setMesesDisponiveisAno2] = useState<number[]>([]);
  const [mesesDisponiveisFiltro, setMesesDisponiveisFiltro] = useState<number[]>([]);
  const [mesesDisponiveisRelatorio, setMesesDisponiveisRelatorio] = useState<number[]>([]);
  const [descricoesDisponiveis, setDescricoesDisponiveis] = useState<string[]>([]);
  const [carregandoDados, setCarregandoDados] = useState<boolean>(true);
  
  // Estados para modal de resumo
  const [showModalResumo, setShowModalResumo] = useState<boolean>(false);
  const [tituloResumo, setTituloResumo] = useState<string>('');
  const [salvandoResumo, setSalvandoResumo] = useState<boolean>(false);

  const { data: empresas } = useEmpresas();
  const router = useRouter();

  // Buscar anos disponíveis
  useEffect(() => {
    const buscarDados = async () => {
      try {
        const anos = await relatoriosService.getAnosDisponiveis();
        setAnosDisponiveis(anos);
        if (anos.length > 0) {
          const primeiroAno = anos[0];
          setAno1(primeiroAno.toString());
          setAno2(primeiroAno.toString());
        }
      } catch (error) {
        console.error('Erro ao buscar dados disponíveis:', error);
      } finally {
        setCarregandoDados(false);
      }
    };
    buscarDados();
  }, []);

  // Buscar meses disponíveis para ano1
  useEffect(() => {
    if (ano1 && parseInt(ano1, 10)) {
      const buscarMeses = async () => {
        try {
          const mesesDisponiveis = await relatoriosService.getMesesDisponiveis(
            parseInt(ano1, 10),
            empresaId || undefined,
          );
          setMesesDisponiveisAno1(mesesDisponiveis);
          // Se o mês atual não está mais disponível, limpar ou selecionar o primeiro
          if (mes1 && !mesesDisponiveis.includes(parseInt(mes1, 10))) {
            if (mesesDisponiveis.length > 0) {
              setMes1(mesesDisponiveis[0].toString());
            } else {
              setMes1('');
            }
          } else if (mesesDisponiveis.length > 0 && !mes1) {
            setMes1(mesesDisponiveis[0].toString());
          }
        } catch (error) {
          console.error('Erro ao buscar meses disponíveis para ano1:', error);
        }
      };
      buscarMeses();
    } else {
      setMesesDisponiveisAno1([]);
    }
  }, [ano1, empresaId, mes1]);

  // Buscar meses disponíveis para ano2
  useEffect(() => {
    if (ano2 && parseInt(ano2, 10)) {
      const buscarMeses = async () => {
        try {
          const mesesDisponiveis = await relatoriosService.getMesesDisponiveis(
            parseInt(ano2, 10),
            empresaId || undefined,
          );
          setMesesDisponiveisAno2(mesesDisponiveis);
          // Se o mês atual não está mais disponível, limpar ou selecionar o primeiro
          if (mes2 && !mesesDisponiveis.includes(parseInt(mes2, 10))) {
            if (mesesDisponiveis.length > 0) {
              setMes2(mesesDisponiveis[0].toString());
            } else {
              setMes2('');
            }
          } else if (mesesDisponiveis.length > 0 && !mes2) {
            setMes2(mesesDisponiveis[0].toString());
          }
        } catch (error) {
          console.error('Erro ao buscar meses disponíveis para ano2:', error);
        }
      };
      buscarMeses();
    } else {
      setMesesDisponiveisAno2([]);
    }
  }, [ano2, empresaId, mes2]);

  // Buscar meses disponíveis para análise de relatório
  useEffect(() => {
    if (tipoAnalise === TipoAnalise.RELATORIO && ano && parseInt(ano, 10)) {
      const buscarMeses = async () => {
        try {
          const mesesDisponiveis = await relatoriosService.getMesesDisponiveis(
            parseInt(ano, 10),
            empresaId || undefined,
          );
          setMesesDisponiveisRelatorio(mesesDisponiveis);
          // Se o mês atual não está mais disponível, limpar ou selecionar o primeiro
          if (mes && !mesesDisponiveis.includes(parseInt(mes, 10))) {
            if (mesesDisponiveis.length > 0) {
              setMes(mesesDisponiveis[0].toString());
            } else {
              setMes('');
            }
          } else if (mesesDisponiveis.length > 0 && !mes) {
            setMes(mesesDisponiveis[0].toString());
          }
        } catch (error) {
          console.error('Erro ao buscar meses disponíveis para relatório:', error);
        }
      };
      buscarMeses();
    } else {
      setMesesDisponiveisRelatorio([]);
    }
  }, [tipoAnalise, ano, empresaId, mes]);

  // Buscar descrições disponíveis para autocomplete
  useEffect(() => {
    if (tipoAnalise === TipoAnalise.RELATORIO && descricao && descricao.length >= 2) {
      const buscarDescricoes = async () => {
        try {
          const descricoes = await relatoriosService.getDescricoesDisponiveis(descricao);
          setDescricoesDisponiveis(descricoes);
        } catch (error) {
          console.error('Erro ao buscar descrições disponíveis:', error);
          setDescricoesDisponiveis([]);
        }
      };
      
      // Debounce para não fazer muitas requisições
      const timeoutId = setTimeout(buscarDescricoes, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setDescricoesDisponiveis([]);
    }
  }, [tipoAnalise, descricao]);

  // Buscar meses disponíveis para anoFiltro (usado nos filtros de upload)
  useEffect(() => {
    if (anoFiltro && parseInt(anoFiltro, 10)) {
      const buscarMeses = async () => {
        try {
          const mesesDisponiveis = await relatoriosService.getMesesDisponiveis(
            parseInt(anoFiltro, 10),
            empresaFiltro || undefined,
          );
          setMesesDisponiveisFiltro(mesesDisponiveis);
        } catch (error) {
          console.error('Erro ao buscar meses disponíveis para filtro:', error);
          setMesesDisponiveisFiltro([]);
        }
      };
      buscarMeses();
    } else {
      setMesesDisponiveisFiltro([]);
    }
  }, [anoFiltro, empresaFiltro]);

  // Buscar uploads quando filtros mudarem (apenas para análise de upload)
  useEffect(() => {
    if (tipoAnalise === TipoAnalise.UPLOAD) {
      const buscarUploads = async () => {
        setCarregandoUploads(true);
        try {
          const uploads = await uploadsService.list({
            empresaId: empresaFiltro || undefined,
            ano: anoFiltro ? parseInt(anoFiltro, 10) : undefined,
            mes: mesFiltro ? parseInt(mesFiltro, 10) : undefined,
          });
          setUploadsFiltrados(uploads);
        } catch (error) {
          console.error('Erro ao buscar uploads:', error);
          setUploadsFiltrados([]);
        } finally {
          setCarregandoUploads(false);
        }
      };
      buscarUploads();
    } else {
      setUploadsFiltrados([]);
    }
  }, [tipoAnalise, empresaFiltro, anoFiltro, mesFiltro]);

  const { data: analise, isLoading, error, refetch } = useQuery<AnaliseResponse>({
    queryKey: ['analise-ai', tipoAnalise, uploadId, empresaId, mes, ano, descricao, mes1, ano1, mes2, ano2, tipoValor],
    queryFn: () =>
      aiService.analisarDados({
        tipo: tipoAnalise,
        uploadId: uploadId || undefined,
        empresaId: empresaId || undefined,
        mes: mes ? parseInt(mes, 10) : undefined,
        ano: ano ? parseInt(ano, 10) : undefined,
        descricao: descricao || undefined,
        mes1: mes1 ? parseInt(mes1, 10) : undefined,
        ano1: ano1 ? parseInt(ano1, 10) : undefined,
        mes2: mes2 ? parseInt(mes2, 10) : undefined,
        ano2: ano2 ? parseInt(ano2, 10) : undefined,
        tipoValor: tipoValor,
      }),
    enabled: false, // Não executar automaticamente
  });

  const handleAnalisar = () => {
    refetch();
  };

  // Gerar título automático baseado no tipo de análise e período
  const gerarTituloAutomatico = (): string => {
    const mesNome = mes ? meses.find((m) => m.value === parseInt(mes, 10))?.label : '';
    const periodo = mes && ano ? `${mesNome}/${ano}` : ano ? `${ano}` : 'Período não especificado';
    
    switch (tipoAnalise) {
      case TipoAnalise.UPLOAD:
        return `Análise de Upload - ${periodo}`;
      case TipoAnalise.RELATORIO:
        return `Resumo econômico ${periodo}`;
      case TipoAnalise.COMPARATIVO:
        const periodo1 = mes1 && ano1 ? `${meses.find((m) => m.value === parseInt(mes1, 10))?.label}/${ano1}` : ano1 || '';
        const periodo2 = mes2 && ano2 ? `${meses.find((m) => m.value === parseInt(mes2, 10))?.label}/${ano2}` : ano2 || '';
        return `Análise Comparativa - ${periodo1} vs ${periodo2}`;
      default:
        return `Análise - ${periodo}`;
    }
  };

  // Abrir modal de criação de resumo
  const handleAbrirModalResumo = () => {
    const tituloAuto = gerarTituloAutomatico();
    setTituloResumo(tituloAuto);
    setShowModalResumo(true);
  };

  // Salvar resumo
  const handleSalvarResumo = async () => {
    if (!analise || !tituloResumo.trim()) {
      alert('Por favor, preencha o título do resumo');
      return;
    }

    setSalvandoResumo(true);
    try {
      const dto: CreateResumoDto = {
        titulo: tituloResumo.trim(),
        mes: mes ? parseInt(mes, 10) : undefined,
        ano: ano ? parseInt(ano, 10) : (ano1 ? parseInt(ano1, 10) : new Date().getFullYear()),
        empresaId: empresaId || undefined,
        uploadId: uploadId || undefined,
        tipoAnalise: tipoAnalise,
        parametros: {
          tipo: tipoAnalise,
          uploadId: uploadId || undefined,
          empresaId: empresaId || undefined,
          mes: mes ? parseInt(mes, 10) : undefined,
          ano: ano ? parseInt(ano, 10) : undefined,
          descricao: descricao || undefined,
          mes1: mes1 ? parseInt(mes1, 10) : undefined,
          ano1: ano1 ? parseInt(ano1, 10) : undefined,
          mes2: mes2 ? parseInt(mes2, 10) : undefined,
          ano2: ano2 ? parseInt(ano2, 10) : undefined,
          tipoValor: tipoValor,
        },
      };

      const resumo = await resumosService.create(dto);
      setShowModalResumo(false);
      setTituloResumo('');
      
      // Redirecionar para a página de detalhes do resumo
      router.push(`/resumos/${resumo.id}`);
    } catch (error) {
      console.error('Erro ao salvar resumo:', error);
      alert('Erro ao salvar resumo. Tente novamente.');
    } finally {
      setSalvandoResumo(false);
    }
  };

  const getInsightIcon = (tipo: Insight['tipo']) => {
    switch (tipo) {
      case 'POSITIVO':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'ATENCAO':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'CRITICO':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'INFORMATIVO':
        return <Info className="h-5 w-5 text-sky-500" />;
      default:
        return <Info className="h-5 w-5 text-slate-500" />;
    }
  };

  const getInsightColor = (tipo: Insight['tipo']) => {
    switch (tipo) {
      case 'POSITIVO':
        return 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20';
      case 'ATENCAO':
        return 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20';
      case 'CRITICO':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'INFORMATIVO':
        return 'border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-900/20';
      default:
        return 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/20';
    }
  };

  const getSeveridadeColor = (severidade: PadraoAnomalo['severidade']) => {
    switch (severidade) {
      case 'BAIXA':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-200';
      case 'MEDIA':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200';
      case 'ALTA':
        return 'bg-red-100 text-red-700 dark:bg-red-400/20 dark:text-red-200';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-400/20 dark:text-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-500/20">
            <BrainCircuit className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              Análises Inteligentes
            </h1>
            <p className="text-sm text-slate-500">
              Análises automáticas dos dados com insights e recomendações usando Groq AI
            </p>
          </div>
        </div>
      </header>

      {/* Filtros */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-slate-100">Configurar Análise</h2>
        
        <div className="space-y-6">
          {/* 1. Tipo de Análise */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              1. Tipo de Análise
            </label>
            <select
              value={tipoAnalise}
              onChange={(e) => setTipoAnalise(e.target.value as TipoAnalise)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value={TipoAnalise.GERAL}>Análise Geral</option>
              <option value={TipoAnalise.UPLOAD}>Análise de Upload</option>
              <option value={TipoAnalise.ALERTAS}>Análise de Alertas</option>
              <option value={TipoAnalise.RELATORIO}>Análise de Relatório</option>
              <option value={TipoAnalise.COMPARATIVO}>Análise Comparativa</option>
            </select>
          </div>

          {/* 2. Empresa (quando aplicável) */}
          {(tipoAnalise === TipoAnalise.RELATORIO || tipoAnalise === TipoAnalise.ALERTAS || tipoAnalise === TipoAnalise.COMPARATIVO) && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                2. Empresa
              </label>
              <select
                value={empresaId}
                onChange={(e) => setEmpresaId(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">Todas as empresas (Consolidado)</option>
                {empresas?.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nomeFantasia || empresa.razaoSocial}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 2. Filtros para Seleção de Upload */}
          {tipoAnalise === TipoAnalise.UPLOAD && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    2. Empresa
                  </label>
                  <select
                    value={empresaFiltro}
                    onChange={(e) => {
                      setEmpresaFiltro(e.target.value);
                      setUploadId(''); // Limpar seleção ao mudar filtro
                    }}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Todas as empresas</option>
                    {empresas?.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.nomeFantasia || empresa.razaoSocial}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    3. Ano
                  </label>
                  <select
                    value={anoFiltro}
                    onChange={(e) => {
                      setAnoFiltro(e.target.value);
                      setMesFiltro(''); // Limpar mês ao mudar ano
                      setUploadId(''); // Limpar seleção
                    }}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Todos os anos</option>
                    {anosDisponiveis.map((ano) => (
                      <option key={ano} value={ano.toString()}>
                        {ano}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    4. Mês
                  </label>
                  <select
                    value={mesFiltro}
                    onChange={(e) => {
                      setMesFiltro(e.target.value);
                      setUploadId(''); // Limpar seleção
                    }}
                    disabled={!anoFiltro}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-50"
                  >
                    <option value="">Todos os meses</option>
                    {anoFiltro && mesesDisponiveisFiltro.map((mes) => {
                      const mesInfo = meses.find((m) => m.value === mes);
                      return (
                        <option key={mes} value={mes.toString()}>
                          {mesInfo ? mesInfo.label : mes}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Lista de Uploads Filtrados */}
              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  5. Selecione o Upload
                </label>
                {carregandoUploads ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    <span className="ml-2 text-sm text-slate-500">Carregando uploads...</span>
                  </div>
                ) : uploadsFiltrados.length === 0 ? (
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50">
                    {empresaFiltro || anoFiltro || mesFiltro
                      ? 'Nenhum upload encontrado com os filtros selecionados'
                      : 'Selecione filtros para ver os uploads disponíveis'}
                  </div>
                ) : (
                  <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800">
                    {uploadsFiltrados.map((upload) => {
                      const mesNome = meses.find((m) => m.value === upload.mes)?.label || `Mês ${upload.mes}`;
                      const alertasCount = upload.alertas?.length || 0;
                      const statusColor =
                        upload.status === 'CONCLUIDO'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200'
                          : upload.status === 'COM_ALERTAS'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-400/20 dark:text-slate-200';

                      return (
                        <button
                          key={upload.id}
                          type="button"
                          onClick={() => setUploadId(upload.id)}
                          className={`w-full rounded-md border p-3 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                            uploadId === upload.id
                              ? 'border-sky-500 bg-sky-50 dark:border-sky-400 dark:bg-sky-900/20'
                              : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                {upload.empresa?.nomeFantasia || upload.empresa?.razaoSocial}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {mesNome}/{upload.ano} • {upload.nomeArquivo}
                              </div>
                            </div>
                            <div className="ml-4 flex items-center gap-2">
                              {alertasCount > 0 && (
                                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-400/20 dark:text-amber-200">
                                  {alertasCount} alerta{alertasCount > 1 ? 's' : ''}
                                </span>
                              )}
                              <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColor}`}>
                                {upload.status}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* 3. Períodos (Análise Comparativa) */}
          {tipoAnalise === TipoAnalise.COMPARATIVO && (
            <>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  3. Período 1 (Primeiro Período)
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">
                      Ano
                    </label>
                    <select
                      value={ano1}
                      onChange={(e) => {
                        setAno1(e.target.value);
                        setMes1(''); // Limpar mês quando mudar ano
                      }}
                      disabled={carregandoDados}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-50"
                    >
                      <option value="">Selecione o ano</option>
                      {anosDisponiveis.map((ano) => (
                        <option key={ano} value={ano.toString()}>
                          {ano}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">
                      Mês
                    </label>
                    <select
                      value={mes1}
                      onChange={(e) => setMes1(e.target.value)}
                      disabled={!ano1 || mesesDisponiveisAno1.length === 0}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-50"
                    >
                      <option value="">Selecione o mês</option>
                      {mesesDisponiveisAno1.map((mes) => {
                        const mesInfo = meses.find((m) => m.value === mes);
                        return (
                          <option key={mes} value={mes.toString()}>
                            {mesInfo ? mesInfo.label : mes}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  4. Período 2 (Segundo Período)
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">
                      Ano
                    </label>
                    <select
                      value={ano2}
                      onChange={(e) => {
                        setAno2(e.target.value);
                        setMes2(''); // Limpar mês quando mudar ano
                      }}
                      disabled={carregandoDados}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-50"
                    >
                      <option value="">Selecione o ano</option>
                      {anosDisponiveis.map((ano) => (
                        <option key={ano} value={ano.toString()}>
                          {ano}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">
                      Mês
                    </label>
                    <select
                      value={mes2}
                      onChange={(e) => setMes2(e.target.value)}
                      disabled={!ano2 || mesesDisponiveisAno2.length === 0}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-50"
                    >
                      <option value="">Selecione o mês</option>
                      {mesesDisponiveisAno2.map((mes) => {
                        const mesInfo = meses.find((m) => m.value === mes);
                        return (
                          <option key={mes} value={mes.toString()}>
                            {mesInfo ? mesInfo.label : mes}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* 5. Opções Adicionais */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    5. Tipo de Valor
                  </label>
                  <select
                    value={tipoValor}
                    onChange={(e) => setTipoValor(e.target.value as 'ACUMULADO' | 'PERIODO')}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    title={tipoValor === 'ACUMULADO' ? 'Saldo acumulado até o mês (saldoAtual)' : 'Movimentação do mês (crédito - débito)'}
                  >
                    <option value="ACUMULADO">Valor Acumulado</option>
                    <option value="PERIODO">Valor do Período</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    6. Descrição (opcional)
                  </label>
                  <input
                    type="text"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Filtrar por descrição da conta"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            </>
          )}

          {/* 3. Período (Análise de Relatório) */}
          {tipoAnalise === TipoAnalise.RELATORIO && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    3. Ano
                  </label>
                  <select
                    value={ano}
                    onChange={(e) => {
                      setAno(e.target.value);
                      setMes(''); // Limpar mês quando mudar ano
                    }}
                    disabled={carregandoDados}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-50"
                  >
                    <option value="">Selecione o ano</option>
                    {anosDisponiveis.map((anoOption) => (
                      <option key={anoOption} value={anoOption.toString()}>
                        {anoOption}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    4. Mês
                  </label>
                  <select
                    value={mes}
                    onChange={(e) => setMes(e.target.value)}
                    disabled={!ano || mesesDisponiveisRelatorio.length === 0}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-50"
                  >
                    <option value="">Selecione o mês</option>
                    {mesesDisponiveisRelatorio.map((mesOption) => {
                      const mesInfo = meses.find((m) => m.value === mesOption);
                      return (
                        <option key={mesOption} value={mesOption.toString()}>
                          {mesInfo ? mesInfo.label : mesOption}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <div className="relative">
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  5. Descrição (opcional)
                </label>
                <input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Digite para buscar descrições disponíveis"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  list="descricoes-list"
                />
                {descricoesDisponiveis.length > 0 && (
                  <datalist id="descricoes-list">
                    {descricoesDisponiveis.map((desc, index) => (
                      <option key={index} value={desc} />
                    ))}
                  </datalist>
                )}
                {descricao && descricoesDisponiveis.length === 0 && descricao.length >= 2 && (
                  <p className="mt-1 text-xs text-slate-500">Nenhuma descrição encontrada</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Botão de Executar */}
        <div className="mt-6 flex justify-end border-t border-slate-200 pt-4 dark:border-slate-700">
          <button
            onClick={handleAnalisar}
            disabled={isLoading || (tipoAnalise === TipoAnalise.COMPARATIVO && (!ano1 || !mes1 || !ano2 || !mes2))}
            className="flex items-center gap-2 rounded-md bg-purple-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-purple-500 dark:hover:bg-purple-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Executar Análise
              </>
            )}
          </button>
        </div>
      </section>

      {/* Erro */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700 dark:text-red-200 mb-1">
                Erro ao executar análise
              </p>
              <p className="text-sm text-red-600 dark:text-red-300">
                {(() => {
                  if (error instanceof Error) {
                    return error.message;
                  }
                  const errorResponse = error as { response?: { data?: { message?: string; error?: string } } };
                  if (errorResponse?.response?.data?.message) {
                    return errorResponse.response.data.message;
                  }
                  return 'Erro desconhecido. Verifique se a GROQ_API_KEY está configurada no backend.';
                })()}
              </p>
              {(() => {
                const errorResponse = error as { response?: { data?: { message?: string; error?: string; statusCode?: number } } };
                const errorMessage = error instanceof Error
                  ? error.message
                  : errorResponse?.response?.data?.message || '';
                const errorCode = errorResponse?.response?.data?.error;
                const statusCode = errorResponse?.response?.data?.statusCode;
                
                // Erro de payload muito grande
                if (statusCode === 413 || errorCode === 'PAYLOAD_TOO_LARGE' || errorMessage.includes('muito grandes') || errorMessage.includes('Request too large') || errorMessage.includes('rate_limit_exceeded') || errorMessage.includes('tokens per minute')) {
                  return (
                    <div className="mt-3 rounded-md bg-amber-100 p-3 dark:bg-amber-900/30">
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-2">
                        💡 Limite de tokens do Groq excedido:
                      </p>
                      <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
                        <li>O sistema otimizou os dados enviados, mas ainda excede o limite (6000 tokens/minuto)</li>
                        <li>Para análises comparativas: aguarde alguns segundos e tente novamente</li>
                        <li>O sistema já está enviando apenas as top 15 contas com maior variação</li>
                        <li>Se o problema persistir, tente períodos com menos dados ou aguarde o reset do limite (1 minuto)</li>
                      </ul>
                    </div>
                  );
                }
                
                // Erro de configuração do Groq
                if (errorMessage.includes('GROQ_API_KEY') || errorMessage.includes('não está configurado')) {
                  return (
                    <div className="mt-3 rounded-md bg-red-100 p-3 dark:bg-red-900/30">
                      <p className="text-xs font-medium text-red-800 dark:text-red-200 mb-2">
                        Como configurar:
                      </p>
                      <ol className="text-xs text-red-700 dark:text-red-300 space-y-1 list-decimal list-inside">
                        <li>Acesse https://console.groq.com/ e obtenha uma API key</li>
                        <li>Adicione <code className="bg-red-200 dark:bg-red-800 px-1 rounded">GROQ_API_KEY=sua_chave_aqui</code> no arquivo <code className="bg-red-200 dark:bg-red-800 px-1 rounded">.env</code> do backend</li>
                        <li>Reinicie o servidor backend</li>
                      </ol>
                    </div>
                  );
                }
                
                return null;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Resultados */}
      {analise && (
        <div className="space-y-6">
          {/* Botão Salvar como Resumo */}
          <div className="flex justify-end">
            <button
              onClick={handleAbrirModalResumo}
              className="flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"
            >
              <Save className="h-4 w-4" />
              Salvar como Resumo
            </button>
          </div>

          {/* Resumo */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Resumo da Análise</h2>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words">
                {analise.resumo}
              </p>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Análise realizada em {new Date(analise.dataAnalise).toLocaleString('pt-BR')}
            </p>
          </section>

          {/* Insights */}
          {analise.insights.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                Insights ({analise.insights.length})
              </h2>
              <div className="space-y-4">
                {analise.insights.map((insight, index) => (
                  <div
                    key={index}
                    className={`rounded-lg border p-4 ${getInsightColor(insight.tipo)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.tipo)}
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{insight.titulo}</h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{insight.descricao}</p>
                        {insight.recomendacao && (
                          <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                            Recomendação: {insight.recomendacao}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-slate-500">
                          Confiança: {insight.confianca}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Padrões Anômalos */}
          {analise.padroesAnomalos.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                Padrões Anômalos Detectados ({analise.padroesAnomalos.length})
              </h2>
              <div className="space-y-4">
                {analise.padroesAnomalos.map((padrao, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{padrao.tipo}</h3>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${getSeveridadeColor(
                              padrao.severidade,
                            )}`}
                          >
                            {padrao.severidade}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{padrao.descricao}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Sugestões de Correção */}
          {analise.sugestoesCorrecao.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                Sugestões de Correção ({analise.sugestoesCorrecao.length})
              </h2>
              <div className="space-y-4">
                {analise.sugestoesCorrecao.map((sugestao, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20"
                  >
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Problema</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{sugestao.problema}</p>
                    <h3 className="mt-3 font-semibold text-slate-900 dark:text-slate-100">Solução</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{sugestao.solucao}</p>
                    <p className="mt-2 text-xs text-slate-500">Confiança: {sugestao.confianca}%</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Modal de Criação de Resumo */}
      {showModalResumo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Salvar como Resumo
              </h3>
              <button
                onClick={() => {
                  setShowModalResumo(false);
                  setTituloResumo('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Título do Resumo
                </label>
                <input
                  type="text"
                  value={tituloResumo}
                  onChange={(e) => setTituloResumo(e.target.value)}
                  placeholder="Digite o título do resumo"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  autoFocus
                />
                <p className="mt-1 text-xs text-slate-500">
                  O título será usado para identificar o resumo na lista
                </p>
              </div>

              <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-900/50">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Informações que serão salvas:
                </p>
                <ul className="text-xs text-slate-500 dark:text-slate-500 space-y-1">
                  <li>• Tipo: {tipoAnalise}</li>
                  {ano && <li>• Período: {mes ? `${meses.find((m) => m.value === parseInt(mes, 10))?.label}/${ano}` : ano}</li>}
                  {empresaId && empresas && (
                    <li>• Empresa: {empresas.find((e) => e.id === empresaId)?.razaoSocial}</li>
                  )}
                  {analise && (
                    <>
                      <li>• {analise.insights.length} insights</li>
                      <li>• {analise.padroesAnomalos.length} padrões anômalos</li>
                      <li>• {analise.sugestoesCorrecao.length} sugestões</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 p-4 dark:border-slate-700">
              <button
                onClick={() => {
                  setShowModalResumo(false);
                  setTituloResumo('');
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarResumo}
                disabled={!tituloResumo.trim() || salvandoResumo}
                className="flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-sky-500 dark:hover:bg-sky-600"
              >
                {salvandoResumo ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalisesPage;

