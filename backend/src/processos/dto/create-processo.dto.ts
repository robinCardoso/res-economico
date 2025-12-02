import {
  IsString,
  IsEmail,
  IsUUID,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TipoProcesso {
  GARANTIA = 'Garantia',
  DEVOLUCAO = 'Devolução',
  RECLAMACAO = 'Reclamação',
}

export enum CategoriaReclamacao {
  ATENDIMENTO = 'atendimento',
  PRODUTOS = 'produtos',
  LOGISTICA = 'logistica',
  FINANCEIRO = 'financeiro',
  TECNICO = 'tecnico',
  COMUNICACAO = 'comunicacao',
}

export enum PrioridadeProcesso {
  BAIXA = 'baixa',
  MEDIA = 'media',
  ALTA = 'alta',
}

export class ProcessoCustoGarantiaDto {
  @IsNumber()
  @Min(0.01)
  valor: number;

  @IsString()
  @MinLength(1)
  infoPecas: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  documentosUri?: string[];
}

export class ProcessoItemDto {
  @IsString()
  @MinLength(1)
  nf: string;

  @IsString()
  @MinLength(1)
  referencia: string;

  @IsString()
  @IsOptional()
  descricaoProduto?: string;

  @IsNumber()
  @Min(1)
  qtd: number;

  @IsNumber()
  @Min(0.01)
  valorUnit: number;

  @IsString()
  @MinLength(10)
  detalhes: string;

  @IsString()
  @IsOptional()
  marca?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imagesDataUri?: string[];

  @IsString()
  @IsOptional()
  videoDataUri?: string;

  @IsString()
  @IsOptional()
  dataInstalacao?: string;

  @IsString()
  @IsOptional()
  dataRemocao?: string;

  @IsString()
  @IsOptional()
  kmInstalacao?: string;

  @IsString()
  @IsOptional()
  kmRemocao?: string;

  @IsString()
  @IsOptional()
  modeloVeiculo?: string;

  @IsString()
  @IsOptional()
  anoVeiculo?: string;

  @IsString()
  @IsOptional()
  marcaVeiculo?: string;

  @IsBoolean()
  @IsOptional()
  temCustoGarantia?: boolean;

  @ValidateNested()
  @Type(() => ProcessoCustoGarantiaDto)
  @IsOptional()
  custoGarantia?: ProcessoCustoGarantiaDto;
}

export class CreateProcessoDto {
  @IsEmail()
  userEmail: string;

  @IsUUID()
  entidadeId: string;

  @IsEnum(TipoProcesso)
  tipo: TipoProcesso;

  @IsString()
  @MinLength(1)
  nomeClienteAssociado: string;

  @IsString()
  @MinLength(1)
  razaoSocial: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(2)
  uf?: string;

  @IsString()
  @IsOptional()
  cidade?: string;

  @IsString()
  @IsOptional()
  fabrica?: string;

  @IsString()
  @IsOptional()
  importacao?: string;

  @IsString()
  @IsOptional()
  ano?: string;

  @IsString()
  @IsOptional()
  reclamacao?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProcessoItemDto)
  @IsOptional()
  itens?: ProcessoItemDto[];

  // Campos específicos para Reclamação
  @IsString()
  @IsOptional()
  @MinLength(5)
  @MaxLength(100)
  titulo?: string;

  @IsString()
  @IsOptional()
  @MinLength(50)
  @MaxLength(2000)
  descricao?: string;

  @IsEnum(CategoriaReclamacao)
  @IsOptional()
  categoria?: CategoriaReclamacao;

  @IsEnum(PrioridadeProcesso)
  @IsOptional()
  prioridade?: PrioridadeProcesso;

  @IsString()
  @IsOptional()
  contatoRetorno?: string;

  @IsArray()
  @IsOptional()
  anexos?: Array<{
    nomeArquivo?: string;
    urlArquivo?: string;
    tipoArquivo?: string;
    tamanhoArquivo?: number;
    mimeType?: string;
    metadata?: Record<string, unknown>;
  }>;
}
