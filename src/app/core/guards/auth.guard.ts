import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Verificar si el usuario está autenticado
    if (!this.authService.isLoggedIn()) {
      // Redirigir al login si no está autenticado
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Verificar si tiene el rol requerido
    const requiredRole = route.data['role'] as string;
    if (requiredRole && !this.authService.hasRole(requiredRole)) {
      // Redirigir a la página principal si no tiene el rol requerido
      this.router.navigate(['/']);
      return false;
    }

    return true;
  }
}