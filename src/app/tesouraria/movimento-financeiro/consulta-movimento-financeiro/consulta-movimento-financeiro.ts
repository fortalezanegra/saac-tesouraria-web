import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { TesourariaService } from '../../../core/services/tesouraria.service';
import { MovimentoFinanceiro } from '../../../core/models/movimento-financeiro';
import { MovimentoFinanceiroFiltro } from '../../../core/models/movimento-financeiro-filtro';

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
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './consulta-movimento-financeiro.html',
  styleUrl: './consulta-movimento-financeiro.scss',
  providers: [CurrencyPipe, DatePipe]
})
export class ConsultaMovimentoFinanceiro implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(TesourariaService);
  private readonly router = inject(Router);

  filtroForm: FormGroup = this.fb.group({
    dataInicio: [null],
    dataFim: [null],
    tipo: [''],
    categoria: [''],
    descricao: ['']
  });

  movimentos: MovimentoFinanceiro[] = [];
  categorias: string[] = [];
  colunas: string[] = ['data', 'tipo', 'categoria', 'descricao', 'valor', 'acoes'];
  carregando = false;

  pagina = 0;
  tamanhoPagina = 10;
  total = 0;

  tipos = [
    { value: '', label: 'Todos' },
    { value: 'ENTRADA', label: 'Entrada' },
    { value: 'SAIDA', label: 'Saída' }
  ];

  ngOnInit(): void {
    this.carregarCategorias();
    this.pesquisar();
  }

  private carregarCategorias(): void {
    this.service.categorias().subscribe({
      next: (categorias) => this.categorias = categorias
    });
  }

  pesquisar(): void {
    this.carregando = true;

    const filtro: MovimentoFinanceiroFiltro = this.montarFiltro();

    this.service.listar(filtro).subscribe({
      next: (resultado) => {
        this.movimentos = resultado;
        this.total = resultado.length;
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
        alert('Erro ao carregar movimentos financeiros.');
      }
    });
  }

  limpar(): void {
    this.filtroForm.reset({
      dataInicio: null,
      dataFim: null,
      tipo: '',
      categoria: '',
      descricao: ''
    });
    this.pesquisar();
  }

  private montarFiltro(): MovimentoFinanceiroFiltro {
    const valores = this.filtroForm.value;

    return {
      dataInicio: valores.dataInicio ? this.formatarData(valores.dataInicio) : undefined,
      dataFim: valores.dataFim ? this.formatarData(valores.dataFim) : undefined,
      tipo: valores.tipo || undefined,
      categoria: valores.categoria || undefined,
      descricao: valores.descricao || undefined
    };
  }

  private formatarData(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  editar(id: number): void {
    this.router.navigate(['/tesouraria/movimento-financeiro/cadastro', id]);
  }

  excluir(id: number): void {
    if (!confirm('Deseja realmente excluir este movimento financeiro?')) {
      return;
    }

    this.service.excluir(id).subscribe({
      next: () => this.pesquisar(),
      error: () => alert('Erro ao excluir movimento financeiro.')
    });
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
