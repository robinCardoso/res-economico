import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { FilterAnalyticsDto } from './dto/filter-analytics.dto';
import { FilialAssociadoAnalyticsDto } from './dto/filial-associado-analytics.dto';
import {
  FilialAssociadoResponse,
  UFData,
  AssociadoData,
} from './dto/filial-associado-response.dto';

@Injectable()
export class VendasAnalyticsDirectService {
  private readonly logger = new Logger(VendasAnalyticsDirectService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Constrói filtros WHERE para a tabela Venda baseado nos filtros de analytics
   */
  private buildWhereClause(filtros?: FilterAnalyticsDto) {
    const where: Record<string, unknown> = {};

    // Filtro por tipo de operação
    if (filtros?.tipoOperacao && filtros.tipoOperacao.length > 0) {
      where.tipoOperacao = { in: filtros.tipoOperacao };
    }

    // Filtro por filial (UF destino)
    if (filtros?.filial && filtros.filial.length > 0) {
      where.ufDestino = { in: filtros.filial };
    }

    // Filtro por ano e mês
    // IMPORTANTE: Usar UTC para evitar problemas de timezone
    if (filtros?.ano && filtros.ano.length > 0) {
      const anoConditions: Array<Record<string, unknown>> = [];
      for (const ano of filtros.ano) {
        if (filtros?.mes && filtros.mes.length > 0) {
          // Se tem mês, filtrar por ano E mês
          for (const mes of filtros.mes) {
            // Criar datas em UTC para evitar problemas de timezone
            // Início do mês: ano-mes-01 00:00:00 UTC
            const startDate = new Date(Date.UTC(ano, mes - 1, 1, 0, 0, 0, 0));
            // Fim do mês: último dia do mês 23:59:59.999 UTC
            const lastDay = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
            const endDate = new Date(
              Date.UTC(ano, mes - 1, lastDay, 23, 59, 59, 999),
            );
            anoConditions.push({
              dataVenda: {
                gte: startDate,
                lte: endDate,
              },
            });
          }
        } else {
          // Apenas ano
          // Início do ano: 01/01/ano 00:00:00 UTC
          const startDate = new Date(Date.UTC(ano, 0, 1, 0, 0, 0, 0));
          // Fim do ano: 31/12/ano 23:59:59.999 UTC
          const endDate = new Date(Date.UTC(ano, 11, 31, 23, 59, 59, 999));
          anoConditions.push({
            dataVenda: {
              gte: startDate,
              lte: endDate,
            },
          });
        }
      }
      if (anoConditions.length > 0) {
        where.OR = anoConditions;
      }
    } else if (filtros?.mes && filtros.mes.length > 0) {
      // Apenas mês (sem ano específico) - usar ano atual
      const anoAtual = new Date().getUTCFullYear();
      const mesConditions: Array<Record<string, unknown>> = [];
      for (const mes of filtros.mes) {
        // Criar datas em UTC
        const startDate = new Date(Date.UTC(anoAtual, mes - 1, 1, 0, 0, 0, 0));
        const lastDay = new Date(Date.UTC(anoAtual, mes, 0)).getUTCDate();
        const endDate = new Date(
          Date.UTC(anoAtual, mes - 1, lastDay, 23, 59, 59, 999),
        );
        mesConditions.push({
          dataVenda: {
            gte: startDate,
            lte: endDate,
          },
        });
      }
      if (mesConditions.length > 0) {
        where.OR = mesConditions;
      }
    }

    // Filtro por marca
    if (filtros?.marca && filtros.marca.length > 0) {
      where.marca = { in: filtros.marca };
    }

    // Filtro por nome fantasia (associado)
    if (filtros?.nomeFantasia && filtros.nomeFantasia.length > 0) {
      where.nomeFantasia = { in: filtros.nomeFantasia };
    }

    // Filtro por grupo
    if (filtros?.grupo && filtros.grupo.length > 0) {
      where.grupo = { in: filtros.grupo };
    }

    // Filtro por subgrupo
    if (filtros?.subgrupo && filtros.subgrupo.length > 0) {
      where.subgrupo = { in: filtros.subgrupo };
    }

    // Filtro por empresa
    if (filtros?.empresaId && filtros.empresaId.length > 0) {
      where.empresaId = { in: filtros.empresaId };
    }

    return where;
  }

  /**
   * Busca crescimento da empresa mês a mês e ano a ano
   * Calcula diretamente da tabela Venda
   */
  async getCrescimentoEmpresa(filtros?: FilterAnalyticsDto): Promise<{
    meses: Array<{
      mes: number;
      nomeMes: string;
      dados: {
        [ano: number]: { venda: number; evolucao?: number | null };
      };
    }>;
    totalGeral: {
      [ano: number]: { venda: number; evolucao?: number | null };
    };
    anosDisponiveis: number[];
  }> {
    const where = this.buildWhereClause(filtros);

    // Buscar todas as vendas que atendem aos filtros
    const vendas = await this.prisma.venda.findMany({
      where,
      select: {
        dataVenda: true,
        valorTotal: true,
      },
    });

    // Log para debug (pode ser removido depois)
    this.logger.debug(
      `getCrescimentoEmpresa: ${vendas.length} vendas encontradas com os filtros aplicados`,
    );

    // Agrupar por ano e mês
    const dadosPorAnoMes = new Map<string, number>();

    vendas.forEach((venda) => {
      // Usar UTC para garantir consistência com os filtros
      const data = new Date(venda.dataVenda);
      const ano = data.getUTCFullYear();
      const mes = data.getUTCMonth() + 1;
      const key = `${ano}-${mes}`;
      const valor = Number(venda.valorTotal) || 0;

      dadosPorAnoMes.set(key, (dadosPorAnoMes.get(key) || 0) + valor);
    });

    // Obter todos os anos únicos
    const anosSet = new Set<number>();
    dadosPorAnoMes.forEach((_, key) => {
      const ano = parseInt(key.split('-')[0]);
      anosSet.add(ano);
    });
    const anosDisponiveis = Array.from(anosSet).sort();

    // Organizar por mês
    const mesesMap = new Map<number, Map<number, number>>();

    dadosPorAnoMes.forEach((valor, key) => {
      const [anoStr, mesStr] = key.split('-');
      const ano = parseInt(anoStr);
      const mes = parseInt(mesStr);

      if (!mesesMap.has(mes)) {
        mesesMap.set(mes, new Map());
      }
      mesesMap.get(mes)!.set(ano, valor);
    });

    // Criar estrutura de resposta
    const meses = Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => {
      const dados: Record<number, { venda: number; evolucao?: number | null }> =
        {};
      const dadosMes = mesesMap.get(mes) || new Map();

      anosDisponiveis.forEach((ano) => {
        const valor = dadosMes.get(ano) || 0;
        dados[ano] = { venda: valor };

        // Calcular evolução ano a ano
        if (anosDisponiveis.length > 1) {
          const anoAnterior = anosDisponiveis[anosDisponiveis.indexOf(ano) - 1];
          if (anoAnterior) {
            const valorAnterior = dadosMes.get(anoAnterior) || 0;
            if (valorAnterior > 0) {
              dados[ano].evolucao =
                ((valor - valorAnterior) / valorAnterior) * 100;
            } else {
              dados[ano].evolucao = valor > 0 ? 100 : null;
            }
          }
        }
      });

      const nomesMeses = [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro',
      ];

      return {
        mes,
        nomeMes: nomesMeses[mes - 1],
        dados,
      };
    });

    // Calcular total geral
    const totalGeral: Record<
      number,
      { venda: number; evolucao?: number | null }
    > = {};
    anosDisponiveis.forEach((ano) => {
      const totalAno = Array.from(dadosPorAnoMes.entries())
        .filter(([key]) => key.startsWith(`${ano}-`))
        .reduce((sum, [, valor]) => sum + valor, 0);

      totalGeral[ano] = { venda: totalAno };

      // Calcular evolução ano a ano
      if (anosDisponiveis.length > 1) {
        const anoAnterior = anosDisponiveis[anosDisponiveis.indexOf(ano) - 1];
        if (anoAnterior) {
          const totalAnoAnterior = Array.from(dadosPorAnoMes.entries())
            .filter(([key]) => key.startsWith(`${anoAnterior}-`))
            .reduce((sum, [, valor]) => sum + valor, 0);

          if (totalAnoAnterior > 0) {
            totalGeral[ano].evolucao =
              ((totalAno - totalAnoAnterior) / totalAnoAnterior) * 100;
          } else {
            totalGeral[ano].evolucao = totalAno > 0 ? 100 : null;
          }
        }
      }
    });

    return {
      meses,
      totalGeral,
      anosDisponiveis,
    };
  }

