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
import { MotoristaService } from '../../../core/services/motorista.service';
import { VeiculoService } from '../../../core/services/veiculo.service';
import { ManutencaoService } from '../../../core/services/manutencao.service';
import { Motorista, StatusMotorista, TipoContrato } from '../../../core/models/motorista.model';
import { Veiculo } from '../../../core/models/veiculo.model';
import { Manutencao, TipoManutencao } from '../../../core/models/manutencao.model';

@Component({
  selector: 'app-motoristas',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatSelectModule, MatInputModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="page-header">
      <div>
        <h1>Motoristas</h1>
        <p>Cadastro e gestão de contratos</p>
      </div>
      <button mat-raised-button color="primary" (click)="abrirFormulario()">
        <mat-icon>person_add</mat-icon> Novo Motorista
      </button>
    </div>

    <!-- BARRA DE FILTROS AVANÇADOS -->
    <div class="filter-card">
      <div class="filter-header">
        <mat-icon>filter_list</mat-icon> Filtros Avançados
      </div>
      
      <div class="filter-bar">
        <mat-form-field appearance="outline" class="filter-field" style="flex: 1 1 200px;">
          <mat-label>Buscar (Nome, CNH, Placa, E-mail)</mat-label>
          <input matInput [ngModel]="filtroBusca()" (ngModelChange)="filtroBusca.set($event)" placeholder="Ex: João, 123456, BRA2E19...">
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field small">
          <mat-label>Status</mat-label>
          <mat-select [ngModel]="filtroStatus()" (ngModelChange)="filtroStatus.set($event)">
            <mat-option value="">Todos</mat-option>
            <mat-option value="DISPONIVEL">Disponível</mat-option>
            <mat-option value="EM_ROTA">Em Rota</mat-option>
            <mat-option value="INATIVO">Inativo</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field small">
          <mat-label>Situação da CNH</mat-label>
          <mat-select [ngModel]="filtroCnh()" (ngModelChange)="filtroCnh.set($event)">
            <mat-option value="">Todas</mat-option>
            <mat-option value="VALIDA">Válida</mat-option>
            <mat-option value="VENCIDA">Vencida</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field small">
          <mat-label>Situação do Contrato</mat-label>
          <mat-select [ngModel]="filtroContrato()" (ngModelChange)="filtroContrato.set($event)">
            <mat-option value="">Todos</mat-option>
            <mat-option value="VIGENTE">Vigente</mat-option>
            <mat-option value="VENCIDO">Vencido</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field small" style="max-width: 140px;">
          <mat-label>Categoria CNH</mat-label>
          <mat-select [ngModel]="filtroCategoriaCnh()" (ngModelChange)="filtroCategoriaCnh.set($event)">
            <mat-option value="">Todas</mat-option>
            @for (c of categorias; track c) {
              <mat-option [value]="c">{{ c }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (temFiltroAtivo()) {
          <button mat-button color="warn" class="clear-btn" (click)="limparFiltros()">
            <mat-icon>clear</mat-icon> Limpar
          </button>
        }
      </div>
    </div>

    <!-- FORMULÁRIO -->
    @if (formularioAberto()) {
      <div class="form-card">
        <div class="form-card-header">
          <h3>{{ editando()?.id ? 'Editar' : 'Novo' }} Motorista</h3>
          <button mat-icon-button (click)="fecharFormulario()"><mat-icon>close</mat-icon></button>
        </div>
        <div class="form-grid">
          <mat-form-field appearance="outline" class="span-2">
            <mat-label>Nome Completo *</mat-label>
            <input matInput [(ngModel)]="form.nome">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Título de Eleitor *</mat-label>
            <input matInput [ngModel]="form.tituloEleitor" (ngModelChange)="onTituloEleitorChange($event)"
                   placeholder="0000 0000 0000 00" maxlength="14" [disabled]="!!editando()?.id">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>CNH *</mat-label>
            <input matInput [(ngModel)]="form.cnh" [disabled]="!!editando()?.id">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Categoria CNH *</mat-label>
            <mat-select [(ngModel)]="form.categoriaCnh">
              @for (c of categorias; track c) {
                <mat-option [value]="c">{{ c }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Validade da CNH *</mat-label>
            <input matInput [(ngModel)]="form.validadeCnh" type="date">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Telefone</mat-label>
            <input matInput [ngModel]="form.telefone" (ngModelChange)="onTelefoneChange($event)"
                   placeholder="(95) 99000-0000" maxlength="15">
          </mat-form-field>
          <mat-form-field appearance="outline" class="span-2">
            <mat-label>E-mail</mat-label>
            <input matInput [(ngModel)]="form.email" type="email">
          </mat-form-field>
          <mat-form-field appearance="outline" class="span-2">
            <mat-label>Senha de acesso</mat-label>
            <input matInput [(ngModel)]="senhaAcesso" type="password" placeholder="Deixe em branco para manter a senha atual">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Tipo de Contrato *</mat-label>
            <mat-select [(ngModel)]="form.tipoContrato">
              <mat-option value="EFETIVO">Efetivo</mat-option>
              <mat-option value="TEMPORARIO">Temporário</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Início do Contrato *</mat-label>
            <input matInput [(ngModel)]="form.dataInicioContrato" type="date">
          </mat-form-field>
          @if (form.tipoContrato === 'TEMPORARIO') {
            <mat-form-field appearance="outline">
              <mat-label>Fim do Contrato</mat-label>
              <input matInput [(ngModel)]="form.dataFimContrato" type="date">
              <mat-hint>Deixe vazio para indeterminado</mat-hint>
            </mat-form-field>
          }
        </div>
        <div class="form-actions">
          <button mat-button (click)="fecharFormulario()">Cancelar</button>
          <button mat-raised-button color="primary" (click)="salvar()" [disabled]="salvando()">
            {{ salvando() ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </div>
    }

    <!-- PAINEL: ATRELAR VEÍCULO -->
    @if (motoristaVeiculo()) {
      <div class="form-card">
        <div class="form-card-header">
          <h3>Veículo — {{ motoristaVeiculo()!.nome }}</h3>
          <button mat-icon-button (click)="fecharVincularVeiculo()"><mat-icon>close</mat-icon></button>
        </div>
        <mat-form-field appearance="outline" style="width:320px">
          <mat-label>Veículo</mat-label>
          <mat-select [(ngModel)]="veiculoIdSelecionado">
            <mat-option [value]="null">— Nenhum veículo —</mat-option>
            @for (v of veiculosParaAtrelar(); track v.id) {
              <mat-option [value]="v.id">{{ v.placa }} — {{ v.modelo }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <div class="form-actions">
          <button mat-button (click)="fecharVincularVeiculo()">Cancelar</button>
          <button mat-raised-button color="primary" (click)="salvarVeiculo()" [disabled]="salvando()">
            Salvar
          </button>
        </div>
      </div>
    }

    <!-- PAINEL: REGISTRAR MANUTENÇÃO DO VEÍCULO -->
    @if (motoristaManutencao()) {
      <div class="form-card">
        <div class="form-card-header">
          <h3>Manutenção — {{ motoristaManutencao()!.placaVeiculo }} ({{ motoristaManutencao()!.nome }})</h3>
          <button mat-icon-button (click)="fecharManutencao()"><mat-icon>close</mat-icon></button>
        </div>
        <div class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Tipo *</mat-label>
            <mat-select [(ngModel)]="manutencaoForm.tipoManutencao">
              @for (t of tiposManutencao; track t) {
                <mat-option [value]="t">{{ t === 'PREVENTIVA' ? 'Preventiva' : 'Corretiva' }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Data</mat-label>
            <input matInput type="date" [(ngModel)]="manutencaoForm.dataManutencao">
            <mat-hint>Vazio = hoje</mat-hint>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Valor Total (R$) *</mat-label>
            <input matInput type="number" min="0" step="0.01" [(ngModel)]="manutencaoForm.valorTotal">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Oficina</mat-label>
            <input matInput [(ngModel)]="manutencaoForm.oficina">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>KM na manutenção</mat-label>
            <input matInput type="number" min="0" [(ngModel)]="manutencaoForm.kmNaManutencao">
          </mat-form-field>
          <mat-form-field appearance="outline" class="span-2">
            <mat-label>Descrição do serviço *</mat-label>
            <textarea matInput rows="2" [(ngModel)]="manutencaoForm.descricao"></textarea>
          </mat-form-field>
        </div>
        <div class="form-actions">
          <button mat-button (click)="fecharManutencao()">Cancelar</button>
          <button mat-raised-button color="primary" (click)="salvarManutencao()" [disabled]="salvando()">
            {{ salvando() ? 'Salvando...' : 'Registrar Manutenção' }}
          </button>
        </div>
      </div>
    }

    <!-- LISTA (CARDS) -->
    @if (carregando()) {
      <div class="loading"><mat-spinner diameter="40"/></div>
    } @else {
      <div class="cards-grid">
        @for (m of motoristasFiltrados(); track m.id) {
          <div class="motorista-card"
               [class.inativo]="m.status === 'INATIVO'"
               [class.cnh-vencida]="m.cnhVencida">
            <div class="card-top">
              <div class="avatar">{{ m.nome[0] }}</div>
              <div class="card-info">
                <h4>{{ m.nome }}</h4>
                <span class="sub">CNH {{ m.categoriaCnh }} · {{ m.cnh }}</span>
              </div>
              <span class="status-chip" [ngClass]="chipStatus(m.status)">
                {{ statusLabel(m.status) }}
              </span>
            </div>

            @if (m.cnhVencida) {
              <div class="cnh-alert">
                <mat-icon>warning</mat-icon>
                <span>CNH vencida em {{ m.validadeCnh | date:'dd/MM/yyyy' }}. Renove antes de atribuir novas viagens.</span>
              </div>
            }

            <div class="card-details">
              <div class="detail">
                <mat-icon>badge</mat-icon> {{ m.tituloEleitor }}
              </div>
              @if (m.telefone) {
                <div class="detail"><mat-icon>phone</mat-icon> {{ m.telefone }}</div>
              }
              @if (m.email) {
                <div class="detail"><mat-icon>email</mat-icon> {{ m.email }}</div>
              }
              <div class="detail">
                <mat-icon>badge</mat-icon>
                CNH válida até {{ m.validadeCnh | date:'dd/MM/yyyy' }}
                <span class="status-chip ml-8" [ngClass]="m.cnhVencida ? 'chip-vencido' : 'chip-vigente'">
                  {{ m.cnhVencida ? 'Vencida' : 'Válida' }}
                </span>
              </div>
              <div class="detail">
                <mat-icon>calendar_today</mat-icon>
                {{ m.dataInicioContrato | date:'dd/MM/yyyy' }} →
                {{ m.dataFimContrato ? (m.dataFimContrato | date:'dd/MM/yyyy') : 'Indeterminado' }}
                <span class="status-chip ml-8" [ngClass]="m.contratoVigente ? 'chip-vigente' : 'chip-vencido'">
                  {{ m.contratoVigente ? 'Vigente' : 'Vencido' }}
                </span>
              </div>
              <div class="detail">
                <mat-icon>directions_car</mat-icon>
                @if (m.placaVeiculo) {
                  <span>{{ m.placaVeiculo }} — {{ m.modeloVeiculo }}</span>
                } @else {
                  <span class="sem-veiculo">Nenhum veículo atrelado</span>
                }
              </div>
            </div>

            <div class="card-actions">
              @if (m.status !== 'INATIVO') {
                <button mat-stroked-button (click)="abrirFormulario(m)">
                  <mat-icon>edit</mat-icon> Editar
                </button>
                <button mat-stroked-button (click)="abrirVincularVeiculo(m)">
                  <mat-icon>directions_car</mat-icon> Veículo
                </button>
                @if (m.veiculoId) {
                  <button mat-stroked-button (click)="abrirManutencao(m)">
                    <mat-icon>build</mat-icon> Manutenção
                  </button>
                }
              }
              @if (m.status === 'DISPONIVEL') {
                <button mat-stroked-button color="warn" (click)="inativar(m)">
                  <mat-icon>block</mat-icon> Inativar
                </button>
              }
              @if (m.status === 'INATIVO') {
                <button mat-stroked-button color="primary" (click)="ativar(m)">
                  <mat-icon>check_circle</mat-icon> Ativar
                </button>
              }
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <mat-icon>person_off</mat-icon>
            <p>Nenhum motorista encontrado para estes filtros</p>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .page-header { 
      display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;
      h1 { font-size: 24px; font-weight: 700; color: var(--tms-text-strong); margin: 0;} 
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
    
    /* CARTÃO DO FORMULÁRIO */
    .form-card { 
      background: var(--tms-surface); border-radius: 12px; padding: 24px;
      box-shadow: var(--tms-shadow-md); border: 1px solid var(--tms-border); margin-bottom: 20px;
      border-left: 4px solid var(--tms-primary-blue); 
    }
    .form-card-header { 
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; 
      h3 { font-size: 16px; font-weight: 600; color: var(--tms-text-strong); margin: 0; } 
      button mat-icon { color: var(--tms-text-muted); }
    }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr)); gap: 12px; .span-2 { grid-column: 1/-1; } }
    
    .form-actions { 
      display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; 
      button[mat-button] { color: var(--tms-text-strong) !important; }
      button[color="primary"] { background-color: var(--tms-primary-blue) !important; color: #ffffff !important; }
    }
    
    .loading { display: grid; place-items: center; height: 200px; }
    
    /* CARDS DE MOTORISTAS */
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px,1fr)); gap: 16px; }
    .motorista-card {
      background: var(--tms-surface); border-radius: 12px; padding: 20px;
      box-shadow: var(--tms-shadow-sm); border: 1px solid var(--tms-border);
      &.inativo { opacity: .6; }
      &.cnh-vencida { border-color: var(--tms-border); border-left: 4px solid var(--tms-danger); }
      
      .cnh-alert { 
        display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
        padding: 8px 12px; border-radius: 8px; background: var(--tms-danger-bg); color: var(--tms-danger);
        font-size: 12px; border: 1px solid var(--tms-danger);
        mat-icon { color: var(--tms-danger); font-size: 18px; width: 18px; height: 18px; } 
      }
      
      .card-top { 
        display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
        .avatar { 
          width: 44px; height: 44px; border-radius: 50%; background: var(--tms-primary-blue);
          color: white; font-size: 20px; font-weight: 700; display: grid; place-items: center; flex-shrink: 0; 
        }
        .card-info { 
          flex: 1; 
          h4 { font-weight: 700; font-size: 15px; color: var(--tms-text-strong); margin: 0 0 4px; }
          .sub { font-size: 12px; color: var(--tms-text-secondary); } 
        }
      }
      
      .card-details { 
        display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;
        .detail { 
          display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--tms-text-body);
          mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--tms-text-muted); } 
        }
        .ml-8 { margin-left: 8px; }
        .sem-veiculo { color: var(--tms-text-muted); font-style: italic; }
      }
      
      .card-actions { 
        display: flex; gap: 8px; flex-wrap: wrap; 
        button[mat-stroked-button] { color: var(--tms-text-strong); border-color: var(--tms-border); }
        button[color="primary"] { color: var(--tms-primary-blue) !important; border-color: var(--tms-primary-blue) !important; }
        button[color="warn"] { color: var(--tms-danger) !important; border-color: var(--tms-danger) !important; }
      }
    }
    
    .empty-state { 
      grid-column: 1/-1; text-align: center; padding: 48px; color: var(--tms-text-muted);
      mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 8px; } 
    }

    /* Override dos chips globais para usar variáveis adaptáveis do tema */
    :host .status-chip { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px;}
    :host .chip-disponivel   { background: var(--tms-success-bg);   color: var(--tms-success); }
    :host .chip-em-rota      { background: var(--tms-info-bg);      color: var(--tms-info); }
    :host .chip-inativo      { background: var(--tms-surface-subtle); color: var(--tms-text-secondary); border: 1px solid var(--tms-border); }
    :host .chip-vigente      { background: var(--tms-success-bg);   color: var(--tms-success); }
    :host .chip-vencido      { background: var(--tms-danger-bg);    color: var(--tms-danger); }

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
      input[type="number"]::-webkit-inner-spin-button,
      input[type="number"]::-webkit-outer-spin-button { background: transparent !important; }
      input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.7; }
    }

    /* Responsividade */
    @media (max-width: 768px) {
      .page-header { flex-direction: column; gap: 8px; }
      .form-grid { grid-template-columns: 1fr !important; }
      .cards-grid { grid-template-columns: 1fr !important; }
      .form-card { padding: 16px; }
      .filter-bar { flex-wrap: wrap; }
      .filter-field { width: 100%; }
      .card-details { grid-template-columns: 1fr !important; }
    }
  `]
})
export class MotoristasComponent implements OnInit {
  motoristas      = signal<Motorista[]>([]);
  carregando      = signal(true);
  salvando        = signal(false);
  formularioAberto = signal(false);
  editando        = signal<Motorista | null>(null);

  // Sinais de Filtro
  filtroBusca = signal<string>('');
  filtroStatus = signal<string>('');
  filtroCnh = signal<string>('');
  filtroContrato = signal<string>('');
  filtroCategoriaCnh = signal<string>('');

  motoristaVeiculo    = signal<Motorista | null>(null);
  veiculosParaAtrelar = signal<Veiculo[]>([]);
  veiculoIdSelecionado: number | null = null;

  motoristaManutencao = signal<Motorista | null>(null);
  manutencaoForm: Partial<Manutencao> = {};

  categorias = ['A','B','C','D','E','AB','AC','AD','AE'];
  tiposManutencao: TipoManutencao[] = ['PREVENTIVA', 'CORRETIVA'];
  
  form: Partial<Motorista & { dataInicioContrato: string; dataFimContrato?: string; tipoContrato: TipoContrato }> = {};
  senhaAcesso = '';

  // COMPUTEDS DE FILTRAGEM
  temFiltroAtivo = computed(() => {
    return !!(this.filtroBusca() || this.filtroStatus() || this.filtroCnh() || 
              this.filtroContrato() || this.filtroCategoriaCnh());
  });

  motoristasFiltrados = computed(() => {
    const busca = this.filtroBusca().toLowerCase();
    const status = this.filtroStatus();
    const cnh = this.filtroCnh();
    const contrato = this.filtroContrato();
    const categoria = this.filtroCategoriaCnh();

    return this.motoristas().filter(m => {
      // Filtros Exatos (Dropdowns)
      if (status && m.status !== status) return false;
      if (categoria && m.categoriaCnh !== categoria) return false;

      // Status da CNH
      if (cnh === 'VALIDA' && m.cnhVencida) return false;
      if (cnh === 'VENCIDA' && !m.cnhVencida) return false;

      // Status do Contrato
      if (contrato === 'VIGENTE' && !m.contratoVigente) return false;
      if (contrato === 'VENCIDO' && m.contratoVigente) return false;

      // Busca Livre
      if (busca) {
        const nome = (m.nome || '').toLowerCase();
        const docCnh = (m.cnh || '').toLowerCase();
        const placa = (m.placaVeiculo || '').toLowerCase();
        const email = (m.email || '').toLowerCase();

        if (!nome.includes(busca) && !docCnh.includes(busca) && 
            !placa.includes(busca) && !email.includes(busca)) {
          return false;
        }
      }

      return true;
    });
  });

  constructor(
    private svc: MotoristaService,
    private veiculoSvc: VeiculoService,
    private manutencaoSvc: ManutencaoService,
    private snack: MatSnackBar,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.carregar();
    if (this.route.snapshot.queryParamMap.get('novo')) {
      this.abrirFormulario();
    }
  }

  carregar(): void {
    this.carregando.set(true);
    // Removemos os parâmetros do endpoint, carregamos TODOS e deixamos o `computed` fazer a filtragem
    this.svc.listar().subscribe({
      next: m => { this.motoristas.set(m); this.carregando.set(false); },
      error: () => { this.motoristas.set([]); this.carregando.set(false); }
    });
  }

  limparFiltros(): void {
    this.filtroBusca.set('');
    this.filtroStatus.set('');
    this.filtroCnh.set('');
    this.filtroContrato.set('');
    this.filtroCategoriaCnh.set('');
  }

  abrirFormulario(m?: Motorista): void {
    this.editando.set(m ?? null);
    this.form = m ? { ...m } : { tipoContrato: 'TEMPORARIO' };
    this.senhaAcesso = '';
    this.formularioAberto.set(true);
    document.querySelector('.content')?.scrollTo({ top: -1, behavior: 'smooth' });
  }
  fecharFormulario(): void { this.formularioAberto.set(false); this.editando.set(null); this.senhaAcesso = ''; }

  abrirVincularVeiculo(m: Motorista): void {
    this.motoristaVeiculo.set(m);
    this.veiculoIdSelecionado = m.veiculoId ?? null;
    this.veiculoSvc.listar().subscribe(v => this.veiculosParaAtrelar.set(v));
    document.querySelector('.content')?.scrollTo({ top: -1, behavior: 'smooth' });
  }
  fecharVincularVeiculo(): void {
    this.motoristaVeiculo.set(null);
    this.veiculoIdSelecionado = null;
  }
  salvarVeiculo(): void {
    const m = this.motoristaVeiculo();
    if (!m?.id) return;
    this.salvando.set(true);
    const op = this.veiculoIdSelecionado
      ? this.svc.atrelarVeiculo(m.id, this.veiculoIdSelecionado)
      : this.svc.desatrelarVeiculo(m.id);
    op.subscribe({
      next: () => { this.fecharVincularVeiculo(); this.carregar();
                    this.snack.open('Veículo atualizado!', '', { duration: 3000 });
                    this.salvando.set(false); },
      error: (e) => { this.snack.open(this.mensagemErro(e, 'Erro ao atualizar veículo.'), '', { duration: 5000 });
                      this.salvando.set(false); }
    });
  }

  abrirManutencao(m: Motorista): void {
    this.motoristaManutencao.set(m);
    this.manutencaoForm = { tipoManutencao: 'PREVENTIVA' };
  }
  fecharManutencao(): void {
    this.motoristaManutencao.set(null);
    this.manutencaoForm = {};
  }
  salvarManutencao(): void {
    const m = this.motoristaManutencao();
    if (!m?.veiculoId) return;
    if (!this.manutencaoForm.tipoManutencao || !this.manutencaoForm.descricao || !this.manutencaoForm.valorTotal) {
      this.snack.open('Preencha tipo, descrição e valor total.', '', { duration: 3000 });
      return;
    }
    this.salvando.set(true);
    this.manutencaoSvc.registrar(m.veiculoId, this.manutencaoForm).subscribe({
      next: () => { this.fecharManutencao(); this.carregar();
                    this.snack.open('Manutenção registrada! O veículo foi enviado para manutenção.', '', { duration: 4000 });
                    this.salvando.set(false); },
      error: (e) => { this.snack.open(this.mensagemErro(e, 'Erro ao registrar manutenção.'), '', { duration: 5000 });
                      this.salvando.set(false); }
    });
  }

  /** Aplica a máscara 000.000.000-00 conforme o usuário digita o Título de Eleitor */
  onTituloEleitorChange(valor: string): void {
    this.form.tituloEleitor = this.formatarTituloEleitor(valor);
  }
  private formatarTituloEleitor(valor: string): string {
    const d = (valor || '').replace(/\D/g, '').slice(0, 15);
    if (d.length <= 4) return d;
    if (d.length <= 8) return d.slice(0, 4) + ' ' + d.slice(4);
    if (d.length <= 12) return d.slice(0, 4) + ' ' + d.slice(4, 8) + ' ' + d.slice(8);
    return d.slice(0, 4) + ' ' + d.slice(4, 8) + ' ' + d.slice(8, 12) + ' ' + d.slice(12);
  }

  /** Aplica a máscara (00) 00000-0000 (celular) ou (00) 0000-0000 (fixo) conforme o usuário digita */
  onTelefoneChange(valor: string): void {
    this.form.telefone = this.formatarTelefone(valor);
  }
  private formatarTelefone(valor: string): string {
    const d = (valor || '').replace(/\D/g, '').slice(0, 11);
    if (d.length === 0) return '';
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  private mensagemErro(e: any, padrao: string): string {
    const erros: string[] | undefined = e?.error?.erros;
    if (erros?.length) return erros.join(' | ');
    return e?.error?.mensagem ?? padrao;
  }

  salvar(): void {
    const senha = this.senhaAcesso.trim();
    if (senha && senha.length < 6) {
      this.snack.open('A senha deve ter no mínimo 6 caracteres.', '', { duration: 4000 });
      return;
    }

    this.salvando.set(true);
    const op = this.editando()?.id
      ? this.svc.atualizar(this.editando()!.id!, this.form as Motorista)
      : this.svc.criar(this.form as Motorista);

    op.subscribe({
      next: (motorista) => {
        const finalizar = () => {
          this.fecharFormulario();
          this.carregar();
          this.snack.open('Motorista salvo!', '', { duration: 3000 });
          this.salvando.set(false);
        };

        if (senha && motorista.id) {
          this.svc.definirSenha(motorista.id, senha).subscribe({
            next: finalizar,
            error: (e) => {
              this.snack.open(this.mensagemErro(e, 'Erro ao atualizar a senha.'), '', { duration: 6000 });
              this.salvando.set(false);
            }
          });
        } else {
          finalizar();
        }
      },
      error: (e) => {
        this.snack.open(this.mensagemErro(e, 'Erro ao salvar.'), '', { duration: 6000 });
        this.salvando.set(false);
      }
    });
  }

  inativar(m: Motorista): void {
    if (!confirm(`Inativar ${m.nome}?`)) return;
    this.svc.inativar(m.id!).subscribe({
      next: () => { this.carregar(); this.snack.open('Motorista inativado.', '', { duration: 3000 }); },
      error: (e) => this.snack.open(this.mensagemErro(e, 'Erro.'), '', { duration: 5000 })
    });
  }

  ativar(m: Motorista): void {
    this.svc.ativar(m.id!).subscribe({
      next: () => { this.carregar(); this.snack.open('Motorista ativado novamente.', '', { duration: 3000 }); },
      error: (e) => this.snack.open(this.mensagemErro(e, 'Erro.'), '', { duration: 5000 })
    });
  }

 chipStatus(s: StatusMotorista): string {
  const map: Record<StatusMotorista, string> = {
    DISPONIVEL: 'chip-disponivel',
    EM_ROTA:    'chip-em-rota',
    INATIVO:    'chip-inativo'
  };
  return map[s];
}

statusLabel(s: StatusMotorista): string {
  const map: Record<StatusMotorista, string> = {
    DISPONIVEL: 'Disponível',
    EM_ROTA:    'Em Rota',
    INATIVO:    'Inativo'
  };
  return map[s];
}
}