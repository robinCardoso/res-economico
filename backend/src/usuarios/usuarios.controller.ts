import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuariosClientesService } from './usuarios-clientes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { FilterUsuariosDto } from './dto/filter-usuarios.dto';
import { CreateUsuarioClienteDto } from './dto/create-usuario-cliente.dto';
import { BulkCreateUsuarioClienteDto } from './dto/bulk-create-usuario-cliente.dto';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly clientesService: UsuariosClientesService,
  ) {}

  // ===== CRUD de Usuários =====

  @Get()
  @Roles('admin')
  findAll(@Query() filters: FilterUsuariosDto) {
    return this.usuariosService.findAll(filters);
  }

  @Get('me')
  getMe(@Request() req: { user: { id: string } }) {
    return this.usuariosService.findOne(req.user.id);
  }

  @Get(':id')
  @Roles('admin')
  findOne(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.usuariosService.findOne(id, req.user.id);
  }

  @Post()
  @Roles('admin')
  create(
    @Body() dto: CreateUsuarioDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.usuariosService.create(dto, req.user.id);
  }

  @Put(':id')
  @Roles('admin')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUsuarioDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.usuariosService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.usuariosService.remove(id, req.user.id);
  }

  @Patch(':id/toggle-status')
  @Roles('admin')
  toggleStatus(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.usuariosService.toggleStatus(id, req.user.id);
  }

  @Post(':id/reset-password')
  @Roles('admin')
  resetPassword(
    @Param('id') id: string,
    @Body() body: { novaSenha: string },
    @Request() req: { user: { id: string } },
  ) {
    return this.usuariosService.resetPassword(id, body.novaSenha, req.user.id);
  }

  @Put('me/change-password')
  changeMyPassword(
    @Body() body: { senhaAtual: string; novaSenha: string },
    @Request() req: { user: { id: string } },
  ) {
    return this.usuariosService.changeMyPassword(
      req.user.id,
      body.senhaAtual,
      body.novaSenha,
    );
  }

  // ===== Associação com Clientes =====

  @Get(':id/clientes')
  @Roles('admin')
  getClientesAssociados(@Param('id') id: string) {
    return this.clientesService.findClientesByUsuario(id);
  }

  @Post(':id/clientes')
  @Roles('admin')
  associateCliente(
    @Param('id') id: string,
    @Body() dto: CreateUsuarioClienteDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.clientesService.associateCliente(id, dto, req.user.id);
  }

  @Post(':id/clientes/bulk')
  @Roles('admin')
  bulkAssociateClientes(
    @Param('id') id: string,
    @Body() dto: BulkCreateUsuarioClienteDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.clientesService.bulkAssociateClientes(id, dto, req.user.id);
  }

  @Put(':id/clientes/:clienteId')
  @Roles('admin')
  updateClienteAssociation(
    @Param('id') usuarioId: string,
    @Param('clienteId') clienteId: string,
    @Body() body: { permissoes: any },
    @Request() req: { user: { id: string } },
  ) {
    return this.clientesService.updateClienteAssociation(
      usuarioId,
      clienteId,
      body.permissoes,
      req.user.id,
    );
  }

  @Delete(':id/clientes/:clienteId')
  @Roles('admin')
  removeClienteAssociation(
    @Param('id') usuarioId: string,
    @Param('clienteId') clienteId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.clientesService.removeClienteAssociation(
      usuarioId,
      clienteId,
      req.user.id,
    );
  }

  @Get('clientes/disponiveis')
  @Roles('admin')
  getClientesDisponiveis() {
    return this.clientesService.getClientesDisponiveis();
  }
}