  /**
   * Busca crescimento por filial (UF)
   */
  async getCrescimentoFilial(filtros?: FilterAnalyticsDto): Promise<{
    filiais: Array<{
      uf: string;
      dados: {
        [ano: number]: { vendas: number; evolucao?: number | null };
      };
    }>;
    totalGeral: {
      [ano: number]: { vendas: number; evolucao?: number | null };
    };
    anosDisponiveis: number[];
  }> {
    const where = this.buildWhereClause(filtros);

    const vendas = await this.prisma.venda.findMany({
      where,
      select: {
        dataVenda: true,
        ufDestino: true,
        valorTotal: true,
      },
    });

    // Agrupar por UF e ano
    const dadosPorUfAno = new Map<string, Map<number, number>>();

    vendas.forEach((venda) => {
      const uf = venda.ufDestino || 'DESCONHECIDO';
      const data = new Date(venda.dataVenda);
      const ano = data.getUTCFullYear();
      const valor = Number(venda.valorTotal) || 0;

      if (!dadosPorUfAno.has(uf)) {
        dadosPorUfAno.set(uf, new Map());
      }
      const dadosUf = dadosPorUfAno.get(uf)!;
      dadosUf.set(ano, (dadosUf.get(ano) || 0) + valor);
    });

    // Obter anos únicos
    const anosSet = new Set<number>();
    dadosPorUfAno.forEach((dados) => {
      dados.forEach((_, ano) => anosSet.add(ano));
    });
    const anosDisponiveis = Array.from(anosSet).sort();

    // Criar estrutura de resposta
    const filiais = Array.from(dadosPorUfAno.entries()).map(([uf, dados]) => {
      const dadosAno: Record<
        number,
        { vendas: number; evolucao?: number | null }
      > = {};

      anosDisponiveis.forEach((ano) => {
        const valor = dados.get(ano) || 0;
        dadosAno[ano] = { vendas: valor };

        // Calcular evolução
        if (anosDisponiveis.length > 1) {
          const anoAnterior = anosDisponiveis[anosDisponiveis.indexOf(ano) - 1];
          if (anoAnterior) {
            const valorAnterior = dados.get(anoAnterior) || 0;
            if (valorAnterior > 0) {
              dadosAno[ano].evolucao =
                ((valor - valorAnterior) / valorAnterior) * 100;
            } else {
              dadosAno[ano].evolucao = valor > 0 ? 100 : null;
            }
          }
        }
      });

      return {
        uf,
        dados: dadosAno,
      };
    });

    // Calcular total geral
    const totalGeral: Record<
      number,
      { vendas: number; evolucao?: number | null }
    > = {};
    anosDisponiveis.forEach((ano) => {
      const totalAno = Array.from(dadosPorUfAno.values())
        .map((dados) => dados.get(ano) || 0)
        .reduce((sum, valor) => sum + valor, 0);

      totalGeral[ano] = { vendas: totalAno };

      // Calcular evolução
      if (anosDisponiveis.length > 1) {
        const anoAnterior = anosDisponiveis[anosDisponiveis.indexOf(ano) - 1];
        if (anoAnterior) {
          const totalAnoAnterior = Array.from(dadosPorUfAno.values())
            .map((dados) => dados.get(anoAnterior) || 0)
            .reduce((sum, valor) => sum + valor, 0);

          if (totalAnoAnterior > 0) {
            totalGeral[ano].evolucao =
              ((totalAno - totalAnoAnterior) / totalAnoAnterior) * 100;
          } else {
            totalGeral[ano].evolucao = totalAno > 0 ? 100 : null;
          }
        }
      }
    });

    return {
      filiais,
      totalGeral,
      anosDisponiveis,
    };
  }

