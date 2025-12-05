import { api } from '@/lib/http';

export interface PushSubscription {
  id: string;
  usuarioId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionDto {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}

export const pushNotificationsService = {
  /**
   * Obtém a chave pública VAPID
   */
  async getPublicKey(): Promise<string> {
    const response = await api.get<{ publicKey: string }>(
      '/push-notifications/public-key',
    );
    return response.data.publicKey;
  },

  /**
   * Registra uma subscription
   */
  async subscribe(dto: CreateSubscriptionDto): Promise<PushSubscription> {
    const response = await api.post<PushSubscription>(
      '/push-notifications/subscribe',
      dto,
    );
    return response.data;
  },

  /**
   * Remove uma subscription
   */
  async unsubscribe(endpoint: string): Promise<void> {
    await api.delete('/push-notifications/unsubscribe', {
      data: { endpoint },
    });
  },

  /**
   * Remove todas as subscriptions
   */
  async unsubscribeAll(): Promise<void> {
    await api.delete('/push-notifications/unsubscribe-all');
  },

  /**
   * Lista subscriptions do usuário
   */
  async listSubscriptions(): Promise<PushSubscription[]> {
    const response = await api.get<PushSubscription[]>(
      '/push-notifications/subscriptions',
    );
    return response.data;
  },
};

