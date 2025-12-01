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
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AtasService } from './atas.service';
import { CreateAtaDto } from './dto/create-ata.dto';
import { UpdateAtaDto } from './dto/update-ata.dto';
import { FilterAtaDto } from './dto/filter-ata.dto';
import { AnalisarAtaDto } from './dto/analisar-ata.dto';
import { ImportarAtaDto } from './dto/importar-ata.dto';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { UpdateComentarioDto } from './dto/update-comentario.dto';

@Controller('atas')
@UseGuards(JwtAuthGuard)
export class AtasController {
  constructor(private readonly atasService: AtasService) {}

  @Post()
  async create(
    @Body() dto: CreateAtaDto,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return this.atasService.create(dto, userId);
  }

  @Get()
  async findAll(
    @Query('empresaId') empresaId?: string,
    @Query('tipo') tipo?: string,
    @Query('status') status?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('busca') busca?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Request() req?: { user?: { id?: string } },
  ) {
    const filters: FilterAtaDto = {
      empresaId,
      tipo: tipo as FilterAtaDto['tipo'],
      status: status as FilterAtaDto['status'],
      dataInicio,
      dataFim,
      busca,
      page: page || 1,
      limit: limit || 20,
    };

    const userId = req?.user?.id;
    return this.atasService.findAll(filters, userId);
  }

  // Rotas específicas devem vir antes das rotas com parâmetros
  @Post('importar')
  async importar(
    @Body() dto: ImportarAtaDto,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return this.atasService.importarAta(dto, userId);
  }

  // =====================================================
  // ENDPOINTS DE COMENTÁRIOS (antes de :id para evitar conflito)
  // =====================================================

  @Get(':id/comentarios')
  async findComentarios(@Param('id') id: string) {
    return this.atasService.findComentarios(id);
  }

  @Post(':id/comentarios')
  async createComentario(
    @Param('id') id: string,
    @Body() dto: CreateComentarioDto,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return this.atasService.createComentario(id, dto, userId);
  }

  @Put(':id/comentarios/:comentarioId')
  async updateComentario(
    @Param('id') id: string,
    @Param('comentarioId') comentarioId: string,
    @Body() dto: UpdateComentarioDto,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return this.atasService.updateComentario(comentarioId, dto, userId);
  }

  @Delete(':id/comentarios/:comentarioId')
  async removeComentario(
    @Param('id') id: string,
    @Param('comentarioId') comentarioId: string,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return this.atasService.removeComentario(comentarioId, userId);
  }

  @Post(':id/analisar')
  async analisar(
    @Param('id') id: string,
    @Body() dto: AnalisarAtaDto,
  ) {
    return this.atasService.analisarAta(id, dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.atasService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAtaDto,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return this.atasService.update(id, dto, userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.atasService.remove(id);
  }

  // =====================================================
  // EXPORTAÇÃO HTML
  // =====================================================

  @Get(':id/export/html')
  async exportarHTML(@Param('id') id: string, @Res() res: Response) {
    try {
      const ata = await this.atasService.findOne(id);
      const html = await this.atasService.exportarHTML(id);
      
      const filename = `ata-${ata.titulo?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'reuniao'}.html`;
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(html);
    } catch (error) {
      console.error('Erro ao exportar HTML:', error);
      res.status(500).json({
        error: 'Erro ao gerar HTML',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }
}

