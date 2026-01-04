import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreatePreferenciaNotificacaoDto } from './dto/create-preferencia-notificacao.dto';
import { UpdatePreferenciaNotificacaoDto } from './dto/update-preferencia-notificacao.dto';

@Injectable()
export class PreferenciasNotificacaoService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca ou cria preferências para um usuário
   */
  async findOrCreate(usuarioId: string) {
    let preferencia = await this.prisma.preferenciaNotificacao.findUnique({
      where: { usuarioId },
    });

    if (!preferencia) {
      preferencia = await this.prisma.preferenciaNotificacao.create({
        data: {
          usuarioId,
        },
      });
    }

    return preferencia;
  }

  /**
   * Busca preferências de um usuário
   */
  async findOne(usuarioId: string) {
    const preferencia = await this.findOrCreate(usuarioId);
    return preferencia;
  }

  /**
   * Atualiza preferências de um usuário
   */
  async update(usuarioId: string, dto: UpdatePreferenciaNotificacaoDto) {
    // Garantir que existe
    await this.findOrCreate(usuarioId);

    return this.prisma.preferenciaNotificacao.update({
      where: { usuarioId },
      data: dto,
    });
  }

  /**
   * Cria preferências para um usuário
   */
  async create(usuarioId: string, dto: CreatePreferenciaNotificacaoDto) {
    // Verificar se já existe
    const existente = await this.prisma.preferenciaNotificacao.findUnique({
      where: { usuarioId },
    });

    if (existente) {
      throw new Error(
        'Preferências já existem para este usuário. Use PUT para atualizar.',
      );
    }

    return this.prisma.preferenciaNotificacao.create({
      data: {
        usuarioId,
        ...dto,
      },
    });
  }

  /**
   * Verifica se usuário quer receber notificação de um tipo específico
   */
  async deveNotificar(
    usuarioId: string,
    tipo: 'prazos' | 'historico' | 'comentarios' | 'status',
  ): Promise<boolean> {
    const preferencia = await this.findOrCreate(usuarioId);

    switch (tipo) {
      case 'prazos':
        return preferencia.notificarPrazos;
      case 'historico':
        return preferencia.notificarHistorico;
      case 'comentarios':
        return preferencia.notificarComentarios;
      case 'status':
        return preferencia.notificarStatus;
      default:
        return false;
    }
  }

  /**
   * Verifica se está dentro do horário permitido para notificações
   */
  async estaNoHorarioPermitido(usuarioId: string): Promise<boolean> {
    const preferencia = await this.findOrCreate(usuarioId);

    const agora = new Date();
    const horaAtual = agora.getHours() * 60 + agora.getMinutes(); // Minutos desde meia-noite

    const [horaInicio, minutoInicio] = preferencia.horarioInicio
      .split(':')
      .map(Number);
    const [horaFim, minutoFim] = preferencia.horarioFim.split(':').map(Number);

    const minutosInicio = horaInicio * 60 + minutoInicio;
    const minutosFim = horaFim * 60 + minutoFim;

    // Verificar se está dentro do horário
    if (horaAtual < minutosInicio || horaAtual > minutosFim) {
      return false;
    }

    // Verificar dia da semana
    const diasSemana = [
      'domingo',
      'segunda',
      'terca',
      'quarta',
      'quinta',
      'sexta',
      'sabado',
    ];
    const diaAtual = diasSemana[agora.getDay()];

    return preferencia.diasSemana.includes(diaAtual);
  }
}
