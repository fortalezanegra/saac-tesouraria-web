export interface LivroCaixa {
  livroCaixaId: number;
  centroCustoId: number;
  competencia: string;
  saldoInicial: number;
  saldoFinal: number;
  dataFechamento?: string;
  situacaoId: number;
  situacaoDescricao?: string;
}