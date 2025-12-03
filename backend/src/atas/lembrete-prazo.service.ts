import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { PrazoAcaoService } from './prazo-acao.service';
import { Prisma, TipoLembrete, StatusPrazo } from '@prisma/client';

@Injectable()
export class LembretePrazoService {
  private readonly logger = new Logger(LembretePrazoService.name);

  constructor(
    private prisma: PrismaService,
    private prazoAcaoService: PrazoAcaoService,
  ) {}

  /**
   * Cria um lembrete para um prazo
   */
  async criarLembrete(
    prazoId: string,
    usuarioId: string,
    tipo: TipoLembrete,
    mensagem: string,
  ) {
    const lembrete = await this.prisma.lembretePrazo.create({
      data: {
        prazoId,
        usuarioId,
        tipo,
        mensagem,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        prazo: {
          include: {
            ata: {
              select: {
                id: true,
                numero: true,
                titulo: true,
              },
            },
          },
        },
      },
    });

    return lembrete;
  }

  /**
   * Envia lembretes para prazos que precisam
   */
  async enviarLembretes(): Promise<void> {
    this.logger.log('Verificando prazos para envio de lembretes...');

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Prazos vencidos
    const prazosVencidos =
      await this.prazoAcaoService.verificarPrazosVencidos();
    for (const prazo of prazosVencidos) {
      await this.enviarLembretePrazo(prazo.id, prazo.criadoPor, 'VENCIDO');
    }

    // Prazos próximos (3 dias antes)
    const tresDiasDepois = new Date(hoje);
    tresDiasDepois.setDate(tresDiasDepois.getDate() + 3);
    tresDiasDepois.setHours(23, 59, 59, 999);

    const prazosProximos = await this.prisma.prazoAcao.findMany({
      where: {
        dataPrazo: {
          gte: hoje,
          lte: tresDiasDepois,
        },
        concluido: false,
        status: { not: StatusPrazo.CONCLUIDO },
      },
      include: {
        criador: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        ata: {
          select: {
            id: true,
            numero: true,
            titulo: true,
          },
        },
      },
    });

    for (const prazo of prazosProximos) {
      const diasRestantes = Math.ceil(
        (prazo.dataPrazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diasRestantes === 3) {
        await this.enviarLembretePrazo(prazo.id, prazo.criadoPor, '3_DIAS');
      } else if (diasRestantes === 1) {
        await this.enviarLembretePrazo(prazo.id, prazo.criadoPor, '1_DIA');
      } else if (diasRestantes === 0) {
        await this.enviarLembretePrazo(prazo.id, prazo.criadoPor, 'HOJE');
      }
    }

    // Prazos de hoje
    const hojeFim = new Date(hoje);
    hojeFim.setHours(23, 59, 59, 999);

    const prazosHoje = await this.prisma.prazoAcao.findMany({
      where: {
        dataPrazo: {
          gte: hoje,
          lte: hojeFim,
        },
        concluido: false,
        status: { not: StatusPrazo.CONCLUIDO },
      },
      include: {
        criador: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        ata: {
          select: {
            id: true,
            numero: true,
            titulo: true,
          },
        },
      },
    });

    for (const prazo of prazosHoje) {
      await this.enviarLembretePrazo(prazo.id, prazo.criadoPor, 'HOJE');
    }

    this.logger.log('Verificação de lembretes concluída');
  }

  /**
   * Envia lembrete para um prazo específico
   */
  async enviarLembretePrazo(
    prazoId: string,
    usuarioId: string,
    tipoLembrete: 'VENCIDO' | '3_DIAS' | '1_DIA' | 'HOJE',
  ) {
    const prazo = await this.prisma.prazoAcao.findUnique({
      where: { id: prazoId },
      include: {
        ata: {
          select: {
            id: true,
            numero: true,
            titulo: true,
          },
        },
      },
    });

    if (!prazo) {
      return;
    }

    // Verificar se já foi enviado lembrete hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const lembreteHoje = await this.prisma.lembretePrazo.findFirst({
      where: {
        prazoId,
        usuarioId,
        enviado: true,
        dataEnvio: {
          gte: hoje,
        },
      },
    });

    if (lembreteHoje && tipoLembrete !== 'VENCIDO') {
      // Para prazos vencidos, enviar diariamente
      return;
    }

    // Criar mensagem baseada no tipo
    let mensagem = '';
    const dataPrazoFormatada = prazo.dataPrazo.toLocaleDateString('pt-BR');

    switch (tipoLembrete) {
      case 'VENCIDO':
        mensagem = `⚠️ Prazo VENCIDO: "${prazo.titulo}" da ata ${prazo.ata.numero}. Data do prazo: ${dataPrazoFormatada}`;
        break;
      case '3_DIAS':
        mensagem = `📅 Lembrete: O prazo "${prazo.titulo}" da ata ${prazo.ata.numero} vence em 3 dias (${dataPrazoFormatada})`;
        break;
      case '1_DIA':
        mensagem = `⏰ URGENTE: O prazo "${prazo.titulo}" da ata ${prazo.ata.numero} vence AMANHÃ (${dataPrazoFormatada})`;
        break;
      case 'HOJE':
        mensagem = `🔔 ATENÇÃO: O prazo "${prazo.titulo}" da ata ${prazo.ata.numero} vence HOJE (${dataPrazoFormatada})`;
        break;
    }

    // Criar lembrete
    const lembrete = await this.criarLembrete(
      prazoId,
      usuarioId,
      TipoLembrete.NOTIFICACAO_SISTEMA,
      mensagem,
    );

    // Marcar como enviado
    await this.prisma.lembretePrazo.update({
      where: { id: lembrete.id },
      data: {
        enviado: true,
        dataEnvio: new Date(),
      },
    });

    // Atualizar contador no prazo
    await this.prisma.prazoAcao.update({
      where: { id: prazoId },
      data: {
        lembretesEnviados: { increment: 1 },
        ultimoLembrete: new Date(),
      },
    });

    this.logger.log(`Lembrete enviado para prazo ${prazoId} (${tipoLembrete})`);

    // TODO: Enviar email se configurado
    // if (lembrete.tipo === TipoLembrete.EMAIL || lembrete.tipo === TipoLembrete.AMBOS) {
    //   await this.emailService.enviarLembrete(lembrete);
    // }

    return lembrete;
  }

  /**
   * Lista lembretes de um usuário
   */
  async findByUsuario(usuarioId: string, enviados?: boolean) {
    const where: Prisma.LembretePrazoWhereInput = {
      usuarioId,
    };

    if (enviados !== undefined) {
      where.enviado = enviados;
    }

    const lembretes = await this.prisma.lembretePrazo.findMany({
      where,
      include: {
        prazo: {
          include: {
            ata: {
              select: {
                id: true,
                numero: true,
                titulo: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return lembretes;
  }

  /**
   * Marca lembrete como lido
   */
  async marcarComoLido(lembreteId: string) {
    await this.prisma.lembretePrazo.update({
      where: { id: lembreteId },
      data: {
        enviado: true, // Considerar como "lido" quando marcado
      },
    });

    return { message: 'Lembrete marcado como lido' };
  }
}
