export interface MovimentoFinanceiro {
  id?: number;
  tipo: 'ENTRADA' | 'SAIDA';
  data: string;           // formato ISO: YYYY-MM-DD
  descricao: string;
  valor: number;
  categoria: string;
  origem?: string;
  observacao?: string;
  createdAt?: string;
  updatedAt?: string;
}
