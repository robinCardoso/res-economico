import { Test, TestingModule } from '@nestjs/testing';
import { BravoConfigService } from './bravo-config.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('BravoConfigService', () => {
  let service: BravoConfigService;
  let prisma: PrismaService;

  // Mock do PrismaService
  const mockPrismaService = {
    bravoSyncConfig: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BravoConfigService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BravoConfigService>(BravoConfigService);
    prisma = module.get<PrismaService>(PrismaService);

    // Limpar mocks antes de cada teste
    jest.clearAllMocks();
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  describe('getConfig', () => {
    it('deve retornar configuração padrão quando não há configurações no banco', async () => {
      mockPrismaService.bravoSyncConfig.findMany.mockResolvedValue([]);

      const result = await service.getConfig();

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.config?.baseUrl).toBe('https://v2.bravoerp.com.br');
      expect(result.config?.cliente).toBe('redeuniao_sc');
      expect(result.config?.ambiente).toBe('p');
      expect(prisma.bravoSyncConfig.findMany).toHaveBeenCalledTimes(1);
    });

    it('deve retornar configuração do banco quando existir', async () => {
      mockPrismaService.bravoSyncConfig.findMany.mockResolvedValue([
        { chave: 'bravo_base_url', valor: 'https://custom.bravoerp.com.br' },
        { chave: 'bravo_cliente', valor: 'test_cliente' },
        { chave: 'bravo_email', valor: 'test@example.com' },
        { chave: 'bravo_ambiente', valor: 'h' },
      ]);

      const result = await service.getConfig();

      expect(result.success).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.config?.baseUrl).toBe('https://custom.bravoerp.com.br');
      expect(result.config?.cliente).toBe('test_cliente');
      expect(result.config?.email).toBe('test@example.com');
      expect(result.config?.ambiente).toBe('h');
    });
  });

  describe('saveConfig', () => {
    it('deve criar configuração quando não existe', async () => {
      mockPrismaService.bravoSyncConfig.upsert.mockResolvedValue({
        chave: 'bravo_base_url',
        valor: 'https://new.bravoerp.com.br',
      });

      const config = {
        baseUrl: 'https://new.bravoerp.com.br',
        cliente: 'new_cliente',
        ambiente: 'p' as const,
      };

      const result = await service.saveConfig(config);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockPrismaService.bravoSyncConfig.upsert).toHaveBeenCalled();
    });

    it('deve lançar exceção quando campos obrigatórios estão faltando', async () => {
      const config = {
        ambiente: 'p' as const,
        // Faltando baseUrl e cliente
      };

      await expect(service.saveConfig(config as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getConfig - tratamento de erros', () => {
    it('deve retornar erro quando há problema no banco', async () => {
      mockPrismaService.bravoSyncConfig.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.getConfig();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
