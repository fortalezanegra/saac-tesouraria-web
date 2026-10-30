export interface MovimentoFinanceiroFiltro {
  dataInicio?: string;
  dataFim?: string;
  tipo?: 'ENTRADA' | 'SAIDA';
  categoria?: string;
  descricao?: string;
}
