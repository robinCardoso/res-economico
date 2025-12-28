import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ClientePerfilAnalyticsService } from './cliente-perfil-analytics.service';
import { FiltrosPerfilClienteDto } from './dto/cliente-perfil-analytics.dto';

/**
 * Controller para análise de perfil de cliente
 * Endpoints para relatórios, alertas e visão geral
 */
@Controller('vendas/cliente-analytics')
@UseGuards(JwtAuthGuard)
export class ClientePerfilAnalyticsController {
  private readonly logger = new Logger(ClientePerfilAnalyticsController.name);

  constructor(
    private readonly clientePerfilService: ClientePerfilAnalyticsService,
  ) {}

  /**
   * GET /vendas/cliente-analytics/visao-geral
   * Retorna visão geral (dashboard) de todos os clientes
   */
  @Get('visao-geral')
  async getVisaoGeral(
    @Query('ano') ano?: string,
    @Query('mes') mes?: string,
    @Query('nomeFantasia') nomeFantasia?: string,
    @Query('empresaId') empresaId?: string,
    @Query('uf') uf?: string,
  ) {
    this.logger.log('GET /vendas/cliente-analytics/visao-geral');

    const filtros: FiltrosPerfilClienteDto = {};

    if (ano) {
      filtros.ano = ano
        .split(',')
        .map(Number)
        .filter((n) => !isNaN(n));
    }
    if (mes) {
      filtros.mes = mes
        .split(',')
        .map(Number)
        .filter((n) => !isNaN(n));
    }
    if (nomeFantasia) {
      filtros.nomeFantasia = nomeFantasia.split(',');
    }
    if (empresaId) {
      filtros.empresaId = empresaId.split(',');
    }
    if (uf) {
      filtros.uf = uf.split(',');
    }

    return this.clientePerfilService.gerarVisaoGeral(filtros);
  }

  /**
   * GET /vendas/cliente-analytics/relatorios
   * Retorna relatórios de perfil para múltiplos clientes
   */
  @Get('relatorios')
  async getRelatorios(
    @Query('ano') ano?: string,
    @Query('mes') mes?: string,
    @Query('nomeFantasia') nomeFantasia?: string,
    @Query('empresaId') empresaId?: string,
    @Query('uf') uf?: string,
    @Query('segmento') segmento?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    this.logger.log('GET /vendas/cliente-analytics/relatorios');

    const filtros: FiltrosPerfilClienteDto = {};

    if (ano) {
      filtros.ano = ano
        .split(',')
        .map(Number)
        .filter((n) => !isNaN(n));
    }
    if (mes) {
      filtros.mes = mes
        .split(',')
        .map(Number)
        .filter((n) => !isNaN(n));
    }
    if (nomeFantasia) {
      filtros.nomeFantasia = nomeFantasia.split(',');
    }
    if (empresaId) {
      filtros.empresaId = empresaId.split(',');
    }
    if (uf) {
      filtros.uf = uf.split(',');
    }
    if (segmento) {
      filtros.segmento = segmento.split(',');
    }
    if (limit) {
      filtros.limit = parseInt(limit, 10);
    }
    if (offset) {
      filtros.offset = parseInt(offset, 10);
    }

    const relatorios =
      await this.clientePerfilService.gerarRelatoriosClientes(filtros);

    // Aplicar paginação se necessário
    if (filtros.limit || filtros.offset) {
      const start = filtros.offset || 0;
      const end = start + (filtros.limit || 50);
      return relatorios.slice(start, end);
    }

    return relatorios;
  }

  /**
   * GET /vendas/cliente-analytics/cliente/:nomeFantasia
   * Retorna relatório completo para um cliente específico
   */
  @Get('cliente')
  async getRelatorioCliente(
    @Query('nomeFantasia') nomeFantasia: string,
    @Query('ano') ano?: string,
    @Query('mes') mes?: string,
    @Query('empresaId') empresaId?: string,
  ) {
    if (!nomeFantasia) {
      throw new Error('Parâmetro nomeFantasia é obrigatório');
    }

    this.logger.log(
      `GET /vendas/cliente-analytics/cliente?nomeFantasia=${nomeFantasia}`,
    );

    const filtros: FiltrosPerfilClienteDto = {};

    if (ano) {
      filtros.ano = ano
        .split(',')
        .map(Number)
        .filter((n) => !isNaN(n));
    }
    if (mes) {
      filtros.mes = mes
        .split(',')
        .map(Number)
        .filter((n) => !isNaN(n));
    }
    if (empresaId) {
      filtros.empresaId = [empresaId];
    }

    return this.clientePerfilService.gerarRelatorioCliente(
      nomeFantasia,
      filtros,
    );
  }

  /**
   * GET /vendas/cliente-analytics/alertas
   * Retorna apenas os alertas de clientes
   */
  @Get('alertas')
  async getAlertas(
    @Query('ano') ano?: string,
    @Query('mes') mes?: string,
    @Query('nomeFantasia') nomeFantasia?: string,
    @Query('empresaId') empresaId?: string,
    @Query('uf') uf?: string,
  ) {
    this.logger.log('GET /vendas/cliente-analytics/alertas');

    const filtros: FiltrosPerfilClienteDto = {};

    if (ano) {
      filtros.ano = ano
        .split(',')
        .map(Number)
        .filter((n) => !isNaN(n));
    }
    if (mes) {
      filtros.mes = mes
        .split(',')
        .map(Number)
        .filter((n) => !isNaN(n));
    }
    if (nomeFantasia) {
      filtros.nomeFantasia = nomeFantasia.split(',');
    }
    if (empresaId) {
      filtros.empresaId = empresaId.split(',');
    }
    if (uf) {
      filtros.uf = uf.split(',');
    }

    return this.clientePerfilService.buscarAlertas(filtros);
  }
}
