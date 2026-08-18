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
import { MatTooltipModule } from '@angular/material/tooltip';
import { ManutencaoService } from '../../../core/services/manutencao.service';
import { ConsumoService } from '../../../core/services/consumo.service';
import { VeiculoService } from '../../../core/services/veiculo.service';
import { Manutencao, TipoManutencao } from '../../../core/models/manutencao.model';
import { GastoConsumo } from '../../../core/models/consumo.model';
import { Veiculo } from '../../../core/models/veiculo.model';

@Component({
  selector: 'app-manutencoes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule
  ],
  template: `
    <div class="page-header">
      <div>
        <h1>Manutenções e Combustível</h1>
        <p>Gerencie gastos de manutenção e abastecimento da frota</p>
      </div>
    </div>

    <!-- BARRA DE FILTROS COMPLETOS -->
    <div class="filter-card">
      <div class="filter-header">
        <mat-icon>filter_list</mat-icon> Filtros Avançados
      </div>
      
      <div class="filter-bar">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Data Inicial</mat-label>
          <input matInput type="date" [ngModel]="filtroDataInicio()" (ngModelChange)="filtroDataInicio.set($event)">
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Data Final</mat-label>
          <input matInput type="date" [ngModel]="filtroDataFim()" (ngModelChange)="filtroDataFim.set($event)">
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Veículo</mat-label>
          <mat-select [ngModel]="filtroVeiculo()" (ngModelChange)="filtroVeiculo.set($event)">
            <mat-option [value]="null">Todos os Veículos</mat-option>
            @for (v of veiculos(); track v.id) {
              <mat-option [value]="v.id">{{ v.placa }} — {{ v.modelo }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Filtro Tipo de Acordo com a Aba -->
        @if (aba() === 'manutencoes') {
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Tipo Manutenção</mat-label>
            <mat-select [ngModel]="filtroTipoM()" (ngModelChange)="filtroTipoM.set($event)">
              <mat-option value="">Todos</mat-option>
              <mat-option value="PREVENTIVA">Preventiva</mat-option>
              <mat-option value="CORRETIVA">Corretiva</mat-option>
            </mat-select>
          </mat-form-field>
        } @else {
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Tipo Combustível</mat-label>
            <mat-select [ngModel]="filtroTipoC()" (ngModelChange)="filtroTipoC.set($event)">
              <mat-option value="">Todos</mat-option>
              <mat-option value="Diesel">Diesel</mat-option>
              <mat-option value="Gasolina">Gasolina</mat-option>
              <mat-option value="Etanol">Etanol</mat-option>
              <mat-option value="Elétrico">Elétrico</mat-option>
            </mat-select>
          </mat-form-field>
        }

        <!-- Filtro de Valor Mínimo e Máximo -->
        <mat-form-field appearance="outline" class="filter-field small">
          <mat-label>Valor Mín (R$)</mat-label>
          <input matInput type="number" [ngModel]="filtroValorMin()" (ngModelChange)="filtroValorMin.set($event)">
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field small">
          <mat-label>Valor Máx (R$)</mat-label>
          <input matInput type="number" [ngModel]="filtroValorMax()" (ngModelChange)="filtroValorMax.set($event)">
        </mat-form-field>

        <!-- Filtro por Texto: Oficina ou Posto -->
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>{{ aba() === 'manutencoes' ? 'Buscar Oficina' : 'Buscar Posto' }}</mat-label>
          <input matInput [ngModel]="filtroOficinaPosto()" (ngModelChange)="filtroOficinaPosto.set($event)" placeholder="Digite parte do nome...">
        </mat-form-field>

        @if (temFiltroAtivo()) {
          <button mat-button color="warn" class="clear-btn" (click)="limparFiltros()">
            <mat-icon>clear</mat-icon> Limpar
          </button>
        }
      </div>
    </div>

    <!-- ABAS -->
    <div class="abas">
      <button class="aba-btn" [class.active]="aba() === 'manutencoes'" (click)="aba.set('manutencoes')">
        <mat-icon>build</mat-icon> Manutenções
      </button>
      <button class="aba-btn" [class.active]="aba() === 'combustivel'" (click)="aba.set('combustivel')">
        <mat-icon>local_gas_station</mat-icon> Combustível
      </button>
    </div>

    @if (carregando()) {
      <div class="loading"><mat-spinner diameter="40"/></div>
    } @else {

      <!-- ════════ ABA: MANUTENÇÕES ════════ -->
      @if (aba() === 'manutencoes') {
        
        <div class="action-bar">
          <button mat-raised-button color="primary" (click)="abrirFormManutencao()">
            <mat-icon>add</mat-icon> Nova Manutenção
          </button>
        </div>

        @if (formManutencaoAberto()) {
          <div class="form-card">
            <div class="form-card-header">
              <h3>Nova Manutenção</h3>
              <button mat-icon-button (click)="fecharFormManutencao()"><mat-icon>close</mat-icon></button>
            </div>
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Veículo *</mat-label>
                <mat-select [(ngModel)]="manutencaoForm.veiculoId">
                  <mat-option [value]="null" disabled>Selecione</mat-option>
                  @for (v of veiculos(); track v.id) {
                    <mat-option [value]="v.id">{{ v.placa }} — {{ v.modelo }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Tipo *</mat-label>
                <mat-select [(ngModel)]="manutencaoForm.tipoManutencao">
                  <mat-option value="PREVENTIVA">Preventiva</mat-option>
                  <mat-option value="CORRETIVA">Corretiva</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="span-2">
                <mat-label>Descrição *</mat-label>
                <input matInput [(ngModel)]="manutencaoForm.descricao" placeholder="Ex: Troca de óleo e filtros">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Valor Total (R$) *</mat-label>
                <input matInput type="number" [(ngModel)]="manutencaoForm.valorTotal" placeholder="Ex: 620.00">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Oficina</mat-label>
                <input matInput [(ngModel)]="manutencaoForm.oficina" placeholder="Ex: Concessionária MB">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>KM na Manutenção</mat-label>
                <input matInput type="number" [(ngModel)]="manutencaoForm.kmNaManutencao" placeholder="Auto se vazio">
              </mat-form-field>
            </div>
            <div class="form-actions">
              <button mat-button (click)="fecharFormManutencao()">Cancelar</button>
              <button mat-raised-button color="primary" (click)="salvarManutencao()" [disabled]="salvando()">
                {{ salvando() ? 'Salvando...' : 'Registrar' }}
              </button>
            </div>
          </div>
        }

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Veículo</th>
                <th>Data</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th class="num">Valor</th>
                <th>Oficina</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              @for (m of manutencoesFiltradas(); track m.id) {
                <tr>
                  <td><strong>{{ m.placaVeiculo }}</strong></td>
                  <td>{{ m.dataManutencao | date:'dd/MM/yyyy' }}</td>
                  <td><span class="chip" [class.preventiva]="m.tipoManutencao === 'PREVENTIVA'" [class.corretiva]="m.tipoManutencao === 'CORRETIVA'">{{ m.tipoManutencao === 'PREVENTIVA' ? 'Preventiva' : 'Corretiva' }}</span></td>
                  <td>{{ m.descricao }}</td>
                  <td class="num"><strong>R$ {{ m.valorTotal | number:'1.2-2' }}</strong></td>
                  <td>{{ m.oficina || '—' }}</td>
                  <td>
                    <button mat-icon-button color="warn" (click)="excluirManutencao(m)" matTooltip="Excluir">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="empty">Nenhuma manutenção encontrada para estes filtros</td></tr>
              }
            </tbody>
            @if (manutencoesFiltradas().length > 0) {
              <tfoot>
                <tr>
                  <td colspan="4"><strong>Total ({{ manutencoesFiltradas().length }} registros)</strong></td>
                  <td class="num"><strong>R$ {{ totalManutencoes() | number:'1.2-2' }}</strong></td>
                  <td colspan="2"></td>
                </tr>
              </tfoot>
            }
          </table>
        </div>
      }

      <!-- ════════ ABA: COMBUSTÍVEL ════════ -->
      @if (aba() === 'combustivel') {

        <div class="action-bar">
          <button mat-raised-button color="primary" (click)="abrirFormCombustivel()">
            <mat-icon>add</mat-icon> Novo Abastecimento
          </button>
        </div>

        @if (formCombustivelAberto()) {
          <div class="form-card">
            <div class="form-card-header">
              <h3>Novo Abastecimento</h3>
              <button mat-icon-button (click)="fecharFormCombustivel()"><mat-icon>close</mat-icon></button>
            </div>
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Veículo *</mat-label>
                <mat-select [(ngModel)]="combustivelForm.veiculoId">
                  <mat-option [value]="null" disabled>Selecione</mat-option>
                  @for (v of veiculos(); track v.id) {
                    <mat-option [value]="v.id">{{ v.placa }} — {{ v.modelo }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Combustível *</mat-label>
                <mat-select [(ngModel)]="combustivelForm.tipoCombustivel">
                  <mat-option value="Diesel">Diesel</mat-option>
                  <mat-option value="Gasolina">Gasolina</mat-option>
                  <mat-option value="Etanol">Etanol</mat-option>
                  <mat-option value="Elétrico">Elétrico (kWh)</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Litros / kWh *</mat-label>
                <input matInput type="number" [(ngModel)]="combustivelForm.litrosKwh" placeholder="Ex: 120.5">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Valor Unitário (R$)</mat-label>
                <input matInput type="number" [(ngModel)]="combustivelForm.valorUnitario" placeholder="Ex: 6.49">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Valor Total (R$) *</mat-label>
                <input matInput type="number" [(ngModel)]="combustivelForm.valorTotal" placeholder="Ex: 778.80">
              </mat-form-field>
              <mat-form-field appearance="outline" class="span-2">
                <mat-label>Posto / Local</mat-label>
                <input matInput [(ngModel)]="combustivelForm.postoLocal" placeholder="Ex: Posto BR - BR-174">
              </mat-form-field>
            </div>
            <div class="form-actions">
              <button mat-button (click)="fecharFormCombustivel()">Cancelar</button>
              <button mat-raised-button color="primary" (click)="salvarCombustivel()" [disabled]="salvando()">
                {{ salvando() ? 'Salvando...' : 'Registrar' }}
              </button>
            </div>
          </div>
        }

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Veículo</th>
                <th>Data</th>
                <th>Combustível</th>
                <th class="num">Litros/kWh</th>
                <th class="num">Valor Unit.</th>
                <th class="num">Valor Total</th>
                <th>Posto/Local</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              @for (c of consumosFiltrados(); track c.id) {
                <tr>
                  <td><strong>{{ c.placaVeiculo }}</strong></td>
                  <td>{{ c.dataAbastecimento | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td>{{ c.tipoCombustivel }}</td>
                  <td class="num">{{ c.litrosKwh | number:'1.2-2' }}</td>
                  <td class="num">{{ c.valorUnitario ? ('R$ ' + (c.valorUnitario | number:'1.2-2')) : '—' }}</td>
                  <td class="num"><strong>R$ {{ c.valorTotal | number:'1.2-2' }}</strong></td>
                  <td>{{ c.postoLocal || '—' }}</td>
                  <td>
                    <button mat-icon-button color="warn" (click)="excluirCombustivel(c)" matTooltip="Excluir">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="8" class="empty">Nenhum abastecimento encontrado para estes filtros</td></tr>
              }
            </tbody>
            @if (consumosFiltrados().length > 0) {
              <tfoot>
                <tr>
                  <td colspan="5"><strong>Total ({{ consumosFiltrados().length }} registros)</strong></td>
                  <td class="num"><strong>R$ {{ totalCombustivel() | number:'1.2-2' }}</strong></td>
                  <td colspan="2"></td>
                </tr>
              </tfoot>
            }
          </table>
        </div>
      }
    }
  `,
  styles: [`
    .page-header { margin-bottom: 20px;
      h1 { font-size: 24px; font-weight: 700; color: var(--tms-text-strong); } 
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

    /* ABAS */
    .abas { display: flex; gap: 8px; border-bottom: 2px solid var(--tms-border); margin-bottom: 20px; }
    .aba-btn { 
      display: flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer;
      padding: 12px 20px; font-size: 14px; font-weight: 600; color: var(--tms-text-secondary);
      border-bottom: 3px solid transparent; margin-bottom: -2px;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
      &.active { color: var(--tms-primary-blue); border-bottom-color: var(--tms-primary-blue); }
      &:hover:not(.active) { color: var(--tms-primary-blue); } 
    }

    /* BARRA DE AÇÃO */
    .action-bar { margin-bottom: 16px; button[color="primary"] { background-color: var(--tms-primary-blue) !important; color: #ffffff !important; } }
    .loading { display: grid; place-items: center; height: 200px; }

    /* CARTÃO DO FORMULÁRIO */
    .form-card { 
      background: var(--tms-surface); border-radius: 12px; padding: 24px; 
      box-shadow: var(--tms-shadow-md); border: 1px solid var(--tms-border); 
      margin-bottom: 20px; border-left: 4px solid var(--tms-warning); 
    }
    .form-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; h3 { font-size: 16px; font-weight: 700; color: var(--tms-text-strong); margin: 0; } }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr)); gap: 12px; .span-2 { grid-column: 1/-1; } }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; button[color="primary"] { background-color: var(--tms-primary-blue) !important; color: #ffffff !important; } }

    /* TABELA */
    .table-container { background: var(--tms-surface); border-radius: 12px; box-shadow: var(--tms-shadow-sm); border: 1px solid var(--tms-border); overflow-x: auto; }
    table { 
      width: 100%; border-collapse: collapse; background: var(--tms-surface);
      th { background: var(--tms-surface-alt); padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 700; color: var(--tms-text-header-cell); text-transform: uppercase; }
      th.num, td.num { text-align: right; font-variant-numeric: tabular-nums; }
      td { padding: 12px 16px; border-top: 1px solid var(--tms-border); font-size: 14px; color: var(--tms-text-body); }
      tfoot td { border-top: 2px solid var(--tms-border); background: var(--tms-surface-alt); font-size: 14px; color: var(--tms-text-strong); }
      button[color="warn"] { color: var(--tms-danger) !important; }
    }
    
    .chip { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 10px; text-transform: uppercase; }
    .preventiva { background: var(--tms-info-bg); color: var(--tms-info); }
    .corretiva { background: var(--tms-danger-bg); color: var(--tms-danger); }
    .empty { text-align: center; color: var(--tms-text-muted) !important; padding: 32px !important; }
  
    /* Correções Modo Escuro Material */
    ::ng-deep html.dark-theme {
      .mdc-text-field__input, .mat-mdc-input-element, .mat-mdc-select-value-text { color: #ffffff !important; color-scheme: dark !important; }
      .mdc-text-field__input::placeholder, .mat-mdc-input-element::placeholder { color: #9ca3af !important; -webkit-text-fill-color: #9ca3af !important; }
      .mat-mdc-select-arrow svg { fill: #ffffff !important; color: #ffffff !important; }
      .mat-mdc-select-arrow { color: #ffffff !important; }
      input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { background: transparent !important; }
      input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.7; }
    }

    @media (max-width: 768px) {
      .page-header { flex-direction: column; gap: 8px; }
      .form-grid { grid-template-columns: 1fr !important; }
      table { font-size: 12px; }
      th, td { padding: 8px 10px; }
      .form-card { padding: 16px; }
      .abas, .filter-bar { flex-wrap: wrap; }
      .filter-field { width: 100%; }
    }
  `]
})
export class ManutencoesComponent implements OnInit {
  carregando = signal(true);
  salvando = signal(false);
  aba = signal<'manutencoes' | 'combustivel'>('manutencoes');

