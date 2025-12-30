import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

@Controller('empresas')
@UseGuards(JwtAuthGuard)
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Get()
  list() {
    return this.empresasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.empresasService.findOne(id);
  }

  @Post()
  create(
    @Body() dto: CreateEmpresaDto,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id || 'system';
    return this.empresasService.create(dto, userId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmpresaDto,
    @Request() req: { user?: { id?: string } },
  ) {
    const userId = req.user?.id || 'system';
    return this.empresasService.update(id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: { user?: { id?: string } }) {
    const userId = req.user?.id || 'system';
    return this.empresasService.remove(id, userId);
  }
}
