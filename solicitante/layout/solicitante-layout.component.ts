import { Component } from '@angular/core';
import { Router, RouterOutlet, RouterLinkActive, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-solicitante-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatButtonModule, NgIf],
  template: `
    <div class="layout">

      <!-- TOPBAR MOBILE -->
      <header class="topbar">
        <div class="topbar-brand">
          <mat-icon>commute</mat-icon>
          <span>MOVE</span>
        </div>
        <div class="topbar-user">
          <mat-icon>account_circle</mat-icon>
          <span>{{ authService.nome() }}</span>
        </div>
      </header>

      <!-- CONTEÚDO -->
      <main class="content">
        <router-outlet />
      </main>

      <!-- BOTTOM NAV (mobile-first) -->
      <nav class="bottom-nav">
        <a routerLink="/solicitante/solicitacoes" routerLinkActive="active" class="nav-btn">
          <mat-icon>list_alt</mat-icon>
          <span>Minhas Solicitações</span>
        </a>
        <a routerLink="/solicitante/nova" routerLinkActive="active" class="nav-btn"
           *ngIf="authService.podeSolicitarViagem()">
          <mat-icon>add_location_alt</mat-icon>
          <span>Nova Solicitação</span>
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
      height: 56px; 
      background: #1b305a; color: white; border-bottom: 4px solid #fbc01a;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 16px; flex-shrink: 0;
      .topbar-brand { display: flex; align-items: center; gap: 8px;
                      mat-icon { font-size: 24px; } span { font-size: 18px; font-weight: 700; } }
      .topbar-user  { display: flex; align-items: center; gap: 6px;
                      font-size: 14px; opacity: .9; }
    }

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
      &:hover   { color: #1b305a; background: #f1f5f9; }
    }
  
    @media (max-width: 480px) {
      .nav-btn { font-size: 10px; mat-icon { font-size: 20px; } }
      .topbar-brand span { font-size: 16px; }
    }
  `]})
export class SolicitanteLayoutComponent {
  constructor(private router: Router, public authService: AuthService) {}
  sair(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}