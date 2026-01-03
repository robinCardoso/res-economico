import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateProcessoDto } from './dto/create-processo.dto';
import { UpdateProcessoDto } from './dto/update-processo.dto';
import { FilterProcessosDto } from './dto/filter-processos.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProcessosService {
  constructor(private prisma: PrismaService) {}

  /**
   * Gera número de controle único no formato YYYYMMSSSS
   */
  private async generateNumeroControle(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const currentMonth = (new Date().getMonth() + 1)
      .toString()
      .padStart(2, '0');
    const currentPattern = `${currentYear}${currentMonth}`;

    // Buscar o maior número de controle do mês atual
    const lastProcesso = await this.prisma.processo.findFirst({
      where: {
        numeroControle: {
          startsWith: currentPattern,
        },
      },
      orderBy: {
        numeroControle: 'desc',
      },
      select: {
        numeroControle: true,
      },
    });

    let nextSequence = 1;
    if (lastProcesso?.numeroControle) {
      const sequenceStr = lastProcesso.numeroControle.slice(-4);
      const sequence = parseInt(sequenceStr, 10);
      if (!isNaN(sequence)) {
        nextSequence = sequence + 1;
      }
    }

    return `${currentPattern}${nextSequence.toString().padStart(4, '0')}`;
  }

  /**
   * Gera protocolo único no formato UF-NUMERO-ANO
   */
  private async generateProtocolo(uf: string = 'SC'): Promise<string> {
    const anoAtual = new Date().getFullYear();
    const numeroInicial = 1;

    // Buscar último protocolo do ano atual
    const lastProcesso = await this.prisma.processo.findFirst({
      where: {
        protocolo: {
          contains: `-${anoAtual}`,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        protocolo: true,
      },
    });

    let proximoNumero = numeroInicial;
    if (lastProcesso?.protocolo) {
      const match = lastProcesso.protocolo.match(/-(\d+)-/);
      if (match) {
        proximoNumero = parseInt(match[1], 10) + 1;
      }
    }

    return `${uf}-${proximoNumero.toString().padStart(6, '0')}-${anoAtual}`;
  }

  /**
   * Cria um novo processo
   */
  async create(createDto: CreateProcessoDto, userId: string) {
    // Validar se é Garantia/Devolução e tem itens
    const tipoProcesso = this.mapTipoProcesso(createDto.tipo);
    if (
      (tipoProcesso === 'GARANTIA' || tipoProcesso === 'DEVOLUCAO') &&
      (!createDto.itens || createDto.itens.length === 0)
    ) {
      throw new BadRequestException(
        'Processos de Garantia ou Devolução devem ter pelo menos um item',
      );
    }

    // Validar se é Reclamação e tem título/descrição
    if (tipoProcesso === 'RECLAMACAO') {
      if (!createDto.titulo || !createDto.descricao || !createDto.categoria) {
        throw new BadRequestException(
          'Processos de Reclamação devem ter título, descrição e categoria',
        );
      }
    }

    // Validar imagens para garantias
    if (tipoProcesso === 'GARANTIA') {
      const allItemsHaveImages = createDto.itens?.every(
        (item) => item.imagesDataUri && item.imagesDataUri.length > 0,
      );
      if (!allItemsHaveImages) {
        throw new BadRequestException(
          'Para processos de garantia, todos os itens devem ter pelo menos uma imagem',
        );
      }
    }

    const numeroControle = await this.generateNumeroControle();
    const protocolo = await this.generateProtocolo(createDto.uf);

    // Criar processo
    const processo = await this.prisma.processo.create({
      data: {
        numeroControle,
        protocolo,
        userId,
        empresaId: createDto.entidadeId,
        tipo: this.mapTipoProcesso(createDto.tipo) as any,
        situacao: 'AGUARDANDO_ANALISE',
        nomeClienteAssociado: createDto.nomeClienteAssociado,
        razaoSocial: createDto.razaoSocial,
        titulo: createDto.titulo,
        descricao: createDto.descricao,
        categoria: createDto.categoria
          ? (this.mapCategoriaReclamacao(createDto.categoria) as any)
          : undefined,
        prioridade: createDto.prioridade
          ? (this.mapPrioridadeProcesso(createDto.prioridade) as any)
          : undefined,
        contatoRetorno: createDto.contatoRetorno,
        uf: createDto.uf,
        cidade: createDto.cidade,
        fabrica: createDto.fabrica,
        importacao: createDto.importacao,
        ano: createDto.ano,
        reclamacao: createDto.reclamacao,
        itens: createDto.itens
          ? {
              create: createDto.itens.map((item) => ({
                nf: item.nf,
                referencia: item.referencia,
                descricaoProduto: item.descricaoProduto,
                qtd: item.qtd,
                valorUnit: item.valorUnit,
                detalhes: item.detalhes,
                marca: item.marca,
                dataInstalacao: item.dataInstalacao
                  ? new Date(item.dataInstalacao)
                  : null,
                dataRemocao: item.dataRemocao
                  ? new Date(item.dataRemocao)
                  : null,
                kmInstalacao: item.kmInstalacao,
                kmRemocao: item.kmRemocao,
                modeloVeiculo: item.modeloVeiculo,
                anoVeiculo: item.anoVeiculo,
                marcaVeiculo: item.marcaVeiculo,
                temCustoGarantia: item.temCustoGarantia || false,
                valorCusto: item.custoGarantia?.valor || null,
                infoPecas: item.custoGarantia?.infoPecas || null,
              })),
            }
          : undefined,
      },
      include: {
        itens: true,
        anexos: true,
        historico: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
            filial: true,
            uf: true,
          },
        },
      },
    });

    // Criar entrada inicial no histórico
    await this.prisma.processoHistorico.create({
      data: {
        processoId: processo.id,
        acao: 'CRIADO',
        descricao: `Processo ${processo.tipo} criado com protocolo ${processo.protocolo}`,
        usuarioId: userId,
      },
    });

    return {
      success: true,
      message: 'Processo criado com sucesso',
      processoId: processo.id,
      numeroControle: processo.numeroControle,
      protocolo: processo.protocolo,
    };
  }

  /**
   * Busca processos com filtros e paginação
   */
  async findAll(filterDto: FilterProcessosDto) {
    const where: any = {
      userId: filterDto.userEmail,
    };

    // Aplicar filtros
    if (filterDto.situacao) {
      where.situacao = this.mapSituacaoProcesso(filterDto.situacao);
    }

    if (filterDto.tipo) {
      where.tipo = this.mapTipoProcesso(filterDto.tipo);
    }

    if (filterDto.uf) {
      where.uf = filterDto.uf;
    }

    if (filterDto.fabrica) {
      where.fabrica = {
        contains: filterDto.fabrica,
        mode: 'insensitive',
      };
    }

    if (filterDto.numeroControle) {
      where.numeroControle = filterDto.numeroControle;
    }

    if (filterDto.protocolo) {
      where.protocolo = {
        contains: filterDto.protocolo,
        mode: 'insensitive',
      };
    }

    if (filterDto.dataInicio || filterDto.dataFim) {
      where.createdAt = {};
      if (filterDto.dataInicio) {
        where.createdAt.gte = new Date(filterDto.dataInicio);
      }
      if (filterDto.dataFim) {
        where.createdAt.lte = new Date(filterDto.dataFim);
      }
    }

    const limite = filterDto.limite || 20;
    const offset = filterDto.offset || 0;

    const [processos, total] = await Promise.all([
      this.prisma.processo.findMany({
        where,
        include: {
          itens: true,
          anexos: true,
          historico: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 10, // Últimos 10 registros
          },
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          empresa: {
            select: {
              id: true,
              razaoSocial: true,
              filial: true,
              uf: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limite,
        skip: offset,
      }),
      this.prisma.processo.count({ where }),
    ]);

    const totalPaginas = Math.ceil(total / limite);
    const paginaAtual = Math.floor(offset / limite) + 1;

    return {
      success: true,
      message: 'Processos encontrados',
      processos: processos.map((p) => this.mapProcessoCompleto(p)),
      total,
      paginaAtual,
      totalPaginas,
    };
  }

  /**
   * Busca um processo por ID
   */
  async findOne(id: string, userEmail: string) {
    const processo = await this.prisma.processo.findFirst({
      where: {
        id,
        userId: userEmail,
      },
      include: {
        itens: true,
        anexos: true,
        historico: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
            filial: true,
            uf: true,
          },
        },
      },
    });

    if (!processo) {
      throw new NotFoundException('Processo não encontrado');
    }

    return {
      success: true,
      processo: this.mapProcessoCompleto(processo),
    };
  }

  /**
   * Atualiza um processo
   */
  async update(updateDto: UpdateProcessoDto, userId: string) {
    const processo = await this.prisma.processo.findFirst({
      where: {
        id: updateDto.processoId,
        userId: updateDto.userEmail,
      },
    });

    if (!processo) {
      throw new NotFoundException('Processo não encontrado');
    }

    const dadosAnteriores = {
      situacao: processo.situacao,
      responsavel: processo.responsavel,
      prazoResolucao: processo.prazoResolucao,
      dataSolucao: processo.dataSolucao,
      comentarios: processo.comentarios,
    };

    const updateData: Prisma.ProcessoUpdateInput = {};

    if (updateDto.situacao) {
      updateData.situacao = this.mapSituacaoProcesso(updateDto.situacao) as any;
    }

    if (updateDto.responsavel !== undefined) {
      updateData.responsavel = updateDto.responsavel;
    }

    if (updateDto.prazoResolucao) {
      updateData.prazoResolucao = new Date(updateDto.prazoResolucao);
    }

    if (updateDto.dataSolucao) {
      updateData.dataSolucao = new Date(updateDto.dataSolucao);
    }

    if (updateDto.comentarios !== undefined) {
      updateData.comentarios = updateDto.comentarios;
    }

    const processoAtualizado = await this.prisma.processo.update({
      where: { id: updateDto.processoId },
      data: updateData,
    });

    // Criar entrada no histórico
    if (updateDto.novaEntradaHistorico) {
      await this.prisma.processoHistorico.create({
        data: {
          processoId: processoAtualizado.id,
          acao: updateDto.novaEntradaHistorico.acao || 'ATUALIZADO',
          descricao:
            updateDto.novaEntradaHistorico.descricao || 'Processo atualizado',
          usuarioId: userId,
          usuarioNome: updateDto.novaEntradaHistorico.usuarioNome,
          dadosAnteriores: dadosAnteriores as Prisma.InputJsonValue,
          dadosNovos: updateData as Prisma.InputJsonValue,
          metadata: updateDto.novaEntradaHistorico.metadata,
        },
      });
    }

    return {
      success: true,
      message: 'Processo atualizado com sucesso',
    };
  }

  // Métodos auxiliares de mapeamento
  private mapTipoProcesso(tipo: string): string {
    const mapping: Record<string, string> = {
      Garantia: 'GARANTIA',
      Devolução: 'DEVOLUCAO',
      Reclamação: 'RECLAMACAO',
    };
    const mapped = mapping[tipo] || tipo.toUpperCase();
    return mapped;
  }

  private mapSituacaoProcesso(situacao: string): string {
    const mapping: Record<string, string> = {
      'Aguardando Análise': 'AGUARDANDO_ANALISE',
      'Em Análise': 'EM_ANALISE',
      Aprovado: 'APROVADO',
      Rejeitado: 'REJEITADO',
      'Em Processamento': 'EM_PROCESSAMENTO',
      Concluído: 'CONCLUIDO',
      Cancelado: 'CANCELADO',
    };
    const mapped = mapping[situacao] || situacao.toUpperCase();
    return mapped;
  }

  private mapCategoriaReclamacao(categoria: string): string {
    const mapping: Record<string, string> = {
      atendimento: 'ATENDIMENTO',
      produtos: 'PRODUTOS',
      logistica: 'LOGISTICA',
      financeiro: 'FINANCEIRO',
      tecnico: 'TECNICO',
      comunicacao: 'COMUNICACAO',
    };
    const mapped = mapping[categoria.toLowerCase()] || categoria.toUpperCase();
    return mapped;
  }

  private mapPrioridadeProcesso(prioridade: string): string {
    const mapping: Record<string, string> = {
      baixa: 'BAIXA',
      media: 'MEDIA',
      alta: 'ALTA',
    };
    const mapped =
      mapping[prioridade.toLowerCase()] || prioridade.toUpperCase();
    return mapped;
  }

  private mapProcessoCompleto(processo: any) {
    return {
      id: processo.id,
      numeroControle: processo.numeroControle,
      protocolo: processo.protocolo,
      userId: processo.userId,
      entidadeId: processo.empresaId,
      tipo: this.unmapTipoProcesso(processo.tipo),
      situacao: this.unmapSituacaoProcesso(processo.situacao),
      nomeClienteAssociado: processo.nomeClienteAssociado,
      razaoSocial: processo.razaoSocial,
      titulo: processo.titulo,
      descricao: processo.descricao,
      categoria: processo.categoria
        ? processo.categoria.toLowerCase()
        : undefined,
      prioridade: processo.prioridade
        ? processo.prioridade.toLowerCase()
        : undefined,
      contatoRetorno: processo.contatoRetorno,
      entidade: processo.empresa
        ? {
            id: processo.empresa.id,
            nomeRazaoSocial: processo.empresa.razaoSocial,
            filial: processo.empresa.filial,
            uf: processo.empresa.uf,
          }
        : undefined,
      dataSolicitacao: processo.createdAt.toISOString(),
      prazoResolucao: processo.prazoResolucao?.toISOString(),
      dataSolucao: processo.dataSolucao?.toISOString(),
      uf: processo.uf,
      cidade: processo.cidade,
      responsavel: processo.responsavel,
      fabrica: processo.fabrica,
      importacao: processo.importacao,
      ano: processo.ano,
      reclamacao: processo.reclamacao,
      comentarios: processo.comentarios,
      created_at: processo.createdAt.toISOString(),
      updated_at: processo.updatedAt.toISOString(),
      itens: processo.itens?.map((item) => ({
        id: item.id,
        nf: item.nf,
        referencia: item.referencia,
        descricaoProduto: item.descricaoProduto,
        qtd: item.qtd,
        valorUnit: Number(item.valorUnit),
        detalhes: item.detalhes,
        dataInstalacao: item.dataInstalacao?.toISOString(),
        dataRemocao: item.dataRemocao?.toISOString(),
        kmInstalacao: item.kmInstalacao,
        kmRemocao: item.kmRemocao,
        modeloVeiculo: item.modeloVeiculo,
        anoVeiculo: item.anoVeiculo,
        marcaVeiculo: item.marcaVeiculo,
        temCustoGarantia: item.temCustoGarantia,
        valorCusto: item.valorCusto ? Number(item.valorCusto) : undefined,
        infoPecas: item.infoPecas,
        created_at: item.createdAt.toISOString(),
        updated_at: item.updatedAt.toISOString(),
      })),
      anexos: processo.anexos?.map((anexo) => ({
        id: anexo.id,
        processoId: anexo.processoId,
        nomeArquivo: anexo.nomeArquivo,
        urlArquivo: anexo.urlArquivo,
        tipoArquivo: anexo.tipoArquivo,
        tamanhoArquivo: anexo.tamanhoArquivo,
        mimeType: anexo.mimeType,
        uploadedAt: anexo.uploadedAt.toISOString(),
        uploadedBy: anexo.uploadedBy,
        metadata: anexo.metadata,
      })),
      historico: processo.historico?.map((hist) => ({
        id: hist.id,
        processoId: hist.processoId,
        acao: hist.acao,
        descricao: hist.descricao,
        usuarioId: hist.usuarioId,
        usuarioNome: hist.usuarioNome,
        dadosAnteriores: hist.dadosAnteriores,
        dadosNovos: hist.dadosNovos,
        createdAt: hist.createdAt.toISOString(),
        metadata: hist.metadata,
      })),
    };
  }

  private unmapTipoProcesso(tipo: string): string {
    const mapping: Record<string, string> = {
      GARANTIA: 'Garantia',
      DEVOLUCAO: 'Devolução',
      RECLAMACAO: 'Reclamação',
    };
    return mapping[tipo] || tipo;
  }

  private unmapSituacaoProcesso(situacao: string): string {
    const mapping: Record<string, string> = {
      AGUARDANDO_ANALISE: 'Aguardando Análise',
      EM_ANALISE: 'Em Análise',
      APROVADO: 'Aprovado',
      REJEITADO: 'Rejeitado',
      EM_PROCESSAMENTO: 'Em Processamento',
      CONCLUIDO: 'Concluído',
      CANCELADO: 'Cancelado',
    };
    return mapping[situacao] || situacao;
  }
}
