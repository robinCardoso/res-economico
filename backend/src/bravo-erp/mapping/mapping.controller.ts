import {
  Controller,
  Get,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { MappingService } from './mapping.service';
import { CreateMappingDto, MappingResponseDto } from '../dto/mapping.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('bravo-erp')
@UseGuards(JwtAuthGuard)
export class MappingController {
  constructor(private readonly mappingService: MappingService) {}

  @Get('mapeamento')
  async getMapeamentos(): Promise<MappingResponseDto> {
    try {
      const result = await this.mappingService.getMapeamentos();
      return {
        success: result.success,
        mapeamentos: result.mapeamentos,
        error: result.error,
      };
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

  @Post('mapeamento')
  async saveMapeamentos(
    @Body() dto: CreateMappingDto,
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      return await this.mappingService.saveMapeamentos(dto);
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
   * MELHORIA 1: Endpoint para obter campos da tabela produtos
   */
  @Get('mapping/fields/internal')
  async getInternalFields() {
    try {
      return await this.mappingService.getInternalFields();
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
   * MELHORIA 2: Endpoint para obter campos do Bravo ERP
   */
  @Get('mapping/fields/bravo')
  async getBravoFields() {
    try {
      return await this.mappingService.getBravoFields();
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
   * MELHORIA 3: Endpoint para preview do mapeamento
   */
  @Post('mapping/preview')
  async previewMapping(@Body() body: { mapeamentos: any[] }) {
    try {
      return await this.mappingService.previewMapping(body.mapeamentos);
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
}
