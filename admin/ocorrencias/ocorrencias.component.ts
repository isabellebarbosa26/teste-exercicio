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
import { OcorrenciaService } from '../../../core/services/ocorrencia.service';
import { OcorrenciaIncidente } from '../../../core/models/ocorrencia.model';

@Component({
  selector: 'app-ocorrencias',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="page-header">
      <div>
        <h1>Ocorrências e Incidentes</h1>
        <p>Gerencie ocorrências registradas pelos motoristas durante as rotas</p>
      </div>
    </div>

    <!-- BARRA DE FILTROS COMPLETOS -->
    <div class="filter-card">
      <div class="filter-header">
        <mat-icon>filter_list</mat-icon> Filtros Avançados
      </div>
      
      <div class="filter-bar">
        <mat-form-field appearance="outline" class="filter-field" style="flex: 1 1 250px;">
          <mat-label>Buscar (Rota, Placa, Motorista, Descrição)</mat-label>
          <input matInput [ngModel]="filtroBusca()" (ngModelChange)="filtroBusca.set($event)" placeholder="Ex: BRA2E19, João, pneu...">
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
          <mat-label>Tipo</mat-label>
          <mat-select [ngModel]="filtroTipo()" (ngModelChange)="filtroTipo.set($event)">
            <mat-option value="">Todos</mat-option>
            <mat-option value="ACIDENTE">Acidente</mat-option>
            <mat-option value="AVARIA_CARGA">Avaria na Carga</mat-option>
            <mat-option value="PROBLEMA_MECANICO">Problema Mecânico</mat-option>
            <mat-option value="ATRASO">Atraso</mat-option>
            <mat-option value="DESVIO_ROTA">Desvio de Rota</mat-option>
            <mat-option value="OUTRO">Outro</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field small">
          <mat-label>Status</mat-label>
          <mat-select [ngModel]="filtroStatus()" (ngModelChange)="filtroStatus.set($event)">
            <mat-option value="">Todos</mat-option>
            <mat-option value="REGISTRADA">Registradas</mat-option>
            <mat-option value="EM_ANALISE">Em Análise</mat-option>
            <mat-option value="RESOLVIDA">Resolvidas</mat-option>
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
      <div class="cards-grid">
        @for (o of ocorrenciasFiltradas(); track o.id) {
          <div class="ocorrencia-card" [ngClass]="tipoClass(o.tipo)">
            <div class="card-top">
              <div class="card-info">
                <h3>{{ o.rotaTarefa || '—' }}</h3>
                <span class="sub">{{ o.nomeMotorista }} · {{ o.placaVeiculo || '—' }}</span>
              </div>
              <span class="tipo-chip" [ngClass]="tipoClass(o.tipo)">{{ tipoLabel(o.tipo) }}</span>
            </div>

            <div class="card-details">
              <span class="status-chip" [ngClass]="statusClass(o.status)">{{ statusLabel(o.status) }}</span>
              <span class="data">{{ o.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>

            <p class="card-desc">{{ o.descricao }}</p>
            @if (o.localizacao) {
              <div class="card-local"><mat-icon>place</mat-icon> {{ o.localizacao }}</div>
            }

            @if (o.comentarioAdmin) {
              <div class="card-comentario"><mat-icon>comment</mat-icon> {{ o.comentarioAdmin }}</div>
            }

            @if (o.status !== 'RESOLVIDA') {
              <div class="form-update">
                <mat-form-field appearance="outline" style="width:160px">
                  <mat-label>Status</mat-label>
                  <mat-select [(ngModel)]="forms[o.id!].status">
                    <mat-option value="EM_ANALISE">Em Análise</mat-option>
                    <mat-option value="RESOLVIDA">Resolvida</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline" style="flex:1">
                  <mat-label>Comentário</mat-label>
                  <input matInput [(ngModel)]="forms[o.id!].comentario" placeholder="Resposta ao motorista...">
                </mat-form-field>
                <button mat-raised-button color="primary" (click)="atualizar(o)" [disabled]="salvandoId() === o.id">
                  {{ salvandoId() === o.id ? '...' : 'Atualizar' }}
                </button>
              </div>
            }
          </div>
        } @empty {
          <div class="empty-state">
            <mat-icon>inbox</mat-icon>
            <p>Nenhuma ocorrência encontrada para estes filtros</p>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 20px;
      h1 { font-size: 24px; font-weight: 700; color: var(--tms-text-strong); } 
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
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px,1fr)); gap: 16px; }

    /* CARD DE OCORRÊNCIA */
    .ocorrencia-card {
      background: var(--tms-surface); border-radius: 12px; padding: 20px;
      box-shadow: var(--tms-shadow-md); border: 1px solid var(--tms-border);
      border-left: 4px solid var(--tms-neutral);
      &.ACIDENTE { border-left-color: var(--tms-danger); }
      &.AVARIA_CARGA { border-left-color: var(--tms-orange); }
      &.PROBLEMA_MECANICO { border-left-color: var(--tms-amber); }
      &.ATRASO { border-left-color: var(--tms-info); }
      &.DESVIO_ROTA { border-left-color: var(--tms-purple); }
      &.OUTRO { border-left-color: var(--tms-neutral); }
    }
    
    .card-top { 
      display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 8px;
      .card-info { flex: 1;
        h3 { font-size: 15px; font-weight: 700; color: var(--tms-text-strong); margin: 0 0 4px; }
        .sub { font-size: 12px; color: var(--tms-text-secondary); } 
      } 
    }
    
    /* CHIPS DE TIPO */
    .tipo-chip { 
      font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; text-transform: uppercase; white-space: nowrap;
      &.ACIDENTE { background: var(--tms-danger-bg); color: var(--tms-danger); }
      &.AVARIA_CARGA { background: var(--tms-orange-bg); color: var(--tms-orange); }
      &.PROBLEMA_MECANICO { background: var(--tms-amber-bg); color: var(--tms-amber); }
      &.ATRASO { background: var(--tms-info-bg); color: var(--tms-info); }
      &.DESVIO_ROTA { background: var(--tms-purple-bg); color: var(--tms-purple); }
      &.OUTRO { background: var(--tms-surface-subtle); color: var(--tms-text-secondary); border: 1px solid var(--tms-border); } 
    }
    
    .card-details { 
      display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
      .data { font-size: 12px; color: var(--tms-text-muted); } 
    }
    
    /* CHIPS DE STATUS */
    .status-chip { 
      font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; text-transform: uppercase;
      &.REGISTRADA { background: var(--tms-info-bg); color: var(--tms-info); }
      &.EM_ANALISE { background: var(--tms-orange-bg); color: var(--tms-orange); }
      &.RESOLVIDA { background: var(--tms-success-bg); color: var(--tms-success); } 
    }
    
    .card-desc { font-size: 13px; color: var(--tms-text-body); line-height: 1.5; margin: 8px 0; }
    
    .card-local { 
      display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--tms-text-secondary); margin-bottom: 8px;
      mat-icon { font-size: 15px; width: 15px; height: 15px; color: var(--tms-text-muted); } 
    }
    
    .card-comentario { 
      display: flex; gap: 6px; font-size: 12px; color: var(--tms-text-secondary); 
      background: var(--tms-surface-subtle); border-radius: 8px; padding: 8px 12px; margin-top: 8px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; margin-top: 2px; } 
    }
    
    /* FORMULÁRIO DENTRO DO CARD */
    .form-update { 
      display: flex; gap: 8px; align-items: center; margin-top: 12px; flex-wrap: wrap; 
      button[color="primary"] { background-color: var(--tms-primary-blue) !important; color: #ffffff !important; }
    }
    
    .empty-state { grid-column: 1/-1; text-align: center; padding: 48px; color: var(--tms-text-muted);
      mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 12px; } }
  
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

    /* Responsividade */
    @media (max-width: 768px) {
      .page-header { flex-direction: column; gap: 8px; }
      .cards-grid { grid-template-columns: 1fr !important; }
      .filter-bar { flex-wrap: wrap; }
      .filter-field { width: 100%; }
    }
  `]
})
export class OcorrenciasComponent implements OnInit {
  carregando = signal(true);
  salvandoId = signal<number | null>(null);
  
  // Listas Originais da API
  ocorrencias = signal<OcorrenciaIncidente[]>([]);
  forms: Record<number, { status: string; comentario: string }> = {};

  // Sinais de Filtro
  filtroBusca = signal<string>('');
  filtroDataInicio = signal<string>('');
  filtroDataFim = signal<string>('');
  filtroTipo = signal<string>('');
  filtroStatus = signal<string>('');

  // Computed: Verifica se algum filtro está preenchido
  temFiltroAtivo = computed(() => {
    return !!(this.filtroBusca() || this.filtroDataInicio() || this.filtroDataFim() || 
              this.filtroStatus() || this.filtroTipo());
  });

  // Computed Reativo: Filtra as ocorrências do lado do cliente instantaneamente
  ocorrenciasFiltradas = computed(() => {
    const busca = this.filtroBusca().toLowerCase();
    const inicio = this.filtroDataInicio();
    const fim = this.filtroDataFim();
    const status = this.filtroStatus();
    const tipo = this.filtroTipo();

    return this.ocorrencias().filter(o => {
      // Filtros Exatos (Dropdowns)
      if (status && o.status !== status) return false;
      if (tipo && o.tipo !== tipo) return false;

      // Filtros de Data (usando o createdAt retornado do backend)
      if (inicio || fim) {
        const dataRef = o.createdAt ? o.createdAt.split('T')[0] : null;
        if (!dataRef) return false;
        if (inicio && dataRef < inicio) return false;
        if (fim && dataRef > fim + 'T23:59:59') return false;
      }

      // Filtro de Texto (Nome, Placa, Rota ou Descrição)
      if (busca) {
        const motorista = (o.nomeMotorista || '').toLowerCase();
        const placa = (o.placaVeiculo || '').toLowerCase();
        const rota = (o.rotaTarefa || '').toLowerCase();
        const desc = (o.descricao || '').toLowerCase();

        if (!motorista.includes(busca) && !placa.includes(busca) && 
            !rota.includes(busca) && !desc.includes(busca)) {
          return false;
        }
      }

      return true;
    });
  });

  constructor(private svc: OcorrenciaService, private snack: MatSnackBar) {}

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.carregando.set(true);
    this.svc.listar().subscribe({
      next: lista => {
        this.ocorrencias.set(lista);
        this.forms = {};
        lista.forEach(o => {
          if (o.id) this.forms[o.id] = { status: o.status, comentario: o.comentarioAdmin || '' };
        });
        this.carregando.set(false);
      },
      error: () => { this.ocorrencias.set([]); this.carregando.set(false); }
    });
  }

  limparFiltros(): void {
    this.filtroBusca.set('');
    this.filtroDataInicio.set('');
    this.filtroDataFim.set('');
    this.filtroTipo.set('');
    this.filtroStatus.set('');
  }

  atualizar(o: OcorrenciaIncidente): void {
    if (!o.id) return;
    this.salvandoId.set(o.id);
    const f = this.forms[o.id];
    this.svc.atualizar(o.id, { status: f.status, comentarioAdmin: f.comentario }).subscribe({
      next: () => {
        this.salvandoId.set(null);
        this.snack.open('Ocorrência atualizada!', '', { duration: 3000 });
        this.carregar();
      },
      error: () => {
        this.salvandoId.set(null);
        this.snack.open('Erro ao atualizar.', '', { duration: 4000 });
      }
    });
  }

  tipoLabel(t: string): string {
    return { ACIDENTE: 'Acidente', AVARIA_CARGA: 'Avaria na Carga', PROBLEMA_MECANICO: 'Problema Mecânico',
             ATRASO: 'Atraso', DESVIO_ROTA: 'Desvio de Rota', OUTRO: 'Outro' }[t] ?? t;
  }
  statusLabel(s: string): string {
    return { REGISTRADA: 'Registrada', EM_ANALISE: 'Em Análise', RESOLVIDA: 'Resolvida' }[s] ?? s;
  }
  tipoClass(t: string): string { return t; }
  statusClass(s: string): string { return s; }
}