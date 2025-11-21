import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateConfiguracaoModeloNegocioDto } from './dto/create-configuracao.dto';
import { UpdateConfiguracaoModeloNegocioDto } from './dto/update-configuracao.dto';
import { Prisma, ModeloNegocio } from '@prisma/client';

@Injectable()
export class ConfiguracaoModeloNegocioService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateConfiguracaoModeloNegocioDto) {
    // Verificar se já existe configuração para este modelo
    const existente = await this.prisma.configuracaoModeloNegocio.findUnique({
      where: { modeloNegocio: dto.modeloNegocio },
    });

    if (existente) {
      throw new ConflictException(
        `Já existe uma configuração para o modelo de negócio ${dto.modeloNegocio}`,
      );
    }

    return this.prisma.configuracaoModeloNegocio.create({
      data: {
        modeloNegocio: dto.modeloNegocio,
        modeloNegocioDetalhes:
          dto.modeloNegocioDetalhes as Prisma.InputJsonValue,
        contasReceita: dto.contasReceita as Prisma.InputJsonValue,
        contasCustos: dto.contasCustos as Prisma.InputJsonValue,
        custosCentralizados: dto.custosCentralizados,
        receitasCentralizadas: dto.receitasCentralizadas,
        descricao: dto.descricao,
        ativo: dto.ativo ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.configuracaoModeloNegocio.findMany({
      orderBy: { modeloNegocio: 'asc' },
    });
  }

  async findOne(modeloNegocio: string) {
    const configuracao = await this.prisma.configuracaoModeloNegocio.findUnique(
      {
        where: { modeloNegocio: modeloNegocio as ModeloNegocio },
      },
    );

    if (!configuracao) {
      throw new NotFoundException(
        `Configuração não encontrada para o modelo de negócio ${modeloNegocio}`,
      );
    }

    return configuracao;
  }

  async update(modeloNegocio: string, dto: UpdateConfiguracaoModeloNegocioDto) {
    // Verificar se existe
    await this.findOne(modeloNegocio);

    const updateData: Prisma.ConfiguracaoModeloNegocioUpdateInput = {};

    if (dto.modeloNegocioDetalhes !== undefined) {
      updateData.modeloNegocioDetalhes =
        dto.modeloNegocioDetalhes as Prisma.InputJsonValue;
    }

    if (dto.contasReceita !== undefined) {
      updateData.contasReceita = dto.contasReceita as Prisma.InputJsonValue;
    }

    if (dto.contasCustos !== undefined) {
      updateData.contasCustos = dto.contasCustos as Prisma.InputJsonValue;
    }

    if (dto.custosCentralizados !== undefined) {
      updateData.custosCentralizados = dto.custosCentralizados;
    }

    if (dto.receitasCentralizadas !== undefined) {
      updateData.receitasCentralizadas = dto.receitasCentralizadas;
    }

    if (dto.descricao !== undefined) {
      updateData.descricao = dto.descricao;
    }

    if (dto.ativo !== undefined) {
      updateData.ativo = dto.ativo;
    }

    return this.prisma.configuracaoModeloNegocio.update({
      where: { modeloNegocio: modeloNegocio as ModeloNegocio },
      data: updateData,
    });
  }

  async remove(modeloNegocio: string) {
    await this.findOne(modeloNegocio);

    return this.prisma.configuracaoModeloNegocio.delete({
      where: { modeloNegocio: modeloNegocio as ModeloNegocio },
    });
  }
}
