import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MovimentoFinanceiro } from '../models/movimento-financeiro';
import { MovimentoFinanceiroFiltro } from '../models/movimento-financeiro-filtro';

export interface ResumoFinanceiro {
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
}

@Injectable({
  providedIn: 'root'
})
export class TesourariaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apis.tesouraria}/movimentos-financeiros`;

  listar(filtro?: MovimentoFinanceiroFiltro): Observable<MovimentoFinanceiro[]> {
    let params = new HttpParams();

    if (filtro?.dataInicio) params = params.set('dataInicio', filtro.dataInicio);
    if (filtro?.dataFim) params = params.set('dataFim', filtro.dataFim);
    if (filtro?.tipo) params = params.set('tipo', filtro.tipo);
    if (filtro?.categoria) params = params.set('categoria', filtro.categoria);
    if (filtro?.descricao) params = params.set('descricao', filtro.descricao);

    return this.http.get<MovimentoFinanceiro[]>(this.baseUrl, { params });
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

  resumo(filtro?: MovimentoFinanceiroFiltro): Observable<ResumoFinanceiro> {
    let params = new HttpParams();

    if (filtro?.dataInicio) params = params.set('dataInicio', filtro.dataInicio);
    if (filtro?.dataFim) params = params.set('dataFim', filtro.dataFim);

    return this.http.get<ResumoFinanceiro>(`${this.baseUrl}/resumo`, { params });
  }

  categorias(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/categorias`);
  }
}
