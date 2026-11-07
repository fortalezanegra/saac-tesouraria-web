import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


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
    MatAutocompleteModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './cadastro-movimento-financeiro.html',
  styleUrls: ['./cadastro-movimento-financeiro.scss']
})
export class CadastroMovimentoFinanceiro implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
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
  carregando = signal(false);
  modoEdicao = signal(false);
  movimentoFinanceiroId = signal<number | null>(null);

  pessoaSelecionada: Pessoa | null = null;

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

    this.carregarListas(contexto.centroCusto.centroCustoId);
    this.configurarPesquisaPessoa(contexto.congregacao?.congregacaoId);

    const idEdicao = this.route.snapshot.paramMap.get('id');
    if (idEdicao) {
      this.modoEdicao.set(true);
      this.movimentoFinanceiroId.set(Number(idEdicao));
      this.carregarMovimento(Number(idEdicao));
    }
  }

  private carregarListas(centroCustoId: number): void {
    this.tesourariaService.categorias().subscribe({
      next: (lista) => this.categorias.set(lista),
      error: (err) => console.error('Erro ao carregar categorias:', err)
    });

    this.tesourariaService.filtrarCampanhas(centroCustoId).subscribe({
      next: (lista) => this.campanhas.set(lista),
      error: (err) => console.error('Erro ao carregar campanhas:', err)
    });
  }

  private configurarPesquisaPessoa(congregacaoId: number | undefined): void {
    this.form.get('pessoaNome')?.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((termo) => {
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
    this.pessoaSelecionada = pessoa;
    this.form.get('pessoaId')?.setValue(pessoa.pessoaId);
    this.form.get('pessoaNome')?.setValue(pessoa.nome, { emitEvent: false });
    this.pessoasFiltradas.set([]);
  }

  limparPessoa(): void {
    this.pessoaSelecionada = null;
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

    const valores = this.form.value;

    const movimento: MovimentoFinanceiro = {
      livroCaixaId: contexto.livroCaixa.livroCaixaId,
      contaFinanceiraId: contexto.contaFinanceira.contaFinanceiraId,
      categoriaId: valores.categoriaId,
      valor: valores.valor,
      dataMovimento: this.formatarData(valores.dataMovimento),
      historico: valores.historico || '',
      eletronico: valores.eletronico === true,
      pessoaId: this.pessoaSelecionada ? this.pessoaSelecionada.pessoaId : null,
      campanhaId: valores.campanhaId || null
    };

    this.salvando.set(true);

    const id = this.movimentoFinanceiroId();
    const requisicao = this.modoEdicao() && id
      ? this.tesourariaService.atualizar(id, movimento)
      : this.tesourariaService.criar(movimento);

    requisicao.subscribe({
      next: () => {
        this.salvando.set(false);
        this.snackBar.open(
          this.modoEdicao() ? 'Lançamento atualizado com sucesso!' : 'Lançamento salvo com sucesso!',
          'OK',
          { duration: 3000 }
        );

        if (this.modoEdicao()) {
          // Em edição, volta para a consulta
          this.router.navigate(['/tesouraria/movimento-financeiro/consulta']);
        } else {
          // Em cadastro, limpa o formulário e mantém na tela
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
          this.pessoaSelecionada = null;
          this.pessoasFiltradas.set([]);
        }
      },
      error: (err) => {
        this.salvando.set(false);
        console.error('Erro ao salvar movimento:', err);
        this.snackBar.open('Erro ao salvar lançamento.', 'OK', { duration: 4000 });
      }
    });
  }


  private carregarMovimento(id: number): void {
    this.carregando.set(true);

    this.tesourariaService.buscarPorId(id).subscribe({
      next: (movimento) => {
        this.form.patchValue({
          categoriaId: movimento.categoriaId,
          valor: movimento.valor,
          dataMovimento: new Date(movimento.dataMovimento + 'T00:00:00'),
          historico: movimento.historico,
          eletronico: movimento.eletronico,
          pessoaId: movimento.pessoaId ?? null,
          pessoaNome: movimento.pessoaNome ?? '',
          campanhaId: movimento.campanhaId ?? null
        });

        if (movimento.pessoaId && movimento.pessoaNome) {
          this.pessoaSelecionada = {
            pessoaId: movimento.pessoaId,
            nome: movimento.pessoaNome
          } as Pessoa;
        }

        this.carregando.set(false);
      },
      error: (err) => {
        this.carregando.set(false);
        console.error('Erro ao carregar movimento:', err);
        this.snackBar.open('Erro ao carregar lançamento.', 'OK', { duration: 4000 });
        this.router.navigate(['/tesouraria/movimento-financeiro/consulta']);
      }
    });
  }

  voltarSelecaoContexto(): void {
    this.router.navigate(['/tesouraria/movimento-financeiro/contexto']);
  }

  private formatarData(data: Date | string | null): string {
    if (!data) {
      return '';
    }

    let dataObj: Date;

    if (data instanceof Date) {
      dataObj = data;
    } else if (typeof data === 'string') {
      const partes = data.split('/');
      if (partes.length === 3) {
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1;
        const ano = parseInt(partes[2], 10);
        dataObj = new Date(ano, mes, dia);
      } else {
        dataObj = new Date(data);
      }
    } else {
      return '';
    }

    const ano = dataObj.getFullYear();
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const dia = String(dataObj.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }
}
