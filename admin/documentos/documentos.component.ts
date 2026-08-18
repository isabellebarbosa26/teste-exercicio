import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { catchError, of, forkJoin } from 'rxjs';
import { DocumentoVeiculoService } from '../../../core/services/documento-veiculo.service';
import { VeiculoService } from '../../../core/services/veiculo.service';
import { MotoristaService } from '../../../core/services/motorista.service';
import { DocumentoVeiculo, DocumentoVeiculoRequest, TipoDocumentoVeiculo } from '../../../core/models/documento-veiculo.model';
import { Veiculo } from '../../../core/models/veiculo.model';
import { Motorista } from '../../../core/models/motorista.model';

type StatusAlerta = 'OK' | 'AVISO' | 'ATENCAO' | 'CRITICO' | 'VENCIDO';
type TipoAba = 'VEICULOS' | 'MOTORISTAS';

interface ItemDocumento {
  origem: 'VEICULO' | 'MOTORISTA';
  entidadeLabel: string;
  entidadeSub: string;
  tipoLabel: string;
  dataVencimento: string;
  diasParaVencer: number;
  status: StatusAlerta;
}

const LABELS_TIPO_DOC: Record<TipoDocumentoVeiculo, string> = {
  CRLV: 'CRLV', SEGURO: 'Seguro', IPVA: 'IPVA', TACOGRAFO: 'Tacógrafo', ANTT: 'ANTT/RNTRC', OUTRO: 'Outro'
};

