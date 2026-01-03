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
import { EmpresaDeletionService } from './services/empresa-deletion.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { DeleteEmpresaDto } from './dto/delete-empresa.dto';

@Controller('empresas')
@UseGuards(JwtAuthGuard)
export class EmpresasController {
  constructor(
    private readonly empresasService: EmpresasService,
    private readonly deletionService: EmpresaDeletionService,
  ) {}

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

  /**
   * Valida se uma empresa pode ser deletada
   * Retorna informações sobre dados associados que impedem a deleção
   */
  @Get(':id/validar-delecao')
  async validarDelecao(@Param('id') id: string) {
    return this.deletionService.validarDelecao(id);
  }

  /**
   * Deleta uma empresa com segurança
   * Pode deletar dados associados automaticamente se forceDelete=true
   */
  @Delete(':id/deletar-seguro')
  async deletarSeguro(
    @Param('id') id: string,
    @Body() dto: DeleteEmpresaDto,
    @Request() req: { user?: { id?: string } },
  ) {
    return this.deletionService.deletarEmpresa(id, dto);
  }
}
