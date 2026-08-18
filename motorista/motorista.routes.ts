import { Routes } from '@angular/router';
import { MotoristaLayoutComponent } from './layout/motorista-layout.component';

export const motoristaRoutes: Routes = [
  {
    path: '',
    component: MotoristaLayoutComponent,
    children: [
      { path: '', redirectTo: 'tarefas', pathMatch: 'full' },
      {
        path: 'tarefas',
        loadComponent: () =>
          import('./tarefas_motorista/tarefas-motorista.component').then(m => m.MinhasTarefasComponent)
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('./chat_motorista/chat-motorista.component').then(m => m.ChatMotoristaComponent)
      },
      {
        path: 'ocorrencias',
        loadComponent: () =>
          import('./ocorrencias_motorista/ocorrencias-motorista.component').then(m => m.OcorrenciasMotoristaComponent)
      }
    ]
  }
];