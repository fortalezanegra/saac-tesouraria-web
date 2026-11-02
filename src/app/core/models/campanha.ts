export interface Campanha {
  campanhaId: number;
  centroCustoId: number;
  descricao: string;
  metaValor: number;
  dataInicio: string;
  dataFim?: string;
  situacaoId: number;
}