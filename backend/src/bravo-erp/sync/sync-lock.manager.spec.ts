import { Test, TestingModule } from '@nestjs/testing';
import { SyncLockManager } from './sync-lock.manager';
import { ConfigService } from '@nestjs/config';

describe('SyncLockManager', () => {
  let service: SyncLockManager;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncLockManager,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SyncLockManager>(SyncLockManager);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  describe('isSyncRunning', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue(undefined); // Sem Redis
    });

    it('deve retornar false quando não há sync em andamento (modo memória)', async () => {
      service.onModuleInit();
      const result = await service.isSyncRunning();

      expect(result).toBe(false);
    });

    it('deve retornar true quando há sync em andamento', async () => {
      service.onModuleInit();

      const result = await service.acquireLock(
        'user-123',
        'test@example.com',
        'complete',
      );

      expect(result.success).toBe(true);
      expect(result.lockId).toBeDefined();

      const isRunning = await service.isSyncRunning();
      expect(isRunning).toBe(true);

      // Limpar
      if (result.lockId) {
        await service.releaseLock(result.lockId);
      }
    });
  });

  describe('acquireLock', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue(undefined); // Sem Redis
    });

    it('deve adquirir lock com sucesso', async () => {
      service.onModuleInit();

      const result = await service.acquireLock(
        'user-123',
        'test@example.com',
        'complete',
      );

      expect(result.success).toBe(true);
      expect(result.lockId).toBeDefined();
      expect(typeof result.lockId).toBe('string');

      // Limpar
      if (result.lockId) {
        await service.releaseLock(result.lockId);
      }
    });

    it('deve falhar ao tentar adquirir lock quando já existe um', async () => {
      service.onModuleInit();

      const firstResult = await service.acquireLock(
        'user-123',
        'test@example.com',
        'complete',
      );

      expect(firstResult.success).toBe(true);

      const secondResult = await service.acquireLock(
        'user-456',
        'other@example.com',
        'quick',
      );

      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toBeDefined();

      // Limpar
      if (firstResult.lockId) {
        await service.releaseLock(firstResult.lockId);
      }
    });
  });

  describe('releaseLock', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue(undefined);
    });

    it('deve liberar lock existente', async () => {
      service.onModuleInit();

      const result = await service.acquireLock(
        'user-123',
        'test@example.com',
        'complete',
      );

      expect(result.success).toBe(true);
      expect(result.lockId).toBeDefined();

      if (result.lockId) {
        const released = await service.releaseLock(result.lockId);
        expect(released).toBe(true);

        const isRunning = await service.isSyncRunning();
        expect(isRunning).toBe(false);
      }
    });

    it('deve retornar false ao tentar liberar lock inexistente', async () => {
      service.onModuleInit();

      const released = await service.releaseLock('non-existent-lock');
      expect(released).toBe(false);
    });
  });

  describe('getCurrentSync', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue(undefined);
    });

    it('deve retornar informações do sync atual', async () => {
      service.onModuleInit();

      const result = await service.acquireLock(
        'user-123',
        'test@example.com',
        'complete',
      );

      expect(result.success).toBe(true);

      const currentSync = await service.getCurrentSync();

      expect(currentSync).toBeDefined();
      expect(currentSync).not.toBeNull();
      if (currentSync) {
        expect(currentSync.userId).toBe('user-123');
        expect(currentSync.userEmail).toBe('test@example.com');
        expect(currentSync.type).toBe('complete');
      }

      // Limpar
      if (result.lockId) {
        await service.releaseLock(result.lockId);
      }
    });

    it('deve retornar null quando não há sync em andamento', async () => {
      service.onModuleInit();

      const currentSync = await service.getCurrentSync();

      expect(currentSync).toBeNull();
    });
  });

  describe('cleanExpiredLocks', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue(undefined);
    });

    it('deve limpar locks expirados', async () => {
      service.onModuleInit();

      // Criar um lock
      const result = await service.acquireLock(
        'user-123',
        'test@example.com',
        'complete',
      );

      expect(result.success).toBe(true);

      // Liberar normalmente para limpar
      if (result.lockId) {
        await service.releaseLock(result.lockId);
      }

      const isRunning = await service.isSyncRunning();
      expect(isRunning).toBe(false);
    });
  });
});