@Component({
  selector: 'app-documentos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule, 
    MatProgressSpinnerModule, MatSnackBarModule,
    MatFormFieldModule, MatInputModule, MatSelectModule
  ],
  template: `
    <div class="page-header">
      <div>
        <h1>Documentos</h1>
        <p>Gerencie os vencimentos de documentos de veículos e motoristas</p>
      </div>
      <button mat-raised-button color="primary" (click)="abrirNovo()">
        <mat-icon>add</mat-icon> Novo Documento de Veículo
      </button>
    </div>

    <!-- ABAS DE NAVEGAÇÃO (VEÍCULOS / MOTORISTAS) -->
    <div class="tabs-bar">
      <button class="tab-btn" [class.active]="abaAtiva() === 'VEICULOS'" (click)="abaAtiva.set('VEICULOS')">
        <mat-icon>directions_car</mat-icon> Documentos de Veículos 
        <span class="tab-badge">{{ itensVeiculos().length }}</span>
      </button>
      <button class="tab-btn" [class.active]="abaAtiva() === 'MOTORISTAS'" (click)="abaAtiva.set('MOTORISTAS')">
        <mat-icon>badge</mat-icon> Documentos de Motoristas 
        <span class="tab-badge">{{ itensMotoristas().length }}</span>
      </button>
    </div>

    <!-- CARDS DE ALERTA (FILTRO RÁPIDO) -->
    <div class="alert-summary">
      <button class="alert-card status-vencido" [class.active]="filtro() === 'VENCIDO'" (click)="filtro.set('VENCIDO')">
        <span class="alert-num">{{ contagemAtiva().VENCIDO }}</span>
        <span class="alert-label">Vencidos</span>
      </button>
      <button class="alert-card status-critico" [class.active]="filtro() === 'CRITICO'" (click)="filtro.set('CRITICO')">
        <span class="alert-num">{{ contagemAtiva().CRITICO }}</span>
        <span class="alert-label">Vence em até 7 dias</span>
      </button>
      <button class="alert-card status-atencao" [class.active]="filtro() === 'ATENCAO'" (click)="filtro.set('ATENCAO')">
        <span class="alert-num">{{ contagemAtiva().ATENCAO }}</span>
        <span class="alert-label">Vence em até 15 dias</span>
      </button>
      <button class="alert-card status-aviso" [class.active]="filtro() === 'AVISO'" (click)="filtro.set('AVISO')">
        <span class="alert-num">{{ contagemAtiva().AVISO }}</span>
        <span class="alert-label">Vence em até 30 dias</span>
      </button>
      <button class="alert-card status-ok" [class.active]="filtro() === 'TODOS'" (click)="filtro.set('TODOS')">
        <span class="alert-num">{{ itensAbaAtual().length }}</span>
        <span class="alert-label">Todos desta aba</span>
      </button>
    </div>

    <!-- BARRA DE FILTROS AVANÇADOS -->
    <div class="filter-card">
      <div class="filter-header">
        <mat-icon>filter_list</mat-icon> Filtros Avançados
      </div>
      <div class="filter-bar">
        <mat-form-field appearance="outline" class="filter-field" style="flex: 1 1 250px;">
          <mat-label>Buscar (Placa, Nome, Tipo)</mat-label>
          <input matInput [ngModel]="filtroBusca()" (ngModelChange)="filtroBusca.set($event)" placeholder="Ex: BRA2E19, João, CRLV...">
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field small">
          <mat-label>Vencimento Inicial</mat-label>
          <input matInput type="date" [ngModel]="filtroDataInicio()" (ngModelChange)="filtroDataInicio.set($event)">
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field small">
          <mat-label>Vencimento Final</mat-label>
          <input matInput type="date" [ngModel]="filtroDataFim()" (ngModelChange)="filtroDataFim.set($event)">
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
              <th>{{ abaAtiva() === 'VEICULOS' ? 'Veículo / Modelo' : 'Motorista / Contrato' }}</th>
              <th>Documento</th>
              <th>Vencimento</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            @for (item of itensFiltrados(); track item.entidadeLabel + item.tipoLabel + item.dataVencimento) {
              <tr>
                <td><strong>{{ item.entidadeLabel }}</strong><br><span class="sub">{{ item.entidadeSub }}</span></td>
                <td>{{ item.tipoLabel }}</td>
                <td>{{ item.dataVencimento | date:'dd/MM/yyyy' }}</td>
                <td>
                  <span class="status-chip" [class]="'chip-' + item.status.toLowerCase()">
                    {{ rotuloStatus(item) }}
                  </span>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="4" class="empty">Nenhum documento encontrado para estes filtros</td></tr>
            }
          </tbody>
        </table>
      </div>
    }

    @if (modalAberto()) {
      <div class="modal-backdrop" (click)="fecharModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Novo Documento de Veículo</h3>
            <button mat-icon-button (click)="fecharModal()"><mat-icon>close</mat-icon></button>
          </div>
          <div class="modal-body">
            <label>Veículo</label>
            <select [(ngModel)]="form.veiculoId">
              <option [ngValue]="null" disabled>Selecione...</option>
              @for (v of veiculos(); track v.id) {
                <option [ngValue]="v.id">{{ v.placa }} — {{ v.modelo }}</option>
              }
            </select>

            <label>Tipo de Documento</label>
            <select [(ngModel)]="form.tipoDocumento">
              <option value="CRLV">CRLV</option>
              <option value="SEGURO">Seguro</option>
              <option value="IPVA">IPVA</option>
              <option value="TACOGRAFO">Tacógrafo</option>
              <option value="ANTT">ANTT/RNTRC</option>
              <option value="OUTRO">Outro</option>
            </select>

            <label>Número (opcional)</label>
            <input type="text" [(ngModel)]="form.numero" placeholder="Nº do documento/apólice">

            <label>Data de Emissão (opcional)</label>
            <input type="date" [(ngModel)]="form.dataEmissao">

            <label>Data de Vencimento</label>
            <input type="date" [(ngModel)]="form.dataVencimento">

            <label>Observações (opcional)</label>
            <textarea [(ngModel)]="form.observacoes" rows="2"></textarea>
          </div>
          <div class="modal-footer">
            <button mat-button (click)="fecharModal()">Cancelar</button>
            <button mat-raised-button color="primary" [disabled]="!form.veiculoId || !form.dataVencimento" (click)="salvar()">
              Salvar
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      --tms-orange: #c2410c;    --tms-orange-bg: rgba(194,65,12,.12);
      --tms-amber: #b45309;     --tms-amber-bg: rgba(180,83,9,.12);
      --tms-yellow: #a16207;    --tms-yellow-bg: rgba(161,98,7,.12);
      --tms-info: #15803d;      --tms-info-bg: rgba(21,128,61,.12);
      --tms-neutral: #9ca3af;
    }
    :host-context(.dark-theme) {
      --tms-orange: #FB923C;    --tms-orange-bg: rgba(251,146,60,.15);
      --tms-amber: #FBBF24;     --tms-amber-bg: rgba(251,191,36,.15);
      --tms-yellow: #FBBF24;    --tms-yellow-bg: rgba(251,191,36,.15);
      --tms-info: #4ADE80;      --tms-info-bg: rgba(74,222,128,.15);
      --tms-neutral: #64748B;
    }

    .page-header { margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start;
      h1 { font-size: 24px; font-weight: 700; color: var(--tms-text-strong); margin: 0; } p { color: var(--tms-text-secondary); margin-top: 4px; } }

    /* ESTILOS DAS ABAS */
    .tabs-bar { display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 2px solid var(--tms-border); padding-bottom: 12px; }
    .tab-btn {
      display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 8px;
      background: var(--tms-surface); border: 1px solid var(--tms-border); color: var(--tms-text-secondary);
      font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      
      &.active { background: var(--tms-primary-blue); color: #ffffff; border-color: var(--tms-primary-blue); box-shadow: var(--tms-shadow-sm); }
      &:hover:not(.active) { border-color: var(--tms-primary-blue); color: var(--tms-primary-blue); }
    }
    .tab-badge { background: rgba(0,0,0,0.15); padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700; }
    .tab-btn.active .tab-badge { background: rgba(255,255,255,0.25); color: #ffffff; }

    /* CARDS DE ALERTA RÁPIDO */
    .alert-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .alert-card {
      background: var(--tms-surface); border: 1px solid var(--tms-border); border-radius: 8px; padding: 16px;
      display: flex; flex-direction: column; align-items: flex-start; gap: 4px; cursor: pointer;
      border-left: 4px solid var(--tms-neutral); text-align: left; font-family: inherit;
      transition: background-color .25s ease, border-color .25s ease;
      .alert-num { font-size: 24px; font-weight: 800; color: var(--tms-text-strong); }
      .alert-label { font-size: 12px; color: var(--tms-text-secondary); }
      
      &.active { box-shadow: 0 0 0 2px var(--tms-primary-blue) inset; border-left-color: var(--tms-primary-blue); }
      &.status-vencido { border-left-color: var(--tms-danger); }
      &.status-critico { border-left-color: var(--tms-orange); }
      &.status-atencao { border-left-color: var(--tms-amber); }
      &.status-aviso   { border-left-color: var(--tms-yellow); }
      &.status-ok      { border-left-color: var(--tms-primary-blue); }
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

    /* TABELA E CHIPS */
    .table-container { background: var(--tms-surface); border: 1px solid var(--tms-border); border-radius: 8px; box-shadow: var(--tms-shadow-sm); overflow-x: auto; }
    .sub { color: var(--tms-text-secondary); font-size: 12px; }
    
    .status-chip { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;}
    .chip-vencido  { background: var(--tms-danger-bg); color: var(--tms-danger); }
    .chip-critico  { background: var(--tms-orange-bg); color: var(--tms-orange); }
    .chip-atencao  { background: var(--tms-amber-bg);  color: var(--tms-amber); }
    .chip-aviso    { background: var(--tms-yellow-bg); color: var(--tms-yellow); }
    .chip-ok       { background: var(--tms-info-bg); color: var(--tms-info); }

    .loading { display: grid; place-items: center; height: 200px; }

    /* MODAL */
    .modal-backdrop { position: fixed; inset: 0; background: var(--tms-modal-backdrop); display: grid; place-items: center; z-index: 100; padding: 16px; }
    .modal-card { background: var(--tms-surface); border: 1px solid var(--tms-border); border-radius: 12px; width: 100%; max-width: 440px; max-height: 90vh; overflow-y: auto; box-shadow: var(--tms-shadow-lg); transition: background-color .25s ease, border-color .25s ease; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--tms-border); h3 { font-size: 16px; font-weight: 700; color: var(--tms-text-strong); margin: 0; } }
    .modal-header button mat-icon { color: var(--tms-text-secondary); }
    .modal-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 10px;
      label { font-size: 12px; font-weight: 600; color: var(--tms-text-label); text-transform: uppercase; letter-spacing: .03em; margin-top: 8px;}
      input, select, textarea { 
        background: var(--tms-surface); color: var(--tms-text-strong); border: 1px solid var(--tms-border); 
        border-radius: 6px; padding: 8px 10px; font-size: 14px; font-family: inherit;
        &:focus { outline: none; border-color: var(--tms-primary-blue); } 
      }
      select option { background-color: var(--tms-surface); color: var(--tms-text-strong); }
    }
    .modal-footer { 
      display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--tms-border); 
      button[mat-button] { color: var(--tms-text-strong) !important; }
      button[color="primary"] { background-color: var(--tms-primary-blue) !important; color: #ffffff !important; }
    }

    /* Correções Modo Escuro Material */
    ::ng-deep html.dark-theme {
      .mdc-text-field__input, .mat-mdc-input-element, .mat-mdc-select-value-text { color: #ffffff !important; color-scheme: dark !important; }
      .mdc-text-field__input::placeholder, .mat-mdc-input-element::placeholder { color: #9ca3af !important; -webkit-text-fill-color: #9ca3af !important; }
      .mat-mdc-select-arrow svg { fill: #ffffff !important; color: #ffffff !important; }
      .mat-mdc-select-arrow { color: #ffffff !important; }
      input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.7; }
    }

    @media (max-width: 768px) {
      .page-header { flex-direction: column; gap: 8px; }
      .filter-bar { flex-wrap: wrap; }
      .filter-field { width: 100%; }
      .tabs-bar { overflow-x: auto; width: 100%; }
    }
  `]
})
export class DocumentosComponent implements OnInit {
  carregando = signal(true);
  documentosVeiculo = signal<DocumentoVeiculo[]>([]);
  motoristas = signal<Motorista[]>([]);
  veiculos = signal<Veiculo[]>([]);
  
