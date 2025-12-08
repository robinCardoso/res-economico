import { Test, TestingModule } from '@nestjs/testing';
import { StatsService } from './stats.service';
import { PrismaService } from '../../core/prisma/prisma.service';

describe('StatsService', () => {
  let service: StatsService;

  const mockPrismaService = {
    produto: {
      count: jest.fn(),
    },
    bravoSyncLog: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<StatsService>(StatsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  describe('getStats', () => {
    it('deve retornar estatísticas corretas', async () => {
      mockPrismaService.produto.count
        .mockResolvedValueOnce(100) // totalProdutos
        .mockResolvedValueOnce(80); // produtosAtivos

      mockPrismaService.bravoSyncLog.findFirst.mockResolvedValue({
        id: 'log-id',
        sync_type: 'complete',
        status: 'completed',
        started_at: new Date('2025-01-20'),
        completed_at: new Date('2025-01-20'),
        total_produtos_bravo: 150,
        produtos_inseridos: 50,
        produtos_atualizados: 30,
      });

      mockPrismaService.bravoSyncLog.findMany.mockResolvedValue([
        {
          id: 'log-id',
          sync_type: 'complete',
          status: 'completed',
          started_at: new Date('2025-01-20'),
          completed_at: new Date('2025-01-20'),
          total_produtos_bravo: 150,
        },
      ]);

      const result = await service.getStats(false);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.totalProdutos).toBe(100);
      expect(result.produtosAtivos).toBe(80);
      expect(result.ultimoSync).toBeDefined();
      expect(result.ultimosSyncs).toHaveLength(1);
    });

    it('deve usar cache quando disponível', async () => {
      // Primeira chamada - popula cache (2 chamadas ao count: total e ativos)
      mockPrismaService.produto.count
        .mockResolvedValueOnce(100) // totalProdutos
        .mockResolvedValueOnce(80); // produtosAtivos
      mockPrismaService.bravoSyncLog.findFirst.mockResolvedValue(null);
      mockPrismaService.bravoSyncLog.findMany.mockResolvedValue([]);

      await service.getStats(false);

      // Segunda chamada - deve usar cache (não chama count novamente)
      const result = await service.getStats(false);

      expect(result.debug?.fromCache).toBe(true);
      expect(mockPrismaService.produto.count).toHaveBeenCalledTimes(2); // 2 na primeira chamada, 0 na segunda (cache)
    });

    it('deve forçar refresh quando solicitado', async () => {
      // Primeira chamada: 2 counts (total + ativos)
      mockPrismaService.produto.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(80);
      mockPrismaService.bravoSyncLog.findFirst.mockResolvedValue(null);
      mockPrismaService.bravoSyncLog.findMany.mockResolvedValue([]);

      await service.getStats(false);

      // Segunda chamada com force refresh: mais 2 counts
      mockPrismaService.produto.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(80);
      await service.getStats(true); // Force refresh

      expect(mockPrismaService.produto.count).toHaveBeenCalledTimes(4); // 2 + 2
    });

    it('deve retornar valores padrão quando não há produtos', async () => {
      mockPrismaService.produto.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrismaService.bravoSyncLog.findFirst.mockResolvedValue(null);
      mockPrismaService.bravoSyncLog.findMany.mockResolvedValue([]);

      const result = await service.getStats(false);

      expect(result.totalProdutos).toBe(0);
      expect(result.produtosAtivos).toBe(0);
      expect(result.ultimoSync).toBeNull();
      expect(result.ultimosSyncs).toEqual([]);
    });

    it('deve tratar erros corretamente', async () => {
      mockPrismaService.produto.count.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.getStats(false);

      expect(result.success).toBe(false);
      expect(result.totalProdutos).toBe(0);
    });
  });
});
