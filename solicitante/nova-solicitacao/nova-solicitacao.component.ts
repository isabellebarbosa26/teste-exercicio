import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { GeoService, EnderecoSugestao } from '../../../core/services/geo.service';
import { SolicitacaoService } from '../../../core/services/solicitacao.service';
import { TipoUso } from '../../../core/models/tarefa.model';
import { SolicitacaoViagemRequest } from '../../../core/models/solicitacao.model';

@Component({
  selector: 'app-nova-solicitacao',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule,
            MatInputModule, MatFormFieldModule, MatSelectModule,
            MatDatepickerModule, MatNativeDateModule,
            MatProgressSpinnerModule, MatSnackBarModule, MatAutocompleteModule],
  template: `
    <div class="page">
      <div class="page-header">
        <button mat-icon-button (click)="voltar()"><mat-icon>arrow_back</mat-icon></button>
        <h2 class="page-title">Nova Solicitação de Viagem</h2>
      </div>

      <div class="form-card">
        <!-- ABAS PRINCIPAIS: dados da viagem x observações -->
        <div class="abas-topo">
          <button type="button" class="aba-btn" [class.active]="aba() === 'dados'"
                  (click)="aba.set('dados')">
            <mat-icon>route</mat-icon> Dados da Viagem
          </button>
          <button type="button" class="aba-btn" [class.active]="aba() === 'observacoes'"
                  (click)="aba.set('observacoes')">
            <mat-icon>sticky_note_2</mat-icon> Observações
            @if (form.observacoes.trim()) { <span class="ponto-preenchido"></span> }
          </button>
        </div>

        @if (aba() === 'dados') {
        <div class="form-grid">
          <mat-form-field appearance="outline" class="span-2">
            <mat-label>Origem *</mat-label>
            <input matInput [(ngModel)]="form.origem" [matAutocomplete]="autoOrigem"
                   (ngModelChange)="onOrigemInput($event)" placeholder="Digite o endereço de partida">
            <mat-autocomplete #autoOrigem="matAutocomplete" (optionSelected)="onOrigemSelecionada($event)">
              @for (s of sugestoesOrigem(); track s.descricao) {
                <mat-option [value]="s.descricao">{{ s.descricao }}</mat-option>
              }
            </mat-autocomplete>
          </mat-form-field>

          <mat-form-field appearance="outline" class="span-2">
            <mat-label>Destino *</mat-label>
            <input matInput [(ngModel)]="form.destino" [matAutocomplete]="autoDestino"
                   (ngModelChange)="onDestinoInput($event)" placeholder="Digite o endereço de chegada">
            <mat-autocomplete #autoDestino="matAutocomplete" (optionSelected)="onDestinoSelecionada($event)">
              @for (s of sugestoesDestino(); track s.descricao) {
                <mat-option [value]="s.descricao">{{ s.descricao }}</mat-option>
              }
            </mat-autocomplete>
          </mat-form-field>

          @if (calculandoKm() || kmEstimada() !== null) {
            <div class="info-distancia span-2">
              <mat-icon>straighten</mat-icon>
              @if (calculandoKm()) {
                <span>Calculando distância estimada…</span>
              } @else {
                <span>Distância estimada: <strong>{{ kmEstimada() | number:'1.0-1' }} km</strong>
                  @if (etaEstimado() !== null) { (~{{ etaEstimado() }} min de viagem) }
                  — o setor de transporte confirmará a KM final.</span>
              }
            </div>
          }

          <mat-form-field appearance="outline">
            <mat-label>Tipo de Carga *</mat-label>
            <mat-select [(ngModel)]="form.tipoUso">
              <mat-option value="CARGA">Carga</mat-option>
              <mat-option value="PASSAGEIRO">Passageiro</mat-option>
              <mat-option value="MISTO">Misto (carga + passageiros)</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Data da Viagem *</mat-label>
            <input matInput [matDatepicker]="picker" [(ngModel)]="form.dataViagem"
                   [min]="dataMinima()" [matDatepickerFilter]="filtrarDatasPassadas">
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-hint>Mínimo 3 dias de antecedência</mat-hint>
          </mat-form-field>

          <!-- CAMPOS CONDICIONAIS POR TIPO -->
          @if (form.tipoUso === 'CARGA') {
            <mat-form-field appearance="outline" class="span-2">
              <mat-label>Peso da Carga (kg) *</mat-label>
              <input matInput type="number" min="0.01" step="0.01" [(ngModel)]="form.kgCarga"
                     placeholder="Ex: 250.5">
            </mat-form-field>
          }

          @if (form.tipoUso === 'PASSAGEIRO') {
            <mat-form-field appearance="outline" class="span-2">
              <mat-label>Quantidade de Passageiros *</mat-label>
              <input matInput type="number" min="1" step="1" [(ngModel)]="form.qtdPassageiros"
                     placeholder="Ex: 4">
            </mat-form-field>
          }

          @if (form.tipoUso === 'MISTO') {
            <div class="abas-misto span-2">
              <div class="abas-header">
                <button type="button" class="aba-btn" [class.active]="abaMisto() === 'passageiros'"
                        (click)="abaMisto.set('passageiros')">
                  <mat-icon>groups</mat-icon> Passageiros
                </button>
                <button type="button" class="aba-btn" [class.active]="abaMisto() === 'carga'"
                        (click)="abaMisto.set('carga')">
                  <mat-icon>scale</mat-icon> Carga
                </button>
              </div>

              @if (abaMisto() === 'passageiros') {
                <mat-form-field appearance="outline" class="span-2">
                  <mat-label>Quantidade de Passageiros *</mat-label>
                  <input matInput type="number" min="1" step="1" [(ngModel)]="form.qtdPassageiros"
                         placeholder="Ex: 4">
                </mat-form-field>
              }

              @if (abaMisto() === 'carga') {
                <mat-form-field appearance="outline" class="span-2">
                  <mat-label>Peso da Carga (kg) *</mat-label>
                  <input matInput type="number" min="0.01" step="0.01" [(ngModel)]="form.kgCarga"
                         placeholder="Ex: 250.5">
                </mat-form-field>
              }
            </div>
          }
        </div>
        }

        @if (aba() === 'observacoes') {
          <div class="aba-observacoes">
            <mat-form-field appearance="outline" class="campo-observacoes">
              <mat-label>Observações da viagem</mat-label>
              <textarea matInput rows="6" maxlength="1000" [(ngModel)]="form.observacoes"
                        placeholder="Ex: material frágil, precisa de ajudante para carregar, o contato no destino é o Sr. João (99999-9999), horário de chegada preferencial..."></textarea>
              <mat-hint>Opcional — {{ form.observacoes.length }}/1000</mat-hint>
            </mat-form-field>

            <div class="info-observacoes">
              <mat-icon>info</mat-icon>
              <span>Estas observações ficam visíveis para a equipe de transporte na análise da
                    solicitação e são repassadas ao motorista na viagem.</span>
            </div>
          </div>
        }

        @if (erro()) {
          <div class="erro-box">
            <mat-icon>error_outline</mat-icon>
            <span>{{ erro() }}</span>
          </div>
        }

        <div class="form-actions">
          <button mat-stroked-button (click)="voltar()">Cancelar</button>
          <button mat-raised-button color="primary" (click)="enviar()" [disabled]="salvando()">
            {{ salvando() ? 'Enviando...' : 'Enviar Solicitação' }}
          </button>
        </div>
      </div>

      <div class="info-antecedencia">
        <mat-icon>info</mat-icon>
        <span>Solicitações devem ter antecedência mínima de 3 dias. Em caso de imediações, contate o setor de transporte.</span>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 600px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
    .page-title { font-size: 20px; font-weight: 700; color: #1A1A2E; margin: 0; }

    .form-card {
      background: white; border-radius: 12px; padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,.06); margin-bottom: 16px;
      border-left: 4px solid #7B1FA2;
    }
    .form-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px;
                 .span-2 { grid-column: 1/-1; } }

    /* Abas principais do formulário (dados x observações) */
    .abas-topo {
      display: flex; gap: 8px; border-bottom: 1px solid #E0E0E0; margin-bottom: 16px;
      .ponto-preenchido {
        width: 7px; height: 7px; border-radius: 50%; background: #7B1FA2; margin-left: 2px;
      }
    }

    .aba-observacoes {
      display: flex; flex-direction: column; gap: 12px;
      .campo-observacoes { width: 100%; }
      textarea { resize: vertical; }
    }
    .info-observacoes {
      display: flex; align-items: flex-start; gap: 8px;
      background: #F3E5F5; border: 1px solid #CE93D8; border-radius: 8px; padding: 12px;
      mat-icon { color: #6A1B9A; font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
      span { font-size: 12px; color: #4A148C; line-height: 1.4; }
    }

    /* Botão de aba — usado tanto pelas abas principais quanto pelas do tipo MISTO */
    .aba-btn {
      display: flex; align-items: center; gap: 6px;
      background: none; border: none; cursor: pointer;
      padding: 10px 16px; font-size: 13px; font-weight: 600; color: #5C6370;
      border-bottom: 2px solid transparent;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &.active { color: #7B1FA2; border-bottom-color: #7B1FA2; }
      &:hover { color: #7B1FA2; }
    }

    .abas-misto {
      grid-column: 1/-1;
      .abas-header {
        display: flex; gap: 8px; border-bottom: 1px solid #E0E0E0; margin-bottom: 12px;
      }
    }

    .erro-box {
      display: flex; align-items: center; gap: 8px;
      background: #FFEBEE; border: 1px solid #FFCDD2; border-radius: 8px;
      padding: 12px; margin-top: 16px;
      mat-icon { color: #C62828; flex-shrink: 0; }
      span { font-size: 13px; color: #B71C1C; }
    }

    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }

    ::ng-deep .mat-mdc-form-field-hint-wrapper { color: #EF6C00 !important; font-weight: 600; }

    .info-distancia {
      display: flex; align-items: center; gap: 8px;
      background: #E8F5E9; border: 1px solid #A5D6A7; border-radius: 8px; padding: 10px 12px;
      mat-icon { color: #2E7D32; font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
      span { font-size: 12px; color: #1B5E20; line-height: 1.4; }
      strong { font-weight: 700; }
    }

    .info-antecedencia {
      display: flex; align-items: center; gap: 8px;
      background: #FFF3E0; border: 1px solid #FFB74D; border-radius: 8px; padding: 12px;
      mat-icon { color: #EF6C00; font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
      span { font-size: 12px; color: #E65100; line-height: 1.4; font-weight: 600; }
    }
  
    @media (max-width: 480px) {
      .page { padding: 0; }
      .form-card { padding: 16px; }
      .form-grid { grid-template-columns: 1fr !important; }
      .aba-btn { padding: 8px 10px; font-size: 12px; }
      .form-actions { flex-direction: column; }
      .form-actions button { width: 100%; }
    }
  `]})
