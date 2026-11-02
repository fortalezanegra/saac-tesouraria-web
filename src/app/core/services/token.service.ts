import { Injectable, signal } from '@angular/core';
import { Usuario } from '../models/usuario';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  private readonly TOKEN_KEY = 'saac_token';
  private readonly USER_KEY = 'saac_user';

  usuarioLogado = signal<Usuario | null>(null);

  constructor() {
    this.carregarUsuario();
  }

  salvarToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  obterToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  salvarUsuario(usuario: Usuario): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(usuario));
    this.usuarioLogado.set(usuario);
  }

  obterUsuario(): Usuario | null {
    const usuarioJson = localStorage.getItem(this.USER_KEY);
    if (usuarioJson) {
      try {
        return JSON.parse(usuarioJson);
      } catch {
        return null;
      }
    }
    return null;
  }

  limpar(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.usuarioLogado.set(null);
  }

  /**
   * Verifica se o token JWT está expirado.
   * Retorna true se não houver token ou se o 'exp' for menor que o horário atual.
   */
  tokenExpirado(): boolean {
    const token = this.obterToken();
    if (!token) {
      return true;
    }

    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = this.base64UrlDecode(payloadBase64);
      const payload = JSON.parse(payloadJson);

      if (!payload.exp) {
        return false; // token sem expiração
      }

      // exp vem em segundos; Date.now() em milissegundos
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  private carregarUsuario(): void {
    const usuario = this.obterUsuario();
    this.usuarioLogado.set(usuario);
  }

  private base64UrlDecode(value: string): string {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - base64.length % 4) % 4);
    const decoded = atob(base64 + padding);
    return decodeURIComponent(
      decoded.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
  }
}
