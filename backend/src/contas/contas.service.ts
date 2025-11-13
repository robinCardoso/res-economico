import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';

@Injectable()
export class ContasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.contaCatalogo.findMany({
      include: {
        empresa: true,
      },
      orderBy: { classificacao: 'asc' },
    });
  }
}
