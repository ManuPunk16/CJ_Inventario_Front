import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LoginRequest } from '../../core/models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnDestroy {
  usuario: LoginRequest = {
    username: '',
    password: ''
  };

  errorMessage: string = '';
  isLoading: boolean = false;
  hidePassword: boolean = true;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  login(): void {
    if (!this.usuario.username || !this.usuario.password) {
      this.errorMessage = 'Por favor, complete todos los campos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.usuario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.router.navigate(['/inventario']);
          } else {
            this.errorMessage = 'Error en la respuesta del servidor';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al iniciar sesión:', error);
          this.errorMessage = error.error?.message || 'Error al iniciar sesión. Por favor, inténtelo de nuevo.';
          this.isLoading = false;
        }
      });
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
}
