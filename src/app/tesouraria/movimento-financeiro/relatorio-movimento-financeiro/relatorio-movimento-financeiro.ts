import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { environment } from '../../../../environments/environment';

interface LancamentoRelatorio {
  movimentoFinanceiroId: number;
  dataMovimento: string;
  historico: string;
  categoriaDescricao: string;
  tipoCategoria: 'ENTRADA' | 'SAIDA';
  valor: number;
  contaFinanceiraDescricao: string;
  centroCustoDescricao: string;
  pessoaNome?: string;
  campanhaDescricao?: string;
  eletronico: boolean;
}

interface LinhaRelatorio {
  movimentoFinanceiroId: number;
  dataMovimento: string;
  historico: string;
  categoriaDescricao: string;
  entrada: number;
  saida: number;
  saldoAcumulado: number;
  responsavel: string;
}

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
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './relatorio-movimento-financeiro.html',
  styleUrls: ['./relatorio-movimento-financeiro.scss']
})
export class RelatorioMovimentoFinanceiro implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly http = inject(HttpClient);

  form: FormGroup = this.fb.group({
    competencia: [this.competenciaAtual()]
  });

  lancamentos = signal<LancamentoRelatorio[]>([]);
  carregando = signal(false);
  pesquisou = signal(false);
  colunasExibidas: string[] = [
    'data',
    'historico',
    'categoria',
    'entrada',
    'saida',
    'saldo',
    'responsavel'
  ];

  totalEntradas = signal(0);
  totalSaidas = signal(0);
  saldo = signal(0);
  totalEnviado = signal(0);
  totalEnviar = signal(0);

  linhas = computed<LinhaRelatorio[]>(() => {
    let acumulado = 0;
    return this.lancamentos().map(l => {
      const entrada = l.tipoCategoria === 'ENTRADA' ? l.valor : 0;
      const saida = l.tipoCategoria === 'SAIDA' ? l.valor : 0;
      acumulado += entrada - saida;
      return {
        movimentoFinanceiroId: l.movimentoFinanceiroId,
        dataMovimento: l.dataMovimento,
        historico: l.historico,
        categoriaDescricao: l.categoriaDescricao,
        entrada,
        saida,
        saldoAcumulado: acumulado,
        responsavel: l.pessoaNome || '-'
      };
    });
  });

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

    this.http.post<LancamentoRelatorio[]>(
      `${environment.apis.tesouraria}/movimento-financeiro/relatorio/competencia`,
      body
    ).subscribe({
      next: (lista) => {
        this.lancamentos.set(lista);
        this.calcularTotais(lista);
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar relatório:', err);
        this.snackBar.open('Erro ao carregar relatório.', 'OK', { duration: 4000 });
        this.carregando.set(false);
      }
    });
  }

  private calcularTotais(lista: LancamentoRelatorio[]): void {
    const entradas = lista
      .filter(l => l.tipoCategoria === 'ENTRADA')
      .reduce((soma, l) => soma + l.valor, 0);

    const saidas = lista
      .filter(l => l.tipoCategoria === 'SAIDA')
      .reduce((soma, l) => soma + l.valor, 0);

    const enviado = lista
      .filter(l => l.eletronico && l.tipoCategoria === 'ENTRADA')
      .reduce((soma, l) => soma + l.valor, 0);

    this.totalEntradas.set(entradas);
    this.totalSaidas.set(saidas);
    this.saldo.set(entradas - saidas);
    this.totalEnviado.set(enviado);
    this.totalEnviar.set(entradas - saidas - enviado);
  }

  gerarPdf(): void {
    const linhas = this.linhas();
    if (linhas.length === 0) {
      this.snackBar.open('Nenhum lançamento para gerar PDF.', 'OK', { duration: 3000 });
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const competencia = this.form.value.competencia as string;

    doc.setFontSize(16);
    doc.text('Relatório de Lançamentos por Competência', 14, 15);
    doc.setFontSize(10);
    doc.text(`Competência: ${competencia}`, 14, 22);

    const body = linhas.map(l => [
      this.formatarData(l.dataMovimento),
      l.historico,
      l.categoriaDescricao,
      this.formatarMoeda(l.entrada),
      this.formatarMoeda(l.saida),
      this.formatarMoeda(l.saldoAcumulado),
      l.responsavel
    ]);

    autoTable(doc, {
      head: [['Data', 'Histórico', 'Categoria', 'Entrada', 'Saída', 'Saldo', 'Responsável']],
      body,
      startY: 28,
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: [30, 58, 138], textColor: 255 },
      didDrawPage: (data) => {
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(`Página ${data.pageNumber} de ${pageCount}`, 280, 200, { align: 'right' });
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setPage(pageCount);

    doc.setFontSize(10);
    let y = finalY + 10;

    doc.text(`Total Entradas: ${this.formatarMoeda(this.totalEntradas())}`, 14, y);
    y += 7;
    doc.text(`Total Saídas: ${this.formatarMoeda(this.totalSaidas())}`, 14, y);
    y += 7;
    doc.text(`Saldo: ${this.formatarMoeda(this.saldo())}`, 14, y);
    y += 7;
    doc.text(`Enviado (Sede): ${this.formatarMoeda(this.totalEnviado())}`, 14, y);
    y += 7;
    doc.text(`Enviar (Sede): ${this.formatarMoeda(this.totalEnviar())}`, 14, y);
    y += 15;

    doc.text('_________________________________', 14, y);
    doc.text('Assistente Financeiro', 14, y + 7);
    doc.text('_________________________________', 140, y);
    doc.text('Dirigente da Filial', 140, y + 7);

    doc.save(`relatorio-movimentos-${competencia}.pdf`);
  }

  private formatarData(data: string): string {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  private formatarMoeda(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  private competenciaAtual(): string {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    return `${ano}-${mes}`;
  }
}