  manutencoes = signal<Manutencao[]>([]);
  consumos = signal<GastoConsumo[]>([]);
  veiculos = signal<Veiculo[]>([]);

  filtroDataInicio = signal<string>('');
  filtroDataFim = signal<string>('');
  filtroVeiculo = signal<number | null>(null);
  filtroTipoM = signal<string>('');
  filtroTipoC = signal<string>('');
  filtroValorMin = signal<number | null>(null);
  filtroValorMax = signal<number | null>(null);
  filtroOficinaPosto = signal<string>(''); 

  formManutencaoAberto = signal(false);
  formCombustivelAberto = signal(false);
  manutencaoForm = { veiculoId: null as number | null, tipoManutencao: 'PREVENTIVA' as TipoManutencao, descricao: '', valorTotal: null as number | null, oficina: '', kmNaManutencao: null as number | null };
  combustivelForm = { veiculoId: null as number | null, tipoCombustivel: 'Diesel', litrosKwh: null as number | null, valorUnitario: null as number | null, valorTotal: null as number | null, postoLocal: '' };

  temFiltroAtivo = computed(() => {
    return !!(this.filtroDataInicio() || this.filtroDataFim() || this.filtroVeiculo() || 
              this.filtroTipoM() || this.filtroTipoC() || 
              this.filtroValorMin() || this.filtroValorMax() || this.filtroOficinaPosto());
  });

