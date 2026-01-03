export class DeleteEmpresaDto {
  forceDelete?: boolean; // Se true, deleta dados associados primeiro
}

export class EmpresaDeleteResponseDto {
  sucesso: boolean;
  mensagem: string;
  empresaId: string;
  empresaNome: string;
  deletado: boolean;
  avisos?: string[];
  dadosDeletados?: {
    vendas: number;
    pedidos: number;
    uploads: number;
    outros: number;
  };
}

export class ValidacaoDeletionDto {
  podeDeleter: boolean;
  mensagem: string;
  bloqueios: {
    vendas: number;
    pedidos: number;
    uploads: number;
    outrosDados: number;
  };
}
