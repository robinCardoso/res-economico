import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditoriaService } from '../../core/auditoria/auditoria.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class EmpresasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  findAll() {
    return this.prisma.empresa.findMany({
      orderBy: { razaoSocial: 'asc' },
    });
  }

  async findOne(id: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id },
    });

    if (!empresa) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return empresa;
  }

  async create(dto: CreateEmpresaDto, userId?: string) {
    // Remove formatação do CNPJ
    const cnpjLimpo = dto.cnpj.replace(/\D/g, '');

    // Verificar se já existe empresa com este CNPJ
    const empresaExistente = await this.prisma.empresa.findUnique({
      where: { cnpj: cnpjLimpo },
    });

    if (empresaExistente) {
      throw new BadRequestException('Já existe uma empresa com este CNPJ');
    }

    const empresa = await this.prisma.empresa.create({
      data: {
        cnpj: cnpjLimpo,
        razaoSocial: dto.razaoSocial,
        filial: dto.filial || null,
        tipo: dto.tipo || 'MATRIZ',
        uf: dto.uf || null,
        setor: dto.setor || null,
        porte: dto.porte || null,
        dataFundacao: dto.dataFundacao ? new Date(dto.dataFundacao) : null,
        descricao: dto.descricao || null,
        website: dto.website || null,
        modeloNegocio: dto.modeloNegocio || null,
        modeloNegocioDetalhes: dto.modeloNegocioDetalhes
          ? (dto.modeloNegocioDetalhes as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        contasReceita: dto.contasReceita
          ? (dto.contasReceita as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        custosCentralizados: dto.custosCentralizados ?? null,
        contasCustos: dto.contasCustos
          ? (dto.contasCustos as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });

    // Registrar auditoria
    if (userId) {
      await this.auditoria.registrarEmpresa(userId, empresa.id, 'CRIAR');
    }

    return empresa;
  }

  async update(id: string, dto: UpdateEmpresaDto, userId?: string) {
    await this.findOne(id); // Verificar se existe

    // Preparar dados com cast correto para campos JSON
    const updateData: Prisma.EmpresaUpdateInput = {
      ...(dto.razaoSocial !== undefined && { razaoSocial: dto.razaoSocial }),
      ...(dto.filial !== undefined && {
        filial: dto.filial || null,
      }),
      ...(dto.tipo !== undefined && { tipo: dto.tipo }),
      ...(dto.uf !== undefined && { uf: dto.uf || null }),
      ...(dto.setor !== undefined && { setor: dto.setor || null }),
      ...(dto.porte !== undefined && { porte: dto.porte || null }),
      ...(dto.dataFundacao !== undefined && {
        dataFundacao: dto.dataFundacao ? new Date(dto.dataFundacao) : null,
      }),
      ...(dto.descricao !== undefined && { descricao: dto.descricao || null }),
      ...(dto.website !== undefined && { website: dto.website || null }),
      ...(dto.modeloNegocio !== undefined && {
        modeloNegocio: dto.modeloNegocio || null,
      }),
      ...(dto.modeloNegocioDetalhes !== undefined && {
        modeloNegocioDetalhes: dto.modeloNegocioDetalhes
          ? (dto.modeloNegocioDetalhes as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      }),
      ...(dto.contasReceita !== undefined && {
        contasReceita: dto.contasReceita
          ? (dto.contasReceita as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      }),
      ...(dto.custosCentralizados !== undefined && {
        custosCentralizados: dto.custosCentralizados ?? null,
      }),
      ...(dto.contasCustos !== undefined && {
        contasCustos: dto.contasCustos
          ? (dto.contasCustos as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      }),
    };

    const empresa = await this.prisma.empresa.update({
      where: { id },
      data: updateData,
    });

    // Registrar auditoria
    if (userId) {
      await this.auditoria.registrarEmpresa(userId, id, 'ATUALIZAR');
    }

    return empresa;
  }

  async remove(id: string, userId?: string) {
    await this.findOne(id); // Verificar se existe

    // Verificar se há uploads associados
    const uploads = await this.prisma.upload.count({
      where: { empresaId: id },
    });

    if (uploads > 0) {
      throw new BadRequestException(
        'Não é possível excluir empresa com uploads associados',
      );
    }

    // Contas não estão mais associadas a empresas (catálogo unificado)

    // Verificar se há templates associados
    const templates = await this.prisma.templateImportacao.count({
      where: { empresaId: id },
    });

    if (templates > 0) {
      throw new BadRequestException(
        'Não é possível excluir empresa com templates associados',
      );
    }

    // Verificar se há usuários associados
    const usuarios = await this.prisma.usuario.count({
      where: { empresaId: id },
    });

    if (usuarios > 0) {
      throw new BadRequestException(
        'Não é possível excluir empresa com usuários associados',
      );
    }

    await this.prisma.empresa.delete({
      where: { id },
    });

    // Registrar auditoria
    if (userId) {
      await this.auditoria.registrarEmpresa(userId, id, 'REMOVER');
    }

    return { message: 'Empresa removida com sucesso' };
  }
}
