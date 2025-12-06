import {
  Controller,
  Get,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { BravoConfigService } from './bravo-config.service';
import { CreateConfigDto, ConfigResponseDto } from '../dto/config.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { BravoErpClientV2Service } from '../client/bravo-erp-client-v2.service';

@Controller('bravo-erp/config')
@UseGuards(JwtAuthGuard)
export class BravoConfigController {
  constructor(
    private readonly configService: BravoConfigService,
    private readonly clientService: BravoErpClientV2Service,
  ) {}

  @Get()
  async getConfig(): Promise<ConfigResponseDto> {
    try {
      return await this.configService.getConfig();
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async saveConfig(
    @Body() dto: CreateConfigDto,
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const result = await this.configService.saveConfig(dto);
      // Recarregar configuração no client após salvar
      if (result.success) {
        await this.clientService.reloadConfig();
      }
      return result;
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /bravo-erp/config/test
   * Testa a conexão com o Bravo ERP
   */
  @Post('test')
  async testConnection(): Promise<{ success: boolean; message?: string }> {
    try {
      const connected = await this.clientService.testarConexao();
      if (connected) {
        return {
          success: true,
          message: 'Conexão estabelecida com sucesso',
        };
      } else {
        return {
          success: false,
          message: 'Não foi possível conectar. Verifique o token e as configurações.',
        };
      }
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Erro ao testar conexão. Verifique as configurações.',
      };
    }
  }
}
