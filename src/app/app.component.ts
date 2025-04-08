import { Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener } from '@angular/core';
import { RouterOutlet, Router, RouterLink } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { CommonModule } from '@angular/common';
import { InactivityService } from './core/services/inactivity.service';

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

  constructor(
    private authService: AuthService,
    private router: Router,
    private inactivityService: InactivityService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
    this.inactivityService.startWatching();
  }

  ngOnDestroy(): void {
    this.inactivityService.stopWatching();
  }

  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
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
    this.authService.logout();
    this.isProfileDropdownOpen = false;
    this.router.navigate(['/login']);
  }
}