export class NovaSolicitacaoComponent {
  salvando = signal(false);
  erro = signal<string | null>(null);
  aba = signal<'dados' | 'observacoes'>('dados');
  abaMisto = signal<'passageiros' | 'carga'>('passageiros');

  form = {
    origem: '',
    destino: '',
    tipoUso: 'CARGA' as TipoUso,
    qtdPassageiros: null as number | null,
    kgCarga: null as number | null,
    dataViagem: null as Date | null,
    observacoes: ''
  };

  // --- Autocomplete de endereços (Nominatim) + estimativa de KM (OSRM) ---
  // A solicitação não armazena KM; aqui a distância é só uma prévia informativa.
  sugestoesOrigem = signal<EnderecoSugestao[]>([]);
  sugestoesDestino = signal<EnderecoSugestao[]>([]);
  kmEstimada = signal<number | null>(null);
  etaEstimado = signal<number | null>(null);
  calculandoKm = signal(false);
  private origemSelecionada: EnderecoSugestao | null = null;
  private destinoSelecionada: EnderecoSugestao | null = null;
  private origemInput$ = new Subject<string>();
  private destinoInput$ = new Subject<string>();

  onOrigemInput(valor: string): void {
    this.origemSelecionada = null;
    this.kmEstimada.set(null);
    this.etaEstimado.set(null);
    this.origemInput$.next(valor ?? '');
  }

