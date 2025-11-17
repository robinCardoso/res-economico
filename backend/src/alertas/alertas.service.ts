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
    const where: any = {};

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
        const tipoContaValue = where.linha.tipoConta;
        // Buscar na mensagem OU na linha (com tipoConta correto)
        where.OR = [
          { mensagem: { contains: filters.busca, mode: 'insensitive' } },
          {
            linha: {
              tipoConta: tipoContaValue,
              OR: [
                { classificacao: { contains: filters.busca, mode: 'insensitive' } },
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
          { linha: { classificacao: { contains: filters.busca, mode: 'insensitive' } } },
          { linha: { nomeConta: { contains: filters.busca, mode: 'insensitive' } } },
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

    const updateData: any = {
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
      await this.auditoria.registrarAlerta(userId, id, `ATUALIZAR_STATUS_${dto.status}`);
    }

    return alertaAtualizado;
  }

  async getContagemPorTipoConta(filters?: FilterAlertasDto) {
    const where: any = {};

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
    const contagem = alertas.reduce((acc, alerta) => {
      const tipoConta = alerta.linha?.tipoConta || 'Sem tipo';
      acc[tipoConta] = (acc[tipoConta] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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
}
