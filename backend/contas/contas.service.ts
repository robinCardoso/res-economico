import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { FilterContasDto } from './dto/filter-contas.dto';

@Injectable()
export class ContasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters?: FilterContasDto) {
    const where: Record<string, unknown> = {};

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

    // Filtro por conta (se fornecido, busca exata)
    if (filters?.conta) {
      where.conta = filters.conta;
    }

    // Filtro por subConta (se fornecido, busca exata)
    if (filters?.subConta !== undefined) {
      where.subConta = filters.subConta || '';
    }

    // Filtro por prefixo de classificação (prioridade sobre busca)
    if (filters?.classificacaoPrefix) {
      where.classificacao = {
        startsWith: filters.classificacaoPrefix,
      };
    } else if (filters?.busca) {
      // Busca por texto (classificação ou nome da conta) - case-insensitive
      // No PostgreSQL, usar Prisma.sql com ILIKE para busca case-insensitive
      const buscaTerm = filters.busca.trim();
      where.OR = [
        {
          classificacao: {
            contains: buscaTerm,
            mode: 'insensitive',
          },
        },
        {
          nomeConta: {
            contains: buscaTerm,
            mode: 'insensitive',
          },
        },
      ];
    }

    return this.prisma.contaCatalogo.findMany({
      where,
      orderBy: { classificacao: 'asc' },
    });
  }
}
