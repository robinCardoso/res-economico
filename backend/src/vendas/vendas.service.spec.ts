import { Test, TestingModule } from '@nestjs/testing';
import { VendasService } from './vendas.service';
import { PrismaService } from '../core/prisma/prisma.service';

describe('VendasService', () => {
  let service: VendasService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendasService,
        {
          provide: PrismaService,
          useValue: {
            venda: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
              aggregate: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<VendasService>(VendasService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  it('deve criar uma venda', async () => {
    const createVendaDto = {
      nfe: '123456',
      dataVenda: '2024-01-01',
      razaoSocial: 'Teste Cliente',
      quantidade: 10,
      valorUnitario: 100,
      valorTotal: 1000,
    };

    const vendaMock = { id: '1', ...createVendaDto };
    jest.spyOn(prisma.venda, 'create').mockResolvedValue(vendaMock as any);

    const result = await service.create(createVendaDto as any);
    expect(result).toEqual(vendaMock);
    expect(prisma.venda.create).toHaveBeenCalledWith({
      data: createVendaDto,
    });
  });
});
