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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AtasService } from './atas.service';
import { ModeloAtaService } from './modelo-ata.service';
import { CreateAtaDto } from './dto/create-ata.dto';
import { UpdateAtaDto } from './dto/update-ata.dto';
import { FilterAtaDto } from './dto/filter-ata.dto';
import { AnalisarAtaDto } from './dto/analisar-ata.dto';
import { ImportarAtaDto } from './dto/importar-ata.dto';
import { ImportarRascunhoDto } from './dto/importar-rascunho.dto';
import { ImportarEmProcessoDto } from './dto/importar-em-processo.dto';
import { CreateModeloAtaDto } from './dto/create-modelo-ata.dto';
import { UpdateModeloAtaDto } from './dto/update-modelo-ata.dto';
import { FilterModeloAtaDto } from './dto/filter-modelo-ata.dto';
import { CreateHistoricoAndamentoDto } from './dto/create-historico-andamento.dto';
import { CreatePrazoAcaoDto } from './dto/create-prazo-acao.dto';
import { UpdatePrazoAcaoDto } from './dto/update-prazo-acao.dto';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { UpdateComentarioDto } from './dto/update-comentario.dto';
import { HistoricoAndamentoService } from './historico-andamento.service';
import { PrazoAcaoService } from './prazo-acao.service';
import { LembretePrazoService } from './lembrete-prazo.service';

@Controller('atas')
@UseGuards(JwtAuthGuard)
export class AtasController {
  constructor(
    private readonly atasService: AtasService,
    private readonly modeloAtaService: ModeloAtaService,
    private readonly historicoAndamentoService: HistoricoAndamentoService,
    private readonly prazoAcaoService: PrazoAcaoService,
    private readonly lembretePrazoService: LembretePrazoService,
  ) {}

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

    return this.atasService.findAll(filters);
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

  @Post('importar/rascunho')
  @UseInterceptors(FileInterceptor('arquivo'))
  async importarRascunho(
    @UploadedFile() arquivo: Express.Multer.File,
    @Body() dto: ImportarRascunhoDto,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    if (!arquivo) {
      throw new Error('Arquivo não fornecido');
    }
    return this.atasService.processarRascunhoComIA(arquivo, dto, userId);
  }

  @Post('importar/em-processo')
  @UseInterceptors(FileInterceptor('arquivo'))
  async importarEmProcesso(
    @UploadedFile() arquivo: Express.Multer.File,
    @Body() dto: ImportarEmProcessoDto,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    if (!arquivo) {
      throw new Error('Arquivo não fornecido');
    }
    return this.atasService.importarEmProcesso(arquivo, dto, userId);
  }

  // =====================================================
  // ENDPOINTS DE MODELOS DE ATAS
  // =====================================================

  @Post('modelos')
  async createModelo(
    @Body() dto: CreateModeloAtaDto,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return this.modeloAtaService.create(dto, userId);
  }

  @Get('modelos')
  async findAllModelos(
    @Query('tipoReuniao') tipoReuniao?: string,
    @Query('ativo') ativo?: string,
    @Query('empresaId') empresaId?: string,
    @Query('search') search?: string,
  ) {
    const filters: FilterModeloAtaDto = {
      tipoReuniao: tipoReuniao as FilterModeloAtaDto['tipoReuniao'],
      ativo: ativo === 'true' ? true : ativo === 'false' ? false : undefined,
      empresaId,
      search,
    };
    return this.modeloAtaService.findAll(filters);
  }

  @Get('modelos/:id')
  async findOneModelo(@Param('id') id: string) {
    return this.modeloAtaService.findOne(id);
  }

  @Put('modelos/:id')
  async updateModelo(@Param('id') id: string, @Body() dto: UpdateModeloAtaDto) {
    return this.modeloAtaService.update(id, dto);
  }

  @Delete('modelos/:id')
  async removeModelo(@Param('id') id: string) {
    return this.modeloAtaService.remove(id);
  }

  // =====================================================
  // ENDPOINTS DE HISTÓRICO E PRAZOS (antes de :id para evitar conflito)
  // =====================================================

  @Get('prazos/vencidos')
  async prazosVencidos() {
    return this.prazoAcaoService.verificarPrazosVencidos();
  }

  @Get('prazos/proximos')
  async prazosProximos() {
    return this.prazoAcaoService.verificarPrazosProximos();
  }

  @Get('lembretes')
  async findLembretes(
    @Request() req: { user?: { id?: string } },
    @Query('enviados') enviados?: string,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return this.lembretePrazoService.findByUsuario(
      userId,
      enviados === 'true' ? true : enviados === 'false' ? false : undefined,
    );
  }

  @Put('lembretes/:lembreteId/lido')
  async marcarLembreteComoLido(@Param('lembreteId') lembreteId: string) {
    return this.lembretePrazoService.marcarComoLido(lembreteId);
  }

  @Get(':id/historico')
  async findHistorico(@Param('id') id: string) {
    return this.historicoAndamentoService.findByAta(id);
  }

  @Post(':id/historico')
  async createHistorico(
    @Param('id') id: string,
    @Body() dto: CreateHistoricoAndamentoDto,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return this.historicoAndamentoService.create(id, dto, userId);
  }

  @Delete(':id/historico/:historicoId')
  async removeHistorico(
    @Param('id') id: string,
    @Param('historicoId') historicoId: string,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return this.historicoAndamentoService.remove(historicoId, userId);
  }

  @Get(':id/prazos')
  async findPrazos(@Param('id') id: string) {
    return this.prazoAcaoService.findByAta(id);
  }

  @Post(':id/prazos')
  async createPrazo(
    @Param('id') id: string,
    @Body() dto: CreatePrazoAcaoDto,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return this.prazoAcaoService.create(id, dto, userId);
  }

  @Get('prazos/:prazoId')
  async findOnePrazo(@Param('prazoId') prazoId: string) {
    return this.prazoAcaoService.findOne(prazoId);
  }

  @Put('prazos/:prazoId')
  async updatePrazo(
    @Param('prazoId') prazoId: string,
    @Body() dto: UpdatePrazoAcaoDto,
  ) {
    return this.prazoAcaoService.update(prazoId, dto);
  }

  @Delete(':id/prazos/:prazoId')
  async removePrazo(
    @Param('id') id: string,
    @Param('prazoId') prazoId: string,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return this.prazoAcaoService.remove(prazoId, userId);
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
  async analisar(@Param('id') id: string, @Body() dto: AnalisarAtaDto) {
    return this.atasService.analisarAta(id, dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.atasService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAtaDto) {
    return this.atasService.update(id, dto);
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
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
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
