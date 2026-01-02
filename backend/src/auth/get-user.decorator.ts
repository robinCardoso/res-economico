import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    
    // Se não houver usuário autenticado, retornar undefined
    if (!request.user) {
      return undefined;
    }

    // Se foi especificado um campo específico, retornar apenas esse campo
    if (data) {
      return request.user[data];
    }

    // Retornar o usuário completo
    return request.user;
  },
);