  onDestinoInput(valor: string): void {
    this.destinoSelecionada = null;
    this.kmEstimada.set(null);
    this.etaEstimado.set(null);
    this.destinoInput$.next(valor ?? '');
  }

  onOrigemSelecionada(e: MatAutocompleteSelectedEvent): void {
    const desc = e.option.value as string;
    this.origemSelecionada = this.sugestoesOrigem().find(s => s.descricao === desc) ?? null;
    this.estimarDistancia();
  }

  onDestinoSelecionada(e: MatAutocompleteSelectedEvent): void {
    const desc = e.option.value as string;
    this.destinoSelecionada = this.sugestoesDestino().find(s => s.descricao === desc) ?? null;
    this.estimarDistancia();
  }

  private estimarDistancia(): void {
    if (!this.origemSelecionada || !this.destinoSelecionada) return;
    this.calculandoKm.set(true);
    this.geo.calcularRota(this.origemSelecionada, this.destinoSelecionada).subscribe({
      next: r => {
        this.kmEstimada.set(r.kmEsperada);
        this.etaEstimado.set(r.etaMinutos);
        this.calculandoKm.set(false);
      },
      error: () => this.calculandoKm.set(false)
    });
  }

  /** Data mínima = hoje + 3 dias (retorna Date para uso com MatDatepicker). */
  dataMinima = computed(() => {
    return new Date(Date.now() + 3 * 86400000);
  });

