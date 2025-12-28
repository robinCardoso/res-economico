import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { EmpresaContexto } from './interfaces/empresa-contexto.interface';

@Injectable()
export class EmpresaContextoService {
  constructor(private prisma: PrismaService) {}

  /**
   * Coleta informações contextuais sobre a empresa para enriquecer análises IA
   * Usa configuração global do modelo de negócio como fallback
   */
  async coletarContextoEmpresa(
    empresaId: string,
  ): Promise<EmpresaContexto | null> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      include: {
        uploads: {
          where: { status: 'CONCLUIDO' },
          orderBy: { createdAt: 'desc' },
          take: 12, // Últimos 12 meses
          select: {
            mes: true,
            ano: true,
            totalLinhas: true,
            createdAt: true,
          },
        },
      },
    });

    if (!empresa) {
      return null;
    }

    // Buscar configuração global do modelo de negócio (se empresa tiver modelo definido)
    let configuracaoGlobal: {
      modeloNegocioDetalhes: unknown;
      contasReceita: unknown;
      contasCustos: unknown;
      custosCentralizados: boolean;
      receitasCentralizadas?: boolean;
    } | null = null;

    if (empresa.modeloNegocio) {
      configuracaoGlobal =
        await this.prisma.configuracaoModeloNegocio.findUnique({
          where: {
            modeloNegocio: empresa.modeloNegocio,
            ativo: true,
          },
        });
    }

    // Usar configuração da empresa se disponível, senão usar configuração global
    const modeloNegocioDetalhes = empresa.modeloNegocioDetalhes
      ? (empresa.modeloNegocioDetalhes as Record<string, unknown>)
      : (configuracaoGlobal?.modeloNegocioDetalhes as
          | Record<string, unknown>
          | undefined);

    const contasReceita = empresa.contasReceita
      ? (empresa.contasReceita as Record<string, string>)
      : (configuracaoGlobal?.contasReceita as
          | Record<string, string>
          | undefined);

    const contasCustos = empresa.contasCustos
      ? (empresa.contasCustos as Record<string, string>)
      : (configuracaoGlobal?.contasCustos as
          | Record<string, string>
          | undefined);

    const custosCentralizados =
      empresa.custosCentralizados ??
      configuracaoGlobal?.custosCentralizados ??
      false;

    const receitasCentralizadas =
      (empresa as { receitasCentralizadas?: boolean }).receitasCentralizadas ??
      configuracaoGlobal?.receitasCentralizadas ??
      false;

    // Calcular estatísticas históricas
    const estatisticas = await this.calcularEstatisticasHistoricas(empresaId);

    return {
      // Informações básicas
      razaoSocial: empresa.razaoSocial,
      nomeFantasia: empresa.filial || undefined,
      cnpj: empresa.cnpj,
      uf: empresa.uf || undefined,
      tipo: empresa.tipo,

      // Informações contextuais
      setor: empresa.setor || undefined,
      porte: empresa.porte || undefined,
      dataFundacao: empresa.dataFundacao || undefined,
      descricao: empresa.descricao || undefined,
      website: empresa.website || undefined,

      // Modelo de negócio (usa configuração global como fallback)
      modeloNegocio: empresa.modeloNegocio || undefined,
      modeloNegocioDetalhes: modeloNegocioDetalhes || undefined,
      contasReceita: contasReceita || undefined,
      custosCentralizados: custosCentralizados,
      receitasCentralizadas: receitasCentralizadas,
      contasCustos: contasCustos || undefined,

      // Estatísticas históricas
      totalUploads: empresa.uploads.length,
      mesesComDados: empresa.uploads.map((u) => `${u.mes}/${u.ano}`),
      periodoMaisAntigo: this.obterPeriodoMaisAntigo(empresa.uploads),
      periodoMaisRecente: this.obterPeriodoMaisRecente(empresa.uploads),

      // Estatísticas financeiras históricas (se disponível)
      estatisticas: estatisticas,

      // Métricas específicas do modelo de negócio
      metricasModelo: await this.calcularMetricasModelo(empresaId, {
        ...empresa,
        contasReceita: contasReceita || null,
        contasCustos: contasCustos || null,
        custosCentralizados: custosCentralizados,
      }),
    };
  }

  private async calcularEstatisticasHistoricas(
    empresaId: string,
  ): Promise<EmpresaContexto['estatisticas']> {
    // Buscar uploads concluídos dos últimos 12 meses
    const uploads = await this.prisma.upload.findMany({
      where: {
        empresaId,
        status: 'CONCLUIDO',
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: {
        linhas: {
          where: {
            tipoConta: '3-DRE',
          },
          select: {
            nomeConta: true,
            saldoAtual: true,
          },
        },
      },
    });

    if (uploads.length === 0) {
      return undefined;
    }

    // Calcular receita média mensal (soma de saldos positivos das linhas de receita)
    const receitasMensais = uploads.map((upload) => {
      const receitaTotal = upload.linhas
        .filter((linha) => {
          const saldo = Number(linha.saldoAtual);
          return saldo > 0;
        })
        .reduce((acc, linha) => acc + Number(linha.saldoAtual), 0);
      return receitaTotal;
    });

    const receitaMediaMensal =
      receitasMensais.length > 0
        ? receitasMensais.reduce((acc, val) => acc + val, 0) /
          receitasMensais.length
        : undefined;

    // Calcular variação média de receita
    let variacaoMediaReceita: number | undefined;
    if (receitasMensais.length > 1) {
      const variacoes: number[] = [];
      for (let i = 1; i < receitasMensais.length; i++) {
        const anterior = receitasMensais[i];
        const atual = receitasMensais[i - 1];
        if (anterior > 0) {
          const variacao = ((atual - anterior) / anterior) * 100;
          variacoes.push(variacao);
        }
      }
      variacaoMediaReceita =
        variacoes.length > 0
          ? variacoes.reduce((acc, val) => acc + val, 0) / variacoes.length
          : undefined;
    }

    // Identificar principais contas por volume médio
    const contasMap = new Map<string, number[]>();
    uploads.forEach((upload) => {
      upload.linhas.forEach((linha) => {
        const saldo = Number(linha.saldoAtual);
        if (saldo !== 0) {
          const nome = linha.nomeConta;
          if (!contasMap.has(nome)) {
            contasMap.set(nome, []);
          }
          contasMap.get(nome)!.push(Math.abs(saldo));
        }
      });
    });

    const principaisContas = Array.from(contasMap.entries())
      .map(([nome, valores]) => ({
        nome,
        saldoMedio: valores.reduce((acc, val) => acc + val, 0) / valores.length,
      }))
      .sort((a, b) => b.saldoMedio - a.saldoMedio)
      .slice(0, 10);

    return {
      receitaMediaMensal,
      variacaoMediaReceita,
      principaisContas:
        principaisContas.length > 0 ? principaisContas : undefined,
    };
  }

  /**
   * Calcula métricas específicas baseadas no modelo de negócio
   * Ex: Para associação, calcula cobertura de custos por mensalidades
   */
  private async calcularMetricasModelo(
    empresaId: string,
    empresa: {
      modeloNegocio: string | null;
      contasReceita: unknown;
      custosCentralizados: boolean | null;
      contasCustos: unknown;
    },
  ): Promise<EmpresaContexto['metricasModelo']> {
    if (empresa.modeloNegocio === 'ASSOCIACAO') {
      const contasReceita = empresa.contasReceita as Record<
        string,
        string
      > | null;
      if (!contasReceita) return null;

      // Buscar valores das contas de receita e custos dos últimos uploads
      const uploads = await this.prisma.upload.findMany({
        where: {
          empresaId,
          status: 'CONCLUIDO',
        },
        orderBy: { createdAt: 'desc' },
        take: 3, // Últimos 3 meses para cálculo
        include: {
          linhas: {
            where: {
              tipoConta: '3-DRE',
            },
            select: {
              classificacao: true,
              conta: true,
              subConta: true,
              nomeConta: true,
              saldoAtual: true,
            },
          },
        },
      });

      if (uploads.length === 0) return null;

      // Calcular valores médios de mensalidades e bonificações
      let mensalidadesTotal = 0;
      let bonificacoesTotal = 0;
      let custosTotal = 0;
      let count = 0;

      uploads.forEach((upload) => {
        upload.linhas.forEach((linha) => {
          const saldo = Number(linha.saldoAtual);
          // Construir identificador completo: classificacao.conta ou classificacao.conta.subConta
          const contaCompleta =
            linha.subConta && linha.subConta.trim() !== ''
              ? `${linha.classificacao}.${linha.conta}.${linha.subConta}`
              : `${linha.classificacao}.${linha.conta}`;

          // Verificar se é conta de mensalidades (comparação exata ou começa com)
          if (contasReceita.mensalidades) {
            const contaMensalidades = contasReceita.mensalidades;
            // Comparação exata ou a conta salva é prefixo da conta completa (para suportar subContas)
            if (
              contaCompleta === contaMensalidades ||
              contaCompleta.startsWith(contaMensalidades + '.')
            ) {
              mensalidadesTotal += Math.abs(saldo);
            }
          }

          // Verificar se é conta de bonificações (comparação exata ou começa com)
          if (contasReceita.bonificacoes) {
            const contaBonificacoes = contasReceita.bonificacoes;
            // Comparação exata ou a conta salva é prefixo da conta completa (para suportar subContas)
            if (
              contaCompleta === contaBonificacoes ||
              contaCompleta.startsWith(contaBonificacoes + '.')
            ) {
              bonificacoesTotal += Math.abs(saldo);
            }
          }

          // Verificar se é conta de custos (se mapeada)
          if (empresa.contasCustos) {
            const contasCustos = empresa.contasCustos as Record<string, string>;
            Object.values(contasCustos).forEach((contaCusto) => {
              const contaCustoStr = contaCusto;
              // Comparação exata ou a conta salva é prefixo da conta completa (para suportar subContas)
              if (
                (contaCompleta === contaCustoStr ||
                  contaCompleta.startsWith(contaCustoStr + '.')) &&
                saldo < 0
              ) {
                custosTotal += Math.abs(saldo);
              }
            });
          }
        });
        count++;
      });

      if (count === 0) return null;

      const mensalidadesMedia = mensalidadesTotal / count;
      const bonificacoesMedia = bonificacoesTotal / count;
      const custosMedia = custosTotal / count;

      const metricas = {
        coberturaCustosPorMensalidades:
          custosMedia > 0 ? (mensalidadesMedia / custosMedia) * 100 : undefined,
        proporcaoMensalidadesBonificacoes:
          bonificacoesMedia > 0
            ? (mensalidadesMedia / bonificacoesMedia) * 100
            : mensalidadesMedia > 0
              ? 100
              : undefined,
        custoPorAssociado: undefined as number | undefined, // Requer informação de número de associados
        margemSeguranca:
          custosMedia > 0
            ? ((mensalidadesMedia + bonificacoesMedia - custosMedia) /
                custosMedia) *
              100
            : undefined,
      };

      return metricas;
    }

    return null;
  }

  private obterPeriodoMaisAntigo(
    uploads: Array<{ mes: number; ano: number }>,
  ): string | undefined {
    if (uploads.length === 0) return undefined;

    const maisAntigo = uploads.reduce((antigo, atual) => {
      if (
        atual.ano < antigo.ano ||
        (atual.ano === antigo.ano && atual.mes < antigo.mes)
      ) {
        return atual;
      }
      return antigo;
    });

    return `${String(maisAntigo.mes).padStart(2, '0')}/${maisAntigo.ano}`;
  }

  private obterPeriodoMaisRecente(
    uploads: Array<{ mes: number; ano: number }>,
  ): string | undefined {
    if (uploads.length === 0) return undefined;

    const maisRecente = uploads.reduce((recente, atual) => {
      if (
        atual.ano > recente.ano ||
        (atual.ano === recente.ano && atual.mes > recente.mes)
      ) {
        return atual;
      }
      return recente;
    });

    return `${String(maisRecente.mes).padStart(2, '0')}/${maisRecente.ano}`;
  }
}
