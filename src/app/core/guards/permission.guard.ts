import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const permissionGuard = (permission: string): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const variations = [
      permission,
      `${permission}_GLOBAL`,
      `${permission}_LOCAL`
    ];

    const hasPermission = variations.some(p => authService.temPermissao(p));

    if (hasPermission) {
      return true;
    }

    router.navigate(['/']);
    return false;
  };
};
