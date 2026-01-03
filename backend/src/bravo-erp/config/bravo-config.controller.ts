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
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
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
      // Validar se todos os campos obrigatórios estão preenchidos
      if (!dto.baseUrl || !dto.cliente || !dto.token) {
        const missingFields: string[] = [];
        if (!dto.baseUrl) missingFields.push('URL da API');
        if (!dto.cliente) missingFields.push('Código do Cliente');
        if (!dto.token) missingFields.push('Token');

        throw new Error(
          `Campos obrigatórios não preenchidos: ${missingFields.join(', ')}. ` +
            `Preencha todos os campos para configurar o Bravo ERP corretamente.`,
        );
      }

      const result = await this.configService.saveConfig(dto);
      // Recarregar configuração no client após salvar
      if (result.success) {
        await this.clientService.reloadConfig();
      }
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erro desconhecido ao salvar configuração';
      throw new HttpException(
        {
          success: false,
          error: errorMessage,
          hint: 'Certifique-se de que todos os campos obrigatórios estão preenchidos corretamente',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('test')
  async testConnection(): Promise<{ success: boolean; message?: string }> {
    try {
      const connected = await this.clientService.testarConexao();
      if (connected) {
        return {
          success: true,
          message:
            '✅ Conexão com Bravo ERP estabelecida com sucesso! A configuração está correta.',
        };
      } else {
        return {
          success: false,
          message:
            '❌ Não foi possível conectar ao Bravo ERP. Verifique se o token, URL e código do cliente estão corretos.',
        };
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Erro desconhecido';
      return {
        success: false,
        message:
          `❌ Erro ao testar conexão: ${errorMsg}. ` +
          `Verifique as configurações do Bravo ERP e tente novamente.`,
      };
    }
  }
}
