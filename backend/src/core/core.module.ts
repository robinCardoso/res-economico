import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { CacheService } from './cache/cache.service';
import { AuditoriaService } from './auditoria/auditoria.service';

@Global()
@Module({
  providers: [PrismaService, CacheService, AuditoriaService],
  exports: [PrismaService, CacheService, AuditoriaService],
})
export class CoreModule {}