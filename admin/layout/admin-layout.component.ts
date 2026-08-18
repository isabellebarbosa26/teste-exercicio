import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription, interval, startWith, switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ChatService } from '../../../core/services/chat.service';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';
import { ChatComponent } from '../../../features/admin/chat/chat.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatIconModule, MatButtonModule, MatTooltipModule, 
    ThemeToggleComponent, ChatComponent
  ],
  template: `
  <div class="app-shell">
    <header class="app-header">
      <div class="app-header__inner">
        <button class="menu-toggle" mat-icon-button (click)="toggleSidebar()" aria-label="Abrir ou fechar menu">
          <mat-icon>menu</mat-icon>
        </button>
        
        <a class="app-header__brand" routerLink="/admin/dashboard">
          <img src="/assets/images/logo-icon.png" alt="Logo MOVE" class="brand-logo" />
          <div class="app-header__system">
            <strong>MOVE</strong>
            <span>Gestão de Transporte</span>
          </div>
        </a>

        <span class="spacer"></span>
        
        <app-theme-toggle></app-theme-toggle>
        
        <div class="user-badge">
          <mat-icon>account_circle</mat-icon>
          <span>Desenvolvedor</span>
        </div>
        
        <button mat-icon-button matTooltip="Sair" (click)="sair()" class="btn-sair">
          <mat-icon>logout</mat-icon>
        </button>
      </div>
    </header>

    <div class="app-body" [class.collapsed]="sidebarCollapsed()">
      <aside class="app-side">
        <nav class="sidebar-nav">
          <a routerLink="dashboard" routerLinkActive="active" class="nav-item"
             matTooltip="Dashboard" matTooltipPosition="right">
            <mat-icon>dashboard</mat-icon><span>Dashboard</span>
          </a>
          <a routerLink="solicitacoes" routerLinkActive="active" class="nav-item"
             matTooltip="Solicitações de Viagem" matTooltipPosition="right">
            <mat-icon>commute</mat-icon><span>Solicitações</span>
          </a>
          <a routerLink="chat" routerLinkActive="active" class="nav-item"
             matTooltip="Chat com motoristas" matTooltipPosition="right">
            <mat-icon>forum</mat-icon><span>Chat Expandido</span>
            @if (mensagensNaoLidas() > 0) {
              <span class="nav-badge">{{ mensagensNaoLidas() }}</span>
            }
          </a>
          <a routerLink="veiculos" routerLinkActive="active" class="nav-item"
             matTooltip="Veículos" matTooltipPosition="right">
            <mat-icon>directions_car</mat-icon><span>Veículos</span>
          </a>
          <a routerLink="tarefas" routerLinkActive="active" class="nav-item"
             matTooltip="Viagens" matTooltipPosition="right">
            <mat-icon>assignment</mat-icon><span>Viagens</span>
          </a>
          <a routerLink="motoristas" routerLinkActive="active" class="nav-item"
             matTooltip="Motoristas" matTooltipPosition="right">
            <mat-icon>people</mat-icon><span>Motoristas</span>
          </a>
          <a routerLink="manutencoes" routerLinkActive="active" class="nav-item"
             matTooltip="Manutenções e Combustível" matTooltipPosition="right">
            <mat-icon>build</mat-icon>
            <span>Manutenções</span>
          </a>
          <a routerLink="documentos" routerLinkActive="active" class="nav-item"
             matTooltip="Documentos e Vencimentos" matTooltipPosition="right">
            <mat-icon>folder_shared</mat-icon>
            <span>Documentos</span>
          </a>
          <a routerLink="ocorrencias" routerLinkActive="active" class="nav-item"
             matTooltip="Ocorrências e Incidentes" matTooltipPosition="right">
            <mat-icon>report_problem</mat-icon><span>Ocorrências</span>
          </a>
          <a routerLink="auditoria" routerLinkActive="active" class="nav-item"
             matTooltip="Auditoria do Sistema" matTooltipPosition="right">
            <mat-icon>history</mat-icon><span>Auditoria</span>
          </a>
        </nav>

        <div class="quick-links" aria-label="Acesso rápido">
          <div class="quick-links-title">Acesso rápido</div>
          <a [routerLink]="['tarefas']" [queryParams]="{ novo: 1 }" class="nav-item quick-link"
             matTooltip="Nova viagem" matTooltipPosition="right">
            <mat-icon>add_task</mat-icon><span>Nova Viagem</span>
          </a>
          <a [routerLink]="['veiculos']" [queryParams]="{ novo: 1 }" class="nav-item quick-link"
             matTooltip="Cadastrar veículo" matTooltipPosition="right">
            <mat-icon>directions_car</mat-icon><span>Cadastrar Veículo</span>
          </a>
          <a [routerLink]="['motoristas']" [queryParams]="{ novo: 1 }" class="nav-item quick-link"
             matTooltip="Cadastrar motorista" matTooltipPosition="right">
            <mat-icon>person_add</mat-icon><span>Cadastrar Motorista</span>
          </a>
        </div>
      </aside>

      <main class="content">
        <router-outlet />
      </main>
    </div>

    <!-- MÓDULO DO CHAT FLUTUANTE (POP-UP) -->
    <div class="floating-chat-wrapper">
      @if (chatPopupAberto()) {
        <div class="chat-popup">
          <div class="chat-popup-header">
            <div class="title">
              <mat-icon>forum</mat-icon> Mensagens Rápidas
            </div>
            <button mat-icon-button (click)="toggleChatPopup()"><mat-icon>close</mat-icon></button>
          </div>
          <div class="chat-popup-body">
            <app-chat-admin></app-chat-admin>
          </div>
        </div>
      }

      <button class="fab-chat" (click)="toggleChatPopup()" [class.aberto]="chatPopupAberto()">
        <mat-icon>{{ chatPopupAberto() ? 'keyboard_arrow_down' : 'chat' }}</mat-icon>
        @if (!chatPopupAberto() && mensagensNaoLidas() > 0) {
          <span class="fab-badge">{{ mensagensNaoLidas() }}</span>
        }
      </button>
    </div>
  </div>
`,
styles: [`
  :host { 
    --color-primary: #1b305a; 
    --color-bg: #f5f7fa; 
    --color-sidebar-bg: #ffffff; 
    --color-border: #e5e7eb; 
    --text-primary: #1A1A2E; 
    --text-secondary: #5C6370; 
    --color-sidebar-icon: #1b305a; /* Ícone escuro para o tema claro */
  }
  :host-context(.dark-theme) { 
    --color-primary: #1b305a; 
    --color-bg: #0F172A; 
    --color-sidebar-bg: #1A2332; 
    --color-border: #334155; 
    --text-primary: #FFFFFF; 
    --text-secondary: #94A3B8; 
    --color-sidebar-icon: #60A5FA; /* Ícone claro/brilhante para o tema escuro */
  }

  .app-shell { display: flex; flex-direction: column; height: 100vh; overflow: hidden; background: var(--color-bg); transition: background-color .25s ease; }
  
  .app-header { background: #1b305a; border-bottom: 4px solid #fbc01a; box-shadow: 0 2px 6px rgba(15, 23, 42, .18); flex-shrink: 0; }
  .app-header__inner { display: flex; align-items: center; gap: 12px; height: 64px; padding: 0 1.25rem; }
  .menu-toggle mat-icon { color: #fff; }
  
  .app-header__brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
  .brand-logo { width: 38px; height: 38px; object-fit: contain; border-radius: 50%; background: #ffffff; padding: 2px;}
  .app-header__system { display: flex; flex-direction: column; line-height: 1.1; }
  .app-header__system strong { color: #ffffff; font-size: 1.15rem; letter-spacing: .05em; font-weight: 800; }
  .app-header__system span { color: #c7d2e7; font-size: 0.85rem; font-weight: 400;}
  
  .spacer { flex: 1; }
  .user-badge { display: flex; align-items: center; gap: 6px; color: #e2e8f0; font-size: .875rem; margin-right: 8px;}
  
  .btn-sair mat-icon { color: #e2e8f0; }
  .btn-sair:hover mat-icon { color: #fff; }

  ::ng-deep .app-header app-theme-toggle mat-icon { color: #e2e8f0 !important; }
  ::ng-deep .app-header app-theme-toggle:hover mat-icon { color: #ffffff !important; }

  .app-body { flex: 1; display: grid; grid-template-columns: 240px 1fr; min-height: 0; }
  .app-body.collapsed { grid-template-columns: 64px 1fr; }
  .app-body.collapsed .quick-links-title, .app-body.collapsed .nav-item span { display: none; }

  .app-side { background: var(--color-sidebar-bg); border-right: 1px solid var(--color-border); padding: 1rem 0.75rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; transition: background-color .25s ease, border-color .25s ease;}
  .sidebar-nav { display: flex; flex-direction: column; gap: 4px; }
  .quick-links { display: flex; flex-direction: column; gap: 4px; padding-top: .75rem; border-top: 1px solid var(--color-border); margin-top: auto;}
  .quick-links-title { padding: 6px 12px 8px; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--text-secondary); }

  /* ITENS DO MENU COM COR AUTOMÁTICA DE ÍCONE POR TEMA E HOVER */
  .nav-item { 
    display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 8px; 
    color: var(--text-primary); text-decoration: none; font-size: 14px; font-weight: 500; 
    border: none; background: none; width: 100%; cursor: pointer;
    transition: background-color 0.2s ease;
    
    mat-icon { 
      flex-shrink: 0; font-size: 20px; width: 20px; height: 20px; 
      color: var(--color-sidebar-icon); /* Muda automaticamente entre claro e escuro */
      transition: color 0.2s ease, transform 0.2s ease; 
    }
    
    &:hover { 
      background: var(--color-border); 
      mat-icon { 
        transform: scale(1.1); /* Efeito suave de zoom ao passar o mouse */
      } 
    }
    
    &.active { 
      background: var(--color-primary); 
      color: #fff; 
      mat-icon { color: #fff; } 
    } 
  }

  .nav-badge { margin-left: auto; background: #C62828; color: #fff; font-size: 11px; font-weight: 700; line-height: 1; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; display: grid; place-items: center; flex-shrink: 0; }
  .app-body.collapsed .nav-badge { display: none; }
  
  .content { padding: 1.5rem; background: var(--color-bg); overflow-y: auto; position: relative; transition: background-color .25s ease;}

  .floating-chat-wrapper { position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; align-items: flex-end; gap: 16px; }
  .fab-chat { width: 60px; height: 60px; border-radius: 50%; background: #1565C0; color: white; border: none; box-shadow: 0 4px 14px rgba(0,0,0,0.3); cursor: pointer; display: grid; place-items: center; transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.2s; position: relative; }
  .fab-chat:hover { transform: scale(1.08); background: #0D47A1; }
  .fab-chat.aberto { background: var(--color-sidebar-bg); color: var(--text-primary); border: 1px solid var(--color-border); }
  .fab-chat mat-icon { font-size: 28px; width: 28px; height: 28px; }
  .fab-badge { position: absolute; top: -4px; right: -4px; background: #C62828; color: white; font-size: 12px; font-weight: bold; min-width: 24px; height: 24px; border-radius: 12px; display: grid; place-items: center; border: 2px solid var(--color-bg); box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
  .chat-popup { width: 400px; height: 620px; max-height: calc(100vh - 120px); max-width: calc(100vw - 48px); background: var(--color-bg); border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.25); border: 1px solid var(--color-border); display: flex; flex-direction: column; overflow: hidden; animation: popUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1) forwards; transform-origin: bottom right; }
  @keyframes popUp { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
  .chat-popup-header { display: flex; justify-content: space-between; align-items: center; background: #1b305a; color: white; padding: 8px 16px; border-bottom: 3px solid #fbc01a; }
  .chat-popup-header .title { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 15px; }
  .chat-popup-header button { color: white; }
  .chat-popup-body { flex: 1; overflow: hidden; background: var(--color-bg); }

  ::ng-deep .chat-popup-body app-chat-admin { display: block; height: 100%; overflow-y: auto; padding: 12px;}
  ::ng-deep .chat-popup-body app-chat-admin .page-header { display: none !important; }
  ::ng-deep .chat-popup-body app-chat-admin .page-container { max-width: 100% !important; margin: 0 !important; }

  @media (max-width: 768px) {
    .app-body { display: block; }
    .app-side { position: fixed; top: 64px; left: 0; bottom: 0; width: 260px; z-index: 30; transform: translateX(-100%); transition: transform .25s ease; box-shadow: 2px 0 12px rgba(15, 23, 42, .25); }
    .app-body:not(.collapsed) .app-side { transform: translateX(0); }
    .content { padding: 1rem; }
    .chat-popup { bottom: 85px; right: 16px; width: calc(100vw - 32px); height: calc(100vh - 160px); }
    .floating-chat-wrapper { right: 16px; bottom: 16px; }
  }
  @media (max-width: 480px) { .app-side { width: 100% !important; } }
`]
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  sidebarCollapsed = signal(false);
  chatPopupAberto = signal(false);
  mensagensNaoLidas = signal(0);
  private pollingChat?: Subscription;

  constructor(private router: Router, public authService: AuthService, private chat: ChatService) {}

  ngOnInit(): void {
    this.pollingChat = interval(15000)
      .pipe(startWith(0), switchMap(() => this.chat.contarNaoLidasAdmin()))
      .subscribe({
        next: total => this.mensagensNaoLidas.set(total),
        error: () => {}
      });
  }

  ngOnDestroy(): void { this.pollingChat?.unsubscribe(); }
  toggleSidebar(): void { this.sidebarCollapsed.update(v => !v); }
  toggleChatPopup(): void { this.chatPopupAberto.update(v => !v); }

  sair(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}