import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateUsuarioClienteDto } from './dto/create-usuario-cliente.dto';
import { BulkCreateUsuarioClienteDto } from './dto/bulk-create-usuario-cliente.dto';

@Injectable()
export class UsuariosClientesService {
  constructor(private prisma: PrismaService) {}

  async associateCliente(
    usuarioId: string,
    dto: CreateUsuarioClienteDto,
    createdBy: string,
  ) {
    // Verificar se usuário existe
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Validar que cliente existe em Venda ou Pedido
    await this.validateClienteExists(dto.nomeFantasia, dto.tipoCliente);

    // Verificar se associação já existe
    const existente = await this.prisma.usuarioCliente.findUnique({
      where: {
        usuarioId_nomeFantasia_tipoCliente: {
          usuarioId,
          nomeFantasia: dto.nomeFantasia,
          tipoCliente: dto.tipoCliente,
        },
      },
    });

    if (existente) {
      throw new ConflictException(
        `Cliente ${dto.nomeFantasia} já associado ao usuário com tipo ${dto.tipoCliente}`,
      );
    }

    const association = await this.prisma.usuarioCliente.create({
      data: {
        usuarioId,
        nomeFantasia: dto.nomeFantasia,
        tipoCliente: dto.tipoCliente,
        // razaoSocial: (dto as any).razaoSocial // Campo não existe no schema,
        permissoes: dto.permissoes || {
          vendas: true,
          pedidos: true,
          analytics: true,
        },
        createdBy,
      },
      include: {
        usuario: {
          select: { id: true, nome: true, email: true },
        },
      },
    });

    // Log de auditoria
    await this.prisma.logAuditoria.create({
      data: {
        recurso: 'UsuarioCliente',
        acao: 'ASSOCIAR',
        usuarioId: createdBy,
        dados: {
          usuarioId,
          nomeFantasia: dto.nomeFantasia,
          tipoCliente: dto.tipoCliente,
        },
      },
    });

    return association;
  }

  async bulkAssociateClientes(
    usuarioId: string,
    dto: BulkCreateUsuarioClienteDto,
    createdBy: string,
  ) {
    const associations: any[] = [];
    const errors: any[] = [];

    for (const clienteDto of dto.clientes) {
      try {
        const association = await this.associateCliente(
          usuarioId,
          clienteDto,
          createdBy,
        );
        associations.push(association);
      } catch (error) {
        errors.push({
          nomeFantasia: clienteDto.nomeFantasia,
          error: error.message,
        });
      }
    }

    return {
      sucesso: associations.length,
      erros: errors.length,
      associations,
      errors,
    };
  }

  async findClientesByUsuario(usuarioId: string) {
    return this.prisma.usuarioCliente.findMany({
      where: { usuarioId },
      include: {
        usuario: {
          select: { id: true, nome: true, email: true },
        },
      },
      orderBy: { nomeFantasia: 'asc' },
    });
  }

  async updateClienteAssociation(
    usuarioId: string,
    clienteId: string,
    permissoes: any,
    updatedBy: string,
  ) {
    const association = await this.prisma.usuarioCliente.findUnique({
      where: { id: clienteId },
    });

    if (!association || association.usuarioId !== usuarioId) {
      throw new NotFoundException('Associação não encontrada');
    }

    const updated = await this.prisma.usuarioCliente.update({
      where: { id: clienteId },
      data: { permissoes },
    });

    // Log de auditoria
    await this.prisma.logAuditoria.create({
      data: {
        recurso: 'UsuarioCliente',
        acao: 'ATUALIZAR',
        usuarioId: updatedBy,
        dados: {
          associacaoId: clienteId,
          permissoes,
        },
      },
    });

    return updated;
  }

  async removeClienteAssociation(
    usuarioId: string,
    clienteId: string,
    deletedBy: string,
  ) {
    const association = await this.prisma.usuarioCliente.findUnique({
      where: { id: clienteId },
    });

    if (!association || association.usuarioId !== usuarioId) {
      throw new NotFoundException('Associação não encontrada');
    }

    await this.prisma.usuarioCliente.delete({
      where: { id: clienteId },
    });

    // Log de auditoria
    await this.prisma.logAuditoria.create({
      data: {
        recurso: 'UsuarioCliente',
        acao: 'REMOVER',
        usuarioId: deletedBy,
        dados: {
          usuarioId,
          nomeFantasia: association.nomeFantasia,
          tipoCliente: association.tipoCliente,
        },
      },
    });

    return { message: 'Associação removida com sucesso' };
  }

  async getClientesDisponiveis() {
    // Buscar nomeFantasia únicos de Venda e Pedido
    const [vendasClientes, pedidosClientes] = await Promise.all([
      this.prisma.venda.findMany({
        select: { nomeFantasia: true, razaoSocial: true },
        distinct: ['nomeFantasia'],
        orderBy: { nomeFantasia: 'asc' },
      }),
      this.prisma.pedido.findMany({
        select: { nomeFantasia: true },
        distinct: ['nomeFantasia'],
        orderBy: { nomeFantasia: 'asc' },
      }),
    ]);

    // Consolidar lista única
    const clientesMap = new Map<
      string,
      { nomeFantasia: string; razaoSocial?: string; tipos: string[] }
    >();

    vendasClientes.forEach((v) => {
      if (v.nomeFantasia && !clientesMap.has(v.nomeFantasia)) {
        clientesMap.set(v.nomeFantasia, {
          nomeFantasia: v.nomeFantasia,
          razaoSocial: v.razaoSocial || undefined,
          tipos: [],
        });
      }
      if (v.nomeFantasia) {
        const cliente = clientesMap.get(v.nomeFantasia);
        if (cliente && !cliente.tipos.includes('VENDA')) {
          cliente.tipos.push('VENDA');
        }
      }
    });

    pedidosClientes.forEach((p) => {
      if (p.nomeFantasia && !clientesMap.has(p.nomeFantasia)) {
        clientesMap.set(p.nomeFantasia, {
          nomeFantasia: p.nomeFantasia,
          tipos: [],
        });
      }
      if (p.nomeFantasia) {
        const cliente = clientesMap.get(p.nomeFantasia);
        if (cliente && !cliente.tipos.includes('PEDIDO')) {
          cliente.tipos.push('PEDIDO');
        }
      }
    });

    return Array.from(clientesMap.values());
  }

  private async validateClienteExists(
    nomeFantasia: string,
    tipoCliente: string,
  ) {
    if (tipoCliente === 'VENDA' || tipoCliente === 'AMBOS') {
      const vendaExists = await this.prisma.venda.findFirst({
        where: { nomeFantasia },
      });
      if (!vendaExists) {
        throw new NotFoundException(
          `Cliente ${nomeFantasia} não encontrado em Vendas`,
        );
      }
    }

    if (tipoCliente === 'PEDIDO' || tipoCliente === 'AMBOS') {
      const pedidoExists = await this.prisma.pedido.findFirst({
        where: { nomeFantasia },
      });
      if (!pedidoExists) {
        throw new NotFoundException(
          `Cliente ${nomeFantasia} não encontrado em Pedidos`,
        );
      }
    }
  }
}