  manutencoesFiltradas = computed(() => {
    const inicio = this.filtroDataInicio();
    const fim = this.filtroDataFim();
    const veiculo = this.filtroVeiculo();
    const tipo = this.filtroTipoM();
    const min = this.filtroValorMin();
    const max = this.filtroValorMax();
    const oficina = this.filtroOficinaPosto().toLowerCase();

    return this.manutencoes().filter(m => {
      if (veiculo && m.veiculoId !== veiculo) return false;
      if (tipo && m.tipoManutencao !== tipo) return false;
      if (inicio && (!m.dataManutencao || m.dataManutencao < inicio)) return false;
      if (fim && (!m.dataManutencao || m.dataManutencao > fim + 'T23:59:59')) return false;
      const valor = Number(m.valorTotal) || 0;
      if (min !== null && valor < min) return false;
      if (max !== null && valor > max) return false;
      if (oficina && (!m.oficina || !m.oficina.toLowerCase().includes(oficina))) return false;
      return true;
    });
  });

  consumosFiltrados = computed(() => {
    const inicio = this.filtroDataInicio();
    const fim = this.filtroDataFim();
    const veiculo = this.filtroVeiculo();
    const tipo = this.filtroTipoC();
    const min = this.filtroValorMin();
    const max = this.filtroValorMax();
    const posto = this.filtroOficinaPosto().toLowerCase();

    return this.consumos().filter(c => {
      if (veiculo && c.veiculoId !== veiculo) return false;
      if (tipo && c.tipoCombustivel !== tipo) return false;
      if (inicio && (!c.dataAbastecimento || c.dataAbastecimento < inicio)) return false;
      if (fim && (!c.dataAbastecimento || c.dataAbastecimento > fim + 'T23:59:59')) return false;
      const valor = Number(c.valorTotal) || 0;
      if (min !== null && valor < min) return false;
      if (max !== null && valor > max) return false;
      if (posto && (!c.postoLocal || !c.postoLocal.toLowerCase().includes(posto))) return false;
      return true;
    });
  });

