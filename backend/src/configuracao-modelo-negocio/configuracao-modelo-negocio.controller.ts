import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConfiguracaoModeloNegocioService } from './configuracao-modelo-negocio.service';
import { CreateConfiguracaoModeloNegocioDto } from './dto/create-configuracao.dto';
import { UpdateConfiguracaoModeloNegocioDto } from './dto/update-configuracao.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('configuracao-modelo-negocio')
@UseGuards(JwtAuthGuard)
export class ConfiguracaoModeloNegocioController {
  constructor(
    private readonly configuracaoService: ConfiguracaoModeloNegocioService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateConfiguracaoModeloNegocioDto) {
    return this.configuracaoService.create(createDto);
  }

  @Get()
  findAll() {
    return this.configuracaoService.findAll();
  }

  @Get(':modeloNegocio')
  findOne(@Param('modeloNegocio') modeloNegocio: string) {
    return this.configuracaoService.findOne(modeloNegocio);
  }

  @Patch(':modeloNegocio')
  update(
    @Param('modeloNegocio') modeloNegocio: string,
    @Body() updateDto: UpdateConfiguracaoModeloNegocioDto,
  ) {
    return this.configuracaoService.update(modeloNegocio, updateDto);
  }

  @Delete(':modeloNegocio')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('modeloNegocio') modeloNegocio: string) {
    return this.configuracaoService.remove(modeloNegocio);
  }
}
