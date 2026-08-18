import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ManutencaoService } from '../../../core/services/manutencao.service';
import { Manutencao, TipoManutencao } from '../../../core/models/manutencao.model';

@Component({
  selector: 'app-manutencoes-motorista',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule,
            MatSelectModule, MatInputModule, MatFormFieldModule,
            MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2 class="page-title">Manutenções do Veículo</h2>
        <button mat-raised-button color="primary" (click)="abrirFormulario()"
                [disabled]="formularioAberto()">
          <mat-icon>add</mat-icon> Registrar Manutenção
        </button>
      </div>

      <p class="hint">
        Registre manutenções preventivas e corretivas que ocorreram com o seu veículo.
        O sistema usa o veículo atrelado a você e já atualiza o status para MANUTENÇÃO.
      </p>

      <!-- FORMULÁRIO -->
      @if (formularioAberto()) {
        <div class="form-card">
          <div class="form-card-header">
            <h3>Nova Manutenção</h3>
            <button mat-icon-button (click)="fecharFormulario()"><mat-icon>close</mat-icon></button>
          </div>
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Tipo *</mat-label>
              <mat-select [(ngModel)]="form.tipoManutencao">
                <mat-option value="PREVENTIVA">Preventiva</mat-option>
                <mat-option value="CORRETIVA">Corretiva</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Data</mat-label>
              <input matInput type="date" [(ngModel)]="form.dataManutencao">
              <mat-hint>Vazio = hoje</mat-hint>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Valor Total (R$) *</mat-label>
              <input matInput type="number" min="0" step="0.01" [(ngModel)]="form.valorTotal">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Oficina</mat-label>
              <input matInput [(ngModel)]="form.oficina">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>KM na manutenção</mat-label>
              <input matInput type="number" min="0" [(ngModel)]="form.kmNaManutencao">
              <mat-hint>Vazio = odômetro atual do veículo</mat-hint>
            </mat-form-field>
            <mat-form-field appearance="outline" class="span-2">
              <mat-label>Descrição do serviço *</mat-label>
              <textarea matInput rows="2" [(ngModel)]="form.descricao"></textarea>
            </mat-form-field>
          </div>
          <div class="form-actions">
            <button mat-button (click)="fecharFormulario()">Cancelar</button>
            <button mat-raised-button color="primary" (click)="salvar()" [disabled]="salvando()">
              {{ salvando() ? 'Salvando...' : 'Registrar' }}
            </button>
          </div>
        </div>
      }

      <!-- LISTA -->
      @if (carregando()) {
        <div class="loading"><mat-spinner diameter="40"/></div>
      } @else {
        @if (manutencoes().length === 0) {
          <div class="empty-state">
            <mat-icon>build_circle</mat-icon>
            <p>Nenhuma manutenção registrada para o seu veículo ainda</p>
          </div>
        } @else {
          @for (m of manutencoes(); track m.id) {
            <div class="manutencao-card" [class.preventiva]="m.tipoManutencao === 'PREVENTIVA'"
                                       [class.corretiva]="m.tipoManutencao === 'CORRETIVA'">
              <div class="card-top">
                <div class="card-icon">
                  <mat-icon>{{ m.tipoManutencao === 'PREVENTIVA' ? 'schedule' : 'build' }}</mat-icon>
                </div>
                <div class="card-info">
                  <h4>{{ m.tipoManutencao === 'PREVENTIVA' ? 'Preventiva' : 'Corretiva' }}</h4>
                  <span class="sub">
                    {{ m.placaVeiculo }} · {{ m.dataManutencao | date:'dd/MM/yyyy' }}
                    @if (m.kmNaManutencao) { · {{ m.kmNaManutencao }} km }
                  </span>
                </div>
                <span class="valor-chip">R$ {{ m.valorTotal | number:'1.2-2' }}</span>
              </div>
              <p class="descricao">{{ m.descricao }}</p>
              @if (m.oficina) {
                <div class="oficina">
                  <mat-icon>store</mat-icon>
                  <span>{{ m.oficina }}</span>
                </div>
              }
            </div>
          }
        }
      }
    </div>
  `,
  styles: [`
    .page { max-width: 600px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .page-title { font-size: 20px; font-weight: 700; margin: 0; color: #1A1A2E; }
    .hint { font-size: 13px; color: #5C6370; margin: 0 0 20px; }

    .form-card { background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px;
                 box-shadow: 0 2px 8px rgba(0,0,0,.08); border-left: 4px solid #FF6F00; }
    .form-card-header { display: flex; justify-content: space-between; align-items: center;
                        margin-bottom: 16px; h3 { font-size: 16px; font-weight: 600; margin: 0; } }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr));
                 gap: 12px; .span-2 { grid-column: 1/-1; } }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }

    .loading { display: grid; place-items: center; height: 200px; }

    .manutencao-card {
      background: white; border-radius: 12px; padding: 16px; margin-bottom: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,.06);
      &.preventiva { border-left: 4px solid #1565C0; }
      &.corretiva  { border-left: 4px solid #C62828; }
    }
    .card-top { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
    .card-icon {
      width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: #FFF3E0;
      mat-icon { color: #EF6C00; font-size: 22px; width: 22px; height: 22px; }
    }
    .preventiva .card-icon { background: #E3F2FD; mat-icon { color: #1565C0; } }
    .corretiva  .card-icon { background: #FFEBEE; mat-icon { color: #C62828; } }
    .card-info { flex: 1; h4 { margin: 0; font-size: 15px; font-weight: 600; }
                 .sub { font-size: 12px; color: #5C6370; } }
    .valor-chip { font-size: 13px; font-weight: 700; padding: 5px 10px; border-radius: 8px;
                  background: #F1F8E9; color: #2E7D32; }

    .descricao { font-size: 13px; color: #424242; margin: 8px 0; line-height: 1.5; }
    .oficina   { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #9E9E9E;
                 mat-icon { font-size: 15px; width: 15px; height: 15px; } }

    .empty-state { text-align: center; padding: 48px 24px; color: #9E9E9E;
      mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 12px; }
      p { font-size: 15px; }
    }
  `]
})
export class ManutencoesMotoristaComponent implements OnInit {
  manutencoes      = signal<Manutencao[]>([]);
  carregando       = signal(true);
  salvando         = signal(false);
  formularioAberto = signal(false);

  form: Partial<Manutencao> = { tipoManutencao: 'CORRETIVA' };

  constructor(private svc: ManutencaoService, private snack: MatSnackBar) {}

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.carregando.set(true);
    this.svc.listarMinhas().subscribe({
      next: m => { this.manutencoes.set(m); this.carregando.set(false); },
      error: () => this.carregando.set(false)
    });
  }

  abrirFormulario(): void {
    this.form = { tipoManutencao: 'CORRETIVA' };
    this.formularioAberto.set(true);
  }
  fecharFormulario(): void { this.formularioAberto.set(false); }

  salvar(): void {
    if (!this.form.tipoManutencao || !this.form.descricao || !this.form.valorTotal) {
      this.snack.open('Preencha tipo, descrição e valor total.', '', { duration: 3000 });
      return;
    }
    this.salvando.set(true);
    this.svc.registrarMinha(this.form).subscribe({
      next: () => {
        this.snack.open('Manutenção registrada! Veículo marcado como em manutenção.',
          '', { duration: 4000 });
        this.salvando.set(false);
        this.fecharFormulario();
        this.carregar();
      },
      error: (e) => {
        this.snack.open(e.error?.mensagem ?? 'Erro ao registrar manutenção.', '', { duration: 5000 });
        this.salvando.set(false);
      }
    });
  }
}
