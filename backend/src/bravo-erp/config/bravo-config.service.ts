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
        ambiente: ((): 'p' | 'h' => {
          const ambienteValue = configObj['bravo_ambiente'];
          if (
            typeof ambienteValue === 'string' &&
            (ambienteValue === 'p' || ambienteValue === 'h')
          ) {
            return ambienteValue;
          }
          return 'p';
        })(),
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
        importar_excluidos:
          configObj['bravo_importar_excluidos'] === 'true' ||
          configObj['bravo_importar_excluidos'] === undefined,
      };

      return {
        success: true,
        config,
      };
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      return {
        success: false,
        error: 'Não foi possível carregar as configurações do Bravo ERP do banco de dados',
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
      if (!dto.baseUrl || !dto.cliente || !dto.token) {
        const missingFields: string[] = [];
        if (!dto.baseUrl) missingFields.push('URL Base');
        if (!dto.cliente) missingFields.push('Código do Cliente');
        if (!dto.token) missingFields.push('Token');
        
        const errorMsg = `Campos obrigatórios não preenchidos: ${missingFields.join(', ')}. Todos os campos marcados com * são obrigatórios para configurar o Bravo ERP.`;
        console.error('❌ ' + errorMsg);
        throw new BadRequestException(errorMsg);
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
        {
          chave: 'bravo_importar_excluidos',
          valor: (dto.importar_excluidos ?? false).toString(),
          descricao: 'Importar produtos excluídos (incluir todos os produtos, não apenas ativos)',
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
        message: '✅ Configuração salva com sucesso! O TOKEN foi registrado no sistema. Agora você pode usar a sincronização com Bravo ERP. Acesse o menu de sincronização para importar dados de produtos.',
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido ao salvar configuração';
      console.error('❌ Erro ao salvar configuração:', errorMsg);
      throw new BadRequestException(
        errorMsg || 'Não foi possível salvar as configurações do Bravo ERP. Tente novamente.',
      );
    }
  }
}
