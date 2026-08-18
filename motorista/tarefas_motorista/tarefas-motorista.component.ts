import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TarefaService } from '../../../core/services/tarefa.service';
import { Tarefa, TipoUso } from '../../../core/models/tarefa.model';

@Component({
  selector: 'app-minhas-tarefas',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule,
            MatProgressSpinnerModule, MatInputModule, MatFormFieldModule, MatSnackBarModule],
  template: `
    <div class="page">

      <h2 class="page-title">Minhas Viagens</h2>

      @if (carregando()) {
        <div class="loading"><mat-spinner diameter="40"/></div>
      } @else {

        <!-- TAREFA ATIVA -->
        @if (tarefaAtiva()) {
          <div class="tarefa-ativa">
            <div class="ativa-header">
              <mat-icon>local_shipping</mat-icon>
              <span>Viagem em Andamento</span>
            </div>
            <div class="ativa-body">
              <div class="veiculo">
                <strong>{{ tarefaAtiva()!.placaVeiculo }}</strong>
                <span>{{ tarefaAtiva()!.modeloVeiculo }}</span>
              </div>
              <div class="rota">
                <div class="ponto origem">
                  <mat-icon>trip_origin</mat-icon>
                  {{ tarefaAtiva()!.descricaoOrigem }}
                </div>
                <div class="linha-rota"></div>
                <div class="ponto destino">
                  <mat-icon>place</mat-icon>
                  {{ tarefaAtiva()!.descricaoDestino }}
                </div>
              </div>
              <div class="tipo-uso-info">
                <mat-icon>category</mat-icon>
                Tipo de uso: <strong>{{ cargaLabel(tarefaAtiva()!.tipoUso) }}</strong>
              </div>
              @if (tarefaAtiva()!.kmEsperada) {
                <div class="km-info">
                  <mat-icon>straighten</mat-icon>
                  KM esperada: {{ tarefaAtiva()!.kmEsperada | number:'1.0-2' }} km
                </div>
              }
              @if (tarefaAtiva()!.kmInicioOdometro) {
                <div class="km-info">
                  <mat-icon>speed</mat-icon>
                  Odômetro inicial: {{ tarefaAtiva()!.kmInicioOdometro | number:'1.0-2' }} km
                </div>
              }
            </div>

            @if (!painelConcluir()) {
              <div class="ativa-actions">
                <button mat-raised-button color="primary" class="btn-full"
                        (click)="painelConcluir.set(true)">
                  <mat-icon>check_circle</mat-icon> Concluir Tarefa
                </button>
              </div>
            } @else {
              <div class="concluir-form">
                <mat-form-field appearance="outline" style="width:100%">
                  <mat-label>KM Final do Odômetro *</mat-label>
                  <input matInput type="number" [(ngModel)]="kmFinalOdometro"
                         placeholder="Leitura final do odômetro" inputmode="decimal">
                  <mat-hint>KM rodada será calculada automaticamente</mat-hint>
                </mat-form-field>
                <div class="concluir-actions">
                  <button mat-stroked-button (click)="painelConcluir.set(false)">Cancelar</button>
                  <button mat-raised-button color="primary"
                          (click)="concluir()" [disabled]="!kmFinalOdometro || salvando()">
                    {{ salvando() ? '...' : 'Confirmar' }}
                  </button>
                </div>
              </div>
            }
          </div>
        }

        <!-- TAREFAS AGENDADAS -->
        @if (tarefasAgendadas().length > 0) {
          <h3 class="section-title">Agendadas</h3>
          @for (t of tarefasAgendadas(); track t.id) {
            <div class="tarefa-card agendada">
              <div class="tarefa-header">
                <div class="tarefa-info">
                  <strong>{{ t.placaVeiculo }}</strong>
                  <span class="sub">{{ t.modeloVeiculo }}</span>
                </div>
                <span class="status-chip chip-agendada">Agendada</span>
              </div>
              <div class="tarefa-rota">
                <span>{{ t.descricaoOrigem }}</span>
                <mat-icon>arrow_forward</mat-icon>
                <span>{{ t.descricaoDestino }}</span>
              </div>
              <button mat-raised-button color="accent" class="btn-full mt-12"
                      (click)="iniciar(t)" [disabled]="!!tarefaAtiva()">
                <mat-icon>play_arrow</mat-icon> Iniciar Rota
              </button>
              @if (tarefaAtiva()) {
                <p class="aviso">Conclua a viagem em andamento antes de iniciar outra.</p>
              }
            </div>
          }
        }

        <!-- HISTÓRICO -->
        @if (tarefasHistorico().length > 0) {
          <h3 class="section-title">Histórico</h3>
          @for (t of tarefasHistorico(); track t.id) {
            <div class="tarefa-card historico">
              <div class="tarefa-header">
                <div class="tarefa-info">
                  <strong>{{ t.placaVeiculo }}</strong>
                  <span class="sub">{{ t.descricaoOrigem }} → {{ t.descricaoDestino }}</span>
                </div>
                <span class="status-chip" [ngClass]="chipClass(t.statusTarefa)">
                  {{ statusLabel(t.statusTarefa) }}
                </span>
              </div>
              @if (t.kmRodada) {
                <div class="km-info"><mat-icon>straighten</mat-icon> {{ t.kmRodada | number:'1.0-2' }} km rodados</div>
              }
              <div class="data-info">
                <mat-icon>calendar_today</mat-icon>
                {{ t.dataFim ? (t.dataFim | date:'dd/MM/yyyy HH:mm') : '—' }}
              </div>
            </div>
          }
        }

        @if (!tarefaAtiva() && tarefasAgendadas().length === 0 && tarefasHistorico().length === 0) {
          <div class="empty-state">
            <mat-icon>inbox</mat-icon>
            <p>Nenhuma viagem atribuída a você ainda</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page { max-width: 600px; margin: 0 auto; }
    .page-title { font-size: 20px; font-weight: 700; margin-bottom: 20px; color: #1A1A2E; }
    .loading { display: grid; place-items: center; height: 200px; }
    .section-title { font-size: 14px; font-weight: 700; color: #37474F;
                     text-transform: uppercase; letter-spacing: .8px; margin: 24px 0 8px; }

    .tarefa-ativa {
      background: linear-gradient(135deg, #1565C0, #1E88E5);
      border-radius: 16px; padding: 20px; margin-bottom: 24px; color: white;
      .ativa-header { display: flex; align-items: center; gap: 8px; font-size: 13px;
                      font-weight: 600; opacity: .85; margin-bottom: 16px;
                      mat-icon { font-size: 18px; width: 18px; height: 18px; } }
      .ativa-body {
        .veiculo { display: flex; gap: 8px; align-items: baseline; margin-bottom: 16px;
                   strong { font-size: 18px; } span { font-size: 13px; opacity: .8; } }
        .rota { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px;
          .ponto { display: flex; align-items: center; gap: 8px; font-size: 14px;
                   mat-icon { font-size: 18px; width: 18px; height: 18px; } }
          .origem  mat-icon { color: #B3E5FC; }
          .destino mat-icon { color: #FFCC02; }
          .linha-rota { width: 2px; height: 16px; background: rgba(255,255,255,.3); margin-left: 9px; }
        }
        .tipo-uso-info, .km-info { display: flex; align-items: center; gap: 6px; font-size: 13px; opacity: .9;
                                     mat-icon { font-size: 16px; width: 16px; height: 16px; } }
        .tipo-uso-info { margin-bottom: 6px; }
      }
      .ativa-actions { margin-top: 20px; }
      .concluir-form { margin-top: 16px;
        ::ng-deep .mat-mdc-form-field { --mdc-filled-text-field-container-color: rgba(255,255,255,.15);
                                        --mdc-filled-text-field-label-text-color: rgba(255,255,255,.7); }
        ::ng-deep input { color: white !important; }
      }
      .concluir-actions { display: flex; gap: 8px; margin-top: 8px; button { flex: 1; } }
    }

    .tarefa-card {
      background: white; border-radius: 12px; padding: 16px; margin-bottom: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,.06);
      &.agendada   { border-left: 4px solid #7B1FA2; }
      &.historico  { border-left: 4px solid #78909C; opacity: 1; }
    }
    .tarefa-header { display: flex; justify-content: space-between; align-items: center;
                     margin-bottom: 10px;
                     .tarefa-info { display: flex; align-items: center; gap: 8px;
                                    strong { font-size: 15px; display: block; color: #1A1A2E; }
                                    .sub { font-size: 12px; color: #455A64; font-weight: 500; } } }
    .tarefa-rota { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #37474F; font-weight: 500;
                   mat-icon { font-size: 16px; width: 16px; height: 16px; } }
    .km-info, .data-info { display: flex; align-items: center; gap: 6px;
      font-size: 12px; color: #546E7A; margin-top: 8px; font-weight: 500;
      mat-icon { font-size: 15px; width: 15px; height: 15px; } }
    .btn-full { width: 100%; }
    .mt-12   { margin-top: 12px; }
    .aviso   { font-size: 12px; color: #FF8F00; margin-top: 8px; text-align: center; }

    /* STATUS CHIPS — escurecidos para máxima visibilidade */
    .status-chip {
      font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px;
      text-transform: uppercase; white-space: nowrap; letter-spacing: .3px;
      -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
    }
    .chip-agendada   { background: #E1BEE7; color: #4A148C; }
    .chip-concluida  { background: #C8E6C9; color: #1B5E20; }
    .chip-cancelada  { background: #FFCDD2; color: #B71C1C; }

    /* RELATÓRIO KM */
    .km-relatorio {
      background: white; border-radius: 12px; padding: 12px; margin-bottom: 16px;
      box-shadow: 0 1px 4px rgba(0,0,0,.06); overflow-x: auto;
    }
    .km-relatorio table { width: 100%; border-collapse: collapse; font-size: 12px;
      th { background: #F8F9FA; padding: 8px 10px; text-align: left; font-weight: 700; color: #37474F; text-transform: uppercase; font-size: 10px; }
      th.num, td.num { text-align: right; font-variant-numeric: tabular-nums; }
      td { padding: 8px 10px; border-top: 1px solid #F0F0F0; color: #1A1A2E; }
      .rota-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      tfoot td { border-top: 2px solid #E0E0E0; background: #F8F9FA; font-size: 13px; }
      .var-pos { color: #2E7D32; font-weight: 700; }
      .var-neg { color: #C62828; font-weight: 700; }
    }

    .empty-state { text-align: center; padding: 48px 24px; color: #9E9E9E;
      mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 12px; }
      p { font-size: 15px; }
    }
  
    @media (max-width: 480px) {
      .page { padding: 0; }
      .tarefa-ativa { padding: 16px; }
      .tarefa-card { padding: 12px; }
      .concluir-form { mat-form-field { width: 100% !important; } }
      .km-relatorio table { font-size: 10px; th, td { padding: 4px 6px; } }
    }
  `]})
