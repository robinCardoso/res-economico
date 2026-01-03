import { PartialType } from '@nestjs/mapped-types';
import { CreateModeloAtaDto } from './create-modelo-ata.dto';

export class UpdateModeloAtaDto extends PartialType(CreateModeloAtaDto) {}
