import { Component, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UsuarioService } from '../../../core/services/usuario.service';
import { usuario, RoleUsuario } from '../../../core/models/usuario.model';
import { AuthService } from '../../../core/services/auth.service';

const LOGIN_PROTEGIDO = 'godmin';

@Component({
    selector: 'app-usuarios',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatButtonModule,
              MatSelectModule, MatInputModule, MatFormFieldModule,
              MatProgressSpinnerModule, MatSnackBarModule],
    template: `
    <div class="page">
      <button class="voltar" routerLink="/home">
        <mat-icon>arrow_back</mat-icon> Voltar
      </button>

      <div class="page-header">
        <div>
          <h1>Administradores</h1>
          <p>Contas locais com acesso ao painel administrativo (fora do Active Directory)</p>
        </div>
        <button mat-raised-button color="primary" (click)="abrirFormulario()">
          <mat-icon>person_add</mat-icon> Novo Admin
        </button>
      </div>

      @if (formularioAberto()) {
        <div class="form-card">
          <div class="form-card-header">
            <h3>{{ editando()?.id ? 'Editar' : 'Novo' }} Administrador</h3>
            <button mat-icon-button (click)="fecharFormulario()"><mat-icon>close</mat-icon></button>
          </div>
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Login *</mat-label>
              <input matInput [(ngModel)]="form.login" [disabled]="!!editando()?.id"
                     placeholder="ex: gestor.frota">
            </mat-form-field>
            @if (!editando()?.id) {
              <mat-form-field appearance="outline">
                <mat-label>Senha *</mat-label>
                <input matInput type="password" [(ngModel)]="form.senha" placeholder="mínimo 6 caracteres">
              </mat-form-field>
            }
            <mat-form-field appearance="outline">
              <mat-label>Nome *</mat-label>
              <input matInput [(ngModel)]="form.nome">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Role *</mat-label>
              <mat-select [(ngModel)]="form.role">
                <mat-option value="ADMIN">Admin</mat-option>
                <mat-option value="SUPER_ADMIN">Super Admin</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="form-actions">
            <button mat-button (click)="fecharFormulario()">Cancelar</button>
            <button mat-raised-button color="primary" (click)="salvar()" [disabled]="salvando()">
              {{ salvando() ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </div>
      }

      @if (redefinindoSenha()) {
        <div class="form-card">
          <div class="form-card-header">
            <h3>Redefinir senha — {{ redefinindoSenha()!.nome }}</h3>
            <button mat-icon-button (click)="redefinindoSenha.set(null)"><mat-icon>close</mat-icon></button>
          </div>
          <mat-form-field appearance="outline" style="width:280px">
            <mat-label>Nova senha *</mat-label>
            <input matInput type="password" [(ngModel)]="novaSenha" placeholder="mínimo 6 caracteres">
          </mat-form-field>
          <div class="form-actions">
            <button mat-button (click)="redefinindoSenha.set(null)">Cancelar</button>
            <button mat-raised-button color="primary" (click)="confirmarRedefinirSenha()" [disabled]="salvando()">
              {{ salvando() ? 'Salvando...' : 'Redefinir' }}
            </button>
          </div>
        </div>
      }

      @if (carregando()) {
        <div class="loading"><mat-spinner diameter="40"/></div>
      } @else {
        <div class="cards-grid">
          @for (u of usuarios(); track u.id) {
            <div class="usuario-card" [class.inativo]="!u.ativo">
              <div class="card-top">
                <div class="avatar" [class.super]="u.role === 'SUPER_ADMIN'">{{ u.nome[0] }}</div>
                <div class="card-info">
                  <h4>{{ u.nome }}</h4>
                  <span class="sub">&#64;{{ u.login }}</span>
                </div>
                <span class="role-chip" [class.super]="u.role === 'SUPER_ADMIN'">
                  {{ u.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin' }}
                </span>
              </div>

              <div class="card-details">
                <span class="status-chip" [ngClass]="u.ativo ? 'chip-ativo' : 'chip-inativo'">
                  {{ u.ativo ? 'Ativo' : 'Desativado' }}
                </span>
                @if (u.login === protegido) {
                  <span class="protegido-tag"><mat-icon>lock</mat-icon> Conta protegida</span>
                }
              </div>

              <div class="card-actions">
                <button mat-stroked-button (click)="abrirFormulario(u)">
                  <mat-icon>edit</mat-icon> Editar
                </button>
                <button mat-stroked-button (click)="abrirRedefinirSenha(u)">
                  <mat-icon>key</mat-icon> Senha
                </button>
                @if (u.login !== protegido) {
                  @if (u.ativo) {
                    <button mat-stroked-button color="warn" (click)="desativar(u)">
                      <mat-icon>block</mat-icon> Desativar
                    </button>
                  } @else {
                    <button mat-stroked-button color="primary" (click)="ativar(u)">
                      <mat-icon>check_circle</mat-icon> Ativar
                    </button>
                  }
                  <button mat-stroked-button color="warn" (click)="excluir(u)">
                    <mat-icon>delete</mat-icon> Excluir
                  </button>
                }
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <mat-icon>group_off</mat-icon>
              <p>Nenhum administrador local cadastrado ainda</p>
            </div>
          }
        </div>
      }
    </div>
  `,
    styles: [`
    .page { max-width: 1000px; margin: 0 auto; padding: 24px; }
    .voltar { display: flex; align-items: center; gap: 4px; background: none; border: none;
              color: #5C6370; font-size: 13px; cursor: pointer; padding: 6px 0; margin-bottom: 12px;
              mat-icon { font-size: 18px; width: 18px; height: 18px; }
              &:hover { color: #1565C0; } }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start;
                   margin-bottom: 20px;
                   h1 { font-size: 24px; font-weight: 700; } p { color: #5C6370; margin: 4px 0 0; } }
    .form-card { background: white; border-radius: 12px; padding: 24px;
                 box-shadow: 0 2px 8px rgba(0,0,0,.08); margin-bottom: 20px;
                 border-left: 4px solid #1565C0; }
    .form-card-header { display: flex; justify-content: space-between; align-items: center;
                        margin-bottom: 16px; h3 { font-size: 16px; font-weight: 600; } }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr)); gap: 12px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
    .loading { display: grid; place-items: center; height: 200px; }
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px,1fr)); gap: 16px; }
    .usuario-card {
      background: white; border-radius: 12px; padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,.06);
      &.inativo { opacity: .6; }
      .card-top { display: flex; align-items: center; gap: 12px; margin-bottom: 14px;
        .avatar { width: 44px; height: 44px; border-radius: 50%; background: #1565C0;
                  color: white; font-size: 20px; font-weight: 700;
                  display: grid; place-items: center; flex-shrink: 0;
                  &.super { background: #FFB300; color: #1A1A2E; } }
        .card-info { flex: 1; h4 { font-weight: 600; font-size: 15px; margin: 0; }
                     .sub { font-size: 12px; color: #5C6370; } }
      }
      .role-chip { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px;
                   background: #E3F2FD; color: #1565C0;
                   &.super { background: #FFF3E0; color: #EF6C00; } }
      .card-details { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
      .protegido-tag { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #9E9E9E;
                        mat-icon { font-size: 14px; width: 14px; height: 14px; } }
      .card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    }
    .status-chip { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 10px; }
    .chip-ativo    { background: #E8F5E9; color: #2E7D32; }
    .chip-inativo  { background: #FFEBEE; color: #C62828; }
    .empty-state { grid-column: 1/-1; text-align: center; padding: 48px; color: #9E9E9E;
                   mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 8px; } }
  
    /* Responsividade */
    @media (max-width: 768px) {
      .page-header { flex-direction: column; gap: 8px; }
      .form-grid { grid-template-columns: 1fr !important; }
      .cards-grid { grid-template-columns: 1fr !important; }
      table { font-size: 12px; }
      th, td { padding: 8px 10px; }
      .form-card { padding: 16px; }
      .filter-bar { flex-wrap: wrap; }
      .card-details { grid-template-columns: 1fr !important; }
    }
    @media (max-width: 480px) {
      .page-header h1 { font-size: 20px; }
      .form-actions { flex-direction: column; }
      .form-actions button { width: 100%; }
      .filter-btn { font-size: 11px; padding: 4px 10px; }
    }
  `]})
