import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import { Usuario } from '../models/usuario';

interface LoginRequest {
  email: string;
  senha: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);

  private readonly baseUrl = environment.apis.auth;

  login(email: string, senha: string): Observable<LoginResponse> {
    const body: LoginRequest = { email, senha };

    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, body).pipe(
      tap((resposta) => {
        const token = resposta.accessToken;

        // Pega os dados do usuário que estão dentro do token JWT
        const usuario = this.extrairUsuarioDoToken(token);

        this.tokenService.salvarToken(token);
        this.tokenService.salvarUsuario(usuario);
      })
    );
  }

  logout(): void {
    this.tokenService.limpar();
    this.router.navigate(['/login']);
  }

  estaLogado(): boolean {
    return !!this.tokenService.obterToken();
  }

  temPermissao(permission: string): boolean {
    const usuario = this.tokenService.obterUsuario();
    if (!usuario) {
      return false;
    }
    return usuario.permissions.includes(permission);
  }

  private extrairUsuarioDoToken(token: string): Usuario {
    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = atob(payloadBase64);
      const payload = JSON.parse(payloadJson);

      return {
        userId: payload.userId,
        email: payload.sub,
        unityId: payload.unityId,
        permissions: payload.authorities || []
      };
    } catch (error) {
      console.error('Erro ao extrair usuário do token:', error);
      return { userId: 0, email: '', unityId: 0, permissions: [] };
    }
  }
}
