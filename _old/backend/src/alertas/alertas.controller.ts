import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AlertasService } from './alertas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilterAlertasDto } from './dto/filter-alertas.dto';
import { UpdateAlertaDto } from './dto/update-alerta.dto';

@Controller('alertas')
@UseGuards(JwtAuthGuard)
export class AlertasController {
  constructor(private readonly alertasService: AlertasService) {}

  @Get()
  list(@Query() filters: FilterAlertasDto) {
    return this.alertasService.findAll(filters);
  }

  @Get('contagem-por-tipo-conta')
  getContagemPorTipoConta(@Query() filters: FilterAlertasDto) {
    return this.alertasService.getContagemPorTipoConta(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.alertasService.findOne(id);
  }

  @Get(':id/detalhes')
  findOneDetalhes(@Param('id') id: string) {
    return this.alertasService.findOneDetalhes(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAlertaDto,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id || 'system';
    return this.alertasService.updateStatus(id, dto, userId);
  }
}
