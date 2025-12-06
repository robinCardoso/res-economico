import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncRequestDto, SyncResponseDto } from '../dto/sync-request.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles?: string[];
  };
}

@Controller('bravo-erp/sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  /**
   * POST /bravo-erp/sync/sincronizar
   * Inicia ou retoma sincronização de produtos
   */
  @Post('sincronizar')
  async sincronizar(
    @Body() dto: SyncRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SyncResponseDto> {
    const userId = req.user?.id || 'unknown';
    const userEmail = req.user?.email || 'unknown@example.com';

    return this.syncService.sincronizar(dto, userId, userEmail);
  }
}
