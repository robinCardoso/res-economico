import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { LogAlteracoesService } from './log-alteracoes.service';
import { CreateLogDto } from './dto/create-log.dto';
import { FilterLogsDto } from './dto/filter-logs.dto';

@Controller('log-alteracoes')
@UseGuards(JwtAuthGuard)
export class LogAlteracoesController {
  constructor(private readonly logService: LogAlteracoesService) {}

  @Get()
  async findAll(@Query() filters: FilterLogsDto) {
    return this.logService.findAll(filters);
  }

  @Get('ata/:ataId')
  async findByAta(@Param('ataId') ataId: string) {
    return this.logService.findByAta(ataId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.logService.findOne(id);
  }

  @Post()
  async create(
    @Body() dto: CreateLogDto,
    @Request() req: { user?: { id?: string } },
  ) {
    // Se não tiver usuarioId no DTO, usar o do token
    if (!dto.usuarioId && req.user?.id) {
      dto.usuarioId = req.user.id;
    }
    return this.logService.create(dto);
  }
}
