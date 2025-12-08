import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);
  private readonly vapidPublicKey: string;
  private readonly vapidPrivateKey: string;
  private readonly vapidSubject: string;
  private initialized = false;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.vapidPublicKey =
      this.configService.get<string>('VAPID_PUBLIC_KEY') || '';
    this.vapidPrivateKey =
      this.configService.get<string>('VAPID_PRIVATE_KEY') || '';
    this.vapidSubject =
      this.configService.get<string>('VAPID_SUBJECT') ||
      'mailto:admin@example.com';

    this.initializeWebPush();
  }

  /**
   * Inicializa web-push com as chaves VAPID
   */
  private initializeWebPush() {
    if (!this.vapidPublicKey || !this.vapidPrivateKey) {
      this.logger.warn(
        'VAPID keys não configuradas. Notificações push não funcionarão.',
      );
      return;
    }

    try {
      webpush.setVapidDetails(
        this.vapidSubject,
        this.vapidPublicKey,
        this.vapidPrivateKey,
      );
      this.initialized = true;
      this.logger.log('Web Push inicializado com sucesso');
    } catch (error) {
      this.logger.error(
        `Erro ao inicializar Web Push: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Retorna a chave pública VAPID para o frontend
   */
  getPublicKey(): string {
    return this.vapidPublicKey;
  }

  /**
   * Registra uma subscription de push notification
   */
  async subscribe(usuarioId: string, dto: CreateSubscriptionDto) {
    // Verificar se já existe subscription com mesmo endpoint
    const existente = await this.prisma.pushSubscription.findUnique({
      where: {
        usuarioId_endpoint: {
          usuarioId,
          endpoint: dto.endpoint,
        },
      },
    });

    if (existente) {
      // Atualizar subscription existente
      return this.prisma.pushSubscription.update({
        where: { id: existente.id },
        data: {
          p256dh: dto.p256dh,
          auth: dto.auth,
          userAgent: dto.userAgent,
        },
      });
    }

    // Criar nova subscription
    return this.prisma.pushSubscription.create({
      data: {
        usuarioId,
        endpoint: dto.endpoint,
        p256dh: dto.p256dh,
        auth: dto.auth,
        userAgent: dto.userAgent,
      },
    });
  }

  /**
   * Remove uma subscription
   */
  async unsubscribe(usuarioId: string, endpoint: string) {
    const subscription = await this.prisma.pushSubscription.findUnique({
      where: {
        usuarioId_endpoint: {
          usuarioId,
          endpoint,
        },
      },
    });

    if (!subscription) {
      throw new BadRequestException('Subscription não encontrada');
    }

    await this.prisma.pushSubscription.delete({
      where: { id: subscription.id },
    });

    return { message: 'Subscription removida com sucesso' };
  }

  /**
   * Remove todas as subscriptions de um usuário
   */
  async unsubscribeAll(usuarioId: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: { usuarioId },
    });

    return { message: 'Todas as subscriptions foram removidas' };
  }

  /**
   * Envia notificação push para um usuário específico
   */
  async sendToUser(usuarioId: string, payload: SendNotificationDto) {
    if (!this.initialized) {
      throw new BadRequestException(
        'Web Push não está inicializado. Verifique as configurações VAPID.',
      );
    }

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { usuarioId },
    });

    if (subscriptions.length === 0) {
      this.logger.debug(
        `Nenhuma subscription encontrada para usuário ${usuarioId}`,
      );
      return { sent: 0, failed: 0 };
    }

    const results = await Promise.allSettled(
      subscriptions.map((subscription) =>
        this.sendNotification(subscription, payload),
      ),
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    // Remover subscriptions inválidas
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'rejected') {
        const reason = (results[i] as PromiseRejectedResult).reason as
          | { statusCode?: number }
          | Error;
        // Erro 410 (Gone) ou 404 indica subscription inválida
        const reasonObj = reason as { statusCode?: number } | undefined;
        if (reasonObj?.statusCode === 410 || reasonObj?.statusCode === 404) {
          try {
            await this.prisma.pushSubscription.delete({
              where: { id: subscriptions[i].id },
            });
            this.logger.log(
              `Subscription inválida removida: ${subscriptions[i].id}`,
            );
          } catch (error) {
            this.logger.error(
              `Erro ao remover subscription inválida: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            );
          }
        }
      }
    }

    return { sent, failed };
  }

  /**
   * Envia notificação push para múltiplos usuários
   */
  async sendToUsers(usuarioIds: string[], payload: SendNotificationDto) {
    const results = await Promise.allSettled(
      usuarioIds.map((usuarioId) => this.sendToUser(usuarioId, payload)),
    );

    const totalSent = results
      .filter((r) => r.status === 'fulfilled')
      .reduce(
        (sum, r) =>
          sum +
          ((r as PromiseFulfilledResult<{ sent: number }>).value.sent || 0),
        0,
      );
    const totalFailed = results
      .filter((r) => r.status === 'fulfilled')
      .reduce(
        (sum, r) =>
          sum +
          ((r as PromiseFulfilledResult<{ failed: number }>).value.failed || 0),
        0,
      );

    return { sent: totalSent, failed: totalFailed };
  }

  /**
   * Envia notificação push para uma subscription específica
   */
  private async sendNotification(
    subscription: {
      endpoint: string;
      p256dh: string;
      auth: string;
    },
    payload: SendNotificationDto,
  ): Promise<void> {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body || '',
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/icon-192x192.png',
      data: {
        url: payload.url,
        ...payload.data,
      },
    });

    await webpush.sendNotification(pushSubscription, notificationPayload);
  }

  /**
   * Lista subscriptions de um usuário
   */
  async findByUsuario(usuarioId: string) {
    return this.prisma.pushSubscription.findMany({
      where: { usuarioId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
