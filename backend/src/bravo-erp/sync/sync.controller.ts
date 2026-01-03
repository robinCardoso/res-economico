import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncRequestDto, SyncResponseDto } from '../dto/sync-request.dto';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
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
   *
   * Inicia a sincronização de forma assíncrona para evitar timeout no frontend
   */
  @Post('sincronizar')
  sincronizar(
    @Body() dto: SyncRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SyncResponseDto> {
    const userId = req.user?.id || 'unknown';
    const userEmail = req.user?.email || 'unknown@example.com';

    // Processar em background usando Promise.resolve().then() para não bloquear
    // Isso permite que a requisição retorne imediatamente sem timeout
    Promise.resolve()
      .then(() => {
        return this.syncService.sincronizar(dto, userId, userEmail);
      })
      .catch((error) => {
        // Erros já são tratados dentro do syncService
        console.error(
          'Erro não tratado na sincronização em background:',
          error,
        );
      });

    // Retornar resposta imediata indicando que a sincronização foi iniciada
    // O frontend deve consultar o endpoint de logs/progresso para acompanhar
    return Promise.resolve({
      success: true,
      message:
        'Sincronização iniciada em background. Acompanhe o progresso na aba "Logs".',
      sync_log_id: undefined, // Será criado pelo processo em background
      lock_id: undefined,
      data: {
        filtro_aplicado:
          dto.apenas_ativos !== false
            ? 'Apenas produtos ativos'
            : 'Todos os produtos',
        total_produtos_bravo: 0,
        produtos_filtrados: 0,
        paginas_processadas: 0,
        tempo_total_segundos: 0,
      },
    });
  }
}
