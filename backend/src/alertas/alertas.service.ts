import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { AuditoriaService } from '../core/auditoria/auditoria.service';
import { FilterAlertasDto } from './dto/filter-alertas.dto';
import { UpdateAlertaDto } from './dto/update-alerta.dto';

@Injectable()
export class AlertasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  findAll(filters?: FilterAlertasDto) {
    const where: Record<string, unknown> = {};

    // Filtro por status
    if (filters?.status) {
      where.status = filters.status;
    }

    // Filtro por tipo
    if (filters?.tipo) {
      where.tipo = filters.tipo;
    }

    // Filtro por severidade
    if (filters?.severidade) {
      where.severidade = filters.severidade;
    }

    // Filtro por empresa
    if (filters?.empresaId) {
      where.upload = {
        empresaId: filters.empresaId,
      };
    }

    // Filtro por upload
    if (filters?.uploadId) {
      where.uploadId = filters.uploadId;
    }

    // Filtro por alerta específico
    if (filters?.alertaId) {
      where.id = filters.alertaId;
    }

    // Filtro por tipo de conta
    if (filters?.tipoConta) {
      where.linha = {
        ...(where.linha || {}),
        tipoConta: filters.tipoConta,
      };
    }

    // Busca por texto (mensagem, classificação, nome da conta)
    if (filters?.busca) {
      // Se já existe um filtro de linha (tipoConta), combinar com busca
      if (where.linha) {
        const linhaFilter = where.linha as Record<string, unknown>;
        const tipoContaValue = linhaFilter.tipoConta;
        // Buscar na mensagem OU na linha (com tipoConta correto)
        where.OR = [
          { mensagem: { contains: filters.busca, mode: 'insensitive' } },
          {
            linha: {
              tipoConta: tipoContaValue,
              OR: [
                {
                  classificacao: {
                    contains: filters.busca,
                    mode: 'insensitive',
                  },
                },
                { nomeConta: { contains: filters.busca, mode: 'insensitive' } },
              ],
            },
          },
        ];
        delete where.linha;
      } else {
        // Sem filtro de linha, buscar em linha também
        where.OR = [
          { mensagem: { contains: filters.busca, mode: 'insensitive' } },
          {
            linha: {
              classificacao: { contains: filters.busca, mode: 'insensitive' },
            },
          },
          {
            linha: {
              nomeConta: { contains: filters.busca, mode: 'insensitive' },
            },
          },
        ];
      }
    }

