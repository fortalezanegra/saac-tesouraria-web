import { Injectable, inject, Signal } from '@angular/core';
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

  /**
   * Getter que lê o usuário do localStorage.
   * Útil para leituras pontuais, mas não reage a mudanças em tempo real.
   */
  get usuarioLogado(): Usuario | null {
    return this.tokenService.obterUsuario();
  }

  /**
   * Signal reativo que reflete o estado do usuário logado.
   * Use este nos componentes que precisam reagir a login/logout automaticamente.
   */
  get usuarioLogadoSignal(): Signal<Usuario | null> {
    return this.tokenService.usuarioLogado.asReadonly();
  }

  login(email: string, senha: string): Observable<LoginResponse> {
    const body: LoginRequest = { email, senha };

    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, body).pipe(
      tap((resposta) => {
        const token = resposta.accessToken;
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

  /**
   * Agora verifica também se o token ainda é válido (não expirou).
   */
  estaLogado(): boolean {
    const token = this.tokenService.obterToken();
    if (!token) {
      return false;
    }
    return !this.tokenService.tokenExpirado();
  }

  temPermissao(permission: string): boolean {
    const usuario = this.tokenService.obterUsuario();
    if (!usuario) {
      return false;
    }

    const permissions = usuario.permissions || [];

    if (permissions.includes(permission)) {
      return true;
    }

    const scopedPrefix = `${permission}_`;
    return permissions.some(p => p.startsWith(scopedPrefix));
  }

  private extrairUsuarioDoToken(token: string): Usuario {
    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = this.base64UrlDecode(payloadBase64);
      const payload = JSON.parse(payloadJson);

      return {
        userId: payload.userId,
        email: payload.sub,
        nome: payload.name || payload.nome || '',
        unityId: payload.unityId,
        permissions: payload.authorities || []
      };
    } catch (error) {
      console.error('Erro ao extrair usuário do token:', error);
      throw new Error('Token inválido recebido do servidor');
    }
  }

  private base64UrlDecode(value: string): string {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - base64.length % 4) % 4);
    const decoded = atob(base64 + padding);
    return decodeURIComponent(
      decoded.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
  }

  isGlobal(): boolean {
    const usuario = this.tokenService.obterUsuario();
    if (!usuario) {
      return false;
    }
    const permissions = usuario.permissions || [];
    return permissions.some(p => p.endsWith('_GLOBAL'));
  }
}