  /**
   * Busca crescimento por marca
   */
  async getCrescimentoMarca(filtros?: FilterAnalyticsDto): Promise<{
    marcas: Array<{
      marca: string;
      dados: {
        [ano: number]: { venda: number; evolucao?: number | null };
      };
    }>;
    totalGeral: {
      [ano: number]: { venda: number; evolucao?: number | null };
    };
    anosDisponiveis: number[];
  }> {
    const where = this.buildWhereClause(filtros);

    const vendas = await this.prisma.venda.findMany({
      where,
      select: {
        dataVenda: true,
        marca: true,
        valorTotal: true,
      },
    });

    // Agrupar por marca e ano
    const dadosPorMarcaAno = new Map<string, Map<number, number>>();

    vendas.forEach((venda) => {
      const marca = venda.marca || 'DESCONHECIDA';
      const data = new Date(venda.dataVenda);
      const ano = data.getUTCFullYear();
      const valor = Number(venda.valorTotal) || 0;

      if (!dadosPorMarcaAno.has(marca)) {
        dadosPorMarcaAno.set(marca, new Map());
      }
      const dadosMarca = dadosPorMarcaAno.get(marca)!;
      dadosMarca.set(ano, (dadosMarca.get(ano) || 0) + valor);
    });

    // Obter anos únicos
    const anosSet = new Set<number>();
    dadosPorMarcaAno.forEach((dados) => {
      dados.forEach((_, ano) => anosSet.add(ano));
    });
    const anosDisponiveis = Array.from(anosSet).sort();

    // Criar estrutura de resposta
    const marcas = Array.from(dadosPorMarcaAno.entries()).map(
      ([marca, dados]) => {
        const dadosAno: Record<
          number,
          { venda: number; evolucao?: number | null }
        > = {};

        anosDisponiveis.forEach((ano) => {
          const valor = dados.get(ano) || 0;
          dadosAno[ano] = { venda: valor };

          // Calcular evolução
          if (anosDisponiveis.length > 1) {
            const anoAnterior =
              anosDisponiveis[anosDisponiveis.indexOf(ano) - 1];
            if (anoAnterior) {
              const valorAnterior = dados.get(anoAnterior) || 0;
              if (valorAnterior > 0) {
                dadosAno[ano].evolucao =
                  ((valor - valorAnterior) / valorAnterior) * 100;
              } else {
                dadosAno[ano].evolucao = valor > 0 ? 100 : null;
              }
            }
          }
        });

        return {
          marca,
          dados: dadosAno,
        };
      },
    );

    // Calcular total geral
    const totalGeral: Record<
      number,
      { venda: number; evolucao?: number | null }
    > = {};
    anosDisponiveis.forEach((ano) => {
      const totalAno = Array.from(dadosPorMarcaAno.values())
        .map((dados) => dados.get(ano) || 0)
        .reduce((sum, valor) => sum + valor, 0);

      totalGeral[ano] = { venda: totalAno };

      // Calcular evolução
      if (anosDisponiveis.length > 1) {
        const anoAnterior = anosDisponiveis[anosDisponiveis.indexOf(ano) - 1];
        if (anoAnterior) {
          const totalAnoAnterior = Array.from(dadosPorMarcaAno.values())
            .map((dados) => dados.get(anoAnterior) || 0)
            .reduce((sum, valor) => sum + valor, 0);

          if (totalAnoAnterior > 0) {
            totalGeral[ano].evolucao =
              ((totalAno - totalAnoAnterior) / totalAnoAnterior) * 100;
          } else {
            totalGeral[ano].evolucao = totalAno > 0 ? 100 : null;
          }
        }
      }
    });

    return {
      marcas,
      totalGeral,
      anosDisponiveis,
    };
  }

