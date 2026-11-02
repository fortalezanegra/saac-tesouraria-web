import { Injectable, signal, effect, computed } from '@angular/core';
import { Congregacao } from '../models/congregacao';
import { CentroCusto } from '../models/centro-custo';
import { ContaFinanceira } from '../models/conta-financeira';
import { LivroCaixa } from '../models/livro-caixa';

export interface ContextoLancamento {
  congregacao: Congregacao;
  centroCusto: CentroCusto;
  contaFinanceira: ContaFinanceira;
  livroCaixa: LivroCaixa;
}

const STORAGE_KEY = 'saac_contexto_lancamento';

@Injectable({
  providedIn: 'root'
})
export class ContextoLancamentoService {
  private readonly contextoSignal = signal<ContextoLancamento | null>(null);
  readonly contexto = computed(() => this.contextoSignal());
  readonly temContexto = computed(() => this.contextoSignal() !== null);

  constructor() {
    this.carregarDoStorage();
  }

  selecionar(contexto: ContextoLancamento): void {
    this.contextoSignal.set(contexto);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contexto));
  }

  limpar(): void {
    this.contextoSignal.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  obter(): ContextoLancamento | null {
    return this.contextoSignal();
  }

  private carregarDoStorage(): void {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo) {
      try {
        this.contextoSignal.set(JSON.parse(salvo));
      } catch (e) {
        console.error('Erro ao carregar contexto de lançamento:', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }
}