  totalManutencoes = computed(() => this.manutencoesFiltradas().reduce((s, m) => s + (Number(m.valorTotal) || 0), 0));
  totalCombustivel = computed(() => this.consumosFiltrados().reduce((s, c) => s + (Number(c.valorTotal) || 0), 0));

  constructor(
    private manutencaoSvc: ManutencaoService,
    private consumoSvc: ConsumoService,
    private veiculoSvc: VeiculoService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.carregar();
    this.veiculoSvc.listar().subscribe(v => this.veiculos.set(v));
  }

  carregar(): void {
    this.carregando.set(true);
    this.manutencaoSvc.listar().subscribe({
      next: lista => { this.manutencoes.set(lista); this.carregando.set(false); },
      error: () => { this.manutencoes.set([]); this.carregando.set(false); }
    });
    this.consumoSvc.listar().subscribe({
      next: lista => this.consumos.set(lista),
      error: () => this.consumos.set([])
    });
  }

  limparFiltros(): void {
    this.filtroDataInicio.set('');
    this.filtroDataFim.set('');
    this.filtroVeiculo.set(null);
    this.filtroTipoM.set('');
    this.filtroTipoC.set('');
    this.filtroValorMin.set(null);
    this.filtroValorMax.set(null);
    this.filtroOficinaPosto.set('');
  }

