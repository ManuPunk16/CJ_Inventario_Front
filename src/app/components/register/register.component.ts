import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Location } from '@angular/common';
import { RegisterRequest, UserRole } from '../../core/models/auth.model';

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
    // Verificar si el usuario tiene permisos de administrador
    if (!this.authService.hasRole('admin')) {
      this.router.navigate(['/']);
    }
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
            this.router.navigate(['/admin/users'], { 
              queryParams: { created: true } 
            });
          } else {
            this.errorMessage = 'Error en la respuesta del servidor';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al registrar usuario:', error);
          this.errorMessage = error.error?.message || 'Error al registrar usuario. Por favor, inténtelo de nuevo.';
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
