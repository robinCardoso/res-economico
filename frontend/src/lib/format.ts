import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');

export function formatDate(date: string | Date): string {
  return dayjs(date).format('DD/MM/YYYY');
}

export function formatDateTime(date: string | Date): string {
  return dayjs(date).format('DD/MM/YYYY HH:mm');
}

export function formatPeriodo(mes: number, ano: number): string {
  const meses = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  return `${meses[mes - 1]}/${ano}`;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PROCESSANDO: 'Processando',
    CONCLUIDO: 'Concluído',
    COM_ALERTAS: 'Com alertas',
    CANCELADO: 'Cancelado',
    ABERTO: 'Aberto',
    EM_ANALISE: 'Em análise',
    RESOLVIDO: 'Resolvido',
    SALDO_DIVERGENTE: 'Saldo divergente',
    CONTA_NOVA: 'Conta nova',
    DADO_INCONSISTENTE: 'Dado inconsistente',
    ATIVA: 'Regular',
    NOVA: 'Nova',
    ARQUIVADA: 'Arquivada',
  };
  return labels[status] || status;
}

