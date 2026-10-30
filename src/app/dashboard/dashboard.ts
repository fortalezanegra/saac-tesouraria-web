import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { TokenService } from '../core/services/token.service';
import { AuthService } from '../core/services/auth.service';
import { MENU_ITEMS, MenuItem } from '../core/config/menu.config';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
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
  private readonly tokenService = inject(TokenService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  usuario = computed(() => this.tokenService.usuarioLogado());
  menu = MENU_ITEMS;

  // Filtra o menu deixando só itens que o usuário tem permissão
  menuFiltrado = computed(() => {
    const usuario = this.usuario();
    if (!usuario) return [];

    return this.filtrarMenu(this.menu, usuario.permissions);
  });

  private filtrarMenu(items: MenuItem[], permissions: string[]): MenuItem[] {
    return items
      .map(item => {
        if (item.filhos) {
          const filhosFiltrados = this.filtrarMenu(item.filhos, permissions);
          return { ...item, filhos: filhosFiltrados };
        }
        return item;
      })
      .filter(item => {
        if (item.filhos && item.filhos.length > 0) {
          return true;
        }
        return !item.permissao || permissions.includes(item.permissao);
      });
  }

  logout(): void {
    this.authService.logout();
  }
}
