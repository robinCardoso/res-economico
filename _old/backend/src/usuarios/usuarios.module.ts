import { Module } from '@nestjs/common';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { UsuariosClientesService } from './usuarios-clientes.service';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [CoreModule],
  controllers: [UsuariosController],
  providers: [UsuariosService, UsuariosClientesService],
  exports: [UsuariosService, UsuariosClientesService],
})
export class UsuariosModule {}
