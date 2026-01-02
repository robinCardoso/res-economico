import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class SupabaseAuthService {
  constructor(
    private supabaseService: SupabaseService,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabaseService.getAuth().signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new UnauthorizedException(`Falha no login: ${error.message}`);
      }

      if (!data.user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      // Gerar token JWT personalizado para compatibilidade com o sistema existente
      const payload = { 
        sub: data.user.id, 
        email: data.user.email, 
        userId: data.user.id 
      };
      
      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          // Outros campos podem ser obtidos do banco de dados se necessário
        },
        token: this.jwtService.sign(payload),
        expiresIn: 3600, // 1 hora
        session: data.session,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Erro durante o processo de autenticação');
    }
  }

  async signUp(email: string, password: string, nome: string) {
    try {
      const { data, error } = await this.supabaseService.getAuth().signUp({
        email,
        password,
      });

      if (error) {
        throw new UnauthorizedException(`Falha no registro: ${error.message}`);
      }

      return {
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Erro durante o processo de registro');
    }
  }

  async signOut(accessToken: string) {
    try {
      // Configurar o token para o cliente Supabase
      const client = this.supabaseService.getClient();
      client.auth.setSession({
        access_token: accessToken,
        refresh_token: '', // refresh token não é necessário para logout
      });

      const { error } = await this.supabaseService.getAuth().signOut();
      
      if (error) {
        throw new UnauthorizedException(`Falha no logout: ${error.message}`);
      }

      return { message: 'Logout realizado com sucesso' };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Erro durante o processo de logout');
    }
  }

  async getUserFromToken(token: string) {
    try {
      const { data, error } = await this.supabaseService.getAuth().getUser(token);
      
      if (error) {
        throw new UnauthorizedException('Token inválido ou expirado');
      }

      return data.user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Erro ao validar token');
    }
  }
}