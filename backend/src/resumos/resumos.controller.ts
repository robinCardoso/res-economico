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
  Res,
  Header,
  Optional,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ResumosService } from './resumos.service';
import { CreateResumoDto } from './dto/create-resumo.dto';
import { UpdateResumoDto } from './dto/update-resumo.dto';
import { FilterResumoDto } from './dto/filter-resumo.dto';

@Controller('resumos')
@UseGuards(JwtAuthGuard)
export class ResumosController {
  constructor(private readonly resumosService: ResumosService) {}

  @Post()
  async create(
    @Body() dto: CreateResumoDto,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id || 'system';
    return this.resumosService.create(dto, userId);
  }

  @Get()
  async findAll(
    @Query('empresaId') empresaId?: string,
    @Optional()
    @Query('ano', new ParseIntPipe({ optional: true }))
    ano?: number,
    @Optional()
    @Query('mes', new ParseIntPipe({ optional: true }))
    mes?: number,
    @Query('status') status?: string,
    @Query('tipoAnalise') tipoAnalise?: string,
    @Optional()
    @Query('page', new ParseIntPipe({ optional: true }))
    page?: number,
    @Optional()
    @Query('limit', new ParseIntPipe({ optional: true }))
    limit?: number,
    @Request() req?: { user?: { id?: string } },
  ) {
    const filters: FilterResumoDto = {
      empresaId,
      ano,
      mes,
      status: status as FilterResumoDto['status'],
      tipoAnalise: tipoAnalise as FilterResumoDto['tipoAnalise'],
      page: page || 1,
      limit: limit || 20,
    };

    const userId = req?.user?.id;
    return this.resumosService.findAll(filters, userId);
  }

  // Rotas de exportação devem vir ANTES de @Get(':id') para evitar conflito
  @Get(':id/export/pdf')
  @Header('Content-Type', 'application/pdf')
  async exportarPDF(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.resumosService.exportarPDF(id);
    const resumo = await this.resumosService.findOne(id);
    const filename = `resumo-${resumo.titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get(':id/export/excel')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async exportarExcel(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.resumosService.exportarExcel(id);
    const resumo = await this.resumosService.findOne(id);
    const filename = `resumo-${resumo.titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get(':id/export/json')
  @Header('Content-Type', 'application/json')
  async exportarJSON(@Param('id') id: string, @Res() res: Response) {
    const data = await this.resumosService.exportarJSON(id);
    const resumo = await this.resumosService.findOne(id);
    const filename = `resumo-${resumo.titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(data);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.resumosService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateResumoDto,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id || 'system';
    return this.resumosService.update(id, dto, userId);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id || 'system';
    return this.resumosService.delete(id, userId);
  }
}
