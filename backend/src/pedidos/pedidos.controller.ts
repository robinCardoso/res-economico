import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PedidosService } from './pedidos.service';
import { PedidosImportService } from './import/pedidos-import.service';
import { PedidosImportDeleteService } from './import/pedidos-import-delete.service';
import { PedidosUpdateService } from './pedidos-update.service';
import { PedidosColumnMappingService } from './pedidos-column-mapping.service';
import { PedidosAnalyticsFilterService } from './pedidos-analytics-filter.service';
import { ImportPedidosDto } from './dto/import-pedidos.dto';
import { CreatePedidoColumnMappingDto } from './dto/create-pedido-column-mapping.dto';
import { CreatePedidoAnalyticsFilterDto } from './dto/create-pedido-analytics-filter.dto';

@Controller('pedidos')
@UseGuards(JwtAuthGuard)
export class PedidosController {
  constructor(
    private readonly pedidosService: PedidosService,
    private readonly pedidosImportService: PedidosImportService,
    private readonly pedidosImportDeleteService: PedidosImportDeleteService,
    private readonly pedidosUpdateService: PedidosUpdateService,
    private readonly pedidosColumnMappingService: PedidosColumnMappingService,
    private readonly pedidosAnalyticsFilterService: PedidosAnalyticsFilterService,
  ) {}

  @Get()
  async findAll(@Query() filterDto: any) {
    return this.pedidosService.findAll(filterDto);
  }

  @Get('stats')
  async getStats(@Query() filterDto: any) {
    return this.pedidosService.getStats(filterDto);
  }

  @Get('import-logs')
  async getImportLogs() {
    return this.pedidosService.getImportLogs();
  }

  @Get('import-logs/:id/progresso')
  async getImportLogProgress(@Param('id') id: string) {
    return this.pedidosService.getImportLogProgress(id);
  }

  @Delete('import-logs/:id')
  async deletarImportacao(
    @Param('id') id: string,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    return this.pedidosImportDeleteService.deletarImportacao(id, userId);
  }

  @Get('mapping-fields')
  getMappingFields() {
    return this.pedidosService.getMappingFields();
  }

  @Get('marcas')
  async getMarcas() {
    return this.pedidosService.getMarcas();
  }

  @Get('grupos')
  async getGrupos() {
    return this.pedidosService.getGrupos();
  }

  @Get('subgrupos')
  async getSubgrupos() {
    return this.pedidosService.getSubgrupos();
  }

  @Get('nomes-fantasia')
  async getNomesFantasia() {
    return this.pedidosService.getNomesFantasia();
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async import(
    @UploadedFile() file: Express.Multer.File,
    @Body() importDto: ImportPedidosDto,
    @Request() req: { user?: { id?: string; email?: string } },
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo não fornecido');
    }

    const userId = req.user?.id || 'system';
    const userEmail = req.user?.email || 'system@example.com';

    return this.pedidosImportService.importFromExcel(
      file,
      importDto,
      userId,
      userEmail,
    );
  }

  // =====================================================
  // ENDPOINTS DE MAPEAMENTO DE COLUNAS
  // IMPORTANTE: Devem estar ANTES das rotas com :id
  // =====================================================

  @Get('column-mappings')
  async getColumnMappings() {
    return this.pedidosColumnMappingService.findAll();
  }

  @Get('column-mappings/:id')
  async getColumnMapping(@Param('id') id: string) {
    return this.pedidosColumnMappingService.findOne(id);
  }

  @Post('column-mappings')
  async createColumnMapping(
    @Body() dto: CreatePedidoColumnMappingDto,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id;
    return this.pedidosColumnMappingService.create(dto, userId);
  }

  @Put('column-mappings/:id')
  async updateColumnMapping(
    @Param('id') id: string,
    @Body() dto: Partial<CreatePedidoColumnMappingDto>,
  ) {
    return this.pedidosColumnMappingService.update(id, dto);
  }

  @Delete('column-mappings/:id')
  async deleteColumnMapping(@Param('id') id: string) {
    return this.pedidosColumnMappingService.remove(id);
  }

  // =====================================================
  // ENDPOINTS DE FILTROS DE ANALYTICS
  // IMPORTANTE: Devem estar ANTES das rotas com :id
  // =====================================================

  @Get('analytics-filters')
  async getAnalyticsFilters() {
    return this.pedidosAnalyticsFilterService.findAll();
  }

  @Get('analytics-filters/:id')
  async getAnalyticsFilter(@Param('id') id: string) {
    return this.pedidosAnalyticsFilterService.findOne(id);
  }

  @Post('analytics-filters')
  async createAnalyticsFilter(
    @Body() dto: CreatePedidoAnalyticsFilterDto,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id;
    return this.pedidosAnalyticsFilterService.create(dto, userId);
  }

  @Put('analytics-filters/:id')
  async updateAnalyticsFilter(
    @Param('id') id: string,
    @Body() dto: Partial<CreatePedidoAnalyticsFilterDto>,
  ) {
    return this.pedidosAnalyticsFilterService.update(id, dto);
  }

  @Delete('analytics-filters/:id')
  async deleteAnalyticsFilter(@Param('id') id: string) {
    return this.pedidosAnalyticsFilterService.remove(id);
  }

  // =====================================================
  // ROTAS COM PARÂMETROS DINÂMICOS (:id)
  // Devem estar DEPOIS das rotas específicas
  // =====================================================

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.pedidosService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.pedidosService.remove(id);
  }
}

