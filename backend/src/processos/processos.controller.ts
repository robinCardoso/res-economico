import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ProcessosService } from './processos.service';
import { CreateProcessoDto } from './dto/create-processo.dto';
import { UpdateProcessoDto } from './dto/update-processo.dto';
import { FilterProcessosDto } from './dto/filter-processos.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('processos')
@UseGuards(JwtAuthGuard)
export class ProcessosController {
  constructor(private readonly processosService: ProcessosService) {}

  @Post()
  async create(
    @Body() createDto: CreateProcessoDto,
    @Request() req: ExpressRequest & { user: { id: string } },
  ) {
    return this.processosService.create(createDto, req.user.id);
  }

  @Get()
  async findAll(@Query() filterDto: FilterProcessosDto) {
    return this.processosService.findAll(filterDto);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('user_email') userEmail: string,
  ) {
    return this.processosService.findOne(id, userEmail);
  }

  @Put()
  async update(
    @Body() updateDto: UpdateProcessoDto,
    @Request() req: ExpressRequest & { user: { id: string } },
  ) {
    return this.processosService.update(updateDto, req.user.id);
  }
}
