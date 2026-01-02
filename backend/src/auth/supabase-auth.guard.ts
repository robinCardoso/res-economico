import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private supabaseService: SupabaseService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Obter o token do header Authorization
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autorização ausente ou inválido');
    }

    const token = authHeader.substring(7);

    try {
      // Verificar o token com o Supabase Auth
      const { data, error } = await this.supabaseService.getAuth().getUser(token);
      
      if (error || !data.user) {
        throw new UnauthorizedException('Token inválido ou expirado');
      }

      // Armazenar o usuário no request para uso posterior
      request.user = data.user;
      
      // Verificar roles se especificado (funcionalidade opcional para compatibilidade futura)
      const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
        context.getHandler(),
        context.getClass(),
      ]);
      
      // Se não houver roles especificados, permitir acesso
      if (!requiredRoles || requiredRoles.length === 0) {
        return true;
      }

      // Para compatibilidade com o sistema existente, podemos verificar roles
      // em uma tabela de usuários personalizada se necessário
      // Por enquanto, permitimos acesso se o usuário estiver autenticado
      
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Erro ao validar token de autenticação');
    }
  }
}