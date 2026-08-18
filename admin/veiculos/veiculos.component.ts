import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { VeiculoService } from '../../../core/services/veiculo.service';
import { Veiculo, StatusVeiculo } from '../../../core/models/veiculo.model';

@Component({
  selector: 'app-veiculos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatSelectModule, MatInputModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule
  ],
  template: `
    <div class="page-header">
      <div>
        <h1>Veículos</h1>
        <p>Gerenciamento da frota</p>
      </div>
      <button mat-raised-button color="primary" (click)="abrirFormulario()">
        <mat-icon>add</mat-icon> Novo Veículo
      </button>
    </div>

    <!-- BARRA DE FILTROS COMPLETOS -->
    <div class="filter-card">
      <div class="filter-header">
        <mat-icon>filter_list</mat-icon> Filtros Avançados
      </div>
      
      <div class="filter-bar">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Buscar (Placa, Modelo, Marca)</mat-label>
          <input matInput [ngModel]="filtroBusca()" (ngModelChange)="filtroBusca.set($event)" placeholder="Ex: BRA2E19...">
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Status</mat-label>
          <mat-select [ngModel]="filtroStatus()" (ngModelChange)="filtroStatus.set($event)">
            <mat-option value="">Todos</mat-option>
            <mat-option value="DISPONIVEL">Disponível</mat-option>
            <mat-option value="EM_ROTA">Em Rota</mat-option>
            <mat-option value="MANUTENCAO">Manutenção</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Tipo de Uso</mat-label>
          <mat-select [ngModel]="filtroTipoUso()" (ngModelChange)="filtroTipoUso.set($event)">
            <mat-option value="">Todos</mat-option>
            <mat-option value="CARGA">Carga</mat-option>
            <mat-option value="PASSAGEIRO">Passageiro</mat-option>
            <mat-option value="MISTO">Misto</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field small">
          <mat-label>KM Mínimo</mat-label>
          <input matInput type="number" [ngModel]="filtroKmMin()" (ngModelChange)="filtroKmMin.set($event)">
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field small">
          <mat-label>KM Máximo</mat-label>
          <input matInput type="number" [ngModel]="filtroKmMax()" (ngModelChange)="filtroKmMax.set($event)">
        </mat-form-field>

        @if (temFiltroAtivo()) {
          <button mat-button color="warn" class="clear-btn" (click)="limparFiltros()">
            <mat-icon>clear</mat-icon> Limpar
          </button>
        }
      </div>
    </div>

    <!-- FORMULÁRIO INLINE -->
    @if (formularioAberto()) {
      <div class="form-card">
        <div class="form-card-header">
          <h3>{{ editando()?.id ? 'Editar' : 'Novo' }} Veículo</h3>
          <button mat-icon-button (click)="fecharFormulario()"><mat-icon>close</mat-icon></button>
        </div>
        
        <div class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Placa *</mat-label>
            <input matInput [(ngModel)]="form.placa" placeholder="BRA2E19">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Modelo *</mat-label>
            <input matInput [(ngModel)]="form.modelo">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Marca *</mat-label>
            <input matInput [(ngModel)]="form.marca">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Ano</mat-label>
            <input matInput type="number" [(ngModel)]="form.anoFabricacao">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Tipo de Uso *</mat-label>
            <mat-select [(ngModel)]="form.tipoUso">
              <mat-option value="CARGA">Carga</mat-option>
              <mat-option value="PASSAGEIRO">Passageiro</mat-option>
              <mat-option value="MISTO">Misto (carga + passageiros)</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Capacidade *</mat-label>
            <input matInput type="number" [(ngModel)]="form.capacidade">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>KM Atual</mat-label>
            <input matInput type="number" [(ngModel)]="form.quilometragemAtual">
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

    <!-- TABELA -->
    @if (carregando()) {
      <div class="loading"><mat-spinner diameter="40"/></div>
    } @else {
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Placa</th>
              <th>Veículo</th>
              <th>Tipo</th>
              <th>Status</th>
              <th class="num">KM Atual</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            @for (v of veiculosFiltrados(); track v.id) {
              <tr>
                <td><strong>{{ v.placa }}</strong></td>
                <td>{{ v.modelo }}<br><span class="sub">{{ v.marca }} · {{ v.anoFabricacao }}</span></td>
                <td>{{ veiculoUsoLabel(v.tipoUso) }}</td>
                <td><span class="status-chip" [ngClass]="chipClass(v.status)">{{ statusLabel(v.status) }}</span></td>
                <td class="num">{{ v.quilometragemAtual | number:'1.0-0' }} km</td>
                <td class="actions">
                  <button mat-icon-button matTooltip="Editar" (click)="abrirFormulario(v)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  @if (v.status !== 'MANUTENCAO') {
                    <button mat-icon-button matTooltip="Enviar p/ manutenção" color="warn" (click)="manutencao(v)">
                      <mat-icon>build</mat-icon>
                    </button>
                  } @else {
                    <button mat-icon-button matTooltip="Marcar disponível" color="primary" (click)="disponivel(v)">
                      <mat-icon>check_circle</mat-icon>
                    </button>
                  }
                  <button mat-icon-button matTooltip="Excluir" color="warn" (click)="excluir(v)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="empty">Nenhum veículo encontrado para estes filtros</td></tr>
            }
          </tbody>
          @if (veiculosFiltrados().length > 0) {
            <tfoot>
              <tr>
                <td colspan="6"><strong>Total: {{ veiculosFiltrados().length }} veículo(s) listado(s)</strong></td>
              </tr>
            </tfoot>
          }
        </table>
      </div>
    }
  `,
  styles: [`
    .page-header { 
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 20px;
      h1 { font-size: 24px; font-weight: 700; color: var(--tms-text-strong); margin: 0; } 
      p { color: var(--tms-text-secondary); margin-top: 4px; } 
    }
    
    /* BARRA DE FILTROS */
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
    .filter-field { flex: 1 1 180px; min-width: 140px; }
    .filter-field.small { flex: 1 1 120px; min-width: 100px; }
    ::ng-deep .filter-bar .mat-mdc-form-field-subscript-wrapper { display: none !important; }
    .clear-btn { margin-left: auto; }
    
    /* CARTÃO DO FORMULÁRIO */
    .form-card { 
      background: var(--tms-surface); border-radius: 12px; padding: 24px; 
      box-shadow: var(--tms-shadow-md); border: 1px solid var(--tms-border); 
      margin-bottom: 20px; border-left: 4px solid var(--tms-primary-blue); 
    }
    .form-card-header { 
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
      h3 { font-size: 16px; font-weight: 700; color: var(--tms-text-strong); margin: 0; } 
      button mat-icon { color: var(--tms-text-muted); }
    }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap: 12px; }
    
    /* BOTÕES DO FORMULÁRIO */
    .form-actions { 
      display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; 
      button[mat-button] { color: var(--tms-text-strong) !important; }
      button[color="primary"] { background-color: var(--tms-primary-blue) !important; color: #ffffff !important; }
    }
    
    .loading { display: grid; place-items: center; height: 200px; }
    
    /* TABELA */
    .table-container { background: var(--tms-surface); border: 1px solid var(--tms-border); border-radius: 12px; box-shadow: var(--tms-shadow-sm); overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; background: var(--tms-surface);
      th { background: var(--tms-surface-alt); padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: var(--tms-text-header-cell); text-transform: uppercase; }
      th.num, td.num { text-align: right; font-variant-numeric: tabular-nums; }
      td { padding: 14px 16px; border-top: 1px solid var(--tms-border); font-size: 14px; color: var(--tms-text-body);
        .sub { color: var(--tms-text-secondary); font-size: 12px; } 
      }
      tfoot td { border-top: 2px solid var(--tms-border); background: var(--tms-surface-alt); font-size: 14px; color: var(--tms-text-strong); }
      .actions { display: flex; gap: 4px; justify-content: flex-start;
        button { color: var(--tms-text-secondary); }
        button[color="primary"] { color: var(--tms-primary-blue) !important; }
        button[color="warn"] { color: var(--tms-danger) !important; }
      }
    }
    .empty { text-align: center; color: var(--tms-text-muted) !important; padding: 32px !important; }

    /* CHIPS DE STATUS */
    .status-chip { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .chip-disponivel { background: var(--tms-success-bg); color: var(--tms-success); }
    .chip-em-rota { background: var(--tms-warning-bg); color: var(--tms-warning); }
    .chip-manutencao { background: var(--tms-danger-bg); color: var(--tms-danger); }

    /* Correções Modo Escuro Material */
    ::ng-deep html.dark-theme {
      .mdc-text-field__input, .mat-mdc-input-element, .mat-mdc-select-value-text { color: #ffffff !important; color-scheme: dark !important; }
      .mdc-text-field__input::placeholder, .mat-mdc-input-element::placeholder { color: #9ca3af !important; -webkit-text-fill-color: #9ca3af !important; }
      .mat-mdc-select-arrow svg { fill: #ffffff !important; color: #ffffff !important; }
      .mat-mdc-select-arrow { color: #ffffff !important; }
      input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { background: transparent !important; }
    }

    @media (max-width: 768px) {
      .page-header { flex-direction: column; gap: 8px; }
      .form-grid { grid-template-columns: 1fr !important; }
      table { font-size: 12px; }
      th, td { padding: 8px 10px; }
      .form-card { padding: 16px; }
      .filter-bar { flex-wrap: wrap; }
      .filter-field { width: 100%; }
    }
  `]
})
export class VeiculosComponent implements OnInit {
  veiculos    = signal<Veiculo[]>([]);
  carregando  = signal(true);
  salvando    = signal(false);
  formularioAberto = signal(false);
  editando    = signal<Veiculo | null>(null);
  form: Partial<Veiculo> = {};