    return this.prisma.alerta.findMany({
      where,
      include: {
        upload: {
          include: {
            empresa: true,
          },
        },
        linha: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, dto: UpdateAlertaDto, userId?: string) {
    const alerta = await this.prisma.alerta.findUnique({
      where: { id },
    });

    if (!alerta) {
      throw new NotFoundException('Alerta não encontrado');
    }

    const updateData: Record<string, unknown> = {
      status: dto.status,
    };

    // Se estiver marcando como resolvido, atualizar resolvedAt
    if (dto.status === 'RESOLVIDO' && alerta.status !== 'RESOLVIDO') {
      updateData.resolvedAt = new Date();
    }

    // Se estiver mudando de resolvido para outro status, limpar resolvedAt
    if (dto.status !== 'RESOLVIDO' && alerta.status === 'RESOLVIDO') {
      updateData.resolvedAt = null;
    }

    const alertaAtualizado = await this.prisma.alerta.update({
      where: { id },
      data: updateData,
      include: {
        upload: {
          include: {
            empresa: true,
          },
        },
        linha: true,
      },
    });

    // Registrar auditoria
    if (userId) {
      await this.auditoria.registrarAlerta(
        userId,
        id,
        `ATUALIZAR_STATUS_${dto.status}`,
      );
    }

    return alertaAtualizado;
  }

  async getContagemPorTipoConta(filters?: FilterAlertasDto) {
    const where: Record<string, unknown> = {};

    // Aplicar mesmos filtros base (exceto tipoConta, pois queremos agrupar por ele)
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.tipo) {
      where.tipo = filters.tipo;
    }
    if (filters?.severidade) {
      where.severidade = filters.severidade;
    }
    if (filters?.empresaId) {
      where.upload = {
        empresaId: filters.empresaId,
      };
    }
    if (filters?.uploadId) {
      where.uploadId = filters.uploadId;
    }
    if (filters?.busca) {
      where.OR = [
        { mensagem: { contains: filters.busca } },
        { linha: { classificacao: { contains: filters.busca } } },
        { linha: { nomeConta: { contains: filters.busca } } },
      ];
    }

    // Buscar alertas com linha (que tem tipoConta)
    const alertas = await this.prisma.alerta.findMany({
      where: {
        ...where,
        linha: {
          isNot: null,
        },
      },
      include: {
        linha: {
          select: {
            tipoConta: true,
          },
        },
      },
    });

    // Agrupar por tipoConta
    const contagem = alertas.reduce(
      (acc, alerta) => {
        const tipoConta = alerta.linha?.tipoConta || 'Sem tipo';
        acc[tipoConta] = (acc[tipoConta] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(contagem)
      .map(([tipoConta, quantidade]) => ({
        tipoConta,
        quantidade,
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }

  findOne(id: string) {
    return this.prisma.alerta.findUnique({
      where: { id },
      include: {
        upload: {
          include: {
            empresa: true,
          },
        },
        linha: true,
      },
    });
  }

  async findOneDetalhes(id: string) {
    const alerta = await this.findOne(id);

    if (!alerta) {
      throw new NotFoundException('Alerta não encontrado');
    }

    // Buscar histórico da conta (últimos 12 meses) se tiver linha
    let historico: Array<{
      mes: number;
      ano: number;
      saldoAnterior: number;
      debito: number;
      credito: number;
      saldoAtual: number;
      uploadId: string;
      temAlerta: boolean;
    }> = [];

    if (alerta.linha && alerta.upload) {
      // Garantir que TypeScript entenda que linha não é null
      const linhaAlerta = alerta.linha;
      
      // Buscar uploads dos últimos 12 meses da mesma empresa
      const dataAtual = new Date(alerta.upload.ano, alerta.upload.mes - 1);
      const uploads = await this.prisma.upload.findMany({
        where: {
          empresaId: alerta.upload.empresaId,
          status: { in: ['CONCLUIDO', 'COM_ALERTAS'] },
          OR: [
            {
              ano: dataAtual.getFullYear(),
              mes: { lte: dataAtual.getMonth() + 1 },
            },
            {
              ano: dataAtual.getFullYear() - 1,
              mes: { gt: dataAtual.getMonth() + 1 },
            },
          ],
        },
        include: {
          linhas: {
            where: {
              classificacao: linhaAlerta.classificacao,
              conta: linhaAlerta.conta,
              // Tratar subConta: buscar exatamente a mesma subConta
              // Se subConta for fornecido (não null e não vazio), buscar exato
              // Se for null ou vazio, buscar null ou string vazia
              ...(linhaAlerta.subConta && linhaAlerta.subConta.trim() !== ''
                ? { subConta: linhaAlerta.subConta }
                : {
                    OR: [{ subConta: null }, { subConta: '' }],
                  }),
            },
            take: 1,
          },
          alertas: {
            where: {
              linha: {
                classificacao: linhaAlerta.classificacao,
                conta: linhaAlerta.conta,
                ...(linhaAlerta.subConta && linhaAlerta.subConta.trim() !== ''
                  ? { subConta: linhaAlerta.subConta }
                  : {
                      OR: [{ subConta: null }, { subConta: '' }],
                    }),
              },
            },
            select: { id: true },
          },
        },
        orderBy: [{ ano: 'desc' }, { mes: 'desc' }],
        take: 12,
      });

      historico = uploads.map((upload) => {
        const linha = upload.linhas[0];
        
        // Converter Decimal para Number corretamente
        // Prisma Decimal pode vir como string ou objeto Decimal
        const converterDecimal = (value: any): number => {
          if (value === null || value === undefined) return 0;
          if (typeof value === 'number') return value;
          if (typeof value === 'string') {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? 0 : parsed;
          }
          // Se for objeto Decimal do Prisma, usar toString() e depois parseFloat
          if (value && typeof value.toString === 'function') {
            const parsed = parseFloat(value.toString());
            return isNaN(parsed) ? 0 : parsed;
          }
          return 0;
        };

        // Log temporário para debug (remover depois)
        if (!linha) {
          console.warn(
            `[AlertasService] Linha não encontrada para upload ${upload.id} (${upload.mes}/${upload.ano}). ` +
            `Buscando: classificacao=${linhaAlerta.classificacao}, conta=${linhaAlerta.conta}, subConta=${linhaAlerta.subConta || 'null/empty'}`,
          );
        }

        return {
          mes: upload.mes,
          ano: upload.ano,
          saldoAnterior: linha ? converterDecimal(linha.saldoAnterior) : 0,
          debito: linha ? converterDecimal(linha.debito) : 0,
          credito: linha ? converterDecimal(linha.credito) : 0,
          saldoAtual: linha ? converterDecimal(linha.saldoAtual) : 0,
          uploadId: upload.id,
          temAlerta: upload.alertas.length > 0,
        };
      });
    }

    // Calcular estatísticas do histórico
    let estatisticas: {
      valorMedio: number;
      valorMaximo: number;
      valorMinimo: number;
      variacaoMedia: number;
      tendencia: 'CRESCENTE' | 'DECRESCENTE' | 'ESTAVEL';
    } | null = null;

    if (historico.length > 0) {
      const valores = historico.map((h) => h.saldoAtual);
      const valorMedio = valores.reduce((a, b) => a + b, 0) / valores.length;
      const valorMaximo = Math.max(...valores);
      const valorMinimo = Math.min(...valores);

      // Calcular variação média
      let variacaoMedia = 0;
      if (valores.length > 1) {
        const variacoes: number[] = [];
        for (let i = 1; i < valores.length; i++) {
          const anterior = valores[i];
          const atual = valores[i - 1];
          if (anterior !== 0) {
            variacoes.push(((atual - anterior) / Math.abs(anterior)) * 100);
          }
        }
        variacaoMedia =
          variacoes.length > 0
            ? variacoes.reduce((a, b) => a + b, 0) / variacoes.length
            : 0;
      }

      // Determinar tendência
      let tendencia: 'CRESCENTE' | 'DECRESCENTE' | 'ESTAVEL' = 'ESTAVEL';
      if (valores.length >= 3) {
        const ultimos3 = valores.slice(0, 3);
        const mediaUltimos3 = ultimos3.reduce((a, b) => a + b, 0) / 3;
        const mediaAnteriores =
          valores.slice(3, 6).length > 0
            ? valores.slice(3, 6).reduce((a, b) => a + b, 0) / valores.slice(3, 6).length
            : mediaUltimos3;

        if (mediaUltimos3 > mediaAnteriores * 1.05) {
          tendencia = 'CRESCENTE';
        } else if (mediaUltimos3 < mediaAnteriores * 0.95) {
          tendencia = 'DECRESCENTE';
        }
      }

      estatisticas = {
        valorMedio,
        valorMaximo,
        valorMinimo,
        variacaoMedia,
        tendencia,
      };
    }

    // Comparação temporal para CONTINUIDADE_TEMPORAL_DIVERGENTE
    let comparacaoTemporal: {
      mesAnterior: {
        mes: number;
        ano: number;
        saldoAtual: number;
      };
      mesAtual: {
        mes: number;
        ano: number;
        saldoAnterior: number;
      };
      diferenca: number;
      percentual: number;
    } | null = null;

    if (
      alerta.tipo === 'CONTINUIDADE_TEMPORAL_DIVERGENTE' &&
      alerta.linha &&
      alerta.upload
    ) {
      // Calcular mês anterior
      let mesAnterior = alerta.upload.mes - 1;
      let anoAnterior = alerta.upload.ano;
      if (mesAnterior < 1) {
        mesAnterior = 12;
        anoAnterior -= 1;
      }

      // Buscar upload do mês anterior
      const uploadAnterior = await this.prisma.upload.findFirst({
        where: {
          empresaId: alerta.upload.empresaId,
          mes: mesAnterior,
          ano: anoAnterior,
          status: { in: ['CONCLUIDO', 'COM_ALERTAS'] },
        },
        include: {
          linhas: {
            where: {
              classificacao: alerta.linha.classificacao,
              conta: alerta.linha.conta,
              subConta: alerta.linha.subConta || '',
            },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (uploadAnterior && uploadAnterior.linhas.length > 0) {
        const linhaAnterior = uploadAnterior.linhas[0];
        const saldoAnteriorMesAnterior = Number(linhaAnterior.saldoAtual);
        const saldoAnteriorMesAtual = Number(alerta.linha.saldoAnterior);
        const diferenca = saldoAnteriorMesAtual - saldoAnteriorMesAnterior;
        const percentual =
          saldoAnteriorMesAnterior !== 0
            ? (diferenca / Math.abs(saldoAnteriorMesAnterior)) * 100
            : 0;

        comparacaoTemporal = {
          mesAnterior: {
            mes: mesAnterior,
            ano: anoAnterior,
            saldoAtual: saldoAnteriorMesAnterior,
          },
          mesAtual: {
            mes: alerta.upload.mes,
            ano: alerta.upload.ano,
            saldoAnterior: saldoAnteriorMesAtual,
          },
          diferenca,
          percentual,
        };
      }
    }

    // Buscar alertas relacionados (mesma conta)
    const alertasRelacionados = alerta.linha
      ? await this.prisma.alerta.findMany({
          where: {
            id: { not: alerta.id },
            linha: {
              classificacao: alerta.linha.classificacao,
              conta: alerta.linha.conta,
              subConta: alerta.linha.subConta || '',
            },
          },
          include: {
            upload: {
              select: {
                id: true,
                mes: true,
                ano: true,
                empresa: {
                  select: {
                    id: true,
                    razaoSocial: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        })
      : [];

    return {
      alerta,
      historico,
      estatisticas,
      comparacaoTemporal,
      alertasRelacionados,
    };
  }
}
