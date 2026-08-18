import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription, interval, switchMap } from 'rxjs';
import { ChatService } from '../../../core/services/chat.service';
import { ConversaChat, MensagemChat } from '../../../core/models/chat.model';

const INTERVALO_POLLING = 5000;

@Component({
  selector: 'app-chat-motorista',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule,
            MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="page">
      @if (!conversaAtiva()) {
        <h2 class="page-title">Chat com o Transporte</h2>

        @if (carregando()) {
          <div class="loading"><mat-spinner diameter="36"/></div>
        } @else {
          @for (c of conversas(); track c.tarefaId) {
            <button type="button" class="conversa-card" [ngClass]="c.statusTarefa" (click)="abrir(c)">
              <div class="card-top">
                <span class="status-chip" [ngClass]="c.statusTarefa">{{ statusLabel(c.statusTarefa) }}</span>
                @if (c.naoLidas > 0) { <span class="badge">{{ c.naoLidas }}</span> }
              </div>
              <div class="rota">{{ c.descricaoOrigem }} → {{ c.descricaoDestino }}</div>
              <div class="previa">
                @if (c.ultimaMensagem) {
                  {{ c.ultimoRemetente === 'MOTORISTA' ? 'Você: ' : '' }}{{ c.ultimaMensagem }}
                } @else {
                  Nenhuma mensagem ainda — toque para falar com o setor de transporte
                }
              </div>
            </button>
          } @empty {
            <div class="empty-state">
              <mat-icon>forum</mat-icon>
              <p>Você não tem viagens ativas para conversar</p>
            </div>
          }
        }
      } @else {
        <div class="thread">
          <header class="thread-header">
            <button mat-icon-button (click)="voltar()" aria-label="Voltar"><mat-icon>arrow_back</mat-icon></button>
            <div class="thread-titulo">
              <strong>Setor de Transporte</strong>
              <span>{{ conversaAtiva()!.descricaoOrigem }} → {{ conversaAtiva()!.descricaoDestino }}</span>
            </div>
          </header>

          <div class="mensagens" #painelMensagens>
            @if (carregandoMensagens()) {
              <div class="loading"><mat-spinner diameter="32"/></div>
            } @else {
              @for (m of mensagens(); track m.id) {
                <div class="bolha-wrap" [class.propria]="m.remetenteTipo === 'MOTORISTA'">
                  <div class="bolha">
                    <span class="remetente">{{ m.remetenteNome }}</span>
                    <p>{{ m.conteudo }}</p>
                    <span class="hora">{{ m.createdAt | date:'dd/MM HH:mm' }}</span>
                  </div>
                </div>
              } @empty {
                <div class="sem-mensagens">
                  <mat-icon>waving_hand</mat-icon>
                  <p>Nenhuma mensagem ainda. Escreva abaixo para falar com o setor de transporte.</p>
                </div>
              }
            }
          </div>

          <footer class="composer">
            <textarea rows="1" placeholder="Escreva uma mensagem..."
                      [(ngModel)]="rascunho" [disabled]="enviando()"></textarea>
            <button mat-mini-fab color="primary" class="btn-enviar"
                    (click)="enviar()" [disabled]="!rascunho.trim() || enviando()">
              <mat-icon>send</mat-icon>
            </button>
          </footer>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 600px; margin: 0 auto; }
    .page-title { font-size: 20px; font-weight: 700; margin-bottom: 16px; color: #1A1A2E; }
    .loading { display: grid; place-items: center; height: 160px; }

    /* LISTA DE CONVERSAS */
    .conversa-card {
      width: 100%; text-align: left; cursor: pointer;
      background: white; border: none; border-radius: 12px; padding: 14px; margin-bottom: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,.06); border-left: 4px solid #78909C;
      &.EM_ANDAMENTO { border-left-color: #1565C0; }
      &.AGENDADA     { border-left-color: #7B1FA2; }
      &.CONCLUIDA    { border-left-color: #2E7D32; opacity: 0.85; }
    }
    .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .status-chip {
      font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; text-transform: uppercase;
      &.AGENDADA     { background: #E1BEE7; color: #4A148C; }
      &.EM_ANDAMENTO { background: #BBDEFB; color: #0D47A1; }
      &.CONCLUIDA    { background: #C8E6C9; color: #1B5E20; }
    }
    .badge { background: #C62828; color: #fff; font-size: 11px; font-weight: 700;
             min-width: 20px; height: 20px; padding: 0 6px; border-radius: 10px; display: grid; place-items: center; }
    .rota   { font-size: 14px; font-weight: 600; color: #1A1A2E; margin-bottom: 4px; }
    .previa { font-size: 12px; color: #5C6370; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* THREAD */
    .thread { display: flex; flex-direction: column; height: calc(100vh - 160px); min-height: 360px;
              background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
    .thread-header { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid #E0E0E0;
      .thread-titulo { display: flex; flex-direction: column; min-width: 0;
        strong { font-size: 14px; color: #1A1A2E; }
        span { font-size: 11px; color: #5C6370; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } }
    }
    .mensagens { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 8px; background: #f5f7fb; }
    .bolha-wrap { display: flex; &.propria { justify-content: flex-end; } }
    .bolha {
      max-width: 80%; padding: 8px 12px; border-radius: 12px;
      background: white; border: 1px solid #E0E0E0; display: flex; flex-direction: column; gap: 2px;
      .remetente { font-size: 10px; font-weight: 700; color: #5C6370; text-transform: uppercase; }
      p { font-size: 13px; color: #2C3E50; line-height: 1.45; margin: 0; white-space: pre-wrap; word-break: break-word; }
      .hora { font-size: 10px; color: #9E9E9E; align-self: flex-end; }
    }
    .propria .bolha {
      background: #1b305a; border-color: #1b305a;
      .remetente { color: rgba(255,255,255,.7); }
      p { color: #fff; }
      .hora { color: rgba(255,255,255,.65); }
    }
    .sem-mensagens { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 8px; color: #9E9E9E; text-align: center; padding: 20px;
      mat-icon { font-size: 40px; width: 40px; height: 40px; } }

    .composer { display: flex; align-items: flex-end; gap: 8px; padding: 10px 12px; border-top: 1px solid #E0E0E0;
      textarea { flex: 1; resize: none; max-height: 100px; font-family: inherit; font-size: 14px;
                 padding: 10px 12px; border-radius: 20px; border: 1px solid #E0E0E0; color: #2C3E50;
                 &:focus { outline: none; border-color: #1b305a; } }
      .btn-enviar { background-color: #1b305a !important; flex-shrink: 0;
                    mat-icon { color: #fff; } }
    }

    .empty-state { text-align: center; padding: 48px 24px; color: #9E9E9E;
      mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 12px; } }
  `]})
export class ChatMotoristaComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('painelMensagens') painelMensagens?: ElementRef<HTMLDivElement>;

  carregando          = signal(true);
  carregandoMensagens = signal(false);
  enviando            = signal(false);

  conversas     = signal<ConversaChat[]>([]);
  conversaAtiva = signal<ConversaChat | null>(null);
  mensagens     = signal<MensagemChat[]>([]);

  rascunho = '';

  private rolarParaFim = false;
  private polling?: Subscription;

  constructor(private svc: ChatService, private snack: MatSnackBar) {}

  ngOnInit(): void {
    this.carregarConversas(true);
    this.polling = interval(INTERVALO_POLLING)
      .pipe(switchMap(() => this.svc.listarMinhasConversas()))
      .subscribe({
        next: lista => {
          this.conversas.set(lista);
          const ativa = this.conversaAtiva();
          if (ativa) {
            const atualizada = lista.find(c => c.tarefaId === ativa.tarefaId);
            if (atualizada) this.conversaAtiva.set(atualizada);
            this.recarregarMensagens(ativa.tarefaId);
          }
        },
        error: () => {}
      });
  }

  ngOnDestroy(): void { this.polling?.unsubscribe(); }

  ngAfterViewChecked(): void {
    if (this.rolarParaFim && this.painelMensagens) {
      const el = this.painelMensagens.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.rolarParaFim = false;
    }
  }

  private carregarConversas(primeiraCarga = false): void {
    if (primeiraCarga) this.carregando.set(true);
    this.svc.listarMinhasConversas().subscribe({
      next: lista => { this.conversas.set(lista); this.carregando.set(false); },
      error: () => { this.conversas.set([]); this.carregando.set(false); }
    });
  }

  abrir(c: ConversaChat): void {
    this.conversaAtiva.set(c);
    this.mensagens.set([]);
    this.carregandoMensagens.set(true);
    this.svc.listarMensagens(c.tarefaId).subscribe({
      next: lista => {
        this.mensagens.set(lista);
        this.carregandoMensagens.set(false);
        this.rolarParaFim = true;
        this.zerarNaoLidas(c.tarefaId);
      },
      error: () => {
        this.carregandoMensagens.set(false);
        this.snack.open('Não foi possível carregar a conversa.', '', { duration: 4000 });
      }
    });
  }

  voltar(): void {
    this.conversaAtiva.set(null);
    this.mensagens.set([]);
    this.carregarConversas();
  }

  /** Recarrega em silêncio; só mexe na tela se chegou mensagem nova. */
  private recarregarMensagens(tarefaId: number): void {
    this.svc.listarMensagens(tarefaId).subscribe({
      next: lista => {
        if (this.conversaAtiva()?.tarefaId !== tarefaId) return;
        const atuais = this.mensagens();
        const mudou = lista.length !== atuais.length ||
                      lista[lista.length - 1]?.id !== atuais[atuais.length - 1]?.id;
        if (!mudou) return;
        this.mensagens.set(lista);
        this.rolarParaFim = true;
        this.zerarNaoLidas(tarefaId);
      },
      error: () => {}
    });
  }

  private zerarNaoLidas(tarefaId: number): void {
    this.conversas.update(lista => lista.map(c => c.tarefaId === tarefaId ? { ...c, naoLidas: 0 } : c));
  }

  enviar(): void {
    const ativa = this.conversaAtiva();
    const texto = this.rascunho.trim();
    if (!ativa || !texto || this.enviando()) return;

    this.enviando.set(true);
    this.svc.enviar(ativa.tarefaId, texto).subscribe({
      next: msg => {
        this.mensagens.update(lista => [...lista, msg]);
        this.rascunho = '';
        this.enviando.set(false);
        this.rolarParaFim = true;
      },
      error: (e) => {
        this.enviando.set(false);
        this.snack.open(e?.error?.mensagem ?? 'Erro ao enviar a mensagem.', '', { duration: 4000 });
      }
    });
  }

  statusLabel(s: string): string {
    return { AGENDADA: 'Agendada', EM_ANDAMENTO: 'Em andamento', CONCLUIDA: 'Concluída' }[s] ?? s;
  }
}
