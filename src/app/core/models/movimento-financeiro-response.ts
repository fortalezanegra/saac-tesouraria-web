export interface MovimentoFinanceiroResponse {
  movimentoFinanceiroId: number;
  livroCaixaId: number;
  contaFinanceiraId: number;
  categoriaId: number;
  pessoaId: number | null;
  campanhaId: number | null;
  valor: number;
  dataMovimento: string;
  historico: string;
  eletronico: boolean;
  pessoaNome?: string;
  categoriaDescricao?: string;
  campanhaDescricao?: string;
}
