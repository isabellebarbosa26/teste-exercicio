import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'solicitacoes',
        loadComponent: () => import('./solicitacoes/solicitacoes.component').then(m => m.SolicitacoesComponent)
      },
      {
        path: 'chat',
        loadComponent: () => import('./chat/chat.component').then(m => m.ChatComponent)
      },
      {
        path: 'veiculos',
        loadComponent: () => import('./veiculos/veiculos.component').then(m => m.VeiculosComponent)
      },
      {
        path: 'tarefas',
        loadComponent: () => import('./tarefas/tarefas.component').then(m => m.TarefasComponent)
      },
      {
        path: 'motoristas',
        loadComponent: () => import('./motoristas/motoristas.component').then(m => m.MotoristasComponent)
      },
      {
        path: 'manutencoes',
        loadComponent: () => import('./manutencoes/manutencoes.component').then(m => m.ManutencoesComponent)
      },
     {
        path: 'ocorrencias',
        loadComponent: () => import('./ocorrencias/ocorrencias.component').then(m => m.OcorrenciasComponent)
      },
      {
        path: 'documentos',
        loadComponent: () => import('./documentos/documentos.component').then(m => m.DocumentosComponent)
      },
      {
        path: 'auditoria',
        loadComponent: () => import('./auditoria/auditoria.component').then(m => m.AuditoriaComponent)
      }
    ]
  }
];
