import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

@Component({
    selector: 'app-super-admin-home',
    standalone: true,
    imports: [CommonModule, MatIconModule, ThemeToggleComponent],
    template: `
    <div class="wrapper">
      <header class="topbar">
        <div class="brand">
          <!-- AQUI: Adicionada a barra / antes de assets para a logo aparecer perfeitamente -->
          <img src="/assets/images/logo-icon.png" alt="Logo MOVE" class="brand-logo" />
          <div class="brand-text">
            <strong>MOVE</strong>
            <span>Gestão de Transporte</span>
          </div>
        </div>
        
        <div class="topbar-actions">
          <app-theme-toggle></app-theme-toggle>
          
          <button class="logout" (click)="sair()">
            <mat-icon>logout</mat-icon>
            <span>Sair</span>
          </button>
        </div>
      </header>

      <main class="content">
        <div class="welcome">
          <div class="badge">
            <mat-icon>verified_user</mat-icon>
            PERFIL TÉCNICO
          </div>
          <h1>Olá, Desenvolvedor</h1>
          <p>Você tem acesso completo ao sistema.</p>
        </div>

        <div class="cards">
          <div class="card" (click)="irPara('/admin')">
            <div class="card-icon admin"><mat-icon>admin_panel_settings</mat-icon></div>
            <div class="card-body">
              <h3>Painel Administrativo</h3>
              <p>Veículos, viagens, motoristas, solicitações e relatórios</p>
            </div>
            <mat-icon class="arrow">arrow_forward</mat-icon>
          </div>

          <div class="card" (click)="irPara('/motorista')">
            <div class="card-icon motorista"><mat-icon>drive_eta</mat-icon></div>
            <div class="card-body">
              <h3>Painel do Motorista</h3>
              <p>Ver e testar a área usada pelos motoristas</p>
            </div>
            <mat-icon class="arrow">arrow_forward</mat-icon>
          </div>

          <div class="card" (click)="irPara('/solicitante')">
            <div class="card-icon solicitante"><mat-icon>commute</mat-icon></div>
            <div class="card-body">
              <h3>Painel do Solicitante</h3>
              <p>Solicitar viagens e ver histórico</p>
            </div>
            <mat-icon class="arrow">arrow_forward</mat-icon>
          </div>

          <div class="card" (click)="irPara('/usuarios')">
            <div class="card-icon usuarios"><mat-icon>manage_accounts</mat-icon></div>
            <div class="card-body">
              <h3>Usuários</h3>
              <p>Cadastrar e gerenciar contas de admin, desenvolvedores, solicitantes e usuários comuns</p>
            </div>
            <mat-icon class="arrow">arrow_forward</mat-icon>
          </div>
        </div>
      </main>
    </div>
  `,
    styles: [`
    .wrapper { min-height: 100vh; background: var(--tms-bg-page); display: flex; flex-direction: column; transition: background-color .25s ease;}
    .topbar { height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; background: #1b305a; border-bottom: 4px solid #fbc01a; box-shadow: 0 2px 6px rgba(15, 23, 42, .18); }
    
    /* ESTILOS DA NOVA LOGO E TEXTO */
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-logo { width: 40px; height: 40px; object-fit: contain; border-radius: 50%; background: #ffffff; /* Fundo branco pra logo se ela for transparente */ padding: 2px; }
    .brand-text { display: flex; flex-direction: column; line-height: 1.1; }
    .brand-text strong { color: #ffffff; font-size: 18px; font-weight: 800; letter-spacing: 1px; }
    .brand-text span { color: #c7d2e7; font-size: 12px; font-weight: 400; }

    .topbar-actions { display: flex; align-items: center; gap: 16px; }
    ::ng-deep .topbar-actions app-theme-toggle mat-icon { color: #e2e8f0 !important; }
    ::ng-deep .topbar-actions app-theme-toggle:hover mat-icon { color: #ffffff !important; }

    .logout { display: flex; align-items: center; gap: 6px; background: transparent; border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 6px; color: #e2e8f0; padding: 8px 14px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .2s ease; mat-icon { font-size: 18px; width: 18px; height: 18px; color: #e2e8f0; transition: color .2s; }
      &:hover { background: rgba(244, 67, 54, 0.15); border-color: #f44336; color: #ffffff; mat-icon { color: #f44336; } } }

    .content { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 60px 20px; }
    .welcome { text-align: center; max-width: 480px; margin-bottom: 40px; }
    .badge { display: inline-flex; align-items: center; gap: 6px; background: var(--tms-warning-bg); color: var(--tms-warning); border: 1px solid var(--tms-warning); border-radius: 20px; padding: 5px 14px; font-size: 11px; font-weight: 700; letter-spacing: 1px; margin-bottom: 16px; mat-icon { font-size: 14px; width: 14px; height: 14px; color: var(--tms-warning); } }
    .welcome h1 { color: var(--tms-text-strong); font-size: 26px; margin: 0 0 8px; }
    .welcome p { color: var(--tms-text-secondary); font-size: 14px; margin: 0; }
    .cards { display: flex; flex-direction: column; gap: 14px; width: 100%; max-width: 480px; }
    .card { background: var(--tms-surface); border: 1px solid var(--tms-border); border-radius: 8px; padding: 20px; display: flex; align-items: center; gap: 16px; cursor: pointer; box-shadow: var(--tms-shadow-sm); transition: border-color .2s, transform .15s, background-color .2s;
      &:hover { border-color: var(--tms-primary-blue); transform: translateY(-1px); background: var(--tms-surface-alt); } }
    .card-icon { width: 48px; height: 48px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; mat-icon { color: #ffffff !important; font-size: 24px; width: 24px; height: 24px; }
      &.admin { background: var(--tms-primary-blue); } &.motorista { background: var(--tms-success); } &.solicitante { background: var(--tms-purple); } &.usuarios { background: var(--tms-accent); mat-icon { color: #1A1A2E !important; } } }
    .card-body { flex: 1; }
    .card-body h3 { color: var(--tms-text-strong); font-size: 15px; margin: 0 0 4px; font-weight: 600;}
    .card-body p { color: var(--tms-text-secondary); font-size: 12px; margin: 0; }
    .arrow { color: var(--tms-text-muted); }
  
    @media (max-width: 480px) {
      .content { padding: 30px 16px; }
      .welcome h1 { font-size: 22px; }
      .welcome p { font-size: 12px; }
      .cards { gap: 10px; }
      .card { padding: 16px; gap: 12px; }
      .card-icon { width: 40px; height: 40px; mat-icon { font-size: 20px; } }
      .card-body h3 { font-size: 14px; }
      .card-body p { font-size: 11px; }
      .topbar-actions { gap: 8px; }
      .logout span { display: none; }
    }
  `]
})
export class SuperAdminHomeComponent {
    constructor(public authService: AuthService, private router: Router) {}
    irPara(rota: string): void { this.router.navigate([rota]); }
    sair(): void { this.authService.logout(); this.router.navigate(['/login']); }
}