  /** Filtra datas do calendário: só permite datas >= hoje + 3 dias. */
  filtrarDatasPassadas = (d: Date | null): boolean => {
    if (!d) return false;
    const minima = this.dataMinima();
    // Normaliza ambas as datas para meia-noite e compara.
    const dataZero = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const minimaZero = new Date(minima.getFullYear(), minima.getMonth(), minima.getDate()).getTime();
    return dataZero >= minimaZero;
  };

  constructor(
    private svc: SolicitacaoService,
    private geo: GeoService,
    private router: Router,
    private snack: MatSnackBar
  ) {
    // Busca com debounce (política do Nominatim ~1 req/s), a partir de 3 caracteres.
    this.origemInput$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(q => q.trim().length < 3 ? of([] as EnderecoSugestao[])
        : this.geo.buscarEnderecos(q).pipe(catchError(() => of([] as EnderecoSugestao[]))))
    ).subscribe(lista => this.sugestoesOrigem.set(lista));

    this.destinoInput$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(q => q.trim().length < 3 ? of([] as EnderecoSugestao[])
        : this.geo.buscarEnderecos(q).pipe(catchError(() => of([] as EnderecoSugestao[]))))
    ).subscribe(lista => this.sugestoesDestino.set(lista));
  }

  voltar(): void {
    this.router.navigate(['/solicitante/solicitacoes']);
  }

  /** Formata um Date para yyyy-MM-dd (formato esperado pelo backend). */
  private formatarData(d: Date): string {
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  /** Mostra o erro e volta para a aba de dados, onde estão os campos obrigatórios. */
  private falhar(mensagem: string): void {
    this.erro.set(mensagem);
    this.aba.set('dados');
  }

  enviar(): void {
    this.erro.set(null);

    if (!this.form.origem || !this.form.destino) {
      this.falhar('Origem e destino são obrigatórios.');
      return;
    }
    if (!this.form.dataViagem) {
      this.falhar('Informe a data da viagem.');
      return;
    }
    const dataViagemStr = this.formatarData(this.form.dataViagem);
    if (!this.validarAntecedencia(dataViagemStr)) {
      this.falhar('Solicitação deve ter antecedência mínima de 3 dias, em caso de imediações, por favor, contate o setor de transporte.');
      return;
    }
    if (this.form.tipoUso === 'CARGA' && (!this.form.kgCarga || this.form.kgCarga <= 0)) {
      this.falhar('Para tipo CARGA, informe o peso em kg.');
      return;
    }
    if (this.form.tipoUso === 'PASSAGEIRO' && (!this.form.qtdPassageiros || this.form.qtdPassageiros <= 0)) {
      this.falhar('Para tipo PASSAGEIRO, informe a quantidade de passageiros.');
      return;
    }
    if (this.form.tipoUso === 'MISTO') {
      if (!this.form.qtdPassageiros || this.form.qtdPassageiros <= 0) {
        this.falhar('Para tipo MISTO, informe a quantidade de passageiros (aba Passageiros).');
        return;
      }
      if (!this.form.kgCarga || this.form.kgCarga <= 0) {
        this.falhar('Para tipo MISTO, informe o peso da carga (aba Carga).');
        return;
      }
    }

    const body: SolicitacaoViagemRequest = {
      descricaoOrigem: this.form.origem,
      descricaoDestino: this.form.destino,
      tipoUso: this.form.tipoUso,
      qtdPassageiros: this.form.tipoUso === 'CARGA' ? null : this.form.qtdPassageiros,
      kgCarga: this.form.tipoUso === 'PASSAGEIRO' ? null : this.form.kgCarga,
      dataViagem: dataViagemStr,
      observacoes: this.form.observacoes.trim() || undefined
    };

    this.salvando.set(true);
    this.svc.criar(body).subscribe({
      next: () => {
        this.salvando.set(false);
        this.snack.open('A equipe de transporte avaliará sua solicitação.', '', { duration: 5000 });
        this.router.navigate(['/solicitante/solicitacoes']);
      },
      error: (e) => {
        this.salvando.set(false);
        this.erro.set(e?.error?.mensagem ?? 'Erro ao enviar solicitação. Tente novamente.');
      }
    });
  }

  private validarAntecedencia(dataViagem: string): boolean {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const data = new Date(dataViagem + 'T00:00:00');
    const diffMs = data.getTime() - hoje.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDias >= 3;
  }
}
