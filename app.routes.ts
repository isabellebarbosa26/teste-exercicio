import { Routes } from '@angular/router';
import { authGuard, primeiroAcessoGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },

    // LOGIN UNIFICADO — uma única tela, redireciona por role
    {
        path: 'login',
        loadComponent: () =>
            import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    },

    // Motorista define a própria senha no primeiro acesso
    // (MOVEdo para features/auth/motorista-primeiro-acesso/ — a pasta motorista-login/ foi reMOVEda)
    {
        path: 'motorista/primeiro-acesso',
        loadComponent: () =>
            import('./features/auth/motorista-primeiro-acesso/motorista-primeiro-acesso.component')
                .then((m) => m.MotoristaPrimeiroAcessoComponent),
        canActivate: [authGuard(['MOTORISTA'])],
    },

    // Dashboard do superusuário (godmin)
    {
        path: 'home',
        loadComponent: () =>
            import('./features/home/super-admin-home.component').then((m) => m.SuperAdminHomeComponent),
        canActivate: [authGuard(['SUPER_ADMIN'])],
    },

    {
        path: 'usuarios',
        loadComponent: () =>
            import('./features/admin/usuarios/usuarios.component').then((m) => m.UsuariosComponent),
        canActivate: [authGuard(['SUPER_ADMIN'])],
    },
    // Área do ADM
    {
        path: 'admin',
        loadChildren: () =>
            import('./features/admin/admin.routes').then((m) => m.adminRoutes),
        canActivate: [authGuard(['ADMIN', 'SUPER_ADMIN'])],
    },
    // Área dos Motoristas
    {
        path: 'motorista',
        loadChildren: () =>
            import('./features/motorista/motorista.routes').then((m) => m.motoristaRoutes),
        canActivate: [authGuard(['MOTORISTA', 'SUPER_ADMIN']), primeiroAcessoGuard()],
    },
    // Área dos Solicitantes — SUPER_ADMIN também pode entrar (para teste)
    {
        path: 'solicitante',
        loadChildren: () =>
            import('./features/solicitante/solicitante.routes').then((m) => m.solicitanteRoutes),
        canActivate: [authGuard(['SOLICITANTE', 'SUPER_ADMIN'])],
    },

    { path: '**', redirectTo: 'login' },
];
