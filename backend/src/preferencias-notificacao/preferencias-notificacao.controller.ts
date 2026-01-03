import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PreferenciasNotificacaoService } from './preferencias-notificacao.service';
import { CreatePreferenciaNotificacaoDto } from './dto/create-preferencia-notificacao.dto';
import { UpdatePreferenciaNotificacaoDto } from './dto/update-preferencia-notificacao.dto';

@Controller('preferencias-notificacao')
@UseGuards(JwtAuthGuard)
export class PreferenciasNotificacaoController {
  constructor(
    private readonly preferenciasService: PreferenciasNotificacaoService,
  ) {}

  @Get()
  async findOne(@Request() req: { user?: { id?: string } }) {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }
    return this.preferenciasService.findOne(usuarioId);
  }

  @Post()
  async create(
    @Body() dto: CreatePreferenciaNotificacaoDto,
    @Request() req: { user?: { id?: string } },
  ) {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }
    return this.preferenciasService.create(usuarioId, dto);
  }

  @Put()
  async update(
    @Body() dto: UpdatePreferenciaNotificacaoDto,
    @Request() req: { user?: { id?: string } },
  ) {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }
    return this.preferenciasService.update(usuarioId, dto);
  }
}
