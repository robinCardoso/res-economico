'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRelatorioResultado } from '@/hooks/use-relatorios';
import { useEmpresas } from '@/hooks/use-empresas';
import { relatoriosService } from '@/services/relatorios.service';
import type { ContaRelatorio } from '@/types/api';
import { TipoRelatorio } from '@/types/api';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { exportarParaExcel, exportarParaPDF } from '@/utils/export-relatorio';
import { ModeloNegocioBadge } from '@/components/configuracao/ModeloNegocioBadge';
import { MetricasModelo } from '@/components/configuracao/MetricasModelo';
import { useQuery } from '@tanstack/react-query';
import { configuracaoModeloNegocioService } from '@/services/configuracao-modelo-negocio.service';
import { construirTituloRelatorio } from '@/utils/titulo-relatorio';
import { useFiltros } from './filtros-context';

const RelatorioResultadoPage = () => {
  // Estado para controlar se os filtros estão expandidos (agora vem do contexto)
  const { filtrosExpandidos, setFiltrosExpandidos } = useFiltros();

  // Estados locais dos filtros (não aplicados ainda)
  const [anoLocal, setAnoLocal] = useState<number>(new Date().getFullYear());
  const [tipoLocal, setTipoLocal] = useState<TipoRelatorio>(TipoRelatorio.CONSOLIDADO);
  const [empresaIdLocal, setEmpresaIdLocal] = useState<string>('');
  const [empresaIdsLocal, setEmpresaIdsLocal] = useState<string[]>([]);
  const [descricaoLocal, setDescricaoLocal] = useState<string>('');
  const [mesInicialLocal, setMesInicialLocal] = useState<number | undefined>(undefined);
  const [mesFinalLocal, setMesFinalLocal] = useState<number | undefined>(undefined);

  // Estados dos filtros aplicados (usados na query)
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [tipo, setTipo] = useState<TipoRelatorio>(TipoRelatorio.CONSOLIDADO);
  const [empresaId, setEmpresaId] = useState<string>('');
  const [empresaIds, setEmpresaIds] = useState<string[]>([]);
  const [descricao, setDescricao] = useState<string>('');
  const [mesInicial, setMesInicial] = useState<number | undefined>(undefined);
  const [mesFinal, setMesFinal] = useState<number | undefined>(undefined);

  // Constantes de meses
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

  // Estados para autocomplete de descrição
  interface DescricaoSugerida {
    nomeConta: string;
    classificacao: string;
    conta?: string;
    subConta?: string;
  }
  const [descricoesSugeridas, setDescricoesSugeridas] = useState<DescricaoSugerida[]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState<boolean>(false);
  const [carregandoDescricoes, setCarregandoDescricoes] = useState<boolean>(false);

  const { data: empresas } = useEmpresas();
  const empresasList = useMemo(() => empresas || [], [empresas]);

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
  }, []);

  const params = useMemo(
    () => ({
      ano,
      tipo,
      empresaId: tipo === 'FILIAL' ? empresaId : undefined,
      empresaIds: tipo === TipoRelatorio.CONSOLIDADO && empresaIds.length > 0 ? empresaIds : undefined,
      descricao: descricao && descricao.trim().length > 0 ? descricao : undefined,
      mesInicial: mesInicial && mesInicial >= 1 && mesInicial <= 12 ? mesInicial : undefined,
      mesFinal: mesFinal && mesFinal >= 1 && mesFinal <= 12 ? mesFinal : undefined,
    }),
    [ano, tipo, empresaId, empresaIds, descricao, mesInicial, mesFinal],
  );

  // Buscar descrições para autocomplete
  useEffect(() => {
    const buscarDescricoes = async () => {
      if (descricaoLocal.trim().length < 2) {
        setDescricoesSugeridas([]);
        setMostrarSugestoes(false);
        return;
      }

      setCarregandoDescricoes(true);
      try {
        const descricoes = await relatoriosService.getDescricoesDisponiveis(descricaoLocal);
        setDescricoesSugeridas(descricoes);
        setMostrarSugestoes(descricoes.length > 0);
      } catch (error) {
        console.error('Erro ao buscar descrições:', error);
        setDescricoesSugeridas([]);
        setMostrarSugestoes(false);
      } finally {
        setCarregandoDescricoes(false);
      }
    };

    const timeoutId = setTimeout(buscarDescricoes, 300); // Debounce de 300ms
    return () => clearTimeout(timeoutId);
  }, [descricaoLocal]);

  const aplicarFiltros = () => {
    setAno(anoLocal);
    setTipo(tipoLocal);
    setEmpresaId(empresaIdLocal);
    setEmpresaIds(empresaIdsLocal);
    setDescricao(descricaoLocal);
    setMesInicial(mesInicialLocal);
    setMesFinal(mesFinalLocal);
    // Recolher os filtros após aplicar
    setFiltrosExpandidos(false);
    setMostrarSugestoes(false);
  };

  const limparFiltros = () => {
    // Usar o primeiro ano disponível ou o ano atual
    const anoParaUsar = anosDisponiveis.length > 0 ? anosDisponiveis[0] : new Date().getFullYear();
    
    setAnoLocal(anoParaUsar);
    setTipoLocal(TipoRelatorio.CONSOLIDADO);
    setEmpresaIdLocal('');
    setEmpresaIdsLocal([]);
    setDescricaoLocal('');
    setMesInicialLocal(undefined);
    setMesFinalLocal(undefined);
    setAno(anoParaUsar);
    setTipo(TipoRelatorio.CONSOLIDADO);
    setEmpresaId('');
    setEmpresaIds([]);
    setDescricao('');
    setMesInicial(undefined);
    setMesFinal(undefined);
    setMostrarSugestoes(false);
    // Recolher os filtros após limpar
    setFiltrosExpandidos(false);
  };

  const { data: relatorio, isLoading, error } = useRelatorioResultado(params);

  // Calcular título dinâmico usando useMemo para otimização
  const tituloRelatorio = useMemo(() => {
    return construirTituloRelatorio(
      tipo,
      empresaIds,
      empresasList,
      relatorio || null,
      ano
    );
  }, [tipo, empresaIds, empresasList, relatorio, ano]);

  // Buscar empresa selecionada e sua configuração
  const empresaSelecionada = useMemo(() => {
    if (tipo === TipoRelatorio.FILIAL && empresaId) {
      return empresasList.find((e) => e.id === empresaId);
    }
    return null;
  }, [tipo, empresaId, empresasList]);

  // Buscar configuração global se empresa tiver modelo definido
  const { data: configuracaoGlobal } = useQuery({
    queryKey: ['configuracao-modelo-negocio', empresaSelecionada?.modeloNegocio],
    queryFn: () => {
      if (!empresaSelecionada?.modeloNegocio) return null;
      return configuracaoModeloNegocioService.getByModelo(empresaSelecionada.modeloNegocio);
    },
    enabled: !!empresaSelecionada?.modeloNegocio,
  });

  // Obter contas configuradas (empresa ou global)
  const contasConfiguradas = useMemo(() => {
    const contas: Record<string, { tipo: string; conta: string }> = {};
    
    // Contas de receita
    const contasReceita = empresaSelecionada?.contasReceita || configuracaoGlobal?.contasReceita;
    if (contasReceita) {
      Object.entries(contasReceita).forEach(([tipo, conta]) => {
        contas[conta] = { tipo: `receita-${tipo}`, conta };
      });
    }
    
    // Contas de custos
    const contasCustos = empresaSelecionada?.contasCustos || configuracaoGlobal?.contasCustos;
    if (contasCustos) {
      Object.entries(contasCustos).forEach(([tipo, conta]) => {
        contas[conta] = { tipo: `custo-${tipo}`, conta };
      });
    }
    
    return contas;
  }, [empresaSelecionada, configuracaoGlobal]);

  // Verificar se uma conta está configurada
  const isContaConfigurada = useCallback((conta: ContaRelatorio): { tipo: string; conta: string } | null => {
    const contaCompleta = conta.subConta && conta.subConta.trim() !== ''
      ? `${conta.classificacao}.${conta.conta}.${conta.subConta}`
      : `${conta.classificacao}.${conta.conta}`;
    
    // Verificar correspondência exata ou prefixo
    for (const [contaConfig, info] of Object.entries(contasConfiguradas)) {
      if (contaCompleta === contaConfig || contaCompleta.startsWith(contaConfig + '.')) {
        return info;
      }
    }
    return null;
  }, [contasConfiguradas]);

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
  const [expandirTodosNiveis, setExpandirTodosNiveis] = useState<boolean>(false);
  const [exibirSubContas, setExibirSubContas] = useState<boolean>(true);

  // Função para coletar todas as classificações de contas que têm filhos
  const coletarTodasClassificacoes = useCallback(
    (contas: ContaRelatorio[] | undefined, resultado: Set<string> = new Set()): Set<string> => {
      if (!contas || contas.length === 0) return resultado;

      for (const conta of contas) {
        if (conta.filhos && conta.filhos.length > 0) {
          resultado.add(conta.classificacao);
          coletarTodasClassificacoes(conta.filhos, resultado);
        }
      }
      return resultado;
    },
    []
  );

  // Função para calcular a largura máxima necessária para a coluna CLASSI
  const calcularLarguraClassi = useCallback(
    (contas: ContaRelatorio[] | undefined, nivel = 0, maxLargura = 0): number => {
      if (!contas || contas.length === 0) return maxLargura;

      for (const conta of contas) {
        const indentacao = nivel * 16; // Mesma indentação usada na renderização
        const temFilhos = conta.filhos && conta.filhos.length > 0;
        const estaExpandida = expandirTodosNiveis 
          ? (temFilhos || nivel === 0)
          : (contasExpandidas.has(conta.classificacao) || nivel === 0);

        // Calcular largura necessária para esta linha
        // Botão expandir/colapsar: 16px (ou espaço vazio: 16px)
        const larguraBotao = 16;
        // Indentação
        const larguraIndentacao = indentacao;
        // Texto da classificação (estimativa: ~7px por caractere em fonte monospace 10px)
        const larguraTexto = conta.classificacao.length * 7;
        // Padding: 8px de cada lado = 16px
        const larguraPadding = 16;
        // Borda: 1px
        const larguraBorda = 1;
        // Gap entre elementos: 4px
        const larguraGap = 4;

        const larguraTotal = larguraBotao + larguraIndentacao + larguraTexto + larguraPadding + larguraBorda + larguraGap;
        maxLargura = Math.max(maxLargura, larguraTotal);

        // Se estiver expandida, verificar filhos também
        if (estaExpandida && conta.filhos && conta.filhos.length > 0) {
          maxLargura = calcularLarguraClassi(conta.filhos, nivel + 1, maxLargura);
        }
      }

      return maxLargura;
    },
    [expandirTodosNiveis, contasExpandidas]
  );

  // Calcular largura dinâmica da coluna CLASSI
  const larguraClassi = useMemo(() => {
    if (!relatorio?.contas) return 120; // Largura padrão
    const larguraCalculada = calcularLarguraClassi(relatorio.contas);
    // Adicionar margem de segurança (20px) e garantir mínimo de 100px
    return Math.max(100, larguraCalculada + 20);
  }, [relatorio?.contas, calcularLarguraClassi]);

  // Efeito para expandir/colapsar todos os níveis quando o checkbox mudar
  useEffect(() => {
    if (relatorio?.contas) {
      if (expandirTodosNiveis) {
        // Expandir todas as contas que têm filhos
        const todasClassificacoes = coletarTodasClassificacoes(relatorio.contas);
        setContasExpandidas(todasClassificacoes);
      } else {
        // Colapsar todas (exceto raiz que já está expandida por padrão)
        setContasExpandidas(new Set());
      }
    }
  }, [expandirTodosNiveis, relatorio?.contas, coletarTodasClassificacoes]);

  // Função para encontrar conta filtrada no relatório
  const contaFiltrada = useMemo(() => {
    if (!descricao || !relatorio?.contas) return null;
    
    const encontrarConta = (contas: ContaRelatorio[]): ContaRelatorio | null => {
      for (const conta of contas) {
        // Busca case-insensitive e parcial
        if (conta.nomeConta.toLowerCase().includes(descricao.toLowerCase())) {
          return conta;
        }
        // Buscar recursivamente nos filhos
        if (conta.filhos && conta.filhos.length > 0) {
          const encontrada = encontrarConta(conta.filhos);
          if (encontrada) return encontrada;
        }
      }
      return null;
    };
    
    return encontrarConta(relatorio.contas);
  }, [descricao, relatorio?.contas]);

  // Função para extrair todos os níveis hierárquicos de uma classificação
  // Exemplo: "3.09.03.05" -> ["3", "3.09", "3.09.03", "3.09.03.05"]
  const extrairNiveisHierarquicos = useCallback((classificacao: string): string[] => {
    const partes = classificacao.split('.').filter(p => p.length > 0);
    const niveis: string[] = [];
    
    for (let i = 0; i < partes.length; i++) {
      const nivel = partes.slice(0, i + 1).join('.');
      niveis.push(nivel);
    }
    
    return niveis;
  }, []);

  // Auto-expandir quando conta filtrada for encontrada
  // Garante que todos os níveis hierárquicos até a conta filtrada sejam expandidos
  // e que a própria conta seja expandida para mostrar seus filhos
  useEffect(() => {
    if (!contaFiltrada || !relatorio?.contas) {
      return;
    }
    
    // Extrair todos os níveis hierárquicos da classificação
    // Exemplo: "3.09.03.05" -> ["3", "3.09", "3.09.03", "3.09.03.05"]
    const niveisHierarquicos = extrairNiveisHierarquicos(contaFiltrada.classificacao);
    
    // Expandir TODOS os níveis, incluindo a própria conta filtrada
    // Isso garante que todos os filhos da conta filtrada sejam exibidos
    // Exemplo: se filtramos "3.09", precisamos expandir ["3", "3.09"]
    // para mostrar todos os filhos de "3.09" (como "3.09.03", "3.09.01", etc.)
    const niveisParaExpandir = niveisHierarquicos;
    
    if (niveisParaExpandir.length > 0) {
      // Sempre adicionar as classificações ao Set, mesmo se "Expandir Todos" estiver ativo
      // Isso garante que a conta filtrada seja explicitamente expandida
      setContasExpandidas((prev) => {
        const novo = new Set(prev);
        niveisParaExpandir.forEach((classificacao) => {
          novo.add(classificacao);
        });
        return novo;
      });
    }
  }, [contaFiltrada, relatorio?.contas, extrairNiveisHierarquicos]);

  const toggleExpandir = (classificacao: string) => {
    // Se "Expandir Todos" estiver marcado, desmarcar primeiro
    if (expandirTodosNiveis) {
      setExpandirTodosNiveis(false);
    }
    
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
      // Se não exibir subContas e esta conta tem subConta, ocultar
      const temSubConta = conta.subConta && conta.subConta.trim() !== '';
      if (!exibirSubContas && temSubConta) {
        return [];
      }

      const indentacao = nivel * 16; // Reduzido de 24px para 16px
      const isRaiz = nivel === 0;
      const temFilhos = conta.filhos && conta.filhos.length > 0;
      // Se "Expandir Todos" estiver marcado, todas as contas com filhos ficam expandidas
      // Caso contrário, verifica se está no Set de expandidas ou se é raiz
      const estaExpandida = expandirTodosNiveis 
        ? (temFilhos || nivel === 0) // Se expandir todos, todas com filhos ficam expandidas
        : (contasExpandidas.has(conta.classificacao) || nivel === 0); // Raiz sempre expandida

      // Criar chave única incluindo conta e subConta (se disponíveis)
      const contaNum = conta.conta || '';
      const subConta = conta.subConta || '';
      const chaveUnica = `${conta.classificacao}|${contaNum}|${subConta}`;
      
      // Filtrar filhos se não exibir subContas
      const filhosParaRenderizar = exibirSubContas 
        ? conta.filhos 
        : conta.filhos?.filter(filho => !filho.subConta || filho.subConta.trim() === '');
      
      // Verificar se conta está configurada
      const contaConfigInfo = isContaConfigurada(conta);
      const isContaConfig = !!contaConfigInfo;
      
      // Ícones para tipos de conta configurada
      const getIconeConta = (tipo: string) => {
        if (tipo.includes('receita-mensalidades')) return '💰';
        if (tipo.includes('receita-bonificacoes')) return '🎁';
        if (tipo.includes('custo-funcionarios')) return '👥';
        if (tipo.includes('custo-sistema')) return '💻';
        if (tipo.includes('custo-contabilidade')) return '📊';
        return '⭐';
      };
      
      return (
        <React.Fragment key={chaveUnica}>
          <tr
            className={`border-b border-border hover:bg-muted/50 ${
              isRaiz ? 'bg-muted/30' : ''
            } ${
              isContaConfig ? 'bg-purple-50/50 dark:bg-purple-900/20 border-l-2 border-l-purple-400 dark:border-l-purple-600' : ''
            }`}
          >
            <td 
              className="sticky left-0 z-[51] bg-card !bg-card border-r border-border px-2 py-1.5 text-[10px] font-medium text-foreground shadow-[2px_0_4px_rgba(0,0,0,0.05)] box-border border-b border-border"
              style={{ minWidth: `${larguraClassi}px`, width: `${larguraClassi}px` }}
            >
              <div className="flex items-center gap-1" style={{ paddingLeft: `${indentacao}px` }}>
                {temFilhos && (
                  <button
                    onClick={() => toggleExpandir(conta.classificacao)}
                    className="flex h-4 w-4 items-center justify-center rounded hover:bg-muted flex-shrink-0"
                    title={estaExpandida ? 'Recolher' : 'Expandir'}
                  >
                    <span className="text-[10px]">{estaExpandida ? '−' : '+'}</span>
                  </button>
                )}
                {!temFilhos && <span className="w-4 flex-shrink-0" />}
                <span className="whitespace-nowrap font-mono">{conta.classificacao}</span>
              </div>
            </td>
            <td 
              className={`sticky z-[51] bg-card !bg-card border-r border-border px-2 py-1.5 text-[10px] text-muted-foreground min-w-[200px] shadow-[2px_0_4px_rgba(0,0,0,0.05)] box-border border-b border-border ${
                isContaConfig ? '!bg-purple-50/50 dark:!bg-purple-900/20' : ''
              }`}
              style={{ left: `${larguraClassi}px` }}
            >
              <div style={{ paddingLeft: `${indentacao}px` }} className="truncate flex items-center gap-1" title={conta.nomeConta}>
                {isContaConfig && (
                  <span className="flex-shrink-0 text-xs" title={contaConfigInfo?.tipo}>
                    {getIconeConta(contaConfigInfo.tipo)}
                  </span>
                )}
                <span className="truncate">{conta.nomeConta}</span>
              </div>
            </td>
            {relatorio?.periodo.map((periodo) => {
              const valor = conta.valores?.[periodo.mes] || 0;
              return (
                <td
                  key={periodo.mes}
                  className={`px-2 py-1.5 text-right text-[10px] font-mono whitespace-nowrap min-w-[90px] border-b border-border ${getValorClassName(valor)}`}
                  title={formatarValor(valor)}
                >
                  {formatarValor(valor)}
                </td>
              );
            })}
            <td className={`sticky right-0 z-[40] bg-card border-l border-border border-b border-border px-2 py-1.5 text-right text-[10px] font-mono font-semibold whitespace-nowrap min-w-[90px] shadow-[-2px_0_4px_rgba(0,0,0,0.05)] ${getValorClassName(conta.valores?.total || 0)}`}>
              {formatarValor(conta.valores?.total || 0)}
            </td>
          </tr>
          {temFilhos && estaExpandida && renderizarContas(filhosParaRenderizar, nivel + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Filtros compactos */}
      <div className="flex-shrink-0 border-b border-border bg-card">
        {filtrosExpandidos ? (
          <div className="px-3 py-2">
            <div className="flex flex-wrap items-start gap-2.5">
              {/* Ano */}
              <div className="min-w-[100px]">
                <label htmlFor="ano" className="mb-0.5 block text-[10px] font-medium text-foreground">
                  Ano
                </label>
                <select
                  id="ano"
                  value={anoLocal || ''}
                  onChange={(e) => setAnoLocal(parseInt(e.target.value) || new Date().getFullYear())}
                  disabled={carregandoAnos}
                  className="h-7 w-full rounded border border-border bg-input px-2 text-[10px] text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-50"
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
                <label htmlFor="tipo" className="mb-0.5 block text-[10px] font-medium text-foreground">
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
                  className="h-7 w-full rounded border border-border bg-input px-2 text-[10px] text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                >
                  <option value={TipoRelatorio.CONSOLIDADO}>Consolidado</option>
                  <option value={TipoRelatorio.FILIAL}>Filial</option>
                </select>
              </div>

              {/* Empresa (FILIAL) */}
              {tipoLocal === 'FILIAL' && (
                <div className="min-w-[250px]">
                  <label
                    htmlFor="empresa-filial"
                    className="mb-0.5 block text-[10px] font-medium text-foreground"
                  >
                    Empresa
                  </label>
                  <select
                    id="empresa-filial"
                    value={empresaIdLocal}
                    onChange={(e) => setEmpresaIdLocal(e.target.value)}
                    className="h-7 w-full rounded border border-border bg-input px-2 text-[10px] text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
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
              {tipoLocal === TipoRelatorio.CONSOLIDADO && (
                <div className="min-w-[250px]">
                  <label
                    htmlFor="empresas-consolidado"
                    className="mb-0.5 block text-[10px] font-medium text-foreground"
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
                    className="h-12 w-full rounded border border-border bg-input px-2 text-[10px] text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
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

              {/* Filtro por Descrição */}
              <div className="min-w-[250px] relative z-[10000]">
                <label
                  htmlFor="descricao"
                  className="mb-0.5 block text-[10px] font-medium text-foreground"
                >
                  Descrição (opcional)
                </label>
                <div className="relative z-[10000]">
                  <input
                    id="descricao"
                    type="text"
                    value={descricaoLocal}
                    onChange={(e) => {
                      setDescricaoLocal(e.target.value);
                      setMostrarSugestoes(true);
                    }}
                    onFocus={() => {
                      if (descricoesSugeridas.length > 0) {
                        setMostrarSugestoes(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay para permitir clique nas sugestões
                      setTimeout(() => setMostrarSugestoes(false), 200);
                    }}
                    placeholder="Ex: Venda de Mercadorias"
                    className="h-7 w-full rounded border border-border bg-input px-2 text-[10px] text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                  {carregandoDescricoes && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                    </div>
                  )}
                  {/* Dropdown de sugestões */}
                  {mostrarSugestoes && descricoesSugeridas.length > 0 && (
                    <div className="absolute z-[9999] mt-1 max-h-48 w-full overflow-auto rounded-md border border-border bg-card shadow-lg">
                      {descricoesSugeridas.map((desc, index) => {
                        // Construir classificação completa
                        const classificacaoCompleta = desc.subConta 
                          ? `${desc.classificacao}.${desc.conta}.${desc.subConta}`
                          : desc.conta 
                          ? `${desc.classificacao}.${desc.conta}`
                          : desc.classificacao;
                        
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setDescricaoLocal(desc.nomeConta);
                              setMostrarSugestoes(false);
                            }}
                            className="w-full px-3 py-1.5 text-left text-[10px] text-foreground hover:bg-muted"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium truncate">{desc.nomeConta}</span>
                              <span className="text-[9px] text-muted-foreground font-mono flex-shrink-0">
                                {classificacaoCompleta}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {descricaoLocal && (
                  <p className="mt-0.5 text-[9px] text-slate-500">
                    {descricoesSugeridas.length > 0
                      ? `${descricoesSugeridas.length} sugestão(ões) encontrada(s)`
                      : 'Digite pelo menos 2 caracteres'}
                  </p>
                )}
              </div>

              {/* Filtro de Mês Inicial */}
              <div className="min-w-[150px]">
                <label
                  htmlFor="mes-inicial"
                  className="mb-0.5 block text-[10px] font-medium text-foreground"
                >
                  Mês Inicial (opcional)
                </label>
                <select
                  id="mes-inicial"
                  value={mesInicialLocal || ''}
                  onChange={(e) => {
                    const valor = e.target.value ? parseInt(e.target.value, 10) : undefined;
                    setMesInicialLocal(valor);
                    // Se mesFinal estiver definido e for menor que mesInicial, resetar mesFinal
                    if (valor && mesFinalLocal && valor > mesFinalLocal) {
                      setMesFinalLocal(undefined);
                    }
                  }}
                  className="h-7 w-full rounded border border-border bg-input px-2 text-[10px] text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                >
                  <option value="">Todos</option>
                  {meses.map((mes) => (
                    <option key={mes.value} value={mes.value}>
                      {mes.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro de Mês Final */}
              <div className="min-w-[150px]">
                <label
                  htmlFor="mes-final"
                  className="mb-0.5 block text-[10px] font-medium text-foreground"
                >
                  Mês Final (opcional)
                </label>
                <select
                  id="mes-final"
                  value={mesFinalLocal || ''}
                  onChange={(e) => {
                    const valor = e.target.value ? parseInt(e.target.value, 10) : undefined;
                    setMesFinalLocal(valor);
                    // Se mesInicial estiver definido e for maior que mesFinal, resetar mesInicial
                    if (valor && mesInicialLocal && valor < mesInicialLocal) {
                      setMesInicialLocal(undefined);
                    }
                  }}
                  disabled={!mesInicialLocal} // Desabilitar se não houver mês inicial
                  className="h-7 w-full rounded border border-border bg-input px-2 text-[10px] text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Todos</option>
                  {meses
                    .filter((mes) => !mesInicialLocal || mes.value >= mesInicialLocal)
                    .map((mes) => (
                      <option key={mes.value} value={mes.value}>
                        {mes.label}
                      </option>
                    ))}
                </select>
                {mesInicialLocal && (
                  <p className="mt-0.5 text-[9px] text-slate-500">
                    {mesInicialLocal === mesFinalLocal
                      ? 'Mesmo mês selecionado'
                      : mesFinalLocal
                      ? `${meses.find(m => m.value === mesInicialLocal)?.label} a ${meses.find(m => m.value === mesFinalLocal)?.label}`
                      : `A partir de ${meses.find(m => m.value === mesInicialLocal)?.label}`}
                  </p>
                )}
              </div>

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
                  className="inline-flex h-7 items-center gap-1.5 rounded border border-border bg-card px-3 text-[10px] font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                >
                  Limpar Filtros
                </button>
              </div>

              {/* Botões de Exportação */}
              {relatorio && (
                <div className="flex items-start gap-1.5 pt-[18px]">
                  <button
                    onClick={() => exportarParaExcel(relatorio, tipo, empresaIds, empresasList)}
                    className="inline-flex h-7 items-center gap-1 rounded border border-border bg-card px-2 text-[10px] font-medium text-muted-foreground hover:bg-muted"
                  >
                    <FileSpreadsheet className="h-3 w-3" />
                    Excel
                  </button>
                  <button
                    onClick={() => {
                      exportarParaPDF(relatorio, tipo, empresaIds, empresasList).catch((error) => {
                        console.error('Erro ao exportar PDF:', error);
                        alert('Erro ao exportar PDF. Tente novamente.');
                      });
                    }}
                    className="inline-flex h-7 items-center gap-1 rounded border border-border bg-card px-2 text-[10px] font-medium text-muted-foreground hover:bg-muted"
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
                Selecione uma empresa e clique em &quot;Filtrar&quot; para gerar o relatório por filial.
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center px-3 py-1.5">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
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
              {tipo === TipoRelatorio.CONSOLIDADO && empresaIds.length > 0 && (
                <>
                  <span>•</span>
                  <span>{empresaIds.length} empresa(s) selecionada(s)</span>
                </>
              )}
              {(mesInicial || mesFinal) && (
                <>
                  <span>•</span>
                  <span>
                    Período:{' '}
                    {mesInicial && mesFinal
                      ? `${meses.find(m => m.value === mesInicial)?.label} a ${meses.find(m => m.value === mesFinal)?.label}`
                      : mesInicial
                      ? `A partir de ${meses.find(m => m.value === mesInicial)?.label}`
                      : `Até ${meses.find(m => m.value === mesFinal)?.label}`}
                  </span>
                </>
              )}
            </div>
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
            <div className="sticky top-0 z-[105] border-b border-border bg-card px-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-foreground">
                    {tituloRelatorio}
                  </h2>
                  {empresaSelecionada?.modeloNegocio && (
                    <ModeloNegocioBadge modelo={empresaSelecionada.modeloNegocio} />
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={expandirTodosNiveis}
                      onChange={(e) => setExpandirTodosNiveis(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                    />
                    <span className="text-[10px] font-medium text-foreground">
                      Expandir Níveis
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exibirSubContas}
                      onChange={(e) => setExibirSubContas(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                    />
                    <span className="text-[10px] font-medium text-foreground">
                      Exibir SubContas
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Seção de Métricas do Modelo (se empresa selecionada) */}
            {empresaSelecionada && relatorio.contas && (
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <MetricasModelo
                  empresa={empresaSelecionada}
                  relatorioContas={relatorio.contas.flatMap((conta) => {
                    const coletarLinhas = (c: ContaRelatorio): Array<{
                      classificacao: string;
                      conta: string;
                      subConta?: string | null;
                      saldoAtual: number;
                    }> => {
                      const linhas: Array<{
                        classificacao: string;
                        conta: string;
                        subConta?: string | null;
                        saldoAtual: number;
                      }> = [];
                      
                      if (c.conta) {
                        linhas.push({
                          classificacao: c.classificacao,
                          conta: c.conta,
                          subConta: c.subConta || null,
                          saldoAtual: c.valores?.total || 0,
                        });
                      }
                      
                      if (c.filhos) {
                        c.filhos.forEach((filho) => {
                          linhas.push(...coletarLinhas(filho));
                        });
                      }
                      
                      return linhas;
                    };
                    return coletarLinhas(conta);
                  })}
                />
              </div>
            )}

            {/* Tabela com scroll horizontal e vertical */}
            <div className="h-[calc(100%-60px)] overflow-auto overscroll-contain">
              <table className="min-w-full border-collapse divide-y divide-border text-[10px]">
                <thead className="sticky top-0 z-[100] bg-muted/95 backdrop-blur-sm shadow-sm">
                  <tr>
                    <th 
                      className="sticky left-0 z-[102] bg-muted/95 !bg-muted/95 border-r border-border px-2 py-1.5 text-left text-[10px] font-medium text-muted-foreground shadow-[2px_0_4px_rgba(0,0,0,0.05)] box-border"
                      style={{ minWidth: `${larguraClassi}px`, width: `${larguraClassi}px` }}
                    >
                      CLASSI
                    </th>
                    <th 
                      className="sticky z-[101] bg-muted/95 !bg-muted/95 border-r border-border px-2 py-1.5 text-left text-[10px] font-medium text-muted-foreground min-w-[200px] shadow-[2px_0_4px_rgba(0,0,0,0.05)] box-border"
                      style={{ left: `${larguraClassi}px` }}
                    >
                      DESCRI
                    </th>
                    {relatorio.periodo.map((periodo) => (
                      <th
                        key={periodo.mes}
                        className="px-2 py-1.5 text-right text-[10px] font-medium text-muted-foreground whitespace-nowrap min-w-[90px]"
                      >
                        {periodo.nome}
                      </th>
                    ))}
                    <th className="sticky right-0 z-[100] bg-muted/95 border-l border-border px-2 py-1.5 text-right text-[10px] font-medium text-muted-foreground whitespace-nowrap min-w-[90px] shadow-[-2px_0_4px_rgba(0,0,0,0.05)]">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {renderizarContas(relatorio.contas)}
                </tbody>
              </table>

              {relatorio.contas.length === 0 && (
                <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
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