  /**
   * Busca crescimento por associado (nome fantasia)
   */
  async getCrescimentoAssociado(
    filtros?: FilterAnalyticsDto,
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    associados: Array<{
      nomeFantasia: string;
      dados: {
        [ano: number]: { venda: number; evolucao?: number | null };
      };
    }>;
    totalGeral: {
      [ano: number]: { venda: number; evolucao?: number | null };
    };
    anosDisponiveis: number[];
    total: number;
    page: number;
    limit: number;
  }> {
    const where = this.buildWhereClause(filtros);

    const vendas = await this.prisma.venda.findMany({
      where,
      select: {
        dataVenda: true,
        nomeFantasia: true,
        valorTotal: true,
      },
    });

    // Agrupar por nome fantasia e ano
    const dadosPorAssociadoAno = new Map<string, Map<number, number>>();

    vendas.forEach((venda) => {
      const nomeFantasia = venda.nomeFantasia || 'DESCONHECIDO';
      const data = new Date(venda.dataVenda);
      const ano = data.getUTCFullYear();
      const valor = Number(venda.valorTotal) || 0;

      if (!dadosPorAssociadoAno.has(nomeFantasia)) {
        dadosPorAssociadoAno.set(nomeFantasia, new Map());
      }
      const dadosAssociado = dadosPorAssociadoAno.get(nomeFantasia)!;
      dadosAssociado.set(ano, (dadosAssociado.get(ano) || 0) + valor);
    });

    // Obter anos únicos
    const anosSet = new Set<number>();
    dadosPorAssociadoAno.forEach((dados) => {
      dados.forEach((_, ano) => anosSet.add(ano));
    });
    const anosDisponiveis = Array.from(anosSet).sort();

    // Criar estrutura de resposta
    const associadosArray = Array.from(dadosPorAssociadoAno.entries()).map(
      ([nomeFantasia, dados]) => {
        const dadosAno: Record<
          number,
          { venda: number; evolucao?: number | null }
        > = {};

        anosDisponiveis.forEach((ano) => {
          const valor = dados.get(ano) || 0;
          dadosAno[ano] = { venda: valor };

          // Calcular evolução
          if (anosDisponiveis.length > 1) {
            const anoAnterior =
              anosDisponiveis[anosDisponiveis.indexOf(ano) - 1];
            if (anoAnterior) {
              const valorAnterior = dados.get(anoAnterior) || 0;
              if (valorAnterior > 0) {
                dadosAno[ano].evolucao =
                  ((valor - valorAnterior) / valorAnterior) * 100;
              } else {
                dadosAno[ano].evolucao = valor > 0 ? 100 : null;
              }
            }
          }
        });

        return {
          nomeFantasia,
          dados: dadosAno,
        };
      },
    );

    // Ordenar por total do último ano disponível
    associadosArray.sort((a, b) => {
      const ultimoAno = anosDisponiveis[anosDisponiveis.length - 1];
      const valorA = a.dados[ultimoAno]?.venda || 0;
      const valorB = b.dados[ultimoAno]?.venda || 0;
      return valorB - valorA;
    });

    // Aplicar paginação
    const total = associadosArray.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const associados = associadosArray.slice(start, end);

    // Calcular total geral
    const totalGeral: Record<
      number,
      { venda: number; evolucao?: number | null }
    > = {};
    anosDisponiveis.forEach((ano) => {
      const totalAno = Array.from(dadosPorAssociadoAno.values())
        .map((dados) => dados.get(ano) || 0)
        .reduce((sum, valor) => sum + valor, 0);

      totalGeral[ano] = { venda: totalAno };

      // Calcular evolução
      if (anosDisponiveis.length > 1) {
        const anoAnterior = anosDisponiveis[anosDisponiveis.indexOf(ano) - 1];
        if (anoAnterior) {
          const totalAnoAnterior = Array.from(dadosPorAssociadoAno.values())
            .map((dados) => dados.get(anoAnterior) || 0)
            .reduce((sum, valor) => sum + valor, 0);

          if (totalAnoAnterior > 0) {
            totalGeral[ano].evolucao =
              ((totalAno - totalAnoAnterior) / totalAnoAnterior) * 100;
          } else {
            totalGeral[ano].evolucao = totalAno > 0 ? 100 : null;
          }
        }
      }
    });

    return {
      associados,
      totalGeral,
      anosDisponiveis,
      total,
      page,
      limit,
    };
  }

