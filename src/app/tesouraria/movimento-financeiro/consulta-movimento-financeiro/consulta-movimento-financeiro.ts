import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { MovimentoConsulta } from '../../../core/models/movimento-consulta';

@Component({
  selector: 'app-consulta-movimento-financeiro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatPaginatorModule
  ],
  templateUrl: './consulta-movimento-financeiro.html',
  styleUrls: ['./consulta-movimento-financeiro.scss']
})
export class ConsultaMovimentoFinanceiro implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  form: FormGroup = this.fb.group({
    competencia: [this.competenciaAtual()]
  });

  movimentos = signal<MovimentoConsulta[]>([]);
  carregando = signal(false);
  pesquisou = signal(false);

  pagina = 0;
  tamanhoPagina = 10;
  total = 0;

  colunasExibidas: string[] = [
    'dataMovimento',
    'categoriaDescricao',
    'historico',
    'pessoaNome',
    'campanhaDescricao',
    'eletronico',
    'valor',
    'acoes'
  ];

  get movimentosPaginados(): MovimentoConsulta[] {
    const inicio = this.pagina * this.tamanhoPagina;
    return this.movimentos().slice(inicio, inicio + this.tamanhoPagina);
  }

  ngOnInit(): void {
    this.pesquisar();
  }

  pesquisar(): void {
    const competencia = this.form.value.competencia as string;

    if (!competencia) {
      this.snackBar.open('Selecione uma competência', 'OK', { duration: 3000 });
      return;
    }

    const [ano, mes] = competencia.split('-').map(Number);

    this.carregando.set(true);
    this.pesquisou.set(true);

    const body = { mes, ano };

    this.http.post<MovimentoConsulta[]>(
      `${environment.apis.tesouraria}/movimento-financeiro/relatorio/competencia`,
      body
    ).subscribe({
      next: (lista) => {
        this.movimentos.set(lista);
        this.total = lista.length;
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar consulta:', err);
        this.snackBar.open('Erro ao carregar consulta.', 'OK', { duration: 4000 });
        this.carregando.set(false);
      }
    });
  }

  editar(id: number): void {
    this.router.navigate(['/tesouraria/movimento-financeiro/cadastro', id]);
  }

  excluir(id: number): void {
    if (!confirm('Deseja realmente excluir este lançamento?')) {
      return;
    }

    this.http.delete<void>(`${environment.apis.tesouraria}/movimento-financeiro/${id}`)
      .subscribe({
        next: () => {
          this.snackBar.open('Lançamento excluído com sucesso!', 'OK', { duration: 3000 });
          this.pesquisar();
        },
        error: (err) => {
          console.error('Erro ao excluir lançamento:', err);
          this.snackBar.open('Erro ao excluir lançamento.', 'OK', { duration: 4000 });
        }
      });
  }

  onPaginar(event: PageEvent): void {
    this.pagina = event.pageIndex;
    this.tamanhoPagina = event.pageSize;
  }

  formatarCompetencia(competencia: string): string {
    if (!competencia || !competencia.includes('-')) {
      return competencia;
    }
    const [ano, mes] = competencia.split('-');
    return `${mes}/${ano}`;
  }

  private competenciaAtual(): string {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    return `${ano}-${mes}`;
  }
}
