import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { FilterContasDto } from './dto/filter-contas.dto';

@Injectable()
export class ContasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters?: FilterContasDto) {
    const where: any = {};

    // Filtro por status
    if (filters?.status) {
      where.status = filters.status;
    }

    // Filtro por tipo de conta
    if (filters?.tipoConta) {
      where.tipoConta = filters.tipoConta;
    }

    // Filtro por nível
    if (filters?.nivel) {
      where.nivel = filters.nivel;
    }

    // Filtro por prefixo de classificação (prioridade sobre busca)
    if (filters?.classificacaoPrefix) {
      where.classificacao = {
        startsWith: filters.classificacaoPrefix,
      };
    } else if (filters?.busca) {
      // Busca por texto (classificação ou nome da conta) - apenas se não houver prefixo
      where.OR = [
        { classificacao: { contains: filters.busca } },
        { nomeConta: { contains: filters.busca } },
      ];
    }

    return this.prisma.contaCatalogo.findMany({
      where,
      orderBy: { classificacao: 'asc' },
    });
  }
}