export class MinhasTarefasComponent implements OnInit {
  carregando      = signal(true);
  salvando        = signal(false);
  painelConcluir  = signal(false);

  tarefaAtiva       = signal<Tarefa | null>(null);
  tarefasAgendadas  = signal<Tarefa[]>([]);
  tarefasHistorico  = signal<Tarefa[]>([]);
  tarefasConcluidas = signal<Tarefa[]>([]);
  kmFinalOdometro: number | null = null;

  constructor(private svc: TarefaService, private snack: MatSnackBar) {}

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.carregando.set(true);
    this.svc.listarMinhas().subscribe({
      next: tarefas => {
        this.tarefaAtiva.set(tarefas.find(t => t.statusTarefa === 'EM_ANDAMENTO') ?? null);
        this.tarefasAgendadas.set(tarefas.filter(t => t.statusTarefa === 'AGENDADA'));
        const hist = tarefas.filter(t => t.statusTarefa === 'CONCLUIDA' || t.statusTarefa === 'CANCELADA')
                            .sort((a, b) => (b.dataFim ?? '').localeCompare(a.dataFim ?? ''));
        this.tarefasHistorico.set(hist);
        this.tarefasConcluidas.set(hist.filter(t => t.statusTarefa === 'CONCLUIDA'));
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false)
    });
  }

  iniciar(t: Tarefa): void {
    this.svc.iniciar(t.id!).subscribe({
      next: () => { this.snack.open('Rota iniciada! Boa viagem!', '', { duration: 3000 }); this.carregar(); },
      error: (e) => this.snack.open(e.error?.mensagem ?? 'Erro ao iniciar.', '', { duration: 4000 })
    });
  }

  concluir(): void {
    this.salvando.set(true);
    this.svc.concluir(this.tarefaAtiva()!.id!, this.kmFinalOdometro!).subscribe({
      next: () => {
        this.snack.open('Viagem concluída com sucesso!', '', { duration: 3000 });
        this.painelConcluir.set(false);
        this.kmFinalOdometro = null;
        this.salvando.set(false);
        this.carregar();
      },
      error: (e) => {
        this.snack.open(e.error?.mensagem ?? 'Erro ao concluir.', '', { duration: 4000 });
        this.salvando.set(false);
      }
    });
  }

  chipClass(s: string): string {
    return { CONCLUIDA:'chip-concluida', CANCELADA:'chip-cancelada' }[s] ?? '';
  }
  statusLabel(s: string): string {
    return { CONCLUIDA:'Concluída', CANCELADA:'Cancelada' }[s] ?? s;
  }
  cargaLabel(c: TipoUso): string {
    return { CARGA:'Carga', PASSAGEIRO:'Passageiro', MISTO:'Mista' }[c];
  }
}