  // Sinais de Controle e Filtros
  abaAtiva = signal<TipoAba>('VEICULOS');
  filtro = signal<'TODOS' | StatusAlerta>('TODOS');
  filtroBusca = signal<string>('');
  filtroDataInicio = signal<string>('');
  filtroDataFim = signal<string>('');

  modalAberto = signal(false);
  form: DocumentoVeiculoRequest = {
    veiculoId: null as any, tipoDocumento: 'CRLV', numero: '', dataEmissao: '', dataVencimento: '', observacoes: ''
  };

  constructor(
    private documentoSvc: DocumentoVeiculoService,
    private veiculoSvc: VeiculoService,
    private motoristaSvc: MotoristaService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.carregando.set(true);
    forkJoin({
      docs: this.documentoSvc.listar().pipe(catchError(() => of([] as DocumentoVeiculo[]))),
      motoristas: this.motoristaSvc.listar().pipe(catchError(() => of([] as Motorista[]))),
      veiculos: this.veiculoSvc.listar().pipe(catchError(() => of([] as Veiculo[])))
    }).subscribe(({ docs, motoristas, veiculos }) => {
      this.documentosVeiculo.set(docs);
      this.motoristas.set(motoristas);
      this.veiculos.set(veiculos);
      this.carregando.set(false);
    });
  }

