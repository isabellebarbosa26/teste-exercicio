import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SolicitacaoService } from '../../../core/services/solicitacao.service';
import { SolicitacaoViagem, StatusSolicitacao, SolicitacaoViagemRequest } from '../../../core/models/solicitacao.model';
import { TipoUso } from '../../../core/models/tarefa.model';

@Component({
  selector: 'app-minhas-solicitacoes',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule,
            MatFormFieldModule, MatInputModule, MatSelectModule,
            MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2 class="page-title">Minhas Solicitações</h2>
      </div>

      @if (carregando()) {
        <div class="loading"><mat-spinner diameter="40"/></div>
      } @else {
        @if (solicitacoes().length === 0) {
          <div class="empty-state">
            <mat-icon>inbox</mat-icon>
            <p>Você ainda não fez nenhuma solicitação de viagem.</p>
          </div>
        } @else {
          @for (s of solicitacoes(); track s.id) {
            <div class="solicitacao-card" [ngClass]="chipClass(s.status!)">
              <div class="card-header">
                <div class="rota">
                  <span>{{ s.descricaoOrigem }}</span>
                  <mat-icon>arrow_forward</mat-icon>
                  <span>{{ s.descricaoDestino }}</span>
                </div>
                <span class="status-chip" [ngClass]="chipClass(s.status!)">
                  {{ statusLabel(s.status!) }}
                </span>
              </div>
              <div class="card-details">
                <div class="detail"><mat-icon>category</mat-icon> {{ tipoUsoLabel(s.tipoUso) }}</div>
                @if (s.qtdPassageiros) { <div class="detail"><mat-icon>groups</mat-icon> {{ s.qtdPassageiros }} passageiro(s)</div> }
                @if (s.kgCarga) { <div class="detail"><mat-icon>scale</mat-icon> {{ s.kgCarga }} kg</div> }
                <div class="detail"><mat-icon>event</mat-icon> {{ s.dataViagem }}</div>
              </div>

              @if (s.status === 'RECUSADA' && s.comentarioRecusa) {
                <div class="recusa-box"><mat-icon>warning</mat-icon><span>{{ s.comentarioRecusa }}</span></div>
              }
              @if (s.status === 'ACEITA' && s.tarefaId) {
                <div class="aceita-box"><mat-icon>check_circle</mat-icon><span>Tarefa #{{ s.tarefaId }} criada.</span></div>
              }
              @if (s.status === 'EDITADA_PENDENTE') {
                <div class="editada-box"><mat-icon>edit</mat-icon><span>Edição aguardando aprovação do admin.</span></div>
              }

              @if (s.status === 'ACEITA') {
                <button mat-stroked-button color="primary" (click)="abrirEdicao(s)" class="btn-editar">
                  <mat-icon>edit</mat-icon> Editar Solicitação
                </button>
              }
            </div>
          }
        }
      }

      @if (editando()) {
        <div class="modal-backdrop" (click)="fecharEdicao()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Editar Solicitação #{{ editando()!.id }}</h3>
              <button mat-icon-button (click)="fecharEdicao()"><mat-icon>close</mat-icon></button>
            </div>
            <div class="modal-body">
              <div class="form-grid">
                <mat-form-field appearance="outline" class="span-2">
                  <mat-label>Origem *</mat-label>
                  <input matInput [(ngModel)]="editForm.origem">
                </mat-form-field>
                <mat-form-field appearance="outline" class="span-2">
                  <mat-label>Destino *</mat-label>
                  <input matInput [(ngModel)]="editForm.destino">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Tipo *</mat-label>
                  <mat-select [(ngModel)]="editForm.tipoUso">
                    <mat-option value="CARGA">Carga</mat-option>
                    <mat-option value="PASSAGEIRO">Passageiro</mat-option>
                    <mat-option value="MISTO">Misto</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Data da Viagem *</mat-label>
                  <input matInput [matDatepicker]="pickerEdit" [(ngModel)]="editForm.dataViagem"
                         [min]="dataMinimaDate()" [matDatepickerFilter]="filtrarDatasPassadas">
                  <mat-datepicker-toggle matSuffix [for]="pickerEdit"></mat-datepicker-toggle>
                  <mat-datepicker #pickerEdit></mat-datepicker>
                  <mat-hint>Mínimo 3 dias de antecedência</mat-hint>
                </mat-form-field>
                @if (editForm.tipoUso === 'CARGA' || editForm.tipoUso === 'MISTO') {
                  <mat-form-field appearance="outline">
                    <mat-label>KG de Carga *</mat-label>
                    <input matInput type="number" [(ngModel)]="editForm.kgCarga">
                  </mat-form-field>
                }
                @if (editForm.tipoUso === 'PASSAGEIRO' || editForm.tipoUso === 'MISTO') {
                  <mat-form-field appearance="outline">
                    <mat-label>Qtd Passageiros *</mat-label>
                    <input matInput type="number" [(ngModel)]="editForm.qtdPassageiros">
                  </mat-form-field>
                }
              </div>
              @if (erro()) {
                <div class="erro-box"><mat-icon>error</mat-icon><span>{{ erro() }}</span></div>
              }
            </div>
            <div class="modal-footer">
              <button mat-button (click)="fecharEdicao()">Cancelar</button>
              <button mat-raised-button color="primary" (click)="salvarEdicao()" [disabled]="salvando()">
                {{ salvando() ? 'Enviando...' : 'Enviar Edição' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 600px; margin: 0 auto; }
    .page-title { font-size: 20px; font-weight: 700; color: #1A1A2E; margin-bottom: 20px; }
    .loading { display: grid; place-items: center; height: 200px; }
    .solicitacao-card {
      background: white; border-radius: 12px; padding: 16px; margin-bottom: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,.06);
      &.PENDENTE { border-left: 4px solid #1565C0; }
      &.ACEITA { border-left: 4px solid #2E7D32; }
      &.RECUSADA { border-left: 4px solid #C62828; }
      &.EDITADA_PENDENTE { border-left: 4px solid #FF6F00; }
    }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;
      .rota { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; color: #1A1A2E;
        mat-icon { font-size: 16px; width: 16px; height: 16px; color: #5C6370; } } }
    .status-chip { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; text-transform: uppercase;
      &.PENDENTE { background: #BBDEFB; color: #0D47A1; }
      &.ACEITA { background: #C8E6C9; color: #1B5E20; }
      &.RECUSADA { background: #FFCDD2; color: #B71C1C; }
      &.EDITADA_PENDENTE { background: #FFE0B2; color: #BF360C; } }
    .card-details { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 8px;
      .detail { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #5C6370;
        mat-icon { font-size: 15px; width: 15px; height: 15px; color: #90A4AE; } } }
    .recusa-box, .aceita-box, .editada-box {
      display: flex; align-items: center; gap: 8px; border-radius: 8px; padding: 10px 12px; margin-top: 8px; font-size: 12px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; } }
    .recusa-box { background: #FFEBEE; color: #B71C1C; }
    .aceita-box { background: #E8F5E9; color: #1B5E20; }
    .editada-box { background: #FFF3E0; color: #BF360C; }
    .btn-editar { margin-top: 12px; }
    .empty-state { text-align: center; padding: 48px; color: #9E9E9E;
      mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 12px; } }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
    .modal-card { background: white; border-radius: 12px; max-width: 500px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,.3); overflow: hidden; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #E0E0E0;
      h3 { font-size: 16px; font-weight: 700; color: #1A1A2E; margin: 0; } }
    .modal-body { padding: 20px; }
    .form-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; .span-2 { grid-column: 1/-1; } }
    .modal-footer { padding: 12px 20px; border-top: 1px solid #E0E0E0; display: flex; justify-content: flex-end; gap: 8px; }
    .erro-box { display: flex; align-items: center; gap: 8px; background: #FFEBEE; border: 1px solid #FFCDD2; border-radius: 8px; padding: 12px; margin-top: 16px;
      mat-icon { color: #C62828; } span { font-size: 13px; color: #B71C1C; } }
  
    @media (max-width: 480px) {
      .page { padding: 0; }
      .solicitacao-card { padding: 12px; }
      .card-header { flex-direction: column; align-items: flex-start; gap: 6px; }
      .card-details { flex-direction: column; gap: 6px; }
      .modal-card { max-width: 100%; }
      .form-grid { grid-template-columns: 1fr !important; }
    }
  `]})
export class MinhasSolicitacoesComponent implements OnInit {
  carregando = signal(true);
  salvando = signal(false);
  erro = signal<string | null>(null);
  solicitacoes = signal<SolicitacaoViagem[]>([]);
  editando = signal<SolicitacaoViagem | null>(null);

  editForm = {
    origem: '', destino: '', tipoUso: 'CARGA' as TipoUso,
    kgCarga: null as number | null, qtdPassageiros: null as number | null,
    dataViagem: null as Date | null
  };

  constructor(
    private svc: SolicitacaoService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.carregando.set(true);
    this.svc.listarMinhas().subscribe({
      next: lista => { this.solicitacoes.set(lista); this.carregando.set(false); },
      error: () => { this.solicitacoes.set([]); this.carregando.set(false); }
    });
  }

  dataMinimaDate(): Date {
    return new Date(Date.now() + 3 * 86400000);
  }

  filtrarDatasPassadas = (d: Date | null): boolean => {
    if (!d) return false;
    const minima = this.dataMinimaDate();
    const dataZero = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const minimaZero = new Date(minima.getFullYear(), minima.getMonth(), minima.getDate()).getTime();
    return dataZero >= minimaZero;
  };

  abrirEdicao(s: SolicitacaoViagem): void {
    this.editando.set(s);
    // Converte string yyyy-MM-dd do backend para Date
    const dataViagem = s.dataViagem ? new Date(s.dataViagem + 'T00:00:00') : null;
    this.editForm = {
      origem: s.descricaoOrigem, destino: s.descricaoDestino,
      tipoUso: s.tipoUso, kgCarga: s.kgCarga ?? null,
      qtdPassageiros: s.qtdPassageiros ?? null, dataViagem: dataViagem
    };
    this.erro.set(null);
  }

  fecharEdicao(): void { this.editando.set(null); this.erro.set(null); }

  salvarEdicao(): void {
    const s = this.editando();
    if (!s?.id) return;
    this.erro.set(null);

    if (!this.editForm.origem || !this.editForm.destino) { this.erro.set('Origem e destino são obrigatórios.'); return; }
    if (!this.editForm.dataViagem) { this.erro.set('Informe a data da viagem.'); return; }
    const dataViagemStr = this.formatarData(this.editForm.dataViagem);
    if (!this.validarAntecedencia(dataViagemStr)) {
      this.erro.set('Solicitação deve ter antecedência mínima de 3 dias, em caso de imediações, por favor, contate o setor de transporte.'); return;
    }

    const body: SolicitacaoViagemRequest = {
      descricaoOrigem: this.editForm.origem, descricaoDestino: this.editForm.destino,
      tipoUso: this.editForm.tipoUso, dataViagem: dataViagemStr,
      kgCarga: this.editForm.tipoUso === 'PASSAGEIRO' ? null : this.editForm.kgCarga,
      qtdPassageiros: this.editForm.tipoUso === 'CARGA' ? null : this.editForm.qtdPassageiros
    };

    this.salvando.set(true);
    this.svc.editar(s.id, body).subscribe({
      next: () => {
        this.salvando.set(false);
        this.snack.open('Edição enviada! O admin avaliará a alteração.', '', { duration: 5000 });
        this.fecharEdicao();
        this.carregar();
      },
      error: (e) => {
        this.salvando.set(false);
        this.erro.set(e?.error?.mensagem ?? 'Erro ao editar solicitação.');
      }
    });
  }

  private formatarData(d: Date): string {
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private validarAntecedencia(dataViagem: string): boolean {
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const data = new Date(dataViagem + 'T00:00:00');
    return Math.floor((data.getTime() - hoje.getTime()) / 86400000) >= 3;
  }

  chipClass(s: StatusSolicitacao): string { return s; }
  statusLabel(s: StatusSolicitacao): string {
    return { PENDENTE: 'Pendente', ACEITA: 'Aceita', RECUSADA: 'Recusada', EDITADA_PENDENTE: 'Edição Pendente' }[s];
  }
  tipoUsoLabel(t: string): string {
    return { CARGA: 'Carga', PASSAGEIRO: 'Passageiro', MISTO: 'Misto' }[t] ?? t;
  }
}
