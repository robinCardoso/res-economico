import { Injectable, Logger } from '@nestjs/common';
import { ClienteMetricasFinanceirasService } from './cliente-metricas-financeiras.service';
import { ClienteComportamentoCompraService } from './cliente-comportamento-compra.service';
import { ClienteSegmentacaoService } from './cliente-segmentacao.service';
import { ClienteAlertasRecomendacoesService } from './cliente-alertas-recomendacoes.service';
import {
  FiltrosPerfilClienteDto,
  RelatorioPerfilCliente,
  VisaoGeralClientes,
  AlertaCliente,
  MetricasFinanceirasCliente,
  ComportamentoCompraCliente,
  SegmentacaoCliente,
  SegmentoCliente,
} from './dto/cliente-perfil-analytics.dto';

/**
 * Service principal para análise completa de perfil de cliente
 * Orquestra todos os outros services para gerar relatórios consolidados
 */
@Injectable()
export class ClientePerfilAnalyticsService {
  private readonly logger = new Logger(ClientePerfilAnalyticsService.name);

  constructor(
    private metricasService: ClienteMetricasFinanceirasService,
    private comportamentoService: ClienteComportamentoCompraService,
    private segmentacaoService: ClienteSegmentacaoService,
    private alertasService: ClienteAlertasRecomendacoesService,
  ) {}