  abrirFormManutencao(): void { this.formManutencaoAberto.set(true); this.manutencaoForm = { veiculoId: null, tipoManutencao: 'PREVENTIVA', descricao: '', valorTotal: null, oficina: '', kmNaManutencao: null }; }
  fecharFormManutencao(): void { this.formManutencaoAberto.set(false); }

  salvarManutencao(): void {
    if (!this.manutencaoForm.veiculoId || !this.manutencaoForm.descricao || !this.manutencaoForm.valorTotal) {
      this.snack.open('Preencha veículo, descrição e valor.', '', { duration: 3000 }); return;
    }
    this.salvando.set(true);
    this.manutencaoSvc.registrar(this.manutencaoForm.veiculoId, {
      tipoManutencao: this.manutencaoForm.tipoManutencao, descricao: this.manutencaoForm.descricao, valorTotal: this.manutencaoForm.valorTotal,
      oficina: this.manutencaoForm.oficina || undefined, kmNaManutencao: this.manutencaoForm.kmNaManutencao ?? undefined
    }).subscribe({
      next: () => { this.salvando.set(false); this.snack.open('Manutenção registrada!', '', { duration: 3000 }); this.fecharFormManutencao(); this.carregar(); },
      error: (e) => { this.salvando.set(false); this.snack.open(e?.error?.mensagem ?? 'Erro ao registrar.', '', { duration: 4000 }); }
    });
  }

