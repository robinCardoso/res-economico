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
  FileTypeValidator,
  Request,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { ExcelProcessorService } from './excel-processor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUploadDto } from './dto/create-upload.dto';
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
          new FileTypeValidator({ fileType: /(xls|xlsx)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: CreateUploadDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'system';
    return this.uploadsService.create(file, dto, userId);
  }
}