export class UsuariosComponent implements OnInit {
    usuarios = signal<usuario[]>([]);
    carregando = signal(true);
    salvando = signal(false);
    formularioAberto = signal(false);
    editando = signal<usuario | null>(null);
    redefinindoSenha = signal<usuario | null>(null);

    protegido = LOGIN_PROTEGIDO;
    novaSenha = '';
    form: Partial<usuario & { senha: string }> = {};

    constructor(
        private svc: UsuarioService,
        private snack: MatSnackBar,
        public authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void { this.carregar(); }

    carregar(): void {
        this.carregando.set(true);
        this.svc.listar().subscribe({
            next: (lista) => { this.usuarios.set(lista); this.carregando.set(false); },
            error: () => { this.carregando.set(false); }
        });
    }

    abrirFormulario(usuario?: usuario): void {
        this.editando.set(usuario ?? null);
        this.form = usuario
            ? { login: usuario.login, nome: usuario.nome, role: usuario.role }
            : { role: 'ADMIN' as RoleUsuario };
        
        this.formularioAberto.set(true);
        
        // Faz a rolagem suave até o topo da página onde o formulário é exibido
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    roleLabel(role: string): string {
        const map: Record<string, string> = {
            'SUPER_ADMIN': 'Desenvolvedor',
            'ADMIN': 'Admin',
            'SOLICITANTE': 'Solicitante'
        };
        return map[role] ?? role;
    }

    fecharFormulario(): void {
        this.formularioAberto.set(false);
        this.editando.set(null);
        this.form = {};
    }

    salvar(): void {
        if (!this.form.nome || !this.form.role) return;

        this.salvando.set(true);
        const editando = this.editando();

        const acao = editando?.id
            ? this.svc.atualizar(editando.id, { nome: this.form.nome!, role: this.form.role! })
            : this.svc.criar({
                  login: this.form.login ?? '',
                  senha: this.form.senha ?? '',
                  nome: this.form.nome!,
                  role: this.form.role!
              });

        acao.subscribe({
            next: () => {
                this.snack.open('Salvo com sucesso!', '', { duration: 3000 });
                this.salvando.set(false);
                this.fecharFormulario();
                this.carregar();
            },
            error: (e) => {
                this.snack.open(e.error?.mensagem ?? 'Erro ao salvar.', '', { duration: 4000 });
                this.salvando.set(false);
            }
        });
    }

    abrirRedefinirSenha(usuario: usuario): void {
        this.redefinindoSenha.set(usuario);
        this.novaSenha = '';
        
        // Opcional: rolar suavemente para o topo ao redefinir a senha também
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    confirmarRedefinirSenha(): void {
        const usuario = this.redefinindoSenha();
        if (!usuario?.id || !this.novaSenha) return;

        this.salvando.set(true);
        this.svc.redefinirSenha(usuario.id, this.novaSenha).subscribe({
            next: () => {
                this.snack.open('Senha redefinida com sucesso!', '', { duration: 3000 });
                this.salvando.set(false);
                this.redefinindoSenha.set(null);
            },
            error: (e) => {
                this.snack.open(e.error?.mensagem ?? 'Erro ao redefinir senha.', '', { duration: 4000 });
                this.salvando.set(false);
            }
        });
    }

    ativar(usuario: usuario): void {
        if (!usuario.id) return;
        this.svc.ativar(usuario.id).subscribe({
            next: () => { this.snack.open('Usuário ativado.', '', { duration: 3000 }); this.carregar(); },
            error: (e) => this.snack.open(e.error?.mensagem ?? 'Erro ao ativar.', '', { duration: 4000 })
        });
    }

    desativar(usuario: usuario): void {
        if (!usuario.id) return;
        this.svc.desativar(usuario.id).subscribe({
            next: () => { this.snack.open('Usuário desativado.', '', { duration: 3000 }); this.carregar(); },
            error: (e) => this.snack.open(e.error?.mensagem ?? 'Erro ao desativar.', '', { duration: 4000 })
        });
    }

    excluir(usuario: usuario): void {
        if (!usuario.id) return;
        if (!confirm(`Excluir o admin "${usuario.nome}"? Essa ação não pode ser desfeita.`)) return;

        this.svc.deletar(usuario.id).subscribe({
            next: () => { this.snack.open('Usuário excluído.', '', { duration: 3000 }); this.carregar(); },
            error: (e) => this.snack.open(e.error?.mensagem ?? 'Erro ao excluir.', '', { duration: 4000 })
        });
    }
}