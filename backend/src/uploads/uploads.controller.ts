import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
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
  list() {
    return this.uploadsService.findAll();
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.uploadsService.findOne(id);
  }

  @Patch(':id/reprocessar')
  async reprocessar(@Param('id') id: string) {
    // Limpar linhas e alertas existentes
    await this.uploadsService.limparProcessamento(id);

    // Reprocessar
    await this.excelProcessor.processUpload(id);

    return this.uploadsService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.uploadsService.remove(id);
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
    const mes = typeof mesStr === 'string' ? parseInt(mesStr, 10) : (mesStr as number | undefined);
    const ano = typeof anoStr === 'string' ? parseInt(anoStr, 10) : (anoStr as number | undefined);

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
      throw new BadRequestException('Ano inválido (deve ser entre 2020 e 2100)');
    }

    // Criar DTO manualmente
    const dto: CreateUploadDto = {
      empresaId,
      mes,
      ano,
      templateId: templateId && templateId.trim() !== '' ? templateId : undefined,
    };

    console.log('DTO criado:', dto);

    const userId = req.user?.id || 'system';
    return this.uploadsService.create(file, dto, userId);
  }
}
