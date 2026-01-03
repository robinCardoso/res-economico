import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuditoriaLogService } from './auditoria.service';
import { FilterAuditoriaDto } from './dto/filter-auditoria.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('auditoria')
@UseGuards(JwtAuthGuard)
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaLogService) {}

  @Get()
  list(@Query() filters: FilterAuditoriaDto) {
    return this.auditoriaService.findAll(filters);
  }

  @Get('recursos')
  getRecursos() {
    return this.auditoriaService.getRecursos();
  }

  @Get('acoes')
  getAcoes() {
    return this.auditoriaService.getAcoes();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auditoriaService.findOne(id);
  }
}
