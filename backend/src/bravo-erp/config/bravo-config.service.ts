import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateConfigDto, ConfigResponseDto } from '../dto/config.dto';

@Injectable()
export class BravoConfigService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Buscar configuração do Bravo ERP
   */
  async getConfig(): Promise<ConfigResponseDto> {
    try {
      const configs = await this.prisma.bravoSyncConfig.findMany({
        select: {
          chave: true,
          valor: true,
        },
      });

      // Converter array em objeto
      const configObj: Record<string, string> = {};
      configs.forEach((config) => {
        configObj[config.chave] = config.valor;
      });

      // Montar configuração com valores padrão
      const config = {
        baseUrl:
          typeof configObj['bravo_base_url'] === 'string'
            ? configObj['bravo_base_url']
            : 'https://v2.bravoerp.com.br',
        cliente:
          typeof configObj['bravo_cliente'] === 'string'
            ? configObj['bravo_cliente']
            : 'redeuniao_sc',
        email:
          typeof configObj['bravo_email'] === 'string'
            ? configObj['bravo_email']
            : '',
        senha:
          typeof configObj['bravo_senha'] === 'string'
            ? configObj['bravo_senha']
            : '',
        pdv:
          typeof configObj['bravo_pdv'] === 'string'
            ? configObj['bravo_pdv']
            : '1',
        ambiente:
          typeof configObj['bravo_ambiente'] === 'string' &&
          (configObj['bravo_ambiente'] === 'p' ||
            configObj['bravo_ambiente'] === 'h')
            ? (configObj['bravo_ambiente'] as 'p' | 'h')
            : ('p' as const),
        server:
          typeof configObj['bravo_server'] === 'string'
            ? configObj['bravo_server']
            : 'alpha',
        token:
          typeof configObj['bravo_token'] === 'string'
            ? configObj['bravo_token']
            : '',
        timeout:
          typeof configObj['bravo_timeout'] === 'string'
            ? parseInt(configObj['bravo_timeout'], 10) || 30
            : 30,
        verificar_duplicatas:
          configObj['bravo_verificar_duplicatas'] === 'true' ||
          configObj['bravo_verificar_duplicatas'] === undefined,
        usar_data_ult_modif:
          configObj['bravo_usar_data_ult_modif'] === 'true' ||
          configObj['bravo_usar_data_ult_modif'] === undefined,
      };

      return {
        success: true,
        config,
      };
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Salvar configuração do Bravo ERP
   */
  async saveConfig(
    dto: CreateConfigDto,
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      console.log('🔄 Iniciando salvamento de configuração...');

      // Validar dados obrigatórios
      if (!dto.baseUrl || !dto.cliente) {
        console.error('❌ Campos obrigatórios não preenchidos');
        throw new BadRequestException('URL Base e Cliente são obrigatórios');
      }

      // Preparar configurações para inserir/atualizar
      const configsToSave = [
        {
          chave: 'bravo_base_url',
          valor: dto.baseUrl,
          descricao: 'URL base do Bravo ERP',
          tipo: 'string',
        },
        {
          chave: 'bravo_cliente',
          valor: dto.cliente,
          descricao: 'Nome do cliente',
          tipo: 'string',
        },
        {
          chave: 'bravo_email',
          valor: dto.email || '',
          descricao: 'E-mail para login',
          tipo: 'string',
        },
        {
          chave: 'bravo_senha',
          valor: dto.senha || '',
          descricao: 'Senha para login',
          tipo: 'string',
        },
        {
          chave: 'bravo_pdv',
          valor: dto.pdv || '1',
          descricao: 'Número do PDV',
          tipo: 'string',
        },
        {
          chave: 'bravo_ambiente',
          valor: dto.ambiente,
          descricao: 'Ambiente (p/h)',
          tipo: 'string',
        },
        {
          chave: 'bravo_server',
          valor: dto.server || 'alpha',
          descricao: 'Servidor da API (alpha/beta)',
          tipo: 'string',
        },
        {
          chave: 'bravo_token',
          valor: dto.token || '',
          descricao: 'Token para Machine_PublicApi_Produto',
          tipo: 'string',
        },
        {
          chave: 'bravo_timeout',
          valor: (dto.timeout || 30).toString(),
          descricao: 'Timeout em segundos',
          tipo: 'number',
        },
        {
          chave: 'bravo_verificar_duplicatas',
          valor: (dto.verificar_duplicatas ?? true).toString(),
          descricao: 'Verificar duplicatas (id_doc + id_prod)',
          tipo: 'boolean',
        },
        {
          chave: 'bravo_usar_data_ult_modif',
          valor: (dto.usar_data_ult_modif ?? true).toString(),
          descricao: 'Usar sincronização incremental por data',
          tipo: 'boolean',
        },
      ];

      console.log('💾 Salvando configurações no banco...');

      // Inserir/atualizar configurações usando upsert
      for (const item of configsToSave) {
        await this.prisma.bravoSyncConfig.upsert({
          where: {
            chave: item.chave,
          },
          update: {
            valor: item.valor,
            descricao: item.descricao,
            tipo: item.tipo,
            updatedAt: new Date(),
          },
          create: {
            chave: item.chave,
            valor: item.valor,
            descricao: item.descricao,
            tipo: item.tipo,
          },
        });
      }

      console.log('✅ Configuração salva com sucesso');

      return {
        success: true,
        message: 'Configuração salva com sucesso',
      };
    } catch (error) {
      console.error('❌ Erro ao salvar configuração:', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Erro desconhecido',
      );
    }
  }
}
