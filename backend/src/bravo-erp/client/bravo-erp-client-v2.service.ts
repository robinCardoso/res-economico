import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import axios, { AxiosInstance } from 'axios';
import {
  BravoProduto,
  BravoResponse,
  ConsultarProdutosOptions,
  BravoConfig,
} from './bravo-erp-client.interface';

@Injectable()
export class BravoErpClientV2Service {
  private readonly logger = new Logger(BravoErpClientV2Service.name);
  private axiosInstance: AxiosInstance;
  private config: BravoConfig | null = null;
  private configLoaded: boolean = false;

  constructor(private readonly prisma: PrismaService) {
    this.axiosInstance = axios.create({
      timeout: 30000, // 30 segundos padrão
      headers: {
        Accept: 'application/json',
      },
    });
  }

  /**
   * Carrega configuração do banco de dados
   */
  private async loadConfig(): Promise<void> {
    // Sempre recarregar para garantir dados atualizados (comentado para performance)
    // if (this.configLoaded && this.config) {
    //   return; // Já carregado
    // }

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

      this.config = {
        baseUrl: configObj['bravo_base_url'] || 'https://v2.bravoerp.com.br',
        cliente: configObj['bravo_cliente'] || '',
        token: configObj['bravo_token'] || '',
        ambiente:
          configObj['bravo_ambiente'] === 'p' ||
          configObj['bravo_ambiente'] === 'h'
            ? configObj['bravo_ambiente']
            : 'p',
        server: configObj['bravo_server'] || 'alpha',
        timeout: configObj['bravo_timeout']
          ? parseInt(configObj['bravo_timeout'], 10) * 1000
          : 30000,
      };

      // Validar configurações essenciais
      if (!this.config.baseUrl || !this.config.cliente || !this.config.token) {
        const missingFields: string[] = [];
        if (!this.config.baseUrl) missingFields.push('URL da API');
        if (!this.config.cliente) missingFields.push('Código do Cliente');
        if (!this.config.token) missingFields.push('Token de Autenticação');

        throw new Error(
          `Configuração incompleta do Bravo ERP. Campos obrigatórios não preenchidos: ${missingFields.join(', ')}. ` +
            `Acesse Configurações > Bravo ERP e preencha todos os campos obrigatórios.`,
        );
      }

      this.configLoaded = true;

      this.logger.log('✅ Configurações do Bravo ERP carregadas com sucesso');
    } catch (error) {
      this.logger.error('❌ Erro ao carregar configuração:', error);
      throw error instanceof Error
        ? error
        : new Error('Erro inesperado ao carregar configuração do Bravo ERP');
    }
  }

  /**
   * Constrói a URL completa para a API
   */
  private buildUrl(method: string, args: Record<string, any> = {}): string {
    if (!this.config) {
      throw new Error('Configuração não carregada');
    }

    // URL base: https://v2.bravoerp.com.br/{cliente}/api/get/Get.php
    const url = new URL(
      `${this.config.baseUrl}/${this.config.cliente}/api/get/Get.php`,
    );

    // Parâmetros de autenticação e ambiente
    url.searchParams.set('envModeRequest', this.config.ambiente);
    url.searchParams.set('envServerRequest', this.config.server);
    url.searchParams.set('loginRequestAction', 'login');
    url.searchParams.set('loginRequestData[module]', 'erp');
    url.searchParams.set('loginRequestData[token]', this.config.token);

    // Método a ser chamado
    url.searchParams.set('method', method);

    // Argumentos do método
    Object.keys(args).forEach((key) => {
      const value = args[key] as unknown;
      if (Array.isArray(value)) {
        // Arrays (ex: sortCol e sortOrder)
        value.forEach((item, index) => {
          url.searchParams.set(`args[${key}][${index}]`, String(item));
        });
      } else if (typeof value === 'object' && value !== null) {
        // Parâmetros aninhados (ex: args[filter][_data_ult_modif])
        const valueObj = value as Record<string, unknown>;
        Object.keys(valueObj).forEach((subKey) => {
          url.searchParams.set(
            `args[${key}][${subKey}]`,
            String(valueObj[subKey]),
          );
        });
      } else {
        url.searchParams.set(`args[${key}]`, String(value));
      }
    });

    return url.toString();
  }

  /**
   * Realiza requisição GET para a API
   */
  private async request<T>(
    method: string,
    args: Record<string, unknown> = {},
  ): Promise<BravoResponse<T>> {
    // Carregar configuração do banco
    await this.loadConfig();

    // Verificar token
    if (!this.config || !this.config.token) {
      throw new Error(
        'Token do Bravo ERP não configurado. Acesse Configurações > Bravo ERP e configure o token antes de fazer requisições.',
      );
    }

    const url = this.buildUrl(method, args);

    this.logger.debug(`🔄 Bravo ERP V2 Request: ${method}`, {
      url: url.replace(this.config.token, '***TOKEN***'),
      args,
    });

    try {
      const response = await this.axiosInstance.get(url, {
        timeout: this.config.timeout,
      });

      const text = response.data as unknown;
      this.logger.debug(
        `📦 Bravo ERP V2 Response (${response.status}):`,
        typeof text === 'string' ? text.substring(0, 200) : 'JSON',
      );

      // Tentar parsear como JSON se for string
      let data: unknown;
      if (typeof text === 'string') {
        try {
          data = JSON.parse(text) as unknown;
        } catch {
          this.logger.error('❌ Resposta não é JSON válido:', text);
          throw new Error(
            `Resposta inválida da API: ${text.substring(0, 100)}`,
          );
        }
      } else {
        data = text;
      }

      // Verificar se é uma resposta de erro
      const dataObj = data as { status?: string; error?: { message?: string } };
      if (dataObj.status === 'error') {
        throw new Error(dataObj.error?.message || 'Erro desconhecido da API');
      }

      return data as BravoResponse<T>;
    } catch (error: unknown) {
      const errorObj = error as
        | { code?: string; response?: { status?: number; statusText?: string } }
        | Error;
      if ('code' in errorObj && errorObj.code === 'ECONNABORTED') {
        throw new Error(
          `Timeout após ${this.config?.timeout || 30000 / 1000}s`,
        );
      }
      if ('response' in errorObj && errorObj.response) {
        throw new Error(
          `Erro na API: ${errorObj.response.status} - ${errorObj.response.statusText}`,
        );
      }
      throw error instanceof Error
        ? error
        : new Error('Erro desconhecido na requisição');
    }
  }

  // ============================================
  // MÉTODOS PÚBLICOS - PRODUTOS
  // ============================================

  /**
   * Consulta produtos retornando resposta completa
   */
  async consultarProdutosCompleto(
    options: ConsultarProdutosOptions = {},
  ): Promise<BravoResponse<BravoProduto[]>> {
    const args: Record<string, unknown> = {
      page: options.page || 1,
    };

    // NOVA ORDENAÇÃO DUPLA conforme orientação do programador
    if (options.useNewSorting) {
      // Ordenação por _data_ult_modif E id_produto para corrigir paginação
      args.sortCol = ['_data_ult_modif', 'id_produto'];
      args.sortOrder = ['ASC', 'ASC'];
    } else {
      // Ordenação simples (compatibilidade com código antigo)
      args.sortCol = options.sortCol || '_data_ult_modif';
      args.sortOrder = options.sortOrder || 'ASC';
    }

    // Adicionar limite se fornecido
    if (options.limit) {
      args.limit = options.limit;
    }

    // Adicionar filtro de data se fornecido
    if (options.filterDate) {
      args.filter = {
        _data_ult_modif: options.filterDate, // Já vem com o operador (ex: "< 2025-10-12" ou "> 2025-10-10")
      };
    }

    return await this.request<BravoProduto[]>(
      'Machine_PublicApi_Produto->viewFull',
      args,
    );
  }

  /**
   * Consulta produtos com filtros (método simplificado)
   */
  async consultarProdutos(
    options: ConsultarProdutosOptions = {},
  ): Promise<BravoProduto[]> {
    const response = await this.consultarProdutosCompleto(options);
    return response.data || [];
  }

  /**
   * Consulta um produto específico por ID
   */
  async consultarProdutoPorId(productId: string): Promise<BravoProduto | null> {
    const args = {
      filter: {
        product_id: productId,
      },
    };

    const response = await this.request<BravoProduto[]>(
      'Machine_PublicApi_Produto->viewFull',
      args,
    );

    return response.data?.[0] || null;
  }

  /**
   * Testa conexão com a API
   */
  async testarConexao(): Promise<boolean> {
    try {
      await this.loadConfig();

      if (!this.config || !this.config.token) {
        this.logger.error('❌ Token não configurado');
        return false;
      }

      // Tentar buscar 1 produto
      const produtos = await this.consultarProdutos({ limit: 1 });
      this.logger.log(
        `✅ Teste de conexão bem-sucedido! ${produtos.length} produto(s) encontrado(s)`,
      );
      return true;
    } catch (error) {
      this.logger.error('❌ Falha ao testar conexão:', error);
      return false;
    }
  }

  /**
   * Retorna configuração atual (sem expor dados sensíveis)
   */
  async getConfig() {
    await this.loadConfig();

    return {
      baseUrl: this.config?.baseUrl,
      cliente: this.config?.cliente,
      ambiente: this.config?.ambiente,
      server: this.config?.server,
      hasToken: !!this.config?.token,
      tokenLength: this.config?.token?.length || 0,
      timeout: this.config?.timeout,
    };
  }

  /**
   * Força recarregamento da configuração
   */
  async reloadConfig(): Promise<void> {
    this.configLoaded = false;
    this.config = null;
    await this.loadConfig();
  }
}
