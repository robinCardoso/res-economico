import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LogAlteracoesService } from '../log-alteracoes.service';
import {
  LOG_ALTERACAO_KEY,
  LogAlteracaoOptions,
} from '../decorators/log-alteracao.decorator';

@Injectable()
export class LogAlteracaoInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly logService: LogAlteracoesService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const controller = context.getClass();

    // Buscar configuração do decorator
    const options = this.reflector.getAllAndOverride<LogAlteracaoOptions>(
      LOG_ALTERACAO_KEY,
      [handler, controller],
    );

    if (!options) {
      return next.handle();
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const usuarioId = request.user?.id;
    if (!usuarioId || typeof usuarioId !== 'string') {
      return next.handle();
    }

    // Tentar obter ataId da request
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const ataId =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      request.params?.id ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      request.body?.ataId ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      request.params?.ataId;
    if (!ataId || typeof ataId !== 'string') {
      return next.handle();
    }

    // Capturar valor anterior se disponível (para PUT/PATCH)
    const valorAnterior: unknown = null;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (request.method === 'PUT' || request.method === 'PATCH') {
      // Tentar buscar valor anterior do banco (seria necessário injetar o service da ata)
      // Por enquanto, vamos apenas registrar o novo valor
    }

    return next.handle().pipe(
      tap(() => {
        // Usar void para evitar Promise retornado
        void (async () => {
          try {
            let valorAnteriorStr: string | undefined;
            let valorNovoStr: string | undefined;

            if (options.extrairValores) {
              const valores = options.extrairValores(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                request.body,
                valorAnterior,
              );
              valorAnteriorStr = valores.anterior
                ? JSON.stringify(valores.anterior)
                : undefined;
              valorNovoStr = valores.novo
                ? JSON.stringify(valores.novo)
                : undefined;
            } else {
              valorNovoStr =
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                request.body ? JSON.stringify(request.body) : undefined;
            }

            await this.logService.registrarAlteracao(
              ataId,
              usuarioId,
              options.tipo,
              {
                campo: options.campo,
                valorAnterior: valorAnteriorStr,
                valorNovo: valorNovoStr,
                descricao: options.descricao,
                metadata: {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  method: request.method as string,
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  url: request.url as string,
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  userAgent: request.headers['user-agent'] as
                    | string
                    | undefined,
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  ip: request.ip as string | undefined,
                },
              },
            );
          } catch (error) {
            // Não falhar a requisição se o log falhar
            console.error('Erro ao registrar log de alteração:', error);
          }
        })();
      }),
    );
  }
}