  private diasEntre(dataIso: string): number {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const alvo = new Date(dataIso); alvo.setHours(0, 0, 0, 0);
    return Math.round((alvo.getTime() - hoje.getTime()) / 86_400_000);
  }

  private statusPara(dias: number): StatusAlerta {
    if (dias < 0) return 'VENCIDO';
    if (dias <= 7) return 'CRITICO';
    if (dias <= 15) return 'ATENCAO';
    if (dias <= 30) return 'AVISO';
    return 'OK';
  }

  // Lista separada apenas de Veículos
  itensVeiculos = computed<ItemDocumento[]>(() => {
    const lista: ItemDocumento[] = [];
    for (const d of this.documentosVeiculo()) {
      if (!d.dataVencimento) continue;
      const dias = this.diasEntre(d.dataVencimento);
      lista.push({
        origem: 'VEICULO',
        entidadeLabel: d.placaVeiculo || '—',
        entidadeSub: d.modeloVeiculo || 'Veículo',
        tipoLabel: LABELS_TIPO_DOC[d.tipoDocumento],
        dataVencimento: d.dataVencimento,
        diasParaVencer: dias,
        status: this.statusPara(dias)
      });
    }
    return lista.sort((a, b) => a.diasParaVencer - b.diasParaVencer);
  });

