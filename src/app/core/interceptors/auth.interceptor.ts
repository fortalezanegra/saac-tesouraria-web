import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { TokenService } from '../services/token.service';
import { environment } from '../../../environments/environment';

console.log('AUTH.INTERCEPTOR - arquivo carregado');

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  console.log('AUTH.INTERCEPTOR - interceptando requisição:', req.url);

  const tokenService = inject(TokenService);
  const token = tokenService.obterToken();

  const isApiInterna =
    req.url.startsWith(environment.apis.auth) ||
    req.url.startsWith(environment.apis.secretaria) ||
    req.url.startsWith(environment.apis.tesouraria);

  if (token && isApiInterna) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          console.log('AUTH.INTERCEPTOR - resposta recebida:', event.status, event.url);
          console.log('AUTH.INTERCEPTOR - corpo da resposta:', event.body);
        }
      },
      error: (err) => {
        console.error('AUTH.INTERCEPTOR - erro na resposta:', err);
      }
    })
  );
};
