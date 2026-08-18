import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuditService } from '../../../core/services/audit.service';
import { AuditLog } from '../../../core/models/audit.model';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, 
    MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="page-header">
      <div>
        <h1>Auditoria do Sistema</h1>
        <p>Registro de todas as ações realizadas no sistema</p>
      </div>
    </div>

    <!-- BARRA DE FILTROS COMPLETOS -->
    <div class="filter-card">
      <div class="filter-header">
        <mat-icon>filter_list</mat-icon> Filtros Avançados
      </div>
      
      <div class="filter-bar">
        <mat-form-field appearance="outline" class="filter-field" style="flex: 1 1 250px;">
          <mat-label>Buscar (Usuário, Detalhes, IP)</mat-label>
          <input matInput [ngModel]="filtroBusca()" (ngModelChange)="filtroBusca.set($event)" placeholder="Ex: admin, 192.168...">
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field small">
          <mat-label>Data Inicial</mat-label>
          <input matInput type="date" [ngModel]="filtroDataInicio()" (ngModelChange)="filtroDataInicio.set($event)">
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field small">
          <mat-label>Data Final</mat-label>
          <input matInput type="date" [ngModel]="filtroDataFim()" (ngModelChange)="filtroDataFim.set($event)">
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field small">
          <mat-label>Entidade</mat-label>
          <mat-select [ngModel]="filtroEntidade()" (ngModelChange)="filtroEntidade.set($event)">
            <mat-option value="">Todas</mat-option>
            <mat-option value="VEICULO">Veículos</mat-option>
            <mat-option value="MOTORISTA">Motoristas</mat-option>
            <mat-option value="TAREFA">Viagens</mat-option>
            <mat-option value="SOLICITACAO">Solicitações</mat-option>
            <mat-option value="USUARIO">Usuários</mat-option>
            <mat-option value="OCORRENCIA">Ocorrências</mat-option>
            <mat-option value="AUTH">Autenticação</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field small">
          <mat-label>Ação</mat-label>
          <mat-select [ngModel]="filtroAcao()" (ngModelChange)="filtroAcao.set($event)">
            <mat-option value="">Todas</mat-option>
            <mat-option value="CREATE">Criação</mat-option>
            <mat-option value="UPDATE">Atualização</mat-option>
            <mat-option value="DELETE">Exclusão</mat-option>
            <mat-option value="LOGIN_SUCCESS">Login OK</mat-option>
            <mat-option value="LOGIN_FAILURE">Login Falha</mat-option>
            <mat-option value="ACCEPT">Aceitar</mat-option>
            <mat-option value="REJECT">Recusar</mat-option>
          </mat-select>
        </mat-form-field>

        @if (temFiltroAtivo()) {
          <button mat-button color="warn" class="clear-btn" (click)="limparFiltros()">
            <mat-icon>clear</mat-icon> Limpar
          </button>
        }
      </div>
    </div>

    @if (carregando()) {
      <div class="loading"><mat-spinner diameter="40"/></div>
    } @else {
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Usuário</th>
              <th>Role</th>
              <th>Ação</th>
              <th>Entidade</th>
              <th>ID</th>
              <th>Detalhes</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            @for (log of logsFiltrados(); track log.id) {
              <tr>
                <td class="data-cell">{{ log.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                <td><strong>{{ log.usuario }}</strong></td>
                <td>{{ log.role || '—' }}</td>
                <td>
                  <span class="chip" [ngClass]="acaoClass(log.acao)">{{ acaoLabel(log.acao) }}</span>
                </td>
                <td>{{ entidadeLabel(log.entidade) }}</td>
                <td>{{ log.entidadeId || '—' }}</td>
                <td class="detalhes-cell" [title]="log.detalhes || ''">{{ log.detalhes || '—' }}</td>
                <td>{{ log.ip || '—' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="8" class="empty">Nenhum registro de auditoria encontrado para estes filtros</td></tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 20px;
      h1 { font-size: 24px; font-weight: 700; color: var(--tms-text-strong); margin: 0; } 
      p { color: var(--tms-text-secondary); margin-top: 4px; } 
    }

    /* BARRA DE FILTROS AVANÇADOS */
    .filter-card {
      background: var(--tms-surface); border-radius: 12px; margin-bottom: 20px;
      border: 1px solid var(--tms-border); box-shadow: var(--tms-shadow-sm); overflow: hidden;
    }
    .filter-header {
      background: var(--tms-surface-alt); padding: 12px 16px; font-size: 13px; font-weight: 700;
      color: var(--tms-text-label); display: flex; align-items: center; gap: 8px; text-transform: uppercase;
      border-bottom: 1px solid var(--tms-border);
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--tms-text-muted); }
    }
    .filter-bar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; padding: 16px; }
    .filter-field { flex: 1 1 160px; min-width: 140px; }
    .filter-field.small { flex: 1 1 120px; min-width: 100px; }
    ::ng-deep .filter-bar .mat-mdc-form-field-subscript-wrapper { display: none !important; }
    .clear-btn { margin-left: auto; }

    .loading { display: grid; place-items: center; height: 200px; }
    
    .table-container { 
      background: var(--tms-surface); border: 1px solid var(--tms-border); border-radius: 12px; box-shadow: var(--tms-shadow-md); overflow-x: auto;
    }
    
    .data-cell { white-space: nowrap; color: var(--tms-text-secondary); font-size: 13px; }
    .detalhes-cell { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--tms-text-secondary); font-size: 13px; }
    
    .chip { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 10px; text-transform: uppercase; white-space: nowrap; }
    .chip-create { background: var(--tms-info-bg); color: var(--tms-info); }
    .chip-update { background: var(--tms-warning-bg); color: var(--tms-warning); }
    .chip-delete { background: var(--tms-danger-bg); color: var(--tms-danger); }
    .chip-login-ok { background: var(--tms-success-bg); color: var(--tms-success); }
    .chip-login-fail { background: var(--tms-rose-bg); color: var(--tms-rose); }
    .chip-accept { background: var(--tms-success-bg); color: var(--tms-success); }
    .chip-reject { background: var(--tms-danger-bg); color: var(--tms-danger); }

    /* ========================================================
       CORREÇÕES DOS CAMPOS (INPUTS E SELECTS) NO TEMA ESCURO
       ======================================================== */
    ::ng-deep html.dark-theme {
      .mdc-text-field__input,
      .mat-mdc-input-element,
      .mat-mdc-select-value-text {
        color: #ffffff !important;
        color-scheme: dark !important; 
      }
      .mdc-text-field__input::placeholder,
      .mat-mdc-input-element::placeholder {
        color: #9ca3af !important;
        -webkit-text-fill-color: #9ca3af !important;
      }
      .mat-mdc-select-arrow svg { fill: #ffffff !important; color: #ffffff !important; }
      .mat-mdc-select-arrow { color: #ffffff !important; }
      input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.7; }
    }

    @media (max-width: 768px) {
      .filter-bar { flex-wrap: wrap; }
      .filter-field { width: 100%; }
    }
  `]
})
export class AuditoriaComponent implements OnInit {
  carregando = signal(true);
  
  // Lista Original da API
  logs = signal<AuditLog[]>([]);
  
  // Sinais de Filtro
  filtroBusca = signal<string>('');
  filtroDataInicio = signal<string>('');
  filtroDataFim = signal<string>('');
  filtroEntidade = signal<string>('');
  filtroAcao = signal<string>('');

  constructor(private svc: AuditService, private snack: MatSnackBar) {}

  ngOnInit(): void { 
    this.carregar(); 
  }

  // Computed: Verifica se algum filtro está ativo para mostrar o botão "Limpar"
  temFiltroAtivo = computed(() => {
    return !!(this.filtroBusca() || this.filtroDataInicio() || this.filtroDataFim() || 
              this.filtroEntidade() || this.filtroAcao());
  });

  // Computed Reativo: Filtra instantaneamente no cliente
  logsFiltrados = computed(() => {
    const busca = this.filtroBusca().toLowerCase();
    const inicio = this.filtroDataInicio();
    const fim = this.filtroDataFim();
    const entidade = this.filtroEntidade();
    const acao = this.filtroAcao();

    return this.logs().filter(log => {
      // Filtros Exatos (Dropdowns)
      if (entidade && log.entidade !== entidade) return false;
      if (acao && log.acao !== acao) return false;

      // Filtros de Data
      if (inicio || fim) {
        const dataRef = log.createdAt ? log.createdAt.split('T')[0] : null;
        if (!dataRef) return false;
        if (inicio && dataRef < inicio) return false;
        if (fim && dataRef > fim + 'T23:59:59') return false;
      }

      // Filtro Livre (Busca por Usuário, IP ou Detalhes)
      if (busca) {
        const usuario = (log.usuario || '').toLowerCase();
        const detalhes = (log.detalhes || '').toLowerCase();
        const ip = (log.ip || '').toLowerCase();

        if (!usuario.includes(busca) && !detalhes.includes(busca) && !ip.includes(busca)) {
          return false;
        }
      }

      return true;
    });
  });

  carregar(): void {
    this.carregando.set(true);
    // Removemos o filtro via backend. Carregamos tudo e filtramos pelo Computed instantaneamente.
    this.svc.listar({}).subscribe({
      next: lista => { this.logs.set(lista); this.carregando.set(false); },
      error: () => { this.logs.set([]); this.carregando.set(false); }
    });
  }

  limparFiltros(): void {
    this.filtroBusca.set('');
    this.filtroDataInicio.set('');
    this.filtroDataFim.set('');
    this.filtroEntidade.set('');
    this.filtroAcao.set('');
  }

  acaoLabel(a: string): string {
    return { CREATE: 'Criar', UPDATE: 'Atualizar', DELETE: 'Excluir',
             LOGIN_SUCCESS: 'Login OK', LOGIN_FAILURE: 'Login Falha',
             ACCEPT: 'Aceitar', REJECT: 'Recusar', EXPORT: 'Exportar', IMPORT: 'Importar' }[a] ?? a;
  }
  
  acaoClass(a: string): string {
    return { CREATE: 'chip-create', UPDATE: 'chip-update', DELETE: 'chip-delete',
             LOGIN_SUCCESS: 'chip-login-ok', LOGIN_FAILURE: 'chip-login-fail',
             ACCEPT: 'chip-accept', REJECT: 'chip-reject' }[a] ?? 'chip-create';
  }
  
  entidadeLabel(e: string): string {
    return { VEICULO: 'Veículo', MOTORISTA: 'Motorista', TAREFA: 'Viagem',
             SOLICITACAO: 'Solicitação', USUARIO: 'Usuário', OCORRENCIA: 'Ocorrência',
             MANUTENCAO: 'Manutenção', COMBUSTIVEL: 'Combustível', AUTH: 'Autenticação', BACKUP: 'Backup' }[e] ?? e;
  }
}