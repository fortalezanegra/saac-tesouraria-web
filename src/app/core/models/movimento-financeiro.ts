export interface MovimentoFinanceiro {
  movimentoFinanceiroId?: number;
  livroCaixaId: number;
  contaFinanceiraId: number;
  categoriaId: number;
  valor: number;
  eletronico: boolean;
  dataMovimento: string; // formato YYYY-MM-DD
  historico: string;
  pessoaId?: number | null;
  campanhaId?: number | null;
}