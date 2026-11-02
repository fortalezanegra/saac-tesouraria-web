import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MovimentoFinanceiro } from '../models/movimento-financeiro';
import { Categoria } from '../models/categoria';
import { CentroCusto } from '../models/centro-custo';
import { ContaFinanceira } from '../models/conta-financeira';
import { LivroCaixa } from '../models/livro-caixa';
import { Congregacao } from '../models/congregacao';
import { LivroCaixaDropdown } from '../models/livro-caixa-dropdown';
import { Pessoa } from '../models/pessoa';

export interface ResumoFinanceiro {
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
}

@Injectable({ providedIn: 'root' })
export class TesourariaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apis.tesouraria}/movimentos`;

  filtrarCentrosCusto(congregacaoId: number | null): Observable<CentroCusto[]> {
    return this.http.post<CentroCusto[]>(
      `${environment.apis.tesouraria}/centro-custo/filtrar`,
      { congregacaoId }
    );
  }

  filtrarContasFinanceiras(centroCustoId: number | null): Observable<ContaFinanceira[]> {
    return this.http.post<ContaFinanceira[]>(
      `${environment.apis.tesouraria}/conta-financeira/filtrar`,
      { centroCustoId }
    );
  }

  listarContasFinanceiras(): Observable<ContaFinanceira[]> {
    return this.http.get<ContaFinanceira[]>(`${environment.apis.tesouraria}/conta-financeira`);
  }

  listarLivrosCaixa(): Observable<LivroCaixa[]> {
    return this.http.get<LivroCaixa[]>(`${environment.apis.tesouraria}/livros-caixa`);
  }

  buscarPorId(id: number): Observable<MovimentoFinanceiro> {
    return this.http.get<MovimentoFinanceiro>(`${this.baseUrl}/${id}`);
  }

  criar(movimento: MovimentoFinanceiro): Observable<MovimentoFinanceiro> {
    return this.http.post<MovimentoFinanceiro>(this.baseUrl, movimento);
  }

  atualizar(id: number, movimento: MovimentoFinanceiro): Observable<MovimentoFinanceiro> {
    return this.http.put<MovimentoFinanceiro>(`${this.baseUrl}/${id}`, movimento);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  listarCongregacoes(): Observable<Congregacao[]> {
    return this.http.get<Congregacao[]>(`${environment.apis.tesouraria}/congregacao`);
  }

  filtrarLivrosCaixa(centroCustoId: number | null): Observable<LivroCaixaDropdown[]> {
    return this.http.post<LivroCaixaDropdown[]>(
      `${environment.apis.tesouraria}/livro-caixa/dropdown`,
      { centroCustoId }
    );
  }

  categorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(
      `${environment.apis.tesouraria}/categoria/dropdown`
    );
  }

  filtrarPessoas(congregacaoId: number | null): Observable<Pessoa[]> {
    return this.http.post<Pessoa[]>(
      `${environment.apis.tesouraria}/pessoa/dropdown`,
      { congregacaoId }
    );
  }
}
