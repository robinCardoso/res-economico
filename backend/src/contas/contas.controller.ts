import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ContasService } from './contas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilterContasDto } from './dto/filter-contas.dto';

@Controller('contas')
@UseGuards(JwtAuthGuard)
export class ContasController {
  constructor(private readonly contasService: ContasService) {}

  @Get()
  list(@Query() filters: FilterContasDto) {
    return this.contasService.findAll(filters);
  }
}
