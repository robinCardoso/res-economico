import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { PrazoAcaoService } from './prazo-acao.service';
import { EmailService } from '../configuracoes/email.service';
import { Prisma, TipoLembrete, StatusPrazo } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LembretePrazoService {
  private readonly logger = new Logger(LembretePrazoService.name);
  private readonly frontendUrl: string;

  constructor(
    private prisma: PrismaService,
    private prazoAcaoService: PrazoAcaoService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
  }

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
   * @param prazoId ID do prazo
   * @param usuarioId ID do usuário que receberá o lembrete (criador do prazo ou da ata)
   * @param tipoLembrete Tipo do lembrete (VENCIDO, 3_DIAS, 1_DIA, HOJE)
   * @param enviarPara 'PRAZO' para enviar ao criador do prazo, 'ATA' para criador da ata, ou ambos
   */
  async enviarLembretePrazo(
    prazoId: string,
    usuarioId: string,
    tipoLembrete: 'VENCIDO' | '3_DIAS' | '1_DIA' | 'HOJE',
    enviarPara: 'PRAZO' | 'ATA' | 'AMBOS' = 'PRAZO',
  ) {
    const prazo = await this.prisma.prazoAcao.findUnique({
      where: { id: prazoId },
      include: {
        criador: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        ata: {
          include: {
            criador: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
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

    // Criar lembrete (por padrão, usar AMBOS para enviar e-mail + notificação)
    const lembrete = await this.criarLembrete(
      prazoId,
      usuarioId,
      TipoLembrete.AMBOS,
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

    // Enviar e-mail se configurado
    if (
      lembrete.tipo === TipoLembrete.EMAIL ||
      lembrete.tipo === TipoLembrete.AMBOS
    ) {
      try {
        // Determinar destinatários baseado em enviarPara
        const destinatarios: string[] = [];

        if (enviarPara === 'PRAZO' || enviarPara === 'AMBOS') {
          if (prazo.criador?.email) {
            destinatarios.push(prazo.criador.email);
          }
        }

        if (enviarPara === 'ATA' || enviarPara === 'AMBOS') {
          // Usar criador da ata já carregado no include
          if (prazo.ata.criador?.email) {
            const emailAta = prazo.ata.criador.email;
            // Evitar duplicatas
            if (!destinatarios.includes(emailAta)) {
              destinatarios.push(emailAta);
            }
          }
        }

        // Se não encontrou e-mail, usar o e-mail do usuário do lembrete
        if (destinatarios.length === 0 && lembrete.usuario?.email) {
          destinatarios.push(lembrete.usuario.email);
        }

        if (destinatarios.length > 0) {
          // Criar template HTML do e-mail
          const html = this.criarTemplateEmail(lembrete, tipoLembrete);

          // Enviar e-mail
          const resultado = await this.emailService.enviarEmail({
            to: destinatarios,
            subject: `Lembrete de Prazo: ${prazo.titulo}`,
            html: html,
          });

          if (resultado.success) {
            this.logger.log(
              `E-mail de lembrete enviado para ${destinatarios.join(', ')}`,
            );
          } else {
            this.logger.error(
              `Erro ao enviar e-mail de lembrete: ${resultado.error}`,
            );
          }
        } else {
          this.logger.warn(
            `Nenhum e-mail encontrado para enviar lembrete do prazo ${prazoId}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Erro ao enviar e-mail de lembrete: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        );
        // Não falhar o processo se o e-mail falhar
      }
    }

    return lembrete;
  }

  /**
   * Cria template HTML para e-mail de lembrete
   */
  private criarTemplateEmail(
    lembrete: any,
    tipoLembrete: 'VENCIDO' | '3_DIAS' | '1_DIA' | 'HOJE',
  ): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const prazo = lembrete.prazo;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const ata = prazo.ata;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    const dataPrazo = new Date(prazo.dataPrazo).toLocaleDateString('pt-BR');

    let corBorda = '#dc2626'; // Vermelho para vencido
    let icone = '⚠️';
    let titulo = 'Prazo Vencido';

    switch (tipoLembrete) {
      case '3_DIAS':
        corBorda = '#f59e0b'; // Amarelo
        icone = '📅';
        titulo = 'Lembrete: Prazo em 3 dias';
        break;
      case '1_DIA':
        corBorda = '#f97316'; // Laranja
        icone = '⏰';
        titulo = 'URGENTE: Prazo vence amanhã';
        break;
      case 'HOJE':
        corBorda = '#ef4444'; // Vermelho claro
        icone = '🔔';
        titulo = 'ATENÇÃO: Prazo vence hoje';
        break;
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="border-left: 4px solid ${corBorda}; padding-left: 20px; margin-bottom: 20px;">
    <h2 style="color: ${corBorda}; margin-top: 0;">${icone} ${titulo}</h2>
  </div>
  
  <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h3 style="margin-top: 0; color: #1f2937;">${(prazo as { titulo: string }).titulo}</h3>
    <p style="margin: 10px 0;"><strong>Ata:</strong> ${(ata as { numero: string }).numero} - ${(ata as { titulo: string }).titulo}</p>
    <p style="margin: 10px 0;"><strong>Data do Prazo:</strong> ${dataPrazo}</p>
    ${(prazo as { descricao?: string }).descricao ? `<p style="margin: 10px 0;"><strong>Descrição:</strong> ${(prazo as { descricao: string }).descricao}</p>` : ''}
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <a href="${this.frontendUrl}/admin/atas/${(ata as { id: string }).id}/processo" 
       style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
      Acessar Ata no Sistema
    </a>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
    <p>Este é um e-mail automático do sistema de gestão de atas.</p>
    <p>Por favor, não responda este e-mail.</p>
  </div>
</body>
</html>
    `.trim();
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
