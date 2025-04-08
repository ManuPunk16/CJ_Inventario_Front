import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Location } from '@angular/common';
import { RegisterRequest, User, UserRole } from '../../core/models/auth.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {
  usuario: RegisterRequest = {
    username: '',
    password: '',
    role: undefined as UserRole | undefined
  };

  isLoading = false;
  errorMessage = '';
  hidePassword = true;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit() {
    // Verificar si el usuario actual es administrador
    this.authService.getCurrentUser()
      .pipe(
        takeUntil(this.destroy$),
        filter((user): user is User => user !== null) // Type guard para asegurar que user no es null
      )
      .subscribe({
        next: (user) => {
          if (user.role && user.role !== 'admin') {
            this.router.navigate(['/']);
          }
        },
        error: () => {
          this.router.navigate(['/']);
        }
      });
  }

  register(): void {
    if (!this.usuario.username || !this.usuario.password || !this.usuario.role) {
      this.errorMessage = 'Por favor, complete todos los campos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register(this.usuario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.status === 'success') {
            // Mostrar mensaje de éxito y redirigir
            // Puedes usar un servicio de notificaciones aquí
            this.router.navigate(['/users']);
          } else {
            this.errorMessage = 'Error al crear el usuario';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al crear usuario:', error);
          this.errorMessage = error.error?.message || 'Error al crear el usuario. Por favor, inténtelo de nuevo.';
          this.isLoading = false;
        }
      });
  }

  goBack(): void {
    this.location.back();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
