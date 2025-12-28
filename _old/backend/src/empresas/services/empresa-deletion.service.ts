import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  DeleteEmpresaDto,
  EmpresaDeleteResponseDto,
  ValidacaoDeletionDto,
} from '../dto/delete-empresa.dto';

@Injectable()
export class EmpresaDeletionService {
  constructor(private prisma: PrismaService) {}

  async validarDelecao(empresaId: string): Promise<ValidacaoDeletionDto> {
    const [vendas, pedidos, uploads, processos, atas] = await Promise.all([
      this.prisma.venda.count({ where: { empresaId } }),
      this.prisma.pedido.count({ where: { empresaId } }),
      this.prisma.upload.count({ where: { empresaId } }),
      this.prisma.processo.count({ where: { empresaId } }),
      this.prisma.ataReuniao.count({ where: { empresaId } }),
    ]);

    const totalBloqueios = vendas + pedidos + uploads + processos + atas;

    return {
      podeDeleter: totalBloqueios === 0,
      mensagem:
        totalBloqueios === 0
          ? 'Empresa pode ser deletada com segurança'
          : `Empresa não pode ser deletada. Existem ${totalBloqueios} registro(s) associado(s).`,
      bloqueios: {
        vendas,
        pedidos,
        uploads,
        outrosDados: processos + atas,
      },
    };
  }

  async deletarComForca(empresaId: string): Promise<{
    vendas: number;
    pedidos: number;
    uploads: number;
    outros: number;
  }> {
    // Deletar em ordem de dependência
    const [vendas, pedidos, uploads] = await Promise.all([
      this.prisma.venda.deleteMany({ where: { empresaId } }),
      this.prisma.pedido.deleteMany({ where: { empresaId } }),
      this.prisma.upload.deleteMany({ where: { empresaId } }),
    ]);

    return {
      vendas: vendas.count,
      pedidos: pedidos.count,
      uploads: uploads.count,
      outros: 0,
    };
  }

  async deletarEmpresa(
    empresaId: string,
    dto: DeleteEmpresaDto,
  ): Promise<EmpresaDeleteResponseDto> {
    // Buscar empresa
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      throw new BadRequestException(
        `Empresa com ID ${empresaId} não encontrada`,
      );
    }

    // Validar deleção
    const validacao = await this.validarDelecao(empresaId);

    if (!validacao.podeDeleter && !dto.forceDelete) {
      return {
        sucesso: false,
        mensagem: validacao.mensagem,
        empresaId,
        empresaNome: empresa.razaoSocial,
        deletado: false,
        avisos: [
          `Vendas: ${validacao.bloqueios.vendas}`,
          `Pedidos: ${validacao.bloqueios.pedidos}`,
          `Uploads: ${validacao.bloqueios.uploads}`,
          `Outros dados: ${validacao.bloqueios.outrosDados}`,
        ],
      };
    }

    let dadosDeletados = { vendas: 0, pedidos: 0, uploads: 0, outros: 0 };

    // Se forceDelete, deletar dados associados primeiro
    if (dto.forceDelete && !validacao.podeDeleter) {
      dadosDeletados = await this.deletarComForca(empresaId);
    }

    // Deletar a empresa
    await this.prisma.empresa.delete({ where: { id: empresaId } });

    return {
      sucesso: true,
      mensagem: `Empresa ${empresa.razaoSocial} deletada com sucesso`,
      empresaId,
      empresaNome: empresa.razaoSocial,
      deletado: true,
      dadosDeletados:
        Object.values(dadosDeletados).some((v) => v > 0) ||
        validacao.bloqueios.outrosDados > 0
          ? {
              vendas: dadosDeletados.vendas,
              pedidos: dadosDeletados.pedidos,
              uploads: dadosDeletados.uploads,
              outros: validacao.bloqueios.outrosDados,
            }
          : undefined,
    };
  }
}
