import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { AuditoriaService } from './auditoria/auditoria.service';
import { CacheModule } from './cache/cache.module';

@Module({
  imports: [CacheModule],
  providers: [PrismaService, AuditoriaService],
  exports: [PrismaService, AuditoriaService, CacheModule],
})
export class CoreModule {}
