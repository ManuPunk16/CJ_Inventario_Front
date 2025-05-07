import { Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener } from '@angular/core';
import { RouterOutlet, Router, RouterLink } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { CommonModule } from '@angular/common';
import { InactivityService } from './core/services/inactivity.service';
import { User } from './core/models/auth.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    RouterLink
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('profileDropdown') profileDropdown?: ElementRef;
  @ViewChild('profileButton') profileButton?: ElementRef;

  isMobileMenuOpen = false;
  isProfileDropdownOpen = false;
  currentUser: User | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private inactivityService: InactivityService
  ) {}

  ngOnInit(): void {
    // Verificar autenticación usando el nuevo método
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    }

    // Iniciar el servicio de inactividad
    this.inactivityService.startWatching();
    
    // Suscribirse al usuario actual usando el nuevo observable
    this.authService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  ngOnDestroy(): void {
    this.inactivityService.stopWatching();
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isLoggedIn(): boolean {
    // Usar el nuevo método de verificación de autenticación
    return this.authService.isLoggedIn();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Verificar si el clic fue fuera del menú dropdown y del botón
    if (this.isProfileDropdownOpen) {
      const targetElement = event.target as HTMLElement;

      // Verificar si el clic fue dentro del menú o del botón
      const clickedInside =
        this.profileDropdown?.nativeElement.contains(targetElement) ||
        this.profileButton?.nativeElement.contains(targetElement);

      if (!clickedInside) {
        this.isProfileDropdownOpen = false;
      }
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  toggleProfileDropdown(): void {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  logout(): void {
    // El método logout ahora maneja internamente la redirección
    this.authService.logout();
    this.isProfileDropdownOpen = false;
  }

  // Función auxiliar para mostrar el nombre de usuario
  getUserName(): string {
    return this.currentUser?.username || 'Usuario';
  }

  // Verificar si el usuario tiene un rol específico
  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }
}
