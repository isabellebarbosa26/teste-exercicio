import { Component, OnInit, signal } from '@angular/core';
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
import { TarefaService } from '../../../core/services/tarefa.service';
import { OcorrenciaIncidente, TipoOcorrencia } from '../../../core/models/ocorrencia.model';
import { Tarefa } from '../../../core/models/tarefa.model';

@Component({
  selector: 'app-ocorrencias-motorista',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule,
            MatFormFieldModule, MatInputModule, MatSelectModule,
            MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2 class="page-title">Ocorrências e Incidentes</h2>
        <button mat-raised-button color="primary" (click)="abrirForm()" *ngIf="!formularioAberto()">
          <mat-icon>add</mat-icon> Registrar Ocorrência
        </button>
      </div>

      @if (formularioAberto()) {
        <div class="form-card">
          <h3>Nova Ocorrência</h3>
          <div class="form-grid">
            <mat-form-field appearance="outline" class="span-2">
              <mat-label>Viagem *</mat-label>
              <mat-select [(ngModel)]="form.tarefaId">
                <mat-option [value]="null" disabled>Selecione uma viagem</mat-option>
                @for (t of tarefasAtivas(); track t.id) {
                  <mat-option [value]="t.id">{{ t.descricaoOrigem }} → {{ t.descricaoDestino }} ({{ t.placaVeiculo }})</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Tipo *</mat-label>
              <mat-select [(ngModel)]="form.tipo">
                <mat-option value="ACIDENTE">Acidente</mat-option>
                <mat-option value="AVARIA_CARGA">Avaria na Carga</mat-option>
                <mat-option value="PROBLEMA_MECANICO">Problema Mecânico</mat-option>
                <mat-option value="ATRASO">Atraso</mat-option>
                <mat-option value="DESVIO_ROTA">Desvio de Rota</mat-option>
                <mat-option value="OUTRO">Outro</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Localização</mat-label>
              <input matInput [(ngModel)]="form.localizacao" placeholder="Ex: BR-174, km 150">
            </mat-form-field>
            <mat-form-field appearance="outline" class="span-2">
              <mat-label>Descrição *</mat-label>
              <textarea matInput rows="3" [(ngModel)]="form.descricao" placeholder="Descreva o que aconteceu..."></textarea>
            </mat-form-field>
          </div>
          @if (erro()) {
            <div class="erro-box"><mat-icon>error_outline</mat-icon><span>{{ erro() }}</span></div>
          }
          <div class="form-actions">
            <button mat-button (click)="fecharForm()">Cancelar</button>
            <button mat-raised-button color="primary" (click)="salvar()" [disabled]="salvando()">
              {{ salvando() ? 'Enviando...' : 'Enviar Ocorrência' }}
            </button>
          </div>
        </div>
      }

      @if (carregando()) {
        <div class="loading"><mat-spinner diameter="40"/></div>
      } @else {
        @if (ocorrencias().length === 0) {
          <div class="empty-state">
            <mat-icon>inbox</mat-icon>
            <p>Nenhuma ocorrência registrada</p>
          </div>
        } @else {
          @for (o of ocorrencias(); track o.id) {
            <div class="ocorrencia-card" [ngClass]="tipoClass(o.tipo)">
              <div class="card-header">
                <span class="tipo-chip" [ngClass]="tipoClass(o.tipo)">{{ tipoLabel(o.tipo) }}</span>
                <span class="status-chip" [ngClass]="statusClass(o.status)">{{ statusLabel(o.status) }}</span>
              </div>
              <div class="card-rota">{{ o.rotaTarefa || '—' }}</div>
              @if (o.placaVeiculo) { <div class="card-veiculo"><mat-icon>directions_car</mat-icon> {{ o.placaVeiculo }}</div> }
              <p class="card-desc">{{ o.descricao }}</p>
              @if (o.localizacao) { <div class="card-local"><mat-icon>place</mat-icon> {{ o.localizacao }}</div> }
              @if (o.comentarioAdmin) {
                <div class="card-comentario"><mat-icon>comment</mat-icon> {{ o.comentarioAdmin }}</div>
              }
              <div class="card-data">{{ o.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
            </div>
          }
        }
      }
    </div>
  `,
  styles: [`
    .page { max-width: 600px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-title { font-size: 20px; font-weight: 700; color: #1A1A2E; margin: 0; }
    .form-card { background: white; border-radius: 12px; padding: 20px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,.06); border-left: 4px solid #C62828;
      h3 { font-size: 16px; font-weight: 700; color: #1A1A2E; margin: 0 0 16px; } }
    .form-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; .span-2 { grid-column: 1/-1; } }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
    .erro-box { display: flex; align-items: center; gap: 8px; background: #FFEBEE; border: 1px solid #FFCDD2; border-radius: 8px; padding: 12px; margin-top: 12px;
      mat-icon { color: #C62828; } span { font-size: 13px; color: #B71C1C; } }
    .loading { display: grid; place-items: center; height: 200px; }
    .ocorrencia-card { background: white; border-radius: 12px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 4px rgba(0,0,0,.06); border-left: 4px solid #607D8B;
      &.ACIDENTE { border-left-color: #C62828; }
      &.AVARIA_CARGA { border-left-color: #E65100; }
      &.PROBLEMA_MECANICO { border-left-color: #FF8F00; }
      &.ATRASO { border-left-color: #1565C0; }
      &.DESVIO_ROTA { border-left-color: #7B1FA2; }
      &.OUTRO { border-left-color: #607D8B; } }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .tipo-chip { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; text-transform: uppercase;
      &.ACIDENTE { background: #FFCDD2; color: #B71C1C; }
      &.AVARIA_CARGA { background: #FFE0B2; color: #BF360C; }
      &.PROBLEMA_MECANICO { background: #FFF3E0; color: #E65100; }
      &.ATRASO { background: #BBDEFB; color: #0D47A1; }
      &.DESVIO_ROTA { background: #E1BEE7; color: #4A148C; }
      &.OUTRO { background: #ECEFF1; color: #37474F; } }
    .status-chip { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; text-transform: uppercase;
      &.REGISTRADA { background: #BBDEFB; color: #0D47A1; }
      &.EM_ANALISE { background: #FFF3E0; color: #E65100; }
      &.RESOLVIDA { background: #C8E6C9; color: #1B5E20; } }
    .card-rota { font-size: 14px; font-weight: 600; color: #1A1A2E; margin-bottom: 4px; }
    .card-veiculo { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #5C6370; margin-bottom: 8px;
      mat-icon { font-size: 15px; width: 15px; height: 15px; } }
    .card-desc { font-size: 13px; color: #37474F; line-height: 1.5; margin: 8px 0; }
    .card-local { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #546E7A; margin-bottom: 4px;
      mat-icon { font-size: 15px; width: 15px; height: 15px; } }
    .card-comentario { display: flex; align-items: flex-start; gap: 6px; font-size: 12px; color: #455A64; background: #F5F5F5; border-radius: 8px; padding: 8px 12px; margin-top: 8px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; margin-top: 2px; } }
    .card-data { font-size: 11px; color: #90A4AE; margin-top: 8px; }
    .empty-state { text-align: center; padding: 48px; color: #9E9E9E;
      mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 12px; } }
  
    @media (max-width: 480px) {
      .page { padding: 0; }
      .form-card { padding: 16px; }
      .form-grid { grid-template-columns: 1fr !important; }
      .ocorrencia-card { padding: 12px; }
    }
  `]})
export class OcorrenciasMotoristaComponent implements OnInit {
  carregando = signal(true);
  salvando = signal(false);
  formularioAberto = signal(false);
  erro = signal<string | null>(null);
  ocorrencias = signal<OcorrenciaIncidente[]>([]);
  tarefasAtivas = signal<Tarefa[]>([]);

  form = {
    tarefaId: null as number | null,
    tipo: 'OUTRO' as TipoOcorrencia,
    descricao: '',
    localizacao: ''
  };

  constructor(
    private ocorrenciaSvc: OcorrenciaService,
    private tarefaSvc: TarefaService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.carregando.set(true);
    this.ocorrenciaSvc.listarMinhas().subscribe({
      next: lista => { this.ocorrencias.set(lista); this.carregando.set(false); },
      error: () => { this.ocorrencias.set([]); this.carregando.set(false); }
    });
    this.tarefaSvc.listarMinhas().subscribe({
      next: tarefas => { this.tarefasAtivas.set(tarefas.filter(t => t.statusTarefa === 'EM_ANDAMENTO')); },
      error: () => {}
    });
  }

  abrirForm(): void {
    this.formularioAberto.set(true);
    this.erro.set(null);
    this.form = { tarefaId: null, tipo: 'OUTRO', descricao: '', localizacao: '' };
  }

  fecharForm(): void {
    this.formularioAberto.set(false);
    this.erro.set(null);
  }

  salvar(): void {
    this.erro.set(null);

    if (!this.form.tarefaId) { this.erro.set('Selecione uma viagem.'); return; }
    if (!this.form.tipo) { this.erro.set('Selecione o tipo de ocorrência.'); return; }
    if (!this.form.descricao || this.form.descricao.trim().length < 5) {
      this.erro.set('Descrição deve ter no mínimo 5 caracteres.'); return;
    }

    this.salvando.set(true);
    this.ocorrenciaSvc.criar({
      tarefaId: this.form.tarefaId,
      tipo: this.form.tipo,
      descricao: this.form.descricao.trim(),
      localizacao: this.form.localizacao || undefined
    }).subscribe({
      next: () => {
        this.salvando.set(false);
        this.snack.open('Ocorrência registrada com sucesso!', '', { duration: 4000 });
        this.fecharForm();
        this.carregar();
      },
      error: (e) => {
        this.salvando.set(false);
        // NÃO fecha o form — mantém os dados para o usuário tentar de novo
        const msg = e?.error?.mensagem ?? e?.message ?? 'Erro ao registrar ocorrência. Tente novamente.';
        this.erro.set(msg);
        this.snack.open('Erro ao registrar. Verifique os dados e tente novamente.', '', { duration: 5000 });
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
