import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  console.log('AUTH.GUARD - verificando rota:', state.url);

  const authService = inject(AuthService);
  const router = inject(Router);

  const logado = authService.estaLogado();
  console.log('AUTH.GUARD - usuario logado?', logado);

  if (logado) {
    console.log('AUTH.GUARD - permitindo acesso');
    return true;
  }

  console.log('AUTH.GUARD - redirecionando para /login');
  router.navigate(['/login']);
  return false;
};
