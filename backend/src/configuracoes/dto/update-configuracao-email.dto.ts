import { PartialType } from '@nestjs/mapped-types';
import { CreateConfiguracaoEmailDto } from './create-configuracao-email.dto';

export class UpdateConfiguracaoEmailDto extends PartialType(CreateConfiguracaoEmailDto) {}

