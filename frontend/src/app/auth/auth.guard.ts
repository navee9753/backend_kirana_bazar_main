import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('kirana-auth-token');

  if (token && token !== 'demo-token' && token.trim().length > 0) {
    return true;
  }

  localStorage.removeItem('kirana-auth-token');
  return router.createUrlTree(['/login']);
};
