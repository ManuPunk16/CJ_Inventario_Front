import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth.guard';
import { DetallesInventarioComponent } from './components/detalles-inventario/detalles-inventario.component';

export const routes: Routes = [
  {
    path: 'inventario',
    loadComponent: () => import('./components/inventario/inventario.component').then(c => c.InventarioComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'inventario/detalles/:id',
    component: DetallesInventarioComponent,
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: 'inventario',
    pathMatch: 'full'
  }
];
