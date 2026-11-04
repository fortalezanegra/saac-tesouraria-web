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
        path: 'tesouraria/movimento-financeiro/contexto',
        loadComponent: () => import('./tesouraria/selecao-contexto/selecao-contexto').then(m => m.SelecaoContexto),
        canActivate: [permissionGuard('PERMISSION_TESOURARIA_MOVIMENTO_FINANCEIRO_CREATE')]
      },
      {
        path: 'tesouraria/movimento-financeiro/cadastro',
        loadComponent: () => import('./tesouraria/movimento-financeiro/cadastro-movimento-financeiro/cadastro-movimento-financeiro').then(m => m.CadastroMovimentoFinanceiro),
        canActivate: [permissionGuard('PERMISSION_TESOURARIA_MOVIMENTO_FINANCEIRO_CREATE')]
      },
      {
        path: 'tesouraria/movimento-financeiro/relatorio',
        loadComponent: () => import('./tesouraria/movimento-financeiro/relatorio-movimento-financeiro/relatorio-movimento-financeiro').then(m => m.RelatorioMovimentoFinanceiro),
        canActivate: [permissionGuard('PERMISSION_TESOURARIA_MOVIMENTO_FINANCEIRO_REPORT')]
      }

    ]
  },
  { path: '**', redirectTo: '/login' }
];