  // Sinais de Filtro
  filtroBusca = signal<string>('');
  filtroStatus = signal<string>('');
  filtroTipoUso = signal<string>('');
  filtroKmMin = signal<number | null>(null);
  filtroKmMax = signal<number | null>(null);

  // Computed que verifica se a lista está filtrada
  temFiltroAtivo = computed(() => {
    return !!(this.filtroBusca() || this.filtroStatus() || this.filtroTipoUso() || 
              this.filtroKmMin() !== null || this.filtroKmMax() !== null);
  });

  // Computed reativo: aplica o filtro sobre a lista original no lado do cliente
  veiculosFiltrados = computed(() => {
    const busca = this.filtroBusca().toLowerCase();
    const status = this.filtroStatus();
    const tipo = this.filtroTipoUso();
    const min = this.filtroKmMin();
    const max = this.filtroKmMax();

    return this.veiculos().filter(v => {
      // Filtros exatos (Dropdowns)
      if (status && v.status !== status) return false;
      if (tipo && v.tipoUso !== tipo) return false;

      // Filtro de Quilometragem
      const km = Number(v.quilometragemAtual) || 0;
      if (min !== null && km < min) return false;
      if (max !== null && km > max) return false;

      // Filtro de Texto (Placa, Modelo ou Marca)
      if (busca) {
        const placa = (v.placa || '').toLowerCase();
        const modelo = (v.modelo || '').toLowerCase();
        const marca = (v.marca || '').toLowerCase();
        if (!placa.includes(busca) && !modelo.includes(busca) && !marca.includes(busca)) {
          return false;
        }
      }

      return true;
    });
  });

