import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Query,
  ParseFilePipe,
  MaxFileSizeValidator,
  Request,
  Patch,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { ExcelProcessorService } from './excel-processor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUploadDto } from './dto/create-upload.dto';
import { FileExtensionValidator } from './validators/file-extension.validator';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as crypto from 'crypto';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly excelProcessor: ExcelProcessorService,
  ) {}

  @Get()
  list(
    @Query('empresaId') empresaId?: string,
    @Query('ano') ano?: string,
    @Query('mes') mes?: string,
  ) {
    // Se houver filtros, usar método filtrado
    if (empresaId || ano || mes) {
      const anoNum = ano ? parseInt(ano, 10) : undefined;
      const mesNum = mes ? parseInt(mes, 10) : undefined;
      return this.uploadsService.findWithFilters(empresaId, anoNum, mesNum);
    }
    // Caso contrário, retornar todos
    return this.uploadsService.findAll();
  }

  @Get('verificar-duplicata-periodo')
  async verificarDuplicataPeriodo(
    @Query('empresaId') empresaId: string,
    @Query('mes') mes: string,
    @Query('ano') ano: string,
  ) {
    if (!empresaId || !mes || !ano) {
      throw new BadRequestException('empresaId, mes e ano são obrigatórios');
    }
    const mesNum = parseInt(mes, 10);
    const anoNum = parseInt(ano, 10);
    if (isNaN(mesNum) || isNaN(anoNum)) {
      throw new BadRequestException('mes e ano devem ser números válidos');
    }
    const upload = await this.uploadsService.verificarDuplicataPeriodo(
      empresaId,
      mesNum,
      anoNum,
    );
    return { existe: !!upload, upload };
  }

  @Get('verificar-duplicata-nome')
  async verificarDuplicataNome(@Query('nomeArquivo') nomeArquivo: string) {
    if (!nomeArquivo) {
      throw new BadRequestException('nomeArquivo é obrigatório');
    }
    const upload =
      await this.uploadsService.verificarDuplicataNomeArquivo(nomeArquivo);
    return { existe: !!upload, upload };
  }

  // Rotas específicas devem vir ANTES das rotas genéricas com :id
  @Get(':id/progresso')
  async getProgresso(@Param('id') id: string) {
    return this.uploadsService.getProgress(id);
  }

  @Patch(':id/reprocessar')
  async reprocessar(
    @Param('id') id: string,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id || 'system';
    await this.uploadsService.reprocessar(id, userId);
    return this.uploadsService.findOne(id);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.uploadsService.findOne(id);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id || 'system';
    return this.uploadsService.remove(id, userId);
  }

  @Get('dashboard/conta-745')
  async getConta745(
    @Query('ano') ano?: string,
    @Query('mes') mes?: string,
    @Query('empresaId') empresaId?: string,
  ) {
    const anoNum = ano ? parseInt(ano, 10) : undefined;
    const mesNum = mes ? parseInt(mes, 10) : undefined;
    return this.uploadsService.getConta745(anoNum, mesNum, empresaId);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = crypto.randomBytes(16).toString('hex');
          const ext = extname(file.originalname);
          cb(null, `${randomName}${ext}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileExtensionValidator({ allowedExtensions: ['.xls', '.xlsx'] }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() body: Record<string, unknown>,
    @Request() req: { user?: { id?: string }; body?: Record<string, unknown> },
  ) {
    // Log para debug - ver o que está chegando
    console.log('Upload recebido - body raw:', body);
    console.log('Upload recebido - file:', {
      fileName: file?.originalname,
      fileSize: file?.size,
      mimetype: file?.mimetype,
    });

    // Extrair e validar campos do body
    const empresaId = body.empresaId as string;
    const mesStr = body.mes as string | number | undefined;
    const anoStr = body.ano as string | number | undefined;
    const templateId = body.templateId as string | undefined;

    // Converter mes e ano para números
    const mes = typeof mesStr === 'string' ? parseInt(mesStr, 10) : mesStr;
    const ano = typeof anoStr === 'string' ? parseInt(anoStr, 10) : anoStr;

    // Validar se o arquivo foi recebido
    if (!file) {
      throw new BadRequestException('Arquivo não foi enviado');
    }

    // Validar campos obrigatórios
    if (!empresaId || empresaId.trim() === '') {
      throw new BadRequestException('Empresa é obrigatória');
    }

    if (!mes || isNaN(mes) || mes < 1 || mes > 12) {
      throw new BadRequestException('Mês inválido (deve ser entre 1 e 12)');
    }

    if (!ano || isNaN(ano) || ano < 2020 || ano > 2100) {
      throw new BadRequestException(
        'Ano inválido (deve ser entre 2020 e 2100)',
      );
    }

    // Criar DTO manualmente
    const dto: CreateUploadDto = {
      empresaId,
      mes,
      ano,
      templateId:
        templateId && templateId.trim() !== '' ? templateId : undefined,
    };

    console.log('DTO criado:', dto);

    const userId = req.user?.id || 'system';
    return this.uploadsService.create(file, dto, userId);
  }
}
