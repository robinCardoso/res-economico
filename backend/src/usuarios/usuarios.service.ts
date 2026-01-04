import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { FilterUsuariosDto } from './dto/filter-usuarios.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUsuarioDto, createdBy: string) {
    // Verificar se email já existe
    const existente = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (existente) {
      throw new ConflictException('E-mail já cadastrado no sistema');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(dto.senha, 10);

    const usuario = await this.prisma.usuario.create({
      data: {
        ...dto,
        senha: hashedPassword,
      },
      include: {}, // Sem relacionamento de empresa
    });

    // Não retornar senha
    const { senha, ...result } = usuario;

    // Log de auditoria
    await this.prisma.logAuditoria.create({
      data: {
        recurso: 'Usuario',
        acao: 'CRIAR',
        usuarioId: createdBy,
        dados: {
          usuarioId: usuario.id,
          email: usuario.email,
          nome: usuario.nome,
          roles: usuario.roles,
        },
      },
    });

    return result;
  }

  async findAll(filters: FilterUsuariosDto) {
    const { page = 1, limit = 20, search, roles, empresaId } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (roles && roles.length > 0) {
      where.roles = { hasSome: roles };
    }

    if (empresaId) {
      where.empresaId = empresaId;
    }

    const [usuarios, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          nome: true,
          roles: true,
          empresaId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return {
      data: usuarios,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, requestingUserId?: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nome: true,
        roles: true,
        empresaId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    return usuario;
  }

  async update(id: string, dto: UpdateUsuarioDto, updatedBy: string) {
    await this.findOne(id); // Verificar se existe

    // Se estiver alterando email, verificar se já existe
    if (dto.email) {
      const existente = await this.prisma.usuario.findUnique({
        where: { email: dto.email },
      });

      if (existente && existente.id !== id) {
        throw new ConflictException('E-mail já cadastrado no sistema');
      }
    }

    // Se estiver alterando senha, fazer hash
    const dataToUpdate: any = { ...dto };
    if (dto.senha) {
      dataToUpdate.senha = await bcrypt.hash(dto.senha, 10);
    }

    const usuario = await this.prisma.usuario.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        nome: true,
        roles: true,
        empresaId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log de auditoria
    await this.prisma.logAuditoria.create({
      data: {
        recurso: 'Usuario',
        acao: 'ATUALIZAR',
        usuarioId: updatedBy,
        dados: {
          usuarioId: usuario.id,
          alteracoes: JSON.parse(JSON.stringify(dto)),
        },
      },
    });

    return usuario;
  }

  async remove(id: string, deletedBy: string) {
    const usuario = await this.findOne(id);

    // Não permitir deletar o próprio usuário
    if (id === deletedBy) {
      throw new BadRequestException(
        'Você não pode deletar seu próprio usuário',
      );
    }

    await this.prisma.usuario.delete({
      where: { id },
    });

    // Log de auditoria
    await this.prisma.logAuditoria.create({
      data: {
        recurso: 'Usuario',
        acao: 'DELETAR',
        usuarioId: deletedBy,
        dados: {
          usuarioId: usuario.id,
          email: usuario.email,
          nome: usuario.nome,
        },
      },
    });

    return { message: 'Usuário deletado com sucesso' };
  }

  async toggleStatus(id: string, updatedBy: string) {
    const usuario = await this.findOne(id);

    // Campo 'ativo' foi removido do modelo Usuario
    // Este método não é mais necessário
    throw new BadRequestException(
      'Campo "ativo" foi removido do modelo Usuario',
    );
  }

  async resetPassword(id: string, novaSenha: string, updatedBy: string) {
    await this.findOne(id); // Verificar se existe

    if (novaSenha.length < 6) {
      throw new BadRequestException('A senha deve ter no mínimo 6 caracteres');
    }

    const hashedPassword = await bcrypt.hash(novaSenha, 10);

    await this.prisma.usuario.update({
      where: { id },
      data: { senha: hashedPassword },
    });

    // Log de auditoria
    await this.prisma.logAuditoria.create({
      data: {
        recurso: 'Usuario',
        acao: 'RESET_SENHA',
        usuarioId: updatedBy,
        dados: {
          usuarioId: id,
        },
      },
    });

    return { message: 'Senha redefinida com sucesso' };
  }

  async changeMyPassword(
    userId: string,
    senhaAtual: string,
    novaSenha: string,
  ) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar senha atual
    const isPasswordValid = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!isPasswordValid) {
      throw new BadRequestException('Senha atual incorreta');
    }

    if (novaSenha.length < 6) {
      throw new BadRequestException(
        'A nova senha deve ter no mínimo 6 caracteres',
      );
    }

    const hashedPassword = await bcrypt.hash(novaSenha, 10);

    await this.prisma.usuario.update({
      where: { id: userId },
      data: { senha: hashedPassword },
    });

    // Log de auditoria
    await this.prisma.logAuditoria.create({
      data: {
        recurso: 'Usuario',
        acao: 'ALTERAR_SENHA',
        usuarioId: userId,
        dados: {
          usuarioId: userId,
        },
      },
    });

    return { message: 'Senha alterada com sucesso' };
  }
}
