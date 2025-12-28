import { PartialType } from '@nestjs/mapped-types';
import { CreateHistoricoAndamentoDto } from './create-historico-andamento.dto';

export class UpdateHistoricoAndamentoDto extends PartialType(
  CreateHistoricoAndamentoDto,
) {}
