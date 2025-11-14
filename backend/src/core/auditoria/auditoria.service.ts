import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(
    usuarioId: string,
    recurso: string,
    acao: string,
    dados?: Record<string, any>,
  ) {
    try {
      await this.prisma.logAuditoria.create({
        data: {
          usuarioId,
          recurso,
          acao,
          dados: dados || {},
        },
      });
    } catch (error) {
      // Não falhar se não conseguir registrar auditoria
      console.error('Erro ao registrar auditoria:', error);
    }
  }

  async registrarUpload(usuarioId: string, uploadId: string, acao: string) {
    return this.registrar(usuarioId, 'Upload', acao, { uploadId });
  }

  async registrarAlerta(usuarioId: string, alertaId: string, acao: string) {
    return this.registrar(usuarioId, 'Alerta', acao, { alertaId });
  }

  async registrarEmpresa(usuarioId: string, empresaId: string, acao: string) {
    return this.registrar(usuarioId, 'Empresa', acao, { empresaId });
  }
}

