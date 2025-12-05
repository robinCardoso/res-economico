import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateConfiguracaoEmailDto } from './dto/create-configuracao-email.dto';
import { UpdateConfiguracaoEmailDto } from './dto/update-configuracao-email.dto';
import { FilterLogsEmailDto } from './dto/filter-logs-email.dto';
import { EmailService } from './email.service';
import { TestarEmailDto } from './dto/testar-email.dto';

@Injectable()
export class ConfiguracoesService {
  private readonly logger = new Logger(ConfiguracoesService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Lista todas as configurações de e-mail
   */
  async findAll() {
    return this.prisma.configuracaoEmail.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nome: true,
        host: true,
        porta: true,
        autenticar: true,
        usuario: true,
        copiasPara: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
        // Não retornar senha
      },
    });
  }

  /**
   * Obtém uma configuração por ID
   */
  async findOne(id: string) {
    const configuracao = await this.prisma.configuracaoEmail.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        host: true,
        porta: true,
        autenticar: true,
        usuario: true,
        copiasPara: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
        // Não retornar senha
      },
    });

    if (!configuracao) {
      throw new NotFoundException('Configuração não encontrada');
    }

    return configuracao;
  }

  /**
   * Cria uma nova configuração
   */
  async create(dto: CreateConfiguracaoEmailDto) {
    // Se esta for a primeira configuração e estiver ativa, desativar outras
    if (dto.ativo !== false) {
      await this.prisma.configuracaoEmail.updateMany({
        where: { ativo: true },
        data: { ativo: false },
      });
    }

    // Criptografar senha antes de salvar
    const senhaCriptografada = this.emailService['encryptPassword'](dto.senha);

    return this.prisma.configuracaoEmail.create({
      data: {
        nome: dto.nome,
        host: dto.host,
        porta: dto.porta,
        autenticar: dto.autenticar,
        usuario: dto.usuario,
        senha: senhaCriptografada,
        copiasPara: dto.copiasPara,
        ativo: dto.ativo !== false,
      },
      select: {
        id: true,
        nome: true,
        host: true,
        porta: true,
        autenticar: true,
        usuario: true,
        copiasPara: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Atualiza uma configuração
   */
  async update(id: string, dto: UpdateConfiguracaoEmailDto) {
    const configuracao = await this.prisma.configuracaoEmail.findUnique({
      where: { id },
    });

    if (!configuracao) {
      throw new NotFoundException('Configuração não encontrada');
    }

    // Se estiver ativando esta configuração, desativar outras
    if (dto.ativo === true) {
      await this.prisma.configuracaoEmail.updateMany({
        where: { ativo: true, id: { not: id } },
        data: { ativo: false },
      });
    }

    const updateData: any = {};

    if (dto.nome !== undefined) updateData.nome = dto.nome;
    if (dto.host !== undefined) updateData.host = dto.host;
    if (dto.porta !== undefined) updateData.porta = dto.porta;
    if (dto.autenticar !== undefined) updateData.autenticar = dto.autenticar;
    if (dto.usuario !== undefined) updateData.usuario = dto.usuario;
    if (dto.copiasPara !== undefined) updateData.copiasPara = dto.copiasPara;
    if (dto.ativo !== undefined) updateData.ativo = dto.ativo;

    // Se a senha foi fornecida, criptografar
    if (dto.senha !== undefined) {
      updateData.senha = this.emailService['encryptPassword'](dto.senha);
    }

    return this.prisma.configuracaoEmail.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nome: true,
        host: true,
        porta: true,
        autenticar: true,
        usuario: true,
        copiasPara: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Remove uma configuração
   */
  async remove(id: string) {
    const configuracao = await this.prisma.configuracaoEmail.findUnique({
      where: { id },
    });

    if (!configuracao) {
      throw new NotFoundException('Configuração não encontrada');
    }

    await this.prisma.configuracaoEmail.delete({
      where: { id },
    });

    return { message: 'Configuração removida com sucesso' };
  }

  /**
   * Testa o envio de e-mail
   */
  async testarEmail(configuracaoId: string, dto: TestarEmailDto) {
    const assunto = dto.assunto || 'Teste de E-mail - Sistema';
    const corpo =
      dto.corpo ||
      `
      <h2>E-mail de Teste</h2>
      <p>Este é um e-mail de teste enviado pelo sistema.</p>
      <p>Se você recebeu este e-mail, a configuração está funcionando corretamente.</p>
      <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
    `;

    const resultado = await this.emailService.enviarEmail(
      {
        to: dto.destinatario,
        subject: assunto,
        html: corpo,
      },
      configuracaoId,
    );

    if (!resultado.success) {
      throw new BadRequestException(
        `Erro ao enviar e-mail: ${resultado.error}`,
      );
    }

    return {
      message: 'E-mail de teste enviado com sucesso',
      logId: resultado.logId,
    };
  }

  /**
   * Lista logs de envio
   */
  async listarLogs(filters: FilterLogsEmailDto) {
    const where: any = {};

    if (filters.configuracaoId) {
      where.configuracaoId = filters.configuracaoId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.destinatario) {
      where.destinatario = {
        contains: filters.destinatario,
        mode: 'insensitive',
      };
    }

    if (filters.dataInicio || filters.dataFim) {
      where.createdAt = {};
      if (filters.dataInicio) {
        where.createdAt.gte = new Date(filters.dataInicio);
      }
      if (filters.dataFim) {
        where.createdAt.lte = new Date(filters.dataFim);
      }
    }

    const page = filters.page ? parseInt(filters.page) : 1;
    const limit = filters.limit ? parseInt(filters.limit) : 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.logEnvioEmail.findMany({
        where,
        include: {
          configuracao: {
            select: {
              id: true,
              nome: true,
              host: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.logEnvioEmail.count({ where }),
    ]);

    return {
      logs,
      paginacao: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Testa a conexão SMTP
   */
  async testarConexao(configuracaoId: string) {
    const sucesso = await this.emailService.testarConexao(configuracaoId);

    if (!sucesso) {
      throw new BadRequestException(
        'Falha ao conectar com o servidor SMTP. Verifique as configurações.',
      );
    }

    return { message: 'Conexão SMTP testada com sucesso' };
  }
}

