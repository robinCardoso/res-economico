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
import { UpdateHistoricoAndamentoDto } from './dto/update-historico-andamento.dto';
import { CreatePrazoAcaoDto } from './dto/create-prazo-acao.dto';
import { UpdatePrazoAcaoDto } from './dto/update-prazo-acao.dto';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { UpdateComentarioDto } from './dto/update-comentario.dto';
import { HistoricoAndamentoService } from './historico-andamento.service';
import { PrazoAcaoService } from './prazo-acao.service';
import { LembretePrazoService } from './lembrete-prazo.service';
import { LogAlteracoesService } from '../log-alteracoes/log-alteracoes.service';
import { TipoAlteracaoAta } from '@prisma/client';
import * as fs from 'fs';

@Controller('atas')
@UseGuards(JwtAuthGuard)
export class AtasController {
  constructor(
    private readonly atasService: AtasService,
    private readonly modeloAtaService: ModeloAtaService,
    private readonly historicoAndamentoService: HistoricoAndamentoService,
    private readonly prazoAcaoService: PrazoAcaoService,
    private readonly lembretePrazoService: LembretePrazoService,
    private readonly logAlteracoesService: LogAlteracoesService,
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
    const ata = await this.atasService.create(dto, userId);

    // Registrar log de criação
    try {
      await this.logAlteracoesService.registrarAlteracao(
        ata.id,
        userId,
        TipoAlteracaoAta.CRIACAO,
        {
          descricao: `Ata "${ata.titulo}" criada`,
        },
      );
    } catch (error) {
      console.error('Erro ao registrar log de criação:', error);
    }

    return ata;
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
  @UseInterceptors(
    FileInterceptor('arquivo', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(
            new Error('Apenas arquivos PDF são permitidos para rascunhos'),
            false,
          );
        }
      },
    }),
  )
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
  @UseInterceptors(
    FileInterceptor('arquivo', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['application/pdf', 'text/plain'];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Apenas arquivos PDF e TXT são permitidos'), false);
        }
      },
    }),
  )
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
    const historico = await this.historicoAndamentoService.create(
      id,
      dto,
      userId,
    );

    // Registrar log
    try {
      await this.logAlteracoesService.registrarAlteracao(
        id,
        userId,
        TipoAlteracaoAta.ADICAO_HISTORICO,
        {
          descricao: `Histórico adicionado: ${dto.acao}`,
        },
      );
    } catch (error) {
      console.error('Erro ao registrar log de histórico:', error);
    }

    return historico;
  }

  @Put(':id/historico/:historicoId')
  async updateHistorico(
    @Param('id') id: string,
    @Param('historicoId') historicoId: string,
    @Body() dto: UpdateHistoricoAndamentoDto,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    const historico = await this.historicoAndamentoService.update(
      historicoId,
      dto,
      userId,
    );

    // Registrar log
    try {
      await this.logAlteracoesService.registrarAlteracao(
        id,
        userId,
        TipoAlteracaoAta.EDICAO_HISTORICO,
        {
          descricao: `Histórico atualizado`,
        },
      );
    } catch (error) {
      console.error('Erro ao registrar log de histórico:', error);
    }

    return historico;
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
    const resultado = await this.historicoAndamentoService.remove(
      historicoId,
      userId,
    );

    // Registrar log
    try {
      await this.logAlteracoesService.registrarAlteracao(
        id,
        userId,
        TipoAlteracaoAta.EXCLUSAO_HISTORICO,
        {
          descricao: `Histórico removido`,
        },
      );
    } catch (error) {
      console.error('Erro ao registrar log de histórico:', error);
    }

    return resultado;
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
    const prazo = await this.prazoAcaoService.create(id, dto, userId);

    // Registrar log
    try {
      await this.logAlteracoesService.registrarAlteracao(
        id,
        userId,
        TipoAlteracaoAta.ADICAO_PRAZO,
        {
          descricao: `Prazo adicionado: ${dto.titulo}`,
        },
      );
    } catch (error) {
      console.error('Erro ao registrar log de prazo:', error);
    }

    return prazo;
  }

  @Get('prazos/:prazoId')
  async findOnePrazo(@Param('prazoId') prazoId: string) {
    return this.prazoAcaoService.findOne(prazoId);
  }

  @Put('prazos/:prazoId')
  async updatePrazo(
    @Param('prazoId') prazoId: string,
    @Body() dto: UpdatePrazoAcaoDto,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }

    // Buscar prazo para obter ataId
    const prazoAntes = await this.prazoAcaoService.findOne(prazoId);
    const prazo = await this.prazoAcaoService.update(prazoId, dto);

    // Registrar log
    try {
      await this.logAlteracoesService.registrarAlteracao(
        prazoAntes.ataId,
        userId,
        TipoAlteracaoAta.EDICAO_PRAZO,
        {
          descricao: `Prazo atualizado: ${prazo.titulo}`,
        },
      );
    } catch (error) {
      console.error('Erro ao registrar log de prazo:', error);
    }

    return prazo;
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

    // Buscar prazo antes de deletar para log
    const prazo = await this.prazoAcaoService.findOne(prazoId);
    const resultado = await this.prazoAcaoService.remove(prazoId, userId);

    // Registrar log
    try {
      await this.logAlteracoesService.registrarAlteracao(
        id,
        userId,
        TipoAlteracaoAta.EXCLUSAO_PRAZO,
        {
          descricao: `Prazo removido: ${prazo.titulo}`,
        },
      );
    } catch (error) {
      console.error('Erro ao registrar log de prazo:', error);
    }

    return resultado;
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
    const comentario = await this.atasService.createComentario(id, dto, userId);

    // Registrar log
    try {
      await this.logAlteracoesService.registrarAlteracao(
        id,
        userId,
        TipoAlteracaoAta.ADICAO_COMENTARIO,
        {
          descricao: `Comentário adicionado`,
        },
      );
    } catch (error) {
      console.error('Erro ao registrar log de comentário:', error);
    }

    return comentario;
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
    const comentario = await this.atasService.updateComentario(
      comentarioId,
      dto,
      userId,
    );

    // Registrar log
    try {
      await this.logAlteracoesService.registrarAlteracao(
        id,
        userId,
        TipoAlteracaoAta.EDICAO_COMENTARIO,
        {
          descricao: `Comentário atualizado`,
        },
      );
    } catch (error) {
      console.error('Erro ao registrar log de comentário:', error);
    }

    return comentario;
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
    const resultado = await this.atasService.removeComentario(
      comentarioId,
      userId,
    );

    // Registrar log
    try {
      await this.logAlteracoesService.registrarAlteracao(
        id,
        userId,
        TipoAlteracaoAta.EXCLUSAO_COMENTARIO,
        {
          descricao: `Comentário removido`,
        },
      );
    } catch (error) {
      console.error('Erro ao registrar log de comentário:', error);
    }

    return resultado;
  }

  @Post(':id/analisar')
  async analisar(@Param('id') id: string, @Body() dto: AnalisarAtaDto) {
    return this.atasService.analisarAta(id, dto);
  }

  // Rotas de download devem vir ANTES de @Get(':id') para evitar conflito
  @Get(':id/download/arquivo-original')
  async downloadArquivoOriginal(@Param('id') id: string, @Res() res: Response) {
    try {
      const { filePath, fileName, mimeType } =
        await this.atasService.downloadArquivoOriginal(id);

      // Criar versão ASCII-safe do nome para compatibilidade
      const fileNameAscii = fileName
        .replace(/[^\x20-\x7E]/g, '_')
        .replace(/[^a-zA-Z0-9._-]/g, '_');

      // Codificar nome do arquivo em UTF-8 usando percent-encoding (RFC 5987)
      const fileNameEncoded = encodeURIComponent(fileName)
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29');

      res.setHeader('Content-Type', mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileNameAscii}"; filename*=UTF-8''${fileNameEncoded}`,
      );

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Erro ao fazer download do arquivo:', error);
      res.status(500).json({
        error: 'Erro ao fazer download do arquivo',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
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

    // Buscar ata antes da atualização para comparar
    const ataAntes = await this.atasService.findOne(id);
    const ata = await this.atasService.update(id, dto);

    // Registrar log de edição
    try {
      const camposAlterados: string[] = [];
      const valores: { anterior?: string; novo?: string } = {};
      let mudouStatus = false;

      Object.keys(dto).forEach((key) => {
        if (dto[key as keyof UpdateAtaDto] !== undefined) {
          camposAlterados.push(key);
          const valorAntigo = ataAntes[key as keyof typeof ataAntes];
          const valorNovo = dto[key as keyof UpdateAtaDto];

          if (key === 'status' && valorAntigo !== valorNovo) {
            mudouStatus = true;
          }

          if (JSON.stringify(valorAntigo) !== JSON.stringify(valorNovo)) {
            valores.anterior = valores.anterior
              ? `${valores.anterior}, ${key}: ${JSON.stringify(valorAntigo)}`
              : `${key}: ${JSON.stringify(valorAntigo)}`;
            valores.novo = valores.novo
              ? `${valores.novo}, ${key}: ${JSON.stringify(valorNovo)}`
              : `${key}: ${JSON.stringify(valorNovo)}`;
          }
        }
      });

      if (mudouStatus && dto.status) {
        // Log específico para mudança de status
        await this.logAlteracoesService.registrarAlteracao(
          id,
          userId,
          TipoAlteracaoAta.MUDANCA_STATUS,
          {
            campo: 'status',
            valorAnterior: ataAntes.status,
            valorNovo: dto.status,
            descricao: `Status alterado de "${ataAntes.status}" para "${dto.status}"`,
          },
        );
      } else if (camposAlterados.length > 0) {
        await this.logAlteracoesService.registrarAlteracao(
          id,
          userId,
          TipoAlteracaoAta.EDICAO,
          {
            campo: camposAlterados.join(', '),
            valorAnterior: valores.anterior,
            valorNovo: valores.novo,
            descricao: `Ata "${ata.titulo}" atualizada`,
          },
        );
      }
    } catch (error) {
      console.error('Erro ao registrar log de edição:', error);
    }

    return ata;
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }

    // Buscar ata antes de deletar para log
    const ata = await this.atasService.findOne(id);
    const resultado = await this.atasService.remove(id);

    // Registrar log de exclusão
    try {
      await this.logAlteracoesService.registrarAlteracao(
        id,
        userId,
        TipoAlteracaoAta.EXCLUSAO,
        {
          descricao: `Ata "${ata.titulo}" excluída`,
        },
      );
    } catch (error) {
      console.error('Erro ao registrar log de exclusão:', error);
    }

    return resultado;
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
