import { Component, computed, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { AuthService } from '../core/services/auth.service';
import { Usuario } from '../core/models/usuario';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  permissao?: string;
  filhos?: MenuItem[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private readonly authService = inject(AuthService);

  // Signal reativo: o menu recalcula automaticamente quando o usuário logar/logout
  usuario = this.authService.usuarioLogadoSignal;

  menu: MenuItem[] = [
    {
      label: 'Tesouraria',
      icon: 'account_balance',
      filhos: [
        {
          label: 'Contexto',
          icon: 'tune',
          route: '/tesouraria/movimento-financeiro/contexto',
          permissao: 'PERMISSION_TESOURARIA_MOVIMENTO_FINANCEIRO_CREATE'
        },
        {
          label: 'Cadastro',
          icon: 'add_card',
          route: '/tesouraria/movimento-financeiro/cadastro',
          permissao: 'PERMISSION_TESOURARIA_MOVIMENTO_FINANCEIRO_CREATE'
        },
        {
          label: 'Consulta',
          icon: 'search',
          route: '/tesouraria/movimento-financeiro/consulta',
          permissao: 'PERMISSION_TESOURARIA_MOVIMENTO_FINANCEIRO_READ'
        },
        {
          label: 'Relatório',
          icon: 'assessment',
          route: '/tesouraria/movimento-financeiro/relatorio',
          permissao: 'PERMISSION_TESOURARIA_MOVIMENTO_FINANCEIRO_REPORT'
        }
      ]
    }
  ];

  menuFiltrado = computed(() => {
    const usuario = this.usuario();
    if (!usuario) return [];

    const permissions = usuario.permissions || [];
    return this.filtrarMenu(this.menu, permissions);
  });

  private filtrarMenu(itens: MenuItem[], permissions: string[]): MenuItem[] {
    return itens
      .map(item => {
        if (item.filhos && item.filhos.length > 0) {
          const filhosFiltrados = this.filtrarMenu(item.filhos, permissions);
          return { ...item, filhos: filhosFiltrados };
        }
        return item;
      })
      .filter(item => {
        if (item.filhos && item.filhos.length > 0) {
          return item.filhos.length > 0;
        }
        return this.temPermissao(item.permissao, permissions);
      });
  }

  private temPermissao(permissao: string | undefined, permissions: string[]): boolean {
    if (!permissao) return true;

    if (permissions.includes(permissao)) {
      return true;
    }

    // Aceita variações com scope, ex: CREATE_LOCAL
    const scopedPrefix = `${permissao}_`;
    return permissions.some(p => p.startsWith(scopedPrefix));
  }

  logout(): void {
    this.authService.logout();
  }
}