  constructor(private svc: VeiculoService, private snack: MatSnackBar, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.carregar();
    if (this.route.snapshot.queryParamMap.get('novo')) {
      this.abrirFormulario();
    }
  }

  carregar(): void {
    this.carregando.set(true);
    // Retiramos o filtro do backend. Agora puxamos tudo e o 'computed' cuida da filtragem imediata.
    this.svc.listar().subscribe({
      next: v => { this.veiculos.set(v); this.carregando.set(false); },
      error: () => this.carregando.set(false)
    });
  }

  limparFiltros(): void {
    this.filtroBusca.set('');
    this.filtroStatus.set('');
    this.filtroTipoUso.set('');
    this.filtroKmMin.set(null);
    this.filtroKmMax.set(null);
  }

  abrirFormulario(v?: Veiculo): void {
    this.editando.set(v ?? null);
    this.form = v ? { ...v } : { quilometragemAtual: 0 };
    this.formularioAberto.set(true);
    document.querySelector('.content')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  fecharFormulario(): void { 
    this.formularioAberto.set(false); 
    this.editando.set(null); 
  }

  salvar(): void {
    this.salvando.set(true);
    const op = this.editando()?.id
      ? this.svc.atualizar(this.editando()!.id!, this.form)
      : this.svc.criar(this.form);
    
    op.subscribe({
      next: () => { 
        this.fecharFormulario(); 
        this.carregar();
        this.snack.open('Veículo salvo com sucesso!', '', { duration: 3000 });
        this.salvando.set(false); 
      },
      error: () => { 
        this.snack.open('Erro ao salvar veículo.', '', { duration: 3000 });
        this.salvando.set(false); 
      }
    });
  }

  manutencao(v: Veiculo): void {
    this.svc.enviarParaManutencao(v.id!).subscribe(() => {
      this.snack.open('Veículo enviado para manutenção.', '', { duration: 3000 });
      this.carregar();
    });
  }
  
  disponivel(v: Veiculo): void {
    this.svc.marcarDisponivel(v.id!).subscribe(() => {
      this.snack.open('Veículo marcado como disponível.', '', { duration: 3000 });
      this.carregar();
    });
  }
  
  excluir(v: Veiculo): void {
    if (!confirm(`Excluir veículo ${v.placa}?`)) return;
    this.svc.deletar(v.id!).subscribe(() => {
      this.snack.open('Veículo excluído.', '', { duration: 3000 });
      this.carregar();
    });
  }

  chipClass(s: StatusVeiculo): string {
    return { DISPONIVEL: 'chip-disponivel', EM_ROTA: 'chip-em-rota', MANUTENCAO: 'chip-manutencao' }[s];
  }

  statusLabel(s: StatusVeiculo): string {
    return { DISPONIVEL: 'Disponível', EM_ROTA: 'Em Rota', MANUTENCAO: 'Manutenção' }[s];
  }

  veiculoUsoLabel(t: string): string {
    return ({ CARGA: 'Carga', PASSAGEIRO: 'Passageiro', MISTO: 'Misto' } as Record<string,string>)[t] ?? t;
  }
}