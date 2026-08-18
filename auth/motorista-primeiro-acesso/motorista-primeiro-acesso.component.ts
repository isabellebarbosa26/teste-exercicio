import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-motorista-primeiro-acesso',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule],
    template: `
    <div class="login-wrapper">
      <div class="login-card">
        <div class="card-icon">
          <mat-icon>lock_reset</mat-icon>
        </div>
        <h1>Defina sua senha</h1>
        <p class="subtitle">
          Olá, {{ authService.nome() }}! Esse é seu primeiro acesso. Crie uma senha nova
          para usar.
        </p>

        <form (ngSubmit)="salvar()" #f="ngForm">
          <label>
            Nova senha
            <input type="password" name="senha" [(ngModel)]="senha" autocomplete="new-password"
                   placeholder="Mínimo 6 caracteres" required minlength="6" [disabled]="salvando()" />
          </label>

          <label>
            Confirmar senha
            <input type="password" name="confirmarSenha" [(ngModel)]="confirmarSenha" autocomplete="new-password"
                   placeholder="Repita a senha" required [disabled]="salvando()" />
          </label>

          @if (erro()) {
            <div class="erro">
              <mat-icon>error_outline</mat-icon>
              <span>{{ erro() }}</span>
            </div>
          }

          <button type="submit" class="btn-entrar" [disabled]="salvando() || f.invalid">
            @if (salvando()) {
              <span>Salvando...</span>
            } @else {
              <span>Salvar e continuar</span>
              <mat-icon>arrow_forward</mat-icon>
            }
          </button>
        </form>
      </div>
    </div>
  `,
    styles: [`
    .login-wrapper {
      min-height: 100vh; width: 100%;
      background-image: linear-gradient(rgba(5,8,17,.88), rgba(5,8,17,.9)), url('/assets/images/bg-login.jpg');
      background-size: cover; background-position: center top;
      display: flex; align-items: center; justify-content: center;
      padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .login-card {
      position: relative;
      background-color: #111625; width: 100%; max-width: 400px;
      border-radius: 8px; padding: 40px 35px 35px;
      border: 1px solid #222d44; box-shadow: 0 15px 35px rgba(0,0,0,.5);
    }

    .card-icon {
      width: 56px; height: 56px; border-radius: 12px; background: #2E7D32;
      display: flex; align-items: center; justify-content: center;
      margin: 8px auto 18px;
      mat-icon { color: white; font-size: 28px; width: 28px; height: 28px; }
    }

    h1 { color: #fff; font-size: 20px; font-weight: 700; text-align: center; margin: 0 0 6px; }
    .subtitle { color: #7e8b9b; font-size: 12px; text-align: center; margin: 0 0 28px; line-height: 1.5; }

    label {
      display: flex; flex-direction: column; gap: 6px;
      color: #abb2ba; font-size: 12px; font-weight: 600;
      text-transform: uppercase; letter-spacing: .5px; margin-bottom: 16px;
    }

    input {
      background: #192033; border: 1px solid #222d44; border-radius: 6px;
      padding: 12px 14px; color: #fff; font-size: 14px; font-weight: 400;
      text-transform: none; letter-spacing: normal;
      &:focus { outline: none; border-color: #2E7D32; }
      &::placeholder { color: #4e5d6c; }
      &:disabled { opacity: .6; }
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
      background: #2E7D32; color: #fff; border: none; border-radius: 6px;
      padding: 13px; font-size: 14px; font-weight: 600; cursor: pointer;
      transition: background-color .2s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover:not(:disabled) { background: #256428; }
      &:disabled { opacity: .6; cursor: not-allowed; }
    }
  `]
})
export class MotoristaPrimeiroAcessoComponent {
    senha = '';
    confirmarSenha = '';
    salvando = signal(false);
    erro = signal<string | null>(null);

    constructor(public authService: AuthService, private router: Router) {
        if (!this.authService.primeiroAcesso()) {
            this.router.navigate(['/motorista']);
        }
    }

    salvar(): void {
        if (this.senha.length < 6) {
            this.erro.set('A senha precisa ter no mínimo 6 caracteres.');
            return;
        }
        if (this.senha !== this.confirmarSenha) {
            this.erro.set('As senhas não coincidem.');
            return;
        }

        this.salvando.set(true);
        this.erro.set(null);

        this.authService.definirSenhaPrimeiroAcesso(this.senha).subscribe({
            next: () => {
                this.salvando.set(false);
                this.router.navigate(['/motorista']);
            },
            error: (err) => {
                this.salvando.set(false);
                this.erro.set(err?.error?.mensagem ?? 'Não foi possível salvar a senha. Tente novamente.');
            }
        });
    }
}