  // Lista separada apenas de Motoristas
  itensMotoristas = computed<ItemDocumento[]>(() => {
    const lista: ItemDocumento[] = [];
    for (const m of this.motoristas()) {
      if (m.validadeCnh) {
        const dias = this.diasEntre(m.validadeCnh);
        lista.push({
          origem: 'MOTORISTA', entidadeLabel: m.nome, entidadeSub: 'CNH ' + m.categoriaCnh,
          tipoLabel: 'CNH', dataVencimento: m.validadeCnh, diasParaVencer: dias, status: this.statusPara(dias)
        });
      }
      if (m.tipoContrato === 'TEMPORARIO' && m.dataFimContrato) {
        const dias = this.diasEntre(m.dataFimContrato);
        lista.push({
          origem: 'MOTORISTA', entidadeLabel: m.nome, entidadeSub: 'Contrato temporário',
          tipoLabel: 'Contrato', dataVencimento: m.dataFimContrato, diasParaVencer: dias, status: this.statusPara(dias)
        });
      }
    }
    return lista.sort((a, b) => a.diasParaVencer - b.diasParaVencer);
  });

  // Retorna os itens de acordo com a aba selecionada no momento
  itensAbaAtual = computed(() => {
    return this.abaAtiva() === 'VEICULOS' ? this.itensVeiculos() : this.itensMotoristas();
  });

  // Contagem dinâmica baseada na aba ativa para os cards de alerta rápido
  contagemAtiva = computed(() => {
    const base = { VENCIDO: 0, CRITICO: 0, ATENCAO: 0, AVISO: 0, OK: 0 };
    for (const i of this.itensAbaAtual()) {
      if (base[i.status] !== undefined) {
        base[i.status]++;
      }
    }
    return base;
  });

  temFiltroAtivo = computed(() => {
    return !!(this.filtroBusca() || this.filtroDataInicio() || this.filtroDataFim() || this.filtro() !== 'TODOS');
  });

  limparFiltros(): void {
    this.filtroBusca.set('');
    this.filtroDataInicio.set('');
    this.filtroDataFim.set('');
    this.filtro.set('TODOS');
  }

  // Aplicação dos filtros sobre a aba ativa
  itensFiltrados = computed(() => {
    const statusRapido = this.filtro();
    const busca = this.filtroBusca().toLowerCase();
    const inicio = this.filtroDataInicio();
    const fim = this.filtroDataFim();

    return this.itensAbaAtual().filter(i => {
      if (statusRapido !== 'TODOS' && i.status !== statusRapido) return false;

      if (inicio && (!i.dataVencimento || i.dataVencimento < inicio)) return false;
      if (fim && (!i.dataVencimento || i.dataVencimento > fim + 'T23:59:59')) return false;

      if (busca) {
        const lbl = (i.entidadeLabel || '').toLowerCase();
        const sub = (i.entidadeSub || '').toLowerCase();
        const tlbl = (i.tipoLabel || '').toLowerCase();
        
        if (!lbl.includes(busca) && !sub.includes(busca) && !tlbl.includes(busca)) {
          return false;
        }
      }

      return true;
    });
  });

  rotuloStatus(item: ItemDocumento): string {
    if (item.status === 'VENCIDO') return `Vencido há ${Math.abs(item.diasParaVencer)}d`;
    if (item.diasParaVencer === 0) return `Vence Hoje`;
    return `Vence em ${item.diasParaVencer}d`;
  }

  abrirNovo(): void {
    this.form = { veiculoId: null as any, tipoDocumento: 'CRLV', numero: '', dataEmissao: '', dataVencimento: '', observacoes: '' };
    this.modalAberto.set(true);
  }
  fecharModal(): void { this.modalAberto.set(false); }

  salvar(): void {
    this.documentoSvc.criar(this.form).subscribe({
      next: () => {
        this.snack.open('Documento cadastrado!', '', { duration: 3000 });
        this.fecharModal();
        this.carregar();
      },
      error: () => this.snack.open('Erro ao salvar documento.', '', { duration: 4000 })
    });
  }
}