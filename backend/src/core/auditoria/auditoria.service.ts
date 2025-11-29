import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registrar(
    usuarioId: string,
    recurso: string,
    acao: string,
    dados?: Record<string, any>,
  ) {
    try {
      // Verificar se o usuário existe (exceto para 'system' que é usado em scripts)
      if (usuarioId === 'system') {
        this.logger.debug(`Auditoria ignorada para usuário 'system': ${recurso} - ${acao}`);
        return; // Não registrar auditoria para scripts automáticos
      }

      // Verificar se o usuário existe no banco
      const usuarioExiste = await this.prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { id: true },
      });

      if (!usuarioExiste) {
        this.logger.warn(
          `Usuário não encontrado para auditoria: ${usuarioId}. Ação: ${recurso} - ${acao}`,
        );
        return; // Não registrar se o usuário não existir
      }

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
      this.logger.error('Erro ao registrar auditoria:', error);
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