  /**
   * Busca estatísticas por filial e associado
   */
  async getFilialAssociadoAnalytics(
    filtros?: FilialAssociadoAnalyticsDto,
  ): Promise<FilialAssociadoResponse> {
    const where: Record<string, unknown> = {};

    // Filtro por ano (único, não array)
    if (filtros?.ano) {
      // Usar UTC para evitar problemas de timezone
      const startDate = new Date(Date.UTC(filtros.ano, 0, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(filtros.ano, 11, 31, 23, 59, 59, 999));
      where.dataVenda = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Filtro por marca
    if (filtros?.marca && filtros.marca.length > 0) {
      where.marca = { in: filtros.marca };
    }

    // Filtro por tipo de operação
    if (filtros?.tipoOperacao && filtros.tipoOperacao.length > 0) {
      where.tipoOperacao = { in: filtros.tipoOperacao };
    }

    // Filtro por UF destino
    if (filtros?.ufDestino && filtros.ufDestino.length > 0) {
      where.ufDestino = { in: filtros.ufDestino };
    }

    // Filtro por nome fantasia
    if (filtros?.nomeFantasia && filtros.nomeFantasia.length > 0) {
      where.nomeFantasia = { in: filtros.nomeFantasia };
    }

    const vendas = await this.prisma.venda.findMany({
      where,
      select: {
        dataVenda: true,
        ufDestino: true,
        nomeFantasia: true,
        valorTotal: true,
      },
    });

    // Agrupar por UF, associado e mês
    const dadosPorUf = new Map<string, Map<string, Map<number, number>>>();

    vendas.forEach((venda) => {
      const uf = venda.ufDestino || 'DESCONHECIDO';
      const associado = venda.nomeFantasia || 'DESCONHECIDO';
      const data = new Date(venda.dataVenda);
      const mes = data.getUTCMonth() + 1;
      const valor = Number(venda.valorTotal) || 0;

      if (!dadosPorUf.has(uf)) {
        dadosPorUf.set(uf, new Map());
      }
      const dadosUf = dadosPorUf.get(uf)!;

      if (!dadosUf.has(associado)) {
        dadosUf.set(associado, new Map());
      }
      const dadosAssociado = dadosUf.get(associado)!;
      dadosAssociado.set(mes, (dadosAssociado.get(mes) || 0) + valor);
    });

    // Criar estrutura de resposta
    const ufs: UFData[] = Array.from(dadosPorUf.entries()).map(
      ([uf, dadosAssociados]) => {
        const monthlyTotals: Record<number, number> = {};
        const associados: AssociadoData[] = [];

        // Processar cada associado
        dadosAssociados.forEach((dadosMensais, associado) => {
          const monthlySales: Record<number, number> = {};
          let totalAssociado = 0;

          // Processar cada mês
          for (let mes = 1; mes <= 12; mes++) {
            const valor = dadosMensais.get(mes) || 0;
            monthlySales[mes] = valor;
            monthlyTotals[mes] = (monthlyTotals[mes] || 0) + valor;
            totalAssociado += valor;
          }

          associados.push({
            nomeFantasia: associado,
            totalGeral: totalAssociado,
            monthlySales,
          });
        });

        // Ordenar associados por total geral
        associados.sort((a, b) => b.totalGeral - a.totalGeral);

        const totalGeralUf = associados.reduce(
          (sum, a) => sum + a.totalGeral,
          0,
        );

        return {
          uf,
          totalGeral: totalGeralUf,
          monthlyTotals,
          associados,
        };
      },
    );

    // Ordenar UFs por total geral
    ufs.sort((a, b) => b.totalGeral - a.totalGeral);

    // Calcular total geral
    const totalGeral: Record<number, number> & { total: number } = {
      total: 0,
    };
    for (let mes = 1; mes <= 12; mes++) {
      totalGeral[mes] = ufs.reduce(
        (sum, uf) => sum + (uf.monthlyTotals[mes] || 0),
        0,
      );
      totalGeral.total += totalGeral[mes];
    }

    const mesesDisponiveis = Array.from({ length: 12 }, (_, i) => i + 1);

    return {
      ufs,
      totalGeral,
      mesesDisponiveis,
    };
  }
}
