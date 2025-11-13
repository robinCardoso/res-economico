import { Controller, Get, UseGuards } from '@nestjs/common';
import { ContasService } from './contas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('contas')
@UseGuards(JwtAuthGuard)
export class ContasController {
  constructor(private readonly contasService: ContasService) {}

  @Get()
  list() {
    return this.contasService.findAll();
  }
}
