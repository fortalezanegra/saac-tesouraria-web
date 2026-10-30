import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./public/login/login').then(m => m.Login)
  },
  {
    path: '',
    loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [authGuard],
    children: [
      {
        path: 'tesouraria/movimento-financeiro/cadastro',
        loadComponent: () => import('./tesouraria/movimento-financeiro/cadastro-movimento-financeiro/cadastro-movimento-financeiro').then(m => m.CadastroMovimentoFinanceiro),
        canActivate: [permissionGuard('TESOURARIA_MOVIMENTO_FINANCEIRO_CREATE')]
      },
      {
        path: 'tesouraria/movimento-financeiro/consulta',
        loadComponent: () => import('./tesouraria/movimento-financeiro/consulta-movimento-financeiro/consulta-movimento-financeiro').then(m => m.ConsultaMovimentoFinanceiro),
        canActivate: [permissionGuard('TESOURARIA_MOVIMENTO_FINANCEIRO_READ')]
      },
      {
        path: 'tesouraria/movimento-financeiro/relatorio',
        loadComponent: () => import('./tesouraria/movimento-financeiro/relatorio-movimento-financeiro/relatorio-movimento-financeiro').then(m => m.RelatorioMovimentoFinanceiro),
        canActivate: [permissionGuard('TESOURARIA_MOVIMENTO_FINANCEIRO_READ')]
      },
      { path: '', redirectTo: 'tesouraria/movimento-financeiro/consulta', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '/login' }
];
