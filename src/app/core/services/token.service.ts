import { Injectable, signal } from '@angular/core';
import { Usuario } from '../models/usuario';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  private readonly TOKEN_KEY = 'saac_token';
  private readonly USER_KEY = 'saac_user';

  // Signal é uma forma moderna do Angular de avisar quando algo mudou
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
      return JSON.parse(usuarioJson);
    }
    return null;
  }

  limpar(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.usuarioLogado.set(null);
  }

  private carregarUsuario(): void {
    const usuario = this.obterUsuario();
    this.usuarioLogado.set(usuario);
  }
}
