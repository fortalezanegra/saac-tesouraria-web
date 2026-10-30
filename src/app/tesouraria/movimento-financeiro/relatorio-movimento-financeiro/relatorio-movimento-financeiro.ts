import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { TesourariaService, ResumoFinanceiro } from '../../../core/services/tesouraria.service';
import { MovimentoFinanceiro } from '../../../core/models/movimento-financeiro';
import { MovimentoFinanceiroFiltro } from '../../../core/models/movimento-financeiro-filtro';

@Component({
  selector: 'app-relatorio-movimento-financeiro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule
  ],
  templateUrl: './relatorio-movimento-financeiro.html',
  styleUrl: './relatorio-movimento-financeiro.scss',
  providers: [CurrencyPipe, DatePipe]
})
export class RelatorioMovimentoFinanceiro implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(TesourariaService);

  filtroForm: FormGroup = this.fb.group({
    dataInicio: [null],
    dataFim: [null]
  });

  resumo: ResumoFinanceiro | null = null;
  movimentos: MovimentoFinanceiro[] = [];
  colunas: string[] = ['data', 'tipo', 'categoria', 'descricao', 'valor'];
  carregando = false;

  pagina = 0;
  tamanhoPagina = 10;
  total = 0;

  ngOnInit(): void {
    this.pesquisar();
  }

  pesquisar(): void {
    this.carregando = true;

    const filtro: MovimentoFinanceiroFiltro = this.montarFiltro();

    this.service.resumo(filtro).subscribe({
      next: (resumo) => {
        this.resumo = resumo;
      }
    });

    this.service.listar(filtro).subscribe({
      next: (resultado) => {
        this.movimentos = resultado;
        this.total = resultado.length;
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
        alert('Erro ao carregar relatório financeiro.');
      }
    });
  }

  limpar(): void {
    this.filtroForm.reset({
      dataInicio: null,
      dataFim: null
    });
    this.pesquisar();
  }

  private montarFiltro(): MovimentoFinanceiroFiltro {
    const valores = this.filtroForm.value;

    return {
      dataInicio: valores.dataInicio ? this.formatarData(valores.dataInicio) : undefined,
      dataFim: valores.dataFim ? this.formatarData(valores.dataFim) : undefined
    };
  }

  private formatarData(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  onPaginar(event: PageEvent): void {
    this.pagina = event.pageIndex;
    this.tamanhoPagina = event.pageSize;
  }

  get movimentosPaginados(): MovimentoFinanceiro[] {
    const inicio = this.pagina * this.tamanhoPagina;
    return this.movimentos.slice(inicio, inicio + this.tamanhoPagina);
  }
}
