import { Routes } from '@angular/router';
import { SolicitanteLayoutComponent } from './layout/solicitante-layout.component';

export const solicitanteRoutes: Routes = [
  {
    path: '',
    component: SolicitanteLayoutComponent,
    children: [
      { path: '', redirectTo: 'solicitacoes', pathMatch: 'full' },
      {
        path: 'solicitacoes',
        loadComponent: () =>
          import('./minhas-solicitacoes/minhas-solicitacoes.component').then(m => m.MinhasSolicitacoesComponent)
      },
      {
        path: 'nova',
        loadComponent: () =>
          import('./nova-solicitacao/nova-solicitacao.component').then(m => m.NovaSolicitacaoComponent)
      }
    ]
  }
];