  /**
   * Gera relatório completo de perfil para um cliente específico
   */
  async gerarRelatorioCliente(
    nomeFantasia: string,
    filtros: FiltrosPerfilClienteDto = {},
  ): Promise<RelatorioPerfilCliente> {
    this.logger.log(`Gerando relatório completo para cliente: ${nomeFantasia}`);

    // Validação de entrada
    if (!nomeFantasia) {
      throw new Error('Nome fantasia é obrigatório para gerar relatório de cliente');
    }

    // Aplicar filtro de cliente
    const filtrosCliente: FiltrosPerfilClienteDto = {
      ...filtros,
      nomeFantasia: [nomeFantasia],
    };

    try {
      // Buscar todas as análises com tratamento de erros individual
      const [metricasArray, comportamentoArray, segmentacaoArray] = await Promise.all([
        this.metricasService.calcularMetricasFinanceiras(filtrosCliente).catch(error => {
          this.logger.error(`Erro ao calcular métricas financeiras: ${error.message}`);
          return [];
        }),
        this.comportamentoService.analisarComportamentoCompra(filtrosCliente).catch(error => {
          this.logger.error(`Erro ao analisar comportamento de compra: ${error.message}`);
          return [];
        }),
        this.segmentacaoService.segmentarClientes(filtrosCliente).catch(error => {
          this.logger.error(`Erro ao segmentar clientes: ${error.message}`);
          return [];
        }),
      ]);

      if (metricasArray.length === 0) {
        throw new Error(`Cliente não encontrado: ${nomeFantasia}`);
      }

      const metricas = metricasArray[0];
      const comportamento = comportamentoArray[0] || {} as ComportamentoCompraCliente;
      const segmentacao = segmentacaoArray[0] || {} as SegmentacaoCliente;

      // Validação de dados obrigatórios
      if (!metricas || !metricas.nomeFantasia) {
        throw new Error('Dados de métricas financeiras incompletos');
      }

      // Gerar alertas específicos
      const alertas = await this.gerarAlertasCliente(
        metricas,
        comportamento,
        segmentacao,
      ).catch(error => {
        this.logger.error(`Erro ao gerar alertas do cliente: ${error.message}`);
        return [];
      });

      // Gerar recomendações
      const recomendacoes = await this.alertasService.gerarRecomendacoes(
        segmentacao,
        metricas,
        comportamento,
      ).catch(error => {
        this.logger.error(`Erro ao gerar recomendações: ${error.message}`);
        return [];
      });

      // Validação de datas para evitar erros
      const primeiraCompra = metricas.primeiraCompra || new Date();
      const ultimaCompra = metricas.ultimaCompra || new Date();

      return {
        nomeFantasia: metricas.nomeFantasia,
        empresaId: metricas.empresaId,
        uf: metricas.uf,
        metricas,
        comportamento,
        segmentacao,
        alertas,
        recomendacoes,
        dataGeracao: new Date(),
        periodoAnalise: {
          inicio: primeiraCompra,
          fim: ultimaCompra,
        },
      };
    } catch (error) {
      this.logger.error(`Erro ao gerar relatório do cliente ${nomeFantasia}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gera lista de relatórios para múltiplos clientes
   */
  async gerarRelatoriosClientes(
    filtros: FiltrosPerfilClienteDto = {}):
  Promise<RelatorioPerfilCliente[]> {
    this.logger.log('Gerando relatórios para múltiplos clientes...');
  
    try {
      // First get the behavior data to reuse it in other calculations
      const comportamentoArray = await this.comportamentoService.analisarComportamentoCompra(filtros)
        .catch(error => {
          this.logger.error(`Erro ao analisar comportamento de compra: ${error.message}`);
          return [];
        });
        
      // Buscar outras análises
      const [metricasArray, segmentacaoArray] = await Promise.all([
        this.metricasService.calcularMetricasFinanceiras(filtros).catch(error => {
          this.logger.error(`Erro ao calcular métricas financeiras: ${error.message}`);
          return [];
        }),
        this.segmentacaoService.segmentarClientes(filtros).catch(error => {
          this.logger.error(`Erro ao segmentar clientes: ${error.message}`);
          return [];
        }),
      ]);
      
      // Mapear por cliente
      const metricasMap = new Map(
        (metricasArray as MetricasFinanceirasCliente[]).map((m) => [this.gerarChaveCliente(m), m] as [string, MetricasFinanceirasCliente]),
      );
      const comportamentoMap = new Map(
        (comportamentoArray as ComportamentoCompraCliente[]).map((c) => [this.gerarChaveCliente(c), c] as [string, ComportamentoCompraCliente]),
      );
      const segmentacaoMap = new Map(
        (segmentacaoArray as SegmentacaoCliente[]).map((s) => [this.gerarChaveCliente(s), s] as [string, SegmentacaoCliente]),
      );
  
      const relatorios: RelatorioPerfilCliente[] = [];
  
      for (const metricas of metricasArray) {
        if (!metricas || !metricas.nomeFantasia) {
          this.logger.warn('Registro de métricas inválido encontrado, pulando...');
          continue;
        }
          
        const chave = this.gerarChaveCliente(metricas);
        const comportamento = comportamentoMap.get(chave);
        const segmentacao = segmentacaoMap.get(chave);
        
        if (!comportamento || !segmentacao) {
          this.logger.warn(`Dados incompletos para cliente ${chave}, pulando...`);
          continue;
        }
        
        try {
          // Gerar alertas
          const alertas = await this.gerarAlertasCliente(
            metricas,
            comportamento as ComportamentoCompraCliente,
            segmentacao as SegmentacaoCliente,
          ).catch(error => {
            this.logger.error(`Erro ao gerar alertas para cliente ${metricas.nomeFantasia}: ${error.message}`);
            return [];
          });
        
          // Gerar recomendações
          const recomendacoes = await this.alertasService.gerarRecomendacoes(
            segmentacao,
            metricas,
            comportamento,
          ).catch(error => {
            this.logger.error(`Erro ao gerar recomendações para cliente ${metricas.nomeFantasia}: ${error.message}`);
            return [];
          });
        
          // Validação de datas para evitar erros
          const primeiraCompra = metricas.primeiraCompra || new Date();
          const ultimaCompra = metricas.ultimaCompra || new Date();
        
          relatorios.push({
            nomeFantasia: metricas.nomeFantasia,
            empresaId: metricas.empresaId,
            uf: metricas.uf,
            metricas,
            comportamento: comportamento as ComportamentoCompraCliente,
            segmentacao: segmentacao as SegmentacaoCliente,
            alertas,
            recomendacoes,
            dataGeracao: new Date(),
            periodoAnalise: {
              inicio: primeiraCompra,
              fim: ultimaCompra,
            },
          });
        } catch (innerError) {
          this.logger.error(`Erro ao processar cliente ${metricas.nomeFantasia}: ${innerError.message}`);
          continue; // Pular cliente com erro e continuar com os outros
        }
      }
  
      this.logger.log(`${relatorios.length} relatórios gerados`);
  
      return relatorios;
    } catch (error) {
      this.logger.error(`Erro ao gerar relatórios de clientes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gera visão geral (dashboard) de todos os clientes
   */
  async gerarVisaoGeral(
    filtros: FiltrosPerfilClienteDto = {},
  ): Promise<VisaoGeralClientes> {
    this.logger.log('Gerando visão geral de clientes...');

    try {
      // First get the behavior data to reuse it in other calculations
      const comportamentosArray = await this.comportamentoService.analisarComportamentoCompra(filtros)
        .catch(error => {
          this.logger.error(`Erro ao analisar comportamento de compra: ${error.message}`);
          return [];
        });
      
      const [metricasArray, segmentacaoArray, alertas] = await Promise.all([
        this.metricasService.calcularMetricasFinanceiras(filtros).catch(error => {
          this.logger.error(`Erro ao calcular métricas financeiras: ${error.message}`);
          return [];
        }),
        this.segmentacaoService.segmentarClientes(filtros).catch(error => {
          this.logger.error(`Erro ao segmentar clientes: ${error.message}`);
          return [];
        }),
        this.alertasService.gerarAlertas(filtros).catch(error => {
          this.logger.error(`Erro ao gerar alertas: ${error.message}`);
          return [];
        }),
      ]);

      const totalClientes = (metricasArray as MetricasFinanceirasCliente[]).length;

      // Clientes ativos (compraram nos últimos 90 dias)
      const hoje = new Date();
      const clientesAtivos = (metricasArray as MetricasFinanceirasCliente[]).filter((m) => {
        // Verificar se m.ultimaCompra é válida
        if (!m || !m.ultimaCompra) {
          return false;
        }
        try {
          const diasSemCompra = Math.floor(
            (hoje.getTime() - new Date(m.ultimaCompra).getTime()) / (1000 * 60 * 60 * 24),
          );
          return diasSemCompra <= 90;
        } catch (error) {
          this.logger.warn(`Data inválida para cliente ${m.nomeFantasia}: ${error.message}`);
          return false;
        }
      }).length;

      const clientesInativos = totalClientes - clientesAtivos;

      // Receita total
      const receitaTotal = (metricasArray as MetricasFinanceirasCliente[]).reduce((sum: number, m: MetricasFinanceirasCliente) => {
        if (m && typeof m.receitaTotal === 'number') {
          return sum + m.receitaTotal;
        }
        return sum;
      }, 0);
      
      const receitaMediaPorCliente =
        totalClientes > 0 ? receitaTotal / totalClientes : 0;

      // Ticket médio geral
      const ticketMedioGeral =
        metricasArray.length > 0
          ? (metricasArray as MetricasFinanceirasCliente[]).reduce((sum: number, m: MetricasFinanceirasCliente) => {
              if (m && typeof m.ticketMedio === 'number') {
                return sum + m.ticketMedio;
              }
              return sum;
            }, 0) / metricasArray.length
          : 0;

      // LTV
      const lifetimeValueTotal = (metricasArray as MetricasFinanceirasCliente[]).reduce((sum: number, m: MetricasFinanceirasCliente) => {
        if (m && typeof m.lifetimeValue === 'number') {
          return sum + m.lifetimeValue;
        }
        return sum;
      }, 0);
      
      const lifetimeValueMedio =
        totalClientes > 0 ? lifetimeValueTotal / totalClientes : 0;

      // Distribuição por segmento
      const distribuicaoSegmentos = this.calcularDistribuicaoSegmentos(
        segmentacaoArray,
        metricasArray,
      );

      // Top clientes (top 10 por receita)
      const topClientes = [...metricasArray]
        .filter((m: any) => m && typeof m.receitaTotal === 'number')
        .sort((a: any, b: any) => (b?.receitaTotal || 0) - (a?.receitaTotal || 0))
        .slice(0, 10)
        .map((m: any) => {
          const segmentacao = segmentacaoArray.find(
            (s: any) =>
              s?.nomeFantasia === m?.nomeFantasia &&
              s?.empresaId === m?.empresaId,
          );
          return {
            nomeFantasia: m?.nomeFantasia || '',
            receita: m?.receitaTotal || 0,
            segmento: segmentacao?.segmento || 'hibernando',
          };
        });

      // Alertas por tipo
      const alertasPorTipo = this.agruparAlertasPorTipo(alertas || []);

      // Tendência geral
      const tendencias = metricasArray
        .filter((m: any) => m && m.tendenciaReceita)
        .map((m: any) => m.tendenciaReceita);
      
      const crescentes = tendencias.filter((t: any) => t === 'crescente').length;
      const decrescentes = tendencias.filter((t: any) => t === 'decrescente').length;
      let tendenciaGeral: 'crescente' | 'estavel' | 'decrescente';
      if (crescentes > decrescentes * 1.5) {
        tendenciaGeral = 'crescente';
      } else if (decrescentes > crescentes * 1.5) {
        tendenciaGeral = 'decrescente';
      } else {
        tendenciaGeral = 'estavel';
      }

      // Crescimento médio de receita
      const crescimentoReceita =
        metricasArray.length > 0
          ? (metricasArray as MetricasFinanceirasCliente[]).reduce((sum: number, m: MetricasFinanceirasCliente) => {
              if (m && typeof m.crescimentoPercentual === 'number') {
                return sum + m.crescimentoPercentual;
              }
              return sum;
            }, 0) / metricasArray.length
          : 0;

      // Receita potencial (soma dos valores potenciais)
      const receitaPotencial = (segmentacaoArray as SegmentacaoCliente[]).reduce((sum: number, s: SegmentacaoCliente) => {
        if (s && typeof s.valorPotencial === 'number') {
          return sum + s.valorPotencial;
        }
        return sum;
      }, 0);
      
      const clientesComOportunidade = (segmentacaoArray as SegmentacaoCliente[]).filter(
        (s) => s?.potencialCrescimento !== 'baixo',
      ).length;

      // Dados agregados para gráficos
      const receitaMensalAgregada = this.agruparReceitaMensalAgregada(metricasArray);
      const marcasMaisCompradas = this.agruparMarcasMaisCompradasFromComportamento(comportamentosArray);
      const sazonalidadeAgregada = this.agruparSazonalidadeAgregadaFromComportamento(comportamentosArray);

      return {
        totalClientes,
        clientesAtivos,
        clientesInativos,
        receitaTotal: Number(receitaTotal),
        receitaMediaPorCliente,
        ticketMedioGeral,
        lifetimeValueMedio,
        lifetimeValueTotal: Number(lifetimeValueTotal),
        distribuicaoSegmentos,
        topClientes,
        totalAlertas: (alertas || []).length,
        alertasPorTipo,
        tendenciaGeral,
        crescimentoReceita,
        receitaPotencial: Number(receitaPotencial),
        clientesComOportunidade,
        receitaMensalAgregada,
        marcasMaisCompradas,
        sazonalidadeAgregada,
      };
    } catch (error) {
      this.logger.error(`Erro ao gerar visão geral: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca apenas alertas (útil para dashboard)
   */
  async buscarAlertas(
    filtros: FiltrosPerfilClienteDto = {},
  ): Promise<AlertaCliente[]> {
    return this.alertasService.gerarAlertas(filtros);
  }

  /**
   * Gera alertas específicos de um cliente
   */
  private async gerarAlertasCliente(
    metricas: MetricasFinanceirasCliente,
    comportamento: ComportamentoCompraCliente,
    segmentacao: SegmentacaoCliente,
  ): Promise<AlertaCliente[]> {
    const alertas: AlertaCliente[] = [];

    try {
      // Verificar se os dados necessários estão presentes
      if (!metricas || !metricas.nomeFantasia) {
        this.logger.warn('Dados insuficientes para gerar alertas do cliente');
        return [];
      }

      // Alerta de inatividade
      if (metricas.ultimaCompra) {
        const hoje = new Date();
        let diasSemCompra = 0;
        
        try {
          const ultimaCompraDate = new Date(metricas.ultimaCompra);
          diasSemCompra = Math.floor(
            (hoje.getTime() - ultimaCompraDate.getTime()) /
              (1000 * 60 * 60 * 24),
          );
        } catch (error) {
          this.logger.warn(`Data de última compra inválida para cliente ${metricas.nomeFantasia}: ${error.message}`);
        }

        if (diasSemCompra >= 30) {
          let tipo: 'inativo_30_dias' | 'inativo_60_dias' | 'inativo_90_dias';
          let prioridade: 'alta' | 'media' | 'baixa';

          if (diasSemCompra >= 90) {
            tipo = 'inativo_90_dias';
            prioridade = 'alta';
          } else if (diasSemCompra >= 60) {
            tipo = 'inativo_60_dias';
            prioridade = 'alta';
          } else {
            tipo = 'inativo_30_dias';
            prioridade = 'media';
          }

          alertas.push({
            nomeFantasia: metricas.nomeFantasia,
            empresaId: metricas.empresaId,
            tipo,
            prioridade,
            mensagem: `Cliente inativo há ${diasSemCompra} dias`,
            diasSemCompra,
            ultimaCompra: metricas.ultimaCompra,
            receitaPotencialPerdida: metricas.ticketMedio || 0,
            acaoRecomendada: 'Contato proativo com oferta especial',
          });
        }
      }

      // Alerta de queda de receita
      try {
        const alertaQueda = await this.alertasService.gerarAlertasQuedaReceita(
          metricas,
        );
        if (alertaQueda) {
          alertas.push(alertaQueda);
        }
      } catch (error) {
        this.logger.error(`Erro ao gerar alerta de queda de receita: ${error.message}`);
      }

      // Alerta de risco de churn
      if (segmentacao?.riscoChurn === 'alto') {
        alertas.push({
          nomeFantasia: metricas.nomeFantasia,
          empresaId: metricas.empresaId,
          tipo: 'risco_churn',
          prioridade: 'alta',
          mensagem: `Alto risco de perda (${segmentacao.probabilidadeChurn || 0}%)`,
          receitaPotencialPerdida: metricas.lifetimeValue || 0,
          acaoRecomendada: 'Ação imediata para retenção',
        });
      }

      // Alerta de oportunidade
      try {
        const alertaOportunidade =
          await this.alertasService.gerarAlertasOportunidadeUpselling(
            comportamento,
            metricas,
          );
        if (alertaOportunidade) {
          alertas.push(alertaOportunidade);
        }
      } catch (error) {
        this.logger.error(`Erro ao gerar alerta de oportunidade: ${error.message}`);
      }

    } catch (error) {
      this.logger.error(`Erro ao gerar alertas do cliente: ${error.message}`);
      return [];
    }

    return alertas;
  }

  /**
   * Calcula distribuição de clientes por segmento
   */
  private calcularDistribuicaoSegmentos(
    segmentacaoArray: SegmentacaoCliente[],
    metricasArray: MetricasFinanceirasCliente[],
  ) {
    const metricasMap = new Map();
    
    // Criar mapeamento de métricas, verificando dados válidos
    for (const m of metricasArray) {
      if (m && m.nomeFantasia) {
        const chave = `${m.nomeFantasia}|${m.empresaId || ''}`;
        metricasMap.set(chave, m);
      }
    }

    const segmentosMap = new Map<
      string,
      { quantidade: number; receitaTotal: number }
    >();

    for (const seg of segmentacaoArray) {
      if (!seg || !seg.segmento || !seg.nomeFantasia) {
        continue; // Pular segmentos inválidos
      }
      
      const chave = seg.segmento as SegmentoCliente;
      const metricaChave = `${seg.nomeFantasia}|${seg.empresaId || ''}`;
      const metrica = metricasMap.get(metricaChave);

      if (!segmentosMap.has(chave)) {
        segmentosMap.set(chave, { quantidade: 0, receitaTotal: 0 });
      }

      const dados = segmentosMap.get(chave)!;
      dados.quantidade++;
      if (metrica && typeof metrica.receitaTotal === 'number') {
        dados.receitaTotal += metrica.receitaTotal;
      }
    }

    const total = segmentacaoArray.length;
    const resultado: { segmento: SegmentoCliente; quantidade: number; percentual: number; receitaTotal: number }[] = [];

    for (const [segmento, dados] of segmentosMap) {
      resultado.push({
        segmento: segmento as SegmentoCliente,
        quantidade: dados.quantidade,
        percentual: total > 0 ? (dados.quantidade / total) * 100 : 0,
        receitaTotal: dados.receitaTotal,
      });
    }

    // Ordenar por quantidade
    resultado.sort((a, b) => (b.quantidade || 0) - (a.quantidade || 0));

    return resultado;
  }

  /**
   * Agrupa alertas por tipo
   */
  private agruparAlertasPorTipo(alertas: AlertaCliente[]) {
    const map = new Map<string, number>();

    for (const alerta of alertas) {
      const count = map.get(alerta.tipo) || 0;
      map.set(alerta.tipo, count + 1);
    }

    const resultado: { tipo: any; quantidade: number }[] = [];
    for (const [tipo, quantidade] of map) {
      resultado.push({ tipo, quantidade });
    }

    // Ordenar por quantidade
    resultado.sort((a, b) => b.quantidade - a.quantidade);

    return resultado;
  }

  /**
   * Gera chave única para cliente
   */
  private gerarChaveCliente(obj: { nomeFantasia: string; empresaId?: string }): string {
    return `${obj.nomeFantasia}|${obj.empresaId || ''}`;
  }

  /**
   * Agrupa receita mensal agregada de todos os clientes
   */
  private agruparReceitaMensalAgregada(metricasArray: MetricasFinanceirasCliente[]) {
    const porMes = new Map<string, any>();

    // Processar receita mensal de cada cliente
    for (const metricas of metricasArray) {
      if (metricas && metricas.receitaMensal && Array.isArray(metricas.receitaMensal)) {
        for (const item of metricas.receitaMensal) {
          if (!item || typeof item.ano !== 'number' || typeof item.mes !== 'number') {
            continue; // Pular itens inválidos
          }
          
          const chave = `${item.ano}-${item.mes}`;
          
          if (!porMes.has(chave)) {
            porMes.set(chave, {
              ano: item.ano,
              mes: item.mes,
              receita: 0
            });
          }
          
          const dados = porMes.get(chave)!;
          dados.receita += typeof item.receita === 'number' ? item.receita : 0;
        }
      }
    }

    // Converter para array e ordenar por data
    const resultado = Array.from(porMes.values())
      .sort((a, b) => {
        if (a.ano !== b.ano) return a.ano - b.ano;
        return a.mes - b.mes;
      })
      .map(item => ({
        ...item,
        mesDescricao: this.obterNomeMes(item.mes)
      }));

    return resultado;
  }

  /**
   * Agrupa marcas mais compradas
   */
  private agruparMarcasMaisCompradasFromComportamento(comportamentos: ComportamentoCompraCliente[]) {
    const porMarca = new Map<string, { quantidade: number; valor: number }>();
    
    // Agregar dados de marcas
    for (const comportamento of comportamentos) {
      if (comportamento && comportamento.marcasPrincipais && Array.isArray(comportamento.marcasPrincipais)) {
        for (const marca of comportamento.marcasPrincipais) {
          if (!marca || !marca.marca) {
            continue; // Pular marcas inválidas
          }
          
          if (!porMarca.has(marca.marca)) {
            porMarca.set(marca.marca, { quantidade: 0, valor: 0 });
          }
          
          const dados = porMarca.get(marca.marca)!;
          dados.quantidade += typeof marca.quantidadeCompras === 'number' ? marca.quantidadeCompras : 0;
          dados.valor += typeof marca.valorTotal === 'number' ? marca.valorTotal : 0;
        }
      }
    }
    
    // Converter para array, ordenar por valor e pegar top 10
    const resultado = Array.from(porMarca.entries())
      .map(([marca, dados]) => ({
        marca,
        quantidade: dados.quantidade,
        valor: dados.valor
      }))
      .sort((a, b) => (b.valor || 0) - (a.valor || 0))
      .slice(0, 10);
      
    return resultado;
  }

  private async agruparMarcasMaisCompradas(filtros: FiltrosPerfilClienteDto) {
    // Buscar comportamento de compra de todos os clientes
    const comportamentos = await this.comportamentoService.analisarComportamentoCompra(filtros);
    
    return this.agruparMarcasMaisCompradasFromComportamento(comportamentos);
  }

  /**
   * Agrupa dados sazonais agregados
   */
  private agruparSazonalidadeAgregadaFromComportamento(comportamentos: ComportamentoCompraCliente[]) {
    const porMes = new Map<number, number>();
    
    // Agregar dados sazonais
    for (const comportamento of comportamentos) {
      if (comportamento && comportamento.padraoSazonal?.receitaPorMes && Array.isArray(comportamento.padraoSazonal.receitaPorMes)) {
        for (const item of comportamento.padraoSazonal.receitaPorMes) {
          if (!item || typeof item.mes !== 'number') {
            continue; // Pular itens inválidos
          }
          
          const receita = typeof item.receita === 'number' ? item.receita : 0;
          const receitaAtual = porMes.get(item.mes) || 0;
          porMes.set(item.mes, receitaAtual + receita);
        }
      }
    }
    
    // Converter para array e ordenar por mês
    const resultado = Array.from(porMes.entries())
      .map(([mes, receita]) => ({
        mes,
        mesDescricao: this.obterNomeMes(mes),
        receita
      }))
      .sort((a, b) => a.mes - b.mes);
      
    return resultado;
  }

  private async agruparSazonalidadeAgregada(filtros: FiltrosPerfilClienteDto) {
    // Buscar comportamento de compra de todos os clientes
    const comportamentos = await this.comportamentoService.analisarComportamentoCompra(filtros);
    
    return this.agruparSazonalidadeAgregadaFromComportamento(comportamentos);
  }

  /**
   * Obtém nome do mês por número
   */
  private obterNomeMes(mes: number): string {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return meses[mes - 1] || `Mês ${mes}`;
  }
}
