import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { DetallesInventarioComponent } from './components/detalles-inventario/detalles-inventario.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(c => c.RegisterComponent),
    canActivate: [AuthGuard],
    data: { role: 'admin' }
  },
  {
    path: 'inventario',
    loadComponent: () => import('./components/inventario/inventario.component').then(c => c.InventarioComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'inventario/detalles/:id',
    component: DetallesInventarioComponent,
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: 'inventario',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'inventario'
  }
];
