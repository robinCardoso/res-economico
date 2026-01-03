import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PushNotificationsService } from './push-notifications.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

@Controller('push-notifications')
@UseGuards(JwtAuthGuard)
export class PushNotificationsController {
  constructor(private readonly pushService: PushNotificationsService) {}

  /**
   * Retorna a chave pública VAPID
   */
  @Get('public-key')
  getPublicKey() {
    return { publicKey: this.pushService.getPublicKey() };
  }

  /**
   * Registra uma subscription
   */
  @Post('subscribe')
  async subscribe(
    @Body() dto: CreateSubscriptionDto,
    @Request() req: { user?: { id?: string } },
  ) {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }
    return this.pushService.subscribe(usuarioId, dto);
  }

  /**
   * Remove uma subscription
   */
  @Delete('unsubscribe')
  async unsubscribe(
    @Body() body: { endpoint: string },
    @Request() req: { user?: { id?: string } },
  ) {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }
    return this.pushService.unsubscribe(usuarioId, body.endpoint);
  }

  /**
   * Remove todas as subscriptions do usuário
   */
  @Delete('unsubscribe-all')
  async unsubscribeAll(@Request() req: { user?: { id?: string } }) {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }
    return this.pushService.unsubscribeAll(usuarioId);
  }

  /**
   * Lista subscriptions do usuário
   */
  @Get('subscriptions')
  async getSubscriptions(@Request() req: { user?: { id?: string } }) {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }
    return this.pushService.findByUsuario(usuarioId);
  }

  /**
   * Envia notificação (apenas admin)
   */
  @Post('send')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async send(@Body() dto: SendNotificationDto) {
    if (dto.usuarioId) {
      return this.pushService.sendToUser(dto.usuarioId, dto);
    }
    throw new Error('usuarioId é obrigatório');
  }
}
