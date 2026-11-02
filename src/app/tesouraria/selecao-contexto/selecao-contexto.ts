import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../core/services/auth.service';
import { TesourariaService } from '../../core/services/tesouraria.service';
import { ContextoLancamentoService } from '../../core/services/contexto-lancamento.service';
import { Congregacao } from '../../core/models/congregacao';
import { CentroCusto } from '../../core/models/centro-custo';
import { ContaFinanceira } from '../../core/models/conta-financeira';
import { LivroCaixa } from '../../core/models/livro-caixa';
import { LivroCaixaDropdown } from '../../core/models/livro-caixa-dropdown';

@Component({
  selector: 'app-selecao-contexto',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './selecao-contexto.html',
  styleUrls: ['./selecao-contexto.scss']
})
export class SelecaoContexto implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly tesourariaService = inject(TesourariaService);
  private readonly contextoService = inject(ContextoLancamentoService);

  form: FormGroup = this.fb.group({
    congregacaoId: [{ value: null, disabled: false }, Validators.required],
    centroCustoId: [{ value: null, disabled: true }, Validators.required],
    contaFinanceiraId: [{ value: null, disabled: true }, Validators.required],
    livroCaixaId: [{ value: null, disabled: true }, Validators.required]
  });

  congregacoes = signal<Congregacao[]>([]);
  centrosCusto = signal<CentroCusto[]>([]);
  contasFinanceiras = signal<ContaFinanceira[]>([]);
  livrosCaixa = signal<LivroCaixa[]>([]);
  carregando = signal(false);
  carregandoCentrosCusto = signal(false);
  carregandoContasFinanceiras = signal(false);
  carregandoLivrosCaixa = signal(false);
  erro = signal<string | null>(null);

  ngOnInit(): void {
    this.carregarCongregacoes();

    this.form.get('congregacaoId')?.valueChanges.subscribe((congregacaoId) => {
      this.form.get('centroCustoId')?.reset();
      this.form.get('centroCustoId')?.disable();
      this.resetarContasFinanceiras();
      this.resetarLivrosCaixa();
      this.centrosCusto.set([]);

      if (congregacaoId) {
        this.carregarCentrosCusto(congregacaoId);
      }
    });

    this.form.get('centroCustoId')?.valueChanges.subscribe((centroCustoId) => {
      this.resetarContasFinanceiras();
      this.resetarLivrosCaixa();

      if (centroCustoId) {
        this.carregarContasFinanceiras(centroCustoId);
        this.carregarLivrosCaixa(centroCustoId);
      }
    });
  }

  private carregarCongregacoes(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.tesourariaService.listarCongregacoes().subscribe({
      next: (dados) => {
        this.congregacoes.set(dados);
        this.inicializarUnidade();
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar congregações:', err);
        this.erro.set('Erro ao carregar congregações. Tente novamente.');
        this.carregando.set(false);
      }
    });
  }

  private carregarCentrosCusto(congregacaoId: number): void {
    this.carregandoCentrosCusto.set(true);
    this.form.get('centroCustoId')?.disable();

    this.tesourariaService.filtrarCentrosCusto(congregacaoId).subscribe({
      next: (dados) => {
        this.centrosCusto.set(dados);
        this.carregandoCentrosCusto.set(false);
        this.form.get('centroCustoId')?.enable();
      },
      error: (err) => {
        console.error('Erro ao carregar centros de custo:', err);
        this.erro.set('Erro ao carregar centros de custo. Tente novamente.');
        this.carregandoCentrosCusto.set(false);
      }
    });
  }

  private carregarContasFinanceiras(centroCustoId: number): void {
    this.carregandoContasFinanceiras.set(true);
    this.form.get('contaFinanceiraId')?.disable();

    this.tesourariaService.filtrarContasFinanceiras(centroCustoId).subscribe({
      next: (dados) => {
        this.contasFinanceiras.set(dados);
        this.carregandoContasFinanceiras.set(false);
        this.form.get('contaFinanceiraId')?.enable();
      },
      error: (err) => {
        console.error('Erro ao carregar contas financeiras:', err);
        this.erro.set('Erro ao carregar contas financeiras. Tente novamente.');
        this.carregandoContasFinanceiras.set(false);
      }
    });
  }

  private carregarLivrosCaixa(centroCustoId: number): void {
    this.carregandoLivrosCaixa.set(true);
    this.form.get('livroCaixaId')?.disable();

    this.tesourariaService.filtrarLivrosCaixa(centroCustoId).subscribe({
      next: (dropdowns) => {
        // O backend retorna LivroCaixaDropdown; convertemos para LivroCaixa
        // preenchendo os campos obrigatórios com valores padrão.
        const livros = dropdowns.map(d => this.converterDropdownParaLivroCaixa(d, centroCustoId));
        this.livrosCaixa.set(livros);
        this.carregandoLivrosCaixa.set(false);
        this.form.get('livroCaixaId')?.enable();
      },
      error: (err) => {
        console.error('Erro ao carregar livros caixa:', err);
        this.erro.set('Erro ao carregar livros caixa. Tente novamente.');
        this.carregandoLivrosCaixa.set(false);
      }
    });
  }

  private resetarContasFinanceiras(): void {
    this.form.get('contaFinanceiraId')?.reset();
    this.form.get('contaFinanceiraId')?.disable();
    this.contasFinanceiras.set([]);
  }

  private resetarLivrosCaixa(): void {
    this.form.get('livroCaixaId')?.reset();
    this.form.get('livroCaixaId')?.disable();
    this.livrosCaixa.set([]);
  }

  private inicializarUnidade(): void {
    if (this.isGlobal()) {
      return;
    }

    const unityId = this.obterUnidadeDoUsuario();
    if (!unityId) {
      return;
    }

    const existe = this.congregacoes().some(c => c.congregacaoId === unityId);
    if (existe) {
      this.form.get('congregacaoId')?.setValue(unityId);
      this.form.get('congregacaoId')?.disable();
    }
  }

  private obterUnidadeDoUsuario(): number | null {
    const usuario = this.authService.usuarioLogado;
    return usuario?.unityId ?? null;
  }

  private isGlobal(): boolean {
    return this.authService.isGlobal();
  }

  confirmar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const congregacao = this.congregacoes().find(c => c.congregacaoId === valores.congregacaoId);
    const centroCusto = this.centrosCusto().find(c => c.centroCustoId === valores.centroCustoId);
    const contaFinanceira = this.contasFinanceiras().find(c => c.contaFinanceiraId === valores.contaFinanceiraId);
    const livroCaixa = this.livrosCaixa().find(l => l.livroCaixaId === valores.livroCaixaId);

    if (!congregacao || !centroCusto || !contaFinanceira || !livroCaixa) {
      this.erro.set('Congregação, centro de custo, conta financeira ou livro caixa não encontrados.');
      return;
    }

    this.contextoService.selecionar({ congregacao, centroCusto, contaFinanceira, livroCaixa });
    this.router.navigate(['/tesouraria/movimento-financeiro/cadastro']);
  }

  private converterDropdownParaLivroCaixa(dropdown: LivroCaixaDropdown, centroCustoId: number): LivroCaixa {
    return {
      livroCaixaId: dropdown.livroCaixaId,
      centroCustoId: centroCustoId,
      competencia: this.extrairCompetencia(dropdown.label),
      saldoInicial: 0,
      saldoFinal: 0,
      situacaoId: 1 // Aberto
    };
  }

  private extrairCompetencia(label: string): string {
    const match = label.match(/(\d{4})-(\d{2})$/);
    return match ? `${match[1]}-${match[2]}-01` : '';
  }

}
