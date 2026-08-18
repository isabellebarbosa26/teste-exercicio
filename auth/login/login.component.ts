import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule],
    template: `
   <div class="login-page">
  <header class="login-page__header">
    <div class="login-page__brand">
      <img src="assets/images/logo-icon.png" alt="Logo MOVE" class="logo-icon">
      <div class="login-page__system">
        <strong>MOVE</strong>
        <span>Sistema de Transporte</span>
      </div>
    </div>
  </header>
  <main class="login-card">
        <p class="card-title">Acesse sua conta</p>

        <form (ngSubmit)="entrar()" #f="ngForm">
          <label>
            Login / Título de Eleitor
            <input type="text" name="login" [ngModel]="login" (ngModelChange)="onLoginChange($event)"
                   autocomplete="username" placeholder="Ex: secretario.stic ou título de eleitor"
                   required [disabled]="carregando()" />
          </label>

          <label>
            Senha
            <div class="senha-wrapper">
              <input [type]="mostrarSenha() ? 'text' : 'password'" name="senha" [(ngModel)]="senha"
                     autocomplete="current-password"
                     placeholder="deixe em branco no 1º acesso do motorista" [disabled]="carregando()" />
              <button type="button" class="toggle-senha" (click)="alternarSenha()"
                      [disabled]="carregando()" tabindex="-1"
                      [attr.aria-label]="mostrarSenha() ? 'Ocultar senha' : 'Mostrar senha'">
                <mat-icon>{{ mostrarSenha() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </div>
          </label>

          @if (erro()) {
            <div class="erro">
              <mat-icon>error_outline</mat-icon>
              <span>{{ erro() }}</span>
            </div>
          }

          <button type="submit" class="btn-entrar" [disabled]="carregando() || !login">
            @if (carregando()) {
              <span>Entrando...</span>
            } @else {
              <span>Entrar</span>
              <mat-icon>arrow_forward</mat-icon>
            }
          </button>
        </form>

        <div class="info-alert">
          <mat-icon class="info-icon">info</mat-icon>
          <p>Use seu login institucional (admin/solicitante) ou título de eleitor (motorista).
             Motorista no primeiro acesso: entre só com o título de eleitor e defina a senha na sequência.</p>
        </div>
      </main>

      <footer class="login-footer">
        <p>SISTEMA DE TRANSPORTE</p>
        <p class="meta-info">V1.0.0 &nbsp;•&nbsp; MOVE</p>
      </footer>
    </div>
  `,
    styles: [`
   .login-page {
      min-height: 100vh; width: 100%;
      background: #f5f7fb;
      display: flex; flex-direction: column; align-items: center;
      font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
   .login-page__header {
      width: 100%; background: #1b305a; border-bottom: 4px solid #fbc01a;
      box-shadow: 0 2px 6px rgba(15,23,42,.18);
    }
   .login-page__brand {
      max-width: 1200px; margin: 0 auto; padding: 1rem 1.5rem;
      display: flex; align-items: center; gap: 12px;
     }
    .logo-icon { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; display: block; }
    .login-page__system { display: flex; flex-direction: column; line-height: 1.2; }
    .login-page__system strong { color: #fff; font-size: 1.05rem; letter-spacing: .04em; }
    .login-page__system span { color: #c7d2e7; font-size: .8rem;
     }

    .login-card {
      background-color: #ffffff; width: 100%; max-width: 400px; border-radius: 8px;
      padding: 25px 20px; margin: 2.5rem auto; border: 1px solid #e5e7eb;
      box-shadow: 0 15px 35px rgba(15,23,42,.08);
    }
    .card-title { font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; margin-bottom: 20px; }
    label { color: #374151; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; }
    input {
     background: #ffffff; border: 1px solid #d1d5db; border-radius: 6px;
     padding: 12px 14px; color: #1f2937; font-size: 14px;
    &:focus { outline: none; border-color: #1b305a; }
    &::placeholder { color: #9ca3af; font-size: 12px; }
    }
    .card-title { font-size: 13px; color: #7e8b9b; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; margin-bottom: 20px; }
    label {
      display: flex; flex-direction: column; gap: 6px;
      color: #abb2ba; font-size: 12px; font-weight: 600;
      text-transform: uppercase; letter-spacing: .5px; margin-bottom: 16px;
    }
    input {
      background: #192033; border: 1px solid #222d44; border-radius: 6px;
      padding: 12px 14px; color: #fff; font-size: 14px; font-weight: 400;
      text-transform: none; letter-spacing: normal;
      &:focus { outline: none; border-color: #0b66e4; }
      &::placeholder { color: #4e5d6c; font-size: 12px; }
      &:disabled { opacity: .6; }
    }
    .senha-wrapper {
      position: relative; display: flex; align-items: center;
      input { width: 100%; padding-right: 42px; }
      .toggle-senha {
        position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
        background: transparent; border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        width: 30px; height: 30px; border-radius: 4px; padding: 0;
        color: #ffffff; transition: color .2s, background-color .2s;
        mat-icon { font-size: 18px; width: 18px; height: 18px; }
        &:hover:not(:disabled) { color: #ca0101; background: rgba(255,255,255,.06); }
        &:disabled { opacity: .5; cursor: not-allowed; }
      }
    }
    .erro {
      display: flex; align-items: center; gap: 8px;
      background: rgba(244,67,54,.1); border: 1px solid rgba(244,67,54,.3);
      border-radius: 6px; padding: 10px 12px; margin-bottom: 16px;
      color: #EF9A9A; font-size: 12px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; }
    }
    .btn-entrar {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
      background: #1b305a; color: #fff; border: none; border-radius: 6px;
      padding: 13px; font-size: 14px; font-weight: 600; cursor: pointer;
      transition: background-color .2s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover:not(:disabled) { background: #142347; }
      &:disabled { opacity: .6; cursor: not-allowed; }
    }
    .info-alert {
      display: flex; gap: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;
    }
    .info-icon { color: #ffaa00; font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }
    .info-alert p { font-size: 11px; color: #6b7280; line-height: 1.5; }
    .login-footer { text-align: center; font-size: 10px; color: #6b7280; letter-spacing: 1.5px; line-height: 1.8; text-transform: uppercase; }
    .meta-info { margin-top: 5px; opacity: .7; }

    @media (max-width: 480px) {
      .login-wrapper { justify-content: flex-start; gap: 20px; padding: 30px 15px; }
      .brand-name { font-size: 28px; }
      .login-card { padding: 25px 20px; border: none; background-color: rgba(17,22,37,.95); }
    }
  
    @media (max-width: 480px) {
      .login-card { padding: 20px 16px; border: none; }
      .brand-name { font-size: 28px; letter-spacing: 3px; }
      .info-alert p { font-size: 10px; }
    }
  `]})


