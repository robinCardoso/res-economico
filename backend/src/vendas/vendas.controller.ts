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
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VendasService } from './vendas.service';
import { VendasImportService } from './import/vendas-import.service';
import { VendasUpdateService } from './vendas-update.service';
import { CreateVendaDto } from './dto/create-venda.dto';
import { UpdateVendaDto } from './dto/update-venda.dto';
import { FilterVendasDto } from './dto/filter-vendas.dto';
import { ImportVendasDto } from './dto/import-vendas.dto';
import { RecalcularDadosProdutoDto } from './dto/recalcular-dados-produto.dto';

@Controller('vendas')
@UseGuards(JwtAuthGuard)
export class VendasController {
  constructor(
    private readonly vendasService: VendasService,
    private readonly vendasImportService: VendasImportService,
    private readonly vendasUpdateService: VendasUpdateService,
  ) {}

  @Post()
  async create(
    @Body() createVendaDto: CreateVendaDto,
    @Request() req: { user?: { id?: string } },
  ) {
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
  async recalcularDadosProduto(
    @Body() dto: RecalcularDadosProdutoDto,
  ) {
    return this.vendasUpdateService.recalcularDadosProdutoEmVendas({
      ...dto,
      dataLimite: dto.dataLimite ? new Date(dto.dataLimite) : undefined,
    });
  }

  @Get('import-logs')
  async getImportLogs() {
    return this.vendasService.getImportLogs();
  }
}
