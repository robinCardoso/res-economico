import { Controller, Get } from '@nestjs/common';
import { ContasService } from './contas.service';

@Controller('contas')
export class ContasController {
  constructor(private readonly contasService: ContasService) {}

  @Get()
  list() {
    return this.contasService.findAll();
  }
}
