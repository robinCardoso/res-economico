import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { AuditoriaService } from './auditoria/auditoria.service';

@Module({
  providers: [PrismaService, AuditoriaService],
  exports: [PrismaService, AuditoriaService],
})
export class CoreModule {}
