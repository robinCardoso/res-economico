import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.templateImportacao.findMany({
      include: {
        empresa: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
