import { Test, TestingModule } from '@nestjs/testing';
import { SyncLogService } from './sync-log.service';
import { PrismaService } from '../../core/prisma/prisma.service';
describe('SyncLogService', () => {
  let service: SyncLogService;

  const mockPrismaService = {
    bravoSyncLog: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncLogService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SyncLogService>(SyncLogService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  describe('createLog', () => {
    it('deve criar log de sincronização com dados corretos', async () => {
      const mockLogId = 'log-123';
      mockPrismaService.bravoSyncLog.create.mockResolvedValue({
        id: mockLogId,
        sync_type: 'complete',
        status: 'running',
        started_at: new Date(),
      });

      const logData = {
        sync_type: 'complete',
        apenas_ativos: true,
        userId: 'user-123',
      };

      const result = await service.createLog(logData);

      expect(result).toBe(mockLogId);
      expect(mockPrismaService.bravoSyncLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sync_type: 'complete',
          status: 'running',
          apenas_ativos: true,
          userId: 'user-123',
        }) as unknown,
      });
    });

    it('deve usar valores padrão quando campos opcionais não são fornecidos', async () => {
      mockPrismaService.bravoSyncLog.create.mockResolvedValue({
        id: 'log-123',
      });

      await service.createLog({
        sync_type: 'quick',
        apenas_ativos: false,
      });

      expect(mockPrismaService.bravoSyncLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          triggered_by: 'admin_user',
          user_agent: 'unknown',
        }) as unknown,
      });
    });
  });

  describe('getLogById', () => {
    it('deve retornar log quando existe', async () => {
      const mockLog = {
        id: 'log-123',
        sync_type: 'complete',
        status: 'completed',
      };

      mockPrismaService.bravoSyncLog.findUnique.mockResolvedValue(mockLog);

      const result = await service.getLogById('log-123');

      expect(result).toEqual(mockLog);
      expect(mockPrismaService.bravoSyncLog.findUnique).toHaveBeenCalledWith({
        where: { id: 'log-123' },
      });
    });

    it('deve retornar null quando log não existe', async () => {
      mockPrismaService.bravoSyncLog.findUnique.mockResolvedValue(null);

      const result = await service.getLogById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateLog', () => {
    it('deve atualizar log com campos fornecidos', async () => {
      // Mock: log existe
      mockPrismaService.bravoSyncLog.findUnique.mockResolvedValue({
        id: 'log-123',
        status: 'running',
      });

      mockPrismaService.bravoSyncLog.update.mockResolvedValue({
        id: 'log-123',
        status: 'completed',
        produtos_inseridos: 10,
      });

      const updates = {
        status: 'completed',
        produtos_inseridos: 10,
      };

      const result = await service.updateLog('log-123', updates);

      expect(result.success).toBe(true);
      expect(mockPrismaService.bravoSyncLog.findUnique).toHaveBeenCalled();
      expect(mockPrismaService.bravoSyncLog.update).toHaveBeenCalled();
    });

    it('deve retornar erro quando log não existe', async () => {
      mockPrismaService.bravoSyncLog.findUnique.mockResolvedValue(null);

      const result = await service.updateLog('non-existent', {
        status: 'completed',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Log não encontrado');
      expect(mockPrismaService.bravoSyncLog.update).not.toHaveBeenCalled();
    });

    it('deve atualizar last_activity_at automaticamente', async () => {
      mockPrismaService.bravoSyncLog.findUnique.mockResolvedValue({
        id: 'log-123',
        status: 'running',
      });

      mockPrismaService.bravoSyncLog.update.mockResolvedValue({
        id: 'log-123',
      });

      await service.updateLog('log-123', { status: 'running' });

      const updateCall = (
        mockPrismaService.bravoSyncLog.update.mock.calls[0] as
          | [{ data?: { last_activity_at?: unknown } }]
          | undefined
      )?.[0] as { data?: { last_activity_at?: unknown } } | undefined;
      expect(updateCall?.data?.last_activity_at).toBeDefined();
    });
  });

  describe('listLogs', () => {
    it('deve listar logs com filtros', async () => {
      const mockLogs = [
        { id: 'log-1', status: 'completed' },
        { id: 'log-2', status: 'completed' },
      ];

      mockPrismaService.bravoSyncLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.listLogs({
        limit: 10,
        status: 'completed',
      });

      expect(result).toEqual(mockLogs);
      const findManyMock = mockPrismaService.bravoSyncLog.findMany;
      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          where: expect.objectContaining({
            status: 'completed',
          }),
        }) as unknown,
      );
    });

    it('deve retornar logs retomáveis', async () => {
      const mockLogs = [{ id: 'log-1', can_resume: true }];

      mockPrismaService.bravoSyncLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.listResumableLogs();

      expect(result).toEqual(mockLogs);
      const findManyMock = mockPrismaService.bravoSyncLog.findMany;
      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            can_resume: true,
          }),
        }) as unknown,
      );
    });
  });
});
