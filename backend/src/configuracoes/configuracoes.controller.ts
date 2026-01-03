import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { ConfiguracoesService } from './configuracoes.service';
import { CreateConfiguracaoEmailDto } from './dto/create-configuracao-email.dto';
import { UpdateConfiguracaoEmailDto } from './dto/update-configuracao-email.dto';
import { TestarEmailDto } from './dto/testar-email.dto';
import { FilterLogsEmailDto } from './dto/filter-logs-email.dto';

@Controller('configuracoes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ConfiguracoesController {
  constructor(private readonly configuracoesService: ConfiguracoesService) {}

  @Get('email')
  async findAll() {
    return this.configuracoesService.findAll();
  }

  @Get('email/:id')
  async findOne(@Param('id') id: string) {
    return this.configuracoesService.findOne(id);
  }

  @Post('email')
  async create(@Body() dto: CreateConfiguracaoEmailDto) {
    return this.configuracoesService.create(dto);
  }

  @Put('email/:id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateConfiguracaoEmailDto,
  ) {
    return this.configuracoesService.update(id, dto);
  }

  @Delete('email/:id')
  async remove(@Param('id') id: string) {
    return this.configuracoesService.remove(id);
  }

  @Post('email/:id/testar')
  async testarEmail(@Param('id') id: string, @Body() dto: TestarEmailDto) {
    return this.configuracoesService.testarEmail(id, dto);
  }

  @Post('email/:id/testar-conexao')
  async testarConexao(@Param('id') id: string) {
    return this.configuracoesService.testarConexao(id);
  }

  @Get('email/logs')
  async listarLogs(@Query() filters: FilterLogsEmailDto) {
    return this.configuracoesService.listarLogs(filters);
  }
}
