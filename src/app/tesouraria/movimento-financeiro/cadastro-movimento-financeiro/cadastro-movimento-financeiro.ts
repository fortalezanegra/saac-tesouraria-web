import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TesourariaService } from '../../../core/services/tesouraria.service';
import { MovimentoFinanceiro } from '../../../core/models/movimento-financeiro';

@Component({
  selector: 'app-cadastro-movimento-financeiro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './cadastro-movimento-financeiro.html',
  styleUrl: './cadastro-movimento-financeiro.scss'
})
export class CadastroMovimentoFinanceiro implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(TesourariaService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  form: FormGroup = this.fb.group({
    tipo: ['ENTRADA', Validators.required],
    data: [new Date(), Validators.required],
    descricao: ['', [Validators.required, Validators.maxLength(200)]],
    valor: [null, [Validators.required, Validators.min(0.01)]],
    categoria: ['', Validators.required],
    origem: [''],
    observacao: ['']
  });

  idEdicao: number | null = null;
  carregando = false;
  salvando = false;
  categorias: string[] = [];
  tipos = [
    { value: 'ENTRADA', label: 'Entrada' },
    { value: 'SAIDA', label: 'Saída' }
  ];

  ngOnInit(): void {
    this.carregarCategorias();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.idEdicao = Number(id);
      this.carregarMovimento(this.idEdicao);
    }
  }

  private carregarCategorias(): void {
    this.service.categorias().subscribe({
      next: (categorias) => this.categorias = categorias
    });
  }

  private carregarMovimento(id: number): void {
    this.carregando = true;
    this.service.buscarPorId(id).subscribe({
      next: (movimento) => {
        this.form.patchValue({
          ...movimento,
          data: new Date(movimento.data)
        });
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
        alert('Erro ao carregar movimento financeiro.');
      }
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando = true;

    const movimento: MovimentoFinanceiro = {
      ...this.form.value,
      data: this.formatarData(this.form.value.data)
    };

    const operacao = this.idEdicao
      ? this.service.atualizar(this.idEdicao, movimento)
      : this.service.criar(movimento);

    operacao.subscribe({
      next: () => {
        this.salvando = false;
        this.router.navigate(['/tesouraria/movimento-financeiro/consulta']);
      },
      error: () => {
        this.salvando = false;
        alert('Erro ao salvar movimento financeiro.');
      }
    });
  }

  private formatarData(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  voltar(): void {
    this.router.navigate(['/tesouraria/movimento-financeiro/consulta']);
  }
}
