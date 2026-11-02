import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { TesourariaService } from '../../../core/services/tesouraria.service';
import { ContextoLancamentoService } from '../../../core/services/contexto-lancamento.service';
import { Categoria } from '../../../core/models/categoria';
import { Pessoa } from '../../../core/models/pessoa';
import { Campanha } from '../../../core/models/campanha';
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
    MatIconModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatAutocompleteModule
  ],
  templateUrl: './cadastro-movimento-financeiro.html',
  styleUrls: ['./cadastro-movimento-financeiro.scss']
})
export class CadastroMovimentoFinanceiro implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly tesourariaService = inject(TesourariaService);
  private readonly contextoService = inject(ContextoLancamentoService);

  form: FormGroup = this.fb.group({
    categoriaId: [null, Validators.required],
    valor: [null, [Validators.required, Validators.min(0.01)]],
    dataMovimento: [new Date(), Validators.required],
    historico: ['', Validators.maxLength(255)],
    eletronico: [false],
    pessoaId: [null],
    pessoaNome: [''],
    campanhaId: [null]
  });

  contexto = this.contextoService.contexto;
  categorias = signal<Categoria[]>([]);
  pessoasFiltradas = signal<Pessoa[]>([]);
  campanhas = signal<Campanha[]>([]);
  salvando = signal(false);

  tipoCategoriaSelecionada = computed(() => {
    const categoriaId = this.form.value.categoriaId;
    const categoria = this.categorias().find(c => c.categoriaId === categoriaId);
    return categoria?.tipoCategoria || null;
  });

  ngOnInit(): void {
    const contexto = this.contexto();

    if (!contexto || !contexto.centroCusto || !contexto.contaFinanceira || !contexto.livroCaixa) {
      this.snackBar.open('Contexto de lançamento incompleto. Selecione o contexto primeiro.', 'OK', { duration: 4000 });
      this.router.navigate(['/tesouraria/movimento-financeiro/contexto']);
      return;
    }

    this.carregarListas();
    this.configurarPesquisaPessoa(contexto.congregacao?.congregacaoId);
  }

  private carregarListas(): void {
    this.tesourariaService.categorias().subscribe({
      next: (lista) => this.categorias.set(lista),
      error: (err) => console.error('Erro ao carregar categorias:', err)
    });
  }

  private configurarPesquisaPessoa(congregacaoId: number | undefined): void {
    this.form.get('pessoaNome')?.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((termo) => {
      this.form.get('pessoaId')?.setValue(null);

      if (!termo || typeof termo !== 'string' || termo.length < 3) {
        this.pessoasFiltradas.set([]);
        return;
      }

      this.tesourariaService.filtrarPessoas(congregacaoId ?? null).subscribe({
        next: (lista) => this.pessoasFiltradas.set(lista),
        error: (err) => console.error('Erro ao pesquisar pessoas:', err)
      });
    });
  }

  selecionarPessoa(pessoa: Pessoa): void {
    this.form.get('pessoaId')?.setValue(pessoa.pessoaId);
    this.form.get('pessoaNome')?.setValue(pessoa.nome, { emitEvent: false });
    this.pessoasFiltradas.set([]);
  }

  limparPessoa(): void {
    this.form.get('pessoaId')?.setValue(null);
    this.form.get('pessoaNome')?.setValue('');
    this.pessoasFiltradas.set([]);
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const contexto = this.contexto();
    if (!contexto || !contexto.centroCusto || !contexto.contaFinanceira || !contexto.livroCaixa) {
      this.snackBar.open('Contexto de lançamento incompleto.', 'OK', { duration: 4000 });
      return;
    }

    const movimento: MovimentoFinanceiro = {
      livroCaixaId: contexto.livroCaixa.livroCaixaId,
      contaFinanceiraId: contexto.contaFinanceira.contaFinanceiraId,
      categoriaId: this.form.value.categoriaId,
      valor: this.form.value.valor,
      dataMovimento: this.formatarData(this.form.value.dataMovimento),
      historico: this.form.value.historico,
      eletronico: this.form.value.eletronico,
      pessoaId: this.form.value.pessoaId || null,
      campanhaId: this.form.value.campanhaId || null
    };

    this.salvando.set(true);
    this.tesourariaService.criar(movimento).subscribe({
      next: () => {
        this.salvando.set(false);
        this.snackBar.open('Lançamento salvo com sucesso!', 'OK', { duration: 3000 });
        this.limparFormulario();
      },
      error: (err) => {
        this.salvando.set(false);
        console.error('Erro ao salvar movimento:', err);
        this.snackBar.open('Erro ao salvar lançamento.', 'OK', { duration: 4000 });
      }
    });
  }

  private limparFormulario(): void {
    this.form.reset({
      categoriaId: null,
      valor: null,
      dataMovimento: new Date(),
      historico: '',
      eletronico: false,
      pessoaId: null,
      pessoaNome: '',
      campanhaId: null
    });
    this.pessoasFiltradas.set([]);
  }

  voltarSelecaoContexto(): void {
    this.router.navigate(['/tesouraria/movimento-financeiro/contexto']);
  }

  private formatarData(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
}
