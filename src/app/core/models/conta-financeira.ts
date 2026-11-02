export interface ContaFinanceira {
  contaFinanceiraId: number;
  descricao: string;
  centroCustoId: number;
  bancoId?: number;
  tipoConta: 'CAIXA' | 'CORRENTE' | 'POUPANCA';
  agencia?: string;
  conta?: string;
  digito?: string;
  saldoInicial: number;
  dataAbertura?: string;
  situacaoId: number;
}