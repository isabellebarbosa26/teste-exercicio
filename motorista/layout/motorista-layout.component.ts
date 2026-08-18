import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLinkActive, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subscription, interval, startWith, switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ChatService } from '../../../core/services/chat.service';

@Component({
  selector: 'app-motorista-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatButtonModule],
  template: `
    <div class="layout">
      <header class="topbar">
        <div class="topbar-brand">
          <mat-icon>local_shipping</mat-icon>
          <span>Move</span>
        </div>
        <div class="topbar-user">
          <mat-icon>account_circle</mat-icon>
          <span>{{ authService.nome() }}</span>
        </div>
      </header>

      <main class="content">
        <router-outlet />
      </main>

      <nav class="bottom-nav">
        <a routerLink="/motorista/tarefas" routerLinkActive="active" class="nav-btn">
          <mat-icon>assignment</mat-icon>
          <span>Viagens</span>
        </a>
        <a routerLink="/motorista/chat" routerLinkActive="active" class="nav-btn">
          <span class="icone-badge">
            <mat-icon>forum</mat-icon>
            @if (mensagensNaoLidas() > 0) {
              <span class="badge">{{ mensagensNaoLidas() }}</span>
            }
          </span>
          <span>Chat</span>
        </a>
        <a routerLink="/motorista/ocorrencias" routerLinkActive="active" class="nav-btn">
          <mat-icon>report_problem</mat-icon>
          <span>Ocorrências</span>
        </a>
        <button class="nav-btn" (click)="sair()">
          <mat-icon>logout</mat-icon>
          <span>Sair</span>
        </button>
      </nav>
    </div>
  `,
  styles: [`
    .layout { display: flex; flex-direction: column; height: 100vh; background: #f5f7fb; }
    .topbar {
      height: 56px; background: #1b305a; color: white;
      border-bottom: 4px solid #fbc01a;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 16px; flex-shrink: 0;
    }
    .topbar-brand { display: flex; align-items: center; gap: 8px;
      mat-icon { font-size: 24px; } span { font-size: 18px; font-weight: 700; } }
    .topbar-user  { 
      display: flex; align-items: center; 
      gap: 6px;
      font-size: 14px; opacity: .9; }
    .content { flex: 1; overflow-y: auto; padding: 16px; }
    .bottom-nav {
      display: flex; background: white; border-top: 1px solid #E0E0E0;
      flex-shrink: 0; padding-bottom: env(safe-area-inset-bottom, 0);
    }
    .nav-btn {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      padding: 10px 4px; background: none; border: none; cursor: pointer;
      color: #9E9E9E; font-size: 11px; gap: 3px; text-decoration: none;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
     &.active { color: #1b305a; }
     &:hover  { color: #1b305a; background: #f1f5f9; }
    }
    /* Contador de mensagens não lidas sobre o ícone do chat */
    .icone-badge { position: relative; display: inline-flex;
      .badge {
        position: absolute; top: -4px; right: -8px;
        background: #C62828; color: #fff; font-size: 10px; font-weight: 700; line-height: 1;
        min-width: 16px; height: 16px; padding: 0 4px; border-radius: 8px;
        display: grid; place-items: center;
      }
    }
  
    @media (max-width: 480px) {
      .nav-btn { font-size: 10px; mat-icon { font-size: 20px; } }
      .topbar-brand span { font-size: 16px; }
    }
  `]})
export class MotoristaLayoutComponent implements OnInit, OnDestroy {
  /** Mensagens do setor de transporte ainda não lidas — badge do item "Chat". */
  mensagensNaoLidas = signal(0);
  private pollingChat?: Subscription;

  constructor(private router: Router, public authService: AuthService, private chat: ChatService) {}

  ngOnInit(): void {
    // O contador é um endpoint exclusivo de MOTORISTA — o SUPER_ADMIN só visita a área.
    if (this.authService.role() !== 'MOTORISTA') return;

    this.pollingChat = interval(15000)
      .pipe(startWith(0), switchMap(() => this.chat.contarNaoLidasMotorista()))
      .subscribe({
        next: total => this.mensagensNaoLidas.set(total),
        error: () => {}
      });
  }

  ngOnDestroy(): void { this.pollingChat?.unsubscribe(); }

  sair(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}