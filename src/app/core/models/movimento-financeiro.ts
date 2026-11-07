export interface MovimentoFinanceiro {
  movimentoFinanceiroId?: number;
  livroCaixaId: number;
  livroCaixa?: string;
  contaFinanceiraId: number;
  contaFinanceira?: string;
  categoriaId: number;
  categoria?: string;
  valor: number;
  eletronico?: boolean;
  dataMovimento: string; // yyyy-MM-dd
  historico?: string;
  pessoaId?: number | null;
  pessoaNome?: string | null;
  campanhaId?: number | null;
  campanha?: string
}


