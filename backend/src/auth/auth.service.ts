import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../core/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    nome: string;
    roles: string[];
    empresaId?: string | null;
  };
  token: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { email },
      include: { empresa: true },
    });

    if (!user) {
      console.log(`[AuthService] Usuário não encontrado: ${email}`);
      return null;
    }

    console.log(
      `[AuthService] Usuário encontrado: ${user.email}, verificando senha...`,
    );
    const isPasswordValid = await bcrypt.compare(password, user.senha);

    if (!isPasswordValid) {
      console.log(`[AuthService] Senha inválida para: ${email}`);
      return null;
    }

    console.log(`[AuthService] Autenticação bem-sucedida para: ${email}`);
    return {
      id: user.id,
      email: user.email,
      nome: user.nome,
      roles: user.roles,
      empresaId: user.empresaId,
      empresa: user.empresa,
    };
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException({
        message: 'Credenciais inválidas',
        error: 'Unauthorized',
        statusCode: 401,
      });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    const token = this.jwtService.sign(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        roles: user.roles,
        empresaId: user.empresaId,
      },
      token,
      expiresIn: 3600, // 1 hora
    };
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}
