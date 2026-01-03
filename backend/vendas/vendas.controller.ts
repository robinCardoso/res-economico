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
import { VendasService } from './vendas.service';
import { VendasImportService } from './import/vendas-import.service';
import { VendasImportDeleteService } from './import/vendas-import-delete.service';
import { VendasUpdateService } from './vendas-update.service';
import { VendasColumnMappingService } from './vendas-column-mapping.service';
import { VendasAnalyticsFilterService } from './vendas-analytics-filter.service';
import { CreateVendaDto } from './dto/create-venda.dto';
import { UpdateVendaDto } from './dto/update-venda.dto';
import { FilterVendasDto } from './dto/filter-vendas.dto';
import { ImportVendasDto } from './dto/import-vendas.dto';
import { RecalcularDadosProdutoDto } from './dto/recalcular-dados-produto.dto';
import { CreateVendaColumnMappingDto } from './dto/create-venda-column-mapping.dto';
import { CreateVendaAnalyticsFilterDto } from './dto/create-venda-analytics-filter.dto';

@Controller('vendas')
@UseGuards(JwtAuthGuard)
export class VendasController {
  constructor(
    private readonly vendasService: VendasService,
    private readonly vendasImportService: VendasImportService,
    private readonly vendasImportDeleteService: VendasImportDeleteService,
    private readonly vendasUpdateService: VendasUpdateService,
    private readonly vendasColumnMappingService: VendasColumnMappingService,
    private readonly vendasAnalyticsFilterService: VendasAnalyticsFilterService,
  ) {}

  @Post()
  async create(@Body() createVendaDto: CreateVendaDto) {
    return this.vendasService.create(createVendaDto);
  }

  @Get()
  async findAll(@Query() filterDto: FilterVendasDto) {
    return this.vendasService.findAll(filterDto);
  }

  @Get('stats')
  async getStats(@Query() filterDto: FilterVendasDto) {
    return this.vendasService.getStats(filterDto);
  }

  @Get('import-logs')
  async getImportLogs() {
    return this.vendasService.getImportLogs();
  }

  @Get('import-logs/:id/progresso')
  async getImportLogProgress(@Param('id') id: string) {
    return this.vendasService.getImportLogProgress(id);
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

    return this.vendasImportDeleteService.deletarImportacao(id, userId);
  }

  @Get('mapping-fields')
  getMappingFields() {
    return this.vendasService.getMappingFields();
  }

  @Get('tipos-operacao')
  async getTiposOperacao() {
    return this.vendasService.getTiposOperacao();
  }

  @Get('marcas')
  async getMarcas() {
    return this.vendasService.getMarcas();
  }

  @Get('grupos')
  async getGrupos() {
    return this.vendasService.getGrupos();
  }

  @Get('subgrupos')
  async getSubgrupos() {
    return this.vendasService.getSubgrupos();
  }

  @Get('nomes-fantasia')
  async getNomesFantasia() {
    return this.vendasService.getNomesFantasia();
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async import(
    @UploadedFile() file: Express.Multer.File,
    @Body() importDto: ImportVendasDto,
    @Request() req: { user?: { id?: string; email?: string } },
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo não fornecido');
    }

    const userId = req.user?.id || 'system';
    const userEmail = req.user?.email || 'system@example.com';

    return this.vendasImportService.importFromExcel(
      file,
      importDto,
      userId,
      userEmail,
    );
  }

  @Post('recalcular-dados-produto')
  async recalcularDadosProduto(@Body() dto: RecalcularDadosProdutoDto) {
    return this.vendasUpdateService.recalcularDadosProdutoEmVendas({
      ...dto,
      dataLimite: dto.dataLimite ? new Date(dto.dataLimite) : undefined,
    });
  }

  // =====================================================
  // ENDPOINTS DE MAPEAMENTO DE COLUNAS
  // IMPORTANTE: Devem estar ANTES das rotas com :id
  // =====================================================

  @Get('column-mappings')
  async getColumnMappings() {
    return this.vendasColumnMappingService.findAll();
  }

  @Get('column-mappings/:id')
  async getColumnMapping(@Param('id') id: string) {
    return this.vendasColumnMappingService.findOne(id);
  }

  @Post('column-mappings')
  async createColumnMapping(
    @Body() dto: CreateVendaColumnMappingDto,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id;
    return this.vendasColumnMappingService.create(dto, userId);
  }

  @Put('column-mappings/:id')
  async updateColumnMapping(
    @Param('id') id: string,
    @Body() dto: Partial<CreateVendaColumnMappingDto>,
  ) {
    return this.vendasColumnMappingService.update(id, dto);
  }

  @Delete('column-mappings/:id')
  async deleteColumnMapping(@Param('id') id: string) {
    return this.vendasColumnMappingService.remove(id);
  }

  // =====================================================
  // ENDPOINTS DE FILTROS DE ANALYTICS
  // IMPORTANTE: Devem estar ANTES das rotas com :id
  // =====================================================

  @Get('analytics-filters')
  async getAnalyticsFilters() {
    return this.vendasAnalyticsFilterService.findAll();
  }

  @Get('analytics-filters/:id')
  async getAnalyticsFilter(@Param('id') id: string) {
    return this.vendasAnalyticsFilterService.findOne(id);
  }

  @Post('analytics-filters')
  async createAnalyticsFilter(
    @Body() dto: CreateVendaAnalyticsFilterDto,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id;
    return this.vendasAnalyticsFilterService.create(dto, userId);
  }

  @Put('analytics-filters/:id')
  async updateAnalyticsFilter(
    @Param('id') id: string,
    @Body() dto: Partial<CreateVendaAnalyticsFilterDto>,
  ) {
    return this.vendasAnalyticsFilterService.update(id, dto);
  }

  @Delete('analytics-filters/:id')
  async deleteAnalyticsFilter(@Param('id') id: string) {
    return this.vendasAnalyticsFilterService.remove(id);
  }

  // =====================================================
  // ROTAS COM PARÂMETROS DINÂMICOS (:id)
  // Devem estar DEPOIS das rotas específicas
  // =====================================================

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.vendasService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVendaDto: UpdateVendaDto,
  ) {
    return this.vendasService.update(id, updateVendaDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.vendasService.remove(id);
  }
}