export class LoginComponent {
    login = '';
    senha = '';
    carregando = signal(false);
    erro = signal<string | null>(null);
    mostrarSenha = signal(false);

    constructor(private authService: AuthService, private router: Router) {}

    /**
     * Formata o input do login: se o usuário digitar apenas dígitos (título de eleitor),
     * aplica a máscara 0000 0000 0000 00 automaticamente. Se digitar letras, mantém como está
     * (é um login institucional como 'godmin' ou 'secretario.stic').
     */
    onLoginChange(valor: string): void {
        const digitos = valor.replace(/\D/g, '');
        // Se tem mais de 0 dígitos E o valor original era só dígitos/espaços, formata como título de eleitor
        if (digitos.length > 0 && valor.replace(/[\s]/g, '').match(/^\d+$/)) {
            let formatado = digitos.slice(0, 14);
            if (digitos.length <= 4) {
                formatado = digitos;
            } else if (digitos.length <= 8) {
                formatado = digitos.slice(0, 4) + ' ' + digitos.slice(4);
            } else if (digitos.length <= 12) {
                formatado = digitos.slice(0, 4) + ' ' + digitos.slice(4, 8) + ' ' + digitos.slice(8);
            } else {
                formatado = digitos.slice(0, 4) + ' ' + digitos.slice(4, 8) + ' '
                          + digitos.slice(8, 12) + ' ' + digitos.slice(12, 14);
            }
            this.login = formatado;
        } else {
            this.login = valor;
        }
    }

    alternarSenha(): void {
        this.mostrarSenha.update(v => !v);
    }

    entrar(): void {
        if (!this.login) return;
        this.carregando.set(true);
        this.erro.set(null);

        this.authService.login({ login: this.login, senha: this.senha || undefined }).subscribe({
            next: () => {
                this.carregando.set(false);
                this.router.navigate([this.authService.rotaInicial()]);
            },
            error: (err) => {
                this.carregando.set(false);
                this.erro.set(err?.error?.mensagem ?? 'Credenciais inválidas. Verifique login e senha.');
            }
        });
    }
}