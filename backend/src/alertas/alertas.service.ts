import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';

@Injectable()
export class AlertasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.alerta.findMany({
      include: {
        upload: true,
        linha: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
