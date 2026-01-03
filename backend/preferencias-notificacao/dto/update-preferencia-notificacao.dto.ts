import { PartialType } from '@nestjs/mapped-types';
import { CreatePreferenciaNotificacaoDto } from './create-preferencia-notificacao.dto';

export class UpdatePreferenciaNotificacaoDto extends PartialType(
  CreatePreferenciaNotificacaoDto,
) {}
