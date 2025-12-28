import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  FiltrosPerfilClienteDto,
  ComportamentoCompraCliente,
  MarcaComprada,
  GrupoComprado,
  SubgrupoComprado,
  PadraoSazonalCliente,
  OportunidadeCrossSelling,
} from './dto/cliente-perfil-analytics.dto';

/**
 * Service para análise de comportamento de compra de clientes
 * Analisa marcas, produtos, sazonalidade e oportunidades de cross-selling
 */
@Injectable()
export class ClienteComportamentoCompraService {
  private readonly logger = new Logger(ClienteComportamentoCompraService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Analisa comportamento de compra de todos os clientes
   */
  async analisarComportamentoCompra(
    filtros: FiltrosPerfilClienteDto = {},
  ): Promise<ComportamentoCompraCliente[]> {
    this.logger.log('Analisando comportamento de compra dos clientes...');

    const vendas: any[] = await this.buscarVendasClientes(filtros);
    this.logger.log(`Encontradas ${vendas.length} vendas para análise`);

    const comportamentosPorCliente = new Map<string, any>();

    // Process vendas in batches to avoid memory issues
    const batchSize = 1000;
    for (let i = 0; i < vendas.length; i += batchSize) {
      const batch = vendas.slice(i, i + batchSize);
      for (const venda of batch) {
        const chave = this.gerarChaveCliente(
          venda.nomeFantasia,
          venda.empresaId ?? undefined,
        );

        if (!comportamentosPorCliente.has(chave)) {
          comportamentosPorCliente.set(chave, {
            nomeFantasia: venda.nomeFantasia,
            empresaId: venda.empresaId,
            vendas: [],
          });
        }

        comportamentosPorCliente.get(chave).vendas.push(venda);
      }

      // Allow event loop to process other tasks
      if (i % (batchSize * 5) === 0) {
        await new Promise((resolve) => setImmediate(resolve));
      }
    }

    this.logger.log(
      `Agrupadas vendas de ${comportamentosPorCliente.size} clientes únicos`,
    );

    const comportamentos: ComportamentoCompraCliente[] = [];
    let contador = 0;
    const clientesArray = Array.from(comportamentosPorCliente.values());

    // Process clients in smaller batches to prevent blocking
    const clientBatchSize = 10;
    for (let i = 0; i < clientesArray.length; i += clientBatchSize) {
      const batch = clientesArray.slice(i, i + clientBatchSize);
      const batchPromises = batch.map((dados) =>
        this.analisarComportamentoCliente(dados),
      );
      const batchResults = await Promise.all(batchPromises);
      comportamentos.push(...batchResults);

      contador += batch.length;
      if (contador % 50 === 0) {
        this.logger.log(`Analisados ${contador} clientes...`);
        // Allow event loop to process other tasks
        await new Promise((resolve) => setImmediate(resolve));
      }
    }

    this.logger.log(
      `Comportamento analisado para ${comportamentos.length} clientes`,
    );

    return comportamentos;
  }

  /**
   * Analisa comportamento de compra de um cliente específico
   */
  private async analisarComportamentoCliente(
    dados: any,
  ): Promise<ComportamentoCompraCliente> {
    // Removed detailed logging to reduce overhead
    const vendas = dados.vendas;

    // Analisar marcas
    const marcasPrincipais = await this.analisarMarcas(vendas);
    const marcasFavoritas = marcasPrincipais.slice(0, 3).map((m) => m.marca);

    // Analisar grupos e subgrupos
    const gruposPrincipais = this.analisarGrupos(vendas);
    const subgruposPrincipais = this.analisarSubgrupos(vendas);

    // Analisar sazonalidade
    const padraoSazonal = this.analisarSazonalidade(vendas);

    // Identificar oportunidades de cross-selling
    const oportunidadesCrossSelling = await this.identificarCrossSelling(
      vendas,
      marcasPrincipais,
    );

    // Calcular diversificação
    const marcasUnicas = new Set(vendas.map((v) => v.marca).filter(Boolean));
    const gruposUnicos = new Set(vendas.map((v) => v.grupo).filter(Boolean));
    const diversidadeMarcas = marcasUnicas.size;
    const diversidadeGrupos = gruposUnicos.size;

    // Calcular concentração (% da receita nas top 3 marcas)
    const receitaTotal = vendas.reduce(
      (sum, v) => sum + Number(v.totalValor || 0),
      0,
    );
    const receitaTop3 = marcasPrincipais
      .slice(0, 3)
      .reduce((sum, m) => sum + m.valorTotal, 0);
    const concentracaoCompra =
      receitaTotal > 0 ? (receitaTop3 / receitaTotal) * 100 : 0;

    return {
      nomeFantasia: dados.nomeFantasia,
      empresaId: dados.empresaId,
      marcasPrincipais,
      marcasFavoritas,
      gruposPrincipais,
      subgruposPrincipais,
      padraoSazonal,
      oportunidadesCrossSelling,
      diversidadeMarcas,
      diversidadeGrupos,
      concentracaoCompra,
    };
  }

  /**
   * Analisa marcas compradas pelo cliente
   */
  private async analisarMarcas(vendas: any[]): Promise<MarcaComprada[]> {
    const marcasMap = new Map<string, any>();
    const receitaTotal = vendas.reduce(
      (sum, v) => sum + Number(v.totalValor || 0),
      0,
    );

    for (const venda of vendas) {
      const marca = venda.marca || 'Sem Marca';

      if (!marcasMap.has(marca)) {
        // Buscar data EXATA da última venda desta marca para este cliente
        const ultimaVendaMarca = await this.prisma.venda.findFirst({
          where: {
            marca: marca === 'Sem Marca' ? null : marca,
            nomeFantasia: vendas[0]?.nomeFantasia, // Cliente atual
          },
          select: { dataVenda: true },
          orderBy: { dataVenda: 'desc' },
        });

        marcasMap.set(marca, {
          marca,
          quantidadeCompras: 0,
          valorTotal: 0,
          ultimaCompra: ultimaVendaMarca
            ? new Date(ultimaVendaMarca.dataVenda)
            : new Date(venda.ano, venda.mes, 0),
          datas: [],
        });
      }

      const dados = marcasMap.get(marca);
      dados.quantidadeCompras += Number(venda.totalQuantidade || 0);
      dados.valorTotal += Number(venda.totalValor || 0);
    }

    const marcas: MarcaComprada[] = [];

    for (const [, dados] of marcasMap) {
      const percentualReceita =
        receitaTotal > 0 ? (dados.valorTotal / receitaTotal) * 100 : 0;

      // Calcular frequência
      const mesesComCompra = dados.datas.length;
      let frequencia: 'alta' | 'media' | 'baixa';
      if (mesesComCompra >= 6) {
        frequencia = 'alta';
      } else if (mesesComCompra >= 3) {
        frequencia = 'media';
      } else {
        frequencia = 'baixa';
      }

      marcas.push({
        marca: dados.marca,
        quantidadeCompras: dados.quantidadeCompras,
        valorTotal: dados.valorTotal,
        percentualReceita,
        frequencia,
        ultimaCompra: dados.ultimaCompra,
      });
    }

    // Ordenar por valor total (maior para menor)
    marcas.sort((a, b) => b.valorTotal - a.valorTotal);

    return marcas;
  }

  /**
   * Analisa grupos de produtos comprados
   */
  private analisarGrupos(vendas: any[]): GrupoComprado[] {
    const gruposMap = new Map<string, any>();
    const receitaTotal = vendas.reduce(
      (sum, v) => sum + Number(v.totalValor || 0),
      0,
    );

    for (const venda of vendas) {
      const grupo = venda.grupo || 'Sem Grupo';

      if (!gruposMap.has(grupo)) {
        gruposMap.set(grupo, {
          grupo,
          quantidadeCompras: 0,
          valorTotal: 0,
          marcas: new Set(),
        });
      }

      const dados = gruposMap.get(grupo);
      dados.quantidadeCompras += Number(venda.totalQuantidade || 0);
      dados.valorTotal += Number(venda.totalValor || 0);
      if (venda.marca) {
        dados.marcas.add(venda.marca);
      }
    }

    const grupos: GrupoComprado[] = [];

    for (const [, dados] of gruposMap) {
      const percentualReceita =
        receitaTotal > 0 ? (dados.valorTotal / receitaTotal) * 100 : 0;

      grupos.push({
        grupo: dados.grupo,
        quantidadeCompras: dados.quantidadeCompras,
        valorTotal: dados.valorTotal,
        percentualReceita,
        marcasPrincipais: Array.from(dados.marcas).slice(0, 5) as string[],
      });
    }

    // Ordenar por valor total
    grupos.sort((a, b) => b.valorTotal - a.valorTotal);

    return grupos;
  }

  /**
   * Analisa subgrupos de produtos comprados
   */
  private analisarSubgrupos(vendas: any[]): SubgrupoComprado[] {
    const subgruposMap = new Map<string, any>();
    const receitaTotal = vendas.reduce(
      (sum, v) => sum + Number(v.totalValor || 0),
      0,
    );

    for (const venda of vendas) {
      const subgrupo = venda.subgrupo || 'Sem Subgrupo';
      const grupo = venda.grupo || 'Sem Grupo';
      const chave = `${grupo}|${subgrupo}`;

      if (!subgruposMap.has(chave)) {
        subgruposMap.set(chave, {
          subgrupo,
          grupo,
          quantidadeCompras: 0,
          valorTotal: 0,
        });
      }

      const dados = subgruposMap.get(chave);
      dados.quantidadeCompras += Number(venda.totalQuantidade || 0);
      dados.valorTotal += Number(venda.totalValor || 0);
    }

    const subgrupos: SubgrupoComprado[] = [];

    for (const [, dados] of subgruposMap) {
      const percentualReceita =
        receitaTotal > 0 ? (dados.valorTotal / receitaTotal) * 100 : 0;

      subgrupos.push({
        subgrupo: dados.subgrupo,
        grupo: dados.grupo,
        quantidadeCompras: dados.quantidadeCompras,
        valorTotal: dados.valorTotal,
        percentualReceita,
      });
    }

    // Ordenar por valor total
    subgrupos.sort((a, b) => b.valorTotal - a.valorTotal);

    return subgrupos;
  }

  /**
   * Analisa padrões sazonais de compra
   */
  private analisarSazonalidade(vendas: any[]): PadraoSazonalCliente {
    const receitaPorMes = new Map<number, number>();

    // Agregar por mês (1-12)
    for (const venda of vendas) {
      const mes = venda.mes;
      const receita = receitaPorMes.get(mes) || 0;
      receitaPorMes.set(mes, receita + Number(venda.totalValor || 0));
    }

    // Converter para array
    const receitaMesArray: { mes: number; receita: number }[] = [];
    for (let mes = 1; mes <= 12; mes++) {
      receitaMesArray.push({
        mes,
        receita: receitaPorMes.get(mes) || 0,
      });
    }

    // Ordenar por receita
    const ordenadoPorReceita = [...receitaMesArray].sort(
      (a, b) => b.receita - a.receita,
    );

    // Meses de alta (top 3)
    const mesesAlta = ordenadoPorReceita
      .slice(0, 3)
      .map((m) => m.mes)
      .sort((a, b) => a - b);

    // Meses de baixa (bottom 3, excluindo meses sem vendas)
    const comVendas = ordenadoPorReceita.filter((m) => m.receita > 0);
    const mesesBaixa = comVendas
      .slice(-3)
      .map((m) => m.mes)
      .sort((a, b) => a - b);

    // Calcular sazonalidade (variação entre meses)
    const receitas = receitaMesArray
      .filter((m) => m.receita > 0)
      .map((m) => m.receita);
    const media =
      receitas.length > 0
        ? receitas.reduce((sum, r) => sum + r, 0) / receitas.length
        : 0;
    const desvio =
      receitas.length > 0
        ? Math.sqrt(
            receitas.reduce((sum, r) => sum + Math.pow(r - media, 2), 0) /
              receitas.length,
          )
        : 0;
    const coeficienteVariacao = media > 0 ? (desvio / media) * 100 : 0;

    let sazonalidade: 'alta' | 'media' | 'baixa';
    if (coeficienteVariacao > 50) {
      sazonalidade = 'alta';
    } else if (coeficienteVariacao > 25) {
      sazonalidade = 'media';
    } else {
      sazonalidade = 'baixa';
    }

    return {
      mesesAlta,
      mesesBaixa,
      sazonalidade,
      receitaPorMes: receitaMesArray,
    };
  }

  /**
   * Identifica oportunidades de cross-selling
   */
  private async identificarCrossSelling(
    vendasCliente: any[],
    marcasCliente: MarcaComprada[],
  ): Promise<OportunidadeCrossSelling[]> {
    const oportunidades: OportunidadeCrossSelling[] = [];

    // Buscar marcas populares que o cliente ainda não compra
    const marcasCompradas = new Set(marcasCliente.map((m) => m.marca));

    // Buscar top marcas globais
    const topMarcasGlobais = await this.buscarTopMarcasGlobais();

    // Calcular receita média do cliente apenas uma vez
    const receitaMediaCliente =
      marcasCliente.length > 0
        ? marcasCliente.reduce((sum, m) => sum + m.valorTotal, 0) /
          marcasCliente.length
        : 0;

    for (const marcaGlobal of topMarcasGlobais) {
      if (!marcasCompradas.has(marcaGlobal.marca)) {
        // Cliente não compra essa marca popular

        const potencialReceita = receitaMediaCliente * 0.3; // 30% da média

        // Probabilidade baseada na popularidade da marca
        let probabilidade: 'alta' | 'media' | 'baixa';
        if (marcaGlobal.percentualClientes > 50) {
          probabilidade = 'alta';
        } else if (marcaGlobal.percentualClientes > 25) {
          probabilidade = 'media';
        } else {
          probabilidade = 'baixa';
        }

        oportunidades.push({
          marcaAtual: marcasCliente[0]?.marca || 'N/A',
          marcaSugerida: marcaGlobal.marca,
          razao: `${marcaGlobal.percentualClientes.toFixed(0)}% dos clientes compram esta marca`,
          potencialReceita,
          probabilidade,
        });

        // Limit to top 5 opportunities to avoid unnecessary processing
        if (oportunidades.length >= 5) {
          break;
        }
      }
    }

    return oportunidades;
  }

  /**
   * Busca top marcas mais compradas globalmente
   */
  private async buscarTopMarcasGlobais(): Promise<
    { marca: string; percentualClientes: number }[]
  > {
    this.logger.log('Buscando top marcas globais...');

    // Otimização: Usar agregação direta no banco ao invés de buscar todas as vendas
    const resultados: any[] = await this.prisma.$queryRaw`
      SELECT 
        COALESCE(marca, 'Sem Marca') as marca,
        COUNT(DISTINCT "nomeFantasia") as clientes,
        (COUNT(DISTINCT "nomeFantasia") * 100.0 / (SELECT COUNT(DISTINCT "nomeFantasia") FROM "VendaAnalytics")) as percentual_clientes
      FROM "VendaAnalytics"
      GROUP BY marca
      ORDER BY clientes DESC
      LIMIT 10
    `;

    this.logger.log(`Encontradas ${resultados.length} marcas populares`);

    return resultados.map((r: any) => ({
      marca: r.marca,
      percentualClientes: parseFloat(r.percentual_clientes),
    }));
  }

  /**
   * Busca vendas dos clientes
   */
  private async buscarVendasClientes(
    filtros: FiltrosPerfilClienteDto,
  ): Promise<any[]> {
    this.logger.log('Buscando vendas para análise de comportamento...');

    // Otimização: Usar raw query para melhor performance
    let query = `
      SELECT 
        "nomeFantasia",
        "empresaId",
        ano,
        mes,
        marca,
        grupo,
        subgrupo,
        "totalValor",
        "totalQuantidade"
      FROM "VendaAnalytics"
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filtros.ano && filtros.ano.length > 0) {
      query += ` AND ano = ANY($${params.length + 1})`;
      params.push(filtros.ano);
    }

    if (filtros.mes && filtros.mes.length > 0) {
      query += ` AND mes = ANY($${params.length + 1})`;
      params.push(filtros.mes);
    }

    if (filtros.nomeFantasia && filtros.nomeFantasia.length > 0) {
      query += ` AND "nomeFantasia" = ANY($${params.length + 1})`;
      params.push(filtros.nomeFantasia);
    }

    if (filtros.empresaId && filtros.empresaId.length > 0) {
      query += ` AND "empresaId" = ANY($${params.length + 1})`;
      params.push(filtros.empresaId);
    }

    if (filtros.uf && filtros.uf.length > 0) {
      query += ` AND uf = ANY($${params.length + 1})`;
      params.push(filtros.uf);
    }

    this.logger.log('Executando consulta de vendas otimizada...');

    const vendas: any[] = await this.prisma.$queryRawUnsafe(query, ...params);

    this.logger.log(`Consulta concluída: ${vendas.length} vendas encontradas`);

    return vendas;
  }

  /**
   * Gera chave única para identificar cliente
   */
  private gerarChaveCliente(nomeFantasia: string, empresaId?: string): string {
    return `${nomeFantasia}|${empresaId || ''}`;
  }
}
