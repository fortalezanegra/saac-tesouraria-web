export interface CategoriaResumo {
  descricao: string;
  tipoCategoria: 'ENTRADA' | 'SAIDA';
}

export interface MovimentoConsulta {
  movimentoFinanceiroId: number;
  dataMovimento: string;
  categoria: CategoriaResumo;
  valor: number;
  historico: string;
  pessoaNome?: string;
  campanhaDescricao?: string;
  eletronico: boolean;
  contaFinanceiraDescricao: string;
  centroCustoDescricao: string;
}
