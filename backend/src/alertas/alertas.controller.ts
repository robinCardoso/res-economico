import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.alertasService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAlertaDto) {
    return this.alertasService.updateStatus(id, dto);
  }
}
