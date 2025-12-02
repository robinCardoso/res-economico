import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se não há roles requeridas, permitir acesso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: { roles: string[] } }>();
    const user = request.user;

    // Se não há usuário autenticado, negar acesso
    if (!user || !user.roles || !Array.isArray(user.roles)) {
      throw new ForbiddenException('Acesso negado: usuário não autenticado');
    }

    // Verificar se o usuário tem pelo menos uma das roles requeridas
    const hasRole = requiredRoles.some((role) => user.roles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(
        `Acesso negado: role requerida (${requiredRoles.join(', ')})`,
      );
    }

    return true;
  }
}
