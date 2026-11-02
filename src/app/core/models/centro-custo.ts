export interface CentroCusto {
  centroCustoId: number;
  congregacaoId: number;
  tipoCentro: 'FILIAL' | 'MATRIZ';
  descricao: string;
  situacaoId: number;
}