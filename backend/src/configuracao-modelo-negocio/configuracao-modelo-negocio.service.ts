import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateConfiguracaoModeloNegocioDto } from './dto/create-configuracao.dto';
import { UpdateConfiguracaoModeloNegocioDto } from './dto/update-configuracao.dto';
import { TestarConfiguracaoDto } from './dto/testar-configuracao.dto';
import { Prisma, ModeloNegocio } from '@prisma/client';

@Injectable()
export class ConfiguracaoModeloNegocioService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateConfiguracaoModeloNegocioDto) {
    // Verificar se já existe configuração para este modelo
    const existente = await this.prisma.configuracaoModeloNegocio.findUnique({
      where: { modeloNegocio: dto.modeloNegocio },
    });

    if (existente) {
      throw new ConflictException(
        `Já existe uma configuração para o modelo de negócio ${dto.modeloNegocio}`,
      );
    }

    return this.prisma.configuracaoModeloNegocio.create({
      data: {
        modeloNegocio: dto.modeloNegocio,
        modeloNegocioDetalhes:
          dto.modeloNegocioDetalhes as Prisma.InputJsonValue,
        contasReceita: dto.contasReceita as Prisma.InputJsonValue,
        contasCustos: dto.contasCustos as Prisma.InputJsonValue,
        custosCentralizados: dto.custosCentralizados,
        receitasCentralizadas: dto.receitasCentralizadas,
        descricao: dto.descricao,
        ativo: dto.ativo ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.configuracaoModeloNegocio.findMany({
      orderBy: { modeloNegocio: 'asc' },
    });
  }

  async findOne(modeloNegocio: string) {
    const configuracao = await this.prisma.configuracaoModeloNegocio.findUnique(
      {
        where: { modeloNegocio: modeloNegocio as ModeloNegocio },
      },
    );

    if (!configuracao) {
      throw new NotFoundException(
        `Configuração não encontrada para o modelo de negócio ${modeloNegocio}`,
      );
    }

    return configuracao;
  }

  async update(modeloNegocio: string, dto: UpdateConfiguracaoModeloNegocioDto) {
    // Verificar se existe
    await this.findOne(modeloNegocio);

    const updateData: Prisma.ConfiguracaoModeloNegocioUpdateInput = {};

    if (dto.modeloNegocioDetalhes !== undefined) {
      updateData.modeloNegocioDetalhes =
        dto.modeloNegocioDetalhes as Prisma.InputJsonValue;
    }

    if (dto.contasReceita !== undefined) {
      updateData.contasReceita = dto.contasReceita as Prisma.InputJsonValue;
    }

    if (dto.contasCustos !== undefined) {
      updateData.contasCustos = dto.contasCustos as Prisma.InputJsonValue;
    }

    if (dto.custosCentralizados !== undefined) {
      updateData.custosCentralizados = dto.custosCentralizados;
    }

    if (dto.receitasCentralizadas !== undefined) {
      updateData.receitasCentralizadas = dto.receitasCentralizadas;
    }

    if (dto.descricao !== undefined) {
      updateData.descricao = dto.descricao;
    }

    if (dto.ativo !== undefined) {
      updateData.ativo = dto.ativo;
    }

    return this.prisma.configuracaoModeloNegocio.update({
      where: { modeloNegocio: modeloNegocio as ModeloNegocio },
      data: updateData,
    });
  }

  async remove(modeloNegocio: string) {
    await this.findOne(modeloNegocio);

    return this.prisma.configuracaoModeloNegocio.delete({
      where: { modeloNegocio: modeloNegocio as ModeloNegocio },
    });
  }

  /**
   * Valida uma configuração verificando se as contas existem nos uploads
   */
  async validarConfiguracao(
    modeloNegocio: string,
    empresaId?: string,
  ): Promise<{
    valido: boolean;
    contasEncontradas: Array<{
      tipo: string;
      conta: string;
      encontrada: boolean;
      ocorrencias: number;
      ultimaOcorrencia?: string;
    }>;
    estatisticas: {
      totalEmpresas: number;
      totalUploads: number;
      empresasComModelo: number;
    };
    sugestoes: string[];
  }> {
    const configuracao = await this.findOne(modeloNegocio);

    const contasReceita = (configuracao.contasReceita || {}) as Record<
      string,
      string
    >;
    const contasCustos = (configuracao.contasCustos || {}) as Record<
      string,
      string
    >;

    // Buscar empresas com este modelo
    const whereEmpresa: Prisma.EmpresaWhereInput = {
      modeloNegocio: modeloNegocio as ModeloNegocio,
    };
    if (empresaId) {
      whereEmpresa.id = empresaId;
    }

    const empresas = await this.prisma.empresa.findMany({
      where: whereEmpresa,
      select: { id: true },
    });

    const empresaIds = empresas.map((e) => e.id);

    // Buscar uploads das empresas
    const uploads = await this.prisma.upload.findMany({
      where: {
        empresaId: empresaId ? empresaId : { in: empresaIds },
        status: { in: ['CONCLUIDO', 'COM_ALERTAS'] },
      },
      select: {
        id: true,
        mes: true,
        ano: true,
        createdAt: true,
        linhas: {
          where: {
            tipoConta: '3-DRE',
          },
          select: {
            classificacao: true,
            conta: true,
            subConta: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limitar para performance
    });

    // Coletar todas as contas configuradas
    const todasContas: Array<{ tipo: string; conta: string }> = [];

    Object.entries(contasReceita).forEach(([tipo, conta]) => {
      if (conta) {
        todasContas.push({ tipo: `Receita: ${tipo}`, conta });
      }
    });

    Object.entries(contasCustos).forEach(([tipo, conta]) => {
      if (conta) {
        todasContas.push({ tipo: `Custo: ${tipo}`, conta });
      }
    });

    // Verificar quais contas foram encontradas
    const contasEncontradas = todasContas.map(({ tipo, conta }) => {
      let ocorrencias = 0;
      let ultimaOcorrencia: string | undefined;

      uploads.forEach((upload) => {
        upload.linhas.forEach((linha) => {
          const contaCompleta =
            linha.subConta && linha.subConta.trim() !== ''
              ? `${linha.classificacao}.${linha.conta}.${linha.subConta}`
              : `${linha.classificacao}.${linha.conta}`;

          // Verificar se a conta configurada corresponde (exata ou prefixo)
          if (
            contaCompleta === conta ||
            contaCompleta.startsWith(conta + '.')
          ) {
            ocorrencias++;
            const dataOcorrencia = `${upload.mes}/${upload.ano}`;
            if (!ultimaOcorrencia || dataOcorrencia > ultimaOcorrencia) {
              ultimaOcorrencia = dataOcorrencia;
            }
          }
        });
      });

      return {
        tipo,
        conta,
        encontrada: ocorrencias > 0,
        ocorrencias,
        ultimaOcorrencia,
      };
    });

    // Gerar sugestões
    const sugestoes: string[] = [];
    const contasNaoEncontradas = contasEncontradas.filter((c) => !c.encontrada);
    if (contasNaoEncontradas.length > 0) {
      sugestoes.push(
        `As seguintes contas não foram encontradas nos uploads: ${contasNaoEncontradas.map((c) => c.conta).join(', ')}`,
      );
    }

    if (uploads.length === 0) {
      sugestoes.push(
        'Nenhum upload encontrado. Faça upload de dados para validar as contas.',
      );
    }

    if (empresas.length === 0) {
      sugestoes.push(
        `Nenhuma empresa encontrada com modelo ${modeloNegocio}. Configure empresas com este modelo para validar.`,
      );
    }

    const valido =
      contasEncontradas.length > 0 &&
      contasEncontradas.every((c) => c.encontrada) &&
      uploads.length > 0;

    return {
      valido,
      contasEncontradas,
      estatisticas: {
        totalEmpresas: empresas.length,
        totalUploads: uploads.length,
        empresasComModelo: empresas.length,
      },
      sugestoes,
    };
  }

  /**
   * Testa uma configuração aplicando-a temporariamente e calculando métricas
   */
  async testarConfiguracao(
    modeloNegocio: string,
    dto: TestarConfiguracaoDto,
  ): Promise<{
    metricas: {
      totalMensalidades?: number;
      totalBonificacoes?: number;
      totalCustos?: number;
      coberturaCustosPorMensalidades?: number;
      proporcaoMensalidadesBonificacoes?: number;
    };
    dadosUsados: {
      totalUploads: number;
      periodo: string;
      empresa?: string;
    };
    sucesso: boolean;
    mensagem: string;
  }> {
    // Buscar configuração base
    const configuracaoBase = await this.findOne(modeloNegocio);

    // Usar dados do DTO ou da configuração base
    const contasReceita =
      (dto.contasReceita as Record<string, string>) ||
      (configuracaoBase.contasReceita as Record<string, string>);
    const contasCustos =
      (dto.contasCustos as Record<string, string>) ||
      (configuracaoBase.contasCustos as Record<string, string>);

    // Buscar empresa específica ou empresas com o modelo
    const whereEmpresa: Prisma.EmpresaWhereInput = dto.empresaId
      ? { id: dto.empresaId }
      : { modeloNegocio: modeloNegocio as ModeloNegocio };

    const empresas = await this.prisma.empresa.findMany({
      where: whereEmpresa,
      select: { id: true, razaoSocial: true },
      take: 1, // Usar apenas a primeira para teste
    });

    if (empresas.length === 0) {
      return {
        metricas: {},
        dadosUsados: {
          totalUploads: 0,
          periodo: 'N/A',
        },
        sucesso: false,
        mensagem: 'Nenhuma empresa encontrada para teste.',
      };
    }

    const empresa = empresas[0];

    // Buscar uploads recentes da empresa
    const uploads = await this.prisma.upload.findMany({
      where: {
        empresaId: empresa.id,
        status: { in: ['CONCLUIDO', 'COM_ALERTAS'] },
      },
      include: {
        linhas: {
          where: {
            tipoConta: '3-DRE',
          },
          select: {
            classificacao: true,
            conta: true,
            subConta: true,
            saldoAtual: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 3, // Últimos 3 meses
    });

    if (uploads.length === 0) {
      return {
        metricas: {},
        dadosUsados: {
          totalUploads: 0,
          periodo: 'N/A',
          empresa: empresa.razaoSocial,
        },
        sucesso: false,
        mensagem: 'Nenhum upload encontrado para a empresa selecionada.',
      };
    }

    // Calcular métricas
    let mensalidadesTotal = 0;
    let bonificacoesTotal = 0;
    let custosTotal = 0;

    uploads.forEach((upload) => {
      upload.linhas.forEach((linha) => {
        const saldo = Number(linha.saldoAtual);
        const contaCompleta =
          linha.subConta && linha.subConta.trim() !== ''
            ? `${linha.classificacao}.${linha.conta}.${linha.subConta}`
            : `${linha.classificacao}.${linha.conta}`;

        // Mensalidades
        if (contasReceita.mensalidades) {
          const contaMensalidades = contasReceita.mensalidades;
          if (
            contaCompleta === contaMensalidades ||
            contaCompleta.startsWith(contaMensalidades + '.')
          ) {
            mensalidadesTotal += Math.abs(saldo);
          }
        }

        // Bonificações
        if (contasReceita.bonificacoes) {
          const contaBonificacoes = contasReceita.bonificacoes;
          if (
            contaCompleta === contaBonificacoes ||
            contaCompleta.startsWith(contaBonificacoes + '.')
          ) {
            bonificacoesTotal += Math.abs(saldo);
          }
        }

        // Custos
        if (contasCustos) {
          Object.values(contasCustos).forEach((contaCusto) => {
            if (
              (contaCompleta === contaCusto ||
                contaCompleta.startsWith(contaCusto + '.')) &&
              saldo < 0
            ) {
              custosTotal += Math.abs(saldo);
            }
          });
        }
      });
    });

    // Calcular métricas derivadas
    const coberturaCustosPorMensalidades =
      custosTotal > 0 ? (mensalidadesTotal / custosTotal) * 100 : 0;
    const totalReceita = mensalidadesTotal + bonificacoesTotal;
    const proporcaoMensalidadesBonificacoes =
      totalReceita > 0 ? (mensalidadesTotal / totalReceita) * 100 : 0;

    const periodoMaisAntigo = uploads[uploads.length - 1];
    const periodoMaisRecente = uploads[0];
    const periodo = `${periodoMaisAntigo.mes}/${periodoMaisAntigo.ano} - ${periodoMaisRecente.mes}/${periodoMaisRecente.ano}`;

    return {
      metricas: {
        totalMensalidades: mensalidadesTotal,
        totalBonificacoes: bonificacoesTotal,
        totalCustos: custosTotal,
        coberturaCustosPorMensalidades,
        proporcaoMensalidadesBonificacoes,
      },
      dadosUsados: {
        totalUploads: uploads.length,
        periodo,
        empresa: empresa.razaoSocial,
      },
      sucesso: true,
      mensagem: 'Teste realizado com sucesso.',
    };
  }
}
