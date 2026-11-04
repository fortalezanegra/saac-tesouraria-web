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
import { ContextoLancamentoService } from '../../../core/services/contexto-lancamento.service';

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
  private readonly contextoService = inject(ContextoLancamentoService);

  contexto = this.contextoService.contexto;

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
    const centroCusto = this.contexto()?.centroCusto?.descricao ?? 'Centro de Custo não informado';
    const dataGeracao = new Date().toLocaleDateString('pt-BR');

    const pageWidth = 297;
    const marginX = 14;
    const centerX = pageWidth / 2;

    // Cabeçalho institucional — aparece apenas na primeira página
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Emissão: ${dataGeracao}`, pageWidth - marginX, 10, { align: 'right' });

    doc.setFontSize(20);
    doc.setTextColor(30, 58, 138);
    doc.text('SAAC', centerX, 18, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Sistema Administrativo Adbras Cosmópolis', centerX, 23, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(33, 33, 33);
    doc.text('Relatório de Fluxo de Caixa', centerX, 31, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Centro de Custo: ${centroCusto}`, centerX, 38, { align: 'center' });
    doc.text(`Competência: ${this.formatarCompetencia(competencia)}`, centerX, 44, { align: 'center' });

    const startY = 52;

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
      startY,
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: [30, 58, 138], textColor: 255 },
      didDrawPage: (data) => {
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Página ${data.pageNumber} de ${pageCount}`, pageWidth - marginX, 205, { align: 'right' });
      }
    });

    // Totais estilizados na última página
    const finalY = (doc as any).lastAutoTable?.finalY || 150;
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setPage(pageCount);

    const boxX = marginX;
    const boxY = finalY + 8;
    const boxWidth = pageWidth - (marginX * 2);
    const boxHeight = 38;

    doc.setFillColor(245, 247, 250);
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, 'F');

    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, 'S');

    doc.setFontSize(10);
    doc.setTextColor(30, 58, 138);
    doc.text('RESUMO DO PERÍODO', centerX, boxY + 6, { align: 'center' });

    const col1X = boxX + 10;
    const col2X = boxX + (boxWidth / 2) + 5;
    let y = boxY + 14;

    doc.setFontSize(9);

    doc.setTextColor(60, 60, 60);
    doc.text('Total Entradas:', col1X, y);
    doc.setTextColor(46, 125, 50);
    doc.text(this.formatarMoeda(this.totalEntradas()), col1X + 32, y);

    doc.setTextColor(60, 60, 60);
    doc.text('Total Saídas:', col2X, y);
    doc.setTextColor(198, 40, 40);
    doc.text(this.formatarMoeda(this.totalSaidas()), col2X + 30, y);

    y += 8;

    doc.setTextColor(60, 60, 60);
    doc.text('Saldo:', col1X, y);
    const saldoColor = this.saldo() < 0 ? [198, 40, 40] : [21, 101, 192];
    doc.setTextColor(saldoColor[0], saldoColor[1], saldoColor[2]);
    doc.text(this.formatarMoeda(this.saldo()), col1X + 32, y);

    doc.setTextColor(60, 60, 60);
    doc.text('Enviado (Sede):', col2X, y);
    doc.setTextColor(106, 27, 154);
    doc.text(this.formatarMoeda(this.totalEnviado()), col2X + 30, y);

    y += 8;

    doc.setTextColor(60, 60, 60);
    doc.text('Enviar (Sede):', col1X, y);
    doc.setTextColor(230, 81, 0);
    doc.text(this.formatarMoeda(this.totalEnviar()), col1X + 32, y);

    // Assinaturas centralizadas
    const assinaturaY = boxY + boxHeight + 18;
    const linhaLargura = 70;
    const assinatura1X = centerX - linhaLargura - 10;
    const assinatura2X = centerX + 10;

    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.4);
    doc.line(assinatura1X, assinaturaY, assinatura1X + linhaLargura, assinaturaY);
    doc.line(assinatura2X, assinaturaY, assinatura2X + linhaLargura, assinaturaY);

    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Assistente Financeiro', assinatura1X + (linhaLargura / 2), assinaturaY + 5, { align: 'center' });
    doc.text('Dirigente da Filial', assinatura2X + (linhaLargura / 2), assinaturaY + 5, { align: 'center' });

    doc.save(`relatorio-fluxo-caixa-${competencia}.pdf`);
  }

  private formatarData(data: string): string {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  private formatarCompetencia(competencia: string): string {
    if (!competencia || !competencia.includes('-')) {
      return competencia;
    }
    const [ano, mes] = competencia.split('-');
    return `${mes}/${ano}`;
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