  excluirManutencao(m: Manutencao): void {
    if (!m.id || !confirm(`Excluir manutenção de ${m.placaVeiculo}?`)) return;
    this.manutencaoSvc.deletar(m.id).subscribe({
      next: () => { this.snack.open('Manutenção excluída.', '', { duration: 3000 }); this.carregar(); },
      error: () => this.snack.open('Erro ao excluir.', '', { duration: 4000 })
    });
  }

  abrirFormCombustivel(): void { this.formCombustivelAberto.set(true); this.combustivelForm = { veiculoId: null, tipoCombustivel: 'Diesel', litrosKwh: null, valorUnitario: null, valorTotal: null, postoLocal: '' }; }
  fecharFormCombustivel(): void { this.formCombustivelAberto.set(false); }

  salvarCombustivel(): void {
    if (!this.combustivelForm.veiculoId || !this.combustivelForm.litrosKwh || !this.combustivelForm.valorTotal) {
      this.snack.open('Preencha veículo, litros e valor total.', '', { duration: 3000 }); return;
    }
    this.salvando.set(true);
    this.consumoSvc.registrar(this.combustivelForm.veiculoId, {
      tipoCombustivel: this.combustivelForm.tipoCombustivel, litrosKwh: this.combustivelForm.litrosKwh,
      valorUnitario: this.combustivelForm.valorUnitario ?? undefined, valorTotal: this.combustivelForm.valorTotal, postoLocal: this.combustivelForm.postoLocal || undefined
    }).subscribe({
      next: () => { this.salvando.set(false); this.snack.open('Abastecimento registrado!', '', { duration: 3000 }); this.fecharFormCombustivel(); this.carregar(); },
      error: (e) => { this.salvando.set(false); this.snack.open(e?.error?.mensagem ?? 'Erro ao registrar.', '', { duration: 4000 }); }
    });
  }

  excluirCombustivel(c: GastoConsumo): void {
    if (!c.id || !confirm(`Excluir abastecimento de ${c.placaVeiculo}?`)) return;
    this.consumoSvc.deletar(c.id).subscribe({
      next: () => { this.snack.open('Abastecimento excluído.', '', { duration: 3000 }); this.carregar(); },
      error: () => this.snack.open('Erro ao excluir.', '', { duration: 4000 })
    });
  }
}