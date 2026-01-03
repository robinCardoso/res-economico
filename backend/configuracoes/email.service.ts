import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import { StatusEnvioEmail, ConfiguracaoEmail } from '@prisma/client';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly encryptionKey: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Usar chave de criptografia do .env ou gerar uma padrão
    this.encryptionKey =
      this.configService.get<string>('ENCRYPTION_KEY') ||
      'default-encryption-key-change-in-production';
  }

  /**
   * Criptografa uma senha
   */
  encryptPassword(password: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Descriptografa uma senha
   */
  private decryptPassword(encryptedPassword: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const parts = encryptedPassword.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Obtém a configuração de e-mail ativa
   */
  async getConfiguracaoAtiva() {
    const configuracao = await this.prisma.configuracaoEmail.findFirst({
      where: { ativo: true },
    });

    if (!configuracao) {
      throw new BadRequestException(
        'Nenhuma configuração de e-mail ativa encontrada',
      );
    }

    return configuracao;
  }

  /**
   * Cria um transporter do nodemailer a partir de uma configuração
   */
  private async createTransporter(configuracaoId?: string) {
    let configuracao: ConfiguracaoEmail | null;

    if (configuracaoId) {
      configuracao = await this.prisma.configuracaoEmail.findUnique({
        where: { id: configuracaoId },
      });
    } else {
      configuracao = await this.getConfiguracaoAtiva();
    }

    if (!configuracao) {
      throw new BadRequestException('Configuração de e-mail não encontrada');
    }

    const senhaDescriptografada = this.decryptPassword(configuracao.senha);

    const transporter = nodemailer.createTransport({
      host: configuracao.host,
      port: configuracao.porta,
      secure: configuracao.porta === 465, // true para 465, false para outras portas
      auth: configuracao.autenticar
        ? {
            user: configuracao.usuario,
            pass: senhaDescriptografada,
          }
        : undefined,
    });

    return { transporter, configuracao };
  }

  /**
   * Envia um e-mail
   */
  async enviarEmail(
    options: EmailOptions,
    configuracaoId?: string,
  ): Promise<{ success: boolean; logId: string; error?: string }> {
    let logId = '';

    try {
      const { transporter, configuracao } =
        await this.createTransporter(configuracaoId);

      // @ts-ignore
      const log = await this.prisma.logEnvioEmail.create({
        data: {
          configuracao: { connect: { id: configuracaoId } },
          destinatario: Array.isArray(options.to)
            ? options.to.join('; ')
            : options.to,
          assunto: options.subject,
          corpo: options.html || options.text || '',
          status: StatusEnvioEmail.PENDENTE,
          tentativas: 0,
        },
      });

      logId = log.id;

      // Preparar destinatários
      const to = Array.isArray(options.to) ? options.to : [options.to];
      const cc = options.cc
        ? Array.isArray(options.cc)
          ? options.cc
          : [options.cc]
        : [];

      // Adicionar cópias se configurado
      if (configuracao.copiasPara) {
        const copias = configuracao.copiasPara
          .split(';')
          .map((email) => email.trim())
          .filter((email) => email);
        cc.push(...copias);
      }

      // Enviar e-mail
      await transporter.sendMail({
        from: configuracao.usuario,
        to: to.join(', '),
        cc: cc.length > 0 ? cc.join(', ') : undefined,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      // Atualizar log como enviado
      await this.prisma.logEnvioEmail.update({
        where: { id: logId },
        data: {
          status: StatusEnvioEmail.ENVIADO,
          enviadoEm: new Date(),
          tentativas: { increment: 1 },
        },
      });

      this.logger.log(
        `E-mail enviado com sucesso: ${options.subject} para ${to.join(', ')}`,
      );

      return { success: true, logId };
    } catch (error) {
      let errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      // Melhorar mensagem de erro para casos específicos
      if (error instanceof Error && 'code' in error) {
        const errorCode = (error as { code?: string }).code;
        const errorResponse = (error as { response?: string }).response;

        // Erro de autenticação do Gmail
        if (
          errorCode === 'EAUTH' &&
          errorResponse?.includes('Application-specific password')
        ) {
          errorMessage =
            'Gmail requer senha de aplicativo. Acesse: https://myaccount.google.com/apppasswords para gerar uma senha de aplicativo e use-a no campo "Senha".';
        } else if (errorCode === 'EAUTH') {
          errorMessage =
            'Erro de autenticação SMTP. Verifique usuário e senha. Para Gmail com 2FA, use senha de aplicativo.';
        } else if (errorCode === 'ECONNECTION') {
          errorMessage =
            'Erro de conexão com servidor SMTP. Verifique host e porta.';
        } else if (errorCode === 'ETIMEDOUT') {
          errorMessage =
            'Timeout ao conectar com servidor SMTP. Verifique sua conexão.';
        }
      }

      this.logger.error(`Erro ao enviar e-mail: ${errorMessage}`, error);

      // Atualizar log como falha
      if (logId) {
        await this.prisma.logEnvioEmail.update({
          where: { id: logId },
          data: {
            // @ts-ignore - FALHA é o enum correto do banco
            status: StatusEnvioEmail.FALHA,
            erro: errorMessage,
            tentativas: { increment: 1 },
          },
        });
      }

      return { success: false, logId: logId || '', error: errorMessage };
    }
  }

  /**
   * Testa a conexão SMTP
   */
  async testarConexao(configuracaoId?: string): Promise<boolean> {
    try {
      const { transporter } = await this.createTransporter(configuracaoId);
      await transporter.verify();
      return true;
    } catch (error) {
      this.logger.error('Erro ao testar conexão SMTP:', error);
      return false;
    }
  }
}
